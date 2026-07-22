// modules/missoes/missoes.js
import { BaseModule } from '../../core/module.js';
import appState from '../../assets/js/app.js';
import { generateId, escapeHtml } from '../../core/utils/utils.js';

class MissoesModule extends BaseModule {
    constructor() {
        super('missoes');
        this._sortField = 'titulo';
        this._sortOrder = 'asc';
        this._onDocumentClick = (e) => {
            const btn = e.target.closest('.favorite-btn');
            if (btn) {
                this.toggleFavorite('quests', btn.dataset.id);
                this.renderList();
            }
        };
    }

    init() {
        this.destroy();
        super.init();

        const role = appState.getRole();
        const formPanel = document.getElementById('questFormPanel');

        if (role === 'master') {
            formPanel.style.display = 'block';
            document.getElementById('btnAddQuest').addEventListener('click', this.addQuest);
        } else {
            formPanel.style.display = 'none';
        }

        // Barra de pesquisa (⭐ 9)
        const searchInput = document.getElementById('pesquisaMissoes');
        if (searchInput) {
            searchInput.addEventListener('input', this.renderList.bind(this));
        }

        // Ordenação (⭐ 10)
        document.querySelectorAll('[data-sort]').forEach(btn => {
            btn.addEventListener('click', () => {
                const field = btn.dataset.sort;
                if (this._sortField === field) {
                    this._sortOrder = this._sortOrder === 'asc' ? 'desc' : 'asc';
                } else {
                    this._sortField = field;
                    this._sortOrder = 'asc';
                }
                this.renderList();
            });
        });

        // Favoritos (⭐ 4)
        document.addEventListener('click', this._onDocumentClick);

        window._toggleQuest = this.toggleQuest.bind(this);
        window._removeQuest = this.removeQuest.bind(this);
        window._duplicateQuest = this.duplicateQuest.bind(this);

        this.renderList();
        this.on('quests', this.renderList.bind(this));
        this.on('favorites', this.renderList.bind(this));
    }

    renderList = () => {
        let quests = appState.get('quests') || [];
        const role = appState.getRole();

        // Pesquisa (⭐ 9)
        const searchInput = document.getElementById('pesquisaMissoes');
        const termo = searchInput?.value?.toLowerCase() || '';

        if (termo) {
            quests = quests.filter(q => 
                q.titulo.toLowerCase().includes(termo) ||
                q.desc.toLowerCase().includes(termo)
            );
        }

        // Filtro de status
        const statusFilter = document.getElementById('filtroStatusMissao')?.value || '';
        if (statusFilter) {
            quests = quests.filter(q => q.status === statusFilter);
        }

        // Ordenação (⭐ 10)
        quests = this.sortItems(quests, this._sortField, this._sortOrder);

        if (role === 'player') {
            quests = quests.filter(q => q.visivelJogadores);
        }

        const container = document.getElementById('questList');
        if (!quests.length) {
            container.innerHTML = '<div class="empty-state">Nenhuma missão disponível.</div>';
            return;
        }

        const favorites = this.getFavorites('quests');

        container.innerHTML = quests.map(q => {
            const isFav = favorites.includes(q.id);
            const tg = q.status === 'Concluída' ? 'green' : q.status === 'Falha' ? 'red' : '';
            const controls = role === 'master' ? `
                <button class="btn btn-sm favorite-btn ${isFav ? 'active' : ''}" data-id="${q.id}" title="Favorito">⭐</button>
                <button class="btn btn-sm" onclick="_toggleQuest('${q.id}')">🔄</button>
                <button class="btn btn-sm" onclick="_duplicateQuest('${q.id}')">📋</button>
                <button class="btn btn-red btn-sm" onclick="_removeQuest('${q.id}')">🗑️</button>
            ` : '';

            return `<div class="card-item">
                <div class="card-info">
                    <div class="card-name">
                        <span class="editable" data-id="${q.id}" data-field="titulo" contenteditable="${role === 'master' ? 'true' : 'false'}">${escapeHtml(q.titulo)}</span>
                        <span class="tag ${tg}">${q.status}</span>
                    </div>
                    <div style="font-size:0.8rem;">${escapeHtml(q.desc).substring(0, 80)}</div>
                    <div style="font-size:0.75rem;">💰 ${escapeHtml(q.recompensa)}</div>
                </div>
                <div class="card-actions">${controls}</div>
            </div>`;
        }).join('');
    };

    addQuest = () => {
        const titulo = document.getElementById('qTitulo').value.trim();
        if (!titulo) return window.showToast?.('⚠️ Título obrigatório');
        const quests = appState.get('quests') || [];
        quests.push({
            id: generateId(),
            titulo,
            desc: document.getElementById('qDesc').value,
            recompensa: document.getElementById('qRecompensa').value,
            status: document.getElementById('qStatus').value,
            visivelJogadores: document.getElementById('qVisivel').checked
        });
        appState.set('quests', quests);
        appState.logAction(`🏴 Missão "${titulo}" criada.`);
        appState.enviarNotificacao(`🏴 Mestre criou a missão "${titulo}".`);
        appState._playSound('quest');
        ['qTitulo', 'qDesc', 'qRecompensa'].forEach(id => document.getElementById(id).value = '');
        window.showToast?.('🏴 Missão adicionada!');
        this.renderList();
    };

    toggleQuest(id) {
        if (appState.getRole() !== 'master') return;
        const quests = appState.get('quests').map(q => {
            if (q.id === id) {
                const ord = ['Ativa', 'Concluída', 'Falha'];
                q.status = ord[(ord.indexOf(q.status) + 1) % 3];
            }
            return q;
        });
        appState.set('quests', quests);
        const quest = quests.find(q => q.id === id);
        if (quest) {
            appState.logAction(`🏴 Missão "${quest.titulo}" alterada para "${quest.status}".`);
            appState.enviarNotificacao(`🏴 Missão "${quest.titulo}" está "${quest.status}".`);
            appState._playSound('quest');
        }
        this.renderList();
    }

    removeQuest(id) {
        if (appState.getRole() !== 'master') return;
        const quest = appState.get('quests').find(q => q.id === id);
        if (!quest) return;
        confirmAction(`🗑️ Remover a missão "${quest.titulo}"?`, () => {
            const quests = appState.get('quests').filter(q => q.id !== id);
            appState.set('quests', quests);
            appState.logAction(`🏴 Missão "${quest.titulo}" removida.`);
            appState.enviarNotificacao(`🏴 Missão "${quest.titulo}" foi removida.`);
            this.renderList();
        });
    }

    duplicateQuest(id) {
        if (appState.getRole() !== 'master') return;
        const quest = appState.get('quests').find(q => q.id === id);
        if (!quest) return;
        this.duplicateItem('quests', quest, ' (Cópia)');
        this.renderList();
    }

    destroy() {
        super.destroy();
        document.removeEventListener('click', this._onDocumentClick);
        document.getElementById('btnAddQuest')?.removeEventListener('click', this.addQuest);
    }
}

const missoes = new MissoesModule();
export function init() { missoes.init(); }
export function destroy() { missoes.destroy(); }
