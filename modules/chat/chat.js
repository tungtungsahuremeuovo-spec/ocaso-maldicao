// modules/chat/chat.js
import appState from '../../assets/js/app.js';

export function init() {
    document.getElementById('btnSendChat').addEventListener('click', enviarMensagem);
    document.getElementById('chatInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') enviarMensagem();
    });

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
    const container = document.getElementById('chatMessages');
    const hora = new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    container.innerHTML += `<div style="margin-bottom:4px;"><strong style="color:var(--gold);">${autor}:</strong> <span style="color:var(--text);">${texto}</span> <span style="font-size:0.7rem; color:var(--text-dim);">${hora}</span></div>`;
    container.scrollTop = container.scrollHeight;
}