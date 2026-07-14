import { saveData, loadData, getAllKeys } from './storage.js';

const SAVE_PREFIX = 'ocaso_save_';
const AUTO_SAVE_KEY = 'ocaso_autosave';
const QUICK_SAVE_KEY = 'ocaso_quicksave';

export class SaveManager {
    static listSaves() {
        return getAllKeys()
            .filter(k => k.startsWith(SAVE_PREFIX) || k === AUTO_SAVE_KEY || k === QUICK_SAVE_KEY)
            .map(k => {
                const data = loadData(k);
                return {
                    key: k,
                    name: data?.campaign || 'Salvo sem nome',
                    timestamp: data?._timestamp || 0,
                    characterCount: data?.characters?.length || 0
                };
            })
            .sort((a, b) => b.timestamp - a.timestamp);
    }

    static autoSave(data) {
        data._timestamp = Date.now();
        saveData(AUTO_SAVE_KEY, data);
    }

    static quickSave(data) {
        data._timestamp = Date.now();
        saveData(QUICK_SAVE_KEY, data);
    }

    static manualSave(name, data) {
        data._timestamp = Date.now();
        saveData(SAVE_PREFIX + name.replace(/\s+/g, '_'), data);
    }

    static loadSave(key) {
        return loadData(key);
    }

    static deleteSave(key) {
        localStorage.removeItem(key);
    }
}

export default SaveManager;