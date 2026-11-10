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
  var SCALE = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5, 1567.98, 1760]; // سلّم خماسي للمصابيح

  var SOUNDS = {
    // لمسة زر
    tap: function (c, t) { tone(c, 640, t, 0.05, 0.05); },
    // انتقال: همسة صاعدة
    whoosh: function (c, t) { noise(c, t, 0.45, 0.035, 500, 2400, 0.8); },
    // ظهور البطاقة
    card: function (c, t) { tone(c, 520, t, 0.1, 0.05, 'triangle'); tone(c, 780, t + 0.07, 0.14, 0.045, 'triangle'); },
    // صعود الراكب
    pop: function (c, t) { tone(c, 420, t, 0.09, 0.07, 'triangle', 760); },
    // استقرار الراكب في العربة: رنين صغير
    sparkle: function (c, t) {
      [N.g5, N.c6, N.e6].forEach(function (f, i) { tone(c, f, t + i * 0.06, 0.16, 0.035, 'sine'); });
    },
    // تشو تشو: نفخة بخار قصيرة ومنخفضة (تتكرر أثناء الحركة)
    chug: function (c, t, a) {
      noise(c, t, 0.12, 0.03 * (a == null ? 1 : a), 700, 300, 0.9);
      tone(c, 90, t, 0.08, 0.025 * (a == null ? 1 : a), 'sine', 60);
    },
    // الكبح: هسهسة هابطة لطيفة
    brake: function (c, t) { noise(c, t, 0.9, 0.04, 2600, 500, 0.7); },
    // صافرة قصيرة فرِحة
    toot: function (c, t) {
      tone(c, 523, t, 0.22, 0.045, 'triangle'); tone(c, 659, t, 0.22, 0.04, 'triangle');
      tone(c, 523, t + 0.28, 0.3, 0.045, 'triangle'); tone(c, 659, t + 0.28, 0.3, 0.04, 'triangle');
    },
    // صواب: رنّة صاعدة لامعة
    right: function (c, t) { tone(c, N.e5, t, 0.12, 0.06, 'triangle'); tone(c, N.a5, t + 0.09, 0.14, 0.06, 'triangle'); tone(c, N.e6, t + 0.18, 0.3, 0.05, 'sine'); },
    // خطأ: نغمتان هابطتان واضحتان (بلا حدّة ولا إزعاج)
    wrong: function (c, t) { tone(c, 330, t, 0.18, 0.07, 'triangle', 290); tone(c, 220, t + 0.17, 0.3, 0.07, 'triangle', 185); },
    // وضع قطعة
    place: function (c, t) { tone(c, 300, t, 0.07, 0.06, 'triangle', 520); },
    // اختيار لون أو قطعة
    pick: function (c, t) { tone(c, 880, t, 0.06, 0.04, 'sine'); },
    // رفرفة فراشة
    flutter: function (c, t) { for (var i = 0; i < 6; i++) noise(c, t + i * 0.09, 0.06, 0.03, 3000 + i * 300, 1500, 1.5); },
    // إضاءة فانوس (نغمة حسب الترتيب)
    lantern: function (c, t, i) { tone(c, SCALE[(i || 0) % SCALE.length], t, 0.25, 0.05, 'sine'); },
    // كنس اللوحة
    sweep: function (c, t) { noise(c, t, 0.5, 0.05, 3000, 600, 0.6); },
    // مصباح يُضاء: النغمة ترتفع مع كل مصباح
    chime: function (c, t, i) {
      var f = SCALE[(i || 0) % SCALE.length];
      tone(c, f, t, 0.3, 0.05, 'sine'); tone(c, f * 2, t, 0.18, 0.015, 'sine');
    },
    // فوز الجولة: ارتفاع فرِح قصير
    cheer: function (c, t) {
      [N.c5, N.e5, N.g5, N.c6].forEach(function (f, i) { tone(c, f, t + i * 0.1, 0.28, 0.05, 'triangle'); });
      tone(c, N.c6, t + 0.42, 0.5, 0.04, 'sine'); tone(c, N.e6, t + 0.42, 0.5, 0.03, 'sine');
    },
    // ختام الجلسة: تهويدة قصيرة هابطة
    lullaby: function (c, t) {
      [N.g5, N.e5, N.d5, N.c5].forEach(function (f, i) { tone(c, f, t + i * 0.42, 0.7, 0.04, 'sine'); });
    }
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
