# أدوات الاختبار (للمطوّرين)

لا تلزم لتشغيل المنصة. تشغّل `Code.gs` الحقيقي داخل محاكٍ لـ Google Apps Script (صارم في حدود الأوراق كما يفعل Google)، وتختبر الواجهة في متصفح آلي.

```bash
cd dev
npm install --no-package-lock xlsx@0.18.5 @fontsource/amiri @fontsource/cairo   # أول مرة (و Playwright مثبّت عندك)
npm run test:server    # ٤٧ اختبارًا للخادم: كلمة المرور، الإخفاء، الاستيراد، الرسائل، القوالب…
npm run test:e2e       # الواجهة: التدوين، الصور، الاستيراد والتصدير، الزائر والمالك، بلا إنترنت، الأمان
npm test               # الكل
```

- `gas-mock.js` — المحاكي؛ يُشغَّل وحده خادمًا محليًّا: `node gas-mock.js 8787`.
- `e2e/out/` — لقطات شاشة وصور البطاقات الناتجة (يُنشأ عند التشغيل).
- ما لا يغطيه المحاكي: النشر الفعلي على Google وشاشات الأذونات؛ جرّبه عند أول إعداد بـ `setup` ثم `selfTest`.

## التسليم بنسختين من `index.html`
```bash
node dev/make-release.js
```
يقرأ رابط السكربت من `dev/release-url.txt` ويصنع `kunnasha-files.zip` فيه:
**١) نسخة صاحب المنصة** (الرابط مضمَّن) و**٢) نسخة النشر للآخرين** (العبارة العربية `الصق_رابط_السكربت_هنا` ليضعوا رابطهم مكانها)، مع `Code.gs` والأدلة.
`index.html` في المستودع هو نسخة النشر (بلا رابط).

## القوالب المستنسخة (templates/)
- الأصول: `dev/designs/*.jpg` (التصاميم الأصلية).
- `python3 dev/make-clone-config.py` يكتب `clone-config.json` (مواضع المسح والكتابة).
- `python3 dev/clone-templates.py [--debug]` يمسح النصوص بالترميم (OpenCV) ويكتب `templates/*.jpg` و`templates/manifest.json`.
- الرسم داخل index.html (دالة `drawClone`)، واختباره `e2e/8-clones.js`.
