// modules/npc/npc.js
import { BaseModule } from '../../core/module.js';
import appState from '../../assets/js/app.js';
import { generateId, escapeHtml } from '../../core/utils/utils.js';

class NpcModule extends BaseModule {
    constructor() {
        super('npc');
        this._sortField = 'nome';
        this._sortOrder = 'asc';
        this._onDocumentClick = (e) => {
            const btn = e.target.closest('.favorite-btn');
            if (btn) {
                this.toggleFavorite('npcs', btn.dataset.id);
                this.renderList();
            }
        };
    }

    init() {
        this.destroy();
        super.init();

        const role = appState.getRole();

        // Barra de pesquisa (⭐ 9)
        const searchInput = document.getElementById('pesquisaNPCs');
        if (searchInput) {
            searchInput.addEventListener('input', this.renderList.bind(this));
        }

        // Ordenação (⭐ 10)
        document.querySelectorAll('[data-sort-npc]').forEach(btn => {
            btn.addEventListener('click', () => {
                const field = btn.dataset.sortNpc;
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

        if (role === 'master') {
            document.getElementById('btnAddNPC').addEventListener('click', this.addNPC);
            document.getElementById('npcNome').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.addNPC();
            });
        }

        window._removeNPC = this.removeNPC.bind(this);
        window._duplicateNPC = this.duplicateNPC.bind(this);

        this.renderList();
        this.on('npcs', this.renderList.bind(this));
        this.on('favorites', this.renderList.bind(this));
    }

    renderList = () => {
        let npcs = appState.get('npcs') || [];
        const role = appState.getRole();

        const searchInput = document.getElementById('pesquisaNPCs');
        const termo = searchInput?.value?.toLowerCase() || '';

        if (termo) {
            npcs = npcs.filter(n => 
                n.nome.toLowerCase().includes(termo) ||
                (n.tipo || '').toLowerCase().includes(termo)
            );
        }

        npcs = this.sortItems(npcs, this._sortField, this._sortOrder);

        const container = document.getElementById('npcList');
        if (!npcs.length) {
            container.innerHTML = '<div class="empty-state">Nenhum NPC cadastrado.</div>';
            return;
        }

        const favorites = this.getFavorites('npcs');

        container.innerHTML = npcs.map(n => {
            const isFav = favorites.includes(n.id);
            const controls = role === 'master' ? `
                <button class="btn btn-sm favorite-btn ${isFav ? 'active' : ''}" data-id="${n.id}" title="Favorito">⭐</button>
                <button class="btn btn-sm" onclick="window._duplicateNPC('${n.id}')">📋</button>
                <button class="btn btn-red btn-sm" onclick="window._removeNPC('${n.id}')">🗑️</button>
            ` : '';

            return `
                <div class="card-item">
                    <div class="card-info">
                        <div class="card-name">${escapeHtml(n.nome)} <span class="tag blue">${escapeHtml(n.tipo)}</span> <span class="tag">${n.grau}º Grau</span></div>
                        <div style="font-size:0.8rem; color:var(--text-dim);">Voz: ${escapeHtml(n.voz || 'Não definida')}</div>
                        <div>HP: ${n.hp}/${n.hpMax} | EA: ${n.ea}/${n.eaMax}</div>
                    </div>
                    <div class="card-actions">${controls}</div>
                </div>
            `;
        }).join('');
    };

    addNPC = () => {
        const nome = document.getElementById('npcNome').value.trim();
        if (!nome) return window.showToast?.('⚠️ Nome obrigatório');
        const tipo = document.getElementById('npcTipo').value;
        const grau = parseInt(document.getElementById('npcGrau').value) || 4;
        const voz = document.getElementById('npcVoz').value.trim() || 'Não definida';

        const npcs = appState.get('npcs') || [];
        npcs.push({
            id: generateId(),
            nome,
            tipo,
            grau,
            voz,
            hp: 20 + grau * 5,
            hpMax: 20 + grau * 5,
            ea: 20 + grau * 5,
            eaMax: 20 + grau * 5,
            createdAt: Date.now()
        });
        appState.set('npcs', npcs);
        appState.logAction(`👤 NPC "${nome}" criado.`);
        appState._playSound('save');
        document.getElementById('npcNome').value = '';
        document.getElementById('npcVoz').value = '';
        window.showToast?.('👤 NPC adicionado!');
        this.renderList();
    };

    removeNPC(id) {
        if (appState.getRole() !== 'master') return;
        const npc = appState.get('npcs').find(n => n.id === id);
        if (!npc) return;
        confirmAction(`🗑️ Remover NPC "${npc.nome}"?`, () => {
            const npcs = appState.get('npcs').filter(n => n.id !== id);
            appState.set('npcs', npcs);
            appState.logAction(`🗑️ NPC "${npc.nome}" removido.`);
            this.renderList();
        });
    }

    duplicateNPC(id) {
        if (appState.getRole() !== 'master') return;
        const npc = appState.get('npcs').find(n => n.id === id);
        if (!npc) return;
        this.duplicateItem('npcs', npc, ' (Cópia)');
        this.renderList();
    }

    destroy() {
        super.destroy();
        document.removeEventListener('click', this._onDocumentClick);
        document.getElementById('btnAddNPC')?.removeEventListener('click', this.addNPC);
    }
}

const npcModule = new NpcModule();
export function init() { npcModule.init(); }
export function destroy() { npcModule.destroy(); }
