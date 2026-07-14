import { saveData, loadData } from '../../core/database/storage.js';
import { notifySubscribers } from '../../core/state/state.js';

const STORAGE_KEY = 'ocaso_maldicao_data';

class AppState {
    constructor() {
        this.data = this.getDefaultData();
        this.subscribers = new Map();
        this.load();
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
            settings: { theme: 'default', autoSave: true, language: 'pt-BR', diceAnimation: true }
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
        saveData(STORAGE_KEY, this.data);
        const indicator = document.getElementById('saveIndicator');
        if (indicator) {
            indicator.textContent = '💾 Salvo';
            setTimeout(() => { if (indicator) indicator.textContent = ''; }, 1500);
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