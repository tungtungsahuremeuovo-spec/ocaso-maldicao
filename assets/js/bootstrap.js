// assets/js/bootstrap.js
import appState from './app.js';

// ============================================================
// 1. Módulos disponíveis por papel
// ============================================================
const MASTER_MODULES = [
    { id: 'dashboard', label: '🏠 Painel' },
    { id: 'personagens', label: '🧙 Personagens' },
    { id: 'ficha', label: '📋 Ficha' },
    { id: 'combate', label: '⚔️ Combate' },
    { id: 'missoes', label: '🏴 Missões' },
    { id: 'inventario', label: '💎 Inventário' },
    { id: 'grimorio', label: '📜 Grimório' },
    { id: 'dominios', label: '🌌 Domínios' },
    { id: 'lore', label: '📚 Lore' },
    { id: 'livro', label: '📖 Livro de Regras' },
    { id: 'calendario', label: '📅 Calendário' },
    { id: 'chat', label: '💬 Chat' },
    { id: 'faccoes', label: '🏛️ Facções' },
    { id: 'diario', label: '📖 Diário' },
    { id: 'npc', label: '👥 NPCs' },
    { id: 'ferramentas', label: '🛠️ Ferramentas' },
    { id: 'sala', label: '🚪 Sala' },
    { id: 'avisos', label: '📢 Avisos' },
    { id: 'notas', label: '📝 Notas' },
    { id: 'busca', label: '🔍 Buscar (Ctrl+K)' },
    { id: 'configuracoes', label: '⚙️ Configurações' },
    { id: 'relacionamentos', label: '🤝 Relacionamentos' },
    { id: 'macros', label: '🎲 Macros' },
    { id: 'roteiro', label: '📋 Roteiro' },
    { id: 'loot', label: '💎 Loot' },
];

// ✅ LISTA DE JOGADORES – APENAS O QUE ELES PODEM VER
const PLAYER_MODULES = [
    { id: 'ficha', label: '📋 Minha Ficha' },
    { id: 'dados', label: '🎲 Dados' },
    { id: 'missoes', label: '📜 Missões' },
    { id: 'combate', label: '⚔️ Combate' },
    { id: 'livro', label: '📖 Livro de Regras' },
    { id: 'calendario', label: '📅 Calendário' },
    { id: 'chat', label: '💬 Chat' },
    { id: 'faccoes', label: '🏛️ Facções' },
    { id: 'avisos', label: '📢 Avisos' },
    { id: 'notas', label: '📝 Notas' },
    { id: 'busca', label: '🔍 Buscar (Ctrl+K)' },
    { id: 'configuracoes', label: '⚙️ Configurações' },
    { id: 'relacionamentos', label: '🤝 Relacionamentos' },
    { id: 'macros', label: '🎲 Macros' },
];

// ============================================================
// 2. Funções auxiliares
// ============================================================

function getBasePath() {
    const scriptUrl = import.meta.url;
    return scriptUrl.substring(0, scriptUrl.lastIndexOf('/assets/js/')) + '/';
}

async function navigateTo(moduleId) {
    const content = document.getElementById('content');
    if (!content) return;

    const basePath = getBasePath();
    const htmlUrl = `${basePath}modules/${moduleId}/${moduleId}.html`;
    const jsPath = `../../modules/${moduleId}/${moduleId}.js`;

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

// ============================================================
// 3. Configuração do Menu Inicial
// ============================================================
function setupMenuScreen() {
    const menuScreen = document.getElementById('menu-screen');
    const appContainer = document.getElementById('app');
    const btnMaster = document.getElementById('btnMaster');
    const btnPlayer = document.getElementById('btnPlayer');
    const btnEspectador = document.getElementById('btnEspectador');

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

    if (btnEspectador) {
        btnEspectador.addEventListener('click', () => {
            console.log('👀 Clicou em Espectador');
            appState.setRole('spectator');
            const roomId = prompt('Digite o ID da sala para observar:');
            if (roomId && roomId.trim()) {
                appState.connectToHost(roomId.trim());
                location.reload();
            } else {
                alert('ID da sala é obrigatório para observar.');
                appState.clearRole();
            }
        });
    }
}

// ============================================================
// 4. Inicialização do App
// ============================================================
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

    const btnToggle = document.getElementById('btnToggleSidebar');
    if (btnToggle) {
        btnToggle.addEventListener('click', () => {
            const sidebar = document.getElementById('sidebar');
            const content = document.getElementById('content');
            const isHidden = sidebar.style.display === 'none';
            sidebar.style.display = isHidden ? '' : 'none';
            content.style.marginLeft = isHidden ? 'var(--sidebar-width)' : '0';
            btnToggle.textContent = isHidden ? '⬅️ Ocultar barra' : '➡️ Mostrar barra';
        });
    }

    import('./atalhos.js').then(mod => mod.init()).catch(console.warn);
}

function loadSidebar(role) {
    const nav = document.getElementById('sidebarNav');
    if (!nav) return;

    const modules = role === 'master' ? MASTER_MODULES : PLAYER_MODULES;

    nav.innerHTML = modules.map(m =>
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

document.addEventListener('DOMContentLoaded', () => {
    setupMenuScreen();
});

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