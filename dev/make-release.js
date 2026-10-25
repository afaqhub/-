/* يصنع نسختين من index.html:
     1) نسخة صاحب المنصة: فيها رابط سكربته (من dev/release-url.txt أو المتغير KUNNASHA_URL)
     2) نسخة النشر للآخرين: فيها العبارة العربية ليضعوا رابطهم مكانها
   ثم يضعهما مع Code.gs والأدلة في kunnasha-files.zip (يحتاج أمر zip أو Python).
   الاستعمال:  node dev/make-release.js */
const fs=require('fs'), path=require('path'), cp=require('child_process');
const root=path.join(__dirname,'..'), out=path.join(root,'release');
const PH="const SERVER_URL = 'الصق_رابط_السكربت_هنا';";
const url=(process.env.KUNNASHA_URL||(fs.existsSync(path.join(__dirname,'private','release-url.txt'))?fs.readFileSync(path.join(__dirname,'private','release-url.txt'),'utf8'):'')).trim();
if(!/^https:\/\/script\.google\.com\/.+\/exec$/.test(url)) throw new Error('ضع رابط السكربت في dev/private/release-url.txt (مجلد لا يُرفع إلى GitHub)');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
if(!html.includes(PH)) throw new Error('لم أجد سطر SERVER_URL بالعبارة العربية في index.html');
fs.rmSync(out,{recursive:true,force:true});
const dirs={own:'1-نسخة-خاصة-بي (فيها رابطي)',pub:'2-نسخة-للنشر-للآخرين (بلا رابط)'};
fs.mkdirSync(path.join(out,dirs.own),{recursive:true}); fs.mkdirSync(path.join(out,dirs.pub),{recursive:true});
fs.writeFileSync(path.join(out,dirs.own,'index.html'),html.replace(PH,`const SERVER_URL = '${url}';`));
fs.writeFileSync(path.join(out,dirs.pub,'index.html'),html);
// القوالب الجاهزة: ملف واحد templates.js (صور + مواضع) يوضع بجانب index.html
const tdir=path.join(root,'templates');
if(fs.existsSync(path.join(tdir,'manifest.json'))){
  const man=JSON.parse(fs.readFileSync(path.join(tdir,'manifest.json'),'utf8'));
  man.templates.forEach(t=>{ t.img='data:image/jpeg;base64,'+fs.readFileSync(path.join(tdir,t.file)).toString('base64'); delete t.file; });
  const js='/* قوالب الصور الجاهزة — يُولَّد بـ node dev/make-release.js، ضعه بجانب index.html */\nwindow.KUNNASHA_TPL='+JSON.stringify(man)+';\n';
  fs.writeFileSync(path.join(root,'templates.js'),js);
  for(const d of Object.values(dirs)) fs.writeFileSync(path.join(out,d,'templates.js'),js);
}
// نسخ إضافية برابط مستخدم آخر: ضع الرابط في dev/private/release-url-<اسم>.txt فتُنتَج «3-نسخة-<اسم> (فيها رابطه)» وهكذا
const PRIV=path.join(__dirname,'private'), extra=(fs.existsSync(PRIV)?fs.readdirSync(PRIV):[]).filter(f=>/^release-url-.+\.txt$/.test(f)).sort();
extra.forEach((f,k)=>{
  const u=fs.readFileSync(path.join(PRIV,f),'utf8').trim(), nm=f.replace(/^release-url-|\.txt$/g,'');
  if(!/^https:\/\/script\.google\.com\/.+\/exec$/.test(u)) throw new Error('رابط غير صالح في '+f);
  dirs['x'+k]=(3+k)+'-نسخة-'+nm+' (فيها رابطه)';
  fs.mkdirSync(path.join(out,dirs['x'+k]),{recursive:true});
  fs.writeFileSync(path.join(out,dirs['x'+k],'index.html'),html.replace(PH,`const SERVER_URL = '${u}';`));
  if(fs.existsSync(path.join(root,'templates.js'))) fs.copyFileSync(path.join(root,'templates.js'),path.join(out,dirs['x'+k],'templates.js'));
});
for(const f of ['Code.gs','دليل-الاستخدام.md','خطوات-التثبيت-للمبتدئ.md']) fs.copyFileSync(path.join(root,f),path.join(out,f));
const zip=path.join(root,'kunnasha-files.zip'); fs.rmSync(zip,{force:true});
cp.execFileSync('python3',['-c',`import zipfile,os
os.chdir(${JSON.stringify(out)})
z=zipfile.ZipFile(${JSON.stringify(zip)},'w',zipfile.ZIP_DEFLATED)
for d,_,fs in os.walk('.'):
    for f in fs: z.write(os.path.join(d,f),os.path.join(d,f)[2:])
z.close()`]);
const a=fs.readFileSync(path.join(out,dirs.own,'index.html'),'utf8'), b=fs.readFileSync(path.join(out,dirs.pub,'index.html'),'utf8');
console.log('نسخة صاحب المنصة تحوي الرابط:',a.includes(url),'| نسخة النشر تحويه:',b.includes(url),'→',zip);
