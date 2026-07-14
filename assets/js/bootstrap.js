import appState from './app.js';

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
    // Carrega o dashboard como padrão (se existir)
    navigateTo('dashboard');
}

// --- Função auxiliar para construir a URL base (ex: https://usuario.github.io/repo/) ---
function getBasePath() {
    // Remove o arquivo do final, mantendo a barra
    const path = document.baseURI || location.href.split('/').slice(0, -1).join('/') + '/';
    return path.replace(/\/[^/]*$/, '/'); // remove o último segmento (ex: index.html)
}

// --- Navegação robusta ---
async function navigateTo(moduleId) {
    const content = document.getElementById('content');
    if (!content) return;

    const basePath = getBasePath();
    console.log(`📂 Tentando carregar módulo: ${moduleId}`);
    console.log(`   Base path: ${basePath}`);
    console.log(`   HTML URL: ${basePath}modules/${moduleId}/${moduleId}.html`);

    try {
        // Carrega o HTML (caminho absoluto)
        const htmlUrl = `${basePath}modules/${moduleId}/${moduleId}.html`;
        const htmlResponse = await fetch(htmlUrl);
        if (!htmlResponse.ok) {
            throw new Error(`HTML não encontrado (${htmlResponse.status})`);
        }
        const html = await htmlResponse.text();
        content.innerHTML = html;

        // Importa o JS (caminho relativo a partir deste script: assets/js/bootstrap.js -> ../../modules/...)
        const jsPath = `../../modules/${moduleId}/${moduleId}.js`;
        console.log(`   JS import: ${jsPath}`);
        const module = await import(jsPath);
        if (module.init) {
            module.init();
            console.log(`✅ Módulo "${moduleId}" carregado.`);
        } else {
            console.warn(`⚠️ Módulo "${moduleId}" não possui função init().`);
        }
    } catch (err) {
        console.error(`❌ Erro ao carregar "${moduleId}":`, err);
        content.innerHTML = `<div class="empty-state">
            ❌ Módulo "${moduleId}" não disponível.<br>
            <small>Verifique se o arquivo existe em: modules/${moduleId}/${moduleId}.html</small>
        </div>`;
    }
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