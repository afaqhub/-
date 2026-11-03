const {start,newPage,shot,OUT}=require('./harness.js'); const seed=require('./seed.js');
let pass=0,fail=0; const ok=(c,m)=>{ if(c){pass++;console.log('  ✓',m)}else{fail++;console.log('  ✗',m)} };
(async()=>{
  const {gas,web,browser}=await start(); const env=gas.env; const {tok,ids,temp}=seed(env);
  const {page:P,errors,ctx}=await newPage(browser,{viewport:{width:360,height:740}});
  await P.addInitScript(([t])=>{ localStorage.setItem('k_server','https://script.google.com/macros/s/TEST/exec'); localStorage.setItem('k_token',t); localStorage.setItem('k_welcome_skip','1'); },[tok]);
  await P.goto('http://localhost:8788/'); await P.waitForSelector('.card');
  console.log('بلا إنترنت');
  // اقطع الاتصال بالخادم
  let offline=true; await P.unroute('https://script.google.com/macros/s/TEST/exec');
  await P.route('https://script.google.com/macros/s/TEST/exec',async r=>{ if(offline) return r.abort('failed'); const t=await (await fetch('http://localhost:8787/',{method:'POST',body:r.request().postData()})).text(); r.fulfill({contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:t}); });
  await P.click('#fab'); await P.fill('#f_text','فائدة كُتبت بلا إنترنت'); await P.click('#save'); await P.waitForTimeout(800);
  const wc=await P.locator('.badge.wait').count(); console.log('wait badges',wc, await P.evaluate(()=>st.queue.length)); ok(wc>=1,'ظهرت بطاقة «⏳ بانتظار الإرسال»'); ok(await P.evaluate(()=>st.queue.length)===1,'حُفظت في قائمة الانتظار'); await shot(P,'50-offline');
  ok(await P.locator('.card').count()>3,'بقيت الفوائد المحمَّلة معروضة');
  offline=false; await P.evaluate(()=>flushQueue(true)); await P.waitForTimeout(1200);
  ok(await P.evaluate(()=>st.queue.length)===0 && await P.evaluate(()=>st.items.some(i=>i.text==='فائدة كُتبت بلا إنترنت'&&!i._pending)),'أُرسلت تلقائيًا عند عودة الاتصال');
  // تعديل بلا اتصال لا يُصفّ
  offline=true; await P.evaluate(()=>editor(st.items[0])); await P.click('#save'); await P.waitForTimeout(600); ok(await P.evaluate(()=>st.queue.length)===0,'التعديل بلا اتصال لا يدخل الطابور'); offline=false; await P.evaluate(()=>closeSheet(true));
  console.log('الوضع الليلي والجوال الصغير');
  await P.evaluate(()=>{ document.documentElement.dataset.theme='dark'; }); await shot(P,'51-dark-360');
  await P.click('#fab'); await P.click('summary:has-text("التوثيق")'); await shot(P,'52-editor-dark'); await P.evaluate(()=>closeSheet(true));
  await P.evaluate(()=>{ document.documentElement.dataset.theme='light'; });
  ok(await P.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'لا تمرير أفقي على عرض 360');
  await P.evaluate(()=>imageSheet([st.items[1]])); await P.waitForTimeout(600); await shot(P,'53-image-360');
  ok(await P.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'نافذة الصور بلا تمرير أفقي'); await P.evaluate(()=>closeSheet(true));
  console.log('الأمان');
  // XSS: فائدة بنص خبيث تُعرض نصًّا لا شيفرة
  await P.evaluate(()=>{ window.__x=0; }); env.call('save',{item:{text:'<img src=x onerror="window.__x=1">  <script>window.__x=2</script>',speaker:'<b onmouseover=1>س</b>',ref:'"><svg onload=window.__x=3>',visibility:'عامة',link:'javascript:window.__x=4'}},tok);
  await P.evaluate(()=>refresh()); await P.waitForTimeout(700); await P.locator('.card',{hasText:'img src'}).first().locator('.sbtn:has-text("عرض")').click(); await P.waitForSelector('.dtext'); await P.waitForTimeout(300);
  ok(await P.evaluate(()=>window.__x)===0,'لا تنفيذ لشيفرة مُدخلة في النص أو القائل أو المرجع'); ok(await P.locator('.dtext img, .meta svg, a[href^="javascript"]').count()===0,'لا عناصر خطرة في الـDOM');
  await P.evaluate(()=>closeSheet(true));
  // قفل المحاولات الخاطئة
  const g=await newPage(browser); await g.page.addInitScript(()=>{ localStorage.setItem('k_server','https://script.google.com/macros/s/TEST/exec'); });
  await g.page.goto('http://localhost:8788/'); await g.page.waitForSelector('#btnAuth');
  for(let i=0;i<5;i++){ await g.page.click('#btnAuth'); await g.page.fill('#pw','bad'+i); await g.page.click('#go'); await g.page.waitForSelector('#lgmsg span'); await g.page.evaluate(()=>closeSheet(true)); }
  await g.page.click('#btnAuth'); await g.page.fill('#pw','Secret123'); await g.page.click('#go'); await g.page.waitForFunction(()=>/انتظر/.test(document.querySelector('#lgmsg').textContent)); ok(true,'بعد 5 محاولات خاطئة يُمنع الدخول مؤقتًا حتى بكلمة صحيحة');
  console.log('أخطاء:',errors,g.errors); console.log(pass+' نجح، '+fail+' فشل'); await browser.close(); gas.srv.close(); web.close(); process.exit(fail||errors.filter(e=>!/ERR_FAILED/.test(e)).length?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
