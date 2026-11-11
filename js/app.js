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

  B.stats.open();

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
