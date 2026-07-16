// modules/npc/npc.js
import appState from '../../assets/js/app.js';
import { generateId, escapeHtml } from '../../core/utils/utils.js';

export function init() {
    if (!appState.get('npcs')) appState.set('npcs', []);
    renderNPCs();
    appState.subscribe('npcs', renderNPCs);

    document.getElementById('btnAddNPC').addEventListener('click', addNPC);
    document.getElementById('npcNome').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addNPC();
    });
}

function addNPC() {
    const nome = document.getElementById('npcNome').value.trim();
    if (!nome) return window.showToast?.('⚠️ Nome obrigatório');
    const tipo = document.getElementById('npcTipo').value;
    const grau = parseInt(document.getElementById('npcGrau').value) || 4;
    const voz = document.getElementById('npcVoz').value.trim() || 'Não definida';

    const npcs = appState.get('npcs');
    npcs.push({
        id: generateId(),
        nome,
        tipo,
        grau,
        voz,
        hp: 20 + grau * 5,
        hpMax: 20 + grau * 5,
        ea: 20 + grau * 5,
        eaMax: 20 + grau * 5,
        createdAt: Date.now()
    });
    appState.set('npcs', npcs);
    appState.logAction(`👤 NPC "${nome}" criado.`);
    document.getElementById('npcNome').value = '';
    document.getElementById('npcVoz').value = '';
    window.showToast?.('👤 NPC adicionado!');
}

function renderNPCs() {
    const npcs = appState.get('npcs') || [];
    const container = document.getElementById('npcList');
    if (!npcs.length) {
        container.innerHTML = '<div class="empty-state">Nenhum NPC cadastrado.</div>';
        return;
    }
    container.innerHTML = npcs.map(n => `
        <div class="card-item">
            <div class="card-info">
                <div class="card-name">${escapeHtml(n.nome)} <span class="tag blue">${escapeHtml(n.tipo)}</span> <span class="tag">${n.grau}º Grau</span></div>
                <div style="font-size:0.8rem; color:var(--text-dim);">Voz: ${escapeHtml(n.voz)}</div>
                <div>HP: ${n.hp}/${n.hpMax} | EA: ${n.ea}/${n.eaMax}</div>
            </div>
            <div class="card-actions">
                <button class="btn btn-sm" onclick="window._editNPC('${n.id}')">✏️</button>
                <button class="btn btn-red btn-sm" onclick="window._removeNPC('${n.id}')">🗑️</button>
            </div>
        </div>
    `).join('');

    window._removeNPC = (id) => {
        if (confirm('Remover NPC?')) {
            const npcs = appState.get('npcs').filter(n => n.id !== id);
            appState.set('npcs', npcs);
            appState.logAction(`🗑️ NPC removido.`);
        }
    };
    window._editNPC = (id) => {
        const npcs = appState.get('npcs');
        const n = npcs.find(n => n.id === id);
        if (!n) return;
        const novoNome = prompt('Novo nome:', n.nome);
        if (novoNome) {
            n.nome = novoNome;
            const novoGrau = parseInt(prompt('Novo grau:', n.grau)) || n.grau;
            n.grau = novoGrau;
            n.hp = 20 + novoGrau * 5;
            n.hpMax = 20 + novoGrau * 5;
            n.ea = 20 + novoGrau * 5;
            n.eaMax = 20 + novoGrau * 5;
            n.voz = prompt('Nova voz:', n.voz) || n.voz;
            appState.set('npcs', npcs);
            appState.logAction(`✏️ NPC "${n.nome}" editado.`);
            window.showToast?.('✅ NPC atualizado!');
        }
    };
}