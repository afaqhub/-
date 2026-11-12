/* ثلاث ألعاب جديدة:
   • «ماذا ينقص الصورة؟»: جزء وكل — صورة ينقصها جزء، وتختار الجزء الناقص فيلتصق وتحيا الصورة.
   • «اسقِ الزهرة»: سبب ونتيجة — بذرة ثم ماء (وشمس) ثم نبتة فزهرة تُزرع في «بستاني».
   • «ساعد الأرنب»: متاهة حديقة — تخطيط الطريق وجمع التفاحات قبل الوصول إلى الجزرة. */
(function () {
  'use strict';
  var B = (window.Bustan = window.Bustan || {});
  var UI = B.UI, h = UI.h, art = B.art, kit = B.kit;
  function pic(k) { return B.pics.draw(k); }
  function sv(inner, cls) { return art.svg('0 0 100 100', inner, cls || 'pic'); }

  /* مصنع لعبة جلسات (نفس عقد minis.js) */
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
      cancelRound: function () { runner.cancel(); if (st) { st.top.innerHTML = ''; st.tray.innerHTML = ''; st.answer = null; if (st.stop) st.stop(); st.ctx.stage.querySelectorAll('.kit-hand,.ms-fly').forEach(function (x) { x.remove(); }); } },
      outro: function (ctx) { return kit.dusk(ctx); },
      endArt: function () { return kit.endScene(sleeper); },
      destroy: function () { runner.stop(); if (st && st.stop) st.stop(); st = null; },
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
    UI.burst(ctx.stage, c.x, c.y, { n: 22, spread: 150, dur: 1400 });
    if (B.audio) B.audio.play('cheer');
    await ctx.sleep(1500);
  }

  /* ═════════════════ ماذا ينقص الصورة؟ ═════════════════ */
  var WHEEL = '<circle cx="50" cy="50" r="40" fill="#1F2A5A"/><circle cx="50" cy="50" r="18" fill="#8FA0D8"/><circle cx="50" cy="50" r="5" fill="#1F2A5A"/>';
  var MP = {
    car: { live: 'drive', slot: [72, 72, 22],
      base: '<rect x="8" y="46" width="84" height="24" rx="8" fill="#F0485A"/><path d="M24 46L34 26H66L78 46Z" fill="#F0485A"/><path d="M32 44L38 30H48V44ZM52 44V30H64L72 44Z" fill="#D6EEFF"/><circle cx="28" cy="72" r="11" fill="#1F2A5A"/><circle cx="28" cy="72" r="5" fill="#8FA0D8"/><circle cx="90" cy="54" r="3.5" fill="#FFE58A"/>',
      part: '<circle cx="72" cy="72" r="11" fill="#1F2A5A"/><circle cx="72" cy="72" r="5" fill="#8FA0D8"/>', icon: WHEEL },
    house: { live: 'jump', slot: [50, 76, 18],
      base: '<rect x="18" y="44" width="64" height="48" rx="4" fill="#FFE9B8"/><path d="M10 48L50 14L90 48Z" fill="#F2658E" stroke="#C23C69" stroke-width="3" stroke-linejoin="round"/><rect x="24" y="54" width="14" height="14" rx="2" fill="#8FD3F4"/><rect x="62" y="54" width="14" height="14" rx="2" fill="#8FD3F4"/><rect x="66" y="20" width="9" height="18" fill="#C23C69"/>',
      part: '<rect x="41" y="62" width="18" height="30" rx="3" fill="#B67B4D"/><circle cx="55" cy="78" r="1.8" fill="#FFD34E"/>', icon: '<rect x="26" y="8" width="48" height="84" rx="8" fill="#B67B4D"/><circle cx="62" cy="52" r="5" fill="#FFD34E"/>' },
    bear: { live: 'blink', slot: [50, 61, 14],
      base: '<circle cx="24" cy="27" r="13" fill="#9A6540"/><circle cx="24" cy="27" r="7" fill="#E9B68E"/><circle cx="76" cy="27" r="13" fill="#9A6540"/><circle cx="76" cy="27" r="7" fill="#E9B68E"/><circle cx="50" cy="55" r="36" fill="#B67B4D"/><ellipse cx="50" cy="68" rx="17" ry="13" fill="#F3D6B0"/><circle cx="36" cy="47" r="4.8" fill="#2B2340"/><circle cx="64" cy="47" r="4.8" fill="#2B2340"/><path d="M50 65.5v4M42.5 71.5q7.5 6 15 0" stroke="#3A2A3F" stroke-width="2.6" fill="none" stroke-linecap="round"/><circle cx="25" cy="62" r="5.5" fill="#FF9DB3" opacity=".6"/><circle cx="75" cy="62" r="5.5" fill="#FF9DB3" opacity=".6"/>',
      part: '<ellipse cx="50" cy="61" rx="6.5" ry="4.8" fill="#3A2A3F"/>', icon: '<ellipse cx="50" cy="50" rx="34" ry="26" fill="#3A2A3F"/><ellipse cx="38" cy="40" rx="8" ry="5" fill="#fff" opacity=".4"/>' },
    tree: { live: 'sway', slot: [50, 36, 64],
      base: '<rect x="43" y="54" width="14" height="38" rx="5" fill="#8A5A33"/><rect x="0" y="88" width="100" height="12" rx="6" fill="#5ED38A"/>',
      part: '<circle cx="50" cy="36" r="28" fill="#2DBE7E"/><circle cx="30" cy="50" r="18" fill="#2DBE7E"/><circle cx="70" cy="50" r="18" fill="#2DBE7E"/><circle cx="42" cy="28" r="4" fill="#F0485A"/><circle cx="62" cy="44" r="4" fill="#F0485A"/>', icon: '<circle cx="50" cy="40" r="30" fill="#2DBE7E"/><circle cx="26" cy="58" r="20" fill="#2DBE7E"/><circle cx="74" cy="58" r="20" fill="#2DBE7E"/><circle cx="40" cy="32" r="5" fill="#F0485A"/><circle cx="62" cy="52" r="5" fill="#F0485A"/>' },
    fish: { live: 'swim', slot: [82, 50, 26],
      base: '<ellipse cx="46" cy="50" rx="36" ry="24" fill="#3D8BFD"/><ellipse cx="46" cy="58" rx="22" ry="9" fill="#9CC8FF"/><circle cx="26" cy="44" r="5" fill="#fff"/><circle cx="25" cy="44" r="2.6" fill="#2B2340"/><path d="M40 28Q48 14 60 22L56 32Z" fill="#2468D1"/><path d="M14 56q4 4 9 1" stroke="#1B4FA6" stroke-width="2.4" fill="none" stroke-linecap="round"/>',
      part: '<path d="M74 50L98 28V72Z" fill="#2468D1" stroke="#2468D1" stroke-width="4" stroke-linejoin="round"/>', icon: '<path d="M14 50L90 14V86Z" fill="#2468D1" stroke="#2468D1" stroke-width="6" stroke-linejoin="round"/>' },
    flower: { live: 'sway', slot: [50, 38, 22],
      base: '<rect x="47" y="52" width="6" height="42" rx="3" fill="#1C8F5C"/><path d="M50 78Q30 66 24 82Q40 90 50 78Z" fill="#2DBE7E"/><path d="M50 70Q70 58 78 74Q62 82 50 70Z" fill="#2DBE7E"/><circle cx="50" cy="16" r="12" fill="#F2658E"/><circle cx="68" cy="30" r="12" fill="#F2658E"/><circle cx="50" cy="52" r="0" fill="none"/><circle cx="62" cy="52" r="12" fill="#F2658E"/><circle cx="38" cy="52" r="12" fill="#F2658E"/><circle cx="32" cy="30" r="12" fill="#F2658E"/><circle cx="50" cy="42" r="12" fill="#F2658E"/>',
      part: '<circle cx="50" cy="38" r="11" fill="#FFC83D"/><circle cx="50" cy="38" r="4" fill="#E2A21B"/>', icon: '<circle cx="50" cy="50" r="34" fill="#FFC83D"/><circle cx="50" cy="50" r="12" fill="#E2A21B"/>' }
  };
  var MKEYS = Object.keys(MP);
  mini('missing', 'ms-stage', 'bear', async function (ctx, st, level, demo, alive, setCur) {
    var n = level <= 1 ? 2 : level <= 3 ? 3 : 4;
    var k; do { k = kit.pick(MKEYS); } while (k === st.last); st.last = k;
    var M = MP[k], opts = [k];
    kit.shuffle(MKEYS).forEach(function (o) { if (opts.length < n && opts.indexOf(o) < 0) opts.push(o); });
    opts = kit.shuffle(opts);
    st.top.innerHTML = '';
    var board = h('div', { class: 'ms-board' });
    var art0 = h('div', { class: 'ms-art', html: sv(M.base, 'ms-svg') });
    board.appendChild(art0);
    // مكان الجزء الناقص: دائرة منقّطة تنبض
    var hole = h('div', { class: 'ms-hole', style: { left: M.slot[0] + '%', top: M.slot[1] + '%', width: M.slot[2] + '%', height: M.slot[2] + '%' } });
    board.appendChild(hole);
    st.top.appendChild(board);
    UI.anim(board, [{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'none' }], { dur: 480, easing: UI.SPRING, fill: 'backwards' });
    if (B.audio) B.audio.play('card');
    await ctx.sleep(700); if (!alive()) return;
    var btns = addBtns(st, opts.map(function (o) { return sv(MP[o].icon); }));
    var res = await ask(ctx, st, btns, opts.indexOf(k), demo, alive, setCur);
    if (!res) return;
    // الجزء يطير إلى مكانه ثم تحيا الصورة
    btns.forEach(function (b, i) { if (i !== opts.indexOf(k)) b.classList.add('faded'); });
    var from = kit.center(btns[opts.indexOf(k)], ctx.stage), br = board.getBoundingClientRect(), sr = ctx.stage.getBoundingClientRect();
    var tx = br.left - sr.left + br.width * M.slot[0] / 100, ty = br.top - sr.top + br.height * M.slot[1] / 100;
    var sz = br.width * M.slot[2] / 100;
    var fly = h('div', { class: 'ms-fly', style: { left: from.x - 40 + 'px', top: from.y - 40 + 'px' }, html: sv(MP[k].icon) });
    ctx.stage.appendChild(fly);
    if (B.audio) B.audio.play('pop');
    await ctx.anim(fly, [{ transform: 'translate(0,0) scale(1)' }, { transform: 'translate(' + (tx - from.x) + 'px,' + (ty - from.y - 40) + 'px) scale(' + (sz / 80 * 1.2) + ')', offset: 0.7 }, { transform: 'translate(' + (tx - from.x) + 'px,' + (ty - from.y) + 'px) scale(' + (sz / 80) + ')' }], { dur: 700, easing: 'ease-in-out' });
    fly.remove(); hole.remove();
    art0.innerHTML = sv(M.base + M.part, 'ms-svg');
    if (B.audio) B.audio.play('place');
    var life = { drive: [{ transform: 'translateX(0)' }, { transform: 'translateX(-14%)' }, { transform: 'translateX(14%)' }, { transform: 'translateX(0)' }], jump: [{ transform: 'translateY(0)' }, { transform: 'translateY(-12%)' }, { transform: 'translateY(0)' }, { transform: 'translateY(-6%)' }, { transform: 'translateY(0)' }],
      blink: [{ transform: 'scale(1)' }, { transform: 'scale(1.1,.92)' }, { transform: 'scale(1)' }, { transform: 'scale(1.08,.94)' }, { transform: 'scale(1)' }], sway: [{ transform: 'rotate(0)' }, { transform: 'rotate(-6deg)' }, { transform: 'rotate(6deg)' }, { transform: 'rotate(0)' }],
      swim: [{ transform: 'translateX(0) rotate(0)' }, { transform: 'translateX(12%) rotate(4deg)' }, { transform: 'translateX(-12%) rotate(-4deg)' }, { transform: 'translateX(0)' }] };
    UI.anim(art0, life[M.live], { dur: 1200, fill: 'none', easing: 'ease-in-out' });
    await cheer(ctx, board); if (!alive()) return;
    return { errors: demo ? 0 : res.errors };
  });

  /* ═════════════════ اسقِ الزهرة ═════════════════ */
  var BLOOMS = [['#F2658E', '#FFD34E'], ['#FFC83D', '#E2A21B'], ['#8E5CF0', '#FFD34E'], ['#FF8A3D', '#FFE58A'], ['#3D8BFD', '#FFD34E']];
  function plantSvg(stage, col) {   // ٠ بلا نبتة، ١ برعم صغير، ٢ ساق وبرعم، ٣ زهرة
    if (stage <= 0) return '';
    var stem = '<path d="M50 130Q48 ' + (stage === 1 ? 108 : 70) + ' 50 ' + (stage === 1 ? 100 : 44) + '" stroke="#1C8F5C" stroke-width="7" fill="none" stroke-linecap="round"/>';
    var leaves = stage === 1
      ? '<path d="M50 104Q34 96 28 104Q40 114 50 104Z" fill="#2DBE7E"/><path d="M50 104Q66 94 72 102Q60 112 50 104Z" fill="#5ED38A"/>'
      : '<path d="M50 96Q28 84 22 98Q38 108 50 96Z" fill="#2DBE7E"/><path d="M50 84Q74 70 80 84Q64 96 50 84Z" fill="#5ED38A"/>';
    var top = stage === 2 ? '<ellipse cx="50" cy="40" rx="11" ry="16" fill="#8FE0A8"/><path d="M50 24q-12 10 0 28q12-18 0-28Z" fill="' + col[0] + '" opacity=".9"/>'
      : stage >= 3 ? (function () { var s = ''; for (var i = 0; i < 7; i++) s += '<ellipse cx="50" cy="18" rx="10" ry="17" fill="' + col[0] + '" transform="rotate(' + i * 51.4 + ' 50 42)"/>'; return s + '<circle cx="50" cy="42" r="12" fill="' + col[1] + '"/><circle cx="50" cy="42" r="4.5" fill="#E2A21B" opacity=".6"/>'; })() : '';
    return art.svg('0 0 100 140', stem + leaves + top, 'wt-plant-svg');
  }
  function potSvg() { return art.svg('0 0 100 80', '<path d="M12 8H88L80 70Q79 76 72 76H28Q21 76 20 70Z" fill="#E07A4F" stroke="#B85A33" stroke-width="3" stroke-linejoin="round"/><rect x="6" y="2" width="88" height="16" rx="8" fill="#F08F63" stroke="#B85A33" stroke-width="3"/><ellipse cx="50" cy="10" rx="36" ry="5" class="wt-soil" fill="#8A5A33"/>', 'wt-pot-svg'); }
  function canSvg() { return art.svg('0 0 110 90', '<path d="M14 30H78L72 80Q71 86 65 86H28Q22 86 21 80Z" fill="#5CC8FF" stroke="#2468D1" stroke-width="4" stroke-linejoin="round"/><path d="M78 40L104 22" stroke="#2468D1" stroke-width="9" stroke-linecap="round"/><path d="M98 14L108 26" stroke="#2468D1" stroke-width="12" stroke-linecap="round"/><path d="M14 40Q-4 42 4 58Q10 64 20 58" fill="none" stroke="#2468D1" stroke-width="6" stroke-linecap="round"/><ellipse cx="42" cy="30" rx="26" ry="5" fill="#9FE0FF" stroke="#2468D1" stroke-width="3"/>', 'wt-can-svg'); }
  function seedSvg() { return art.svg('0 0 60 60', '<ellipse cx="30" cy="32" rx="14" ry="20" fill="#8A5A33" transform="rotate(25 30 32)"/><ellipse cx="25" cy="24" rx="4" ry="8" fill="#B67B4D" transform="rotate(25 25 24)"/>', 'wt-seed-svg'); }

  mini('water', 'wt-stage', 'rabbit', async function (ctx, st, level, demo, alive, setCur) {
    var waters = level <= 1 ? 1 : level <= 3 ? 2 : 3, sun = level >= 4;
    var steps = ['seed']; for (var w = 0; w < waters; w++) steps.push('can'); if (sun) steps.push('sun');
    var col = kit.pick(BLOOMS);
    st.top.innerHTML = ''; st.tray.innerHTML = '';
    var scene = h('div', { class: 'wt-scene' });
    var plant = h('div', { class: 'wt-plant' }); var pot = h('div', { class: 'wt-pot', html: potSvg() });
    var seed = h('button', { class: 'wt-tool wt-seed', type: 'button', 'aria-label': 'seed', html: seedSvg() });
    var can = h('button', { class: 'wt-tool wt-can', type: 'button', 'aria-label': 'can', html: canSvg() });
    var sunB = h('button', { class: 'wt-tool wt-sun', type: 'button', 'aria-label': 'sun', html: art.sun() });
    scene.appendChild(plant); scene.appendChild(pot); scene.appendChild(seed);
    st.top.appendChild(scene);
    var tools = { seed: seed, can: can, sun: sunB };
    steps.forEach(function (s) { if (s !== 'seed' && !scene.contains(tools[s])) scene.appendChild(tools[s]); });
    steps.forEach(function (s) { tools[s].style.display = s === 'seed' ? '' : 'none'; });
    var cur = 0, errors = 0, idle = 0, busy = false, done, fin = new Promise(function (r) { done = r; });
    function target() { return tools[steps[cur]]; }
    function showStep() {
      var t = target(); if (!t) return; t.style.display = ''; t.classList.add('wt-next');
      UI.anim(t, [{ opacity: 0, transform: 'scale(.4)' }, { opacity: 1, transform: 'none' }], { dur: 420, easing: UI.SPRING, fill: 'backwards' });
      idle = 0;
    }
    UI.anim(scene, [{ opacity: 0, transform: 'scale(.8)' }, { opacity: 1, transform: 'none' }], { dur: 450, easing: UI.SPRING, fill: 'backwards' });
    if (B.audio) B.audio.play('card');
    function grow() {
      var total = steps.length - 1, p = (cur) / total;      // cur = عدد الخطوات المنجزة بعد البذرة
      var stg = cur === 0 ? 0 : Math.min(3, Math.ceil(p * 3));
      plant.innerHTML = plantSvg(stg, col);
      var s = plant.firstChild; if (s) UI.anim(s, [{ transform: 'scaleY(.3)', transformOrigin: '50% 100%' }, { transform: 'scaleY(1.08)', transformOrigin: '50% 100%' }, { transform: 'scaleY(1)', transformOrigin: '50% 100%' }], { dur: 700, easing: UI.SPRING, fill: 'none' });
    }
    async function act() {
      if (busy) return; busy = true;
      var step = steps[cur], t = target(); if (!t) { busy = false; return; } t.classList.remove('wt-next', 'pulse-hint');
      if (step === 'seed') {
        var a = kit.center(t, ctx.stage), b = kit.center(pot, ctx.stage);
        await ctx.anim(t, [{ transform: 'translate(0,0)' }, { transform: 'translate(' + (b.x - a.x) * 0.5 + 'px,' + (b.y - a.y - 80) + 'px)', offset: 0.5 }, { transform: 'translate(' + (b.x - a.x) + 'px,' + (b.y - a.y - 10) + 'px) scale(.5)', opacity: 0 }], { dur: 700, easing: 'ease-in', fill: 'forwards' });
        if (B.audio) B.audio.play('place');
        pot.querySelector('.wt-soil').setAttribute('fill', '#6B4426');
      } else if (step === 'can') {
        await ctx.anim(t, [{ transform: 'rotate(0)' }, { transform: 'rotate(-25deg) translateY(-10px)' }], { dur: 350, fill: 'forwards' });
        var pr = pot.getBoundingClientRect(), sr = ctx.stage.getBoundingClientRect(), cr = t.getBoundingClientRect();
        for (var i = 0; i < 7; i++) {
          var d = h('span', { class: 'wt-drop', style: { left: cr.left - sr.left + 6 + i * 3 + 'px', top: cr.top - sr.top + cr.height * 0.45 + 'px' } });
          ctx.stage.appendChild(d);
          UI.anim(d, [{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(' + (pr.top - cr.top + 4) + 'px)', opacity: 1, offset: 0.85 }, { transform: 'translateY(' + (pr.top - cr.top + 14) + 'px)', opacity: 0 }], { dur: 700, delay: i * 70, easing: 'ease-in' }).then((function (x) { return function () { x.remove(); }; })(d));
        }
        if (B.audio) B.audio.play('splash');
        await ctx.sleep(900);
        pot.querySelector('.wt-soil').setAttribute('fill', '#4A2E18');
        await ctx.anim(t, [{ transform: 'rotate(-25deg) translateY(-10px)' }, { transform: 'rotate(0)' }], { dur: 350, fill: 'forwards' });
        t.style.display = 'none';
      } else { // sun
        t.classList.add('shine');
        if (B.audio) B.audio.play('sparkle');
        await ctx.sleep(1000); t.style.display = 'none';
      }
      cur++; grow();
      if (B.audio) B.audio.play('pop');
      busy = false;
      if (cur >= steps.length) { done(true); return; }
      showStep();
    }
    steps.forEach(function (s) { UI.bindPress(tools[s], function () { if (!busy && steps[cur] === s && !ctx.paused) act(); }); });
    st.solve = function () { if (busy || cur >= steps.length) return false; act(); return true; };
    st.stop = function () { done(false); };
    seed.classList.add('wt-next');
    await ctx.sleep(600); if (!alive()) return;
    // سلّم المساعدة: نبض بعد ٦ ثوانٍ بلا لمس، ثم الكفّ بعد ١٢
    (async function watch() {
      while (alive() && cur < steps.length) {
        await ctx.sleep(1000); if (ctx.paused || busy) continue;
        idle++;
        if (idle === 6) { target().classList.add('pulse-hint'); errors++; }
        if (idle >= 12 || (demo && idle >= 2)) {
          var t = target(), c = kit.center(t, ctx.stage), hd = kit.hand(ctx.stage, c.x, c.y + c.h * 0.1);
          await ctx.sleep(600); await hd.tap(); hd.el.remove(); idle = 0; if (!busy && cur < steps.length) act();
        }
      }
    })();
    await fin; st.solve = null;
    if (!alive()) return;
    // الزهرة تتفتح وتُزرع في «بستاني»، وفراشة تزورها
    B.garden.add(kit.pick(['flower', 'rose']));
    var pc = kit.center(plant, ctx.stage);
    UI.burst(ctx.stage, pc.x, pc.y - 40, { n: 24, spread: 150, dur: 1500, colors: [col[0], col[1], '#fff', '#FFD34E'] });
    if (B.audio) B.audio.play('cheer');
    var bf = h('div', { class: 'wt-bf', html: art.gameIcon('mirror') }); scene.appendChild(bf);
    UI.anim(bf, [{ transform: 'translate(-120%,-80%) scale(.5)', opacity: 0 }, { transform: 'translate(0,-30%) scale(1)', opacity: 1, offset: 0.4 }, { transform: 'translate(20%,-60%) scale(1)', offset: 0.7 }, { transform: 'translate(140%,-140%) scale(.6)', opacity: 0 }], { dur: 2000, easing: 'ease-in-out' });
    UI.anim(plant, [{ transform: 'rotate(0)' }, { transform: 'rotate(-5deg)' }, { transform: 'rotate(5deg)' }, { transform: 'rotate(0)' }], { dur: 1400, fill: 'none' });
    await ctx.sleep(2100); if (!alive()) return;
    return { errors: demo ? 0 : Math.min(errors, 4) };
  });

  /* ═════════════════ ساعد الأرنب (متاهة) ═════════════════
     حديقة بسياجات: يمرّر الطفل إصبعه من الأرنب إلى الجزرة (أو يلمس خانة فيمشي إليها أقصر طريق).
     المستويات: ٣×٣ ثم ٤×٤ ثم ٥×٥، ثم ٥×٥ مع تفاحتين يجب جمعهما، ثم ٦×٦ مع ثلاث. */
  function genMaze(n, braid) {
    var w = [], r, c; for (r = 0; r < n; r++) { w.push([]); for (c = 0; c < n; c++) w[r].push({ t: 1, l: 1, b: 1, r: 1 }); }
    var seen = {}, stack = [[0, 0]]; seen['0,0'] = 1;
    function nb(r, c) { return [[r - 1, c, 't', 'b'], [r + 1, c, 'b', 't'], [r, c - 1, 'l', 'r'], [r, c + 1, 'r', 'l']].filter(function (x) { return x[0] >= 0 && x[1] >= 0 && x[0] < n && x[1] < n; }); }
    while (stack.length) {
      var cur = stack[stack.length - 1], cand = nb(cur[0], cur[1]).filter(function (x) { return !seen[x[0] + ',' + x[1]]; });
      if (!cand.length) { stack.pop(); continue; }
      var x = kit.pick(cand); w[cur[0]][cur[1]][x[2]] = 0; w[x[0]][x[1]][x[3]] = 0; seen[x[0] + ',' + x[1]] = 1; stack.push([x[0], x[1]]);
    }
    for (var k = 0; k < braid; k++) { // فتحات إضافية تجعل المتاهة أسهل (أكثر من طريق)
      var rr = kit.rand(n), cc = kit.rand(n), o = kit.pick(nb(rr, cc));
      w[rr][cc][o[2]] = 0; w[o[0]][o[1]][o[3]] = 0;
    }
    return w;
  }
  function openDir(w, a, b) {   // هل يوجد ممر بين خليتين متجاورتين؟
    var dr = b[0] - a[0], dc = b[1] - a[1];
    if (dr === -1 && dc === 0) return !w[a[0]][a[1]].t; if (dr === 1 && dc === 0) return !w[a[0]][a[1]].b;
    if (dr === 0 && dc === -1) return !w[a[0]][a[1]].l; if (dr === 0 && dc === 1) return !w[a[0]][a[1]].r;
    return false;
  }
  function bfs(w, n, from, to) {
    var q = [from], prev = {}; prev[from.join()] = null;
    while (q.length) {
      var cur = q.shift();
      if (cur[0] === to[0] && cur[1] === to[1]) { var path = [], x = cur; while (x) { path.unshift(x); x = prev[x.join()]; } return path; }
      [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(function (d) {
        var nx = [cur[0] + d[0], cur[1] + d[1]];
        if (nx[0] < 0 || nx[1] < 0 || nx[0] >= n || nx[1] >= n || prev[nx.join()] !== undefined || !openDir(w, cur, nx)) return;
        prev[nx.join()] = cur; q.push(nx);
      });
    }
    return null;
  }
  var MZ = { 1: [3, 3, 0], 2: [4, 4, 0], 3: [5, 3, 0], 4: [5, 2, 2], 5: [6, 2, 3] };   // [الحجم، فتحات إضافية، تفاحات]
  mini('maze', 'mz-stage', 'rabbit', async function (ctx, st, level, demo, alive, setCur) {
    var cfg = MZ[level] || MZ[1], n = cfg[0], w = genMaze(n, cfg[1]), nItems = cfg[2];
    var goal = [n - 1, n - 1], pos = [0, 0], errors = 0, idle = 0, down = false, busy = false, got = 0, bumpKey = '', done, fin = new Promise(function (r) { done = r; });
    var items = [];
    var cells = []; for (var r0 = 0; r0 < n; r0++) for (var c0 = 0; c0 < n; c0++) if ((r0 + c0) > 1 && !(r0 === goal[0] && c0 === goal[1])) cells.push([r0, c0]);
    kit.shuffle(cells).slice(0, nItems).forEach(function (cc) { items.push({ rc: cc, got: false }); });
    st.top.innerHTML = ''; st.tray.innerHTML = '';
    var board = h('div', { class: 'mz-board' }); board.style.setProperty('--n', n);
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) {
      var cl = 'mz-cell' + (w[r][c].t ? ' wt' : '') + (w[r][c].l ? ' wl' : '') + (c === n - 1 ? ' wr' : '') + (r === n - 1 ? ' wb' : '') + ((r + c) % 2 ? ' alt' : '');
      board.appendChild(h('div', { class: cl, 'data-rc': r + ',' + c }));
    }
    function place(el, rc) { el.style.left = rc[1] * 100 / n + '%'; el.style.top = rc[0] * 100 / n + '%'; el.style.width = el.style.height = 100 / n + '%'; }
    var goalEl = h('div', { class: 'mz-item mz-goal', html: pic('carrot') }); place(goalEl, goal); board.appendChild(goalEl);
    items.forEach(function (it) { it.el = h('div', { class: 'mz-item', html: pic('apple') }); place(it.el, it.rc); board.appendChild(it.el); });
    var bun = h('div', { class: 'mz-rabbit', html: pic('rabbit') }); place(bun, pos); board.appendChild(bun);
    st.top.appendChild(board);
    UI.anim(board, [{ opacity: 0, transform: 'scale(.7)' }, { opacity: 1, transform: 'none' }], { dur: 480, easing: UI.SPRING, fill: 'backwards' });
    if (B.audio) B.audio.play('card');
    function target() { var rest = items.filter(function (i) { return !i.got; }); if (rest.length) { var best = null, bl = 1e9; rest.forEach(function (i) { var p = bfs(w, n, pos, i.rc); if (p && p.length < bl) { bl = p.length; best = i.rc; } }); return best; } return goal; }
    function step(to) {
      pos = to; place(bun, pos);
      UI.anim(bun, [{ transform: 'translateY(0)' }, { transform: 'translateY(-14%)' }, { transform: 'translateY(0)' }], { dur: 160, fill: 'none' });
      idle = 0;
      items.forEach(function (it) { if (!it.got && it.rc[0] === pos[0] && it.rc[1] === pos[1]) { it.got = true; got++; it.el.style.visibility = 'hidden'; if (B.audio) B.audio.play('pop'); var c = kit.center(bun, ctx.stage); UI.burst(ctx.stage, c.x, c.y, { n: 8, spread: 50, dur: 700 }); } });
      board.querySelectorAll('.hint').forEach(function (x) { x.classList.remove('hint'); });
      if (pos[0] === goal[0] && pos[1] === goal[1]) {
        if (got >= nItems) done(true);
        else { items.forEach(function (it) { if (!it.got) it.el.classList.add('pulse-hint'); }); UI.anim(bun, [{ transform: 'rotate(0)' }, { transform: 'rotate(-12deg)' }, { transform: 'rotate(12deg)' }, { transform: 'rotate(0)' }], { dur: 500, fill: 'none' }); }
      }
    }
    function cellAt(e) { var r = board.getBoundingClientRect(), s = r.width / n; var c = Math.floor((e.clientX - r.left) / s), rr = Math.floor((e.clientY - r.top) / s); return (c < 0 || rr < 0 || c >= n || rr >= n) ? null : [rr, c]; }
    function move(e) {
      if (!down || busy || ctx.paused) return;
      var rc = cellAt(e); if (!rc || (rc[0] === pos[0] && rc[1] === pos[1])) return;
      var dist = Math.abs(rc[0] - pos[0]) + Math.abs(rc[1] - pos[1]);
      if (dist === 1) {
        if (openDir(w, pos, rc)) step(rc);
        else { var key = rc.join() + '>' + pos.join(); if (key !== bumpKey) { bumpKey = key; errors++; kit.wrong(bun); help(); } }
      } else { var p = bfs(w, n, pos, rc); if (p && p.length <= 4) p.slice(1).forEach(step); }
    }
    var sx = 0, sy = 0, moved = false;
    board.addEventListener('pointerdown', function (e) { if (busy || ctx.paused) return; down = true; sx = e.clientX; sy = e.clientY; moved = false; try { board.setPointerCapture(e.pointerId); } catch (x) {} });
    board.addEventListener('pointermove', function (e) { if (Math.abs(e.clientX - sx) + Math.abs(e.clientY - sy) > 10) moved = true; move(e); });
    ['pointerup', 'pointercancel'].forEach(function (ev) { board.addEventListener(ev, function (e) {
      var was = down; down = false;
      if (was && !moved && ev === 'pointerup' && !busy) { var rc = cellAt(e); if (rc) walkTo(rc); }   // لمسة: يمشي الأرنب إلى الخانة
    }); });
    async function walkTo(rc) {
      var p = bfs(w, n, pos, rc); if (!p || p.length < 2) return;
      busy = true;
      for (var i = 1; i < p.length && alive(); i++) { step(p[i]); await ctx.sleep(170); }
      busy = false;
    }
    function help() {
      if (errors === 3) showHint();
      if (errors >= 6 && !busy) autoWalk();
    }
    function showHint() {
      var t = target(), p = bfs(w, n, pos, t); if (!p) return;
      p.slice(1, 5).forEach(function (rc) { var el = board.querySelector('[data-rc="' + rc.join() + '"]'); if (el) el.classList.add('hint'); });
    }
    async function autoWalk() {
      if (busy) return; busy = true; var tok = 0;
      while (alive() && !(pos[0] === goal[0] && pos[1] === goal[1] && got >= nItems)) {
        var t = target(), p = bfs(w, n, pos, t); if (!p || p.length < 2) break;
        for (var i = 1; i < p.length && alive(); i++) { step(p[i]); await ctx.sleep(190); }
      }
      busy = false;
    }
    st.solve = function () { if (busy) return false; var guard = 0; while (!(pos[0] === goal[0] && pos[1] === goal[1] && got >= nItems) && guard++ < 6) { var p = bfs(w, n, pos, target()); if (!p) break; p.slice(1).forEach(step); } return true; };
    st.stop = function () { done(false); };
    await ctx.sleep(600); if (!alive()) return;
    (async function watch() { while (alive() && !(got >= nItems && pos[0] === goal[0] && pos[1] === goal[1])) { await ctx.sleep(1000); if (ctx.paused || busy) continue; idle++; if (idle === 12) showHint(); if (idle >= 25 && !demo) autoWalk(); } })();
    if (demo) autoWalk();
    await fin; st.solve = null;
    if (!alive()) return;
    UI.anim(bun, [{ transform: 'scale(1)' }, { transform: 'scale(1.4) rotate(-10deg)' }, { transform: 'scale(1) rotate(10deg)' }, { transform: 'scale(1.2)' }, { transform: 'scale(1)' }], { dur: 900, fill: 'none' });
    var gc = kit.center(goalEl, ctx.stage);
    UI.burst(ctx.stage, gc.x, gc.y, { n: 24, spread: 150, dur: 1500 });
    if (B.audio) { B.audio.play('right'); B.audio.play('cheer'); }
    await ctx.sleep(1600); if (!alive()) return;
    return { errors: demo ? 0 : Math.min(errors, 8) };
  });
  B.games.maze._gen = genMaze; B.games.maze._bfs = bfs;
  B.games.missing._parts = MKEYS;
})();
