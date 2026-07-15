// modules/mapa/mapa.js
import appState from '../../assets/js/app.js';
import { generateId, escapeHtml } from '../../core/utils/utils.js';

let canvas, ctx;
let gridSize = 10;
let selectedTokenId = null;
let tokens = [];

export function init() {
    canvas = document.getElementById('mapCanvas');
    ctx = canvas.getContext('2d');
    resizeCanvas();

    const saved = appState.get('mapa');
    if (saved) {
        gridSize = saved.gridSize || 10;
        tokens = saved.tokens || [];
        document.getElementById('gridSize').value = gridSize;
    }

    renderMapa();
    appState.subscribe('mapa', (data) => {
        if (data) {
            gridSize = data.gridSize || 10;
            tokens = data.tokens || [];
            renderMapa();
        }
    });

    document.getElementById('btnAddToken').addEventListener('click', addToken);
    document.getElementById('btnClearMapa').addEventListener('click', clearMapa);
    document.getElementById('btnSyncMapa').addEventListener('click', syncMapa);
    document.getElementById('gridSize').addEventListener('change', (e) => {
        gridSize = parseInt(e.target.value) || 10;
        saveMapa();
        renderMapa();
    });

    canvas.addEventListener('click', handleCanvasClick);
    window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    const size = Math.min(rect.width, window.innerHeight * 0.6);
    canvas.width = size;
    canvas.height = size;
    renderMapa();
}

function renderMapa() {
    if (!ctx) return;
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const cellSize = w / gridSize;
    ctx.strokeStyle = '#444';
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

function handleCanvasClick(e) {
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
        document.getElementById('tokenStatus').textContent = `Token "${clicked.nome}" selecionado.`;
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
    appState.set('mapa', { gridSize, tokens });
}