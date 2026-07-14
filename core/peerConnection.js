// Gerenciador de conexão P2P via PeerJS
let peer = null;
let conn = null;
let onDataCallback = null;

export function initHost(peerId) {
    peer = new Peer(peerId);
    peer.on('connection', (connection) => {
        conn = connection;
        conn.on('data', (data) => {
            // Host recebe dados do cliente (opcional)
        });
    });
    return peer;
}

export function connectToHost(hostPeerId) {
    peer = new Peer(); // ID aleatório
    conn = peer.connect(hostPeerId);
    conn.on('open', () => {
        // Conexão estabelecida
    });
    conn.on('data', (data) => {
        if (onDataCallback) onDataCallback(data);
    });
    return peer;
}

export function sendData(data) {
    if (conn && conn.open) {
        conn.send(data);
    }
}

export function onDataReceived(callback) {
    onDataCallback = callback;
}

export function disconnect() {
    if (conn) conn.close();
    if (peer) peer.destroy();
}