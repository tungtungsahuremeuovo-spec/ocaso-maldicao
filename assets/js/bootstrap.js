import appState from './app.js';
import { router } from '../../core/router/router.js';
import { showToast } from '../../components/Toast/Toast.js';
import { triggerImport } from '../../core/database/importExport.js';

// Módulos disponíveis para cada papel
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
        `<a href="#${m.id}" data-module="${m.id}" class="nav-link">
            <span>${m.label}</span>
            <span class="badge" id="badge-${m.id}"></span>
        </a>`
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
        // Se não houver dados salvos, carrega padrão
        if (!localStorage.getItem('ocaso_maldicao_data')) {
            appState.save();
        }
        location.reload();
    });

    document.getElementById('btnPlayer').addEventListener('click', () => {
        triggerImport((importedData) => {
            // Valida dados mínimos
            if (!importedData.campaign || !importedData.characters) {
                alert('Arquivo de campanha inválido!');
                return;
            }
            // Salva dados do jogador
            appState.data = { ...appState.getDefaultData(), ...importedData, playerLoaded: true };
            appState.setRole('player');
            appState.save();
            location.reload();
        });
    });
}

async function init() {
    const role = appState.getRole();
    if (role === 'master' || role === 'player') {
        await initApp(role);
    } else {
        setupMenuScreen();
    }
    console.log('⛩️ Ocaso & Maldição — Gerenciador de Campanha v3.1');
}

init();