/* لعبة «ارسم الطريق» — تتبّع الخطوط بالإصبع (تمهيد للكتابة وتقوية لليد).
   حيوان صغير يقف في بداية طريق منقّط، وعلى الطفل أن يمرّر إصبعه فوق الطريق فيسير الحيوان معه حتى هدفه.
   المستويات: ١) خطوط مستقيمة  ٢) منحنيات وموجة  ٣) زوايا (زجزاج، مثلث، مربع)  ٤) دائرة وحلزون ومنحنى S
              ٥) أشكال بعض الحروف (ا ل ر د ب) — مجرد أشكال بلا نطق.
   لا فشل: الخروج عن الطريق لا يوقف شيئاً، يكفي أن يعود الإصبع قرب آخر نقطة وصل إليها.
   سلّم المساعدة: بعد ٣ خروج أو ٩ ثوانٍ بلا تقدّم ينبض الطريق، ثم يُظهر الكفّ الطريق ويُكمله. */
(function () {
  'use strict';
  var B = (window.Bustan = window.Bustan || {});
  var UI = B.UI, h = UI.h, art = B.art, kit = B.kit;
  var NS = 'http://www.w3.org/2000/svg';

  /* الطرق في لوحة ٣٠٠×٣٠٠. الحرف إن وُجد يظهر في البطاقة. */
  var PATHS = {
    1: [{ d: 'M40 150H260' }, { d: 'M150 40V260' }, { d: 'M50 250L250 50' }, { d: 'M260 150H40' }, { d: 'M50 50L250 250' }],
    2: [{ d: 'M40 220Q150 20 260 220' }, { d: 'M30 150Q75 70 120 150T210 150T290 150' }, { d: 'M40 80Q150 260 260 80' }, { d: 'M50 230C50 100 250 100 250 230' }],
    3: [{ d: 'M40 220L100 80L160 220L220 80L270 220' }, { d: 'M150 50L260 250H40Z' }, { d: 'M60 60H240V240H60Z' }, { d: 'M50 200L120 120L180 200L250 100' }],
    4: [{ d: 'M150 40A110 110 0 1 1 149.9 40' }, { d: 'M60 80C260 20 260 160 150 150C40 140 40 250 240 230' }, { d: 'M150 150C150 110 200 110 200 150C200 210 100 210 100 140C100 70 210 60 230 150' }, { d: 'M70 70C250 70 250 150 150 150C50 150 50 230 230 230' }],
    5: [{ d: 'M150 40V260', letter: 'ا' }, { d: 'M115 40V195Q115 255 180 255Q235 255 248 205', letter: 'ل' }, { d: 'M205 80Q215 190 105 245', letter: 'ر' }, { d: 'M75 100H190Q228 100 222 150Q214 205 148 242', letter: 'د' }, { d: 'M60 120Q60 235 150 235Q240 235 240 120', letter: 'ب' }]
  };
  var PAIRS = [['bee', 'flower'], ['rabbit', 'carrot'], ['bear', 'apple'], ['cat', 'fish'], ['lamb', 'tree'], ['duck', 'whale'], ['frog', 'leaf'], ['bird', 'house']];
  var STEP = 3;      // المسافة بين نقاط العيّنة بوحدات اللوحة

  function makeRound(level, prev) {
    var list = PATHS[level] || PATHS[1], p;
    do { p = kit.pick(list); } while (list.length > 1 && p.d === prev);
    return { d: p.d, letter: p.letter || '', pair: kit.pick(PAIRS), level: level };
  }

  /* عيّنة نقاط على المسار (تحتاج DOM) */
  function sample(d) {
    var path = document.createElementNS(NS, 'path');
    path.setAttribute('d', d);
    var L = path.getTotalLength(), pts = [];
    for (var s = 0; s <= L; s += STEP) { var q = path.getPointAtLength(s); pts.push([q.x, q.y]); }
    var e = path.getPointAtLength(L); pts.push([e.x, e.y]);
    return { pts: pts, len: L };
  }

  var st = null, runner = kit.roundRunner();

  function build(ctx) {
    ctx.stage.classList.add('g-stage', 'tr-stage');
    st.card = h('div', { class: 'tr-card' });
    st.board = h('div', { class: 'tr-board' });
    ctx.stage.appendChild(h('div', { class: 'g-main' }, st.card, st.board));
  }

  function put(el, p) { el.style.left = p[0] / 3 + '%'; el.style.top = p[1] / 3 + '%'; }

  async function round(ctx, level, demo, alive) {
    var R = makeRound(level, st.prev); st.prev = R.d;
    var sm = sample(R.d), pts = sm.pts, N = pts.length;
    var prog = 0, errors = 0, straying = false, down = false, busy = false, finished = false, idle = 0, done;
    var fin = new Promise(function (r) { done = r; });
    st.board.innerHTML = ''; st.card.innerHTML = '';
    // البطاقة: الحرف في المستوى ٥، وإلا الحيوان وهدفه
    if (R.letter) st.card.appendChild(h('span', { class: 'tr-letter', text: R.letter }));
    else st.card.innerHTML = '<span class="tr-pair">' + B.pics.draw(R.pair[0]) + '<i></i>' + B.pics.draw(R.pair[1]) + '</span>';
    UI.anim(st.card, [{ opacity: 0, transform: 'scale(.5)' }, { opacity: 1, transform: 'none' }], { dur: 420, easing: UI.SPRING, fill: 'backwards' });

    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 300 300'); svg.setAttribute('class', 'tr-svg');
    function p(cls, w) { var e = document.createElementNS(NS, 'path'); e.setAttribute('d', R.d); e.setAttribute('class', cls); e.setAttribute('fill', 'none'); e.setAttribute('stroke-width', w); e.setAttribute('stroke-linecap', 'round'); e.setAttribute('stroke-linejoin', 'round'); svg.appendChild(e); return e; }
    p('tr-lane', 40); var guide = p('tr-guide', 8); var fill = p('tr-fill', 22);
    fill.style.strokeDasharray = '0 99999';
    st.board.appendChild(svg);
    var goal = h('div', { class: 'tr-goal', html: B.pics.draw(R.pair[1]) }); put(goal, pts[N - 1]);
    var av = h('div', { class: 'tr-avatar', html: B.pics.draw(R.pair[0]) }); put(av, pts[0]);
    var start = h('div', { class: 'tr-start' }); put(start, pts[0]);
    st.board.appendChild(start); st.board.appendChild(goal); st.board.appendChild(av);
    UI.anim(av, [{ transform: 'translate(-50%,-50%) scale(0)' }, { transform: 'translate(-50%,-50%) scale(1)' }], { dur: 420, easing: UI.SPRING, fill: 'backwards' });
    if (B.audio) B.audio.play('card');

    function setProg(i) {
      prog = Math.max(prog, Math.min(N - 1, i));
      fill.style.strokeDasharray = Math.max(0.01, prog * STEP) + ' 99999';
      put(av, pts[prog]);
      idle = 0;
      if (prog >= N - 4 && !finished) { finished = true; done(true); }
    }
    function toSvg(e) {
      var r = svg.getBoundingClientRect();
      return [(e.clientX - r.left) / r.width * 300, (e.clientY - r.top) / r.height * 300];
    }
    function tol() { var r = svg.getBoundingClientRect(); return Math.max(30, 40 * 300 / r.width); }
    function move(e) {
      if (!down || busy || finished || ctx.paused) return;
      var q = toSvg(e), T = tol(), best = -1, hi = Math.min(N - 1, prog + 70);
      for (var i = prog; i <= hi; i++) {
        var dx = pts[i][0] - q[0], dy = pts[i][1] - q[1];
        if (dx * dx + dy * dy <= T * T) best = i;
      }
      if (best >= 0) {
        if (straying) straying = false;
        if (best > prog) { setProg(best); if (B.audio && best % 20 === 0) B.audio.play('soft'); }
      } else if (!straying) { straying = true; errors++; if (errors === 2) guide.classList.add('pulse'); if (errors >= 3 && !demo) autoTrace(); }
    }
    svg.addEventListener('pointerdown', function (e) {
      if (busy || finished || ctx.paused) return;
      var q = toSvg(e), T = tol() * 1.7, a = pts[prog];
      if ((a[0] - q[0]) * (a[0] - q[0]) + (a[1] - q[1]) * (a[1] - q[1]) > T * T) return; // يبدأ قرب الحيوان
      down = true; straying = false;
      try { svg.setPointerCapture(e.pointerId); } catch (x) {}
      e.preventDefault();
    });
    svg.addEventListener('pointermove', move);
    ['pointerup', 'pointercancel'].forEach(function (ev) { svg.addEventListener(ev, function () { down = false; }); });

    /* الكفّ يرسم الطريق ويُكمله (العرض التوضيحي، أو بعد تعثّر) */
    async function autoTrace() {
      if (busy || finished) return;
      busy = true; down = false;
      var sz = st.board.clientWidth * 0.26;
      var paw = h('div', { class: 'tr-paw', style: { width: sz + 'px', height: sz * 96 / 88 + 'px' }, html: art.hand() });
      st.board.appendChild(paw);
      function at(i) { paw.style.left = pts[i][0] / 3 + '%'; paw.style.top = pts[i][1] / 3 + '%'; }
      at(prog);
      UI.anim(paw, [{ opacity: 0 }, { opacity: 1 }], { dur: 300, fill: 'backwards' });
      await ctx.sleep(600); if (!alive()) return;
      for (var i = prog; i < N && alive(); i += 2) { at(i); setProg(i); await ctx.sleep(22); }
      setProg(N - 1);
      paw.remove(); busy = false;
    }
    st.solve = function () { if (finished) return false; setProg(N - 1); return true; };
    st.cancel = function () { finished = true; done(false); };

    // خمول طويل: ينبض الطريق ثم يُكمله الكفّ
    (async function watch() {
      while (alive() && !finished) {
        await ctx.sleep(1000);
        if (ctx.paused || busy) continue;
        idle++;
        if (idle === 5) guide.classList.add('pulse');
        if (idle >= 9 && !demo) autoTrace();
      }
    })();

    await ctx.sleep(demo ? 900 : 300); if (!alive()) return;
    if (demo) autoTrace();
    var ok = await fin;
    st.solve = null;
    if (!alive() || !ok) return;
    // الاحتفال: يقفز الحيوان إلى هدفه ويفرح
    guide.classList.remove('pulse');
    put(av, pts[N - 1]);
    UI.anim(av, [{ transform: 'translate(-50%,-50%) scale(1)' }, { transform: 'translate(-50%,-120%) scale(1.3)' }, { transform: 'translate(-50%,-50%) scale(1)' }], { dur: 600, easing: UI.SPRING, fill: 'none' });
    UI.anim(goal, [{ transform: 'translate(-50%,-50%) scale(1)' }, { transform: 'translate(-50%,-50%) scale(1.4)' }, { transform: 'translate(-50%,-50%) scale(1)' }], { dur: 600, easing: UI.SPRING, fill: 'none' });
    var c = kit.center(goal, ctx.stage);
    UI.burst(ctx.stage, c.x, c.y, { n: 22, spread: 150, dur: 1400 });
    if (B.audio) { B.audio.play('right'); B.audio.play('cheer'); }
    await ctx.sleep(1500); if (!alive()) return;
    return { errors: demo ? 0 : Math.min(errors, 5) };
  }

  B.games.tracing = {
    id: 'tracing',
    mount: function (ctx) { st = { ctx: ctx }; build(ctx); },
    demo: function (ctx) { return runner.run(function (alive) { return round(ctx, 1, true, alive); }); },
    playRound: function (ctx, level) { return runner.run(function (alive) { return round(ctx, level, false, alive); }); },
    cancelRound: function () { runner.cancel(); if (st) { if (st.cancel) st.cancel(); st.board.innerHTML = ''; } },
    outro: function (ctx) { return kit.dusk(ctx); },
    endArt: function () { return kit.endScene('bear'); },
    destroy: function () { runner.stop(); st = null; },
    _makeRound: makeRound,
    _paths: PATHS,
    _solveStep: function () { return !!(st && st.solve && st.solve()); }
  };
})();
