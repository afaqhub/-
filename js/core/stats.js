/* إحصاءات مجهولة الهوية لصاحب المشروع فقط (عبر GoatCounter: لوحة خاصة بك، بلا ملفات تعريف ارتباط).
   لا يُرسل أي اسم أو بيانات شخصية: فقط أسماء أحداث مثل «play/train».
   يبقى معطّلاً حتى تضع رمز موقعك في B.S.statsCode. بدون إنترنت أو رمز: لا يحدث شيء.
   الأحداث:
     open            كل فتحة للتطبيق
     device/new      مرة واحدة لكل جهاز (عدد الزوار الإجمالي)
     device/player   مرة واحدة لكل جهاز يلعب أول لعبة (عدد من لعب فعلاً)
     play/<لعبة>     كل بدء للعبة
     done/<لعبة>     كل جلسة مكتملة */
(function () {
  'use strict';
  var B = (window.Bustan = window.Bustan || {});

  function once(flag) {
    try {
      if (window.localStorage.getItem(flag)) return false;
      window.localStorage.setItem(flag, '1');
      return true;
    } catch (e) { return false; } // بلا تخزين لا نعدّ مرة واحدة (نتجنب التكرار)
  }

  function send(path) {
    var code = B.S && B.S.statsCode;
    if (!code || /^(file:)/.test(window.location.protocol)) return; // لا نحسب فتح الملف محلياً
    if (/localhost|127\.0\.0\.1/.test(window.location.hostname)) return;
    try {
      var img = new Image();
      img.src = 'https://' + code + '.goatcounter.com/count?p=' + encodeURIComponent('/' + path) + '&e=true&t=' + encodeURIComponent(path) + '&rnd=' + Math.random().toString(36).slice(2);
    } catch (e) {}
  }

  B.stats = {
    track: send,
    open: function () { send('open'); if (once('bustan.dev.new')) send('device/new'); },
    play: function (id) { send('play/' + id); if (once('bustan.dev.player')) send('device/player'); },
    done: function (id) { send('done/' + id); }
  };
})();
