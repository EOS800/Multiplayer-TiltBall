const CACHE = 'trailball-v1';
const LOCAL = ['./', 'index.html', 'manifest.json', 'icon-192.png', 'icon-512.png'];
const PEER = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c =>
    Promise.all([c.addAll(LOCAL), c.add(new Request(PEER, {mode: 'no-cors'})).catch(() => {})])
  ).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // game files: network first (so updates show up), fall back to cache offline
  if (url.origin === location.origin) {
    e.respondWith(fetch(req).then(r => {
      const copy = r.clone();
      caches.open(CACHE).then(c => c.put(req, copy));
      return r;
    }).catch(() => caches.match(req).then(r => r || caches.match('index.html'))));
    return;
  }
  // multiplayer library: cache first
  if (req.url === PEER) {
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(n => {
      const copy = n.clone();
      caches.open(CACHE).then(c => c.put(req, copy));
      return n;
    })));
  }
});
