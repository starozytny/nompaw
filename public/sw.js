// v2 : la v1 mettait aussi en cache /build/* en cache-first, ce qui figeait les JS/CSS à leur
// première version vue par le navigateur. Le changement de nom ici force la suppression de cet
// ancien cache chez les utilisateurs déjà passés par la v1 (voir le nettoyage dans 'activate').
const CACHE = 'nompaw-photos-shell-v2';
const SHELL_URL = '/espace-membre/photos/';

self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll([SHELL_URL])));
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
    );
    self.clients.claim();
});

// Réseau d'abord, cache seulement en repli hors-ligne. Les fichiers sous /build/ ne sont
// volontairement jamais interceptés ici : en cache-first ils resteraient figés à leur toute
// première version vue par le navigateur, ne se mettant jamais à jour après un nouveau build
// (dev comme prod) tant que le cache n'est pas vidé à la main.
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    if (event.request.method !== 'GET') return;
    if (url.pathname !== SHELL_URL) return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                const clone = response.clone();
                caches.open(CACHE).then((cache) => cache.put(event.request, clone));
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});
