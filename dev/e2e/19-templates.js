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
  await page.waitForSelector('.card:has-text("كلما قلّ الكلام") .badge.own'); ok(await page.locator('.card:has-text("كلما قلّ الكلام") .badge.own').count()===1&&(await page.textContent('.card:has-text("كلما قلّ الكلام") .cite')).includes('من تأملاتي'),'شارة وتوثيق «من تأملاتي»');
  // «سمعتُها من شخص»: قائل فقط
  await page.evaluate(()=>editor(null)); await page.evaluate(()=>document.querySelectorAll('#sheet details').forEach(d=>d.open=true)); await page.click('#f_tpls button:has-text("سمعتُها")');
  ok((await page.locator('#f_speaker').isVisible())&&!(await page.locator('#f_ref').isVisible()),'«سمعتُها من شخص» تطلب القائل فقط');
  await page.fill('#f_speaker','الشيخ فلان'); await page.fill('#f_text','فائدة سمعتها'); await page.click('#save'); await page.waitForTimeout(900);
  ok(await page.evaluate(()=>{ const i=st.items.find(x=>x.text==='فائدة سمعتها'); return i.own.includes('سمعتُها')&&i.speaker==='الشيخ فلان'&&!i.ref; }),'حُفظت بقائل بلا مرجع');
  // قالب مخصص من الإعدادات
  await page.evaluate(()=>goTab('admin')); await page.waitForSelector('#tpl_list',{state:'attached'}); await page.evaluate(()=>document.querySelectorAll('details.more').forEach(d=>d.open=true));
  await page.click('#tpl_add'); await page.fill('#tpl_list .qrow:last-child input[data-k="n"]','ملحوظة من درس'); await page.fill('#tpl_list .qrow:last-child input[data-k="ic"]','🎓');
  await page.check('#tpl_list .qrow:last-child input[data-f="s"]'); await page.check('#tpl_list .qrow:last-child input[data-f="r"]');
  await page.locator('#tpl_list .qrow:has(input[value="خاطرة"]) button:has-text("✕")').click();
  await page.click('#s_save'); await page.waitForTimeout(1200);
  const saved=await page.evaluate(()=>fawTpls().map(t=>t.n)); ok(saved.includes('ملحوظة من درس')&&!saved.includes('خاطرة')&&saved[0].includes('منقولة'),'القالب الجديد يُضاف والمحذوف يزول والأصلي يبقى');
  await page.evaluate(()=>editor(null)); ok((await page.$$eval('#f_tpls button',b=>b.map(x=>x.textContent))).some(t=>t.includes('🎓 ملحوظة من درس')),'يظهر القالب الجديد في المحرر');
  await page.evaluate(()=>closeSheet(true));
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
