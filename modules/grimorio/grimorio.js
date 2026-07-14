import appState from '../../assets/js/app.js';
import { generateId, escapeHtml } from '../../core/utils/utils.js';
import { SPELL_COSTS } from '../../core/constants/constants.js';

export function init() {
    document.getElementById('spNivel').addEventListener('change', updatePoints);
    document.getElementById('btnAddSpell').addEventListener('click', addSpell);
    window._removeSpell = removeSpell;
    updatePoints();
    renderList();
    appState.subscribe('spells', renderList);
}

function updatePoints() {
    const lv = parseInt(document.getElementById('spNivel').value);
    const pts = SPELL_COSTS[lv].pontos;
    document.getElementById('spPoints').textContent = `Orçamento: ${pts} pontos | Custo: ${SPELL_COSTS[lv].ea} EA | CD: ${SPELL_COSTS[lv].cd} + BT`;
}

function renderList() {
    document.getElementById('spellList').innerHTML = appState.get('spells').map(s => `
        <div class="card-item"><div class="card-info"><div class="card-name">${escapeHtml(s.nome)} <span class="tag">Nv.${s.nivel}</span></div><div class="card-sub">${escapeHtml(s.efeitos)}</div><div style="font-size:0.75rem;">Custo: ${s.custoEA} EA | CD: ${s.cd}</div></div><button class="btn btn-red btn-sm" onclick="_removeSpell('${s.id}')">🗑️</button></div>
    `).join('') || '<div class="empty-state">Nenhum feitiço.';
}

function addSpell() {
    const nome = document.getElementById('spNome').value.trim();
    if (!nome) return window.showToast?.('⚠️ Nome obrigatório');
    const lv = parseInt(document.getElementById('spNivel').value);
    const ptsMax = SPELL_COSTS[lv].pontos;
    const effs = [];
    let used = 0;
    [document.getElementById('spEff1'), document.getElementById('spEff2')].forEach(sel => {
        if (+sel.value > 0) { used += +sel.value;
            effs.push(sel.options[sel.selectedIndex].text.split(' (')[0]); }
    });
    if (used > ptsMax) return window.showToast?.(`⚠️ Estourou o orçamento! ${used}/${ptsMax} pontos`);
    appState.set('spells', [...appState.get('spells'), {
        id: generateId(), nome, nivel: lv,
        efeitos: effs.join(', ') || 'Efeito básico',
        custoEA: SPELL_COSTS[lv].ea, cd: SPELL_COSTS[lv].cd
    }]);
    document.getElementById('spNome').value = '';
    window.showToast?.('📜 Feitiço criado!');
}

function removeSpell(id) {
    appState.set('spells', appState.get('spells').filter(s => s.id !== id));
}