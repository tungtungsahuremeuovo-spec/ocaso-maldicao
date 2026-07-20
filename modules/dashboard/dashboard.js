// modules/dashboard/dashboard.js
import appState from '../../assets/js/app.js';

export function init() {
    atualizarResumo();
    renderEstatisticas();
    renderUltimosEventos();
    appState.subscribe('characters', () => { atualizarResumo(); renderEstatisticas(); });
    appState.subscribe('quests', atualizarResumo);
    appState.subscribe('npcs', atualizarResumo);
    appState.subscribe('campaignLog', renderUltimosEventos);
}

function atualizarResumo() {
    const chars = appState.get('characters') || [];
    const quests = appState.get('quests') || [];
    const npcs = appState.get('npcs') || [];
    const totalBF = chars.reduce((acc, c) => acc + (c.blackFlashCount || 0), 0);

    document.getElementById('totalPersonagens').textContent = chars.length;
    document.getElementById('totalMissoes').textContent = quests.length;
    document.getElementById('totalNPCs').textContent = npcs.length;
    document.getElementById('totalBF').textContent = totalBF;
}

function renderEstatisticas() {
    const chars = appState.get('characters') || [];
    if (!chars.length) {
        const textEl = document.getElementById('estatisticasText');
        if (textEl) textEl.textContent = 'Nenhum dado disponível.';
        return;
    }
    const danos = chars.map(c => ({ nome: c.nome, dano: c.danoTotal || 0 }));
    const bf = chars.map(c => ({ nome: c.nome, bf: c.blackFlashCount || 0 }));

    const topDano = danos.sort((a,b) => b.dano - a.dano)[0];
    const topBF = bf.sort((a,b) => b.bf - a.bf)[0];
    const textEl = document.getElementById('estatisticasText');
    if (textEl) {
        textEl.innerHTML = `
            🏆 Mais dano: ${topDano?.nome || 'N/A'} (${topDano?.dano || 0})<br>
            ⚡ Mais Black Flashes: ${topBF?.nome || 'N/A'} (${topBF?.bf || 0})
        `;
    }
    desenharGrafico('danoChart', danos, 'Dano Total');
    desenharGrafico('bfChart', bf, 'Black Flashes');
}

function desenharGrafico(id, dados, label) {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width || 300, h = canvas.height || 200;
    canvas.width = w; canvas.height = h;
    ctx.clearRect(0,0,w,h);
    const max = Math.max(...dados.map(d => d.dano || d.bf || 1), 1);
    const barWidth = w / dados.length * 0.6;
    const gap = w / dados.length * 0.4;
    dados.forEach((d, i) => {
        const x = i * (barWidth + gap) + gap/2;
        const height = ( (d.dano || d.bf || 0) / max ) * (h - 20);
        ctx.fillStyle = '#c9a24e';
        ctx.fillRect(x, h - 10 - height, barWidth, height);
        ctx.fillStyle = '#fff';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(d.nome.substring(0,3), x + barWidth/2, h - 2);
    });
    ctx.fillStyle = '#a09b8f';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, w/2, 12);
}

function renderUltimosEventos() {
    const log = appState.get('campaignLog') || [];
    const container = document.getElementById('ultimosEventos');
    if (!container) return;
    const ultimos = log.slice(-10).reverse();
    if (!ultimos.length) {
        container.innerHTML = '<p class="empty-state">Nenhum evento recente.</p>';
        return;
    }
    container.innerHTML = ultimos.map(entry => `
        <div style="padding:4px 0; border-bottom:1px solid var(--border); font-size:0.8rem;">
            <span style="color:var(--text-dim); font-size:0.7rem;">${new Date(entry.timestamp).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</span>
            <span>${escapeHtml(entry.message)}</span>
        </div>
    `).join('');
}

// Helper simples para escape (já que não podemos importar o utils de dentro do dashboard)
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}