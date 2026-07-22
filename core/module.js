// core/module.js
import appState from '../assets/js/app.js';

/**
 * Classe base para todos os módulos do Ocaso & Maldição.
 * Fornece gerenciamento de ciclo de vida, subscribers seguros,
 * favoritos, recentes, loader, skeleton, duplicar, ordenação e atualização de DOM.
 */
export class BaseModule {
    constructor(moduleId) {
        this._moduleId = moduleId;
        this._unsubscribes = [];
        this._isInitialized = false;
        this._favoritesKey = 'favorites';
        this._recentKey = 'recentModules';
        this._sortField = 'nome';
        this._sortOrder = 'asc';
        this._timers = [];
    }

    /**
     * Registra um subscriber que será automaticamente cancelado no destroy()
     * @param {string} domain - Domínio do appState (ex: 'characters')
     * @param {Function} callback - Função a ser chamada quando o domínio mudar
     * @returns {Function} Função de cancelamento
     */
    on(domain, callback) {
        const unsubscribe = appState.subscribe(domain, callback);
        this._unsubscribes.push(unsubscribe);
        return unsubscribe;
    }

    /**
     * Remove todos os listeners e limpa o estado
     */
    destroy() {
        this._unsubscribes.forEach(fn => {
            try {
                if (typeof fn === 'function') fn();
            } catch (err) {
                console.warn('Erro ao cancelar subscriber:', err);
            }
        });
        this._unsubscribes.length = 0;
        this._timers.splice(0).forEach(clearTimeout);
        this._isInitialized = false;
        this._hideLoader();
        this._hideSkeleton();
    }

    /**
     * Inicializa o módulo (deve ser sobrescrito pelas classes filhas)
     */
    init() {
        if (this._isInitialized) {
            console.warn(`${this.constructor.name} já está inicializado.`);
            return;
        }
        this._isInitialized = true;
        // Registra o módulo nos recentes
        if (this._moduleId) {
            appState.addRecentModule(this._moduleId);
        }
        this._showLoader();
        // Simula carregamento e depois esconde o loader
        this._timers.push(setTimeout(() => this._hideLoader(), 300));
        this._renderSkeleton();
        this._timers.push(setTimeout(() => this._hideSkeleton(), 400));
    }

    // ============================================================
    // LOADER BONITO (⭐ 14)
    // ============================================================
    _showLoader() {
        const content = document.getElementById('content');
        if (!content) return;
        // Verifica se já existe um loader
        if (content.querySelector('.module-loader')) return;
        const loader = document.createElement('div');
        loader.className = 'module-loader';
        loader.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding:40px; color:var(--text-dim);">
                <div style="font-size:3rem; animation: pulse 1.5s infinite;">⛩️</div>
                <div style="margin-top:12px; font-size:1rem;">Carregando ${this._moduleId || 'módulo'}...</div>
                <div style="margin-top:8px; width:200px; height:3px; background:var(--bg-2); border-radius:4px; overflow:hidden;">
                    <div style="width:30%; height:100%; background:var(--gold); border-radius:4px; animation: loadingProgress 1s infinite;"></div>
                </div>
            </div>
        `;
        content.appendChild(loader);
    }

    _hideLoader() {
        const content = document.getElementById('content');
        if (content) {
            const loader = content.querySelector('.module-loader');
            if (loader) loader.remove();
        }
    }

    // ============================================================
    // SKELETON LOADING (⭐ 15)
    // ============================================================
    _renderSkeleton() {
        const content = document.getElementById('content');
        if (!content) return;
        // Só aplica se o conteúdo estiver vazio ou com apenas o loader
        if (content.children.length > 1) return;
        const skeleton = document.createElement('div');
        skeleton.className = 'skeleton-container';
        skeleton.innerHTML = `
            <div style="display:grid; gap:12px; padding:12px;">
                <div class="skeleton-line" style="height:24px; width:60%;"></div>
                <div class="skeleton-line" style="height:16px; width:90%;"></div>
                <div class="skeleton-line" style="height:16px; width:80%;"></div>
                <div style="display:flex; gap:12px;">
                    <div class="skeleton-line" style="height:100px; flex:1;"></div>
                    <div class="skeleton-line" style="height:100px; flex:1;"></div>
                </div>
                <div class="skeleton-line" style="height:16px; width:70%;"></div>
            </div>
        `;
        content.appendChild(skeleton);
        this._timers.push(setTimeout(() => {
            const sk = content.querySelector('.skeleton-container');
            if (sk) sk.remove();
        }, 600));
    }

    _hideSkeleton() {
        const content = document.getElementById('content');
        if (content) {
            const sk = content.querySelector('.skeleton-container');
            if (sk) sk.remove();
        }
    }

    // ============================================================
    // FAVORITOS (⭐ 4)
    // ============================================================
    toggleFavorite(type, id) {
        appState.toggleFavorite(type, id);
    }

    isFavorite(type, id) {
        return appState.isFavorite(type, id);
    }

    getFavorites(type) {
        return appState.getFavorites(type);
    }

    // ============================================================
    // DUPLICAR (⭐ 17)
    // ============================================================
    duplicateItem(arrayKey, item, newNameSuffix = ' (Cópia)') {
        const items = appState.get(arrayKey) || [];
        const copy = JSON.parse(JSON.stringify(item));
        copy.id = Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
        copy.nome = (copy.nome || copy.titulo || 'Item') + newNameSuffix;
        items.push(copy);
        appState.set(arrayKey, items);
        appState.logAction(`📋 Duplicado: ${copy.nome}`);
        window.showToast?.(`📋 ${copy.nome} criado.`);
        appState._playSound('save');
        return copy;
    }

    // ============================================================
    // ORDENAÇÃO (⭐ 10)
    // ============================================================
    sortItems(items, field, order = 'asc') {
        const sorted = [...items];
        sorted.sort((a, b) => {
            const valA = a[field] ?? '';
            const valB = b[field] ?? '';
            if (typeof valA === 'string') {
                return order === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            }
            return order === 'asc' ? valA - valB : valB - valA;
        });
        return sorted;
    }

    setSort(field, order) {
        this._sortField = field;
        this._sortOrder = order;
    }

    getSort() {
        return { field: this._sortField, order: this._sortOrder };
    }

    // ============================================================
    // PESQUISA (⭐ 9)
    // ============================================================
    filterItems(items, searchFields, term) {
        if (!term || !term.trim()) return items;
        const search = term.toLowerCase().trim();
        return items.filter(item => {
            return searchFields.some(field => {
                const val = item[field] ?? '';
                return String(val).toLowerCase().includes(search);
            });
        });
    }

    // ============================================================
    // MÉTODOS DE DOM (seguros)
    // ============================================================
    updateElement(id, value, method = 'text') {
        const el = document.getElementById(id);
        if (!el) return;
        if (method === 'html') {
            el.innerHTML = value;
        } else {
            el.textContent = value;
        }
    }

    getElement(id) {
        return document.getElementById(id);
    }

    isActive(containerId = 'content') {
        const container = document.getElementById(containerId);
        if (!container) return false;
        return container.children.length > 0;
    }

    // ============================================================
    // CONFIRMAR AÇÕES (⭐ 7)
    // ============================================================
    confirmAction(message, onConfirm, onCancel) {
        const dialog = document.createElement('div');
        dialog.className = 'confirm-dialog';
        dialog.innerHTML = `
            <div>
                <p style="margin-bottom:12px;">${message}</p>
                <div class="actions">
                    <button class="btn" id="confirm-cancel">Cancelar</button>
                    <button class="btn btn-red" id="confirm-ok">Confirmar</button>
                </div>
            </div>
        `;
        document.body.appendChild(dialog);

        dialog.querySelector('#confirm-cancel').addEventListener('click', () => {
            dialog.remove();
            if (onCancel) onCancel();
        });
        dialog.querySelector('#confirm-ok').addEventListener('click', () => {
            dialog.remove();
            if (onConfirm) onConfirm();
        });
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                dialog.remove();
                if (onCancel) onCancel();
            }
        });
        return dialog;
    }

    // ============================================================
    // TOAST (⭐ 6)
    // ============================================================
    showToast(message, type = 'info') {
        window.showToast?.(message, type);
    }
}
