import appState from '../../assets/js/app.js';
import CombatEngine from '../../core/engine/combatEngine.js';
import DiceEngine from '../../core/engine/diceEngine.js';
import { generateId, escapeHtml } from '../../core/utils/utils.js';

let combatEngine;

export function init() {
    combatEngine = new CombatEngine(appState);
    document.getElementById('btnAddCombat').addEventListener('click', addCombatant);
    document.getElementById('btnRollAll').addEventListener('click', rollAll);
    document.getElementById('btnNextTurn').addEventListener('click', nextTurn);
    document.getElementById('btnBlackFlash').addEventListener('click', attemptBF);
    document.getElementById('btnClearCombat').addEventListener('click', clearCombat);
    window._quickRoll = quickRoll;
    window._updateCombHp = updateCombHp;
    window._removeComb = removeCombatant;
    renderList();
    appState.subscribe('combat', renderList);
}

function renderList() {
    const combat = appState.get('combat');
    document.getElementById('turnIndicator').textContent = combat.combatants.length ?
        `Turno ${combat.turnIndex + 1}/${combat.combatants.length}` : '';
    document.getElementById('luckPoints').textContent = combat.luckPoints || 0;
    document.getElementById('jackpotStatus').textContent = combat.jackpotUsed ? 'Usado' : 'Disponível';

    document.getElementById('initList').innerHTML = combat.combatants.map((c, i) => {
        const active = i === combat.turnIndex;
        const hpPct = (c.hp / c.hpMax) * 100;
        let cls = hpPct < 30 ? 'red' : hpPct < 60 ? 'gold' : 'green';
        return `
        <div class="initiative-item ${active ? 'active-turn' : ''}">
            <div class="init-order">${c.iniciativa}</div>
            <div style="flex:1;">
                <strong>${escapeHtml(c.nome)}</strong> ${active ? '👈' : ''}
                <div style="display:flex;align-items:center;gap:5px;">
                    <input type="number" value="${c.hp}" style="width:48px;padding:3px;" onchange="_updateCombHp('${c.id}', this.value)">
                    <span style="font-size:0.75rem;">/ ${c.hpMax}</span>
                    <div class="bar-bg" style="flex:1;"><div class="bar-fill ${cls}" style="width:${hpPct}%;"></div></div>
                </div>
            </div>
            <button class="btn btn-red btn-sm" onclick="_removeComb('${c.id}')">🗑️</button>
        </div>`;
    }).join('') || '<div class="empty-state">Adicione combatentes.</div>';
}

function addCombatant() {
    const nome = document.getElementById('combNome').value.trim();
    if (!nome) return window.showToast?.('⚠️ Nome obrigatório');
    combatEngine.addCombatant({
        id: generateId(),
        nome,
        hp: +document.getElementById('combHp').value || 30,
        hpMax: +document.getElementById('combHpMax').value || 30,
        iniciativa: +document.getElementById('combInic').value || 10
    });
    document.getElementById('combNome').value = '';
    window.showToast?.('⚔️ Combatente adicionado!');
}

function rollAll() {
    combatEngine.rollAllInitiatives();
    window.showToast?.('🎲 Iniciativas roladas!');
}

function nextTurn() {
    const current = combatEngine.nextTurn();
    if (current) window.showToast?.(`▶️ Turno de: ${current.nome}`);
}

function attemptBF() {
    const result = combatEngine.attemptBlackFlash();
    document.getElementById('bfResult').textContent =
        `⚡ Rolagem: ${result.roll} — ${result.success ? 'SUCESSO!' : 'Falha (CD 20)'}`;
    if (result.success) {
        window.showToast?.('⚡ Black Flash! +1 Ponto de Sorte');
        if (result.jackpotTriggered) {
            window.showToast?.('🎰 JACKPOT! Inspiração Lendária concedida!');
        }
    }
}

function clearCombat() {
    combatEngine.clearCombat();
    window.showToast?.('🗑️ Combate limpo.');
}

function updateCombHp(id, newVal) {
    combatEngine.updateHp(id, newVal);
}

function removeCombatant(id) {
    combatEngine.removeCombatant(id);
}

function quickRoll(faces) {
    const roll = DiceEngine.roll(faces);
    document.getElementById('quickResult').style.display = 'block';
    document.getElementById('quickResult').textContent = `🎲 d${faces}: ${roll.total}`;
}