// modules/combate/combate.js
import appState from '../../assets/js/app.js';
import CombatEngine from '../../core/engine/combatEngine.js';
import DiceEngine from '../../core/engine/diceEngine.js';
import { generateId, escapeHtml } from '../../core/utils/utils.js';

let combatEngine;

function getPlayerCharacter() {
    return appState.get('characters').find(c => c.isPlayerCharacter) || null;
}

export function init() {
    combatEngine = new CombatEngine(appState);

    document.getElementById('btnAddCombat').addEventListener('click', addCombatant);
    document.getElementById('btnRollAll').addEventListener('click', rollAll);
    document.getElementById('btnNextTurn').addEventListener('click', nextTurn);
    document.getElementById('btnBlackFlash').addEventListener('click', attemptBF);
    document.getElementById('btnClearCombat').addEventListener('click', clearCombat);
    document.getElementById('btnAplicarCond').addEventListener('click', aplicarCondicao);
    document.getElementById('btnResistDesesperada').addEventListener('click', resistenciaDesesperada);

    window._quickRoll = quickRoll;
    window._updateCombHp = updateCombHp;
    window._removeComb = removeCombatant;
    window._aplicarDano = aplicarDano;

    renderList();
    appState.subscribe('combat', renderList);
}

function renderList() {
    const combat = appState.get('combat');
    if (!combat) return;

    document.getElementById('turnIndicator').textContent = combat.combatants.length ?
        `Turno ${combat.turnIndex + 1}/${combat.combatants.length}` : '';
    document.getElementById('luckPoints').textContent = combat.luckPoints || 0;
    document.getElementById('jackpotStatus').textContent = combat.jackpotUsed ? 'Usado' : 'Disponível';

    const container = document.getElementById('initList');
    if (!combat.combatants.length) {
        container.innerHTML = '<div class="empty-state">Adicione combatentes.</div>';
        return;
    }

    container.innerHTML = combat.combatants.map((c, i) => {
        const active = i === combat.turnIndex;
        const hpPct = (c.hp / c.hpMax) * 100;
        const cls = hpPct < 30 ? 'red' : hpPct < 60 ? 'gold' : 'green';

        const conds = (c.condicoes || []).map(cond =>
            `<span class="tag red">${escapeHtml(cond.nome)} (${cond.restante})</span>`
        ).join(' ');

        return `
        <div class="initiative-item ${active ? 'active-turn' : ''}">
            <div class="init-order">${c.iniciativa}</div>
            <div style="flex:1;">
                <strong>${escapeHtml(c.nome)}</strong> ${active ? '👈' : ''}
                ${conds ? `<br><span style="font-size:0.75rem;">${conds}</span>` : ''}
                <div style="display:flex;align-items:center;gap:5px;margin-top:4px;">
                    <input type="number" value="${c.hp}" style="width:48px;padding:3px;" onchange="_updateCombHp('${c.id}', this.value)">
                    <span style="font-size:0.75rem;">/ ${c.hpMax}</span>
                    <div class="bar-bg" style="flex:1;"><div class="bar-fill ${cls}" style="width:${hpPct}%;"></div></div>
                </div>
            </div>
            <button class="btn btn-red btn-sm" onclick="_removeComb('${c.id}')">🗑️</button>
        </div>`;
    }).join('');
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
    appState.enviarNotificacao(`⚔️ ${nome} entrou em combate.`);
}

function rollAll() {
    combatEngine.rollAllInitiatives();
    window.showToast?.('🎲 Iniciativas roladas!');
}

function nextTurn() {
    const current = combatEngine.nextTurn();
    if (current) {
        const combat = appState.get('combat');
        combat.combatants.forEach(c => {
            if (c.condicoes && c.condicoes.length) {
                c.condicoes = c.condicoes.filter(cond => {
                    cond.restante--;
                    return cond.restante > 0;
                });
            }
            c.fluxoAtivo = false;
        });
        appState.set('combat', combat);
        window.showToast?.(`▶️ Turno de: ${current.nome}`);
        appState.enviarNotificacao(`▶️ Turno de ${current.nome}.`);
    } else {
        window.showToast?.('⚠️ Nenhum combatente ativo.');
    }
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

        const char = getPlayerCharacter();
        if (char) {
            char.blackFlashCount = (char.blackFlashCount || 0) + 1;
            char.fluxoAtivo = true;
            const chars = appState.get('characters').filter(c => !c.isPlayerCharacter);
            chars.push(char);
            appState.set('characters', chars);
            appState.logAction(`⚡ Black Flash de ${char.nome}! Fluxo ativado.`);
            appState.enviarNotificacao(`⚡ Black Flash de ${char.nome}!`);
        }
    }
}

function clearCombat() {
    if (confirm('🗑️ Limpar todos os combatentes?')) {
        combatEngine.clearCombat();
        window.showToast?.('🗑️ Combate limpo.');
        appState.enviarNotificacao('🗑️ Combate foi limpo pelo mestre.');
    }
}

function aplicarCondicao() {
    const combat = appState.get('combat');
    if (!combat || !combat.combatants.length) {
        return window.showToast?.('⚠️ Nenhum combatente em combate.');
    }

    const alvo = combat.combatants[combat.turnIndex];
    if (!alvo) return window.showToast?.('⚠️ Nenhum combatente ativo.');

    const tipo = document.getElementById('condTipo').value;
    const duracao = parseInt(document.getElementById('condDuracao').value) || 1;

    alvo.condicoes = alvo.condicoes || [];
    alvo.condicoes.push({ nome: tipo, restante: duracao });

    appState.set('combat', combat);
    window.showToast?.(`🧪 ${alvo.nome} recebeu ${tipo} (${duracao} rodadas)`);
    appState.enviarNotificacao(`🧪 ${alvo.nome} recebeu ${tipo} por ${duracao} rodadas.`);
}

function resistenciaDesesperada() {
    const combat = appState.get('combat');
    if (!combat || !combat.combatants.length) {
        return window.showToast?.('⚠️ Nenhum combatente em combate.');
    }

    const alvo = combat.combatants[combat.turnIndex];
    if (!alvo) return window.showToast?.('⚠️ Nenhum combatente ativo.');

    if (alvo.ea < 5) {
        return window.showToast?.('⚠️ EA insuficiente (mínimo 5).');
    }

    alvo.ea -= 5;
    const pre = alvo.PRE || alvo.presenca || 0;
    const roll = Math.floor(Math.random() * 20) + 1 + pre;
    const cd = 15;
    const sucesso = roll >= cd;

    window.showToast?.(`💪 Resistência Desesperada: ${roll} (${sucesso ? '✅ Sucesso!' : '❌ Falha'})`);
    appState.logAction(`💪 ${alvo.nome} usou Resistência Desesperada: ${roll} (${sucesso ? 'Sucesso' : 'Falha'})`);
    appState.enviarNotificacao(`💪 ${alvo.nome} usou Resistência Desesperada!`);

    appState.set('combat', combat);
}

function aplicarDano(id, dano) {
    const modoTreino = document.getElementById('modoTreino').checked;
    const combat = appState.get('combat');
    const alvo = combat.combatants.find(c => c.id === id);
    if (!alvo) return;

    if (modoTreino) {
        window.showToast?.(`🥊 Modo treino: ${alvo.nome} receberia ${dano} de dano.`);
        return;
    }

    alvo.hp = Math.max(0, alvo.hp - dano);
    appState.set('combat', combat);
    window.showToast?.(`💥 ${alvo.nome} sofreu ${dano} de dano.`);
    appState.logAction(`💥 ${alvo.nome} sofreu ${dano} de dano.`);
    renderList();
}

function updateCombHp(id, newVal) {
    combatEngine.updateHp(id, parseInt(newVal));
}

function removeCombatant(id) {
    combatEngine.removeCombatant(id);
}

function quickRoll(faces) {
    const roll = DiceEngine.roll(faces);
    const el = document.getElementById('quickResult');
    el.textContent = `🎲 d${faces}: ${roll.total}`;
    el.style.display = 'block';
    setTimeout(() => el.style.display = 'none', 3000);
}