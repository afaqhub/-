/* لعبة «قطار الإشارة» — الكفّ (التوقف عن نشاط ممتع).
   قطار يسير ببطء ثابت في منظر متحرك. تظهر على أعمدة الإشارة رموز، وعليها أن تنقر «قف»
   حين يصل عمود فيه الرمز الهدف إلى علامة المحطة. تنتهي الجولة بصعود ٣ ركاب.

   وحدات القياس: المسافة بـ«عمود» (١ = المسافة بين عمودين S بالبكسل)، فالسرعة تتناسب
   مع حجم الشاشة. اتجاه القطار نحو اليسار (اتجاه القراءة العربية)، فتجري الأعمدة نحو اليمين. */
(function () {
  'use strict';
  var B = (window.Bustan = window.Bustan || {});
  var UI = B.UI, h = UI.h, art = B.art;

  var SHAPES = art.SHAPES, COLOR_KEYS = art.COLOR_KEYS;
  var SPEED = 0.5;     // أعمدة في الثانية (عمود كل ثانيتين)
  var BRAKE = 1.0;     // مدة الكبح بالثانية
  var QBRAKE = 0.5;    // كبح لحظة الاستفهام
  var LAUNCH = 1.3;    // مدة الانطلاق
  var ROUND_STOPS = 3; // ركاب الجولة

  /* ألوان مشتتات المستوى ٣: بعيدة عن لون الهدف (حذراً من تقارب الأحمر والأخضر) */
  var FAR_COLORS = {
    red: ['blue', 'yellow', 'purple'], green: ['purple', 'orange', 'blue'],
    blue: ['red', 'yellow', 'orange'], yellow: ['blue', 'purple', 'green'],
    purple: ['yellow', 'green', 'orange'], orange: ['blue', 'purple', 'green']
  };

  /* ══════════ منطق الجولة (دوال نقية قابلة للاختبار) ══════════ */
  function rand(n) { return Math.floor(Math.random() * n); }
  function pick(a) { return a[rand(a.length)]; }
  function sym(shape, color) { return { shape: shape, color: color }; }
  function same(a, b) { return !!a && !!b && a.shape === b.shape && a.color === b.color; }
  function otherShape(s) { return pick(SHAPES.filter(function (x) { return x !== s; })); }
  function farColor(c) { return pick(FAR_COLORS[c]); }
  function clamp(lo, v, hi) { return Math.max(lo, Math.min(hi, v)); }

  function distractor(level, T, T2) {
    if (level === 2) return sym(otherShape(T.shape), pick(COLOR_KEYS));            // شكل مختلف
    if (level === 3) return sym(T.shape, farColor(T.color));                        // نفس الشكل ولون مختلف
    var base = Math.random() < 0.5 ? T : T2;                                        // المستوى ٤: شبيه بأحد الهدفين
    return Math.random() < 0.5 ? sym(base.shape, farColor(base.color)) : sym(otherShape(base.shape), base.color);
  }

  /* يبني جولة: الهدف/الأهداف، وحلقة الأعمدة (K عموداً)، وهل القاعدة مقلوبة */
  function makeRound(level, K, prev) {
    var T;
    do { T = sym(pick(SHAPES), pick(COLOR_KEYS)); } while (prev && same(T, prev));
    var ring = [], i, half = Math.floor(K / 2);
    for (i = 0; i < K; i++) ring.push(null);
    var round = { level: level, K: K, targets: [T], inverted: false, ring: ring };

    ring[0] = T;
    if (level === 4) {
      var T2;
      do { T2 = sym(pick(SHAPES), pick(COLOR_KEYS)); } while (T2.shape === T.shape || T2.color === T.color);
      round.targets = [T, T2];
      ring[half] = T2;
    } else {
      ring[half] = T;
    }
    if (level === 5) round.inverted = true;

    var near = 0;
    for (i = 1; i < K; i++) {
      if (ring[i]) continue;
      if (level === 1) continue; // أعمدة فارغة
      if (level === 5) {
        // كل الأعمدة عليها رموز؛ اثنان منها شبيهان بالمستثنى (نفس الشكل ولون آخر)
        if (near < 2 && (i === 1 || i === half + 1)) { ring[i] = sym(T.shape, farColor(T.color)); near++; continue; }
        var s5;
        do { s5 = sym(pick(SHAPES), pick(COLOR_KEYS)); } while (same(s5, T) || same(s5, ring[i - 1]));
        ring[i] = s5;
        continue;
      }
      if (Math.random() < 0.8) {
        var s, guard = 0;
        do { s = distractor(level, T, round.targets[1]); guard++; }
        while ((round.targets.some(function (t) { return same(t, s); }) || same(s, ring[i - 1])) && guard < 20);
        if (!round.targets.some(function (t) { return same(t, s); })) ring[i] = s;
      }
    }
    return round;
  }

  /* هل العمود الذي عليه الرمز s صالح للتوقف في هذه الجولة؟ */
  function isValid(round, s) {
    if (!s) return false;
    if (round.inverted) return !same(s, round.targets[0]);
    return round.targets.some(function (t) { return same(t, s); });
  }

  /* ══════════ الحالة ══════════ */
  var st = null;

  function create(ctx) {
    st = {
      ctx: ctx, alive: true, raf: 0, last: 0, t: 0,
      pos: 0, v: SPEED, vFrom: SPEED, vTo: SPEED, vT: 1, vDur: 1,
      rings: [], active: null, round: null, phase: 'idle',
      stops: 0, need: ROUND_STOPS, errors: 0, fails: 0, missed: 0, wrong: 0, idle: 0,
      hint: false, armed: false, demo: false, token: 0, resolve: null,
      seated: [null, null, null], wagonBase: 0, lastTarget: null, lastAnimal: '',
      firstAnimals: [], smokeT: 0, cardShown: false, resizeT: 0,
      wheels: [], layers: [], cars: [], G: null, el: {}
    };
  }

  /* ══════════ الأبعاد ══════════ */
  function geometry(W, H, vp) {
    var u = clamp(0.8, Math.min(W / 400, H / 660), 1.6);
    var cs = 0.88 * u;
    var short = H < 500;                            // جوال أفقي: ارتفاع شحيح
    var D = vp.tablet ? 132 : (short ? 88 : 100);   // قطر زر «قف» (≥ حدّ اللمس)
    var us = vp.tablet ? 1.45 : 1;
    var zoneH = D + (vp.tablet ? 44 : (short ? 22 : 34));
    var locoW = 130 * cs, locoH = 100 * cs, wagW = 90 * cs, wagH = 110 * cs, gap = 3 * cs;
    var S = clamp(190, 0.3 * W, 300);
    var K = Math.ceil(W / S) + 3;
    var yTrack = Math.min(H - zoneH - 34 * u, H * 0.7);
    var trainW = locoW + ROUND_STOPS * (wagW + gap);
    var trainTop = yTrack - wagH * (108 / 110);
    var bw = clamp(64, Math.min(0.5 * S, trainTop - 14 - 62), 150);
    return {
      W: W, H: H, u: u, cs: cs, D: D, us: us, zoneH: zoneH, S: S, K: K,
      locoW: locoW, locoH: locoH, wagW: wagW, wagH: wagH, gap: gap,
      yTrack: yTrack, trainW: trainW, trainLeft: (W - trainW) / 2, trainTop: trainTop,
      bw: bw, pw: bw * 100 / 88, boardTop: trainTop - 14 - bw,
      mark: W / 2, markQ: W / 2 / S
    };
  }

  /* ══════════ بناء المشهد ══════════ */
  function layer(parent, kind, y, hgt, factor, tileW, cls) {
    var n = Math.ceil(st.G.W / tileW) + 1;
    var inner = '';
    for (var i = 0; i < n; i++) inner += art.sceneTile(kind, Math.round(tileW), Math.round(hgt));
    var el = h('div', { class: 'layer ' + (cls || ''), style: { top: y + 'px', height: hgt + 'px', width: n * tileW + 'px' }, html: inner });
    parent.appendChild(el);
    st.layers.push({ el: el, tileW: tileW, factor: factor });
    return el;
  }

  function build() {
    var ctx = st.ctx, stage = ctx.stage;
    stage.innerHTML = '';
    stage.classList.add('train-stage');
    st.wheels = []; st.layers = []; st.cars = [];
    var vp = UI.vp();
    var g = st.G = geometry(stage.clientWidth, stage.clientHeight, vp);
    var W = g.W, H = g.H;
    stage.style.setProperty('--us', g.us);
    stage.style.setProperty('--bw', g.bw + 'px');
    stage.style.setProperty('--D', g.D + 'px');

    var tileW = Math.max(600, 700 * g.u);

    // السماء والشمس
    stage.appendChild(h('div', { class: 'sky' }));
    stage.appendChild(h('div', { class: 'sun', style: { left: W * 0.6 + 'px', top: H * 0.07 + 'px', width: 120 * g.u + 'px' }, html: art.sun() }));

    // قوس قزح خافت خلف الجبال، وجبال بقمم ثلجية (أبطأ طبقة)
    var rbW = Math.min(W * 0.9, 520 * g.u);
    stage.appendChild(h('div', { class: 'rainbow', style: { left: W * 0.5 - rbW / 2 + 'px', top: g.yTrack - rbW * 0.5 - 20 * g.u + 'px', width: rbW + 'px' }, html: art.rainbow() }));
    var hmn = Math.min(g.yTrack * 0.42, 260 * g.u);
    var mtn = h('div', { class: 'layer l-mtn', style: { top: g.yTrack - hmn + 6 + 'px', height: hmn + 'px', width: 2 * tileW + 'px' }, html: art.mountains(tileW, hmn) + art.mountains(tileW, hmn) });
    stage.appendChild(mtn);
    st.layers.push({ el: mtn, tileW: tileW, factor: 0.05 });
    // طبقات parallax بسرعات مختلفة
    layer(stage, 'clouds', H * 0.02, H * 0.32, 0.035, tileW, 'l-clouds');
    // بالونات وطيور تطفو في السماء (زينة حيّة)
    var deco = h('div', { class: 'sky-deco' });
    [['#F2658E', '#FFD34E', 0.1, 0.2, 1], ['#8E5CF0', '#5CC8FF', 0.8, 0.26, 0.8], ['#19B394', '#FFE45E', 0.45, 0.17, 0.6]].forEach(function (b, i) {
      deco.appendChild(h('div', { class: 'balloon b' + i, style: { left: W * b[2] + 'px', top: H * b[3] + 'px', width: 54 * g.u * b[4] + 'px' }, html: art.balloon(b[0], b[1]) }));
    });
    [[0.3, 0.3, 1], [0.36, 0.27, 0.75], [0.33, 0.35, 0.6]].forEach(function (b, i) {
      deco.appendChild(h('div', { class: 'bird f' + i, style: { left: W * b[0] + 'px', top: H * b[1] + 'px', width: 44 * g.u * b[2] + 'px' }, html: art.bird(i === 1 ? '#3D8BFD' : '#FF8A3D') }));
    });
    stage.appendChild(deco);
    var hf = Math.min(g.yTrack * 0.42, 260 * g.u);
    layer(stage, 'far', g.yTrack - hf + 4, hf, 0.08, tileW, 'l-far');
    var hm = hf * 0.72;
    var midL = layer(stage, 'mid', g.yTrack - hm + 6, hm, 0.2, tileW, 'l-mid');
    var wm = Math.min(hm * 0.95, 140 * g.u);
    midL.appendChild(h('div', { class: 'windmill', style: { left: tileW * 0.3 + 'px', bottom: hm * 0.08 + 'px', width: wm * 100 / 140 + 'px', height: wm + 'px' }, html: art.windmill() }));

    // الأرض
    stage.appendChild(h('div', { class: 'ground', style: { top: g.yTrack - 8 * g.u + 'px' } }));

    // الأعمدة (خلف القطار)
    st.el.poles = h('div', { class: 'poles' });
    stage.appendChild(st.el.poles);

    // علامة المحطة: إطار مضيء حول المنطقة التي يُنقر عندها
    var P = g.S * 0.9;
    stage.appendChild(h('div', {
      class: 'bracket',
      style: { left: g.mark - P / 2 + 'px', width: P + 'px', top: g.boardTop - 12 + 'px', height: g.bw + 24 + 'px' }
    }, h('span', { class: 'bracket-tip' })));

    // القضبان والعوارض
    layer(stage, 'ties', g.yTrack + 2 * g.u, 12 * g.u, 1, 8 * 38 * g.u, 'l-ties');
    stage.appendChild(h('div', { class: 'rail', style: { top: g.yTrack - 2 * g.u + 'px', height: 7 * g.u + 'px' } }));

    // القطار
    st.el.train = h('div', { class: 'train' });
    stage.appendChild(st.el.train);
    st.el.smoke = h('div', { class: 'smoke-layer' });
    stage.appendChild(st.el.smoke);
    buildTrain();

    // المقدمة السريعة
    var foreTop = g.yTrack + 16 * g.u;
    var foreH = Math.max(40, H - g.zoneH + 10 - foreTop);
    layer(stage, 'fore', foreTop, foreH, 1.5, tileW, 'l-fore');
    stage.appendChild(h('div', { class: 'ground-front', style: { top: foreTop + foreH - 2 + 'px' } }));

    // الغروب (يظهر في الختام)
    st.el.dusk = h('div', { class: 'dusk' });
    stage.appendChild(st.el.dusk);

    buildOverlay();
    // أعمدة الحلقات الموجودة (عند تغيّر الحجم)
    st.rings.forEach(buildRingDom);
    applyHint();
    renderCard(st.round, true);
    if (st.armed) showHand(true);
    render();
  }

  function buildTrain() {
    var g = st.G, train = st.el.train;
    var loco = h('div', { class: 'car loco', style: { left: g.trainLeft + 'px', top: g.yTrack - g.locoH + 'px', width: g.locoW + 'px', height: g.locoH + 'px' }, html: art.loco() });
    train.appendChild(loco);
    st.cars.push({ el: loco, phase: 0 });
    for (var i = 0; i < ROUND_STOPS; i++) {
      var x = g.trainLeft + g.locoW + g.gap + i * (g.wagW + g.gap);
      var w = h('div', {
        class: 'car wagon', 'data-i': i,
        style: { left: x + 'px', top: g.yTrack - g.wagH * (108 / 110) + 'px', width: g.wagW + 'px', height: g.wagH + 'px' }, html: art.wagon(st.wagonBase + i)
      });
      var win = h('div', {
        class: 'win',
        style: { left: (14 / 90) * g.wagW + 'px', top: (34 / 110) * g.wagH + 'px', width: (62 / 90) * g.wagW + 'px', height: (46 / 110) * g.wagH + 'px' }
      });
      w.appendChild(win);
      train.appendChild(w);
      if (st.seated[i]) seatAnimal(i, st.seated[i], true);
      st.cars.push({ el: w, win: win, phase: (i + 1) * 0.7 });
    }
    // العجلات: نحتفظ بنصف القطر كي نحسب الدوران من المسافة
    var radii = [10, 10, 13];
    train.querySelectorAll('.loco .wheel').forEach(function (el, k) { st.wheels.push({ el: el, r: radii[k] * g.cs }); });
    train.querySelectorAll('.wagon .wheel').forEach(function (el) { st.wheels.push({ el: el, r: 9 * g.cs }); });
  }

  function seatAnimal(i, name, silent) {
    var g = st.G, car = st.cars[i + 1];
    var win = car ? car.win : st.el.train.querySelectorAll('.wagon .win')[i];
    if (!win) return;
    win.innerHTML = '';
    var size = 54 * g.cs;
    var a = h('div', { class: 'seat', style: { width: size + 'px', height: size + 'px' }, html: art.animal(name) });
    win.appendChild(a);
    if (!silent) UI.anim(a, [{ transform: 'rotate(0)' }, { transform: 'rotate(-9deg)' }, { transform: 'rotate(9deg)' }, { transform: 'rotate(0)' }], { dur: 700, fill: 'none', deco: true });
  }

  function buildOverlay() {
    var g = st.G, stage = st.ctx.stage, us = g.us;
    var ov = h('div', { class: 'overlay' });
    stage.appendChild(ov);
    st.el.overlay = ov;

    // ناظر المحطة ومعه البطاقة (على جهة البداية من الزر)
    st.el.card = h('div', { class: 'card' });
    var owl = h('div', { class: 'owl', style: { width: 84 * us + 'px', height: 92 * us + 'px' }, html: art.owl() });
    var dock = h('div', { class: 'dock', style: { width: 112 * us + 'px', height: 100 * us + 'px' } }, owl, st.el.card);
    ov.appendChild(dock);
    st.el.dock = dock; st.el.owl = owl;

    // زر «قف»: يعمل عند اللمس مباشرة
    var btn = h('button', { class: 'stop-btn', type: 'button', 'aria-label': B.S.buttons.stop, style: { width: g.D + 'px', height: g.D + 'px', fontSize: g.D * 0.4 + 'px' } },
      h('span', { class: 'stop-word', text: B.S.buttons.stop }));
    UI.bindPress(btn, onTap, { down: true });
    ov.appendChild(btn);
    st.el.btn = btn;
  }

  /* ══════════ الأعمدة ══════════ */
  function newRing(round, delay) {
    var poles = round.ring.map(function (s, i) {
      return { sym: s, valid: isValid(round, s), q: -1.5 - i - delay, consumed: false, inside: false, el: null };
    });
    return { round: round, poles: poles, wrap: true };
  }

  function buildRingDom(ring) {
    var g = st.G;
    ring.poles.forEach(function (p) {
      var el = h('div', { class: 'pole', style: { width: g.pw + 'px', top: g.boardTop - 4 * (g.pw / 100) + 'px' } },
        h('div', { class: 'halo' }),
        h('div', { class: 'pole-art', html: art.pole(p.sym) })
      );
      st.el.poles.appendChild(el);
      p.el = el;
      p.inside = Math.abs(p.q - g.markQ) <= 0.5;
    });
  }

  function removeRing(ring) {
    ring.poles.forEach(function (p) { if (p.el) p.el.remove(); });
    st.rings = st.rings.filter(function (r) { return r !== ring; });
    if (st.active === ring) st.active = null;
  }

  function applyHint() {
    if (!st.active) return;
    st.active.poles.forEach(function (p) {
      if (p.el) p.el.classList.toggle('blink', st.hint && p.valid);
    });
  }
  function setHint(on) { st.hint = on; applyHint(); }

  /* ══════════ البطاقة والناظر ══════════ */
  function renderCard(round, show) {
    var c = st.el.card;
    c.innerHTML = '';
    c.classList.toggle('two', !!round && round.targets.length === 2);
    c.classList.toggle('inverted', !!round && round.inverted);
    c.style.opacity = round && show ? '1' : '0';
    if (!round) return;
    round.targets.forEach(function (t) {
      c.appendChild(h('span', { class: 'card-sym', html: round.inverted ? art.symbolNot(t) : art.symbol(t) }));
    });
  }

  /* تمهيد: تظهر البطاقة كبيرة في وسط الشاشة ثم تنزل إلى مكانها */
  async function cardIntro(tok) {
    var ctx = st.ctx, g = st.G, c = st.el.card;
    if (st.cardShown) {
      await ctx.anim(c, [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(.2)', opacity: 0 }], { dur: 220, fill: 'both' });
      if (tok !== st.token) return;
    }
    renderCard(st.round, false);
    if (B.audio) B.audio.play('card');
    var sr = ctx.stage.getBoundingClientRect(), cr = c.getBoundingClientRect();
    var cx = cr.left + cr.width / 2 - sr.left, cy = cr.top + cr.height / 2 - sr.top;
    var bigW = Math.min(g.W * 0.5, 230 * g.us) * (st.round.targets.length === 2 ? 0.9 : 1);
    var k = bigW / cr.width;
    var dx = g.W / 2 - cx, dy = Math.min(g.H * 0.36, g.boardTop - bigW * 0.4) - cy;
    var big = 'translate(' + dx + 'px,' + dy + 'px) scale(' + k + ')';
    st.el.card.classList.add('flying');
    await ctx.anim(c, [{ transform: 'translate(0,0) scale(.2)', opacity: 0 }, { transform: big, opacity: 1 }], { dur: 650, easing: UI.SPRING });
    if (tok !== st.token) return;
    await ctx.anim(c, [
      { transform: big }, { transform: big.replace('scale(' + k + ')', 'scale(' + k * 1.07 + ')'), offset: 0.25 },
      { transform: big }, { transform: big.replace('scale(' + k + ')', 'scale(' + k * 1.07 + ')'), offset: 0.75 }, { transform: big }
    ], { dur: 1000, easing: 'ease-in-out', fill: 'both' });
    if (tok !== st.token) return;
    await ctx.sleep(300);
    if (tok !== st.token) return;
    await ctx.anim(c, [{ transform: big, opacity: 1 }, { transform: 'translate(0,0) scale(1)', opacity: 1 }], { dur: 650, fill: 'both' });
    if (tok !== st.token) return;
    st.el.card.classList.remove('flying');
    c.getAnimations().forEach(function (a) { a.cancel(); });
    c.style.opacity = '1';
    st.cardShown = true;
  }

  /* ══════════ السرعة ══════════ */
  function setSpeed(to, dur) {
    st.vFrom = st.v; st.vTo = to; st.vT = 0; st.vDur = Math.max(0.05, dur);
  }

  /* ══════════ الحلقة الرئيسية ══════════ */
  function frame(now) {
    if (!st || !st.alive) return;
    var dt = Math.min(0.05, (now - st.last) / 1000) * UI.ts;
    st.last = now;
    step(dt);
    st.raf = requestAnimationFrame(frame);
  }

  function step(dt) {
    var g = st.G;
    st.t += dt;
    if (st.vT < st.vDur) {
      st.vT = Math.min(st.vDur, st.vT + dt);
      var p = st.vT / st.vDur;
      st.v = st.vFrom + (st.vTo - st.vFrom) * (0.5 - 0.5 * Math.cos(Math.PI * p));
    }
    var dq = st.v * dt;
    st.pos += dq;

    // تحريك الحلقات
    st.rings.slice().forEach(function (ring) {
      ring.poles.forEach(function (p) {
        p.q += dq;
        if (ring.wrap && p.q > ring.round.K - 1.5) { p.q -= ring.round.K; p.inside = false; }
      });
      if (!ring.wrap && ring.poles.every(function (p) { return p.q * g.S > g.W + g.S; })) removeRing(ring);
    });

    if (st.active && st.phase === 'play') watchPlatform();

    // تشو تشو خفيف يتناسب إيقاعه مع السرعة
    if (st.v > 0.12 && UI.ts === 1) {
      st.chugT = (st.chugT || 0) + dt;
      if (st.chugT > 0.5 / (st.v / SPEED)) { st.chugT = 0; if (B.audio) B.audio.play('chug', Math.min(1, st.v / SPEED)); }
    }
    // دخان المدخنة
    if (st.v > 0.12) {
      st.smokeT += dt;
      if (st.smokeT > 0.9) { st.smokeT = 0; puff(false); }
    }
    render();
  }

  /* مراقبة منطقة المحطة: مرور الهدف بلا نقر، والتوقف التلقائي */
  function watchPlatform() {
    var g = st.G, ring = st.active;
    if (!ring) return;
    ring.poles.forEach(function (p) {
      var inside = Math.abs(p.q - g.markQ) <= 0.5;
      if (inside && !p.inside) p.inside = true;
      else if (!inside && p.inside && p.q > g.markQ) {
        p.inside = false;
        var wasConsumed = p.consumed;
        p.consumed = false;
        if (p.valid && !wasConsumed) onMiss();
      }
    });
    if (st.armed && st.phase === 'play' && st.v >= SPEED * 0.95) {
      var brakeDist = st.v * BRAKE / 2;
      for (var i = 0; i < ring.poles.length; i++) {
        var q = ring.poles[i], d = g.markQ - q.q;
        if (q.valid && !q.consumed && d <= brakeDist && d >= -0.3) { doStop(q, true); break; }
      }
    }
  }

  function onMiss() {
    if (st.round.inverted) { st.idle++; }
    else { st.missed++; st.fails++; st.errors++; }
    updateHelp();
  }

  /* سلّم المساعدة الصامتة */
  function updateHelp() {
    var inv = st.round.inverted;
    var hintNow = st.demo || (inv ? st.idle >= 2 : (st.missed >= 1 || st.wrong >= 2));
    var armNow = st.demo || (inv ? st.idle >= 4 : st.fails >= 3);
    if (hintNow && !st.hint) setHint(true);
    if (armNow && !st.armed) { st.armed = true; showHand(false); }
  }

  /* ══════════ النقر على «قف» ══════════ */
  function onTap() {
    if (!st || st.phase !== 'play' || st.demo) return;
    if (st.v < SPEED * 0.25) return; // يتوقف أو ينطلق ببطء: نتجاهل
    var g = st.G, best = null, bd = 9;
    st.active.poles.forEach(function (p) {
      var d = Math.abs(p.q - g.markQ);
      if (d < bd) { bd = d; best = p; }
    });
    if (best && bd <= 0.55 && best.valid && !best.consumed) doStop(best, false);
    else wrongTap(bd <= 0.55 ? best : null);
  }

  function pressVisual() {
    var b = st.el.btn;
    b.classList.add('pressed');
    if (B.audio) B.audio.play('tap');
    setTimeout(function () { if (b) b.classList.remove('pressed'); }, 280 / UI.ts);
  }

  async function wrongTap(p) {
    var tok = ++st.token, ctx = st.ctx;
    st.phase = 'question';
    st.wrong++; st.fails++; st.errors++;
    setSpeed(0, QBRAKE);
    if (B.audio) B.audio.play('hmm');
    var bub = null;
    if (p && p.el) {
      bub = h('div', { class: 'q-bubble', style: { width: st.G.bw * 0.62 + 'px', left: '50%', marginLeft: -st.G.bw * 0.31 + 'px', top: -st.G.bw * 0.78 + 'px' }, html: art.bubbleQ() });
      p.el.appendChild(bub);
      UI.anim(bub, [{ transform: 'scale(.2)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { dur: 380, easing: UI.SPRING });
    }
    await ctx.sleep(QBRAKE * 1000 + 900);
    if (tok !== st.token) return;
    if (bub) UI.anim(bub, [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.6)' }], { dur: 300 }).then(function () { bub.remove(); });
    setSpeed(SPEED, 1.0);
    st.phase = 'play';
    updateHelp();
  }

  /* ══════════ التوقف وصعود الراكب ══════════ */
  function pickAnimal() {
    var names = art.ANIMAL_NAMES, n;
    do { n = pick(names); } while (n === st.lastAnimal);
    st.lastAnimal = n;
    return n;
  }

  function doStop(p, auto) {
    p.consumed = true;
    st.phase = 'boarding';
    setHint(false);
    if (st.armed) hideHand();
    st.armed = false;
    setSpeed(0, BRAKE);
    if (auto) pressVisual();
    if (B.audio) B.audio.play('brake');
    board(p);
  }

  async function board(p) {
    var tok = ++st.token, ctx = st.ctx, g = st.G;
    await ctx.sleep(BRAKE * 1000 - 100);
    if (tok !== st.token) return;

    var idx = st.stops, name = pickAnimal();
    if (idx === 0) st.firstAnimals.push(name);

    // الراكب يظهر من لوحة العمود
    var fw = g.bw * 0.8;
    var px = p.q * g.S, py = g.boardTop + g.bw / 2;
    var fly = h('div', { class: 'flyer', style: { left: px - fw / 2 + 'px', top: py - fw / 2 + 'px', width: fw + 'px', height: fw + 'px' } });
    var inner = h('div', { class: 'flyer-in', html: art.animal(name) });
    fly.appendChild(inner);
    st.el.overlay.appendChild(fly);
    if (B.audio) B.audio.play('pop');
    await ctx.anim(inner, [{ transform: 'scale(.2)', opacity: 0 }, { transform: 'scale(1.12)', opacity: 1, offset: 0.7 }, { transform: 'scale(1)', opacity: 1 }], { dur: 420, easing: UI.SPRING });
    if (tok !== st.token) { fly.remove(); return; }
    await ctx.sleep(200);
    if (tok !== st.token) { fly.remove(); return; }

    // قفزة بشكل قوس إلى نافذة العربة
    var car = st.cars[idx + 1];
    var wl = parseFloat(car.el.style.left), wt = parseFloat(car.el.style.top);
    var wx = wl + parseFloat(car.win.style.left) + parseFloat(car.win.style.width) / 2;
    var wy = wt + parseFloat(car.win.style.top) + parseFloat(car.win.style.height) / 2;
    var dx = wx - (px), dy = wy - py;
    var sc = (54 * g.cs) / fw;
    var arc = Math.max(60, g.bw * 0.7);
    var a1 = ctx.anim(fly, [{ transform: 'translateX(0)' }, { transform: 'translateX(' + dx + 'px)' }], { dur: 700, easing: 'cubic-bezier(.45,.05,.55,.95)' });
    var a2 = ctx.anim(inner, [
      { transform: 'translateY(0) scale(1)', easing: 'cubic-bezier(.2,.7,.4,1)' },
      { transform: 'translateY(' + (-arc) + 'px) scale(1.05)', offset: 0.45, easing: 'cubic-bezier(.6,0,.9,.5)' },
      { transform: 'translateY(' + dy + 'px) scale(' + sc + ')' }
    ], { dur: 700 });
    await Promise.all([a1, a2]);
    if (tok !== st.token) { fly.remove(); return; }

    st.seated[idx] = name;
    seatAnimal(idx, name, false);
    fly.remove();
    sparkles(wx, wy, 5);
    if (B.audio) B.audio.play('sparkle');
    // العربة ترتجّ بلطف عند الاستقبال
    UI.anim(car.el, [{ transform: 'translateY(0) scale(1,1)' }, { transform: 'translateY(4px) scale(1.04,.94)' }, { transform: 'translateY(0) scale(1,1)' }], { dur: 420, easing: UI.SPRING, fill: 'none' });
    var r = car.el.getBoundingClientRect(), sr = ctx.stage.getBoundingClientRect();
    UI.burst(st.el.overlay, r.left + r.width / 2 - sr.left, r.top - sr.top + 10, { n: 8, spread: 60, dur: 900 });
    await ctx.sleep(650);
    if (tok !== st.token) return;

    st.stops++;
    st.fails = st.missed = st.wrong = st.idle = 0;
    if (st.stops >= st.need) finishRound(tok);
    else { st.phase = 'play'; setSpeed(SPEED, LAUNCH); if (B.audio) B.audio.play('toot'); }
  }

  async function finishRound(tok) {
    var ctx = st.ctx, g = st.G;
    st.phase = 'cheer';
    // احتفال: العربات تقفز بالتتابع، وفرقعة جسيمات، ونفخة دخان كبيرة
    st.cars.forEach(function (c, i) {
      UI.anim(c.el, [{ transform: 'translateY(0)' }, { transform: 'translateY(-14px)' }, { transform: 'translateY(0)' }], { dur: 560, delay: i * 110, easing: UI.SPRING, fill: 'none', deco: true });
    });
    UI.burst(st.el.overlay, g.W / 2, g.trainTop, { n: 26, spread: 170, dur: 1500 });
    for (var k = 0; k < 5; k++) setTimeout(puff.bind(null, true), (k * 140) / UI.ts);
    sparkles(g.W / 2, g.trainTop + 10, 8);
    if (B.audio) { B.audio.play('cheer'); B.audio.play('toot'); }
    await ctx.sleep(1500);
    if (tok !== st.token) return;
    // الركاب يودّعون: ينكمشون بلطف ثم تفرغ العربات
    var seats = st.el.train.querySelectorAll('.seat');
    var ps = [];
    seats.forEach(function (s, i) { ps.push(ctx.anim(s, [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(1.12)', opacity: 1, offset: 0.3 }, { transform: 'scale(.1)', opacity: 0 }], { dur: 520, delay: i * 120 })); });
    await Promise.all(ps);
    if (tok !== st.token) return;
    st.seated = [null, null, null];
    st.cars.forEach(function (c) { if (c.win) c.win.innerHTML = ''; });
    st.wagonBase = (st.wagonBase + 1) % 5;
    st.el.train.querySelectorAll('.wagon').forEach(function (w, i) {
      var old = w.querySelector('svg');
      var fresh = art.wagon(st.wagonBase + i);
      old.outerHTML = fresh;
    });
    setSpeed(SPEED, LAUNCH);
    st.phase = 'idle';
    var res = st.resolve; st.resolve = null;
    if (res) res({ errors: st.demo ? 0 : st.errors });
  }

  /* شرارات صغيرة لامعة حول نقطة */
  function sparkles(x, y, n) {
    if (UI.reduced()) return;
    var cols = ['#FFF7C2', '#FFD34E', '#fff', '#B79BFF'];
    for (var i = 0; i < n; i++) {
      var sz = 14 + Math.random() * 14;
      var el = h('span', { class: 'spark', style: { left: x - sz / 2 + 'px', top: y - sz / 2 + 'px', width: sz + 'px', height: sz + 'px' }, html: art.sparkle(cols[i % 4]) });
      st.el.overlay.appendChild(el);
      var a = Math.random() * Math.PI * 2, d = 30 + Math.random() * 50;
      UI.anim(el, [
        { transform: 'translate(0,0) scale(0) rotate(0)', opacity: 1 },
        { transform: 'translate(' + Math.cos(a) * d + 'px,' + Math.sin(a) * d + 'px) scale(1.2) rotate(90deg)', opacity: 1, offset: 0.5 },
        { transform: 'translate(' + Math.cos(a) * d * 1.3 + 'px,' + Math.sin(a) * d * 1.3 + 'px) scale(0) rotate(180deg)', opacity: 0 }
      ], { dur: 800 + Math.random() * 400, delay: i * 60 }).then((function (e) { return function () { e.remove(); }; })(el));
    }
  }

  /* دخان: نفخة صغيرة أو كبيرة من المدخنة (ملوّنة في الاحتفال) */
  function puff(big) {
    if (UI.reduced()) return;
    var g = st.G, loco = st.cars[0];
    var s = (big ? 26 : 15) * g.cs;
    var x = g.trainLeft + 24 * g.cs, y = g.yTrack - g.locoH + 6 * g.cs;
    var cols = ['#FFD34E', '#F2658E', '#8E5CF0', '#5CC8FF', '#7AE582'];
    var el = h('span', { class: 'puff', style: { left: x - s / 2 + 'px', top: y - s / 2 + 'px', width: s + 'px', height: s + 'px', background: big ? cols[Math.floor(Math.random() * cols.length)] : '' } });
    st.el.smoke.appendChild(el);
    UI.anim(el, [
      { transform: 'translate(0,0) scale(.5)', opacity: 0.9 },
      { transform: 'translate(' + (big ? 50 : 34) * g.cs + 'px,' + (big ? -70 : -48) * g.cs + 'px) scale(' + (big ? 2.6 : 2) + ')', opacity: 0 }
    ], { dur: big ? 1800 : 1500, easing: 'ease-out', deco: true }).then(function () { el.remove(); });
  }

  /* اليد الكرتونية: تظهر حين يلزم أن تُظهَر طريقة الضغط */
  function showHand(instant) {
    if (st.el.hand) return;
    var g = st.G, btn = st.el.btn;
    var hs = g.D * 1.0 / 96;
    // اليد مقلوبة: طرف الإصبع في الأسفل (٤٩،٩٢ من صندوقها) ويلمس أعلى الزر
    var bx = g.W / 2, tipY = btn.offsetTop + g.D * 0.3;
    var hand = h('div', {
      class: 'hand',
      style: { width: 88 * hs + 'px', height: 96 * hs + 'px', left: bx - 49 * hs + 'px', top: tipY - 92 * hs + 'px' }
    }, h('div', { class: 'hand-in', html: art.hand() }));
    st.el.overlay.appendChild(hand);
    st.el.hand = hand;
    if (!instant) UI.anim(hand, [{ opacity: 0, transform: 'translateY(-50px)' }, { opacity: 1, transform: 'translateY(0)' }], { dur: 500, easing: UI.SPRING, fill: 'backwards' });
    // نقرة متكررة هادئة على الزر
    hand.classList.add('tapping');
  }
  function hideHand() {
    var hd = st.el.hand;
    if (!hd) return;
    st.el.hand = null;
    UI.anim(hd, [{ opacity: 1 }, { opacity: 0, transform: 'translateY(-40px)' }], { dur: 450 }).then(function () { hd.remove(); });
  }

  /* ══════════ الرسم لكل إطار ══════════ */
  function render() {
    var g = st.G;
    if (!g) return;
    var wpx = st.pos * g.S;
    // الأعمدة
    st.rings.forEach(function (ring) {
      ring.poles.forEach(function (p) {
        if (!p.el) return;
        var x = p.q * g.S;
        if (x < -g.pw || x > g.W + g.pw) { p.el.style.visibility = 'hidden'; return; }
        p.el.style.visibility = 'visible';
        p.el.style.transform = 'translate3d(' + (x - g.pw / 2).toFixed(1) + 'px,0,0)';
      });
    });
    // المناظر
    st.layers.forEach(function (l) {
      var off = (wpx * l.factor) % l.tileW;
      l.el.style.transform = 'translate3d(' + (off - l.tileW).toFixed(1) + 'px,0,0)';
    });
    // العجلات: الدوران من المسافة المقطوعة، عكس عقارب الساعة لأن القطار يسير يساراً
    st.wheels.forEach(function (w) {
      w.el.style.transform = 'rotate(' + (-(wpx / w.r) * 57.2958).toFixed(1) + 'deg)';
    });
    // اهتزاز القطار الخفيف يتناسب مع السرعة
    var amp = 1.3 * (st.v / SPEED);
    st.cars.forEach(function (c) {
      c.el.style.transform = 'translateY(' + (Math.sin(st.t * 9 + c.phase) * amp).toFixed(2) + 'px)';
    });
  }

  /* ══════════ الجولة ══════════ */
  function startRound(level, index, demo) {
    var g = st.G;
    st.token++;
    var tok = st.token;
    var round = makeRound(level, g.K, st.lastTarget);
    st.lastTarget = round.targets[0];
    st.round = round;
    st.demo = !!demo;
    st.stops = 0; st.need = demo ? 1 : ROUND_STOPS;
    st.errors = 0; st.fails = st.missed = st.wrong = st.idle = 0;
    st.hint = false; st.armed = false;
    if (st.el.hand) { st.el.hand.remove(); st.el.hand = null; }
    st.phase = 'intro';
    st.rings.forEach(function (r) { r.wrap = false; });
    var ring = newRing(round, 0.4);
    st.rings.push(ring);
    st.active = ring;
    buildRingDom(ring);
    // لا يبدأ اللعب قبل أن تُعرض البطاقة وتنزل إلى مكانها (تنبؤ قبل الفعل)
    cardIntro(tok).then(function () {
      if (tok !== st.token) return;
      st.phase = 'play';
      if (st.demo) updateHelp();
    });
  }

  function runRound(level, index, demo) {
    return new Promise(function (resolve) {
      st.resolve = resolve;
      startRound(level, index, demo);
    });
  }

  /* ══════════ عقد اللعبة ══════════ */
  var game = {
    id: 'train',

    mount: function (ctx) {
      create(ctx);
      build();
      st.last = performance.now();
      st.raf = requestAnimationFrame(frame);
      st.onResize = function () {
        clearTimeout(st.resizeT);
        st.resizeT = setTimeout(function () { if (st && st.alive) build(); }, 160);
      };
      window.addEventListener('resize', st.onResize);
    },

    demo: function (ctx) {
      return runRound(1, -1, true).then(function () { st.demo = false; });
    },

    playRound: function (ctx, level, index) {
      return runRound(level, index, false);
    },

    cancelRound: function () {
      if (!st || !st.resolve) return;
      st.token++; // يُبطل كل المتتاليات غير المتزامنة الجارية
      var res = st.resolve; st.resolve = null;
      st.phase = 'idle';
      st.hint = false; st.armed = false;
      if (st.el.hand) { st.el.hand.remove(); st.el.hand = null; }
      st.el.overlay.querySelectorAll('.flyer').forEach(function (f) { f.remove(); });
      st.el.card.classList.remove('flying');
      st.el.card.getAnimations().forEach(function (a) { a.cancel(); });
      st.seated = [null, null, null];
      st.cars.forEach(function (c) { if (c.win) c.win.innerHTML = ''; });
      st.rings.forEach(function (r) { r.wrap = false; });
      st.active = null;
      setSpeed(SPEED, 1.0);
      res({ cancelled: true });
    },

    outro: async function (ctx) {
      setSpeed(0, 1.8);
      if (B.audio) B.audio.play('brake');
      setTimeout(function () { if (B.audio) B.audio.play('lullaby'); }, 1800 / UI.ts);
      UI.anim(st.el.dusk, [{ opacity: 0 }, { opacity: 1 }], { dur: 2000 });
      await ctx.sleep(2300);
    },

    /* الشاشة الختامية: القطار نائم في المساء وقد امتلأت عرباته، وناظر المحطة نائم */
    endArt: function (ctx) {
      var vp = UI.vp();
      var cs = Math.min(1.1, (vp.W - 24) / (130 + 5 * 93));
      var row = h('div', { class: 'end-train' });
      var loco = h('div', { class: 'car-static', style: { width: 130 * cs + 'px', height: 100 * cs + 'px' }, html: art.loco() });
      row.appendChild(loco);
      var names = st.firstAnimals.slice();
      for (var i = 0; i < 5; i++) {
        var w = h('div', { class: 'car-static', style: { width: 90 * cs + 'px', height: 110 * cs + 'px', marginInlineStart: 3 * cs + 'px' }, html: art.wagon(i) });
        var win = h('div', { class: 'win', style: { left: 14 * cs + 'px', top: 34 * cs + 'px', width: 62 * cs + 'px', height: 46 * cs + 'px' } });
        for (var k = 0; k < 2; k++) {
          var nm = names[i * 2 + k] || art.ANIMAL_NAMES[(i + k) % 6];
          win.appendChild(h('div', { class: 'seat', style: { width: 30 * cs + 'px', height: 30 * cs + 'px' }, html: art.animal(nm, { sleep: true }) }));
        }
        w.appendChild(win);
        row.appendChild(w);
      }
      var sleepy = h('div', { class: 'end-owl', style: { width: 110 * Math.min(1.3, cs * 1.2) + 'px' } },
        h('div', { html: art.owl({ sleep: true }) }),
        h('span', { class: 'end-z', html: art.zzz() }));
      var stars = h('div', { class: 'end-stars' });
      for (var si = 0; si < 26; si++) {
        stars.appendChild(h('span', { class: 'end-star', style: { left: Math.random() * 100 + '%', top: Math.random() * 55 + '%', width: 6 + Math.random() * 10 + 'px', animationDelay: (Math.random() * 3) + 's' }, html: art.sparkle('#FFF7C2') }));
      }
      var fire = h('div', { class: 'end-fire' });
      for (var fi = 0; fi < 10; fi++) {
        fire.appendChild(h('span', { class: 'firefly', style: { left: Math.random() * 100 + '%', top: 60 + Math.random() * 35 + '%', animationDelay: (Math.random() * 4) + 's', animationDuration: 4 + Math.random() * 3 + 's' } }));
      }
      return h('div', { class: 'end-train-wrap' },
        stars, fire,
        h('div', { class: 'end-hills', html: art.sceneTile('far', vp.W, Math.round(vp.H * 0.3)) }),
        h('div', { class: 'end-moon', html: art.moon() }),
        sleepy, row);
    },

    destroy: function () {
      if (!st) return;
      st.alive = false;
      cancelAnimationFrame(st.raf);
      window.removeEventListener('resize', st.onResize);
      clearTimeout(st.resizeT);
      st = null;
    },

    // للاختبارات الآلية فقط
    _makeRound: makeRound,
    _isValid: isValid,
    _probe: function () {
      if (!st || !st.active || !st.G) return { ready: false };
      var g = st.G, best = null, bd = 9;
      st.active.poles.forEach(function (p) {
        var d = Math.abs(p.q - g.markQ);
        if (d < bd) { bd = d; best = p; }
      });
      return {
        ready: true, phase: st.phase, v: st.v, demo: st.demo, level: st.round.level, inverted: st.round.inverted,
        stops: st.stops, errors: st.errors, hint: st.hint, armed: st.armed,
        nearValid: !!(best && best.valid && !best.consumed && bd < 0.3),
        nearAny: !!best && bd < 0.3,
        nearBlankOrBad: !!(best && !best.valid && bd < 0.3)
      };
    }
  };

  B.games.train = game;
})();
