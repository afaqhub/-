/* قصص مصورة يقرؤها الوالدان مع الطفل.
   كل قصة: مقدمة للوالدين (القيمة + نصيحة إلقاء)، ثم مشاهد مرسومة بفقاعات حوار وأصوات يضغطها الطفل،
   ثم أنشطة ختامية قصيرة ومرحة (اختيار/شعور/ترتيب/حديث)، ثم مهمة صغيرة وملصق.
   لإضافة قصة: أضف عنصراً إلى STORIES. المواضع x و y و s نسب مئوية من عرض المشهد. */
(function () {
  'use strict';
  var B = (window.Bustan = window.Bustan || {});
  B.free = B.free || {};
  var UI = B.UI, h = UI.h, art = B.art, kit = B.kit;
  function pic(k) {
    if (k.indexOf('svg:') === 0) return CUSTOM[k.slice(4)];
    return B.pics.draw(k);
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
      id: 'carrot', title: 'أرنوب والجزرة الكبيرة', cover: ['rabbit', 'carrot'], value: 'التعاون', sticker: 'صديق متعاون', bgc: '#FFB84E',
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
          ch: [{ k: 'carrot', x: 91, y: 8, s: 18, buried: true, hy: 0.7, tap: 'whoosh', note: 'اضغط لتخرج' }, { k: 'rabbit', x: 72, y: 6, s: 21, tilt: -15, hold: 0, eff: ['sweat'] }, { k: 'bear', x: 52, y: 6, s: 22, tilt: -15, hold: 1, eff: ['effort'] }, { k: 'turtle', x: 33, y: 5, s: 19, tilt: -13, hold: 2 }, { k: 'duck', x: 14, y: 6, s: 17, tilt: -13, hold: 3, eff: ['sweat'] }] },
        { bg: 'day', text: 'خرجت الجزرة! وسقط الجميع على ظهورهم وضحكوا.', say: [{ w: 3, t: 'هيييه! نجحنا معًا!' }],
          ch: [{ k: 'svg:hole', x: 88, y: 3, s: 16 }, { k: 'carrot', x: 70, y: 5, s: 20, tilt: -35, fx: 'pop', tap: 'cheer', note: 'اضغط للاحتفال' }, { k: 'rabbit', x: 50, y: 4, s: 16, tilt: -62, eff: ['joy'] }, { k: 'bear', x: 32, y: 4, s: 18, tilt: -62 }, { k: 'duck', x: 14, y: 4, s: 14, tilt: -62 }] },
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
      id: 'rocket', title: 'الصاروخ الصغير والمحاولة', cover: ['rocket', 'moon'], value: 'الصبر والمحاولة', sticker: 'بطل المحاولة', bgc: '#8E7CF0',
      tip: 'اقرؤوا العدّ التنازلي ببطء ثم بحماس: «ثلاثة… اثنان… واحد…» وتوقفوا قليلًا قبل أن يفشل! ثم دعوا الطفل يضغط الصاروخ ليطير في المشهد الأخير.',
      why: 'لا بأس أن لا ننجح من أول مرة؛ المحاولة، وطلب المساعدة، والصبر توصلنا إلى أحلامنا.',
      scenes: [
        { bg: 'night', text: 'نظر الصاروخ الصغير «نجم» إلى القمر وحلم بالوصول إليه.', say: [{ w: 0, t: 'ما أجمل القمر! أريد أن أصل إليه!' }],
          ch: [{ k: 'rocket', x: 34, y: 8, s: 26, tilt: 14, fx: 'sway', eff: ['joy'] }, { k: 'moon', x: 76, y: 52, s: 26, fx: 'pop' }, { k: 'star', x: 18, y: 68, s: 8, fx: 'spin' }] },
        { bg: 'night', text: 'استعدّ للانطلاق وبدأ العدّ.', say: [{ w: 1, t: 'ثلاثة… اثنان… واحد…' }],
          ch: [{ k: 'svg:pad', x: 40, y: 3, s: 26 }, { k: 'rocket', x: 40, y: 14, s: 20, fx: 'sway' }, { k: 'moon', x: 80, y: 56, s: 18 }] },
        { bg: 'night', text: 'لكن الصاروخ لم ينطلق! فحزن نجم.', say: [{ w: 1, t: 'آه… لم أستطع…' }],
          ch: [{ k: 'svg:pad', x: 40, y: 3, s: 26 }, { k: 'rocket', x: 40, y: 14, s: 20, tilt: -10, eff: ['sad', 'smoke'] }, { k: 'cloud', x: 80, y: 60, s: 20, fx: 'sway' }] },
        { bg: 'day', text: 'جاء الدب وربّت عليه وشجّعه.', say: [{ w: 0, t: 'لا تحزن يا نجم! سنحاول معًا.' }, { w: 1, t: 'شكرًا يا دبدوب!' }],
          ch: [{ k: 'bear', x: 28, y: 6, s: 30, hold: 1, fx: 'hop' }, { k: 'rocket', x: 66, y: 6, s: 22, fx: 'sway', eff: ['joy'] }] },
        { bg: 'day', text: 'وساعده أصدقاؤه في تجهيز منصة الانطلاق.', say: [{ w: 1, t: 'هيا نجهّز كل شيء!' }],
          ch: [{ k: 'svg:pad', x: 50, y: 3, s: 24 }, { k: 'bear', x: 20, y: 6, s: 24, hold: 0, eff: ['effort'] }, { k: 'fox', x: 80, y: 6, s: 22, hold: 0, flip: true, fx: 'hop' }, { k: 'rocket', x: 50, y: 13, s: 18, fx: 'sway' }] },
        { bg: 'night', text: 'وانطلق الصاروخ إلى السماء! وصل نجم إلى القمر.', say: [{ w: 0, t: 'نجحتُ! الحمد لله!' }],
          ch: [{ k: 'rocket', x: 36, y: 46, s: 22, tilt: 18, fx: 'fly', eff: ['flame'], tap: 'whoosh', note: 'اضغط الصاروخ' }, { k: 'moon', x: 66, y: 46, s: 30, fx: 'pop' }, { k: 'star', x: 14, y: 72, s: 8, fx: 'spin' }, { k: 'star', x: 90, y: 74, s: 8, fx: 'spin' }] }
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
      id: 'ball', title: 'الكرة ليست لي!', cover: ['ball', 'rabbit'], value: 'الأمانة', sticker: 'صديق أمين', bgc: '#FF8A7A',
      tip: 'اقرؤوا بدهشة عند العثور على الكرة، وبصوت حزين لطيف حين تبحث السلحفاة. ثم اسألوا الطفل: «ماذا ستفعل لو كنتَ مكانه؟» قبل أن تكملوا.',
      why: 'إذا وجدنا شيئًا ليس لنا، نبحث عن صاحبه ونعيده إليه؛ فهذه الأمانة، والناس يحبون الأمين.',
      scenes: [
        { bg: 'day', text: 'وجد أرنوب كرةً حمراء جميلة قرب الشجرة.', say: [{ w: 0, t: 'ما أجمل هذه الكرة!' }],
          ch: [{ k: 'rabbit', x: 30, y: 6, s: 30, fx: 'hop', eff: ['joy'] }, { k: 'ball', x: 58, y: 6, s: 16, tap: 'pop', note: 'اضغط الكرة' }, { k: 'tree', x: 86, y: 6, s: 24, fx: 'sway' }] },
        { bg: 'day', text: 'حمل الكرة ونظر حوله ونادى.', say: [{ w: 0, t: 'يا أصدقاء! لمن هذه الكرة؟' }],
          ch: [{ k: 'rabbit', x: 36, y: 6, s: 30, hold: 1, eff: ['q'] }, { k: 'ball', x: 60, y: 24, s: 14, fx: 'hop' }, { k: 'duck', x: 86, y: 6, s: 14 }] },
        { bg: 'day', text: 'جاءت السلحفاة تبحث عن شيء.', say: [{ w: 0, t: 'أين كرتي الحمراء؟ لقد فقدتها!' }],
          ch: [{ k: 'turtle', x: 26, y: 5, s: 26, fx: 'sway', eff: ['q', 'sad'] }, { k: 'rabbit', x: 70, y: 6, s: 26, flip: true, hold: 2 }, { k: 'ball', x: 52, y: 22, s: 12 }] },
        { bg: 'day', text: 'فعرف أرنوب صاحبة الكرة وأعطاها إياها.', say: [{ w: 2, t: 'هل هذه كرتك؟ وجدتها قرب الشجرة.' }, { w: 0, t: 'نعم! شكرًا لأنك أعدتها إليّ!' }],
          ch: [{ k: 'turtle', x: 26, y: 5, s: 26, hold: 1, eff: ['joy'] }, { k: 'ball', x: 50, y: 18, s: 14, fx: 'pop' }, { k: 'rabbit', x: 74, y: 6, s: 28, flip: true, hold: 1 }] },
        { bg: 'evening', text: 'ثم لعبا معًا بالكرة وضحكا كثيرًا.', say: [{ w: 2, t: 'هل تلعب معي؟' }, { w: 0, t: 'بكل سرور!' }],
          ch: [{ k: 'turtle', x: 24, y: 5, s: 24, fx: 'hop', eff: ['joy'] }, { k: 'ball', x: 50, y: 28, s: 14, fx: 'hop', tap: 'pop', note: 'اضغط الكرة' }, { k: 'rabbit', x: 76, y: 6, s: 28, flip: true, fx: 'hop' }] }
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
      id: 'toys', title: 'الألعاب لها بيوت!', cover: ['car', 'box'], value: 'الترتيب', sticker: 'بطل الترتيب', bgc: '#6AB7FF',
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
          ch: [{ k: 'svg:basket', x: 20, y: 4, s: 20 }, { k: 'ball', x: 14, y: 40, s: 12, tap: 'place', note: 'اضغط الكرة', fly: [20, 18] }, { k: 'svg:shelf', x: 78, y: 4, s: 26 }, { k: 'car', x: 78, y: 38, s: 16, tap: 'place', note: 'اضغط السيارة', fly: [78, 14] }, { k: 'rabbit', x: 48, y: 6, s: 24, fx: 'hop' }] },
        { bg: 'room', text: 'صارت الغرفة مرتبة، ووجد أرنوب كل شيء!', say: [{ w: 0, t: 'يا سلام! ما أجمل الغرفة!' }],
          ch: [{ k: 'svg:basket', x: 20, y: 4, s: 20 }, { k: 'ball', x: 20, y: 14, s: 10 }, { k: 'svg:shelf', x: 78, y: 4, s: 26 }, { k: 'car', x: 78, y: 12, s: 12 }, { k: 'rabbit', x: 48, y: 6, s: 28, fx: 'hop' }, { k: 'star', x: 50, y: 62, s: 9, fx: 'spin', tap: 'sparkle', note: 'اضغط النجمة' }] }
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
      id: 'water', title: 'قطرة الماء الصغيرة', cover: ['svg:faucetOn', 'rabbit'], value: 'المحافظة على الماء', sticker: 'صديق الماء', bgc: '#5CC8FF',
      tip: 'دعوا الطفل يضغط الصنبور لتسمعوا صوت الماء، ثم يضغطه ليُغلق. بعد القصة جرّبوا فعلًا: أغلقوا الصنبور أثناء فرك اليدين بالصابون.',
      why: 'الماء نعمة من الله، فلا نسرف فيه؛ نغلق الصنبور حين لا نحتاجه.',
      scenes: [
        { bg: 'bath', text: 'ذهب أرنوب ليغسل يديه، ففتح الصنبور.', say: [{ w: 0, t: 'سأغسل يديّ بالصابون.' }],
          ch: [{ k: 'rabbit', x: 30, y: 6, s: 32, hold: 1 }, { k: 'svg:faucetOn', x: 74, y: 30, s: 30, hy: 0.78, tap: 'splash', note: 'اضغط الصنبور' }] },
        { bg: 'bath', text: 'وبدأ يفرك يديه والماء يجري ويجري…', say: [{ w: 0, t: 'فرك… فرك… فرك…' }],
          ch: [{ k: 'rabbit', x: 30, y: 6, s: 32, hold: 1, eff: ['sweat'] }, { k: 'svg:bubbles', x: 52, y: 22, s: 18, fx: 'pop' }, { k: 'svg:faucetOn', x: 74, y: 30, s: 30, tap: 'splash', note: 'اضغط الصنبور' }] },
        { bg: 'bath', text: 'رأته السلحفاة، فقالت له كلمة لطيفة.', say: [{ w: 2, t: 'يا أرنوب، نغلق الصنبور ونحن نفرك أيدينا!' }],
          ch: [{ k: 'rabbit', x: 26, y: 6, s: 28 }, { k: 'svg:bubbles', x: 26, y: 38, s: 14 }, { k: 'turtle', x: 56, y: 5, s: 22, fx: 'hop' }, { k: 'svg:faucetOn', x: 86, y: 30, s: 24 }] },
        { bg: 'bath', text: 'فأغلق أرنوب الصنبور، وفرك يديه بالصابون.', say: [{ w: 0, t: 'فكرة جميلة! الحمد لله.' }],
          ch: [{ k: 'rabbit', x: 30, y: 6, s: 32, hold: 2, eff: ['joy'] }, { k: 'svg:bubbles', x: 52, y: 22, s: 18, fx: 'pop' }, { k: 'svg:faucetOff', x: 76, y: 30, s: 28, hy: 0.78, tap: 'pop', note: 'الصنبور مغلق' }] },
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
    }
  ];
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
      else if (e === 'smoke') o += '<span class="e e-smoke a"></span><span class="e e-smoke b"></span><span class="e e-smoke c"></span>';
    });
    return o;
  }
  function sceneEl(p, withSay) {
    var s = h('div', { class: 'st-scene bg-' + p.bg });
    if (p.bg === 'night') s.appendChild(h('div', { class: 'st-hills mid', html: art.sceneTile('gmid', 600, 50) }));
    else if (p.bg === 'room') s.appendChild(h('div', { class: 'st-floor' }));
    else if (p.bg === 'bath') { s.appendChild(h('div', { class: 'st-tiles' })); s.appendChild(h('div', { class: 'st-floor bath' })); }
    else { s.appendChild(h('div', { class: 'st-hills far', html: art.sceneTile('gfar', 600, 120) })); s.appendChild(h('div', { class: 'st-hills mid', html: art.sceneTile('gmid', 600, 90) })); }
    var chs = p.ch || [];
    chs.forEach(function (c, i) {
      var tr = (c.flip ? 'scaleX(-1) ' : '') + (c.tilt ? 'rotate(' + c.tilt + 'deg)' : '');
      var el = h('div', { class: 'st-ch' + (c.fx ? ' fx-' + c.fx : '') + (c.tap ? ' st-hot' : ''), style: { left: c.x + '%', bottom: c.y + '%', width: c.s + '%', animationDelay: (i * 0.35) + 's' } },
        h('div', { class: 'st-in', style: { transform: tr || 'none', transformOrigin: '50% 100%' }, html: pic(c.k) }));
      if (c.buried) el.appendChild(h('div', { class: 'st-soil' }));
      if (c.eff) el.appendChild(h('div', { class: 'st-eff', html: effHtml(c.eff) }));
      if (c.tap) {
        el.appendChild(h('div', { class: 'st-ring' }));
        el.appendChild(h('div', { class: 'st-paw', html: art.hand() }));
        el.setAttribute('role', 'button'); el.setAttribute('aria-label', c.note || 'اضغط');
        el.addEventListener('click', function () {
          if (B.audio) B.audio.play(c.tap);
          UI.anim(el.firstChild, [{ transform: tr || 'none' }, { transform: (c.flip ? 'scaleX(-1) ' : '') + 'rotate(' + ((c.tilt || 0) - 7) + 'deg) scale(1.15)' }, { transform: (c.flip ? 'scaleX(-1) ' : '') + 'rotate(' + ((c.tilt || 0) + 7) + 'deg) scale(1.15)' }, { transform: tr || 'none' }], { dur: 500, fill: 'none' });
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
    if (withSay !== false) (p.say || []).forEach(function (b, bi) {
      var c = chs[b.w] || { x: 50, y: 20, s: 20, k: 'rabbit' };
      var left = Math.max(27, Math.min(73, c.x));
      var top = c.y + c.s / 0.75;
      var dx = (c.x - left) / 0.46;
      var bub = h('div', { class: 'st-bub', style: { left: left + '%', bottom: Math.min(80, top + 3 + (p.say.length > 1 ? (bi % 2) * 14 : 0)) + '%', background: BCOL[c.k] || '#fff', '--dx': dx + '%' } }, h('span', { text: b.t }));
      s.appendChild(bub);
    });
    return s;
  }

  function stickerSvg(S) {
    return sv('<circle cx="50" cy="50" r="44" fill="' + S.bgc + '" stroke="#fff" stroke-width="6"/><path d="M50 18l9 19 21 3-15 14 4 21-19-10-19 10 4-21-15-14 21-3z" fill="#FFF3B0" stroke="#E2A21B" stroke-width="3" stroke-linejoin="round"/>');
  }

  /* ═════════ الواجهة ═════════ */
  function markRead(id) { var d = B.storage.data(); d.stories = d.stories || {}; d.stories[id] = { read: true }; B.storage.save(); }
  function isRead(id) { var d = B.storage.data(); return !!(d.stories && d.stories[id] && d.stories[id].read); }

  B.free.stories = {
    list: function () { return STORIES.map(function (s) { return { id: s.id, title: s.title, cover: s.cover, value: s.value, bgc: s.bgc, read: isRead(s.id) }; }); },
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
        STORIES.forEach(function (S) {
          var card = h('button', { class: 'st-card' + (isRead(S.id) ? ' read' : ''), type: 'button', 'aria-label': S.title }, self.cover(S),
            h('b', { text: S.title }), h('small', { text: 'القيمة: ' + S.value }), isRead(S.id) ? h('span', { class: 'st-read', html: art.check() }) : null);
          UI.bindPress(card, function () { if (B.audio) B.audio.play('open'); intro(S); });
          grid.appendChild(card);
        });
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
})();
