// service-worker.js
const CACHE_NAME = 'daty-v19'; // <--- ОБЯЗАТЕЛЬНО ПОДНИМАЕМ ВЕРСИЮ
const OFFLINE_URL = '/static/offline.html';

const STATIC_ASSETS = [
    '/static/css/bootstrap.min.css',
    '/static/css/all.min.css',
    '/static/css/style.css',
    '/static/css/promo.css',
    '/static/js/bootstrap.bundle.min.js',
    '/static/manifest.json',
    OFFLINE_URL
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(STATIC_ASSETS).catch(err => console.warn('SW: не все ресурсы закешированы', err));
        })
    );
    self.skipWaiting(); // Принудительно активируем новый SW
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            );
        }).then(() => self.clients.claim()) // Захватываем контроль
    );
});

function fetchWithTimeout(request, timeoutMs) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('timeout')), timeoutMs);
        fetch(request).then(
            response => { clearTimeout(timer); resolve(response); },
            error => { clearTimeout(timer); reject(error); }
        );
    });
}

self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    if (request.method !== 'GET') return;
    if (url.origin !== location.origin) return;

    // 1. HTML — Всегда из сети (Network Only)
    if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
        event.respondWith(
            fetchWithTimeout(request, 8000).catch(() => caches.match(OFFLINE_URL))
        );
        return;
    }

    // 2. JS и CSS — Network First (сначала сеть, потом кэш)
    if (url.pathname.match(/\.(js|css)$/)) {
        event.respondWith(
            fetch(request)
                .then(response => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
                    return response;
                })
                .catch(() => caches.match(request))
        );
        return;
    }

    // 3. Картинки — Cache First
    if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot)$/)) {
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

    // 4. Всё остальное — Network
    event.respondWith(
        fetch(request).catch(() => {
            return new Response(JSON.stringify({ success: false, error: 'Нет соединения' }), {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            });
        })
    );
});

self.addEventListener('push', function(event) {
    let data = { title: 'ДАТЫ', body: 'Новое уведомление', url: '/dashboard/' };
    if (event.data) {
        try { data = JSON.parse(event.data.text()); } catch (e) { data.body = event.data.text(); }
    }
    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: '/static/images/pwa/icon-192.png',
            data: { url: data.url || '/dashboard/' }
        })
    );
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(clientList => {
            for (let client of clientList) {
                if (client.url.includes(self.location.origin)) { client.focus(); return; }
            }
            if (clients.openWindow) return clients.openWindow('/dashboard/');
        })
    );
});