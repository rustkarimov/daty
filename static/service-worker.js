const CACHE_NAME = 'daty-v12';
const OFFLINE_URL = '/static/offline.html';

// Что кешируем при установке
const STATIC_ASSETS = [
    '/static/css/bootstrap.min.css',
    '/static/css/all.min.css',
    '/static/css/style.css',
    '/static/css/promo.css',
    '/static/js/bootstrap.bundle.min.js',
    '/static/manifest.json',
    OFFLINE_URL
];

// ============================================================
// INSTALL — кешируем базовую статику
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
// Вспомогательная функция: fetch с таймаутом
// ============================================================
function fetchWithTimeout(request, timeoutMs) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('timeout')), timeoutMs);
        fetch(request).then(
            response => { clearTimeout(timer); resolve(response); },
            error => { clearTimeout(timer); reject(error); }
        );
    });
}

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
    // HTML — Network First
    // --------------------------------------------------------
    if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
        event.respondWith(
            fetchWithTimeout(request, 8000)
                .catch(() => fetchWithTimeout(request, 15000))
                .catch(() => caches.match(OFFLINE_URL))
        );
        return;
    }

    // --------------------------------------------------------
    // JS, CSS — Network First (свежие бандлы всегда с сервера,
    // кеш используется только при отсутствии сети)
    // --------------------------------------------------------
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

    // --------------------------------------------------------
    // Картинки, шрифты, иконки — Cache First
    // (меняются редко, ускоряем загрузку)
    // --------------------------------------------------------
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

    // --------------------------------------------------------
    // Manifest, offline.html — Cache First
    // --------------------------------------------------------
    if (url.pathname.match(/\/(manifest\.json|offline\.html)$/)) {
        event.respondWith(
            caches.match(request).then(cached => cached || fetch(request))
        );
        return;
    }

    // --------------------------------------------------------
    // Всё остальное (API, AJAX) — только из сети
    // --------------------------------------------------------
    event.respondWith(
        fetch(request).catch(() => {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Нет соединения с сервером. Проверьте интернет и попробуйте снова.'
                }),
                {
                    status: 503,
                    statusText: 'Service Unavailable',
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        })
    );
});

// ============================================================
// PUSH-УВЕДОМЛЕНИЯ
// ============================================================

self.addEventListener('push', function(event) {
    console.log('🔔 PUSH ПОЛУЧЕН');
    
    let data = {
        title: 'ДАТЫ',
        body: 'Новое уведомление',
        url: '/dashboard/'
    };
    
    if (event.data) {
        try {
            const text = event.data.text();
            try {
                data = JSON.parse(text);
            } catch (e) {
                data.body = text;
            }
        } catch (e) {
            console.error('Ошибка чтения event.data:', e);
        }
    }
    
    const options = {
        body: data.body,
        icon: '/static/images/pwa/icon-192.png',
        badge: '/static/images/pwa/icon-192.png',
        data: {
            url: data.url || '/dashboard/'
        },
        tag: data.tag || 'daty-notification'
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title, options)
            .catch((err) => console.error('❌ Ошибка showNotification:', err))
    );
});

// ============================================================
// КЛИК ПО УВЕДОМЛЕНИЮ
// ============================================================
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.focus();
                    client.postMessage({ type: 'OPEN_NOTIFICATIONS' });
                    return;
                }
            }
            if (clients.openWindow) {
                return clients.openWindow('/dashboard/?open_notifications=1');
            }
        })
    );
});