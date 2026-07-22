// assets/js/app.js
import { openDatabase, saveData, loadData, clearAllData, saveSlot, loadSlot } from '../core/database/indexedDB.js';

class AppState {
    constructor() {
        this.role = localStorage.getItem('ocaso_role') || null;
        this.hostId = localStorage.getItem('ocaso_hostId') || null;
        this.peer = null;
        this.connection = null;
        this.data = this.getDefaultData();
        this.subscribers = new Map();
        this._dbReady = false;
        this._saveTimeout = null;
        this._history = [];
        this._future = [];
        this._maxHistory = 50;
        this._recentModules = JSON.parse(localStorage.getItem('ocaso_recentModules') || '[]');
        this._favorites = JSON.parse(localStorage.getItem('ocaso_favorites') || '{}');

        if (!this.data.campaignLog) this.data.campaignLog = [];
        this.initDB();

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

    async initDB() {
        try {
            await openDatabase();
            this._dbReady = true;
            const saved = await loadData();
            if (saved) {
                this.data = { ...this.getDefaultData(), ...saved };
                if (!this.data.campaignLog) this.data.campaignLog = [];
                this.notifyAll();
            }
        } catch (e) {
            console.warn('IndexedDB não disponível, usando localStorage como fallback:', e);
            this.loadLocalFallback();
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
            settings: { theme: 'default', autoSave: true, language: 'pt-BR', sound: true },
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

    loadLocalFallback() {
        const saved = localStorage.getItem('ocaso_data');
        if (saved) {
            const parsed = JSON.parse(saved);
            this.data = { ...this.getDefaultData(), ...parsed };
            if (!this.data.campaignLog) this.data.campaignLog = [];
        }
    }

    saveLocallyFallback() {
        localStorage.setItem('ocaso_data', JSON.stringify(this.data));
    }

    async saveLocally(showToast = false) {
        try {
            await saveData(this.data);
            if (showToast) {
                this._showToast('💾 Campanha salva', 'success');
                this._playSound('save');
            }
        } catch (e) {
            console.warn('Erro ao salvar no IndexedDB, usando fallback:', e);
            this.saveLocallyFallback();
            if (showToast) this._showToast('💾 Campanha salva (local)', 'success');
        }
    }

    async loadLocal() {
        try {
            const saved = await loadData();
            if (saved) {
                this.data = { ...this.getDefaultData(), ...saved };
                if (!this.data.campaignLog) this.data.campaignLog = [];
            }
        } catch (e) {
            this.loadLocalFallback();
        }
    }

    // ============================================================
    // AUTOSAVE INTELIGENTE (⭐ 1)
    // ============================================================
    async set(domain, value) {
        if (this.role === 'spectator') {
            console.warn('Espectador não pode modificar dados.');
            return;
        }

        this._pushHistory();

        this.data[domain] = value;
        if (this.role === 'master') {
            clearTimeout(this._saveTimeout);
            this._saveTimeout = setTimeout(() => {
                this.saveLocally(true);
                this._saveTimeout = null;
            }, 1000);
            this.broadcastUpdate();
        } else if (this.role === 'player') {
            clearTimeout(this._saveTimeout);
            this._saveTimeout = setTimeout(() => {
                this.saveLocally(false);
                this._saveTimeout = null;
            }, 1000);
        }
        this.notify(domain);
    }

    // ============================================================
    // UNDO / REDO REAL (⭐ 2)
    // ============================================================
    _pushHistory() {
        if (this._history.length > this._maxHistory) {
            this._history.shift();
        }
        this._history.push(structuredClone(this.data));
        this._future = [];
    }

    undo() {
        if (this._history.length === 0) {
            this._showToast('⚠️ Nada para desfazer.', 'warning');
            return;
        }
        this._future.push(structuredClone(this.data));
        this.data = this._history.pop();
        if (!this.data.campaignLog) this.data.campaignLog = [];
        this.notifyAll();
        this.saveLocally(false);
        this._showToast('↩️ Desfeito.', 'info');
        this._playSound('undo');
    }

    redo() {
        if (this._future.length === 0) {
            this._showToast('⚠️ Nada para refazer.', 'warning');
            return;
        }
        this._pushHistory();
        this.data = this._future.pop();
        if (!this.data.campaignLog) this.data.campaignLog = [];
        this.notifyAll();
        this.saveLocally(false);
        this._showToast('↪️ Refazendo.', 'info');
        this._playSound('redo');
    }

    // ============================================================
    // FAVORITOS (⭐ 4)
    // ============================================================
    toggleFavorite(type, id) {
        if (!this._favorites[type]) this._favorites[type] = [];
        const idx = this._favorites[type].indexOf(id);
        if (idx > -1) {
            this._favorites[type].splice(idx, 1);
        } else {
            this._favorites[type].push(id);
        }
        localStorage.setItem('ocaso_favorites', JSON.stringify(this._favorites));
        this.notify('favorites');
        this._showToast(idx > -1 ? '⭐ Favorito removido' : '⭐ Adicionado aos favoritos', 'info');
    }

    isFavorite(type, id) {
        return this._favorites[type]?.includes(id) || false;
    }

    getFavorites(type) {
        return this._favorites[type] || [];
    }

    // ============================================================
    // RECENTES (⭐ 5)
    // ============================================================
    addRecentModule(moduleId) {
        this._recentModules = this._recentModules.filter(m => m !== moduleId);
        this._recentModules.unshift(moduleId);
        if (this._recentModules.length > 10) this._recentModules.pop();
        localStorage.setItem('ocaso_recentModules', JSON.stringify(this._recentModules));
        this.notify('recentModules');
    }

    getRecentModules() {
        return this._recentModules;
    }

    // ============================================================
    // HISTÓRICO DE CAMPANHA (⭐ 20)
    // ============================================================
    logAction(message) {
        const entry = { 
            timestamp: Date.now(), 
            message,
            user: this.role === 'master' ? 'Mestre' : 'Jogador'
        };
        if (!this.data.campaignLog) this.data.campaignLog = [];
        this.data.campaignLog.push(entry);
        this.notify('campaignLog');
        clearTimeout(this._saveTimeout);
        this._saveTimeout = setTimeout(() => {
            this.saveLocally(false);
            this._saveTimeout = null;
        }, 500);
    }

    // ============================================================
    // SONS (⭐ 23)
    // ============================================================
    _playSound(type) {
        const soundEnabled = this.data.settings?.sound !== false;
        if (!soundEnabled) return;
        try {
            const sounds = {
                save: { freq: 800, dur: 0.08 },
                undo: { freq: 500, dur: 0.1 },
                redo: { freq: 700, dur: 0.1 },
                roll: { freq: 600, dur: 0.08 },
                combat: { freq: 900, dur: 0.15 },
                quest: { freq: 440, dur: 0.1 },
                notification: { freq: 660, dur: 0.12 }
            };
            const s = sounds[type];
            if (!s) return;
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = s.freq;
            gain.gain.value = 0.15;
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + s.dur);
        } catch(e) { /* silencioso */ }
    }

    // ============================================================
    // TOAST (⭐ 6)
    // ============================================================
    _showToast(msg, type = 'info') {
        if (window.showToast) {
            window.showToast(msg, type);
        }
    }

    // ============================================================
    // P2P E MÉTODOS EXISTENTES
    // ============================================================
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
                    this._showToast(`📨 ${received.player} pede rolagem de ${received.skill} (CD ${received.difficulty})`, 'info');
                }
                if (received.type === 'chat') {
                    // tratado no chat.js
                }
                if (received.type === 'notification') {
                    this._showToast('🔔 ' + received.message, 'info');
                    this._playSound('notification');
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
                    this.saveLocally(false);
                }
                if (msg.type === 'notification') {
                    this._showToast('🔔 ' + msg.message, 'info');
                    this._playSound('notification');
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
                    this._showToast(`📨 ${msg.skill}: ${msg.roll} (${sucesso ? 'Sucesso' : 'Falha'})`, sucesso ? 'success' : 'error');
                    this._playSound('roll');
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
            await this.saveLocally(false);
            this.broadcastUpdate();
        } else {
            await this.saveLocally(false);
        }
        this.notifyAll();
        this._history = [];
        this._future = [];
        this._showToast('🗑️ Campanha resetada.', 'warning');
    }

    enviarNotificacao(mensagem) {
        if (this.role === 'master' && this.connection && this.connection.open) {
            this.connection.send({ type: 'notification', message: mensagem });
            console.log('📨 Notificação enviada:', mensagem);
            this._playSound('notification');
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