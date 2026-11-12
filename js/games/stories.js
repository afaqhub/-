/* قصص مصورة يقرؤها الوالدان مع الطفل. كل قصة مشاهد مرسومة من عناصر المنصة، ونص كبير، وأسئلة حوار للوالدين في الختام.
   لإضافة قصة جديدة: أضف عنصراً إلى STORIES (id, title, cover, pages, ask, value). */
(function () {
  'use strict';
  var B = (window.Bustan = window.Bustan || {});
  B.free = B.free || {};
  var UI = B.UI, h = UI.h, art = B.art;
  function pic(k) { return B.pics.draw(k); }

  /* x و y و s نسب مئوية من عرض المشهد؛ flip لعكس الشخصية؛ fx حركة خفيفة */
  var STORIES = [
    {
      id: 'carrot', title: 'أرنوب والجزرة الكبيرة', cover: ['rabbit', 'carrot'], value: 'المشاركة والشكر', bgc: '#FFB84E',
      pages: [
        { bg: 'morning', text: 'في صباحٍ جميل، استيقظ الأرنب أرنوب وخرج يلعب في البستان.',
          ch: [{ k: 'sun', x: 82, y: 66, s: 20, fx: 'spin' }, { k: 'flower', x: 18, y: 4, s: 14, fx: 'sway' }, { k: 'rabbit', x: 50, y: 6, s: 34, fx: 'hop' }, { k: 'flower', x: 84, y: 5, s: 11, fx: 'sway' }] },
        { bg: 'day', text: 'وفجأةً وجد جزرةً كبيرةً بين الأوراق! فرح كثيرًا وقال: «ما أجملها، الحمد لله!»',
          ch: [{ k: 'rabbit', x: 30, y: 6, s: 32, fx: 'hop' }, { k: 'carrot', x: 70, y: 6, s: 30, fx: 'pop' }, { k: 'tree', x: 92, y: 8, s: 20, fx: 'sway' }] },
        { bg: 'day', text: 'مرّ الدب الصغير من هناك، وكان حزينًا. قال: «بطني يُصدر صوتًا، أنا جائع».',
          ch: [{ k: 'rabbit', x: 62, y: 6, s: 28, flip: true }, { k: 'carrot', x: 86, y: 6, s: 18 }, { k: 'bear', x: 26, y: 6, s: 32, fx: 'sway' }] },
        { bg: 'day', text: 'فكّر أرنوب: «لو أكلتُها وحدي شبعتُ أنا فقط، ولو تقاسمناها فرحنا معًا».',
          ch: [{ k: 'rabbit', x: 36, y: 6, s: 34, fx: 'hop' }, { k: 'heart', x: 62, y: 52, s: 16, fx: 'pop' }, { k: 'carrot', x: 70, y: 6, s: 24 }, { k: 'bear', x: 92, y: 6, s: 20 }] },
        { bg: 'day', text: 'فقسم الجزرة نصفين، وأعطى صديقه نصفًا وقال: «بسم الله، تفضّل!»',
          ch: [{ k: 'rabbit', x: 70, y: 6, s: 30, flip: true, fx: 'hop' }, { k: 'bear', x: 30, y: 6, s: 34 }, { k: 'carrot', x: 50, y: 14, s: 16, fx: 'pop' }] },
        { bg: 'day', text: 'ابتسم الدب وقال: «شكرًا يا أرنوب، ما أطيب قلبك!»',
          ch: [{ k: 'bear', x: 32, y: 6, s: 36, fx: 'hop' }, { k: 'heart', x: 50, y: 56, s: 14, fx: 'pop' }, { k: 'rabbit', x: 72, y: 6, s: 30, flip: true }, { k: 'star', x: 18, y: 62, s: 10, fx: 'spin' }] },
        { bg: 'day', text: 'ثم جاءت البطة والسلحفاة والعصفور، فتشاركوا جميعًا، وضحك البستان كله.',
          ch: [{ k: 'duck', x: 18, y: 6, s: 22, fx: 'sway' }, { k: 'rabbit', x: 42, y: 6, s: 24, fx: 'hop' }, { k: 'bear', x: 66, y: 6, s: 26 }, { k: 'turtle', x: 88, y: 5, s: 20 }, { k: 'bird', x: 50, y: 58, s: 14, fx: 'fly' }] },
        { bg: 'evening', text: 'وعاد أرنوب إلى بيته سعيدًا، فقد تعلّم أن الفرح يكبر حين نتشارك. الحمد لله.',
          ch: [{ k: 'sun', x: 20, y: 40, s: 24, fx: 'pop' }, { k: 'rabbit', x: 60, y: 6, s: 34, fx: 'hop' }, { k: 'heart', x: 82, y: 50, s: 14, fx: 'pop' }] }
      ],
      ask: ['ماذا فعل أرنوب بالجزرة الكبيرة؟', 'كيف شعر الدب حين تشاركا الجزرة؟', 'متى شاركتَ شيئًا جميلًا مع أحد؟ وكيف شعرتَ؟', 'ماذا نقول قبل الأكل وبعده؟']
    }
  ];

  function scene(p) {
    var s = h('div', { class: 'st-scene bg-' + p.bg });
    var vp = { w: 600, h: 200 };
    s.appendChild(h('div', { class: 'st-hills far', html: art.sceneTile('gfar', 600, 120) }));
    s.appendChild(h('div', { class: 'st-hills mid', html: art.sceneTile('gmid', 600, 90) }));
    p.ch.forEach(function (c, i) {
      var el = h('div', { class: 'st-ch' + (c.fx ? ' fx-' + c.fx : ''), style: { left: c.x + '%', bottom: c.y + '%', width: c.s + '%', animationDelay: (i * 0.35) + 's' } },
        h('div', { class: 'st-in', style: c.flip ? { transform: 'scaleX(-1)' } : {}, html: pic(c.k) }));
      s.appendChild(el);
    });
    return s;
  }

  B.free.stories = {
    open: function (ctx) {
      var stage = ctx.stage; stage.classList.add('st-stage');
      var root = h('div', { class: 'st-root' }); stage.appendChild(root);

      function library() {
        root.innerHTML = '';
        var grid = h('div', { class: 'st-lib' });
        STORIES.forEach(function (S) {
          var card = h('button', { class: 'st-card', type: 'button', 'aria-label': S.title },
            h('div', { class: 'st-cover', style: { background: 'linear-gradient(160deg,#BDE8FF,' + S.bgc + ')' } }, S.cover.map(function (k) { return h('span', { html: pic(k) }); })),
            h('b', { text: S.title }), h('small', { text: S.value }));
          UI.bindPress(card, function () { read(S, 0); });
          grid.appendChild(card);
        });
        grid.appendChild(h('div', { class: 'st-card soon' }, h('div', { class: 'st-cover soon' }, h('span', { html: pic('star') })), h('b', { text: B.S.stories.soon })));
        root.appendChild(h('h2', { class: 'st-h', text: B.S.stories.title }));
        root.appendChild(grid);
      }

      function read(S, i) {
        root.innerHTML = '';
        var last = i >= S.pages.length;
        if (last) { finish(S); return; }
        var P = S.pages[i];
        var sc = scene(P), txt = h('div', { class: 'st-text', text: P.text });
        var prev = h('button', { class: 'st-nav prev', type: 'button', 'aria-label': B.S.stories.prev }, h('span', { text: '→' }), h('b', { text: B.S.stories.prev }));
        var next = h('button', { class: 'st-nav next', type: 'button', 'aria-label': B.S.stories.next }, h('b', { text: B.S.stories.next }), h('span', { text: '←' }));
        if (i === 0) prev.disabled = true;
        var dots = h('div', { class: 'st-dots' }, S.pages.map(function (_, k) { return h('i', { class: k === i ? 'on' : (k < i ? 'done' : '') }); }));
        UI.bindPress(prev, function () { if (i > 0) { if (B.audio) B.audio.play('whoosh'); read(S, i - 1); } });
        UI.bindPress(next, function () { if (B.audio) B.audio.play(i === S.pages.length - 1 ? 'card' : 'whoosh'); read(S, i + 1); });
        root.appendChild(h('div', { class: 'st-title', text: S.title }));
        root.appendChild(h('div', { class: 'st-page' }, sc, txt));
        root.appendChild(h('div', { class: 'st-bar' }, prev, dots, next));
        UI.anim(sc, [{ opacity: 0, transform: 'translateX(-30px)' }, { opacity: 1, transform: 'none' }], { dur: 380, fill: 'none' });
        UI.anim(txt, [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { dur: 380, delay: 120, fill: 'backwards' });
      }

      function finish(S) {
        root.innerHTML = '';
        if (B.audio) B.audio.play('cheer');
        var sc = scene({ bg: 'evening', ch: [{ k: 'rabbit', x: 36, y: 6, s: 30, fx: 'hop' }, { k: 'bear', x: 66, y: 6, s: 30, fx: 'hop' }, { k: 'heart', x: 50, y: 56, s: 14, fx: 'pop' }, { k: 'star', x: 14, y: 60, s: 10, fx: 'spin' }, { k: 'star', x: 88, y: 66, s: 8, fx: 'spin' }] });
        var ask = h('div', { class: 'st-ask', style: { display: 'none' } }, h('b', { text: B.S.stories.askTitle + ' (' + S.value + ')' }),
          h('ol', {}, S.ask.map(function (q) { return h('li', { text: q }); })));
        var toggle = h('button', { class: 'st-nav ask-btn', type: 'button' }, h('b', { text: B.S.stories.parents }));
        UI.bindPress(toggle, function () { ask.style.display = ask.style.display === 'none' ? '' : 'none'; });
        var again = h('button', { class: 'st-nav next', type: 'button' }, h('b', { text: B.S.stories.again }));
        var lib = h('button', { class: 'st-nav prev', type: 'button' }, h('b', { text: B.S.stories.more }));
        UI.bindPress(again, function () { read(S, 0); });
        UI.bindPress(lib, library);
        root.appendChild(h('div', { class: 'st-title', text: B.S.stories.end }));
        root.appendChild(h('div', { class: 'st-page end' }, sc, h('div', { class: 'st-text', text: B.S.stories.endText })));
        root.appendChild(ask);
        root.appendChild(h('div', { class: 'st-bar wrap' }, lib, toggle, again));
      }
      library();
    },
    destroy: function () {}
  };
})();
