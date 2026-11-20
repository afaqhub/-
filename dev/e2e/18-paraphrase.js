const {start,newPage}=require('./harness.js'); const seed=require('./seed.js');
(async()=>{
  const {gas,web,browser}=await start(); const {tok}=seed(gas.env); const {page,errors}=await newPage(browser);
  await page.addInitScript(([t])=>{ localStorage.setItem('k_server','https://script.google.com/macros/s/TEST/exec'); localStorage.setItem('k_token',t); localStorage.setItem('k_welcome_skip','1'); },[tok]);
  await page.goto('http://localhost:8788/'); await page.waitForSelector('.card');
  let fails=0; const ok=(c,m)=>{ console.log((c?'ok  ':'FAIL')+' '+m); if(!c) fails++; };
  await page.evaluate(()=>editor(null)); await page.waitForSelector('#f_para');
  ok(!(await page.isChecked('#f_para')),'الافتراضي: بالنص (غير معلَّم بتصرّف)');
  await page.fill('#f_text','فائدة أولى بالنص'); await page.click('#save'); await page.waitForTimeout(900);
  ok(await page.evaluate(()=>st.items.find(i=>i.text==='فائدة أولى بالنص').paraphrase)===false,'حُفظت بالنص');
  await page.evaluate(()=>editor(null)); await page.check('#f_para'); await page.fill('#f_text','فائدة ثانية بتصرف'); await page.click('#save'); await page.waitForTimeout(900);
  const it=await page.evaluate(()=>st.items.find(i=>i.text==='فائدة ثانية بتصرف')); ok(it.paraphrase===true,'حُفظت بتصرّف');
  ok(await page.locator('.card:has-text("فائدة ثانية بتصرف") .badge:has-text("بتصرّف")').count()===1,'شارة «بتصرّف» على البطاقة');
  ok(await page.evaluate(i=>citeText(st.items.find(x=>x.id===i)).includes('بتصرّف'),it.id),'النسخ المُوثَّق يذكر التصرف');
  // الاختصار [بتصرف]
  await page.evaluate(()=>editor(null)); await page.fill('#f_text','فائدة بالاختصار [بتصرف] @ابن_القيم'); await page.click('#save'); await page.waitForTimeout(900);
  const s3=await page.evaluate(()=>st.items.find(i=>i.speaker==='ابن القيم'&&i.text.startsWith('فائدة بالاختصار'))); ok(s3&&s3.paraphrase===true&&!/بتصرف/.test(s3.text),'الاختصار [بتصرف] يعلّم الفائدة ويُحذف من النص');
  ok(errors.length===0,'لا أخطاء '+JSON.stringify(errors));
  await browser.close(); gas.srv.close(); web.close(); process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
