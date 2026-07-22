// core/database/indexedDB.js

const DB_NAME = 'OcasoMaldicaoDB';
const DB_VERSION = 2; // incrementado para nova estrutura
const STORE_NAMES = {
    CAMPAIGNS: 'campaigns',
    CHARACTERS: 'characters',
    QUESTS: 'quests',
    NPCS: 'npcs',
    ITEMS: 'items',
    LORE: 'lore',
    COMBAT: 'combat',
    RELATIONSHIPS: 'relationships',
    MACROS: 'macros',
    ROTEIRO: 'roteiro',
    LOOT: 'loot',
    SETTINGS: 'settings',
    LOGS: 'logs',
    SLOTS: 'slots'
};

let dbPromise = null;
let dbInstance = null;

// ============================================================
// 1. CONEXÃO (com cache)
// ============================================================
export function openDatabase() {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            const oldVersion = event.oldVersion;

            // Cria todas as object stores
            Object.values(STORE_NAMES).forEach(storeName => {
                if (!db.objectStoreNames.contains(storeName)) {
                    const store = db.createObjectStore(storeName, { keyPath: 'id' });
                    // Índices comuns
                    store.createIndex('campaignId', 'campaignId', { unique: false });
                    store.createIndex('updatedAt', 'updatedAt', { unique: false });
                    
                    // Índices específicos
                    if (storeName === STORE_NAMES.CAMPAIGNS) {
                        store.createIndex('name', 'name', { unique: false });
                    }
                    if (storeName === STORE_NAMES.CHARACTERS) {
                        store.createIndex('playerId', 'playerId', { unique: false });
                        store.createIndex('isPlayerCharacter', 'isPlayerCharacter', { unique: false });
                    }
                    if (storeName === STORE_NAMES.QUESTS) {
                        store.createIndex('status', 'status', { unique: false });
                    }
                    if (storeName === STORE_NAMES.SLOTS) {
                        store.createIndex('slotName', 'slotName', { unique: true });
                    }
                }
            });
        };

        request.onsuccess = (event) => {
            dbInstance = event.target.result;
            dbInstance.onversionchange = () => closeDatabase();
            resolve(dbInstance);
        };

        request.onblocked = () => console.warn('Atualização do banco bloqueada por outra aba aberta.');

        request.onerror = (event) => {
            dbPromise = null;
            reject(event.target.error);
        };
    });

    return dbPromise;
}

export function closeDatabase() {
    if (dbInstance) {
        dbInstance.close();
        dbInstance = null;
        dbPromise = null;
    }
}

// ============================================================
// 2. FUNÇÕES AUXILIARES
// ============================================================
async function getDB() {
    if (!dbInstance) {
        await openDatabase();
    }
    return dbInstance;
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
}

// ============================================================
// 3. CAMPANHAS (principal)
// ============================================================
export async function saveCampaign(campaignId, data) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAMES.CAMPAIGNS, 'readwrite');
        const store = tx.objectStore(STORE_NAMES.CAMPAIGNS);
        const record = {
            id: `campaign_${campaignId}`,
            campaignId,
            name: data.campaign || 'Campanha sem nome',
            data: data,
            updatedAt: Date.now()
        };
        const request = store.put(record);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

export async function loadCampaign(campaignId = 'main') {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAMES.CAMPAIGNS, 'readonly');
        const store = tx.objectStore(STORE_NAMES.CAMPAIGNS);
        const request = store.get(`campaign_${campaignId}`);
        request.onsuccess = () => {
            if (request.result) {
                resolve(request.result.data);
            } else {
                resolve(null);
            }
        };
        request.onerror = () => reject(request.error);
    });
}

export async function listCampaigns() {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAMES.CAMPAIGNS, 'readonly');
        const store = tx.objectStore(STORE_NAMES.CAMPAIGNS);
        const request = store.getAll();
        request.onsuccess = () => {
            resolve(request.result.map(r => ({
                id: r.campaignId,
                name: r.name,
                updatedAt: r.updatedAt
            })));
        };
        request.onerror = () => reject(request.error);
    });
}

// ============================================================
// 4. COMPATIBILIDADE – funções antigas (saveData / loadData)
// ============================================================
export async function saveData(data, campaignId = 'main') {
    return saveCampaign(campaignId, data);
}

export async function loadData(campaignId = 'main') {
    return loadCampaign(campaignId);
}

// ============================================================
// 5. SLOTS (múltiplos salvamentos)
// ============================================================
export async function saveSlot(slotName, data, campaignId = 'main') {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAMES.SLOTS, 'readwrite');
        const store = tx.objectStore(STORE_NAMES.SLOTS);
        const record = {
            id: `slot_${campaignId}_${slotName}`,
            campaignId,
            slotName,
            data: data,
            updatedAt: Date.now()
        };
        const request = store.put(record);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

export async function loadSlot(slotName, campaignId = 'main') {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAMES.SLOTS, 'readonly');
        const store = tx.objectStore(STORE_NAMES.SLOTS);
        const request = store.get(`slot_${campaignId}_${slotName}`);
        request.onsuccess = () => {
            if (request.result) {
                resolve(request.result.data);
            } else {
                resolve(null);
            }
        };
        request.onerror = () => reject(request.error);
    });
}

export async function listSlots(campaignId = 'main') {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAMES.SLOTS, 'readonly');
        const store = tx.objectStore(STORE_NAMES.SLOTS);
        const index = store.index('campaignId');
        const request = index.getAll(campaignId);
        request.onsuccess = () => {
            resolve(request.result.map(r => ({
                name: r.slotName,
                updatedAt: r.updatedAt
            })));
        };
        request.onerror = () => reject(request.error);
    });
}

// ============================================================
// 6. LIMPEZA
// ============================================================
export async function clearAllData() {
    const db = await getDB();
    const tx = db.transaction(Object.values(STORE_NAMES), 'readwrite');
    Object.values(STORE_NAMES).forEach(storeName => tx.objectStore(storeName).clear());
    await new Promise((resolve, reject) => {
        tx.oncomplete = resolve;
        tx.onabort = tx.onerror = () => reject(tx.error);
    });
}

export async function clearCampaign(campaignId = 'main') {
    const db = await getDB();
    // Remove campanha
    await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAMES.CAMPAIGNS, 'readwrite');
        const store = tx.objectStore(STORE_NAMES.CAMPAIGNS);
        const request = store.delete(`campaign_${campaignId}`);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
    // Remove slots relacionados
    const slots = await listSlots(campaignId);
    for (const slot of slots) {
        await deleteSlot(slot.name, campaignId);
    }
}

export async function clearSlots(campaignId = 'main') {
    const db = await getDB();
    const slots = await listSlots(campaignId);
    for (const slot of slots) {
        await deleteSlot(slot.name, campaignId);
    }
}

export async function deleteSlot(slotName, campaignId = 'main') {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAMES.SLOTS, 'readwrite');
        const store = tx.objectStore(STORE_NAMES.SLOTS);
        const request = store.delete(`slot_${campaignId}_${slotName}`);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// ============================================================
// 7. EXPORTAÇÃO / IMPORTAÇÃO
// ============================================================
export async function exportDatabase(campaignId = 'main') {
    const db = await getDB();
    const stores = Object.values(STORE_NAMES);
    const result = {};
    for (const storeName of stores) {
        const data = await new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
        const campaignData = data.filter(item => item.campaignId === campaignId);
        if (campaignData.length > 0) {
            result[storeName] = campaignData;
        }
    }
    return JSON.stringify(result, null, 2);
}

export async function importDatabase(jsonData) {
    let parsed;
    try {
        parsed = JSON.parse(jsonData);
    } catch (e) {
        throw new Error('Arquivo inválido: não é um JSON válido.');
    }
    const db = await getDB();
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('Arquivo inválido: estrutura de banco esperada.');
    }
    const entries = Object.entries(parsed).filter(([storeName, items]) =>
        db.objectStoreNames.contains(storeName) && Array.isArray(items)
    );
    if (!entries.length) return;
    const tx = db.transaction(entries.map(([storeName]) => storeName), 'readwrite');
    for (const [storeName, items] of entries) {
        if (!db.objectStoreNames.contains(storeName)) {
            console.warn(`Store ${storeName} não existe, ignorando.`);
            continue;
        }
        const store = tx.objectStore(storeName);
        for (const item of items) {
            store.put(item);
        }
    }
    await new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

// ============================================================
// 8. FUNÇÕES ESPECÍFICAS POR TIPO (OPCIONAL)
// ============================================================
export async function saveCharacters(characters, campaignId = 'main') {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAMES.CHARACTERS, 'readwrite');
        const store = tx.objectStore(STORE_NAMES.CHARACTERS);
        const promises = characters.map(char => {
            char.campaignId = campaignId;
            char.id = char.id || generateId();
            return new Promise((res, rej) => {
                const req = store.put(char);
                req.onsuccess = () => res();
                req.onerror = () => rej(req.error);
            });
        });
        Promise.all(promises).then(resolve).catch(reject);
    });
}

export async function loadCharacters(campaignId = 'main') {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAMES.CHARACTERS, 'readonly');
        const store = tx.objectStore(STORE_NAMES.CHARACTERS);
        const index = store.index('campaignId');
        const request = index.getAll(campaignId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Funções similares podem ser criadas para quests, npcs, etc.
