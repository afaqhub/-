const {start,newPage,shot}=require('./harness.js'); const seed=require('./seed.js');
(async()=>{
  const {gas,web,browser}=await start(); const {tok,ids}=seed(gas.env); const {page,errors}=await newPage(browser);
  await page.addInitScript(([t])=>{ localStorage.setItem('k_server','https://script.google.com/macros/s/TEST/exec'); localStorage.setItem('k_token',t); localStorage.setItem('k_welcome_skip','1'); },[tok]);
  let slow=0, failRemove=false;
  await page.goto('http://localhost:8788/'); await page.waitForSelector('.card');
  // اجعل الخادم بطيئًا (٢ ثانية) لمعرفة أن الصفحة لا تتجمد
  await page.unroute('https://script.google.com/macros/s/TEST/exec');
  await page.route('https://script.google.com/macros/s/TEST/exec',async r=>{
    const body=r.request().postData()||'';
    if(slow&&/"fn":"(remove|setField|save|bulk|restore)"/.test(body)) await new Promise(x=>setTimeout(x,slow));
    if(failRemove&&/"fn":"remove"/.test(body)) return r.abort('failed');
    const t=await (await fetch('http://localhost:8787/',{method:'POST',body})).text(); r.fulfill({contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:t});
  });
  let fails=0; const ok=(c,m)=>{ console.log((c?'ok  ':'FAIL')+' '+m); if(!c) fails++; };
  const n0=await page.evaluate(()=>st.items.length); slow=2500;
  await page.evaluate(id=>removeItem(st.items.find(i=>i.id===id)),ids.quran);
  ok(await page.evaluate(()=>st.items.length)===n0-1,'الحذف يظهر فورًا في الواجهة');
  ok(await page.locator('#loading.on').count()===0,'لا شاشة حجب أثناء الحذف');
  ok(await page.locator('#bgchip.on').count()===1&&(await page.textContent('#bgchip')).includes('جارٍ الحذف'),'شريط صغير «جارٍ الحذف…» لا يمنع التنقل');
  await page.evaluate(()=>window.scrollTo(0,200)); await page.click('.tab:has-text("المميزة")'); await page.click('.tab:has-text("الكل")');
  ok(true,'التنقل بين التبويبات أثناء الحذف يعمل');
  await page.waitForFunction(()=>!document.querySelector('#bgchip.on'),null,{timeout:9000}); await page.waitForTimeout(1500);
  ok(!gas.env.call('list',{},tok).data.some(i=>i.id===ids.quran&&i.status!=='محذوفة'),'ثم يُنفَّذ في الخادم');
  // نجمة وظهور فوريان
  slow=2000; const first=await page.evaluate(()=>st.items[0].id);
  const ftxt=await page.evaluate(id=>{ const i=st.items.find(x=>x.id===id); i.starred=false; render(); return i.text.slice(0,25); },first);
  await page.locator('.cards .card:has-text("'+ftxt+'") .star').first().click(); ok(await page.evaluate(id=>st.items.find(x=>x.id===id).starred,first)===true,'التمييز فوري'); await page.waitForTimeout(2600);
  // الإضافة غير حاجبة
  await page.evaluate(()=>editor(null)); await page.fill('#f_text','فائدة تُحفظ في الخلفية'); await page.click('#save');
  ok(await page.locator('#sheet .shhd').count()===0||!(await page.locator('#scrim.open').count()),'النافذة تُغلق فور الحفظ');
  ok(await page.locator('.card.saving').count()===1,'تظهر الفائدة «جارٍ الحفظ…» فورًا');
  await page.waitForFunction(()=>!document.querySelector('#bgchip.on'),null,{timeout:9000}); await page.waitForTimeout(1500);
  ok(await page.evaluate(()=>st.items.some(i=>i.text==='فائدة تُحفظ في الخلفية'&&!i._saving&&!/^tmp-/.test(i.id))),'ثم تُستبدل بالفائدة الحقيقية');
  // فشل: يعود العنصر وتُرجع رسالة
  slow=0; failRemove=true; const n1=await page.evaluate(()=>st.items.length);
  await page.evaluate(id=>removeItem(st.items.find(i=>i.id===id)),ids.hadith); ok(await page.evaluate(()=>st.items.length)===n1-1,'الحذف المتفائل');
  await page.waitForFunction(n=>st.items.length===n,n1,{timeout:9000}); ok(true,'عند الفشل تعود الفائدة وتظهر رسالة: '+await page.textContent('#toast'));
  ok(errors.filter(e=>!/ERR_FAILED/.test(e)).length===0,'لا أخطاء '+JSON.stringify(errors));
  await browser.close(); gas.srv.close(); web.close(); process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
