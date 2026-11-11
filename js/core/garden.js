/* «بستاني»: بستان دائم يكبر مع كل جلسة تكتمل (شجرة، زهرة، حيوان…).
   لا نقاط ولا نجوم ولا سلاسل أيام: المكافأة أن يحيا ما أنجزه. يُحفظ في التخزين (garden). */
(function () {
  'use strict';
  var B = (window.Bustan = window.Bustan || {});
  var KINDS = ['tree', 'flower', 'rabbit', 'rose', 'duck', 'balloon', 'bear', 'windmill', 'butterfly', 'lamb', 'bee', 'cat',
    'pumpkin', 'frog', 'bird', 'turtle', 'house', 'strawberry', 'owl', 'grapes'];
  B.garden = {
    KINDS: KINDS,
    items: function () { return B.storage.data().garden; },
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
