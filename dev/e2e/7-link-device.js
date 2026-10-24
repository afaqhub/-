/* ربط جهاز آخر برابط #srv=، وأن الجهاز المضبوط يتجاهل الروابط الغريبة */
const {start,newPage}=require('./harness.js'); const seed=require('./seed.js');
let pass=0,fail=0; const ok=(c,m)=>{ if(c){pass++;console.log('  ✓',m)}else{fail++;console.log('  ✗',m)} };
(async()=>{
  const {gas,web,browser}=await start(); const {tok}=seed(gas.env);
  const URL='https://script.google.com/macros/s/TEST/exec';
  const a=await newPage(browser); await a.page.addInitScript(([t,u])=>{ localStorage.setItem('k_server',u); localStorage.setItem('k_token',t); localStorage.setItem('k_welcome_skip','1'); },[tok,URL]);
  await a.page.goto('http://localhost:8788/'); await a.page.waitForSelector('.card');
  const link=await a.page.evaluate(()=>linkAnother()); ok(link==='http://localhost:8788/#srv='+encodeURIComponent(URL),'رابط الجوال: '+link.slice(0,60)+'…');
  await a.page.evaluate(()=>goTab('admin')); await a.page.waitForSelector('#lk_url',{state:'attached'}); const ln=await a.page.locator('#ln_line').textContent(); console.log(JSON.stringify(ln)); ok(ln===URL,'رابط الخادم الجاهز للنسخ صحيح');
  // الجوال: لا شيء مخزَّن، يفتح الرابط
  const b=await newPage(browser); let dlg='';
  b.page.on('dialog',async d=>{ dlg=d.message(); await d.accept(); });
  await b.page.addInitScript(()=>{ localStorage.setItem('k_welcome_skip','1'); });
  await b.page.goto(link); await b.page.waitForSelector('.card,.empty'); await b.page.waitForTimeout(300);
  ok(/خادمك/.test(dlg),'سُئل عن الثقة بالخادم مرة واحدة'); ok(await b.page.evaluate(()=>st.items.length>0&&!st.owner),'فتحت زائرًا (يرى العام فقط)'); ok(await b.page.evaluate(()=>!location.hash.includes('srv=')),'نُظّف الرابط من الشريط');
  await b.page.reload(); await b.page.waitForSelector('.card'); ok(true,'بعد التحديث لا يسأل ثانيةً');
  await b.page.click('#btnAuth'); await b.page.fill('#pw','Secret123'); await b.page.click('#go'); await b.page.waitForSelector('#fab',{state:'visible'}); ok(true,'سجّل دخوله بكلمة المرور');
  // جهاز مضبوط يتجاهل خادمًا غريبًا
  const c=await newPage(browser); let asked=false; c.page.on('dialog',async d=>{ asked=true; await d.dismiss(); });
  await c.page.addInitScript(([u])=>{ localStorage.setItem('k_server',u); localStorage.setItem('k_welcome_skip','1'); },[URL]);
  await c.page.goto('http://localhost:8788/#srv='+encodeURIComponent('https://script.google.com/macros/s/EVIL/exec')); await c.page.waitForSelector('.card,.empty');
  ok(!asked && await c.page.evaluate(()=>srv().endsWith('/TEST/exec')),'جهاز مضبوط لا يقبل خادمًا آخر من الرابط');
  // خادم بصيغة غير صحيحة يُرفض
  const d=await newPage(browser); d.page.on('dialog',async x=>{ await x.accept(); }); await d.page.addInitScript(()=>{ localStorage.setItem('k_welcome_skip','1'); });
  await d.page.goto('http://localhost:8788/#srv='+encodeURIComponent('https://evil.example.com/exec')); await d.page.waitForSelector('#srvin');
  ok(await d.page.evaluate(()=>!srv()),'رابط ليس من Google لا يُقبل أبدًا');
  console.log('الرابط مضمَّن في index.html (الطريقة المعتادة)');
  global.__embedUrl=URL;
  const h=await newPage(browser); let asked3=false; h.page.on('dialog',async x=>{ asked3=true; await x.dismiss(); }); await h.page.addInitScript(()=>{ localStorage.setItem('k_welcome_skip','1'); });
  await h.page.goto('http://localhost:8788/'); await h.page.waitForSelector('.card,.empty'); await h.page.waitForTimeout(300);
  ok(!asked3 && await h.page.evaluate(()=>st.items.length>0 && !srv().length===false && !document.querySelector('#srvin')),'جهاز جديد يفتح مباشرة كزائر دون أي سؤال عن الرابط');
  await h.page.click('#btnAuth'); await h.page.fill('#pw','Secret123'); await h.page.click('#go'); await h.page.waitForSelector('#fab',{state:'visible'}); ok(true,'ويدخل بكلمة المرور فقط');
  await h.page.evaluate(()=>goTab('admin')); await h.page.waitForSelector('#s_save'); ok((await h.page.locator('.bars:has-text("ربط الأجهزة والزوار")').first().innerText()).includes('موضوع في الصفحة'),'لوحة التحكم تؤكد أنه مضمَّن');
  global.__embedUrl=null;
  console.log('ملف server.txt');
  global.__serverTxt=URL+'\n';
  const e=await newPage(browser); let asked2=false; e.page.on('dialog',async x=>{ asked2=true; await x.dismiss(); }); await e.page.addInitScript(()=>{ localStorage.setItem('k_welcome_skip','1'); });
  await e.page.goto('http://localhost:8788/'); await e.page.waitForSelector('.card,.empty'); await e.page.waitForTimeout(300);
  ok(!asked2 && await e.page.evaluate(()=>st.items.length>0 && !!st.srvFromFile),'جهاز جديد بلا أي إعداد يتصل وحده من server.txt');
  await e.page.click('#btnAuth'); await e.page.fill('#pw','Secret123'); await e.page.click('#go'); await e.page.waitForSelector('#fab',{state:'visible'});
  await e.page.evaluate(()=>goTab('admin')); await e.page.waitForSelector('#s_save'); ok((await e.page.locator('.bars:has-text("ربط الأجهزة والزوار")').first().innerText()).includes('server.txt'),'لوحة التحكم تُظهر أنه مضبوط عبر الملف');
  // الملف يغلب المحفوظ القديم
  const f=await newPage(browser); await f.page.addInitScript(()=>{ localStorage.setItem('k_server','https://script.google.com/macros/s/OLD/exec'); localStorage.setItem('k_welcome_skip','1'); });
  await f.page.goto('http://localhost:8788/'); await f.page.waitForFunction(()=>srv().endsWith('/TEST/exec'),null,{timeout:6000}); ok(true,'الرابط في الملف يحلّ محل رابط قديم محفوظ');
  global.__serverTxt='<html>not a url</html>';
  const g2=await newPage(browser); await g2.page.addInitScript(()=>{ localStorage.setItem('k_welcome_skip','1'); }); await g2.page.goto('http://localhost:8788/'); await g2.page.waitForSelector('#srvin'); ok(true,'ملف غير صالح لا يُقبل ويُسأل عن الرابط');
  global.__serverTxt=null;
  console.log(a.errors,b.errors); console.log(pass+' نجح، '+fail+' فشل'); await browser.close(); gas.srv.close(); web.close(); process.exit(fail?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
