/* لعبة «أول صوت» — الوعي الصوتي. عالم حديقة ومكتبة. تُلعب مع أحد الوالدين.
   يقول الوالد الكلمة بصوته، وتختار الطفلة الحرف الذي تبدأ به من ٣ بطاقات.
   مبدآن: لا تُختبر ولا تُصحَّح بأي نطق، والحروف المؤجلة (ث ذ ظ ض ق) في المستوى ٤ فقط.
   المستوى ٥: القافية — ثلاث صور تتشابه كلمتان منها في آخرهما فتختار الزوج. */
(function () {
  'use strict';
  var B = (window.Bustan = window.Bustan || {});
  var UI = B.UI, h = UI.h, art = B.art, kit = B.kit;

  /* بنك الكلمات: [مفتاح الصورة، الكلمة بلا «ال»] — الحرف هو أول الكلمة */
  var WORDS = [
    ['duck', 'بطة'], ['door', 'باب'], ['house', 'بيت'], ['balloon', 'بالون'], ['owl', 'بومة'],
    ['banana', 'موز'], ['triangle', 'مثلث'], ['square', 'مربع'], ['key', 'مفتاح'],
    ['fish', 'سمكة'], ['clock', 'ساعة'], ['car', 'سيارة'],
    ['butterfly', 'فراشة'], ['lantern', 'فانوس'], ['strawberry', 'فراولة'],
    ['lemon', 'ليمون'], ['milk', 'لبن'],
    ['apple', 'تفاحة'], ['crown', 'تاج'],
    ['camel', 'جمل'], ['carrot', 'جزرة'], ['mountain', 'جبل'],
    ['horse', 'حصان'], ['whale', 'حوت'],
    ['tent', 'خيمة'], ['lamb', 'خروف'],
    ['hen', 'دجاجة'], ['bear', 'دب'], ['circle', 'دائرة'],
    ['pomegranate', 'رمان'], ['feather', 'ريشة'],
    ['flower', 'زهرة'], ['button', 'زر'],
    ['sun', 'شمس'], ['tree', 'شجرة'],
    ['rocket', 'صاروخ'], ['box', 'صندوق'],
    ['plane', 'طائرة'], ['windmill', 'طاحونة'],
    ['grapes', 'عنب'], ['eye', 'عين'],
    ['cloud', 'غيمة'], ['branch', 'غصن'],
    ['book', 'كتاب'], ['ball', 'كرة'],
    ['star', 'نجمة'], ['bee', 'نحلة'],
    ['pyramid', 'هرم'], ['crescent', 'هلال'],
    ['rose', 'وردة'], ['leaf', 'ورقة'],
    ['hand', 'يد'], ['pumpkin', 'يقطين'],
    // الحروف المؤجلة (المستوى ٤ فقط)
    ['fox', 'ثعلب'], ['snow', 'ثلج'], ['corn', 'ذرة'], ['envelope', 'ظرف'], ['frog', 'ضفدع'],
    ['moon', 'قمر'], ['cat', 'قطة'], ['heart', 'قلب'], ['train', 'قطار']
  ];
  var L1 = 'بمسفل', DEFERRED = 'ثذظضق';
  var EASY = 'بمسفلتجحخدرزشصطعغكنهوي';
  /* مجموعات متقاربة الشكل (المستوى ٣) */
  var LOOK = ['بتني', 'جحخ', 'رزو', 'سشص', 'عغف'];
  /* مشتتات الحروف المؤجلة: ما يشبهها شكلاً */
  var DEF_NEAR = { 'ث': 'تبن', 'ذ': 'دزر', 'ظ': 'طصع', 'ض': 'صطس', 'ق': 'فكغ' };
  /* أزواج القافية: كلمتان تتشابهان في آخرهما */
  var RHYMES = [['duck', 'cat'], ['door', 'book'], ['tent', 'cloud'], ['ball', 'corn'], ['butterfly', 'feather'], ['plane', 'circle'], ['mountain', 'camel']];

  function wordOf(key) { for (var i = 0; i < WORDS.length; i++) if (WORDS[i][0] === key) return WORDS[i][1]; return ''; }
  function byLetters(set) { return WORDS.filter(function (w) { return set.indexOf(w[1][0]) >= 0; }); }
  function others(pool, not, n) {
    var out = [];
    kit.shuffle(pool.split('')).forEach(function (c) { if (out.length < n && not.indexOf(c) < 0 && out.indexOf(c) < 0) out.push(c); });
    return out;
  }

  /* يبني جولة حرف: الكلمة و٣ حروف */
  function makeLetterRound(level, used) {
    var pool = level === 1 ? byLetters(L1) : level === 4 ? byLetters(DEFERRED) : byLetters(EASY);
    if (level === 3) pool = pool.filter(function (w) { return LOOK.some(function (g) { return g.indexOf(w[1][0]) >= 0; }); });
    var fresh = pool.filter(function (w) { return used.indexOf(w[0]) < 0; });
    var w = kit.pick(fresh.length ? fresh : pool), L = w[1][0], dis;
    if (level === 1) dis = others(L1, L, 2);
    else if (level === 3) { var g = LOOK.filter(function (x) { return x.indexOf(L) >= 0; })[0]; dis = others(g, L, 2); }
    else if (level === 4) dis = others(DEF_NEAR[L], L, 2);
    else dis = others(EASY, L, 2);
    while (dis.length < 2) dis = dis.concat(others(EASY, L + dis.join(''), 2 - dis.length));
    var letters = kit.shuffle([L].concat(dis));
    return { key: w[0], word: w[1], letters: letters, correct: letters.indexOf(L) };
  }
  function makeRhymeRound(used) {
    var fresh = RHYMES.filter(function (p) { return used.indexOf(p[0]) < 0; });
    var pair = kit.pick(fresh.length ? fresh : RHYMES), odd;
    do { odd = kit.pick(WORDS)[0]; } while (RHYMES.some(function (p) { return p.indexOf(odd) >= 0; }) || pair.indexOf(odd) >= 0);
    var keys = kit.shuffle([pair[0], pair[1], odd]);
    return { keys: keys, pair: pair, odd: odd };
  }

  var st = null, runner = kit.roundRunner();

  function build(ctx) {
    var stage = ctx.stage;
    stage.classList.add('g-stage', 'fs-stage');
    stage.appendChild(h('div', { class: 'fs-sun', html: art.sun() }));
    stage.appendChild(h('div', { class: 'fs-grass', html: art.sceneTile('fore', Math.max(600, UI.vp().W), 120) }));
    st.card = h('div', { class: 'fs-card' });
    st.word = h('div', { class: 'fs-word' });
    st.tray = h('div', { class: 'g-tray' });
    stage.appendChild(h('div', { class: 'g-main' }, st.card, st.word));
    stage.appendChild(st.tray);
  }

  function celebrate(ctx, el) {
    var c = kit.center(el, ctx.stage);
    UI.burst(ctx.stage, c.x, c.y, { n: 18, spread: 130, dur: 1300 });
    if (B.audio) B.audio.play('cheer');
    return UI.anim(el, [{ transform: 'scale(1) rotate(0)' }, { transform: 'scale(1.1) rotate(-4deg)' }, { transform: 'scale(1.1) rotate(4deg)' }, { transform: 'scale(1) rotate(0)' }], { dur: 800, fill: 'none' });
  }

  async function letterRound(ctx, level, demo, alive, setCur) {
    var r = makeLetterRound(level, st.used);
    st.used.push(r.key);
    st.card.innerHTML = ''; st.tray.innerHTML = '';
    st.card.className = 'fs-card';
    var pic = h('div', { class: 'fs-pic', html: B.pics.draw(r.key) });
    st.card.appendChild(pic);
    st.word.textContent = r.word; // بخط صغير رمادي للوالد
    UI.anim(pic, [{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'none' }], { dur: 500, easing: UI.SPRING, fill: 'backwards' });
    if (B.audio) B.audio.play('card');
    await ctx.sleep(700);
    if (!alive()) return;
    var btns = r.letters.map(function (L, i) {
      var b = h('button', { class: 'g-choice letter', type: 'button' }, h('span', { text: L }));
      st.tray.appendChild(b);
      UI.anim(b, [{ opacity: 0, transform: 'translateY(30px)' }, { opacity: 1, transform: 'none' }], { dur: 380, delay: i * 90, easing: UI.SPRING, fill: 'backwards' });
      return b;
    });
    st.answers = [btns[r.correct]];
    var ch = kit.choice(ctx, ctx.stage, btns, r.correct, { demo: demo });
    setCur(ch);
    var res = await ch.promise;
    if (!alive() || res.cancelled) return;
    st.answers = [];
    // الحرف يُختم على البطاقة
    st.card.appendChild(h('div', { class: 'fs-stamp', text: r.letters[r.correct] }));
    UI.anim(st.card.lastChild, [{ transform: 'scale(2.4) rotate(-20deg)', opacity: 0 }, { transform: 'scale(1) rotate(-8deg)', opacity: 1 }], { dur: 420, easing: UI.SPRING });
    await celebrate(ctx, pic);
    await ctx.sleep(600);
    if (!alive()) return;
    return { errors: demo ? 0 : res.errors };
  }

  async function rhymeRound(ctx, alive) {
    var r = makeRhymeRound(st.used), errors = 0, fails = 0;
    st.used.push(r.pair[0]);
    st.card.innerHTML = ''; st.tray.innerHTML = '';
    st.card.className = 'fs-card rhyme';
    st.word.textContent = r.keys.map(wordOf).join(' · ');
    var sel = [], done = false, resolve, busy = false;
    var p = new Promise(function (res) { resolve = res; });
    var btns = r.keys.map(function (k, i) {
      var b = h('button', { class: 'g-choice pic', type: 'button', html: B.pics.draw(k) });
      st.card.appendChild(b);
      UI.anim(b, [{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'none' }], { dur: 450, delay: i * 110, easing: UI.SPRING, fill: 'backwards' });
      UI.bindPress(b, function () { tapPic(i); });
      return b;
    });
    var okIdx = r.keys.map(function (k, i) { return r.pair.indexOf(k) >= 0 ? i : -1; }).filter(function (i) { return i >= 0; });
    st.answers = okIdx.map(function (i) { return btns[i]; });
    function finish() { done = true; btns.forEach(function (b) { b.classList.remove('pulse-hint'); }); resolve(true); }
    async function tapPic(i) {
      if (done || busy) return;
      var at = sel.indexOf(i);
      if (at >= 0) { sel.splice(at, 1); btns[i].classList.remove('selected'); return; }
      sel.push(i); btns[i].classList.add('selected');
      if (B.audio) B.audio.play('pick');
      if (sel.length < 2) return;
      if (sel.every(function (x) { return okIdx.indexOf(x) >= 0; })) { kit.right(btns[sel[0]]); kit.right(btns[sel[1]]); finish(); return; }
      errors++; fails++; busy = true;
      kit.wrong(btns[sel[0]]); kit.wrong(btns[sel[1]]);
      await ctx.sleep(500);
      sel.forEach(function (x) { btns[x].classList.remove('selected'); }); sel = []; busy = false;
      if (fails === 2) okIdx.forEach(function (x) { btns[x].classList.add('pulse-hint'); });
      if (fails >= 3) { // اليد تُظهر الزوج
        busy = true;
        for (var k = 0; k < 2; k++) {
          var c = kit.center(btns[okIdx[k]], ctx.stage), hd = kit.hand(ctx.stage, c.x, c.y + c.h * 0.2);
          await ctx.sleep(600); await hd.tap(); btns[okIdx[k]].classList.add('selected'); hd.remove();
        }
        kit.right(btns[okIdx[0]]); finish();
      }
    }
    st.cancelRhyme = function () { done = true; resolve(false); };
    var okDone = await p;
    if (!alive() || !okDone) return;
    st.answers = [];
    await celebrate(ctx, st.card);
    await ctx.sleep(600);
    if (!alive()) return;
    return { errors: errors };
  }

  B.games.firstsound = {
    id: 'firstsound',
    mount: function (ctx) { st = { ctx: ctx, used: [], answers: [] }; build(ctx); },
    demo: function (ctx) { return runner.run(function (alive, setCur) { return letterRound(ctx, 1, true, alive, setCur); }); },
    playRound: function (ctx, level) {
      return runner.run(function (alive, setCur) { return level >= 5 ? rhymeRound(ctx, alive) : letterRound(ctx, level, false, alive, setCur); });
    },
    cancelRound: function () { runner.cancel(); if (st) { if (st.cancelRhyme) st.cancelRhyme(); st.card.innerHTML = ''; st.tray.innerHTML = ''; st.word.textContent = ''; } },
    outro: function (ctx) { return kit.dusk(ctx); },
    endArt: function () { return kit.endScene('owl'); },
    destroy: function () { runner.stop(); st = null; },
    WORDS: WORDS,
    _makeLetterRound: makeLetterRound,
    _makeRhymeRound: makeRhymeRound,
    _solveStep: function () {
      if (!st || !st.answers.length) return false;
      var b = st.answers.filter(function (x) { return !x.classList.contains('selected'); })[0];
      if (b) { b.click(); return true; }
      return false;
    }
  };
})();
