export function saveData(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (e) {
        console.error('Erro ao salvar:', e);
        return false;
    }
}

export function loadData(key) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        console.error('Erro ao carregar:', e);
        return null;
    }
}

export function removeData(key) {
    localStorage.removeItem(key);
}

export function getAllKeys() {
    return Object.keys(localStorage);
}

export function getStorageSize() {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        total += localStorage.getItem(key).length;
    }
    return total;
}