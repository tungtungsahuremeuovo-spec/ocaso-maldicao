import appState from './app.js';
import { router } from '../../core/router/router.js';
import { showToast } from '../../components/Toast/Toast.js';

const MODULES = [
    { id: 'dashboard', label: '🏠 Painel', icon: '📊' },
    { id: 'personagens', label: '🧙 Personagens', icon: '👤' },
    { id: 'combate', label: '⚔️ Combate', icon: '⚔️' },
    { id: 'sessoes', label: '📖 Sessões', icon: '📝' },
    { id: 'missoes', label: '🏰 Missões', icon: '🎯' },
    { id: 'inventario', label: '💎 Inventário', icon: '🎒' },
    { id: 'grimorio', label: '📜 Grimório', icon: '📖' },
    { id: 'dominios', label: '🌌 Domínios', icon: '🔮' },
    { id: 'lore', label: '📚 Lore', icon: '📚' },
    { id: 'configuracoes', label: '⚙️ Config', icon: '🔧' },
];

function buildSidebar() {
    const nav = document.getElementById('sidebarNav');
    nav.innerHTML = MODULES.map(m =>
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
    input.value = appState.get('campaign');
    input.addEventListener('input', () => {
        appState.set('campaign', input.value.trim() || 'A Sombra do Dragão');
    });
}

async function init() {
    buildSidebar();
    setupCampaignName();
    window.showToast = showToast;

    // Rota inicial
    const hash = window.location.hash.slice(1) || 'dashboard';
    await router.navigate(hash);
    const activeLink = document.querySelector(`[data-module="${hash}"]`);
    if (activeLink) activeLink.classList.add('active');

    window.addEventListener('hashchange', async () => {
        const moduleId = window.location.hash.slice(1) || 'dashboard';
        await router.navigate(moduleId);
        document.querySelectorAll('.nav-link').forEach(a => a.classList.remove('active'));
        const link = document.querySelector(`[data-module="${moduleId}"]`);
        if (link) link.classList.add('active');
    });

    console.log('⛩️ Ocaso & Maldição — Gerenciador de Campanha v3.1');
    console.log('📜 Sistema de RPG de Jujutsu Kaisen — Escola Jujutsu de Kyoto');
}

init();