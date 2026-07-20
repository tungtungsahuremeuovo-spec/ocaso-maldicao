// modules/loot/loot.js
import appState from '../../assets/js/app.js';
import { escapeHtml } from '../../core/utils/utils.js';

const itensPorGrau = {
    '4': ['Poção de Cura', 'Moedas (2d10)', 'Ferramenta Amaldiçoada Menor'],
    '3': ['Poção de Cura Maior', 'Moedas (3d10)', 'Ferramenta Amaldiçoada Média', 'Pergaminho de Nível 1'],
    '2': ['Elixir de EA', 'Moedas (5d10)', 'Ferramenta Amaldiçoada Avançada', 'Pergaminho de Nível 2', 'Relíquia Menor'],
    '1': ['Poção de Cura Lendária', 'Moedas (8d10)', 'Relíquia Média', 'Pergaminho de Nível 3', 'Item Raro'],
    'E': ['Relíquia Lendária', 'Moedas (15d10)', 'Pergaminho de Nível 4', 'Talismã de Retorno', 'Artefato de Domínio']
};

export function init() {
    document.getElementById('btnGerarLoot').addEventListener('click', gerarLoot);
    document.getElementById('btnDistribuirLoot').addEventListener('click', distribuirLoot);
}

function gerarLoot() {
    const grau = document.getElementById('lootGrau').value;
    const itens = itensPorGrau[grau] || itensPorGrau['4'];
    const qtd = Math.floor(Math.random() * 2) + 2;
    const selecionados = [];
    for (let i=0; i<qtd; i++) {
        const item = itens[Math.floor(Math.random() * itens.length)];
        if (item.includes('Moedas')) {
            const match = item.match(/\((\d+)d(\d+)\)/);
            if (match) {
                const num = parseInt(match[1]);
                const faces = parseInt(match[2]);
                let total = 0;
                for (let j=0; j<num; j++) total += Math.floor(Math.random() * faces) + 1;
                selecionados.push(`${item.replace(/\(.*\)/, '').trim()}: ${total} moedas`);
            } else {
                selecionados.push(item);
            }
        } else {
            selecionados.push(item);
        }
    }
    const html = `<h3>🎁 Loot Gerado (${grau}º Grau)</h3><ul>${selecionados.map(i => `<li>${escapeHtml(i)}</li>`).join('')}</ul>`;
    document.getElementById('lootResultado').innerHTML = html;
    appState.logAction(`💎 Loot gerado para ${grau}º Grau: ${selecionados.join(', ')}`);
}

function distribuirLoot() {
    const chars = appState.get('characters') || [];
    const players = chars.filter(c => c.isPlayerCharacter);
    if (players.length === 0) return window.showToast?.('⚠️ Nenhum jogador encontrado.');
    const lootText = document.getElementById('lootResultado').innerText;
    const ganhador = players[Math.floor(Math.random() * players.length)];
    window.showToast?.(`🎲 ${ganhador.nome} ganhou o loot!`);
    appState.logAction(`🎲 Loot distribuído para ${ganhador.nome}.`);
}