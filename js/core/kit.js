/* عُدّة مشتركة للألعاب: اليد الكرتونية، جولة الاختيار مع سلّم المساعدة، ردود الصواب والخطأ،
   والشاشة الختامية العامة. */
(function () {
  'use strict';
  var B = (window.Bustan = window.Bustan || {});
  var UI = B.UI, h = UI.h, art = B.art;

  function rand(n) { return Math.floor(Math.random() * n); }
  function pick(a) { return a[rand(a.length)]; }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = rand(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function center(el, rel) {
    var r = el.getBoundingClientRect(), s = rel.getBoundingClientRect();
    return { x: r.left + r.width / 2 - s.left, y: r.top + r.height / 2 - s.top, w: r.width, h: r.height };
  }

  /* يد تشير من الأسفل إلى نقطة (طرف الإصبع عند x,y) */
  function hand(layer, x, y) {
    var size = UI.vp().tablet ? 110 : 84, k = size / 96;
    var el = h('div', { class: 'kit-hand', style: { width: 88 * k + 'px', height: size + 'px', left: x - 44 * k + 'px', top: y - 2 * k + 'px' }, html: art.hand() });
    layer.appendChild(el);
    UI.anim(el, [{ opacity: 0, transform: 'translateY(60px)' }, { opacity: 1, transform: 'none' }], { dur: 450, easing: UI.SPRING, fill: 'none' });
    var cx = x, cy = y;
    return {
      el: el,
      moveTo: function (nx, ny) {
        var p = UI.anim(el, [{ transform: 'translate(0,0)' }, { transform: 'translate(' + (nx - cx) + 'px,' + (ny - cy) + 'px)' }], { dur: 600, fill: 'none' });
        return p.then(function () { cx = nx; cy = ny; el.style.left = nx - 44 * k + 'px'; el.style.top = ny - 2 * k + 'px'; });
      },
      tap: function () {
        return UI.anim(el, [{ transform: 'translateY(0) scale(1)' }, { transform: 'translateY(-10px) scale(.94)' }, { transform: 'translateY(0) scale(1)' }], { dur: 380, fill: 'none' });
      },
      remove: function () {
        return UI.anim(el, [{ opacity: 1 }, { opacity: 0, transform: 'translateY(40px)' }], { dur: 350 }).then(function () { el.remove(); });
      }
    };
  }

  /* رد الخطأ: اهتزاز لطيف وصوت خطأ (بلا لون أحمر ولا كلمات) */
  function wrong(el) {
    if (B.audio) B.audio.play('wrong');
    return UI.anim(el, [
      { transform: 'translateX(0)' }, { transform: 'translateX(-9px) rotate(-3deg)' }, { transform: 'translateX(9px) rotate(3deg)' },
      { transform: 'translateX(-6px)' }, { transform: 'translateX(0)' }
    ], { dur: 420, fill: 'none' });
  }
  /* رد الصواب: قفزة فرِحة وصوت صواب */
  function right(el) {
    if (B.audio) B.audio.play('right');
    return UI.anim(el, [{ transform: 'scale(1)' }, { transform: 'scale(1.18)' }, { transform: 'scale(1)' }], { dur: 420, easing: UI.SPRING, fill: 'none' });
  }

  /* جولة اختيار من أزرار: تُرجع {promise, cancel}.
     سلّم المساعدة: بعد إخفاقين ينبض الصحيح، وبعد الثالث تُظهر اليد الحل وتُكمل الجولة.
     o.demo: اليد تحلّ مباشرة (العرض التوضيحي). o.onWrong(el) اختياري. */
  function choice(ctx, layer, btns, correct, o) {
    o = o || {};
    var done = false, fails = 0, errors = 0, busy = false, hd = null, resolve;
    var promise = new Promise(function (res) { resolve = res; });
    function finish(el) {
      if (done) return;
      done = true;
      btns.forEach(function (b) { b.classList.remove('pulse-hint'); });
      right(el);
      resolve({ errors: errors, el: el });
    }
    async function showSolution() {
      busy = true;
      var c = center(btns[correct], layer);
      hd = hand(layer, c.x, c.y + c.h * 0.18);
      await ctx.sleep(650);
      if (done) return;
      await hd.tap();
      if (done) return;
      btns[correct].classList.add('pressed');
      setTimeout(function () { btns[correct].classList.remove('pressed'); }, 250);
      hd.remove(); hd = null;
      finish(btns[correct]);
    }
    btns.forEach(function (b, i) {
      b.__pick = function () {
        if (done || busy || o.demo) return;
        if (i === correct) { finish(b); return; }
        errors++; fails++;
        wrong(b);
        if (o.onWrong) o.onWrong(b, i);
        if (fails === 2) btns[correct].classList.add('pulse-hint');
        if (fails >= 3) showSolution();
      };
      UI.bindPress(b, function () { b.__pick(); });
    });
    if (o.demo) ctx.sleep(o.demoDelay || 900).then(function () { if (!done) showSolution(); });
    return {
      promise: promise,
      cancel: function () { done = true; if (hd) hd.el.remove(); resolve({ cancelled: true }); }
    };
  }

  /* شاشة ختامية عامة: قمر ونجوم وحيوان نائم */
  function endScene(animal, extra) {
    var stars = h('div', { class: 'end-stars' });
    for (var i = 0; i < 26; i++) {
      stars.appendChild(h('span', { class: 'end-star', style: { left: Math.random() * 100 + '%', top: Math.random() * 55 + '%', width: 6 + Math.random() * 10 + 'px', animationDelay: Math.random() * 3 + 's' }, html: art.sparkle('#FFF7C2') }));
    }
    var fire = h('div', { class: 'end-fire' });
    for (var f = 0; f < 10; f++) {
      fire.appendChild(h('span', { class: 'firefly', style: { left: Math.random() * 100 + '%', top: 60 + Math.random() * 35 + '%', animationDelay: Math.random() * 4 + 's', animationDuration: 4 + Math.random() * 3 + 's' } }));
    }
    var sleeper = animal === 'owl' ? art.owl({ sleep: true }) : art.animal(animal || 'bear', { sleep: true });
    return h('div', { class: 'end-train-wrap' }, stars, fire,
      h('div', { class: 'end-moon', html: art.moon() }),
      h('div', { class: 'end-owl end-sleeper' }, h('div', { html: sleeper }), h('span', { class: 'end-z', html: art.zzz() })),
      extra || null);
  }

  /* غروب هادئ فوق المسرح قبل الختام */
  function dusk(ctx) {
    var d = h('div', { class: 'kit-dusk' });
    ctx.stage.appendChild(d);
    if (B.audio) B.audio.play('lullaby');
    UI.anim(d, [{ opacity: 0 }, { opacity: 1 }], { dur: 1800 });
    return ctx.sleep(2000);
  }

  /* غلاف الجولات: يتكفل بالإلغاء (إعادة العرض) والرموز المميّزة للجولة */
  function roundRunner() {
    var token = 0, cancelFn = null, cur = null;
    return {
      run: function (fn) {
        var my = ++token;
        return new Promise(function (res) {
          cancelFn = function () { res({ cancelled: true }); };
          Promise.resolve(fn(function () { return my === token; }, function (c) { cur = c; })).then(function (r) { if (my === token && r) res(r); });
        });
      },
      cancel: function () { token++; if (cur && cur.cancel) cur.cancel(); cur = null; if (cancelFn) cancelFn(); cancelFn = null; },
      stop: function () { token++; }
    };
  }

  B.kit = { rand: rand, pick: pick, shuffle: shuffle, center: center, hand: hand, wrong: wrong, right: right, choice: choice, endScene: endScene, dusk: dusk, roundRunner: roundRunner };
})();
