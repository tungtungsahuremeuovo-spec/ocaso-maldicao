import appState from '../../assets/js/app.js';
import { generateId, escapeHtml, formatDate } from '../../core/utils/utils.js';

export function init() {
    document.getElementById('sData').value = new Date().toISOString().split('T')[0];
    document.getElementById('btnAddSession').addEventListener('click', addSession);
    window._removeSession = removeSession;
    renderList();
    appState.subscribe('sessions', renderList);
}

function renderList() {
    document.getElementById('sessionList').innerHTML = appState.get('sessions').map(s => `
        <div class="card-item">
            <div class="card-info">
                <div class="card-name">${escapeHtml(s.titulo)}</div>
                <div class="card-sub">📅 ${formatDate(s.data)}</div>
                <div style="font-size:0.8rem;">${escapeHtml(s.texto).substring(0, 100)}...</div>
            </div>
            <button class="btn btn-red btn-sm" onclick="_removeSession('${s.id}')">🗑️</button>
        </div>`).join('') || '<div class="empty-state">Nenhuma sessão registrada.</div>';
}

function addSession() {
    const titulo = document.getElementById('sTitulo').value.trim();
    if (!titulo) return window.showToast?.('⚠️ Título obrigatório');
    appState.set('sessions', [
        { id: generateId(), titulo, data: document.getElementById('sData').value, texto: document.getElementById('sTexto').value },
        ...appState.get('sessions')
    ]);
    document.getElementById('sTitulo').value = '';
    document.getElementById('sTexto').value = '';
    window.showToast?.('📝 Sessão registrada!');
}

function removeSession(id) {
    appState.set('sessions', appState.get('sessions').filter(s => s.id !== id));
}