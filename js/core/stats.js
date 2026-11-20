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
  function dayKey() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function bump(group, key) {
    var b = base();
    if (!b || !window.fetch) return;
    var inc = { '.sv': { increment: 1 } }, body = {};
    body[group + '/' + key] = inc;                                   // الإجمالي
    body['days/' + dayKey() + '/' + group + '/' + key] = inc;       // اليومي (للتقارير بالتواريخ)
    try { window.fetch(b + '/stats.json', { method: 'PATCH', body: JSON.stringify(body), keepalive: true }).catch(function () {}); } catch (e) {}
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

  /* إعدادات عن بعد يتحكم بها صاحب المشروع من لوحة الإدارة: إيقاف المنصة، وإخفاء ألعاب.
     تُحفظ نسخة محلية فتعمل دون إنترنت. config = { off, msg, hidden:{id:true} } */
  var CK = 'bustan.config', cfgShown = '';
  B.config = {
    off: false, msg: '', hidden: {},
    isHidden: function (id) { return !!B.config.hidden[id]; },
    _set: function (c) { c = c || {}; B.config.off = !!c.off; B.config.msg = c.msg || ''; B.config.hidden = c.hidden || {}; },
    init: function () { try { B.config._set(JSON.parse(window.localStorage.getItem(CK) || '{}')); } catch (e) {} cfgShown = JSON.stringify([B.config.off, B.config.msg, B.config.hidden]); B.config.applyOff(); },
    load: function () {
      var b = base(); if (!b || !window.fetch) return Promise.resolve();
      return window.fetch(b + '/config.json', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (c) {
        c = c || {}; B.config._set(c);
        try { window.localStorage.setItem(CK, JSON.stringify({ off: B.config.off, msg: B.config.msg, hidden: B.config.hidden })); } catch (e) {}
        var now = JSON.stringify([B.config.off, B.config.msg, B.config.hidden]);
        B.config.applyOff();
        if (now !== cfgShown) { cfgShown = now; if (B.home && B.home.refresh) B.home.refresh(); }
      }).catch(function () {});
    },
    save: function (cfg, key) {
      var u = B.S.statsDb; if (!u) return Promise.reject(new Error('no db'));
      var body = { off: !!cfg.off, msg: cfg.msg || '', hidden: cfg.hidden || {}, key: key || '', updated: Date.now() };
      return window.fetch(u.replace(/\/+$/, '') + '/config.json', { method: 'PUT', body: JSON.stringify(body) }).then(function (r) { if (!r.ok) throw new Error('write'); return r.json(); });
    },
    readRemote: function () { var u = B.S.statsDb; if (!u) return Promise.resolve({}); return window.fetch(u.replace(/\/+$/, '') + '/config.json', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (c) { return c || {}; }); },
    applyOff: function () {
      var lay = document.querySelector('.off-overlay');
      if (!B.config.off) { if (lay) lay.remove(); return; }
      if (lay) { lay.querySelector('p').textContent = B.config.msg || B.S.cfg.defaultMsg; return; }
      var h = B.UI.h;
      document.body.appendChild(h('div', { class: 'rest-overlay off-overlay', role: 'dialog', style: { zIndex: 500 } },
        h('div', { class: 'rest-card' }, h('div', { class: 'rest-bear', html: B.art.animal('bear', { sleep: true }) }), h('h2', { text: B.S.cfg.offTitle }), h('p', { text: B.config.msg || B.S.cfg.defaultMsg }))));
    }
  };
})();
