/* لعبة «بطاقات الذاكرة» — الذاكرة البصرية. عالم حديقة ليلية وبطاقات لامعة.
   تُعرض البطاقات مكشوفة لحظة (تنبؤ قبل الفعل) ثم تُقلب، فتقلبها الطفل اثنتين اثنتين لتجد الأزواج.
   الزوجان غير المتطابقين يعودان بهدوء (ليس خطأ في الذاكرة)، والزوج المتطابق يبقى مكشوفاً ويلمع.
   المستويات: ١) زوجان  ٢) ثلاثة  ٣) أربعة  ٤) ستة  ٥) ثمانية. ويقصر زمن المعاينة مع المستوى.
   الأخطاء (للتكيّف الصامت) = المحاولات الزائدة عن عدد الأزواج.
   سلّم المساعدة: إن طال البحث تُكشف البطاقات لحظة، ثم يدلّ الكفّ على زوج. */
(function () {
  'use strict';
  var B = (window.Bustan = window.Bustan || {});
  var UI = B.UI, h = UI.h, kit = B.kit;

  var FACES = ['duck', 'bear', 'cat', 'rabbit', 'frog', 'lamb', 'owl', 'apple', 'strawberry', 'grapes', 'fish', 'butterfly',
    'sun', 'balloon', 'car', 'flower', 'house', 'rocket', 'ball', 'tree', 'whale', 'bee', 'crown', 'train'];
  var CFG = { 1: { pairs: 2, peek: 2600 }, 2: { pairs: 3, peek: 2600 }, 3: { pairs: 4, peek: 2400 }, 4: { pairs: 6, peek: 2200 }, 5: { pairs: 8, peek: 2000 } };

  /* أبعاد الشبكة لعدد البطاقات: أكبر بطاقة تتسع */
  function fit(n, W, H) {
    var best = null;
    for (var c = 1; c <= n; c++) {
      if (n % c) continue;
      var r = n / c, s = Math.min(W / c, (H / r) / 1.15);
      if (!best || s > best.s) best = { c: c, r: r, s: s };
    }
    best.s = Math.floor(Math.min(best.s - 10, UI.vp().tablet ? 190 : 140));
    return best;
  }

  var st = null, runner = kit.roundRunner();

  function build(ctx) {
    ctx.stage.classList.add('g-stage', 'mm-stage');
    for (var i = 0; i < 18; i++) {
      ctx.stage.appendChild(h('span', { class: 'mm-star', style: { left: Math.random() * 100 + '%', top: Math.random() * 100 + '%', animationDelay: Math.random() * 3 + 's' } }));
    }
    st.grid = h('div', { class: 'mm-grid' });
    ctx.stage.appendChild(h('div', { class: 'g-main' }, st.grid));
  }

  function card(face) {
    var front = h('div', { class: 'mm-face mm-front', html: B.pics.draw(face) });
    var back = h('div', { class: 'mm-face mm-back' }, h('span', { class: 'mm-back-art', html: B.art.sparkle('#FFF7C2') }));
    var el = h('button', { class: 'mm-card', type: 'button' }, h('div', { class: 'mm-flip' }, back, front));
    return el;
  }

  async function round(ctx, level, demo, alive) {
    var c = CFG[level], pairs = demo ? 2 : c.pairs, n = pairs * 2;
    var faces = kit.shuffle(FACES).slice(0, pairs);
    var deck = kit.shuffle(faces.concat(faces));
    var g = fit(n, st.grid.parentNode.clientWidth - 10, st.grid.parentNode.clientHeight - 10);
    st.grid.innerHTML = '';
    st.grid.style.gridTemplateColumns = 'repeat(' + g.c + ',' + g.s + 'px)';
    st.grid.style.gridAutoRows = Math.round(g.s * 1.15) + 'px';
    var cards = deck.map(function (f, i) {
      var el = card(f);
      el.__face = f; el.__i = i;
      st.grid.appendChild(el);
      UI.anim(el, [{ transform: 'scale(0) rotate(-20deg)' }, { transform: 'none' }], { dur: 420, delay: i * 60, easing: UI.SPRING, fill: 'backwards' });
      return el;
    });
    var open = [], matched = 0, tries = 0, busy = true, done, finished = new Promise(function (r) { done = r; });
    var helped = false;

    function flip(el, up) { el.classList.toggle('up', up); }
    function pick(el) {
      if (busy || el.classList.contains('up') || ctx.paused || (demo && !el.__auto)) return;
      flip(el, true);
      if (B.audio) B.audio.play('pick');
      open.push(el);
      if (open.length < 2) return;
      tries++;
      busy = true;
      var a = open[0], b = open[1];
      open = [];
      if (a.__face === b.__face) {
        setTimeout(function () {
          a.classList.add('matched'); b.classList.add('matched');
          if (B.audio) { B.audio.play('right'); B.audio.play('sparkle'); }
          [a, b].forEach(function (x) { var p = kit.center(x, ctx.stage); UI.burst(ctx.stage, p.x, p.y, { n: 8, spread: 60, dur: 800 }); });
          matched++;
          busy = false;
          if (matched === pairs) done(true);
        }, 350 / UI.ts);
      } else {
        // لا يتطابقان: يعودان بهدوء
        ctx.sleep(1000).then(function () {
          flip(a, false); flip(b, false);
          if (B.audio) B.audio.play('soft');
          busy = false;
          help();
        });
      }
    }
    cards.forEach(function (el) { UI.bindPress(el, function () { pick(el); }); });

    /* سلّم المساعدة: بعد محاولات كثيرة تُكشف البطاقات لحظة، ثم يدلّ الكفّ على زوج */
    async function help() {
      var extra = tries - pairs;
      if (extra === pairs + 2 && !helped) {
        helped = true; busy = true;
        cards.forEach(function (x) { if (!x.classList.contains('matched')) flip(x, true); });
        await ctx.sleep(1300); if (!alive()) return;
        cards.forEach(function (x) { if (!x.classList.contains('matched')) flip(x, false); });
        await ctx.sleep(500);
        busy = false;
      } else if (extra >= pairs * 2 + 4) {
        await showPair();
      }
    }
    async function showPair() {
      busy = true;
      var left = cards.filter(function (x) { return !x.classList.contains('matched'); });
      var a = left[0], b = left.filter(function (x) { return x !== a && x.__face === a.__face; })[0];
      if (!a || !b) { busy = false; return; }
      for (var k = 0; k < 2; k++) {
        var el = k ? b : a, p = kit.center(el, ctx.stage), hd = kit.hand(ctx.stage, p.x, p.y + p.h * 0.1);
        await ctx.sleep(550); if (!alive()) return;
        await hd.tap(); hd.el.remove();
        busy = false; el.__auto = true; pick(el); el.__auto = false; busy = true;
        if (k === 0) busy = false;
        await ctx.sleep(300); if (!alive()) return;
      }
    }

    // معاينة: البطاقات مكشوفة لحظة ثم تُقلب
    await ctx.sleep(350 + n * 60); if (!alive()) return;
    cards.forEach(function (x) { flip(x, true); });
    if (B.audio) B.audio.play('whoosh');
    await ctx.sleep(demo ? 2600 : c.peek); if (!alive()) return;
    cards.forEach(function (x) { flip(x, false); });
    await ctx.sleep(600); if (!alive()) return;
    busy = false;

    st.solve = function () {
      if (busy) return false;
      var left = cards.filter(function (x) { return !x.classList.contains('matched') && !x.classList.contains('up'); });
      var up = cards.filter(function (x) { return x.classList.contains('up') && !x.classList.contains('matched'); })[0];
      var t = up ? left.filter(function (x) { return x.__face === up.__face; })[0] : left[0];
      if (!t) return false;
      pick(t); return true;
    };
    st.cancel = function () { done(false); };
    if (demo) { // العرض التوضيحي: الكفّ يكشف الأزواج كلها زوجاً زوجاً
      (async function () {
        while (alive() && matched < pairs) {
          await ctx.sleep(500); if (!alive()) return;
          await showPair();
          await ctx.sleep(500);
        }
      })();
    }

    var ok = await finished;
    st.solve = null;
    if (!alive() || !ok) return;
    await ctx.sleep(400); if (!alive()) return;
    if (B.audio) B.audio.play('cheer');
    var p = kit.center(st.grid, ctx.stage);
    UI.burst(ctx.stage, p.x, p.y, { n: 26, spread: 170, dur: 1500 });
    cards.forEach(function (x, i) {
      UI.anim(x, [{ transform: 'translateY(0) rotate(0)' }, { transform: 'translateY(-18px) rotate(' + (i % 2 ? 8 : -8) + 'deg)' }, { transform: 'translateY(0) rotate(0)' }], { dur: 600, delay: i * 50, fill: 'none', deco: true });
    });
    await ctx.sleep(1500); if (!alive()) return;
    return { errors: demo ? 0 : Math.max(0, tries - pairs - Math.ceil(pairs / 2)) };
  }

  B.games.memory = {
    id: 'memory',
    mount: function (ctx) { st = { ctx: ctx }; build(ctx); },
    demo: function (ctx) { return runner.run(function (alive) { return round(ctx, 1, true, alive); }); },
    playRound: function (ctx, level) { return runner.run(function (alive) { return round(ctx, level, false, alive); }); },
    cancelRound: function () { runner.cancel(); if (st) { if (st.cancel) st.cancel(); st.grid.innerHTML = ''; st.ctx.stage.querySelectorAll('.kit-hand').forEach(function (x) { x.remove(); }); } },
    outro: function (ctx) { return kit.dusk(ctx); },
    endArt: function () { return kit.endScene('owl'); },
    destroy: function () { runner.stop(); st = null; },
    _fit: fit,
    _solveStep: function () { return !!(st && st.solve && st.solve()); }
  };
})();
