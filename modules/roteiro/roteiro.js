// modules/roteiro/roteiro.js
import appState from '../../assets/js/app.js';
import { generateId, escapeHtml } from '../../core/utils/utils.js';

export function init() {
    if (!appState.get('roteiro')) appState.set('roteiro', []);
    renderRoteiro();
    appState.subscribe('roteiro', renderRoteiro);

    document.getElementById('btnAddCena').addEventListener('click', addCena);
    document.getElementById('cenaInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addCena();
    });
}

function addCena() {
    const texto = document.getElementById('cenaInput').value.trim();
    if (!texto) return;
    const roteiro = appState.get('roteiro');
    roteiro.push({ id: generateId(), texto, concluida: false });
    appState.set('roteiro', roteiro);
    appState.logAction(`📋 Cena "${texto}" adicionada.`);
    document.getElementById('cenaInput').value = '';
    window.showToast?.('✅ Cena adicionada!');
}

function renderRoteiro() {
    const container = document.getElementById('cenasList');
    const roteiro = appState.get('roteiro') || [];
    if (!roteiro.length) {
        container.innerHTML = '<p class="empty-state">Nenhuma cena planejada.</p>';
        return;
    }
    container.innerHTML = roteiro.map(c => `
        <div style="background:var(--bg-2); padding:8px; border-radius:4px; margin-bottom:4px; display:flex; justify-content:space-between; align-items:center; ${c.concluida ? 'opacity:0.5; text-decoration:line-through;' : ''}">
            <span>${escapeHtml(c.texto)}</span>
            <div>
                <button class="btn btn-sm" onclick="window._toggleCena('${c.id}')">${c.concluida ? '↩️ Reabrir' : '✅ Concluir'}</button>
                <button class="btn btn-red btn-sm" onclick="window._removeCena('${c.id}')">🗑️</button>
            </div>
        </div>
    `).join('');
    window._toggleCena = (id) => {
        const roteiro = appState.get('roteiro');
        const cena = roteiro.find(c => c.id === id);
        if (cena) {
            cena.concluida = !cena.concluida;
            appState.set('roteiro', roteiro);
            appState.logAction(`${cena.concluida ? '✅' : '↩️'} Cena "${cena.texto}" ${cena.concluida ? 'concluída' : 'reaberta'}.`);
        }
    };
    window._removeCena = (id) => {
        const roteiro = appState.get('roteiro').filter(c => c.id !== id);
        appState.set('roteiro', roteiro);
        appState.logAction('🗑️ Cena removida.');
    };
}