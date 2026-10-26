/* محاكي بسيط لبيئة Google Apps Script لتشغيل Code.gs في Node بغرض الاختبار فقط.
   صارم عمدًا: يرفض النطاقات خارج حدود الورقة كما يفعل Google، لتُكشف الأخطاء قبل النشر.
   الاستعمال:  node dev/gas-mock.js [port]   ثم يُشغَّل الخادم على http://localhost:port/exec */
'use strict';
const fs = require('fs'), vm = require('vm'), path = require('path'), http = require('http'), crypto = require('crypto');

class Range {
  constructor(sh, r, c, nr, nc){
    if (!(r>=1 && c>=1 && nr>=1 && nc>=1)) throw new Error('Range coordinates invalid: '+[r,c,nr,nc]);
    if (r+nr-1 > sh.maxRows || c+nc-1 > sh.maxCols)
      throw new Error('The coordinates of the range are outside the dimensions of the sheet: '+sh.name+' '+[r,c,nr,nc]+' max '+sh.maxRows+'x'+sh.maxCols);
    Object.assign(this,{sh,r,c,nr,nc});
  }
  getValues(){ const o=[]; for(let i=0;i<this.nr;i++){ const row=[]; for(let j=0;j<this.nc;j++) row.push(this.sh.get(this.r+i,this.c+j)); o.push(row);} return o; }
  getValue(){ return this.sh.get(this.r,this.c); }
  setValues(v){
    if (v.length!==this.nr || v.some(x=>x.length!==this.nc)) throw new Error('The number of rows/columns in the data does not match the range ('+this.nr+'x'+this.nc+' vs '+v.length+'x'+(v[0]&&v[0].length)+')');
    for(let i=0;i<this.nr;i++) for(let j=0;j<this.nc;j++) this.sh.set(this.r+i,this.c+j,v[i][j]); return this; }
  setValue(x){ for(let i=0;i<this.nr;i++) for(let j=0;j<this.nc;j++) this.sh.set(this.r+i,this.c+j,x); return this; }
  setNumberFormat(f){ if(f==='@') this.sh.textRanges.push([this.r,this.c,this.r+this.nr-1,this.c+this.nc-1]); return this; }
  setFontWeight(){return this;} setBackground(){return this;} setFontColor(){return this;}
}
class Sheet {
  constructor(name){ this.name=name; this.maxRows=1000; this.maxCols=26; this.rows=[]; this.textRanges=[]; }
  isText(r,c){ return this.textRanges.some(t=>r>=t[0]&&r<=t[2]&&c>=t[1]&&c<=t[3]); }
  get(r,c){ const row=this.rows[r-1]; const v=row?row[c-1]:undefined; return v===undefined?'':v; }
  set(r,c,v){
    while(this.rows.length<r) this.rows.push([]);
    if (v===null||v===undefined) v='';
    if (!(v instanceof Date) && v!=='') v = String(v);
    // يحاكي Google: خلية غير نصّية تحوّل «=…» إلى معادلة و«2/45» إلى تاريخ — نفشل صراحةً كي لا يمرّ خطأ كهذا دون أن نراه
    if (typeof v==='string' && !this.isText(r,c) && (/^=/.test(v)||/^\d{1,2}\/\d{1,4}$/.test(v)))
      throw new Error('WOULD_CONVERT '+this.name+' R'+r+'C'+c+': '+v);
    this.rows[r-1][c-1]=v;
  }
  getRange(r,c,nr,nc){ return new Range(this,r,c,nr||1,nc||1); }
  getLastRow(){ for(let i=this.rows.length-1;i>=0;i--) if((this.rows[i]||[]).some(v=>v!==''&&v!==undefined)) return i+1; return 0; }
  getLastColumn(){ let m=0; this.rows.forEach(r=>(r||[]).forEach((v,j)=>{ if(v!==''&&v!==undefined&&j+1>m) m=j+1; })); return m; }
  getMaxRows(){return this.maxRows;} getMaxColumns(){return this.maxCols;}
  appendRow(vals){ if(vals.length>this.maxCols) throw new Error('appendRow: too many columns '+vals.length+'>'+this.maxCols+' in '+this.name);
    const r=this.getLastRow()+1; if(r>this.maxRows) this.maxRows=r; vals.forEach((v,j)=>this.set(r,j+1,v)); }
  deleteRow(r){ if(r<1||r>this.maxRows) throw new Error('deleteRow out of range'); this.rows.splice(r-1,1); }
  insertColumnsAfter(pos,n){ this.maxCols+=n; }
  insertRowsAfter(pos,n){ this.maxRows+=n; }
  setFrozenRows(){} setColumnWidth(){}
}
function build(){
  const sheets = {}; const props = {}; const mails = []; const logs = [];
  const ss = { getSheetByName:n=>sheets[n]||null, insertSheet:n=>{ if(sheets[n]) throw new Error('exists '+n); return sheets[n]=new Sheet(n); } };
  const ctx = {
    console, JSON, Math, Date, Intl, Object, Array, String, Number, RegExp, Error, isNaN, parseInt, parseFloat,
    SpreadsheetApp:{ getActiveSpreadsheet:()=>ss },
    PropertiesService:{ getScriptProperties:()=>({
      getProperty:k=>Object.prototype.hasOwnProperty.call(props,k)?props[k]:null,
      setProperty:(k,v)=>{props[k]=String(v);}, deleteProperty:k=>{delete props[k];},
      getProperties:()=>Object.assign({},props) }) },
    LockService:{ getScriptLock:()=>({ waitLock(){}, releaseLock(){} }) },
    Utilities:{ getUuid:()=>crypto.randomUUID(), sleep(){},
      computeDigest:(alg,s)=>Array.from(crypto.createHash('sha256').update(String(s),'utf8').digest()).map(b=>b>127?b-256:b),
      DigestAlgorithm:{SHA_256:'SHA_256'}, Charset:{UTF_8:'UTF_8'},
      formatDate:(d)=>d.toISOString().slice(0,10).replace(/-/g,'') },
    ContentService:{ createTextOutput:s=>({ s, mime:null, setMimeType(m){this.mime=m;return this;}, getContent(){return this.s;} }), MimeType:{JSON:'JSON'} },
    MailApp:{ sendEmail:o=>{ mails.push(o); } },
    Logger:{ log:m=>logs.push(m) }
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname,'..','Code.gs'),'utf8'), ctx, {filename:'Code.gs'});
  return { ctx, sheets, props, mails, logs,
    call(fn,args,token){ const out = ctx.doPost({postData:{contents:JSON.stringify({fn,args:args||{},token:token||''})}}); return JSON.parse(out.getContent()); } };
}
function serve(port){
  let env = build();
  const srv = http.createServer((req,res)=>{
    const cors = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*','Content-Type':'application/json; charset=utf-8'};
    if (req.method==='OPTIONS'){ res.writeHead(204,cors); return res.end(); }
    if (req.url.startsWith('/__reset')){ env = build(); res.writeHead(200,cors); return res.end('{"ok":true}'); }
    if (req.url.startsWith('/__setup')){ const r = env.ctx.setup(); res.writeHead(200,cors); return res.end(JSON.stringify({r})); }
    if (req.url.startsWith('/__env')){ res.writeHead(200,cors); return res.end(JSON.stringify({mails:env.mails,props:env.props})); }
    let body=''; req.on('data',d=>body+=d); req.on('end',()=>{
      res.writeHead(200,cors);
      if (req.method==='GET') return res.end(env.ctx.doGet().getContent());
      res.end(env.ctx.doPost({postData:{contents:body}}).getContent());
    });
  });
  return new Promise(r=>srv.listen(port,()=>r({srv,get env(){return env;}})));
}
module.exports = { build, serve };
if (require.main === module) serve(Number(process.argv[2])||8787).then(()=>console.log('mock GAS on :'+(process.argv[2]||8787)));
