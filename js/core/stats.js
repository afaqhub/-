/* إحصاءات مجهولة لصاحب المشروع: عدّادات في قاعدة Firebase Realtime Database مجانية (رابطها في B.S.statsDb).
   لا يُرسل أي اسم أو بيانات شخصية: فقط زيادة عدّاد. يبقى معطّلاً إن كان statsDb فارغاً.
   العدّادات تحت stats/:  open (فتحات) · devices/new (أجهزة زارت) · devices/player (أجهزة لعبت)
                           play/<لعبة> (مرات البدء) · done/<لعبة> (جلسات مكتملة)
   كل جهاز يُعدّ مرة واحدة في new وفي player (عبر علامة في localStorage). */
(function () {
  'use strict';
  var B = (window.Bustan = window.Bustan || {});

  function base() {
    var u = B.S && B.S.statsDb;
    var local = /localhost|127\.0\.0\.1/;
    // لا نحسب فتح الملف محلياً ولا التجارب على جهازك (إلا إن كانت القاعدة نفسها محلية للاختبار)
    if (!u || window.location.protocol === 'file:' || (local.test(window.location.hostname) && !local.test(u))) return '';
    return u.replace(/\/+$/, '');
  }
  function once(flag) {
    try {
      if (window.localStorage.getItem(flag)) return false;
      window.localStorage.setItem(flag, '1');
      return true;
    } catch (e) { return false; }
  }
  /* زيادة عدّاد: PATCH بقيمة الخادم increment (ذرّية، لا تضيع الأرقام مع التزامن) */
  function bump(group, key) {
    var b = base();
    if (!b || !window.fetch) return;
    var body = {}; body[key] = { '.sv': { increment: 1 } };
    try { window.fetch(b + '/stats/' + group + '.json', { method: 'PATCH', body: JSON.stringify(body), keepalive: true }).catch(function () {}); } catch (e) {}
  }

  B.stats = {
    enabled: function () { return !!(B.S && B.S.statsDb); },
    open: function () { bump('events', 'open'); if (once('bustan.dev.new')) bump('devices', 'new'); },
    play: function (id) { bump('play', id); if (once('bustan.dev.player')) bump('devices', 'player'); },
    done: function (id) { bump('done', id); },
    /* قراءة كل العدّادات (للوحة الإدارة) */
    read: function () {
      var u = B.S.statsDb;
      if (!u) return Promise.reject(new Error('no db'));
      return window.fetch(u.replace(/\/+$/, '') + '/stats.json').then(function (r) { return r.json(); });
    }
  };
})();
