// core/module.js
import appState from '../assets/js/app.js';

/**
 * Classe base para todos os módulos do Ocaso & Maldição.
 * Fornece gerenciamento de ciclo de vida, subscribers seguros e
 * atualização de DOM com fallback.
 */
export class BaseModule {
    constructor() {
        this._unsubscribes = [];
        this._isInitialized = false;
    }

    /**
     * Registra um subscriber que será automaticamente cancelado no destroy()
     * @param {string} domain - Domínio do appState (ex: 'characters')
     * @param {Function} callback - Função a ser chamada quando o domínio mudar
     * @returns {Function} Função de cancelamento (opcional)
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
        this._isInitialized = false;
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
    }

    /**
     * Método auxiliar para atualizar elementos do DOM com segurança
     * @param {string} id - ID do elemento
     * @param {*} value - Valor a ser definido (textContent ou innerHTML)
     * @param {string} method - 'text' (padrão) ou 'html'
     */
    updateElement(id, value, method = 'text') {
        const el = document.getElementById(id);
        if (!el) return;
        if (method === 'html') {
            el.innerHTML = value;
        } else {
            el.textContent = value;
        }
    }

    /**
     * Verifica se o módulo está ativo (DOM presente)
     * @param {string} containerId - ID do container principal (opcional)
     * @returns {boolean}
     */
    isActive(containerId = 'content') {
        const container = document.getElementById(containerId);
        if (!container) return false;
        // Verifica se o container tem conteúdo (não está vazio)
        return container.children.length > 0;
    }
}