// modules/notas/notas.js
import appState from '../../assets/js/app.js';

let autoSaveInterval = null;

export function init() {
    const editor = document.getElementById('notasEditor');
    if (!editor) {
        console.warn('Notas: elemento notasEditor não encontrado');
        return;
    }
    const notas = appState.get('notas') || '';
    editor.value = notas;
    const btnSalvar = document.getElementById('btnSalvarNotas');
    if (btnSalvar) {
        btnSalvar.addEventListener('click', salvarNotas);
        clearInterval(autoSaveInterval);
        autoSaveInterval = setInterval(salvarNotas, 30000);
    }
}

function salvarNotas() {
    const editor = document.getElementById('notasEditor');
    if (!editor) return;
    const texto = editor.value;
    appState.set('notas', texto);
    const statusEl = document.getElementById('notasStatus');
    if (statusEl) {
        statusEl.textContent = '✅ Salvo em ' + new Date().toLocaleTimeString('pt-BR');
    }
    appState.logAction('📝 Notas atualizadas.');
}

export function destroy() {
    clearInterval(autoSaveInterval);
    autoSaveInterval = null;
}
