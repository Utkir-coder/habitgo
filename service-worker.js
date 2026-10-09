// ============================================
// HABITGO — Service Worker v2.0.0
// ============================================

const CACHE_NAME = 'habitgo-v2.0.0';
const RUNTIME_CACHE = 'habitgo-runtime-v2.0.0';

// Keshga saqlanadigan fayllar
const CACHE_FILES = [
    './',
    './index.html',
    './style.css',
    './i18n.js',
    './supabase.js',
    './push.js',
    './theme.js',
    './colors.js',
    './confetti.js',
    './notifications.js',
    './badges.js',
    './auth.js',
    './profile.js',
    './payment.js',
    './app.js',
    './ai.js',
    './heatmap.js',
    './charts.js',
    './challenge.js',
    './notes.js',
    './pwa.js',
    './backup.js',
    './tasks.js',
    './leaderboard.js',
    './manifest.json',
    './icon-192.png',
    './icon-512.png',
    'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

// O'RNATISH
self.addEventListener('install', function(event) {
    console.log('[SW] O\'rnatilmoqda... v2.0.0');

    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            console.log('[SW] Fayllar keshga saqlanmoqda');
            return cache.addAll(CACHE_FILES).catch(function(err) {
                console.error('[SW] Kesh xatosi:', err);
            });
        }).then(function() {
            console.log('[SW] O\'rnatildi');
            return self.skipWaiting();
        })
    );
});

// FAOLLASHTIRISH — eski keshni o'chirish
self.addEventListener('activate', function(event) {
    console.log('[SW] Faollashtirilmoqda... v2.0.0');

    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(name) {
                    if (name !== CACHE_NAME && name !== RUNTIME_CACHE) {
                        console.log('[SW] Eski kesh o\'chirilmoqda:', name);
                        return caches.delete(name);
                    }
                })
            );
        }).then(function() {
            console.log('[SW] Faollashtirildi');
            return self.clients.claim();
        })
    );
});

// SO'ROVLARNI USHLASH — Network first (Safari uchun yaxshiroq)
self.addEventListener('fetch', function(event) {
    if (event.request.method !== 'GET') return;
    if (!event.request.url.startsWith('http')) return;

    // Supabase API — har doim internetdan
    if (event.request.url.includes('supabase.co')) {
        return;
    }

    // HTML — har doim internetdan (Safari keshi uchun)
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(function() {
                return caches.match('./index.html');
            })
        );
        return;
    }

    // Qolgan fayllar — cache-first
    event.respondWith(
        caches.match(event.request).then(function(cachedResponse) {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(event.request).then(function(response) {
                if (!response || response.status !== 200 || response.type === 'opaque') {
                    return response;
                }

                var responseToCache = response.clone();
                caches.open(RUNTIME_CACHE).then(function(cache) {
                    cache.put(event.request, responseToCache);
                });

                return response;
            }).catch(function() {
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
            });
        })
    );
});

// XABAR QABUL QILISH
self.addEventListener('message', function(event) {
    if (event.data === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// ============================================
// PUSH NOTIFICATION
// ============================================
self.addEventListener('push', function(event) {
    console.log('[SW] Push keldi');

    var data = { title: 'HabitGo', body: 'Eslatma!' };
    try {
        if (event.data) data = event.data.json();
    } catch (e) {
        console.error('[SW] Push data xatosi:', e);
    }

    var options = {
        body: data.body || 'Bugungi odatlaringizni unutmang!',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [200, 100, 200],
        data: { url: '/' },
        actions: [
            { action: 'open', title: 'Ochish' },
            { action: 'close', title: 'Yopish' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// BILDIRISHNOMA BOSILGANDA
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    if (event.action === 'close') return;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
            for (var i = 0; i < clientList.length; i++) {
                var client = clientList[i];
                if (client.url.indexOf(self.location.origin) !== -1 && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});

console.log('[SW] Yuklandi v2.0.0');