// modules/diario/diario.js
import appState from '../../assets/js/app.js';
import { escapeHtml } from '../../core/utils/utils.js';

export function init() {
    renderLog();
    appState.subscribe('campaignLog', renderLog);

    const filtroTexto = document.getElementById('filtroLog');
    const filtroTipo = document.getElementById('filtroLogTipo');
    const btnLimpar = document.getElementById('btnLimparLog');
    const btnLimparCompleto = document.getElementById('btnLimparLogCompleto');

    if (filtroTexto) filtroTexto.addEventListener('input', renderLog);
    if (filtroTipo) filtroTipo.addEventListener('change', renderLog);
    if (btnLimpar) {
        btnLimpar.addEventListener('click', () => {
            if (filtroTexto) filtroTexto.value = '';
            if (filtroTipo) filtroTipo.value = '';
            renderLog();
        });
    }
    if (btnLimparCompleto) {
        btnLimparCompleto.addEventListener('click', () => {
            if (confirm('🗑️ Limpar todo o histórico de eventos?')) {
                appState.set('campaignLog', []);
                appState.logAction('🗑️ Histórico de eventos limpo.');
                renderLog();
            }
        });
    }
}

function renderLog() {
    const log = appState.get('campaignLog') || [];
    const container = document.getElementById('logContainer');
    if (!container) return;

    const filtroTexto = document.getElementById('filtroLog')?.value?.toLowerCase() || '';
    const filtroTipo = document.getElementById('filtroLogTipo')?.value || '';

    let filtered = log;
    if (filtroTexto) {
        filtered = filtered.filter(e => e.message.toLowerCase().includes(filtroTexto));
    }
    if (filtroTipo) {
        filtered = filtered.filter(e => {
            if (filtroTipo === 'Personagem') return e.message.includes('Personagem') || e.message.includes('Ficha');
            if (filtroTipo === 'Missão') return e.message.includes('Missão') || e.message.includes('🏴');
            if (filtroTipo === 'Combate') return e.message.includes('⚔️') || e.message.includes('Combate') || e.message.includes('Black Flash');
            if (filtroTipo === 'NPC') return e.message.includes('NPC') || e.message.includes('👥');
            if (filtroTipo === 'Sistema') return e.message.includes('Sistema') || e.message.includes('⚙️');
            return true;
        });
    }

    if (filtered.length === 0) {
        container.innerHTML = '<p class="empty-state">Nenhum evento registrado.</p>';
        return;
    }

    container.innerHTML = filtered.slice().reverse().map(entry => {
        const date = new Date(entry.timestamp).toLocaleString('pt-BR', { 
            day: '2-digit', month: '2-digit', year: 'numeric', 
            hour: '2-digit', minute: '2-digit' 
        });
        return `
            <div style="padding:6px 0; border-bottom:1px solid var(--border); display:flex; gap:12px;">
                <span style="color:var(--text-dim); font-size:0.7rem; min-width:100px;">${date}</span>
                <span>${escapeHtml(entry.message)}</span>
            </div>
        `;
    }).join('');
}