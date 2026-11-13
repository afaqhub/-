/* محرك الجلسات: يدير جولات اللعبة (١٠ في «وحدي» و٨ في «معك»)،
   ومصابيح التقدم، والتكيّف الصامت، والحفظ بعد كل جولة، والشاشة الختامية الهادئة.

   عقد اللعبة (B.games[id]):
     mount(ctx)                  يبني المشهد داخل ctx.stage
     demo(ctx)        → Promise  عرض توضيحي صامت (يد تنقر)
     playRound(ctx, level, i) → Promise<{errors}|{cancelled:true}>
     cancelRound()               يُنهي الجولة الحالية بـ cancelled
     outro(ctx)       → Promise  خروج هادئ من المشهد قبل الختام
     endArt(ctx)      → Element  رسمة الشاشة الختامية
     destroy()                   تنظيف (مؤقتات، rAF)
   ملاحظة: ctx.sleep وctx.anim لا ينتهيان إذا غادرت الطفل اللعبة (لا أخطاء متأخرة). */
(function () {
  'use strict';
  var B = (window.Bustan = window.Bustan || {});
  var UI = B.UI, h = UI.h;

  /* فهرس الألعاب: المنطقة وعدد الجولات */
  B.catalog = [
    // «وحدي» مجمّعة بمهارتها (cat): تظهر في الرئيسية تحت عناوين صغيرة
    { id: 'memory', zone: 'solo', rounds: 10, cat: 'watch' },
    { id: 'shadows', zone: 'solo', rounds: 10, cat: 'watch' },
    { id: 'odd', zone: 'solo', rounds: 10, cat: 'watch' },
    { id: 'hide', zone: 'solo', rounds: 10, cat: 'watch' },
    { id: 'vanish', zone: 'solo', rounds: 10, cat: 'watch' },
    { id: 'missing', zone: 'solo', rounds: 10, cat: 'watch' },
    { id: 'fruits', zone: 'solo', rounds: 10, cat: 'num' },
    { id: 'more', zone: 'solo', rounds: 10, cat: 'num' },
    { id: 'order', zone: 'solo', rounds: 10, cat: 'num' },
    { id: 'mirror', zone: 'solo', rounds: 10, cat: 'num' },
    { id: 'pattern', zone: 'solo', rounds: 10, cat: 'num' },
    { id: 'letters', zone: 'solo', rounds: 10, cat: 'move' },
    { id: 'tracing', zone: 'solo', rounds: 10, cat: 'move' },
    { id: 'train', zone: 'solo', rounds: 10, cat: 'move' },
    { id: 'feed', zone: 'solo', rounds: 10, cat: 'know' },
    { id: 'habitat', zone: 'solo', rounds: 10, cat: 'know' },
    { id: 'water', zone: 'solo', rounds: 10, cat: 'know' },
    { id: 'maze', zone: 'solo', rounds: 10, cat: 'move' },
    { id: 'firstsound', zone: 'together', rounds: 8 },
    { id: 'bridge', zone: 'together', rounds: 8 },
    // القسم الإبداعي: لعب حرّ بلا جولات ولا مصابيح
    { id: 'workshop', zone: 'create', free: true },
    { id: 'coloring', zone: 'create', free: true },
    { id: 'drawing', zone: 'create', free: true },
    { id: 'gallery', zone: 'create', free: true },
    { id: 'stories', zone: 'together', free: true, hidden: true },
    { id: 'garden', zone: 'garden', free: true }
  ];
  B.free = B.free || {};
  B.games = B.games || {};

  var active = null;

  function item(id) {
    for (var i = 0; i < B.catalog.length; i++) if (B.catalog[i].id === id) return B.catalog[i];
    return null;
  }

  /* لعب حرّ: مسرح وزر الرئيسية فقط */
  function startFree(it, origin) {
    if (B.audio) B.audio.theme(it.id);
    if (it.id === 'garden') { /* يستعمل المحرك نفسه */ }
    var mod = B.free[it.id];
    if (!mod || active) return;
    if (B.audio) B.audio.play('whoosh');
    B.stats.play(it.id);
    var cur = UI.curtain('#8E5CF0', origin.x, origin.y);
    cur.cover.then(function () {
      var stage = h('div', { class: 'stage' });
      var ctx = { gameId: it.id, zone: it.zone, stage: stage, alive: true, free: true };
      ctx.homeBtn = UI.iconButton('home-btn', B.art.house(), B.S.buttons.home, function () { exit(ctx, mod); });
      ctx.hud = h('div', { class: 'hud' }, ctx.homeBtn);
      ctx.root = h('div', { class: 'screen game-screen free-screen game-' + it.id, 'data-game': it.id }, stage, ctx.hud);
      active = ctx;
      UI.go(ctx.root, { instant: true });
      try { mod.open(ctx); } catch (e) { console.error(e); }
      cur.reveal();
    });
  }

  function start(id, origin) {
    if (B.config && B.config.isHidden(id)) return;
    if (B.audio) B.audio.theme(id);
    var game = B.games[id], it = item(id);
    origin = origin || {};
    if (it && it.free) { startFree(it, origin); return; }
    if (!game || !it || active) return;
    var color = it.zone === 'solo' ? '#19B394' : '#F2658E';
    if (B.audio) B.audio.play('whoosh');
    B.stats.play(id);
    var cur = UI.curtain(color, origin.x, origin.y);
    cur.cover.then(function () {
      var ctx = build(it, game);
      active = ctx;
      UI.go(ctx.root, { instant: true });
      return cur.reveal().then(function () { loop(ctx, game); });
    });
  }

  function build(it, game) {
    var S = B.S;
    var stage = h('div', { class: 'stage' });
    var bulbs = UI.bulbs(it.rounds);
    var ctx = {
      gameId: it.id, zone: it.zone, total: it.rounds,
      stage: stage, bulbs: bulbs,
      alive: true, demoRunning: false, pendingDemo: false, ending: false,
      roundIndex: 0
    };
    ctx.homeBtn = UI.iconButton('home-btn', B.art.house(), S.buttons.home, function () { exit(ctx, game); });
    // شريط الأعلى: زر الرئيسية فقط والمصابيح (مساحة فارغة تعادل الزر لتبقى المصابيح في الوسط)
    // شريط الأعلى: الرئيسية (يمين) — المصابيح — إيقاف مؤقت (يسار)
    ctx.pauseBtn = UI.iconButton('pause-btn', B.art.pauseIcon(), S.buttons.pause, function () { pause(ctx, game); });
    ctx.hud = h('div', { class: 'hud' }, ctx.homeBtn, bulbs.el, ctx.pauseBtn);
    ctx.root = h('div', { class: 'screen game-screen game-' + it.id, 'data-game': it.id, 'data-zone': it.zone }, stage, ctx.hud);

    // انتظار وحركة آمنان: لا يكملان بعد الخروج من اللعبة
    function guard(v) { return ctx.alive ? v : new Promise(function () {}); }
    /* انتظار يتجمّد مع الإيقاف المؤقت: يُحسب الوقت المتبقي ويُستأنف بعد المتابعة */
    ctx.timers = [];
    ctx.paused = false;
    ctx.sleep = function (ms) {
      return new Promise(function (res) {
        var t = { rem: ms / UI.ts, id: 0, t0: 0, on: false };
        t.start = function () { t.on = true; t.t0 = performance.now(); t.id = setTimeout(t.done, Math.max(0, t.rem)); };
        t.stop = function () { if (!t.on) return; t.on = false; clearTimeout(t.id); t.rem -= performance.now() - t.t0; };
        t.done = function () { ctx.timers = ctx.timers.filter(function (x) { return x !== t; }); if (ctx.alive) res(); };
        ctx.timers.push(t);
        if (!ctx.paused) t.start();
      });
    };
    ctx.anim = function (el, kf, o) { return UI.anim(el, kf, o).then(guard); };
    return ctx;
  }

  async function runDemo(ctx, game) {
    ctx.demoRunning = true;
    ctx.root.classList.add('is-demo');
    await game.demo(ctx);
    ctx.demoRunning = false;
    ctx.root.classList.remove('is-demo');
  }

  async function loop(ctx, game) {
    var id = ctx.gameId;
    try {
      game.mount(ctx);
      await ctx.sleep(500);
      if (B.S.guides[id]) await showGuide(ctx, B.S.guides[id]);
      if (!B.storage.demoSeen(id)) {
        await runDemo(ctx, game);
        B.storage.markDemoSeen(id);
        await ctx.sleep(900);
      }
      var i = 0;
      while (i < ctx.total) {
        if (ctx.pendingDemo) {
          ctx.pendingDemo = false;
          await runDemo(ctx, game);
          await ctx.sleep(900);
        }
        ctx.roundIndex = i;
        var level = B.adaptive.level(id);
        var res = await game.playRound(ctx, level, i);
        if (res && res.cancelled) { ctx.pendingDemo = true; continue; } // نكرر الجولة نفسها بعد العرض
        B.adaptive.report(id, (res && res.errors) | 0);
        B.storage.recordRound(id);
        ctx.bulbs.light(i);
        i++;
        if (i < ctx.total) await ctx.sleep(1000);
      }
      B.storage.recordSession(id);
      B.stats.done(id);
      ctx.ending = true;
      await ctx.sleep(500);
      await game.outro(ctx);
      showEnd(ctx, game);
    } catch (e) {
      console.error(e);
    }
  }

  /* بطاقة شرح لوليّ الأمر (ألعاب «معك»): خطوات قصيرة وزر بدء */
  function showGuide(ctx, g) {
    return new Promise(function (res) {
      var go = h('button', { class: 'guide-go', type: 'button', text: B.S.guides.go });
      var card = h('div', { class: 'guide-card' },
        h('h2', { text: g.title }),
        h('ol', { class: 'guide-steps' }, g.steps.map(function (t, i) { return h('li', {}, h('b', { text: UI.num(i + 1) }), h('span', { text: t })); })),
        go);
      var layer = h('div', { class: 'guide-layer' }, card);
      ctx.root.appendChild(layer);
      UI.anim(card, [{ opacity: 0, transform: 'translateY(20px) scale(.95)' }, { opacity: 1, transform: 'none' }], { dur: 400, easing: UI.SPRING, fill: 'none' });
      go.addEventListener('click', function () {
        if (B.audio) B.audio.play('tap');
        UI.anim(layer, [{ opacity: 1 }, { opacity: 0 }], { dur: 250 }).then(function () { layer.remove(); if (ctx.alive) res(); });
      });
    });
  }

  function requestDemo(ctx, game) {
    if (ctx.demoRunning || ctx.ending || !ctx.alive) return;
    ctx.pendingDemo = true;
    if (game.cancelRound) game.cancelRound();
  }

  /* الشاشة الختامية: شخصية هادئة وزر واحد للعودة. لا جولة تلقائية ولا «العب مرة أخرى». */
  function showEnd(ctx, game) {
    var S = B.S;
    var art = game.endArt ? game.endArt(ctx) : null;
    var btn = UI.iconButton('home-btn end-home', B.art.house(), S.buttons.home, function () { exit(ctx, game); });
    var end = h('div', { class: 'end-screen' }, h('div', { class: 'end-art' }, art), btn);
    ctx.hud.classList.add('is-hidden');
    var plant = B.garden.plant();
    end.appendChild(h('div', { class: 'end-plant', html: B.pics.draw(plant) }));
    ctx.root.appendChild(end);
    var ep = end.lastChild;
    UI.anim(ep, [{ opacity: 0, transform: 'translateY(30px) scale(.2)' }, { opacity: 1, transform: 'translateY(0) scale(1.15)', offset: 0.6 }, { opacity: 1, transform: 'none' }], { dur: 900, delay: 1400, easing: UI.SPRING, fill: 'backwards' });
    if (B.audio) setTimeout(function () { B.audio.play('pop'); }, 1400 / UI.ts);
    UI.anim(end, [{ opacity: 0 }, { opacity: 1 }], { dur: 1000, fill: 'both' });
    if (art) UI.anim(art, [{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], { dur: 900, delay: 300, easing: UI.SPRING });
  }

  /* الإيقاف المؤقت: يتجمّد كل شيء (الحركة والمؤقتات والقطار) وتظهر طبقة بزر متابعة كبير */
  function pause(ctx, game) {
    if (ctx.paused || !ctx.alive || ctx.ending) return;
    ctx.paused = true;
    ctx.timers.forEach(function (t) { t.stop(); });
    ctx.frozen = ctx.stage.getAnimations({ subtree: true }).filter(function (a) { return a.playState === 'running'; });
    ctx.frozen.forEach(function (a) { try { a.pause(); } catch (e) {} });
    ctx.root.classList.add('is-paused');
    if (game.pause) game.pause();
    var resume = UI.iconButton('resume-btn', B.art.playIcon(), B.S.buttons.resume, function () { unpause(ctx, game); });
    ctx.pauseLayer = h('div', { class: 'pause-layer' }, resume);
    ctx.root.appendChild(ctx.pauseLayer);
    UI.anim(ctx.pauseLayer, [{ opacity: 0 }, { opacity: 1 }], { dur: 250, fill: 'none' });
    UI.anim(resume, [{ transform: 'scale(.4)' }, { transform: 'scale(1)' }], { dur: 380, easing: UI.SPRING, fill: 'none' });
  }
  function unpause(ctx, game) {
    if (!ctx.paused) return;
    var layer = ctx.pauseLayer;
    ctx.pauseLayer = null;
    UI.anim(layer, [{ opacity: 1 }, { opacity: 0 }], { dur: 220 }).then(function () { layer.remove(); });
    ctx.paused = false;
    ctx.root.classList.remove('is-paused');
    (ctx.frozen || []).forEach(function (a) { try { if (a.playState === 'paused') a.play(); } catch (e) {} });
    ctx.frozen = null;
    if (game.resume) game.resume();
    ctx.timers.slice().forEach(function (t) { t.start(); });
  }

  function exit(ctx, game) {
    if (!ctx.alive) return;
    ctx.alive = false;
    try { game.destroy && game.destroy(); } catch (e) { console.error(e); }
    active = null;
    B.storage.save(); // يُحفظ التقدم بنقرة واحدة
    B.home.show();
  }

  B.session = {
    start: start,
    active: function () { return active; },
    item: item
  };
})();
