/* نقطة الإقلاع: التخزين، حمايات اللمس، الخدمة، ثم الشاشة الرئيسية. */
(function () {
  'use strict';
  var B = window.Bustan;

  B.storage.init();
  B.UI.installGuards();
  document.title = B.S.appName;
  document.documentElement.lang = 'ar';
  document.documentElement.dir = 'rtl';

  // Service Worker: فقط عبر http/https (لا يعمل من file://) — ويستمر التطبيق بدونه
  if ('serviceWorker' in navigator && /^https?:$/.test(window.location.protocol)) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }

  // التثبيت كتطبيق: نحفظ حدث المتصفح، وفي الملف الواحد نولّد manifest من أيقونات مضمّنة
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); B.installEvt = e; });
  if (window.__BUSTAN_ICONS__ && /^https?:$/.test(window.location.protocol)) {
    try {
      var ib = window.__BUSTAN_ICONS__, base = window.location.href.replace(/[^\/]*$/, '');
      var man = { name: B.S.appName, short_name: 'بستان', lang: 'ar', dir: 'rtl', start_url: base, scope: base, display: 'standalone', orientation: 'any', background_color: '#CFEBFF', theme_color: '#CFEBFF',
        icons: [{ src: ib.a, sizes: '192x192', type: 'image/png', purpose: 'any' }, { src: ib.b, sizes: '512x512', type: 'image/png', purpose: 'any' }] };
      var ml = document.createElement('link'); ml.rel = 'manifest';
      ml.href = URL.createObjectURL(new Blob([JSON.stringify(man)], { type: 'application/manifest+json' }));
      document.head.appendChild(ml);
    } catch (e) {}
  }

  B.update = { pending: false, cur: window.__BUSTAN_VERSION__ || '', check: null, apply: null };
  if (B.update.cur && /^https?:$/.test(window.location.protocol)) {
    B.update.check = function () {
      return fetch(window.location.pathname + '?u=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.text(); }).then(function (txt) {
        var m = txt.match(/__BUSTAN_VERSION__="([^"]+)"/);
        if (m && m[1] !== B.update.cur) { B.update.pending = true; if (B.home && B.home.updateBar) B.home.updateBar(); }
        return B.update.pending;
      }).catch(function () { return false; });
    };
    B.update.apply = function () {
      var go = function () { window.location.reload(); };
      try {
        var p = [];
        if (window.caches) p.push(caches.keys().then(function (ks) { return Promise.all(ks.map(function (k) { return caches.delete(k); })); }));
        if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) p.push(navigator.serviceWorker.getRegistrations().then(function (rs) { return Promise.all(rs.map(function (r) { return r.update ? r.update() : null; })); }));
        Promise.all(p).then(go, go);
      } catch (e) { go(); }
    };
    setTimeout(B.update.check, 3000);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) B.update.check(); });
  }
  B.config.init();
  B.config.load();
  document.addEventListener('visibilitychange', function () { if (!document.hidden) B.config.load(); });
  B.timer.start();
  B.stats.open();
  if (B.storage.data().settings.night) B.applyNight(true);

  // نبدأ بعد تحميل الخط كي لا يتبدل شكل النص أمام الطفلة
  function boot() { B.home.show(); }
  if (document.fonts && document.fonts.ready) {
    var done = false;
    var go = function () { if (!done) { done = true; boot(); } };
    document.fonts.ready.then(go);
    setTimeout(go, 1200); // لا ننتظر الخط أكثر من ذلك
  } else {
    boot();
  }
})();
