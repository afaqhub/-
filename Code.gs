/*************************************************************
 *  كُنّاشة الفوائد — كود الخادم (Google Apps Script)
 *  الإصدار 2
 *
 *  طريقة الاستعمال باختصار:
 *   1) الصق هذا الملف كاملًا في محرر Apps Script ثم احفظ.
 *   2) شغّل الدالة  setup  مرة واحدة: تُنشئ الأوراق كلها وتولّد
 *      كلمة مرور مؤقتة تظهر في «سجل التنفيذ» (Execution log).
 *   3) انشر: تطبيق ويب — التنفيذ باسم: أنا — الوصول: أي شخص.
 *   4) عند أول دخول من الصفحة تُطلب منك كلمة مرور جديدة.
 *
 *  لا حاجة لتعديل أي شيء في هذا الملف.
 *  (إن أردت كلمة مرور ابتدائية بنفسك فاستعمل setMyPassword.)
 *************************************************************/

/* ===================== ثوابت ===================== */
var SH = {
  F:'الفوائد', C:'التصنيفات', S:'القائلون', R:'المراجع', T:'الإعدادات',
  M:'الرسائل', P:'القوالب', A:'المحذوف نهائيًا', Q:'القطاف', G:'سجل القطاف'
};

var COLS = ['المعرّف','العنوان','النص','النوع','القائل','المرجع','الموضع','المصدر الوسيط',
            'الرابط','التصنيف','الوسوم','تعليقي','الظهور','الحالة','مميّزة','فوائد مرتبطة',
            'تاريخ الإضافة هجري','تاريخ الإضافة','تاريخ التعديل','الحالة السابقة',
            'مرحلة المراجعة','المراجعة القادمة','السلسلة','ترتيب السلسلة','الموضع القرآني أو الحديثي',
            'وسيلة التلقي','رقم النشر','تاريخ النشر','يحتاج تحقق','إخفاءات','من فوائد هذا الكلام','موضع الوسيط','بالتصرف'];

var HEAD_C = ['الاسم','الأب','اللون','الأيقونة','الترتيب','الحالة'];
var HEAD_S = ['الاسم المعتمد','الأسماء البديلة','سنة الوفاة','نبذة','إخفاء','عبارة بديلة','الدعاء'];
var HEAD_R = ['العنوان','المؤلف','النوع','الطبعة أو الرابط','إخفاء'];
var HEAD_Q = ['المعرّف','الاسم','الإعدادات','الحالة','الترتيب','الظهور','الحالة الجارية','تاريخ الإنشاء'];
var HEAD_G = ['الوقت','المعرّف','الخطة'];
var HEAD_T = ['المفتاح','القيمة'];
var HEAD_M = ['المعرّف','التاريخ','النوع','الاسم','التواصل','يُذكر الاسم','الرسالة','الفائدة','الحالة','رد تلقائي'];
var HEAD_P = ['المعرّف','الاسم','الإعدادات','الجزء','البيانات'];

var DEFAULT_CATEGORIES = ['العقيدة','التفسير وعلوم القرآن','الحديث وعلومه','الفقه وأصوله',
                          'السيرة والتاريخ','اللغة والأدب','التربية والسلوك','فوائد متفرقة'];
var DEFAULT_TYPES = ['فائدة','تنبيه','قاعدة','تعقيب','إشكال وجوابه','لطيفة','شعر','نقل'];
var MEDIUMS = ['قراءة','سماع','مشاهدة','مجلس','إنترنت'];
var HIDE_KEYS = ['speaker','via','ref','link'];

/** الإعدادات الافتراضية: [المفتاح، القيمة، هل هي عامة يراها الزائر؟] */
var DEFAULT_SETTINGS = [
  ['اسم المنصة','كُنّاشة الفوائد',1],
  ['الوصف','كُنّاشة رقمية للفوائد العلمية',1],
  ['أنواع الفوائد', DEFAULT_TYPES.join('، '),1],
  ['وسائل التلقي', MEDIUMS.join('، '),1],
  ['الظهور الافتراضي','خاصة',1],
  ['عدد الفوائد في الصفحة','20',1],
  ['صانع المنصة','',1],
  ['إظهار الصانع','نعم',1],
  ['رابط المنصة','',1],
  ['زر منصتك','نعم',1],
  ['رابط استقبال الطلبات','',1],
  ['إخفاء القائل','لا',1],
  ['إخفاء الوسيط','لا',1],
  ['إخفاء المرجع','لا',1],
  ['إخفاء الرابط','لا',1],
  ['إخفاء التواريخ','لا',1],
  ['ختم الصور','',1],
  ['عنوان البطاقة','',1],
  ['تم الإعداد','لا',0]
];

/** إعدادات خاصة لا تُحفظ في الجدول ولا يراها الزائر: المفتاح ← اسم الخاصية */
var PRIV_KEYS = { 'رد تلقائي':'AUTOREPLY', 'نص الرد التلقائي':'AUTOTEXT' };
var DEFAULT_AUTOTEXT = 'السلام عليكم ورحمة الله وبركاته،\nشكرًا لاهتمامك بالمنصة.\n{الرابط}\nوسيتواصل معك صاحب المنصة قريبًا بإذن الله.';

var TOKEN_DAYS = 180;      // مدة بقاء جلسة المالك في الجهاز
var TEXT_MAX = 20000;      // أقصى طول لنص الفائدة (حد الخلية 50000)
var IMG_CHUNK = 45000;     // حجم القطعة عند حفظ صور القوالب

/* ===================== الإعداد التلقائي ===================== */
/** شغّلها مرة واحدة. آمنة للتكرار: لا تمسّ ما كُتب، وتُكمل الناقص فقط. */
function setup(){
  _SC = {};
  getSheet_(SH.F, COLS);
  var c = getSheet_(SH.C, HEAD_C);
  if (c.getLastRow() < 2) DEFAULT_CATEGORIES.forEach(function(n,i){ appendText_(c,[n,'','','',i+1,'مفعّل']); });
  getSheet_(SH.S, HEAD_S);
  getSheet_(SH.R, HEAD_R);
  var t = getSheet_(SH.T, HEAD_T);
  ensureSettings_(t);
  getSheet_(SH.M, HEAD_M);
  getSheet_(SH.P, HEAD_P);

  var msg = 'تم الإعداد بنجاح — الأوراق: ' + [SH.F,SH.C,SH.S,SH.R,SH.T,SH.M,SH.P].join('، ');
  var p = PropertiesService.getScriptProperties();
  if (!p.getProperty('PWHASH')) {
    var temp = tempPassword_();
    setPassword_(temp);
    p.setProperty('MUSTCHANGE','1');
    msg += '\n\n🔑 كلمة المرور المؤقتة (تُطلب منك عند أول دخول ثم تُغيّرها): ' + temp +
           '\nاحفظها الآن، فلا تظهر مرة أخرى. وإن ضاعت فشغّل الدالة resetPassword.';
  } else {
    msg += '\n(كلمة المرور مضبوطة مسبقًا ولم تُمسّ.)';
  }
  Logger.log(msg);
  return msg;
}

/** توليد كلمة مرور مؤقتة جديدة (للنسيان). تظهر في السجل. */
function resetPassword(){
  var temp = tempPassword_();
  setPassword_(temp);
  PropertiesService.getScriptProperties().setProperty('MUSTCHANGE','1');
  var msg = '🔑 كلمة المرور المؤقتة الجديدة: ' + temp + '\nتُطلب منك عند الدخول ثم تُغيّرها.';
  Logger.log(msg);
  return msg;
}

function tempPassword_(){
  var al = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789', out = '';
  for (var i=0;i<10;i++) out += al.charAt(Math.floor(Math.random()*al.length));
  return out;
}

/* ===================== الأوراق ===================== */
var _SC = {};

/** يُرجع الورقة جاهزة: يُنشئها إن لم توجد، ويُكمل أعمدتها وعناوينها دون المساس بالبيانات. */
function getSheet_(name, heads){
  if (_SC[name]) return _SC[name];
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  ensureHeaders_(sh, heads);
  _SC[name] = sh;
  return sh;
}

function ensureHeaders_(sh, heads){
  var n = heads.length;
  if (sh.getMaxColumns() < n) sh.insertColumnsAfter(sh.getMaxColumns(), n - sh.getMaxColumns());
  var fresh = sh.getLastRow() === 0;
  var have = fresh ? [] : sh.getRange(1,1,1,n).getValues()[0].map(String);
  var touched = fresh;
  for (var i=0;i<n;i++){
    if (!have[i]) {
      sh.getRange(1,i+1).setValue(heads[i]).setFontWeight('bold').setBackground('#14323f').setFontColor('#ffffff');
      touched = true;
    }
  }
  if (touched) {
    // نص عادي: يمنع تحويل «3/12» إلى تاريخ ويمنع تنفيذ ما يبدأ بـ «=» كمعادلة
    sh.getRange(1,1,sh.getMaxRows(),sh.getMaxColumns()).setNumberFormat('@');
    sh.setFrozenRows(1);
  }
}

function ensureRows_(sh, upto){
  if (sh.getMaxRows() < upto) sh.insertRowsAfter(sh.getMaxRows(), upto - sh.getMaxRows());
}

/** يكتب صفوفًا في موضع محدد بنص عادي (لا تواريخ ولا معادلات)، ويوسّع الورقة عند الحاجة. */
function writeRows_(sh, startRow, rows, width){
  if (!rows.length) return;
  ensureRows_(sh, startRow + rows.length - 1);
  var r = sh.getRange(startRow, 1, rows.length, width || rows[0].length);
  r.setNumberFormat('@');
  r.setValues(rows);
}
/** بديل appendRow يضمن أن الصف المضاف نصّي. */
function appendText_(sh, vals){ writeRows_(sh, sh.getLastRow() + 1, [vals], vals.length); }

function ensureSettings_(t){
  var have = {};
  if (t.getLastRow() > 1) t.getRange(2,1,t.getLastRow()-1,1).getValues().forEach(function(r){ have[String(r[0])] = 1; });
  DEFAULT_SETTINGS.forEach(function(d){ if (!have[d[0]]) appendText_(t,[d[0], d[1]]); });
}

function fsheet_(){ return getSheet_(SH.F, COLS); }

/* ===================== أدوات ===================== */
function norm_(s){
  return String(s==null?'':s)
    .replace(/[ً-ْٰـ]/g,'')
    .replace(/[أإآٱ]/g,'ا').replace(/ة/g,'ه').replace(/[ىئ]/g,'ي').replace(/ؤ/g,'و')
    .replace(/\s+/g,' ').trim().toLowerCase();
}
function dupKey_(t){
  return norm_(t).replace(/[^ء-غف-يa-z0-9 ]/g,'').replace(/\s+/g,' ').trim().slice(0,70);
}
function trim_(s){ return String(s==null?'':s).trim(); }
function clip_(s,n){ return String(s==null?'':s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'').trim().slice(0,n); }
function splitList_(v){ return String(v==null?'':v).split(/[،,;؛\n]/).map(trim_).filter(String); }
function safeUrl_(u){ u = trim_(u); return /^https?:\/\/[^\s]+$/i.test(u) ? u.slice(0,1000) : ''; }
function isoOrEmpty_(v){
  if (!v) return '';
  var d = new Date(v);
  return isNaN(d.getTime()) ? '' : d.toISOString();
}
function out_(obj){
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
var _HF = null;
function hijri_(d){
  try {
    if (!_HF) _HF = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura',{day:'numeric', month:'long', year:'numeric'});
    return _HF.format(d);
  } catch (e) { return ''; }
}
function dayKey_(){ return Utilities.formatDate ? Utilities.formatDate(new Date(), 'UTC', 'yyyyMMdd') : new Date().toISOString().slice(0,10).replace(/-/g,''); }

/** كل كتابة تمرّ من هنا: قفل، ثم إبطال ذاكرة القراءة، ثم رفع «رقم النسخة» ليعرف المتصفح أن بياناته قديمة. */
function withLock_(ms, fn){
  var lock = LockService.getScriptLock();
  lock.waitLock(ms || 20000);
  try { _ALL = null; var r = fn(); bump_(); return r; }
  finally { _ALL = null; lock.releaseLock(); }
}

/** رقم نسخة البيانات: يتغيّر مع كل كتابة. إن جاء المتصفح بالرقم نفسه فلا حاجة لقراءة الجدول أصلًا. */
/** رقم النسخة: يُرفع مع كل كتابة من المنصة، ويُضاف إليه عدد صفوف أوراق الفوائد والقائلين والمراجع ليلتقط حذفك أو إضافتك المباشرة في جدول جوجل. */
function ver_(){
  var v = PropertiesService.getScriptProperties().getProperty('VER') || '0', fp = '';
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    [SH.F, SH.S, SH.R, SH.C].forEach(function(n){ var sh = ss.getSheetByName(n); fp += '.' + (sh ? sh.getLastRow() : 0); });
  } catch (e) {}
  return v + fp;
}
function bump_(){ PropertiesService.getScriptProperties().setProperty('VER', Date.now().toString(36) + Math.floor(Math.random()*1296).toString(36)); }

/* ===================== كلمة المرور ===================== */
/** (اختياري) كلمة مرور ابتدائية من اختيارك — اكتبها مكان النجوم ثم شغّل الدالة. */
function setMyPassword(){
  var pw = '********';            // ◀◀◀ اكتب كلمة المرور هنا بين علامتي التنصيص
  if (pw === '********') throw new Error('اكتب كلمة المرور أولًا مكان النجوم ثم شغّل الدالة.');
  setPassword_(pw);
  PropertiesService.getScriptProperties().deleteProperty('MUSTCHANGE');
  return 'حُفظت كلمة المرور. أعد النجوم مكان كلمتك واحفظ (لم تعد لازمة هنا).';
}

function setPassword_(pw){
  var p = PropertiesService.getScriptProperties();
  var salt = Utilities.getUuid();
  p.setProperty('SALT', salt);
  p.setProperty('PWHASH', hash_(salt + pw));
  p.deleteProperty('FAILS'); p.deleteProperty('LOCKUNTIL');
  // إبطال كل الجلسات السابقة عند تغيير كلمة المرور
  var all = p.getProperties();
  Object.keys(all).forEach(function(k){ if (k.indexOf('TOK_') === 0) p.deleteProperty(k); });
}

function hash_(s){
  var b = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8);
  return b.map(function(x){ return ('0'+(x<0?x+256:x).toString(16)).slice(-2); }).join('');
}

/* ===================== نقطة الدخول ===================== */
function doGet(){
  return out_({ok:true, msg:'خادم كُنّاشة الفوائد يعمل بنجاح ✅'});
}

var PUBLIC = {
  login:api_login, listPublic:api_listPublic, getPublic:api_getPublic, metaPublic:api_metaPublic,
  settings:api_settings, contact:api_contact, templates:api_templates, templateImage:api_templateImage,
  boot:api_boot, qplans:api_qplans
};
var OWNER = {
  checkToken:api_checkToken, list:api_list, get:api_get, save:api_save, setField:api_setField,
  remove:api_remove, restore:api_restore, purge:api_purge, trash:api_trash,
  meta:api_meta, addMeta:api_addMeta, exportAll:api_exportAll,
  changePassword:api_changePassword, logout:api_logout,
  metaCounts:api_metaCounts, renameMeta:api_renameMeta, mergeMeta:api_mergeMeta,
  deleteMeta:api_deleteMeta, cleanMeta:api_cleanMeta, saveSettings:api_saveSettings, settingsOwner:api_settingsOwner,
  emptyTrash:api_emptyTrash, due:api_due, review:api_review, series:api_series, reading:api_reading,
  people:api_people, savePerson:api_savePerson,
  importBatch:api_importBatch, importMeta:api_importMeta, trashAll:api_trashAll, bulk:api_bulk,
  qsave:api_qsave, qdelete:api_qdelete, qorder:api_qorder, qstate:api_qstate, qread:api_qread, qlog:api_qlog, saveRef:api_saveRef, refs:api_refs,
  messages:api_messages, setMessageStatus:api_setMessageStatus, deleteMessage:api_deleteMessage,
  saveTemplate:api_saveTemplate, deleteTemplate:api_deleteTemplate
};
/** ما يُسمح به قبل تغيير كلمة المرور المؤقتة */
var ALLOWED_BEFORE_CHANGE = { checkToken:1, changePassword:1, logout:1 };

function doPost(e){
  _SC = {}; _ALL = null;
  var req;
  try { req = JSON.parse(e.postData.contents); }
  catch (err) { return out_({ok:false, error:'طلب غير صالح'}); }

  var fn = String(req.fn || '');
  var args = req.args || {};
  var token = req.token || '';

  try {
    // قائمة بيضاء: لا يُستدعى إلا ما هو مسمّى هنا صراحةً
    if (Object.prototype.hasOwnProperty.call(PUBLIC, fn))
      return out_({ok:true, data: PUBLIC[fn](args, token)});
    if (Object.prototype.hasOwnProperty.call(OWNER, fn)) {
      if (!validToken_(token)) return out_({ok:false, error:'انتهت الجلسة — سجّل الدخول مرة أخرى', auth:true});
      if (mustChange_() && !ALLOWED_BEFORE_CHANGE[fn])
        return out_({ok:false, error:'غيّر كلمة المرور المؤقتة أولًا', mustChange:true});
      return out_({ok:true, data: OWNER[fn](args, token)});
    }
    return out_({ok:false, error:'دالة غير معروفة'});
  } catch (err) {
    return out_({ok:false, error: String(err && err.message || err)});
  }
}

/* ===================== الجلسات ===================== */
function mustChange_(){ return PropertiesService.getScriptProperties().getProperty('MUSTCHANGE') === '1'; }

function api_login(a){
  var p = PropertiesService.getScriptProperties();
  var salt = p.getProperty('SALT'), h = p.getProperty('PWHASH');
  if (!h) throw new Error('لم تُضبط كلمة المرور بعد — شغّل الدالة setup في Apps Script.');
  var now = Date.now();
  var until = Number(p.getProperty('LOCKUNTIL')||0);
  if (until > now) throw new Error('محاولات خاطئة كثيرة — انتظر ' + Math.ceil((until-now)/60000) + ' دقيقة ثم أعد المحاولة');
  if (hash_(salt + String(a.password||'')) !== h) {
    Utilities.sleep(400); // تبطيء المحاولات الخاطئة المتكررة
    var f = Number(p.getProperty('FAILS')||0) + 1;
    p.setProperty('FAILS', String(f));
    if (f >= 5) {
      var mins = Math.min(2 * Math.pow(2, Math.floor(f/5)-1), 30);
      p.setProperty('LOCKUNTIL', String(now + mins*60000));
    }
    return {ok:false};
  }
  p.deleteProperty('FAILS'); p.deleteProperty('LOCKUNTIL');
  purgeTokens_();
  var tok = Utilities.getUuid() + Utilities.getUuid().slice(0,8);
  p.setProperty('TOK_'+tok, String(now + TOKEN_DAYS*86400000));
  var must = mustChange_(), res = {ok:true, token:tok, mustChange: must};
  if (!must) res.boot = api_boot({}, tok);     // بيانات الصفحة في الطلب نفسه: لا رحلة ثانية بعد الدخول
  return res;
}

/**
 * طلب واحد يُقلع به المتصفح: الإعدادات + القوائم + الفوائد.
 * إن أرسل المتصفح رقم النسخة الذي عنده ولم يتغيّر شيء عاد {same:true} فقط دون قراءة الجدول.
 */
function api_boot(a, token){
  a = a || {};
  var owner = validToken_(token), must = owner && mustChange_(), ver = ver_();
  var out = {owner:owner, mustChange:must, ver:ver};
  if (must) return out;
  out.q = api_qplans({}, token);
  if (a.ver && String(a.ver) === ver && !!a.owner === owner) { out.same = true; return out; }
  out.settings = owner ? api_settingsOwner() : api_settings();
  out.meta = owner ? api_meta() : api_metaPublic();
  out.items = owner ? api_list() : api_listPublic();
  return out;
}

function purgeTokens_(){
  var p = PropertiesService.getScriptProperties(), all = p.getProperties(), now = Date.now();
  Object.keys(all).forEach(function(k){
    if (k.indexOf('TOK_') === 0 && Number(all[k]) < now) p.deleteProperty(k);
  });
}

function validToken_(tok){
  if (!tok) return false;
  var p = PropertiesService.getScriptProperties();
  var exp = p.getProperty('TOK_'+tok);
  if (!exp) return false;
  if (Number(exp) < Date.now()) { p.deleteProperty('TOK_'+tok); return false; }
  return true;
}

function api_checkToken(){ return {ok:true, mustChange: mustChange_()}; }

function api_logout(a, token){
  PropertiesService.getScriptProperties().deleteProperty('TOK_'+token);
  return {ok:true};
}

function api_changePassword(a){
  var p = PropertiesService.getScriptProperties();
  if (hash_(p.getProperty('SALT') + String(a.old||'')) !== p.getProperty('PWHASH'))
    return {ok:false, error:'كلمة المرور الحالية غير صحيحة'};
  var neu = String(a.neu||'');
  if (neu.length < 6) return {ok:false, error:'كلمة المرور قصيرة — ستة أحرف على الأقل'};
  if (neu === String(a.old||'')) return {ok:false, error:'اختر كلمة مختلفة عن الحالية'};
  setPassword_(neu);
  p.deleteProperty('MUSTCHANGE');
  return {ok:true};
}

/* ===================== الإعدادات ===================== */
function settingsAll_(){
  var sh = getSheet_(SH.T, HEAD_T), o = {};
  if (sh.getLastRow() > 1)
    sh.getRange(2,1,sh.getLastRow()-1,2).getValues().forEach(function(r){ if (r[0]) o[String(r[0])] = String(r[1]); });
  return o;
}

/** للزوار: المفاتيح العامة فقط — لا تحتوي كلمة مرور ولا شيئًا خاصًّا إطلاقًا. */
function api_settings(){
  var all = settingsAll_(), o = {};
  DEFAULT_SETTINGS.forEach(function(d){
    if (d[2]) o[d[0]] = (all[d[0]] !== undefined) ? all[d[0]] : d[1];
  });
  return o;
}

function api_settingsOwner(){
  var all = settingsAll_(), o = {};
  DEFAULT_SETTINGS.forEach(function(d){ o[d[0]] = (all[d[0]] !== undefined) ? all[d[0]] : d[1]; });
  var p = PropertiesService.getScriptProperties();
  o['رد تلقائي'] = p.getProperty('AUTOREPLY') || 'لا';
  o['نص الرد التلقائي'] = p.getProperty('AUTOTEXT') || DEFAULT_AUTOTEXT;
  return o;
}

function api_saveSettings(a){
  return withLock_(20000, function(){
    var sh = getSheet_(SH.T, HEAD_T), obj = a.settings || {};
    var known = {}; DEFAULT_SETTINGS.forEach(function(d){ known[d[0]] = 1; });
    var p = PropertiesService.getScriptProperties();
    var existing = sh.getLastRow() > 1 ? sh.getRange(2,1,sh.getLastRow()-1,1).getValues().map(function(r){return String(r[0])}) : [];
    Object.keys(obj).forEach(function(k){
      var v = clip_(obj[k], 2000);
      if (PRIV_KEYS[k]) { p.setProperty(PRIV_KEYS[k], v); return; }
      if (!known[k]) return;                     // لا تُقبل مفاتيح مجهولة
      var i = existing.indexOf(k);
      if (i >= 0) sh.getRange(i+2,2).setValue(v);
      else { appendText_(sh,[k, v]); existing.push(k); }
    });
    return api_settingsOwner();
  });
}

/* ===================== الأشخاص (القائلون والوسطاء) ===================== */
function peopleRows_(){
  var sh = getSheet_(SH.S, HEAD_S), last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2,1,last-1,HEAD_S.length).getValues().map(function(r,i){
    return {name:String(r[0]||''), aliases:splitList_(r[1]), death:String(r[2]||''), bio:String(r[3]||''),
            hide:String(r[4]||''), rep:String(r[5]||''), dua:String(r[6]||''), _row:i+2};
  }).filter(function(p){ return p.name; });
}

/** فهرس بالاسم المعتمد وبدائله بعد التطبيع الإملائي. */
function personIndex_(){
  var rows = peopleRows_(), by = {};
  rows.forEach(function(p){ by[norm_(p.name)] = p; });
  rows.forEach(function(p){ p.aliases.forEach(function(al){ var k = norm_(al); if (k && !by[k]) by[k] = p; }); });
  return {rows:rows, by:by};
}

/** يوحّد الاسم: إن كان اسمًا بديلًا أو بإملاء مختلف عاد الاسم المعتمد. */
function canon_(name, idx){
  name = clip_(name, 100);
  if (!name) return '';
  var p = idx.by[norm_(name)];
  return p ? p.name : name;
}

function api_people(){
  return peopleRows_().map(function(p){ delete p._row; return p; });
}

function api_savePerson(a){
  return withLock_(30000, function(){
    var d = a.data || {}, old = trim_(a.name), name = clip_(d.name, 100);
    if (!name) throw new Error('الاسم فارغ');
    var sh = getSheet_(SH.S, HEAD_S);
    var rows = peopleRows_();
    var cur = null;
    rows.forEach(function(p){ if (p.name === old) cur = p; });
    if (old && !cur) throw new Error('لم يُوجد الشخص');
    if (old && name !== old) {
      if (rows.some(function(p){ return p.name === name; })) throw new Error('الاسم الجديد موجود — استعمل «دمج» بدل التسمية');
      applyMeta_('speakers', old, name, false, true);
      rows = peopleRows_(); rows.forEach(function(p){ if (p.name === name) cur = p; });
    }
    var al = d.aliases || [];
    var aliases = splitList_(Array.isArray(al) ? al.join('،') : al)
      .filter(function(x){ return norm_(x) !== norm_(name); });
    var hide = ['الاسم','كل شيء'].indexOf(d.hide) >= 0 ? d.hide : '';
    var row = [name, aliases.join('، '), clip_(d.death,20), clip_(d.bio,1000), hide, clip_(d.rep,100), clip_(d.dua,60)];
    if (cur) sh.getRange(cur._row,1,1,HEAD_S.length).setValues([row]);
    else appendText_(sh, row);
    return api_people();
  });
}

function addAlias_(canonical, alias){
  alias = trim_(alias);
  if (!alias || norm_(alias) === norm_(canonical)) return;
  var sh = getSheet_(SH.S, HEAD_S);
  var rows = peopleRows_(), cur = null;
  rows.forEach(function(p){ if (p.name === canonical) cur = p; });
  if (!cur) { appendText_(sh,[canonical, alias, '', '', '', '', '']); return; }
  var have = cur.aliases.map(norm_);
  if (have.indexOf(norm_(alias)) >= 0) return;
  cur.aliases.push(alias);
  sh.getRange(cur._row, 2).setValue(cur.aliases.join('، '));
}

/** يضيف الأسماء الجديدة دفعةً واحدة إلى ورقة القائلين. */
function registerPeople_(names, idx){
  var seen = {}, add = [];
  names.forEach(function(n){
    n = trim_(n);
    if (!n) return;
    var k = norm_(n);
    if (idx.by[k] || seen[k]) return;
    seen[k] = 1; add.push([n,'','','','','','']);
  });
  if (!add.length) return;
  var sh = getSheet_(SH.S, HEAD_S);
  writeRows_(sh, sh.getLastRow() + 1, add, HEAD_S.length);
  add.forEach(function(r){ idx.by[norm_(r[0])] = {name:r[0], aliases:[], hide:'', rep:'', dua:''}; });
}

/* ===================== قراءة الفوائد ===================== */
var _ALL = null;
/** تُقرأ الورقة مرة واحدة في الطلب الواحد مهما تعدّدت الدوال التي تحتاجها. */
function readAll_(){
  if (_ALL) return _ALL.slice();
  var sh = fsheet_(), last = sh.getLastRow();
  if (last < 2) return (_ALL = []).slice();
  var vals = sh.getRange(2,1,last-1,COLS.length).getValues();
  _ALL = vals.map(function(r,i){ return rowToObj_(r, i+2); }).filter(function(o){ return o.id; });
  return _ALL.slice();
}

function rowToObj_(r, rowNum){
  return {
    id:String(r[0]||''), title:String(r[1]||''), text:String(r[2]||''), type:String(r[3]||''),
    speaker:String(r[4]||''), ref:String(r[5]||''), locus:String(r[6]||''), via:String(r[7]||''),
    link:String(r[8]||''), cat:String(r[9]||''),
    tags:splitList_(r[10]),
    note:String(r[11]||''), visibility:String(r[12]||'خاصة'), status:String(r[13]||'منشورة'),
    starred: r[14] === true || String(r[14]) === 'نعم',
    related:String(r[15]||''), createdHijri:String(r[16]||''),
    createdAt: toIso_(r[17]), updatedAt: toIso_(r[18]), prevStatus:String(r[19]||''),
    rstage:String(r[20]||''), rnext: toIso_(r[21]),
    series:String(r[22]||''), sorder:Number(r[23]||0)||0, anchor:String(r[24]||''),
    medium:String(r[25]||''), pubNo:String(r[26]||''), pubDate: toIso_(r[27]),
    verify: String(r[28]) === 'نعم',
    hide: splitList_(r[29]).filter(function(k){ return HIDE_KEYS.indexOf(k) >= 0; }),
    gain: String(r[30]||''), vlocus: String(r[31]||''), paraphrase: String(r[32]) === 'نعم',
    _row: rowNum
  };
}

function objToRow_(o){
  return [o.id, o.title||'', o.text||'', o.type||'', o.speaker||'', o.ref||'', o.locus||'', o.via||'', o.link||'', o.cat||'',
          (o.tags||[]).join('، '), o.note||'', o.visibility||'خاصة', o.status||'منشورة', o.starred?'نعم':'لا',
          o.related||'', o.createdHijri||'', o.createdAt||'', o.updatedAt||'', o.prevStatus||'',
          o.rstage||'', o.rnext||'', o.series||'', o.sorder||'', o.anchor||'',
          o.medium||'', o.pubNo||'', o.pubDate||'', o.verify?'نعم':'', (o.hide||[]).join('،'), o.gain||'', o.vlocus||'', o.paraphrase?'نعم':''];
}

function toIso_(v){
  if (!v) return '';
  if (v instanceof Date) return v.toISOString();
  return String(v);
}

function pub_(o){
  var c = JSON.parse(JSON.stringify(o));
  ['_row','note','prevStatus','rstage','rnext','verify','hide','pubNo','pubDate','related'].forEach(function(k){ delete c[k]; });
  return c;
}
function own_(o){ o = JSON.parse(JSON.stringify(o)); delete o._row; return o; }

function findRow_(id){
  var sh = fsheet_(), last = sh.getLastRow();
  if (last < 2) return 0;
  var ids = sh.getRange(2,1,last-1,1).getValues();
  for (var i=0;i<ids.length;i++) if (String(ids[i][0]) === id) return i+2;
  return 0;
}

function byNew_(a,b){ return String(b.createdAt).localeCompare(String(a.createdAt)); }

/* ===================== دوال الزوار (لا تُرجع الخاص ولا المخفي أبدًا) ===================== */
/**
 * الفوائد التي يراها الزائر بعد تطبيق كل قواعد الإخفاء — في الخادم لا في الصفحة:
 *  - تُستبعد: الخاصة، والمسودات، والمحذوفة، وما عُلِّم «يحتاج تحقق».
 *  - من أُخفي «كل ما يتعلق به» تُستبعد فوائده (قائلًا كان أو وسيطًا).
 *  - من أُخفي «اسمه» يُحذف اسمه أو يُستبدل بعبارته البديلة.
 *  - الإخفاءات العامة من الإعدادات، والإخفاءات الخاصة بفائدة بعينها.
 */
function publicItems_(){
  var set = settingsAll_(), pidx = personIndex_();
  var g = {
    speaker: set['إخفاء القائل']==='نعم', via: set['إخفاء الوسيط']==='نعم',
    ref: set['إخفاء المرجع']==='نعم', link: set['إخفاء الرابط']==='نعم', dates: set['إخفاء التواريخ']==='نعم'
  };
  var items = readAll_().sort(byNew_), out = [], rauth = refAuthors_(pidx), bhide = refHides_();
  var hiddenNames = pidx.rows.filter(function(p){ return p.hide === 'الاسم'; });
  items.forEach(function(o){
    if (o.visibility !== 'عامة' || o.status !== 'منشورة' || o.verify) return;
    var ps = o.speaker ? pidx.by[norm_(o.speaker)] : null;
    var pv = o.via ? pidx.by[norm_(o.via)] : null;
    var pvb = o.via ? bookAuthor_(o.via, rauth) : null;      // مؤلف كتاب الوسيط
    var prb = o.ref ? bookAuthor_(o.ref, rauth) : null;      // مؤلف كتاب المرجع
    var hr = o.ref ? bookHide_(o.ref, bhide) : '', hv = o.via ? bookHide_(o.via, bhide) : '';
    if (hr === 'كل شيء' || hv === 'كل شيء') return;
    if ([ps,pv,pvb,prb].some(function(p){ return p && p.hide === 'كل شيء'; })) return;
    var c = pub_(o), h = o.hide || [];
    c.dua = (ps && ps.dua) || '';
    if (ps && ps.hide === 'الاسم') { c.speaker = ps.rep || ''; c.dua = ''; }
    // الوسيط: شخصًا كان أو كتابًا لمحجوب الاسم، لا يظهر اسمه ولا مصدره
    if (pv && pv.hide === 'الاسم') c.via = pv.rep || '';
    if (pvb && pvb.hide === 'الاسم') c.via = '';
    if (hr === 'المرجع') { c.ref = ''; c.locus = ''; }
    if (hv === 'المرجع') { c.via = ''; c.vlocus = ''; }
    hiddenNames.forEach(function(p){ c.ref = scrubName_(c.ref, p); c.via = scrubName_(c.via, p); });
    if (g.speaker || h.indexOf('speaker') >= 0) { c.speaker = ''; c.dua = ''; }
    if (g.via || h.indexOf('via') >= 0) c.via = '';
    if (!c.via) c.vlocus = '';
    if (g.ref || h.indexOf('ref') >= 0) { c.ref = ''; c.locus = ''; }
    if (g.link || h.indexOf('link') >= 0) c.link = '';
    if (g.dates) { c.createdAt = ''; c.createdHijri = ''; c.updatedAt = ''; }
    out.push(c);
  });
  return out;
}

/** كتاب ← مؤلفه (من فهرس المراجع)، ليشمل الإخفاءُ مؤلفَ الكتاب لا القائل وحده. */
/** إخفاء الكتب عن الزوار: العنوان ← '' | 'المرجع' (يُحذف اسم الكتاب وتبقى الفائدة) | 'كل شيء' (تُحجب فوائده). */
function refHides_(){
  var m = {}, rs = getSheet_(SH.R, HEAD_R);
  if (rs.getLastRow() > 1) rs.getRange(2,1,rs.getLastRow()-1,5).getValues().forEach(function(r){
    var h = String(r[4]||''); if (r[0] && (h === 'المرجع' || h === 'كل شيء')) m[norm_(r[0])] = h;
  });
  return m;
}
function bookHide_(text, m){
  var t = norm_(String(text||'').replace(/\s*(ص\s*[\d٠-٩]+|[\d٠-٩]+\s*\/\s*[\d٠-٩]+)\s*$/,''));
  return t ? (m[t] || '') : '';
}
function refAuthors_(pidx){
  var m = {}, rs = getSheet_(SH.R, HEAD_R);
  if (rs.getLastRow() > 1) rs.getRange(2,1,rs.getLastRow()-1,2).getValues().forEach(function(r){
    var t = norm_(String(r[0]||'')), a = String(r[1]||'').trim();
    if (t && a) m[t] = pidx.by[norm_(a)] || {name:a, hide:'', aliases:[]};
  });
  return m;
}
function bookAuthor_(text, m){
  var t = norm_(String(text||'').replace(/\s*(ص\s*[\d٠-٩]+|[\d٠-٩]+\s*\/\s*[\d٠-٩]+)\s*$/,''));
  return t ? (m[t] || null) : null;
}
/** يحذف «لفلان» من نص مرجع أو وسيط قديم (مثل «أعمال القلوب لخالد السبت») إن كان فلان محجوب الاسم. أسماء العناوين (تفسير ابن كثير) تبقى. */
function scrubName_(text, p){
  if (!text || !p) return text;
  [p.name].concat(p.aliases || []).filter(Boolean).forEach(function(n){
    var esc = String(n).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    text = text.replace(new RegExp('\\s+ل(?:ـ)?(?:ال)?'+esc+'(?=\\s|$)','g'), '');
  });
  return text.replace(/\s{2,}/g,' ').trim();
}

function api_listPublic(){ return publicItems_(); }

function api_getPublic(a){
  var id = String(a.id), r = publicItems_().filter(function(x){ return x.id === id; })[0];
  return r || null;
}

function api_metaPublic(){
  var items = publicItems_(), set = api_settings();
  var cats = listCol_(getSheet_(SH.C, HEAD_C), 1, 6, 'مفعّل');
  var used = {}, sp = {}, rf = {}, tg = {}, books = bookSet_();
  items.forEach(function(o){
    if (o.cat) used[o.cat] = 1;
    if (o.speaker) sp[o.speaker] = 1;
    if (o.via) { if (isBook_(o.via, books)) rf[o.via] = 1; else sp[o.via] = 1; }
    if (o.ref) rf[o.ref] = 1;
    (o.tags||[]).forEach(function(t){ tg[t] = 1; });
  });
  var catList = cats.filter(function(c){ return used[c]; });
  Object.keys(used).forEach(function(c){ if (catList.indexOf(c) < 0) catList.push(c); });
  return { categories:catList, speakers:Object.keys(sp), refs:Object.keys(rf), tags:Object.keys(tg),
           types:splitList_(set['أنواع الفوائد'] || DEFAULT_TYPES.join('، ')),
           mediums:splitList_(set['وسائل التلقي'] || MEDIUMS.join('، ')) };
}

/* ===================== دوال المالك ===================== */
function api_list(){
  return readAll_().filter(function(o){ return o.status !== 'محذوفة'; }).map(own_).sort(byNew_);
}
function api_trash(){
  return readAll_().filter(function(o){ return o.status === 'محذوفة'; }).map(own_).sort(byNew_);
}
function api_get(a){
  var o = readAll_().filter(function(x){ return x.id === String(a.id); })[0];
  return o ? own_(o) : null;
}

/** المراجع مع مؤلفيها: [{t:العنوان, a:المؤلف}] لقوائم المحرر المترابطة. */
function refsFull_(){
  var rs = getSheet_(SH.R, HEAD_R);
  return rs.getLastRow() > 1 ? rs.getRange(2,1,rs.getLastRow()-1,5).getValues().filter(function(r){ return r[0]; }).map(function(r){ return {t:String(r[0]), a:String(r[1]||''), h:String(r[4]||'')}; }) : [];
}

function api_meta(){
  var items = readAll_().filter(function(o){ return o.status !== 'محذوفة'; });
  var set = settingsAll_(), pidx = personIndex_();
  var cats = listCol_(getSheet_(SH.C, HEAD_C), 1, 6, 'مفعّل');
  var sp = pidx.rows.map(function(p){ return p.name; });
  var rf = listCol_(getSheet_(SH.R, HEAD_R), 1);
  var tags = {}, books = bookSet_();
  items.forEach(function(o){
    (o.tags||[]).forEach(function(t){ tags[t] = 1; });
    if (o.speaker && sp.indexOf(o.speaker)<0) sp.push(o.speaker);
    if (o.via) { if (isBook_(o.via, books)) { if (rf.indexOf(o.via)<0) rf.push(o.via); } else if (sp.indexOf(o.via)<0) sp.push(o.via); }
    if (o.ref && rf.indexOf(o.ref)<0) rf.push(o.ref);
    if (o.cat && cats.indexOf(o.cat)<0) cats.push(o.cat);
  });
  return { categories:cats, speakers:sp, refs:rf, tags:Object.keys(tags),
           types:splitList_(set['أنواع الفوائد'] || DEFAULT_TYPES.join('، ')),
           mediums:splitList_(set['وسائل التلقي'] || MEDIUMS.join('، ')),
           people: pidx.rows.map(function(p){ return {n:p.name, a:p.aliases, d:p.dua}; }),
           refsFull: refsFull_(),
           inbox: countNewMessages_() };
}

function listCol_(sh, col, statusCol, statusVal){
  if (!sh || sh.getLastRow() < 2) return [];
  var n = sh.getLastColumn();
  return sh.getRange(2,1,sh.getLastRow()-1,n).getValues()
    .filter(function(r){ return r[col-1] && (!statusCol || !r[statusCol-1] || r[statusCol-1]===statusVal); })
    .map(function(r){ return String(r[col-1]); });
}

/* ---------- التنقية (كل ما يدخل من الصفحة يُنقّى هنا) ---------- */
/** يُنقّي الحقول المُرسَلة فقط؛ ما لم يُرسَل يبقى undefined فلا يُمحى ما في الجدول. */
function sanitize_(src, idx){
  var o = {}, has = function(k){ return src[k] !== undefined && src[k] !== null; };
  var S = function(k,n){ if (has(k)) o[k] = clip_(src[k], n); };
  S('id',20); S('title',200); S('text',TEXT_MAX); S('type',40); S('ref',300); S('locus',100); S('vlocus',100);
  if (has('paraphrase')) o.paraphrase = src.paraphrase === true || /^(نعم|true|1|yes)$/i.test(String(src.paraphrase));   // الأصل: بالنص
  S('cat',100); S('gain',600); S('note',3000); S('related',200); S('series',150); S('anchor',200);
  if (has('speaker')) o.speaker = canon_(src.speaker, idx);
  if (has('via')) o.via = canon_(src.via, idx);
  if (has('link')) o.link = safeUrl_(src.link);
  if (has('tags')) {
    var t = Array.isArray(src.tags) ? src.tags : splitList_(src.tags);
    o.tags = t.map(function(x){ return clip_(String(x).replace(/^#/,''), 40); }).filter(String).slice(0,30);
  }
  if (has('visibility')) o.visibility = src.visibility === 'عامة' ? 'عامة' : 'خاصة';
  if (has('status')) o.status = ['منشورة','مسودة','محذوفة'].indexOf(src.status) >= 0 ? src.status : 'منشورة';
  if (has('starred')) o.starred = src.starred === true || src.starred === 'نعم' || src.starred === 1;
  if (has('verify')) o.verify = src.verify === true || src.verify === 'نعم' || src.verify === 1;
  if (has('sorder')) o.sorder = Number(src.sorder) || '';
  if (has('rstage')) o.rstage = clip_(src.rstage, 10);
  if (has('rnext')) o.rnext = isoOrEmpty_(src.rnext);
  if (has('medium')) o.medium = MEDIUMS.indexOf(src.medium) >= 0 ? src.medium : '';
  if (has('pubNo')) o.pubNo = String(src.pubNo).replace(/[^\d]/g,'').slice(0,6);
  if (has('pubDate')) o.pubDate = isoOrEmpty_(src.pubDate);
  if (has('hide')) {
    var h = Array.isArray(src.hide) ? src.hide : splitList_(src.hide);
    o.hide = h.filter(function(k){ return HIDE_KEYS.indexOf(k) >= 0; });
  }
  return o;
}

/** عناوين الكتب في فهرس المراجع (مفتاح مُنقّى) — الوسيط الذي يطابق أحدها كتابٌ لا شخص. */
function bookSet_(){
  var m = {}, rs = getSheet_(SH.R, HEAD_R);
  listCol_(rs, 1).forEach(function(t){ m[norm_(t)] = 1; });
  return m;
}
function isBook_(name, m){
  var t = norm_(String(name||'').replace(/\s*(ص\s*[\d٠-٩]+|[\d٠-٩]+\s*\/\s*[\d٠-٩]+)\s*$/,''));
  return !!(t && m[t]);
}

/** يسجّل ما جدّ من قائلين ومراجع وتصنيفات في الأوراق المساعدة. */
function registerMeta_(o, idx){
  var names = [], books = bookSet_();
  if (o.speaker) names.push(o.speaker);
  var viaBook = o.via && isBook_(o.via, books);
  if (o.via && !viaBook) names.push(o.via);
  registerPeople_(names, idx);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (o.ref) addIfNew_(getSheet_(SH.R, HEAD_R), o.ref, HEAD_R.length);
  if (o.cat) addIfNew_(getSheet_(SH.C, HEAD_C), o.cat, HEAD_C.length, ['','','',9999,'مفعّل']);
}
function addIfNew_(sh, val, width, tail){
  if (!sh) return;
  var k = norm_(val);
  if (listCol_(sh,1).some(function(x){ return norm_(x) === k; })) return;
  var row = [val].concat(tail || new Array(width-1).fill(''));
  appendText_(sh, row);
}

/* ---------- الكتابة (كلها تحت قفل) ---------- */
function api_save(a){
  return withLock_(20000, function(){
    var sh = fsheet_(), now = new Date(), idx = personIndex_();
    var o = sanitize_(a.item || {}, idx);

    if (o.id) {
      var row = findRow_(String(o.id));
      if (!row) throw new Error('لم تُوجد الفائدة');
      var cur = rowToObj_(sh.getRange(row,1,1,COLS.length).getValues()[0], row);
      Object.keys(cur).forEach(function(k){ if (k !== '_row' && o[k] === undefined) o[k] = cur[k]; });
      if (!o.text) throw new Error('نص الفائدة فارغ');
      o.createdAt = cur.createdAt; o.createdHijri = cur.createdHijri; o.prevStatus = cur.prevStatus;
      var cd = isoOrEmpty_((a.item || {}).createdAt);   // تغيير تاريخ الفائدة يدويًا
      if (cd && cd.slice(0,10) !== String(cur.createdAt).slice(0,10)) { o.createdAt = cd; o.createdHijri = hijri_(new Date(cd)); }
      o.updatedAt = now.toISOString();
      sh.getRange(row,1,1,COLS.length).setValues([objToRow_(o)]);
    } else {
      if (!o.text) throw new Error('اكتب نص الفائدة');
      o.id = nextId_();
      o.visibility = o.visibility || 'خاصة';
      o.status = o.status || ((o.speaker || o.ref) ? 'منشورة' : 'مسودة');
      var cd2 = isoOrEmpty_((a.item || {}).createdAt), when = cd2 ? new Date(cd2) : now;   // الأصل: تاريخ اليوم
      o.createdAt = when.toISOString();
      o.createdHijri = hijri_(when);
      o.updatedAt = now.toISOString();
      o.tags = o.tags || [];
      appendText_(sh, objToRow_(o));
    }
    registerMeta_(o, idx);
    return {id:o.id};
  });
}

function nextId_(){
  var p = PropertiesService.getScriptProperties();
  var n = Number(p.getProperty('COUNTER')||0), id;
  if (!n) readAll_().forEach(function(o){ var k=Number(String(o.id).replace(/\D/g,'')); if(k>n) n=k; });
  do { n++; id = 'F-' + ('000000'+n).slice(-6); } while (findRow_(id));   // تحقق رخيص من عمود المعرّفات فقط
  p.setProperty('COUNTER', String(n));
  return id;
}

function api_setField(a){
  return withLock_(20000, function(){
    var allowed = {starred:15, visibility:13, status:14, cat:10, note:12,
                   series:23, sorder:24, anchor:25, rstage:21, rnext:22,
                   medium:26, pubNo:27, pubDate:28, verify:29, hide:30};
    var col = allowed[a.field];
    if (!col) throw new Error('حقل غير مسموح');
    var row = findRow_(String(a.id)); if (!row) throw new Error('لم تُوجد الفائدة');
    var tmp = {}; tmp[a.field] = a.value;
    var v = sanitize_(tmp, {by:{}})[a.field];
    if (a.field === 'starred') v = v ? 'نعم' : 'لا';
    if (a.field === 'verify') v = v ? 'نعم' : '';
    if (a.field === 'hide') v = (v||[]).join('،');
    if (v === undefined) v = '';
    var sh = fsheet_();
    sh.getRange(row, col).setValue(v);
    sh.getRange(row, 19).setValue(new Date().toISOString());
    return {ok:true};
  });
}

function api_remove(a){
  return withLock_(20000, function(){
    var row = findRow_(String(a.id)); if (!row) throw new Error('لم تُوجد الفائدة');
    var sh = fsheet_();
    sh.getRange(row,20).setValue(sh.getRange(row,14).getValue()); // الحالة السابقة
    sh.getRange(row,14).setValue('محذوفة');
    return {ok:true};
  });
}

function api_restore(a){
  return withLock_(20000, function(){
    var row = findRow_(String(a.id)); if (!row) throw new Error('لم تُوجد الفائدة');
    var sh = fsheet_();
    var prev = String(sh.getRange(row,20).getValue() || 'منشورة');
    sh.getRange(row,14).setValue(prev === 'محذوفة' ? 'منشورة' : prev);
    return {ok:true};
  });
}

/** الحذف النهائي: لا يُحذف الصف، بل يُنقل إلى ورقة «المحذوف نهائيًا» صيانةً للبيانات. */
function api_purge(a){
  return withLock_(20000, function(){
    var sh = fsheet_();
    var row = findRow_(String(a.id)); if (!row) throw new Error('لم تُوجد الفائدة');
    var arch = getSheet_(SH.A, COLS);
    appendText_(arch, sh.getRange(row,1,1,COLS.length).getValues()[0]);
    sh.deleteRow(row);
    return {ok:true};
  });
}

function api_emptyTrash(){
  return withLock_(60000, function(){
    var sh = fsheet_(), last = sh.getLastRow();
    if (last < 2) return {count:0};
    var vals = sh.getRange(2,1,last-1,COLS.length).getValues();
    var del = [];
    vals.forEach(function(r,i){ if (String(r[13]) === 'محذوفة') del.push(i); });
    if (!del.length) return {count:0};
    var arch = getSheet_(SH.A, COLS);
    writeRows_(arch, arch.getLastRow() + 1, del.map(function(i){ return vals[i]; }), COLS.length);
    for (var k=del.length-1;k>=0;k--) sh.deleteRow(del[k]+2);   // من الأسفل لئلا تتزحزح الصفوف
    return {count:del.length};
  });
}

/**
 * إجراء جماعي بنداء واحد: على معرّفات محدّدة أو على الكل (all:true).
 * op: visibility (value: عامة|خاصة) · starred (value: true|false) · trash (إلى السلة، يمكن استعادته)
 * لا يمسّ المحذوفات (إلا بالاستعادة من السلة).
 */
function api_bulk(a){
  return withLock_(60000, function(){
    var sh = fsheet_(), last = sh.getLastRow();
    if (last < 2) return {count:0};
    var n = last - 1, ids = sh.getRange(2,1,n,1).getValues(), want = null, op = String(a.op || '');
    if (['visibility','starred','trash'].indexOf(op) < 0) throw new Error('إجراء غير مسموح');
    if (!a.all) { want = {}; (a.ids || []).slice(0,5000).forEach(function(i){ want[String(i)] = 1; }); }
    var col = {visibility:13, starred:15, trash:14}[op];
    var cur = sh.getRange(2,col,n,1).getValues(), stt = sh.getRange(2,14,n,1).getValues();
    var prev = sh.getRange(2,20,n,1).getValues(), upd = sh.getRange(2,19,n,1).getValues(), now = new Date().toISOString(), c = 0;
    var val = op === 'visibility' ? (a.value === 'عامة' ? 'عامة' : 'خاصة') : (op === 'starred' ? (a.value ? 'نعم' : 'لا') : 'محذوفة');
    for (var i = 0; i < n; i++) {
      if (!ids[i][0] || String(stt[i][0]) === 'محذوفة') continue;
      if (want && !want[String(ids[i][0])]) continue;
      if (op === 'trash') { prev[i][0] = stt[i][0]; }
      cur[i][0] = val; upd[i][0] = now; c++;
    }
    sh.getRange(2,col,n,1).setValues(cur);
    sh.getRange(2,19,n,1).setValues(upd);
    if (op === 'trash') sh.getRange(2,20,n,1).setValues(prev);
    return {count:c};
  });
}

/* ===================== المراجع (الكتب): مؤلف وإخفاء ===================== */
function api_refs(){ return refsFull_(); }
function api_saveRef(a){
  return withLock_(30000, function(){
    var t = clip_(a.title, 300); if (!t) throw new Error('العنوان فارغ');
    var rs = getSheet_(SH.R, HEAD_R), last = rs.getLastRow(), k = norm_(t), row = 0, cur = ['','','','',''];
    if (last > 1) rs.getRange(2,1,last-1,HEAD_R.length).getValues().some(function(r,i){ if (norm_(String(r[0])) === k) { row = i+2; cur = r.map(String); return true; } return false; });
    if (a.author !== undefined) cur[1] = clip_(a.author, 100);
    if (a.kind !== undefined) cur[2] = clip_(a.kind, 40);
    if (a.edition !== undefined) cur[3] = clip_(a.edition, 300);
    if (a.hide !== undefined) cur[4] = ['المرجع','كل شيء'].indexOf(a.hide) >= 0 ? a.hide : '';
    cur[0] = cur[0] || t;
    if (row) rs.getRange(row,1,1,HEAD_R.length).setNumberFormat('@').setValues([cur]);
    else appendText_(rs, cur);
    if (cur[1]) registerPeople_([cur[1]], personIndex_());
    return {ok:true};
  });
}

/* ===================== القِطاف: خطط قراءة الفوائد وسجلها ===================== */
function qSheet_(create){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!create) return ss.getSheetByName(SH.Q);
  return getSheet_(SH.Q, HEAD_Q);
}
function qRows_(sh){
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2,1,sh.getLastRow()-1,HEAD_Q.length).getValues().map(function(r,i){
    var cfg = {}, state = {};
    try { cfg = JSON.parse(String(r[2]||'{}')); } catch (e) {}
    try { state = JSON.parse(String(r[6]||'{}')); } catch (e) {}
    return {id:String(r[0]), name:String(r[1]), cfg:cfg, status:String(r[3]||'نشطة'), order:Number(r[4])||0,
            vis:String(r[5]||'لي'), state:state, createdAt:String(r[7]||''), _row:i+2};
  }).filter(function(p){ return p.id; });
}
function qPlan_(p, owner){
  var o = {id:p.id, name:p.name, cfg:p.cfg, status:p.status, order:p.order, vis:p.vis, createdAt:p.createdAt};
  if (owner) o.state = p.state;
  return o;
}
/** الزائر يرى خطط «لي وللزوار» غير المسودة فقط، بلا حالتها. */
function api_qplans(a, token){
  var owner = validToken_(token), sh = qSheet_(false);
  var rows = qRows_(sh).sort(function(x,y){ return x.order - y.order; });
  if (!owner) rows = rows.filter(function(p){ return p.vis === 'الزوار' && p.status === 'نشطة'; });
  return rows.map(function(p){ return qPlan_(p, owner); });
}
function qClean_(x){
  var cfg = x.cfg && typeof x.cfg === 'object' ? x.cfg : {};
  return JSON.stringify(cfg).slice(0, 20000);
}
function api_qsave(a){
  return withLock_(30000, function(){
    var x = a.plan || {}, sh = qSheet_(true), rows = qRows_(sh), cur = null;
    if (x.id) cur = rows.filter(function(p){ return p.id === String(x.id); })[0] || null;
    var name = clip_(x.name, 100) || 'قِطاف جديد';
    var status = ['نشطة','مسودة','منتهية'].indexOf(x.status) >= 0 ? x.status : 'نشطة';
    var vis = x.vis === 'الزوار' ? 'الزوار' : 'لي';
    var state = x.state && typeof x.state === 'object' ? JSON.stringify(x.state).slice(0, 45000) : (cur ? JSON.stringify(cur.state) : '{}');
    if (cur) {
      var ord = x.order !== undefined ? Number(x.order) || 0 : cur.order;
      sh.getRange(cur._row,1,1,HEAD_Q.length).setNumberFormat('@').setValues([[cur.id, name, qClean_(x), status, String(ord), vis, state, cur.createdAt]]);
      return {id:cur.id};
    }
    var n = 0; rows.forEach(function(p){ var k = Number(String(p.id).replace(/\D/g,'')); if (k > n) n = k; });
    var id = 'Q-' + ('0000'+(n+1)).slice(-4), mo = 0; rows.forEach(function(p){ if (p.order > mo) mo = p.order; });
    appendText_(sh, [id, name, qClean_(x), status, String(x.order !== undefined ? Number(x.order)||0 : mo+1), vis, state, new Date().toISOString()]);
    return {id:id};
  });
}
function api_qdelete(a){
  return withLock_(30000, function(){
    var sh = qSheet_(false); if (!sh) return {ok:true};
    var r = qRows_(sh).filter(function(p){ return p.id === String(a.id); })[0];
    if (r) sh.deleteRow(r._row);
    return {ok:true};
  });
}
function api_qorder(a){
  return withLock_(30000, function(){
    var sh = qSheet_(false); if (!sh) return {ok:true};
    var rows = qRows_(sh), pos = {}; (a.ids || []).forEach(function(id,i){ pos[String(id)] = i+1; });
    rows.forEach(function(p){ if (pos[p.id]) sh.getRange(p._row,5).setNumberFormat('@').setValue(String(pos[p.id])); });
    return {ok:true};
  });
}
function api_qstate(a){
  return withLock_(30000, function(){
    var sh = qSheet_(false); if (!sh) throw new Error('لا خطط');
    var r = qRows_(sh).filter(function(p){ return p.id === String(a.id); })[0]; if (!r) throw new Error('لم تُوجد الخطة');
    sh.getRange(r._row,7).setNumberFormat('@').setValue(JSON.stringify(a.state || {}).slice(0, 45000));
    if (['نشطة','مسودة','منتهية'].indexOf(a.status) >= 0) sh.getRange(r._row,4).setValue(a.status);
    return {ok:true};
  });
}
/** «قرأتُ»: يسجّل الفوائد المقروءة في السجل ويحفظ حالة الخطة بنداء واحد. */
function api_qread(a){
  return withLock_(30000, function(){
    var g = getSheet_(SH.G, HEAD_G), now = new Date().toISOString(), ids = (a.items || []).slice(0, 100), plan = String(a.plan || '');
    if (ids.length) writeRows_(g, g.getLastRow() + 1, ids.map(function(id){ return [now, String(id), plan]; }), HEAD_G.length);
    var sh = qSheet_(false);
    if (sh && plan) {
      var r = qRows_(sh).filter(function(p){ return p.id === plan; })[0];
      if (r) {
        sh.getRange(r._row,7).setNumberFormat('@').setValue(JSON.stringify(a.state || {}).slice(0, 45000));
        if (['نشطة','مسودة','منتهية'].indexOf(a.status) >= 0) sh.getRange(r._row,4).setValue(a.status);
      }
    }
    return {ok:true, at:now};
  });
}
function api_qlog(){
  var g = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SH.G);
  if (!g || g.getLastRow() < 2) return [];
  var n = g.getLastRow() - 1, from = Math.max(2, g.getLastRow() - 40000 + 1);
  return g.getRange(from,1,g.getLastRow()-from+1,3).getValues().map(function(r){ return [toIso_(r[0]), String(r[1]), String(r[2])]; });
}

/** يُنقل كل ما في الكُنّاشة إلى السلة (لخيار «استبدال الكل» عند الاستيراد) — يمكن استعادته. */
function api_trashAll(){
  return withLock_(60000, function(){
    var sh = fsheet_(), last = sh.getLastRow();
    if (last < 2) return {count:0};
    var st = sh.getRange(2,14,last-1,1).getValues(), pv = sh.getRange(2,20,last-1,1).getValues(), n = 0;
    for (var i=0;i<st.length;i++){
      if (String(st[i][0]) !== 'محذوفة') { pv[i][0] = st[i][0]; st[i][0] = 'محذوفة'; n++; }
    }
    sh.getRange(2,14,last-1,1).setValues(st);
    sh.getRange(2,20,last-1,1).setValues(pv);
    return {count:n};
  });
}

function api_addMeta(a){
  return withLock_(20000, function(){
    var v = clip_(a.value, 100); if (!v) throw new Error('القيمة فارغة');
    if (a.kind === 'speakers') registerPeople_([v], personIndex_());
    else if (a.kind === 'refs') addIfNew_(getSheet_(SH.R, HEAD_R), v, HEAD_R.length);
    else if (a.kind === 'categories') addIfNew_(getSheet_(SH.C, HEAD_C), v, HEAD_C.length, ['','','',9999,'مفعّل']);
    else throw new Error('نوع غير معروف');
    return {ok:true};
  });
}

/* ===================== لوحة التحكم ===================== */
/** خريطة كل نوع: [اسم الورقة، رقم/أرقام العمود في ورقة الفوائد، هل هو حقل متعدد القيم، عناوين الورقة] */
var KINDS = {
  categories: {sheet:SH.C, heads:HEAD_C, cols:[10], multi:false, field:'cat'},
  speakers:   {sheet:SH.S, heads:HEAD_S, cols:[5,8], multi:false, field:['speaker','via']},
  refs:       {sheet:SH.R, heads:HEAD_R, cols:[6], multi:false, field:'ref'},
  tags:       {sheet:null, heads:null, cols:[11], multi:true, field:'tags'}
};

/** قوائم العناصر مع عدد الفوائد المرتبطة بكل عنصر. */
function api_metaCounts(){
  var items = readAll_().filter(function(o){ return o.status !== 'محذوفة'; });
  var out = {};
  Object.keys(KINDS).forEach(function(k){
    var K = KINDS[k], fields = [].concat(K.field), c = {};
    items.forEach(function(o){
      var seen = {};
      fields.forEach(function(f){
        var v = o[f];
        (K.multi ? (v||[]) : [v]).forEach(function(x){ if (x && !seen[x]) { seen[x] = 1; c[x] = (c[x]||0)+1; } });
      });
    });
    if (K.sheet) listCol_(getSheet_(K.sheet, K.heads),1).forEach(function(v){ if(!(v in c)) c[v]=0; });
    out[k] = Object.keys(c).sort(function(a,b){ return c[b]-c[a]; }).map(function(v){ return {value:v, count:c[v]}; });
  });
  return out;
}

function api_renameMeta(a){ return applyMeta_(a.kind, String(a.from), String(a.to), false); }
function api_mergeMeta(a){ return applyMeta_(a.kind, String(a.from), String(a.to), true); }

function applyMeta_(kind, from, to, merge, inLock){
  var K = KINDS[kind]; if (!K) throw new Error('نوع غير معروف');
  from = trim_(from); to = clip_(to, 100);
  if (!from || !to) throw new Error('القيمة فارغة');
  if (from === to) return {changed:0};
  var run = function(){
    var sh = fsheet_(), last = sh.getLastRow(), changed = 0;
    if (last >= 2) {
      K.cols.forEach(function(col){
        var rng = sh.getRange(2, col, last-1, 1), vals = rng.getValues(), dirty = false;
        for (var i=0;i<vals.length;i++){
          var cur = String(vals[i][0]||'');
          if (K.multi) {
            var parts = splitList_(cur);
            if (parts.indexOf(from) < 0) continue;
            var nw = []; parts.forEach(function(p){ var v = (p===from)?to:p; if (nw.indexOf(v)<0) nw.push(v); });
            vals[i][0] = nw.join('، '); changed++; dirty = true;
          } else if (cur === from) { vals[i][0] = to; changed++; dirty = true; }
        }
        if (dirty) rng.setValues(vals);
      });
    }
    if (K.sheet) {
      var ms = getSheet_(K.sheet, K.heads);
      if (ms.getLastRow() >= 2) {
        var names = ms.getRange(2,1,ms.getLastRow()-1,1).getValues().map(function(r){ return String(r[0]); });
        var iFrom = names.indexOf(from), iTo = names.indexOf(to);
        if (iFrom >= 0) {
          if (iTo >= 0) {
            // الاسم الجديد موجود: اضمم بدائل القديم إليه ثم احذف القديم
            if (kind === 'speakers') {
              var oldAl = splitList_(ms.getRange(iFrom+2,2).getValue());
              oldAl.forEach(function(al){ addAlias_(to, al); });
            }
            ms.deleteRow(iFrom+2);
          } else ms.getRange(iFrom+2,1).setValue(to);
        } else if (iTo < 0) addIfNew_(ms, to, K.heads.length, kind==='categories'?['','','',9999,'مفعّل']:undefined);
      } else addIfNew_(ms, to, K.heads.length, kind==='categories'?['','','',9999,'مفعّل']:undefined);
    }
    if (kind === 'speakers') addAlias_(to, from);   // يبقى القديم بديلًا فيتوحّد الاسم مستقبلًا
    return {changed:changed};
  };
  return inLock ? run() : withLock_(30000, run);
}

/** حذف عنصر من الورقة المساعدة — يُرفض إن كان مستعملًا في فوائد. */
function api_deleteMeta(a){
  var K = KINDS[a.kind]; if (!K || !K.sheet) throw new Error('نوع غير معروف');
  var counts = api_metaCounts()[a.kind].filter(function(x){ return x.value === String(a.value); })[0];
  if (counts && counts.count > 0)
    return {ok:false, error:'مستعمل في ' + counts.count + ' فائدة — أعد تسميته أو ادمجه بدل حذفه'};
  return withLock_(20000, function(){
    var ms = getSheet_(K.sheet, K.heads);
    var names = listCol_(ms,1), i = names.indexOf(String(a.value));
    if (i >= 0) ms.deleteRow(i+2);
    return {ok:true};
  });
}

/**
 * تنظيف الفهارس: يحذف من «القائلون» أو «المراجع» ما لا فائدة تستعمله (بعد حذفك فوائد من الجدول مباشرة مثلًا).
 * يُبقي من له فائدة (قائلًا أو وسيطًا أو مؤلفًا لكتاب مستعمل) ومن ضُبط له إخفاء.
 */
function api_cleanMeta(a){
  var kind = String(a.kind || '');
  if (['speakers','refs'].indexOf(kind) < 0) throw new Error('نوع غير معروف');
  return withLock_(60000, function(){
    var items = readAll_().filter(function(o){ return o.status !== 'محذوفة'; });
    var books = {}, people = {}, pidx = personIndex_();
    var mark = function(n){ var p = pidx.by[norm_(n)]; people[norm_(p ? p.name : n)] = 1; };
    items.forEach(function(o){
      if (o.ref) books[norm_(o.ref)] = 1;
      if (o.via) { var bv = norm_(String(o.via).replace(/\s*(ص\s*[\d٠-٩]+|[\d٠-٩]+\s*\/\s*[\d٠-٩]+)\s*$/,'')); books[bv] = 1; people[norm_(o.via)] = 1; }
      if (o.speaker) mark(o.speaker);
      if (o.via) mark(o.via);
    });
    var rs = getSheet_(SH.R, HEAD_R), rv = rs.getLastRow() > 1 ? rs.getRange(2,1,rs.getLastRow()-1,HEAD_R.length).getValues() : [];
    rv.forEach(function(r){ if (books[norm_(r[0])] && r[1]) mark(r[1]); });          // مؤلف كتاب مستعمل
    var sh = kind === 'refs' ? rs : getSheet_(SH.S, HEAD_S), del = [], vals = kind === 'refs' ? rv : (sh.getLastRow() > 1 ? sh.getRange(2,1,sh.getLastRow()-1,HEAD_S.length).getValues() : []);
    vals.forEach(function(r,i){
      var key = norm_(r[0]); if (!key) return;
      if (kind === 'refs') { if (!books[key] && !r[4]) del.push(i+2); }                  // غير مستعمل وغير مُخفى
      else if (!people[key] && !r[4]) del.push(i+2);
    });
    for (var k = del.length - 1; k >= 0; k--) sh.deleteRow(del[k]);
    return {count:del.length};
  });
}

/* ===================== المراجعة والسلاسل وسجل القراءة ===================== */
var REVIEW_DAYS = [1,3,7,16,35,75,150,300];

/** الفوائد المستحقّة للمراجعة اليوم: المميّزة المُدرَجة، ومن حلّ موعدها. */
function api_due(){
  var now = new Date().getTime();
  return readAll_()
    .filter(function(o){
      if (o.status === 'محذوفة' || o.rstage === 'إيقاف') return false;
      if (!o.starred && !o.rstage) return false;
      if (!o.rnext) return true;
      return new Date(o.rnext).getTime() <= now;
    })
    .map(own_)
    .sort(function(a,b){ return String(a.rnext||'').localeCompare(String(b.rnext||'')); });
}

/** تسجيل مراجعة: grade = 'ok' تتقدّم مرحلة، 'again' تعود للبداية، 'stop' تخرج من المراجعة. */
function api_review(a){
  return withLock_(20000, function(){
    var row = findRow_(String(a.id)); if (!row) throw new Error('لم تُوجد الفائدة');
    var sh = fsheet_();
    var cur = String(sh.getRange(row,21).getValue()||'');
    var stage = Number(cur) || 0;
    if (a.grade === 'stop') { sh.getRange(row,21).setValue('إيقاف'); sh.getRange(row,22).setValue(''); return {stage:'إيقاف'}; }
    if (a.grade === 'again') stage = 0; else stage = Math.min(stage + 1, REVIEW_DAYS.length - 1);
    var d = new Date(); d.setDate(d.getDate() + REVIEW_DAYS[stage]);
    sh.getRange(row,21).setValue(stage);
    sh.getRange(row,22).setValue(d.toISOString());
    return {stage:stage, next:d.toISOString(), days:REVIEW_DAYS[stage]};
  });
}

function api_series(){
  var byName = {};
  readAll_().filter(function(o){ return o.status !== 'محذوفة' && o.series; })
    .forEach(function(o){ (byName[o.series] = byName[o.series] || []).push(own_(o)); });
  return Object.keys(byName).sort().map(function(k){
    var arr = byName[k].sort(function(a,b){
      return (a.sorder||9999) - (b.sorder||9999) || String(a.createdAt).localeCompare(String(b.createdAt));
    });
    return {name:k, count:arr.length, items:arr};
  });
}

function api_reading(){
  var m = {};
  readAll_().filter(function(o){ return o.status !== 'محذوفة' && o.ref; }).forEach(function(o){
    var r = m[o.ref] || (m[o.ref] = {ref:o.ref, count:0, first:'', last:'', speakers:{}});
    r.count++;
    var d = String(o.createdAt||'');
    if (d && (!r.first || d < r.first)) r.first = d;
    if (d && (!r.last  || d > r.last))  r.last  = d;
    if (o.speaker) r.speakers[o.speaker] = 1;
  });
  return Object.keys(m).map(function(k){
    var r = m[k]; r.speakers = Object.keys(r.speakers); return r;
  }).sort(function(a,b){ return b.count - a.count; });
}

/* ===================== التصدير والاستيراد ===================== */
function api_exportAll(){
  var cats = [], refs = [];
  var cs = getSheet_(SH.C, HEAD_C), rs = getSheet_(SH.R, HEAD_R);
  if (cs.getLastRow() > 1) cats = cs.getRange(2,1,cs.getLastRow()-1,HEAD_C.length).getValues().filter(function(r){ return r[0]; })
    .map(function(r){ return {name:String(r[0]), parent:String(r[1]), color:String(r[2]), icon:String(r[3]), order:String(r[4]), status:String(r[5])}; });
  if (rs.getLastRow() > 1) refs = rs.getRange(2,1,rs.getLastRow()-1,HEAD_R.length).getValues().filter(function(r){ return r[0]; })
    .map(function(r){ return {title:String(r[0]), author:String(r[1]), kind:String(r[2]), edition:String(r[3]), hide:String(r[4]||'')}; });
  return { format:'kunnasha', version:2,
           items: readAll_().filter(function(o){ return o.status !== 'محذوفة'; }).map(own_),
           people: api_people(), refs:refs, categories:cats, settings: api_settings(),
           exportedAt: new Date().toISOString() };
}

/** تاريخ يُقبل من الملف المستورد وإلا الآن. */
function importDate_(v){ var iso = isoOrEmpty_(v); return iso ? new Date(iso) : new Date(); }

/**
 * استيراد دفعة من الفوائد. كل فائدة تُعالج وحدها: عطبٌ في واحدة لا يُفشل البقية.
 * options: {skipDup:true, forceDraft:false, visibility:'خاصة'|'عامة'|'' (كما في الملف), markVerify:false}
 */
function api_importBatch(a){
  return withLock_(60000, function(){
    var sh = fsheet_(), items = (a.items || []).slice(0, 200), opt = a.options || {};
    var idx = personIndex_();
    var existing = readAll_(), idset = {}, keys = {};
    var n = Number(PropertiesService.getScriptProperties().getProperty('COUNTER')||0);
    existing.forEach(function(o){
      idset[o.id] = 1;
      var k = Number(String(o.id).replace(/\D/g,'')); if (k > n) n = k;
      if (o.status !== 'محذوفة') keys[dupKey_(o.text)] = 1;
    });
    var set = settingsAll_(), defVis = set['الظهور الافتراضي'] === 'عامة' ? 'عامة' : 'خاصة';
    var rows = [], added = 0, skipped = 0, bad = 0, ids = [], names = [], cats = {}, refs = {}, books = bookSet_();
    var fmt = {};

    items.forEach(function(raw){
      try {
        var o = sanitize_(raw || {}, idx);
        if (!o.text) { bad++; return; }
        var k = dupKey_(o.text);
        if (opt.skipDup !== false) { if (keys[k]) { skipped++; return; } }
        keys[k] = 1;
        o.tags = o.tags || [];
        o.visibility = opt.visibility ? (opt.visibility === 'عامة' ? 'عامة' : 'خاصة') : (o.visibility || defVis);
        o.status = (o.status && o.status !== 'محذوفة') ? o.status : ((o.speaker || o.ref) ? 'منشورة' : 'مسودة');
        if (opt.forceDraft) o.status = 'مسودة';
        if (opt.markVerify) o.verify = true;
        // المعرّف: يُحفظ القديم إن لم يتعارض، وإلا يُعطى جديدًا
        var oid = String(raw.id || '');
        if (/^F-\d{4,}$/.test(oid) && !idset[oid]) {
          o.id = oid; var num = Number(oid.replace(/\D/g,'')); if (num > n) n = num;
        } else { n++; o.id = 'F-' + ('000000'+n).slice(-6); }
        idset[o.id] = 1;
        var d = importDate_(raw.createdAt);
        o.createdAt = d.toISOString(); o.createdHijri = hijri_(d); o.updatedAt = o.createdAt;
        o.prevStatus = '';
        if (o.speaker) names.push(o.speaker);
        if (o.via && !isBook_(o.via, books)) names.push(o.via);
        if (o.cat) cats[o.cat] = 1;
        if (o.ref) refs[o.ref] = 1;
        rows.push(objToRow_(o)); ids.push(o.id); added++;
      } catch (err) { bad++; }
    });

    if (rows.length) {
      writeRows_(sh, sh.getLastRow() + 1, rows, COLS.length);
      PropertiesService.getScriptProperties().setProperty('COUNTER', String(n));
      registerPeople_(names, idx);
      var rsh = getSheet_(SH.R, HEAD_R), csh = getSheet_(SH.C, HEAD_C);
      var haveR = listCol_(rsh,1).map(norm_), haveC = listCol_(csh,1).map(norm_);
      var addR = Object.keys(refs).filter(function(x){ return haveR.indexOf(norm_(x)) < 0; }).map(function(x){ return [x,'','','','']; });
      var addC = Object.keys(cats).filter(function(x){ return haveC.indexOf(norm_(x)) < 0; }).map(function(x){ return [x,'','','',9999,'مفعّل']; });
      if (addR.length) writeRows_(rsh, rsh.getLastRow()+1, addR, HEAD_R.length);
      if (addC.length) writeRows_(csh, csh.getLastRow()+1, addC, HEAD_C.length);
    }
    return {added:added, skipped:skipped, bad:bad};
  });
}

/** استيراد القائلين والمراجع والتصنيفات (وإعدادات اختيارية) من ملف نسخة احتياطية. */
function api_importMeta(a){
  return withLock_(60000, function(){
    var idx = personIndex_(), cnt = {people:0, refs:0, cats:0};
    var sh = getSheet_(SH.S, HEAD_S);
    (a.people || []).slice(0,2000).forEach(function(p){
      var name = clip_(p && p.name, 100); if (!name) return;
      var cur = idx.by[norm_(name)];
      var al = splitList_(Array.isArray(p.aliases) ? p.aliases.join('،') : p.aliases);
      if (cur) { al.forEach(function(x){ addAlias_(cur.name, x); }); return; }
      var hide = ['الاسم','كل شيء'].indexOf(p.hide) >= 0 ? p.hide : '';
      appendText_(sh, [name, al.join('، '), clip_(p.death,20), clip_(p.bio,1000), hide, clip_(p.rep,100), clip_(p.dua,60)]);
      idx.by[norm_(name)] = {name:name, aliases:al}; cnt.people++;
    });
    var rsh = getSheet_(SH.R, HEAD_R), haveR = listCol_(rsh,1).map(norm_);
    var rrows = rsh.getLastRow() > 1 ? rsh.getRange(2,1,rsh.getLastRow()-1,HEAD_R.length).getValues() : [];
    (a.refs || []).slice(0,5000).forEach(function(r){
      var t = clip_(r && r.title, 300); if (!t) return;
      var at = haveR.indexOf(norm_(t));
      if (at >= 0) {   // موجود: يُكمَل المؤلف والنوع والطبعة إن كانت فارغة
        var row = rrows[at], ch = false;
        [[1,r.author,100],[2,r.kind,40],[3,r.edition,300]].forEach(function(f){ if (!row[f[0]] && f[1]) { row[f[0]] = clip_(f[1], f[2]); ch = true; } });
        if (ch) rsh.getRange(at+2,1,1,HEAD_R.length).setNumberFormat('@').setValues([row.map(String)]);
        return;
      }
      appendText_(rsh, [t, clip_(r.author,100), clip_(r.kind,40), clip_(r.edition,300), ['المرجع','كل شيء'].indexOf(r.hide)>=0?r.hide:'']); haveR.push(norm_(t)); rrows.push([t,'','','','']); cnt.refs++;
    });
    var csh = getSheet_(SH.C, HEAD_C), haveC = listCol_(csh,1).map(norm_);
    (a.categories || []).slice(0,500).forEach(function(c){
      var t = clip_(c && c.name, 100); if (!t || haveC.indexOf(norm_(t)) >= 0) return;
      appendText_(csh, [t, clip_(c.parent,100), clip_(c.color,20), clip_(c.icon,10), Number(c.order)||9999, 'مفعّل']); haveC.push(norm_(t)); cnt.cats++;
    });
    if (a.settings) {
      var ts = getSheet_(SH.T, HEAD_T), known = {};
      DEFAULT_SETTINGS.forEach(function(d){ if (d[2]) known[d[0]] = 1; });
      var ex = ts.getLastRow() > 1 ? ts.getRange(2,1,ts.getLastRow()-1,1).getValues().map(function(r){ return String(r[0]); }) : [];
      Object.keys(a.settings).forEach(function(k){
        if (!known[k]) return;
        var i = ex.indexOf(k), v = clip_(a.settings[k], 2000);
        if (i >= 0) ts.getRange(i+2,2).setValue(v); else { appendText_(ts,[k,v]); ex.push(k); }
      });
    }
    return cnt;
  });
}

/* ===================== الرسائل (طلبات المنصة والملاحظات) ===================== */
function countNewMessages_(){
  var sh = getSheet_(SH.M, HEAD_M), last = sh.getLastRow();
  if (last < 2) return 0;
  return sh.getRange(2,9,last-1,1).getValues().filter(function(r){ return String(r[0]) === 'جديد'; }).length;
}

var MSG_KINDS = ['طلب منصة','سؤال','اقتراح','ملاحظة','تواصل'];

/** عامة: يرسلها أي زائر. محمية من الإزعاج: حدٌّ يومي، وحدٌّ لكل وسيلة تواصل، وحقل مخفي يصيد الآليات. */
function api_contact(a){
  if (a.hp) return {ok:true};                       // الآلي يملأ الحقل المخفي
  var kind = MSG_KINDS.indexOf(a.kind) >= 0 ? a.kind : 'تواصل';
  var name = clip_(a.name,60), contact = clip_(a.contact,120), msg = clip_(a.message,1500);
  var factId = /^F-\d{4,}$/.test(String(a.factId||'')) ? String(a.factId) : '';
  if (kind === 'ملاحظة') { if (!msg) throw new Error('اكتب ملاحظتك'); }
  else if (contact.length < 5) throw new Error('اكتب وسيلة تواصل صحيحة (بريد أو رقم أو حساب) ليتمكّن صاحب المنصة من الرد');
  return withLock_(20000, function(){
    var p = PropertiesService.getScriptProperties(), dk = 'MSGDAY_' + dayKey_();
    var today = Number(p.getProperty(dk)||0);
    if (today >= 60) throw new Error('بلغت المنصة حدّها اليومي من الرسائل — حاول غدًا');
    var sh = getSheet_(SH.M, HEAD_M), last = sh.getLastRow(), mine = 0;
    var todayStr = new Date().toISOString().slice(0,10);
    if (last > 1 && contact) {
      var from = Math.max(2, last-300);
      sh.getRange(from,1,last-from+1,HEAD_M.length).getValues().forEach(function(r){
        if (String(r[4]) === contact && String(r[1]).slice(0,10) === todayStr) mine++;
      });
      if (mine >= 3) throw new Error('أرسلت عدة رسائل اليوم — سيردّ عليك صاحب المنصة قريبًا');
    }
    var n = Number(p.getProperty('MSGCOUNTER')||0) + 1;
    p.setProperty('MSGCOUNTER', String(n));
    var auto = maybeAutoReply_(kind, contact, sh);
    appendText_(sh, ['M-' + ('000000'+n).slice(-6), new Date().toISOString(), kind, name, contact,
                     a.showName ? 'نعم' : 'لا', msg, factId, 'جديد', auto]);
    p.setProperty(dk, String(today+1));
    return {ok:true};
  });
}

/** رد تلقائي بنص ثابت (لا يُدرج فيه كلام المرسل) — مغلق افتراضيًا، ومرة واحدة لكل بريد. */
function maybeAutoReply_(kind, contact, sh){
  var p = PropertiesService.getScriptProperties();
  if (p.getProperty('AUTOREPLY') !== 'نعم' || kind === 'ملاحظة') return '';
  if (!/^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(contact)) return '';
  var dk = 'AUTODAY_' + dayKey_(), sent = Number(p.getProperty(dk)||0);
  if (sent >= 15) return '';
  var last = sh.getLastRow();
  if (last > 1) {
    var dup = sh.getRange(2,1,last-1,HEAD_M.length).getValues().some(function(r){
      return String(r[4]).toLowerCase() === contact.toLowerCase() && String(r[9]) === 'نعم';
    });
    if (dup) return '';
  }
  try {
    var set = settingsAll_(), link = trim_(set['رابط المنصة']);
    var body = (p.getProperty('AUTOTEXT') || DEFAULT_AUTOTEXT)
      .replace('{الرابط}', link ? ('رابط المنصة: ' + link) : '').replace(/\n{3,}/g,'\n\n');
    MailApp.sendEmail({to:contact, subject:'رد من ' + (set['اسم المنصة'] || 'كُنّاشة الفوائد'), body:body,
                       name: set['اسم المنصة'] || 'كُنّاشة الفوائد'});
    p.setProperty(dk, String(sent+1));
    return 'نعم';
  } catch (e) { return ''; }
}

function api_messages(){
  var sh = getSheet_(SH.M, HEAD_M), last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2,1,last-1,HEAD_M.length).getValues().map(function(r){
    return {id:String(r[0]), at:toIso_(r[1]), kind:String(r[2]), name:String(r[3]), contact:String(r[4]),
            showName:String(r[5])==='نعم', message:String(r[6]), factId:String(r[7]), status:String(r[8]||'جديد'), auto:String(r[9])==='نعم'};
  }).filter(function(m){ return m.id; }).reverse();
}

function findMsgRow_(id){
  var sh = getSheet_(SH.M, HEAD_M), last = sh.getLastRow();
  if (last < 2) return 0;
  var ids = sh.getRange(2,1,last-1,1).getValues();
  for (var i=0;i<ids.length;i++) if (String(ids[i][0]) === id) return i+2;
  return 0;
}

function api_setMessageStatus(a){
  return withLock_(20000, function(){
    if (['جديد','تم الرد','مؤرشف'].indexOf(a.status) < 0) throw new Error('حالة غير صحيحة');
    var row = findMsgRow_(String(a.id)); if (!row) throw new Error('لم تُوجد الرسالة');
    getSheet_(SH.M, HEAD_M).getRange(row,9).setValue(a.status);
    return {ok:true};
  });
}

function api_deleteMessage(a){
  return withLock_(20000, function(){
    var row = findMsgRow_(String(a.id)); if (!row) throw new Error('لم تُوجد الرسالة');
    getSheet_(SH.M, HEAD_M).deleteRow(row);
    return {ok:true};
  });
}

/* ===================== قوالب الصور (تُحفظ في الجدول نفسه) ===================== */
/** الخلفية تُقسَّم إلى قطع في ورقة «القوالب» — فلا حاجة لـ Drive ولا GitHub. */
function cleanTplCfg_(c){
  c = c || {};
  var num = function(v,lo,hi,d){ v = Number(v); return isNaN(v) ? d : Math.max(lo, Math.min(hi, v)); };
  var s = c.safe || {};
  return {
    w: num(c.w, 400, 2400, 1080), h: num(c.h, 400, 3000, 1350),
    text: ['auto','light','dark'].indexOf(c.text) >= 0 ? c.text : 'auto',
    overlay: num(c.overlay, 0, 0.8, 0),
    safe: { x:num(s.x,0,0.4,0.1), y:num(s.y,0,0.4,0.12), w:num(s.w,0.3,1,0.8), h:num(s.h,0.3,1,0.76) },
    header: c.header === false ? false : true
  };
}

function tplRows_(){
  var sh = getSheet_(SH.P, HEAD_P), last = sh.getLastRow();
  return last < 2 ? [] : sh.getRange(2,1,last-1,HEAD_P.length).getValues().map(function(r,i){
    return {id:String(r[0]), name:String(r[1]), cfg:String(r[2]), part:Number(r[3])||0, data:String(r[4]||''), row:i+2};
  }).filter(function(r){ return r.id; });
}

function api_templates(){
  return tplRows_().filter(function(r){ return r.part === 0; }).map(function(r){
    var cfg = {}; try { cfg = JSON.parse(r.cfg); } catch (e) {}
    return {id:r.id, name:r.name, cfg:cleanTplCfg_(cfg)};
  });
}

function api_templateImage(a){
  var id = String(a.id||''), parts = tplRows_().filter(function(r){ return r.id === id && r.part > 0; });
  parts.sort(function(x,y){ return x.part - y.part; });
  return parts.map(function(r){ return r.data; }).join('');
}

function api_saveTemplate(a){
  return withLock_(60000, function(){
    var name = clip_(a.name, 60); if (!name) throw new Error('اسم القالب فارغ');
    var cfg = cleanTplCfg_(a.cfg), img = a.image;
    if (img && (typeof img !== 'string' || img.length > 900000 || !/^[A-Za-z0-9+\/=]+$/.test(img)))
      throw new Error('الصورة غير صالحة أو كبيرة جدًا');
    var sh = getSheet_(SH.P, HEAD_P), id = String(a.id||'');
    var rows = tplRows_();
    if (!id) {
      var n = Number(PropertiesService.getScriptProperties().getProperty('TPLCOUNTER')||0) + 1;
      PropertiesService.getScriptProperties().setProperty('TPLCOUNTER', String(n));
      id = 'T-' + ('0000'+n).slice(-4);
    } else if (!rows.some(function(r){ return r.id === id; })) throw new Error('القالب غير موجود');
    // احذف صفوف القالب القديمة (من الأسفل) ثم اكتب من جديد؛ والصورة القديمة تبقى إن لم تُرسَل جديدة
    var oldParts = rows.filter(function(r){ return r.id === id && r.part > 0; });
    var keepData = (img === undefined || img === null) ? oldParts.sort(function(x,y){ return x.part-y.part; }).map(function(r){ return r.data; }).join('') : '';
    rows.filter(function(r){ return r.id === id; }).map(function(r){ return r.row; })
        .sort(function(x,y){ return y-x; }).forEach(function(r){ sh.deleteRow(r); });
    var data = img ? img : keepData;
    var out = [[id, name, JSON.stringify(cfg), 0, '']];
    for (var i=0, p=1; i<data.length; i+=IMG_CHUNK, p++) out.push([id, name, '', p, data.slice(i, i+IMG_CHUNK)]);
    writeRows_(sh, sh.getLastRow() + 1, out, HEAD_P.length);
    return {id:id};
  });
}

function api_deleteTemplate(a){
  return withLock_(30000, function(){
    var id = String(a.id||''), sh = getSheet_(SH.P, HEAD_P);
    tplRows_().filter(function(r){ return r.id === id; }).map(function(r){ return r.row; })
      .sort(function(x,y){ return y-x; }).forEach(function(r){ sh.deleteRow(r); });
    return {ok:true};
  });
}

/* ===================== فحص ذاتي (اختياري) ===================== */
/** شغّلها بعد الإعداد للتأكد أن كل شيء سليم — تُظهر النتيجة في السجل. */
function selfTest(){
  var r = [];
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  [SH.F,SH.C,SH.S,SH.R,SH.T,SH.M,SH.P].forEach(function(n){
    r.push((ss.getSheetByName(n) ? '✅' : '❌') + ' ورقة ' + n);
  });
  var p = PropertiesService.getScriptProperties();
  r.push((p.getProperty('PWHASH') ? '✅' : '❌') + ' كلمة المرور مضبوطة' + (p.getProperty('MUSTCHANGE')==='1' ? ' (مؤقتة — لم تُغيَّر بعد)' : ''));
  var f = ss.getSheetByName(SH.F);
  var heads = f ? f.getRange(1,1,1,Math.min(f.getMaxColumns(), COLS.length)).getValues()[0].map(String) : [];
  var missing = COLS.filter(function(c){ return heads.indexOf(c) < 0; });
  r.push(missing.length ? '❌ أعمدة ناقصة: ' + missing.join('، ') + ' (شغّل setup)' : '✅ كل الأعمدة موجودة');
  r.push('عدد الفوائد: ' + readAll_().length);
  r.push('الفوائد العامة المنشورة: ' + api_listPublic().length);
  var msg = r.join('\n');
  Logger.log(msg);
  return msg;
}
