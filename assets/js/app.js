// assets/js/app.js
class AppState {
    constructor() {
        this.role = localStorage.getItem('ocaso_role') || null;
        this.hostId = localStorage.getItem('ocaso_hostId') || null;
        this.peer = null;
        this.connection = null;
        this.data = this.getDefaultData();
        this.subscribers = new Map();

        if (!this.data.campaignLog) this.data.campaignLog = [];

        if (this.role === 'master') {
            this.loadLocal();
            if (this.hostId) {
                this.startHosting(this.hostId);
            }
        } else if (this.role === 'player' && this.hostId) {
            this.connectToHost(this.hostId);
        } else if (this.role === 'spectator' && this.hostId) {
            this.connectToHost(this.hostId); // Espectador também se conecta
        }
    }

    getDefaultData() {
        return {
            campaign: 'A Sombra do Dragão',
            characters: [],
            sessions: [],
            combat: { combatants: [], turnIndex: 0, luckPoints: 0, jackpotUsed: false },
            quests: [],
            items: [],
            spells: [],
            domains: [],
            lores: [],
            settings: { theme: 'default', autoSave: true, language: 'pt-BR' },
            sessionStatus: 'waiting' // waiting, playing, paused
        };
    }

    setRole(role) {
        this.role = role;
        localStorage.setItem('ocaso_role', role);
    }
    getRole() { return this.role; }

    clearRole() {
        localStorage.removeItem('ocaso_role');
        localStorage.removeItem('ocaso_hostId');
        this.role = null;
        this.hostId = null;
        this.destroyOnlineRoom();
    }

    saveLocally() {
        localStorage.setItem('ocaso_data', JSON.stringify(this.data));
    }
    loadLocal() {
        const saved = localStorage.getItem('ocaso_data');
        if (saved) {
            const parsed = JSON.parse(saved);
            this.data = { ...this.getDefaultData(), ...parsed };
            if (!this.data.campaignLog) this.data.campaignLog = [];
        }
    }

    startHosting(id) {
        if (this.peer) this.destroyOnlineRoom();
        this.peer = new Peer(id);
        this.peer.on('open', (peerId) => {
            this.hostId = peerId;
            localStorage.setItem('ocaso_hostId', peerId);
        });
        this.peer.on('connection', (conn) => {
            this.connection = conn;
            conn.on('open', () => {
                conn.send({ type: 'fullSync', data: this.data });
            });
            conn.on('data', (received) => {
                // Processar mensagens do jogador
                if (received.type === 'rollRequest') {
                    if (window.showToast) {
                        window.showToast(`📨 ${received.player} pede rolagem de ${received.skill} (CD ${received.difficulty})`);
                    }
                    // O mestre pode responder com um roll (exemplo)
                    // const roll = Math.floor(Math.random() * 20) + 1;
                    // conn.send({ type: 'rollResponse', skill: received.skill, difficulty: received.difficulty, roll, approved: true });
                }
                if (received.type === 'chat') {
                    // já tratado no chat.js
                }
                if (received.type === 'notification') {
                    // já tratado
                }
            });
        });
    }

    async createOnlineRoom() {
        return new Promise((resolve) => {
            if (this.peer) this.destroyOnlineRoom();
            this.peer = new Peer();
            this.peer.on('open', (id) => {
                this.hostId = id;
                localStorage.setItem('ocaso_hostId', id);
                this.peer.on('connection', (conn) => {
                    this.connection = conn;
                    conn.on('open', () => {
                        conn.send({ type: 'fullSync', data: this.data });
                    });
                    conn.on('data', (msg) => {
                        // Lidar com mensagens do jogador
                    });
                });
                resolve(id);
            });
            this.peer.on('error', (err) => {
                console.error('Erro no Peer:', err);
                resolve(null);
            });
        });
    }

    destroyOnlineRoom() {
        if (this.connection) {
            this.connection.close();
            this.connection = null;
        }
        if (this.peer) {
            this.peer.destroy();
            this.peer = null;
        }
        localStorage.removeItem('ocaso_hostId');
        this.hostId = null;
    }

    broadcastUpdate() {
        if (this.connection && this.connection.open) {
            this.connection.send({ type: 'update', data: this.data });
        }
    }

    connectToHost(hostId) {
        this.peer = new Peer();
        this.peer.on('open', (myId) => {
            this.connection = this.peer.connect(hostId, { reliable: true });
            this.connection.on('open', () => {});
            this.connection.on('data', (msg) => {
                if (msg.type === 'fullSync' || msg.type === 'update') {
                    this.data = { ...this.getDefaultData(), ...msg.data };
                    if (!this.data.campaignLog) this.data.campaignLog = [];
                    this.notifyAll();
                }
                if (msg.type === 'notification') {
                    window.showToast?.('🔔 ' + msg.message);
                }
                if (msg.type === 'chat') {
                    window._handleChatMessage?.(msg);
                }
                if (msg.type === 'rollResponse') {
                    // Recebe resposta do mestre para um pedido de rolagem
                    const sucesso = msg.roll >= msg.difficulty;
                    const el = document.getElementById('rollRequestResult');
                    if (el) {
                        el.innerHTML = `🎲 ${msg.skill}: ${msg.roll} (${sucesso ? '✅ Sucesso' : '❌ Falha'})`;
                    }
                    window.showToast?.(`📨 ${msg.skill}: ${msg.roll} (${sucesso ? 'Sucesso' : 'Falha'})`);
                }
                if (msg.type === 'rollRequest') {
                    // Jogador recebe notificação? (opcional)
                }
            });
        });
        this.peer.on('error', (err) => {
            console.error('Erro ao conectar ao host:', err);
            alert('Não foi possível conectar ao mestre. Verifique o ID da sala.');
        });
        this.hostId = hostId;
        localStorage.setItem('ocaso_hostId', hostId);
    }

    get(domain) { return this.data[domain]; }

    set(domain, value) {
        // Espectador não pode modificar dados
        if (this.role === 'spectator') {
            console.warn('Espectador não pode modificar dados.');
            return;
        }
        this.data[domain] = value;
        if (this.role === 'master') {
            this.saveLocally();
            this.broadcastUpdate();
        } else if (this.role === 'player') {
            localStorage.setItem('ocaso_playerData', JSON.stringify(this.data));
        }
        this.notify(domain);
    }

    subscribe(domain, callback) {
        if (!this.subscribers.has(domain)) this.subscribers.set(domain, []);
        this.subscribers.get(domain).push(callback);
        return () => {
            const arr = this.subscribers.get(domain);
            const idx = arr.indexOf(callback);
            if (idx > -1) arr.splice(idx, 1);
        };
    }

    notify(domain) {
        (this.subscribers.get(domain) || []).forEach(fn => fn(this.data[domain]));
    }
    notifyAll() {
        Object.keys(this.data).forEach(d => this.notify(d));
    }

    reset() {
        if (this.role === 'spectator') return;
        this.data = this.getDefaultData();
        if (!this.data.campaignLog) this.data.campaignLog = [];
        if (this.role === 'master') {
            this.saveLocally();
            this.broadcastUpdate();
        }
        this.notifyAll();
    }

    logAction(message) {
        const entry = { timestamp: Date.now(), message };
        if (!this.data.campaignLog) this.data.campaignLog = [];
        this.data.campaignLog.push(entry);
        this.notify('campaignLog');
        if (this.role === 'master') {
            this.saveLocally();
            this.broadcastUpdate();
        } else if (this.role === 'player') {
            localStorage.setItem('ocaso_playerData', JSON.stringify(this.data));
        }
        // Espectador não loga
    }

    enviarNotificacao(mensagem) {
        if (this.role === 'master' && this.connection && this.connection.open) {
            this.connection.send({ type: 'notification', message: mensagem });
            console.log('📨 Notificação enviada:', mensagem);
        }
    }

    exportPlayerPackage() {
        return {
            campaign: this.data.campaign,
            characters: this.data.characters.filter(c => c.isPlayerCharacter).map(c => ({
                id: c.id,
                nome: c.nome,
                classe: c.classe,
                estilo: c.estilo,
                grau: c.grau,
                hpMax: c.hpMax,
                hp: c.hp,
                eaMax: c.eaMax,
                ea: c.ea,
                pericias: c.pericias,
                cicatrizes: c.cicatrizes,
                ambicao: c.ambicao,
                notas: c.notas
            })),
            quests: this.data.quests.filter(q => q.visivelJogadores).map(q => ({
                id: q.id,
                titulo: q.titulo,
                desc: q.desc,
                status: q.status,
                recompensa: q.recompensa
            }))
        };
    }
}

export const appState = new AppState();
export default appState;