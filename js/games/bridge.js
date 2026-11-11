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

  /* بنك الجمل: [رقم الرابط، الجملة وفيها {c} موضع الرابط، صورة الإتمام، نص الإتمام، مشتت، مشتت، صور المشهد]
     المشهد صورة أو صورتان تُظهران الموقف للطفلة (من هو؟ وما حاله؟) فتفهم المطلوب بالنظر.
     ٨ جمل لكل رابط. ترتيب السهولة: «لذلك» (ماذا يحتاج؟) ثم «لأنّ» (ما السبب؟) ثم «لكنْ» (ما المانع؟) ثم «بينما» (المقابلة). */
  var BANK = [
    [2, 'نزل المطر على البطة، {c} فتحت…', 'umbrella', 'المظلّة', 'ball', 'crown', ['duck', 'rain']],
    [2, 'الباب مغلق، {c} أحضرت القطة…', 'key', 'المفتاح', 'banana', 'flower', ['cat', 'door']],
    [2, 'حلّ الظلام، {c} أضاء الدب…', 'lantern', 'الفانوس', 'apple', 'ball', ['bear', 'moon']],
    [2, 'جاع الأرنب، {c} أكل…', 'carrot', 'الجزرة', 'star', 'key', ['rabbit']],
    [2, 'أرادت النحلة الرحيق، {c} طارت إلى…', 'flower', 'الزهرة', 'box', 'rocket', ['bee']],
    [2, 'أراد الأرنب أن يقرأ، {c} فتح…', 'book', 'الكتاب', 'lemon', 'ball', ['rabbit']],
    [2, 'أرادت القطة أن تلعب، {c} أحضرت…', 'ball', 'الكرة', 'moon', 'leaf', ['cat']],
    [2, 'أراد الضفدع أن يعرف الوقت، {c} نظر إلى…', 'clock', 'الساعة', 'pumpkin', 'feather', ['frog']],

    [1, 'فتحت البطة المظلّة {c}…', 'rain', 'المطر ينزل', 'star', 'banana', ['duck', 'umbrella']],
    [1, 'أضاء الدب الفانوس {c}…', 'moon', 'الليل حلّ', 'apple', 'ball', ['bear', 'lantern']],
    [1, 'هرب العصفور {c}…', 'cat', 'القطة اقتربت', 'lemon', 'house', ['bird']],
    [1, 'فرحت النحلة {c}…', 'flower', 'الزهرة تفتّحت', 'rocket', 'box', ['bee']],
    [1, 'شرب الجمل ماءً كثيراً {c}…', 'sun', 'الشمس حارّة', 'book', 'crown', ['camel']],
    [1, 'لم تدخل القطة البيت {c}…', 'door', 'الباب مغلق', 'grapes', 'feather', ['cat', 'house']],
    [1, 'ذاب الثلج {c}…', 'sun', 'الشمس أشرقت', 'key', 'balloon', ['snow']],
    [1, 'لبس الخروف معطفه {c}…', 'snow', 'الثلج يتساقط', 'flower', 'key', ['lamb']],

    [0, 'أراد الأرنب أن يعبر النهر، {c}…', 'brokenbridge', 'الجسر مكسور', 'sun', 'carrot', ['rabbit']],
    [0, 'أرادت البطة أن تسبح في البركة، {c}…', 'snow', 'الماء تجمّد', 'book', 'apple', ['duck']],
    [0, 'أراد الدب أن يأكل العسل، {c}…', 'bee', 'النحلة تحرسه', 'ball', 'moon', ['bear']],
    [0, 'أرادت القطة أن تدخل البيت، {c}…', 'door', 'الباب مغلق', 'fish', 'star', ['cat', 'house']],
    [0, 'أراد الخروف أن يقطف التفاحة، {c}…', 'tree', 'الشجرة عالية', 'key', 'balloon', ['lamb', 'apple']],
    [0, 'أرادت البطة أن تلعب في الحديقة، {c}…', 'rain', 'المطر ينزل', 'crown', 'banana', ['duck']],
    [0, 'أراد الأرنب أن يقرأ حكايته، {c}…', 'moon', 'الظلام حلّ', 'carrot', 'ball', ['rabbit', 'book']],
    [0, 'أرادت البومة أن تنام، {c}…', 'sun', 'الشمس أشرقت', 'lemon', 'box', ['owl']],

    [3, 'الأرنب سريع، {c}…', 'turtle', 'السلحفاة بطيئة', 'apple', 'star', ['rabbit']],
    [3, 'الشمس تظهر في النهار، {c}…', 'moon', 'القمر يظهر في الليل', 'carrot', 'ball', ['sun']],
    [3, 'السمكة تسبح في الماء، {c}…', 'bird', 'العصفور يطير في السماء', 'key', 'crown', ['fish']],
    [3, 'الدب كبير، {c}…', 'bee', 'النحلة صغيرة', 'house', 'tree', ['bear']],
    [3, 'الثلج بارد، {c}…', 'sun', 'الشمس حارّة', 'book', 'balloon', ['snow']],
    [3, 'الليمون حامض، {c}…', 'banana', 'الموز حلو', 'clock', 'feather', ['lemon']],
    [3, 'الطائرة تطير في السماء، {c}…', 'train', 'القطار يسير على الأرض', 'flower', 'lantern', ['plane']],
    [3, 'الجمل يعيش في الصحراء، {c}…', 'fish', 'السمكة تعيش في البحر', 'rocket', 'strawberry', ['camel']]
  ];
  /* ترتيب الروابط حسب المستوى: من الأسهل إلى الأصعب */
  var LEVEL_CONN = [2, 1, 0, 3];

  var st = null, runner = kit.roundRunner();

  function connectorFor(level) {
    var wk = B.storage.data().settings.weeklyConnector | 0; // رابط الأسبوع من ركن الوالدين
    if (wk >= 1 && wk <= 4) return wk - 1;
    return level >= 5 ? kit.rand(4) : LEVEL_CONN[level - 1];
  }
  function nextSentence(ci) {
    if (!st.queues[ci] || !st.queues[ci].length) st.queues[ci] = kit.shuffle(BANK.filter(function (s) { return s[0] === ci; }));
    return st.queues[ci].pop();
  }

  function build(ctx) {
    var stage = ctx.stage;
    stage.classList.add('g-stage', 'br-stage');
    st.strip = h('div', { class: 'br-strip' });
    st.sceneArt = h('div', { class: 'br-situ' });
    stage.appendChild(h('div', { class: 'g-guide', text: B.S.guides.brRead }));
    st.tray = h('div', { class: 'br-options' });
    // مشهد الأسفل: نهر وجسر تُضاف إليه لوحة في كل جولة ويتقدم الأرنب
    st.planks = h('div', { class: 'br-planks' });
    for (var i = 0; i < ctx.total; i++) st.planks.appendChild(h('span', { class: 'br-plank' }));
    st.rabbit = h('div', { class: 'br-rabbit', html: art.animal('rabbit') });
    st.scene = h('div', { class: 'br-scene' }, h('div', { class: 'br-bank l' }), h('div', { class: 'br-bank r' }), st.planks, st.rabbit);
    stage.appendChild(st.strip);
    stage.appendChild(h('div', { class: 'g-main' }, st.sceneArt, st.tray));
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
    var ci = demo ? 2 : connectorFor(level), s = nextSentence(ci);
    st.strip.innerHTML = ''; st.tray.innerHTML = '';
    // الجملة: الرابط ملوّن ومكبّر في موضعه
    var parts = s[1].split('{c}');
    st.strip.appendChild(h('span', { class: 'br-text', text: parts[0] }));
    st.strip.appendChild(h('span', { class: 'br-conn c' + ci, text: CONNECTORS[ci] }));
    st.strip.appendChild(h('span', { class: 'br-text br-tail', text: parts[1] }));
    // المشهد: من هو؟ وما حاله؟
    st.sceneArt.innerHTML = '';
    (s[6] || []).forEach(function (k, i) {
      var pc = h('span', { class: 'br-situ-pic', html: B.pics.draw(k) });
      st.sceneArt.appendChild(pc);
      UI.anim(pc, [{ opacity: 0, transform: 'scale(.5)' }, { opacity: 1, transform: 'none' }], { dur: 450, delay: i * 150, easing: UI.SPRING, fill: 'backwards' });
    });
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
    st.strip.lastChild.textContent = parts[1].replace('…', '') + ' ' + s[3] + '.';
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
    cancelRound: function () { runner.cancel(); if (st) { st.strip.innerHTML = ''; st.tray.innerHTML = ''; st.sceneArt.innerHTML = ''; } },
    outro: function (ctx) { return kit.dusk(ctx); },
    endArt: function () { return kit.endScene('rabbit'); },
    destroy: function () { runner.stop(); st = null; },
    BANK: BANK, CONNECTORS: CONNECTORS, PHRASE: PHRASE,
    _solveStep: function () { if (st && st.answer) { st.answer.click(); return true; } return false; }
  };
})();
