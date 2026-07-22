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

let currentModule = null;
let breadcrumb = [];

// ============================================================
// 3. Navegação (com Breadcrumb)
// ============================================================
async function navigateTo(moduleId, sub = null) {
    const content = document.getElementById('content');
    if (!content) return;

    const basePath = getBasePath();
    const htmlUrl = `${basePath}modules/${moduleId}/${moduleId}.html`;
    const jsPath = `../../modules/${moduleId}/${moduleId}.js`;

    console.log(`📂 Módulo: ${moduleId}`);

    try {
        // Destroi o módulo anterior
        if (currentModule?.destroy) {
            console.log(`🧹 Destruindo módulo anterior...`);
            currentModule.destroy();
        }

        // Mostra loader
        showLoader(moduleId);

        // Carrega HTML
        const htmlResponse = await fetch(htmlUrl);
        if (!htmlResponse.ok) throw new Error(`HTML ${htmlResponse.status}`);
        content.innerHTML = await htmlResponse.text();

        // Importa JS
        const module = await import(jsPath);
        currentModule = module;

        // Inicializa
        if (module.init) {
            module.init();
            console.log(`✅ ${moduleId} carregado e inicializado.`);
        }

        // Atualiza breadcrumb
        updateBreadcrumb(moduleId, sub);

        // Oculta loader
        hideLoader();

        // Atualiza recentes
        appState.addRecentModule(moduleId);

    } catch (err) {
        console.error(`❌ ${moduleId}:`, err);
        content.innerHTML = `<div class="empty-state">❌ Módulo "${moduleId}" não encontrado.</div>`;
        currentModule = null;
        hideLoader();
    }
}

// ============================================================
// 4. Breadcrumb (⭐ 13)
// ============================================================
function updateBreadcrumb(moduleId, sub = null) {
    const container = document.getElementById('breadcrumb');
    if (!container) return;
    const label = getModuleLabel(moduleId);
    let html = `<span>🏠 <a href="#" onclick="navigateTo('dashboard')">Dashboard</a></span>`;
    html += ` <span style="color:var(--text-dim);">›</span> <span>${label}</span>`;
    if (sub) {
        html += ` <span style="color:var(--text-dim);">›</span> <span>${sub}</span>`;
    }
    container.innerHTML = html;
}

function getModuleLabel(moduleId) {
    const allModules = [...MASTER_MODULES, ...PLAYER_MODULES];
    const m = allModules.find(m => m.id === moduleId);
    return m ? m.label : moduleId;
}

// ============================================================
// 5. Loader (⭐ 14)
// ============================================================
function showLoader(moduleId) {
    const content = document.getElementById('content');
    if (!content) return;
    const loader = document.createElement('div');
    loader.id = 'global-loader';
    loader.style.cssText = `
        display:flex; flex-direction:column; align-items:center; 
        justify-content:center; padding:40px; color:var(--text-dim);
        min-height:200px;
    `;
    loader.innerHTML = `
        <div style="font-size:3rem; animation: pulse 1.5s infinite;">⛩️</div>
        <div style="margin-top:12px; font-size:1rem;">Carregando ${getModuleLabel(moduleId)}...</div>
        <div style="margin-top:8px; width:200px; height:3px; background:var(--bg-2); border-radius:4px; overflow:hidden;">
            <div style="width:30%; height:100%; background:var(--gold); border-radius:4px; animation: loadingProgress 1s infinite;"></div>
        </div>
    `;
    content.appendChild(loader);
}

function hideLoader() {
    const loader = document.getElementById('global-loader');
    if (loader) loader.remove();
}

// ============================================================
// 6. Comandos Rápidos (Ctrl+P) (⭐ 21)
// ============================================================
let commandPaletteOpen = false;

function setupCommandPalette() {
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
            e.preventDefault();
            toggleCommandPalette();
        }
        if (e.key === 'Escape' && commandPaletteOpen) {
            closeCommandPalette();
        }
    });
}

function toggleCommandPalette() {
    if (commandPaletteOpen) {
        closeCommandPalette();
        return;
    }
    commandPaletteOpen = true;
    const overlay = document.createElement('div');
    overlay.id = 'command-palette';
    overlay.style.cssText = `
        position:fixed; top:0; left:0; width:100%; height:100%;
        background:rgba(0,0,0,0.6); z-index:9999;
        display:flex; align-items:flex-start; justify-content:center;
        padding-top:15vh;
    `;
    overlay.innerHTML = `
        <div style="background:var(--bg-1); border-radius:12px; width:90%; max-width:600px; padding:20px; box-shadow:var(--shadow-lg);">
            <input id="command-input" placeholder="Digite um comando..." style="width:100%; padding:12px; font-size:1.1rem; border:1px solid var(--border); border-radius:6px; background:var(--bg-2); color:var(--text);">
            <div id="command-results" style="margin-top:12px; max-height:400px; overflow-y:auto;"></div>
            <div style="margin-top:8px; font-size:0.7rem; color:var(--text-dim);">↑↓ para navegar, Enter para selecionar, Esc para fechar</div>
        </div>
    `;
    document.body.appendChild(overlay);

    const input = document.getElementById('command-input');
    const results = document.getElementById('command-results');
    let selectedIndex = -1;
    let commands = [];

    const updateResults = (query) => {
        const q = query.toLowerCase().trim();
        const allCommands = [
            { id: 'dashboard', label: '🏠 Abrir Dashboard', action: () => navigateTo('dashboard') },
            { id: 'combate', label: '⚔️ Abrir Combate', action: () => navigateTo('combate') },
            { id: 'ficha', label: '📋 Abrir Ficha', action: () => navigateTo('ficha') },
            { id: 'missoes', label: '🏴 Abrir Missões', action: () => navigateTo('missoes') },
            { id: 'npc', label: '👥 Abrir NPCs', action: () => navigateTo('npc') },
            { id: 'configuracoes', label: '⚙️ Abrir Configurações', action: () => navigateTo('configuracoes') },
            { id: 'save', label: '💾 Salvar Campanha', action: () => { appState.saveLocally(true); closeCommandPalette(); } },
            { id: 'theme', label: '🌙 Alternar Tema', action: () => { toggleTheme(); closeCommandPalette(); } },
            { id: 'busca', label: '🔍 Abrir Busca Global', action: () => { window._abrirBusca?.(); closeCommandPalette(); } },
        ];

        if (!q) {
            commands = allCommands.slice(0, 8);
        } else {
            commands = allCommands.filter(c => 
                c.label.toLowerCase().includes(q) || 
                c.id.toLowerCase().includes(q)
            );
        }
        selectedIndex = -1;
        renderResults();
    };

    const renderResults = () => {
        if (!commands.length) {
            results.innerHTML = '<div style="padding:8px; color:var(--text-dim);">Nenhum comando encontrado.</div>';
            return;
        }
        results.innerHTML = commands.map((cmd, i) => `
            <div class="command-item ${i === selectedIndex ? 'selected' : ''}" 
                 data-index="${i}"
                 style="padding:8px 12px; border-radius:4px; cursor:pointer; ${i === selectedIndex ? 'background:var(--bg-3);' : ''}">
                ${cmd.label}
            </div>
        `).join('');
        results.querySelectorAll('.command-item').forEach(el => {
            el.addEventListener('click', () => {
                const idx = parseInt(el.dataset.index);
                if (commands[idx]) {
                    commands[idx].action();
                }
            });
        });
    };

    input.addEventListener('input', (e) => updateResults(e.target.value));
    input.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedIndex = Math.min(selectedIndex + 1, commands.length - 1);
            renderResults();
            const selected = results.querySelector('.command-item.selected');
            if (selected) selected.scrollIntoView({ block: 'nearest' });
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedIndex = Math.max(selectedIndex - 1, -1);
            renderResults();
            const selected = results.querySelector('.command-item.selected');
            if (selected) selected.scrollIntoView({ block: 'nearest' });
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedIndex >= 0 && commands[selectedIndex]) {
                commands[selectedIndex].action();
            } else if (commands.length === 1) {
                commands[0].action();
            }
        }
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeCommandPalette();
    });

    setTimeout(() => input.focus(), 100);

    // Adiciona estilos para os comandos
    const style = document.createElement('style');
    style.textContent = `
        .command-item:hover { background:var(--bg-3); }
        .command-item.selected { background:var(--bg-3); border-left:3px solid var(--gold); }
    `;
    document.head.appendChild(style);
}

function closeCommandPalette() {
    const overlay = document.getElementById('command-palette');
    if (overlay) overlay.remove();
    commandPaletteOpen = false;
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('ocaso_theme', next);
    window.showToast?.(`🎨 Tema alterado para ${next === 'dark' ? '🌙 Escuro' : '☀️ Claro'}`);
}

// ============================================================
// 7. Configuração do Menu Inicial
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
// 8. Inicialização do App
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

    // Toggle sidebar
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

    // Atalhos de teclado
    import('./atalhos.js').then(mod => mod.init()).catch(console.warn);

    // Comandos rápidos (Ctrl+P)
    setupCommandPalette();

    // F12 Inspector (⭐ 22)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F12') {
            e.preventDefault();
            toggleInspector();
        }
    });
}

// ============================================================
// 9. Inspector (⭐ 22)
// ============================================================
let inspectorOpen = false;

function toggleInspector() {
    if (inspectorOpen) {
        closeInspector();
        return;
    }
    inspectorOpen = true;
    const panel = document.createElement('div');
    panel.id = 'inspector-panel';
    panel.style.cssText = `
        position:fixed; top:0; right:0; width:400px; height:100%;
        background:var(--bg-1); border-left:2px solid var(--gold-dark);
        z-index:9998; padding:16px; overflow-y:auto;
        font-size:0.85rem; box-shadow:var(--shadow-lg);
        animation: slideIn 0.3s ease;
    `;
    panel.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <h3 style="color:var(--gold); margin:0;">🔍 Inspector</h3>
            <button class="btn btn-sm" onclick="window._closeInspector()">✕</button>
        </div>
        <div id="inspector-content"></div>
    `;
    document.body.appendChild(panel);
    updateInspector();
    window._closeInspector = closeInspector;
}

function updateInspector() {
    const content = document.getElementById('inspector-content');
    if (!content) return;
    const data = appState.data;
    let html = '';
    for (const [key, value] of Object.entries(data)) {
        const count = Array.isArray(value) ? value.length : typeof value === 'object' ? Object.keys(value).length : '—';
        html += `
            <div style="padding:4px 0; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
                <span style="color:var(--gold);">${key}</span>
                <span style="color:var(--text-dim);">${count}</span>
            </div>
            <div style="font-size:0.7rem; color:var(--text-muted); padding-left:8px; margin-bottom:6px; max-height:80px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                ${JSON.stringify(value).substring(0, 100)}${JSON.stringify(value).length > 100 ? '...' : ''}
            </div>
        `;
    }
    content.innerHTML = html;
}

function closeInspector() {
    const panel = document.getElementById('inspector-panel');
    if (panel) panel.remove();
    inspectorOpen = false;
}

function loadSidebar(role) {
    const nav = document.getElementById('sidebarNav');
    if (!nav) return;

    const modules = role === 'master' ? MASTER_MODULES : PLAYER_MODULES;

    // Adiciona seção "⭐ Favoritos" (⭐ 4)
    const favorites = appState.getFavorites('modules') || [];
    let html = '';
    if (favorites.length) {
        html += `<div style="margin-top:4px; padding:4px 8px; font-size:0.7rem; color:var(--text-dim);">⭐ Favoritos</div>`;
        favorites.forEach(id => {
            const label = getModuleLabel(id);
            if (label) {
                html += `<a href="#" data-module="${id}" class="nav-link">⭐ ${label}</a>`;
            }
        });
    }

    // Módulos normais
    html += modules.map(m =>
        `<a href="#" data-module="${m.id}" class="nav-link">${m.label}</a>`
    ).join('');

    // Recentes (⭐ 5)
    const recent = appState.getRecentModules().filter(id => !favorites.includes(id)).slice(0, 4);
    if (recent.length) {
        html += `<div style="margin-top:8px; padding:4px 8px; font-size:0.7rem; color:var(--text-dim);">🕐 Recentes</div>`;
        recent.forEach(id => {
            const label = getModuleLabel(id);
            if (label) {
                html += `<a href="#" data-module="${id}" class="nav-link">🕐 ${label}</a>`;
            }
        });
    }

    nav.innerHTML = html;

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

// ============================================================
// 10. Toast Bonito (⭐ 6)
// ============================================================
window.showToast = (msg, type = 'info') => {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type}`;
    const icons = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌'
    };
    toast.innerHTML = `${icons[type] || 'ℹ️'} ${msg}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
};

// ============================================================
// 11. Inicialização
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    setupMenuScreen();
});

window.navigateTo = navigateTo;
window.closeInspector = closeInspector;