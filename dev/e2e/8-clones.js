const {start,newPage,shot,OUT}=require('./harness.js'); const seed=require('./seed.js'); const fs=require('fs'); const path=require('path');
(async()=>{
  const {gas,web,browser}=await start(); const env=gas.env; const {tok,ids}=seed(env);
  const {page,errors}=await newPage(browser);
  await page.addInitScript(([t])=>{ localStorage.setItem('k_server','https://script.google.com/macros/s/TEST/exec'); localStorage.setItem('k_token',t); localStorage.setItem('k_welcome_skip','1'); },[tok]);
  await page.goto('http://localhost:8788/'); await page.waitForSelector('.card');
  const grab=async(name)=>{ const d=await page.evaluate(()=>document.querySelector('#pvc').toDataURL('image/png')); fs.writeFileSync(path.join(OUT,name+'.png'),Buffer.from(d.split(',')[1],'base64')); };
  const openImg=async(id)=>{ await page.evaluate((id)=>{ imageSheet([st.items.find(i=>i.id===id)]); },id); await page.waitForTimeout(1200); };
  let fails=0; const ok=(c,m)=>{ console.log((c?'ok  ':'FAIL')+' '+m); if(!c) fails++; };
  await openImg(ids.quran);
  const keys=await page.$$eval('#tp .tcell',b=>b.map(x=>x.dataset.k));
  ok(['c1','c2','c4','c5','c7'].every(k=>keys.includes(k)),'clone templates listed: '+keys.filter(k=>/^c\d/.test(k)).join(','));
  ok(await page.evaluate(()=>!!window.KUNNASHA_TPL),'القوالب تُحمَّل من ملف templates.js الواحد');
  for(const k of ['c1','c2','c4','c5','c7']){ await page.click(`#tp button[data-k="${k}"]`); await page.waitForTimeout(700); await grab('clone-'+k+'-quran'); ok(await page.evaluate(()=>document.querySelector('#pvc').width)>=1000,k+' preview full size'); }
  ok(await page.$eval('#szw',e=>e.style.display)==='none','size chips hidden for clone');
  // numbering + gain
  await page.check('#im_no'); await page.fill('#im_num','61'); await page.waitForTimeout(600); await grab('clone-c7-numbered');
  await page.evaluate(()=>closeSheet(true));
  for(const id of ['long','hadith','poetry','listen']){ await openImg(ids[id]); await page.click('#tp button[data-k="c4"]'); await page.waitForTimeout(900); await grab('clone-c4-'+id); ok(!(await page.$eval('#im_hint',e=>e.textContent)).includes('خطأ'),id+' renders'); await page.evaluate(()=>closeSheet(true)); }
  await openImg(ids.long); await page.click('#tp button[data-k="c1"]'); await page.waitForTimeout(1200); console.log('long on c1 pages:',await page.locator('#pgs button').count()); await grab('clone-c1-long'); await page.evaluate(()=>closeSheet(true));
  ok(errors.length===0,'no page errors '+JSON.stringify(errors));
  // مجلد templates غائب: تبقى بقية القوالب تعمل دون أخطاء
  global.__noTemplates=true; const p2=await newPage(browser);
  await p2.page.addInitScript(([t])=>{ localStorage.setItem('k_server','https://script.google.com/macros/s/TEST/exec'); localStorage.setItem('k_token',t); localStorage.setItem('k_welcome_skip','1'); },[tok]);
  await p2.page.goto('http://localhost:8788/'); await p2.page.waitForSelector('.card');
  await p2.page.evaluate((id)=>{ imageSheet([st.items.find(i=>i.id===id)]); },ids.quran); await p2.page.waitForTimeout(1200);
  const k2=await p2.page.$$eval('#tp .tcell',b=>b.map(x=>x.dataset.k));
  ok(!k2.some(k=>/^c\d/.test(k))&&k2.length>5,'no templates folder: gallery still works ('+k2.length+')');
  ok(await p2.page.evaluate(()=>document.querySelector('#pvc').width)>0,'preview renders without clones');
  ok(p2.errors.length===0,'no errors without templates '+JSON.stringify(p2.errors));
  await browser.close(); gas.srv.close(); web.close();
  process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
