const {start,newPage,shot,OUT}=require('./harness.js'); const seed=require('./seed.js'); const fs=require('fs'); const path=require('path');
(async()=>{
  const {gas,web,browser}=await start(); const env=gas.env; const {tok,ids}=seed(env);
  const {page,errors}=await newPage(browser);
  await page.addInitScript(([t])=>{ localStorage.setItem('k_server','https://script.google.com/macros/s/TEST/exec'); localStorage.setItem('k_token',t); localStorage.setItem('k_welcome_skip','1'); },[tok]);
  await page.goto('http://localhost:8788/'); await page.waitForSelector('.card');
  const grab=async(name)=>{ const d=await page.evaluate(()=>document.querySelector('#pvc').toDataURL('image/png')); fs.writeFileSync(path.join(OUT,name+'.png'),Buffer.from(d.split(',')[1],'base64')); return d; };
  let fails=0; const ok=(c,m)=>{ console.log((c?'ok  ':'FAIL')+' '+m); if(!c) fails++; };
  const open=async(id)=>{ await page.evaluate((id)=>{ imageSheet([st.items.find(i=>i.id===id)]); },id); await page.waitForTimeout(1200); };
  await open(ids.quran);
  await page.click('#tp button[data-k="hadith"]'); await page.waitForTimeout(500); await page.click('#fnbox summary');
  const base=await grab('font-base');
  ok((await page.textContent('#fn_st')).includes('الأصلي'),'يبدأ بإعداد القالب الأصلي');
  await page.click('#fn_ft button[data-f="naskh"]'); await page.waitForTimeout(600); const nk=await grab('font-naskh');
  ok(nk!==base,'تغيّر الرسم عند اختيار خط نسخ'); ok((await page.textContent('#fn_st')).includes('خاص'),'يُعلَن أنه إعداد خاص بالقالب');
  await page.click('#fn_ft button[data-f="cairo"]'); await page.waitForTimeout(600); const ca=await grab('font-cairo'); ok(ca!==nk,'كايرو يختلف عن النسخ');
  await page.fill('#fn_sc','60'); await page.dispatchEvent('#fn_sc','input'); await page.waitForTimeout(600); const small=await grab('font-cairo-60'); ok(small!==ca,'تصغير الخط يغيّر الرسم');
  await page.fill('#fn_sc','140'); await page.dispatchEvent('#fn_sc','input'); await page.waitForTimeout(600); const big=await grab('font-cairo-140'); ok(big!==small,'تكبير الخط يغيّر الرسم');
  // قالب آخر لا يتأثر
  await page.click('#tp button[data-k="minimal"]'); await page.waitForTimeout(600);
  ok((await page.textContent('#fn_st')).includes('الأصلي'),'قالب آخر يبقى أصليًا'); await page.click('#tp button[data-k="hadith"]'); await page.waitForTimeout(500);
  ok(await page.inputValue('#fn_sc')==='140','يُستعاد إعداد القالب عند العودة إليه');
  // افتراضي عام
  await page.click('#fn_def'); await page.click('#tp button[data-k="minimal"]'); await page.waitForTimeout(500);
  ok((await page.textContent('#fn_st')).includes('الافتراضي العام')&&await page.inputValue('#fn_sc')==='140','الافتراضي العام يسري على قالب آخر');
  await page.evaluate(()=>closeSheet(true)); await open(ids.quran);
  ok((await page.evaluate(()=>JSON.parse(localStorage.getItem('k_img')).fdef.font))==='cairo','الافتراضي محفوظ بين الفتحات');
  await page.click('#fnbox summary'); await page.click('#fn_rs'); ok((await page.textContent('#fn_st')).includes('الأصلي'),'إعادة الضبط تعيد الأصلي');
  // نص طويل مع تكبير: يبقى مقروءًا ولا ينهار
  await page.evaluate(()=>closeSheet(true)); await open(ids.long); await page.click('#fnbox summary'); await page.fill('#fn_sc','150'); await page.dispatchEvent('#fn_sc','input'); await page.waitForTimeout(900);
  ok(!(await page.$eval('#im_hint',e=>e.textContent)).includes('طويل جدًّا'),'نص طويل بحجم ١٥٠٪ لا يفشل');
  // قالب مستنسخ
  await page.click('#tp button[data-k="c4"]'); await page.waitForTimeout(800); const c4=await grab('font-c4'); await page.click('#fn_ft button[data-f="ruqaa"]'); await page.waitForTimeout(800); ok((await grab('font-c4-ruqaa'))!==c4,'الخط يسري على القوالب المستنسخة');
  ok(errors.length===0,'لا أخطاء '+JSON.stringify(errors));
  await browser.close(); gas.srv.close(); web.close(); process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
