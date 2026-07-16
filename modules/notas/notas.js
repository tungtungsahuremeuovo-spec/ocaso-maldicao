// modules/notas/notas.js
import appState from '../../assets/js/app.js';

export function init() {
    const notas = appState.get('notas') || '';
    document.getElementById('notasEditor').value = notas;
    document.getElementById('btnSalvarNotas').addEventListener('click', salvarNotas);
    // Auto-save a cada 30s
    setInterval(salvarNotas, 30000);
}

function salvarNotas() {
    const texto = document.getElementById('notasEditor').value;
    appState.set('notas', texto);
    document.getElementById('notasStatus').textContent = '✅ Salvo em ' + new Date().toLocaleTimeString('pt-BR');
    appState.logAction('📝 Notas atualizadas.');
}