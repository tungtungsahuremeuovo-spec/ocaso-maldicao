// assets/js/atalhos.js
import appState from './app.js';

let desfazerStack = [];
let refazerStack = [];
const MAX_HISTORY = 50;

export function init() {
    document.addEventListener('keydown', (e) => {
        // Ctrl+S – Salvar
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            if (appState.getRole() === 'master') {
                appState.saveLocally();
                window.showToast?.('💾 Campanha salva!');
            }
        }

        // Ctrl+Z – Desfazer
        if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            desfazer();
        }

        // Ctrl+Y ou Ctrl+Shift+Z – Refazer
        if (e.ctrlKey && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
            e.preventDefault();
            refazer();
        }

        // Ctrl+F – Buscar (abre modal de busca)
        if (e.ctrlKey && e.key === 'f') {
            e.preventDefault();
            window._abrirBusca?.();
        }

        // Espaço – próximo turno (se no combate)
        if (e.key === ' ' && !e.ctrlKey && !e.altKey && !e.shiftKey) {
            const activeModule = document.querySelector('.nav-link.active');
            if (activeModule && activeModule.dataset.module === 'combate') {
                e.preventDefault();
                document.getElementById('btnNextTurn')?.click();
            }
        }

        // Escape – fechar modais
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal, .modal-overlay').forEach(el => el.remove());
        }
    });
}

function desfazer() {
    if (desfazerStack.length === 0) return window.showToast?.('⚠️ Nada para desfazer.');
    const snapshot = desfazerStack.pop();
    refazerStack.push(JSON.stringify(appState.data));
    Object.keys(snapshot).forEach(key => {
        appState.set(key, snapshot[key]);
    });
    window.showToast?.('↩️ Desfeito.');
}

function refazer() {
    if (refazerStack.length === 0) return window.showToast?.('⚠️ Nada para refazer.');
    const snapshot = JSON.parse(refazerStack.pop());
    desfazerStack.push(JSON.parse(JSON.stringify(appState.data)));
    Object.keys(snapshot).forEach(key => {
        appState.set(key, snapshot[key]);
    });
    window.showToast?.('↪️ Refazendo.');
}

export function salvarSnapshot() {
    const snap = {};
    ['characters', 'quests', 'npcs', 'items', 'combat'].forEach(key => {
        snap[key] = JSON.parse(JSON.stringify(appState.get(key) || []));
    });
    desfazerStack.push(snap);
    if (desfazerStack.length > MAX_HISTORY) desfazerStack.shift();
    refazerStack = [];
}