// modules/avisos/avisos.js
import appState from '../../assets/js/app.js';
import { generateId, escapeHtml } from '../../core/utils/utils.js';

export function init() {
    if (!appState.get('avisos')) appState.set('avisos', []);
    renderAvisos();
    appState.subscribe('avisos', renderAvisos);

    document.getElementById('btnAddAviso').addEventListener('click', addAviso);
    document.getElementById('avisoInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addAviso();
    });
}

function addAviso() {
    const texto = document.getElementById('avisoInput').value.trim();
    if (!texto) return;
    const avisos = appState.get('avisos');
    avisos.push({
        id: generateId(),
        texto,
        autor: appState.getRole() === 'master' ? '👑 Mestre' : 'Jogador',
        timestamp: Date.now()
    });
    appState.set('avisos', avisos);
    appState.logAction(`📢 Aviso publicado: "${texto}"`);
    document.getElementById('avisoInput').value = '';
    window.showToast?.('✅ Aviso publicado!');
}

function renderAvisos() {
    const avisos = appState.get('avisos') || [];
    const container = document.getElementById('avisosList');
    if (!avisos.length) {
        container.innerHTML = '<p class="empty-state">Nenhum aviso publicado.</p>';
        return;
    }
    container.innerHTML = avisos.slice().reverse().map(a => `
        <div style="background:var(--bg-2); padding:10px; border-radius:6px; margin-bottom:6px; border-left:3px solid var(--gold);">
            <div style="font-weight:600;">${escapeHtml(a.texto)}</div>
            <div style="font-size:0.7rem; color:var(--text-dim);">${escapeHtml(a.autor)} - ${new Date(a.timestamp).toLocaleString('pt-BR')}</div>
        </div>
    `).join('');
}