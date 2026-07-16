// modules/chat/chat.js
import appState from '../../assets/js/app.js';
import { escapeHtml } from '../../core/utils/utils.js';

export function init() {
    // Inicializa histórico se não existir
    if (!appState.get('chatHistory')) appState.set('chatHistory', []);
    renderHistoricoChat();
    appState.subscribe('chatHistory', renderHistoricoChat);

    document.getElementById('btnSendChat').addEventListener('click', enviarMensagem);
    document.getElementById('chatInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') enviarMensagem();
    });

    // Listener global para mensagens recebidas via P2P
    window._handleChatMessage = (msg) => {
        if (msg.type === 'chat') {
            adicionarMensagem(msg.autor, msg.texto, msg.timestamp);
        }
    };

    if (appState.connection) {
        appState.connection.on('data', (msg) => {
            if (msg.type === 'chat') {
                adicionarMensagem(msg.autor, msg.texto, msg.timestamp);
            }
        });
    }
    if (appState.peer && appState.getRole() === 'master') {
        appState.peer.on('connection', (conn) => {
            conn.on('data', (msg) => {
                if (msg.type === 'chat') {
                    adicionarMensagem(msg.autor, msg.texto, msg.timestamp);
                    if (appState.connection && appState.connection.open) {
                        appState.connection.send(msg);
                    }
                }
            });
        });
    }

    // ========== WEBRTC ESBOÇO ==========
    document.getElementById('btnLigarVideo')?.addEventListener('click', iniciarVideo);
}

function enviarMensagem() {
    const input = document.getElementById('chatInput');
    const texto = input.value.trim();
    if (!texto) return;
    const msg = {
        type: 'chat',
        autor: appState.getRole() === 'master' ? '👑 Mestre' : '🎮 Jogador',
        texto,
        timestamp: Date.now()
    };
    if (appState.connection && appState.connection.open) {
        appState.connection.send(msg);
    }
    adicionarMensagem(msg.autor, msg.texto, msg.timestamp);
    input.value = '';
}

function adicionarMensagem(autor, texto, timestamp) {
    // Salva no histórico permanente
    const history = appState.get('chatHistory') || [];
    history.push({ autor, texto, timestamp });
    if (history.length > 500) history.splice(0, history.length - 500);
    appState.set('chatHistory', history);
    // Renderização imediata
    renderHistoricoChat();
}

function renderHistoricoChat() {
    const history = appState.get('chatHistory') || [];
    const container = document.getElementById('chatMessages');
    if (!container) return;
    const ultimas = history.slice(-50);
    container.innerHTML = ultimas.map(msg => `
        <div style="margin-bottom:4px;">
            <strong style="color:var(--gold);">${escapeHtml(msg.autor)}:</strong>
            <span style="color:var(--text);">${escapeHtml(msg.texto)}</span>
            <span style="font-size:0.7rem; color:var(--text-dim);">${new Date(msg.timestamp).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</span>
        </div>
    `).join('');
    container.scrollTop = container.scrollHeight;
}

// ========== WEBRTC ESBOÇO ==========
let localStream, remoteStream, peerConnection;
const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

async function iniciarVideo() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        document.getElementById('localVideo').srcObject = localStream;
        document.getElementById('localVideo').style.display = 'block';
        window.showToast?.('📹 Vídeo ativado (sinalização manual necessária)');
    } catch (err) {
        window.showToast?.('❌ Erro ao acessar câmera: ' + err.message);
    }
}