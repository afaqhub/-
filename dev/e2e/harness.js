const http=require('http'), fs=require('fs'), path=require('path');
const {serve}=require('../gas-mock.js');
process.chdir(__dirname);
const {chromium}=require('playwright');
const FONTS=path.join(__dirname,'..','node_modules/@fontsource');
const XLSX=path.join(__dirname,'..','node_modules/xlsx/dist/xlsx.full.min.js');
const OUT=path.join(__dirname,'out');
fs.mkdirSync(OUT,{recursive:true});
async function start(){
  const gas=await serve(8787);
  const web=http.createServer((req,res)=>{
    if(req.url.startsWith('/__f/')){ const f=req.url.slice(5); const p=path.join(FONTS,f.replace(/\.\./g,'')); if(fs.existsSync(p)){res.writeHead(200,{'Content-Type':'font/woff2','Access-Control-Allow-Origin':'*'});return res.end(fs.readFileSync(p));} }
    res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'}); res.end(fs.readFileSync(path.join(__dirname,'..','..','index.html')));
  }); await new Promise(r=>web.listen(8788,r));
  const browser=await chromium.launch();
  return {gas,web,browser};
}
async function newPage(browser,opts={}){
  const ctx=await browser.newContext({viewport:{width:430,height:900},locale:'ar-SA',...opts});
  const page=await ctx.newPage();
  const errors=[]; page.on('pageerror',e=>errors.push('PAGEERR '+e.message)); page.on('console',m=>{ if(m.type()==='error') errors.push('CONSOLE '+m.text()); });
  await page.route('https://fonts.googleapis.com/**',r=>r.fulfill({contentType:'text/css',body:`
    @font-face{font-family:Amiri;font-weight:400;src:url(http://localhost:8788/__f/amiri/files/amiri-arabic-400-normal.woff2)}
    @font-face{font-family:Amiri;font-weight:700;src:url(http://localhost:8788/__f/amiri/files/amiri-arabic-700-normal.woff2)}
    @font-face{font-family:Cairo;font-weight:400;src:url(http://localhost:8788/__f/cairo/files/cairo-arabic-400-normal.woff2)}
    @font-face{font-family:Cairo;font-weight:600;src:url(http://localhost:8788/__f/cairo/files/cairo-arabic-600-normal.woff2)}
    @font-face{font-family:Cairo;font-weight:700;src:url(http://localhost:8788/__f/cairo/files/cairo-arabic-700-normal.woff2)}`}));
  await page.route('https://fonts.gstatic.com/**',r=>r.abort());
  await page.route('https://cdnjs.cloudflare.com/ajax/libs/xlsx/**',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync(XLSX)}));
  await page.route('https://script.google.com/macros/s/TEST/exec',async r=>{
    const req=r.request();
    if(req.method()==='GET'){ const t=await (await fetch('http://localhost:8787/')).text(); return r.fulfill({contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:t}); }
    const body=req.postData(); const t=await (await fetch('http://localhost:8787/',{method:'POST',body})).text();
    r.fulfill({contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:t});
  });
  return {page,errors,ctx};
}
async function shot(page,name){ await page.screenshot({path:path.join(OUT,name+'.png')}); }
module.exports={start,newPage,shot,OUT};
