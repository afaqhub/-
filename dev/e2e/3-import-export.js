const {start,newPage,shot,OUT}=require('./harness.js'); const seed=require('./seed.js'); const fs=require('fs'); const path=require('path'); const assert=require('assert');
let pass=0,fail=0; const ok=(c,m)=>{ if(c){pass++;console.log('  ✓',m)}else{fail++;console.log('  ✗',m)} };
(async()=>{
  const {gas,web,browser}=await start(); const env=gas.env; const {tok,ids}=seed(env);
  const init=(t)=>([t])=>{ localStorage.setItem('k_server','https://script.google.com/macros/s/TEST/exec'); if(t) localStorage.setItem('k_token',t); localStorage.setItem('k_welcome_skip','1'); };
  const {page,errors}=await newPage(browser);
  await page.addInitScript(([t])=>{ localStorage.setItem('k_server','https://script.google.com/macros/s/TEST/exec'); localStorage.setItem('k_token',t); localStorage.setItem('k_welcome_skip','1'); },[tok]);
  await page.goto('http://localhost:8788/'); await page.waitForSelector('.card');
  const count=()=>page.evaluate(()=>st.items.length);
  const n0=await count();
  console.log('الاستيراد');
  // --- نص الذكاء الاصطناعي
  await page.evaluate(()=>transferSheet('import'));
  await page.fill('#im_text',fs.readFileSync('files/ai.txt','utf8')); await page.click('#im_read');
  await page.waitForSelector('#im_go'); await shot(page,'20-import-preview-ai');
  const prev=await page.evaluate(()=>({n:IM.parsed.items.length,kind:IM.parsed.kind,w:IM.parsed.warnings.length,first:IM.parsed.items[0]}));
  ok(prev.kind==='blocks'&&prev.n===3,'قراءة 3 كتل صحيحة من نص الذكاء الاصطناعي (الكتلة بلا نص تُتجاهل): '+JSON.stringify(prev.n)+' '+prev.kind);
  ok(prev.first.speaker==='الشيخ ابن عثيمين'&&prev.first.locus==='3/108'&&prev.first.tags.length===2&&prev.first.type==='تنبيه','حقول الكتلة الأولى');
  ok(await page.isChecked('#im_ver'),'علامة «تحتاج تحقق» مفعّلة افتراضيًا لنص الذكاء');
  await page.click('#im_go'); await page.waitForFunction(n=>st.items.length>=n,n0+3,{timeout:8000});
  await page.waitForTimeout(1500); ok(!(await page.evaluate(()=>document.querySelector('#scrim').classList.contains('open'))),'نافذة الاستيراد تُغلق تلقائيًا عند الانتهاء');
  const imp=await page.evaluate(()=>st.items.filter(i=>i.verify).map(i=>({s:i.speaker,v:i.visibility,st:i.status,t:i.text.slice(0,20)})));
  ok(imp.length===3 && imp.every(x=>x.v==='خاصة'&&x.st==='مسودة'),'دخلت 3 مسودات خاصة بعلامة تحقق');
  ok(imp.some(x=>x.s==='ابن عثيمين'),'وُحّد «الشيخ ابن عثيمين» إلى «ابن عثيمين»');
  await page.waitForTimeout(1500);
  // --- JSON معطوب (فاصلة زائدة)
  await page.evaluate(()=>transferSheet('import'));
  await page.setInputFiles('#im_file','files/bad.json'); await page.waitForSelector('#im_go');
  let p2=await page.evaluate(()=>IM.parsed.items.length); ok(p2===2,'JSON بفاصلة زائدة ومعه عنصر بلا نص: قُرئ العنصران الصالحان ('+p2+')');
  // --- قائمة مرقمة
  await page.fill('#im_text',fs.readFileSync('files/list.txt','utf8')); await page.click('#im_read');
  const lst=await page.evaluate(()=>IM.parsed.items.map(i=>[i.text,i.ref,i.locus,i.speaker,i.cat,i.via]));
  ok(lst.length===3 && lst[0][1]==='الترمذي' && lst[0][3]==='الألباني' && lst[1][4]==='التربية' && lst[2][5]==='مسلم','قائمة مرقمة مع اختصارات: '+JSON.stringify(lst[0]));
  // --- جدول ماركداون
  await page.fill('#im_text',fs.readFileSync('files/table.md','utf8')); await page.click('#im_read');
  p2=await page.evaluate(()=>[IM.parsed.kind,IM.parsed.items.length,IM.parsed.items[0].speaker,IM.parsed.items[0].ref]); ok(p2[0]==='table'&&p2[1]===2&&p2[2]==='ابن حجر'&&p2[3]==='فتح الباري','جدول ماركداون');
  // --- Excel
  await page.setInputFiles('#im_file','files/sample.xlsx'); await page.waitForFunction(()=>IM&&IM.parsed&&IM.parsed.kind==='table'&&IM.src==='sample.xlsx',null,{timeout:8000});
  await page.waitForSelector('#im_go'); await shot(page,'21-import-xlsx');
  p2=await page.evaluate(()=>({n:IM.parsed.items.length,map:IM.parsed.table.map,a:IM.parsed.items[0]}));
  ok(p2.n===3,'Excel: 3 فوائد (الصف الفارغ النص تُجوهل): '+p2.n); ok(p2.map.includes('speaker')&&p2.map.includes('locus')&&p2.map.includes('createdAt'),'مطابقة أعمدة Excel تلقائيًا: '+JSON.stringify(p2.map));
  ok(p2.a.createdAt&&p2.a.createdAt.startsWith('2023-05'),'تاريخ Excel قُرئ'); ok(p2.a.cat==='العقيدة','تنظيف المسافات');
  await page.uncheck('#im_ver'); await page.selectOption('#im_vis','عامة');
  const before=await count(); await page.click('#im_go'); await page.waitForFunction(n=>st.items.length>=n,before+3,{timeout:8000});
  const xl=await page.evaluate(()=>st.items.filter(i=>i.text.startsWith('العلم قبل القول')).map(i=>({v:i.visibility,s:i.status,c:i.createdAt.slice(0,7)})))[0]||await page.evaluate(()=>st.items.filter(i=>i.text.startsWith('العلم قبل القول')).map(i=>({v:i.visibility,s:i.status,c:i.createdAt.slice(0,7)})));
  console.log('   xlsx item',JSON.stringify(xl));
  // --- إعادة نفس الملف: كلها مكررة
  await page.evaluate(()=>transferSheet('import')); await page.setInputFiles('#im_file','files/sample.xlsx'); await page.waitForSelector('#im_go');
  const dupInfo=await page.evaluate(()=>IM.parsed.items.filter(i=>i._dup).length); ok(dupInfo===3,'إعادة الاستيراد: كلها مكررة ('+dupInfo+')');
  console.log('التصدير');
  await page.evaluate(()=>transferSheet('export'));
  const [dl]=await Promise.all([page.waitForEvent('download'),page.click('#ex_json')]);
  const jpath=path.join(OUT,'export.json'); await dl.saveAs(jpath); const J=JSON.parse(fs.readFileSync(jpath,'utf8'));
  ok(J.format==='kunnasha'&&J.items.length>=10&&J.people.length>=3,'تصدير JSON: '+J.items.length+' فائدة، '+J.people.length+' أشخاص');
  const [dx]=await Promise.all([page.waitForEvent('download'),page.click('#ex_xlsx')]); const xp=path.join(OUT,'export.xlsx'); await dx.saveAs(xp);
  const X=require('xlsx'); const wbx=X.readFile(xp); ok(wbx.SheetNames.includes('الفوائد')&&wbx.SheetNames.includes('القائلون'),'تصدير Excel أوراقه: '+wbx.SheetNames.join('،'));
  const rows=X.utils.sheet_to_json(wbx.Sheets['الفوائد'],{header:1}); ok(rows[0][1]==='النص'&&rows.length>=11,'صفوف Excel: '+rows.length);
  const [dc]=await Promise.all([page.waitForEvent('download'),page.click('#ex_csv')]); const cp=path.join(OUT,'export.csv'); await dc.saveAs(cp);
  ok(fs.readFileSync(cp,'utf8').startsWith('﻿"العنوان"'),'تصدير CSV بترميز يقرأه Excel');
  // --- استيراد ملف المنصة نفسه إلى منصة جديدة (محاكاة الانتقال)
  console.log('الانتقال بين منصتين');
  await fetch('http://localhost:8787/__reset'); await fetch('http://localhost:8787/__setup');
  const env2=gas.env; const s2=env2.ctx.setup? null:null;
  const temp2=(await (await fetch('http://localhost:8787/__setup')).json()).r; // setup آمنة للتكرار
  // نحتاج كلمة المرور: أعد الضبط
  await fetch('http://localhost:8787/__reset'); const su=await (await fetch('http://localhost:8787/__setup')).json(); const t2=(su.r.match(/: (\S{10})\n/)||[])[1];
  const ctx2=await browser.newContext({viewport:{width:430,height:900}}); const pg2=await ctx2.newPage();
  await pg2.route('https://fonts.googleapis.com/**',r=>r.fulfill({contentType:'text/css',body:''})); await pg2.route('https://fonts.gstatic.com/**',r=>r.abort());
  await pg2.route('https://script.google.com/macros/s/TEST/exec',async r=>{ const rq=r.request(); const t=await (await fetch('http://localhost:8787/',{method:'POST',body:rq.postData()})).text(); r.fulfill({contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:t}); });
  await pg2.route('https://cdnjs.cloudflare.com/**',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync(path.join(__dirname,'..','node_modules/xlsx/dist/xlsx.full.min.js'))}));
  const e2=[]; pg2.on('pageerror',e=>e2.push(e.message));
  await pg2.addInitScript(()=>{ localStorage.setItem('k_server','https://script.google.com/macros/s/TEST/exec'); localStorage.setItem('k_welcome_skip','1'); });
  await pg2.goto('http://localhost:8788/'); await pg2.click('#btnAuth'); await pg2.fill('#pw',t2); await pg2.click('#go'); await pg2.waitForSelector('#fc_old');
  await pg2.fill('#fc_old',t2); await pg2.fill('#fc_new','Another123'); await pg2.fill('#fc_new2','Another123'); await pg2.click('#fc_go'); await pg2.waitForSelector('#fab',{state:'visible'});
  await pg2.evaluate(()=>transferSheet('import')); await pg2.setInputFiles('#im_file',jpath); await pg2.waitForSelector('#im_go');
  await pg2.selectOption('#im_vis',''); await pg2.click('#im_go'); await pg2.waitForFunction(n=>st.items.length>=n,J.items.length-1,{timeout:10000});
  const mv=await pg2.evaluate(()=>({n:st.items.length,people:(st.meta.people||[]).map(p=>p.n),pub:st.items.filter(i=>i.visibility==='عامة').length,al:(st.meta.people||[]).find(p=>p.n==='ابن عثيمين')}));
  ok(mv.n===J.items.length,'انتقلت كل الفوائد ('+mv.n+'/'+J.items.length+') كما هي'); ok(mv.people.includes('ابن كثير')&&mv.al&&mv.al.a.includes('العثيمين'),'انتقل القائلون مع أسمائهم البديلة'); ok(mv.pub>=5,'بقي الظهور كما في الملف ('+mv.pub+' عامة)');
  ok(e2.length===0,'لا أخطاء في الصفحة الثانية '+e2.join('|'));
  console.log('\nأخطاء الصفحة:',errors.length?errors:'لا شيء');
  console.log(pass+' نجح، '+fail+' فشل');
  await browser.close(); gas.srv.close(); web.close(); process.exit(fail||errors.length?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
