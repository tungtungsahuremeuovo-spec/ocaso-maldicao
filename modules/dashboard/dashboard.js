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
    const npcs = appState.get('npcs') || [];

    document.getElementById('personagensCount').textContent = chars.length;
    document.getElementById('missoesCount').textContent = quests.length;
    document.getElementById('combatesCount').textContent = combat.combatants?.length || 0;
    document.getElementById('npcsCount').textContent = npcs.length;

    const textEl = document.getElementById('estatisticasText');
    if (textEl) {
        const totalMissoes = quests.length;
        const concluidas = quests.filter(q => q.status === 'Concluída').length;
        const bfTotal = chars.reduce((sum, c) => sum + (c.blackFlashCount || 0), 0);
        const danoTotal = chars.reduce((sum, c) => sum + (c.danoTotal || 0), 0);
        textEl.innerHTML = `
            📋 Missões: ${totalMissoes} (${concluidas} concluídas)<br>
            👥 Personagens: ${chars.length}<br>
            🧟 NPCs: ${npcs.length}<br>
            ⚔️ Combatentes em campo: ${combat.combatants?.length || 0}<br>
            ⚡ Black Flashes totais: ${bfTotal}<br>
            💥 Dano total causado: ${danoTotal}
        `;
    }
}