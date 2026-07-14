import appState from '../../assets/js/app.js';
import { generateId, escapeHtml } from '../../core/utils/utils.js';

export function init() {
    const role = appState.getRole();
    const formPanel = document.getElementById('questFormPanel');

    if (role === 'master') {
        formPanel.style.display = 'block';
        document.getElementById('btnAddQuest').addEventListener('click', addQuest);
    } else {
        formPanel.style.display = 'none';
    }

    window._toggleQuest = toggleQuest;
    window._removeQuest = removeQuest;
    renderList();
    appState.subscribe('quests', renderList);
}

function renderList() {
    let quests = appState.get('quests');
    if (appState.getRole() === 'player') {
        quests = quests.filter(q => q.visivelJogadores);
    }
    const role = appState.getRole();
    document.getElementById('questList').innerHTML = quests.map(q => {
        let tg = q.status === 'Concluída' ? 'green' : q.status === 'Falha' ? 'red' : '';
        const controls = role === 'master' ? `
            <button class="btn btn-sm" onclick="_toggleQuest('${q.id}')">🔄</button>
            <button class="btn btn-red btn-sm" onclick="_removeQuest('${q.id}')">🗑️</button>` : '';
        return `<div class="card-item"><div class="card-info"><div class="card-name">${escapeHtml(q.titulo)} <span class="tag ${tg}">${q.status}</span></div><div style="font-size:0.8rem;">${escapeHtml(q.desc).substring(0, 80)}</div><div style="font-size:0.75rem;">💰 ${escapeHtml(q.recompensa)}</div></div><div class="card-actions">${controls}</div></div>`;
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
    ['qTitulo', 'qDesc', 'qRecompensa'].forEach(id => document.getElementById(id).value = '');
    window.showToast?.('🏴 Missão adicionada!');
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
}

function removeQuest(id) {
    if (appState.getRole() !== 'master') return;
    appState.set('quests', appState.get('quests').filter(q => q.id !== id));
}