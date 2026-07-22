// assets/js/atalhos.js
import appState from '../../assets/js/app.js';

let desfazerStack = [];
let refazerStack = [];
const MAX_HISTORY = 50;

export function init() {
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            if (appState.getRole() === 'master') {
                appState.saveLocally();
                window.showToast?.('💾 Campanha salva!');
            }
        }
        if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            desfazer();
        }
        if (e.ctrlKey && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
            e.preventDefault();
            refazer();
        }
        if (e.ctrlKey && e.key === 'f') {
            e.preventDefault();
            window._abrirBusca?.();
        }
        if (e.key === ' ' && !e.ctrlKey && !e.altKey && !e.shiftKey) {
            const activeModule = document.querySelector('.nav-link.active');
            if (activeModule && activeModule.dataset.module === 'combate') {
                e.preventDefault();
                document.getElementById('btnNextTurn')?.click();
            }
        }
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
