const {start,newPage,shot,OUT}=require('./harness.js'); const seed=require('./seed.js'); const fs=require('fs'); const path=require('path');
(async()=>{
  const {gas,web,browser}=await start(); const env=gas.env; const {tok,ids}=seed(env);
  const {page,errors}=await newPage(browser);
  await page.addInitScript(([t])=>{ localStorage.setItem('k_server','https://script.google.com/macros/s/TEST/exec'); localStorage.setItem('k_token',t); localStorage.setItem('k_welcome_skip','1'); },[tok]);
  await page.goto('http://localhost:8788/'); await page.waitForSelector('.card'); await shot(page,'10-owner-list');
  const grab=async(name)=>{ const d=await page.evaluate(()=>document.querySelector('#pvc').toDataURL('image/png')); fs.writeFileSync(path.join(OUT,name+'.png'),Buffer.from(d.split(',')[1],'base64')); };
  const openImg=async(id)=>{ await page.evaluate((id)=>{ imageSheet([st.items.find(i=>i.id===id)]); },id); await page.waitForTimeout(700); };
  // quran
  await openImg(ids.quran); await grab('img-quran-auto');
  for(const k of ['hadith','general','poetry','listen','minimal']){ await page.click(`#tp button[data-k="${k}"]`); await page.waitForTimeout(500); await grab('img-quran-'+k); }
  await page.click('#tp button[data-k="auto"]');
  await shot(page,'11-image-sheet');
  // numbered + owner
  await page.check('#im_no'); await page.fill('#im_num','61'); await page.waitForTimeout(500); await grab('img-quran-numbered-listen'); 
  await page.evaluate(()=>closeSheet(true));
  await openImg(ids.hadith); await page.check('#im_no'); await page.fill('#im_num','62'); await page.waitForTimeout(600); await grab('img-hadith-auto');
  await page.evaluate(()=>closeSheet(true));
  await openImg(ids.listen); await page.waitForTimeout(500); await grab('img-listen-auto');
  await page.evaluate(()=>closeSheet(true));
  await openImg(ids.poetry); await page.waitForTimeout(500); await grab('img-poetry-auto');
  await page.evaluate(()=>closeSheet(true));
  await openImg(ids.long); await page.waitForTimeout(900); await grab('img-long-p1'); await shot(page,'12-long-sheet');
  console.log('pages chips:', await page.locator('#pgs button').count());
  await page.evaluate(()=>closeSheet(true));
  console.log('errors',errors);
  await browser.close(); gas.srv.close(); web.close();
})().catch(e=>{console.error(e);process.exit(1)});
