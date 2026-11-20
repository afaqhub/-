const {start,newPage}=require('./harness.js'); const seed=require('./seed.js');
(async()=>{
  const {gas,web,browser}=await start(); const {tok,ids}=seed(gas.env); const {page,errors}=await newPage(browser);
  await page.addInitScript(([t])=>{ localStorage.setItem('k_server','https://script.google.com/macros/s/TEST/exec'); localStorage.setItem('k_token',t); localStorage.setItem('k_welcome_skip','1'); },[tok]);
  await page.goto('http://localhost:8788/'); await page.waitForSelector('.card');
  let fails=0; const ok=(c,m)=>{ console.log((c?'ok  ':'FAIL')+' '+m); if(!c) fails++; };
  ok(await page.locator('#btnRefresh').count()===1,'زر التحديث في الأعلى');
  const n0=await page.evaluate(()=>st.items.length);
  gas.env.call('purge',{id:ids.quran},tok); gas.env.call('purge',{id:ids.hadith},tok);       // حذف مباشر من الخادم دون علم الصفحة
  await page.click('#btnRefresh'); await page.waitForFunction(n=>st.items.length===n-2,n0,{timeout:8000});
  ok(true,'التحديث يلتقط ما حُذف: '+n0+' ← '+await page.evaluate(()=>st.items.length));
  ok(await page.locator('.toast, #toast').first().textContent().then(t=>/حُدّثت/.test(t)),'رسالة تأكيد التحديث');
  await page.reload(); await page.waitForSelector('.card'); ok(await page.evaluate(()=>st.items.length)===n0-2,'النسخة المحفوظة في الجهاز لا تعيد المحذوف');
  ok(errors.length===0,'لا أخطاء '+JSON.stringify(errors));
  await browser.close(); gas.srv.close(); web.close(); process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
