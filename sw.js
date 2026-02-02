/* SW for Lumina v6 - Offline Robustness */
const CACHE_NAME = 'lumina-v6-offline';
const STATIC_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    // Removed External CDNs for offline stability
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

  // 1. External Scripts: Network Only (No Cache to avoid CORS Errors)
  // This includes Google Fonts, Unpkg, etc. if they are still requested.
  // We prioritize stability over caching external resources we can't control easily.
  if (url.origin !== self.location.origin) {
     return; // Allow browser default network behavior
  }

  // 2. Local Assets: Cache First, Network Fallback
  e.respondWith(
    caches.match(e.request).then((cached) => {
      // Return cached if found
      if (cached) return cached;

      // Fallback to Network
      return fetch(e.request).then((resp) => {
        // Cache valid local responses for future
        if (resp && resp.status === 200 && resp.type === 'basic') {
            const respClone = resp.clone();
            caches.open(CACHE_NAME).then((cache) => {
                cache.put(e.request, respClone);
            });
        }
        return resp;
      }).catch(() => {
        // Offline Fallback for Navigation (index.html)
        if (e.request.mode === 'navigate') {
            return caches.match('./index.html');
        }
      });
    })
  );
});
