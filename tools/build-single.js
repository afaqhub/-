/* يجمع التطبيق كله في ملف واحد: dist/index.html (الخطوط والأيقونات والأنماط والسكربتات مضمَّنة)
   + ملف اختياري dist/sw.js للعمل دون إنترنت (يُرفع بجانبه).
   التشغيل:  node tools/build-single.js */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'dist');
const read = (p) => fs.readFileSync(path.join(ROOT, p));
const b64 = (p) => read(p).toString('base64');

let html = read('index.html').toString('utf8');

// الأنماط: نضمّن الخطوط كـ data URI
html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (_, href) => {
  let css = read(href).toString('utf8');
  css = css.replace(/url\('\.\.\/(assets\/[^']+)'\)/g, (__, f) => `url('data:font/woff2;base64,${b64(f)}')`);
  return `<style>\n${css}\n</style>`;
});

// السكربتات بالترتيب نفسه
html = html.replace(/<script src="([^"]+)"><\/script>/g, (_, src) => {
  const js = read(src).toString('utf8');
  if (/<\/script/i.test(js)) throw new Error('وسم script داخل ' + src);
  return `<script>\n${js}\n</script>`;
});

// الأيقونات و manifest
html = html.replace('href="assets/icons/apple-touch-icon.png"', `href="data:image/png;base64,${b64('assets/icons/apple-touch-icon.png')}"`);
html = html.replace('href="assets/icons/icon-192.png"', `href="data:image/png;base64,${b64('assets/icons/icon-192.png')}"`);
html = html.replace(/<link rel="manifest"[^>]*>\n?/, '');

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'index.html'), html);

// Service Worker مبسّط للملف الواحد
const sw = `/* Service Worker — يحفظ الصفحة الوحيدة ليعمل التطبيق دون إنترنت. ارفع VERSION عند كل تحديث. */
'use strict';
const VERSION = '2.0.0';
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
`;
fs.writeFileSync(path.join(OUT, 'sw.js'), sw);
console.log('dist/index.html', (fs.statSync(path.join(OUT, 'index.html')).size / 1024).toFixed(0) + ' كيلوبايت');
