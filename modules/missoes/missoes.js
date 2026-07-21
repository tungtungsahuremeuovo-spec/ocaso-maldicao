// modules/missoes/missoes.js
import appState from '../../assets/js/app.js';
import { generateId, escapeHtml } from '../../core/utils/utils.js';

export function init() {
    const role = appState.getRole();
    const formPanel = document.getElementById('questFormPanel');
    const btnLimpar = document.getElementById('btnLimparFiltros');

    // Mestre: mostra formulário e botões
    if (role === 'master') {
        formPanel.style.display = 'block';
        document.getElementById('btnAddQuest').addEventListener('click', addQuest);
        if (btnLimpar) btnLimpar.style.display = '';
    } else {
        formPanel.style.display = 'none';
        if (btnLimpar) btnLimpar.style.display = 'none';
    }

    window._toggleQuest = toggleQuest;
    window._removeQuest = removeQuest;
    renderList();
    appState.subscribe('quests', renderList);

    // Filtros (visíveis para todos)
    const filtroTexto = document.getElementById('filtroMissoes');
    const filtroStatus = document.getElementById('filtroStatusMissao');
    if (filtroTexto) filtroTexto.addEventListener('input', renderList);
    if (filtroStatus) filtroStatus.addEventListener('change', renderList);
    if (btnLimpar) {
        btnLimpar.addEventListener('click', () => {
            if (filtroTexto) filtroTexto.value = '';
            if (filtroStatus) filtroStatus.value = '';
            renderList();
        });
    }

    // Edição inline (apenas mestre)
    document.addEventListener('dblclick', function(e) {
        if (appState.getRole() !== 'master') return;
        const el = e.target.closest('.editable');
        if (!el) return;
        el.contentEditable = true;
        el.focus();
        document.execCommand('selectAll', false, null);
    });

    document.addEventListener('blur', function(e) {
        const el = e.target.closest('.editable');
        if (!el) return;
        if (el.contentEditable === 'true') {
            el.contentEditable = false;
            const id = el.dataset.id;
            const field = el.dataset.field;
            const newValue = el.textContent.trim();
            const quests = appState.get('quests') || [];
            const item = quests.find(q => q.id === id);
            if (item) {
                item[field] = newValue;
                appState.set('quests', quests);
                appState.logAction(`✏️ Missão "${newValue}" editada inline.`);
            }
        }
    }, true);
}

function renderList() {
    let quests = appState.get('quests') || [];
    const filtroTexto = document.getElementById('filtroMissoes')?.value?.toLowerCase() || '';
    const filtroStatus = document.getElementById('filtroStatusMissao')?.value || '';

    if (filtroTexto) {
        quests = quests.filter(q => q.titulo.toLowerCase().includes(filtroTexto));
    }
    if (filtroStatus) {
        quests = quests.filter(q => q.status === filtroStatus);
    }

    const role = appState.getRole();
    if (role === 'player') {
        quests = quests.filter(q => q.visivelJogadores);
    }

    document.getElementById('questList').innerHTML = quests.map(q => {
        let tg = q.status === 'Concluída' ? 'green' : q.status === 'Falha' ? 'red' : '';
        // Botões de controle APENAS para mestre
        const controls = role === 'master' ? `
            <button class="btn btn-sm" onclick="_toggleQuest('${q.id}')">🔄</button>
            <button class="btn btn-red btn-sm" onclick="_removeQuest('${q.id}')">🗑️</button>` : '';
        return `<div class="card-item">
            <div class="card-info">
                <div class="card-name">
                    <span class="editable" data-id="${q.id}" data-field="titulo" contenteditable="false">${escapeHtml(q.titulo)}</span>
                    <span class="tag ${tg}">${q.status}</span>
                </div>
                <div style="font-size:0.8rem;">${escapeHtml(q.desc).substring(0, 80)}</div>
                <div style="font-size:0.75rem;">💰 ${escapeHtml(q.recompensa)}</div>
            </div>
            <div class="card-actions">${controls}</div>
        </div>`;
    }).join('') || '<div class="empty-state">Nenhuma missão disponível.</div>';
}

function addQuest() {
    const titulo = document.getElementById('qTitulo').value.trim();
    if (!titulo) return window.showToast?.('⚠️ Título obrigatório');
    appState.set('quests', [...appState.get('quests'), {
        id: generateId(),
        titulo,
        desc: document.getElementById('qDesc').value,
        recompensa: document.getElementById('qRecompensa').value,
        status: document.getElementById('qStatus').value,
        visivelJogadores: document.getElementById('qVisivel').checked
    }]);
    appState.logAction(`🏴 Missão "${titulo}" criada.`);
    appState.enviarNotificacao(`🏴 Mestre criou a missão "${titulo}".`);
    ['qTitulo', 'qDesc', 'qRecompensa'].forEach(id => document.getElementById(id).value = '');
    window.showToast?.('🏴 Missão adicionada!');
    renderList();
}

function toggleQuest(id) {
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
    }
    renderList();
}

function removeQuest(id) {
    if (appState.getRole() !== 'master') return;
    const quest = appState.get('quests').find(q => q.id === id);
    appState.set('quests', appState.get('quests').filter(q => q.id !== id));
    if (quest) {
        appState.logAction(`🏴 Missão "${quest.titulo}" removida.`);
        appState.enviarNotificacao(`🏴 Missão "${quest.titulo}" foi removida.`);
    }
    renderList();
}