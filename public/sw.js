const CACHE = 'nompaw-photos-shell-v1';

self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(['/espace-membre/photos/'])));
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    if (event.request.method !== 'GET') return;
    if (!url.pathname.startsWith('/espace-membre/photos') && !url.pathname.startsWith('/build/')) return;

    event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
