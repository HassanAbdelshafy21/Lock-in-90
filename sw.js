// Offline support: app files are served from cache and refreshed in the background.
const VERSION = 'lockin-v15';
const FB = '10.14.1';
const SHELL = ['./', './index.html', './styles.css', './app.js', './core.js', './data.js', './i18n.js', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-192.png', './icons/maskable-512.png', './icons/favicon.png', './icons/apple-touch-icon.png', './icons/logo.svg'];
const SDK = ['firebase-app', 'firebase-auth', 'firebase-firestore'].map(n => `https://www.gstatic.com/firebasejs/${FB}/${n}.js`);
const LIVE = ['firestore.googleapis.com', 'identitytoolkit.googleapis.com', 'securetoken.googleapis.com', 'www.googleapis.com', 'api.nal.usda.gov', 'world.openfoodfacts.org', 'firebaseapp.com', 'apis.google.com', 'accounts.google.com'];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(VERSION);
    await c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' })));
    await Promise.all(SDK.map(u => fetch(u, { mode: 'cors' }).then(r => r.ok && c.put(u, r)).catch(() => {})));
    self.skipWaiting();
  })());
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== VERSION) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (LIVE.some(h => url.hostname === h || url.hostname.endsWith('.' + h)) || url.pathname.startsWith('/__/')) return;
  const sameOrigin = url.origin === self.location.origin;
  const longLived = url.hostname === 'www.gstatic.com' || url.hostname === 'fonts.gstatic.com' || url.hostname === 'fonts.googleapis.com';
  if (!sameOrigin && !longLived) return;
  // the coach page is a separate page: let the browser load it normally
  if (sameOrigin && /coach\.(html|js)$/.test(url.pathname)) return;
  e.respondWith((async () => {
    const c = await caches.open(VERSION);
    const key = req.mode === 'navigate' ? './index.html' : req;
    const hit = await c.match(key, { ignoreSearch: req.mode === 'navigate' });
    const net = (sameOrigin ? fetch(req.mode === 'navigate' ? './index.html' : req.url, { cache: 'no-cache' }) : fetch(req)).then(r => { if (r && (r.ok || r.type === 'opaque')) c.put(key, r.clone()); return r; }).catch(() => null);
    if (hit) { if (sameOrigin) e.waitUntil(net); return hit; }
    const r = await net;
    return r || (req.mode === 'navigate' ? c.match('./index.html') : new Response('', { status: 504 }));
  })());
});
