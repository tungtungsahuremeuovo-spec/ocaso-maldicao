// modules/combate/combate.js
import appState from '../../assets/js/app.js';
import CombatEngine from '../../core/engine/combatEngine.js';
import DiceEngine from '../../core/engine/diceEngine.js';
import { generateId, escapeHtml } from '../../core/utils/utils.js';

let combatEngine;
let historico = [];
let acoesPreparadas = {};
let mestreInvisivel = false;
let cronometroInterval = null;
let tempoRestante = 0;

function getPlayerCharacter() {
    return appState.get('characters').find(c => c.isPlayerCharacter) || null;
}

export function init() {
    combatEngine = new CombatEngine(appState);

    const saved = appState.get('combat');
    if (saved && saved.historico) historico = saved.historico;
    renderHistorico();

    document.getElementById('btnAddCombat').addEventListener('click', addCombatant);
    document.getElementById('btnRollAll').addEventListener('click', rollAll);
    document.getElementById('btnNextTurn').addEventListener('click', nextTurn);
    document.getElementById('btnBlackFlash').addEventListener('click', attemptBF);
    document.getElementById('btnClearCombat').addEventListener('click', clearCombat);
    document.getElementById('btnAplicarCond').addEventListener('click', aplicarCondicao);
    document.getElementById('btnResistDesesperada').addEventListener('click', resistenciaDesesperada);
    document.getElementById('btnFugir').addEventListener('click', fugirCombate);
    document.getElementById('btnExportCombate').addEventListener('click', exportarCombate);
    document.getElementById('btnImportCombate').addEventListener('click', importarCombate);
    document.getElementById('btnAcaoPreparada').addEventListener('click', definirAcaoPreparada);
    document.getElementById('btnMestreInvisivel').addEventListener('click', toggleMestreInvisivel);

    // Cronômetro
    document.getElementById('btnIniciarCronometro').addEventListener('click', iniciarCronometro);
    document.getElementById('btnPararCronometro').addEventListener('click', pararCronometro);

    window._quickRoll = quickRoll;
    window._updateCombHp = updateCombHp;
    window._removeComb = removeCombatant;
    window._aplicarDano = aplicarDano;
    window._editIniciativa = editIniciativa;
    window._toggleReacao = toggleReacao;

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
        const reacaoChecked = c.reacaoGasta ? 'checked' : '';
        const derrubadoPor = c.derrotadoPor ? ` (derrubado por ${escapeHtml(c.derrotadoPor)})` : '';

        return `
        <div class="initiative-item ${active ? 'active-turn' : ''}" data-id="${c.id}">
            <div style="display:flex;align-items:center;gap:6px;">
                <input type="number" value="${c.iniciativa}" style="width:40px;padding:2px;" 
                       onchange="_editIniciativa('${c.id}', this.value)" title="Editar iniciativa">
                <span class="init-order">${c.iniciativa}</span>
            </div>
            <div style="flex:1;">
                <strong>${escapeHtml(c.nome)}</strong> ${active ? '👈' : ''}
                ${derrubadoPor}
                ${conds ? `<br><span style="font-size:0.75rem;">${conds}</span>` : ''}
                <div style="display:flex;align-items:center;gap:5px;margin-top:4px;">
                    <input type="number" value="${c.hp}" style="width:48px;padding:3px;" onchange="_updateCombHp('${c.id}', this.value)">
                    <span style="font-size:0.75rem;">/ ${c.hpMax}</span>
                    <div class="bar-bg" style="flex:1;"><div class="bar-fill ${cls}" style="width:${hpPct}%;"></div></div>
                </div>
                <div style="margin-top:2px; font-size:0.7rem;">
                    <label><input type="checkbox" class="reacao-check" data-id="${c.id}" ${reacaoChecked} 
                                  onchange="window._toggleReacao('${c.id}', this.checked)"> Reação gasta</label>
                </div>
            </div>
            <button class="btn btn-red btn-sm" onclick="_removeComb('${c.id}')">🗑️</button>
        </div>`;
    }).join('');

    document.querySelectorAll('.reacao-check').forEach(cb => {
        cb.addEventListener('change', (e) => {
            const id = e.target.dataset.id;
            const checked = e.target.checked;
            toggleReacao(id, checked);
        });
    });
}

function addCombatant() {
    const nome = document.getElementById('combNome').value.trim();
    if (!nome) return window.showToast?.('⚠️ Nome obrigatório');

    combatEngine.addCombatant({
        id: generateId(),
        nome,
        hp: +document.getElementById('combHp').value || 30,
        hpMax: +document.getElementById('combHpMax').value || 30,
        iniciativa: +document.getElementById('combInic').value || 10,
        reacaoGasta: false,
        derrotadoPor: null
    });

    document.getElementById('combNome').value = '';
    window.showToast?.('⚔️ Combatente adicionado!');
    appState.enviarNotificacao(`⚔️ ${nome} entrou em combate.`);
}

function rollAll() {
    combatEngine.rollAllInitiatives();
    window.showToast?.('🎲 Iniciativas roladas!');
    registrarAcao('Mestre', 'Rolou novas iniciativas.');
}

function nextTurn() {
    pararCronometro();
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
            c.reacaoGasta = false;
            c.fluxoAtivo = false;
        });
        delete acoesPreparadas[current.id];
        appState.set('combat', combat);
        window.showToast?.(`▶️ Turno de: ${current.nome}`);
        appState.enviarNotificacao(`▶️ Turno de ${current.nome}.`);
        registrarAcao(current.nome, 'Iniciou seu turno.');
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
            registrarAcao(char.nome, 'Realizou Black Flash!');
            window._sendDiscord?.(`⚡ Black Flash de ${char.nome}!`);
        }
    }
}

function clearCombat() {
    if (confirm('🗑️ Limpar todos os combatentes?')) {
        combatEngine.clearCombat();
        historico = [];
        appState.set('combat', { ...appState.get('combat'), historico });
        window.showToast?.('🗑️ Combate limpo.');
        appState.enviarNotificacao('🗑️ Combate foi limpo pelo mestre.');
        renderHistorico();
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
    piscarElemento(alvo.id);
    registrarAcao(alvo.nome, `Recebeu condição ${tipo} (${duracao} rodadas).`);
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

    const atributo = prompt('Qual atributo para o teste? (Fortitude, Reflexos ou Vontade)', 'Vontade');
    if (!atributo) return;

    const mod = parseInt(prompt(`Qual o modificador de ${atributo}? (ex: +2, -1)`, '0')) || 0;
    const roll = Math.floor(Math.random() * 20) + 1 + mod;
    const cd = 15;
    const sucesso = roll >= cd;

    alvo.ea -= 5;
    window.showToast?.(`💪 Resistência Desesperada (${atributo}): ${roll} (${sucesso ? '✅ Sucesso!' : '❌ Falha'})`);
    appState.logAction(`💪 ${alvo.nome} usou Resistência Desesperada (${atributo}): ${roll} (${sucesso ? 'Sucesso' : 'Falha'})`);
    appState.enviarNotificacao(`💪 ${alvo.nome} usou Resistência Desesperada!`);
    piscarElemento(alvo.id);
    appState.set('combat', combat);
}

function fugirCombate() {
    const combat = appState.get('combat');
    if (!combat || !combat.combatants.length) {
        return window.showToast?.('⚠️ Nenhum combatente em combate.');
    }

    const alvo = combat.combatants[combat.turnIndex];
    if (!alvo) return window.showToast?.('⚠️ Nenhum combatente ativo.');

    const mod = parseInt(prompt('Modificador de Atletismo do combatente:', '0')) || 0;
    const roll = Math.floor(Math.random() * 20) + 1 + mod;
    const cd = 15;
    const sucesso = roll >= cd;

    if (sucesso) {
        combat.combatants = combat.combatants.filter(c => c.id !== alvo.id);
        if (combat.turnIndex >= combat.combatants.length) combat.turnIndex = 0;
        window.showToast?.(`🏃 ${alvo.nome} fugiu do combate! (${roll})`);
        appState.logAction(`🏃 ${alvo.nome} fugiu do combate (Atletismo ${roll}).`);
        appState.enviarNotificacao(`🏃 ${alvo.nome} fugiu do combate!`);
        registrarAcao(alvo.nome, 'Fugiu do combate.');
        appState.set('combat', combat);
    } else {
        window.showToast?.(`❌ ${alvo.nome} falhou em fugir (${roll} < CD 15)`);
        piscarElemento(alvo.id);
    }
}

function aplicarDano(id, dano, agressor = null) {
    const modoTreino = document.getElementById('modoTreino').checked;
    const combat = appState.get('combat');
    const alvo = combat.combatants.find(c => c.id === id);
    if (!alvo) return;

    if (modoTreino) {
        window.showToast?.(`🥊 Modo treino: ${alvo.nome} receberia ${dano} de dano.`);
        return;
    }

    alvo.hp = Math.max(0, alvo.hp - dano);
    piscarElemento(id);

    if (alvo.hp <= 0 && agressor) {
        alvo.derrotadoPor = agressor;
        window.showToast?.(`💀 ${alvo.nome} foi derrubado por ${agressor}!`);
        appState.logAction(`💀 ${alvo.nome} foi derrubado por ${agressor}.`);
        appState.enviarNotificacao(`💀 ${alvo.nome} foi derrubado por ${agressor}!`);
        registrarAcao(agressor, `Derrubou ${alvo.nome}.`);
    }

    appState.set('combat', combat);
    window.showToast?.(`💥 ${alvo.nome} sofreu ${dano} de dano.`);
    renderList();
}

function toggleReacao(id, checked) {
    const combat = appState.get('combat');
    const alvo = combat.combatants.find(c => c.id === id);
    if (!alvo) return;
    alvo.reacaoGasta = checked;
    appState.set('combat', combat);
}

function editIniciativa(id, newVal) {
    const combat = appState.get('combat');
    const alvo = combat.combatants.find(c => c.id === id);
    if (!alvo) return;
    const valor = parseInt(newVal);
    if (isNaN(valor)) return;
    alvo.iniciativa = valor;
    combat.combatants.sort((a, b) => b.iniciativa - a.iniciativa);
    appState.set('combat', combat);
    renderList();
}

function registrarAcao(nome, acao) {
    const combat = appState.get('combat');
    if (!combat) return;
    if (!historico.length || historico[historico.length-1].rodada !== combat.turnIndex) {
        historico.push({ rodada: combat.turnIndex, acoes: [] });
    }
    const ultima = historico[historico.length-1];
    ultima.acoes.push({ nome, acao, timestamp: Date.now() });
    if (historico.length > 50) historico.shift();
    const data = appState.get('combat');
    data.historico = historico;
    appState.set('combat', data);
    renderHistorico();
}

function renderHistorico() {
    const container = document.getElementById('historicoRodadas');
    if (!historico.length) {
        container.innerHTML = '<p class="empty-state">Nenhuma rodada registrada.</p>';
        return;
    }
    const html = historico.slice().reverse().map(entry => {
        const rodada = entry.rodada + 1;
        const acoes = entry.acoes.map(a => 
            `<span>${escapeHtml(a.nome)}: ${escapeHtml(a.acao)}</span>`
        ).join(' • ');
        return `<div style="border-bottom:1px solid var(--border);padding:2px 0;">
            <strong>Rodada ${rodada}</strong>: ${acoes}
        </div>`;
    }).join('');
    container.innerHTML = html;
}

function exportarCombate() {
    const combat = appState.get('combat');
    if (!combat) return window.showToast?.('⚠️ Nenhum combate para exportar.');
    const data = JSON.stringify(combat, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `combate_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    window.showToast?.('📤 Combate exportado!');
}

function importarCombate() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target.result);
                if (!data.combatants) throw new Error('Dados inválidos');
                appState.set('combat', data);
                window.showToast?.('📥 Combate importado!');
                renderList();
                renderHistorico();
            } catch (err) {
                window.showToast?.('❌ Arquivo inválido.');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function definirAcaoPreparada() {
    const combat = appState.get('combat');
    const alvo = combat.combatants[combat.turnIndex];
    if (!alvo) return window.showToast?.('⚠️ Nenhum combatente ativo.');

    const gatilho = prompt('Gatilho (ex: "quando inimigo se mover"):', '');
    if (!gatilho) return;
    const acao = prompt('Ação preparada (ex: "atacar"):', '');
    if (!acao) return;

    acoesPreparadas[alvo.id] = { gatilho, acao, alvo: alvo.id };
    window.showToast?.(`✅ ${alvo.nome} preparou ação: "${acao}" se "${gatilho}"`);
    appState.logAction(`⚔️ ${alvo.nome} preparou ação: ${acao} (gatilho: ${gatilho})`);
}

function toggleMestreInvisivel() {
    mestreInvisivel = !mestreInvisivel;
    document.getElementById('mestreInvisivelStatus').textContent = 
        mestreInvisivel ? '🕵️ Ativo' : '👁️ Visível';
    window.showToast?.(`🕵️ Modo Mestre ${mestreInvisivel ? 'Ativo' : 'Desativado'}`);
}

function piscarElemento(id) {
    const items = document.querySelectorAll('.initiative-item');
    const target = Array.from(items).find(el => el.dataset.id === id);
    if (!target) return;
    target.style.transition = 'background 0.3s';
    target.style.background = '#ff444466';
    setTimeout(() => {
        target.style.background = '';
    }, 1000);
}

function updateCombHp(id, newVal) {
    combatEngine.updateHp(id, parseInt(newVal));
}

function removeCombatant(id) {
    combatEngine.removeCombatant(id);
    const combat = appState.get('combat');
    if (combat && combat.historico) {
        historico = combat.historico;
        renderHistorico();
    }
}

function quickRoll(faces) {
    const roll = Math.floor(Math.random() * faces) + 1;
    const el = document.getElementById('quickResult');
    if (mestreInvisivel && appState.getRole() === 'master') {
        el.textContent = `🎲 d${faces}: [OCULTO]`;
        el.style.color = 'var(--text-dim)';
    } else {
        el.textContent = `🎲 d${faces}: ${roll}`;
        el.style.color = 'var(--gold-light)';
    }
    el.style.display = 'block';
    setTimeout(() => el.style.display = 'none', 3000);
    return roll;
}

// ============================================================
// ⏳ CRONÔMETRO
// ============================================================
function iniciarCronometro() {
    if (cronometroInterval) pararCronometro();
    tempoRestante = 30;
    document.getElementById('cronometroDisplay').textContent = tempoRestante;
    document.getElementById('btnIniciarCronometro').style.display = 'none';
    document.getElementById('btnPararCronometro').style.display = '';
    cronometroInterval = setInterval(() => {
        tempoRestante--;
        document.getElementById('cronometroDisplay').textContent = tempoRestante;
        if (tempoRestante <= 0) {
            pararCronometro();
            window.showToast?.('⏰ Tempo esgotado! Turno automaticamente avançado.');
            playSound('critical');
            document.getElementById('btnNextTurn')?.click();
        }
    }, 1000);
}

function pararCronometro() {
    clearInterval(cronometroInterval);
    cronometroInterval = null;
    document.getElementById('cronometroDisplay').textContent = '--';
    document.getElementById('btnIniciarCronometro').style.display = '';
    document.getElementById('btnPararCronometro').style.display = 'none';
}

function playSound(type) {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        if (type === 'critical') {
            osc.frequency.value = 1000;
            gain.gain.value = 0.3;
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.15);
        }
    } catch(e) { /* silencioso */ }
}