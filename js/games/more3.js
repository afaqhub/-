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
      cancelRound: function () { runner.cancel(); if (st) { st.top.innerHTML = ''; st.tray.innerHTML = ''; st.answer = null; if (st.stop) st.stop(); st.ctx.stage.querySelectorAll('.kit-hand,.ms-fly,.gw-can,.wt-drop').forEach(function (x) { x.remove(); }); } },
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
    ,
    umbrella: { live: 'sway', slot: [41, 87, 24],
      base: '<path d="M6 52A44 44 0 0 1 94 52Q82 42 72 52Q61 42 50 52Q39 42 28 52Q18 42 6 52Z" fill="#F2658E"/><path d="M50 8A44 44 0 0 1 72 14L61 52H39L28 14A44 44 0 0 1 50 8Z" fill="#FFD34E"/><path d="M50 52V80" stroke="#6B4E86" stroke-width="5" stroke-linecap="round"/>',
      part: '<path d="M50 80a9 9 0 0 1-18 0" fill="none" stroke="#6B4E86" stroke-width="5" stroke-linecap="round"/>', icon: '<path d="M64 12V62a20 20 0 0 1-40 0" fill="none" stroke="#6B4E86" stroke-width="10" stroke-linecap="round"/>' },
    clock: { live: 'blink', slot: [54, 42, 36],
      base: '<circle cx="50" cy="50" r="40" fill="#fff" stroke="#8E5CF0" stroke-width="7"/><circle cx="50" cy="16" r="3.5" fill="#1F2A5A"/><circle cx="84" cy="50" r="3.5" fill="#1F2A5A"/><circle cx="50" cy="84" r="3.5" fill="#1F2A5A"/><circle cx="16" cy="50" r="3.5" fill="#1F2A5A"/>',
      part: '<path d="M50 50V26M50 50L68 58" stroke="#1F2A5A" stroke-width="6" stroke-linecap="round"/><circle cx="50" cy="50" r="5" fill="#F2658E"/>', icon: '<path d="M50 52V14M50 52L84 68" stroke="#1F2A5A" stroke-width="10" stroke-linecap="round"/><circle cx="50" cy="52" r="8" fill="#F2658E"/>' },
    butterfly: { live: 'sway', slot: [70, 50, 44],
      base: '<ellipse cx="50" cy="52" rx="4.5" ry="24" fill="#3A2A3F"/><path d="M48 30Q42 14 34 12M52 30Q58 14 66 12" stroke="#3A2A3F" stroke-width="2.6" fill="none" stroke-linecap="round"/><ellipse cx="30" cy="38" rx="20" ry="23" fill="#B79BFF" transform="rotate(-20 30 38)"/><ellipse cx="34" cy="68" rx="14" ry="15" fill="#F2658E"/><circle cx="28" cy="36" r="6" fill="#fff" opacity=".7"/>',
      part: '<ellipse cx="70" cy="38" rx="20" ry="23" fill="#B79BFF" transform="rotate(20 70 38)"/><ellipse cx="66" cy="68" rx="14" ry="15" fill="#F2658E"/><circle cx="72" cy="36" r="6" fill="#fff" opacity=".7"/>', icon: '<ellipse cx="50" cy="40" rx="30" ry="34" fill="#B79BFF" transform="rotate(20 50 40)"/><ellipse cx="46" cy="76" rx="20" ry="20" fill="#F2658E"/><circle cx="58" cy="36" r="9" fill="#fff" opacity=".7"/>' },
    icecream: { live: 'jump', slot: [50, 76, 36],
      base: '<circle cx="50" cy="34" r="23" fill="#F7A3C0"/><circle cx="35" cy="42" r="13" fill="#F7A3C0"/><circle cx="65" cy="42" r="13" fill="#F7A3C0"/><circle cx="50" cy="12" r="5.5" fill="#F0485A"/><path d="M28 48Q50 60 72 48" stroke="#E27AA0" stroke-width="3" fill="none"/>',
      part: '<path d="M30 54L50 96L70 54Z" fill="#E9B068" stroke="#C98A3F" stroke-width="3" stroke-linejoin="round"/><path d="M38 62L56 80M60 62L42 80" stroke="#C98A3F" stroke-width="2.4"/>', icon: '<path d="M16 14L50 94L84 14Z" fill="#E9B068" stroke="#C98A3F" stroke-width="6" stroke-linejoin="round"/><path d="M32 30L62 66M68 30L38 66" stroke="#C98A3F" stroke-width="4"/>' },
    mug: { live: 'jump', slot: [82, 52, 28],
      base: '<path d="M16 30H70V72Q70 86 56 86H30Q16 86 16 72Z" fill="#5CC8FF" stroke="#2468D1" stroke-width="4" stroke-linejoin="round"/><path d="M30 20Q24 12 30 6M44 20Q38 12 44 6M58 20Q52 12 58 6" stroke="#B9C6E8" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M26 42H60" stroke="#fff" stroke-width="4" opacity=".6" stroke-linecap="round"/>',
      part: '<path d="M70 38H80Q93 38 93 52T80 66H70" fill="none" stroke="#2468D1" stroke-width="7" stroke-linecap="round"/>', icon: '<path d="M16 24H46Q86 24 86 50T46 76H16" fill="none" stroke="#2468D1" stroke-width="12" stroke-linecap="round"/>' },
    apple: { live: 'blink', slot: [66, 17, 26],
      base: '<path d="M50 30C30 20 10 36 14 60C18 84 40 94 50 88C60 94 82 84 86 60C90 36 70 20 50 30Z" fill="#F0485A"/><path d="M26 44Q24 56 30 66" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none" opacity=".5"/><path d="M50 30V16" stroke="#8A5A33" stroke-width="5" stroke-linecap="round"/>',
      part: '<path d="M52 22Q64 6 82 12Q74 30 52 22Z" fill="#2DBE7E"/><path d="M54 20Q66 14 76 14" stroke="#1C8F5C" stroke-width="2" fill="none"/>', icon: '<path d="M14 62Q22 10 88 14Q80 78 14 62Z" fill="#2DBE7E"/><path d="M20 58Q50 40 80 20" stroke="#1C8F5C" stroke-width="4" fill="none"/>' }
  };
  var MKEYS = Object.keys(MP);
  mini('missing', 'ms-stage', 'bear', async function (ctx, st, level, demo, alive, setCur) {
    var n = level <= 1 ? 2 : level <= 3 ? 3 : 4;
    st.used = st.used || [];
    var free = MKEYS.filter(function (x) { return st.used.indexOf(x) < 0; });
    if (!free.length) { st.used = []; free = MKEYS.filter(function (x) { return x !== st.last; }); }   // لا تكرار حتى تُستنفد كل الصور
    var k = kit.pick(free); st.last = k; st.used.push(k);
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

  function dropSvg() { return art.svg('0 0 40 56', '<path d="M20 4Q4 28 4 38a16 16 0 0 0 32 0Q36 28 20 4Z" fill="#5CC8FF" stroke="#2468D1" stroke-width="3"/><ellipse cx="14" cy="36" rx="4" ry="6" fill="#fff" opacity=".6"/>', 'wt-drop-svg'); }
  var WSEQ = { 1: ['seed', 'water'], 2: ['seed', 'water', 'sun'], 3: ['seed', 'water', 'sun', 'water'], 4: ['seed', 'sun', 'water', 'water', 'sun'], 5: ['seed', 'water', 'sun', 'water', 'sun', 'water'] };
  var WDIST = ['apple', 'ball', 'key', 'book', 'umbrella', 'carrot'];
  /* جولة «نمو»: بذرة ثم ماء (وشمس) — صارت واحدة من ٧ أنواع جولات متنوعة */
  async function growRound(ctx, st, level, demo, alive, setCur) {
    var steps = WSEQ[level] || WSEQ[1], col = kit.pick(BLOOMS), done = 0, errors = 0;
    st.top.innerHTML = ''; st.tray.innerHTML = '';
    var scene = h('div', { class: 'wt-scene' });
    var plant = h('div', { class: 'wt-plant' }); var pot = h('div', { class: 'wt-pot', html: potSvg() });
    var bubble = h('div', { class: 'wt-bubble' });
    scene.appendChild(plant); scene.appendChild(pot); scene.appendChild(bubble);
    st.top.appendChild(scene);
    UI.anim(scene, [{ opacity: 0, transform: 'scale(.8)' }, { opacity: 1, transform: 'none' }], { dur: 450, easing: UI.SPRING, fill: 'backwards' });
    if (B.audio) B.audio.play('card');
    function stageNow() { var total = steps.length - 1, p = done / total; return done === 0 ? 0 : Math.min(3, Math.max(1, Math.ceil(p * 3))); }
    function grow() {
      plant.innerHTML = plantSvg(stageNow(), col);
      var s = plant.firstChild; if (s) UI.anim(s, [{ transform: 'scaleY(.3)', transformOrigin: '50% 100%' }, { transform: 'scaleY(1.08)', transformOrigin: '50% 100%' }, { transform: 'scaleY(1)', transformOrigin: '50% 100%' }], { dur: 700, easing: UI.SPRING, fill: 'none' });
    }
    function toolHtml(k) { return k === 'seed' ? seedSvg() : k === 'water' ? canSvg() : k === 'sun' ? art.sun() : pic(k); }
    function needHtml(k) { return k === 'seed' ? pic('leaf') : k === 'water' ? dropSvg() : pic('sun'); }
    function sceneXY(el) { var c = kit.center(el, ctx.stage), s = kit.center(scene, ctx.stage); return { x: c.x, y: c.y, sx: s.x, sy: s.y }; }
    async function effect(k, btn) {
      var potC = kit.center(pot, ctx.stage), from = kit.center(btn, ctx.stage), sr = scene.getBoundingClientRect(), stg = ctx.stage.getBoundingClientRect();
      if (k === 'seed') {
        var f = h('div', { class: 'wt-fly', style: { left: from.x - 30 + 'px', top: from.y - 30 + 'px' }, html: seedSvg() }); ctx.stage.appendChild(f);
        await ctx.anim(f, [{ transform: 'translate(0,0)' }, { transform: 'translate(' + (potC.x - from.x) * 0.5 + 'px,' + (potC.y - from.y - 120) + 'px)', offset: 0.5 }, { transform: 'translate(' + (potC.x - from.x) + 'px,' + (potC.y - from.y - 20) + 'px) scale(.5)', opacity: 0.2 }], { dur: 750, easing: 'ease-in' });
        f.remove(); if (B.audio) B.audio.play('place'); pot.querySelector('.wt-soil').setAttribute('fill', '#6B4426');
      } else if (k === 'water') {
        // الإبريق يقف على يسار الأصيص ومَصبّه نحو النبتة، ثم يميل ويصبّ
        var cn = h('div', { class: 'wt-can-fly', html: canSvg() }); scene.appendChild(cn);
        await ctx.anim(cn, [{ opacity: 0, transform: 'translate(-40px,30px) rotate(0)' }, { opacity: 1, transform: 'translate(0,0) rotate(0)' }], { dur: 350, easing: UI.SPRING, fill: 'forwards' });
        await ctx.anim(cn, [{ transform: 'translate(0,0) rotate(0)' }, { transform: 'translate(0,-6px) rotate(32deg)' }], { dur: 350, fill: 'forwards' });
        var cr = cn.getBoundingClientRect(), pr = pot.getBoundingClientRect();
        var sx0 = cr.right - sr.left - cr.width * 0.12, sy0 = cr.top - sr.top + cr.height * 0.55;
        for (var i = 0; i < 8; i++) {
          var d = h('span', { class: 'wt-drop', style: { left: sx0 + (i % 2) * 6 + 'px', top: sy0 + 'px' } }); scene.appendChild(d);
          UI.anim(d, [{ transform: 'translate(0,0)', opacity: 1 }, { transform: 'translate(' + (pr.left + pr.width * 0.3 - sr.left - sx0) + 'px,' + (pr.top - sr.top - sy0 + 6) + 'px)', opacity: 1, offset: 0.85 }, { transform: 'translate(' + (pr.left + pr.width * 0.3 - sr.left - sx0) + 'px,' + (pr.top - sr.top - sy0 + 18) + 'px)', opacity: 0 }], { dur: 650, delay: i * 80, easing: 'ease-in' }).then((function (x) { return function () { x.remove(); }; })(d));
        }
        if (B.audio) B.audio.play('splash');
        await ctx.sleep(1000);
        pot.querySelector('.wt-soil').setAttribute('fill', '#4A2E18');
        await ctx.anim(cn, [{ transform: 'translate(0,-6px) rotate(32deg)', opacity: 1 }, { transform: 'translate(-30px,20px) rotate(0)', opacity: 0 }], { dur: 350, fill: 'forwards' });
        cn.remove();
      } else { // الشمس
        var sn = h('div', { class: 'wt-sun-fly', html: art.sun() }); scene.appendChild(sn);
        await ctx.anim(sn, [{ opacity: 0, transform: 'translate(-60px,-60px) scale(.5)' }, { opacity: 1, transform: 'translate(0,0) scale(1)' }], { dur: 600, easing: UI.SPRING, fill: 'forwards' });
        if (B.audio) B.audio.play('sparkle');
        UI.burst(ctx.stage, kit.center(plant, ctx.stage).x, kit.center(plant, ctx.stage).y - 40, { n: 12, spread: 90, dur: 900, colors: ['#FFD34E', '#FFF0A6'] });
        await ctx.anim(sn, [{ transform: 'translate(0,0) scale(1) rotate(0)' }, { transform: 'translate(0,0) scale(1.15) rotate(90deg)' }], { dur: 900, fill: 'forwards' });
        await ctx.anim(sn, [{ opacity: 1 }, { opacity: 0 }], { dur: 300, fill: 'forwards' }); sn.remove();
      }
    }
    st.solve = null;
    await ctx.sleep(500); if (!alive()) return;
    for (var si = 0; si < steps.length; si++) {
      var k = steps[si];
      bubble.innerHTML = needHtml(k); bubble.style.display = '';
      UI.anim(bubble, [{ opacity: 0, transform: 'scale(.3)' }, { opacity: 1, transform: 'none' }], { dur: 420, easing: UI.SPRING, fill: 'backwards' });
      var dist = kit.shuffle(WDIST.slice()).slice(0, 2), keys = kit.shuffle([k].concat(dist));
      var btns = addBtns(st, keys.map(toolHtml));
      var res = await ask(ctx, st, btns, keys.indexOf(k), demo, alive, setCur); if (!res) return;
      errors += res.errors || 0;
      btns.forEach(function (b, i) { if (i !== keys.indexOf(k)) b.classList.add('faded'); });
      bubble.style.display = 'none';
      await effect(k, btns[keys.indexOf(k)]); if (!alive()) return;
      done++; if (k !== 'seed' || true) grow();
      if (B.audio) B.audio.play('pop');
      await ctx.sleep(350); if (!alive()) return;
    }
    // الزهرة تتفتح، وفراشة تزورها
    var pc = kit.center(plant, ctx.stage);
    UI.burst(ctx.stage, pc.x, pc.y - 40, { n: 24, spread: 150, dur: 1500, colors: [col[0], col[1], '#fff', '#FFD34E'] });
    if (B.audio) B.audio.play('cheer');
    var bf = h('div', { class: 'wt-bf', html: art.gameIcon('mirror') }); scene.appendChild(bf);
    UI.anim(bf, [{ transform: 'translate(-120%,-80%) scale(.5)', opacity: 0 }, { transform: 'translate(0,-30%) scale(1)', opacity: 1, offset: 0.4 }, { transform: 'translate(20%,-60%) scale(1)', offset: 0.7 }, { transform: 'translate(160%,-120%) scale(.6)', opacity: 0 }], { dur: 2000, fill: 'none' });
    UI.anim(plant, [{ transform: 'translateX(-50%) rotate(0)' }, { transform: 'translateX(-50%) rotate(-5deg)' }, { transform: 'translateX(-50%) rotate(5deg)' }, { transform: 'translateX(-50%) rotate(0)' }], { dur: 1400, fill: 'none' });
    await ctx.sleep(2100); if (!alive()) return;
    return { errors: demo ? 0 : Math.min(errors, 4) };
  }

  /* ═════════ جولات الحديقة المتنوعة (كل جولة فكرة مختلفة) ═════════ */
  function ladybug() { return sv('<ellipse cx="50" cy="56" rx="30" ry="26" fill="#F0485A"/><path d="M50 30V82" stroke="#1F2A5A" stroke-width="4"/><circle cx="38" cy="50" r="5" fill="#1F2A5A"/><circle cx="62" cy="50" r="5" fill="#1F2A5A"/><circle cx="40" cy="68" r="4.5" fill="#1F2A5A"/><circle cx="60" cy="68" r="4.5" fill="#1F2A5A"/><circle cx="50" cy="28" r="12" fill="#1F2A5A"/>'); }
  function basketSvg() { return sv('<path d="M10 40H90L80 90H20Z" fill="#E9B068" stroke="#C98A3F" stroke-width="5" stroke-linejoin="round"/><path d="M26 40V90M42 40V90M58 40V90M74 40V90" stroke="#C98A3F" stroke-width="3"/>'); }
  function treeSvg() { return sv('<rect x="42" y="56" width="16" height="40" rx="5" fill="#8A5A33"/><circle cx="50" cy="34" r="30" fill="#2DBE7E"/><circle cx="26" cy="46" r="20" fill="#2DBE7E"/><circle cx="74" cy="46" r="20" fill="#2DBE7E"/>'); }
  function toolH(k) { return k === 'water' ? canSvg() : k === 'sun' ? art.sun() : k === 'seed' ? seedSvg() : pic(k); }

  /* محرّك «اضغط الأهداف الصحيحة»: يدير الأخطاء وسلّم المساعدة (نبض ثم كفّ) وعرض التجربة */
  async function targetsRound(ctx, st, items, demo, alive, hintMsg) {
    var errors = 0, idle = 0, busy = false, left = items.filter(function (i) { return i.ok; }).length, finish, fin = new Promise(function (r) { finish = r; });
    function pending() { return items.filter(function (i) { return i.ok && !i.done; })[0]; }
    async function hit(it) {
      if (busy || it.done) return; busy = true; idle = 0;
      it.done = true; it.el.classList.remove('pulse-hint');
      try { await it.run(); } catch (e) {}
      busy = false; left--; if (left <= 0) finish(true);
    }
    items.forEach(function (it) {
      it.el.addEventListener('click', function () {
        if (busy || ctx.paused) return;
        if (it.ok) hit(it);
        else { errors++; idle = 0; if (B.audio) B.audio.play('wrong'); kit.wrong(it.el); if (hintMsg && st.msg) st.msg.textContent = hintMsg; }
      });
    });
    st.solve = function () { var p = pending(); if (!p || busy) return false; hit(p); return true; };
    st.stop = function () { finish(false); };
    (async function watch() {
      while (alive() && left > 0) {
        await ctx.sleep(1000); if (ctx.paused || busy) continue; idle++;
        var p = pending(); if (!p) break;
        if (idle === 6) { p.el.classList.add('pulse-hint'); errors++; }
        if (idle >= 12 || (demo && idle >= 2)) {
          var c = kit.center(p.el, ctx.stage), hd = kit.hand(ctx.stage, c.x, c.y);
          await ctx.sleep(500); await hd.tap(); hd.el.remove(); idle = 0; if (!busy && !p.done) hit(p);
        }
      }
    })();
    await fin; st.solve = null;
    return { errors: demo ? 0 : Math.min(errors, 4) };
  }

  var BLOOM = BLOOMS;
  function plantEl(col, wilt) {
    var d = h('div', { class: 'gw-plant' + (wilt ? ' wilt' : ''), role: 'button', tabindex: '0' }, h('div', { class: 'gw-flower', html: plantSvg(3, col) }), h('div', { class: 'gw-pot', html: potSvg() }));
    if (wilt) d.appendChild(h('div', { class: 'gw-need', html: dropSvg() }));
    return d;
  }
  async function waterPlant(ctx, st, pl) {
    var c0 = kit.center(pl, ctx.stage);
    var cn = h('div', { class: 'gw-can', html: canSvg(), style: { left: (c0.x - 150) + 'px', top: (c0.y - 120) + 'px' } }); ctx.stage.appendChild(cn);
    await ctx.anim(cn, [{ opacity: 0, transform: 'translate(-30px,20px) rotate(0)' }, { opacity: 1, transform: 'translate(0,0) rotate(0)' }], { dur: 300, fill: 'forwards' });
    await ctx.anim(cn, [{ transform: 'translate(0,0) rotate(0)' }, { transform: 'translate(10px,-4px) rotate(30deg)' }], { dur: 300, fill: 'forwards' });
    if (B.audio) B.audio.play('splash');
    for (var i = 0; i < 6; i++) {
      var d = h('span', { class: 'wt-drop', style: { left: (c0.x - 70 + (i % 2) * 6) + 'px', top: (c0.y - 100) + 'px', position: 'absolute' } }); ctx.stage.appendChild(d);
      UI.anim(d, [{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(70px)', opacity: 0 }], { dur: 600, delay: i * 70, easing: 'ease-in' }).then((function (x) { return function () { x.remove(); }; })(d));
    }
    await ctx.sleep(750);
    pl.classList.remove('wilt'); var nd = pl.querySelector('.gw-need'); if (nd) nd.remove();
    UI.anim(pl.querySelector('.gw-flower'), [{ transform: 'scale(.8)' }, { transform: 'scale(1.12)' }, { transform: 'scale(1)' }], { dur: 500, fill: 'none' });
    if (B.audio) B.audio.play('pop');
    await ctx.anim(cn, [{ opacity: 1 }, { opacity: 0 }], { dur: 250, fill: 'forwards' }); cn.remove();
  }

  var ROUNDS = {
    grow: growRound,
    /* ١) ساعد الظمآنة: اسقِ الزهور الذابلة فقط */
    thirsty: async function (ctx, st, level, demo, alive, setCur) {
      var n = level <= 2 ? 3 : level <= 4 ? 4 : 5, k = Math.min(n - 1, level <= 2 ? 2 : 3);
      st.top.innerHTML = ''; st.tray.innerHTML = '';
      st.msg = null;
      var cols = kit.shuffle(BLOOMS.slice()), idx = kit.shuffle(Array.apply(null, Array(n)).map(function (_, q) { return q; }));
      var wiltSet = idx.slice(0, k), row = h('div', { class: 'gw-row' }), items = [];
      for (var i = 0; i < n; i++) { (function (i) { var wl = wiltSet.indexOf(i) >= 0, pl = plantEl(cols[i % cols.length], wl); row.appendChild(pl); items.push({ el: pl, ok: wl, run: function () { return waterPlant(ctx, st, pl); } }); })(i); }
      st.top.appendChild(row); UI.anim(row, [{ opacity: 0, transform: 'scale(.8)' }, { opacity: 1, transform: 'none' }], { dur: 450, easing: UI.SPRING, fill: 'backwards' });
      if (B.audio) B.audio.play('card');
      await ctx.sleep(500); if (!alive()) return;
      var r = await targetsRound(ctx, st, items, demo, alive); if (!alive()) return;
      await cheer(ctx, row); return r;
    },
    /* ٢) اقطف الناضجة: التفاح الأحمر فقط */
    ripe: async function (ctx, st, level, demo, alive, setCur) {
      var total = level <= 2 ? 5 : 6, ripeN = level <= 2 ? 2 : level <= 4 ? 3 : 4;
      st.top.innerHTML = ''; st.tray.innerHTML = '';
      var slots = kit.shuffle([[34, 26], [58, 22], [44, 44], [70, 40], [24, 46], [52, 56], [76, 58]]).slice(0, total);
      var scene = h('div', { class: 'gw-tree' }, h('div', { class: 'gw-tree-art', html: treeSvg() })), basket = h('div', { class: 'gw-basket', html: basketSvg() }), cnt = h('b', { class: 'gw-cnt', text: UI.num(0) }); basket.appendChild(cnt);
      var picked = 0, items = [], rp = kit.shuffle(slots.map(function (_, i) { return i; })).slice(0, ripeN);
      slots.forEach(function (s, i) {
        var ok = rp.indexOf(i) >= 0;
        var ap = h('div', { class: 'gw-apple ' + (ok ? 'ripe' : 'green'), role: 'button', tabindex: '0', style: { left: s[0] + '%', top: s[1] + '%' }, html: pic('apple') });
        scene.appendChild(ap);
        items.push({ el: ap, ok: ok, run: async function () {
          var from = kit.center(ap, ctx.stage), to = kit.center(basket, ctx.stage);
          if (B.audio) B.audio.play('pop');
          await ctx.anim(ap, [{ transform: 'translate(0,0) scale(1)' }, { transform: 'translate(' + (to.x - from.x) + 'px,' + (to.y - from.y) + 'px) scale(.6)' }], { dur: 600, easing: 'ease-in', fill: 'forwards' });
          ap.style.visibility = 'hidden'; picked++; cnt.textContent = UI.num(picked); UI.anim(basket, [{ transform: 'scale(1)' }, { transform: 'scale(1.15)' }, { transform: 'scale(1)' }], { dur: 300 });
        } });
      });
      scene.appendChild(basket); st.top.appendChild(scene);
      UI.anim(scene, [{ opacity: 0, transform: 'scale(.85)' }, { opacity: 1, transform: 'none' }], { dur: 450, easing: UI.SPRING, fill: 'backwards' });
      if (B.audio) B.audio.play('card');
      await ctx.sleep(500); if (!alive()) return;
      var r = await targetsRound(ctx, st, items, demo, alive); if (!alive()) return;
      await cheer(ctx, basket); return r;
    },
    /* ٣) أبعد الدعسوقات عن الزهرة */
    bugs: async function (ctx, st, level, demo, alive, setCur) {
      var n = level <= 2 ? 2 : level <= 4 ? 3 : 4;
      st.top.innerHTML = ''; st.tray.innerHTML = '';
      var col = kit.pick(BLOOMS), scene = h('div', { class: 'gw-bugscene' }, h('div', { class: 'gw-big', html: plantSvg(3, col) })), items = [];
      var spots = kit.shuffle([[34, 22], [62, 24], [48, 12], [30, 42], [66, 44], [48, 34]]).slice(0, n);
      spots.forEach(function (s, i) {
        var bg = h('div', { class: 'gw-bug', role: 'button', tabindex: '0', style: { left: s[0] + '%', top: s[1] + '%', animationDelay: (i * 0.4) + 's' }, html: ladybug() });
        scene.appendChild(bg);
        items.push({ el: bg, ok: true, run: async function () {
          if (B.audio) B.audio.play('flutter');
          await ctx.anim(bg, [{ transform: 'translate(0,0) rotate(0)', opacity: 1 }, { transform: 'translate(' + (i % 2 ? 160 : -160) + 'px,-200px) rotate(' + (i % 2 ? 360 : -360) + 'deg)', opacity: 0 }], { dur: 700, easing: 'ease-in', fill: 'forwards' });
        } });
      });
      st.top.appendChild(scene); UI.anim(scene, [{ opacity: 0, transform: 'scale(.85)' }, { opacity: 1, transform: 'none' }], { dur: 450, easing: UI.SPRING, fill: 'backwards' });
      if (B.audio) B.audio.play('card');
      await ctx.sleep(500); if (!alive()) return;
      var r = await targetsRound(ctx, st, items, demo, alive); if (!alive()) return;
      UI.anim(scene.firstChild, [{ transform: 'scale(1)' }, { transform: 'scale(1.1) rotate(-3deg)' }, { transform: 'scale(1) rotate(3deg)' }, { transform: 'scale(1)' }], { dur: 800, fill: 'none' });
      await cheer(ctx, scene); return r;
    },
    /* ٤) ماذا تحتاج؟ اختر الأداة المناسبة للحالة */
    need: async function (ctx, st, level, demo, alive, setCur) {
      var S = kit.pick([{ k: 'water', say: 'ذابلة وعطشى', wilt: true }, { k: 'sun', say: 'باردة تحت الغيم', cloud: true }]);
      st.top.innerHTML = ''; st.tray.innerHTML = '';
      var col = kit.pick(BLOOMS), sc = h('div', { class: 'gw-needscene' + (S.cloud ? ' cold' : '') }, h('div', { class: 'gw-big' + (S.wilt ? ' wilt' : ''), html: plantSvg(S.wilt ? 3 : 2, col) }));
      if (S.cloud) sc.appendChild(h('div', { class: 'gw-cloud', html: pic('cloud') }));
      st.top.appendChild(sc); UI.anim(sc, [{ opacity: 0, transform: 'scale(.85)' }, { opacity: 1, transform: 'none' }], { dur: 450, easing: UI.SPRING, fill: 'backwards' });
      if (B.audio) B.audio.play('card');
      await ctx.sleep(600); if (!alive()) return;
      var dist = kit.shuffle(['apple', 'ball', 'key', 'book', 'umbrella'].filter(function (x) { return x !== 'umbrella' || S.k !== 'water'; })).slice(0, 2), keys = kit.shuffle([S.k].concat(dist));
      var btns = addBtns(st, keys.map(toolH));
      var res = await ask(ctx, st, btns, keys.indexOf(S.k), demo, alive, setCur); if (!res) return;
      btns.forEach(function (b, i) { if (i !== keys.indexOf(S.k)) b.classList.add('faded'); });
      if (S.k === 'water') { var big = sc.firstChild; await ctx.sleep(300); big.classList.remove('wilt'); if (B.audio) B.audio.play('splash'); }
      else { var cl = sc.querySelector('.gw-cloud'); if (cl) UI.anim(cl, [{ opacity: 1 }, { opacity: 0, transform: 'translateX(120px)' }], { dur: 700, fill: 'forwards' }); sc.classList.remove('cold'); if (B.audio) B.audio.play('sparkle'); }
      await cheer(ctx, sc); return { errors: demo ? 0 : res.errors };
    },
    /* ٥) رتّب مراحل النمو */
    order: async function (ctx, st, level, demo, alive, setCur) {
      st.top.innerHTML = ''; st.tray.innerHTML = '';
      var col = kit.pick(BLOOMS), stages = [seedSvg(), plantSvg(1, col), plantSvg(3, col)], ord = kit.shuffle([0, 1, 2]), nextI = 0, errors = 0, wrongRun = 0;
      var ttl = h('div', { class: 'gw-order-q', text: B.S.water.orderQ }); st.top.appendChild(ttl);
      var btns = addBtns(st, ord.map(function (i) { return stages[i]; }), 'pic'), fin, pr = new Promise(function (r) { fin = r; });
      btns.forEach(function (b, bi) {
        b.addEventListener('click', function () {
          if (b.classList.contains('faded')) return;
          if (ord[bi] === nextI) { nextI++; wrongRun = 0; b.classList.add('faded'); b.appendChild(h('em', { class: 'st-num', text: UI.num(nextI) })); b.classList.remove('faded'); b.style.pointerEvents = 'none'; if (B.audio) B.audio.play('place'); b.classList.remove('pulse-hint'); if (nextI === 3) fin(true); }
          else { errors++; wrongRun++; if (B.audio) B.audio.play('wrong'); kit.wrong(b); if (wrongRun >= 2) { var nb = btns[ord.indexOf(nextI)]; nb.classList.add('pulse-hint'); } }
        });
      });
      st.solve = function () { if (nextI >= 3) return false; btns[ord.indexOf(nextI)].click(); return true; };
      st.stop = function () { fin(false); };
      if (demo) (async function () { while (alive() && nextI < 3) { await ctx.sleep(1500); if (nextI < 3 && !ctx.paused) { var c = kit.center(btns[ord.indexOf(nextI)], ctx.stage), hd = kit.hand(ctx.stage, c.x, c.y); await hd.tap(); hd.el.remove(); btns[ord.indexOf(nextI)].click(); } } })();
      await pr; st.solve = null; if (!alive()) return;
      await cheer(ctx, ttl); return { errors: demo ? 0 : Math.min(errors, 4) };
    },
    /* ٦) كم زهرة؟ */
    count: async function (ctx, st, level, demo, alive, setCur) {
      var n = kit.rand(Math.min(5, level + 2)) + 1;
      st.top.innerHTML = ''; st.tray.innerHTML = '';
      var meadow = h('div', { class: 'gw-meadow' }), cols = BLOOMS;
      var spots = kit.shuffle([[14, 40], [36, 56], [58, 38], [80, 54], [26, 20], [70, 18]]).slice(0, n);
      spots.forEach(function (s, i) { var f = h('div', { class: 'gw-mf', style: { left: s[0] + '%', top: s[1] + '%', animationDelay: (i * 0.3) + 's' }, html: plantSvg(3, cols[i % cols.length]) }); meadow.appendChild(f); });
      st.top.appendChild(meadow); UI.anim(meadow, [{ opacity: 0, transform: 'scale(.85)' }, { opacity: 1, transform: 'none' }], { dur: 450, easing: UI.SPRING, fill: 'backwards' });
      if (B.audio) B.audio.play('card');
      await ctx.sleep(900); if (!alive()) return;
      var opts = [n]; kit.shuffle([1, 2, 3, 4, 5, 6].filter(function (x) { return x !== n; })).forEach(function (x) { if (opts.length < 3) opts.push(x); }); opts = kit.shuffle(opts);
      var btns = addBtns(st, opts.map(function (x) { return '<span class="gw-numl">' + UI.num(x) + '</span>'; }), 'num');
      var res = await ask(ctx, st, btns, opts.indexOf(n), demo, alive, setCur); if (!res) return;
      btns.forEach(function (b, i) { if (i !== opts.indexOf(n)) b.classList.add('faded'); });
      await cheer(ctx, meadow); return { errors: demo ? 0 : res.errors };
    }
  };
  var WTYPES = ['grow', 'thirsty', 'ripe', 'need', 'order', 'bugs', 'count'];
  mini('water', 'wt-stage', 'rabbit', async function (ctx, st, level, demo, alive, setCur) {
    if (!st.bag || !st.bag.length) { st.bag = kit.shuffle(WTYPES.slice()); if (st.lastT && st.bag[st.bag.length - 1] === st.lastT) st.bag.unshift(st.bag.pop()); }
    var tp = st.bag.pop(); st.lastT = tp;
    if (demo) tp = 'thirsty';
    return ROUNDS[tp](ctx, st, level, demo, alive, setCur);
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
    var need = null;
    if (nItems > 0) {
      need = h('div', { class: 'mz-need' }, items.map(function (it) { it.dot = h('span', { class: 'mz-nd', html: pic('apple') }); return it.dot; }), h('span', { class: 'mz-arrow', text: '→' }), h('span', { class: 'mz-nd mz-nc', html: pic('carrot') }));
      st.top.appendChild(need);
      goalEl.classList.add('locked');
    }
    function refreshNeed() {
      if (!need) return;
      items.forEach(function (it) { it.dot.classList.toggle('got', !!it.got); });
      if (got >= nItems && goalEl.classList.contains('locked')) { goalEl.classList.remove('locked'); need.querySelector('.mz-nc').classList.add('got'); UI.anim(goalEl, [{ transform: 'scale(1)' }, { transform: 'scale(1.35)' }, { transform: 'scale(1)' }], { dur: 600, fill: 'none' }); }
    }
    st.top.appendChild(board);
    UI.anim(board, [{ opacity: 0, transform: 'scale(.7)' }, { opacity: 1, transform: 'none' }], { dur: 480, easing: UI.SPRING, fill: 'backwards' });
    if (B.audio) B.audio.play('card');
    function target() { var rest = items.filter(function (i) { return !i.got; }); if (rest.length) { var best = null, bl = 1e9; rest.forEach(function (i) { var p = bfs(w, n, pos, i.rc); if (p && p.length < bl) { bl = p.length; best = i.rc; } }); return best; } return goal; }
    function step(to) {
      pos = to; place(bun, pos);
      UI.anim(bun, [{ transform: 'translateY(0)' }, { transform: 'translateY(-14%)' }, { transform: 'translateY(0)' }], { dur: 160, fill: 'none' });
      idle = 0;
      items.forEach(function (it) { if (!it.got && it.rc[0] === pos[0] && it.rc[1] === pos[1]) { it.got = true; got++; it.el.style.visibility = 'hidden'; if (B.audio) B.audio.play('pop'); var c = kit.center(bun, ctx.stage); UI.burst(ctx.stage, c.x, c.y, { n: 8, spread: 50, dur: 700 }); } });
      refreshNeed();
      board.querySelectorAll('.hint').forEach(function (x) { x.classList.remove('hint'); });
      if (pos[0] === goal[0] && pos[1] === goal[1]) {
        if (got >= nItems) done(true);
        else { items.forEach(function (it) { if (!it.got) it.el.classList.add('pulse-hint'); }); if (need) UI.anim(need, [{ transform: 'scale(1)' }, { transform: 'scale(1.12)' }, { transform: 'scale(1)' }], { dur: 600, fill: 'none' }); UI.anim(bun, [{ transform: 'rotate(0)' }, { transform: 'rotate(-12deg)' }, { transform: 'rotate(12deg)' }, { transform: 'rotate(0)' }], { dur: 500, fill: 'none' }); }
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
      }
    }
    var sx = 0, sy = 0, moved = false;
    board.addEventListener('pointerdown', function (e) { if (busy || ctx.paused) return; down = true; sx = e.clientX; sy = e.clientY; moved = false; try { board.setPointerCapture(e.pointerId); } catch (x) {} });
    board.addEventListener('pointermove', function (e) { if (Math.abs(e.clientX - sx) + Math.abs(e.clientY - sy) > 10) moved = true; move(e); });
    ['pointerup', 'pointercancel'].forEach(function (ev) { board.addEventListener(ev, function (e) {
      var was = down; down = false;
      if (was && !moved && ev === 'pointerup' && !busy) { var rc = cellAt(e); if (rc) stepToward(rc); }   // لمسة: خطوة واحدة نحو الخانة، ولا يخترق سياجاً
    }); });
    function stepToward(rc) {   // لمسة: يتحرك فقط إن كانت الخانة المجاورة المفتوحة مباشرة، وإلا يهتز الأرنب
      if (rc[0] === pos[0] && rc[1] === pos[1]) return;
      var dist = Math.abs(rc[0] - pos[0]) + Math.abs(rc[1] - pos[1]);
      if (dist === 1 && openDir(w, pos, rc)) { step(rc); return; }
      errors++; kit.wrong(bun); help();
    }
    function help() {
      if (errors === 3) showHint();
      if (errors >= 6 && !busy) showHint(true);   // لا يمشي عنه: يُظهر الطريق مضاءً ويكمل الطفل بنفسه
    }
    function showHint(long) {
      var t = target(), p = bfs(w, n, pos, t); if (!p) return;
      p.slice(1, long ? 10 : 5).forEach(function (rc) { var el = board.querySelector('[data-rc="' + rc.join() + '"]'); if (el) el.classList.add('hint'); });
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
    (async function watch() { while (alive() && !(got >= nItems && pos[0] === goal[0] && pos[1] === goal[1])) { await ctx.sleep(1000); if (ctx.paused || busy) continue; idle++; if (idle === 12) showHint(); if (idle >= 25 && !demo) showHint(true); } })();
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

  /* ═════════════════ قلّد حركتي (مع أبي وأمي) ═════════════════
     الحيوان يؤدّي حركة والطفل ووالده يؤدّيانها معه، ويضغط الطفل دائرة عند كل مرة. لا كاميرا ولا تحقّق: متعة حركية. */
  var MOVES = [
    { id: 'jump', cue: 'اقفز', fx: 'mm-jump' }, { id: 'clap', cue: 'صفّق', fx: 'mm-clap' }, { id: 'spin', cue: 'لفّ حول نفسك', fx: 'mm-spin' },
    { id: 'stretch', cue: 'مدّ يديك إلى السماء', fx: 'mm-stretch' }, { id: 'stomp', cue: 'اضرب الأرض بقدمك', fx: 'mm-stomp' }, { id: 'wave', cue: 'لوّح بيدك', fx: 'mm-wave' }
  ];
  var MIMICS = ['bear', 'rabbit', 'duck', 'frog', 'cat', 'fox'];
  mini('mimic', 'mm-stage', 'bear', async function (ctx, st, level, demo, alive, setCur) {
    var mv; do { mv = kit.pick(MOVES); } while (mv.id === st.last); st.last = mv.id;
    var n = level <= 1 ? 2 : level <= 3 ? 3 : level === 4 ? 4 : 5, an = kit.pick(MIMICS), done = 0, idle = 0, busy = false, errors = 0, fin, pr = new Promise(function (r) { fin = r; });
    st.top.innerHTML = ''; st.tray.innerHTML = '';
    var ch = h('div', { class: 'mm-char', html: pic(an) }), cue = h('div', { class: 'mm-cue', text: mv.cue + ' ' + (n === 1 ? 'مرة واحدة' : UI.num(n) + ' مرات') + '!' });
    var row = h('div', { class: 'mm-dots' });
    var dots = [];
    for (var i = 0; i < n; i++) { var d = h('button', { class: 'mm-dot', type: 'button', 'aria-label': 'عدّ' }, h('span', { html: pic('star') })); dots.push(d); row.appendChild(d); }
    st.top.appendChild(h('div', { class: 'mm-wrap' }, cue, ch, row));
    UI.anim(ch, [{ opacity: 0, transform: 'scale(.4)' }, { opacity: 1, transform: 'none' }], { dur: 450, easing: UI.SPRING, fill: 'backwards' });
    if (B.audio) B.audio.play('card');
    await ctx.sleep(700); if (!alive()) return;
    ch.classList.add(mv.fx);                    // الحيوان يؤدّي الحركة بإيقاع ثابت
    function next() { return dots[done]; }
    dots.forEach(function (d, k) {
      d.addEventListener('click', function () {
        if (busy || ctx.paused) return;
        if (k !== done) { errors++; if (B.audio) B.audio.play('wrong'); kit.wrong(d); return; }
        busy = true; idle = 0; d.classList.add('on'); d.classList.remove('pulse-hint'); done++;
        if (B.audio) B.audio.play(['pop', 'place', 'pick'][done % 3]); UI.burst(ctx.stage, kit.center(d, ctx.stage).x, kit.center(d, ctx.stage).y, { n: 6, spread: 40, dur: 500 });
        busy = false; if (done >= n) fin(true);
      });
    });
    st.solve = function () { if (done >= n) return false; next().click(); return true; };
    st.stop = function () { fin(false); };
    (async function watch() {
      while (alive() && done < n) {
        await ctx.sleep(1000); if (ctx.paused) continue; idle++;
        if (idle === 8) { next().classList.add('pulse-hint'); }
        if (idle >= 14 || (demo && idle >= 3)) { var c = kit.center(next(), ctx.stage), hd = kit.hand(ctx.stage, c.x, c.y); await ctx.sleep(400); await hd.tap(); hd.el.remove(); idle = 0; if (done < n) next().click(); }
      }
    })();
    await pr; st.solve = null; if (!alive()) return;
    ch.classList.remove(mv.fx); await cheer(ctx, ch);
    return { errors: demo ? 0 : Math.min(errors, 3) };
  });

  /* ═════════════════ الكنز الدافئ ═════════════════
     كنز مخفي في الميدان: يلمس الطفل مكاناً فتظهر دائرة بارد/دافئ/حارّ تدلّه على القرب، حتى يجد الكنز. */
  var TBG = ['tr-sand', 'tr-grass', 'tr-sea', 'tr-snow'];
  mini('treasure', 'tr2-stage', 'fox', async function (ctx, st, level, demo, alive, setCur) {
    var n = level <= 2 ? 1 : level <= 4 ? 2 : 3, R = [0.17, 0.15, 0.13, 0.115, 0.1][Math.min(4, level - 1)], found = 0, taps = 0, idle = 0, errors = 0, fin, pr = new Promise(function (r) { fin = r; });
    st.top.innerHTML = ''; st.tray.innerHTML = '';
    var field = h('div', { class: 'tr2-field ' + kit.pick(TBG), role: 'application' }), cnt = h('div', { class: 'tr2-cnt' }), word = h('div', { class: 'tr2-word', text: 'المسوا الميدان وابحثوا!' });
    var targets = [];
    for (var i = 0; i < n; i++) { var tg; do { tg = { x: 0.14 + Math.random() * 0.72, y: 0.14 + Math.random() * 0.72 }; } while (targets.some(function (o) { return Math.hypot(o.x - tg.x, o.y - tg.y) < 0.3; })); targets.push(tg); }
    function drawCnt() { cnt.innerHTML = ''; for (var k = 0; k < n; k++) cnt.appendChild(h('span', { class: 'tr2-c' + (k < found ? ' on' : ''), html: pic('star') })); }
    drawCnt();
    st.top.appendChild(h('div', { class: 'tr2-wrap' }, cnt, field, word));
    UI.anim(field, [{ opacity: 0, transform: 'scale(.85)' }, { opacity: 1, transform: 'none' }], { dur: 450, easing: UI.SPRING, fill: 'backwards' });
    if (B.audio) B.audio.play('card');
    await ctx.sleep(600); if (!alive()) return;
    function nearest(x, y) { var best = 9, bi = -1; targets.forEach(function (t, k) { if (t.got) return; var d = Math.hypot(t.x - x, t.y - y); if (d < best) { best = d; bi = k; } }); return { d: best, i: bi }; }
    function ring(x, y, d) {
      var lvl = d < R ? 4 : d < 0.26 ? 3 : d < 0.45 ? 2 : 1, cols = ['#6EC6FF', '#9AD8B8', '#FFD34E', '#FF8A3D'], nm = ['بارد', 'دافئ', 'حارّ', 'حارّ جدًا!'];
      var r = h('div', { class: 'tr2-ring', style: { left: x * 100 + '%', top: y * 100 + '%', borderColor: cols[lvl - 1], background: cols[lvl - 1] + '55' } }); field.appendChild(r);
      UI.anim(r, [{ transform: 'translate(-50%,-50%) scale(.2)', opacity: 1 }, { transform: 'translate(-50%,-50%) scale(' + (0.7 + lvl * 0.35) + ')', opacity: 0 }], { dur: 900 }).then(function () { r.remove(); });
      word.textContent = nm[lvl - 1]; word.style.color = lvl >= 3 ? '#C9611F' : '#2468D1';
      if (B.audio) B.audio.play(lvl >= 3 ? 'sparkle' : 'tap');
    }
    async function tapAt(x, y) {
      if (ctx.paused) return; taps++; idle = 0;
      var nr = nearest(x, y); ring(x, y, nr.d);
      if (nr.d < R && nr.i >= 0) {
        var t = targets[nr.i]; t.got = true; found++;
        var s = h('div', { class: 'tr2-star', style: { left: t.x * 100 + '%', top: t.y * 100 + '%' }, html: pic('star') }); field.appendChild(s);
        if (B.audio) B.audio.play('right');
        await ctx.anim(s, [{ transform: 'translate(-50%,-50%) scale(.3)', opacity: 0 }, { transform: 'translate(-50%,-50%) scale(1.5)', opacity: 1 }, { transform: 'translate(-50%,-50%) scale(1.1)', opacity: 1 }], { dur: 700, easing: UI.SPRING, fill: 'forwards' });
        UI.burst(ctx.stage, kit.center(s, ctx.stage).x, kit.center(s, ctx.stage).y, { n: 14, spread: 80, dur: 900 });
        drawCnt(); word.textContent = found < n ? 'وجدتم واحدًا! ابحثوا عن الباقي' : 'وجدتم كل الكنوز!';
        if (found >= n) fin(true);
      } else if (taps > 5) errors += taps % 3 === 0 ? 1 : 0;
    }
    field.addEventListener('pointerdown', function (e) { var r = field.getBoundingClientRect(); tapAt((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height); });
    st.solve = function () { var t = targets.filter(function (o) { return !o.got; })[0]; if (!t) return false; tapAt(t.x, t.y); return true; };
    st.stop = function () { fin(false); };
    (async function watch() {
      while (alive() && found < n) {
        await ctx.sleep(1000); if (ctx.paused) continue; idle++;
        var t = targets.filter(function (o) { return !o.got; })[0]; if (!t) break;
        if (idle === 7) { var g = h('div', { class: 'tr2-glim', style: { left: t.x * 100 + '%', top: t.y * 100 + '%' } }); field.appendChild(g); setTimeout(function () { g.remove(); }, 3000); }
        if (idle >= 13 || (demo && idle >= 3)) {
          var fr = field.getBoundingClientRect(), p = ctx.stage.getBoundingClientRect(), hd = kit.hand(ctx.stage, fr.left - p.left + t.x * fr.width, fr.top - p.top + t.y * fr.height);
          await ctx.sleep(400); await hd.tap(); hd.el.remove(); idle = 0; tapAt(t.x, t.y);
        }
      }
    })();
    await pr; st.solve = null; if (!alive()) return;
    await cheer(ctx, field); return { errors: demo ? 0 : Math.min(errors, 4) };
  });

  B.games.maze._gen = genMaze; B.games.maze._bfs = bfs;
  B.games.missing._parts = MKEYS; B.games.missing._mp = MP;
})();
