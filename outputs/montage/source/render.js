const { chromium } = require('playwright'); const fs = require('fs');
const [,, a, b, fps] = process.argv; const FPS = +fps || 24;
(async () => {
  const br = await chromium.launch(); const p = await br.newPage({viewport:{width:1920,height:1080}});
  await p.goto('file://'+process.cwd()+'/teaching_montage.html?render=1'); await p.waitForFunction(()=>window.__total);
  fs.mkdirSync('frames',{recursive:true});
  for (let i=+a;i<+b;i++){ await p.evaluate(t=>window.__seek(t), i/FPS); await p.screenshot({path:`frames/f${String(i).padStart(5,'0')}.jpg`,type:'jpeg',quality:90}); }
  await br.close(); console.log('done',a,b);
})();
