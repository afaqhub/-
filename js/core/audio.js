/* الصوت: مؤثرات ناعمة مولَّدة بـ WebAudio (لا ملفات صوت)، بلا موسيقى خلفية ولا نطق آلي.
   كل الأصوات قصيرة وهادئة، تمرّ عبر ضاغط يمنع أي ذروة عالية (الطفل حساسة للأصوات العالية).
   لا يوجد أي صوت «خطأ» أو «خسارة». مفتاح عام في ركن الوالدين.
   يُفعَّل السياق بعد أول لمسة (قيد iOS). */
(function () {
  'use strict';
  var B = (window.Bustan = window.Bustan || {});

  var ctx = null, master = null, noiseBuf = null;

  function enabled() {
    return !!(B.storage && B.storage.data() && B.storage.data().settings.soundOn);
  }

  function ensure() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 4.2; // شدة واضحة مسموعة، والضاغط يمنع الذروات
      var comp = ctx.createDynamicsCompressor(); // يحدّ الذروات
      comp.threshold.value = -12; comp.ratio.value = 6;
      master.connect(comp); comp.connect(ctx.destination);
      // ضجيج أبيض قصير يُستعمل لأصوات القطار
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.6, ctx.sampleRate);
      var d = noiseBuf.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { ctx = null; }
    return ctx;
  }

  /* «سمة صوت» لكل لعبة: تغيّر الطبقة ولمعان الضجيج ونوع الموجة، فلا تتشابه أصوات الألعاب */
  var T0 = { p: 1, b: 1, w: null };
  var THEMES = [T0, { p: 0.8, b: 0.8, w: null }, { p: 1.25, b: 1.2, w: null }, { p: 1, b: 0.7, w: 'triangle' }, { p: 1.12, b: 1.4, w: 'triangle' }, { p: 0.9, b: 1.1, w: 'sine' }, { p: 1.4, b: 0.9, w: 'sine' }, { p: 0.72, b: 1.3, w: 'square' }, { p: 1.18, b: 0.6, w: null }, { p: 0.95, b: 1.6, w: 'triangle' }];
  var th = T0;
  var ORDER = ['train', 'mirror', 'pattern', 'firstsound', 'bridge', 'fruits', 'letters', 'memory', 'shadows', 'more', 'odd', 'tracing', 'feed', 'hide', 'vanish', 'order', 'habitat', 'missing', 'water', 'maze', 'workshop', 'coloring', 'drawing', 'garden', 'gallery'];

  // نغمة: تردد، بداية، مدة، شدة، نوع الموجة، تردد نهائي اختياري (انزلاق)
  function tone(c, f, at, dur, vol, type, f2) {
    var o = c.createOscillator(), g = c.createGain();
    f *= th.p; if (f2) f2 *= th.p;
    o.type = (type === 'square' || !th.w) ? (type || 'sine') : th.w;
    o.frequency.setValueAtTime(f, at);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, at + dur);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(vol, at + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g); g.connect(master);
    o.start(at); o.stop(at + dur + 0.03);
  }

  // ضجيج مرشَّح: للتشو تشو والفرامل
  function noise(c, at, dur, vol, f1, f2, q) {
    var s = c.createBufferSource(), flt = c.createBiquadFilter(), g = c.createGain();
    s.buffer = noiseBuf;
    f1 *= th.b; if (f2) f2 *= th.b;
    flt.type = 'bandpass'; flt.Q.value = q || 1.2;
    flt.frequency.setValueAtTime(f1, at);
    if (f2) flt.frequency.exponentialRampToValueAtTime(f2, at + dur);
    g.gain.setValueAtTime(0.0001, at);
    var att = Math.min(0.09, dur * 0.4);   // بداية ناعمة: لا «ضربة»
    g.gain.exponentialRampToValueAtTime(vol, at + att);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    s.connect(flt); flt.connect(g); g.connect(master);
    s.start(at, Math.random() * 0.2); s.stop(at + dur + 0.03);
  }

  var N = { c5: 523.25, d5: 587.33, e5: 659.25, g5: 783.99, a5: 880, c6: 1046.5, e6: 1318.5 };

  /* كل الأصوات مؤثرات غير موسيقية: نقرات وفرقعات ونفخات وضجيج مرشَّح.
     لا نغمات متتابعة ولا سلّم ولا لحن، وكل صوت ثابت لا تتغير طبقته مع التكرار
     (بطلب صاحب المشروع: الابتعاد عن أي شبه بالموسيقى). */
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function jit(f) { return f * rnd(0.9, 1.12); }      // تغيير طفيف في الطبقة كل مرة (لا تسلسل ولا لحن)
  function click(c, t, f, vol) { tone(c, jit(f) * 0.8, t, 0.07, (vol || 0.06) * 0.8, 'sine', f * 0.5); }   // «توك» خشبي ناعم بدل نقرة حادة
  function bloop(c, t, f0, f1, vol, dur) { tone(c, jit(f0), t, dur || 0.14, vol || 0.07, 'sine', f1); }
  /* تصفيق: ضربات ضجيج قصيرة متراكبة، تتصاعد ثم تخفت */
  function applause(c, t, dur, density, vol) {
    var n = Math.round(dur * density);
    for (var i = 0; i < n; i++) {
      var x = i / n, swell = Math.sin(Math.PI * Math.min(1, x * 1.15)); // مغلاف: يشتد في الوسط
      var at = t + x * dur + rnd(0, 0.03);
      noise(c, at, rnd(0.025, 0.06), vol * (0.4 + 0.8 * swell) * rnd(0.6, 1.1), rnd(1400, 3600), rnd(900, 2200), rnd(0.8, 1.6));
    }
  }
  /* ثلاث صفقات منتظمة */
  function claps(c, t, n, gap, vol) {
    for (var i = 0; i < n; i++) { noise(c, t + i * gap, 0.07, vol, rnd(1800, 2600), 1400, 1.1); noise(c, t + i * gap + 0.012, 0.05, vol * 0.7, rnd(2800, 3600), 2000, 1.4); }
  }
  /* كل اسم يمكن أن يكون دالة أو مصفوفة بدائل؛ يُختار بديل مختلف عن الأخير عشوائياً */
  var SOUNDS = {
    tap: [function (c, t) { click(c, t, 880, 0.05); }, function (c, t) { bloop(c, t, 520, 760, 0.05, 0.08); }],
    whoosh: [
      function (c, t) { noise(c, t, 0.5, 0.035, 350, 1500, 0.5); },                              // هواء يرتفع بنعومة
      function (c, t) { noise(c, t, 0.5, 0.035, 1700, 400, 0.5); },                              // هواء يهبط
      function (c, t) { noise(c, t, 0.45, 0.03, 700, 1200, 0.4); noise(c, t + 0.05, 0.4, 0.02, 2200, 1000, 0.5); }
    ],
    card: [function (c, t) { noise(c, t, 0.16, 0.04, 2800, 1500, 0.9); }, function (c, t) { bloop(c, t, 420, 640, 0.05, 0.1); }, function (c, t) { noise(c, t, 0.2, 0.035, 2000, 1000, 0.7); }],
    pop: [function (c, t) { tone(c, jit(300), t, 0.07, 0.08, 'sine', 700); }, function (c, t) { tone(c, jit(420), t, 0.06, 0.08, 'sine', 900); noise(c, t, 0.03, 0.02, 4000, 3000, 1); }, function (c, t) { tone(c, jit(240), t, 0.09, 0.08, 'sine', 520); }],
    sparkle: [function (c, t) { noise(c, t, 0.25, 0.035, 7000, 9000, 2); }, function (c, t) { for (var i = 0; i < 4; i++) noise(c, t + i * 0.05, 0.05, 0.03, rnd(6000, 9000), 8000, 2.5); }],
    chug: function (c, t, a) { noise(c, t, 0.12, 0.035 * (a == null ? 1 : a), 700, 300, 0.9); },
    brake: function (c, t) { noise(c, t, 0.9, 0.045, 2600, 500, 0.7); },
    toot: function (c, t) { noise(c, t, 0.5, 0.05, 1200, 900, 3); },
    /* صواب: أصوات قصيرة مختلفة */
    right: [
      function (c, t) { tone(c, jit(260), t, 0.08, 0.09, 'sine', 620); noise(c, t + 0.02, 0.15, 0.03, 6000, 8000, 2); },     // بوب مع لمعة
      function (c, t) { click(c, t, 520, 0.09); click(c, t + 0.07, 640, 0.07); },                                           // طقّتان خشبيتان
      function (c, t) { tone(c, jit(200), t, 0.14, 0.09, 'sine', 160); tone(c, jit(200), t + 0.14, 0.12, 0.08, 'sine', 380); }, // «بوينغ» زنبركي
      function (c, t) { noise(c, t, 0.18, 0.05, 1200, 5000, 0.9); tone(c, jit(340), t + 0.1, 0.06, 0.07, 'sine', 800); },       // زِب + فقاعة
      function (c, t) { for (var i = 0; i < 3; i++) tone(c, jit(700), t + i * 0.05, 0.04, 0.05, 'triangle', 1100); }            // زخّات ناعمة
    ],
    wrong: function (c, t) { tone(c, 480, t, 0.09, 0.06, 'square'); tone(c, 480, t + 0.14, 0.09, 0.06, 'square'); },
    place: [function (c, t) { click(c, t, 360, 0.09); noise(c, t, 0.08, 0.025, 900, 600, 0.8); }, function (c, t) { bloop(c, t, 300, 190, 0.08, 0.12); }, function (c, t) { click(c, t, 300, 0.09); }],
    pick: [function (c, t) { click(c, t, 700, 0.05); }, function (c, t) { bloop(c, t, 480, 720, 0.05, 0.09); }, function (c, t) { click(c, t, 820, 0.045); noise(c, t, 0.05, 0.015, 3000, 2500, 1); }],
    flutter: function (c, t) { for (var i = 0; i < 6; i++) noise(c, t + i * 0.09, 0.06, 0.035, 3000, 1500, 1.5); },
    lantern: [function (c, t) { tone(c, jit(300), t, 0.07, 0.07, 'sine', 700); }, function (c, t) { tone(c, jit(360), t, 0.06, 0.07, 'sine', 820); }],
    splash: [function (c, t) { noise(c, t, 0.35, 0.07, 1800, 500, 0.8); }, function (c, t) { noise(c, t, 0.3, 0.07, 2400, 700, 0.7); noise(c, t + 0.12, 0.2, 0.04, 1500, 500, 0.9); }],
    sweep: [function (c, t) { noise(c, t, 0.5, 0.05, 3000, 600, 0.6); }, function (c, t) { noise(c, t, 0.45, 0.05, 700, 2800, 0.6); }],
    chime: [function (c, t) { tone(c, jit(300), t, 0.07, 0.07, 'sine', 700); }, function (c, t) { tone(c, jit(380), t, 0.06, 0.07, 'sine', 860); }],
    soft: function (c, t) { noise(c, t, 0.12, 0.03, 900, 600, 1); },
    /* فوز: تصفيق بأشكال مختلفة */
    cheer: [
      function (c, t) { applause(c, t, 1.7, 38, 0.05); },                                                       // تصفيق جمهور كثيف
      function (c, t) { claps(c, t, 4, 0.16, 0.06); applause(c, t + 0.7, 1.1, 24, 0.045); },                    // صفقات منتظمة ثم تصفيق
      function (c, t) { noise(c, t, 0.35, 0.05, 600, 3500, 0.8); applause(c, t + 0.25, 1.4, 30, 0.05); },        // همسة ثم تصفيق
      function (c, t) { claps(c, t, 3, 0.22, 0.07); noise(c, t + 0.8, 0.5, 0.03, 7000, 9000, 2); },             // ثلاث صفقات ولمعة
      function (c, t) { for (var i = 0; i < 6; i++) { tone(c, jit(260), t + i * 0.09, 0.05, 0.06, 'sine', 700); } applause(c, t + 0.1, 1.2, 28, 0.04); } // فرقعات احتفال + تصفيق
    ],
    /* تقليب صفحة: حفيف ورق ناعم */
    page: [
      function (c, t) { noise(c, t, 0.22, 0.045, 3500, 1800, 0.7); noise(c, t + 0.09, 0.14, 0.03, 4200, 2600, 0.8); },
      function (c, t) { noise(c, t, 0.26, 0.04, 2600, 5200, 0.6); noise(c, t + 0.12, 0.12, 0.025, 3800, 2200, 0.9); },
      function (c, t) { noise(c, t, 0.2, 0.045, 4500, 1500, 0.6); }
    ],
    /* فتح: انفتاح باب/كتاب بنفَس صاعد وفقاعة ناعمة */
    open: [
      function (c, t) { noise(c, t, 0.4, 0.035, 500, 2600, 0.5); bloop(c, t + 0.18, 300, 640, 0.06, 0.16); },
      function (c, t) { bloop(c, t, 260, 560, 0.06, 0.18); noise(c, t + 0.05, 0.35, 0.03, 900, 3000, 0.5); }
    ],
    /* إغلاق: هبوط ناعم */
    close: [
      function (c, t) { noise(c, t, 0.4, 0.035, 2600, 450, 0.5); bloop(c, t + 0.1, 560, 260, 0.06, 0.16); },
      function (c, t) { bloop(c, t, 520, 240, 0.06, 0.18); noise(c, t + 0.05, 0.3, 0.025, 2000, 600, 0.5); }
    ],
    bloop: [function (c, t) { bloop(c, t, 280, 620, 0.07, 0.14); }, function (c, t) { bloop(c, t, 360, 780, 0.07, 0.12); }, function (c, t) { bloop(c, t, 240, 500, 0.07, 0.16); }],
    lullaby: [function (c, t) { noise(c, t, 1.4, 0.03, 600, 300, 0.6); }, function (c, t) { noise(c, t, 1.6, 0.028, 500, 250, 0.5); }]
  };
  var lastVar = {};
  function pickVariant(name) {
    var v = SOUNDS[name];
    if (!Array.isArray(v)) return v;
    var i = Math.floor(Math.random() * v.length);
    if (v.length > 1 && i === lastVar[name]) i = (i + 1 + Math.floor(Math.random() * (v.length - 1))) % v.length;
    lastVar[name] = i;
    return v[i];
  }

  /* iOS يُسكت WebAudio حين يكون مفتاح الكتم الجانبي مفعّلاً، إلا إذا كانت الصفحة
     تشغّل عنصر صوت. نشغّل مقطعاً صامتاً (٠ شدة) متكرراً داخل اللمسة الأولى فتنتقل جلسة الصوت إلى «تشغيل». */
  var keep = null;
  function keepAlive() {
    if (keep) return;
    try {
      keep = document.createElement('audio');
      keep.setAttribute('playsinline', '');
      keep.loop = true; keep.volume = 0.01;
      keep.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==';
      var p = keep.play(); if (p && p.catch) p.catch(function () { keep = null; });
    } catch (e) { keep = null; }
  }

  B.audio = {
    theme: function (id) { var i = ORDER.indexOf(id); th = i < 0 ? T0 : THEMES[(i % (THEMES.length - 1)) + 1]; },
    unlock: function () {
      var c = ensure();
      if (!c) return;
      if (c.state !== 'running') { try { c.resume(); } catch (e) {} }
      if (!this._primed) { // iOS: تشغيل عيّنة صامتة داخل اللمسة يفتح الصوت
        this._primed = true;
        keepAlive();
        try { var s = c.createBufferSource(); s.buffer = c.createBuffer(1, 1, 22050); s.connect(c.destination); s.start(0); } catch (e) {}
      }
    },
    play: function (name, arg) {
      if (!enabled()) return;
      var c = ensure();
      if (!c) return;
      var fn = pickVariant(name);
      if (!fn) return;
      var raw = (name === 'wrong' || name === 'chug' || name === 'toot' || name === 'brake');
      function go() { var keep = th; if (raw) th = T0; try { fn(c, c.currentTime + 0.005, arg); } catch (e) {} th = keep; }
      if (c.state === 'running') { go(); return; }
      // السياق موقوف (iOS/متصفحات): نستأنفه ثم نشغّل الصوت
      try { c.resume().then(function () { if (c.state === 'running') go(); }, function () {}); } catch (e) {}
    }
  };
})();
