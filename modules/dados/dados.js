// modules/dados/dados.js
import appState from '../../assets/js/app.js';

export function init() {
    document.getElementById('btnPedirRolagem').addEventListener('click', pedirRolagem);
}

function pedirRolagem() {
    const pericia = prompt('Qual perícia/teste? (ex: Percepção)');
    if (!pericia) return;
    const dificuldade = prompt('Dificuldade (CD):', '15');
    const msg = {
        type: 'rollRequest',
        player: appState.getRole() === 'player' ? 'Jogador' : 'Mestre',
        skill: pericia,
        difficulty: parseInt(dificuldade) || 15,
        timestamp: Date.now()
    };
    if (appState.connection && appState.connection.open) {
        appState.connection.send(msg);
        window.showToast?.('📨 Pedido enviado ao mestre.');
    } else {
        // Fallback: rola localmente
        const roll = Math.floor(Math.random() * 20) + 1;
        const sucesso = roll >= msg.difficulty;
        document.getElementById('rollRequestResult').innerHTML = 
            `🎲 ${msg.skill}: ${roll} (${sucesso ? '✅ Sucesso' : '❌ Falha'})`;
    }
}

window._rollDice = function(faces) {
    const result = Math.floor(Math.random() * faces) + 1;
    document.getElementById('diceResult').textContent = `🎲 d${faces}: ${result}`;
};