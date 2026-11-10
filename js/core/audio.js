/* الصوت: نقرات ناعمة قصيرة جداً عبر WebAudio فقط.
   مطفأ افتراضياً بمفتاح عام (في ركن الوالدين).
   لا موسيقى ولا خلفية ولا نطق آلي. يُفعَّل السياق بعد أول لمسة (قيد iOS). */
(function () {
  'use strict';
  var B = (window.Bustan = window.Bustan || {});

  var ctx = null;

  function enabled() {
    return !!(B.storage && B.storage.data() && B.storage.data().settings.soundOn);
  }

  function ensure() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); } catch (e) { ctx = null; }
    return ctx;
  }

  // نغمة قصيرة: التردد، البداية، المدة، الشدة (منخفضة جداً)
  function blip(c, freq, at, dur, vol, type) {
    var o = c.createOscillator();
    var g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, at);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(vol, at + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g); g.connect(c.destination);
    o.start(at); o.stop(at + dur + 0.02);
  }

  var SOUNDS = {
    tap: function (c, t) { blip(c, 640, t, 0.05, 0.05, 'sine'); },
    pop: function (c, t) { blip(c, 420, t, 0.07, 0.06, 'triangle'); blip(c, 620, t + 0.04, 0.07, 0.05, 'triangle'); },
    chime: function (c, t) { blip(c, 523, t, 0.12, 0.05, 'sine'); blip(c, 659, t + 0.09, 0.14, 0.05, 'sine'); },
    soft: function (c, t) { blip(c, 330, t, 0.09, 0.04, 'sine'); }
  };

  B.audio = {
    /* يُستدعى عند أول لمسة لفتح السياق */
    unlock: function () {
      var c = ensure();
      if (c && c.state === 'suspended') { try { c.resume(); } catch (e) {} }
    },
    play: function (name) {
      if (!enabled()) return;
      var c = ensure();
      if (!c || c.state !== 'running') return;
      var fn = SOUNDS[name];
      if (fn) { try { fn(c, c.currentTime + 0.005); } catch (e) {} }
    }
  };
})();
