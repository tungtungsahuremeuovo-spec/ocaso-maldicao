// modules/avisos/avisos.js
import appState from '../../assets/js/app.js';
import { generateId, escapeHtml } from '../../core/utils/utils.js';

export function init() {
    // Verifica se os elementos existem antes de prosseguir
    const avisoInput = document.getElementById('avisoInput');
    const btnAddAviso = document.getElementById('btnAddAviso');
    if (!avisoInput || !btnAddAviso) {
        console.warn('Avisos: elementos não encontrados.');
        return;
    }

    if (!appState.get('avisos')) appState.set('avisos', []);
    renderAvisos();
    appState.subscribe('avisos', renderAvisos);

    btnAddAviso.addEventListener('click', addAviso);
    avisoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addAviso();
    });
}

function addAviso() {
    const input = document.getElementById('avisoInput');
    if (!input) return;
    const texto = input.value.trim();
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
    input.value = '';
    window.showToast?.('✅ Aviso publicado!');
}

function renderAvisos() {
    const container = document.getElementById('avisosList');
    if (!container) {
        console.warn('avisosList não encontrado');
        return;
    }
    const avisos = appState.get('avisos') || [];
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