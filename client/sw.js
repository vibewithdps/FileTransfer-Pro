/*
==========================================================
    FileTransfer Pro v2
    Service Worker (PWA Offline UI Cache)
==========================================================
*/

const CACHE_NAME = "ft-pro-v2-cache-v1";
const ASSETS_TO_CACHE = [
    "/",
    "/index.html",
    "/public/css/style.css",
    "/public/css/theme.css",
    "/public/css/responsive.css",
    "/public/js/app.js",
    "/public/js/ui.js",
    "/public/js/upload.js",
    "/public/js/socket.js",
    "/manifest.json"
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE).catch(() => {});
        })
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Network-first strategy for dynamic API calls, Cache-first for static UI assets
self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);

    // Never cache API or upload endpoints or socket.io
    if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/socket.io/")) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                if (response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                }
                return response;
            })
            .catch(() => {
                return caches.match(event.request).then((cached) => {
                    if (cached) return cached;
                    if (event.request.mode === "navigate") {
                        return caches.match("/index.html");
                    }
                });
            })
    );
});
