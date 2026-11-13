const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const br = await chromium.launch(); const p = await br.newPage({viewport:{width:1920,height:1080}});
  await p.goto('file://'+process.cwd()+'/teaching_montage.html?render=1'); await p.waitForFunction(()=>window.__total);
  const sc = await p.evaluate(()=>window.__scenes()); const tot = await p.evaluate(()=>window.__total());
  const f = s => { const m=Math.floor(s/60), x=Math.round(s%60); return m+':'+String(x).padStart(2,'0'); };
  const titles = {s01:'العنوان',s02:'رحلة الحصة الواحدة',s03:'الخطوة 1: افتح فصلك',s04:'الخطوة 2: سجّل الحصة',s05:'الخطوة 3: ارصد الدرجات',s06:'كيف يُحسب المعدل',s07:'الخطوة 4: النتيجة تنعكس',s08:'إذا غاب المدرس',s09:'فصول العقيدة والفقه',s10:'كيف يُختبر الطلاب',s11:'خمس عادات بسيطة',s12:'الختام'};
  let md = '# نص التعليق الصوتي لمونتاج «الاستخدام اليومي»\n\nالمدة الكلية: **'+f(tot)+'** (بلا صوت). كل مشهد له وقت بداية ومدة، والنص المقترح مكتوب بحيث يتسع للمدة تقريبًا (قراءة هادئة).\n\n| # | المشهد | يبدأ | المدة | اسم ملف الصوت |\n|---|---|---|---|---|\n';
  sc.forEach((s,i)=>{ md += `| ${i+1} | ${titles[s.id]} | ${f(s.start)} | ${Math.round(s.dur)}ث | audio/${s.id}.mp3 |\n`; });
  md += '\n---\n';
  sc.forEach((s,i)=>{ md += `\n## ${i+1}. ${titles[s.id]}  (${f(s.start)} — ${Math.round(s.dur)} ثانية)\n\n${s.narr.map(x=>'- '+x).join('\n')}\n`; });
  fs.writeFileSync('montage_script_AR.md', md); console.log(md.slice(0,400)); await br.close();
})();
