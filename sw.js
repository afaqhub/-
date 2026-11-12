/* Service Worker — الحفظ أولاً (cache-first) ليعمل التطبيق دون إنترنت.
   لتحديث التطبيق: ارفع رقم VERSION أدناه، فتُنشأ ذاكرة جديدة وتُحذف القديمة.
   لا يعيد تحميل الصفحة تلقائياً (كي لا تُفاجأ الطفلة)؛ يظهر التحديث عند الفتح التالي. */
'use strict';

const VERSION = '7.8.0';
const CACHE = 'bustan-v' + VERSION;

const FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/base.css',
  './css/ui.css',
  './css/train.css',
  './css/games.css',
  './js/core/strings.ar.js',
  './js/core/storage.js',
  './js/core/adaptive.js',
  './js/core/audio.js',
  './js/core/stats.js',
  './js/core/garden.js',
  './js/core/art.js',
  './js/core/pics.js',
  './js/core/ui.js',
  './js/core/kit.js',
  './js/core/session.js',
  './js/core/home.js',
  './js/core/parent.js',
  './js/games/train.js',
  './js/games/mirror.js',
  './js/games/pattern.js',
  './js/games/firstsound.js',
  './js/games/bridge.js',
  './js/games/fruits.js',
  './js/games/letters.js',
  './js/games/memory.js',
  './js/games/minis.js',
  './js/games/tracing.js',
  './js/games/more2.js',
  './js/games/more3.js',
  './js/games/creative.js',
  './js/games/stories.js',
  './js/app.js',
  './assets/fonts/tajawal-arabic-400-normal.woff2',
  './assets/fonts/tajawal-arabic-700-normal.woff2',
  './assets/fonts/tajawal-arabic-800-normal.woff2',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-maskable-512.png',
  './assets/icons/apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(FILES.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('bustan-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // لا نمسّ أي طلب خارجي
  const isPage = req.mode === 'navigate' || /\.(html|js|css)$/.test(url.pathname) || url.pathname.endsWith('/');
  if (isPage) {
    // الصفحة والسكربتات: الشبكة أولاً ليصل التحديث فوراً، ثم الذاكرة دون إنترنت
    e.respondWith(
      fetch(req).then((res) => {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      }).catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match('./index.html')))
    );
    return;
  }
  // الخطوط والأيقونات: الذاكرة أولاً
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req).then((res) => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() => Response.error()))
  );
});
