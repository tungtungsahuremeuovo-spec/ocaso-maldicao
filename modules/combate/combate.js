// modules/combate/combate.js
import appState from '../../assets/js/app.js';
import { generateId, escapeHtml } from '../../core/utils/utils.js';

let combatEngine;
let historico = [];
let acoesPreparadas = {};
let mestreInvisivel = false;
let cronometroInterval = null;
let tempoRestante = 0;
let acaoSelecionada = null;
let combatenteAtual = null;

function getPlayerCharacter() {
    return appState.get('characters').find(c => c.isPlayerCharacter) || null;
}

export function init() {
    const saved = appState.get('combat');
    if (saved && saved.historico) historico = saved.historico;
    renderHistorico();

    // Eventos principais
    document.getElementById('btnAddCombat').addEventListener('click', addCombatant);
    document.getElementById('btnRollAll').addEventListener('click', rollAll);
    document.getElementById('btnNextTurn').addEventListener('click', nextTurn);
    document.getElementById('btnBlackFlash').addEventListener('click', attemptBF);
    document.getElementById('btnClearCombat').addEventListener('click', clearCombat);
    document.getElementById('btnAplicarCond').addEventListener('click', aplicarCondicao);
    document.getElementById('btnFecharResultado').addEventListener('click', fecharResultado);
    document.getElementById('btnCancelarAcao').addEventListener('click', cancelarAcao);

    // Ações do painel
    document.querySelectorAll('[data-acao]').forEach(btn => {
        btn.addEventListener('click', () => {
            const acao = btn.dataset.acao;
            selecionarAcao(acao);
        });
    });

    // Mestre Invisível
    document.getElementById('btnMestreInvisivel')?.addEventListener('click', toggleMestreInvisivel);

    // Quick roll
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
        document.getElementById('turnoAtivo').textContent = 'Aguardando...';
        return;
    }

    const alvo = combat.combatants[combat.turnIndex];
    if (alvo) {
        document.getElementById('turnoAtivo').textContent = `🎯 Turno de: ${alvo.nome}`;
        combatenteAtual = alvo;
        // Inicia cronômetro automaticamente (opcional)
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

// ============================================================
// PAINEL DE AÇÕES
// ============================================================
function selecionarAcao(acao) {
    const combat = appState.get('combat');
    if (!combat || !combat.combatants.length) {
        return window.showToast?.('⚠️ Nenhum combate ativo.');
    }
    const alvo = combat.combatants[combat.turnIndex];
    if (!alvo) return window.showToast?.('⚠️ Nenhum combatente ativo.');

    acaoSelecionada = acao;
    const subPanel = document.getElementById('subAcaoPanel');
    const conteudo = document.getElementById('subAcaoConteudo');

    subPanel.style.display = 'block';
    document.getElementById('resultadoAcao').style.display = 'none';

    switch(acao) {
        case 'attack':
            conteudo.innerHTML = `
                <strong>⚔️ Atacar</strong>
                <div style="display:flex; gap:8px; margin-top:6px;">
                    <select id="ataqueTipo" style="flex:1;">
                        <option value="corpo">Corpo a corpo</option>
                        <option value="distancia">À distância</option>
                        <option value="tecnica">Técnica</option>
                    </select>
                    <button class="btn btn-gold" id="btnExecutarAtaque">⚔️ Executar</button>
                </div>
                <div style="font-size:0.8rem; color:var(--text-dim); margin-top:4px;">
                    Dano base: ${alvo.danoBase || '1d6'} + FOR/DES
                </div>
            `;
            document.getElementById('btnExecutarAtaque').addEventListener('click', () => executarAtaque(alvo));
            break;

        case 'defend':
            conteudo.innerHTML = `
                <strong>🛡️ Defender</strong>
                <p style="font-size:0.9rem; margin:4px 0;">+2 CA até o próximo turno.</p>
                <button class="btn btn-gold" id="btnExecutarDefesa">🛡️ Defender</button>
            `;
            document.getElementById('btnExecutarDefesa').addEventListener('click', () => executarDefesa(alvo));
            break;

        case 'dodge':
            conteudo.innerHTML = `
                <strong>💨 Esquivar</strong>
                <p style="font-size:0.9rem; margin:4px 0;">Teste de DES + BT. Sucesso anula dano.</p>
                <button class="btn btn-gold" id="btnExecutarEsquiva">💨 Esquivar</button>
            `;
            document.getElementById('btnExecutarEsquiva').addEventListener('click', () => executarEsquiva(alvo));
            break;

        case 'technique':
            const char = getPlayerCharacter();
            const tecnicas = char?.feiticos || ['Nenhuma técnica disponível'];
            conteudo.innerHTML = `
                <strong>✨ Técnica</strong>
                <select id="tecnicaSelect" style="width:100%; margin:4px 0;">
                    ${tecnicas.map(t => `<option value="${t.nome}">${t.nome} (${t.desc || ''})</option>`).join('')}
                </select>
                <button class="btn btn-gold" id="btnExecutarTecnica">✨ Usar</button>
            `;
            document.getElementById('btnExecutarTecnica').addEventListener('click', () => executarTecnica(alvo));
            break;

        case 'item':
            const itens = alvo.itens || ['Nenhum item'];
            conteudo.innerHTML = `
                <strong>🎒 Utilizar Item</strong>
                <select id="itemSelect" style="width:100%; margin:4px 0;">
                    ${itens.map(i => `<option value="${i.nome}">${i.nome} (${i.desc || ''})</option>`).join('')}
                </select>
                <button class="btn btn-gold" id="btnExecutarItem">🎒 Usar</button>
            `;
            document.getElementById('btnExecutarItem').addEventListener('click', () => executarItem(alvo));
            break;

        case 'domain':
            const dominio = alvo.dominio || { nome: 'Nenhum Domínio', desc: '' };
            conteudo.innerHTML = `
                <strong>🌌 Expandir Domínio</strong>
                <p style="font-size:0.9rem;"><strong>${dominio.nome || 'Nenhum'}</strong>: ${dominio.desc || ''}</p>
                <p style="font-size:0.8rem; color:var(--red);">Custo: 50 EA. Causa Exaustão Amaldiçoada.</p>
                <button class="btn btn-gold" id="btnExecutarDominio">🌌 Expandir</button>
            `;
            document.getElementById('btnExecutarDominio').addEventListener('click', () => executarDominio(alvo));
            break;

        case 'flee':
            conteudo.innerHTML = `
                <strong>🏃 Fugir</strong>
                <p style="font-size:0.9rem; margin:4px 0;">Teste de Atletismo CD 15.</p>
                <button class="btn btn-gold" id="btnExecutarFuga">🏃 Fugir</button>
            `;
            document.getElementById('btnExecutarFuga').addEventListener('click', () => executarFuga(alvo));
            break;

        default:
            subPanel.style.display = 'none';
    }
}

function cancelarAcao() {
    document.getElementById('subAcaoPanel').style.display = 'none';
    acaoSelecionada = null;
}

function fecharResultado() {
    document.getElementById('resultadoAcao').style.display = 'none';
    cancelarAcao();
}

function exibirResultado(texto, tipo = 'info') {
    const panel = document.getElementById('resultadoAcao');
    const conteudo = document.getElementById('resultadoAcaoConteudo');
    panel.style.display = 'block';
    conteudo.innerHTML = texto;
    panel.style.borderLeftColor = tipo === 'sucesso' ? 'var(--green)' : tipo === 'falha' ? 'var(--red)' : 'var(--gold)';
}

// ============================================================
// EXECUÇÃO DAS AÇÕES
// ============================================================
function executarAtaque(alvo) {
    const tipo = document.getElementById('ataqueTipo').value;
    const mod = alvo.forca || 0;
    const roll = Math.floor(Math.random() * 20) + 1 + mod;
    const critico = roll === 20;
    const acerto = roll >= 10; // CA base

    let resultado = `<strong>⚔️ Ataque (${tipo})</strong><br>Rolagem: ${roll} (FOR: ${mod})<br>`;
    if (critico) {
        resultado += `✅ <strong>CRÍTICO!</strong> Dano máximo!<br>`;
        const dano = (6 + mod) * 2;
        aplicarDano(alvo.id, dano, 'Ataque');
        resultado += `💥 Dano: ${dano}`;
        // Verifica Black Flash
        const bfRoll = Math.floor(Math.random() * 20) + 1 + mod;
        if (bfRoll >= 20) {
            resultado += `<br>⚡ <strong>BLACK FLASH!</strong> +1 Ponto de Sorte!`;
            const combat = appState.get('combat');
            combat.luckPoints = (combat.luckPoints || 0) + 1;
            appState.set('combat', combat);
        }
    } else if (acerto) {
        const dano = Math.floor(Math.random() * 6) + 1 + mod;
        aplicarDano(alvo.id, dano, 'Ataque');
        resultado += `✅ Acertou! Dano: ${dano}`;
    } else {
        resultado += `❌ Errou!`;
    }
    exibirResultado(resultado, critico ? 'sucesso' : acerto ? 'sucesso' : 'falha');
    registrarAcao(alvo.nome, `Atacou (${tipo}) - ${critico ? 'Crítico!' : acerto ? 'Acertou' : 'Errou'}`);
    cancelarAcao();
}

function executarDefesa(alvo) {
    alvo.defesaAtiva = true;
    const combat = appState.get('combat');
    appState.set('combat', combat);
    exibirResultado(`🛡️ ${alvo.nome} está defendendo (+2 CA até o próximo turno).`, 'sucesso');
    registrarAcao(alvo.nome, 'Defendeu');
    cancelarAcao();
}

function executarEsquiva(alvo) {
    const mod = alvo.destreza || 0;
    const roll = Math.floor(Math.random() * 20) + 1 + mod;
    const sucesso = roll >= 12;
    const resultado = `💨 Esquiva: ${roll} (DES: ${mod})<br>${sucesso ? '✅ Sucesso! Dano anulado.' : '❌ Falha!'}`;
    exibirResultado(resultado, sucesso ? 'sucesso' : 'falha');
    if (sucesso) {
        alvo.esquivou = true;
        const combat = appState.get('combat');
        appState.set('combat', combat);
    }
    registrarAcao(alvo.nome, `Esquivou - ${sucesso ? 'Sucesso' : 'Falha'}`);
    cancelarAcao();
}

function executarTecnica(alvo) {
    const select = document.getElementById('tecnicaSelect');
    const tecnica = select.value;
    const dano = Math.floor(Math.random() * 8) + 1 + (alvo.presenca || 0);
    aplicarDano(alvo.id, dano, `Técnica: ${tecnica}`);
    const resultado = `✨ ${tecnica} usada!<br>💥 Dano: ${dano}`;
    exibirResultado(resultado, 'sucesso');
    registrarAcao(alvo.nome, `Usou ${tecnica}`);
    cancelarAcao();
}

function executarItem(alvo) {
    const select = document.getElementById('itemSelect');
    const item = select.value;
    const cura = Math.floor(Math.random() * 8) + 4;
    alvo.hp = Math.min(alvo.hp + cura, alvo.hpMax);
    const combat = appState.get('combat');
    appState.set('combat', combat);
    const resultado = `🎒 ${item} usado!<br>❤️ Cura: ${cura} HP`;
    exibirResultado(resultado, 'sucesso');
    registrarAcao(alvo.nome, `Usou ${item}`);
    cancelarAcao();
}

function executarDominio(alvo) {
    if (alvo.ea < 50) {
        exibirResultado(`⚠️ EA insuficiente para Domínio (50 EA).`, 'falha');
        cancelarAcao();
        return;
    }
    alvo.ea -= 50;
    alvo.exaustao = (alvo.exaustao || 0) + 1;
    const combat = appState.get('combat');
    appState.set('combat', combat);
    const resultado = `🌌 Domínio expandido!<br>EA: -50<br>⚠️ Exaustão Amaldiçoada: Nível ${alvo.exaustao}`;
    exibirResultado(resultado, 'sucesso');
    registrarAcao(alvo.nome, 'Expandiu Domínio');
    cancelarAcao();
}

function executarFuga(alvo) {
    const mod = alvo.forca || 0;
    const roll = Math.floor(Math.random() * 20) + 1 + mod;
    const sucesso = roll >= 15;
    const resultado = `🏃 Fuga: ${roll} (FOR: ${mod})<br>${sucesso ? '✅ Fugiu do combate!' : '❌ Falhou!'}`;
    exibirResultado(resultado, sucesso ? 'sucesso' : 'falha');
    if (sucesso) {
        const combat = appState.get('combat');
        combat.combatants = combat.combatants.filter(c => c.id !== alvo.id);
        if (combat.turnIndex >= combat.combatants.length) combat.turnIndex = 0;
        appState.set('combat', combat);
    }
    registrarAcao(alvo.nome, `Tentou fugir - ${sucesso ? 'Sucesso' : 'Falha'}`);
    cancelarAcao();
}

// ============================================================
// FUNÇÕES DE COMBATE (mantidas)
// ============================================================
function addCombatant() {
    const nome = document.getElementById('combNome').value.trim();
    if (!nome) return window.showToast?.('⚠️ Nome obrigatório');

    const combat = appState.get('combat') || { combatants: [], turnIndex: 0 };
    combat.combatants.push({
        id: generateId(),
        nome,
        hp: +document.getElementById('combHp').value || 30,
        hpMax: +document.getElementById('combHpMax').value || 30,
        iniciativa: +document.getElementById('combInic').value || 10,
        reacaoGasta: false,
        derrotadoPor: null,
        condicoes: [],
        ea: 30,
        eaMax: 30,
        forca: 3,
        destreza: 3,
        presenca: 3,
        defesaAtiva: false,
        esquivou: false,
        danoBase: '1d6'
    });
    combat.combatants.sort((a, b) => b.iniciativa - a.iniciativa);
    appState.set('combat', combat);
    document.getElementById('combNome').value = '';
    window.showToast?.('⚔️ Combatente adicionado!');
}

function rollAll() {
    const combat = appState.get('combat');
    if (!combat) return;
    combat.combatants.forEach(c => {
        c.iniciativa = Math.floor(Math.random() * 20) + 1;
    });
    combat.combatants.sort((a, b) => b.iniciativa - a.iniciativa);
    appState.set('combat', combat);
    window.showToast?.('🎲 Iniciativas roladas!');
    registrarAcao('Mestre', 'Rolou novas iniciativas.');
}

function nextTurn() {
    const combat = appState.get('combat');
    if (!combat || !combat.combatants.length) return;

    combat.turnIndex = (combat.turnIndex + 1) % combat.combatants.length;
    combat.combatants.forEach(c => {
        c.reacaoGasta = false;
        c.defesaAtiva = false;
        c.esquivou = false;
        if (c.condicoes) {
            c.condicoes = c.condicoes.filter(cond => {
                cond.restante--;
                return cond.restante > 0;
            });
        }
    });
    combat.currentRound = (combat.currentRound || 0) + 1;
    appState.set('combat', combat);
    renderList();
    window.showToast?.(`▶️ Turno de: ${combat.combatants[combat.turnIndex].nome}`);
    registrarAcao(combat.combatants[combat.turnIndex].nome, 'Iniciou seu turno.');
}

function attemptBF() {
    const combat = appState.get('combat');
    if (!combat || !combat.combatants.length) return;
    const alvo = combat.combatants[combat.turnIndex];
    if (!alvo) return;
    const roll = Math.floor(Math.random() * 20) + 1 + (alvo.forca || 0);
    const success = roll >= 20;
    document.getElementById('bfResult').textContent = `⚡ Black Flash: ${roll} — ${success ? 'SUCESSO!' : 'Falha (CD 20)'}`;
    if (success) {
        combat.luckPoints = (combat.luckPoints || 0) + 1;
        appState.set('combat', combat);
        window.showToast?.('⚡ Black Flash! +1 Ponto de Sorte');
        registrarAcao(alvo.nome, 'Realizou Black Flash!');
    }
}

function clearCombat() {
    if (confirm('🗑️ Limpar todos os combatentes?')) {
        appState.set('combat', { combatants: [], turnIndex: 0, luckPoints: 0, jackpotUsed: false, historico: [] });
        historico = [];
        window.showToast?.('🗑️ Combate limpo.');
        renderHistorico();
    }
}

function aplicarCondicao() {
    const combat = appState.get('combat');
    if (!combat || !combat.combatants.length) return;
    const alvo = combat.combatants[combat.turnIndex];
    if (!alvo) return;
    const tipo = document.getElementById('condTipo').value;
    const duracao = parseInt(document.getElementById('condDuracao').value) || 1;
    alvo.condicoes = alvo.condicoes || [];
    alvo.condicoes.push({ nome: tipo, restante: duracao });
    appState.set('combat', combat);
    window.showToast?.(`🧪 ${alvo.nome} recebeu ${tipo} (${duracao} rodadas)`);
    registrarAcao(alvo.nome, `Recebeu condição ${tipo} (${duracao} rodadas)`);
}

function aplicarDano(id, dano, origem = '') {
    const combat = appState.get('combat');
    const alvo = combat.combatants.find(c => c.id === id);
    if (!alvo) return;
    const modoTreino = document.getElementById('modoTreino').checked;
    if (modoTreino) {
        window.showToast?.(`🥊 Modo treino: ${alvo.nome} receberia ${dano} de dano.`);
        return;
    }
    alvo.hp = Math.max(0, alvo.hp - dano);
    if (alvo.hp <= 0) {
        alvo.derrotadoPor = origem || 'desconhecido';
        window.showToast?.(`💀 ${alvo.nome} foi derrubado!`);
        registrarAcao(alvo.nome, `Foi derrubado por ${origem || 'desconhecido'}`);
    }
    appState.set('combat', combat);
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
    alvo.iniciativa = parseInt(newVal) || 0;
    combat.combatants.sort((a, b) => b.iniciativa - a.iniciativa);
    appState.set('combat', combat);
    renderList();
}

function updateCombHp(id, newVal) {
    const combat = appState.get('combat');
    const alvo = combat.combatants.find(c => c.id === id);
    if (!alvo) return;
    alvo.hp = parseInt(newVal) || 0;
    appState.set('combat', combat);
}

function removeCombatant(id) {
    const combat = appState.get('combat');
    combat.combatants = combat.combatants.filter(c => c.id !== id);
    if (combat.turnIndex >= combat.combatants.length) combat.turnIndex = 0;
    appState.set('combat', combat);
    renderList();
}

function toggleMestreInvisivel() {
    mestreInvisivel = !mestreInvisivel;
    document.getElementById('mestreInvisivelStatus').textContent = 
        mestreInvisivel ? '🕵️ Ativo' : '👁️ Visível';
    window.showToast?.(`🕵️ Modo Mestre ${mestreInvisivel ? 'Ativo' : 'Desativado'}`);
}

function quickRoll(faces) {
    const roll = Math.floor(Math.random() * faces) + 1;
    const el = document.getElementById('quickResult');
    el.textContent = `🎲 d${faces}: ${roll}`;
    el.style.display = 'block';
    setTimeout(() => el.style.display = 'none', 3000);
}

function registrarAcao(nome, acao) {
    const combat = appState.get('combat');
    if (!combat) return;
    if (!historico.length || historico[historico.length-1].rodada !== (combat.currentRound || 0)) {
        historico.push({ rodada: combat.currentRound || 0, acoes: [] });
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

// ============================================================
// CRONÔMETRO (opcional)
// ============================================================
// (mantido igual ao anterior)