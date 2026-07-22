// service-worker.js
const CACHE_NAME = 'ocaso-v3';

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll([
                '/',
                '/index.html',
                '/manifest.json',
                '/assets/css/main.css',
                '/assets/js/app.js',
                '/assets/js/bootstrap.js',
                '/assets/js/atalhos.js',
                '/assets/js/core/module.js',
                '/assets/js/core/database/indexedDB.js',
                // ... outros arquivos estáticos
            ]).catch((err) => {
                console.warn('Erro ao adicionar ao cache:', err);
            });
        })
    );
});

self.addEventListener('fetch', (event) => {
    const request = event.request;

    // ✅ IGNORA REQUISIÇÕES DE EXTENSÕES (chrome-extension://)
    if (request.url.startsWith('chrome-extension://')) {
        return;
    }

    // ✅ IGNORA REQUISIÇÕES DE EXTENSÕES DO NAVEGADOR
    if (request.url.startsWith('moz-extension://')) {
        return;
    }

    // ✅ IGNORA REQUISIÇÕES PARA A API DO YOUTUBE (se não quiser cachear)
    if (request.url.includes('youtube.com') || request.url.includes('ytimg.com')) {
        return;
    }

    event.respondWith(
        caches.match(request).then((response) => {
            if (response) {
                return response;
            }
            return fetch(request).then((response) => {
                // Não tenta cachear requisições que não são GET ou que não são da mesma origem
                if (request.method !== 'GET' || !request.url.startsWith(self.location.origin)) {
                    return response;
                }
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(request, responseClone).catch((err) => {
                        console.warn('Erro ao cachear:', request.url, err);
                    });
                });
                return response;
            }).catch((err) => {
                console.warn('Erro no fetch:', err);
                return new Response('Recurso não disponível offline', { status: 404 });
            });
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
            );
        })
    );
});