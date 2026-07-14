import appState from '../../assets/js/app.js';
import { generateId, escapeHtml } from '../../core/utils/utils.js';

export function init() {
    document.getElementById('btnAddItem').addEventListener('click', addItem);
    window._removeItem = removeItem;
    renderList();
    appState.subscribe('items', renderList);
}

function renderList() {
    document.getElementById('itemList').innerHTML = appState.get('items').map(i => {
        let rt = i.raridade === 'Lendário' || i.raridade === 'Relíquia Amaldiçoada' ? 'purple' : i.raridade === 'Raro' ? '' : i.raridade === 'Incomum' ? 'green' : '';
        return `<div class="card-item"><div class="card-info"><div class="card-name">${escapeHtml(i.nome)} <span class="tag ${rt}">${i.raridade}</span></div><div style="font-size:0.8rem;">${escapeHtml(i.desc).substring(0, 80)}</div><div style="font-size:0.75rem;">🎯 ${escapeHtml(i.portador || 'Sem portador')}</div></div><button class="btn btn-red btn-sm" onclick="_removeItem('${i.id}')">🗑️</button></div>`;
    }).join('') || '<div class="empty-state">Nenhum item.</div>';
}

function addItem() {
    const nome = document.getElementById('iNome').value.trim();
    if (!nome) return window.showToast?.('⚠️ Nome obrigatório');
    appState.set('items', [...appState.get('items'), {
        id: generateId(), nome,
        raridade: document.getElementById('iRaridade').value,
        desc: document.getElementById('iDesc').value,
        portador: document.getElementById('iPortador').value
    }]);
    ['iNome', 'iDesc', 'iPortador'].forEach(id => document.getElementById(id).value = '');
    window.showToast?.('💍 Item adicionado!');
}

function removeItem(id) {
    appState.set('items', appState.get('items').filter(i => i.id !== id));
}