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
    '/static/manifest.json',
    OFFLINE_URL
];

// ============================================================
// INSTALL — кешируем статику
// ============================================================
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

// ============================================================
// ACTIVATE — удаляем старые кеши
// ============================================================
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

// ============================================================
// FETCH — безопасная стратегия
// ============================================================
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Пропускаем non-GET и внешние запросы
    if (request.method !== 'GET') return;
    if (url.origin !== location.origin) return;

    // --------------------------------------------------------
    // HTML-страницы — ВСЕГДА из сети. Кеш НЕ используем.
    // При офлайне — показываем offline.html.
    // --------------------------------------------------------
    if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
        event.respondWith(
            fetch(request).catch(() => caches.match(OFFLINE_URL))
        );
        return;
    }

    // --------------------------------------------------------
    // Статика (CSS, JS, шрифты, картинки) — Cache First.
    // --------------------------------------------------------
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

    // --------------------------------------------------------
    // Всё остальное (API, AJAX) — ТОЛЬКО из сети, без кеша.
    // --------------------------------------------------------
    event.respondWith(fetch(request));
});