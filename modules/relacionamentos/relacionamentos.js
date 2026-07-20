// modules/relacionamentos/relacionamentos.js
import appState from '../../assets/js/app.js';
import { generateId, escapeHtml } from '../../core/utils/utils.js';

export function init() {
    if (!appState.get('relacionamentos')) appState.set('relacionamentos', []);
    renderRelacionamentos();
    appState.subscribe('relacionamentos', renderRelacionamentos);
    appState.subscribe('characters', () => {
        atualizarSelects();
        renderRelacionamentos();
    });

    document.getElementById('btnAddRelacionamento').addEventListener('click', addRelacionamento);
    atualizarSelects();
}

function atualizarSelects() {
    const chars = appState.get('characters') || [];
    const select1 = document.getElementById('relPersonagem1');
    const select2 = document.getElementById('relPersonagem2');
    const options = chars.map(c => `<option value="${c.id}">${escapeHtml(c.nome)}</option>`);
    select1.innerHTML = '<option value="">Personagem 1</option>' + options;
    select2.innerHTML = '<option value="">Personagem 2</option>' + options;
}

function addRelacionamento() {
    const id1 = document.getElementById('relPersonagem1').value;
    const id2 = document.getElementById('relPersonagem2').value;
    const nivel = parseInt(document.getElementById('relNivel').value);
    if (!id1 || !id2) return window.showToast?.('⚠️ Selecione dois personagens.');
    if (id1 === id2) return window.showToast?.('⚠️ Não pode ser o mesmo personagem.');

    const relacionamentos = appState.get('relacionamentos');
    const existing = relacionamentos.find(r => 
        (r.id1 === id1 && r.id2 === id2) || (r.id1 === id2 && r.id2 === id1)
    );
    if (existing) {
        existing.nivel = nivel;
    } else {
        relacionamentos.push({ id: generateId(), id1, id2, nivel });
    }
    appState.set('relacionamentos', relacionamentos);
    appState.logAction(`🤝 Relacionamento definido: ${getNome(id1)} ↔ ${getNome(id2)} (${nivel})`);
    window.showToast?.('✅ Relacionamento definido!');
}

function getNome(id) {
    const chars = appState.get('characters') || [];
    const c = chars.find(ch => ch.id === id);
    return c ? c.nome : 'Desconhecido';
}

function renderRelacionamentos() {
    const container = document.getElementById('relacionamentosList');
    const rels = appState.get('relacionamentos') || [];
    if (!rels.length) {
        container.innerHTML = '<p class="empty-state">Nenhum relacionamento definido.</p>';
        return;
    }
    const chars = appState.get('characters') || [];
    container.innerHTML = rels.map(r => {
        const n1 = chars.find(c => c.id === r.id1)?.nome || 'Desconhecido';
        const n2 = chars.find(c => c.id === r.id2)?.nome || 'Desconhecido';
        const nivelDesc = {
            '-2': 'Inimigo', '-1': 'Rival', '0': 'Neutro',
            '1': 'Conhecido', '2': 'Aliado', '3': 'Amigo',
            '4': 'Vínculo', '5': 'Lendário'
        }[r.nivel] || 'Neutro';
        return `
            <div style="background:var(--bg-2); padding:8px; border-radius:4px; margin-bottom:4px; display:flex; justify-content:space-between; align-items:center;">
                <span><strong>${escapeHtml(n1)}</strong> ↔ <strong>${escapeHtml(n2)}</strong> → ${escapeHtml(nivelDesc)} (${r.nivel})</span>
                <button class="btn btn-red btn-sm" onclick="window._removeRel('${r.id}')">🗑️</button>
            </div>
        `;
    }).join('');
    window._removeRel = (id) => {
        if (confirm('Remover este relacionamento?')) {
            const rels = appState.get('relacionamentos').filter(r => r.id !== id);
            appState.set('relacionamentos', rels);
            appState.logAction('🤝 Relacionamento removido.');
            renderRelacionamentos();
        }
    };
}