const CACHE_NAME = 'scheduler-v2';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/config.js',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    '/offline.html',
    '/fallback.json'
];

const API_CACHE_NAME = 'api-cache-v1';
const API_URLS = [
    /^https:\/\/sheets\.googleapis\.com/,
    /^https:\/\/forms\.googleapis\.com/,
    /^https:\/\/www\.googleapis\.com\/calendar/
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME && cache !== API_CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    
    // Network-first for API calls
    if (API_URLS.some(url => request.url.match(url))) {
        event.respondWith(
            fetch(request)
                .then(response => {
                    const clone = response.clone();
                    caches.open(API_CACHE_NAME)
                        .then(cache => cache.put(request, clone));
                    return response;
                })
                .catch(() => caches.match(request))
        );
        return;
    }

    // Cache-first for static assets
    event.respondWith(
        caches.match(request)
            .then(cachedResponse => cachedResponse || fetch(request))
            .catch(() => {
                if (request.headers.get('accept').includes('text/html')) {
                    return caches.match('/offline.html');
                }
                if (request.headers.get('accept').includes('application/json')) {
                    return caches.match('/fallback.json');
                }
            })
    );
});

self.addEventListener('message', (event) => {
    if (event.data.type === 'CLEAR_CACHE') {
        caches.delete(CACHE_NAME);
        caches.delete(API_CACHE_NAME);
    }
});