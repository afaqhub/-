/* لعبة «سلة الفواكه» — العدّ لغرض وقراءة الأرقام. عالم بستان وشجرة.
   نمطان:
   • «أعطِني»: الدب يحمل بطاقة رقم، فتقطف الطفل من الشجرة فاكهة فاكهة وتسقط في السلة،
     ويظهر فوق السلة العدد الجاري (١، ٢، ٣…) حتى تبلغ الرقم المطلوب.
   • «كم؟»: في السلة فواكه مرتبة صفوفاً من خمس، فتختار رقمها من ثلاث بطاقات،
     ثم تُعدّ الفواكه أمامها واحدة واحدة.
   المستويات: ١) أعطني ١–٥  ٢) حتى ١٠ ويدخل «كم؟» حتى ٥  ٣) «كم؟» حتى ١٠
              ٤) أعطني حتى ١٥  ٥) حتى ٢٠ في النمطين. */
(function () {
  'use strict';
  var B = (window.Bustan = window.Bustan || {});
  var UI = B.UI, h = UI.h, art = B.art, kit = B.kit;

  var FRUITS = ['apple', 'strawberry', 'lemon', 'pomegranate', 'grapes', 'banana'];

  function between(a, b) { return a + kit.rand(b - a + 1); }
  function config(level, i) {
    var odd = i % 2 === 1;
    if (level === 1) return { mode: 'give', n: between(1, 5) };
    if (level === 2) return odd ? { mode: 'count', n: between(1, 5) } : { mode: 'give', n: between(3, 10) };
    if (level === 3) return odd ? { mode: 'count', n: between(3, 10) } : { mode: 'give', n: between(4, 10) };
    if (level === 4) return odd ? { mode: 'count', n: between(5, 12) } : { mode: 'give', n: between(8, 15) };
    return odd ? { mode: 'count', n: between(8, 20) } : { mode: 'give', n: between(10, 20) };
  }

  /* أبعاد شبكة الشجرة: أكبر حجم يتسع لـ total ثمرة، دون النزول عن حدّ اللمس */
  function fitGrid(total, W, H, min) {
    var best = null;
    for (var c = 1; c <= total; c++) {
      var r = Math.ceil(total / c), s = Math.min(W / c, H / r);
      if (!best || s > best.s) best = { c: c, r: r, s: s };
    }
    if (best.s < min) { // نقلّل الثمار الزائدة ونحافظ على حجم اللمس
      var c2 = Math.max(1, Math.floor(W / min)), r2 = Math.max(1, Math.floor(H / min));
      best = { c: c2, r: r2, s: min, cap: c2 * r2 };
    }
    best.s = Math.min(best.s, UI.vp().tablet ? 130 : 104);
    return best;
  }

  function basketSvg() {
    return art.svg('0 0 120 80',
      '<path d="M10 30H110L98 74Q96 78 90 78H30Q24 78 22 74Z" fill="#DDA86C" stroke="#8A5A33" stroke-width="4" stroke-linejoin="round"/>' +
      '<path d="M16 44H104M20 58H100M40 30L44 78M60 30V78M80 30L76 78" stroke="#B67B4D" stroke-width="3"/>' +
      '<rect x="4" y="22" width="112" height="12" rx="6" fill="#C9925A" stroke="#8A5A33" stroke-width="4"/>', 'basket-svg');
  }

  var st = null, runner = kit.roundRunner();

  function build(ctx) {
    var stage = ctx.stage;
    stage.classList.add('g-stage', 'fr-stage');
    st.card = h('div', { class: 'fr-card' });
    st.ask = h('div', { class: 'fr-ask' }, h('div', { class: 'fr-bear', html: art.animal('bear') }), st.card);
    st.tree = h('div', { class: 'fr-tree' }, h('div', { class: 'fr-canopy' }), h('div', { class: 'fr-trunk' }));
    st.grid = h('div', { class: 'fr-grid' });
    st.tree.appendChild(st.grid);
    st.count = h('div', { class: 'fr-count' });
    st.basket = h('div', { class: 'fr-basket' }, st.count, h('div', { class: 'fr-basket-art', html: basketSvg() }));
    st.tray = h('div', { class: 'g-tray fr-tray' });
    stage.appendChild(st.ask);
    stage.appendChild(h('div', { class: 'g-main fr-main' }, st.tree));
    stage.appendChild(st.basket);
    stage.appendChild(st.tray);
  }

  function showCard(text, isQ) {
    st.card.innerHTML = '';
    st.card.classList.toggle('q', !!isQ);
    if (isQ) st.card.innerHTML = art.bubbleQ();
    else st.card.appendChild(h('span', { text: text }));
    UI.anim(st.card, [{ transform: 'scale(.3) rotate(-10deg)', opacity: 0 }, { transform: 'none', opacity: 1 }], { dur: 480, easing: UI.SPRING, fill: 'backwards' });
    if (B.audio) B.audio.play('card');
  }

  function bumpCount(n) {
    st.count.textContent = UI.num(n);
    st.count.classList.add('on');
    UI.anim(st.count, [{ transform: 'scale(.5)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { dur: 340, easing: UI.SPRING, fill: 'none' });
    if (B.audio) B.audio.play('lantern', n - 1);
  }

  async function celebrate(ctx) {
    if (B.audio) B.audio.play('cheer');
    var c = kit.center(st.basket, ctx.stage);
    UI.burst(ctx.stage, c.x, c.y - 20, { n: 22, spread: 150, dur: 1400 });
    UI.anim(st.ask.firstChild, [{ transform: 'translateY(0)' }, { transform: 'translateY(-22px) rotate(-6deg)' }, { transform: 'translateY(0)' }, { transform: 'translateY(-12px) rotate(6deg)' }, { transform: 'translateY(0)' }], { dur: 900, fill: 'none' });
    await ctx.sleep(1400);
  }

  /* نمط «أعطِني» */
  async function giveRound(ctx, n, demo, alive) {
    var fruit = kit.pick(FRUITS), count = 0, done, finished = new Promise(function (r) { done = r; });
    st.tree.style.display = ''; st.basket.style.display = ''; st.tray.innerHTML = ''; st.tray.style.display = 'none';
    st.count.textContent = ''; st.count.classList.remove('on');
    st.basket.querySelectorAll('.fr-in').forEach(function (x) { x.remove(); });
    showCard(UI.num(n));
    var vp = UI.vp(), want = Math.min(24, n + 2 + kit.rand(3));
    var g = fitGrid(want, st.grid.clientWidth || st.tree.clientWidth * 0.86, st.tree.clientHeight * 0.8, vp.tap);
    var total = Math.max(n, Math.min(want, g.cap || want));
    st.grid.innerHTML = '';
    st.grid.style.gridTemplateColumns = 'repeat(' + g.c + ',' + g.s + 'px)';
    st.grid.style.gridAutoRows = g.s + 'px';
    var btns = [];
    for (var i = 0; i < total; i++) {
      var b = h('button', { class: 'fr-fruit', type: 'button', html: B.pics.draw(fruit) });
      (function (bb) { UI.bindPress(bb, function () { pickFruit(bb); }); })(b);
      st.grid.appendChild(b);
      UI.anim(b, [{ transform: 'scale(0)' }, { transform: 'scale(1)' }], { dur: 380, delay: 150 + i * 40, easing: UI.SPRING, fill: 'backwards' });
      btns.push(b);
    }
    function pickFruit(b) {
      if (count >= n || b.classList.contains('taken') || (demo && !b.__auto) || ctx.paused) return;
      b.classList.add('taken');
      b.disabled = true;
      count++;
      // الثمرة تطير إلى السلة
      var from = kit.center(b, ctx.stage), to = kit.center(st.basket, ctx.stage);
      var fly = h('div', { class: 'fr-fly', style: { left: from.x - from.w / 2 + 'px', top: from.y - from.h / 2 + 'px', width: from.w + 'px', height: from.h + 'px' }, html: B.pics.draw(fruit) });
      ctx.stage.appendChild(fly);
      var dx = to.x - from.x, dy = to.y - from.y + 10;
      UI.anim(fly, [
        { transform: 'translate(0,0) scale(1)' },
        { transform: 'translate(' + dx * 0.5 + 'px,' + (Math.min(dy, 0) - 60) + 'px) scale(.9)', offset: 0.45 },
        { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(.55)' }
      ], { dur: 520, easing: 'ease-in-out' }).then(function () {
        fly.remove();
        var inB = h('span', { class: 'fr-in', html: B.pics.draw(fruit), style: { left: 18 + Math.random() * 54 + '%' } });
        st.basket.appendChild(inB);
      });
      bumpCount(count);
      if (count === n) setTimeout(function () { done(true); }, 560 / UI.ts);
    }
    st.solve = function () { var b = btns.filter(function (x) { return !x.classList.contains('taken'); })[0]; if (b && count < n) { b.click(); return true; } return false; };
    st.cancel = function () { done(false); };
    if (demo) {
      await ctx.sleep(900);
      for (var k = 0; k < n && alive(); k++) {
        var c = kit.center(btns[k], ctx.stage), hd = kit.hand(ctx.stage, c.x, c.y + c.h * 0.1);
        await ctx.sleep(450); if (!alive()) return;
        await hd.tap(); btns[k].__auto = true; pickFruit(btns[k]); hd.el.remove();
        await ctx.sleep(250);
      }
    }
    var ok = await finished;
    st.solve = null;
    if (!alive() || !ok) return;
    btns.forEach(function (b) { if (!b.classList.contains('taken')) b.classList.add('rest'); });
    await celebrate(ctx);
    if (!alive()) return;
    return { errors: 0 };
  }

  /* نمط «كم؟» */
  async function countRound(ctx, n, demo, alive, setCur) {
    var fruit = kit.pick(FRUITS);
    st.tree.style.display = ''; st.basket.style.display = 'none'; st.tray.style.display = '';
    showCard('', true);
    // الفواكه في صفوف من خمس (مثل إطار العشرة) فيسهل العدّ
    st.grid.innerHTML = '';
    var cols = n > 5 ? 5 : n, rows = Math.ceil(n / 5);
    var s = Math.min((st.tree.clientWidth * 0.86) / cols, (st.tree.clientHeight * 0.78) / rows, UI.vp().tablet ? 120 : 92);
    st.grid.style.gridTemplateColumns = 'repeat(' + cols + ',' + s + 'px)';
    st.grid.style.gridAutoRows = s + 'px';
    var items = [];
    for (var i = 0; i < n; i++) {
      var it = h('span', { class: 'fr-fruit show', html: B.pics.draw(fruit) });
      st.grid.appendChild(it); items.push(it);
      UI.anim(it, [{ transform: 'scale(0)' }, { transform: 'scale(1)' }], { dur: 380, delay: 120 + i * 45, easing: UI.SPRING, fill: 'backwards' });
    }
    await ctx.sleep(500 + n * 45);
    if (!alive()) return;
    var maxN = Math.max(5, n + 2), opts = [n];
    while (opts.length < 3) {
      var d = n + (kit.rand(2) ? 1 : -1) * (1 + kit.rand(2));
      if (d >= 1 && d <= Math.max(maxN, 20) && opts.indexOf(d) < 0) opts.push(d);
    }
    opts = kit.shuffle(opts);
    st.tray.innerHTML = '';
    var btns = opts.map(function (v, i) {
      var b = h('button', { class: 'g-choice letter num', type: 'button' }, h('span', { text: UI.num(v) }));
      st.tray.appendChild(b);
      UI.anim(b, [{ opacity: 0, transform: 'translateY(30px)' }, { opacity: 1, transform: 'none' }], { dur: 380, delay: i * 90, easing: UI.SPRING, fill: 'backwards' });
      return b;
    });
    st.answer = btns[opts.indexOf(n)];
    var ch = kit.choice(ctx, ctx.stage, btns, opts.indexOf(n), { demo: demo });
    setCur(ch);
    var res = await ch.promise;
    st.answer = null;
    if (!alive() || res.cancelled) return;
    showCard(UI.num(n));
    // نعدّ الفواكه أمامها واحدة واحدة
    for (var k = 0; k < items.length; k++) {
      items[k].classList.add('counted');
      items[k].setAttribute('data-n', UI.num(k + 1));
      if (B.audio) B.audio.play('lantern', k);
      UI.anim(items[k], [{ transform: 'scale(1)' }, { transform: 'scale(1.2)' }, { transform: 'scale(1)' }], { dur: 300, easing: UI.SPRING, fill: 'none' });
      await ctx.sleep(Math.max(120, 260 - n * 6));
      if (!alive()) return;
    }
    await celebrate(ctx);
    if (!alive()) return;
    return { errors: demo ? 0 : res.errors };
  }

  B.games.fruits = {
    id: 'fruits',
    mount: function (ctx) { st = { ctx: ctx }; build(ctx); },
    demo: function (ctx) { return runner.run(function (alive) { return giveRound(ctx, 3, true, alive); }); },
    playRound: function (ctx, level, i) {
      var c = config(level, i);
      return runner.run(function (alive, setCur) { return c.mode === 'give' ? giveRound(ctx, c.n, false, alive) : countRound(ctx, c.n, false, alive, setCur); });
    },
    cancelRound: function () {
      runner.cancel();
      if (st) { if (st.cancel) st.cancel(); st.grid.innerHTML = ''; st.tray.innerHTML = ''; st.ctx.stage.querySelectorAll('.kit-hand,.fr-fly').forEach(function (x) { x.remove(); }); }
    },
    outro: function (ctx) { return kit.dusk(ctx); },
    endArt: function () { return kit.endScene('bear', h('div', { class: 'end-basket', html: basketSvg() })); },
    destroy: function () { runner.stop(); st = null; },
    _config: config,
    _solveStep: function () {
      if (!st) return false;
      if (st.solve && st.solve()) return true;
      if (st.answer) { st.answer.click(); return true; }
      return false;
    }
  };
})();
