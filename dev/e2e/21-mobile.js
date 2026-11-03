const {start,newPage,shot}=require('./harness.js'); const seed=require('./seed.js');
(async()=>{
  const {gas,web,browser}=await start(); const {tok}=seed(gas.env);
  const ctx=await browser.newContext({viewport:{width:360,height:740},locale:'ar-SA'}); const page=await ctx.newPage();
  await page.route('https://fonts.googleapis.com/**',r=>r.fulfill({contentType:'text/css',body:''})); await page.route('https://fonts.gstatic.com/**',r=>r.abort());
  await page.route('https://script.google.com/macros/s/TEST/exec',async r=>{ const t=await (await fetch('http://localhost:8787/',{method:'POST',body:r.request().postData()})).text(); r.fulfill({contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:t}); });
  await page.addInitScript(([t])=>{ localStorage.setItem('k_server','https://script.google.com/macros/s/TEST/exec'); localStorage.setItem('k_token',t); localStorage.setItem('k_welcome_skip','1'); },[tok]);
  await page.goto('http://localhost:8788/'); await page.waitForSelector('.card');
  let fails=0; const ok=(c,m)=>{ console.log((c?'ok  ':'FAIL')+' '+m); if(!c) fails++; };
  const b=await page.$eval('.brand',e=>({sw:e.scrollWidth,cw:e.clientWidth,t:e.textContent})); ok(b.sw<=b.cw+1,'عنوان المنصة كامل في الترويسة على ٣٦٠px: «'+b.t+'» '+b.sw+'/'+b.cw);
  ok(await page.locator('#btnRefresh').isVisible()&&await page.locator('#btnMenu').isVisible()&&await page.locator('#btnAuth').isVisible(),'أزرار ⟳ ☰ 🚪 ظاهرة');
  ok(!(await page.locator('#btnTheme').isVisible()),'زر الليلي انتقل إلى القائمة'); await shot(page,'95-m-header');
  await page.click('#btnMenu'); ok((await page.textContent('#sheet .shhd h3')).includes('المالك'),'القائمة تعرض حالة الحساب'); ok(await page.locator('.menu .pbtn:has-text("الوضع الليلي")').count()===1,'الوضع الليلي في القائمة'); await page.evaluate(()=>closeSheet(true));
  // المراجع: الأسماء كاملة
  await page.evaluate(()=>goTab('refs')); await page.waitForSelector('.ixrow'); await page.waitForTimeout(800); await shot(page,'96-m-refs');
  const rows=await page.$$eval('.ixrow',rs=>rs.map(r=>{ const n=r.querySelector('.ixname span'); const c=r.querySelector('.ixname'); return {tw:n.scrollWidth,cw:n.clientWidth,top:n.getBoundingClientRect().top,ctl:(r.querySelector('.ixhide')||{getBoundingClientRect:()=>({top:0})}).getBoundingClientRect().top}; }));
  ok(rows.length>=2&&rows.every(r=>r.tw<=r.cw+1),'أسماء المراجع غير مقصوصة');
  ok(rows.every(r=>r.ctl>r.top),'الأدوات تحت الاسم لا بجانبه');
  // المحرر والإعدادات
  await page.evaluate(()=>{ closeSheet(true); editor(null); }); await page.waitForSelector('#f_tpls'); await shot(page,'97-m-editor');
  const ov=await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1); ok(ov,'لا تمرير أفقي في المحرر');
  await page.evaluate(()=>closeSheet(true)); await page.evaluate(()=>goTab('admin')); await page.waitForTimeout(600); await shot(page,'98-m-admin');
  ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'لا تمرير أفقي في الإعدادات');
  await browser.close(); gas.srv.close(); web.close(); process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
