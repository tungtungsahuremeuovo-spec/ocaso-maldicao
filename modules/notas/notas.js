// modules/notas/notas.js
import appState from '../../assets/js/app.js';

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
        setInterval(salvarNotas, 30000);
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