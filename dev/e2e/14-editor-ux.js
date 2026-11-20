const {start,newPage,shot}=require('./harness.js'); const seed=require('./seed.js');
(async()=>{
  const {gas,web,browser}=await start(); const {tok}=seed(gas.env); const {page,errors}=await newPage(browser);
  await page.addInitScript(([t])=>{ localStorage.setItem('k_server','https://script.google.com/macros/s/TEST/exec'); localStorage.setItem('k_token',t); localStorage.setItem('k_welcome_skip','1'); },[tok]);
  await page.goto('http://localhost:8788/'); await page.waitForSelector('.card');
  let fails=0; const ok=(c,m)=>{ console.log((c?'ok  ':'FAIL')+' '+m); if(!c) fails++; };
  gas.env.call('importMeta',{refs:[{title:'تفسير ابن كثير',author:'ابن كثير'}]},tok); await page.evaluate(()=>refresh()); await page.waitForTimeout(500);
  await page.evaluate(()=>editor(null)); await page.waitForSelector('#f_text');
  ok(await page.locator('#qh_box').isHidden(),'شرح الاختصارات مخفي افتراضيًا');
  await page.click('#qh_btn'); ok(await page.locator('#qh_box').isVisible(),'زر ؟ مثال توضيحي يعرض الشرح والمثال'); await shot(page,'80-qhelp');
  await page.click('#qh_try'); await page.waitForTimeout(200);
  const live=await page.textContent('#sc_live'); ok(/ابن القيم/.test(live)&&/تربية/.test(live)&&/مفتاح دار السعادة/.test(live),'المعاينة الحية للاختصارات: '+live);
  await page.fill('#f_text',''); await page.evaluate(()=>document.querySelectorAll('#sheet details').forEach(d=>d.open=true));
  await page.click('#f_cat'); ok(await page.locator('#f_cat ~ .sg button').count()>0,'قائمة التصنيف تظهر بالضغط');
  // القائل ← كتبه
  await page.fill('#f_speaker','ابن كثير'); await page.click('#f_ref'); await page.waitForTimeout(150);
  const hdr=await page.locator('#f_ref ~ .sg .sgh').allTextContents(); ok(hdr.some(h=>h.includes('ابن كثير')),'كتب القائل أولًا: '+hdr.join('|'));
  const first=await page.locator('#f_ref ~ .sg button').first().textContent(); ok(/تفسير ابن كثير/.test(first),'أول كتاب هو كتابه: '+first);
  await shot(page,'81-combo');
  // الكتاب ← مؤلفه
  await page.fill('#f_speaker',''); await page.fill('#f_ref','تفسير ابن كثير'); await page.dispatchEvent('#f_ref','change'); await page.waitForTimeout(150);
  ok(await page.inputValue('#f_speaker')==='ابن كثير','اختيار الكتاب يملأ مؤلفه قائلًا');
  // الوسيط كتاب
  await page.click('#f_via'); const g=await page.locator('#f_via ~ .sg .sgh').allTextContents(); ok(g.includes('أشخاص')&&g.includes('كتب'),'قائمة الوسيط بمجموعتين: '+g.join('|'));
  await page.locator('#f_via ~ .sg button').last().dispatchEvent('pointerdown'); ok(await page.isChecked('#f_viabook'),'اختيار كتاب يعلّم الوسيط كتابًا');
  // الكتابة الحرة
  await page.fill('#f_speaker','قائل جديد تمامًا'); await page.fill('#f_text','فائدة بقائل جديد'); await page.click('#save'); await page.waitForTimeout(900);
  ok(await page.evaluate(()=>st.items.some(i=>i.speaker==='قائل جديد تمامًا')),'الإضافة اليدوية الحرة تعمل');
  // مؤشر الانتظار
  await page.evaluate(()=>busy(true,'جارٍ تجربة الانتظار')); ok(await page.locator('#loading.on .spin').count()===1&&(await page.textContent('#loading')).includes('تجربة'),'دائرة الانتظار تظهر'); await shot(page,'82-busy'); await page.evaluate(()=>busy(false));
  // الأدوات في الصفحة الرئيسية
  ok(await page.locator('.otools .chip').count()>=3,'أدوات الإدارة في الصفحة الرئيسية');
  ok(errors.length===0,'لا أخطاء '+JSON.stringify(errors));
  await browser.close(); gas.srv.close(); web.close(); process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
