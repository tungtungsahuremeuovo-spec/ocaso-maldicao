import { saveData, loadData } from '../../core/database/storage.js';

const STORAGE_KEY = 'ocaso_maldicao_data';

class AppState {
    constructor() {
        this.role = localStorage.getItem('ocaso_role') || null; // 'master', 'player' ou null
        this.data = this.getDefaultData();
        this.subscribers = new Map();
        if (this.role) this.load(); // só carrega dados se já tiver papel definido
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
            settings: { theme: 'default', autoSave: true, language: 'pt-BR', diceAnimation: true },
            masterPassword: '1234' // senha padrão do mestre (pode ser alterada nas configs)
        };
    }

    setRole(role) {
        this.role = role;
        localStorage.setItem('ocaso_role', role);
    }

    getRole() {
        return this.role || localStorage.getItem('ocaso_role');
    }

    clearRole() {
        localStorage.removeItem('ocaso_role');
        this.role = null;
    }

    // Exporta apenas informações públicas para jogadores
    exportPlayerPackage() {
        return {
            campaign: this.data.campaign,
            characters: this.data.characters
                .filter(c => c.isPlayerCharacter) // apenas personagens de jogadores
                .map(c => ({
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
                    notas: c.notas // inclui notas, mas o mestre decide o que colocar
                })),
            quests: this.data.quests
                .filter(q => q.visivelJogadores)
                .map(q => ({ titulo: q.titulo, desc: q.desc, status: q.status, recompensa: q.recompensa }))
        };
    }

    get(domain) { return this.data[domain]; }

    set(domain, value) {
        this.data[domain] = value;
        this.save();
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
        const subs = this.subscribers.get(domain) || [];
        subs.forEach(fn => fn(this.data[domain]));
    }

    save() {
        if (this.role) {
            saveData(STORAGE_KEY, this.data);
            const indicator = document.getElementById('saveIndicator');
            if (indicator) {
                indicator.textContent = '💾 Salvo';
                setTimeout(() => { if (indicator) indicator.textContent = ''; }, 1500);
            }
        }
    }

    load() {
        const saved = loadData(STORAGE_KEY);
        if (saved) {
            this.data = { ...this.getDefaultData(), ...saved };
        }
    }

    reset() {
        this.data = this.getDefaultData();
        this.save();
        Object.keys(this.data).forEach(d => this.notify(d));
    }
}

export const appState = new AppState();
export default appState;