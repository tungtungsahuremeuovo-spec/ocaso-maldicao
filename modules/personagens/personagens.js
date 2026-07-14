import appState from '../../assets/js/app.js';
import { generateId, escapeHtml } from '../../core/utils/utils.js';
import CombatEngine from '../../core/engine/combatEngine.js';

let combatEngine;

export function init() {
    combatEngine = new CombatEngine(appState);
    document.getElementById('btnAddChar').addEventListener('click', addCharacter);
    window._renderChars = renderList;
    window._removeChar = removeCharacter;
    window._updateCharHp = updateCharHp;
    window._updateCharEa = updateCharEa;
    window._sendToCombat = sendToCombat;
    renderList();
    appState.subscribe('characters', renderList);
}

function renderList() {
    const search = document.getElementById('charSearch')?.value.toLowerCase() || '';
    const chars = appState.get('characters').filter(c => c.nome.toLowerCase().includes(search));
    document.getElementById('charCount').textContent = chars.length;
    document.getElementById('charList').innerHTML = chars.map(c => {
        const hpPct = (c.hp / c.hpMax) * 100;
        let cls = hpPct < 30 ? 'red' : hpPct < 60 ? 'gold' : 'green';
        return `
        <div class="card-item">
            <div class="card-info">
                <div class="card-name">${escapeHtml(c.nome)} <span class="tag">${c.grau}º</span> <span class="tag purple">${c.estilo}</span></div>
                <div class="card-sub">${escapeHtml(c.classe)} | ${escapeHtml(c.tecnica || 'Sem técnica')} | Dano: ${c.danoBase || '1d6'}</div>
                ${c.origem ? `<span class="tag green">${c.origem}</span>` : ''}
                <div style="display:flex;align-items:center;gap:6px;margin-top:4px;">
                    <span style="font-size:0.75rem;">HP:</span>
                    <input type="number" value="${c.hp}" style="width:48px;padding:3px;" onchange="_updateCharHp('${c.id}', this.value)">
                    <span style="font-size:0.75rem;">/ ${c.hpMax}</span>
                    <div class="bar-bg" style="flex:1;"><div class="bar-fill ${cls}" style="width:${hpPct}%;"></div></div>
                </div>
                <div style="display:flex;align-items:center;gap:6px;margin-top:2px;">
                    <span style="font-size:0.75rem;">EA:</span>
                    <input type="number" value="${c.ea}" style="width:48px;padding:3px;" onchange="_updateCharEa('${c.id}', this.value)">
                    <span style="font-size:0.75rem;">/ ${c.eaMax}</span>
                </div>
            </div>
            <div class="card-actions">
                <button class="btn btn-sm" onclick="_sendToCombat('${escapeHtml(c.nome).replace(/'/g, "\\'")}', ${c.hp}, ${c.hpMax}, ${c.DES || 0})" title="Enviar ao Combate">⚔️</button>
                <button class="btn btn-red btn-sm" onclick="_removeChar('${c.id}')" title="Remover">🗑️</button>
            </div>
        </div>`;
    }).join('') || '<div class="empty-state">Nenhum feiticeiro registrado.</div>';
}

function addCharacter() {
    const nome = document.getElementById('cNome').value.trim();
    if (!nome) return window.showToast?.('⚠️ Nome obrigatório');
    const char = {
        id: generateId(),
        nome,
        classe: document.getElementById('cClasse').value,
        estilo: document.getElementById('cEstilo').value,
        origem: document.getElementById('cOrigem').value,
        grau: document.getElementById('cGrau').value,
        FOR: +document.getElementById('cFOR').value,
        DES: +document.getElementById('cDES').value,
        CON: +document.getElementById('cCON').value,
        INT: +document.getElementById('cINT').value,
        SAB: +document.getElementById('cSAB').value,
        PRE: +document.getElementById('cPRE').value,
        hpMax: +document.getElementById('cHpMax').value,
        hp: +document.getElementById('cHp').value,
        eaMax: +document.getElementById('cEaMax').value,
        ea: +document.getElementById('cEa').value,
        tecnica: document.getElementById('cTecnica').value,
        danoBase: document.getElementById('cDanoBase').value,
        pericias: document.getElementById('cPericias').value,
        cicatrizes: document.getElementById('cCicatrizes').value,
        ambicao: document.getElementById('cAmbicao').value,
        notas: document.getElementById('cNotas').value
    };
    appState.set('characters', [...appState.get('characters'), char]);
    renderList();
    window.showToast?.('✅ Feiticeiro adicionado!');
}

function removeCharacter(id) {
    appState.set('characters', appState.get('characters').filter(c => c.id !== id));
    renderList();
}

function updateCharHp(id, newVal) {
    const chars = appState.get('characters').map(c => {
        if (c.id === id) c.hp = Math.max(0, Math.min(c.hpMax, +newVal || 0));
        return c;
    });
    appState.set('characters', chars);
}

function updateCharEa(id, newVal) {
    const chars = appState.get('characters').map(c => {
        if (c.id === id) c.ea = Math.max(0, Math.min(c.eaMax, +newVal || 0));
        return c;
    });
    appState.set('characters', chars);
}

function sendToCombat(nome, hp, hpMax, inicMod) {
    const roll = Math.floor(Math.random() * 20) + 1 + inicMod;
    combatEngine.addCombatant({
        id: generateId(),
        nome,
        hp,
        hpMax,
        iniciativa: roll
    });
    window.showToast?.(`⚔️ ${nome} entrou no combate! (Iniciativa: ${roll})`);
    location.hash = 'combate';
}