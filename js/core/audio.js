/* الصوت: مؤثرات ناعمة مولَّدة بـ WebAudio (لا ملفات صوت)، بلا موسيقى خلفية ولا نطق آلي.
   كل الأصوات قصيرة وهادئة، تمرّ عبر ضاغط يمنع أي ذروة عالية (الطفلة حساسة للأصوات العالية).
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

  // نغمة: تردد، بداية، مدة، شدة، نوع الموجة، تردد نهائي اختياري (انزلاق)
  function tone(c, f, at, dur, vol, type, f2) {
    var o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine';
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
    flt.type = 'bandpass'; flt.Q.value = q || 1.2;
    flt.frequency.setValueAtTime(f1, at);
    if (f2) flt.frequency.exponentialRampToValueAtTime(f2, at + dur);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(vol, at + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    s.connect(flt); flt.connect(g); g.connect(master);
    s.start(at, Math.random() * 0.2); s.stop(at + dur + 0.03);
  }

  var N = { c5: 523.25, d5: 587.33, e5: 659.25, g5: 783.99, a5: 880, c6: 1046.5, e6: 1318.5 };

  /* كل الأصوات مؤثرات غير موسيقية: نقرات وفرقعات ونفخات وضجيج مرشَّح.
     لا نغمات متتابعة ولا سلّم ولا لحن، وكل صوت ثابت لا تتغير طبقته مع التكرار
     (بطلب صاحب المشروع: الابتعاد عن أي شبه بالموسيقى). */
  function click(c, t, f, vol) { tone(c, f, t, 0.035, vol || 0.06, 'square', f * 0.7); }
  var SOUNDS = {
    tap: function (c, t) { click(c, t, 900, 0.035); },                                  // لمسة زر: نقرة
    whoosh: function (c, t) { noise(c, t, 0.45, 0.04, 500, 2400, 0.8); },               // انتقال: همسة هواء
    card: function (c, t) { noise(c, t, 0.12, 0.05, 2500, 1200, 1.2); },                // ظهور بطاقة: «فشّ» ورق
    pop: function (c, t) { tone(c, 300, t, 0.07, 0.08, 'sine', 700); },                 // فرقعة فقاعة
    sparkle: function (c, t) { noise(c, t, 0.25, 0.035, 7000, 9000, 2); },              // لمعة: حفيف ناعم
    chug: function (c, t, a) { noise(c, t, 0.12, 0.035 * (a == null ? 1 : a), 700, 300, 0.9); }, // تشو تشو: نفخة بخار
    brake: function (c, t) { noise(c, t, 0.9, 0.045, 2600, 500, 0.7); },                // فرامل: هسهسة
    toot: function (c, t) { noise(c, t, 0.5, 0.05, 1200, 900, 3); },                    // نفخة بخار طويلة (بلا صافرة)
    right: function (c, t) { tone(c, 260, t, 0.08, 0.09, 'sine', 620); noise(c, t + 0.02, 0.15, 0.03, 6000, 8000, 2); }, // صواب: «بوب» مع لمعة
    wrong: function (c, t) { tone(c, 150, t, 0.22, 0.08, 'sawtooth', 120); },           // خطأ: طنين منخفض قصير واحد
    place: function (c, t) { click(c, t, 420, 0.08); noise(c, t, 0.05, 0.04, 1500, 800, 1); }, // «طق» مغناطيس
    pick: function (c, t) { click(c, t, 700, 0.045); },                                 // اختيار: نقرة خفيفة
    flutter: function (c, t) { for (var i = 0; i < 6; i++) noise(c, t + i * 0.09, 0.06, 0.035, 3000, 1500, 1.5); }, // رفرفة
    lantern: function (c, t) { tone(c, 300, t, 0.07, 0.07, 'sine', 700); },             // عدّ/إضاءة: الفرقعة نفسها كل مرة
    splash: function (c, t) { noise(c, t, 0.35, 0.07, 1800, 500, 0.8); },               // رشّة ماء
    sweep: function (c, t) { noise(c, t, 0.5, 0.05, 3000, 600, 0.6); },                 // كنس
    chime: function (c, t) { tone(c, 300, t, 0.07, 0.07, 'sine', 700); },               // مصباح: فرقعة ثابتة
    soft: function (c, t) { noise(c, t, 0.12, 0.03, 900, 600, 1); },                    // رجوع بطاقة
    cheer: function (c, t) {                                                             // فوز: تصفيق (ضجيج متقطع)
      for (var i = 0; i < 9; i++) noise(c, t + i * 0.07 + Math.random() * 0.03, 0.05, 0.05, 2200, 1800, 1);
    },
    lullaby: function (c, t) { noise(c, t, 1.4, 0.03, 600, 300, 0.6); }                 // ختام: نفَس هادئ طويل
  };

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
      var fn = SOUNDS[name];
      if (!fn) return;
      function go() { try { fn(c, c.currentTime + 0.005, arg); } catch (e) {} }
      if (c.state === 'running') { go(); return; }
      // السياق موقوف (iOS/متصفحات): نستأنفه ثم نشغّل الصوت
      try { c.resume().then(function () { if (c.state === 'running') go(); }, function () {}); } catch (e) {}
    }
  };
})();
