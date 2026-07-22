// modules/sala/sala.js
import appState from '../../assets/js/app.js';

let presencas = [];
let votacao = { ativa: false, opcoes: [], votos: {} };
let heartbeatInterval = null;
let player = null;
let playerReady = false;
let isMusicPlaying = false;

// Playlist do YouTube (loop infinito)
const PLAYLIST_ID = 'PL_ySVN3UWoWDNSAEk3pzzz6q58NEOBnXU';
const PLAYLIST_URL = `https://www.youtube.com/embed/videoseries?list=${PLAYLIST_ID}&autoplay=1&loop=1&playlist=${PLAYLIST_ID}&enablejsapi=1&rel=0&modestbranding=1`;

// Carrega a API do YouTube dinamicamente
function loadYouTubeAPI() {
    return new Promise((resolve) => {
        if (window.YT && window.YT.Player) {
            resolve();
            return;
        }
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        window.onYouTubeIframeAPIReady = () => {
            resolve();
        };
    });
}

function criarPlayer() {
    const container = document.getElementById('youtubePlayer');
    if (!container) return;
    
    // Limpa o container antes de criar o player
    container.innerHTML = '';
    
    player = new YT.Player('youtubePlayer', {
        height: '100%',
        width: '100%',
        videoId: '', // será substituído pela playlist
        playerVars: {
            listType: 'playlist',
            list: PLAYLIST_ID,
            autoplay: 0,
            loop: 1,
            rel: 0,
            modestbranding: 1,
            controls: 1,
            showinfo: 0,
            iv_load_policy: 3,
            disablekb: 0
        },
        events: {
            onReady: (event) => {
                playerReady = true;
                if (isMusicPlaying) {
                    event.target.playVideo();
                }
                console.log('🎵 Player do YouTube pronto!');
            },
            onStateChange: (event) => {
                // Quando o vídeo termina, a API já faz o loop automático
                // porque configuramos loop=1 e playlist
                const status = document.getElementById('musicaStatus');
                if (event.data === YT.PlayerState.PLAYING) {
                    if (status) status.textContent = '▶️ Tocando';
                } else if (event.data === YT.PlayerState.PAUSED) {
                    if (status) status.textContent = '⏸️ Pausado';
                } else if (event.data === YT.PlayerState.ENDED) {
                    // A API já cuida do loop, mas podemos forçar se necessário
                    if (player && isMusicPlaying) {
                        player.playVideo();
                    }
                }
            },
            onError: (event) => {
                console.error('Erro no YouTube Player:', event);
                // Tenta recarregar em caso de erro
                setTimeout(() => {
                    if (player && isMusicPlaying) {
                        player.loadPlaylist({list: PLAYLIST_ID, listType: 'playlist'});
                        player.playVideo();
                    }
                }, 2000);
            }
        }
    });
}

export function init() {
    const role = appState.getRole();
    const status = appState.get('sessionStatus') || 'waiting';
    document.getElementById('sessionStatus').textContent = 
        status === 'waiting' ? '🟡 Aguardando jogadores' :
        status === 'playing' ? '🟢 Em andamento' :
        '⏸️ Pausado';

    if (role === 'master' && appState.hostId) {
        const btnCopiar = document.getElementById('btnCopiarIdSala');
        btnCopiar.style.display = '';
        btnCopiar.addEventListener('click', () => {
            navigator.clipboard.writeText(appState.hostId).then(() => {
                window.showToast?.('📋 ID da sala copiado!');
            }).catch(() => {
                window.showToast?.('📋 ID: ' + appState.hostId);
            });
        });
    }

    heartbeatInterval = setInterval(() => {
        if (appState.connection && appState.connection.open) {
            appState.connection.send({ type: 'ping', timestamp: Date.now() });
        }
    }, 30000);

    if (appState.connection) {
        appState.connection.on('data', (msg) => {
            if (msg.type === 'ping') {
                document.getElementById('presencaStatus').textContent = '🟢 Online';
                document.getElementById('presencaStatus').style.color = 'var(--green)';
            }
        });
    }

    const container = document.getElementById('jogadoresLista');
    if (appState.connection && appState.connection.open) {
        container.innerHTML = `<p>Jogador conectado: ${appState.connection.peer}</p>`;
        document.getElementById('presencaStatus').textContent = '🟢 Online';
    } else {
        container.innerHTML = '<p class="empty-state">Nenhum jogador conectado.</p>';
        document.getElementById('presencaStatus').textContent = '🔴 Offline';
    }

    // Carrega a API do YouTube ao iniciar o módulo (apenas para o mestre)
    if (role === 'master') {
        loadYouTubeAPI().then(() => {
            console.log('🎵 API do YouTube carregada!');
        }).catch(err => {
            console.error('Erro ao carregar API do YouTube:', err);
        });
    }

    if (role === 'master') {
        document.getElementById('btnIniciarSessao').style.display = '';
        document.getElementById('btnEncerrarSessao').style.display = '';
        document.getElementById('btnIniciarSessao').addEventListener('click', () => {
            appState.set('sessionStatus', 'playing');
            appState.enviarNotificacao('▶️ A sessão começou!');
            document.getElementById('sessionStatus').textContent = '🟢 Em andamento';
            iniciarMusica();
        });
        document.getElementById('btnEncerrarSessao').addEventListener('click', () => {
            appState.set('sessionStatus', 'waiting');
            appState.enviarNotificacao('⏹️ A sessão foi encerrada.');
            document.getElementById('sessionStatus').textContent = '🟡 Aguardando jogadores';
            pararMusica();
        });
    }

    appState.subscribe('sessionStatus', (newStatus) => {
        document.getElementById('sessionStatus').textContent = 
            newStatus === 'waiting' ? '🟡 Aguardando jogadores' :
            newStatus === 'playing' ? '🟢 Em andamento' : '⏸️ Pausado';
        if (newStatus === 'playing') {
            iniciarMusica();
        } else {
            pararMusica();
        }
    });

    document.getElementById('btnMarcarPresenca').addEventListener('click', marcarPresenca);
    document.getElementById('btnInspiracao').addEventListener('click', iniciarVotacao);

    // Limpeza ao descarregar a página
    window.addEventListener('beforeunload', () => {
        pararMusica();
        clearInterval(heartbeatInterval);
    });
}

// ============================================================
// CONTROLE DE MÚSICA
// ============================================================

function iniciarMusica() {
    isMusicPlaying = true;
    const container = document.getElementById('playerContainer');
    if (container) container.style.display = 'block';
    
    // Se o player já existe, apenas toca
    if (player && playerReady) {
        player.playVideo();
        document.getElementById('musicaStatus').textContent = '▶️ Tocando';
        return;
    }
    
    // Se o player não existe, cria
    if (window.YT && window.YT.Player) {
        criarPlayer();
    } else {
        // Aguarda a API carregar
        loadYouTubeAPI().then(() => {
            criarPlayer();
        }).catch(err => {
            console.error('Erro ao carregar YouTube API:', err);
            window.showToast?.('❌ Erro ao carregar player de música.');
        });
    }
}

function pararMusica() {
    isMusicPlaying = false;
    if (player && playerReady) {
        player.pauseVideo();
        document.getElementById('musicaStatus').textContent = '⏸️ Pausado';
    }
    const container = document.getElementById('playerContainer');
    if (container) container.style.display = 'none';
}

// ============================================================
// PRESENÇA E VOTAÇÃO
// ============================================================

function marcarPresenca() {
    const nome = prompt('Nome do jogador:', '');
    if (!nome) return;
    const data = new Date().toLocaleDateString('pt-BR');
    const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    presencas.push({ nome, data, hora });
    renderPresencas();
    appState.logAction(`✅ ${nome} marcou presença.`);
}

function renderPresencas() {
    const container = document.getElementById('presencaLista');
    if (!presencas.length) {
        container.innerHTML = '<p class="empty-state">Nenhuma presença marcada.</p>';
        return;
    }
    container.innerHTML = presencas.map(p => 
        `<div>${p.nome} - ${p.data} às ${p.hora}</div>`
    ).join('');
}

function iniciarVotacao() {
    const descricao = prompt('O que o grupo quer votar? (ex: "Dar inspiração para João?")');
    if (!descricao) return;
    votacao = { ativa: true, descricao, opcoes: ['Sim', 'Não'], votos: { Sim: 0, Não: 0 } };
    appState.enviarNotificacao(`📊 Votação iniciada: ${descricao}`);
    appState.enviarNotificacao('🗳️ Diga "sim" ou "não" no chat.');
    setTimeout(() => encerrarVotacao(), 30000);
}

function encerrarVotacao() {
    if (!votacao.ativa) return;
    votacao.ativa = false;
    const resultado = votacao.votos.Sim > votacao.votos.Não ? 'Sim' : 'Não';
    const mensagem = `📊 Resultado: ${resultado} (Sim: ${votacao.votos.Sim}, Não: ${votacao.votos.Não})`;
    window.showToast?.(mensagem);
    appState.enviarNotificacao(mensagem);
    if (resultado === 'Sim') {
        appState.logAction('💡 Inspiração concedida ao grupo.');
        window.showToast?.('💡 O grupo recebeu inspiração (vantagem)!');
    }
}

export function destroy() {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
    if (player?.destroy) player.destroy();
    player = null;
    playerReady = false;
    isMusicPlaying = false;
}
