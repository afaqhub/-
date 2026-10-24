const {start,newPage,shot,OUT}=require('./harness.js'); const seed=require('./seed.js'); const fs=require('fs'); const path=require('path');
let pass=0,fail=0; const ok=(c,m)=>{ if(c){pass++;console.log('  ✓',m)}else{fail++;console.log('  ✗',m)} };
(async()=>{
  const {gas,web,browser}=await start(); const env=gas.env; const {tok,ids}=seed(env);
  // ----- الزائر
  console.log('الزائر');
  const g=await newPage(browser); await g.page.addInitScript(()=>{ localStorage.setItem('k_server','https://script.google.com/macros/s/TEST/exec'); });
  await g.page.goto('http://localhost:8788/'); await g.page.waitForSelector('.card'); await shot(g.page,'30-guest-list');
  const gi=await g.page.evaluate(()=>st.items.map(i=>({id:i.id,t:i.text.slice(0,12),note:i.note,verify:i.verify,sp:i.speaker})));
  ok(gi.length===5 && !gi.some(i=>i.t.includes('خاصة')||i.t.includes('مسودة')),'الزائر يرى 5 فوائد عامة فقط ('+gi.length+')');
  ok(!(await g.page.content()).includes('تعليق خاص'),'لا أثر لتعليق المالك في صفحة الزائر');
  ok(await g.page.locator('#fab').isHidden(),'لا زر إضافة للزائر');
  await g.page.click('.card .sbtn:has-text("عرض")'); await g.page.waitForSelector('.dtext'); await shot(g.page,'31-guest-detail');
  ok(await g.page.locator('#nt').count()===1,'زر «ملاحظة» للزائر');
  await g.page.click('#nt'); await g.page.fill('#ct_msg','في الصفحة خطأ مطبعي'); await g.page.click('#ct_go'); await g.page.waitForTimeout(600);
  let msgs=env.call('messages',{},tok).data; ok(msgs.length===1&&msgs[0].kind==='ملاحظة'&&msgs[0].factId.startsWith('F-'),'وصلت ملاحظة الزائر إلى صندوق المالك');
  // سلاسل للزائر لا تنكسر
  await g.page.evaluate(()=>closeSheet(true)); await g.page.click('#tabs button:has-text("السلاسل")'); await g.page.waitForSelector('.listsec');
  ok((await g.page.locator('.listsec').first().innerText()).includes('فوائد الثبات'),'تبويب السلاسل يعمل للزائر');
  // منصتك
  await g.page.click('#btnMenu'); await g.page.waitForSelector('.menu'); await shot(g.page,'32-guest-menu');
  await g.page.click('.menu .pbtn:has-text("منصتك")'); await g.page.click('#pl_get'); ok((await g.page.locator('#pl_body').innerText()).includes('قريبًا'),'«قريبًا» عند خلو رابط المنصة');
  await g.page.click('#pl_ask'); await g.page.fill('#ct_contact','12'); await g.page.click('#ct_go'); await g.page.waitForTimeout(300);
  ok((await g.page.locator('#ct_msgx').innerText()).includes('وسيلة تواصل'),'وسيلة التواصل إلزامية في الطلب');
  await g.page.fill('#ct_name','زائر كريم'); await g.page.fill('#ct_contact','visitor@example.com'); await g.page.fill('#ct_msg','أريد منصة مثلها'); await g.page.check('#ct_show'); await shot(g.page,'33-contact'); await g.page.click('#ct_go'); await g.page.waitForTimeout(700);
  msgs=env.call('messages',{},tok).data; ok(msgs.length===2&&msgs[0].kind==='طلب منصة'&&msgs[0].showName,'وصل طلب المنصة مع الاسم والموافقة');
  ok(g.errors.length===0,'لا أخطاء '+g.errors.join('|'));
  // ----- المالك
  console.log('المالك');
  const o=await newPage(browser); await o.page.addInitScript(([t])=>{ localStorage.setItem('k_server','https://script.google.com/macros/s/TEST/exec'); localStorage.setItem('k_token',t); localStorage.setItem('k_welcome_skip','1'); },[tok]);
  await o.page.goto('http://localhost:8788/'); await o.page.waitForSelector('.card'); const P=o.page;
  ok(await P.locator('#menuDot.on').count()===1,'نقطة تنبيه الرسائل الجديدة');
  await P.click('#btnMenu'); await P.waitForSelector('.menu'); await shot(P,'34-owner-menu');
  await P.click('.menu .pbtn:has-text("الرسائل")'); await P.waitForSelector('.msg'); await shot(P,'35-inbox');
  ok(await P.locator('.msg').count()===2,'صندوق الرسائل');
  // الإكمال التلقائي
  await P.evaluate(()=>{ goTab('all'); }); await P.click('#fab'); await P.click('summary:has-text("التوثيق")');
  await P.fill('#f_speaker','عثي'); await P.waitForSelector('.sg button'); await shot(P,'36-suggest');
  let sg=await P.locator('.sg button').allInnerTexts(); ok(sg.some(x=>x.startsWith('ابن عثيمين')),'اقتراح الاسم الكامل من أول حروف: '+sg.join('|'));
  await P.locator('.sg button').first().dispatchEvent('pointerdown'); ok(await P.inputValue('#f_speaker')==='ابن عثيمين','اختيار الاقتراح يملأ الاسم الموحَّد');
  await P.fill('#f_speaker','ابن القيّم'); await P.fill('#f_text','فائدة اختبار الإكمال والتوحيد'); await P.click('#f_med button:has-text("سماع")'); ok((await P.locator('#l_locus').innerText()).includes('الدقيقة'),'تتبدّل تسميات الحقول بحسب وسيلة التلقي');
  await P.fill('#f_ref','محاضرة'); await P.fill('#f_locus','1:02:03'); await P.fill('#f_link','https://youtu.be/xyz123'); await P.click('#save'); await P.waitForTimeout(800);
  const sv=await P.evaluate(()=>st.items.find(i=>i.text==='فائدة اختبار الإكمال والتوحيد')); ok(sv&&sv.medium==='سماع'&&sv.speaker==='ابن القيم','حُفظت فائدة السماع وتوحّد «ابن القيّم» إلى «ابن القيم»');
  ok(await P.evaluate(i=>mediaLink(i),sv)==='https://youtu.be/xyz123?t=3723','رابط يوتيوب يقفز إلى الثانية 3723');
  // الاختصار [المقطع د 32:15] يجعلها سماعًا
  const pr=await P.evaluate(()=>parseShortcuts('فائدة [شرح الأصول د 32:15] @الألباني #حديث !')); ok(pr.medium==='سماع'&&pr.locus==='32:15'&&pr.ref==='شرح الأصول'&&pr.star,'اختصار الدقيقة: '+JSON.stringify(pr));
  // التحديد المتعدد وتصدير دفعة صور
  await P.click('#btnMenu'); await P.click('.menu .pbtn:has-text("تحديد")'); await P.waitForSelector('.pick'); await P.locator('.card').nth(1).click(); await P.locator('.card').nth(2).click();
  await shot(P,'37-select'); await P.click('#selbar button:has-text("صور")'); await P.waitForSelector('#pvc');
  ok((await P.locator('#sheet .shhd h3').innerText()).includes('2'),'نافذة الصور لفائدتين');
  await P.check('#im_no'); await P.fill('#im_num','70');
  const [dl1,dl2]=await Promise.all([P.waitForEvent('download'),P.waitForEvent('download'),P.click('#im_save')]); ok(/kunnasha-F-\d+(-\d+)?\.png$/.test(dl1.suggestedFilename()),'نُزّلت صورتان: '+dl1.suggestedFilename()+' '+dl2.suggestedFilename());
  await P.waitForTimeout(1200); const nos=await P.evaluate(()=>st.items.filter(i=>i.pubNo).map(i=>i.pubNo).sort()); ok(nos.join()==='70,71','سُجّل الترقيم والنشر 70 و71: '+nos);
  await P.evaluate(()=>{closeSheet(true);endSelect();});
  // لوحة التحكم
  await P.evaluate(()=>goTab('admin')); await P.waitForSelector('#s_save'); await shot(P,'38-admin');
  await P.locator('.pbtn:has-text("ابن كثير") .sbtn:has-text("تفاصيل")').click(); await P.waitForSelector('#pp_hide'); await shot(P,'39-person');
  await P.selectOption('#pp_hide','الاسم'); await P.fill('#pp_rep','بعض أهل العلم'); await P.click('#pp_save'); await P.waitForTimeout(800);
  const vis=env.call('listPublic').data.find(x=>x.id===ids.quran); ok(vis&&vis.speaker==='بعض أهل العلم','حجب اسم الشخص عن الزوار بعبارة بديلة');
  await P.evaluate(()=>goTab('admin')); await P.waitForSelector('#s_save'); await P.click('summary:has-text("ما يظهر للزوار")'); await P.uncheck('#s_sp'); await P.click('#s_save'); await P.waitForTimeout(800);
  ok(env.call('listPublic').data.every(x=>x.speaker===''),'إخفاء القائل عامّة'); await P.evaluate(()=>goTab('admin')); await P.waitForSelector('#s_save'); await P.click('summary:has-text("ما يظهر للزوار")'); await P.check('#s_sp'); await P.click('#s_save'); await P.waitForTimeout(600);
  // قوالب مخصصة: رفع صورة
  await P.evaluate(()=>templatesSheet()); await P.click('#tn'); await P.waitForSelector('#te_file');
  // اصنع صورة اختبار
  const png=await P.evaluate(()=>{ const c=document.createElement('canvas'); c.width=800; c.height=1000; const x=c.getContext('2d'); const g=x.createLinearGradient(0,0,800,1000); g.addColorStop(0,'#3b2a1a'); g.addColorStop(1,'#8a5a2b'); x.fillStyle=g; x.fillRect(0,0,800,1000); x.fillStyle='rgba(255,255,255,.2)'; for(let i=0;i<30;i++) x.fillRect(Math.random()*800,Math.random()*60,40,40); return c.toDataURL('image/jpeg',.8).split(',')[1]; });
  fs.writeFileSync('files/bg.jpg',Buffer.from(png,'base64'));
  await P.fill('#te_name','قالب الخشب'); await P.setInputFiles('#te_file','files/bg.jpg'); await P.waitForTimeout(800); await shot(P,'40-template-editor');
  await P.click('#te_save'); await P.waitForTimeout(1200);
  const tl=env.call('templates').data; ok(tl.length===1&&tl[0].name==='قالب الخشب','حُفظ القالب المخصص في الجدول');
  await P.evaluate(()=>closeSheet(true)); await P.evaluate((id)=>{ st.tpls=null; imageSheet([st.items.find(i=>i.id===id)]); },ids.quran); await P.waitForTimeout(500);
  await P.click('#tp button:has-text("قالب الخشب")'); await P.waitForTimeout(900); await shot(P,'41-custom-template-sheet');
  const d=await P.evaluate(()=>document.querySelector('#pvc').toDataURL()); fs.writeFileSync(path.join(OUT,'img-custom.png'),Buffer.from(d.split(',')[1],'base64'));
  ok(o.errors.length===0,'لا أخطاء '+o.errors.join('|'));
  console.log(pass+' نجح، '+fail+' فشل'); await browser.close(); gas.srv.close(); web.close(); process.exit(fail?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
