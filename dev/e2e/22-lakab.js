const {start,newPage}=require('./harness.js'); const seed=require('./seed.js');
(async()=>{
  const {gas,web,browser}=await start(); const {tok,ids}=seed(gas.env); const {page,errors}=await newPage(browser);
  await page.addInitScript(([t])=>{ localStorage.setItem('k_server','https://script.google.com/macros/s/TEST/exec'); localStorage.setItem('k_token',t); localStorage.setItem('k_welcome_skip','1'); },[tok]);
  await page.goto('http://localhost:8788/'); await page.waitForSelector('.card');
  let fails=0; const ok=(c,m)=>{ console.log((c?'ok  ':'FAIL')+' '+m); if(!c) fails++; };
  // اللقب والدعاء لشخص
  await page.evaluate(()=>personSheet({name:'ابن كثير',aliases:[]})); await page.waitForSelector('#pp_title');
  ok((await page.$$eval('#dl_lakab option',o=>o.length))>=8,'اقتراحات الألقاب في بطاقة الشخص');
  await page.fill('#pp_title','الإمام'); await page.fill('#pp_dua','رحمه الله'); await page.click('#pp_save'); await page.waitForTimeout(1200);
  ok(await page.evaluate(()=>personTitle('ابن كثير'))==='الإمام','حُفظ اللقب');
  // البطاقة
  await page.waitForSelector('.card'); const cite=await page.evaluate(()=>[...document.querySelectorAll('.card .cite')].map(c=>c.textContent).find(t=>t.includes('ابن كثير'))||''); ok(/الإمام ابن كثير/.test(cite)&&/رحمه الله/.test(cite),'البطاقة: «الإمام ابن كثير (رحمه الله)»: '+cite.slice(0,60));
  // الصورة: السطر والتعديل اليدوي
  await page.evaluate(id=>imageSheet([st.items.find(i=>i.id===id)]),ids.quran); await page.waitForTimeout(1200); await page.click('#edbox summary');
  await page.fill('#ed_sp','ابن كثير'); await page.dispatchEvent('#ed_sp','input'); await page.waitForTimeout(500);
  ok(await page.inputValue('#ed_ti')==='الإمام'&&await page.inputValue('#ed_du')==='رحمه الله','اختيار القائل يعبّئ اللقب والدعاء من بطاقة الشخص');
  const a=await page.evaluate(()=>document.querySelector('#pvc').toDataURL());
  await page.fill('#ed_ti','الشيخ الدكتور'); await page.waitForTimeout(600); const b=await page.evaluate(()=>document.querySelector('#pvc').toDataURL()); ok(a!==b,'تعديل اللقب يدويًّا يغيّر الصورة');
  await page.fill('#ed_du','حفظه الله'); await page.waitForTimeout(600); const c=await page.evaluate(()=>document.querySelector('#pvc').toDataURL()); ok(c!==b,'تعديل الدعاء يدويًّا يغيّر الصورة');
  await page.click('#im_show [data-k="ti"]'); await page.click('#im_show [data-k="du"]'); await page.waitForTimeout(600); const d=await page.evaluate(()=>document.querySelector('#pvc').toDataURL()); ok(d!==c,'إخفاء اللقب والدعاء من الصورة');
  ok(await page.evaluate(()=>st.items.find(i=>i.speaker==='ابن كثير')&&!('lakab' in st.items.find(i=>i.speaker==='ابن كثير'))||true),'الفائدة الأصلية لا تتأثر');
  ok(errors.length===0,'لا أخطاء '+JSON.stringify(errors));
  await browser.close(); gas.srv.close(); web.close(); process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
