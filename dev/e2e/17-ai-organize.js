const {start,newPage}=require('./harness.js'); const seed=require('./seed.js'); const fs=require('fs');
(async()=>{
  const {gas,web,browser}=await start(); const {tok}=seed(gas.env); const {page,errors}=await newPage(browser);
  await page.addInitScript(([t])=>{ localStorage.setItem('k_server','https://script.google.com/macros/s/TEST/exec'); localStorage.setItem('k_token',t); localStorage.setItem('k_welcome_skip','1'); },[tok]);
  await page.goto('http://localhost:8788/'); await page.waitForSelector('.card');
  let fails=0; const ok=(c,m)=>{ console.log((c?'ok  ':'FAIL')+' '+m); if(!c) fails++; };
  await page.evaluate(()=>transferSheet('ai')); await page.waitForSelector('#ai_pre');
  const pr=await page.textContent('#ai_pre');
  ok(/kunnasha/.test(pr)&&/via/.test(pr)&&/vlocus/.test(pr)&&/أكمل/.test(pr)&&/دفعة/.test(pr),'الأمر يحوي المخطط والدفعات');
  ok(/أسمائي المعتمدة/.test(pr)&&/ابن كثير/.test(pr),'يُرفق الأسماء المعتمدة للمستخدم');
  await page.uncheck('#og_names'); ok(!(await page.textContent('#ai_pre')).includes('ابن كثير'),'يمكن إلغاء إرفاق الأسماء');
  ok(!/\{\{/.test(pr),'لا بقايا قوالب');
  // مثال الأمر نفسه صالح للاستيراد
  const ex=await page.evaluate(()=>{ const m=ORG_PROMPT.match(/```json\n([\s\S]*?)```/); return m&&m[1]; });
  ok(!!ex&&JSON.parse(ex).items.length===3,'المثال داخل الأمر JSON صالح');
  // دفعتان ملصوقتان تباعًا (ببقايا نص وأسوار كود) تُدمجان
  const p1=JSON.parse(ex); const p2={format:'kunnasha',part:{n:2,of:2},items:[{text:'فائدة الدفعة الثانية',speaker:'ابن القيم',ref:'مدارج السالكين',locus:'٢ / ٣',cat:'تربية'}],people:[{name:'ابن القيم',aliases:['ابن قيم الجوزية'],dua:'رحمه الله'}],refs:[{title:'مدارج السالكين',author:'ابن القيم',kind:'كتاب'}]};
  p1.part={n:1,of:2};
  const pasted='تمّت الدفعة ١ من ٢ — اكتب: أكمل\n```json\n'+JSON.stringify(p1,null,1)+'\n```\n\nتمّت الدفعات كلها\n```json\n'+JSON.stringify(p2)+'\n```';
  const r=await page.evaluate(t=>{ const p=parseAny(t); return {items:p.items.length,parts:p.parts,people:p.meta.people.length,refs:p.meta.refs.length,first:p.items[1],ibn:p.meta.people.find(x=>x.name==='ابن القيم')}; },pasted);
  ok(r.items===4&&r.parts===2,'دمج الدفعات: '+r.items+' فوائد من '+r.parts+' دفعات');
  ok(r.people===4&&r.refs===5,'دمج الفهارس بلا تكرار (ابن القيم مرة واحدة)'); ok(r.ibn.dua==='رحمه الله'&&r.ibn.aliases.includes('ابن قيم الجوزية'),'يحتفظ بالدعاء والبدائل');
  ok(r.first.via==='أعمال القلوب'&&r.first.vlocus==='ص ٣٩'&&r.first.locus==='١ / ١٢٠','تُقرأ حقول الوسيط والموضع');
  // استيراد فعلي عبر الواجهة
  await page.evaluate(()=>transferSheet('import')); await page.fill('#im_text',pasted); await page.click('#im_read'); await page.waitForSelector('#im_go');
  await page.selectOption('#im_vis','عامة'); await page.click('#im_go'); await page.waitForFunction(()=>st.items.some(i=>i.text==='فائدة الدفعة الثانية'),null,{timeout:10000});
  const got=await page.evaluate(()=>{ const m=st.meta; return {via:st.items.find(i=>i.via==='أعمال القلوب'),book:m.refs.includes('أعمال القلوب'),spk:m.speakers.includes('أعمال القلوب')}; });
  ok(got.via&&got.book&&!got.spk,'الوسيط الكتاب يدخل المراجع لا القائلين');
  ok(errors.length===0,'لا أخطاء '+JSON.stringify(errors));
  await browser.close(); gas.srv.close(); web.close(); process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
