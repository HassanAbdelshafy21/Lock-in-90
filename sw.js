// Offline support: app files are served from cache and refreshed in the background.
const VERSION = 'lockin-v24';
const EXC = 'lockin-ex-1'; // exercise photos and data: kept across app updates
const FB = '10.14.1';
const SHELL = ['./', './index.html', './styles.css', './app.js', './core.js', './data.js', './i18n.js', './train.js', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-192.png', './icons/maskable-512.png', './icons/favicon.png', './icons/apple-touch-icon.png', './icons/logo.svg', './fonts/Alexandria.ttf'];
const SDK = ['firebase-app', 'firebase-auth', 'firebase-firestore', 'firebase-messaging'].map(n => `https://www.gstatic.com/firebasejs/${FB}/${n}.js`);
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
    for (const k of await caches.keys()) if (k !== VERSION && k !== EXC) await caches.delete(k);
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
  // exercise photos never change: cache first, keep forever. The data files refresh in the background.
  if (sameOrigin && /\/ex\//.test(url.pathname)) {
    e.respondWith((async () => {
      const c = await caches.open(EXC), hit = await c.match(req, { ignoreSearch: true });
      const net = fetch(req).then(r => { if (r && r.ok) c.put(req, r.clone()); return r; }).catch(() => null);
      if (hit) { if (/\.json$/.test(url.pathname)) e.waitUntil(net); return hit; }
      return (await net) || new Response('', { status: 504 });
    })());
    return;
  }
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

// App notifications (sent by the reminder job through Firebase Cloud Messaging)
self.addEventListener('push', e => {
  let m = {};
  try { const j = e.data ? e.data.json() : {}; m = j.data || j.notification || j; } catch (err) { m = { title: 'Lock In 90', body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(m.title || 'Lock In 90', { body: m.body || '', icon: './icons/icon-192.png', badge: './icons/favicon.png', tag: m.tag || 'lockin', renotify: true, data: { url: m.url || './' } }));
});
self.addEventListener('notificationclick', e => {
  const n = e.notification, a = e.action;
  // workout controls: pass the button to the open app without opening it
  if (n.tag === 'wo' && a && a !== 'open') {
    e.waitUntil((async () => {
      const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      if (all.length) all.forEach(c => c.postMessage({ wo: a }));
      else await self.clients.openWindow('./?wo=' + a + '#train');
    })());
    return;
  }
  n.close();
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) if ('focus' in c) { await c.focus(); return; }
    await self.clients.openWindow((n.data && n.data.url) || './');
  })());
});
