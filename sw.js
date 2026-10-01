// Service worker for the Registo de Património app.
// Bump CACHE whenever index.html (or this file) changes, so clients pick up the new version.
var CACHE = 'drpm-patrimonio-v1';
var CORE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', function(event){
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then(function(cache){
      return cache.addAll(CORE_ASSETS).catch(function(){ /* ignore assets that fail to pre-cache */ });
    })
  );
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('message', function(event){
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

// Cache-first for speed and offline use, refreshing the cache in the background on every request.
self.addEventListener('fetch', function(event){
  if (event.request.method !== 'GET') return;
  var url = new URL(event.request.url);
  if (url.origin !== location.origin) return; // let cross-origin requests (fonts, QR/xlsx libs) hit the network directly

  event.respondWith(
    caches.match(event.request).then(function(cached){
      var network = fetch(event.request).then(function(response){
        if (response && response.status === 200){
          var copy = response.clone();
          caches.open(CACHE).then(function(cache){ cache.put(event.request, copy); });
        }
        return response;
      }).catch(function(){ return cached; });
      return cached || network;
    })
  );
});
