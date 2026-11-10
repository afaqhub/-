/* كل النصوص الظاهرة في التطبيق هنا فقط — عربية فصحى بسيطة */
(function () {
  'use strict';
  var B = (window.Bustan = window.Bustan || {});

  B.S = {
    appName: 'بستان الصغار',

    zones: { solo: 'وحدي', together: 'معك' },

    games: {
      train: 'قطار الإشارة',
      mirror: 'مرآة الأشكال',
      pattern: 'صانعة الأنماط',
      firstsound: 'أول صوت',
      bridge: 'جسر الروابط'
    },

    buttons: {
      home: 'الرئيسية',
      stop: 'قف',
      replay: 'إعادة العرض',
      close: 'إغلاق'
    },

    // نصوص الوالدين فقط (لا تظهر للطفلة إلا بعد ضغطة ٣ ثوانٍ)
    parent: {
      title: 'ركن الوالدين',
      sessions: 'الجلسات',
      rounds: 'الجولات',
      level: 'المستوى',
      lastDays: 'آخر سبعة أيام',
      noData: 'لا بيانات بعد',
      dailyLimit: 'حدّ جلسات «وحدي» في اليوم',
      todaySessions: 'جلسات اليوم',
      openSolo: 'فتح «وحدي» لهذا اليوم',
      soloOpened: 'مفتوحة لهذا اليوم',
      sound: 'الصوت',
      soundOn: 'يعمل',
      soundOff: 'مطفأ',
      soundNote: 'نقرات ناعمة قصيرة فقط، ولا نطق ولا موسيقى',
      backup: 'النسخ الاحتياطي',
      copy: 'نسخ التقدم',
      copied: 'تم النسخ',
      saveFile: 'حفظ في ملف',
      restore: 'استعادة',
      restoreFile: 'استعادة من ملف',
      restorePlaceholder: 'ألصق هنا ما نسخته سابقاً',
      restored: 'تمت الاستعادة',
      restoreFail: 'تعذّرت قراءة النسخة',
      resetGame: 'إعادة ضبط اللعبة',
      resetConfirm: 'اضغط مرة أخرى للتأكيد',
      resetDone: 'أُعيد ضبط اللعبة',
      storageWarn: 'التخزين غير متاح في هذا المتصفح، فلن يُحفظ التقدم بعد الإغلاق',
      notBuilt: 'قيد البناء',
      daysShort: ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت']
    },

    noscript: 'يحتاج هذا التطبيق إلى تفعيل جافاسكربت.'
  };
})();
