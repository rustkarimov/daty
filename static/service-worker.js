const CACHE_NAME = 'daty-v11';
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
    // HTML-страницы — Network First с ТАЙМАУТОМ и ПОВТОРОМ.
    // offline.html показываем только если сеть реально не работает.
    // --------------------------------------------------------
    if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
        event.respondWith(
            fetchWithTimeout(request, 8000)              // 1-я попытка: 8 секунд
                .catch(() => fetchWithTimeout(request, 15000))  // 2-я попытка: 15 секунд
                .catch(() => caches.match(OFFLINE_URL))         // offline.html, если обе не прошли
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

// ============================================================
// PUSH-УВЕДОМЛЕНИЯ
// ============================================================

self.addEventListener('push', function(event) {
    console.log('🔔 PUSH ПОЛУЧЕН');
    console.log('event.data:', event.data);
    
    let data = {
        title: 'ДАТЫ',
        body: 'Новое уведомление',
        url: '/dashboard/'
    };
    
    if (event.data) {
        try {
            // Пытаемся распарсить JSON
            const text = event.data.text();
            console.log('Сырой текст:', text);
            
            try {
                data = JSON.parse(text);
                console.log('Распарсенные data:', data);
            } catch (e) {
                // Если не JSON — используем как body
                data.body = text;
                console.log('Не JSON, используем как body');
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
    
    console.log('Показываем уведомление:', data.title, options);
    
    event.waitUntil(
        self.registration.showNotification(data.title, options)
            .then(() => console.log('✅ showNotification выполнен'))
            .catch((err) => console.error('❌ Ошибка showNotification:', err))
    );
});

// ============================================================
// КЛИК ПО УВЕДОМЛЕНИЮ
// ============================================================
self.addEventListener('notificationclick', function(event) {
    console.log('👆 Клик по уведомлению');
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