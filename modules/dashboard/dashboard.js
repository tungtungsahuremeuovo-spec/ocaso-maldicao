import appState from '../../assets/js/app.js';

export function init() {
    const data = appState.data;
    document.getElementById('statChars').textContent = data.characters.length;
    document.getElementById('statSessions').textContent = data.sessions.length;
    document.getElementById('statQuests').textContent = data.quests.length;
    document.getElementById('statItems').textContent = data.items.length;
    document.getElementById('statSpells').textContent = data.spells.length;
    document.getElementById('statDomains').textContent = data.domains.length;
}