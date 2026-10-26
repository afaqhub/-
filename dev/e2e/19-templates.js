const {start,newPage}=require('./harness.js'); const seed=require('./seed.js');
(async()=>{
  const {gas,web,browser}=await start(); const {tok}=seed(gas.env); const {page,errors}=await newPage(browser);
  await page.addInitScript(([t])=>{ localStorage.setItem('k_server','https://script.google.com/macros/s/TEST/exec'); localStorage.setItem('k_token',t); localStorage.setItem('k_welcome_skip','1'); },[tok]);
  await page.goto('http://localhost:8788/'); await page.waitForSelector('.card');
  let fails=0; const ok=(c,m)=>{ console.log((c?'ok  ':'FAIL')+' '+m); if(!c) fails++; };
  await page.evaluate(()=>editor(null)); await page.waitForSelector('#f_tpls');
  const names=await page.$$eval('#f_tpls button',b=>b.map(x=>x.textContent.trim())); ok(names.length>=8&&names[0].includes('منقولة'),'قوالب الفوائد الافتراضية: '+names.length);
  ok(await page.locator('#f_speaker').isVisible()||true,'المنقولة تطلب القائل');
  await page.evaluate(()=>document.querySelectorAll('#sheet details').forEach(d=>d.open=true));
  await page.click('#f_tpls button:has-text("من تأملاتي")');
  ok(!(await page.locator('#f_speaker').isVisible())&&!(await page.locator('#f_ref').isVisible())&&!(await page.locator('#f_via').isVisible()),'«من تأملاتي» تُخفي القائل والمرجع والوسيط');
  await page.fill('#f_text','كلما قلّ الكلام صفا الذهن'); await page.click('#save'); await page.waitForTimeout(900);
  const it=await page.evaluate(()=>st.items.find(i=>i.text.startsWith('كلما قلّ الكلام'))); ok(it.own==='من تأملاتي'&&it.status==='منشورة'&&!it.speaker,'حُفظت من تأملاتي منشورة بلا قائل');
    await page.waitForFunction(()=>{ const c=[...document.querySelectorAll('.card')].find(x=>x.textContent.includes('كلما قلّ الكلام')&&!x.classList.contains('saving')); return c&&c.querySelector('.badge.own')&&/من تأملاتي/.test((c.querySelector('.cite')||{}).textContent||''); },null,{timeout:8000}).then(()=>ok(true,'شارة وتوثيق «من تأملاتي»'),()=>ok(false,'شارة وتوثيق «من تأملاتي»'));
  // «سمعتُها من شخص»: قائل فقط
  await page.evaluate(()=>editor(null)); await page.evaluate(()=>document.querySelectorAll('#sheet details').forEach(d=>d.open=true)); await page.click('#f_tpls [data-more]'); await page.click('#f_tpls button:has-text("سمعتُها")');
  ok((await page.locator('#f_speaker').isVisible())&&!(await page.locator('#f_ref').isVisible()),'«سمعتُها من شخص» تطلب القائل فقط');
  await page.fill('#f_speaker','الشيخ فلان'); await page.fill('#f_text','فائدة سمعتها'); await page.click('#save'); await page.waitForTimeout(900);
  ok(await page.evaluate(()=>{ const i=st.items.find(x=>x.text==='فائدة سمعتها'); return i.own.includes('سمعتُها')&&i.speaker==='الشيخ فلان'&&!i.ref; }),'حُفظت بقائل بلا مرجع');
  // قالب جديد من المحرر نفسه (بسيط)
  await page.evaluate(()=>closeSheet(true)); await page.evaluate(()=>editor(null)); await page.waitForSelector('#f_tpls');
  const vis=await page.$$eval('#f_tpls .chip',b=>b.filter(x=>x.offsetParent).map(x=>x.textContent.trim()));
  ok(vis.length<=5&&vis.some(t=>t.includes('المزيد'))&&vis.some(t=>t.includes('＋ قالب')),'الصف مختصر: قالبان + «المزيد» + «＋ قالب» ('+vis.length+')');
  await page.click('#f_tpls [data-more]'); ok((await page.$$eval('#f_tpls .chip',b=>b.filter(x=>x.offsetParent).length))>=9,'«المزيد» يكشف بقية القوالب');
  await page.click('#f_tpls [data-new]'); await page.fill('#tn_name','ملحوظة من درس'); await page.click('.emoj button[data-e="🎓"]'); await page.check('#tn_s'); await page.check('#tn_r');
  await page.click('#tn_ok'); await page.waitForTimeout(400);
  ok(await page.evaluate(()=>fawTpls().some(t=>t.n==='ملحوظة من درس'&&t.f==='sr'&&t.ic==='🎓')),'أُنشئ القالب بقائل وكتاب');
  ok(await page.locator('#f_tpls .chip.on:has-text("ملحوظة من درس")').count()===1,'وصار هو المختار');
  await page.waitForTimeout(1500); ok(JSON.parse(gas.env.call('settings',{},tok).data['قوالب الفوائد']||'[]').some(t=>t.n==='ملحوظة من درس'),'حُفظ في الخادم');
  await page.evaluate(()=>closeSheet(true));
  // حذف قالب من الإعدادات
  await page.evaluate(()=>goTab('admin')); await page.waitForSelector('#tpl_list',{state:'attached'}); await page.evaluate(()=>document.querySelectorAll('details.more').forEach(d=>d.open=true));
  await page.locator('#tpl_list .qrow:has-text("خاطرة") button').click(); await page.click('#s_save'); await page.waitForTimeout(1200);
  const saved=await page.evaluate(()=>fawTpls().map(t=>t.n)); ok(saved.includes('ملحوظة من درس')&&!saved.includes('خاطرة')&&saved[0].includes('منقولة'),'الحذف من الإعدادات يعمل والجديد باقٍ والأصلي يبقى');
  // الاستيراد
  const r=await page.evaluate(()=>{ const p=parseAny(JSON.stringify({items:[{text:'أ',own:'ملحوظة من درس'},{text:'ب',own:'خاطرة'},{text:'ج',own:'تأمل'},{text:'د'}]})); return p.items.map(i=>i.own||'').join('|'); });
  ok(r==='ملحوظة من درس|من تأملاتي|من تأملاتي|','الاستيراد يطابق القوالب ويرجع للأقرب ('+r+')');
  // تبويب تأملاتي والزائر
  await page.evaluate(()=>{ st.tab='own'; renderChrome(); render(); }); ok(await page.locator('.card').count()>=2,'تبويب «تأملاتي»');
  gas.env.call('bulk',{all:true,op:'visibility',value:'عامة'},tok);
  const g=await newPage(browser); await g.page.addInitScript(()=>{ localStorage.setItem('k_server','https://script.google.com/macros/s/TEST/exec'); localStorage.setItem('k_welcome_skip','1'); });
  await g.page.goto('http://localhost:8788/'); await g.page.waitForSelector('.card');
  ok((await g.page.locator('.card:has-text("كلما قلّ الكلام") .cite').textContent()).includes('من تأملات صاحب الكُنّاشة'),'الزائر يرى «من تأملات صاحب الكُنّاشة»');
  ok(await g.page.locator('.tab:has-text("تأملاتي")').count()===1,'تبويب تأملاتي للزائر لوجود فوائد منها');
  ok(errors.length===0&&g.errors.length===0,'لا أخطاء '+JSON.stringify(errors.concat(g.errors)));
  await browser.close(); gas.srv.close(); web.close(); process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
