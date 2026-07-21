// assets/js/app.js
import { openDatabase, saveData, loadData, clearAllData, saveSlot, loadSlot, listSlots } from '../core/database/indexedDB.js';

class AppState {
    constructor() {
        this.role = localStorage.getItem('ocaso_role') || null;
        this.hostId = localStorage.getItem('ocaso_hostId') || null;
        this.peer = null;
        this.connection = null;
        this.data = this.getDefaultData();
        this.subscribers = new Map();
        this._dbReady = false;

        if (!this.data.campaignLog) this.data.campaignLog = [];

        // Inicializa IndexedDB (se falhar, usa localStorage)
        this.initDB().catch(() => {
            console.warn('IndexedDB não disponível, usando localStorage como fallback.');
            this.loadLocalFallback();
        });

        if (this.role === 'master') {
            this.loadLocal();
            if (this.hostId) {
                this.startHosting(this.hostId);
            }
        } else if (this.role === 'player' && this.hostId) {
            this.connectToHost(this.hostId);
        } else if (this.role === 'spectator' && this.hostId) {
            this.connectToHost(this.hostId);
        }
    }

    getDefaultData() {
        return {
            campaign: 'A Sombra do Dragão',
            characters: [],
            sessions: [],
            combat: { 
                combatants: [], 
                turnIndex: 0, 
                luckPoints: 0, 
                jackpotUsed: false,
                historico: [],
                currentRound: 0
            },
            quests: [],
            items: [],
            spells: [],
            domains: [],
            lores: [],
            settings: { theme: 'default', autoSave: true, language: 'pt-BR' },
            sessionStatus: 'waiting',
            avisos: [],
            notas: '',
            npcs: [],
            relacionamentos: [],
            macros: [],
            roteiro: [],
            loot: []
        };
    }

    async initDB() {
        try {
            await openDatabase();
            this._dbReady = true;
            // Carrega dados do IndexedDB se existirem
            const saved = await loadData();
            if (saved) {
                this.data = { ...this.getDefaultData(), ...saved };
                if (!this.data.campaignLog) this.data.campaignLog = [];
                this.notifyAll();
            }
        } catch (e) {
            console.warn('Erro ao inicializar IndexedDB:', e);
            throw e; // repassa para o catch do construtor
        }
    }

    loadLocalFallback() {
        const saved = localStorage.getItem('ocaso_data');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                this.data = { ...this.getDefaultData(), ...parsed };
                if (!this.data.campaignLog) this.data.campaignLog = [];
            } catch (e) {
                console.warn('Erro ao parsear dados do localStorage:', e);
            }
        }
    }

    async saveLocally() {
        if (this._dbReady) {
            try {
                await saveData(this.data);
                return;
            } catch (e) {
                console.warn('Erro ao salvar no IndexedDB, usando fallback:', e);
            }
        }
        // Fallback para localStorage
        localStorage.setItem('ocaso_data', JSON.stringify(this.data));
    }

    async loadLocal() {
        if (this._dbReady) {
            try {
                const saved = await loadData();
                if (saved) {
                    this.data = { ...this.getDefaultData(), ...saved };
                    if (!this.data.campaignLog) this.data.campaignLog = [];
                    return;
                }
            } catch (e) {
                console.warn('Erro ao carregar do IndexedDB:', e);
            }
        }
        this.loadLocalFallback();
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
                if (received.type === 'rollRequest') {
                    window.showToast?.(`📨 ${received.player} pede rolagem de ${received.skill} (CD ${received.difficulty})`);
                }
                if (received.type === 'chat') {
                    // tratado no chat.js
                }
                if (received.type === 'notification') {
                    // tratado
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
                        // lidar com mensagens
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
                    this.saveLocally();
                }
                if (msg.type === 'notification') {
                    window.showToast?.('🔔 ' + msg.message);
                }
                if (msg.type === 'chat') {
                    window._handleChatMessage?.(msg);
                }
                if (msg.type === 'rollResponse') {
                    const sucesso = msg.roll >= msg.difficulty;
                    const el = document.getElementById('rollRequestResult');
                    if (el) {
                        el.innerHTML = `🎲 ${msg.skill}: ${msg.roll} (${sucesso ? '✅ Sucesso' : '❌ Falha'})`;
                    }
                    window.showToast?.(`📨 ${msg.skill}: ${msg.roll} (${sucesso ? 'Sucesso' : 'Falha'})`);
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

    async set(domain, value) {
        if (this.role === 'spectator') {
            console.warn('Espectador não pode modificar dados.');
            return;
        }
        this.data[domain] = value;
        if (this.role === 'master') {
            await this.saveLocally();
            this.broadcastUpdate();
        } else if (this.role === 'player') {
            await this.saveLocally();
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

    async reset() {
        if (this.role === 'spectator') return;
        this.data = this.getDefaultData();
        if (!this.data.campaignLog) this.data.campaignLog = [];
        if (this.role === 'master') {
            await this.saveLocally();
            this.broadcastUpdate();
        } else {
            await this.saveLocally();
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
            this.saveLocally();
        }
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
                notas: c.notas,
                forca: c.forca,
                destreza: c.destreza,
                constituicao: c.constituicao,
                inteligencia: c.inteligencia,
                sabedoria: c.sabedoria,
                presenca: c.presenca,
                reputacao: c.reputacao
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