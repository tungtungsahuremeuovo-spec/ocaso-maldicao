// assets/js/bootstrap.js
import appState from './app.js';

// --- Configuração do Menu Inicial ---
function setupMenuScreen() {
    const menuScreen = document.getElementById('menu-screen');
    const appContainer = document.getElementById('app');
    const btnMaster = document.getElementById('btnMaster');
    const btnPlayer = document.getElementById('btnPlayer');

    // Se já tem papel salvo, pula o menu
    if (appState.getRole()) {
        menuScreen.style.display = 'none';
        appContainer.style.display = 'flex';
        initializeApp();
        return;
    }

    // Mostra o menu
    menuScreen.style.display = 'flex';
    appContainer.style.display = 'none';

    btnMaster.addEventListener('click', () => {
        console.log('👑 Clicou em Mestre');
        appState.setRole('master');
        if (!localStorage.getItem('ocaso_data')) {
            appState.saveLocally();   // ✅ corrigido
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

// --- Inicialização do App (quando já logado) ---
function initializeApp() {
    const role = appState.getRole();
    console.log(`🎮 Inicializando como ${role}`);

    loadSidebar(role);
    loadDefaultContent(role);

    const btnLogout = document.getElementById('btnLogout');
    btnLogout.style.display = 'block';
    btnLogout.addEventListener('click', () => {
        appState.clearRole();
        location.reload();
    });

    const campaignInput = document.getElementById('campaignName');
    campaignInput.value = appState.get('campaign') || 'A Sombra do Dragão';
    campaignInput.addEventListener('change', () => {
        appState.set('campaign', campaignInput.value);
    });
}

function loadSidebar(role) {
    const nav = document.getElementById('sidebarNav');
    const modules = [
        { id: 'dashboard', label: '📊 Painel' },
        { id: 'ficha', label: '📋 Ficha' },
        { id: 'missoes', label: '🏴 Missões' },
        { id: 'npcs', label: '👥 NPCs' },
        { id: 'locais', label: '📍 Locais' },
        { id: 'combate', label: '⚔️ Combate' },
        { id: 'lore', label: '📜 Lore' },
        { id: 'configuracoes', label: '⚙️ Configurações' },
    ];

    const visible = role === 'master'
        ? modules
        : modules.filter(m => ['ficha', 'missoes', 'combate', 'configuracoes'].includes(m.id));

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
    content.innerHTML = '<div class="loading-screen">⛩️<br>Carregando...</div>';
    navigateTo('dashboard');
}

// --- Navegação corrigida (caminhos absolutos a partir da raiz) ---
async function navigateTo(moduleId) {
    const content = document.getElementById('content');
    try {
        // Caminho correto: sobe dois níveis (de assets/js/ para raiz) e entra em modules/
        const htmlResponse = await fetch(`../../modules/${moduleId}/${moduleId}.html`);
        if (!htmlResponse.ok) throw new Error('HTML não encontrado');

        const html = await htmlResponse.text();
        content.innerHTML = html;

        // Importa o módulo JS correspondente
        const module = await import(`../../modules/${moduleId}/${moduleId}.js`);
        if (module.init) {
            module.init();
        }
    } catch (err) {
        console.error('Erro ao carregar módulo:', err);
        content.innerHTML = `<div class="empty-state">❌ Erro ao carregar "${moduleId}".</div>`;
    }
}

// --- Inicializa ---
document.addEventListener('DOMContentLoaded', () => {
    setupMenuScreen();
});

// --- Globais para uso em módulos (opcional) ---
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