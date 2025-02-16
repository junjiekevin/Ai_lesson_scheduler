const CACHE_NAME = "scheduler-v1";
const STATIC_ASSETS = [
    "/",
    "/index.html",
    "/style.css",
    "/app.js",
    "/icons/icon-192x192.png",
    "/icons/icon-512x512.png",
    "/offline.html"
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(STATIC_ASSETS))
            .catch((error) => console.error("Failed to cache assets:", error))
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map(caches.delete)))
            .catch((error) => console.error("Cache cleanup failed:", error))
    );
});

self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") return;

    event.respondWith(
        event.request.url.includes("googleapis.com")
            ? fetch(event.request) // Always fetch fresh data from Google APIs
            : caches.match(event.request)
                .then((cachedResponse) => cachedResponse || fetch(event.request))
                .catch(() => caches.match("/offline.html"))
    );
});