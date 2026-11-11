/* أدوات الواجهة المشتركة: بناء DOM، حركات، أزرار، انتقالات، جسيمات، مصابيح الجلسة. */
(function () {
  'use strict';
  var B = (window.Bustan = window.Bustan || {});

  /* معامل تسريع الزمن للاختبار الآلي فقط: ?ts=5 */
  var ts = 1;
  try {
    var m = /[?&]ts=([0-9.]+)/.exec(window.location.search);
    if (m) ts = Math.max(1, Math.min(20, parseFloat(m[1]) || 1));
  } catch (e) {}

  var reducedMq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  function reduced() { return !!(reducedMq && reducedMq.matches); }

  var EASE = 'cubic-bezier(.22,.8,.3,1)';
  var SPRING = 'cubic-bezier(.34,1.56,.64,1)'; // تجاوز بسيط يشبه الزنبرك

  /* ───── بناء العناصر ───── */
  function h(tag, props) {
    var el = document.createElement(tag);
    props = props || {};
    Object.keys(props).forEach(function (k) {
      var v = props[k];
      if (v == null || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'style') { if (typeof v === 'string') el.style.cssText = v; else Object.assign(el.style, v); }
      else if (k === 'text') el.textContent = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k.indexOf('on') === 0) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    });
    for (var i = 2; i < arguments.length; i++) append(el, arguments[i]);
    return el;
  }
  function append(el, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) c.forEach(function (x) { append(el, x); });
    else if (typeof c === 'string') el.appendChild(document.createTextNode(c));
    else el.appendChild(c);
  }
  function fromSvg(str) {
    var t = document.createElement('template');
    t.innerHTML = str.trim();
    return t.content.firstChild;
  }
  var DIGITS = '٠١٢٣٤٥٦٧٨٩';
  function num(n) { return String(n).replace(/\d/g, function (d) { return DIGITS[+d]; }); }

  /* ───── الزمن والحركة ───── */
  function sleep(ms) {
    return new Promise(function (res) { window.setTimeout(res, ms / ts); });
  }
  /* حركة WAAPI. deco=true: زخرفية وتُلغى عند تفضيل تقليل الحركة. */
  function anim(el, kf, o) {
    o = o || {};
    if (o.deco && reduced()) return Promise.resolve();
    var a;
    try {
      a = el.animate(kf, {
        duration: Math.max(1, (o.dur || 400) / ts),
        delay: (o.delay || 0) / ts,
        easing: o.easing || EASE,
        fill: o.fill || 'both',
        iterations: o.iter || 1
      });
    } catch (e) { return Promise.resolve(); }
    var p = a.finished.then(function () { return a; }, function () { return a; });
    p.anim = a;
    return p;
  }

  /* ───── الأزرار ─────
     down=true: يعمل عند لمس الإصبع للشاشة (أسرع استجابة للعبة).
     غير ذلك: عند الرفع (click) كي لا تُفعَّل بنقرة عابرة أثناء السحب. */
  function bindPress(el, fn, o) {
    o = o || {};
    function on() { el.classList.add('pressed'); }
    function off() { el.classList.remove('pressed'); }
    el.addEventListener('pointerdown', function (e) {
      on();
      if (B.audio) B.audio.play('tap');
      if (o.down) { e.preventDefault(); fn(e); }
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) { el.addEventListener(ev, off); });
    if (!o.down) el.addEventListener('click', function (e) { fn(e); });
    else el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') fn(e); });
    return el;
  }

  function vp() {
    var W = window.innerWidth, H = window.innerHeight;
    var tablet = Math.min(W, H) >= 700;
    return { W: W, H: H, tablet: tablet, tap: tablet ? 96 : 72 };
  }

  /* ───── الشاشات ───── */
  var current = null;
  function root() { return document.getElementById('app'); }
  function go(el, o) {
    o = o || {};
    var old = current;
    root().appendChild(el);
    current = el;
    if (o.instant) { if (old && old !== el) old.remove(); return Promise.resolve(); }
    el.style.opacity = '0';
    return anim(el, [{ opacity: 0 }, { opacity: 1 }], { dur: 320, fill: 'none' }).then(function () {
      el.style.opacity = '';
      if (old && old !== el && old.parentNode) old.remove();
    });
  }

  /* ستارة دائرية تتسع من نقطة اللمس: تمهيد بصري قبل أي انتقال */
  function curtain(color, x, y) {
    var v = vp();
    x = x == null ? v.W / 2 : x; y = y == null ? v.H / 2 : y;
    var r = Math.sqrt(v.W * v.W + v.H * v.H) + 40;
    var disc = h('div', { class: 'curtain-disc', style: { background: color, width: r * 2 + 'px', height: r * 2 + 'px', left: x - r + 'px', top: y - r + 'px' } });
    var wrap = h('div', { class: 'curtain' }, disc);
    root().appendChild(wrap);
    var cover = anim(disc, [{ transform: 'scale(0.02)' }, { transform: 'scale(1)' }], { dur: 460, easing: 'cubic-bezier(.5,0,.3,1)' });
    return {
      cover: cover,
      reveal: function () {
        return anim(wrap, [{ opacity: 1 }, { opacity: 0 }], { dur: 380, fill: 'both' }).then(function () { wrap.remove(); });
      }
    };
  }

  /* ───── جسيمات الاحتفال (بتلات ودوائر وقلوب، بلا نجوم) ───── */
  var CONFETTI = ['#FFD34E', '#F2658E', '#3D8BFD', '#19B394', '#8E5CF0', '#FF8A3D'];
  function burst(parent, x, y, o) {
    if (reduced()) return;
    o = o || {};
    var n = o.n || 16, spread = o.spread || 110, dur = o.dur || 1100, cols = o.colors || CONFETTI;
    for (var i = 0; i < n; i++) {
      var s = 7 + Math.random() * 8;
      var shape = i % 3;
      var p = h('span', {
        class: 'confetti',
        style: {
          left: x + 'px', top: y + 'px', width: s + 'px', height: (shape === 1 ? s * 1.6 : s) + 'px',
          background: cols[i % cols.length], borderRadius: shape === 1 ? '50% 50% 50% 50% / 70% 70% 30% 30%' : '50%'
        }
      });
      parent.appendChild(p);
      var ang = (-Math.PI / 2) + (Math.random() - 0.5) * 2.4;
      var dist = spread * (0.5 + Math.random() * 0.7);
      var dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist;
      anim(p, [
        { transform: 'translate(0,0) scale(.3) rotate(0)', opacity: 1 },
        { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(1) rotate(' + (Math.random() * 240 - 120) + 'deg)', opacity: 1, offset: 0.55 },
        { transform: 'translate(' + dx * 1.15 + 'px,' + (dy + 70) + 'px) scale(.9) rotate(' + (Math.random() * 360 - 180) + 'deg)', opacity: 0 }
      ], { dur: dur, delay: i * 14, easing: 'cubic-bezier(.2,.7,.4,1)' }).then((function (el) {
        return function () { el.remove(); };
      })(p));
    }
  }

  /* ───── مصابيح الجلسة ───── */
  function bulbs(n) {
    var wrap = h('div', { class: 'bulbs', 'data-count': n });
    wrap.style.setProperty('--n', n);
    var list = [];
    wrap.appendChild(h('div', { class: 'wire' }));
    for (var i = 0; i < n; i++) {
      var b = h('div', { class: 'bulb', html: B.art.bulb() });
      list.push(b); wrap.appendChild(b);
    }
    return {
      el: wrap,
      light: function (i) {
        var b = list[i];
        if (!b) return Promise.resolve();
        b.classList.add('lit');
        if (B.audio) B.audio.play('chime', i);
        return anim(b, [{ transform: 'scale(1)' }, { transform: 'scale(1.55)' }, { transform: 'scale(1)' }], { dur: 560, easing: SPRING, fill: 'none' });
      },
      litCount: function () { return list.filter(function (x) { return x.classList.contains('lit'); }).length; }
    };
  }

  function iconButton(cls, svgStr, label, fn, o) {
    var b = h('button', { class: 'hud-btn ' + cls, type: 'button', 'aria-label': label, html: svgStr });
    bindPress(b, fn, o);
    return b;
  }

  /* حمايات اللمس: لا تكبير ولا تحديد ولا نقر مزدوج ولا تمرير */
  function installGuards() {
    ['gesturestart', 'gesturechange', 'gestureend'].forEach(function (ev) {
      document.addEventListener(ev, function (e) { e.preventDefault(); });
    });
    document.addEventListener('touchstart', function (e) {
      if (e.touches.length > 1) e.preventDefault();
    }, { passive: false });
    document.addEventListener('touchmove', function (e) {
      if (!e.target.closest || !e.target.closest('.scrollable, .parent-overlay')) e.preventDefault();
    }, { passive: false });
    document.addEventListener('dblclick', function (e) { e.preventDefault(); });
    document.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    document.addEventListener('selectstart', function (e) {
      var t = e.target && e.target.closest ? e.target.closest('textarea,input') : null;
      if (!t) e.preventDefault();
    });
    ['pointerdown', 'touchend', 'click'].forEach(function (ev) {
      document.addEventListener(ev, function () { if (B.audio) B.audio.unlock(); }, true);
    });
  }

  B.UI = {
    ts: ts,
    EASE: EASE,
    SPRING: SPRING,
    reduced: reduced,
    h: h,
    fromSvg: fromSvg,
    num: num,
    sleep: sleep,
    anim: anim,
    bindPress: bindPress,
    vp: vp,
    go: go,
    root: root,
    current: function () { return current; },
    curtain: curtain,
    burst: burst,
    bulbs: bulbs,
    iconButton: iconButton,
    installGuards: installGuards
  };
})();
