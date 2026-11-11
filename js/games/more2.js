/* خمس ألعاب جديدة تضيف مهارات مختلفة (كلها بلا قراءة، وبلا فشل، مع سلّم المساعدة نفسه):
   • «أطعم الحيوان»: ربط الحيوان بطعامه (الربط والتصنيف).
   • «أين يختبئ الحيوان؟»: ملاحظة بصرية — حيوان يطلّ من خلف شجيرة أو صخرة.
   • «من اختفى؟»: ذاكرة قصيرة المدى — صور تظهر ثم تختفي إحداها.
   • «رتّب الأحجام»: التسلسل — من الأصغر إلى الأكبر.
   • «من يعيش هنا؟»: تصنيف الحيوان حسب بيئته (بحر، غابة، مزرعة، سماء، صحراء). */
(function () {
  'use strict';
  var B = (window.Bustan = window.Bustan || {});
  var UI = B.UI, h = UI.h, art = B.art, kit = B.kit;
  function pic(k) { return B.pics.draw(k); }

  /* مصنع لعبة جلسات صغيرة (نفس عقد minis.js) */
  function mini(id, cls, sleeper, roundFn) {
    var st = null, runner = kit.roundRunner();
    B.games[id] = {
      id: id,
      mount: function (ctx) {
        st = { ctx: ctx, answer: null, last: '' };
        ctx.stage.classList.add('g-stage', 'mg-stage', cls);
        st.top = h('div', { class: 'mg-top' });
        st.tray = h('div', { class: 'g-tray mg-tray' });
        ctx.stage.appendChild(h('div', { class: 'g-main' }, st.top));
        ctx.stage.appendChild(st.tray);
      },
      demo: function (ctx) { return runner.run(function (alive, setCur) { return roundFn(ctx, st, 1, true, alive, setCur); }); },
      playRound: function (ctx, level) { return runner.run(function (alive, setCur) { return roundFn(ctx, st, level, false, alive, setCur); }); },
      cancelRound: function () { runner.cancel(); if (st) { st.top.innerHTML = ''; st.tray.innerHTML = ''; st.answer = null; st.ctx.stage.querySelectorAll('.kit-hand').forEach(function (x) { x.remove(); }); } },
      outro: function (ctx) { return kit.dusk(ctx); },
      endArt: function () { return kit.endScene(sleeper); },
      destroy: function () { runner.stop(); st = null; },
      _solveStep: function () { if (st && st.solve && st.solve()) return true; if (st && st.answer) { st.answer.click(); return true; } return false; }
    };
    return B.games[id];
  }
  function addBtns(st, htmls, cls) {
    st.tray.innerHTML = '';
    return htmls.map(function (html, i) {
      var b = h('button', { class: 'g-choice ' + (cls || 'pic'), type: 'button', html: html });
      st.tray.appendChild(b);
      UI.anim(b, [{ opacity: 0, transform: 'translateY(30px) scale(.8)' }, { opacity: 1, transform: 'none' }], { dur: 400, delay: i * 90, easing: UI.SPRING, fill: 'backwards' });
      return b;
    });
  }
  async function ask(ctx, st, btns, correct, demo, alive, setCur, opts) {
    st.answer = btns[correct];
    var o = { demo: demo }; for (var k in (opts || {})) o[k] = opts[k];
    var ch = kit.choice(ctx, ctx.stage, btns, correct, o);
    setCur(ch);
    var res = await ch.promise;
    st.answer = null;
    if (!alive() || res.cancelled) return null;
    return res;
  }
  async function cheer(ctx, el) {
    var c = kit.center(el, ctx.stage);
    UI.burst(ctx.stage, c.x, c.y, { n: 20, spread: 140, dur: 1300 });
    if (B.audio) B.audio.play('cheer');
    await ctx.sleep(1400);
  }

  /* ═════════ أطعم الحيوان ═════════ */
  var FEED = [['rabbit', 'carrot'], ['cat', 'fish'], ['lamb', 'leaf'], ['bear', 'apple'], ['bee', 'flower'], ['bird', 'grapes'], ['frog', 'bee']];
  var NOTFOOD = ['ball', 'key', 'clock', 'crown', 'book', 'rocket'];
  mini('feed', 'fd-stage', 'rabbit', async function (ctx, st, level, demo, alive, setCur) {
    var n = level <= 2 ? 2 : level <= 4 ? 3 : 4;
    var pair; do { pair = kit.pick(FEED); } while (pair[0] === st.last); st.last = pair[0];
    var foods = [pair[1]];
    var pool = level >= 3 ? FEED.map(function (p) { return p[1]; }).concat(NOTFOOD) : NOTFOOD.concat(['banana', 'lemon']);
    kit.shuffle(pool).forEach(function (f) { if (foods.length < n && foods.indexOf(f) < 0 && f !== pair[1]) foods.push(f); });
    foods = kit.shuffle(foods);
    st.top.innerHTML = '';
    var an = h('div', { class: 'fd-animal', html: pic(pair[0]) });
    st.top.appendChild(an);
    UI.anim(an, [{ opacity: 0, transform: 'translateY(30px) scale(.7)' }, { opacity: 1, transform: 'none' }], { dur: 480, easing: UI.SPRING, fill: 'backwards' });
    if (B.audio) B.audio.play('card');
    await ctx.sleep(600); if (!alive()) return;
    var btns = addBtns(st, foods.map(pic));
    var res = await ask(ctx, st, btns, foods.indexOf(pair[1]), demo, alive, setCur);
    if (!res) return;
    // الطعام يطير إلى الحيوان، وهو يأكله بسعادة
    var from = kit.center(btns[foods.indexOf(pair[1])], ctx.stage), to = kit.center(an, ctx.stage);
    var fly = h('div', { class: 'fd-fly', style: { left: from.x - 36 + 'px', top: from.y - 36 + 'px' }, html: pic(pair[1]) });
    ctx.stage.appendChild(fly);
    btns.forEach(function (b, i) { if (i !== foods.indexOf(pair[1])) b.classList.add('faded'); });
    await ctx.anim(fly, [{ transform: 'translate(0,0) scale(1)' }, { transform: 'translate(' + (to.x - from.x) + 'px,' + (to.y - from.y) + 'px) scale(.5)', opacity: 1, offset: 0.9 }, { transform: 'translate(' + (to.x - from.x) + 'px,' + (to.y - from.y) + 'px) scale(0)', opacity: 0 }], { dur: 700, easing: 'ease-in' });
    fly.remove();
    if (B.audio) B.audio.play('pop');
    UI.anim(an, [{ transform: 'scale(1)' }, { transform: 'scale(1.15,.9)' }, { transform: 'scale(.95,1.1)' }, { transform: 'scale(1.1,.95)' }, { transform: 'scale(1)' }], { dur: 700, fill: 'none' });
    await cheer(ctx, an); if (!alive()) return;
    return { errors: demo ? 0 : res.errors };
  });

  /* ═════════ أين يختبئ الحيوان؟ ═════════ */
  var SPOTS = {
    bush: '<circle cx="30" cy="62" r="24" fill="#2DBE7E"/><circle cx="56" cy="52" r="28" fill="#3DD08A"/><circle cx="76" cy="66" r="22" fill="#2DBE7E"/><rect x="8" y="76" width="86" height="14" rx="7" fill="#1C8F5C"/>',
    rock: '<path d="M8 90Q6 52 34 40Q60 28 82 50Q98 66 94 90Z" fill="#A9B4D0"/><path d="M30 56Q44 46 60 52" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".5"/>',
    tree: '<rect x="42" y="50" width="16" height="42" rx="5" fill="#8A5A33"/><circle cx="50" cy="38" r="30" fill="#2DBE7E"/><circle cx="32" cy="52" r="18" fill="#3DD08A"/><circle cx="70" cy="52" r="18" fill="#3DD08A"/>',
    log: '<rect x="6" y="46" width="88" height="44" rx="22" fill="#B67B4D"/><ellipse cx="82" cy="68" rx="12" ry="20" fill="#DDA86C"/><path d="M20 58H66M20 70H66M20 80H60" stroke="#8A5A33" stroke-width="3" stroke-linecap="round"/>'
  };
  var HIDERS = ['rabbit', 'cat', 'duck', 'bear', 'lamb', 'frog'];
  function spotSvg(kind) { return art.svg('0 0 100 100', SPOTS[kind], 'hd-spot'); }
  mini('hide', 'hd-stage', 'cat', async function (ctx, st, level, demo, alive, setCur) {
    var n = level <= 1 ? 3 : level <= 3 ? 4 : level === 4 ? 5 : 6;
    var peek = level <= 2 ? 0.5 : level <= 4 ? 0.3 : 0.18;
    var who; do { who = kit.pick(HIDERS); } while (who === st.last); st.last = who;
    var kinds = []; for (var i = 0; i < n; i++) kinds.push(['bush', 'rock', 'tree', 'log'][i % 4]);
    kinds = kit.shuffle(kinds);
    var target = kit.rand(n);
    st.top.innerHTML = '';
    var card = h('div', { class: 'hd-card', html: pic(who) });
    st.top.appendChild(card);
    UI.anim(card, [{ opacity: 0, transform: 'scale(.5)' }, { opacity: 1, transform: 'none' }], { dur: 450, easing: UI.SPRING, fill: 'backwards' });
    if (B.audio) B.audio.play('card');
    await ctx.sleep(600); if (!alive()) return;
    st.tray.classList.add('hd-grid');
    var btns = addBtns(st, kinds.map(function (k, i) {
      return '<span class="hd-wrap">' + (i === target ? '<span class="hd-animal" style="top:' + (-peek * 70 + 8) + '%">' + pic(who) + '</span>' : '') + spotSvg(k) + '</span>';
    }), 'hd-btn');
    var res = await ask(ctx, st, btns, target, demo, alive, setCur, {
      onWrong: function (b) { UI.anim(b, [{ transform: 'translateY(0)' }, { transform: 'translateY(-14px)' }, { transform: 'translateY(0)' }], { dur: 400, fill: 'none' }); }
    });
    if (!res) return;
    btns[target].classList.add('found');
    UI.anim(btns[target].querySelector('.hd-animal'), [{ transform: 'translateY(0) scale(1)' }, { transform: 'translateY(-55%) scale(1.35)' }, { transform: 'translateY(-30%) scale(1.2)' }], { dur: 600, easing: UI.SPRING });
    await cheer(ctx, btns[target]); if (!alive()) return;
    return { errors: demo ? 0 : res.errors };
  });

  /* ═════════ من اختفى؟ ═════════ */
  var THINGS = ['apple', 'car', 'cat', 'ball', 'flower', 'duck', 'house', 'banana', 'rocket', 'star', 'bear', 'fish', 'tree', 'balloon', 'strawberry'];
  mini('vanish', 'vn-stage', 'owl', async function (ctx, st, level, demo, alive, setCur) {
    var n = level <= 1 ? 3 : level <= 3 ? 4 : level === 4 ? 5 : 6;
    var set = kit.shuffle(THINGS).slice(0, n), missing = kit.rand(n);
    var others = THINGS.filter(function (t) { return set.indexOf(t) < 0; });
    var opts = kit.shuffle([set[missing]].concat(kit.shuffle(others).slice(0, 2)));
    st.top.innerHTML = ''; st.tray.innerHTML = '';
    var row = h('div', { class: 'vn-row' });
    var items = set.map(function (k, i) {
      var it = h('div', { class: 'vn-item', html: pic(k) });
      row.appendChild(it);
      UI.anim(it, [{ opacity: 0, transform: 'scale(0)' }, { opacity: 1, transform: 'none' }], { dur: 400, delay: i * 100, easing: UI.SPRING, fill: 'backwards' });
      return it;
    });
    st.top.appendChild(row);
    if (B.audio) B.audio.play('card');
    await ctx.sleep(1400 + n * 450); if (!alive()) return;     // وقت كافٍ للنظر
    // الكل يختفي في سحابة، ثم يعود الباقون
    if (B.audio) B.audio.play('whoosh');
    await Promise.all(items.map(function (it) { return ctx.anim(it, [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.2)' }], { dur: 350 }); }));
    await ctx.sleep(700); if (!alive()) return;
    items.forEach(function (it, i) { if (i !== missing) UI.anim(it, [{ opacity: 0, transform: 'scale(.2)' }, { opacity: 1, transform: 'none' }], { dur: 400, delay: i * 80, easing: UI.SPRING }); });
    items[missing].classList.add('gone');
    await ctx.sleep(900); if (!alive()) return;
    var btns = addBtns(st, opts.map(pic));
    var res = await ask(ctx, st, btns, opts.indexOf(set[missing]), demo, alive, setCur);
    if (!res) return;
    btns.forEach(function (b, i) { if (i !== opts.indexOf(set[missing])) b.classList.add('faded'); });
    items[missing].classList.remove('gone');
    UI.anim(items[missing], [{ opacity: 0, transform: 'scale(0) rotate(-40deg)' }, { opacity: 1, transform: 'scale(1.3)' }, { opacity: 1, transform: 'scale(1)' }], { dur: 700, easing: UI.SPRING });
    await cheer(ctx, items[missing]); if (!alive()) return;
    return { errors: demo ? 0 : res.errors };
  });

  /* ═════════ رتّب الأحجام ═════════ */
  mini('order', 'od2-stage', 'bear', async function (ctx, st, level, demo, alive, setCur) {
    var n = level <= 1 ? 3 : level <= 3 ? 4 : 5;
    var kind = kit.pick(['ball', 'fish', 'flower', 'apple', 'balloon', 'duck', 'tree']);
    var sizes = []; for (var i = 0; i < n; i++) sizes.push(i);          // ٠ الأصغر
    var shown = kit.shuffle(sizes);
    st.top.innerHTML = ''; st.tray.innerHTML = '';
    var podium = h('div', { class: 'or-podium' });
    var pool = h('div', { class: 'or-pool' });
    for (var s = 0; s < n; s++) { var sl = h('div', { class: 'or-slot' }); sl.style.setProperty('--sz', (72 + s * (60 / (n - 1 || 1))) + 'px'); podium.appendChild(sl); }
    st.top.appendChild(podium);
    st.top.appendChild(pool);
    var btns = shown.map(function (sz, i) {
      var b = h('button', { class: 'or-item', type: 'button', html: pic(kind) }); b.style.setProperty('--sz', (72 + sz * (60 / (n - 1 || 1))) + 'px');
      b.__sz = sz; pool.appendChild(b);
      UI.anim(b, [{ opacity: 0, transform: 'scale(0)' }, { opacity: 1, transform: 'none' }], { dur: 400, delay: i * 90, easing: UI.SPRING, fill: 'backwards' });
      return b;
    });
    if (B.audio) B.audio.play('card');
    var next = 0, errors = 0, fails = 0, busy = false, done, fin = new Promise(function (r) { done = r; });
    function hint() { var t = btns.filter(function (x) { return x.__sz === next; })[0]; if (t) t.classList.add('pulse-hint'); return t; }
    function take(b) {
      if (busy || ctx.paused || b.__sz === undefined) return;
      if (b.__sz !== next) {
        errors++; fails++; kit.wrong(b);
        if (fails === 2) hint();
        if (fails >= 3) auto();
        return;
      }
      fails = 0; b.classList.remove('pulse-hint');
      // FLIP: ينتقل الشكل إلى الدرج (يزداد حجمه من اليمين إلى اليسار)
      var slot = podium.children[next], r1 = b.getBoundingClientRect();
      slot.appendChild(b); b.classList.add('placed');
      var r2 = b.getBoundingClientRect();
      UI.anim(b, [{ transform: 'translate(' + (r1.left - r2.left) + 'px,' + (r1.top - r2.top) + 'px) scale(1.1)' }, { transform: 'none' }], { dur: 500, easing: UI.SPRING, fill: 'none' });
      b.disabled = true; b.__sz = undefined;
      if (B.audio) B.audio.play('place');
      next++;
      if (next >= n) done(true);
    }
    async function auto() {
      busy = true;
      var t = btns.filter(function (x) { return x.__sz === next; })[0];
      var c = kit.center(t, ctx.stage), hd = kit.hand(ctx.stage, c.x, c.y + c.h * 0.1);
      await ctx.sleep(600); if (!alive()) return;
      await hd.tap(); hd.el.remove(); busy = false; fails = 0; take(t);
    }
    btns.forEach(function (b) { UI.bindPress(b, function () { take(b); }); });
    st.solve = function () { var t = btns.filter(function (x) { return x.__sz === next; })[0]; if (!t || busy) return false; take(t); return true; };
    st.answer = null;
    await ctx.sleep(500); if (!alive()) return;
    if (demo) { (async function () { while (alive() && next < n) { await ctx.sleep(500); if (busy) continue; var t = btns.filter(function (x) { return x.__sz === next; })[0]; if (!t) return; var c = kit.center(t, ctx.stage), hd = kit.hand(ctx.stage, c.x, c.y + c.h * 0.1); await ctx.sleep(450); await hd.tap(); hd.el.remove(); take(t); } })(); }
    await fin; st.solve = null;
    if (!alive()) return;
    await cheer(ctx, podium); if (!alive()) return;
    return { errors: demo ? 0 : Math.min(errors, 6) };
  });

  /* ═════════ من يعيش هنا؟ ═════════ */
  var HAB = {
    sea: '<rect width="100" height="100" rx="14" fill="#5CC8FF"/><path d="M0 40Q12 32 25 40T50 40T75 40T100 40V100H0Z" fill="#3D8BFD"/><circle cx="24" cy="66" r="4" fill="#fff" opacity=".7"/><circle cx="70" cy="78" r="5" fill="#fff" opacity=".6"/><path d="M80 90q-6-14 0-24M88 90q4-12 0-20" stroke="#2DBE7E" stroke-width="5" fill="none" stroke-linecap="round"/>',
    forest: '<rect width="100" height="100" rx="14" fill="#BFEAD0"/><rect x="18" y="52" width="9" height="40" fill="#8A5A33"/><circle cx="22" cy="40" r="22" fill="#2DBE7E"/><rect x="66" y="46" width="9" height="46" fill="#8A5A33"/><circle cx="70" cy="34" r="26" fill="#1C8F5C"/><rect x="0" y="86" width="100" height="14" fill="#5ED38A"/>',
    farm: '<rect width="100" height="100" rx="14" fill="#FFF0B8"/><rect x="22" y="42" width="56" height="42" fill="#F0485A"/><polygon points="14,44 50,16 86,44" fill="#C22E40"/><rect x="42" y="58" width="16" height="26" fill="#FAFCFF"/><path d="M0 86H100" stroke="#5ED38A" stroke-width="14"/><path d="M6 78v14M18 78v14M30 78v14" stroke="#fff" stroke-width="4"/>',
    sky: '<rect width="100" height="100" rx="14" fill="#9FDDFF"/><circle cx="78" cy="24" r="12" fill="#FFD34E"/><path d="M14 66a12 12 0 0 1 22-4a10 10 0 0 1 20 4v6H14Z" fill="#fff"/><path d="M52 40a9 9 0 0 1 16-3a8 8 0 0 1 14 5v5H52Z" fill="#fff" opacity=".9"/>',
    desert: '<rect width="100" height="100" rx="14" fill="#FFE9B8"/><circle cx="76" cy="22" r="13" fill="#FFB52E"/><path d="M0 74Q30 50 60 74T100 66V100H0Z" fill="#F2C66F"/><path d="M0 88Q40 70 100 88V100H0Z" fill="#E8B050"/><rect x="22" y="48" width="8" height="26" rx="4" fill="#2DBE7E"/><rect x="14" y="56" width="6" height="12" rx="3" fill="#2DBE7E"/><rect x="32" y="52" width="6" height="12" rx="3" fill="#2DBE7E"/>'
  };
  var LIVES = { sea: ['fish', 'whale', 'turtle'], forest: ['bear', 'fox', 'owl'], farm: ['lamb', 'hen', 'cat'], sky: ['bird', 'butterfly', 'bee'], desert: ['camel'] };
  mini('habitat', 'hb-stage', 'frog', async function (ctx, st, level, demo, alive, setCur) {
    var n = level <= 2 ? 2 : 3, keys = Object.keys(LIVES);
    var home = kit.pick(keys), who; do { who = kit.pick(LIVES[home]); } while (who === st.last); st.last = who;
    var opts = [home]; kit.shuffle(keys).forEach(function (k) { if (opts.length < n && opts.indexOf(k) < 0) opts.push(k); });
    opts = kit.shuffle(opts);
    st.top.innerHTML = '';
    var an = h('div', { class: 'fd-animal', html: pic(who) });
    st.top.appendChild(an);
    UI.anim(an, [{ opacity: 0, transform: 'scale(.5)' }, { opacity: 1, transform: 'none' }], { dur: 450, easing: UI.SPRING, fill: 'backwards' });
    if (B.audio) B.audio.play('card');
    await ctx.sleep(600); if (!alive()) return;
    var btns = addBtns(st, opts.map(function (k) { return art.svg('0 0 100 100', HAB[k], 'hb-scene'); }), 'hb-btn');
    var res = await ask(ctx, st, btns, opts.indexOf(home), demo, alive, setCur);
    if (!res) return;
    btns.forEach(function (b, i) { if (i !== opts.indexOf(home)) b.classList.add('faded'); });
    var from = kit.center(an, ctx.stage), to = kit.center(btns[opts.indexOf(home)], ctx.stage);
    await ctx.anim(an, [{ transform: 'translate(0,0) scale(1)' }, { transform: 'translate(' + (to.x - from.x) + 'px,' + (to.y - from.y) + 'px) scale(.45)' }], { dur: 800, easing: 'ease-in-out', fill: 'forwards' });
    await cheer(ctx, btns[opts.indexOf(home)]); if (!alive()) return;
    return { errors: demo ? 0 : res.errors };
  });

})();
