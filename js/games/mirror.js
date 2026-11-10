/* لعبة «مرآة الأشكال» — التماثل والتفكير المكاني. عالم أقمشة وفراشات.
   شبكة بخط منتصف يشبه ثنية قماش. نصفها ملوّن، وعلى الطفلة أن تبني النصف المطابق انعكاساً.
   تختار لوناً من الأسفل بنقرة ثم تنقر الخانة (أو تسحبه إليها).
   المستويات: ١) نصف صغير ولونان مع وميض الخانة التالية  ٢) أكبر بلا وميض  ٣) ثلاثة ألوان
              ٤) محور أفقي  ٥) أكبر مع أشكال في الخانات.
   حجم الخانة لا ينزل عن حدّ اللمس: نختار أبعاد النصف التي تناسب الشاشة. */
(function () {
  'use strict';
  var B = (window.Bustan = window.Bustan || {});
  var UI = B.UI, h = UI.h, art = B.art, kit = B.kit;

  var FABRIC = ['#F2658E', '#3D8BFD', '#FFC83D', '#2DBE7E', '#8E5CF0', '#FF8A3D'];
  var CFG = {
    1: { n: 6, fill: 4, colors: 2, axis: 'v', guided: true },
    2: { n: 8, fill: 5, colors: 2, axis: 'v' },
    3: { n: 8, fill: 6, colors: 3, axis: 'v' },
    4: { n: 8, fill: 6, colors: 3, axis: 'h' },
    5: { n: 12, fill: 8, colors: 3, axis: 'v', shapes: true }
  };

  /* يختار أبعاد النصف (أعمدة×صفوف) التي تعطي أكبر خانة */
  function fit(n, axis, Wa, Ha) {
    var best = null;
    for (var c = 1; c <= n; c++) {
      if (n % c) continue;
      var r = n / c;
      var size = axis === 'v' ? Math.min(Wa / (2 * c), Ha / r) : Math.min(Wa / c, Ha / (2 * r));
      if (c === 1 && axis === 'v' && n > 3) continue; // عمود واحد لا يُظهر الانعكاس جيداً
      if (r === 1 && axis === 'h' && n > 8) continue;
      if (!best || size > best.size) best = { c: c, r: r, size: size };
    }
    return best;
  }

  /* يبني جولة: الرموز (ألوان/أشكال) وخريطة النصف المصدر */
  function makeRound(level, Wa, Ha, tap) {
    var cfg = CFG[level], n = cfg.n;
    var f = fit(n, cfg.axis, Wa, Ha);
    if (f.size < tap && n > 8) { n = 8; f = fit(n, cfg.axis, Wa, Ha); } // شاشة صغيرة: نصغّر الشبكة لا الخانة
    if (f.size < tap && n > 6) { n = 6; f = fit(n, cfg.axis, Wa, Ha); }
    var cols = kit.shuffle(FABRIC).slice(0, cfg.colors);
    var shapes = kit.shuffle(['triangle', 'circle', 'square']);
    var tokens = cols.map(function (c, i) { return { color: c, shape: cfg.shapes ? shapes[i] : null }; });
    var cells = [], i;
    for (i = 0; i < n; i++) cells.push(-1);
    var fillN = Math.min(n - 1, Math.round(cfg.fill * n / cfg.n));
    kit.shuffle(cells.map(function (_, k) { return k; })).slice(0, fillN).forEach(function (k, j) { cells[k] = j % tokens.length; });
    return { level: level, axis: cfg.axis, guided: !!cfg.guided, c: f.c, r: f.r, size: Math.floor(Math.min(f.size, UI.vp().tablet ? 130 : 110)), tokens: tokens, cells: cells };
  }

  function tokenHtml(t) {
    if (!t.shape) return '<span class="mr-fill" style="background:' + t.color + '"></span>';
    var d = t.shape === 'triangle' ? '<polygon points="50,14 88,84 12,84"/>' : t.shape === 'circle' ? '<circle cx="50" cy="50" r="36"/>' : '<rect x="16" y="16" width="68" height="68" rx="12"/>';
    return '<svg viewBox="0 0 100 100" class="mr-shape" fill="' + t.color + '" stroke="' + t.color + '" stroke-width="6" stroke-linejoin="round">' + d + '</svg>';
  }

  function butterfly(c1, c2) {
    var wing = '<path d="M50 50C46 20 20 8 12 24C6 38 22 50 50 52Z" fill="' + c1 + '"/><path d="M50 54C28 56 14 72 22 84C30 94 46 82 50 56Z" fill="' + c2 + '"/><circle cx="28" cy="30" r="6" fill="#FAFCFF" opacity=".8"/><circle cx="30" cy="74" r="4.5" fill="#FAFCFF" opacity=".8"/>';
    return art.svg('0 0 100 100',
      '<g class="bf-wing l">' + wing + '</g><g class="bf-wing r"><g transform="translate(100 0) scale(-1 1)">' + wing + '</g></g>' +
      '<rect x="46" y="28" width="8" height="46" rx="4" fill="#1F2A5A"/><path d="M48 28Q42 14 34 12M52 28Q58 14 66 12" stroke="#1F2A5A" stroke-width="3" fill="none" stroke-linecap="round"/>', 'bf-svg');
  }

  var st = null, runner = kit.roundRunner();

  function build(ctx) {
    var stage = ctx.stage;
    stage.classList.add('g-stage', 'mirror-stage');
    for (var i = 0; i < 4; i++) stage.appendChild(h('div', { class: 'mr-deco d' + i, html: butterfly(FABRIC[i], FABRIC[(i + 2) % 6]) }));
    st.board = h('div', { class: 'mr-board' });
    st.tray = h('div', { class: 'g-tray' });
    stage.appendChild(h('div', { class: 'g-main' }, st.board));
    stage.appendChild(st.tray);
  }

  function area(ctx) {
    var vp = UI.vp(), cs = getComputedStyle(ctx.stage);
    var short = vp.H < 500; // جوال أفقي: الألوان إلى الجانب لا في الأسفل
    var Wa = ctx.stage.clientWidth - 52 - (short ? vp.tap + 70 : 0);
    var Ha = ctx.stage.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - (short ? 0 : vp.tap + 44) - 50;
    return { Wa: Wa, Ha: Ha, tap: vp.tap };
  }

  async function round(ctx, level, demo, alive) {
    var a = area(ctx), R = makeRound(level, a.Wa, a.Ha, a.tap);
    var errors = 0, fails = 0, selected = -1, busy = false, filled = {}, done, finished = new Promise(function (res) { done = res; });
    st.board.innerHTML = ''; st.tray.innerHTML = '';
    var vert = R.axis === 'v';
    var grid = h('div', { class: 'mr-grid ' + (vert ? 'v' : 'hz'), style: { gridTemplateColumns: 'repeat(' + (vert ? 2 * R.c : R.c) + ',' + R.size + 'px)', gridAutoRows: R.size + 'px' } });
    var targets = {}; // فهرس الخانة في النصف -> زر الهدف
    // نرتب الخانات صفاً صفاً. i = البعد عن خط الثنية.
    var totalC = vert ? 2 * R.c : R.c, totalR = vert ? R.r : 2 * R.r;
    for (var y = 0; y < totalR; y++) {
      for (var x = 0; x < totalC; x++) {
        var src, i, j;
        if (vert) { src = x >= R.c; i = src ? x - R.c : R.c - 1 - x; j = y; }
        else { src = y < R.r; i = x; j = src ? R.r - 1 - y : y - R.r; }
        var k = vert ? j * R.c + i : j * R.c + i;
        var tok = R.cells[k];
        if (src) {
          grid.appendChild(h('div', { class: 'mr-cell src', html: tok >= 0 ? tokenHtml(R.tokens[tok]) : '' }));
        } else {
          var b = h('button', { class: 'mr-cell tgt', type: 'button', 'data-k': k });
          (function (kk, bb) { UI.bindPress(bb, function () { tapCell(kk); }); })(k, b);
          targets[k] = b;
          grid.appendChild(b);
        }
      }
    }
    grid.appendChild(h('span', { class: 'mr-fold' }));
    st.board.appendChild(grid);
    UI.anim(grid, [{ opacity: 0, transform: 'scale(.85)' }, { opacity: 1, transform: 'none' }], { dur: 480, easing: UI.SPRING, fill: 'backwards' });

    var swatches = R.tokens.map(function (t, ti) {
      var b = h('button', { class: 'g-choice swatch', type: 'button', html: tokenHtml(t) });
      UI.bindPress(b, function () { select(ti); });
      // سحب: إفلات الإصبع فوق خانة يضع اللون فيها
      b.addEventListener('pointerdown', function (e) { st.drag = { ti: ti, x: e.clientX, y: e.clientY }; });
      st.tray.appendChild(b);
      UI.anim(b, [{ opacity: 0, transform: 'translateY(30px)' }, { opacity: 1, transform: 'none' }], { dur: 380, delay: 200 + ti * 90, easing: UI.SPRING, fill: 'backwards' });
      return b;
    });
    st.onUp = function (e) {
      var d = st.drag; st.drag = null;
      if (!d || Math.abs(e.clientX - d.x) + Math.abs(e.clientY - d.y) < 30) return;
      var el = document.elementFromPoint(e.clientX, e.clientY);
      var cell = el && el.closest ? el.closest('.mr-cell.tgt') : null;
      if (cell) { select(d.ti); tapCell(+cell.getAttribute('data-k')); }
    };
    document.addEventListener('pointerup', st.onUp);

    function remaining() { return R.cells.map(function (t, k) { return t >= 0 && !filled[k] ? k : -1; }).filter(function (k) { return k >= 0; }); }
    function clearHints() { Object.keys(targets).forEach(function (k) { targets[k].classList.remove('pulse-hint', 'next'); }); swatches.forEach(function (s) { s.classList.remove('pulse-hint'); }); }
    function guide() { // المستوى ١: تومض الخانة التالية
      if (!R.guided) return;
      var rem = remaining();
      if (rem.length) targets[rem[0]].classList.add('next');
    }
    function select(ti) {
      if (busy || demo) return;
      selected = ti;
      swatches.forEach(function (s, i) { s.classList.toggle('selected', i === ti); });
      if (B.audio) B.audio.play('pick');
    }
    function fill(k) {
      filled[k] = true;
      targets[k].innerHTML = tokenHtml(R.tokens[R.cells[k]]);
      targets[k].classList.add('done');
      clearHints();
      if (B.audio) B.audio.play('place');
      UI.anim(targets[k], [{ transform: 'scale(.5)' }, { transform: 'scale(1.12)' }, { transform: 'scale(1)' }], { dur: 400, easing: UI.SPRING, fill: 'none' });
      fails = 0;
      if (!remaining().length) done(true); else guide();
    }
    async function solveOne() { // اليد تُظهر الحل: اللون ثم الخانة
      busy = true;
      var k = remaining()[0];
      if (k == null) { busy = false; return; }
      var ti = R.cells[k];
      var c1 = kit.center(swatches[ti], ctx.stage), hd = kit.hand(ctx.stage, c1.x, c1.y + c1.h * 0.15);
      await ctx.sleep(600); if (!alive()) return;
      await hd.tap();
      swatches.forEach(function (s, i) { s.classList.toggle('selected', i === ti); });
      selected = ti;
      var c2 = kit.center(targets[k], ctx.stage);
      await hd.moveTo(c2.x, c2.y + c2.h * 0.15); if (!alive()) return;
      await hd.tap();
      hd.remove();
      busy = false;
      fill(k);
    }
    function tapCell(k) {
      if (busy || demo || filled[k]) return;
      if (selected < 0) { swatches.forEach(function (s) { UI.anim(s, [{ transform: 'scale(1)' }, { transform: 'scale(1.15)' }, { transform: 'scale(1)' }], { dur: 400, fill: 'none' }); }); return; }
      if (R.cells[k] === selected) { fill(k); return; }
      errors++; fails++;
      kit.wrong(targets[k]);
      if (fails === 2) { var nk = remaining()[0]; targets[nk].classList.add('pulse-hint'); swatches[R.cells[nk]].classList.add('pulse-hint'); }
      if (fails >= 3) solveOne();
    }
    st.cancel = function () { done(false); };
    st.solve = function () {
      var k = remaining()[0];
      if (k == null || busy) return false;
      swatches[R.cells[k]].click(); targets[k].click();
      return true;
    };

    await ctx.sleep(700);
    if (!alive()) return cleanup();
    guide();
    if (demo) {
      while (remaining().length && alive()) { await solveOne(); if (!alive()) return cleanup(); await ctx.sleep(250); }
    }
    var ok = await finished;
    cleanup();
    if (!alive() || !ok) return;

    // الاحتفال: ينطبق القماش كصفحتي كتاب ثم تنفتح فراشة بجناحين متماثلين وتطير
    await ctx.sleep(350); if (!alive()) return;
    if (B.audio) B.audio.play('whoosh');
    await ctx.anim(grid, [{ transform: 'scale(1,1)' }, { transform: vert ? 'scale(.04,1)' : 'scale(1,.04)' }], { dur: 520, easing: 'cubic-bezier(.6,0,.4,1)' });
    if (!alive()) return;
    var bf = h('div', { class: 'mr-butterfly', html: butterfly(R.tokens[0].color, R.tokens[1].color) });
    st.board.appendChild(bf);
    grid.style.visibility = 'hidden';
    if (B.audio) { B.audio.play('flutter'); B.audio.play('cheer'); }
    var c = kit.center(st.board, ctx.stage);
    UI.burst(ctx.stage, c.x, c.y, { n: 22, spread: 150, dur: 1500 });
    await ctx.anim(bf, [{ transform: 'scale(.1)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { dur: 600, easing: UI.SPRING });
    if (!alive()) return;
    await ctx.sleep(900); if (!alive()) return;
    await ctx.anim(bf, [{ transform: 'translate(0,0) scale(1) rotate(0)', opacity: 1 }, { transform: 'translate(-40px,-30vh) scale(.8) rotate(-14deg)', opacity: 1, offset: 0.6 }, { transform: 'translate(40px,-70vh) scale(.5) rotate(10deg)', opacity: 0 }], { dur: 1500, easing: 'ease-in' });
    if (!alive()) return;
    st.board.innerHTML = ''; st.tray.innerHTML = '';
    return { errors: demo ? 0 : errors };

    function cleanup() { document.removeEventListener('pointerup', st.onUp); st.cancel = null; st.solve = null; }
  }

  B.games.mirror = {
    id: 'mirror',
    mount: function (ctx) { st = { ctx: ctx }; build(ctx); },
    demo: function (ctx) { return runner.run(function (alive) { return round(ctx, 1, true, alive); }); },
    playRound: function (ctx, level) { return runner.run(function (alive) { return round(ctx, level, false, alive); }); },
    cancelRound: function () {
      runner.cancel();
      if (st) { if (st.cancel) st.cancel(); st.board.innerHTML = ''; st.tray.innerHTML = ''; st.ctx.stage.querySelectorAll('.kit-hand').forEach(function (x) { x.remove(); }); }
    },
    outro: function (ctx) { return kit.dusk(ctx); },
    endArt: function () { return kit.endScene('lamb', h('div', { class: 'end-bf', html: butterfly('#F2658E', '#8E5CF0') })); },
    destroy: function () { runner.stop(); if (st && st.onUp) document.removeEventListener('pointerup', st.onUp); st = null; },
    _makeRound: makeRound,
    _solveStep: function () { return !!(st && st.solve && st.solve()); }
  };
})();
