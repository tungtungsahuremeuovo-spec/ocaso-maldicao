import appState from '../../assets/js/app.js';

const EVENTOS = {
    '04-01': '🌸 Cerimônia de Abertura',
    '05-05': '💪 Semana do Fôlego (Emanuel)',
    '06-07': '🌕 Ritual da Lua Cheia',
    '07-19': '🌙 Caçada Noturna',
    '08-10': '🍧 Descanso de Verão (Hanako)',
    '09-21': '🕯️ Dia do Silêncio',
    '10-31': '🏮 Festival das Lanternas',
    '11-15': '⚔️ Torneio de Exibição',
    '12-18': '📝 Testes de Graduação',
    '01-01': '⛩️ Ritual de Purificação',
    '02-14': '📊 Avaliação de Meio de Ano',
    '03-20': '🌸 Véspera do Luto'
};

const CLIMAS = ['☀️ Ensolarado', '🌧️ Chuva', '🌫️ Neblina', '❄️ Frio intenso', '💨 Vento forte', '🔥 Calor extremo'];

let dataAtual = new Date();

export function init() {
    if (!appState.get('settings').dataCalendario) {
        appState.set('settings', { ...appState.get('settings'), dataCalendario: new Date().toISOString() });
    } else {
        dataAtual = new Date(appState.get('settings').dataCalendario);
    }
    renderCalendario();
    document.getElementById('btnPrevMes').addEventListener('click', () => mudarMes(-1));
    document.getElementById('btnNextMes').addEventListener('click', () => mudarMes(1));
    document.getElementById('btnHoje').addEventListener('click', () => {
        dataAtual = new Date();
        appState.set('settings', { ...appState.get('settings'), dataCalendario: dataAtual.toISOString() });
        renderCalendario();
    });
}

function mudarMes(delta) {
    dataAtual.setMonth(dataAtual.getMonth() + delta);
    appState.set('settings', { ...appState.get('settings'), dataCalendario: dataAtual.toISOString() });
    renderCalendario();
}

function renderCalendario() {
    const ano = dataAtual.getFullYear();
    const mes = dataAtual.getMonth();
    const primeiroDia = new Date(ano, mes, 1).getDay();
    const diasNoMes = new Date(ano, mes + 1, 0).getDate();
    const grid = document.getElementById('calendarioGrid');
    const mesAno = document.getElementById('calendarioMesAno');
    const eventoDiv = document.getElementById('eventoDia');
    const climaSpan = document.getElementById('climaAtual');

    mesAno.textContent = `${dataAtual.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}`;
    
    let html = '';
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    diasSemana.forEach(d => html += `<div style="font-weight:bold; color:var(--gold);">${d}</div>`);
    
    for (let i = 0; i < primeiroDia; i++) html += '<div></div>';
    for (let dia = 1; dia <= diasNoMes; dia++) {
        const dataStr = `${String(mes+1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`;
        const evento = EVENTOS[dataStr];
        const hoje = dia === dataAtual.getDate() && mes === dataAtual.getMonth() && ano === dataAtual.getFullYear();
        html += `<div style="padding:4px; border-radius:4px; ${hoje ? 'background:var(--gold-dark); color:white;' : ''} ${evento ? 'border:1px solid var(--gold);' : ''}" title="${evento || ''}">${dia}</div>`;
    }
    grid.innerHTML = html;

    const hojeStr = `${String(mes+1).padStart(2,'0')}-${String(dataAtual.getDate()).padStart(2,'0')}`;
    eventoDiv.textContent = EVENTOS[hojeStr] ? `🎌 Evento: ${EVENTOS[hojeStr]}` : 'Nenhum evento hoje.';

    const climaIdx = (dataAtual.getDate() + mes) % CLIMAS.length;
    climaSpan.textContent = CLIMAS[climaIdx];
}