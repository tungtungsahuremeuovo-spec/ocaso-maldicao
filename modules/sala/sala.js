// modules/sala/sala.js
import appState from '../../assets/js/app.js';

export function init() {
    const role = appState.getRole();
    const status = appState.get('sessionStatus') || 'waiting';
    document.getElementById('sessionStatus').textContent = 
        status === 'waiting' ? '🟡 Aguardando jogadores' :
        status === 'playing' ? '🟢 Em andamento' :
        '⏸️ Pausado';

    const container = document.getElementById('jogadoresLista');
    if (appState.connection && appState.connection.open) {
        container.innerHTML = `<p>Jogador conectado: ${appState.connection.peer}</p>`;
    } else {
        container.innerHTML = '<p class="empty-state">Nenhum jogador conectado.</p>';
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
}