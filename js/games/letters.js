/* لعبة «صيد الحروف» — تمييز أشكال الحروف. عالم بركة وأسماك.
   الضفدع يحمل بطاقة حرف، والأسماك تسبح ببطء وعلى كل منها حرف.
   تلمس الطفلة السمكة التي تحمل الحرف نفسه فتقفز إلى الدلو. ثلاث سمكات تُكمل الجولة.
   المستويات: ١) حرف واحد مختلف تماماً  ٢) حرفان مختلفان  ٣) حروف متشابهة الشكل (ب ت ث…)
              ٤) أسماك أكثر وأسرع قليلاً  ٥) أشكال الحرف في أول الكلمة (بـ تـ جـ) والبطاقة بالحرف المفرد.
   لا تُختبر بالنطق: المطلوب مطابقة الشكل فقط. */
(function () {
  'use strict';
  var B = (window.Bustan = window.Bustan || {});
  var UI = B.UI, h = UI.h, art = B.art, kit = B.kit;

  var ALL = 'ابتثجحخدذرزسشصضطظعغفقكلمنهوي';
  var EASY = 'ابجدرسصطعفكلمنهي'; // بلا «و» لأنها تشبه الرقم ٩ في هذا الخط                    // أشكال متباعدة
  var LOOK = ['بتثني', 'جحخ', 'دذ', 'رز', 'سش', 'صض', 'طظ', 'عغ', 'فق'];
  var JOIN = 'بتثجحخسشصضطظعغفقكلمنهي';              // تتصل بما بعدها (لها شكل أول الكلمة)
  var FISH_COLS = [['#FF8A3D', '#FFB27A'], ['#3D8BFD', '#8BB8FF'], ['#F2658E', '#FF9DB8'], ['#8E5CF0', '#B79BFF'], ['#2DBE7E', '#7FE0B0'], ['#FFC83D', '#FFE08A']];
  var CFG = {
    1: { dis: 1, lanes: 3, dur: 15 },
    2: { dis: 2, lanes: 3, dur: 14 },
    3: { dis: 2, lanes: 3, dur: 14, similar: true },
    4: { dis: 3, lanes: 4, dur: 12, similar: true },
    5: { dis: 3, lanes: 4, dur: 13, forms: true }
  };

  /* يبني جولة: الحرف المطلوب والمشتتات */
  function makeRound(level, prev) {
    var c = CFG[level], T, pool;
    if (c.forms) {
      do { T = kit.pick(JOIN.split('')); } while (T === prev);
      pool = JOIN.replace(T, '');
    } else if (c.similar) {
      var groups = LOOK.filter(function (g) { return g.length >= 2; });
      var grp = kit.pick(groups);
      do { T = kit.pick(grp.split('')); } while (T === prev && grp.length > 1);
      pool = grp.replace(T, '');
      if (pool.length < c.dis) pool += kit.shuffle(EASY.replace(T, '').split('')).join('').slice(0, c.dis - pool.length + 1);
    } else {
      do { T = kit.pick(EASY.split('')); } while (T === prev);
      // في المستوى ١ والثاني: مشتتات بعيدة الشكل عن الهدف
      pool = EASY.split('').filter(function (x) { return x !== T && !LOOK.some(function (g) { return g.indexOf(x) >= 0 && g.indexOf(T) >= 0; }); }).join('');
    }
    var dis = kit.shuffle(pool.split('')).filter(function (x, i, a) { return a.indexOf(x) === i && x !== T; }).slice(0, c.dis);
    return { level: level, target: T, dis: dis, forms: !!c.forms };
  }
  function glyph(L, forms) { return forms ? L + 'ـ' : L; } // شكل أول الكلمة بالتطويل

  function fishSvg(col) {
    return art.svg('0 0 140 90',
      '<path d="M120 45L140 18V72Z" fill="' + col[0] + '" stroke="' + col[0] + '" stroke-width="6" stroke-linejoin="round"/>' +
      '<path d="M68 14Q78 0 96 8L90 18Z" fill="' + col[0] + '"/>' +
      '<ellipse cx="72" cy="45" rx="58" ry="38" fill="' + col[0] + '"/>' +
      '<ellipse cx="76" cy="47" rx="34" ry="30" fill="#FAFCFF" opacity=".95"/>' +
      '<circle cx="26" cy="36" r="7" fill="#fff"/><circle cx="24" cy="36" r="4" fill="#2B2340"/>' +
      '<path d="M16 54q5 4 10 1" stroke="#2B2340" stroke-width="2.6" fill="none" stroke-linecap="round"/>' +
      '<path d="M96 70Q104 84 116 80" stroke="' + col[1] + '" stroke-width="6" fill="none" stroke-linecap="round"/>', 'fish-svg');
  }
  function bucketSvg() {
    return art.svg('0 0 100 90', '<path d="M8 20H92L82 84Q81 88 76 88H24Q19 88 18 84Z" fill="#5CC8FF" stroke="#2468D1" stroke-width="4" stroke-linejoin="round"/>' +
      '<ellipse cx="50" cy="20" rx="42" ry="9" fill="#9FE0FF" stroke="#2468D1" stroke-width="4"/><path d="M10 20Q50 -18 90 20" fill="none" stroke="#3A4789" stroke-width="4"/>', 'bucket-svg');
  }

  var st = null, runner = kit.roundRunner();

  function build(ctx) {
    var stage = ctx.stage;
    stage.classList.add('g-stage', 'lt-stage');
    st.card = h('div', { class: 'lt-card' });
    st.top = h('div', { class: 'lt-top' }, h('div', { class: 'lt-frog', html: art.animal('frog') }), st.card);
    st.pond = h('div', { class: 'lt-pond' });
    for (var b = 0; b < 7; b++) st.pond.appendChild(h('span', { class: 'lt-bubble', style: { left: 8 + b * 13 + '%', animationDelay: b * 0.9 + 's' } }));
    st.slots = h('div', { class: 'lt-slots' });
    st.bucket = h('div', { class: 'lt-bucket' }, h('div', { class: 'lt-bucket-art', html: bucketSvg() }), st.slots);
    stage.appendChild(st.top);
    stage.appendChild(st.pond);
    stage.appendChild(st.bucket);
  }

  function assign(f) {
    var R = st.R;
    // نضمن وجود سمكة هدف واحدة على الأقل في البركة
    var others = st.fish.filter(function (x) { return x !== f && x.L === R.target && !x.caught; }).length;
    var isT = others === 0 || Math.random() < 0.38;
    f.L = isT ? R.target : kit.pick(R.dis);
    f.letter.textContent = glyph(f.L, R.forms);
    f.caught = false;
    f.el.classList.remove('caught', 'pulse-hint');
    if (st.hintOn && f.L === R.target) f.el.classList.add('pulse-hint');
  }

  function buildFish(level) {
    var c = CFG[level], vp = UI.vp(), pond = st.pond;
    st.pond.querySelectorAll('.lt-fish').forEach(function (x) { x.remove(); });
    st.fish = [];
    var W = pond.clientWidth, H = pond.clientHeight;
    var F = Math.min(vp.tablet ? 170 : 128, Math.max(vp.tap * 1.35, H / (c.lanes * 0.95)));
    var lanes = Math.max(2, Math.min(c.lanes, Math.floor(H / (F * 0.72))));
    var laneH = H / lanes;
    for (var i = 0; i < lanes; i++) {
      for (var j = 0; j < 2; j++) {
        var col = FISH_COLS[(i * 2 + j) % FISH_COLS.length];
        var letter = h('span', { class: 'lt-letter', style: { fontSize: F * 0.34 + 'px' } });
        var inner = h('div', { class: 'lt-inner' }, h('div', { class: 'lt-body', html: fishSvg(col) }), letter);
        var el = h('div', {
          class: 'lt-fish', style: {
            width: F + 'px', height: F * 90 / 140 + 'px', top: i * laneH + (laneH - F * 0.64) / 2 + 'px',
            animationDuration: c.dur + (i % 2) * 1.5 + 's', animationDelay: -((j / 2) + i * 0.27) * (c.dur + (i % 2) * 1.5) + 's'
          }
        }, inner);
        el.style.setProperty('--from', W + 10 + 'px');
        el.style.setProperty('--to', -F - 10 + 'px');
        var f = { el: el, inner: inner, letter: letter, L: '', caught: false };
        (function (ff) {
          el.addEventListener('pointerdown', function (e) { e.preventDefault(); tapFish(ff); });
          el.addEventListener('animationiteration', function () { assign(ff); });
        })(f);
        st.fish.push(f);
        pond.appendChild(el);
      }
    }
    st.fish.forEach(assign);
  }

  function visibleTargets() {
    var pr = st.pond.getBoundingClientRect();
    return st.fish.filter(function (f) {
      if (f.L !== st.R.target || f.caught) return false;
      var r = f.el.getBoundingClientRect();
      return r.left > pr.left + 4 && r.right < pr.right - 4;
    });
  }

  function tapFish(f) {
    var ctx = st.ctx;
    if (!st.active || st.busy || f.caught || ctx.paused || (st.demo && !f.__auto)) return;
    if (f.L === st.R.target) { catchFish(f); return; }
    st.errors++; st.fails++;
    kit.wrong(f.inner);
    if (st.fails === 2) { st.hintOn = true; st.fish.forEach(function (x) { if (x.L === st.R.target) x.el.classList.add('pulse-hint'); }); }
    if (st.fails >= 3) helpCatch();
  }

  async function helpCatch() {
    var ctx = st.ctx, tok = st.tok;
    st.busy = true;
    var t = visibleTargets()[0];
    while (!t) { await ctx.sleep(300); if (tok !== st.tok) return; t = visibleTargets()[0]; }
    t.el.style.animationPlayState = 'paused';
    var c = kit.center(t.el, ctx.stage), hd = kit.hand(ctx.stage, c.x, c.y);
    await ctx.sleep(600); if (tok !== st.tok) return;
    await hd.tap(); hd.el.remove();
    t.el.style.animationPlayState = '';
    st.busy = false;
    t.__auto = true;
    catchFish(t);
    t.__auto = false;
  }

  function catchFish(f) {
    var ctx = st.ctx;
    f.caught = true;
    st.fails = 0; st.hintOn = false;
    st.fish.forEach(function (x) { x.el.classList.remove('pulse-hint'); });
    var from = kit.center(f.el, ctx.stage), to = kit.center(st.bucket, ctx.stage);
    // رشّة ماء ثم قفزة إلى الدلو
    var ring = h('span', { class: 'lt-splash', style: { left: from.x + 'px', top: from.y + 'px' } });
    ctx.stage.appendChild(ring);
    UI.anim(ring, [{ transform: 'translate(-50%,-50%) scale(.2)', opacity: 1 }, { transform: 'translate(-50%,-50%) scale(1.6)', opacity: 0 }], { dur: 600 }).then(function () { ring.remove(); });
    var fly = h('div', { class: 'lt-fly', style: { left: from.x - from.w / 2 + 'px', top: from.y - from.h / 2 + 'px', width: from.w + 'px', height: from.h + 'px' } });
    fly.innerHTML = f.inner.outerHTML;
    ctx.stage.appendChild(fly);
    f.el.classList.add('caught');
    if (B.audio) { B.audio.play('right'); B.audio.play('splash'); }
    var dx = to.x - from.x, dy = to.y - from.y;
    UI.anim(fly, [
      { transform: 'translate(0,0) scale(1) rotate(0)' },
      { transform: 'translate(' + dx * 0.5 + 'px,' + (Math.min(0, dy) - 90) + 'px) scale(.85) rotate(-30deg)', offset: 0.5 },
      { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(.3) rotate(-80deg)' }
    ], { dur: 650, easing: 'ease-in-out' }).then(function () {
      fly.remove();
      var slot = st.slots.children[st.caught - 1];
      if (slot) { slot.classList.add('on'); UI.anim(slot, [{ transform: 'scale(.3)' }, { transform: 'scale(1.3)' }, { transform: 'scale(1)' }], { dur: 380, easing: UI.SPRING, fill: 'none' }); }
      if (B.audio) B.audio.play('place');
    });
    st.caught++;
    if (st.caught >= st.need) {
      st.active = false;
      st.card.innerHTML = B.art.check();
      UI.anim(st.card, [{ transform: 'scale(.4) rotate(-15deg)' }, { transform: 'scale(1.15)' }, { transform: 'none' }], { dur: 450, easing: UI.SPRING, fill: 'none' });
      st.pond.classList.add('finished');
      setTimeout(function () { if (st && st.done) st.done(true); }, 750 / UI.ts); }
  }

  async function round(ctx, level, demo, alive) {
    var R = makeRound(level, st.prev);
    st.prev = R.target; st.R = R;
    st.errors = 0; st.fails = 0; st.caught = 0; st.need = demo ? 1 : 3; st.hintOn = false; st.busy = false; st.demo = demo;
    st.tok = (st.tok || 0) + 1;
    var finished = new Promise(function (r) { st.done = r; });
    // البطاقة: الحرف المفرد كبيراً
    st.card.innerHTML = '';
    st.card.appendChild(h('span', { text: R.target }));
    UI.anim(st.card, [{ transform: 'scale(.3) rotate(-12deg)', opacity: 0 }, { transform: 'none', opacity: 1 }], { dur: 480, easing: UI.SPRING, fill: 'backwards' });
    if (B.audio) B.audio.play('card');
    st.slots.innerHTML = '';
    for (var i = 0; i < st.need; i++) st.slots.appendChild(h('span', { class: 'lt-slot', html: fishSvg(FISH_COLS[i]) }));
    buildFish(level);
    st.pond.classList.remove('calm', 'finished');
    await ctx.sleep(700);
    if (!alive()) return;
    st.active = true;
    st.solve = function () { var t = visibleTargets()[0]; if (!t || st.busy || !st.active) return false; tapFish(t); return true; };
    if (demo) { await ctx.sleep(900); if (!alive()) return; st.fails = 2; helpCatch(); }
    var ok = await finished;
    st.solve = null;
    if (!alive() || !ok) return;
    // الاحتفال: الأسماك تقفز فرحاً
    st.pond.classList.add('calm');
    if (B.audio) B.audio.play('cheer');
    var c = kit.center(st.bucket, ctx.stage);
    UI.burst(ctx.stage, c.x, c.y - 20, { n: 22, spread: 150, dur: 1400 });
    st.fish.forEach(function (f, k) { UI.anim(f.inner, [{ transform: 'translateY(0)' }, { transform: 'translateY(-26px) rotate(-12deg)' }, { transform: 'translateY(0)' }], { dur: 600, delay: k * 70, fill: 'none', deco: true }); });
    await ctx.sleep(1500);
    if (!alive()) return;
    return { errors: demo ? 0 : st.errors };
  }

  B.games.letters = {
    id: 'letters',
    mount: function (ctx) { st = { ctx: ctx }; build(ctx); },
    demo: function (ctx) { return runner.run(function (alive) { return round(ctx, 1, true, alive); }); },
    playRound: function (ctx, level) { return runner.run(function (alive) { return round(ctx, level, false, alive); }); },
    cancelRound: function () {
      runner.cancel();
      if (st) { st.tok++; st.active = false; if (st.done) st.done(false); st.ctx.stage.querySelectorAll('.kit-hand,.lt-fly').forEach(function (x) { x.remove(); }); }
    },
    outro: function (ctx) { return kit.dusk(ctx); },
    endArt: function () { return kit.endScene('frog', h('div', { class: 'end-basket', html: bucketSvg() })); },
    destroy: function () { runner.stop(); if (st) st.tok++; st = null; },
    _makeRound: makeRound,
    _glyph: glyph,
    _solveStep: function () { return !!(st && st.solve && st.solve()); }
  };
})();
