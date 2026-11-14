/* «بستاني»: بستان دائم يكبر مع كل جلسة تكتمل (شجرة، زهرة، حيوان…).
   لا نقاط ولا نجوم ولا سلاسل أيام: المكافأة أن يحيا ما أنجزه. يُحفظ في التخزين (garden). */
(function () {
  'use strict';
  var B = (window.Bustan = window.Bustan || {});
  var KINDS = ['tree', 'flower', 'rabbit', 'rose', 'duck', 'balloon', 'bear', 'windmill', 'butterfly', 'lamb', 'bee', 'cat',
    'pumpkin', 'frog', 'bird', 'turtle', 'house', 'strawberry', 'owl', 'grapes'];
  /* معرض «إبداعاتي»: صور صغيرة محفوظة على الجهاز (آخر ٢٤) */
  B.gallery = {
    MAX: 24,
    list: function () { return B.storage.data().gallery; },
    add: function (src) {
      var g = B.storage.data().gallery;
      g.push(src);
      while (g.length > B.gallery.MAX) g.shift();
      try { B.storage.save(); } catch (e) {}
      if (!B.storage.isPersistent() && g.length > 6) g.shift();
      return g.length;
    },
    remove: function (i) { var g = B.storage.data().gallery; if (i >= 0 && i < g.length) { g.splice(i, 1); B.storage.save(); } },
    clear: function () { B.storage.data().gallery = []; B.storage.save(); }
  };

  B.garden = {
    KINDS: KINDS,
    items: function () { return B.storage.data().garden; },
    /* يضيف عنصراً محدداً (مثلاً زهرة نمت في لعبة «اسقِ الزهرة») */
    add: function (k) { var g = B.storage.data().garden; g.push(k); if (g.length > 120) g.shift(); B.storage.save(); },
    /* يزرع عنصراً جديداً بالتتابع ويُرجع نوعه */
    plant: function () {
      var g = B.storage.data().garden, k = KINDS[g.length % KINDS.length];
      g.push(k);
      if (g.length > 120) g.shift();
      B.storage.save();
      return k;
    }
  };
})();
