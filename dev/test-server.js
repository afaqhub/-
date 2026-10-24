/* اختبارات الخادم (Code.gs) على المحاكي:  node dev/test-server.js */
'use strict';
const assert = require('assert');
const { build } = require('./gas-mock.js');

let pass = 0, fail = 0;
function t(name, fn){
  try { fn(); pass++; console.log('  ✓ ' + name); }
  catch (e) { fail++; console.log('  ✗ ' + name + '\n      ' + (e.stack||e).toString().split('\n').slice(0,4).join('\n      ')); }
}

const E = build();
const setupMsg = E.ctx.setup();
const temp = (setupMsg.match(/: (\S{10})\n/)||[])[1];

console.log('الإعداد وكلمة المرور');
t('setup يولّد كلمة مؤقتة', () => assert.ok(temp && temp.length === 10, setupMsg));
t('setup آمنة للتكرار ولا تغيّر كلمة المرور', () => {
  const m = E.ctx.setup(); assert.ok(/مضبوطة مسبقًا/.test(m));
  assert.ok(E.call('login',{password:temp}).data.ok);
});
t('كلمة خاطئة ترفض', () => assert.strictEqual(E.call('login',{password:'x'}).data.ok, false));
let tok;
t('الدخول بالمؤقتة يعطي mustChange', () => {
  const r = E.call('login',{password:temp}).data; assert.ok(r.ok && r.mustChange); tok = r.token; });
t('قبل التغيير تُرفض دوال المالك', () => {
  const r = E.call('list',{},tok); assert.strictEqual(r.ok,false); assert.ok(r.mustChange); });
t('checkToken مسموح ويُخبر بالتغيير', () => assert.ok(E.call('checkToken',{},tok).data.mustChange));
t('تغيير الكلمة: قصيرة وبلا مطابقة ترفض', () => {
  assert.strictEqual(E.call('changePassword',{old:temp,neu:'abc'},tok).data.ok,false);
  assert.strictEqual(E.call('changePassword',{old:'bad',neu:'abcdefgh'},tok).data.ok,false);
  assert.strictEqual(E.call('changePassword',{old:temp,neu:temp},tok).data.ok,false);
});
t('تغيير صحيح ينهي الجلسات ويلغي mustChange', () => {
  assert.ok(E.call('changePassword',{old:temp,neu:'MyNewPass1'},tok).data.ok);
  assert.strictEqual(E.call('list',{},tok).auth, true);
  const r = E.call('login',{password:'MyNewPass1'}).data; assert.ok(r.ok && !r.mustChange); tok = r.token;
  assert.ok(Array.isArray(E.call('list',{},tok).data));
});
t('إيقاف المحاولات بعد 5 أخطاء', () => {
  for (let i=0;i<5;i++) E.call('login',{password:'wrong'+i});
  const r = E.call('login',{password:'MyNewPass1'}); assert.strictEqual(r.ok,false); assert.ok(/انتظر/.test(r.error));
  E.props.LOCKUNTIL = '0'; E.props.FAILS='0';
  assert.ok(E.call('login',{password:'MyNewPass1'}).data.ok);
});
t('دالة غير معروفة ومفاتيح النموذج الأولي مرفوضة', () => {
  assert.strictEqual(E.call('constructor',{},tok).error, 'دالة غير معروفة');
  assert.strictEqual(E.call('__proto__',{},tok).error, 'دالة غير معروفة');
  assert.strictEqual(E.call('setup',{},tok).error, 'دالة غير معروفة');
});
t('الإعدادات العامة لا تحوي مفاتيح خاصة', () => {
  const s = E.call('settings').data; assert.ok(!('تم الإعداد' in s)); assert.ok(!('رد تلقائي' in s));
  assert.ok(!JSON.stringify(s).includes('PWHASH'));
});

console.log('الفوائد والتنقية');
let ids = {};
t('حفظ فائدة بنص فقط (مسودة، خاصة)', () => {
  const r = E.call('save',{item:{text:'فائدة بلا توثيق'}},tok); assert.ok(r.ok, JSON.stringify(r)); ids.a = r.data.id;
  const o = E.call('get',{id:ids.a},tok).data; assert.strictEqual(o.status,'مسودة'); assert.strictEqual(o.visibility,'خاصة');
});
E.call('savePerson',{name:'',data:{name:'ابن قيم الجوزية',aliases:['ابن القيم'],dua:'رحمه الله'}},tok);
t('الموضع «2/45» لا يتحوّل إلى تاريخ', () => {
  const r = E.call('save',{item:{text:'نص ثانٍ للاختبار',speaker:'ابن القيم',ref:'زاد المعاد',locus:'2/45',visibility:'عامة',cat:'الفقه وأصوله'}},tok);
  ids.b = r.data.id; assert.strictEqual(E.call('get',{id:ids.b},tok).data.locus,'2/45');
});
t('توحيد الاسم عبر الأسماء البديلة', () => {
  const r = E.call('save',{item:{text:'فائدة ثالثة مختلفة',speaker:'ابن القيم',ref:'مدارج السالكين',visibility:'عامة'}},tok);
  ids.c = r.data.id; assert.strictEqual(E.call('get',{id:ids.c},tok).data.speaker,'ابن قيم الجوزية');
});
t('الوسيط يُسجَّل شخصًا ويُوحَّد', () => {
  const r = E.call('save',{item:{text:'فائدة بوسيط',speaker:'ابن تيمية',via:'ابن القيّم',ref:'كتاب',visibility:'عامة',medium:'سماع',locus:'32:15'}},tok);
  ids.d = r.data.id; const o = E.call('get',{id:ids.d},tok).data;
  assert.strictEqual(o.via,'ابن قيم الجوزية'); assert.strictEqual(o.medium,'سماع');
  assert.ok(E.call('people',{},tok).data.some(p=>p.name==='ابن تيمية'));
});
t('رابط javascript: يُمسح', () => {
  const r = E.call('save',{item:{text:'رابط خبيث',link:'javascript:alert(1)',speaker:'س'}},tok);
  assert.strictEqual(E.call('get',{id:r.data.id},tok).data.link,'');
  const r2 = E.call('save',{item:{text:'رابط سليم',link:'https://youtu.be/abc',speaker:'س'}},tok);
  assert.strictEqual(E.call('get',{id:r2.data.id},tok).data.link,'https://youtu.be/abc');
});
t('نص يبدأ بـ = لا يصير معادلة', () => {
  const r = E.call('save',{item:{text:'=HYPERLINK("x")',speaker:'س'}},tok);
  assert.strictEqual(E.call('get',{id:r.data.id},tok).data.text,'=HYPERLINK("x")');
});
t('تعديل يحافظ على الحقول غير المرسلة', () => {
  E.call('setField',{id:ids.b,field:'pubNo',value:'61'},tok);
  E.call('save',{item:{id:ids.b,text:'نص ثانٍ للاختبار معدّل'}},tok);
  const o = E.call('get',{id:ids.b},tok).data;
  assert.strictEqual(o.pubNo,'61'); assert.strictEqual(o.speaker,'ابن قيم الجوزية'); assert.strictEqual(o.locus,'2/45');
});
t('تعديل نص فارغ يرفض', () => assert.strictEqual(E.call('save',{item:{id:ids.b,text:'  '}},tok).ok,false));

t('الزائر يرى العام المنشور فقط وبلا الحقول الخاصة', () => {
  E.call('save',{item:{id:ids.b,note:'تعليق خاص جدا'}},tok);
  const l = E.call('listPublic').data; const idsPub = l.map(x=>x.id);
  assert.ok(idsPub.includes(ids.b) && idsPub.includes(ids.c) && idsPub.includes(ids.d));
  assert.ok(!idsPub.includes(ids.a));
  assert.ok(!JSON.stringify(l).includes('تعليق خاص جدا'));
  l.forEach(x=>{ assert.ok(!('note' in x) && !('verify' in x) && !('_row' in x)); });
  assert.strictEqual(E.call('getPublic',{id:ids.a}).data,null);
});
t('meta الزائر لا تكشف أسماءً مستعملة في الخاص فقط', () => {
  E.call('save',{item:{text:'فائدة خاصة لشخص سري',speaker:'شخص سري',ref:'كتاب سري',cat:'تصنيف سري',visibility:'خاصة'}},tok);
  const m = JSON.stringify(E.call('metaPublic').data);
  assert.ok(!m.includes('شخص سري') && !m.includes('كتاب سري') && !m.includes('تصنيف سري'), m);
  assert.ok(JSON.stringify(E.call('meta',{},tok).data).includes('شخص سري'));
});
t('«يحتاج تحقق» لا يظهر للزوار', () => {
  const r = E.call('save',{item:{text:'مستخرجة بالذكاء',speaker:'س',visibility:'عامة',verify:true}},tok);
  assert.ok(!E.call('listPublic').data.some(x=>x.id===r.data.id));
  E.call('setField',{id:r.data.id,field:'verify',value:false},tok);
  assert.ok(E.call('listPublic').data.some(x=>x.id===r.data.id));
});

t('«من فوائد هذا الكلام» تُحفظ وتظهر للزائر', () => {
  const r = E.call('save',{item:{text:'فائدة بخلاصة',speaker:'ابن كثير',visibility:'عامة',gain:'أن التوكل يزيل القلق'}},tok);
  assert.strictEqual(E.call('get',{id:r.data.id},tok).data.gain,'أن التوكل يزيل القلق');
  assert.strictEqual(E.call('getPublic',{id:r.data.id}).data.gain,'أن التوكل يزيل القلق');
});

console.log('الإخفاء');
t('إخفاء الاسم فقط مع عبارة بديلة', () => {
  E.call('savePerson',{name:'ابن تيمية',data:{name:'ابن تيمية',hide:'الاسم',rep:'بعض أهل العلم'}},tok);
  const x = E.call('listPublic').data.find(i=>i.id===ids.d);
  assert.strictEqual(x.speaker,'بعض أهل العلم'); assert.ok(!JSON.stringify(x).includes('ابن تيمية'));
  assert.ok(!JSON.stringify(E.call('metaPublic').data).includes('ابن تيمية'));
});
t('إخفاء كل ما يتعلق بالشخص (قائلًا أو وسيطًا)', () => {
  E.call('savePerson',{name:'ابن قيم الجوزية',data:{name:'ابن قيم الجوزية',aliases:['ابن القيم'],hide:'كل شيء'}},tok);
  const l = E.call('listPublic').data;
  [ids.b, ids.c, ids.d].forEach(i=>assert.ok(!l.some(x=>x.id===i), 'ظهرت '+i));
  assert.strictEqual(E.call('getPublic',{id:ids.b}).data,null);
  assert.ok(E.call('list',{},tok).data.some(x=>x.id===ids.b));
  E.call('savePerson',{name:'ابن قيم الجوزية',data:{name:'ابن قيم الجوزية',aliases:['ابن القيم'],hide:''}},tok);
  assert.ok(E.call('listPublic').data.some(x=>x.id===ids.b));
});
t('إخفاء مؤلف: كتابه وسيطًا يختفي، وكتابه مرجعًا يبقى اسم الكتاب بلا اسمه', () => {
  E.call('importMeta',{refs:[{title:'أعمال القلوب',author:'خالد السبت'},{title:'التكميل شرح مقدمات ابن جزي',author:'خالد السبت'}],people:[{name:'خالد السبت',aliases:['السبت']}]},tok);
  const a = E.call('save',{item:{text:'فائدة أصلها كتاب مؤلف محجوب',speaker:'خالد السبت',ref:'أعمال القلوب',locus:'ص٥',visibility:'عامة'}},tok).data.id;
  const b = E.call('save',{item:{text:'فائدة بوسيط كتاب مؤلف محجوب',speaker:'ابن كثير',ref:'تفسير ابن كثير',via:'أعمال القلوب ١/ ٣٩',visibility:'عامة'}},tok).data.id;
  const c = E.call('save',{item:{text:'فائدة مرجعها قديم يحوي الاسم',speaker:'ابن كثير',ref:'التكميل لخالد السبت',via:'أعمال القلوب لخالد السبت',visibility:'عامة'}},tok).data.id;
  E.call('savePerson',{name:'خالد السبت',data:{name:'خالد السبت',aliases:['السبت'],hide:'الاسم'}},tok);
  let l = E.call('listPublic').data, A = l.find(i=>i.id===a), B = l.find(i=>i.id===b), C = l.find(i=>i.id===c);
  assert.strictEqual(A.speaker,''); assert.strictEqual(A.ref,'أعمال القلوب');
  assert.strictEqual(B.via,''); assert.strictEqual(B.speaker,'ابن كثير');
  assert.ok(!JSON.stringify(C).includes('السبت'), 'ظهر الاسم: '+JSON.stringify(C));
  E.call('savePerson',{name:'خالد السبت',data:{name:'خالد السبت',aliases:['السبت'],hide:'كل شيء'}},tok);
  l = E.call('listPublic').data;
  [a,b].forEach(i=>assert.ok(!l.some(x=>x.id===i),'ظهرت '+i));
  E.call('savePerson',{name:'خالد السبت',data:{name:'خالد السبت',aliases:['السبت'],hide:''}},tok);
  assert.ok(E.call('listPublic').data.some(x=>x.id===b));
});
t('إخفاءات عامة من الإعدادات وإخفاءات الفائدة', () => {
  E.call('saveSettings',{settings:{'إخفاء المرجع':'نعم','إخفاء التواريخ':'نعم'}},tok);
  let x = E.call('listPublic').data.find(i=>i.id===ids.b);
  assert.strictEqual(x.ref,''); assert.strictEqual(x.locus,''); assert.strictEqual(x.createdAt,''); assert.ok(x.speaker);
  E.call('saveSettings',{settings:{'إخفاء المرجع':'لا','إخفاء التواريخ':'لا'}},tok);
  E.call('save',{item:{id:ids.b,hide:['speaker','link']}},tok);
  x = E.call('listPublic').data.find(i=>i.id===ids.b); assert.strictEqual(x.speaker,''); assert.ok(x.ref);
  E.call('save',{item:{id:ids.b,hide:[]}},tok);
});
t('الإعدادات الخاصة لا تُسرَّب', () => {
  E.call('saveSettings',{settings:{'رد تلقائي':'نعم','مفتاح مجهول':'x'}},tok);
  assert.ok(!('رد تلقائي' in E.call('settings').data));
  const o = E.call('settingsOwner',{},tok).data; assert.strictEqual(o['رد تلقائي'],'نعم'); assert.ok(!('مفتاح مجهول' in o));
  E.call('saveSettings',{settings:{'رد تلقائي':'لا'}},tok);
});

console.log('الحذف والسلة');
t('حذف واستعادة وحذف نهائي إلى الأرشيف', () => {
  E.call('remove',{id:ids.a},tok); assert.ok(E.call('trash',{},tok).data.some(x=>x.id===ids.a));
  E.call('restore',{id:ids.a},tok); assert.ok(E.call('list',{},tok).data.some(x=>x.id===ids.a));
  E.call('remove',{id:ids.a},tok); const r = E.call('emptyTrash',{},tok).data; assert.strictEqual(r.count,1);
  assert.ok(!E.call('list',{},tok).data.some(x=>x.id===ids.a));
  assert.ok(E.sheets['المحذوف نهائيًا'].getLastRow() >= 2);
});

console.log('لوحة التحكم');
t('إعادة تسمية الشخص تشمل القائل والوسيط وتُبقي القديم بديلًا', () => {
  E.call('renameMeta',{kind:'speakers',from:'ابن قيم الجوزية',to:'ابن القيم'},tok);
  assert.strictEqual(E.call('get',{id:ids.c},tok).data.speaker,'ابن القيم');
  assert.strictEqual(E.call('get',{id:ids.d},tok).data.via,'ابن القيم');
  const r = E.call('save',{item:{text:'فائدة رابعة',speaker:'ابن قيم الجوزية'}},tok);
  assert.strictEqual(E.call('get',{id:r.data.id},tok).data.speaker,'ابن القيم');
});
t('الدمج يضيف القديم بديلًا', () => {
  E.call('save',{item:{text:'فائدة خامسة',speaker:'ابن عثيمين'}},tok);
  E.call('save',{item:{text:'فائدة سادسة',speaker:'الشيخ ابن عثيمين'}},tok);
  const r = E.call('mergeMeta',{kind:'speakers',from:'الشيخ ابن عثيمين',to:'ابن عثيمين'},tok).data; assert.strictEqual(r.changed,1);
  const r2 = E.call('save',{item:{text:'فائدة سابعة',speaker:'الشيخ ابن عثيمين'}},tok);
  assert.strictEqual(E.call('get',{id:r2.data.id},tok).data.speaker,'ابن عثيمين');
});
t('حذف عنصر مستعمل يرفض', () => assert.strictEqual(E.call('deleteMeta',{kind:'speakers',value:'ابن عثيمين'},tok).data.ok,false));
t('metaCounts تعدّ الوسيط مع القائل', () => {
  const c = E.call('metaCounts',{},tok).data.speakers.find(x=>x.value==='ابن القيم'); assert.ok(c && c.count>=2);
});

console.log('الاستيراد');
t('importBatch: إضافة وتخطي المكرر وعطب عنصر لا يُفشل البقية', () => {
  const items = [
    {text:'فائدة مستوردة أولى', speaker:'ابن رجب', ref:'جامع العلوم', locus:'3/12', tags:['أ','ب'], cat:'الحديث وعلومه'},
    {text:'فائدة مستوردة أولى'},
    {text:''}, null,
    {text:'فائدة مستوردة ثانية', visibility:'عامة', starred:true, medium:'سماع', createdAt:'2020-01-05T00:00:00Z', id:ids.b},
    {text:'نص طويل '.repeat(10), link:'ftp://x', hide:['speaker','حقل']}
  ];
  const r = E.call('importBatch',{items,options:{}},tok).data;
  assert.strictEqual(r.added,3); assert.strictEqual(r.skipped,1); assert.ok(r.bad>=2, JSON.stringify(r));
  const all = E.call('list',{},tok).data;
  const o = all.find(x=>x.text==='فائدة مستوردة ثانية'); assert.ok(o); assert.notStrictEqual(o.id,ids.b); // معرّف متعارض يُستبدل
  assert.strictEqual(o.createdAt.slice(0,10),'2020-01-05'); assert.strictEqual(o.medium,'سماع'); assert.ok(o.starred);
  assert.strictEqual(all.find(x=>x.speaker==='ابن رجب').locus,'3/12');
  assert.ok(E.call('people',{},tok).data.some(p=>p.name==='ابن رجب'));
  assert.ok(E.call('meta',{},tok).data.refs.includes('جامع العلوم'));
});
t('importBatch: AI → مسودة تحتاج تحقق وخاصة', () => {
  E.call('importBatch',{items:[{text:'فائدة ذكاء اصطناعي', speaker:'س', visibility:'عامة'}],options:{forceDraft:true,markVerify:true,visibility:'خاصة'}},tok);
  const o = E.call('list',{},tok).data.find(x=>x.text==='فائدة ذكاء اصطناعي');
  assert.strictEqual(o.status,'مسودة'); assert.ok(o.verify); assert.strictEqual(o.visibility,'خاصة');
});
t('importBatch: 200 عنصر دفعة واحدة وتوسيع الصفوف', () => {
  const items = Array.from({length:200},(_,i)=>({text:'فائدة جماعية رقم '+i+' '+'ك'.repeat(i%7), speaker:'قائل'+(i%5)}));
  const r = E.call('importBatch',{items,options:{}},tok).data; assert.strictEqual(r.added,200);
  const n = E.call('list',{},tok).data.length; assert.ok(n>200);
  for (let k=0;k<5;k++) E.call('importBatch',{items:items.map(x=>({...x,text:x.text+' ز'+k})),options:{}},tok);
  assert.ok(E.sheets['الفوائد'].maxRows >= 1000);
});
t('معرّفات فريدة دائمًا', () => {
  const all = E.call('list',{},tok).data.map(x=>x.id); assert.strictEqual(new Set(all).size, all.length);
});
t('importMeta: قائلون ومراجع وتصنيفات وإعدادات', () => {
  const r = E.call('importMeta',{people:[{name:'الألباني',aliases:['الشيخ الألباني'],dua:'رحمه الله'}],refs:[{title:'كتاب جديد',author:'ك'}],
    categories:[{name:'تصنيف جديد'}], settings:{'اسم المنصة':'منصة مستوردة','تم الإعداد':'نعم','بند مجهول':'x'}},tok).data;
  assert.deepStrictEqual([r.people,r.refs,r.cats],[1,1,1]);
  assert.strictEqual(E.call('settings').data['اسم المنصة'],'منصة مستوردة');
  assert.strictEqual(E.call('settingsOwner',{},tok).data['تم الإعداد'],'لا');
});
t('trashAll ثم استعادة', () => {
  const n = E.call('list',{},tok).data.length;
  assert.strictEqual(E.call('trashAll',{},tok).data.count, n);
  assert.strictEqual(E.call('list',{},tok).data.length, 0);
  const tr = E.call('trash',{},tok).data; assert.strictEqual(tr.length, n);
  E.call('restore',{id:tr[0].id},tok); assert.strictEqual(E.call('list',{},tok).data.length,1);
});
t('exportAll يحمل الشكل الجديد', () => {
  const x = E.call('exportAll',{},tok).data; assert.strictEqual(x.format,'kunnasha'); assert.ok(x.items.length>=1 && x.people.length && x.settings);
  assert.ok(!JSON.stringify(x).includes('PWHASH'));
});

console.log('الرسائل');
t('رسالة طلب منصة تُحفظ ويراها المالك فقط', () => {
  const r = E.call('contact',{kind:'طلب منصة',name:'زائر',contact:'a@b.co',message:'أريد منصة',showName:true});
  assert.ok(r.ok); const m = E.call('messages',{},tok).data; assert.strictEqual(m.length,1); assert.strictEqual(m[0].status,'جديد');
  assert.strictEqual(E.call('messages',{}).auth, true);
  assert.strictEqual(E.call('meta',{},tok).data.inbox,1);
});
t('التواصل إلزامي إلا في الملاحظات', () => {
  assert.strictEqual(E.call('contact',{kind:'سؤال',contact:'12'}).ok,false);
  assert.ok(E.call('contact',{kind:'ملاحظة',message:'تصحيح',factId:'F-000002'}).ok);
});
t('الحقل المخفي يصيد الآلي', () => {
  const n = E.call('messages',{},tok).data.length; E.call('contact',{kind:'تواصل',contact:'spam@x.co',hp:'x'});
  assert.strictEqual(E.call('messages',{},tok).data.length,n);
});
t('حدّ 3 رسائل لوسيلة تواصل واحدة في اليوم', () => {
  for (let i=0;i<2;i++) assert.ok(E.call('contact',{kind:'تواصل',contact:'lim@x.co',message:'م'+i}).ok);
  assert.strictEqual(E.call('contact',{kind:'تواصل',contact:'lim@x.co',message:'م'}).ok,true);
  assert.strictEqual(E.call('contact',{kind:'تواصل',contact:'lim@x.co',message:'م'}).ok,false);
});
t('الرد التلقائي مغلق افتراضيًا ويعمل عند التفعيل مرة لكل بريد', () => {
  assert.strictEqual(E.mails.length,0);
  E.call('saveSettings',{settings:{'رد تلقائي':'نعم','رابط المنصة':'https://example.com/x'}},tok);
  E.call('contact',{kind:'طلب منصة',contact:'auto@x.co',message:'<script>x</script>'});
  E.call('contact',{kind:'طلب منصة',contact:'auto@x.co',message:'مرة ثانية'});
  assert.strictEqual(E.mails.length,1); assert.ok(E.mails[0].body.includes('https://example.com/x'));
  assert.ok(!E.mails[0].body.includes('script'));
  E.call('contact',{kind:'طلب منصة',contact:'0555555555',message:'رقم'}); assert.strictEqual(E.mails.length,1);
});
t('تحديث الحالة والحذف', () => {
  const m = E.call('messages',{},tok).data[0]; E.call('setMessageStatus',{id:m.id,status:'تم الرد'},tok);
  assert.strictEqual(E.call('messages',{},tok).data[0].status,'تم الرد');
  const n = E.call('messages',{},tok).data.length; E.call('deleteMessage',{id:m.id},tok);
  assert.strictEqual(E.call('messages',{},tok).data.length,n-1);
});

console.log('القوالب');
t('حفظ قالب بصورة كبيرة مقسّمة وقراءتها', () => {
  const img = Buffer.alloc(300000, 7).toString('base64').slice(0,400000);
  const r = E.call('saveTemplate',{name:'قالبي',cfg:{w:1080,h:1350,overlay:0.3,safe:{x:.1,y:.1,w:.8,h:.8}},image:img},tok);
  assert.ok(r.ok, JSON.stringify(r)); const id = r.data.id;
  const l = E.call('templates').data; assert.strictEqual(l.length,1); assert.strictEqual(l[0].cfg.overlay,0.3);
  assert.strictEqual(E.call('templateImage',{id}).data, img);
  E.call('saveTemplate',{id,name:'قالبي 2',cfg:{w:1080,h:1080}},tok);       // بلا صورة: تبقى القديمة
  assert.strictEqual(E.call('templateImage',{id}).data, img); assert.strictEqual(E.call('templates').data[0].name,'قالبي 2');
  assert.strictEqual(E.call('saveTemplate',{name:'س',cfg:{},image:'<bad>'},tok).ok,false);
  E.call('deleteTemplate',{id},tok); assert.strictEqual(E.call('templates').data.length,0);
});
t('إعدادات القالب المشوّهة تُصحَّح', () => {
  const r = E.call('saveTemplate',{name:'ق',cfg:{w:99999,h:-5,overlay:9,safe:{x:'a'},text:'evil',extra:1}},tok);
  const c = E.call('templates').data[0].cfg; assert.ok(c.w<=2400 && c.h>=400 && c.overlay<=0.8 && c.text==='auto' && !('extra' in c));
});

console.log('المراجعة والسلاسل');
t('المراجعة المتباعدة', () => {
  const id = E.call('list',{},tok).data[0].id; E.call('setField',{id,field:'starred',value:true},tok);
  assert.ok(E.call('due',{},tok).data.some(x=>x.id===id));
  assert.strictEqual(E.call('review',{id,grade:'ok'},tok).data.days,3);
  assert.ok(!E.call('due',{},tok).data.some(x=>x.id===id));
});

console.log('الإقلاع السريع (boot)');
t('طلب واحد يعيد الإعدادات والقوائم والفوائد، ولكل دور بياناته', () => {
  const g = E.call('boot',{}).data; assert.strictEqual(g.owner,false); assert.ok(g.settings && g.meta && Array.isArray(g.items) && g.ver);
  assert.ok(g.items.every(i=>i.visibility==='عامة'), 'الزائر: العام فقط'); assert.ok(!('رد تلقائي' in g.settings));
  const o = E.call('boot',{},tok).data; assert.strictEqual(o.owner,true); assert.ok(o.items.length>=g.items.length); assert.ok('رد تلقائي' in o.settings); assert.ok(o.meta.people);
});
t('رقم النسخة نفسه ⇒ same بلا قراءة الجدول', () => {
  const o = E.call('boot',{},tok).data;
  const r = E.call('boot',{ver:o.ver,owner:true},tok).data; assert.strictEqual(r.same,true); assert.ok(!r.items && !r.settings);
  assert.ok(!E.call('boot',{ver:o.ver,owner:true}).data.same, 'دور مختلف (زائر برمز غير صالح) لا يأخذ same');
});
t('أي كتابة تغيّر رقم النسخة', () => {
  const v0 = E.call('boot',{},tok).data.ver; E.call('save',{item:{text:'فائدة لتغيير الرقم'}},tok);
  const r = E.call('boot',{ver:v0,owner:true},tok).data; assert.ok(!r.same && r.items.some(i=>i.text==='فائدة لتغيير الرقم'));
  const v1 = r.ver; E.call('contact',{kind:'ملاحظة',message:'م'}); assert.notStrictEqual(E.call('boot',{},tok).data.ver, v1);
});
t('الدخول يعيد البيانات في الردّ نفسه، وmustChange يمنعها', () => {
  const r = E.call('login',{password:'MyNewPass1'}).data; assert.ok(r.ok && r.boot && r.boot.owner && r.boot.items.length);
  E.call('resetPassword' in E.ctx ? 'checkToken':'checkToken',{},tok);
  const temp2 = E.ctx.resetPassword().match(/: (\S{10})\n/)[1];
  const l = E.call('login',{password:temp2}).data; assert.ok(l.ok && l.mustChange && !l.boot);
  assert.ok(E.call('boot',{},l.token).data.mustChange); assert.ok(!E.call('boot',{},l.token).data.items);
  assert.ok(E.call('changePassword',{old:temp2,neu:'MyNewPass1'},l.token).data.ok); tok = E.call('login',{password:'MyNewPass1'}).data.token;
});
t('المعرّفات لا تتعارض حتى لو تخلّف العدّاد', () => {
  E.props.COUNTER = '1';
  const a = E.call('save',{item:{text:'فائدة بعد تخلّف العدّاد'}},tok).data.id; const all = E.call('list',{},tok).data.map(x=>x.id);
  assert.strictEqual(all.filter(x=>x===a).length,1);
});

console.log('الترحيل من الإصدار ١');
t('جدول قديم (٢٥ عمودًا وقائلون بأربعة أعمدة) يعمل فورًا ثم يُكمَّل بـ setup دون المساس بالبيانات', () => {
  const O = build();
  const ss = O.ctx.SpreadsheetApp.getActiveSpreadsheet();
  const old = ['المعرّف','العنوان','النص','النوع','القائل','المرجع','الموضع','المصدر الوسيط','الرابط','التصنيف','الوسوم','تعليقي','الظهور','الحالة','مميّزة','فوائد مرتبطة','تاريخ الإضافة هجري','تاريخ الإضافة','تاريخ التعديل','الحالة السابقة','مرحلة المراجعة','المراجعة القادمة','السلسلة','ترتيب السلسلة','الموضع القرآني أو الحديثي'];
  const f = ss.insertSheet('الفوائد'); f.textRanges.push([1,1,1000,26]); old.forEach((h,i)=>f.set(1,i+1,h));
  const row = ['F-000007','','فائدة قديمة','فائدة','ابن القيم','زاد المعاد','2/45','','','فقه','أ، ب','تعليق','عامة','منشورة','نعم','','','2023-01-01T00:00:00.000Z','','','','','','','']; row.forEach((v,i)=>f.set(2,i+1,v));
  const sp = ss.insertSheet('القائلون'); sp.textRanges.push([1,1,1000,26]); ['الاسم المعتمد','الأسماء البديلة','سنة الوفاة','نبذة'].forEach((h,i)=>sp.set(1,i+1,h)); sp.set(2,1,'ابن القيم');
  const p = O.props; p.COUNTER='7';
  // بلا setup: القراءة والحفظ تعمل (تُكمَّل الأعمدة عند أول استعمال)
  const salt='s'; O.ctx.setPassword_('OldPass123'); // كلمة قديمة
  const tk = O.call('login',{password:'OldPass123'}).data.token;
  assert.ok(tk);
  const l = O.call('list',{},tk); assert.ok(l.ok, JSON.stringify(l)); assert.strictEqual(l.data[0].locus,'2/45'); assert.strictEqual(l.data[0].medium,'');
  const r = O.call('save',{item:{text:'فائدة جديدة بعد الترحيل',speaker:'ابن القيم',medium:'سماع'}},tk); assert.ok(r.ok, JSON.stringify(r)); assert.strictEqual(r.data.id,'F-000008');
  O.ctx.setup();
  assert.strictEqual(O.sheets['الفوائد'].get(1,30),'إخفاءات'); assert.strictEqual(O.sheets['القائلون'].get(1,7),'الدعاء');
  assert.strictEqual(O.call('get',{id:'F-000007'},tk).data.text,'فائدة قديمة');
  assert.ok(O.call('listPublic').data.some(x=>x.id==='F-000007'));
  assert.ok(!O.props.MUSTCHANGE, 'كلمة المرور القديمة لا تتحول إلى مؤقتة');
});

console.log(`\n${pass} نجح، ${fail} فشل`);
process.exit(fail ? 1 : 0);
