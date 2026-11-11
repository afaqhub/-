/* ثلاث ألعاب بسيطة جداً لابن الرابعة، كلها «انظري واختاري» بلا قراءة ولا شرح:
   • «لعبة الظلال»: ظلّ أسود لشيء، وتختار صاحب الظل من الصور الملوّنة.
   • «أين الأكثر؟»: طبقان من الفاكهة، وتختار الطبق الذي فيه أكثر (تحكم بالنظر: كثير/قليل).
   • «أين المختلف؟»: أربع صور، ثلاث متشابهة وواحدة مختلفة، وتختار المختلفة.
   كلها تستعمل جولة الاختيار المشتركة (kit.choice) بسلّم المساعدة نفسه. */
(function () {
  'use strict';
  var B = (window.Bustan = window.Bustan || {});
  var UI = B.UI, h = UI.h, art = B.art, kit = B.kit;

  var GROUPS = {
    animals: ['duck', 'bear', 'cat', 'rabbit', 'frog', 'lamb', 'owl', 'bird', 'turtle', 'whale', 'fish', 'bee', 'butterfly'],
    fruits: ['apple', 'strawberry', 'lemon', 'banana', 'grapes', 'pomegranate', 'carrot', 'pumpkin'],
    things: ['house', 'car', 'rocket', 'plane', 'key', 'clock', 'ball', 'balloon', 'tree', 'flower', 'crown', 'book', 'tent', 'train', 'lantern', 'umbrella']
  };
  var GNAMES = Object.keys(GROUPS);
  function fromOther(g) { var o = kit.pick(GNAMES.filter(function (x) { return x !== g; })); return kit.pick(GROUPS[o]); }

  /* مصنع لعبة صغيرة: opts.round(ctx, st, level, demo, alive, setCur) → {errors} */
  function mini(id, cls, sleeper, roundFn) {
    var st = null, runner = kit.roundRunner();
    function clear() { if (st) { st.top.innerHTML = ''; st.tray.innerHTML = ''; st.answer = null; st.ctx.stage.querySelectorAll('.kit-hand').forEach(function (x) { x.remove(); }); } }
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
      cancelRound: function () { runner.cancel(); clear(); },
      outro: function (ctx) { return kit.dusk(ctx); },
      endArt: function () { return kit.endScene(sleeper); },
      destroy: function () { runner.stop(); st = null; },
      _solveStep: function () { if (st && st.answer) { st.answer.click(); return true; } return false; }
    };
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
  async function ask(ctx, st, btns, correct, demo, alive, setCur) {
    st.answer = btns[correct];
    var ch = kit.choice(ctx, ctx.stage, btns, correct, { demo: demo });
    setCur(ch);
    var res = await ch.promise;
    st.answer = null;
    if (!alive() || res.cancelled) return null;
    btns.forEach(function (b, i) { if (i !== correct) b.classList.add('faded'); });
    return res;
  }
  async function cheer(ctx, el) {
    var c = kit.center(el, ctx.stage);
    UI.burst(ctx.stage, c.x, c.y, { n: 20, spread: 140, dur: 1300 });
    if (B.audio) B.audio.play('cheer');
    await ctx.sleep(1400);
  }

  /* ═════════ لعبة الظلال ═════════ */
  mini('shadows', 'sh-stage', 'cat', async function (ctx, st, level, demo, alive, setCur) {
    var n = level === 1 ? 2 : level <= 3 ? 3 : 4, same = level >= 3;
    var g = kit.pick(GNAMES), target;
    do { target = kit.pick(GROUPS[g]); } while (target === st.last);
    st.last = target;
    var opts = [target];
    while (opts.length < n) { var d = same ? kit.pick(GROUPS[g]) : fromOther(g); if (opts.indexOf(d) < 0) opts.push(d); }
    opts = kit.shuffle(opts);
    st.top.innerHTML = '';
    var sh = h('div', { class: 'sh-card' }, h('div', { class: 'sh-pic is-shadow', html: B.pics.draw(target) }));
    st.top.appendChild(sh);
    UI.anim(sh, [{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'none' }], { dur: 480, easing: UI.SPRING, fill: 'backwards' });
    if (B.audio) B.audio.play('card');
    await ctx.sleep(600); if (!alive()) return;
    var btns = addBtns(st, opts.map(function (k) { return B.pics.draw(k); }));
    var res = await ask(ctx, st, btns, opts.indexOf(target), demo, alive, setCur);
    if (!res) return;
    // الظل يكشف عن صاحبه
    sh.firstChild.classList.remove('is-shadow');
    UI.anim(sh, [{ transform: 'scale(1)' }, { transform: 'scale(1.12)' }, { transform: 'scale(1)' }], { dur: 500, easing: UI.SPRING, fill: 'none' });
    await cheer(ctx, sh); if (!alive()) return;
    return { errors: demo ? 0 : res.errors };
  });

  /* ═════════ أين الأكثر؟ ═════════ */
  function morePair(level) {
    var a, b;
    if (level === 1) { a = 1 + kit.rand(2); b = 5 + kit.rand(3); }
    else if (level === 2) { a = 1 + kit.rand(4); b = a + 3 + kit.rand(2); }
    else if (level === 3) { a = 2 + kit.rand(5); b = a + 2; }
    else if (level === 4) { a = 3 + kit.rand(5); b = a + 1 + kit.rand(2); }
    else { a = 4 + kit.rand(6); b = a + 1; }
    return [a, Math.min(b, 12)];
  }
  function plate(fruit, n) {
    var cols = n <= 4 ? 2 : n <= 9 ? 3 : 4, out = '<span class="mo-plate" style="--c:' + cols + '">';
    for (var i = 0; i < n; i++) out += '<span class="mo-item">' + B.pics.draw(fruit) + '</span>';
    return out + '</span>';
  }
  mini('more', 'mo-stage', 'bear', async function (ctx, st, level, demo, alive, setCur) {
    var p = morePair(level), fruit = kit.pick(GROUPS.fruits.slice(0, 6));
    var bigFirst = Math.random() < 0.5, counts = bigFirst ? [p[1], p[0]] : [p[0], p[1]];
    st.top.innerHTML = '';
    // الدب الجائع يريد الطبق الأكثر
    var bear = h('div', { class: 'mo-bear', html: art.animal('bear') });
    st.top.appendChild(bear);
    UI.anim(bear, [{ transform: 'translateY(20px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { dur: 400, fill: 'backwards' });
    await ctx.sleep(350); if (!alive()) return;
    var btns = addBtns(st, counts.map(function (n) { return plate(fruit, n); }), 'mo-btn');
    var res = await ask(ctx, st, btns, bigFirst ? 0 : 1, demo, alive, setCur);
    if (!res) return;
    UI.anim(bear, [{ transform: 'translateY(0)' }, { transform: 'translateY(-20px) rotate(-6deg)' }, { transform: 'translateY(0)' }, { transform: 'translateY(-12px) rotate(6deg)' }, { transform: 'translateY(0)' }], { dur: 900, fill: 'none' });
    await cheer(ctx, btns[bigFirst ? 0 : 1]); if (!alive()) return;
    return { errors: demo ? 0 : res.errors };
  });

  /* ═════════ أين المختلف؟ ═════════ */
  function symHtml(shape, color) { return art.symbol({ shape: shape, color: color }); }
  mini('odd', 'od-stage', 'owl', async function (ctx, st, level, demo, alive, setCur) {
    var htmls, same, diff, g = kit.pick(GNAMES);
    if (level <= 2) {                                   // ثلاث صور متطابقة وواحدة مختلفة
      same = kit.pick(GROUPS[g]);
      do { diff = level === 1 ? fromOther(g) : kit.pick(GROUPS[g]); } while (diff === same);
      htmls = [B.pics.draw(same), B.pics.draw(same), B.pics.draw(same), B.pics.draw(diff)];
    } else if (level <= 4) {                            // رموز: يختلف اللون ثم يختلف الشكل
      var sh = kit.shuffle(art.SHAPES), co = kit.shuffle(art.COLOR_KEYS);
      var a = symHtml(sh[0], co[0]), d = level === 3 ? symHtml(sh[0], co[1]) : symHtml(sh[1], co[0]);
      htmls = [a, a, a, d];
    } else {                                            // فئات: ثلاثة من نوع وواحد من نوع آخر
      var three = kit.shuffle(GROUPS[g]).slice(0, 3);
      htmls = three.map(function (k) { return B.pics.draw(k); }).concat([B.pics.draw(fromOther(g))]);
    }
    var order = kit.shuffle([0, 1, 2, 3]);
    st.top.innerHTML = '';
    st.tray.classList.add('od-grid');
    var btns = addBtns(st, order.map(function (i) { return htmls[i]; }));
    if (B.audio) B.audio.play('card');
    var correct = order.indexOf(3);
    var res = await ask(ctx, st, btns, correct, demo, alive, setCur);
    if (!res) return;
    await cheer(ctx, btns[correct]); if (!alive()) return;
    return { errors: demo ? 0 : res.errors };
  });

  B.games.more._pair = morePair;
})();
