// modules/chat/chat.js
import appState from '../../assets/js/app.js';
import { escapeHtml } from '../../core/utils/utils.js';

let localStream = null;
let remoteStream = null;
let peerConnection = null;
let isCallActive = false;

const iceServers = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
};

export function init() {
    // Inicializa histórico do chat
    if (!appState.get('chatHistory')) appState.set('chatHistory', []);
    renderHistoricoChat();
    appState.subscribe('chatHistory', renderHistoricoChat);

    document.getElementById('btnSendChat').addEventListener('click', enviarMensagem);
    document.getElementById('chatInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') enviarMensagem();
    });

    // Vídeo
    document.getElementById('btnLigarVideo').addEventListener('click', iniciarVideo);
    document.getElementById('btnDesligarVideo').addEventListener('click', desligarVideo);

    // Listener para mensagens recebidas via P2P (incluindo sinalização WebRTC)
    window._handleChatMessage = (msg) => {
        if (msg.type === 'chat') {
            adicionarMensagem(msg.autor, msg.texto, msg.timestamp);
        }
        if (msg.type === 'video-offer') {
            handleVideoOffer(msg);
        }
        if (msg.type === 'video-answer') {
            handleVideoAnswer(msg);
        }
        if (msg.type === 'video-ice') {
            handleIceCandidate(msg);
        }
        if (msg.type === 'video-hangup') {
            desligarVideo();
        }
    };

    // Se já houver conexão, escuta mensagens
    if (appState.connection) {
        appState.connection.on('data', (msg) => {
            if (msg.type === 'chat') {
                adicionarMensagem(msg.autor, msg.texto, msg.timestamp);
            }
            if (msg.type === 'video-offer') {
                handleVideoOffer(msg);
            }
            if (msg.type === 'video-answer') {
                handleVideoAnswer(msg);
            }
            if (msg.type === 'video-ice') {
                handleIceCandidate(msg);
            }
            if (msg.type === 'video-hangup') {
                desligarVideo();
            }
        });
    }

    // Mestre: retransmite sinalização para todos os conectados
    if (appState.peer && appState.getRole() === 'master') {
        appState.peer.on('connection', (conn) => {
            conn.on('data', (msg) => {
                // Retransmite mensagens de sinalização para todos (broadcast)
                if (msg.type && msg.type.startsWith('video-')) {
                    if (appState.connection && appState.connection.open) {
                        appState.connection.send(msg);
                    }
                }
                if (msg.type === 'chat') {
                    adicionarMensagem(msg.autor, msg.texto, msg.timestamp);
                    if (appState.connection && appState.connection.open) {
                        appState.connection.send(msg);
                    }
                }
            });
        });
    }
}

// ============================================================
// CHAT
// ============================================================
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
    const history = appState.get('chatHistory') || [];
    history.push({ autor, texto, timestamp });
    if (history.length > 500) history.splice(0, history.length - 500);
    appState.set('chatHistory', history);
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

// ============================================================
// WEBRTC – VÍDEO/VOZ FUNCIONAL
// ============================================================
async function iniciarVideo() {
    if (isCallActive) return;

    try {
        // Obtém stream local (câmera + microfone)
        localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });

        document.getElementById('localVideo').srcObject = localStream;
        document.getElementById('localVideo').style.display = 'block';
        document.getElementById('btnLigarVideo').style.display = 'none';
        document.getElementById('btnDesligarVideo').style.display = '';
        document.getElementById('videoStatus').textContent = '🟢 Conectando...';
        document.getElementById('videoStatus').style.color = 'var(--gold)';

        // Cria PeerConnection
        peerConnection = new RTCPeerConnection(iceServers);

        // Adiciona tracks locais
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });

        // Recebe stream remoto
        peerConnection.ontrack = (event) => {
            remoteStream = event.streams[0];
            document.getElementById('remoteVideo').srcObject = remoteStream;
            document.getElementById('remoteVideo').style.display = 'block';
            document.getElementById('videoStatus').textContent = '🟢 Chamada ativa';
            document.getElementById('videoStatus').style.color = 'var(--green)';
            isCallActive = true;
        };

        // Coleta candidatos ICE e envia
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                enviarSinalizacao({
                    type: 'video-ice',
                    candidate: event.candidate
                });
            }
        };

        // Cria oferta (apenas o mestre inicia)
        if (appState.getRole() === 'master') {
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            enviarSinalizacao({
                type: 'video-offer',
                sdp: offer
            });
        } else {
            // Jogador aguarda oferta do mestre
            document.getElementById('videoStatus').textContent = '🟡 Aguardando mestre...';
        }

    } catch (err) {
        console.error('Erro ao iniciar vídeo:', err);
        window.showToast?.('❌ Erro ao acessar câmera/mic: ' + err.message);
        desligarVideo();
    }
}

function desligarVideo() {
    isCallActive = false;

    // Fecha peer connection
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }

    // Para tracks locais
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }

    // Limpa streams remotas
    if (remoteStream) {
        remoteStream.getTracks().forEach(track => track.stop());
        remoteStream = null;
    }

    // Reseta UI
    document.getElementById('localVideo').srcObject = null;
    document.getElementById('localVideo').style.display = 'none';
    document.getElementById('remoteVideo').srcObject = null;
    document.getElementById('remoteVideo').style.display = 'none';
    document.getElementById('btnLigarVideo').style.display = '';
    document.getElementById('btnDesligarVideo').style.display = 'none';
    document.getElementById('videoStatus').textContent = '🔴 Desconectado';
    document.getElementById('videoStatus').style.color = 'var(--text-dim)';

    // Notifica os outros
    enviarSinalizacao({ type: 'video-hangup' });
    window.showToast?.('📹 Chamada encerrada.');
}

// ============================================================
// SINALIZAÇÃO WEBRTC (via PeerJS)
// ============================================================
function enviarSinalizacao(msg) {
    if (appState.connection && appState.connection.open) {
        appState.connection.send(msg);
    }
}

// Recebe oferta do mestre (jogador)
async function handleVideoOffer(msg) {
    if (appState.getRole() !== 'player') return;
    if (!peerConnection) {
        // Se não tiver stream local, inicia
        await iniciarVideo();
    }
    if (!peerConnection) return;

    try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(msg.sdp));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        enviarSinalizacao({
            type: 'video-answer',
            sdp: answer
        });
    } catch (err) {
        console.error('Erro ao processar oferta:', err);
    }
}

// Recebe resposta do jogador (mestre)
async function handleVideoAnswer(msg) {
    if (appState.getRole() !== 'master') return;
    if (!peerConnection) return;
    try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(msg.sdp));
    } catch (err) {
        console.error('Erro ao processar resposta:', err);
    }
}

// Recebe candidato ICE
async function handleIceCandidate(msg) {
    if (!peerConnection) return;
    try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(msg.candidate));
    } catch (err) {
        console.error('Erro ao adicionar ICE candidate:', err);
    }
}

// Listener para quando o módulo é descarregado
window.addEventListener('beforeunload', () => {
    desligarVideo();
});