/* لعبة «صانعة الأنماط» — عالم حفلة وفوانيس.
   سلسلة عناصر متكررة فيها خانة أو خانتان ناقصتان، والاختيار من ٣ في الأسفل.
   المستويات: ١) تناوب عنصرين  ٢) اثنان وواحد  ٣) ثلاثة عناصر  ٤) مركّب (شكل ولون)  ٥) متنامٍ وخانتان. */
(function () {
  'use strict';
  var B = (window.Bustan = window.Bustan || {});
  var UI = B.UI, h = UI.h, art = B.art, kit = B.kit;
  var SHAPES = art.SHAPES, COLORS = art.COLOR_KEYS;

  function same(a, b) { return a.shape === b.shape && a.color === b.color; }
  function distinct(n) { // n رموز مختلفة شكلاً ولوناً
    var sh = kit.shuffle(SHAPES), co = kit.shuffle(COLORS), out = [];
    for (var i = 0; i < n; i++) out.push({ shape: sh[i], color: co[i] });
    return out;
  }

  /* يبني نمطاً: seq العناصر، gaps مواضع الخانات الناقصة، pool عناصر الاختيار */
  /* سهّلناها لابن الرابعة: تناوب بسيط، والخانة الناقصة هي الأخيرة دائماً (ما التالي؟).
     ١) أ ب أ ب أ ؟ بخيارين  ٢) نفسه بثلاثة خيارات  ٣) سلسلة أطول والخانة قبل الأخيرة
     ٤) أ أ ب أ أ ؟ / أ ب ب أ ب ؟  ٥) ثلاثة عناصر أ ب ج أ ب ؟ */
  function makePattern(level) {
    var u = distinct(4), seq = [], i, n, unit, gaps, choices = 3;
    if (level <= 2) { unit = [0, 1]; n = 6; gaps = [5]; choices = level === 1 ? 2 : 3; }
    else if (level === 3) { unit = [0, 1]; n = 8; gaps = [6 + kit.rand(2)]; }
    else if (level === 4) { unit = Math.random() < 0.5 ? [0, 0, 1] : [0, 1, 1]; n = 6; gaps = [5]; }
    else { unit = [0, 1, 2]; n = 6; gaps = [5]; }
    for (i = 0; i < n; i++) seq.push(u[unit[i % unit.length]]);
    var used = unit.filter(function (x, k, a) { return a.indexOf(x) === k; }).map(function (x) { return u[x]; });
    var pool = used.concat(u.filter(function (x) { return used.indexOf(x) < 0; }));
    return { seq: seq, gaps: gaps, pool: pool, choices: choices };
  }
  function optionsFor(pat, gapIdx) {
    var ok = pat.seq[gapIdx], opts = [ok];
    pat.pool.forEach(function (s) { if (opts.length < (pat.choices || 3) && !opts.some(function (o) { return same(o, s); })) opts.push(s); });
    while (opts.length < (pat.choices || 3)) { var s = { shape: kit.pick(SHAPES), color: kit.pick(COLORS) }; if (!opts.some(function (o) { return same(o, s); })) opts.push(s); }
    opts = kit.shuffle(opts);
    return { opts: opts, correct: opts.findIndex(function (o) { return same(o, ok); }) };
  }

  var st = null, runner = kit.roundRunner();

  function build(ctx) {
    var stage = ctx.stage;
    stage.classList.add('g-stage', 'pattern-stage');
    var lights = h('div', { class: 'pt-lights' });
    for (var i = 0; i < 9; i++) lights.appendChild(h('span', { class: 'pt-light', style: { animationDelay: i * 0.3 + 's', background: ['#FFD34E', '#F2658E', '#5CC8FF', '#7AE582', '#B79BFF'][i % 5] } }));
    st.row = h('div', { class: 'pt-row' });
    st.tray = h('div', { class: 'g-tray' });
    st.crowd = h('div', { class: 'pt-crowd' }, ['cat', 'rabbit', 'duck'].map(function (n) { return h('span', { class: 'pt-dancer', html: art.animal(n) }); }));
    stage.appendChild(lights);
    stage.appendChild(h('div', { class: 'g-main' }, st.row));
    stage.appendChild(st.crowd);
    stage.appendChild(st.tray);
  }

  function item(s) { return h('div', { class: 'pt-item' }, h('span', { class: 'pt-cap' }), h('span', { class: 'pt-body', html: s ? art.symbol(s) : '' }), h('span', { class: 'pt-glow' })); }

  async function round(ctx, level, demo, alive, setCur) {
    var pat = makePattern(level), errors = 0;
    st.pat = pat;
    st.row.innerHTML = ''; st.tray.innerHTML = '';
    st.row.classList.toggle('long', pat.seq.length > 6);
    var els = pat.seq.map(function (s, i) {
      var gap = pat.gaps.indexOf(i) >= 0;
      var el = item(gap ? null : s);
      if (gap) el.classList.add('gap');
      st.row.appendChild(el);
      UI.anim(el, [{ opacity: 0, transform: 'translateY(-30px) scale(.7)' }, { opacity: 1, transform: 'none' }], { dur: 450, delay: i * 70, easing: UI.SPRING, fill: 'backwards' });
      return el;
    });
    await ctx.sleep(500 + pat.seq.length * 70);
    if (!alive()) return;
    // «قراءة» النمط: كل عنصر ينبض بدوره من اليمين إلى اليسار، ثم تنبض الخانة الناقصة
    for (var q = 0; q < els.length; q++) {
      UI.anim(els[q], [{ transform: 'scale(1)' }, { transform: 'scale(1.22)' }, { transform: 'scale(1)' }], { dur: 300, fill: 'none' });
      if (B.audio && pat.gaps.indexOf(q) < 0) B.audio.play('pick');
      await ctx.sleep(260);
      if (!alive()) return;
    }

    for (var g = 0; g < pat.gaps.length; g++) {
      var gi = pat.gaps[g], o = optionsFor(pat, gi);
      els[gi].classList.add('current');
      st.tray.innerHTML = '';
      var btns = o.opts.map(function (s, i) {
        var b = h('button', { class: 'g-choice', type: 'button', html: art.symbol(s) });
        st.tray.appendChild(b);
        UI.anim(b, [{ opacity: 0, transform: 'translateY(30px)' }, { opacity: 1, transform: 'none' }], { dur: 380, delay: i * 80, easing: UI.SPRING, fill: 'backwards' });
        return b;
      });
      st.answer = btns[o.correct];
      var ch = kit.choice(ctx, ctx.stage, btns, o.correct, { demo: demo });
      setCur(ch);
      var res = await ch.promise;
      if (!alive() || res.cancelled) return;
      errors += res.errors;
      st.answer = null;
      // العنصر الصحيح يستقر في خانته
      els[gi].classList.remove('gap', 'current');
      els[gi].querySelector('.pt-body').innerHTML = art.symbol(pat.seq[gi]);
      if (B.audio) B.audio.play('place');
      UI.anim(els[gi], [{ transform: 'scale(.4)' }, { transform: 'scale(1.15)' }, { transform: 'scale(1)' }], { dur: 450, easing: UI.SPRING, fill: 'none' });
      await ctx.sleep(450);
      if (!alive()) return;
    }

    // الاحتفال: الفوانيس تُضاء بالتتابع والشخصيات تتمايل
    st.tray.innerHTML = '';
    els.forEach(function (el, i) {
      setTimeout(function () { el.classList.add('lit'); if (B.audio) B.audio.play('lantern', i); }, (i * 130) / UI.ts);
    });
    st.crowd.classList.add('dance');
    var r = st.row.getBoundingClientRect(), sr = ctx.stage.getBoundingClientRect();
    UI.burst(ctx.stage, r.left + r.width / 2 - sr.left, r.top - sr.top, { n: 20, spread: 140, dur: 1400 });
    await ctx.sleep(els.length * 130 + 500);
    if (!alive()) return;
    if (B.audio) B.audio.play('cheer');
    await ctx.sleep(1100);
    if (!alive()) return;
    st.crowd.classList.remove('dance');
    await ctx.anim(st.row, [{ opacity: 1 }, { opacity: 0 }], { dur: 350, fill: 'none' });
    st.row.innerHTML = '';
    return { errors: demo ? 0 : errors };
  }

  B.games.pattern = {
    id: 'pattern',
    mount: function (ctx) { st = { ctx: ctx }; build(ctx); },
    demo: function (ctx) { return runner.run(function (alive, setCur) { return round(ctx, 1, true, alive, setCur); }); },
    playRound: function (ctx, level) { return runner.run(function (alive, setCur) { return round(ctx, level, false, alive, setCur); }); },
    cancelRound: function () { runner.cancel(); if (st) { st.row.innerHTML = ''; st.tray.innerHTML = ''; } },
    outro: function (ctx) { return kit.dusk(ctx); },
    endArt: function () { return kit.endScene('cat'); },
    destroy: function () { runner.stop(); st = null; },
    _makePattern: makePattern,
    _solveStep: function () { if (st && st.answer) { st.answer.click(); return true; } return false; }
  };
})();
