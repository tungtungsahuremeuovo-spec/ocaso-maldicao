// assets/js/bootstrap.js
import appState from './app.js';

// --- Obtém a URL base do projeto (raiz) a partir da localização deste script ---
function getBasePath() {
    // import.meta.url: "https://usuario.github.io/ocaso-maldicao/assets/js/bootstrap.js"
    const scriptUrl = import.meta.url;
    // Remove "assets/js/bootstrap.js" para chegar na raiz
    return scriptUrl.substring(0, scriptUrl.lastIndexOf('/assets/js/')) + '/';
}

// --- Navegação robusta ---
async function navigateTo(moduleId) {
    const content = document.getElementById('content');
    if (!content) return;

    const basePath = getBasePath();
    const htmlUrl = `${basePath}modules/${moduleId}/${moduleId}.html`;
    const jsPath = `../../modules/${moduleId}/${moduleId}.js`; // relativo a assets/js/

    console.log(`📂 Módulo: ${moduleId}`);
    console.log(`   Base: ${basePath}`);
    console.log(`   HTML: ${htmlUrl}`);

    try {
        const htmlResponse = await fetch(htmlUrl);
        if (!htmlResponse.ok) throw new Error(`HTML ${htmlResponse.status}`);
        const html = await htmlResponse.text();
        content.innerHTML = html;

        const module = await import(jsPath);
        if (module.init) module.init();
        console.log(`✅ ${moduleId} carregado.`);
    } catch (err) {
        console.error(`❌ ${moduleId}:`, err);
        content.innerHTML = `<div class="empty-state">❌ Módulo "${moduleId}" não encontrado.</div>`;
    }
}

// --- Configuração do Menu Inicial ---
function setupMenuScreen() {
    const menuScreen = document.getElementById('menu-screen');
    const appContainer = document.getElementById('app');
    const btnMaster = document.getElementById('btnMaster');
    const btnPlayer = document.getElementById('btnPlayer');

    if (appState.getRole()) {
        menuScreen.style.display = 'none';
        appContainer.style.display = 'flex';
        initializeApp();
        return;
    }

    menuScreen.style.display = 'flex';
    appContainer.style.display = 'none';

    btnMaster.addEventListener('click', () => {
        console.log('👑 Clicou em Mestre');
        appState.setRole('master');
        if (!localStorage.getItem('ocaso_data')) {
            appState.saveLocally();
        }
        location.reload();
    });

    btnPlayer.addEventListener('click', () => {
        console.log('🎭 Clicou em Jogador');
        appState.setRole('player');
        const roomId = prompt('Digite o ID da sala fornecida pelo Mestre:');
        if (roomId && roomId.trim()) {
            appState.connectToHost(roomId.trim());
            location.reload();
        } else {
            alert('ID da sala é obrigatório para entrar como jogador.');
            appState.clearRole();
        }
    });
}

function initializeApp() {
    const role = appState.getRole();
    console.log(`🎮 Inicializando como ${role}`);
    loadSidebar(role);
    loadDefaultContent(role);

    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.style.display = 'block';
        btnLogout.addEventListener('click', () => {
            appState.clearRole();
            location.reload();
        });
    }

    const campaignInput = document.getElementById('campaignName');
    if (campaignInput) {
        campaignInput.value = appState.get('campaign') || 'A Sombra do Dragão';
        campaignInput.addEventListener('change', () => {
            appState.set('campaign', campaignInput.value);
        });
    }
}

function loadSidebar(role) {
    const nav = document.getElementById('sidebarNav');
    if (!nav) return;
    const modules = [
        { id: 'dashboard', label: '📊 Painel' },
        { id: 'personagens', label: '🧙 Personagens' },
        { id: 'ficha', label: '📋 Ficha' },
        { id: 'combate', label: '⚔️ Combate' },
        { id: 'missoes', label: '🏴 Missões' },
        { id: 'inventario', label: '💎 Inventário' },
        { id: 'grimorio', label: '📜 Grimório' },
        { id: 'dominios', label: '🌌 Domínios' },
        { id: 'lore', label: '📚 Lore' },
        { id: 'configuracoes', label: '⚙️ Configurações' },
    ];

    const visible = role === 'master' ? modules : modules.filter(m =>
        ['ficha', 'missoes', 'combate', 'configuracoes'].includes(m.id)
    );

    nav.innerHTML = visible.map(m =>
        `<a href="#" data-module="${m.id}" class="nav-link">${m.label}</a>`
    ).join('');

    nav.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const moduleId = link.dataset.module;
            navigateTo(moduleId);
            nav.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    const first = nav.querySelector('.nav-link');
    if (first) first.classList.add('active');
}

function loadDefaultContent(role) {
    const content = document.getElementById('content');
    if (!content) return;
    content.innerHTML = '<div class="loading-screen">⛩️<br>Carregando...</div>';
    navigateTo('dashboard');
}

// --- Inicializa ---
document.addEventListener('DOMContentLoaded', () => {
    setupMenuScreen();
});

// --- Globais ---
window.navigateTo = navigateTo;
window.showToast = (msg) => {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast-item';
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
};