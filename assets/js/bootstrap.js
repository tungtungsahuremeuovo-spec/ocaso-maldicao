import appState from './app.js';
import { router } from '../../core/router/router.js';
import { showToast } from '../../components/Toast/Toast.js';

const MASTER_MODULES = [
    { id: 'dashboard', label: '🏠 Painel' },
    { id: 'personagens', label: '🧙 Personagens' },
    { id: 'combate', label: '⚔️ Combate' },
    { id: 'sessoes', label: '📖 Sessões' },
    { id: 'missoes', label: '🏰 Missões' },
    { id: 'inventario', label: '💎 Inventário' },
    { id: 'grimorio', label: '📜 Grimório' },
    { id: 'dominios', label: '🌌 Domínios' },
    { id: 'lore', label: '📚 Lore' },
    { id: 'configuracoes', label: '⚙️ Configurações' },
];

const PLAYER_MODULES = [
    { id: 'ficha', label: '📋 Minha Ficha' },
    { id: 'dados', label: '🎲 Dados' },
    { id: 'missoes', label: '📜 Missões' },
    { id: 'configuracoes', label: '⚙️ Configurações' },
];

function buildSidebar(modules) {
    const nav = document.getElementById('sidebarNav');
    nav.innerHTML = modules.map(m =>
        `<a href="#${m.id}" data-module="${m.id}" class="nav-link">${m.label}</a>`
    ).join('');
    nav.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;
        e.preventDefault();
        const moduleId = link.dataset.module;
        router.navigate(moduleId);
        document.querySelectorAll('.nav-link').forEach(a => a.classList.remove('active'));
        link.classList.add('active');
    });
}

function setupCampaignName() {
    const input = document.getElementById('campaignName');
    if (!input) return;
    input.value = appState.get('campaign');
    input.addEventListener('input', () => {
        appState.set('campaign', input.value.trim() || 'A Sombra do Dragão');
    });
}

function setupLogoutButton() {
    const btn = document.getElementById('btnLogout');
    if (!btn) return;
    btn.style.display = 'block';
    btn.addEventListener('click', () => {
        appState.clearRole();
        location.reload();
    });
}

async function initApp(role) {
    document.getElementById('menu-screen').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    setupLogoutButton();
    window.showToast = showToast;

    const modules = role === 'master' ? MASTER_MODULES : PLAYER_MODULES;
    buildSidebar(modules);
    setupCampaignName();

    const hash = window.location.hash.slice(1) || modules[0].id;
    await router.navigate(hash);
    const activeLink = document.querySelector(`[data-module="${hash}"]`);
    if (activeLink) activeLink.classList.add('active');

    window.addEventListener('hashchange', async () => {
        const moduleId = window.location.hash.slice(1) || modules[0].id;
        await router.navigate(moduleId);
        document.querySelectorAll('.nav-link').forEach(a => a.classList.remove('active'));
        const link = document.querySelector(`[data-module="${moduleId}"]`);
        if (link) link.classList.add('active');
    });
}

function setupMenuScreen() {
    document.getElementById('menu-screen').style.display = 'flex';
    document.getElementById('app').style.display = 'none';

    document.getElementById('btnMaster').addEventListener('click', () => {
        appState.setRole('master');
        if (!localStorage.getItem('ocaso_data')) {
            appState.saveLocallyAndSend();
        }
        location.reload();
    });

    document.getElementById('btnPlayer').addEventListener('click', () => {
        const peerId = prompt('Insira o ID da sala (fornecido pelo mestre):');
        if (!peerId) return;
        localStorage.setItem('ocaso_peerId', peerId.trim());
        appState.setRole('player');
        appState.peerId = peerId.trim();
        appState.connectToHost(peerId.trim());
        location.reload();
    });
}

async function init() {
    const role = appState.getRole();
    if (role === 'master' || role === 'player') {
        await initApp(role);
    } else {
        setupMenuScreen();
    }
}

init();