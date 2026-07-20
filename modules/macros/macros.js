// modules/macros/macros.js
import appState from '../../assets/js/app.js';
import { generateId, escapeHtml } from '../../core/utils/utils.js';

export function init() {
    if (!appState.get('macros')) appState.set('macros', []);
    renderMacros();
    appState.subscribe('macros', renderMacros);

    document.getElementById('btnAddMacro').addEventListener('click', addMacro);
    document.getElementById('macroNome').addEventListener('keypress', (e) => e.key === 'Enter' && addMacro());
    document.getElementById('macroFormula').addEventListener('keypress', (e) => e.key === 'Enter' && addMacro());
}

function addMacro() {
    const nome = document.getElementById('macroNome').value.trim();
    const formula = document.getElementById('macroFormula').value.trim();
    if (!nome || !formula) return window.showToast?.('⚠️ Preencha nome e fórmula.');
    const macros = appState.get('macros');
    macros.push({ id: generateId(), nome, formula });
    appState.set('macros', macros);
    appState.logAction(`🎲 Macro "${nome}" criada.`);
    document.getElementById('macroNome').value = '';
    document.getElementById('macroFormula').value = '';
    window.showToast?.('✅ Macro salva!');
}

function renderMacros() {
    const container = document.getElementById('macrosList');
    const macros = appState.get('macros') || [];
    if (!macros.length) {
        container.innerHTML = '<p class="empty-state">Nenhuma macro salva.</p>';
        return;
    }
    container.innerHTML = macros.map(m => `
        <div style="background:var(--bg-2); padding:8px; border-radius:4px; display:flex; justify-content:space-between; align-items:center;">
            <span><strong>${escapeHtml(m.nome)}</strong> → ${escapeHtml(m.formula)}</span>
            <div>
                <button class="btn btn-sm" onclick="window._rollMacro('${m.id}')">🎲 Rolar</button>
                <button class="btn btn-red btn-sm" onclick="window._removeMacro('${m.id}')">🗑️</button>
            </div>
        </div>
    `).join('');
    window._rollMacro = (id) => {
        const macro = appState.get('macros').find(m => m.id === id);
        if (!macro) return;
        try {
            const roll = rollDice(macro.formula);
            window.showToast?.(`🎲 ${macro.nome}: ${roll}`);
            appState.logAction(`🎲 ${macro.nome}: ${roll}`);
        } catch(e) {
            window.showToast?.('❌ Fórmula inválida.');
        }
    };
    window._removeMacro = (id) => {
        const macros = appState.get('macros').filter(m => m.id !== id);
        appState.set('macros', macros);
        window.showToast?.('🗑️ Macro removida.');
    };
}

function rollDice(formula) {
    const parts = formula.match(/(\d*)d(\d+)([+-]\d+)?/);
    if (!parts) throw new Error('Formato inválido');
    const num = parseInt(parts[1]) || 1;
    const faces = parseInt(parts[2]);
    const mod = parseInt(parts[3] || '0');
    let total = 0;
    for (let i=0; i<num; i++) total += Math.floor(Math.random() * faces) + 1;
    total += mod;
    return total;
}