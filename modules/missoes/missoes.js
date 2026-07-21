// modules/missoes/missoes.js
import appState from '../../assets/js/app.js';
import { generateId, escapeHtml } from '../../core/utils/utils.js';

export function init() {
    const role = appState.getRole();
    const formPanel = document.getElementById('questFormPanel');

    if (role === 'master') {
        formPanel.style.display = 'block';
        document.getElementById('btnAddQuest').addEventListener('click', addQuest);
        // Mostra botão "Limpar" apenas para mestre
        const btnLimpar = document.getElementById('btnLimparFiltros');
        if (btnLimpar) btnLimpar.style.display = '';
    } else {
        formPanel.style.display = 'none';
        // Esconde botão "Limpar" para jogadores
        const btnLimpar = document.getElementById('btnLimparFiltros');
        if (btnLimpar) btnLimpar.style.display = 'none';
    }

    window._toggleQuest = toggleQuest;
    window._removeQuest = removeQuest;
    renderList();
    appState.subscribe('quests', renderList);

    // Filtros
    const filtroTexto = document.getElementById('filtroMissoes');
    const filtroStatus = document.getElementById('filtroStatusMissao');
    const btnLimpar = document.getElementById('btnLimparFiltros');

    if (filtroTexto) filtroTexto.addEventListener('input', renderList);
    if (filtroStatus) filtroStatus.addEventListener('change', renderList);
    if (btnLimpar) {
        btnLimpar.addEventListener('click', () => {
            if (filtroTexto) filtroTexto.value = '';
            if (filtroStatus) filtroStatus.value = '';
            renderList();
        });
    }

    // Edição inline (apenas mestre)
    document.addEventListener('dblclick', function(e) {
        if (appState.getRole() !== 'master') return;
        const el = e.target.closest('.editable');
        if (!el) return;
        el.contentEditable = true;
        el.focus();
        document.execCommand('selectAll', false, null);
    });

    document.addEventListener('blur', function(e) {
        const el = e.target.closest('.editable');
        if (!el) return;
        if (el.contentEditable === 'true') {
            el.contentEditable = false;
            const id = el.dataset.id;
            const field = el.dataset.field;
            const newValue = el.textContent.trim();
            const quests = appState.get('quests') || [];
            const item = quests.find(q => q.id === id);
            if (item) {
                item[field] = newValue;
                appState.set('quests', quests);
                appState.logAction(`✏️ Missão "${newValue}" editada inline.`);
            }
        }
    }, true);
}

// ... resto do código (renderList, addQuest, toggleQuest, removeQuest) permanece igual