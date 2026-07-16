// modules/mapa/mapa.js
import appState from '../../assets/js/app.js';
import { generateId, escapeHtml } from '../../core/utils/utils.js';

let canvas, ctx;
let gridSize = 10;
let tokens = [];
let selectedTokenId = null;
let draggingToken = null;
let dragOffsetX = 0, dragOffsetY = 0;
let backgroundImage = null;
let isDraggingCanvas = false;
let lastMouseX = 0, lastMouseY = 0;

export function init() {
    canvas = document.getElementById('mapCanvas');
    ctx = canvas.getContext('2d');
    resizeCanvas();

    // Carrega dados salvos
    const saved = appState.get('mapa');
    if (saved) {
        gridSize = saved.gridSize || 10;
        tokens = saved.tokens || [];
        if (saved.background) {
            const img = new Image();
            img.src = saved.background;
            img.onload = () => {
                backgroundImage = img;
                renderMapa();
            };
        }
        document.getElementById('gridSize').value = gridSize;
    }

    renderMapa();
    appState.subscribe('mapa', (data) => {
        if (data) {
            gridSize = data.gridSize || 10;
            tokens = data.tokens || [];
            if (data.background && !backgroundImage) {
                const img = new Image();
                img.src = data.background;
                img.onload = () => {
                    backgroundImage = img;
                    renderMapa();
                };
            }
            renderMapa();
        }
    });

    // Eventos
    document.getElementById('btnAddToken').addEventListener('click', addToken);
    document.getElementById('btnClearMapa').addEventListener('click', clearMapa);
    document.getElementById('btnSyncMapa').addEventListener('click', syncMapa);
    document.getElementById('gridSize').addEventListener('change', (e) => {
        gridSize = parseInt(e.target.value) || 10;
        saveMapa();
        renderMapa();
    });

    // Upload de fundo
    document.getElementById('btnCarregarFundo').addEventListener('click', () => {
        document.getElementById('mapaFundoInput').click();
    });
    document.getElementById('mapaFundoInput').addEventListener('change', handleFundoUpload);
    document.getElementById('btnRemoverFundo').addEventListener('click', removerFundo);

    // Eventos do canvas (arrastar tokens, clicar)
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('click', handleCanvasClick);
    window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    renderMapa();
}

function renderMapa() {
    if (!ctx) return;
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Desenha fundo (se houver)
    if (backgroundImage) {
        ctx.drawImage(backgroundImage, 0, 0, w, h);
    }

    // Desenha grid
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

    // Desenha tokens
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
    document.getElementById('tokenStatus').textContent = 
        tokens.length ? `${tokens.length} tokens no mapa.` : 'Nenhum token.';
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
    if (confirm('Limpar todos os tokens?')) {
        tokens = [];
        selectedTokenId = null;
        saveMapa();
        renderMapa();
    }
}

function syncMapa() {
    appState.enviarNotificacao('🗺️ Mapa atualizado pelo mestre.');
    saveMapa();
}

// ============================================================
// FUNDO (UPLOAD DE IMAGEM)
// ============================================================
function handleFundoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        const img = new Image();
        img.src = ev.target.result;
        img.onload = () => {
            backgroundImage = img;
            document.getElementById('btnRemoverFundo').style.display = '';
            saveMapa();
            renderMapa();
            window.showToast?.('🖼️ Fundo carregado!');
        };
    };
    reader.readAsDataURL(file);
}

function removerFundo() {
    backgroundImage = null;
    document.getElementById('btnRemoverFundo').style.display = 'none';
    saveMapa();
    renderMapa();
    window.showToast?.('🖼️ Fundo removido.');
}

// ============================================================
// ARRASTAR TOKENS
// ============================================================
function getGridPos(mx, my) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (mx - rect.left) * scaleX;
    const y = (my - rect.top) * scaleY;
    const cellSize = canvas.width / gridSize;
    return { gridX: Math.floor(x / cellSize), gridY: Math.floor(y / cellSize), x, y, cellSize };
}

function handleMouseDown(e) {
    const pos = getGridPos(e.clientX, e.clientY);
    const clicked = tokens.find(t => t.x === pos.gridX && t.y === pos.gridY);
    if (clicked) {
        selectedTokenId = clicked.id;
        draggingToken = clicked;
        const cellSize = pos.cellSize;
        dragOffsetX = (pos.x - clicked.x * cellSize) / cellSize;
        dragOffsetY = (pos.y - clicked.y * cellSize) / cellSize;
        canvas.style.cursor = 'grabbing';
        renderMapa();
        return;
    }
    // Se clicar em área vazia, desseleciona
    selectedTokenId = null;
    renderMapa();
}

function handleMouseMove(e) {
    const pos = getGridPos(e.clientX, e.clientY);
    // Tooltip
    const tooltip = document.getElementById('mapaTooltip');
    if (pos.gridX >= 0 && pos.gridX < gridSize && pos.gridY >= 0 && pos.gridY < gridSize) {
        tooltip.textContent = `(${pos.gridX}, ${pos.gridY})`;
        tooltip.style.display = 'block';
    } else {
        tooltip.style.display = 'none';
    }

    if (draggingToken) {
        const newGridX = Math.round(pos.x / pos.cellSize - dragOffsetX);
        const newGridY = Math.round(pos.y / pos.cellSize - dragOffsetY);
        // Limita ao grid
        const clampedX = Math.max(0, Math.min(gridSize - 1, newGridX));
        const clampedY = Math.max(0, Math.min(gridSize - 1, newGridY));
        // Verifica se a posição está ocupada por outro token (exceto ele mesmo)
        const occupied = tokens.some(t => t.id !== draggingToken.id && t.x === clampedX && t.y === clampedY);
        if (!occupied) {
            draggingToken.x = clampedX;
            draggingToken.y = clampedY;
            renderMapa();
        }
    }
}

function handleMouseUp(e) {
    if (draggingToken) {
        saveMapa();
        draggingToken = null;
        canvas.style.cursor = 'grab';
    }
}

function handleCanvasClick(e) {
    const pos = getGridPos(e.clientX, e.clientY);
    const clicked = tokens.find(t => t.x === pos.gridX && t.y === pos.gridY);
    if (clicked) {
        selectedTokenId = clicked.id;
        renderMapa();
    } else {
        selectedTokenId = null;
        renderMapa();
    }
}

// ============================================================
// SALVAR ESTADO
// ============================================================
function saveMapa() {
    const data = {
        gridSize,
        tokens,
        background: backgroundImage ? backgroundImage.src : null
    };
    appState.set('mapa', data);
}