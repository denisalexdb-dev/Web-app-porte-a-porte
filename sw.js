const CACHE = 'pap-v3';
const ASSETS = [
  '/', '/porte-a-porte.html',
  '/lib/leaflet.js', '/lib/leaflet.css',
  '/data/buildings.js',
  '/manifest.json', '/icon-192.png', '/icon-512.png', '/apple-touch-icon.png', '/favicon-32.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
                 .then(() => self.clients.claim())
  );
});

// Réseau d'abord (toujours la dernière version en ligne), cache en secours hors-ligne.
// On laisse passer tout ce qui est externe (Firestore, gstatic, tuiles) et non-GET.
self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(
    fetch(req).then(resp => { const c = resp.clone(); caches.open(CACHE).then(x => x.put(req, c)); return resp; })
              .catch(() => caches.match(req).then(r => r || caches.match('/porte-a-porte.html')))
  );
});
