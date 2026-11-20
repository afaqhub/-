const {start,newPage}=require('./harness.js'); const seed=require('./seed.js');
(async()=>{
  const {gas,web,browser}=await start(); const {tok,ids}=seed(gas.env); const {page,errors}=await newPage(browser);
  await page.addInitScript(([t])=>{ localStorage.setItem('k_server','https://script.google.com/macros/s/TEST/exec'); localStorage.setItem('k_token',t); localStorage.setItem('k_welcome_skip','1'); },[tok]);
  await page.goto('http://localhost:8788/'); await page.waitForSelector('.card');
  let fails=0; const ok=(c,m)=>{ console.log((c?'ok  ':'FAIL')+' '+m); if(!c) fails++; };
  // جديدة: الأصل اليوم
  await page.evaluate(()=>editor(null)); await page.waitForSelector('#dt_txt');
  ok((await page.textContent('#dt_txt')).includes('اليوم'),'الأصل: تاريخ اليوم بالهجري');
  await page.fill('#f_text','فائدة بتاريخ اليوم تلقائيا'); await page.click('#save'); await page.waitForTimeout(800);
  const t0=await page.evaluate(()=>st.items.find(i=>i.text==='فائدة بتاريخ اليوم تلقائيا').createdAt);
  ok(Math.abs(Date.now()-new Date(t0))<120000,'حُفظت بتاريخ اليوم');
  // تغيير من قوائم الهجري
  await page.evaluate(()=>editor(null)); await page.click('#dt_chg');
  await page.selectOption('#dt_y','1445'); await page.selectOption('#dt_m','8'); await page.selectOption('#dt_d','28'); await page.waitForTimeout(200);
  ok((await page.textContent('#dt_txt')).includes('٢٨ شعبان ١٤٤٥'),'النص يعرض الهجري المختار: '+await page.textContent('#dt_txt'));
  ok((await page.inputValue('#dt_g'))==='2024-03-09','الميلادي المقابل 2024-03-09 : '+await page.inputValue('#dt_g'));
  await page.fill('#f_text','فائدة قديمة مقيدة'); await page.click('#save'); await page.waitForTimeout(800);
  const it=await page.evaluate(()=>st.items.find(i=>i.text==='فائدة قديمة مقيدة'));
  ok(it&&it.createdAt.startsWith('2024-03-09')||it&&it.createdAt.startsWith('2024-03-08'),'حُفظت بالتاريخ المختار '+(it&&it.createdAt));
  ok(it&&/١٤٤٥/.test(it.createdHijri||''),'الهجري المخزّن '+(it&&it.createdHijri));
  // تعديل بالتقويم الميلادي
  await page.evaluate((id)=>editor(st.items.find(i=>i.id===id)),it.id); await page.click('#dt_chg'); await page.fill('#dt_g','2023-01-15'); await page.dispatchEvent('#dt_g','change');
  ok((await page.textContent('#dt_txt')).includes('١٤٤٤'),'تحديث الهجري من الميلادي: '+await page.textContent('#dt_txt'));
  await page.click('#save'); await page.waitForTimeout(800);
  ok((await page.evaluate((id)=>st.items.find(i=>i.id===id).createdAt,it.id)).startsWith('2023-01-1'),'تعديل التاريخ يُحفظ');
  // تعديل بلا تغيير تاريخ لا يمسّه
  const before=await page.evaluate((id)=>st.items.find(i=>i.id===id).createdAt,ids.quran);
  await page.evaluate((id)=>editor(st.items.find(i=>i.id===id)),ids.quran); await page.click('#save'); await page.waitForTimeout(800);
  ok(before===await page.evaluate((id)=>st.items.find(i=>i.id===id).createdAt,ids.quran),'التعديل بلا تغيير يحفظ التاريخ الأصلي');
  ok(errors.length===0,'لا أخطاء '+JSON.stringify(errors));
  await browser.close(); gas.srv.close(); web.close(); process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
