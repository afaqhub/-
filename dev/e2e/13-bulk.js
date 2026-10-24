const {start,newPage,shot}=require('./harness.js'); const seed=require('./seed.js');
(async()=>{
  const {gas,web,browser}=await start(); const {tok}=seed(gas.env); const {page,errors}=await newPage(browser);
  await page.addInitScript(([t])=>{ localStorage.setItem('k_server','https://script.google.com/macros/s/TEST/exec'); localStorage.setItem('k_token',t); localStorage.setItem('k_welcome_skip','1'); },[tok]);
  await page.goto('http://localhost:8788/'); await page.waitForSelector('.card');
  let fails=0; const ok=(c,m)=>{ console.log((c?'ok  ':'FAIL')+' '+m); if(!c) fails++; };
  page.on('dialog',d=>d.accept());
  const cnt=()=>page.evaluate(()=>({all:st.items.length,pub:st.items.filter(i=>i.visibility==='عامة').length}));
  await page.click('#btnMenu'); ok(await page.locator('.menu .pbtn:has-text("إجراءات جماعية")').count()===1,'بند الإجراءات الجماعية في القائمة');
  await page.click('.menu .pbtn:has-text("إجراءات جماعية")'); await page.waitForSelector('[data-op="pub"]'); await shot(page,'70-bulk');
  await page.click('[data-op="pub"]'); await page.waitForTimeout(1500);
  let c=await cnt(); ok(c.pub===c.all,'إظهار الكل: '+c.pub+'/'+c.all);
  await page.click('#btnMenu'); await page.click('.menu .pbtn:has-text("إجراءات جماعية")'); await page.click('[data-op="priv"]'); await page.waitForTimeout(1500);
  c=await cnt(); ok(c.pub===0,'إخفاء الكل');
  // نطاق التصفية
  await page.evaluate(()=>{ st.f.cat=st.items[0].cat; renderChrome(); render(); });
  const inCat=await page.evaluate(()=>filtered().length);
  await page.click('#btnMenu'); await page.click('.menu .pbtn:has-text("إجراءات جماعية")'); await page.click('#bk_scope [data-s="view"]'); await page.click('[data-op="pub"]'); await page.waitForTimeout(1500);
  c=await cnt(); ok(c.pub===inCat,'إظهار ما في التصفية فقط ('+c.pub+'/'+inCat+')');
  await page.click('#btnMenu'); await page.click('.menu .pbtn:has-text("إجراءات جماعية")'); await page.click('#bk_scope [data-s="view"]'); await page.click('[data-op="trash"]'); await page.waitForTimeout(1500);
  c=await cnt(); ok(c.all>0&&await page.evaluate(()=>st.items.length)===c.all,'الحذف إلى السلة يخفيها من القائمة ('+c.all+' باقية)');
  // الحذف الكامل
  await page.evaluate(()=>{ st.f=Object.assign({},NOFILTER); renderChrome(); render(); });
  await page.click('#btnMenu'); await page.click('.menu .pbtn:has-text("إجراءات جماعية")'); await page.click('[data-op="trash"]'); await page.waitForTimeout(1500);
  ok(await page.evaluate(()=>st.items.length)===0,'حذف الكل بضغطة');
  ok(gas.env.call('trash',{},tok).data.length>=5,'كلها في السلة وقابلة للاستعادة');
  ok(errors.length===0,'لا أخطاء '+JSON.stringify(errors));
  await browser.close(); gas.srv.close(); web.close(); process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
