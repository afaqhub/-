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
html = html.replace(/<link rel="manifest"[^>]*>\n?/, `<script>window.__BUSTAN_VERSION__="${(fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8').match(/VERSION = '([^']+)'/) || [0, '?'])[1]}";window.__BUSTAN_ICONS__={a:"data:image/png;base64,${b64('assets/icons/icon-192.png')}",b:"data:image/png;base64,${b64('assets/icons/icon-512.png')}"};</script>\n`);

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'index.html'), html);

// Service Worker مبسّط للملف الواحد
const sw = `/* Service Worker — يحفظ الصفحة الوحيدة ليعمل التطبيق دون إنترنت. ارفع VERSION عند كل تحديث. */
'use strict';
const VERSION = '7.10.0';
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
  // الشبكة أولاً ليصل كل تحديث فوراً، والذاكرة احتياطاً دون إنترنت
  e.respondWith(fetch(r).then((res) => { if (res && res.ok) { const c = res.clone(); caches.open(CACHE).then((k) => k.put(r, c)); } return res; })
    .catch(() => caches.match(r, { ignoreSearch: true }).then((hit) => hit || caches.match('./index.html'))));
});
`;
fs.writeFileSync(path.join(OUT, 'sw.js'), sw);
console.log('dist/index.html', (fs.statSync(path.join(OUT, 'index.html')).size / 1024).toFixed(0) + ' كيلوبايت');

// الدليل الشامل للمشروع (يُسلَّم مع كل تحديث): HANDOFF + IDEAS + PLAN في ملف واحد
try {
  const parts = ['HANDOFF.md', 'IDEAS.md', 'PLAN.md'].map((f) => '\n\n---\n\n<!-- ' + f + ' -->\n\n' + fs.readFileSync(path.join(ROOT, f), 'utf8'));
  fs.writeFileSync(path.join(OUT, 'PROJECT.md'), '# دليل مشروع «بستان الصغار» الشامل (الإصدار ' + (fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8').match(/VERSION = '([^']+)'/) || [0, '?'])[1] + ')\n' + parts.join(''));
} catch (e) { console.warn('PROJECT.md:', e.message); }

// حزمة الرفع: الملفان فقط (التطبيق يولّد manifest بنفسه من أيقونات مضمّنة كما كان)
try { require('child_process').execSync('rm -f bustan-upload.zip && zip -q bustan-upload.zip index.html sw.js', { cwd: OUT }); } catch (e) {}
