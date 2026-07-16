// modules/mapa/mapa.js
import appState from '../../assets/js/app.js';
import { generateId, escapeHtml } from '../../core/utils/utils.js';

let canvas, ctx;
let gridSize = 10;
let selectedTokenId = null;
let tokens = [];
let backgroundImage = null;
let dragOffsetX = 0, dragOffsetY = 0;
let isDragging = false;

export function init() {
    canvas = document.getElementById('mapCanvas');
    if (!canvas) {
        console.warn('Mapa: canvas não encontrado');
        return;
    }
    ctx = canvas.getContext('2d');
    resizeCanvas();

    const saved = appState.get('mapa');
    if (saved) {
        gridSize = saved.gridSize || 10;
        tokens = saved.tokens || [];
        backgroundImage = saved.backgroundImage || null;
        const gridSizeInput = document.getElementById('gridSize');
        if (gridSizeInput) gridSizeInput.value = gridSize;
    }

    renderMapa();
    appState.subscribe('mapa', (data) => {
        if (data) {
            gridSize = data.gridSize || 10;
            tokens = data.tokens || [];
            backgroundImage = data.backgroundImage || null;
            renderMapa();
        }
    });

    const btnAddToken = document.getElementById('btnAddToken');
    const btnClearMapa = document.getElementById('btnClearMapa');
    const btnSyncMapa = document.getElementById('btnSyncMapa');
    const btnImportarCombate = document.getElementById('btnImportarCombate');
    const gridSizeInput = document.getElementById('gridSize');
    const imageInput = document.getElementById('mapImageInput');
    const btnUploadImagem = document.getElementById('btnUploadImagem');

    if (btnAddToken) btnAddToken.addEventListener('click', addToken);
    if (btnClearMapa) btnClearMapa.addEventListener('click', clearMapa);
    if (btnSyncMapa) btnSyncMapa.addEventListener('click', syncMapa);
    if (btnImportarCombate) btnImportarCombate.addEventListener('click', importarDoCombate);
    if (gridSizeInput) {
        gridSizeInput.addEventListener('change', (e) => {
            gridSize = parseInt(e.target.value) || 10;
            saveMapa();
            renderMapa();
        });
    }
    if (btnUploadImagem && imageInput) {
        btnUploadImagem.addEventListener('click', () => imageInput.click());
        imageInput.addEventListener('change', handleImageUpload);
    }

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('click', handleCanvasClick);
    window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
    if (!canvas) return;
    const rect = canvas.parentElement.getBoundingClientRect();
    const size = Math.min(rect.width, window.innerHeight * 0.6);
    canvas.width = size;
    canvas.height = size;
    renderMapa();
}

function renderMapa() {
    if (!ctx || !canvas) return;
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    if (backgroundImage) {
        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, 0, 0, w, h);
            drawGridAndTokens();
        };
        img.src = backgroundImage;
    } else {
        drawGridAndTokens();
    }
}

function drawGridAndTokens() {
    const w = canvas.width, h = canvas.height;
    const cellSize = w / gridSize;

    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= gridSize; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cellSize, 0);
        ctx.lineTo(i * cellSize, h);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * cellSize);
        ctx.lineTo(w, i * cellSize);
        ctx.stroke();
    }

    tokens.forEach(token => {
        const x = token.x * cellSize + cellSize/2;
        const y = token.y * cellSize + cellSize/2;
        const radius = cellSize * 0.4;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = token.color || '#c9a24e';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = `${radius}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(token.nome.charAt(0).toUpperCase(), x, y + 1);
        if (token.id === selectedTokenId) {
            ctx.strokeStyle = '#ff0';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(x, y, radius + 4, 0, Math.PI * 2);
            ctx.stroke();
        }
    });

    const statusEl = document.getElementById('tokenStatus');
    if (statusEl) {
        statusEl.textContent = tokens.length ? `${tokens.length} tokens no mapa.` : 'Nenhum token.';
    }
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        backgroundImage = ev.target.result;
        saveMapa();
        renderMapa();
        window.showToast?.('🖼️ Imagem carregada!');
    };
    reader.readAsDataURL(file);
}

function addToken() {
    const nome = prompt('Nome do token:', 'Combatente');
    if (!nome) return;
    const color = prompt('Cor (ex: #ff0000):', '#c9a24e');
    const x = Math.floor(Math.random() * (gridSize - 1));
    const y = Math.floor(Math.random() * (gridSize - 1));
    tokens.push({ id: generateId(), nome, color: color || '#c9a24e', x, y });
    saveMapa();
    renderMapa();
}

function clearMapa() {
    if (confirm('Limpar todos os tokens e imagem?')) {
        tokens = [];
        selectedTokenId = null;
        backgroundImage = null;
        saveMapa();
        renderMapa();
    }
}

function syncMapa() {
    appState.enviarNotificacao('🗺️ Mapa atualizado pelo mestre.');
    saveMapa();
}

function importarDoCombate() {
    const combat = appState.get('combat');
    if (!combat || !combat.combatants.length) {
        return window.showToast?.('⚠️ Nenhum combatente no combate.');
    }
    const confirmar = confirm(`Importar ${combat.combatants.length} combatentes para o mapa?`);
    if (!confirmar) return;
    combat.combatants.forEach((c, i) => {
        tokens.push({
            id: generateId(),
            nome: c.nome,
            color: '#c9a24e',
            x: i % gridSize,
            y: Math.floor(i / gridSize)
        });
    });
    saveMapa();
    renderMapa();
    window.showToast?.('✅ Combatentes importados!');
}

function handleMouseDown(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;
    const cellSize = canvas.width / gridSize;
    const gridX = Math.floor(mx / cellSize);
    const gridY = Math.floor(my / cellSize);
    const token = tokens.find(t => t.x === gridX && t.y === gridY);
    if (token) {
        selectedTokenId = token.id;
        isDragging = true;
        dragOffsetX = mx - (token.x * cellSize + cellSize/2);
        dragOffsetY = my - (token.y * cellSize + cellSize/2);
        const statusEl = document.getElementById('tokenStatus');
        if (statusEl) statusEl.textContent = `Arrastando ${token.nome}...`;
        renderMapa();
    }
}

function handleMouseMove(e) {
    if (!isDragging || !selectedTokenId) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;
    const cellSize = canvas.width / gridSize;
    const gridX = Math.floor((mx - dragOffsetX) / cellSize);
    const gridY = Math.floor((my - dragOffsetY) / cellSize);
    const token = tokens.find(t => t.id === selectedTokenId);
    if (token && gridX >= 0 && gridX < gridSize && gridY >= 0 && gridY < gridSize) {
        if (!tokens.some(t => t.id !== selectedTokenId && t.x === gridX && t.y === gridY)) {
            token.x = gridX;
            token.y = gridY;
            renderMapa();
        }
    }
}

function handleMouseUp() {
    if (isDragging && selectedTokenId) {
        isDragging = false;
        saveMapa();
        const statusEl = document.getElementById('tokenStatus');
        if (statusEl) statusEl.textContent = 'Token movido.';
        renderMapa();
    }
}

function handleCanvasClick(e) {
    if (isDragging) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;
    const cellSize = canvas.width / gridSize;
    const gridX = Math.floor(mx / cellSize);
    const gridY = Math.floor(my / cellSize);
    if (gridX < 0 || gridX >= gridSize || gridY < 0 || gridY >= gridSize) return;

    const clicked = tokens.find(t => t.x === gridX && t.y === gridY);
    if (clicked) {
        selectedTokenId = clicked.id;
        const statusEl = document.getElementById('tokenStatus');
        if (statusEl) statusEl.textContent = `Token "${clicked.nome}" selecionado.`;
        renderMapa();
        return;
    }
    if (selectedTokenId) {
        const token = tokens.find(t => t.id === selectedTokenId);
        if (token) {
            if (!tokens.some(t => t.id !== selectedTokenId && t.x === gridX && t.y === gridY)) {
                token.x = gridX;
                token.y = gridY;
                saveMapa();
                renderMapa();
            } else {
                window.showToast?.('⚠️ Posição ocupada.');
            }
        }
    }
}

function saveMapa() {
    appState.set('mapa', { gridSize, tokens, backgroundImage });
}