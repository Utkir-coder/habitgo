// ============================================
// HABITGO — Service Worker (PWA offline)
// ============================================

const CACHE_NAME = 'habitgo-v1.0.1';

// Keshga saqlanadigan fayllar
const CACHE_FILES = [
    './',
    './index.html',
    './style.css',
    './theme.js',
    './colors.js',
    './confetti.js',
    './notifications.js',
    './badges.js',
    './auth.js',
    './profile.js',
    './payment.js',
    './app.js',
    './heatmap.js',
    './charts.js',
    './challenge.js',
    './notes.js',
    './manifest.json',
    './icon-192.svg',
    './icon-512.svg',
    'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
];

// O'rnatish — fayllarni keshga saqlash
self.addEventListener('install', (event) => {
    console.log('[SW] O\'rnatilmoqda...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Fayllar keshga saqlanmoqda');
                return cache.addAll(CACHE_FILES);
            })
            .then(() => {
                console.log('[SW] O\'rnatildi');
                return self.skipWaiting();
            })
            .catch((err) => {
                console.error('[SW] Kesh xatosi:', err);
            })
    );
});

// Faollashtirish — eski keshni tozalash
self.addEventListener('activate', (event) => {
    console.log('[SW] Faollashtirilmoqda...');

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((name) => {
                    if (name !== CACHE_NAME) {
                        console.log('[SW] Eski kesh o\'chirilmoqda:', name);
                        return caches.delete(name);
                    }
                })
            );
        }).then(() => {
            console.log('[SW] Faollashtirildi');
            return self.clients.claim();
        })
    );
});

// So'rovlarni ushlash — avval kesh, keyin internet
self.addEventListener('fetch', (event) => {
    // Faqat GET so'rovlar uchun
    if (event.request.method !== 'GET') return;

    // Chrome extension va boshqalarni o'tkazib yuborish
    if (!event.request.url.startsWith('http')) return;

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // Keshda bo'lsa — qaytarish
                if (cachedResponse) {
                    return cachedResponse;
                }

                // Keshda bo'lmasa — internetdan yuklash
                return fetch(event.request)
                    .then((response) => {
                        // Faqat muvaffaqiyatli so'rovlarni keshga saqlash
                        if (!response || response.status !== 200 || response.type === 'opaque') {
                            return response;
                        }

                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseToCache);
                        });

                        return response;
                    })
                    .catch(() => {
                        // Offline va keshda yo'q
                        if (event.request.mode === 'navigate') {
                            return caches.match('./index.html');
                        }
                    });
            })
    );
});

// Xabar qabul qilish (yangilash uchun)
self.addEventListener('message', (event) => {
    if (event.data === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

console.log('[SW] Yuklandi');