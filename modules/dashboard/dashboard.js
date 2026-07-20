// modules/dashboard/dashboard.js
import appState from '../../assets/js/app.js';

export function init() {
    atualizarContadores();
    appState.subscribe('characters', atualizarContadores);
    appState.subscribe('quests', atualizarContadores);
    appState.subscribe('combat', atualizarContadores);
}

function atualizarContadores() {
    const chars = appState.get('characters') || [];
    const quests = appState.get('quests') || [];
    const combat = appState.get('combat') || { combatants: [] };

    document.getElementById('personagensCount').textContent = chars.length;
    document.getElementById('missoesCount').textContent = quests.length;
    document.getElementById('combatesCount').textContent = combat.combatants?.length || 0;

    const textEl = document.getElementById('estatisticasText');
    if (textEl) {
        const totalMissoes = quests.length;
        const concluidas = quests.filter(q => q.status === 'Concluída').length;
        textEl.innerHTML = `
            📋 Total de missões: ${totalMissoes} (${concluidas} concluídas)<br>
            👥 Personagens: ${chars.length}<br>
            ⚔️ Combatentes em campo: ${combat.combatants?.length || 0}
        `;
    }
}