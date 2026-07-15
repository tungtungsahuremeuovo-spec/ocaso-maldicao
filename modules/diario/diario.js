import appState from '../../assets/js/app.js';

export function init() {
    if (!appState.get('campaignLog')) appState.set('campaignLog', []);
    renderDiario();
    appState.subscribe('campaignLog', renderDiario);
}

function renderDiario() {
    const log = appState.get('campaignLog');
    document.getElementById('diarioList').innerHTML = log.slice().reverse().map(e => {
        const data = new Date(e.timestamp).toLocaleString('pt-BR');
        return `<div class="card-item"><div class="card-info"><span style="color:var(--text-dim); font-size:0.8rem;">${data}</span><br>${e.message}</div></div>`;
    }).join('') || '<p class="empty-state">Nenhum evento registrado.</p>';
}