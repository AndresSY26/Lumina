/* SW for Lumina Modular v1 - Offline Robustness */
const CACHE_NAME = 'lumina-mod-v1';
const STATIC_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './css/style.css',
    './js/main.js',
    './js/utils.js',
    './js/modules/ui.js',
    './js/modules/compass.js',
    './js/modules/telemetry.js',
    './js/modules/graph.js',
    './js/modules/ar.js'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) return caches.delete(key);
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // External Scripts: Network Only (No Cache to avoid CORS Errors)
  if (url.origin !== self.location.origin) {
     return; 
  }

  // Local Assets: Cache First, Network Fallback
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;

      return fetch(e.request).then((resp) => {
        if (resp && resp.status === 200 && resp.type === 'basic') {
            const respClone = resp.clone();
            caches.open(CACHE_NAME).then((cache) => {
                cache.put(e.request, respClone);
            });
        }
        return resp;
      }).catch(() => {
        // Fallback for Navigation
        if (e.request.mode === 'navigate') {
            return caches.match('./index.html');
        }
      });
    })
  );
});
