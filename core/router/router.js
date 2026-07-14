class Router {
    constructor() {
        this.cache = new Map();
        this.contentElement = document.getElementById('content');
    }

    async navigate(moduleName) {
        if (!this.contentElement) return;
        this.contentElement.innerHTML = '<div class="loading-screen">⏳ Carregando...</div>';

        try {
            if (!this.cache.has(moduleName)) {
                const [htmlResp, jsModule] = await Promise.all([
                    fetch(`modules/${moduleName}/${moduleName}.html`),
                    import(`../../modules/${moduleName}/${moduleName}.js`)
                ]);
                if (!htmlResp.ok) throw new Error(`HTML não encontrado para: ${moduleName}`);
                const html = await htmlResp.text();
                this.cache.set(moduleName, { html, jsModule });
            }

            const cached = this.cache.get(moduleName);
            this.contentElement.innerHTML = cached.html;
            this.contentElement.classList.add('fade-in');

            if (cached.jsModule && typeof cached.jsModule.init === 'function') {
                await cached.jsModule.init();
            }
        } catch (err) {
            this.contentElement.innerHTML = `
                <div class="panel">
                    <h2>⚠️ Erro ao carregar módulo</h2>
                    <p>Módulo: <strong>${moduleName}</strong></p>
                    <p>${err.message}</p>
                    <button class="btn btn-gold mt-2" onclick="location.hash='dashboard'">Voltar ao Painel</button>
                </div>`;
            console.error(err);
        }
    }
}

export const router = new Router();
export default router;