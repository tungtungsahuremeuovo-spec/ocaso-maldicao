// modules/chat/chat.js
import appState from '../../assets/js/app.js';
import { escapeHtml } from '../../core/utils/utils.js';

let typingTimeout = null;

export function init() {
    if (!appState.get('chatHistory')) appState.set('chatHistory', []);
    renderHistoricoChat();
    appState.subscribe('chatHistory', renderHistoricoChat);

    document.getElementById('btnSendChat').addEventListener('click', enviarMensagem);
    document.getElementById('chatInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') enviarMensagem();
    });

    // ✅ Indicador de digitando
    const chatInput = document.getElementById('chatInput');
    chatInput.addEventListener('focus', () => enviarDigitando(true));
    chatInput.addEventListener('blur', () => enviarDigitando(false));
    chatInput.addEventListener('input', () => {
        if (chatInput.value.length > 0) {
            enviarDigitando(true);
            clearTimeout(typingTimeout);
            typingTimeout = setTimeout(() => enviarDigitando(false), 2000);
        }
    });

    // Listener para mensagens recebidas
    window._handleChatMessage = (msg) => {
        if (msg.type === 'chat') {
            adicionarMensagem(msg.autor, msg.texto, msg.timestamp);
            // Som de mensagem
            playSound('message');
        }
        if (msg.type === 'typing') {
            atualizarIndicadorDigitando(msg.autor, msg.ativo);
        }
    };

}

export function destroy() {
    clearTimeout(typingTimeout);
    typingTimeout = null;
    delete window._handleChatMessage;
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
    enviarDigitando(false);
    playSound('message');
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
// ✅ INDICADOR DE "DIGITANDO..."
// ============================================================
function enviarDigitando(ativo) {
    if (!appState.connection || !appState.connection.open) return;
    appState.connection.send({
        type: 'typing',
        ativo,
        autor: appState.getRole() === 'master' ? 'Mestre' : 'Jogador'
    });
}

function atualizarIndicadorDigitando(autor, ativo) {
    let el = document.getElementById('chatTyping');
    if (ativo) {
        if (!el) {
            el = document.createElement('div');
            el.id = 'chatTyping';
            el.style.cssText = 'font-size:0.8rem; color:var(--text-dim); margin-top:2px;';
            const container = document.getElementById('chatMessages');
            if (container) container.appendChild(el);
        }
        el.textContent = `${autor} está digitando...`;
    } else {
        if (el) el.textContent = '';
    }
}

// ============================================================
// ✅ SONS DE NOTIFICAÇÃO
// ============================================================
function playSound(type) {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        if (type === 'turn') {
            osc.frequency.value = 800;
            gain.gain.value = 0.2;
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.1);
        } else if (type === 'message') {
            osc.frequency.value = 600;
            gain.gain.value = 0.15;
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.08);
        } else if (type === 'critical') {
            osc.frequency.value = 1000;
            gain.gain.value = 0.3;
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.15);
        }
    } catch(e) { /* silencioso */ }
}
