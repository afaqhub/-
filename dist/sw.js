/* Service Worker — يحفظ الصفحة الوحيدة ليعمل التطبيق دون إنترنت. ارفع VERSION عند كل تحديث. */
'use strict';
const VERSION = '1.0.1';
const CACHE = 'bustan-v' + VERSION;
const FILES = ['./', './index.html'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('bustan-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== self.location.origin) return;
  e.respondWith(caches.match(r, { ignoreSearch: true }).then((hit) => hit || fetch(r).catch(() => caches.match('./index.html'))));
});
