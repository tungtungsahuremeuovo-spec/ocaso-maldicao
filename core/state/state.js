const globalState = new Map();

export function setState(key, value) {
    globalState.set(key, value);
}

export function getState(key) {
    return globalState.get(key);
}

export function subscribe(key, callback) {
    // Implementação simples de observer
    const observer = { key, callback };
    return () => {
        // unsubscribe
    };
}

export function notifySubscribers(domain, data) {
    // Notifica os subscribers do appState
}