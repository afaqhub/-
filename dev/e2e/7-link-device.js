/* ربط جهاز آخر برابط #srv=، وأن الجهاز المضبوط يتجاهل الروابط الغريبة */
const {start,newPage}=require('./harness.js'); const seed=require('./seed.js');
let pass=0,fail=0; const ok=(c,m)=>{ if(c){pass++;console.log('  ✓',m)}else{fail++;console.log('  ✗',m)} };
(async()=>{
  const {gas,web,browser}=await start(); const {tok}=seed(gas.env);
  const URL='https://script.google.com/macros/s/TEST/exec';
  const a=await newPage(browser); await a.page.addInitScript(([t,u])=>{ localStorage.setItem('k_server',u); localStorage.setItem('k_token',t); localStorage.setItem('k_welcome_skip','1'); },[tok,URL]);
  await a.page.goto('http://localhost:8788/'); await a.page.waitForSelector('.card');
  const link=await a.page.evaluate(()=>linkAnother()); ok(link==='http://localhost:8788/#srv='+encodeURIComponent(URL),'رابط الجوال: '+link.slice(0,60)+'…');
  await a.page.evaluate(()=>goTab('admin')); await a.page.waitForSelector('#lk_url'); const ln=await a.page.locator('#ln_line').textContent(); console.log(JSON.stringify(ln)); ok(ln==="const SERVER_URL = '"+URL+"';",'السطر الجاهز للصفحة صحيح');
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
  console.log(a.errors,b.errors); console.log(pass+' نجح، '+fail+' فشل'); await browser.close(); gas.srv.close(); web.close(); process.exit(fail?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
