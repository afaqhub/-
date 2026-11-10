/* لعبة «جسر الروابط» — الجملة المركّبة والفصحى. عالم حكايات وجسور. تُلعب مع أحد الوالدين.
   يقرأ الوالد جملة تنتهي برابط (لكن / لأن / لذلك / بينما)، وتختار الطفلة من ٣ صور ما يُتمّ المعنى.
   عند اختيار غير مناسب: تُعرض صورتها مع استفهام لطيف، ثم تتلاشى الخيارات ما عدا الصحيحة التي تنبض. */
(function () {
  'use strict';
  var B = (window.Bustan = window.Bustan || {});
  var UI = B.UI, h = UI.h, art = B.art, kit = B.kit;

  var CONNECTORS = ['لكنْ', 'لأنّ', 'لذلك', 'بينما'];

  /* عبارة عامة لكل صورة حين تكون مشتتاً (تُعرض بخط صغير للوالد) */
  var PHRASE = {
    sun: 'الشمس ساطعة', carrot: 'الجزرة كبيرة', book: 'الكتاب مفتوح', apple: 'التفاحة حمراء', ball: 'الكرة ملوّنة',
    moon: 'القمر منير', fish: 'السمكة تسبح', star: 'النجمة تلمع', flower: 'الزهرة جميلة', key: 'المفتاح صغير',
    banana: 'الموز أصفر', balloon: 'البالون يطير', clock: 'الساعة تدقّ', tree: 'الشجرة خضراء', crown: 'التاج لامع',
    lemon: 'الليمون أصفر', rocket: 'الصاروخ سريع', grapes: 'العنب لذيذ', house: 'البيت جميل', lantern: 'الفانوس ملوّن',
    feather: 'الريشة خفيفة', box: 'الصندوق مغلق', pumpkin: 'اليقطينة كبيرة', leaf: 'الورقة خضراء', strawberry: 'الفراولة حلوة'
  };

  /* بنك الجمل: [رقم الرابط، الجملة، صورة الإتمام، نص الإتمام، مشتت، مشتت] — ٨ جمل لكل رابط */
  var BANK = [
    [0, 'أراد الأرنب أن يعبر النهر،', 'brokenbridge', 'الجسر مكسور', 'sun', 'carrot'],
    [0, 'أرادت البطة أن تسبح في البركة،', 'snow', 'الماء تجمّد', 'book', 'apple'],
    [0, 'أراد الدب أن يأكل العسل،', 'bee', 'النحلة تحرسه', 'ball', 'moon'],
    [0, 'أرادت القطة أن تدخل البيت،', 'door', 'الباب مغلق', 'fish', 'star'],
    [0, 'أراد الخروف أن يقطف التفاحة،', 'tree', 'الشجرة عالية', 'key', 'balloon'],
    [0, 'أرادت سلمى أن تلعب في الحديقة،', 'rain', 'المطر ينزل', 'crown', 'banana'],
    [0, 'أراد الأرنب أن يقرأ حكايته،', 'moon', 'الظلام حلّ', 'carrot', 'ball'],
    [0, 'أرادت البومة أن تنام،', 'sun', 'الشمس أشرقت', 'lemon', 'box'],

    [1, 'فتح الأرنب مظلّته', 'rain', 'المطر ينزل', 'star', 'banana'],
    [1, 'لبس الخروف معطفه', 'snow', 'الثلج يتساقط', 'flower', 'key'],
    [1, 'أضاء الدب الفانوس', 'moon', 'الليل حلّ', 'apple', 'ball'],
    [1, 'شرب الجمل ماءً كثيراً', 'sun', 'الشمس حارّة', 'book', 'crown'],
    [1, 'بكى الصغير', 'balloon', 'بالونه طار', 'tree', 'clock'],
    [1, 'طار العصفور بعيداً', 'cat', 'القطة اقتربت', 'lemon', 'house'],
    [1, 'لم يدخل الدب بيته', 'door', 'الباب مغلق', 'grapes', 'feather'],
    [1, 'فرحت النحلة', 'flower', 'الزهرة تفتّحت', 'rocket', 'box'],

    [2, 'جاع الأرنب،', 'carrot', 'أكل الجزرة', 'star', 'key'],
    [2, 'نزل المطر،', 'umbrella', 'فتحت البطة المظلّة', 'ball', 'crown'],
    [2, 'حلّ الليل،', 'sleepbear', 'نام الدب', 'apple', 'rocket'],
    [2, 'كان الباب مغلقاً،', 'key', 'أحضر الأرنب المفتاح', 'banana', 'flower'],
    [2, 'عطشت الزهرة،', 'rain', 'سقتها الغيمة', 'book', 'lantern'],
    [2, 'أشرقت الشمس،', 'rose', 'تفتّحت الوردة', 'box', 'feather'],
    [2, 'أراد القط أن يعرف الوقت،', 'clock', 'نظر إلى الساعة', 'pumpkin', 'leaf'],
    [2, 'أحبّت سلمى الحكايات،', 'book', 'فتحت الكتاب', 'lemon', 'ball'],

    [3, 'الأرنب سريع،', 'turtle', 'السلحفاة بطيئة', 'apple', 'star'],
    [3, 'الشمس تظهر في النهار،', 'moon', 'القمر يظهر في الليل', 'carrot', 'ball'],
    [3, 'السمكة تسبح في الماء،', 'bird', 'العصفور يطير في السماء', 'key', 'crown'],
    [3, 'الدب كبير،', 'bee', 'النحلة صغيرة', 'house', 'tree'],
    [3, 'الثلج بارد،', 'sun', 'الشمس حارّة', 'book', 'balloon'],
    [3, 'الليمون حامض،', 'banana', 'الموز حلو', 'clock', 'feather'],
    [3, 'الطائرة تطير في السماء،', 'train', 'القطار يسير على الأرض', 'flower', 'lantern'],
    [3, 'الجمل يعيش في الصحراء،', 'fish', 'السمكة تعيش في البحر', 'rocket', 'strawberry']
  ];

  var st = null, runner = kit.roundRunner();

  function connectorFor(level) {
    var wk = B.storage.data().settings.weeklyConnector | 0; // رابط الأسبوع من ركن الوالدين
    if (wk >= 1 && wk <= 4) return wk - 1;
    return level >= 5 ? kit.rand(4) : level - 1;
  }
  function nextSentence(ci) {
    if (!st.queues[ci] || !st.queues[ci].length) st.queues[ci] = kit.shuffle(BANK.filter(function (s) { return s[0] === ci; }));
    return st.queues[ci].pop();
  }

  function build(ctx) {
    var stage = ctx.stage;
    stage.classList.add('g-stage', 'br-stage');
    st.strip = h('div', { class: 'br-strip' });
    st.tray = h('div', { class: 'br-options' });
    // مشهد الأسفل: نهر وجسر تُضاف إليه لوحة في كل جولة ويتقدم الأرنب
    st.planks = h('div', { class: 'br-planks' });
    for (var i = 0; i < ctx.total; i++) st.planks.appendChild(h('span', { class: 'br-plank' }));
    st.rabbit = h('div', { class: 'br-rabbit', html: art.animal('rabbit') });
    st.scene = h('div', { class: 'br-scene' }, h('div', { class: 'br-bank l' }), h('div', { class: 'br-bank r' }), st.planks, st.rabbit);
    stage.appendChild(st.strip);
    stage.appendChild(h('div', { class: 'g-main' }, st.tray));
    stage.appendChild(st.scene);
    placeRabbit(false);
  }
  function placeRabbit(animate) {
    // الأرنب يسير من اليمين إلى اليسار فوق اللوحات المنجزة
    var pct = 88 - (st.built / st.ctx.total) * 76;
    if (animate) {
      UI.anim(st.rabbit, [{ transform: 'translateY(0)' }, { transform: 'translateY(-26px)' }, { transform: 'translateY(0)' }], { dur: 520, fill: 'none' });
    }
    st.rabbit.style.left = pct + '%';
  }

  async function round(ctx, level, demo, alive, setCur) {
    var ci = connectorFor(demo ? 1 : level), s = nextSentence(ci);
    st.strip.innerHTML = ''; st.tray.innerHTML = '';
    st.strip.appendChild(h('span', { class: 'br-text', text: s[1] + ' ' }));
    st.strip.appendChild(h('span', { class: 'br-conn c' + ci, text: CONNECTORS[ci] + '…' }));
    UI.anim(st.strip, [{ opacity: 0, transform: 'translateY(-16px)' }, { opacity: 1, transform: 'none' }], { dur: 450, fill: 'backwards' });
    if (B.audio) B.audio.play('card');
    await ctx.sleep(600);
    if (!alive()) return;
    var opts = kit.shuffle([{ k: s[2], t: s[3], ok: true }, { k: s[4], t: PHRASE[s[4]] || '' }, { k: s[5], t: PHRASE[s[5]] || '' }]);
    var correct = opts.findIndex(function (o) { return o.ok; });
    var btns = opts.map(function (o, i) {
      var b = h('button', { class: 'g-choice pic br-opt', type: 'button' }, h('span', { class: 'br-pic', html: B.pics.draw(o.k) }), h('span', { class: 'br-cap', text: o.t }));
      st.tray.appendChild(b);
      UI.anim(b, [{ opacity: 0, transform: 'translateY(30px) scale(.8)' }, { opacity: 1, transform: 'none' }], { dur: 420, delay: i * 110, easing: UI.SPRING, fill: 'backwards' });
      return b;
    });
    st.answer = btns[correct];
    var ch = kit.choice(ctx, ctx.stage, btns, correct, {
      demo: demo,
      onWrong: function (b) {
        // استفهام لطيف فوق اختيارها، ثم تتلاشى غير الصحيحة وتنبض الصحيحة
        var q = h('span', { class: 'br-q', html: art.bubbleQ() });
        b.appendChild(q);
        UI.anim(q, [{ transform: 'scale(.2)', opacity: 0 }, { transform: 'scale(1)', opacity: 1, offset: 0.3 }, { transform: 'scale(1)', opacity: 1, offset: 0.8 }, { transform: 'scale(.8)', opacity: 0 }], { dur: 1300 }).then(function () { q.remove(); });
        setTimeout(function () {
          btns.forEach(function (x, i) { if (i !== correct) x.classList.add('faded'); });
          btns[correct].classList.add('pulse-hint');
        }, 900 / UI.ts);
      }
    });
    setCur(ch);
    var res = await ch.promise;
    if (!alive() || res.cancelled) return;
    st.answer = null;
    btns.forEach(function (x, i) { if (i !== correct) x.classList.add('faded'); });
    // الجملة تكتمل أمام الوالد
    st.strip.lastChild.textContent = CONNECTORS[ci] + ' ' + s[3] + '.';
    await ctx.sleep(500);
    if (!alive()) return;
    if (!demo) {
      // لوحة جديدة في الجسر، والأرنب يقفز إليها
      var pl = st.planks.children[st.built];
      if (pl) { pl.classList.add('on'); UI.anim(pl, [{ transform: 'translateY(-40px) scale(.5)', opacity: 0 }, { transform: 'none', opacity: 1 }], { dur: 450, easing: UI.SPRING, fill: 'none' }); }
      st.built++;
      if (B.audio) B.audio.play('place');
      placeRabbit(true);
    }
    var c = kit.center(btns[correct], ctx.stage);
    UI.burst(ctx.stage, c.x, c.y, { n: 18, spread: 130, dur: 1300 });
    if (B.audio) B.audio.play('cheer');
    await ctx.sleep(1500);
    if (!alive()) return;
    return { errors: demo ? 0 : res.errors };
  }

  B.games.bridge = {
    id: 'bridge',
    mount: function (ctx) { st = { ctx: ctx, queues: {}, built: 0 }; build(ctx); },
    demo: function (ctx) { return runner.run(function (alive, setCur) { return round(ctx, 1, true, alive, setCur); }); },
    playRound: function (ctx, level) { return runner.run(function (alive, setCur) { return round(ctx, level, false, alive, setCur); }); },
    cancelRound: function () { runner.cancel(); if (st) { st.strip.innerHTML = ''; st.tray.innerHTML = ''; } },
    outro: function (ctx) { return kit.dusk(ctx); },
    endArt: function () { return kit.endScene('rabbit'); },
    destroy: function () { runner.stop(); st = null; },
    BANK: BANK, CONNECTORS: CONNECTORS, PHRASE: PHRASE,
    _solveStep: function () { if (st && st.answer) { st.answer.click(); return true; } return false; }
  };
})();
