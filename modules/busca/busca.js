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

        const dados = {
            'Personagens': appState.get('characters') || [],
            'Missões': appState.get('quests') || [],
            'NPCs': appState.get('npcs') || [],
            'Itens': appState.get('items') || [],
            'Lore': appState.get('lores') || [],
        };

        let html = '';
        Object.entries(dados).forEach(([categoria, items]) => {
            const matches = items.filter(item => {
                const str = JSON.stringify(item).toLowerCase();
                return str.includes(termo);
            });
            if (matches.length) {
                html += `<div style="margin-top:8px; font-weight:600; color:var(--gold);">${categoria}</div>`;
                matches.forEach(item => {
                    const nome = item.nome || item.titulo || 'Sem nome';
                    html += `<div style="padding:4px 0; border-bottom:1px solid var(--border);">${escapeHtml(nome)}</div>`;
                });
            }
        });
        resultados.innerHTML = html || '<p class="empty-state">Nenhum resultado.</p>';
    });
}