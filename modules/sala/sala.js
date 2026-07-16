// modules/sala/sala.js
import appState from '../../assets/js/app.js';

let presencas = [];
let votacao = { ativa: false, opcoes: [], votos: {} };
let heartbeatInterval = null;

export function init() {
    const role = appState.getRole();
    const status = appState.get('sessionStatus') || 'waiting';
    document.getElementById('sessionStatus').textContent = 
        status === 'waiting' ? '🟡 Aguardando jogadores' :
        status === 'playing' ? '🟢 Em andamento' :
        '⏸️ Pausado';

    if (role === 'master' && appState.hostId) {
        const btnCopiar = document.getElementById('btnCopiarIdSala');
        btnCopiar.style.display = '';
        btnCopiar.addEventListener('click', () => {
            navigator.clipboard.writeText(appState.hostId).then(() => {
                window.showToast?.('📋 ID da sala copiado!');
            }).catch(() => {
                window.showToast?.('📋 ID: ' + appState.hostId);
            });
        });
    }

    heartbeatInterval = setInterval(() => {
        if (appState.connection && appState.connection.open) {
            appState.connection.send({ type: 'ping', timestamp: Date.now() });
        }
    }, 30000);

    if (appState.connection) {
        appState.connection.on('data', (msg) => {
            if (msg.type === 'ping') {
                document.getElementById('presencaStatus').textContent = '🟢 Online';
                document.getElementById('presencaStatus').style.color = 'var(--green)';
            }
        });
    }

    const container = document.getElementById('jogadoresLista');
    if (appState.connection && appState.connection.open) {
        container.innerHTML = `<p>Jogador conectado: ${appState.connection.peer}</p>`;
        document.getElementById('presencaStatus').textContent = '🟢 Online';
    } else {
        container.innerHTML = '<p class="empty-state">Nenhum jogador conectado.</p>';
        document.getElementById('presencaStatus').textContent = '🔴 Offline';
    }

    if (role === 'master') {
        document.getElementById('btnIniciarSessao').style.display = '';
        document.getElementById('btnEncerrarSessao').style.display = '';
        document.getElementById('btnIniciarSessao').addEventListener('click', () => {
            appState.set('sessionStatus', 'playing');
            appState.enviarNotificacao('▶️ A sessão começou!');
            document.getElementById('sessionStatus').textContent = '🟢 Em andamento';
        });
        document.getElementById('btnEncerrarSessao').addEventListener('click', () => {
            appState.set('sessionStatus', 'waiting');
            appState.enviarNotificacao('⏹️ A sessão foi encerrada.');
            document.getElementById('sessionStatus').textContent = '🟡 Aguardando jogadores';
        });
    }

    appState.subscribe('sessionStatus', (newStatus) => {
        document.getElementById('sessionStatus').textContent = 
            newStatus === 'waiting' ? '🟡 Aguardando jogadores' :
            newStatus === 'playing' ? '🟢 Em andamento' : '⏸️ Pausado';
    });

    document.getElementById('btnMarcarPresenca').addEventListener('click', marcarPresenca);
    document.getElementById('btnInspiracao').addEventListener('click', iniciarVotacao);
}

function marcarPresenca() {
    const nome = prompt('Nome do jogador:', '');
    if (!nome) return;
    const data = new Date().toLocaleDateString('pt-BR');
    const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    presencas.push({ nome, data, hora });
    renderPresencas();
    appState.logAction(`✅ ${nome} marcou presença.`);
}

function renderPresencas() {
    const container = document.getElementById('presencaLista');
    if (!presencas.length) {
        container.innerHTML = '<p class="empty-state">Nenhuma presença marcada.</p>';
        return;
    }
    container.innerHTML = presencas.map(p => 
        `<div>${p.nome} - ${p.data} às ${p.hora}</div>`
    ).join('');
}

function iniciarVotacao() {
    const descricao = prompt('O que o grupo quer votar? (ex: "Dar inspiração para João?")');
    if (!descricao) return;
    votacao = { ativa: true, descricao, opcoes: ['Sim', 'Não'], votos: { Sim: 0, Não: 0 } };
    appState.enviarNotificacao(`📊 Votação iniciada: ${descricao}`);
    appState.enviarNotificacao('🗳️ Diga "sim" ou "não" no chat.');
    setTimeout(() => encerrarVotacao(), 30000);
}

function encerrarVotacao() {
    if (!votacao.ativa) return;
    votacao.ativa = false;
    const resultado = votacao.votos.Sim > votacao.votos.Não ? 'Sim' : 'Não';
    const mensagem = `📊 Resultado: ${resultado} (Sim: ${votacao.votos.Sim}, Não: ${votacao.votos.Não})`;
    window.showToast?.(mensagem);
    appState.enviarNotificacao(mensagem);
    if (resultado === 'Sim') {
        appState.logAction('💡 Inspiração concedida ao grupo.');
        window.showToast?.('💡 O grupo recebeu inspiração (vantagem)!');
    }
}