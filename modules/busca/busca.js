// modules/busca/busca.js
import appState from '../../assets/js/app.js';
import { escapeHtml } from '../../core/utils/utils.js';

export function init() {
    const modal = document.getElementById('buscaModal');
    const input = document.getElementById('buscaInput');
    const resultados = document.getElementById('buscaResultados');

    if (!modal) return;

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display !== 'none') {
            modal.style.display = 'none';
        }
    });

    window._abrirBusca = () => {
        modal.style.display = 'flex';
        input.focus();
        input.value = '';
        resultados.innerHTML = '';
    };

    input.addEventListener('input', () => {
        const termo = input.value.toLowerCase().trim();
        if (!termo) { resultados.innerHTML = ''; return; }

        // Busca em TODOS os dados (⭐ 3)
        const dados = {
            '👥 Personagens': appState.get('characters') || [],
            '🏴 Missões': appState.get('quests') || [],
            '🧟 NPCs': appState.get('npcs') || [],
            '💎 Itens': appState.get('items') || [],
            '📜 Lore': appState.get('lores') || [],
            '📝 Notas': appState.get('notas') ? [{ titulo: 'Notas', conteudo: appState.get('notas') }] : [],
            '📢 Avisos': appState.get('avisos') || [],
            '📖 Diário': appState.get('campaignLog') || [],
            '📋 Roteiro': appState.get('roteiro') || [],
            '🤝 Relacionamentos': appState.get('relacionamentos') || [],
            '🎲 Macros': appState.get('macros') || [],
            '⚔️ Combate': appState.get('combat')?.combatants || []
        };

        let html = '';
        let total = 0;
        Object.entries(dados).forEach(([categoria, items]) => {
            const matches = items.filter(item => {
                const str = JSON.stringify(item).toLowerCase();
                return str.includes(termo);
            });
            if (matches.length) {
                total += matches.length;
                html += `<div style="margin-top:8px; font-weight:600; color:var(--gold);">${categoria} (${matches.length})</div>`;
                matches.slice(0, 5).forEach(item => {
                    const nome = item.nome || item.titulo || item.texto || 'Sem nome';
                    html += `<div style="padding:4px 0; border-bottom:1px solid var(--border); font-size:0.9rem;">${escapeHtml(nome)}</div>`;
                });
                if (matches.length > 5) {
                    html += `<div style="color:var(--text-dim); font-size:0.8rem;">+ ${matches.length - 5} mais resultados</div>`;
                }
            }
        });
        resultados.innerHTML = html || `<p class="empty-state">Nenhum resultado encontrado para "${escapeHtml(termo)}".</p>`;
    });
}