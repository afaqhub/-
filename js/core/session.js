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
   ملاحظة: ctx.sleep وctx.anim لا ينتهيان إذا غادرت الطفلة اللعبة (لا أخطاء متأخرة). */
(function () {
  'use strict';
  var B = (window.Bustan = window.Bustan || {});
  var UI = B.UI, h = UI.h;

  /* فهرس الألعاب: المنطقة وعدد الجولات */
  B.catalog = [
    { id: 'train', zone: 'solo', rounds: 10 },
    { id: 'mirror', zone: 'solo', rounds: 10 },
    { id: 'pattern', zone: 'solo', rounds: 10 },
    { id: 'firstsound', zone: 'together', rounds: 8 },
    { id: 'bridge', zone: 'together', rounds: 8 }
  ];
  B.games = B.games || {};

  var active = null;

  function item(id) {
    for (var i = 0; i < B.catalog.length; i++) if (B.catalog[i].id === id) return B.catalog[i];
    return null;
  }

  function start(id, origin) {
    var game = B.games[id], it = item(id);
    if (!game || !it || active) return;
    origin = origin || {};
    var color = it.zone === 'solo' ? '#19B394' : '#F2658E';
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
    ctx.replayBtn = UI.iconButton('replay-btn', B.art.replayIcon(), S.buttons.replay, function () { requestDemo(ctx, game); });
    ctx.hud = h('div', { class: 'hud' }, ctx.homeBtn, bulbs.el, ctx.replayBtn);
    ctx.root = h('div', { class: 'screen game-screen game-' + it.id, 'data-game': it.id, 'data-zone': it.zone }, stage, ctx.hud);

    // انتظار وحركة آمنان: لا يكملان بعد الخروج من اللعبة
    function guard(v) { return ctx.alive ? v : new Promise(function () {}); }
    ctx.sleep = function (ms) { return UI.sleep(ms).then(guard); };
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
      ctx.ending = true;
      ctx.replayBtn.disabled = true;
      await ctx.sleep(500);
      await game.outro(ctx);
      showEnd(ctx, game);
    } catch (e) {
      console.error(e);
    }
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
    ctx.root.appendChild(end);
    UI.anim(end, [{ opacity: 0 }, { opacity: 1 }], { dur: 1000, fill: 'both' });
    if (art) UI.anim(art, [{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], { dur: 900, delay: 300, easing: UI.SPRING });
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
