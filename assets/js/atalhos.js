// assets/js/atalhos.js
import appState from './app.js';

export function init() {
    document.addEventListener('keydown', (e) => {
        // Ctrl+S – Salvar
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            if (appState.getRole() === 'master') {
                appState.saveLocally(true);
            }
        }

        // Ctrl+Z – Desfazer
        if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            appState.undo();
        }

        // Ctrl+Y ou Ctrl+Shift+Z – Refazer
        if (e.ctrlKey && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
            e.preventDefault();
            appState.redo();
        }

        // Ctrl+K – Busca global (⭐ 3)
        if (e.ctrlKey && e.key === 'k') {
            e.preventDefault();
            window._abrirBusca?.();
        }

        // Espaço – Próximo turno
        if (e.key === ' ' && !e.ctrlKey && !e.altKey && !e.shiftKey) {
            const activeModule = document.querySelector('.nav-link.active');
            if (activeModule && activeModule.dataset.module === 'combate') {
                e.preventDefault();
                document.getElementById('btnNextTurn')?.click();
                appState._playSound('combat');
            }
        }

        // Esc – Fechar modais
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal, .modal-overlay, #command-palette, #inspector-panel').forEach(el => el.remove());
        }
    });
}