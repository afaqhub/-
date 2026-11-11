/* محرك التكيّف الصامت: ٥ مستويات لكل لعبة.
   يصعد بعد ٣ جولات سلسة متتالية (≤ خطأ واحد)،
   ويهبط بعد جولتين متتاليتين فيهما ٣ أخطاء فأكثر.
   جولة فيها خطآن لا تُعدّ سلسة ولا صعبة، فتقطع السلسلتين.
   لا يظهر للطفل أي أثر لهذا. */
(function () {
  'use strict';
  var B = (window.Bustan = window.Bustan || {});

  var MAX = 5, UP_AFTER = 3, DOWN_AFTER = 2;

  /* دالة نقية: تأخذ الحالة {level, smooth, rough} وعدد أخطاء الجولة،
     وتُرجع حالة جديدة مع حقل change: 'up' | 'down' | null */
  function step(state, errors) {
    var level = state.level, smooth = state.smooth, rough = state.rough, change = null;
    if (errors <= 1) { smooth++; rough = 0; }
    else if (errors >= 3) { rough++; smooth = 0; }
    else { smooth = 0; rough = 0; }

    if (smooth >= UP_AFTER) {
      if (level < MAX) { level++; change = 'up'; }
      smooth = 0; rough = 0;
    } else if (rough >= DOWN_AFTER) {
      if (level > 1) { level--; change = 'down'; }
      smooth = 0; rough = 0;
    }
    return { level: level, smooth: smooth, rough: rough, change: change };
  }

  B.adaptive = {
    MAX: MAX,
    step: step,
    level: function (gameId) { return B.storage.game(gameId).level; },
    report: function (gameId, errors) {
      var g = B.storage.game(gameId);
      var r = step(g, errors);
      g.level = r.level; g.smooth = r.smooth; g.rough = r.rough;
      B.storage.save();
      return r;
    }
  };
})();
