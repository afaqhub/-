/* قصص مصورة يقرؤها الوالدان مع الطفل.
   كل قصة: مقدمة للوالدين (القيمة + نصيحة إلقاء)، ثم مشاهد مرسومة بفقاعات حوار وأصوات يضغطها الطفل،
   ثم أنشطة ختامية قصيرة ومرحة (اختيار/شعور/ترتيب/حديث)، ثم مهمة صغيرة وملصق.
   لإضافة قصة: أضف عنصراً إلى STORIES. المواضع x و y و s نسب مئوية من عرض المشهد. */
(function () {
  'use strict';
  var B = (window.Bustan = window.Bustan || {});
  B.free = B.free || {};
  var UI = B.UI, h = UI.h, art = B.art, kit = B.kit;
  function pic(k, ex) {
    if (k.indexOf('svg:') === 0) return CUSTOM[k.slice(4)];
    return B.pics.draw(k, 'pic', ex);
  }
  /* تعبير الوجه: صريح عبر ex، وإلا يُستنتج من التأثيرات (حزن/دهشة/تفكير/فرح/جهد/خوف) */
  var EXMAP = { sad: 'sad', bang: 'surprised', q: 'think', joy: 'joy', zzz: 'sleepy' };
  function inferEx(c) {
    if (c.ex) return c.ex;
    var e = c.eff || [];
    for (var i = 0; i < e.length; i++) if (EXMAP[e[i]]) return EXMAP[e[i]];
    if (e.indexOf('effort') >= 0 && e.indexOf('sweat') >= 0) return 'strain';
    if (e.indexOf('sweat') >= 0) return 'scared';
    return '';
  }
  function sv(inner) { return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="pic">' + inner + '</svg>'; }

  /* رسوم خاصة بالقصص */
  var CUSTOM = {
    faucetOff: sv('<path d="M8 34H58Q74 34 74 50V58" stroke="#8FA0D8" stroke-width="14" fill="none" stroke-linecap="round"/><rect x="62" y="56" width="26" height="12" rx="4" fill="#6B7BB8"/><rect x="26" y="14" width="8" height="20" fill="#6B7BB8"/><ellipse cx="30" cy="12" rx="16" ry="6" fill="#F2658E"/>'),
    faucetOn: sv('<path d="M8 34H58Q74 34 74 50V58" stroke="#8FA0D8" stroke-width="14" fill="none" stroke-linecap="round"/><rect x="62" y="56" width="26" height="12" rx="4" fill="#6B7BB8"/><rect x="26" y="14" width="8" height="20" fill="#6B7BB8"/><ellipse cx="30" cy="12" rx="16" ry="6" fill="#F2658E"/><rect x="71" y="68" width="10" height="30" rx="5" fill="#5CC8FF"/><circle cx="76" cy="96" r="4" fill="#5CC8FF"/>'),
    bubbles: sv('<circle cx="34" cy="60" r="22" fill="#E6F6FF" stroke="#5CC8FF" stroke-width="4"/><circle cx="68" cy="40" r="16" fill="#E6F6FF" stroke="#5CC8FF" stroke-width="4"/><circle cx="72" cy="74" r="10" fill="#E6F6FF" stroke="#5CC8FF" stroke-width="4"/><circle cx="28" cy="52" r="5" fill="#fff"/>'),
    hole: sv('<ellipse cx="50" cy="70" rx="46" ry="20" fill="#8A5A33"/><ellipse cx="50" cy="64" rx="36" ry="13" fill="#4A2E18"/>'),
    pad: sv('<rect x="10" y="78" width="80" height="12" rx="5" fill="#8FA0D8"/><path d="M24 78V34M76 78V34M24 46H76M24 62H76" stroke="#6B7BB8" stroke-width="5" stroke-linecap="round"/>'),
    blocks: sv('<rect x="10" y="56" width="36" height="36" rx="5" fill="#F2658E"/><rect x="50" y="56" width="36" height="36" rx="5" fill="#5CC8FF"/><rect x="28" y="20" width="36" height="36" rx="5" fill="#FFD34E"/>'),
    basket: sv('<path d="M10 40H90L80 90H20Z" fill="#E9B068" stroke="#C98A3F" stroke-width="5" stroke-linejoin="round"/><path d="M26 40V90M42 40V90M58 40V90M74 40V90" stroke="#C98A3F" stroke-width="3"/>'),
    slide: sv('<path d="M10 92V18M28 92V18M10 34H28M10 52H28M10 70H28" stroke="#8FA0D8" stroke-width="5" stroke-linecap="round"/><path d="M30 20H46Q82 30 94 84L80 86Q70 46 46 36H30Z" fill="#FFC83D" stroke="#E2A21B" stroke-width="3" stroke-linejoin="round"/>'),
    tower: sv('<rect x="30" y="72" width="40" height="22" rx="4" fill="#F2658E"/><rect x="30" y="50" width="40" height="22" rx="4" fill="#5CC8FF"/><rect x="30" y="28" width="40" height="22" rx="4" fill="#FFD34E"/><rect x="30" y="6" width="40" height="22" rx="4" fill="#2DBE7E"/>'),
    pile: sv('<rect x="8" y="70" width="30" height="24" rx="4" fill="#F2658E" transform="rotate(-14 23 82)"/><rect x="40" y="76" width="30" height="20" rx="4" fill="#5CC8FF" transform="rotate(10 55 86)"/><rect x="62" y="64" width="28" height="24" rx="4" fill="#FFD34E" transform="rotate(24 76 76)"/><rect x="24" y="54" width="26" height="20" rx="4" fill="#2DBE7E" transform="rotate(-30 37 64)"/>'),
    vase: sv('<path d="M34 90H66L72 56Q76 44 62 38V28H38V38Q24 44 28 56Z" fill="#5CC8FF" stroke="#2468D1" stroke-width="4" stroke-linejoin="round"/><path d="M50 28Q40 10 30 14M50 28Q58 6 70 12" stroke="#2DBE7E" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="30" cy="14" r="7" fill="#F2658E"/><circle cx="70" cy="12" r="7" fill="#FFD34E"/>'),
    vaseBroken: sv('<path d="M10 90L24 60L36 84Z" fill="#5CC8FF" stroke="#2468D1" stroke-width="3" stroke-linejoin="round"/><path d="M40 92L52 56L66 88Z" fill="#5CC8FF" stroke="#2468D1" stroke-width="3" stroke-linejoin="round"/><path d="M68 90L80 70L92 92Z" fill="#5CC8FF" stroke="#2468D1" stroke-width="3" stroke-linejoin="round"/><circle cx="34" cy="50" r="6" fill="#F2658E"/><circle cx="76" cy="58" r="6" fill="#FFD34E"/>'),
    river: sv('<path d="M0 46Q14 36 28 46T56 46T84 46T100 46V92H0Z" fill="#5CC8FF"/><path d="M6 62Q20 54 34 62T62 62T90 62" stroke="#fff" stroke-width="3" fill="none" opacity=".7"/><path d="M0 78Q16 70 32 78T64 78T100 78" stroke="#fff" stroke-width="3" fill="none" opacity=".6"/>'),
    riverV: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 40" class="pic" preserveAspectRatio="none"><path d="M9 0H21L31 40H-1Z" fill="#C9A66B"/><path d="M10.5 0H19.5L28 40H2Z" fill="#5CC8FF"/><path d="M10.5 0H19.5L21.5 8H8.5Z" fill="#8DDCFF"/><path d="M7 12Q12 9 17 12T27 12" stroke="#fff" stroke-width="1.6" fill="none" opacity=".75"/><path d="M5 24Q11 20 17 24T29 24" stroke="#fff" stroke-width="1.8" fill="none" opacity=".7"/><path d="M3 35Q10 31 17 35T30 35" stroke="#fff" stroke-width="2" fill="none" opacity=".6"/></svg>',
    seed: sv('<ellipse cx="50" cy="52" rx="22" ry="30" fill="#8A5A33" transform="rotate(25 50 52)"/><ellipse cx="42" cy="40" rx="6" ry="12" fill="#B67B4D" transform="rotate(25 42 40)"/>'),
    sprout: sv('<path d="M50 94V56" stroke="#1C8F5C" stroke-width="7" stroke-linecap="round"/><path d="M50 66Q26 60 22 42Q44 42 50 66Z" fill="#2DBE7E"/><path d="M50 58Q74 50 78 32Q54 32 50 58Z" fill="#5ED38A"/>'),
    bloom: sv('<path d="M50 96V50" stroke="#1C8F5C" stroke-width="7" stroke-linecap="round"/><path d="M50 80Q28 74 24 58Q44 58 50 80Z" fill="#2DBE7E"/><path d="M50 72Q72 66 76 50Q56 50 50 72Z" fill="#5ED38A"/><g fill="#F2658E"><circle cx="50" cy="14" r="12"/><circle cx="68" cy="26" r="12"/><circle cx="64" cy="46" r="12"/><circle cx="36" cy="46" r="12"/><circle cx="32" cy="26" r="12"/></g><circle cx="50" cy="32" r="12" fill="#FFD34E"/>'),
    can: sv('<path d="M14 36H70L64 86Q63 92 57 92H27Q21 92 20 86Z" fill="#5CC8FF" stroke="#2468D1" stroke-width="4" stroke-linejoin="round"/><path d="M70 46L96 28" stroke="#2468D1" stroke-width="8" stroke-linecap="round"/><path d="M18 36Q42 8 66 36" stroke="#2468D1" stroke-width="5" fill="none"/>'),
    hive: sv('<ellipse cx="50" cy="82" rx="38" ry="12" fill="#C98A3F"/><path d="M18 80Q18 20 50 14Q82 20 82 80Z" fill="#FFC83D" stroke="#C98A3F" stroke-width="4"/><path d="M22 62H78M26 44H74M34 28H66" stroke="#C98A3F" stroke-width="4"/><ellipse cx="50" cy="66" rx="10" ry="12" fill="#6B4426"/>'),
    honey: sv('<rect x="22" y="30" width="56" height="60" rx="12" fill="#FFB62E" stroke="#C98A3F" stroke-width="4"/><rect x="26" y="14" width="48" height="16" rx="6" fill="#B67B4D"/><ellipse cx="42" cy="52" rx="5" ry="12" fill="#fff" opacity=".5"/>'),
    plank: sv('<rect x="4" y="38" width="92" height="24" rx="6" fill="#B67B4D" stroke="#8A5A33" stroke-width="4"/><path d="M20 38V62M42 38V62M64 38V62M82 38V62" stroke="#8A5A33" stroke-width="2.5"/>'),
    bridge: sv('<path d="M2 66H98" stroke="#8A5A33" stroke-width="3"/><rect x="2" y="44" width="96" height="22" rx="6" fill="#B67B4D" stroke="#8A5A33" stroke-width="4"/><path d="M18 44V66M38 44V66M58 44V66M78 44V66" stroke="#8A5A33" stroke-width="2.5"/><rect x="6" y="20" width="6" height="26" fill="#8A5A33"/><rect x="88" y="20" width="6" height="26" fill="#8A5A33"/><path d="M9 24H91" stroke="#8A5A33" stroke-width="4"/>'),
    chest: sv('<rect x="8" y="44" width="84" height="46" rx="8" fill="#B67B4D" stroke="#8A5A33" stroke-width="5"/><path d="M8 52Q50 28 92 52V44Q50 20 8 44Z" fill="#C98A3F" stroke="#8A5A33" stroke-width="5" stroke-linejoin="round"/><rect x="40" y="52" width="20" height="22" rx="4" fill="#FFD34E" stroke="#C98A3F" stroke-width="3"/><circle cx="50" cy="62" r="3.5" fill="#8A5A33"/>'),
    chestOpen: sv('<rect x="8" y="50" width="84" height="40" rx="8" fill="#B67B4D" stroke="#8A5A33" stroke-width="5"/><path d="M8 50L22 14H78L92 50Z" fill="#C98A3F" stroke="#8A5A33" stroke-width="5" stroke-linejoin="round"/><circle cx="32" cy="48" r="9" fill="#F0485A"/><circle cx="52" cy="44" r="9" fill="#FFB62E"/><circle cx="70" cy="48" r="9" fill="#5ED38A"/><path d="M50 6l4 8 9 1-6 6 2 9-9-5-9 5 2-9-6-6 9-1z" fill="#FFF3B0"/>'),
    map: sv('<path d="M10 14L90 10L92 86L12 90Z" fill="#F7E6B8" stroke="#C98A3F" stroke-width="4" stroke-linejoin="round"/><path d="M22 70Q34 30 52 52T78 28" stroke="#F0485A" stroke-width="4" fill="none" stroke-dasharray="7 7" stroke-linecap="round"/><path d="M72 22l12 12M84 22L72 34" stroke="#F0485A" stroke-width="5" stroke-linecap="round"/><circle cx="24" cy="72" r="5" fill="#2468D1"/>'),
    cave: sv('<path d="M2 96V54Q50 -14 98 54V96Z" fill="#6B5B7B"/><path d="M20 96V60Q50 12 80 60V96Z" fill="#1F1838"/>'),
    caveLit: sv('<path d="M2 96V54Q50 -14 98 54V96Z" fill="#6B5B7B"/><path d="M20 96V60Q50 12 80 60V96Z" fill="#FFE8A8"/><circle cx="34" cy="70" r="3" fill="#C98A3F"/><circle cx="66" cy="76" r="3" fill="#C98A3F"/>'),
    flag: sv('<rect x="14" y="8" width="6" height="86" rx="3" fill="#8A5A33"/><path d="M20 12H86V50H20Z" fill="#fff" stroke="#1F2A5A" stroke-width="3"/><path d="M20 12H36V28H20ZM52 12H68V28H52ZM36 28H52V44H36ZM68 28H84V44H68Z M20 44H20" fill="#1F2A5A"/><path d="M36 28h16v16H36zM68 28h16v16H68z" fill="#1F2A5A"/>'),
    shelf: sv('<rect x="6" y="14" width="88" height="10" rx="3" fill="#B67B4D"/><rect x="6" y="52" width="88" height="10" rx="3" fill="#B67B4D"/><rect x="6" y="88" width="88" height="8" rx="3" fill="#B67B4D"/><rect x="6" y="14" width="8" height="82" fill="#8A5A33"/><rect x="86" y="14" width="8" height="82" fill="#8A5A33"/>')
  };
  function face(kind) {   // وجه دائري: سعيد / حزين / متعجب
    var mouth = kind === 'happy' ? '<path d="M30 60Q50 82 70 60" stroke="#3A2A3F" stroke-width="6" fill="none" stroke-linecap="round"/>'
      : kind === 'sad' ? '<path d="M32 74Q50 54 68 74" stroke="#3A2A3F" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M26 34L40 40M74 34L60 40" stroke="#3A2A3F" stroke-width="4" stroke-linecap="round"/>'
      : '<ellipse cx="50" cy="68" rx="9" ry="12" fill="#3A2A3F"/>';
    return sv('<circle cx="50" cy="50" r="42" fill="#FFD34E" stroke="#E2A21B" stroke-width="4"/><circle cx="36" cy="42" r="6" fill="#3A2A3F"/><circle cx="64" cy="42" r="6" fill="#3A2A3F"/>' + mouth);
  }

  var PRAISE = ['أحسنت!', 'يا سلام عليك!', 'رائع، تذكّرت القصة!', 'ما شاء الله!'];

  /* ═════════ القصص ═════════ */
  var STORIES = [
    {
      id: 'carrot', kind: 'short', age: '٣–٥ سنوات', mins: 2, title: 'أرنوب والجزرة الكبيرة', cover: ['rabbit', 'carrot'], value: 'التعاون', sticker: 'صديق متعاون', bgc: '#FFB84E',
      tip: 'اقرؤوها بحماس: ارفعوا الصوت عند «شدّ!»، وعدّوا مع الطفل «واحد، اثنان، ثلاثة»، ثم دعوه يضغط الجزرة لتخرج. غيّروا نبرة الصوت بين الأرنب والأصدقاء.',
      why: 'نتعلم أن الأعمال الصعبة تصير سهلة حين نتعاون، وأن الفرح يكبر حين نتشارك.',
      scenes: [
        { bg: 'day', text: 'في البستان، رأى أرنوب جزرةً ضخمةً ضخمة!', say: [{ w: 0, t: 'يا سلام! جزرة كبيرة!' }],
          ch: [{ k: 'rabbit', x: 28, y: 6, s: 30, fx: 'hop', eff: ['joy'] }, { k: 'carrot', x: 72, y: 8, s: 32, buried: true, fx: 'pop' }] },
        { bg: 'day', text: 'أمسك الجزرة وشدّ وشدّ… لكنها لم تتحرك!', say: [{ w: 0, t: 'هيه… لا أستطيع!' }],
          ch: [{ k: 'rabbit', x: 44, y: 6, s: 30, tilt: -16, hold: 1, eff: ['sweat', 'effort'] }, { k: 'carrot', x: 76, y: 8, s: 30, buried: true, hy: 0.7, tap: 'place', note: 'اضغط الجزرة' }] },
        { bg: 'day', text: 'جاءت البطة والسلحفاة والدب.', say: [{ w: 3, t: 'هل نساعدك يا أرنوب؟' }, { w: 4, t: 'نعم! تعالوا!' }],
          ch: [{ k: 'carrot', x: 90, y: 8, s: 16, buried: true }, { k: 'duck', x: 12, y: 6, s: 18, fx: 'hop' }, { k: 'turtle', x: 32, y: 5, s: 18 }, { k: 'bear', x: 52, y: 6, s: 22, fx: 'hop' }, { k: 'rabbit', x: 74, y: 6, s: 20, eff: ['sweat'] }] },
        { bg: 'day', text: 'أمسكوا بعضهم بعضًا وعدّوا: واحد، اثنان، ثلاثة!', say: [{ w: 2, t: 'واحد… اثنان… ثلاثة… شدّ!' }],
          ch: [{ k: 'carrot', x: 91, y: 8, s: 18, buried: true, hy: 0.7, tap: 'whoosh', act: { dy: 16, rot: 28, soil: false, arc: true, dur: 1000, snd2: 'pop' }, note: 'اضغط لتخرج' }, { k: 'rabbit', x: 72, y: 6, s: 21, tilt: -15, hold: 0, eff: ['sweat'] }, { k: 'bear', x: 52, y: 6, s: 22, tilt: -15, hold: 1, eff: ['effort'] }, { k: 'turtle', x: 33, y: 5, s: 19, tilt: -13, hold: 2 }, { k: 'duck', x: 14, y: 6, s: 17, tilt: -13, hold: 3, eff: ['sweat'] }] },
        { bg: 'day', text: 'خرجت الجزرة! وسقط الجميع على ظهورهم وضحكوا.', say: [{ w: 3, t: 'هيييه! نجحنا معًا!' }],
          ch: [{ k: 'svg:hole', x: 88, y: 3, s: 16 }, { k: 'carrot', x: 70, y: 5, s: 20, tilt: -35, fx: 'pop', tap: 'cheer', act: { bounce: 3 }, note: 'اضغط للاحتفال' }, { k: 'rabbit', x: 50, y: 4, s: 16, tilt: -62, eff: ['joy'] }, { k: 'bear', x: 32, y: 4, s: 18, tilt: -62 }, { k: 'duck', x: 14, y: 4, s: 14, tilt: -62 }] },
        { bg: 'evening', text: 'تقاسموا الجزرة وقالوا: بسم الله.', say: [{ w: 0, t: 'بسم الله… شكرًا يا أصدقائي!' }],
          ch: [{ k: 'rabbit', x: 72, y: 6, s: 26, flip: true, hold: 3, eff: ['joy'] }, { k: 'bear', x: 26, y: 6, s: 28, hold: 2 }, { k: 'carrot', x: 44, y: 22, s: 13, tilt: -25 }, { k: 'carrot', x: 56, y: 22, s: 13, tilt: 25 }] }
      ],
      acts: [
        { t: 'pick', q: 'ماذا وجد أرنوب في البستان؟', opts: [{ k: 'carrot', ok: 1 }, { k: 'ball' }], hint: 'تذكّر: شيء برتقالي يحبه الأرانب.' },
        { t: 'pick', q: 'من جاء ليساعد أرنوب؟', opts: [{ k: 'owl' }, { k: 'duck', ok: 1 }, { k: 'cat' }], hint: 'جاءت البطة والسلحفاة والدب.' },
        { t: 'feel', q: 'كيف شعر أرنوب حين ساعده أصدقاؤه؟', ans: 'happy' },
        { t: 'order', q: 'رتّب القصة: ماذا حدث أولًا، ثم ثانيًا، ثم ثالثًا؟', items: [{ k: 'carrot', t: 'رأى الجزرة' }, { k: 'duck', t: 'جاء الأصدقاء' }, { k: 'heart', t: 'تقاسموها' }] },
        { t: 'talk', q: 'متى ساعدك أحد؟ ومتى ساعدتَ أنت أحدًا؟' }
      ],
      mission: 'ساعد أحدًا في بيتك اليوم في عمل صغير، مثل حمل شيء أو ترتيبه.'
    },
    {
      id: 'rocket', kind: 'short', age: '٣–٥ سنوات', mins: 2, title: 'الصاروخ الصغير والمحاولة', cover: ['rocket', 'moon'], value: 'الصبر والمحاولة', sticker: 'بطل المحاولة', bgc: '#8E7CF0',
      tip: 'اقرؤوا العدّ التنازلي ببطء ثم بحماس: «ثلاثة… اثنان… واحد…» وتوقفوا قليلًا قبل أن يفشل! ثم دعوا الطفل يضغط الصاروخ ليطير في المشهد الأخير.',
      why: 'لا بأس أن لا ننجح من أول مرة؛ المحاولة، وطلب المساعدة، والصبر توصلنا إلى أحلامنا.',
      scenes: [
        { bg: 'night', text: 'نظر الصاروخ الصغير «نجم» إلى القمر وحلم بالوصول إليه.', say: [{ w: 0, t: 'ما أجمل القمر! أريد أن أصل إليه!' }],
          ch: [{ k: 'rocket', x: 34, y: 8, s: 26, tilt: 14, fx: 'sway', eff: ['joy'] }, { k: 'moon', x: 76, y: 52, s: 26, fx: 'pop' }, { k: 'star', x: 18, y: 68, s: 8, fx: 'spin' }] },
        { bg: 'night', text: 'استعدّ للانطلاق وبدأ العدّ.', say: [{ w: 1, t: 'ثلاثة… اثنان… واحد…' }],
          ch: [{ k: 'svg:pad', x: 40, y: 3, s: 26 }, { k: 'rocket', x: 40, y: 14, s: 20, fx: 'sway' }, { k: 'moon', x: 80, y: 56, s: 18 }] },
        { bg: 'night', text: 'لكن الصاروخ لم ينطلق! فحزن نجم.', say: [{ w: 1, t: 'آه… لم أستطع…' }],
          ch: [{ k: 'svg:pad', x: 40, y: 3, s: 26 }, { k: 'rocket', x: 40, y: 14, s: 20, tilt: -10, eff: ['sad', 'smoke'] }, { k: 'cloud', x: 80, y: 60, s: 20, fx: 'sway' }] },
        { bg: 'day', text: 'وفي الصباح جاء الدب وربّت عليه وشجّعه.', say: [{ w: 0, t: 'لا تحزن يا نجم! سنحاول معًا.' }, { w: 1, t: 'شكرًا يا دبدوب!' }],
          ch: [{ k: 'bear', x: 28, y: 6, s: 30, hold: 1, fx: 'hop' }, { k: 'rocket', x: 66, y: 6, s: 22, fx: 'sway', eff: ['joy'] }] },
        { bg: 'day', text: 'وساعده أصدقاؤه في تجهيز منصة الانطلاق.', say: [{ w: 1, t: 'هيا نجهّز كل شيء!' }],
          ch: [{ k: 'svg:pad', x: 50, y: 3, s: 24 }, { k: 'bear', x: 20, y: 6, s: 24, hold: 0, eff: ['effort'] }, { k: 'fox', x: 80, y: 6, s: 22, hold: 0, flip: true, fx: 'hop' }, { k: 'rocket', x: 50, y: 13, s: 18, fx: 'sway' }] },
        { bg: 'night', text: 'وفي المساء انطلق الصاروخ إلى السماء… ووصل نجم إلى القمر! الحمد لله.', say: [],
          ch: [{ k: 'rocket', x: 34, y: 8, s: 22, tilt: 0, tap: 'whoosh', act: { to: [56, 50], rot: 22, arc: true, dur: 2200, ease: 'ease-in', eff: ['flame', 'smoke'], snd2: 'cheer', after: { eff: true } }, note: 'اضغط الصاروخ ليطير' }, { k: 'moon', x: 74, y: 52, s: 28, fx: 'pop' }, { k: 'star', x: 14, y: 72, s: 8, fx: 'spin' }, { k: 'star', x: 90, y: 74, s: 8, fx: 'spin' }] }
      ],
      acts: [
        { t: 'pick', q: 'لماذا حزن نجم؟', opts: [{ k: 'rocket', t: 'لم ينطلق', ok: 1 }, { k: 'moon', t: 'القمر بعيد' }], hint: 'عدّ نجم… لكن الصاروخ لم ينطلق.' },
        { t: 'pick', q: 'من شجّع نجمًا؟', opts: [{ k: 'bear', ok: 1 }, { k: 'owl' }], hint: 'جاء صديق قوي كبير يحب العسل.' },
        { t: 'feel', q: 'كيف شعر نجم حين وصل إلى القمر؟', ans: 'happy' },
        { t: 'order', q: 'رتّب القصة:', items: [{ k: 'moon', t: 'حلم بالقمر' }, { k: 'bear', t: 'شجّعه الدب' }, { k: 'rocket', t: 'انطلق ووصل' }] },
        { t: 'talk', q: 'ماذا تفعل حين يصعب عليك شيء؟' }
      ],
      mission: 'جرّب اليوم شيئًا صعبًا صغيرًا، ولا تستسلم من أول مرة!'
    },
    {
      id: 'ball', kind: 'short', age: '٣–٥ سنوات', mins: 2, title: 'الكرة ليست لي!', cover: ['ball', 'rabbit'], value: 'الأمانة', sticker: 'صديق أمين', bgc: '#FF8A7A',
      tip: 'اقرؤوا بدهشة عند العثور على الكرة، وبصوت حزين لطيف حين تبحث السلحفاة. ثم اسألوا الطفل: «ماذا ستفعل لو كنتَ مكانه؟» قبل أن تكملوا.',
      why: 'إذا وجدنا شيئًا ليس لنا، نبحث عن صاحبه ونعيده إليه؛ فهذه الأمانة، والناس يحبون الأمين.',
      scenes: [
        { bg: 'day', text: 'وجد أرنوب كرةً حمراء جميلة قرب الشجرة.', say: [{ w: 0, t: 'ما أجمل هذه الكرة!' }],
          ch: [{ k: 'rabbit', x: 30, y: 6, s: 30, fx: 'hop', eff: ['joy'] }, { k: 'ball', x: 58, y: 6, s: 16, tap: 'pop', act: { bounce: 3 }, note: 'اضغط الكرة' }, { k: 'tree', x: 86, y: 6, s: 24, fx: 'sway' }] },
        { bg: 'day', text: 'حمل الكرة ونظر حوله ونادى.', say: [{ w: 0, t: 'يا أصدقاء! لمن هذه الكرة؟' }],
          ch: [{ k: 'rabbit', x: 36, y: 6, s: 30, hold: 1, eff: ['q'] }, { k: 'ball', x: 60, y: 24, s: 14, fx: 'hop' }, { k: 'duck', x: 86, y: 6, s: 14 }] },
        { bg: 'day', text: 'جاءت السلحفاة تبحث عن شيء.', say: [{ w: 0, t: 'أين كرتي الحمراء؟ لقد فقدتها!' }],
          ch: [{ k: 'turtle', x: 26, y: 5, s: 26, fx: 'sway', eff: ['q', 'sad'] }, { k: 'rabbit', x: 70, y: 6, s: 26, flip: true, hold: 2 }, { k: 'ball', x: 52, y: 22, s: 12 }] },
        { bg: 'day', text: 'فعرف أرنوب صاحبة الكرة وأعطاها إياها.', say: [{ w: 2, t: 'هل هذه كرتك؟ وجدتها قرب الشجرة.' }, { w: 0, t: 'نعم! شكرًا لأنك أعدتها إليّ!' }],
          ch: [{ k: 'turtle', x: 26, y: 5, s: 26, hold: 1, eff: ['joy'] }, { k: 'ball', x: 50, y: 18, s: 14, fx: 'pop' }, { k: 'rabbit', x: 74, y: 6, s: 28, flip: true, hold: 1 }] },
        { bg: 'evening', text: 'ثم لعبا معًا بالكرة وضحكا كثيرًا.', say: [{ w: 2, t: 'هل تلعب معي؟' }, { w: 0, t: 'بكل سرور!' }],
          ch: [{ k: 'turtle', x: 24, y: 5, s: 24, fx: 'hop', eff: ['joy'] }, { k: 'ball', x: 50, y: 28, s: 14, fx: 'hop', tap: 'pop', act: { bounce: 3 }, note: 'اضغط الكرة' }, { k: 'rabbit', x: 76, y: 6, s: 28, flip: true, fx: 'hop' }] }
      ],
      acts: [
        { t: 'pick', q: 'لمن كانت الكرة؟', opts: [{ k: 'duck' }, { k: 'turtle', ok: 1 }, { k: 'bear' }], hint: 'جاءت تبحث عنها بين الأشجار، وهي بطيئة وعلى ظهرها بيت.' },
        { t: 'pick', q: 'أيّ تصرّف أجمل؟', opts: [{ k: 'ball', t: 'نعيد الشيء لصاحبه', ok: 1 }, { k: 'tree', t: 'نخبّئه ونأخذه' }], hint: 'الأمين يعيد ما وجده إلى صاحبه.' },
        { t: 'feel', q: 'كيف شعرت السلحفاة حين عادت كرتها؟', ans: 'happy' },
        { t: 'order', q: 'رتّب القصة:', items: [{ k: 'ball', t: 'وجد الكرة' }, { k: 'turtle', t: 'ظهرت صاحبتها' }, { k: 'heart', t: 'لعبا معًا' }] },
        { t: 'talk', q: 'ماذا تفعل لو وجدت لعبة في الحديقة ولا تعرف صاحبها؟' }
      ],
      mission: 'إذا وجدتَ شيئًا ليس لك، أعطه لأبيك أو أمك ليعيداه لصاحبه.'
    },
    {
      id: 'toys', kind: 'short', age: '٣–٥ سنوات', mins: 2, title: 'الألعاب لها بيوت!', cover: ['car', 'box'], value: 'الترتيب', sticker: 'بطل الترتيب', bgc: '#6AB7FF',
      tip: 'دعوا الطفل يضغط كل لعبة لتذهب إلى مكانها. اسألوه بين المشاهد: «أين تُوضع الكرة؟» ثم اقرؤوا الإجابة معه.',
      why: 'حين نرتب الألعاب بعد اللعب نجدها بسهولة، ويبقى بيتنا جميلًا، وهذا من الاهتمام بما عندنا.',
      scenes: [
        { bg: 'room', text: 'لعب أرنوب بالكرة والسيارة والمكعبات.', say: [{ w: 1, t: 'ما أحلى اللعب!' }],
          ch: [{ k: 'ball', x: 18, y: 6, s: 14, fx: 'hop' }, { k: 'rabbit', x: 46, y: 6, s: 30, fx: 'hop', eff: ['joy'] }, { k: 'car', x: 78, y: 4, s: 22 }, { k: 'svg:blocks', x: 12, y: 24, s: 12 }] },
        { bg: 'room', text: 'ثم أراد الخروج، فنظر إلى الغرفة.', say: [{ w: 2, t: 'يا إلهي! الألعاب في كل مكان!' }],
          ch: [{ k: 'ball', x: 14, y: 4, s: 12 }, { k: 'car', x: 30, y: 12, s: 18 }, { k: 'rabbit', x: 56, y: 6, s: 30, eff: ['bang'] }, { k: 'svg:blocks', x: 84, y: 5, s: 14 }, { k: 'book', x: 72, y: 38, s: 10 }] },
        { bg: 'room', text: 'قال الدب: لكل لعبة بيت تعود إليه.', say: [{ w: 1, t: 'هيا نرتّبها معًا!' }, { w: 0, t: 'فكرة جميلة!' }],
          ch: [{ k: 'rabbit', x: 28, y: 6, s: 26 }, { k: 'bear', x: 62, y: 6, s: 28, fx: 'hop' }, { k: 'svg:basket', x: 90, y: 4, s: 16 }] },
        { bg: 'room', text: 'ضع كل لعبة في مكانها!', say: [],
          ch: [{ k: 'svg:basket', x: 20, y: 4, s: 20 }, { k: 'ball', x: 14, y: 40, s: 12, tap: 'place', act: { to: [20, 11], arc: true, dur: 900 }, note: 'اضغط الكرة' }, { k: 'svg:shelf', x: 78, y: 4, s: 26 }, { k: 'car', x: 78, y: 38, s: 16, tap: 'place', act: { to: [78, 14], arc: true, dur: 900 }, note: 'اضغط السيارة' }, { k: 'rabbit', x: 48, y: 6, s: 24, fx: 'hop' }] },
        { bg: 'room', text: 'صارت الغرفة مرتبة، ووجد أرنوب كل شيء!', say: [{ w: 0, t: 'يا سلام! ما أجمل الغرفة!' }],
          ch: [{ k: 'svg:basket', x: 20, y: 4, s: 20 }, { k: 'ball', x: 20, y: 14, s: 10 }, { k: 'svg:shelf', x: 78, y: 4, s: 26 }, { k: 'car', x: 78, y: 12, s: 12 }, { k: 'rabbit', x: 48, y: 6, s: 28, fx: 'hop' }, { k: 'star', x: 50, y: 62, s: 9, fx: 'spin', tap: 'sparkle', act: { bounce: 2 }, note: 'اضغط النجمة' }] }
      ],
      acts: [
        { t: 'pick', q: 'ماذا نفعل بعد اللعب؟', opts: [{ k: 'svg:basket', t: 'نرتّب الألعاب', ok: 1 }, { k: 'svg:blocks', t: 'نتركها مبعثرة' }], hint: 'لكل لعبة بيت تعود إليه.' },
        { t: 'pick', q: 'من قال: هيا نرتّبها معًا؟', opts: [{ k: 'fox' }, { k: 'bear', ok: 1 }], hint: 'صديق كبير بني اللون.' },
        { t: 'feel', q: 'كيف شعر أرنوب حين أصبحت الغرفة مرتبة؟', ans: 'happy' },
        { t: 'order', q: 'رتّب القصة:', items: [{ k: 'ball', t: 'لعب' }, { k: 'svg:blocks', t: 'تبعثرت الألعاب' }, { k: 'svg:basket', t: 'رتّبها' }] },
        { t: 'talk', q: 'أين تضع ألعابك بعد اللعب؟' }
      ],
      mission: 'رتّب ثلاث ألعاب في غرفتك الآن!'
    },
    {
      id: 'water', kind: 'short', age: '٣–٥ سنوات', mins: 2, title: 'قطرة الماء الصغيرة', cover: ['svg:faucetOn', 'rabbit'], value: 'المحافظة على الماء', sticker: 'صديق الماء', bgc: '#5CC8FF',
      tip: 'دعوا الطفل يضغط الصنبور لتسمعوا صوت الماء، ثم يضغطه ليُغلق. بعد القصة جرّبوا فعلًا: أغلقوا الصنبور أثناء فرك اليدين بالصابون.',
      why: 'الماء نعمة من الله، فلا نسرف فيه؛ نغلق الصنبور حين لا نحتاجه.',
      scenes: [
        { bg: 'bath', text: 'ذهب أرنوب ليغسل يديه، ففتح الصنبور.', say: [{ w: 0, t: 'سأغسل يديّ بالصابون.' }],
          ch: [{ k: 'rabbit', x: 30, y: 6, s: 32, hold: 1 }, { k: 'svg:faucetOn', x: 74, y: 30, s: 30, hy: 0.78, tap: 'splash', act: { shake: true }, note: 'اضغط الصنبور' }] },
        { bg: 'bath', text: 'وبدأ يفرك يديه والماء يجري ويجري…', say: [{ w: 0, t: 'فرك… فرك… فرك…' }],
          ch: [{ k: 'rabbit', x: 30, y: 6, s: 32, hold: 1, eff: ['sweat'] }, { k: 'svg:bubbles', x: 52, y: 22, s: 18, fx: 'pop' }, { k: 'svg:faucetOn', x: 74, y: 30, s: 30, tap: 'splash', note: 'اضغط الصنبور' }] },
        { bg: 'bath', text: 'رأته السلحفاة، فقالت له كلمة لطيفة.', say: [{ w: 2, t: 'يا أرنوب، نغلق الصنبور ونحن نفرك أيدينا!' }],
          ch: [{ k: 'rabbit', x: 26, y: 6, s: 28 }, { k: 'svg:bubbles', x: 26, y: 38, s: 14 }, { k: 'turtle', x: 56, y: 5, s: 22, fx: 'hop' }, { k: 'svg:faucetOn', x: 86, y: 30, s: 24 }] },
        { bg: 'bath', text: 'فأغلق أرنوب الصنبور، وفرك يديه بالصابون.', say: [{ w: 0, t: 'فكرة جميلة! الحمد لله.' }],
          ch: [{ k: 'rabbit', x: 30, y: 6, s: 32, hold: 2, eff: ['joy'] }, { k: 'svg:bubbles', x: 52, y: 22, s: 18, fx: 'pop' }, { k: 'svg:faucetOff', x: 76, y: 30, s: 28, hy: 0.78, tap: 'pop', act: { swap: 'svg:faucetOn' }, note: 'اضغط لفتح الصنبور' }] },
        { bg: 'bath', text: 'ثم فتح الصنبور قليلًا، وشطف يديه، وأغلقه.', say: [{ w: 2, t: 'أحسنت! هكذا نحافظ على الماء.' }],
          ch: [{ k: 'rabbit', x: 26, y: 6, s: 28, fx: 'hop' }, { k: 'turtle', x: 56, y: 5, s: 22, fx: 'hop' }, { k: 'svg:faucetOn', x: 86, y: 30, s: 24, tap: 'splash', note: 'اضغط الصنبور' }, { k: 'star', x: 44, y: 64, s: 9, fx: 'spin' }] }
      ],
      acts: [
        { t: 'pick', q: 'متى نغلق الصنبور؟', opts: [{ k: 'svg:bubbles', t: 'ونحن نفرك بالصابون', ok: 1 }, { k: 'svg:faucetOn', t: 'لا نغلقه أبدًا' }], hint: 'نغلقه حين لا نحتاج الماء.' },
        { t: 'pick', q: 'من نصح أرنوب؟', opts: [{ k: 'turtle', ok: 1 }, { k: 'owl' }], hint: 'جاءت صديقة بطيئة وعلى ظهرها بيت.' },
        { t: 'feel', q: 'كيف شعر أرنوب لما تعلّم كيف يحافظ على الماء؟', ans: 'happy' },
        { t: 'order', q: 'رتّب القصة:', items: [{ k: 'svg:faucetOn', t: 'فتح الصنبور' }, { k: 'turtle', t: 'نصحته السلحفاة' }, { k: 'svg:faucetOff', t: 'أغلقه وفرك' }] },
        { t: 'talk', q: 'متى نغلق الصنبور؟ ولماذا نحافظ على الماء؟' }
      ],
      mission: 'أغلق الصنبور اليوم أثناء وضع الصابون على يديك.'
    },
    {
      id: 'turn', kind: 'short', age: '٣–٥ سنوات', mins: 2, title: 'لكل واحد دور', cover: ['svg:slide', 'duck'], value: 'انتظار الدور', sticker: 'صديق صبور', bgc: '#FFC83D',
      tip: 'اقرؤوا عبارة «وأنا أيضًا!» بنبرة متسرّعة، ثم «ما رأيكما أن ينتظر كل واحد دوره؟» بنبرة هادئة. دعوا الطفل يضغط الأرنب ثم البطة لينزلقا بالدور.',
      why: 'حين ننتظر دورنا يلعب الجميع بسلام، ونصير أحب إلى أصدقائنا.',
      scenes: [
        { bg: 'day', text: 'وصل الأرنب والبطة إلى الحديقة، وكلاهما يريد الزحليقة.', say: [{ w: 1, t: 'أريد أن ألعب أولًا!' }, { w: 2, t: 'وأنا أيضًا!' }],
          ch: [{ k: 'svg:slide', x: 52, y: 4, s: 30 }, { k: 'rabbit', x: 16, y: 5, s: 22, tilt: 8, eff: ['bang'] }, { k: 'duck', x: 88, y: 5, s: 18, tilt: -8, eff: ['bang'] }] },
        { bg: 'day', text: 'نظرا إلى بعضهما، ولم يعرفا من يبدأ.', say: [{ w: 3, t: 'ما رأيكما أن ينتظر كل واحد دوره؟' }],
          ch: [{ k: 'svg:slide', x: 52, y: 4, s: 26 }, { k: 'rabbit', x: 14, y: 5, s: 20, eff: ['q'] }, { k: 'duck', x: 88, y: 5, s: 16, eff: ['q'] }, { k: 'turtle', x: 36, y: 4, s: 18, fx: 'hop' }] },
        { bg: 'day', text: 'اتفقا أن يبدأ الأرنب، وتنتظر البطة.', say: [{ w: 1, t: 'سأبدأ أنا، ثم يأتي دورك يا بطة.' }],
          ch: [{ k: 'svg:slide', x: 54, y: 4, s: 30 }, { k: 'rabbit', x: 40, y: 34, s: 15, tilt: 25, tap: 'whoosh', act: { to: [72, 5], rot: -25, dur: 1300, ease: 'cubic-bezier(.45,0,.9,.55)', snd2: 'pop' }, note: 'اضغط الأرنب لينزلق' }, { k: 'duck', x: 12, y: 5, s: 18, fx: 'sway' }] },
        { bg: 'day', text: 'جاء دور البطة، وصفّق الأرنب لها.', say: [{ w: 2, t: 'شكرًا لأنك انتظرت دوري!' }],
          ch: [{ k: 'svg:slide', x: 54, y: 4, s: 30 }, { k: 'duck', x: 40, y: 34, s: 14, tilt: 25, tap: 'whoosh', act: { to: [72, 5], rot: -25, dur: 1300, ease: 'cubic-bezier(.45,0,.9,.55)', snd2: 'pop' }, note: 'اضغط البطة لتنزلق' }, { k: 'rabbit', x: 88, y: 5, s: 20, eff: ['joy'] }] },
        { bg: 'evening', text: 'ثم لعب الأصدقاء جميعًا بفرح.',
          ch: [{ k: 'rabbit', x: 22, y: 5, s: 22, fx: 'hop', eff: ['joy'] }, { k: 'turtle', x: 50, y: 4, s: 18, fx: 'hop' }, { k: 'duck', x: 78, y: 5, s: 20, fx: 'hop', eff: ['joy'] }] }
      ],
      acts: [
        { t: 'pick', q: 'من لعب أولًا؟', opts: [{ k: 'rabbit', ok: 1 }, { k: 'duck' }], hint: 'اتفقا أن يبدأ صاحب الأذنين الطويلتين.' },
        { t: 'pick', q: 'ماذا فعل الأرنب حين جاء دور البطة؟', opts: [{ k: 'heart', t: 'صفّق لها وانتظر', ok: 1 }, { k: 'svg:slide', t: 'أخذ مكانها' }], hint: 'الصديق الطيب يفرح لصديقه.' },
        { t: 'feel', q: 'كيف شعرت البطة لمّا انتظر الأرنب دورها؟', ans: 'happy' },
        { t: 'order', q: 'رتّب القصة:', items: [{ k: 'svg:slide', t: 'اختلفا على الزحليقة' }, { k: 'turtle', t: 'اقترحت السلحفاة الانتظار' }, { k: 'heart', t: 'لعبا بالدور' }] },
        { t: 'talk', q: 'متى انتظرتَ دورك؟ وماذا فعلت وأنت تنتظر؟' }
      ],
      mission: 'اليوم انتظر دورك في اللعب أو الكلام، وقل لمن ينتظرك: تفضّل.'
    },
    {
      id: 'sorry', kind: 'short', age: '٣–٥ سنوات', mins: 2, title: 'آسف، سأصلح ما فعلت', cover: ['svg:tower', 'fox'], value: 'الاعتذار وإصلاح ما أفسدناه', sticker: 'صديق شجاع', bgc: '#FF9A5C',
      tip: 'اقرؤوا «أوه! لم أنتبه!» بدهشة، و«أنا آسف» بصوت صادق هادئ. اسألوا الطفل: ماذا نفعل بعد أن نقول آسف؟',
      why: 'إذا أخطأنا دون قصد نعتذر، ونساعد في إصلاح ما حدث؛ فالاعتذار بالكلام والفعل.',
      scenes: [
        { bg: 'room', text: 'كان الدب يبني برجًا عاليًا من المكعبات.', say: [{ w: 0, t: 'ما أجمل برجي!' }],
          ch: [{ k: 'bear', x: 28, y: 5, s: 30, fx: 'hop', eff: ['joy'] }, { k: 'svg:tower', x: 70, y: 4, s: 22 }] },
        { bg: 'room', text: 'جاء الثعلب مسرعًا فاصطدم بالبرج دون قصد!', say: [{ w: 1, t: 'أوه! لم أنتبه!' }],
          ch: [{ k: 'svg:pile', x: 74, y: 4, s: 24 }, { k: 'fox', x: 50, y: 5, s: 26, tilt: 22, eff: ['bang'] }, { k: 'bear', x: 20, y: 5, s: 26, eff: ['sad'] }] },
        { bg: 'room', text: 'توقف الثعلب ونظر إلى الدب الحزين.', say: [{ w: 0, t: 'أنا آسف يا دبدوب، لم أقصد. هل أساعدك؟' }],
          ch: [{ k: 'fox', x: 30, y: 5, s: 28, eff: ['sweat'] }, { k: 'bear', x: 68, y: 5, s: 28, eff: ['sad'] }, { k: 'svg:pile', x: 90, y: 4, s: 14 }] },
        { bg: 'room', text: 'ابتسم الدب، وبدآ معًا يجمعان المكعبات.', say: [{ w: 1, t: 'شكرًا! هيا نبنيه من جديد.' }],
          ch: [{ k: 'svg:pile', x: 50, y: 4, s: 22, tap: 'place', act: { swap: 'svg:tower', bounce: 2 }, note: 'اضغط لترتيبها' }, { k: 'fox', x: 20, y: 5, s: 24, hold: 0, eff: ['effort'] }, { k: 'bear', x: 80, y: 5, s: 24, flip: true, hold: 0 }] },
        { bg: 'room', text: 'وعاد البرج جميلًا، وفرح الصديقان.', say: [{ w: 0, t: 'سأنتبه أكثر في المرة القادمة.' }],
          ch: [{ k: 'fox', x: 24, y: 5, s: 26, fx: 'hop', eff: ['joy'] }, { k: 'svg:tower', x: 52, y: 4, s: 24 }, { k: 'bear', x: 80, y: 5, s: 26, fx: 'hop' }] }
      ],
      acts: [
        { t: 'pick', q: 'ماذا حدث للبرج؟', opts: [{ k: 'svg:pile', t: 'سقط', ok: 1 }, { k: 'svg:tower', t: 'بقي عاليًا' }], hint: 'اصطدم به الثعلب فتساقطت المكعبات.' },
        { t: 'pick', q: 'ماذا قال الثعلب للدب؟', opts: [{ k: 'heart', t: 'أنا آسف وسأساعدك', ok: 1 }, { k: 'tree', t: 'ليس خطئي' }], hint: 'الثعلب كان لطيفًا وصادقًا.' },
        { t: 'feel', q: 'كيف شعر الدب بعد اعتذار الثعلب؟', ans: 'happy' },
        { t: 'order', q: 'رتّب القصة:', items: [{ k: 'svg:tower', t: 'بنى الدب البرج' }, { k: 'svg:pile', t: 'سقط البرج' }, { k: 'heart', t: 'أصلحاه معًا' }] },
        { t: 'talk', q: 'متى قلتَ «آسف» لأحد؟ وماذا فعلتَ بعدها؟' }
      ],
      mission: 'إذا أخطأتَ مع أحد اليوم، قل: أنا آسف، واسأله: كيف أساعدك؟'
    },
    {
      id: 'truth', kind: 'short', age: '٣–٥ سنوات', mins: 2, title: 'الإناء المكسور', cover: ['svg:vase', 'owl'], value: 'الصدق', sticker: 'صديق صادق', bgc: '#7C8CF0',
      tip: 'اقرؤوا مشهد الاختباء بصوت خافت يوحي بالخوف، ثم ارفعوا الصوت بفرح عند «شكرًا لأنك صدقت!». ناقشوا: لماذا ارتاح الثعلب بعد قول الحقيقة؟',
      why: 'قد نخاف حين نخطئ، لكن قول الحقيقة أجمل وأريح، والناس يحبون الصادق ويثقون به.',
      scenes: [
        { bg: 'room', text: 'كان الثعلب يلعب بالكرة داخل البيت.', say: [{ w: 0, t: 'ما أمتع هذه الكرة!' }],
          ch: [{ k: 'fox', x: 28, y: 5, s: 28, fx: 'hop' }, { k: 'ball', x: 52, y: 20, s: 12, fx: 'hop' }, { k: 'svg:vase', x: 84, y: 22, s: 14 }, { k: 'svg:shelf', x: 84, y: 4, s: 22 }] },
        { bg: 'room', text: 'فارتطمت الكرة بالإناء… وانكسر!', say: [{ w: 0, t: 'يا إلهي!' }],
          ch: [{ k: 'fox', x: 30, y: 5, s: 28, eff: ['bang'] }, { k: 'ball', x: 56, y: 6, s: 12 }, { k: 'svg:vaseBroken', x: 82, y: 4, s: 22 }] },
        { bg: 'room', text: 'خاف الثعلب، فاختبأ خلف الصندوق الكبير.', say: [{ w: 0, t: 'آه… ماذا أفعل؟' }],
          ch: [{ k: 'fox', x: 56, y: 5, s: 20, eff: ['sweat'] }, { k: 'box', x: 56, y: 3, s: 26 }, { k: 'svg:vaseBroken', x: 16, y: 4, s: 14 }] },
        { bg: 'room', text: 'جاءت البومة إلى البيت وسألت بلطف.', say: [{ w: 0, t: 'من كسر الإناء يا أصدقاء؟' }, { w: 1, t: 'أنا كسرته، وأنا آسف.' }],
          ch: [{ k: 'owl', x: 26, y: 5, s: 26, fx: 'sway', eff: ['q'] }, { k: 'fox', x: 66, y: 5, s: 26, eff: ['sad'] }, { k: 'svg:vaseBroken', x: 90, y: 4, s: 14 }] },
        { bg: 'room', text: 'شكرت البومة الثعلب على صدقه، وأصلحا الإناء معًا. اضغط الإناء.', say: [{ w: 0, t: 'شكرًا لأنك صدقت! ما أجمل الصدق.' }],
          ch: [{ k: 'owl', x: 24, y: 5, s: 26, hold: 2, eff: ['joy'] }, { k: 'fox', x: 76, y: 5, s: 26, flip: true, hold: 2 }, { k: 'svg:vaseBroken', x: 50, y: 6, s: 18, tap: 'sparkle', act: { swap: 'svg:vase', bounce: 2 }, note: 'اضغط الإناء' }] }
      ],
      acts: [
        { t: 'pick', q: 'ماذا انكسر؟', opts: [{ k: 'svg:vase', ok: 1 }, { k: 'ball' }], hint: 'ارتطمت به الكرة وكان فوق الرف.' },
        { t: 'pick', q: 'ماذا فعل الثعلب في النهاية؟', opts: [{ k: 'heart', t: 'قال الحقيقة', ok: 1 }, { k: 'tree', t: 'بقي مختبئًا' }], hint: 'خرج وقال: أنا كسرته.' },
        { t: 'feel', q: 'كيف شعرت البومة من صدق الثعلب؟', ans: 'happy' },
        { t: 'order', q: 'رتّب القصة:', items: [{ k: 'ball', t: 'لعب بالكرة' }, { k: 'svg:vaseBroken', t: 'انكسر الإناء' }, { k: 'heart', t: 'قال الحقيقة' }] },
        { t: 'talk', q: 'ماذا تفعل لو كسرتَ شيئًا بالخطأ؟' }
      ],
      mission: 'قل الحقيقة اليوم حتى لو أخطأتَ؛ فالصدق يجعل الناس يحبونك.'
    },
    {
      id: 'thanks', kind: 'short', age: '٣–٥ سنوات', mins: 2, title: 'المظلة', cover: ['umbrella', 'fox'], value: 'الشكر والامتنان', sticker: 'صديق شاكر', bgc: '#6AD0A0',
      tip: 'اقرؤوا «شكرًا… جزاك الله خيرًا» بدفء. دعوا الطفل يكررها معكم، وأخبروه أن «جزاك الله خيرًا» دعاء جميل لمن يساعدنا.',
      why: 'حين يساعدنا أحد نقول له شكرًا ونفرح به، فالشكر يجعل القلوب قريبة. ونحمد الله على نعمه.',
      scenes: [
        { bg: 'day', text: 'نزل المطر، وأرنوب بلا مظلة.', say: [{ w: 1, t: 'يا لها من أمطار! أنا مبلل!' }],
          ch: [{ k: 'cloud', x: 50, y: 56, s: 34, fx: 'sway' }, { k: 'rabbit', x: 50, y: 5, s: 28, eff: ['sad'] }, { k: 'rain', x: 80, y: 30, s: 14 }, { k: 'rain', x: 20, y: 28, s: 14 }] },
        { bg: 'day', text: 'مرّ الثعلب ومعه مظلة، فرأى أرنوب.', say: [{ w: 0, t: 'تعال تحت مظلتي يا أرنوب!' }],
          ch: [{ k: 'fox', x: 30, y: 5, s: 26, hold: 1, fx: 'hop' }, { k: 'umbrella', x: 48, y: 28, s: 20, fx: 'sway' }, { k: 'rabbit', x: 78, y: 5, s: 22, eff: ['sad'] }] },
        { bg: 'day', text: 'وقف أرنوب تحت المظلة، وفرح كثيرًا.', say: [{ w: 1, t: 'شكرًا يا ثعلوب! جزاك الله خيرًا.' }, { w: 0, t: 'العفو يا صديقي!' }],
          ch: [{ k: 'fox', x: 36, y: 5, s: 24, hold: 2 }, { k: 'umbrella', x: 52, y: 36, s: 28 }, { k: 'rabbit', x: 66, y: 5, s: 24, eff: ['joy'] }] },
        { bg: 'morning', text: 'خرجت الشمس، فأراد أرنوب أن يشكر صديقه.', say: [{ w: 1, t: 'خذ هذه التفاحة هدية شكر.' }],
          ch: [{ k: 'sun', x: 84, y: 54, s: 20, fx: 'spin' }, { k: 'rabbit', x: 30, y: 5, s: 26, hold: 1, eff: ['joy'] }, { k: 'apple', x: 52, y: 12, s: 12, tap: 'pop', act: { to: [74, 14], arc: true, dur: 900 }, note: 'اضغط التفاحة' }, { k: 'fox', x: 76, y: 5, s: 24, flip: true }] },
        { bg: 'evening', text: 'ضحك الاثنان، وقال أرنوب: الحمد لله على الأصدقاء الطيبين.', say: [{ w: 0, t: 'الحمد لله على الأصدقاء الطيبين!' }],
          ch: [{ k: 'rabbit', x: 30, y: 5, s: 28, fx: 'hop', eff: ['joy'] }, { k: 'heart', x: 52, y: 52, s: 12, fx: 'pop' }, { k: 'fox', x: 74, y: 5, s: 26, fx: 'hop' }] }
      ],
      acts: [
        { t: 'pick', q: 'من أعطى أرنوب المظلة؟', opts: [{ k: 'fox', ok: 1 }, { k: 'owl' }], hint: 'جاء صديق برتقالي وله ذيل كبير.' },
        { t: 'pick', q: 'ماذا قال أرنوب للثعلب؟', opts: [{ k: 'heart', t: 'شكرًا يا صديقي', ok: 1 }, { k: 'tree', t: 'لا شيء' }], hint: 'نقول كلمة جميلة لمن يساعدنا.' },
        { t: 'feel', q: 'كيف شعر الثعلب حين شكره أرنوب؟', ans: 'happy' },
        { t: 'order', q: 'رتّب القصة:', items: [{ k: 'rain', t: 'نزل المطر' }, { k: 'umbrella', t: 'أعطاه المظلة' }, { k: 'apple', t: 'أهداه تفاحة' }] },
        { t: 'talk', q: 'من ساعدك اليوم؟ وماذا قلتَ له؟' }
      ],
      mission: 'قل «شكرًا، جزاك الله خيرًا» لشخص ساعدك اليوم.'
    },
    {
      id: 'treasure', title: 'كنز الغابة', kind: 'long', age: '٤–٦ سنوات', mins: 3, cover: ['svg:chest', 'svg:map'], value: 'التعاون والشجاعة والمشاركة', sticker: 'مغامر شجاع', bgc: '#FFB84E',
      tip: 'قصة مغامرة بصوت متدرّج: ابدؤوا بحماس، وأبطئوا عند الكهف المظلم، ثم افرحوا عند الصندوق. توقفوا عند مشاهد «ما رأيك؟» واسألوا الطفل قبل أن تكملوا.',
      why: 'المغامرة أجمل حين نعمل معًا، ولا نخاف إن كان معنا أصدقاء ونستعين بالله، والكنز الحقيقي أن نتشاركه مع الجميع.',
      scenes: [
        { bg: 'morning', text: 'في صباح جميل، وجد أرنوب ورقة قديمة تحت الشجرة… إنها خريطة كنز!', say: [{ w: 1, t: 'ما هذا؟ خريطة كنز!' }],
          ch: [{ k: 'tree', x: 86, y: 5, s: 28, fx: 'sway' }, { k: 'rabbit', x: 30, y: 6, s: 28, fx: 'hop', eff: ['joy'] }, { k: 'svg:map', x: 58, y: 8, s: 16, tap: 'sparkle', act: { zoom: 'map', bounce: 1 }, note: 'اضغط الخريطة لتقرأها' }] },
        { bg: 'day', text: 'أرى أرنوب الخريطة لصديقيه: الثعلب والدب، ففرحا وقرّروا البحث عن الكنز معًا.', say: [{ w: 1, t: 'كنز؟ هيا نبحث عنه معًا!' }, { w: 2, t: 'أنا معكما!' }],
          ch: [{ k: 'rabbit', x: 22, y: 6, s: 24, fx: 'hop' }, { k: 'fox', x: 50, y: 6, s: 22, fx: 'hop' }, { k: 'bear', x: 78, y: 6, s: 24, flip: true, fx: 'hop' }, { k: 'svg:map', x: 50, y: 46, s: 14, tap: 'sparkle', act: { zoom: 'map:0', bounce: 1 }, note: 'اضغط الخريطة' }] },
        { bg: 'day', text: 'وبدأت الرحلة. تُرى ماذا سيقابلهم في الطريق؟', ask: { q: 'ما أول شيء تتوقع أن يقابلهم في الطريق؟', opts: [{ k: 'svg:riverV', t: 'نهر' }, { k: 'mountain', t: 'جبل' }], react: 'لنرَ ماذا قابلهم!' },
          ch: [{ k: 'rabbit', x: 24, y: 6, s: 22 }, { k: 'fox', x: 50, y: 6, s: 20 }, { k: 'bear', x: 76, y: 6, s: 22 }] },
        { bg: 'day', text: 'مشوا بين الأشجار يتبعون الخط الأحمر على الخريطة. اضغط الخريطة لتقرأها.', say: [{ w: 3, t: 'الخريطة تقول: إلى الأمام!' }],
          ch: [{ k: 'tree', x: 8, y: 5, s: 24 }, { k: 'tree', x: 94, y: 5, s: 22 }, { k: 'svg:map', x: 50, y: 34, s: 12, tap: 'sparkle', act: { zoom: 'map:1', bounce: 1 }, note: 'اضغط الخريطة' }, { k: 'rabbit', x: 30, y: 6, s: 20, fx: 'hop' }, { k: 'fox', x: 54, y: 6, s: 18, fx: 'hop' }, { k: 'bear', x: 76, y: 6, s: 20, fx: 'hop' }] },
        { bg: 'day', text: 'وصلوا إلى نهر عميق، ولا يوجد جسر!', say: [{ w: 3, t: 'النهر عميق! كيف نعبر؟' }],
          ch: [{ k: 'svg:riverV', x: 60, y: 0, s: 15 }, { k: 'rabbit', x: 12, y: 6, s: 20, eff: ['q'] }, { k: 'fox', x: 30, y: 6, s: 18 }, { k: 'bear', x: 46, y: 6, s: 20, eff: ['sweat'] }] },
        { bg: 'day', text: 'فكّر الثلاثة قليلًا.', ask: { q: 'ماذا تقترح ليعبروا النهر؟', opts: [{ k: 'svg:plank', t: 'نصنع جسرًا' }, { k: 'tree', t: 'نقطع غصنًا طويلًا' }], react: 'فكرة جميلة! لنجرّب معًا.' },
          ch: [{ k: 'svg:riverV', x: 60, y: 0, s: 15 }, { k: 'rabbit', x: 12, y: 6, s: 20, eff: ['q'] }, { k: 'fox', x: 30, y: 6, s: 18, eff: ['q'] }, { k: 'bear', x: 46, y: 6, s: 20, eff: ['q'] }] },
        { bg: 'day', text: 'حمل الدب والثعلب جذع شجرة ووضعاه فوق النهر.', say: [{ w: 2, t: 'واحد… اثنان… ثلاثة… ارفع!' }],
          ch: [{ k: 'svg:riverV', x: 62, y: 0, s: 15 }, { k: 'svg:plank', x: 28, y: 6, s: 22, tap: 'place', act: { to: [62, 10], arc: true, dur: 1100, snd2: 'pop' }, note: 'اضغط الجذع' }, { k: 'bear', x: 10, y: 6, s: 20, hold: 1, eff: ['effort'] }, { k: 'fox', x: 44, y: 6, s: 18, hold: 1, flip: true, eff: ['sweat'] }] },
        { bg: 'day', text: 'عبر الأصدقاء النهر فوق الجسر واحدًا بعد الآخر، وهم يمسكون بعضهم. اضغط كلًّا منهم ليعبر.', say: [{ w: 3, t: 'تمسّكوا جيدًا!' }],
          ch: [{ k: 'svg:riverV', x: 62, y: 0, s: 15 }, { k: 'svg:bridge', x: 62, y: 18, s: 30 }, { k: 'rabbit', x: 30, y: 6, s: 18, tap: 'pop', act: { to: [90, 6], arc: true, dur: 1500 }, note: 'أرنوب' }, { k: 'fox', x: 12, y: 6, s: 16, tap: 'pop', act: { to: [80, 6], arc: true, dur: 1700 }, note: 'الثعلب' }, { k: 'bear', x: 46, y: 6, s: 18, tap: 'pop', act: { to: [70, 6], arc: true, dur: 1900 }, note: 'الدب' }] },
        { bg: 'evening', text: 'وصلوا عند الغروب إلى كهف مظلم، وقالت الخريطة: الكنز في الداخل! اضغط الخريطة لتقرأها.', say: [{ w: 1, t: 'المكان مظلم جدًا…' }, { w: 3, t: 'أشعر بالخوف قليلًا.' }],
          ch: [{ k: 'svg:cave', x: 78, y: 3, s: 30 }, { k: 'rabbit', x: 14, y: 6, s: 20 }, { k: 'fox', x: 32, y: 6, s: 18 }, { k: 'bear', x: 52, y: 6, s: 20, eff: ['sweat'] }] },
        { bg: 'evening', text: 'ابتسم الثعلب وأخرج فانوسًا: أحضرته للمغامرة! اضغط الكهف ليضيء، ثم ادخلوا معًا.', say: [{ w: 2, t: 'معي فانوس! بسم الله، لا تخافوا.' }],
          ch: [{ k: 'svg:cave', x: 78, y: 3, s: 30, tap: 'sparkle', act: { swap: 'svg:caveLit', bounce: 1, others: [{ i: 1, act: { to: [78, 8], scale: 0.3, fade: true, dur: 1700 } }, { i: 2, act: { to: [80, 8], scale: 0.3, fade: true, dur: 1700 } }, { i: 3, act: { to: [76, 8], scale: 0.3, fade: true, dur: 1700 } }, { i: 4, act: { to: [80, 12], scale: 0.3, fade: true, dur: 1700 } }] }, note: 'اضغط الكهف ليضيء وتدخلوا' }, { k: 'rabbit', x: 14, y: 6, s: 20, eff: ['joy'] }, { k: 'fox', x: 32, y: 6, s: 20, hold: 4 }, { k: 'bear', x: 54, y: 6, s: 20 }, { k: 'lantern', x: 44, y: 18, s: 10, fx: 'sway' }] },
        { bg: 'cave', text: 'دخلوا الكهف ومعهم النور، فرأوا في آخره صندوقًا خشبيًا كبيرًا!', say: [{ w: 1, t: 'الكنز! لقد وجدناه!' }],
          ch: [{ k: 'svg:chest', x: 78, y: 4, s: 24 }, { k: 'rabbit', x: 16, y: 6, s: 20, enter: true, eff: ['joy'] }, { k: 'fox', x: 36, y: 6, s: 18, enter: true, hold: 4 }, { k: 'bear', x: 56, y: 6, s: 20, enter: true }, { k: 'lantern', x: 46, y: 18, s: 10, enter: true, fx: 'sway' }] },
        { bg: 'cave', text: 'لكن الصندوق كان مقفلًا!', ask: { q: 'أين تتوقع أن يكون المفتاح؟', opts: [{ k: 'svg:chest', t: 'تحت صخرة قريبة' }, { k: 'tree', t: 'في شجرة بعيدة' }], react: 'لنبحث معًا عن المفتاح!' },
          ch: [{ k: 'svg:chest', x: 78, y: 4, s: 24 }, { k: 'rabbit', x: 16, y: 6, s: 20, eff: ['q'] }, { k: 'fox', x: 36, y: 6, s: 18, hold: 4, eff: ['q'] }, { k: 'bear', x: 56, y: 6, s: 20, eff: ['q'] }, { k: 'lantern', x: 46, y: 18, s: 10, fx: 'sway' }] },
        { bg: 'cave', text: 'بحثوا معًا حتى وجد الدب المفتاح تحت صخرة قريبة. اضغط المفتاح ليذهب إلى الصندوق.', say: [{ w: 3, t: 'وجدته! كان تحت الصخرة!' }],
          ch: [{ k: 'key', x: 38, y: 6, s: 12, tap: 'place', act: { to: [72, 22], arc: true, dur: 1000 }, note: 'اضغط المفتاح' }, { k: 'svg:chest', x: 80, y: 4, s: 22 }, { k: 'rabbit', x: 14, y: 6, s: 18 }, { k: 'bear', x: 54, y: 6, s: 22, fx: 'hop', eff: ['joy'] }] },
        { bg: 'cave', text: 'أدار أرنوب المفتاح… اضغط الصندوق ليُفتح! وكان فيه تمر وتفاح وكتب جميلة.', say: [{ w: 1, t: 'يا سلام! ما أجمله!' }],
          ch: [{ k: 'svg:chest', x: 70, y: 4, s: 28, tap: 'cheer', act: { swap: 'svg:chestOpen', bounce: 2, reveal: [4, 5, 6] }, note: 'اضغط الصندوق' }, { k: 'rabbit', x: 22, y: 6, s: 22, eff: ['joy'] }, { k: 'fox', x: 44, y: 6, s: 18, eff: ['joy'] }, { k: 'bear', x: 90, y: 6, s: 12 }, { k: 'apple', x: 56, y: 30, s: 9, hide: true, fx: 'pop' }, { k: 'book', x: 72, y: 36, s: 10, hide: true, fx: 'pop' }, { k: 'star', x: 86, y: 30, s: 8, hide: true, fx: 'spin' }] },
        { bg: 'evening', text: 'خرجوا من الكهف ومعهم الصندوق، وقال أرنوب: الكنز الحقيقي أن نشاركه مع كل أصدقاء الغابة! ووزّعوا التمر والتفاح.', say: [{ w: 1, t: 'الكنز أجمل حين نتشاركه!' }],
          ch: [{ k: 'svg:chestOpen', x: 50, y: 4, s: 22 }, { k: 'rabbit', x: 20, y: 6, s: 22, hold: 3, eff: ['joy'] }, { k: 'fox', x: 78, y: 6, s: 18, flip: true }, { k: 'apple', x: 34, y: 18, s: 10, fx: 'pop' }] },
        { bg: 'evening', text: 'وعادوا إلى بيوتهم فرحين، وقد عرفوا أن أجمل كنز هو الأصدقاء والتعاون. الحمد لله.',
          ch: [{ k: 'sun', x: 20, y: 44, s: 22, fx: 'pop' }, { k: 'rabbit', x: 36, y: 6, s: 24, fx: 'hop' }, { k: 'fox', x: 58, y: 6, s: 20, fx: 'hop' }, { k: 'bear', x: 80, y: 6, s: 22, fx: 'hop' }, { k: 'heart', x: 50, y: 54, s: 11, fx: 'pop' }] }
      ],
      acts: [
        { t: 'pick', q: 'ماذا وجد أرنوب تحت الشجرة؟', opts: [{ k: 'svg:map', t: 'خريطة', ok: 1 }, { k: 'ball', t: 'كرة' }], hint: 'ورقة قديمة عليها خط أحمر.' },
        { t: 'pick', q: 'كيف عبروا النهر؟', opts: [{ k: 'svg:bridge', t: 'بنوا جسرًا', ok: 1 }, { k: 'ball', t: 'عادوا إلى البيت' }], hint: 'حملوا جذع شجرة معًا.' },
        { t: 'pick', q: 'من أضاء الكهف بالفانوس؟', opts: [{ k: 'owl' }, { k: 'fox', ok: 1 }], hint: 'صديق برتقالي أحضر الفانوس في حقيبته.' },
        { t: 'feel', q: 'كيف شعر الأصدقاء حين فتحوا الصندوق؟', ans: 'happy' },
        { t: 'order', q: 'رتّب القصة:', items: [{ k: 'svg:map', t: 'وجدوا الخريطة' }, { k: 'svg:bridge', t: 'عبروا النهر' }, { k: 'svg:chestOpen', t: 'فتحوا الصندوق' }] },
        { t: 'pick', q: 'ماذا فعلوا بالكنز؟', opts: [{ k: 'heart', t: 'شاركوه مع الجميع', ok: 1 }, { k: 'tree', t: 'أخفوه لأنفسهم' }], hint: 'الكنز الحقيقي أجمل حين نتشاركه.' },
        { t: 'talk', q: 'متى عملتَ مع أصدقائك أو أسرتك على شيء صعب؟' }
      ],
      mission: 'اليوم اعمل مع أحد من أسرتك على مهمة صغيرة، مثل ترتيب الغرفة معًا.'
    },
    {
      id: 'race', title: 'السباق الكبير', kind: 'long', age: '٤–٦ سنوات', mins: 3, cover: ['svg:flag', 'turtle'], value: 'المثابرة وعدم الغرور', sticker: 'بطل المثابرة', bgc: '#6AB7FF',
      tip: 'غيّروا نبرتكم: صوت متفاخر للثعلب، وصوت هادئ مثابر للسلحفاة. دعوا الطفل يضغط الثعلب ثم السلحفاة ليرى الفرق في السرعة، وتوقفوا عند «من تتوقع أن يفوز؟».',
      why: 'من يثابر ولا يستسلم يصل بإذن الله، والغرور يضيّع الفرص، والاعتذار عن الخطأ أجمل خُلق.',
      scenes: [
        { bg: 'day', text: 'أعلن الدب الحكَم عن سباق كبير في الغابة، فتجمّع الجميع.', say: [{ w: 1, t: 'سباق كبير! من يصل إلى العلم أولًا؟' }],
          ch: [{ k: 'svg:flag', x: 90, y: 4, s: 16, fx: 'sway' }, { k: 'bear', x: 46, y: 6, s: 26, fx: 'hop' }, { k: 'fox', x: 18, y: 6, s: 22 }, { k: 'turtle', x: 74, y: 5, s: 18 }] },
        { bg: 'day', text: 'ضحك الثعلب وقال بفخر: أنا الأسرع! أما السلحفاة فابتسمت بهدوء.', say: [{ w: 1, t: 'أنا أسرع حيوان في الغابة!' }, { w: 2, t: 'وأنا سأحاول بكل جهدي.' }],
          ch: [{ k: 'svg:flag', x: 90, y: 4, s: 16 }, { k: 'fox', x: 28, y: 6, s: 28, tilt: 8 }, { k: 'turtle', x: 66, y: 5, s: 20 }] },
        { bg: 'day', text: 'وقف الجميع ينتظر بداية السباق.', ask: { q: 'من تتوقع أن يفوز؟', opts: [{ k: 'fox', t: 'الثعلب' }, { k: 'turtle', t: 'السلحفاة' }], react: 'سنرى ماذا سيحدث!' },
          ch: [{ k: 'svg:flag', x: 90, y: 4, s: 16 }, { k: 'fox', x: 30, y: 6, s: 26 }, { k: 'turtle', x: 66, y: 5, s: 20 }] },
        { bg: 'day', text: 'وانطلق السباق! اضغط الثعلب ثم اضغط السلحفاة.',
          ch: [{ k: 'svg:flag', x: 92, y: 4, s: 14 }, { k: 'fox', x: 12, y: 24, s: 17, tap: 'whoosh', act: { to: [66, 24], dur: 700, ease: 'cubic-bezier(.1,.7,.3,1)' }, note: 'اضغط الثعلب' }, { k: 'turtle', x: 12, y: 4, s: 16, tap: 'pop', act: { to: [26, 4], dur: 1800, ease: 'linear' }, note: 'اضغط السلحفاة' }] },
        { bg: 'day', text: 'ركض الثعلب بسرعة كبيرة، وبقيت السلحفاة تمشي خطوة خطوة.', say: [{ w: 2, t: 'هههه! أين السلحفاة؟ سأرتاح قليلًا.' }],
          ch: [{ k: 'svg:flag', x: 92, y: 4, s: 14 }, { k: 'turtle', x: 26, y: 4, s: 16 }, { k: 'fox', x: 64, y: 24, s: 17, eff: ['sweat'] }] },
        { bg: 'day', text: 'نام الثعلب تحت شجرة وقال: عندي وقت كثير! أما السلحفاة فلم تتوقف.',
          ch: [{ k: 'svg:flag', x: 92, y: 4, s: 14 }, { k: 'tree', x: 74, y: 5, s: 28, fx: 'sway' }, { k: 'fox', x: 66, y: 4, s: 18, tilt: 12, eff: ['zzz'] }, { k: 'turtle', x: 26, y: 4, s: 16, tap: 'pop', act: { to: [48, 4], dur: 2000, ease: 'linear' }, note: 'اضغط السلحفاة لتتابع' }] },
        { bg: 'day', text: 'تعبت السلحفاة وهي تصعد التل، لكنها ابتسمت وقالت لنفسها: خطوة… خطوة.', say: [{ w: 1, t: 'خطوة… خطوة… أنا أستطيع!' }],
          ch: [{ k: 'mountain', x: 56, y: 4, s: 44 }, { k: 'turtle', x: 30, y: 8, s: 16, tilt: -16, eff: ['sweat'], tap: 'pop', act: { to: [52, 26], dur: 2000, ease: 'linear' }, note: 'اضغط لتتسلق' }] },
        { bg: 'day', text: 'مرّت السلحفاة بجانب الثعلب النائم.', ask: { q: 'ماذا ستفعل السلحفاة حين ترى الثعلب نائمًا؟', opts: [{ k: 'heart', t: 'تكمل طريقها بهدوء' }, { k: 'ball', t: 'توقظه ليلعبا' }], react: 'لنرَ ماذا فعلت!' },
          ch: [{ k: 'tree', x: 74, y: 5, s: 28 }, { k: 'fox', x: 68, y: 4, s: 18, tilt: 12, eff: ['zzz'] }, { k: 'turtle', x: 40, y: 4, s: 16 }] },
        { bg: 'day', text: 'استيقظ الثعلب فجأة… ورأى السلحفاة قرب خط النهاية!', say: [{ w: 0, t: 'يا إلهي! تأخرتُ!' }],
          ch: [{ k: 'fox', x: 24, y: 4, s: 22, eff: ['bang'] }, { k: 'turtle', x: 76, y: 4, s: 16 }, { k: 'svg:flag', x: 92, y: 4, s: 14 }] },
        { bg: 'day', text: 'ركض الثعلب بأسرع ما يستطيع، لكن السلحفاة كانت أقرب. اضغط كلًّا منهما.',
          ch: [{ k: 'svg:flag', x: 92, y: 4, s: 14 }, { k: 'fox', x: 28, y: 24, s: 17, tap: 'whoosh', act: { to: [76, 24], dur: 800 }, note: 'اضغط الثعلب' }, { k: 'turtle', x: 72, y: 4, s: 16, tap: 'pop', act: { to: [88, 4], dur: 1400, ease: 'linear' }, note: 'اضغط السلحفاة' }] },
        { bg: 'day', text: 'وعبرت السلحفاة خط النهاية أولًا! فصفّق الجميع.', say: [{ w: 2, t: 'فازت السلحفاة! أحسنتِ!' }],
          ch: [{ k: 'svg:flag', x: 82, y: 4, s: 16, tap: 'cheer', act: { bounce: 3 }, note: 'اضغط العلم' }, { k: 'turtle', x: 66, y: 4, s: 18, eff: ['joy'] }, { k: 'bear', x: 28, y: 6, s: 24, fx: 'hop' }, { k: 'fox', x: 46, y: 4, s: 14, eff: ['sad'] }] },
        { bg: 'evening', text: 'اقترب الثعلب من السلحفاة واعتذر لها بصدق.', say: [{ w: 0, t: 'كنتُ مغرورًا، وأنتِ كنتِ مثابرة. أنا آسف.' }, { w: 1, t: 'لا بأس يا ثعلوب، لنكن أصدقاء.' }],
          ch: [{ k: 'fox', x: 30, y: 6, s: 26, eff: ['sad'] }, { k: 'turtle', x: 68, y: 5, s: 22, eff: ['joy'] }] },
        { bg: 'evening', text: 'وتعلّم الثعلب أن الغرور يضيّع الفرصة، وأن من يثابر ويستمر يصل بإذن الله. الحمد لله.',
          ch: [{ k: 'sun', x: 18, y: 44, s: 22, fx: 'pop' }, { k: 'fox', x: 36, y: 6, s: 24, fx: 'hop' }, { k: 'turtle', x: 62, y: 5, s: 22, fx: 'hop' }, { k: 'heart', x: 50, y: 54, s: 11, fx: 'pop' }, { k: 'bear', x: 86, y: 6, s: 18 }] }
      ],
      acts: [
        { t: 'pick', q: 'من فاز بالسباق؟', opts: [{ k: 'fox' }, { k: 'turtle', ok: 1 }], hint: 'صاحبة البيت على ظهرها لم تتوقف.' },
        { t: 'pick', q: 'ماذا فعل الثعلب في منتصف السباق؟', opts: [{ k: 'tree', t: 'نام تحت شجرة', ok: 1 }, { k: 'svg:flag', t: 'واصل الركض' }], hint: 'اطمأن لأنه الأسرع.' },
        { t: 'feel', q: 'كيف شعر الثعلب حين خسر السباق؟', ans: 'sad' },
        { t: 'order', q: 'رتّب القصة:', items: [{ k: 'svg:flag', t: 'بدأ السباق' }, { k: 'tree', t: 'نام الثعلب' }, { k: 'turtle', t: 'وصلت السلحفاة' }] },
        { t: 'pick', q: 'ماذا تعلّم الثعلب؟', opts: [{ k: 'heart', t: 'أن نثابر ولا نغترّ', ok: 1 }, { k: 'ball', t: 'أن نركض فقط' }], hint: 'من يثابر يصل، والغرور يضيّع الفرصة.' },
        { t: 'talk', q: 'متى أكملتَ شيئًا صعبًا ولم تستسلم؟' }
      ],
      mission: 'اليوم أكمل عملًا صغيرًا لا تحبه حتى النهاية، ولا تستسلم.'
    },
    {
      id: 'dark', title: 'دبدوب والليل', kind: 'long', age: '٣–٦ سنوات', mins: 3, cover: ['moon', 'bear'], value: 'الطمأنينة والشجاعة', sticker: 'دبّ شجاع', bgc: '#7C8CF0',
      tip: 'اقرؤوها بصوت هادئ كأنكم عند النوم. اخفضوا الصوت عند الليل، وكرّروا مع الطفل «بسم الله»، ودعوه يضغط النجوم والقمر ليضيئا.',
      why: 'قد نخاف أحيانًا، لكن ذكر الله يمنحنا الطمأنينة، وفي الليل جمال وهدوء، والله معنا في الظلام والنور.',
      scenes: [
        { bg: 'evening', text: 'كان دبدوب يلعب حتى غابت الشمس. اضغط الشمس لتغيب.', say: [{ w: 1, t: 'ما أجمل اللعب! وداعًا يا شمس.' }],
          ch: [{ k: 'sun', x: 80, y: 30, s: 22, tap: 'sparkle', act: { to: [84, -2], dur: 1600, ease: 'ease-in' }, note: 'اضغط الشمس' }, { k: 'bear', x: 30, y: 6, s: 30, fx: 'hop', eff: ['joy'] }] },
        { bg: 'cave', text: 'وجاء الليل، فدخل دبدوب إلى بيته الصغير في الكهف.', say: [{ w: 1, t: 'الظلام كبير… أنا أخاف قليلًا.' }],
          ch: [{ k: 'moon', x: 84, y: 56, s: 14 }, { k: 'bear', x: 36, y: 5, s: 28, enter: true, eff: ['sad', 'sweat'] }] },
        { bg: 'night', text: 'فخرج دبدوب إلى باب الكهف، وفجأة سمع صوتًا غريبًا: هووو هووو!', say: [{ w: 1, t: 'من هناك؟!' }],
          ch: [{ k: 'tree', x: 80, y: 5, s: 32, fx: 'sway' }, { k: 'bear', x: 28, y: 6, s: 26, eff: ['bang', 'sweat'] }, { k: 'star', x: 20, y: 66, s: 7, fx: 'spin' }] },
        { bg: 'night', text: 'تُرى ما مصدر الصوت؟', ask: { q: 'ما مصدر الصوت برأيك؟', opts: [{ k: 'owl', t: 'بومة' }, { k: 'fox', t: 'ثعلب' }], react: 'لنرَ من هناك!' },
          ch: [{ k: 'tree', x: 80, y: 5, s: 32 }, { k: 'bear', x: 28, y: 6, s: 26, eff: ['q'] }] },
        { bg: 'night', text: 'ظهرت بومة ودودة من خلف الشجرة.', say: [{ w: 2, t: 'لا تخف يا دبدوب! أنا صديقتك البومة.' }],
          ch: [{ k: 'tree', x: 86, y: 5, s: 30 }, { k: 'bear', x: 26, y: 6, s: 26, eff: ['sweat'] }, { k: 'owl', x: 62, y: 6, s: 22, fx: 'hop' }] },
        { bg: 'night', text: 'ابتسم دبدوب وأخبرها بخوفه.', say: [{ w: 0, t: 'أنا أخاف الظلام يا بومة.' }, { w: 1, t: 'الظلام يأتي ليرتاح الجميع. تعال نرَ جماله.' }],
          ch: [{ k: 'bear', x: 28, y: 6, s: 26 }, { k: 'owl', x: 66, y: 6, s: 22 }] },
        { bg: 'night', text: 'رفع الاثنان رأسيهما: النجوم تلمع في السماء! اضغط النجوم لتضيء.',
          ch: [{ k: 'star', x: 18, y: 54, s: 10, tap: 'sparkle', act: { bounce: 2, eff: ['joy'] }, note: 'اضغط' }, { k: 'star', x: 46, y: 66, s: 9, tap: 'sparkle', act: { bounce: 2, eff: ['joy'] } }, { k: 'star', x: 76, y: 56, s: 11, tap: 'sparkle', act: { bounce: 2, eff: ['joy'] } }, { k: 'bear', x: 30, y: 6, s: 24, tilt: -6 }, { k: 'owl', x: 66, y: 6, s: 20 }] },
        { bg: 'night', text: 'قالت البومة: كلما خفتَ قل: بسم الله، فالله معك دائمًا.', say: [{ w: 1, t: 'قل: بسم الله، فالله معك.' }, { w: 0, t: 'بسم الله! الله معي.' }],
          ch: [{ k: 'bear', x: 28, y: 6, s: 26, eff: ['joy'] }, { k: 'owl', x: 70, y: 6, s: 22 }, { k: 'heart', x: 50, y: 40, s: 11, fx: 'pop' }] },
        { bg: 'night', text: 'قال دبدوب كلمة جميلة، فتغيّر شعوره.', ask: { q: 'ماذا شعر دبدوب بعد أن قال: بسم الله؟', opts: [{ k: 'heart', t: 'اطمأن' }, { k: 'moon', t: 'ما زال خائفًا' }], react: 'نعم، ذكر الله يمنحنا الطمأنينة.' },
          ch: [{ k: 'bear', x: 30, y: 6, s: 26, eff: ['joy'] }, { k: 'owl', x: 68, y: 6, s: 22 }] },
        { bg: 'night', text: 'ثم رأيا أضواءً صغيرة ترقص حولهما: إنها اليراعات!',
          ch: [{ k: 'star', x: 20, y: 50, s: 7, fx: 'fly' }, { k: 'star', x: 44, y: 62, s: 6, fx: 'fly' }, { k: 'star', x: 72, y: 54, s: 7, fx: 'fly' }, { k: 'bear', x: 34, y: 6, s: 24, fx: 'hop' }, { k: 'owl', x: 66, y: 6, s: 20 }] },
        { bg: 'night', text: 'قال دبدوب: ما أجمل الليل! القمر يضيء لنا الطريق. اضغط القمر.', say: [{ w: 1, t: 'الليل جميل وهادئ!' }],
          ch: [{ k: 'moon', x: 62, y: 44, s: 26, tap: 'sparkle', act: { bounce: 2, eff: ['joy'] }, note: 'اضغط القمر' }, { k: 'bear', x: 24, y: 6, s: 26, fx: 'hop', eff: ['joy'] }, { k: 'owl', x: 82, y: 6, s: 18 }] },
        { bg: 'night', text: 'تثاءب دبدوب وشعر بالنعاس.',
          ch: [{ k: 'bear', x: 30, y: 6, s: 26, tilt: 10, eff: ['zzz'] }, { k: 'owl', x: 66, y: 6, s: 20 }, { k: 'moon', x: 84, y: 54, s: 14 }] },
        { bg: 'night', text: 'قالت البومة: تصبح على خير يا دبدوب.', say: [{ w: 1, t: 'تصبح على خير!' }, { w: 0, t: 'وأنتِ من أهل الخير!' }],
          ch: [{ k: 'bear', x: 28, y: 6, s: 24, eff: ['zzz'] }, { k: 'owl', x: 66, y: 6, s: 22 }] },
        { bg: 'cave', text: 'ودّع دبدوب صديقته وعاد إلى بيته الدافئ، ونام مطمئنًا، وقد تعلّم أن الله معنا في الظلام والنور. الحمد لله.',
          ch: [{ k: 'moon', x: 84, y: 56, s: 14, fx: 'pop' }, { k: 'bear', x: 40, y: 4, s: 26, tilt: 78, eff: ['zzz'] }, { k: 'heart', x: 62, y: 40, s: 10, fx: 'pop' }, { k: 'star', x: 18, y: 62, s: 8, fx: 'spin' }] }
      ],
      acts: [
        { t: 'pick', q: 'ممَّ كان يخاف دبدوب؟', opts: [{ k: 'moon', t: 'الظلام', ok: 1 }, { k: 'ball', t: 'الكرة' }], hint: 'جاء بعد غروب الشمس.' },
        { t: 'pick', q: 'من ساعد دبدوب؟', opts: [{ k: 'owl', ok: 1 }, { k: 'fox' }], hint: 'صديقة تسهر في الليل وعيناها كبيرتان.' },
        { t: 'pick', q: 'ماذا قال دبدوب ليطمئن؟', opts: [{ k: 'heart', t: 'بسم الله', ok: 1 }, { k: 'tree', t: 'لا شيء' }], hint: 'ذكر الله يطمئن القلب.' },
        { t: 'feel', q: 'كيف شعر دبدوب في النهاية؟', ans: 'happy' },
        { t: 'order', q: 'رتّب القصة:', items: [{ k: 'moon', t: 'جاء الليل وخاف' }, { k: 'owl', t: 'جاءت البومة' }, { k: 'star', t: 'نظر إلى النجوم ونام' }] },
        { t: 'talk', q: 'ماذا تقول حين تخاف؟ وماذا تحب في الليل؟' }
      ],
      mission: 'قبل النوم قل: بسم الله، وفكّر في شيء جميل حدث لك اليوم.'
    },
    {
      id: 'seed', kind: 'short', age: '٣–٥ سنوات', mins: 2, title: 'البذرة التي لم تستعجل', cover: ['svg:sprout', 'rabbit'], value: 'الصبر والعناية', sticker: 'بستاني صبور', bgc: '#8FD98A',
      tip: 'اقرؤوا «أين الزهرة؟» بلهفة، ثم أبطئوا عند «لا تستعجل». دعوا الطفل يضغط البذرة ثم الإبريق ثم النبتة لتكبر.',
      why: 'بعض الأشياء الجميلة تحتاج وقتًا وعناية: ماءً وشمسًا وصبرًا، ثم نفرح بالنتيجة ونحمد الله.',
      scenes: [
        { bg: 'day', text: 'أحضر أرنوب بذرة صغيرة وحفر لها حفرة في التراب. اضغط البذرة لتدخل التراب.', say: [{ w: 0, t: 'سأزرعها وأريد زهرة جميلة!' }],
          ch: [{ k: 'rabbit', x: 26, y: 6, s: 28, fx: 'hop', eff: ['joy'] }, { k: 'svg:hole', x: 70, y: 3, s: 20 }, { k: 'svg:seed', x: 50, y: 18, s: 8, tap: 'place', act: { to: [70, 8], arc: true, dur: 900, scale: 0.6 }, note: 'اضغط البذرة' }] },
        { bg: 'morning', text: 'وفي الصباح عاد وهو متحمس… لكن لا شيء ظهر بعد!', say: [{ w: 0, t: 'أين الزهرة؟ لم تظهر بعد!' }],
          ch: [{ k: 'rabbit', x: 28, y: 6, s: 28, eff: ['q'] }, { k: 'svg:hole', x: 70, y: 3, s: 20 }] },
        { bg: 'day', text: 'مرّت السلحفاة وقالت له كلمة حكيمة.', say: [{ w: 0, t: 'لا تستعجل يا أرنوب؛ تحتاج البذرة ماءً وشمسًا ووقتًا.' }],
          ch: [{ k: 'turtle', x: 26, y: 5, s: 24, fx: 'hop' }, { k: 'rabbit', x: 62, y: 6, s: 24, flip: true }, { k: 'svg:hole', x: 90, y: 3, s: 12 }] },
        { bg: 'day', text: 'فسقى أرنوب البذرة كل يوم وانتظر. اضغط الإبريق ليسقيها.', say: [{ w: 0, t: 'سأعتني بها وأصبر.' }],
          ch: [{ k: 'rabbit', x: 20, y: 6, s: 24 }, { k: 'svg:can', x: 44, y: 14, s: 16, tap: 'splash', act: { to: [62, 26], rot: 32, dur: 1000, others: [{ i: 3, act: { swap: 'svg:sprout', bounce: 2 } }] }, note: 'اضغط الإبريق' }, { k: 'sun', x: 88, y: 56, s: 16, fx: 'spin' }, { k: 'svg:hole', x: 76, y: 3, s: 18 }] },
        { bg: 'evening', text: 'ومرّت الأيام… وفي يوم ظهرت زهرة جميلة! اضغط النبتة لتزهر. الحمد لله.', say: [{ w: 0, t: 'الحمد لله! كبرت لأني صبرت.' }],
          ch: [{ k: 'rabbit', x: 26, y: 6, s: 26, fx: 'hop', eff: ['joy'] }, { k: 'svg:sprout', x: 66, y: 4, s: 22, tap: 'sparkle', act: { swap: 'svg:bloom', bounce: 2 }, note: 'اضغط النبتة' }, { k: 'turtle', x: 88, y: 5, s: 14 }] }
      ],
      acts: [
        { t: 'pick', q: 'ماذا تحتاج البذرة لتكبر؟', opts: [{ k: 'svg:can', t: 'ماء وصبر', ok: 1 }, { k: 'ball', t: 'كرة' }], hint: 'سقاها أرنوب كل يوم.' },
        { t: 'feel', q: 'كيف شعر أرنوب حين ظهرت الزهرة؟', ans: 'happy' },
        { t: 'order', q: 'رتّب القصة:', items: [{ k: 'svg:seed', t: 'زرع البذرة' }, { k: 'svg:sprout', t: 'نبتت النبتة' }, { k: 'svg:bloom', t: 'ظهرت الزهرة' }] },
        { t: 'talk', q: 'ما الشيء الذي انتظرتَه طويلًا ثم فرحتَ به؟' }
      ],
      mission: 'ازرع بذرة أو سقِّ نبتة في بيتكم اليوم، وانتظر بصبر.'
    },
    {
      id: 'bee', kind: 'short', age: '٣–٥ سنوات', mins: 2, title: 'النحلة النشيطة', cover: ['bee', 'svg:honey'], value: 'الاجتهاد والعمل', sticker: 'عامل نشيط', bgc: '#FFC83D',
      tip: 'اقرؤوا بإيقاع نشيط. دعوا الطفل يضغط النحلة لتطير بين الأزهار، ثم الخلية ليظهر العسل.',
      why: 'العمل الجاد يثمر خيرًا ينفع الجميع، ونشكر من يتعب من أجلنا.',
      scenes: [
        { bg: 'morning', text: 'استيقظت النحلة الصغيرة مع الشمس.', say: [{ w: 1, t: 'صباح الخير! اليوم سأعمل بجدّ.', at: 58 }],
          ch: [{ k: 'sun', x: 84, y: 54, s: 20, fx: 'spin' }, { k: 'bee', x: 32, y: 30, s: 20, fx: 'fly' }, { k: 'flower', x: 66, y: 5, s: 16, fx: 'sway' }, { k: 'rose', x: 88, y: 5, s: 14, fx: 'sway' }] },
        { bg: 'day', text: 'طارت من زهرة إلى زهرة تجمع الرحيق. اضغط النحلة لتطير.',
          ch: [{ k: 'flower', x: 20, y: 5, s: 16 }, { k: 'rose', x: 50, y: 5, s: 16 }, { k: 'flower', x: 80, y: 5, s: 16 }, { k: 'bee', x: 18, y: 30, s: 16, tap: 'flutter', act: { to: [80, 28], arc: true, dur: 1800 }, note: 'اضغط النحلة' }] },
        { bg: 'day', text: 'تُرى ماذا ستصنع من هذا الرحيق؟', ask: { q: 'ماذا تتوقع أن تصنع النحلة من الرحيق؟', opts: [{ k: 'svg:honey', t: 'عسلًا' }, { k: 'apple', t: 'تفاحًا' }], react: 'لنرَ ماذا صنعت!' },
          ch: [{ k: 'bee', x: 50, y: 32, s: 22, fx: 'fly' }, { k: 'flower', x: 24, y: 5, s: 16 }, { k: 'rose', x: 76, y: 5, s: 16 }] },
        { bg: 'day', text: 'وصلت إلى خليتها وأفرغت ما جمعت. اضغط الخلية.', say: [{ w: 1, t: 'تعبتُ قليلًا، لكن العمل جميل!' }],
          ch: [{ k: 'svg:hive', x: 62, y: 4, s: 28, tap: 'sparkle', act: { bounce: 2, reveal: [2] }, note: 'اضغط الخلية' }, { k: 'bee', x: 32, y: 30, s: 18, fx: 'fly' }, { k: 'svg:honey', x: 84, y: 8, s: 12, hide: true }] },
        { bg: 'evening', text: 'وجاء الدب يتذوّق العسل وقال: شكرًا لك أيتها النحلة!', say: [{ w: 0, t: 'ما ألذّه! شكرًا يا نحلة، ما أنشطك!' }],
          ch: [{ k: 'bear', x: 28, y: 6, s: 28, fx: 'hop', eff: ['joy'] }, { k: 'svg:honey', x: 58, y: 8, s: 14 }, { k: 'bee', x: 82, y: 30, s: 16, fx: 'fly' }, { k: 'heart', x: 50, y: 54, s: 10, fx: 'pop' }] }
      ],
      acts: [
        { t: 'pick', q: 'ماذا صنعت النحلة؟', opts: [{ k: 'svg:honey', t: 'عسلًا', ok: 1 }, { k: 'apple', t: 'تفاحًا' }], hint: 'جمعت الرحيق من الأزهار.' },
        { t: 'pick', q: 'من شكر النحلة؟', opts: [{ k: 'bear', ok: 1 }, { k: 'fox' }], hint: 'صديق كبير يحب العسل.' },
        { t: 'feel', q: 'كيف شعرت النحلة حين شكرها الدب؟', ans: 'happy' },
        { t: 'talk', q: 'ما العمل الذي تعمله أنت لأسرتك؟ ومن يستحق شكرك؟' }
      ],
      mission: 'ساعد في عمل صغير بالبيت اليوم، وقل لمن يعمل لأجلك: شكرًا.'
    },
    {
      id: 'lamb', kind: 'long', age: '٤–٦ سنوات', mins: 3, title: 'الخروف الضائع', cover: ['lamb', 'owl'], value: 'الرحمة والتعاون وطلب المساعدة', sticker: 'صديق رحيم', bgc: '#9ADFA8',
      tip: 'اخفضوا الصوت قليلًا عند الضياع، وارفعوه بأمل عند ظهور الأرنب. توقفوا عند «ماذا يفعل الخروف؟» وناقشوا: متى نطلب المساعدة؟',
      why: 'إذا ضعنا أو احتجنا أحدًا نطلب المساعدة ولا نخاف، ونرحم من يحتاجنا ونساعده، وما أجمل العودة إلى الأهل.',
      scenes: [
        { bg: 'morning', text: 'كان الخروف الصغير يرعى مع قطيعه في المرج الأخضر.', say: [{ w: 1, t: 'ما أجمل الصباح!' }],
          ch: [{ k: 'sun', x: 84, y: 54, s: 18, fx: 'spin' }, { k: 'lamb', x: 34, y: 6, s: 26, fx: 'hop', eff: ['joy'] }, { k: 'lamb', x: 62, y: 5, s: 18 }, { k: 'tree', x: 90, y: 5, s: 24, fx: 'sway' }] },
        { bg: 'day', text: 'رأى فراشة جميلة فلحق بها… وبعيدًا بعيدًا. اضغط الخروف ليتبعها.',
          ch: [{ k: 'butterfly', x: 70, y: 40, s: 12, fx: 'fly' }, { k: 'lamb', x: 20, y: 6, s: 22, tap: 'pop', act: { to: [72, 6], arc: true, dur: 2000 }, note: 'اضغط الخروف' }, { k: 'tree', x: 40, y: 5, s: 22 }] },
        { bg: 'day', text: 'وفجأة نظر حوله… فلم يجد أحدًا!', say: [{ w: 1, t: 'أين القطيع؟ أين أمي؟' }],
          ch: [{ k: 'tree', x: 14, y: 5, s: 24 }, { k: 'lamb', x: 50, y: 6, s: 26, eff: ['q', 'sad'] }, { k: 'tree', x: 88, y: 5, s: 24 }] },
        { bg: 'day', text: 'وقف الخروف يفكّر.', ask: { q: 'ماذا يفعل الخروف الصغير الآن؟', opts: [{ k: 'heart', t: 'يطلب المساعدة' }, { k: 'ball', t: 'يبقى صامتًا' }], react: 'نعم، نطلب المساعدة حين نضيع، ولا نخاف.' },
          ch: [{ k: 'lamb', x: 50, y: 6, s: 26, eff: ['q'] }] },
        { bg: 'day', text: 'نادى بأعلى صوته يطلب النجدة.', say: [{ w: 0, t: 'أنا هنا! ساعدوني من فضلكم!' }],
          ch: [{ k: 'lamb', x: 50, y: 6, s: 26, eff: ['bang', 'sad'] }, { k: 'tree', x: 88, y: 5, s: 22 }] },
        { bg: 'day', text: 'سمعه الأرنب فجاء مسرعًا.', say: [{ w: 0, t: 'لا تخف يا صغير! سنجد قطيعك معًا.' }],
          ch: [{ k: 'rabbit', x: 28, y: 6, s: 24, fx: 'hop', eff: ['joy'] }, { k: 'lamb', x: 64, y: 6, s: 24 }] },
        { bg: 'day', text: 'وفوق الشجرة كانت البومة ترى من بعيد.', say: [{ w: 2, t: 'أرى قطيعك قرب النهر! اتبعاني.' }],
          ch: [{ k: 'tree', x: 80, y: 5, s: 34, fx: 'sway' }, { k: 'rabbit', x: 22, y: 6, s: 20 }, { k: 'owl', x: 76, y: 30, s: 16, fx: 'sway' }, { k: 'lamb', x: 46, y: 6, s: 20 }] },
        { bg: 'day', text: 'ساروا الثلاثة معًا نحو النهر. اضغط كلًّا منهم ليمشي.',
          ch: [{ k: 'svg:riverV', x: 84, y: 0, s: 12 }, { k: 'lamb', x: 20, y: 6, s: 18, tap: 'pop', act: { to: [62, 6], dur: 1600 }, note: 'الخروف' }, { k: 'rabbit', x: 8, y: 6, s: 16, tap: 'pop', act: { to: [48, 6], dur: 1500 }, note: 'الأرنب' }, { k: 'owl', x: 34, y: 30, s: 14, tap: 'pop', act: { to: [72, 30], arc: true, dur: 1700 }, note: 'البومة' }] },
        { bg: 'evening', text: 'كان الغروب يقترب، لكنهم لم يتوقفوا.', say: [{ w: 1, t: 'بقي القليل! تشجّع يا صغير.' }],
          ch: [{ k: 'sun', x: 20, y: 40, s: 22, fx: 'pop' }, { k: 'lamb', x: 54, y: 6, s: 20 }, { k: 'rabbit', x: 74, y: 6, s: 18 }] },
        { bg: 'evening', text: 'وهناك رأى الخروف قطيعه! اضغط الخروف ليركض إليهم.',
          ch: [{ k: 'lamb', x: 76, y: 5, s: 16 }, { k: 'lamb', x: 90, y: 5, s: 14 }, { k: 'lamb', x: 20, y: 6, s: 22, tap: 'whoosh', act: { to: [64, 6], dur: 1200, snd2: 'cheer' }, note: 'اضغط الخروف' }] },
        { bg: 'evening', text: 'فرح القطيع بعودته، وضمّته أمه بحنان.', say: [{ w: 1, t: 'الحمد لله أنك عدتَ سالمًا!' }],
          ch: [{ k: 'lamb', x: 28, y: 5, s: 18, eff: ['joy'] }, { k: 'lamb', x: 50, y: 6, s: 30, hold: 0, eff: ['joy'] }, { k: 'heart', x: 38, y: 50, s: 11, fx: 'pop' }] },
        { bg: 'evening', text: 'شكر الخروف صديقيه على مساعدتهما.', say: [{ w: 0, t: 'شكرًا يا أصدقائي! لن أنساكم.' }],
          ch: [{ k: 'lamb', x: 30, y: 6, s: 22, fx: 'hop' }, { k: 'rabbit', x: 56, y: 6, s: 18 }, { k: 'owl', x: 80, y: 8, s: 16 }] },
        { bg: 'evening', text: 'وعاد الجميع إلى بيوتهم، وقد تعلّم الخروف أن يبقى قرب أهله، وأن نطلب المساعدة حين نضيع، ونساعد من يحتاجنا. الحمد لله.',
          ch: [{ k: 'sun', x: 18, y: 42, s: 22, fx: 'pop' }, { k: 'lamb', x: 42, y: 6, s: 22, fx: 'hop' }, { k: 'rabbit', x: 66, y: 6, s: 18 }, { k: 'heart', x: 54, y: 52, s: 10, fx: 'pop' }, { k: 'owl', x: 88, y: 8, s: 14 }] }
      ],
      acts: [
        { t: 'pick', q: 'لماذا ضاع الخروف؟', opts: [{ k: 'butterfly', t: 'تبع فراشة', ok: 1 }, { k: 'ball', t: 'لعب بالكرة' }], hint: 'رأى شيئًا جميلًا يطير.' },
        { t: 'pick', q: 'ماذا فعل الخروف حين ضاع؟', opts: [{ k: 'heart', t: 'طلب المساعدة', ok: 1 }, { k: 'tree', t: 'بقي صامتًا' }], hint: 'نادى بأعلى صوته.' },
        { t: 'pick', q: 'من رأى القطيع من بعيد؟', opts: [{ k: 'owl', ok: 1 }, { k: 'fox' }], hint: 'كانت فوق الشجرة.' },
        { t: 'feel', q: 'كيف شعر الخروف حين عاد إلى أهله؟', ans: 'happy' },
        { t: 'order', q: 'رتّب القصة:', items: [{ k: 'butterfly', t: 'تبع الفراشة' }, { k: 'heart', t: 'طلب المساعدة' }, { k: 'lamb', t: 'عاد إلى قطيعه' }] },
        { t: 'talk', q: 'ماذا تفعل لو ضعتَ في مكان مزدحم؟ ومن تطلب منه المساعدة؟' }
      ],
      mission: 'اتفق مع أسرتك اليوم: إذا ضعتَ في مكان، أين تقف ومن تطلب منه المساعدة؟'
    },
    {
      id: 'star', kind: 'bed', age: '٣–٦ سنوات', mins: 2, title: 'النجمة الصغيرة', cover: ['star', 'moon'], value: 'الطمأنينة والانتماء', sticker: 'نجمة هادئة', bgc: '#7C8CF0',
      tip: 'اقرؤوها بصوت منخفض بطيء كأنكم تهدهدون. أطفئوا الأضواء الساطعة وخفّفوا الإضاءة إن أمكن، ودعوا الطفل يضغط السحابة والنجمة بهدوء.',
      why: 'لكل واحد منا مكان يُحَبّ فيه، وليلتنا هادئة بحفظ الله، فننام مطمئنين.',
      scenes: [
        { bg: 'night', text: 'في سماء الليل الهادئة، كانت نجمة صغيرة تبحث عن مكانها بين النجوم.', say: [{ w: 1, t: 'أين مكاني يا ترى؟' }],
          ch: [{ k: 'moon', x: 82, y: 54, s: 20, fx: 'pop' }, { k: 'star', x: 40, y: 38, s: 16, fx: 'pop', eff: ['q'] }, { k: 'star', x: 14, y: 62, s: 6, fx: 'spin' }, { k: 'star', x: 66, y: 66, s: 6, fx: 'spin' }] },
        { bg: 'night', text: 'قال القمر بصوت هادئ: لكل نجمة مكان جميل، تعالي نبحث معًا.', say: [{ w: 0, t: 'تعالي نبحث معًا، بهدوء.', at: 64 }],
          ch: [{ k: 'moon', x: 64, y: 42, s: 28, fx: 'pop' }, { k: 'star', x: 26, y: 38, s: 14, fx: 'pop' }] },
        { bg: 'night', text: 'مرّت سحابة صغيرة تغطي الطريق. اضغط السحابة لتبتعد.',
          ch: [{ k: 'star', x: 62, y: 40, s: 16, fx: 'pop' }, { k: 'cloud', x: 52, y: 38, s: 30, tap: 'whoosh', act: { dx: -48, fade: true, dur: 1600 }, note: 'اضغط السحابة' }, { k: 'moon', x: 18, y: 56, s: 14 }] },
        { bg: 'night', text: 'وجدت مكانها بين نجمتين صديقتين. اضغط النجمة لتنتقل إلى مكانها.',
          ch: [{ k: 'star', x: 30, y: 52, s: 12, fx: 'spin' }, { k: 'star', x: 70, y: 52, s: 12, fx: 'spin' }, { k: 'star', x: 50, y: 30, s: 14, tap: 'sparkle', act: { to: [50, 52], arc: true, dur: 1400, eff: ['joy'] }, note: 'اضغط النجمة' }] },
        { bg: 'night', text: 'ابتسمت النجوم وقالت: أهلًا بكِ يا صغيرة، هذا مكانك.', say: [{ w: 0, t: 'أهلًا بكِ يا صغيرة!' }, { w: 2, t: 'ما أجمل أن أكون معكم.' }],
          ch: [{ k: 'star', x: 24, y: 48, s: 12, fx: 'pop', eff: ['joy'] }, { k: 'star', x: 76, y: 48, s: 12, fx: 'pop', eff: ['joy'] }, { k: 'star', x: 50, y: 48, s: 14, fx: 'pop' }] },
        { bg: 'night', text: 'وصارت السماء هادئة، والقمر يحرس النوم. تصبحون على خير، بحفظ الله.', say: [{ w: 0, t: 'تصبحون على خير…' }],
          ch: [{ k: 'moon', x: 72, y: 50, s: 26, fx: 'pop', tap: 'sparkle', act: { bounce: 2, eff: ['zzz'] }, note: 'اضغط القمر' }, { k: 'star', x: 30, y: 46, s: 14, fx: 'spin' }, { k: 'star', x: 12, y: 64, s: 7 }] }
      ],
      acts: [
        { t: 'pick', q: 'ماذا كانت النجمة تبحث عنه؟', opts: [{ k: 'star', t: 'مكانها', ok: 1 }, { k: 'ball', t: 'كرة' }], hint: 'أرادت أن تكون مع أصدقائها.' },
        { t: 'talk', q: 'ما أجمل شيء رأيته في السماء؟ وأين مكانك الذي تحبه في بيتكم؟' }
      ],
      mission: 'انظر من النافذة إلى السماء قبل النوم وقل: الحمد لله.'
    },
    {
      id: 'sleepy', kind: 'bed', age: '٣–٦ سنوات', mins: 2, title: 'ليلة هادئة في الغابة', cover: ['moon', 'rabbit'], value: 'الاستعداد للنوم وذكر الله', sticker: 'نائم مطمئن', bgc: '#8E7CF0',
      tip: 'اقرؤوا بصوت يهبط تدريجيًا مع كل حيوان ينام. دعوا الطفل يضغط كل حيوان ليغفو، وكرّروا معه «باسمك ربي وضعت جنبي».',
      why: 'قبل النوم نهدأ ونقول ذكر الله، فننام مطمئنين، والغابة كلها تنام بهدوء.',
      scenes: [
        { bg: 'evening', text: 'غابت الشمس، وحان وقت النوم في الغابة الهادئة.', say: [{ w: 1, t: 'كم كان يومًا جميلًا!' }],
          ch: [{ k: 'sun', x: 24, y: 28, s: 24 }, { k: 'rabbit', x: 54, y: 6, s: 24 }, { k: 'tree', x: 88, y: 5, s: 26, fx: 'sway' }] },
        { bg: 'night', text: 'ذهب الأرنب إلى فراشه وقال: باسمك ربي وضعت جنبي. اضغط الأرنب لينام.', say: [{ w: 0, t: 'باسمك ربي وضعت جنبي.' }],
          ch: [{ k: 'rabbit', x: 46, y: 6, s: 28, tap: 'soft', act: { rot: 78, dur: 1400, eff: ['zzz'] }, note: 'اضغط الأرنب' }, { k: 'moon', x: 84, y: 54, s: 14 }] },
        { bg: 'night', text: 'ثم نام الدب الكبير في كهفه الدافئ. اضغط الدب لينام.', say: [{ w: 1, t: 'تصبحون على خير.' }],
          ch: [{ k: 'svg:cave', x: 74, y: 3, s: 26 }, { k: 'bear', x: 34, y: 5, s: 28, tap: 'soft', act: { rot: 78, dur: 1400, eff: ['zzz'] }, note: 'اضغط الدب' }, { k: 'moon', x: 14, y: 58, s: 12 }] },
        { bg: 'night', text: 'وأغمضت البطة عينيها قرب البحيرة. اضغطها لتنام.', say: [{ w: 0, t: 'تصبحون على خير.' }],
          ch: [{ k: 'duck', x: 40, y: 5, s: 24, tap: 'soft', act: { rot: 70, dur: 1400, eff: ['zzz'] }, note: 'اضغط البطة' }, { k: 'moon', x: 82, y: 56, s: 14 }] },
        { bg: 'night', text: 'وانكمشت السلحفاة في بيتها الصغير. اضغطها لتنام.',
          ch: [{ k: 'turtle', x: 44, y: 5, s: 24, tap: 'soft', act: { rot: 8, dur: 1200, eff: ['zzz'] }, note: 'اضغط السلحفاة' }, { k: 'star', x: 16, y: 62, s: 7, fx: 'spin' }, { k: 'moon', x: 84, y: 56, s: 14 }] },
        { bg: 'night', text: 'ونامت الغابة كلها، والقمر يحرسها بحفظ الله. تصبحون على خير.', say: [{ w: 0, t: 'تصبحون على خير…' }],
          ch: [{ k: 'moon', x: 72, y: 50, s: 26, fx: 'pop' }, { k: 'owl', x: 28, y: 6, s: 22, fx: 'sway', eff: ['zzz'] }, { k: 'star', x: 12, y: 64, s: 7, fx: 'spin' }, { k: 'star', x: 50, y: 66, s: 6, fx: 'spin' }] }
      ],
      acts: [
        { t: 'pick', q: 'ماذا قال الأرنب قبل أن ينام؟', opts: [{ k: 'heart', t: 'باسمك ربي وضعت جنبي', ok: 1 }, { k: 'ball', t: 'لا شيء' }], hint: 'ذكر الله قبل النوم يطمئن القلب.' },
        { t: 'talk', q: 'ماذا تقول أنت قبل أن تنام؟ وما الذي يساعدك على النوم بهدوء؟' }
      ],
      mission: 'قبل النوم قل مع أسرتك: باسمك ربي وضعت جنبي، وتصبحون على خير.'
    }
  ];

  /* تعابير الوجوه لكل مشهد: [رقم المشهد، الحيوان، التعبير، (ترتيبه إن تكرر)]. التعبير الافتراضي مستنتج من التأثيرات. */
  var EXP = {
    carrot: [[3, 'rabbit', 'sad'], [4, 'rabbit', 'strain'], [4, 'bear', 'strain'], [4, 'turtle', 'strain'], [4, 'duck', 'strain'], [5, 'bear', 'joy'], [5, 'duck', 'joy'], [6, 'bear', 'joy']],
    rocket: [[5, 'bear', 'strain'], [5, 'fox', 'strain']],
    ball: [[3, 'turtle', 'sad'], [3, 'rabbit', 'think'], [4, 'rabbit', 'joy']],
    toys: [[3, 'rabbit', 'think'], [5, 'rabbit', 'joy']],
    water: [[2, 'rabbit', 'happy'], [3, 'rabbit', 'think'], [5, 'turtle', 'joy']],
    sorry: [[3, 'fox', 'sad'], [4, 'bear', 'joy'], [4, 'fox', 'happy']],
    truth: [[1, 'fox', 'joy'], [5, 'fox', 'joy'], [5, 'owl', 'joy']],
    treasure: [[2, 'rabbit', 'joy'], [2, 'fox', 'joy'], [2, 'bear', 'joy'], [3, 'rabbit', 'think'], [3, 'fox', 'think'], [3, 'bear', 'think'], [4, 'rabbit', 'joy'], [4, 'fox', 'joy'], [4, 'bear', 'joy'],
      [7, 'bear', 'strain'], [7, 'fox', 'strain'], [8, 'rabbit', 'scared'], [8, 'fox', 'scared'], [8, 'bear', 'scared'], [9, 'rabbit', 'scared'], [9, 'fox', 'think'], [10, 'fox', 'joy'], [10, 'bear', 'joy'],
      [11, 'rabbit', 'surprised'], [11, 'fox', 'surprised'], [11, 'bear', 'surprised'], [13, 'rabbit', 'think'], [14, 'bear', 'joy'], [15, 'fox', 'joy'], [16, 'rabbit', 'joy'], [16, 'fox', 'joy'], [16, 'bear', 'joy']],
    race: [[2, 'fox', 'joy'], [3, 'fox', 'joy'], [4, 'fox', 'joy'], [5, 'fox', 'joy'], [7, 'turtle', 'strain'], [10, 'fox', 'strain'], [10, 'turtle', 'strain'], [11, 'bear', 'joy'], [13, 'fox', 'joy'], [13, 'turtle', 'joy']],
    dark: [[2, 'bear', 'scared'], [3, 'bear', 'scared'], [5, 'bear', 'surprised'], [6, 'bear', 'sad'], [7, 'bear', 'joy'], [10, 'bear', 'surprised']],
    seed: [[2, 'rabbit', 'sad'], [3, 'rabbit', 'think'], [4, 'rabbit', 'happy']],
    lamb: [[2, 'lamb', 'joy'], [3, 'lamb', 'scared'], [5, 'lamb', 'cry'], [6, 'lamb', 'sad', 1], [7, 'lamb', 'think'], [8, 'lamb', 'joy'], [9, 'lamb', 'think'], [12, 'lamb', 'joy'], [13, 'lamb', 'joy']]
  };
  var ACTEX = [['treasure', 8, 'rabbit', 'joy'], ['treasure', 8, 'fox', 'joy'], ['treasure', 8, 'bear', 'joy'], ['lamb', 10, 'lamb', 'joy', 2], ['sleepy', 2, 'rabbit', 'sleepy'], ['sleepy', 3, 'bear', 'sleepy'], ['sleepy', 4, 'duck', 'sleepy'], ['sleepy', 5, 'turtle', 'sleepy']];
  function nth(list, k, n) { var seen = 0; for (var i = 0; i < list.length; i++) if (list[i].k === k) { if (seen === (n || 0)) return list[i]; seen++; } return null; }
  (function applyEx() {
    STORIES.forEach(function (S) {
      (EXP[S.id] || []).forEach(function (e) { var sc = S.scenes[e[0] - 1], c = sc && nth(sc.ch, e[1], e[3]); if (c && !c.ex) c.ex = e[2]; });
    });
    ACTEX.forEach(function (e) { var S = STORIES.filter(function (x) { return x.id === e[0]; })[0], sc = S && S.scenes[e[1] - 1], c = sc && nth(sc.ch, e[2], e[4]); if (c && c.act) c.act.ex = e[3]; });
  })();
  var BYID = {}; STORIES.forEach(function (s) { BYID[s.id] = s; });
  var BCOL = { rabbit: '#FFE1EC', bear: '#F3D6B0', fox: '#FFE0C4', turtle: '#D6F5E0', duck: '#FFF3B0', rocket: '#D9E8FF', owl: '#E8E0FF', cat: '#FFE9C7' };

  /* ═════════ المشهد ═════════ */
  var ARMC = { rabbit: '#F7B8CC', bear: '#A8683F', fox: '#F28A3D', turtle: '#5FBF86', duck: '#FFB62E', cat: '#F0A860', owl: '#9B7BD8', bird: '#5CA8F0' };
  function effHtml(list) {
    var o = '';
    (list || []).forEach(function (e) {
      if (e === 'sweat') o += '<span class="e e-sweat a"></span><span class="e e-sweat b"></span><span class="e e-sweat c"></span>';
      else if (e === 'effort') o += '<svg class="e e-effort" viewBox="0 0 40 60"><path d="M30 8Q14 10 8 24M34 26Q18 28 12 42M30 44Q16 46 10 56" stroke="#8E5CF0" stroke-width="3.5" fill="none" stroke-linecap="round"/></svg>';
      else if (e === 'joy') o += '<span class="e e-joy a">' + pic('heart') + '</span><span class="e e-joy b">' + pic('star') + '</span><span class="e e-joy c">' + pic('heart') + '</span>';
      else if (e === 'sad') o += '<span class="e e-tear"></span>';
      else if (e === 'q') o += '<span class="e e-q">؟</span>';
      else if (e === 'bang') o += '<span class="e e-bang">!</span>';
      else if (e === 'flame') o += '<svg class="e e-flame" viewBox="0 0 40 70"><path d="M20 2Q36 28 28 50Q20 68 12 50Q4 28 20 2Z" fill="#FF8A3D"/><path d="M20 20Q28 36 24 48Q20 58 16 48Q12 36 20 20Z" fill="#FFD34E"/></svg>';
      else if (e === 'zzz') o += '<span class="e e-z a">Z</span><span class="e e-z b">z</span><span class="e e-z c">Z</span>';
      else if (e === 'smoke') o += '<span class="e e-smoke a"></span><span class="e e-smoke b"></span><span class="e e-smoke c"></span>';
    });
    return o;
  }
  /* فعل حقيقي عند الضغط: انتقال (to أو dx/dy بنسب مئوية)، مسار قوسي، ارتداد، تبديل الصورة، تأثيرات، إزالة التراب */

  /* تكبير عنصر مهم (كالخريطة) ليقرأه الطفل: نافذة كبيرة داخل القصة */
  var MAPPTS = [[22, 100, 'البداية'], [58, 62, 'الشجرة'], [100, 88, 'النهر'], [140, 50, 'الكهف'], [176, 96, 'الكنز']];
  function mapBig(hl) {
    var P = MAPPTS, d = 'M22 100Q40 55 58 62T100 88T140 50T176 96', o = '';
    o += '<rect x="3" y="3" width="194" height="124" rx="10" fill="#F7E6B8" stroke="#C98A3F" stroke-width="3.5"/>';
    o += '<path d="M10 40L28 14L46 40ZM30 40L48 20L66 40Z" fill="#B7C9E8" opacity=".7"/>';
    o += '<path d="M93 4Q106 24 94 44T96 84T94 124H110Q112 100 106 84T108 44T104 4Z" fill="#5CC8FF"/><path d="M98 16Q104 28 98 40M100 60Q106 72 100 84" stroke="#fff" stroke-width="1.6" fill="none" opacity=".8"/>';
    o += '<rect x="90" y="84" width="22" height="8" rx="2" fill="#A8683A" stroke="#7A4A25" stroke-width="1"/>';
    o += '<circle cx="58" cy="52" r="11" fill="#3FA85C"/><circle cx="50" cy="58" r="8" fill="#52C06E"/><rect x="56" y="60" width="4" height="10" fill="#8A5A33"/>';
    o += '<path d="M126 62Q126 36 140 36T154 62Z" fill="#4A3A5E"/><path d="M134 62Q134 48 140 48T146 62Z" fill="#1F1838"/><path d="M122 62H158" stroke="#7A6A8E" stroke-width="3" stroke-linecap="round"/>';
    o += '<mask id="mm"><path d="' + d + '" pathLength="1" stroke="#fff" stroke-width="8" fill="none" class="zm-draw"/></mask>';
    o += '<path d="' + d + '" stroke="#F0485A" stroke-width="3.2" fill="none" stroke-dasharray="6 5" stroke-linecap="round" mask="url(#mm)"/>';
    o += '<path d="M168 88L184 104M184 88L168 104" stroke="#E0334C" stroke-width="5" stroke-linecap="round"/>';
    o += '<path d="M16 100V84" stroke="#7A4A25" stroke-width="2.5"/><path d="M16 84L30 89L16 94Z" fill="#8E5CF0"/>';
    P.forEach(function (q, i) { o += '<text x="' + q[0] + '" y="' + (i === 2 ? 116 : i === 3 ? 26 : i === 1 ? 82 : 118) + '" text-anchor="middle" font-size="9.5" font-weight="800" fill="#6B3A12" stroke="#F7E6B8" stroke-width="2.6" paint-order="stroke">' + q[2] + '</text>'; });
    if (hl != null && P[hl]) o += '<circle cx="' + P[hl][0] + '" cy="' + P[hl][1] + '" r="9" fill="none" stroke="#FFC83D" stroke-width="3.4" class="zm-ring"/>';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 130" class="zm-svg">' + o + '</svg>';
  }
  function openZoom(spec, scene) {
    var host = scene.closest('.st-stage') || scene.parentNode, body = '', cap = '';
    if (spec.indexOf('map') === 0) { var hl = spec.split(':')[1]; body = mapBig(hl === undefined ? null : +hl); cap = hl === undefined ? 'خريطة الكنز: اتبع الخط الأحمر حتى العلامة ✕' : 'الخريطة تقول: نحن هنا، والكنز في آخر الخط الأحمر.'; }
    else body = pic(spec);
    var ov = h('div', { class: 'st-zoom', role: 'dialog' }, h('div', { class: 'zm-card', html: body }), h('div', { class: 'zm-cap', text: cap }), h('button', { class: 'zm-ok', type: 'button', text: 'حسنًا' }));
    function close() { UI.anim(ov, [{ opacity: 1 }, { opacity: 0 }], { dur: 220 }).then(function () { ov.remove(); }); if (B.audio) B.audio.play('close'); }
    ov.addEventListener('click', close); host.appendChild(ov); if (B.audio) B.audio.play('open');
    UI.anim(ov, [{ opacity: 0 }, { opacity: 1 }], { dur: 250 }); UI.anim(ov.firstChild, [{ transform: 'scale(.3) rotate(-6deg)' }, { transform: 'scale(1)' }], { dur: 520, easing: UI.SPRING });
  }
  function runAct(el, inn, c, A, scene, tr) {
    if (A.zoom) openZoom(A.zoom, scene);
    var sr = scene.getBoundingClientRect(), W = sr.width || 300, H = sr.height || 225;
    if (A.swap) inn.innerHTML = pic(A.swap);
    if (A.ex) inn.innerHTML = pic(c.k, A.ex);
    if (A.soil === false) { var so = el.querySelector('.st-soil'); if (so) so.style.display = 'none'; }
    var ef = el.querySelector('.st-eff'); if (A.eff) { if (!ef) { ef = h('div', { class: 'st-eff' }); el.appendChild(ef); } ef.insertAdjacentHTML('beforeend', effHtml(A.eff)); }
    var dx = A.to ? (A.to[0] - c.x) / 100 * W : (A.dx || 0) / 100 * W, dy = A.to ? -(A.to[1] - c.y) / 100 * H : -(A.dy || 0) / 100 * H;
    var base = tr || '', rot = A.rot || 0, fr = [], sc = A.scale || 1;
    function T(x, y, r) { return { opacity: 1, transform: 'translate(' + x + 'px,' + y + 'px) rotate(' + r + 'deg) ' + base + (sc !== 1 && (x || y) ? ' scale(' + sc + ')' : '') }; }
    (A.reveal || []).forEach(function (ri, k) { var re = scene.querySelectorAll('.st-ch')[ri]; if (re) { re.style.opacity = '1'; UI.anim(re, [{ opacity: 0, transform: 'translateX(-50%) translateY(20px) scale(.3)' }, { opacity: 1, transform: 'translateX(-50%) translateY(0) scale(1.2)' }, { opacity: 1, transform: 'translateX(-50%) scale(1)' }], { dur: 700, delay: 300 + k * 250, fill: 'backwards' }); } });
    if (A.bounce) { fr.push(T(0, 0, 0)); for (var i = 0; i < A.bounce; i++) { fr.push(T(0, -H * 0.2, i % 2 ? 8 : -8)); fr.push(T(0, 0, 0)); } }
    else if (A.arc) { fr = [T(0, 0, 0), T(dx * 0.5, dy * 0.5 - H * 0.16, rot / 2), T(dx, dy, rot)]; }
    else if (A.shake) { fr = [T(0, 0, 0), T(-8, 0, -6), T(8, 0, 6), T(-8, 0, -6), T(0, 0, 0)]; }
    else { fr = [T(0, 0, 0), T(dx, dy, rot)]; }
    if (A.fade && fr.length) fr[fr.length - 1].opacity = 0;
    var an = inn.animate(fr, { duration: (A.dur || 900) / UI.ts, easing: A.ease || 'ease-in-out', fill: A.bounce || A.shake ? 'none' : 'forwards' });
    if (A.snd2) setTimeout(function () { if (B.audio) B.audio.play(A.snd2); }, (A.dur || 900) / UI.ts);
    if (A.after) an.onfinish = function () { if (A.after.eff && ef) ef.innerHTML = ''; if (A.after.swap) inn.innerHTML = pic(A.after.swap); };
    if (A.fx) { el.classList.remove('fx-hop', 'fx-sway', 'fx-pop', 'fx-fly'); }
  }
  function sceneEl(p, withSay) {
    var s = h('div', { class: 'st-scene bg-' + p.bg });
    if (p.bg === 'night') s.appendChild(h('div', { class: 'st-hills mid', html: art.sceneTile('gmid', 600, 50) }));
    else if (p.bg === 'cave') { s.appendChild(h('div', { class: 'st-cavewall' })); s.appendChild(h('div', { class: 'st-stal', html: '<svg viewBox="0 0 100 14" preserveAspectRatio="none"><path d="M0 0H100V3L94 14L88 4L78 11L70 3L58 13L50 3L40 12L30 3L20 14L12 4L5 10L0 4Z" fill="#2A2140"/></svg>' })); s.appendChild(h('div', { class: 'st-cavefloor' })); }
    else if (p.bg === 'room') s.appendChild(h('div', { class: 'st-floor' }));
    else if (p.bg === 'bath') { s.appendChild(h('div', { class: 'st-tiles' })); s.appendChild(h('div', { class: 'st-floor bath' })); }
    else { s.appendChild(h('div', { class: 'st-hills far', html: art.sceneTile('gfar', 600, 120) })); s.appendChild(h('div', { class: 'st-hills mid', html: art.sceneTile('gmid', 600, 90) })); }
    var chs = p.ch || [], nodes = [], trs = [];
    chs.forEach(function (c, i) {
      var tr = (c.flip ? 'scaleX(-1) ' : '') + (c.tilt ? 'rotate(' + c.tilt + 'deg)' : '');
      trs[i] = tr;
      var el = h('div', { class: 'st-ch' + (c.fx ? ' fx-' + c.fx : '') + (c.tap ? ' st-hot' : ''), style: { left: c.x + '%', bottom: c.y + '%', width: c.s + '%', animationDelay: (i * 0.35) + 's' } },
        h('div', { class: 'st-in', style: { transform: tr || 'none', transformOrigin: '50% 100%' }, html: pic(c.k, inferEx(c)) }));
      nodes[i] = el;
      if (c.hide) el.style.opacity = '0';
      if (c.enter) UI.anim(el.firstChild, [{ opacity: 0, transform: 'translateX(-90px) ' + (tr || '') }, { opacity: 1, transform: (tr || 'none') }], { dur: 1100, delay: 200 + i * 220, fill: 'backwards' });
      if (c.buried) el.appendChild(h('div', { class: 'st-soil' }));
      if (c.eff) el.appendChild(h('div', { class: 'st-eff', html: effHtml(c.eff) }));
      if (c.tap) {
        el.appendChild(h('div', { class: 'st-ring' }));
        el.appendChild(h('div', { class: 'st-paw', html: art.hand() }));
        el.setAttribute('role', 'button'); el.setAttribute('aria-label', c.note || 'اضغط');
        var acted = false;
        el.addEventListener('click', function () {
          if (B.audio) B.audio.play(c.tap);
          var A = c.act, inn = el.firstChild;
          if (A && !acted) {
            acted = true; runAct(el, inn, c, A, s, tr);
            (A.others || []).forEach(function (o, k) { setTimeout(function () { var ne = nodes[o.i]; if (ne) runAct(ne, ne.firstChild, chs[o.i], o.act, s, trs[o.i]); }, k * 260 / UI.ts); });
          } else if (!A) {
            UI.anim(inn, [{ transform: tr || 'none' }, { transform: (c.flip ? 'scaleX(-1) ' : '') + 'rotate(' + ((c.tilt || 0) - 7) + 'deg) scale(1.15)' }, { transform: (c.flip ? 'scaleX(-1) ' : '') + 'rotate(' + ((c.tilt || 0) + 7) + 'deg) scale(1.15)' }, { transform: tr || 'none' }], { dur: 500, fill: 'none' });
          }
          var pw = el.querySelector('.st-paw'), rg = el.querySelector('.st-ring'), nt = el.querySelector('.st-note');
          if (pw) pw.style.display = 'none'; if (rg) rg.style.display = 'none'; if (nt) nt.style.display = 'none';
        });
        if (c.note) el.appendChild(h('span', { class: 'st-note', text: c.note }));
      }
      s.appendChild(el);
    });
    // الأذرع: خطوط مع كفوف تمسك بالشيء الآخر (الشخصية تفعل ما يقوله النص)
    var arms = '';
    chs.forEach(function (c) {
      if (c.hold == null || !chs[c.hold]) return;
      var t2 = chs[c.hold], col = ARMC[c.k] || '#E9B68E';
      var yc = function (o, f) { return 75 * (1 - (o.y + (o.s / 0.75) * f) / 100); };
      var dir = t2.x >= c.x ? 1 : -1;
      var x1 = c.x + dir * c.s * 0.32, y1 = yc(c, 0.34);
      var x2 = t2.x - dir * t2.s * 0.26, y2 = yc(t2, t2.hy == null ? 0.42 : t2.hy);
      var sw = Math.max(3.4, c.s * 0.15);
      arms += '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + col + '" stroke-width="' + sw + '" stroke-linecap="round"/><circle cx="' + x2 + '" cy="' + y2 + '" r="' + (sw * 0.85) + '" fill="' + col + '" stroke="#fff" stroke-width="0.7"/>';
    });
    if (arms) s.appendChild(h('div', { class: 'st-arms', html: '<svg viewBox="0 0 100 75" preserveAspectRatio="xMidYMid meet">' + arms + '</svg>' }));
    if (withSay !== false) {
      var says = p.say || [], many = says.length > 1, stack = many ? h('div', { class: 'st-says' }) : null;
      says.forEach(function (b, bi) {
        var c = chs[b.w] || { x: 50, y: 20, s: 20, k: 'rabbit' };
        var left = many ? Math.max(34, Math.min(66, c.x)) : Math.max(27, Math.min(73, c.x));
        var wPct = many ? 0.6 : 0.46;
        var st = { left: left + '%', background: BCOL[c.k] || '#fff', '--dx': ((c.x - left) / wPct) + '%', animationDelay: (bi * 0.9) + 's' };
        if (!many) st.bottom = (b.at != null ? b.at : Math.min(80, c.y + c.s / 0.75 + 3)) + '%';
        var bub = h('div', { class: 'st-bub' + (many ? ' stack' : ''), style: st }, many ? h('em', { class: 'st-bn', text: UI.num(bi + 1) }) : null, h('span', { text: b.t }));
        (many ? stack : s).appendChild(bub);
      });
      if (stack) s.appendChild(stack);
    }
    return s;
  }

  function stickerSvg(S) {
    return sv('<circle cx="50" cy="50" r="44" fill="' + S.bgc + '" stroke="#fff" stroke-width="6"/><path d="M50 18l9 19 21 3-15 14 4 21-19-10-19 10 4-21-15-14 21-3z" fill="#FFF3B0" stroke="#E2A21B" stroke-width="3" stroke-linejoin="round"/>');
  }

  /* ═════════ الواجهة ═════════ */
  function markRead(id) { var d = B.storage.data(); d.stories = d.stories || {}; d.stories[id] = { read: true }; B.storage.save(); }
  function isRead(id) { var d = B.storage.data(); return !!(d.stories && d.stories[id] && d.stories[id].read); }

  B.free.stories = {
    list: function () { return STORIES.map(function (s) { return { id: s.id, title: s.title, cover: s.cover, value: s.value, bgc: s.bgc, kind: s.kind, age: s.age, mins: s.mins, read: isRead(s.id) }; }); },
    tags: function (S) {
      var long = S.kind === 'long', bed = S.kind === 'bed';
      return h('div', { class: 'st-tags' }, h('span', { class: 'st-tag ' + (bed ? 'bed' : long ? 'long' : 'short'), text: bed ? 'قصة قبل النوم' : long ? 'قصة طويلة' : 'قصة قصيرة' }),
        h('span', { class: 'st-tag age', text: S.age || '٣–٥ سنوات' }), h('span', { class: 'st-tag min', text: '≈ ' + UI.num(S.mins || (long ? 3 : 1)) + ' د' }));
    },
    cover: function (S) { return h('div', { class: 'st-cover', style: { background: 'linear-gradient(160deg,#BDE8FF,' + S.bgc + ')' } }, S.cover.map(function (k) { return h('span', { html: pic(k) }); })); },
    pick: null,
    open: function (ctx) {
      var stage = ctx.stage; stage.classList.add('st-stage');
      var root = h('div', { class: 'st-root scrollable' }); stage.appendChild(root);
      var self = B.free.stories;
      function clear() { root.innerHTML = ''; root.scrollTop = 0; }

      function library() {
        clear();
        var grid = h('div', { class: 'st-lib' });
        function addCards(list, g) {
          list.forEach(function (S) {
            var card = h('button', { class: 'st-card' + (isRead(S.id) ? ' read' : ''), type: 'button', 'aria-label': S.title }, self.cover(S),
              h('b', { text: S.title }), self.tags(S), h('small', { text: 'القيمة: ' + S.value }), isRead(S.id) ? h('span', { class: 'st-read', html: art.check() }) : null);
            UI.bindPress(card, function () { if (B.audio) B.audio.play('open'); intro(S); });
            g.appendChild(card);
          });
        }
        var shortL = STORIES.filter(function (s) { return s.kind === 'short'; }), longL = STORIES.filter(function (s) { return s.kind === 'long'; }), bedL = STORIES.filter(function (s) { return s.kind === 'bed'; });
        root.appendChild(h('h2', { class: 'st-h', text: B.S.stories.title }));
        root.appendChild(self.chips(root, root));
        root.appendChild(h('h3', { class: 'st-sub', 'data-k': 'long', text: 'قصص طويلة (٣ دقائق تقريبًا) — للأكبر قليلًا' })); addCards(longL, grid); root.appendChild(grid);
        var grid2 = h('div', { class: 'st-lib' }); root.appendChild(h('h3', { class: 'st-sub', 'data-k': 'short', text: 'قصص قصيرة (دقيقة أو دقيقتان) — للأصغر' })); addCards(shortL, grid2); root.appendChild(grid2);
        var grid3 = h('div', { class: 'st-lib' }); root.appendChild(h('h3', { class: 'st-sub', 'data-k': 'bed', text: 'قصص قبل النوم (هادئة) — للمساء' })); addCards(bedL, grid3); root.appendChild(grid3);
        return;
        root.appendChild(h('h2', { class: 'st-h', text: B.S.stories.title })); root.appendChild(grid);
      }

      function intro(S) {
        clear();
        var panel = h('div', { class: 'st-parent' }, h('span', { class: 'st-pt', text: 'للوالدين' }),
          h('p', { text: 'القيمة: ' + S.value + ' — ' + S.why }),
          h('p', { class: 'st-pi', text: 'في القصة أشياء تفاعلية: اضغطوا ما حوله حلقة صفراء.' }));
        var sc = sceneEl({ bg: S.scenes[0].bg, ch: S.scenes[0].ch }, false);
        var go = h('button', { class: 'st-nav next big', type: 'button' }, h('b', { text: 'ابدأ القصة' }), h('span', { text: '←' }));
        var back = h('button', { class: 'st-nav prev', type: 'button' }, h('span', { text: '→' }), h('b', { text: B.S.stories.more }));
        UI.bindPress(go, function () { if (B.audio) B.audio.play('open'); scene(S, 0); });
        UI.bindPress(back, function () { if (B.audio) B.audio.play('close'); library(); });
        root.appendChild(h('div', { class: 'st-title', text: S.title }));
        root.appendChild(h('div', { class: 'st-page' }, sc, h('div', { class: 'st-text intro' }, h('b', { text: S.title }))));
        root.appendChild(panel);
        root.appendChild(h('div', { class: 'st-bar wrap' }, back, go));
      }

      function topBar(i, n, label) {
        var pct = Math.round(((i + 1) / n) * 100);
        return h('div', { class: 'st-prog' }, h('span', { text: label }), h('i', {}, h('u', { style: { width: pct + '%' } })));
      }

      function scene(S, i) {
        clear();
        var n = S.scenes.length, P = S.scenes[i];
        var sc = sceneEl(P), txt = h('div', { class: 'st-text', text: P.text });
        var prev = h('button', { class: 'st-nav prev', type: 'button', 'aria-label': B.S.stories.prev }, h('span', { text: '→' }), h('b', { text: B.S.stories.prev }));
        var next = h('button', { class: 'st-nav next', type: 'button', 'aria-label': B.S.stories.next }, h('b', { text: i === n - 1 ? 'هيا نلعب ونتذكر!' : B.S.stories.next }), h('span', { text: '←' }));
        UI.bindPress(prev, function () { if (B.audio) B.audio.play('page'); if (i > 0) scene(S, i - 1); else intro(S); });
        UI.bindPress(next, function () { if (B.audio) B.audio.play('page'); if (i < n - 1) scene(S, i + 1); else act(S, 0); });
        root.appendChild(topBar(i, n, 'المشهد ' + UI.num(i + 1) + ' من ' + UI.num(n)));
        root.appendChild(h('div', { class: 'st-page' }, sc, txt));
        if (P.ask) {   // «ما رأيك؟»: سؤال توقّع بلا صواب وخطأ، يفتح التالي بعد الاختيار
          next.disabled = true;
          var opts = h('div', { class: 'st-opts st-guess' }), react = h('div', { class: 'st-msg ok', text: '' });
          opts.appendChild(h('div', { class: 'st-guess-q', text: P.ask.q }));
          P.ask.opts.forEach(function (o) {
            var bt = h('button', { class: 'st-opt', type: 'button' }, h('span', { class: 'st-oi', html: pic(o.k) }), o.t ? h('b', { text: o.t }) : null);
            UI.bindPress(bt, function () {
              if (next.disabled === false) return;
              bt.classList.add('right'); next.disabled = false; react.textContent = P.ask.react || 'فكرة جميلة! لنرَ ماذا حدث.'; if (B.audio) B.audio.play('pop');
              UI.anim(next, [{ transform: 'scale(1)' }, { transform: 'scale(1.1)' }, { transform: 'scale(1)' }], { dur: 500, fill: 'none' });
            });
            opts.appendChild(bt);
          });
          root.appendChild(opts); root.appendChild(react);
        }
        root.appendChild(h('div', { class: 'st-bar' }, prev, next));
        UI.anim(sc, [{ opacity: 0, transform: 'translateX(-30px)' }, { opacity: 1, transform: 'none' }], { dur: 380, fill: 'none' });
        UI.anim(txt, [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { dur: 380, delay: 120, fill: 'backwards' });
      }

      function act(S, j) {
        clear();
        var n = S.acts.length;
        if (j >= n) { mission(S); return; }
        var A = S.acts[j];
        root.appendChild(topBar(j, n, 'نلعب ونتذكر ' + UI.num(j + 1) + ' / ' + UI.num(n)));
        var card = h('div', { class: 'st-act' }, h('div', { class: 'st-q', text: A.q }));
        root.appendChild(card);
        var msg = h('div', { class: 'st-msg', text: '' });
        function next() { setTimeout(function () { act(S, j + 1); }, 1300); }
        function praise() { msg.textContent = PRAISE[Math.floor(Math.random() * PRAISE.length)]; msg.className = 'st-msg ok'; if (B.audio) B.audio.play('cheer'); }
        var wrong = 0;
        function bad(btn, correctBtn) {
          wrong++;
          if (B.audio) B.audio.play('wrong');
          UI.anim(btn, [{ transform: 'translateX(0)' }, { transform: 'translateX(-10px)' }, { transform: 'translateX(10px)' }, { transform: 'translateX(0)' }], { dur: 350, fill: 'none' });
          if (A.hint) { msg.textContent = A.hint; msg.className = 'st-msg hint'; }
          if (wrong >= 2 && correctBtn) correctBtn.classList.add('pulse-hint');
        }
        if (A.t === 'pick' || A.t === 'feel') {
          var opts = A.t === 'feel' ? [{ f: 'happy', ok: A.ans === 'happy', t: 'سعيد' }, { f: 'sad', ok: A.ans === 'sad', t: 'حزين' }] : A.opts;
          var grid = h('div', { class: 'st-opts' }), correctBtn = null, doneFlag = false;
          opts.forEach(function (o) {
            var b = h('button', { class: 'st-opt', type: 'button' }, h('span', { class: 'st-oi', html: o.f ? face(o.f) : pic(o.k) }), o.t ? h('b', { text: o.t }) : null);
            if (o.ok) correctBtn = b;
            UI.bindPress(b, function () {
              if (doneFlag) return;
              if (o.ok) { doneFlag = true; b.classList.add('right'); praise(); UI.burst(stage, kit.center(b, stage).x, kit.center(b, stage).y, { n: 16, spread: 100, dur: 900 }); next(); }
              else bad(b, correctBtn);
            });
            grid.appendChild(b);
          });
          card.appendChild(grid);
        } else if (A.t === 'order') {
          var items = kit.shuffle(A.items.map(function (it, idx) { return { it: it, idx: idx }; })), nextIdx = 0, grid2 = h('div', { class: 'st-opts' });
          var firstWrong = null;
          items.forEach(function (o) {
            var b = h('button', { class: 'st-opt', type: 'button' }, h('span', { class: 'st-oi', html: pic(o.it.k) }), h('b', { text: o.it.t }));
            UI.bindPress(b, function () {
              if (b.classList.contains('right')) return;
              if (o.idx === nextIdx) {
                nextIdx++; b.classList.add('right'); b.appendChild(h('em', { class: 'st-num', text: UI.num(nextIdx) })); if (B.audio) B.audio.play('place');
                if (nextIdx === A.items.length) { praise(); next(); }
              } else { bad(b, null); msg.textContent = 'ما الذي حدث أولًا في القصة؟'; msg.className = 'st-msg hint'; }
            });
            grid2.appendChild(b);
          });
          card.appendChild(grid2);
        } else {   // talk
          card.appendChild(h('div', { class: 'st-talk', html: pic('heart') }));
          card.appendChild(h('div', { class: 'st-msg hint', text: 'تحدّثوا معًا قليلًا، ثم اضغطوا التالي.' }));
          var nx = h('button', { class: 'st-nav next', type: 'button' }, h('b', { text: B.S.stories.next }), h('span', { text: '←' }));
          UI.bindPress(nx, function () { act(S, j + 1); });
          root.appendChild(h('div', { class: 'st-bar wrap' }, nx));
        }
        root.appendChild(msg);
      }

      function mission(S) {
        clear();
        var ok = h('button', { class: 'st-nav next big', type: 'button' }, h('b', { text: 'سأفعلها!' }), h('span', { text: '←' }));
        UI.bindPress(ok, function () { done(S); });
        root.appendChild(h('div', { class: 'st-title', text: 'مهمة صغيرة' }));
        root.appendChild(h('div', { class: 'st-act' }, h('div', { class: 'st-talk', html: art.check() }), h('div', { class: 'st-q', text: S.mission })));
        root.appendChild(h('div', { class: 'st-bar wrap' }, ok));
      }

      function done(S) {
        clear(); markRead(S.id);
        if (B.audio) { B.audio.play('cheer'); }
        var st = h('div', { class: 'st-sticker', html: stickerSvg(S) });
        var again = h('button', { class: 'st-nav next', type: 'button' }, h('b', { text: B.S.stories.again }));
        var lib = h('button', { class: 'st-nav prev', type: 'button' }, h('b', { text: B.S.stories.more }));
        UI.bindPress(again, function () { intro(S); }); UI.bindPress(lib, library);
        root.appendChild(h('div', { class: 'st-act big' }, st, h('div', { class: 'st-q', text: 'يا سلام! أكملت الحكاية!' }), h('div', { class: 'st-msg ok', text: 'أنت ' + S.sticker + '!' })));
        root.appendChild(h('div', { class: 'st-bar wrap' }, lib, again));
        UI.anim(st, [{ transform: 'scale(0) rotate(-40deg)' }, { transform: 'scale(1.2) rotate(8deg)' }, { transform: 'scale(1) rotate(0)' }], { dur: 800, easing: UI.SPRING, fill: 'none' });
        setTimeout(function () { var c = kit.center(st, stage); UI.burst(stage, c.x, c.y, { n: 30, spread: 180, dur: 1500 }); }, 300);
      }

      var pick = self.pick; self.pick = null;
      if (pick && BYID[pick]) intro(BYID[pick]); else library();
    },
    destroy: function () {}
  };

  /* شريط ثابت لأقسام القصص (طويلة/قصيرة/قبل النوم): ينقل إلى القسم ويُبرز الحالي */
  B.free.stories.SECS = [['long', 'طويلة', 'قصص طويلة (٣ دقائق تقريبًا) — للأكبر قليلًا'], ['short', 'قصيرة', 'قصص قصيرة (دقيقة أو دقيقتان) — للأصغر'], ['bed', 'قبل النوم', 'قصص قبل النوم (هادئة) — للمساء']];
  B.free.stories.chips = function (scroller, root) {
    var bar = h('div', { class: 'st-chips', role: 'tablist' }), btns = {};
    B.free.stories.SECS.forEach(function (s) {
      var b = h('button', { class: 'st-chip', type: 'button', text: s[1], 'data-k': s[0] }); btns[s[0]] = b;
      b.addEventListener('click', function () {
        var hd = root.querySelector('.st-sub[data-k="' + s[0] + '"]'); if (!hd) return;
        var top = hd.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - bar.offsetHeight - 8;
        scroller.scrollTo({ top: top, behavior: 'smooth' }); if (B.audio) B.audio.play('page');
      });
      bar.appendChild(b);
    });
    function upd() {
      var cur = 'long', lim = scroller.getBoundingClientRect().top + scroller.clientHeight * 0.55;
      B.free.stories.SECS.forEach(function (s) { var hd = root.querySelector('.st-sub[data-k="' + s[0] + '"]'); if (hd && hd.getBoundingClientRect().top <= lim) cur = s[0]; });
      Object.keys(btns).forEach(function (k) { btns[k].classList.toggle('on', k === cur); });
    }
    scroller.addEventListener('scroll', upd, { passive: true }); setTimeout(upd, 60);
    return bar;
  };
})();
