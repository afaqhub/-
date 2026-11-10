/* كل النصوص الظاهرة في التطبيق هنا فقط — عربية فصحى بسيطة */
(function () {
  'use strict';
  var B = (window.Bustan = window.Bustan || {});

  B.S = {
    appName: 'بستان الصغار',

    zones: { solo: 'وحدي', together: 'معك', create: 'إبداع' },

    games: {
      train: 'قطار الإشارة',
      mirror: 'مرآة الأشكال',
      pattern: 'صانعة الأنماط',
      firstsound: 'أول صوت',
      bridge: 'جسر الروابط',
      workshop: 'ورشة الأشكال',
      coloring: 'لوحة التلوين'
    },

    create: { color: 'تغيير اللون', clear: 'تنظيف اللوحة', next: 'رسمة أخرى' },

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
      soundNote: 'مؤثرات ناعمة قصيرة (قطار، نغمات)، ولا نطق ولا موسيقى',
      backup: 'النسخ الاحتياطي',
      copy: 'نسخ التقدم',
      copied: 'تم النسخ',
      saveFile: 'حفظ في ملف',
      restore: 'استعادة',
      restoreFile: 'استعادة من ملف',
      restorePlaceholder: 'ألصق هنا ما نسخته سابقاً',
      restored: 'تمت الاستعادة',
      restoreFail: 'تعذّرت قراءة النسخة',
      replayDemo: 'إعادة العرض التوضيحي لكل الألعاب',
      replayDemoDone: 'سيُعرض الشرح عند فتح كل لعبة',
      resetGame: 'إعادة ضبط اللعبة',
      resetConfirm: 'اضغط مرة أخرى للتأكيد',
      resetDone: 'أُعيد ضبط اللعبة',
      storageWarn: 'التخزين غير متاح في هذا المتصفح، فلن يُحفظ التقدم بعد الإغلاق',
      notBuilt: 'قيد البناء',
      weekly: 'رابط الأسبوع في «جسر الروابط»',
      weeklyAuto: 'حسب المستوى',
      connectors: ['لكنْ', 'لأنّ', 'لذلك', 'بينما'],
      daysShort: ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت']
    },

    noscript: 'يحتاج هذا التطبيق إلى تفعيل جافاسكربت.'
  };
})();
