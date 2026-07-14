import appState from '../../assets/js/app.js';
import { generateId, escapeHtml } from '../../core/utils/utils.js';

export function init() {
    document.getElementById('btnAddDomain').addEventListener('click', addDomain);
    window._removeDomain = removeDomain;
    renderList();
    appState.subscribe('domains', renderList);
}

function renderList() {
    document.getElementById('domainList').innerHTML = appState.get('domains').map(d => `
        <div class="card-item"><div class="card-info"><div class="card-name">${escapeHtml(d.nome)} <span class="tag purple">${d.tipo}</span></div><div class="card-sub">Regra: ${escapeHtml(d.regra)}</div><div style="font-size:0.75rem;">Condição: ${escapeHtml(d.condicao)} | Gimmick: ${escapeHtml(d.gimmick)}</div></div><button class="btn btn-red btn-sm" onclick="_removeDomain('${d.id}')">🗑️</button></div>
    `).join('') || '<div class="empty-state">Nenhum domínio.';
}

function addDomain() {
    const nome = document.getElementById('dNome').value.trim();
    if (!nome) return window.showToast?.('⚠️ Nome obrigatório');
    appState.set('domains', [...appState.get('domains'), {
        id: generateId(), nome,
        regra: document.getElementById('dRegra').value,
        condicao: document.getElementById('dCondicao').value,
        gimmick: document.getElementById('dGimmick').value,
        tipo: document.getElementById('dTipo').value
    }]);
    ['dNome', 'dRegra', 'dCondicao', 'dGimmick'].forEach(id => document.getElementById(id).value = '');
    window.showToast?.('🌌 Domínio registrado!');
}

function removeDomain(id) {
    appState.set('domains', appState.get('domains').filter(d => d.id !== id));
}