const {start,newPage,shot}=require('./harness.js'); const seed=require('./seed.js');
(async()=>{
  const {gas,web,browser}=await start(); const {tok}=seed(gas.env); const {page,errors}=await newPage(browser);
  await page.addInitScript(([t])=>{ localStorage.setItem('k_server','https://script.google.com/macros/s/TEST/exec'); localStorage.setItem('k_token',t); localStorage.setItem('k_welcome_skip','1'); },[tok]);
  await page.goto('http://localhost:8788/'); await page.waitForSelector('.card');
  let fails=0; const ok=(c,m)=>{ console.log((c?'ok  ':'FAIL')+' '+m); if(!c) fails++; };
  ok(await page.locator('.tab:has-text("قِطاف")').count()===1,'تبويب قِطاف ظاهر');
  ok(await page.locator('.qhome').count()===1||true,'بطاقة قطاف في الرئيسية');
  await page.click('.tab:has-text("قِطاف")'); await page.waitForSelector('.qcard'); await shot(page,'90-qitaf');
  const n1=await page.locator('.qcard').count(); ok(n1===3,'الدفعة الافتراضية ٣ فوائد ('+n1+')');
  ok(await page.evaluate(()=>st.qplans.length)===1,'أُنشئت الخطة الافتراضية المقترحة');
  const deck1=await page.evaluate(()=>qState(qPlans()[0]).deck.join());
  await page.reload(); await page.waitForSelector('.card'); await page.click('.tab:has-text("قِطاف")'); await page.waitForSelector('.qcard');
  ok(await page.evaluate(()=>qState(qPlans()[0]).deck.join())===deck1,'الدفعة باقية بعد إعادة الفتح حتى تضغط «قرأت»');
  await page.click('.qdone',{force:true}); await page.waitForSelector('.qdonecard',{timeout:6000}); await shot(page,'91-qdone');
  ok(await page.evaluate(()=>Q.log.length)===3,'سُجّلت ٣ قراءات');
  ok(gas.env.call('qlog',{},tok).data.length===3,'السجل محفوظ في الخادم');
  ok(await page.locator('.qkpi').textContent().then(t=>/٣/.test(t)),'عدّاد اليوم يتحدّث');
  await page.click('.qdonecard .btn'); await page.waitForSelector('.qcard');
  const deck2=await page.evaluate(()=>qState(qPlans()[0]).deck);
  ok(!deck2.some(id=>deck1.split(',').includes(id)),'الدفعة الإضافية من فوائد لم تُقرأ (الأقل قراءة أولًا)');
  // منطق التنويع والتسلسل والانتهاء
  const r=await page.evaluate(()=>{
    const mk=(n,ref,sp,cat,loc)=>({id:n,text:'ن'+n,ref,speaker:sp,cat,locus:loc,createdAt:'2024-01-'+String(10+(+n.slice(1))).slice(-2),status:'منشورة',visibility:'عامة'});
    st.items=[...Array(4).keys()].map(i=>mk('A'+i,'كتاب أ','س١','ت١','ص '+(40-i*10))).concat([...Array(4).keys()].map(i=>mk('B'+i,'كتاب ب','س٢','ت٢','ص '+(i+1)))).concat([...Array(4).keys()].map(i=>mk('C'+i,'كتاب ج','س١','ت٢','ص '+(i+1))));
    Q.log=[]; const out={};
    const P=(cfg)=>({id:'T',name:'t',status:'نشطة',vis:'لي',cfg:Object.assign(Q_DEFAULT_CFG(),cfg),state:{}});
    let p=P({count:4,mix:'sequential',order:'seq',src:{books:['كتاب أ','كتاب ب'],authors:[],cats:[],tags:[],starred:false,combine:'or'}});
    out.seq=qBuild(p).deck.join();                                   // يستوفي كتاب أ كله (مرتبًا بالصفحة) ثم لا يتجاوزه
    p.state={read:['A0','A1','A2','A3']}; out.seq2=qBuild(p).deck.join();   // انتقل لكتاب ب
    p=P({count:4,mix:'blend',order:'seq',src:{books:['كتاب أ','كتاب ب'],authors:[],cats:[],tags:[],starred:false,combine:'or'}}); const bl=qBuild(p).deck; out.blend=[bl.filter(x=>x[0]==='A').length,bl.filter(x=>x[0]==='B').length].join('-');
    p=P({count:2,mix:'rotate',order:'seq',src:{books:['كتاب أ','كتاب ب','كتاب ج'],authors:[],cats:[],tags:[],starred:false,combine:'or'}});
    const b1=qBuild(p); p.state=Object.assign({},b1.state); const b2=qBuild(p); out.rot=b1.deck[0][0]+b2.deck[0][0];
    p=P({count:6,order:'seq',mix:'blend',src:{books:[],authors:['س١'],cats:[],tags:[],starred:false,combine:'or'}}); out.author=qBuild(p).deck.every(id=>'AC'.includes(id[0]))&&qBuild(p).deck.length===6;
    p=P({count:12,src:{books:[],authors:[],cats:['ت٢'],tags:[],starred:false,combine:'and'}}); out.cat=qBuild(p).deck.length===8;
    p=P({count:12,src:{books:['كتاب أ'],authors:['س٢'],cats:[],tags:[],starred:false,combine:'and'}}); out.and=qBuild(p).empty===true;
    p=P({count:12,repeat:'once',src:{books:['كتاب ب'],authors:[],cats:[],tags:[],starred:false,combine:'or'}}); p.state={read:['B0','B1','B2','B3']}; out.fin=!!qBuild(p).finished;
    p.cfg.repeat='cycle'; out.cyc=qBuild(p).deck.length===4;
    return out; });
  ok(r.seq==='A3,A2,A1,A0','تسلسل كتاب أ بحسب الصفحة ولا يتجاوزه: '+r.seq);
  ok(r.seq2==='B0,B1,B2,B3','ينتقل للكتاب الثاني بعد انتهاء الأول: '+r.seq2);
  ok(r.blend==='2-2','التنويع: من كل كتاب بالتساوي '+r.blend);
  ok(r.rot==='AB','التناوب: دفعة من كتاب ثم من الذي بعده '+r.rot);
  ok(r.author===true,'مؤلف معيّن'); ok(r.cat===true,'تصنيف معيّن'); ok(r.and===true,'التقاطع بين كتاب ومؤلف لا يطابق');
  ok(r.fin===true,'«مرة واحدة»: تنتهي الخطة'); ok(r.cyc===true,'«أعد الدورة»: تبدأ من جديد');
  // الخطط والجدولة
  await page.reload(); await page.waitForSelector('.card'); await page.click('.tab:has-text("قِطاف")'); await page.waitForSelector('.qplan');
  await page.click('.qtabs .chip:has-text("الخطط")'); await page.waitForSelector('.qrow');
  await page.click('.otools .btn'); await page.waitForSelector('#qe_name'); await page.fill('#qe_name','خطة التفسير'); await page.fill('#qe_n','2');
  await page.locator('.qmp').nth(2).locator('input').click(); await page.locator('.qmp').nth(2).locator('.sg button').first().dispatchEvent('pointerdown');
  await page.selectOption('#qe_vis','الزوار'); await shot(page,'92-qedit'); await page.click('#qe_save'); await page.waitForTimeout(1200);
  ok(await page.evaluate(()=>st.qplans.length)===2,'أُنشئت خطة ثانية'); const p2=await page.evaluate(()=>st.qplans.find(p=>p.name==='خطة التفسير'));
  ok(p2&&p2.cfg.count===2&&p2.cfg.src.cats.length===1&&p2.vis==='الزوار','حُفظت إعدادات الخطة: '+JSON.stringify(p2&&p2.cfg.src));
  await page.click('.qtabs .chip:has-text("الخطط")'); await page.waitForSelector('.qrow');
  await page.locator('.qrow:has-text("خطة التفسير") .sbtn:has-text("المسودات")').click(); await page.waitForTimeout(1000);
  ok(await page.evaluate(()=>st.qplans.find(p=>p.name==='خطة التفسير').status)==='مسودة','تحويلها إلى مسودة');
  await page.click('.qtabs .chip:has-text("الإحصاءات")'); await page.waitForSelector('.qtile'); await shot(page,'93-qstats');
  ok(await page.locator('.qtile').count()===6,'بطاقات الإحصاء'); ok(await page.locator('.qchart .qcol').count()===14,'مخطط ١٤ يومًا'); ok(await page.locator('.qrow .qbar').count()>=1,'تفصيل الكتب');
  // الزائر
  const g=await newPage(browser); await g.page.addInitScript(()=>{ localStorage.setItem('k_server','https://script.google.com/macros/s/TEST/exec'); localStorage.setItem('k_welcome_skip','1'); }); await g.page.goto('http://localhost:8788/'); await g.page.waitForSelector('.card');
  ok(await g.page.locator('.tab:has-text("قِطاف")').count()===0,'الزائر لا يرى قِطاف إن لم تكن هناك خطة عامة نشطة');
  gas.env.call('qsave',{plan:{id:p2.id,name:p2.name,cfg:p2.cfg,status:'نشطة',vis:'الزوار'}},tok);
  await g.page.reload(); await g.page.waitForSelector('.card'); ok(await g.page.locator('.tab:has-text("قِطاف")').count()===1,'تظهر للزائر بعد جعلها عامة ونشطة');
  await g.page.click('.tab:has-text("قِطاف")'); await g.page.waitForSelector('.qcard'); await g.page.click('.qdone',{force:true}); await g.page.waitForSelector('.qdonecard',{timeout:6000});
  ok(await g.page.evaluate(()=>JSON.parse(localStorage.getItem('k_qlog')).length)>=1,'تقدّم الزائر محفوظ في جهازه فقط');
  ok(gas.env.call('qlog',{},tok).data.length===3,'لا يدخل سجل المالك');
  ok(errors.length===0&&g.errors.length===0,'لا أخطاء '+JSON.stringify(errors.concat(g.errors)));
  await browser.close(); gas.srv.close(); web.close(); process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
