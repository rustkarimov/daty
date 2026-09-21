const CACHE_NAME = 'daty-v1';
const OFFLINE_URL = '/static/offline.html';

// Что кешируем при установке
const STATIC_ASSETS = [
    '/static/css/bootstrap.min.css',
    '/static/css/all.min.css',
    '/static/css/style.css',
    '/static/css/dashboard.css',
    '/static/css/promo.css',
    '/static/js/bootstrap.bundle.min.js',
    '/static/webfonts/Baloo/baloo-cyrillic.ttf',
    '/static/webfonts/Nunito/Nunito-SemiBold.ttf',
    '/static/webfonts/Nunito/Nunito-Bold.ttf',
    '/static/webfonts/Nunito/Nunito-ExtraBold.ttf',
    '/static/webfonts/Nunito/Nunito-Black.ttf',
    '/static/webfonts/Comic Helvetic/ComicHelvetic_Heavy.otf',
    '/static/webfonts/Comic Helvetic/ComicHelvetic_Light.otf',
    '/static/webfonts/Comic Helvetic/ComicHelvetic_Medium.otf',
    '/static/webfonts/Borsok/boorsok.otf',
    '/static/webfonts/Cunia/cunia.otf',
    '/static/manifest.json',
    OFFLINE_URL
];

// Установка — кешируем статику
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(STATIC_ASSETS).catch(err => {
                console.warn('SW: не все ресурсы закешированы', err);
            });
        })
    );
    self.skipWaiting();
});

// Активация — удаляем старые кеши
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

// Стратегия: Network First для HTML, Cache First для статики
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Пропускаем non-GET и внешние запросы
    if (request.method !== 'GET') return;
    if (url.origin !== location.origin) return;

    // HTML-страницы — Network First (с fallback на offline.html)
    if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
        event.respondWith(
            fetch(request)
                .then(response => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
                    return response;
                })
                .catch(() => {
                    return caches.match(request).then(cached => {
                        return cached || caches.match(OFFLINE_URL);
                    });
                })
        );
        return;
    }

    // Статика — Cache First
    if (url.pathname.startsWith('/static/') || url.pathname.startsWith('/media/')) {
        event.respondWith(
            caches.match(request).then(cached => {
                if (cached) return cached;
                return fetch(request).then(response => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
                    return response;
                });
            })
        );
        return;
    }

    // Остальное — Network First
    event.respondWith(
        fetch(request)
            .then(response => {
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
                return response;
            })
            .catch(() => caches.match(request))
    );
});