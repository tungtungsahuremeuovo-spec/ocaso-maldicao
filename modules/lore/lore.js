import appState from '../../assets/js/app.js';
import { generateId, escapeHtml } from '../../core/utils/utils.js';

export function init() {
    document.getElementById('btnAddLore').addEventListener('click', addLore);
    document.getElementById('loreSearch').addEventListener('input', renderList);
    window._removeLore = removeLore;
    renderList();
    appState.subscribe('lores', renderList);
}

function renderList() {
    const s = document.getElementById('loreSearch')?.value.toLowerCase() || '';
    const items = appState.get('lores').filter(l => l.titulo.toLowerCase().includes(s));
    document.getElementById('loreList').innerHTML = items.map(l => `
        <div class="card-item"><div class="card-info"><div class="card-name">${escapeHtml(l.titulo)} <span class="tag">${l.tipo}</span></div><div style="font-size:0.8rem;">${escapeHtml(l.desc).substring(0, 120)}</div></div><button class="btn btn-red btn-sm" onclick="_removeLore('${l.id}')">🗑️</button></div>
    `).join('') || '<div class="empty-state">Nenhum registro.';
}

function addLore() {
    const titulo = document.getElementById('loreTitulo').value.trim();
    if (!titulo) return window.showToast?.('⚠️ Título obrigatório');
    appState.set('lores', [...appState.get('lores'), {
        id: generateId(), titulo,
        tipo: document.getElementById('loreTipo').value,
        desc: document.getElementById('loreDesc').value
    }]);
    document.getElementById('loreTitulo').value = '';
    document.getElementById('loreDesc').value = '';
    window.showToast?.('📖 Lore adicionado!');
}

function removeLore(id) {
    appState.set('lores', appState.get('lores').filter(l => l.id !== id));
}