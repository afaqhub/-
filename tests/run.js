/* اختبارات «بستان الصغار» — Playwright.
   التشغيل:   node tests/run.js            (كامل)
              node tests/run.js quick      (بلا الجلسات الكاملة)
   اللقطات تُحفظ في tests/shots (أو المسار في المتغير SHOTS).
   يُسرَّع الزمن في الصفحة بالمعامل ?ts=N (للاختبار الآلي فقط). */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const SHOTS = process.env.SHOTS || path.join(__dirname, 'shots');
const QUICK = process.argv.includes('quick');
fs.mkdirSync(SHOTS, { recursive: true });

const VIEWPORTS = {
  'جوال-عمودي': { width: 390, height: 844, tap: 72 },
  'جوال-أفقي': { width: 844, height: 390, tap: 72 },
  'آيباد-عمودي': { width: 820, height: 1180, tap: 96 },
  'آيباد-أفقي': { width: 1180, height: 820, tap: 96 }
};
const shotName = (s) => s.replace(/[^ء-يa-z0-9-]/gi, '_');

/* ───── نتائج ───── */
let pass = 0, fail = 0;
const failures = [];
function ok(cond, msg) {
  if (cond) { pass++; console.log('  ✔ ' + msg); }
  else { fail++; failures.push(msg); console.log('  ✘ ' + msg); }
}
function section(t) { console.log('\n■ ' + t); }

/* ───── خادم ساكن ───── */
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.txt': 'text/plain' };
function serve() {
  return new Promise((res) => {
    const srv = http.createServer((req, rsp) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p.endsWith('/')) p += 'index.html';
      const f = path.join(ROOT, p);
      if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rsp.writeHead(404); rsp.end('no'); return; }
      rsp.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(rsp);
    }).listen(0, '127.0.0.1', () => res({ srv, port: srv.address().port }));
  });
}

/* ───── أدوات الصفحة ───── */
async function newPage(browser, vp, base, opts = {}) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1, hasTouch: true,
    reducedMotion: opts.reduced ? 'reduce' : 'no-preference', serviceWorkers: opts.sw ? 'allow' : 'block'
  });
  if (opts.noStorage) {
    await ctx.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', { get() { throw new Error('storage blocked'); } });
    });
  }
  if (opts.init) await ctx.addInitScript(opts.init);
  const page = await ctx.newPage();
  const log = { errors: [], external: [], requests: 0 };
  page.on('console', (m) => { if (m.type() === 'error') log.errors.push(m.text()); });
  page.on('pageerror', (e) => log.errors.push('PAGEERR ' + e.message));
  page.on('request', (r) => {
    log.requests++;
    const u = r.url();
    if (!/^(file:|data:|blob:|about:)/.test(u) && !u.startsWith(base) && !/^http:\/\/127\.0\.0\.1/.test(u)) log.external.push(u);
  });
  page.__ctx = ctx; page.__log = log;
  return page;
}
async function open(page, base, query = '', opts = {}) {
  await page.goto(base + 'index.html' + query);
  await page.waitForSelector('.tile', { timeout: 8000 });
  await page.waitForTimeout(3200); // حتى تنتهي حركة ظهور الأيقونات (٢٠ أيقونة متتابعة)
  if (!opts.keepWelcome) { const gg = await page.$('.guide-go'); if (gg) { await gg.click(); await page.waitForTimeout(500); } } // شاشة الترحيب
}
const tap = (page) => page.dispatchEvent('.stop-btn', 'pointerdown');
const probe = (page) => page.evaluate(() => Bustan.games.train._probe());
const lit = (page) => page.evaluate(() => document.querySelectorAll('.bulb.lit').length);
const shot = (page, name) => page.screenshot({ path: path.join(SHOTS, shotName(name) + '.png') });

/* يتحقق من القواعد العامة للشاشة الحالية */
async function checkScreen(page, vp, label) {
  const r = await page.evaluate((tapMin) => {
    const out = { small: [], text: '' };
    document.querySelectorAll('button').forEach((b) => {
      if (b.closest('.parent-overlay')) return;
      const cs = getComputedStyle(b);
      if (cs.display === 'none' || cs.visibility === 'hidden' || b.disabled) return;
      const r = b.getBoundingClientRect();
      if (Math.min(r.width, r.height) < tapMin - 0.5) out.small.push((b.className || b.tagName) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
    });
    out.text = (document.body.innerText || '') + ' ' + document.title;
    out.overflow = document.documentElement.scrollWidth > window.innerWidth + 1 || document.documentElement.scrollHeight > window.innerHeight + 1;
    return out;
  }, vp.tap);
  ok(r.small.length === 0, `${label}: كل الأزرار ≥ ${vp.tap}px` + (r.small.length ? ' — الصغيرة: ' + r.small.join(', ') : ''));
  ok(!/[A-Za-z0-9]/.test(r.text), `${label}: لا حرف لاتيني ولا رقم لاتيني في النص الظاهر`);
  ok(!/خطأ|انتهت اللعبة|خسرت|حاولي/.test(r.text), `${label}: لا كلمات فشل`);
  ok(!r.overflow, `${label}: لا تمرير للصفحة`);
}

/* ───── روبوت يلعب القطار ───── */
async function playBot(page, o = {}) {
  const t0 = Date.now();
  let wrongTaps = 0, sawBubble = false, sawHand = false, sawHint = false, maxMs = o.maxMs || 300000;
  const shots = o.shots || {};
  while (Date.now() - t0 < maxMs) {
    if (await page.evaluate(() => !!document.querySelector('.end-screen'))) return { done: true, wrongTaps, sawBubble, sawHand, sawHint, ms: Date.now() - t0 };
    const p = await probe(page);
    if (p.ready) {
      if (p.hint) sawHint = true;
      if (p.armed) sawHand = true;
      if (o.stopAfterLit && (await lit(page)) >= o.stopAfterLit) return { done: false, wrongTaps, sawBubble, sawHand, sawHint, ms: Date.now() - t0 };
      if (o.untilArmed && p.armed) return { done: false, wrongTaps, sawBubble, sawHand, sawHint, ms: Date.now() - t0 };
      if (p.phase === 'play' && p.v > 0.12 && !p.demo && !o.sleepy) {
        if (p.nearValid) await tap(page);
        else if (o.wrong && p.nearBlankOrBad && Math.random() < o.wrong) { await tap(page); wrongTaps++; }
      }
      if (p.phase === 'question' && !sawBubble) { sawBubble = await page.evaluate(() => !!document.querySelector('.q-bubble')); }
      if (shots.hint && p.hint && !shots._h) { shots._h = 1; await shot(page, shots.hint); }
      if (shots.hand && p.armed && !shots._a) { shots._a = 1; await page.waitForTimeout(250); await shot(page, shots.hand); }
      if (shots.bubble && p.phase === 'question' && !shots._b) { shots._b = 1; await page.waitForTimeout(200); await shot(page, shots.bubble); }
    }
    await page.waitForTimeout(25);
  }
  return { done: false, wrongTaps, sawBubble, sawHand, sawHint, ms: Date.now() - t0, timeout: true };
}

async function startTrain(page) {
  await page.tap('.tile[data-game=train]');
  await page.waitForSelector('.game-screen .stop-btn', { timeout: 6000 });
}
async function waitPlay(page, ms = 20000) {
  await page.waitForFunction(() => { const p = Bustan.games.train._probe(); return p.ready && p.phase === 'play'; }, null, { timeout: ms, polling: 50 });
}
async function seeDemoThrough(page) {
  // العرض التوضيحي الأول يجري تلقائياً: ننتظر انتهاءه (ينتهي حين تبدأ جولة حقيقية)
  await page.waitForFunction(() => { const p = Bustan.games.train._probe(); return p.ready && p.phase === 'play' && !p.demo; }, null, { timeout: 60000, polling: 100 });
}

/* ═════════════════════════════ الاختبارات ═════════════════════════════ */
(async () => {
  const { srv, port } = await serve();
  const base = `http://127.0.0.1:${port}/`;
  const browser = await chromium.launch();

  /* ───── ١) فحص المصدر ───── */
  section('فحص المصدر');
  {
    const files = [];
    (function walk(d) {
      fs.readdirSync(d).forEach((f) => {
        const p = path.join(d, f);
        if (/node_modules|\.git$|tests|tools|dist/.test(p)) return;
        if (fs.statSync(p).isDirectory()) walk(p);
        else if (/\.(js|css|html|webmanifest)$/.test(f) && f !== 'dua-card.html') files.push(p);
      });
    })(ROOT);
    let bad = [];
    files.forEach((f) => {
      const s = fs.readFileSync(f, 'utf8');
      if (/speechSynthesis|SpeechSynthesis|new Audio\(|<audio|XMLHttpRequest|serviceWorker.*postMessage/.test(s)) bad.push(f + ' (api ممنوع)');
      if (!/(sw|stats)\.js$/.test(f) && /\bfetch\(/.test(s)) bad.push(f + ' (fetch)');
      const urls = (s.match(/https?:\/\/[^\s"'`)]+/g) || []).filter((u) => !/w3\.org|bustan-676eb-default-rtdb\.firebaseio\.com/.test(u));
      if (urls.length) bad.push(f + ' (روابط: ' + urls.join(',') + ')');
    });
    ok(bad.length === 0, 'لا TTS ولا شبكة ولا روابط خارجية في المصدر' + (bad.length ? ' — ' + bad.join(' | ') : ''));
    const strings = fs.readFileSync(path.join(ROOT, 'js/core/strings.ar.js'), 'utf8');
    ok(!/خطأ|انتهت اللعبة|خسرت|حاولي/.test(strings), 'لا كلمات فشل في strings.ar.js');
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const mf = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.webmanifest'), 'utf8'));
    ok(mf.lang === 'ar' && mf.dir === 'rtl' && mf.display === 'standalone', 'manifest: ar/rtl/standalone');
    ok(/<title>بستان الصغار<\/title>/.test(html) && mf.name === 'بستان الصغار', 'عنوان الصفحة واسم التطبيق بالعربية');
    ok(mf.icons.every((i) => fs.existsSync(path.join(ROOT, i.src))), 'كل أيقونات manifest موجودة');
    ok(/apple-touch-icon/.test(html) && /apple-mobile-web-app-capable/.test(html), 'وسوم iOS موجودة');
    // كل ملف مشار إليه في index.html مدرج في sw.js، وكل ما في sw.js موجود
    const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
    const listed = [...sw.matchAll(/'\.\/([^']*)'/g)].map((m) => m[1]).filter((x) => x);
    const refs = [...html.matchAll(/(?:src|href)="([^"#]+)"/g)].map((m) => m[1]).filter((x) => !/^https?:/.test(x));
    ok(refs.every((r) => listed.includes(r)), 'كل ملفات index.html مدرجة في ذاكرة sw.js' + (refs.filter((r) => !listed.includes(r)).length ? ' — ناقص: ' + refs.filter((r) => !listed.includes(r)).join(',') : ''));
    ok(listed.every((r) => fs.existsSync(path.join(ROOT, r))), 'كل ملفات sw.js موجودة');
    const fonts = fs.readdirSync(path.join(ROOT, 'assets/fonts')).filter((f) => f.endsWith('.woff2'));
    ok(fonts.length >= 3, 'خط Tajawal محلي (woff2)');
  }

  /* ───── ٢) اختبارات الوحدة داخل الصفحة ───── */
  section('اختبارات الوحدة (التكيّف، التخزين، بناء الجولات)');
  {
    const page = await newPage(browser, VIEWPORTS['جوال-عمودي'], base);
    await open(page, base);
    const r = await page.evaluate(() => {
      const out = {};
      const st = (l, s, r) => ({ level: l, smooth: s, rough: r });
      let s = st(1, 0, 0);
      for (let i = 0; i < 3; i++) s = Bustan.adaptive.step(s, i === 1 ? 1 : 0);
      out.up = s.level === 2 && s.change === 'up';
      s = st(2, 0, 0); s = Bustan.adaptive.step(s, 2); s = Bustan.adaptive.step(s, 0); s = Bustan.adaptive.step(s, 0);
      out.twoBreaks = s.level === 2; // خطآن يقطعان السلسلة
      s = st(3, 0, 0); s = Bustan.adaptive.step(s, 3); s = Bustan.adaptive.step(s, 5);
      out.down = s.level === 2 && s.change === 'down';
      s = st(3, 0, 0); s = Bustan.adaptive.step(s, 3); s = Bustan.adaptive.step(s, 1); s = Bustan.adaptive.step(s, 3);
      out.noDownIfBroken = s.level === 3;
      s = st(5, 2, 0); s = Bustan.adaptive.step(s, 0); out.cap5 = s.level === 5;
      s = st(1, 0, 1); s = Bustan.adaptive.step(s, 4); out.floor1 = s.level === 1;
      // التخزين: ترحيل من بيانات بلا إصدار
      const m = Bustan.storage.migrate({ games: { train: { level: 4 } } });
      out.migrate = m.schemaVersion === 3 && m.games.train.level === 4 && !!m.games.mirror && m.settings.soloLimit === 2;
      out.migrateBad = Bustan.storage.migrate('x').schemaVersion === 3;
      const old = Bustan.storage.migrate({ schemaVersion: 1, settings: { soundOn: false, soloLimit: 2 }, games: {} });
      out.oldSoundOn = old.settings.soundOn === true && old.schemaVersion === 3 && Array.isArray(old.garden);
      const exp = Bustan.storage.exportJSON();
      out.importBad = Bustan.storage.importJSON('{not json') === false && Bustan.storage.importJSON('{"games":5}') === false;
      out.importFuture = Bustan.storage.importJSON(JSON.stringify({ schemaVersion: 99, games: {} })) === false;
      out.importOk = Bustan.storage.importJSON(exp) === true;
      out.soundDefaultOff = Bustan.storage.defaults().settings.soundOn === true;
      out.limitDefault2 = Bustan.storage.defaults().settings.soloLimit === 2;
      // بناء الجولات: ٥٠٠ جولة لكل مستوى
      const T = Bustan.games.train, probs = [];
      const same = (a, b) => a && b && a.shape === b.shape && a.color === b.color;
      for (let lv = 1; lv <= 5; lv++) {
        for (let n = 0; n < 500; n++) {
          const K = 6 + (n % 4);
          const r = T._makeRound(lv, K, null);
          const valids = r.ring.filter((x) => T._isValid(r, x)).length;
          if (r.ring.length !== K) probs.push('K' + lv);
          if (valids < 2) probs.push('valids' + lv);
          if (lv < 5) {
            // لا مشتت يطابق الهدف إلا الأهداف نفسها
            r.ring.forEach((x) => { if (x && T._isValid(r, x) && !r.targets.some((t) => same(t, x))) probs.push('dup' + lv); });
          }
          if (lv === 1 && r.ring.filter(Boolean).length !== 2) probs.push('lv1blank');
          if (lv === 3) r.ring.forEach((x) => { if (x && !same(x, r.targets[0]) && x.shape !== r.targets[0].shape) probs.push('lv3shape'); });
          if (lv === 2) r.ring.forEach((x) => { if (x && !same(x, r.targets[0]) && x.shape === r.targets[0].shape) probs.push('lv2shape'); });
          if (lv === 4 && r.targets.length !== 2) probs.push('lv4targets');
          if (lv === 5 && (!r.inverted || r.ring.some((x) => !x))) probs.push('lv5');
          if (lv === 5 && T._isValid(r, r.targets[0])) probs.push('lv5inv');
        }
      }
      out.probs = probs.slice(0, 5);
      // بنك «أول صوت»
      const F = Bustan.games.firstsound, fp = [];
      if (F.WORDS.length < 40) fp.push('count');
      F.WORDS.forEach((w) => { if (!Bustan.pics.has(w[0])) fp.push('pic:' + w[0]); if (/^ال/.test(w[1])) fp.push('al:' + w[1]); });
      'بمسفلتجحخدرزشصطعغكنهوي'.split('').forEach((L) => { if (F.WORDS.filter((w) => w[1][0] === L).length < 2) fp.push('few:' + L); });
      for (let lv = 1; lv <= 3; lv++) for (let n = 0; n < 300; n++) {
        const r = F._makeLetterRound(lv, []);
        if (r.letters.some((L) => 'ثذظضق'.includes(L))) fp.push('deferred@' + lv);
        if (new Set(r.letters).size !== 3 || r.letters[r.correct] !== r.word[0]) fp.push('letters@' + lv);
        if (lv === 1 && r.letters.some((L) => !'بمسفل'.includes(L))) fp.push('lv1set');
      }
      for (let n = 0; n < 200; n++) { const r = F._makeLetterRound(4, []); if (!'ثذظضق'.includes(r.word[0]) || new Set(r.letters).size !== 3) fp.push('lv4'); }
      for (let n = 0; n < 100; n++) { const r = F._makeRhymeRound([]); if (new Set(r.keys).size !== 3) fp.push('rhyme'); }
      out.fs = [...new Set(fp)].slice(0, 6);
      // بنك «جسر الروابط»
      const Br = Bustan.games.bridge, bp = [];
      [0, 1, 2, 3].forEach((c) => { if (Br.BANK.filter((s) => s[0] === c).length < 8) bp.push('few' + c); });
      Br.BANK.forEach((s) => { [s[2], s[4], s[5]].forEach((k) => { if (!Bustan.pics.has(k)) bp.push('pic:' + k); }); if (!Br.PHRASE[s[4]] || !Br.PHRASE[s[5]]) bp.push('phrase:' + s[4] + '/' + s[5]); if (/[A-Za-z0-9]/.test(s[1].replace('{c}', '') + s[3]) || !s[1].includes('{c}') || !Array.isArray(s[6]) || s[6].some((k) => !Bustan.pics.has(k))) bp.push('sentence'); if (new Set([s[2], s[4], s[5]]).size !== 3) bp.push('dup'); });
      out.br = [...new Set(bp)].slice(0, 6);
      // الأنماط والمرآة
      const pp = [];
      for (let lv = 1; lv <= 5; lv++) for (let n = 0; n < 200; n++) {
        const pt = Bustan.games.pattern._makePattern(lv);
        if (pt.gaps.length !== 1 || (lv !== 3 && pt.gaps[0] !== pt.seq.length - 1) || pt.choices !== (lv === 1 ? 2 : 3)) pp.push('gaps' + lv);
        const m = Bustan.games.mirror._makeRound(lv, 340, 500, 72);
        if (m.cells.filter((x) => x >= 0).length < 2 || m.c * m.r !== m.cells.length) pp.push('mirror' + lv);
        if (m.size < 72) pp.push('cell' + lv);
        if (m.axis !== 'v' || m.copy !== (lv <= 3)) pp.push('copy' + lv);
        const mp = Bustan.games.more._pair(lv); if (mp[0] >= mp[1] || mp[0] < 1) pp.push('more' + lv);
      }
      out.pp = [...new Set(pp)];
      const np = [];
      for (let lv = 1; lv <= 5; lv++) for (let i = 0; i < 200; i++) {
        const c = Bustan.games.fruits._config(lv, i);
        const max = [0, 5, 10, 10, 15, 20][lv];
        if (c.n < 1 || c.n > max) np.push('fruitsN' + lv);
        if (lv === 1 && c.mode !== 'give') np.push('fruitsMode1');
        const R = Bustan.games.letters._makeRound(lv, null);
        if (!R.target || R.dis.length < 1 || R.dis.includes(R.target) || new Set(R.dis).size !== R.dis.length) np.push('letters' + lv);
        if (lv === 5 && !R.forms) np.push('forms');
      }
      for (const n of [4, 6, 8, 12, 16]) { const f = Bustan.games.memory._fit(n, 360, 560); if (f.c * f.r !== n || f.s < 72) np.push('memory' + n); }
      Bustan.free.workshop._pics().forEach((p) => { if (p.parts.length < 4) np.push('pic:' + p.k); });
      out.np = [...new Set(np)];
      return out;
    });
    ok(r.up, 'التكيّف: ٣ جولات سلسة ← صعود');
    ok(r.twoBreaks, 'التكيّف: جولة بخطأين تقطع السلسلة');
    ok(r.down, 'التكيّف: جولتان صعبتان متتاليتان ← هبوط');
    ok(r.noDownIfBroken, 'التكيّف: لا هبوط إن قطعتهما جولة سلسة');
    ok(r.cap5 && r.floor1, 'التكيّف: لا تجاوز للمستويين ١ و٥');
    ok(r.migrate && r.migrateBad, 'التخزين: ترحيل البيانات القديمة والتالفة');
    ok(r.oldSoundOn, 'الترحيل ١←٢: من حُفظ عنده «الصوت مطفأ» القديم يصير مفعّلاً');
    ok(r.importBad && r.importFuture && r.importOk, 'التخزين: رفض النسخ التالفة والأحدث، وقبول الصحيحة');
    ok(r.soundDefaultOff && r.limitDefault2, 'الافتراضات: الصوت مفعّل وحدّ «وحدي» = ٢');
    ok(r.probs.length === 0, 'بناء جولات القطار (٢٥٠٠ جولة) يطابق قواعد المستويات' + (r.probs.length ? ' — ' + r.probs.join(',') : ''));
    ok(r.fs.length === 0, 'بنك «أول صوت»: ≥٤٠ كلمة مرسومة، حرفان لكل حرف سهل، والحروف المؤجلة في المستوى ٤ فقط' + (r.fs.length ? ' — ' + r.fs.join(',') : ''));
    ok(r.br.length === 0, 'بنك «جسر الروابط»: ٨ جمل لكل رابط وكل صورها موجودة' + (r.br.length ? ' — ' + r.br.join(',') : ''));
    ok(r.np.length === 0, 'بناء جولات «سلة الفواكه» و«صيد الحروف» يطابق المستويات' + (r.np.length ? ' — ' + r.np.join(',') : ''));
    ok(r.pp.length === 0, 'بناء الأنماط والمرايا يطابق المستويات وحدّ اللمس' + (r.pp.length ? ' — ' + r.pp.join(',') : ''));
    await page.__ctx.close();
  }

  /* ───── ٣) الشاشة الرئيسية بالمقاسات الأربعة ───── */
  section('الشاشة الرئيسية');
  for (const [name, vp] of Object.entries(VIEWPORTS)) {
    const page = await newPage(browser, vp, base);
    await open(page, base);
    await shot(page, 'home-' + name);
    ok(page.__log.errors.length === 0, `${name}: لا أخطاء console` + (page.__log.errors.length ? ' — ' + page.__log.errors[0] : ''));
    ok(page.__log.external.length === 0, `${name}: لا طلبات خارجية (${page.__log.requests} طلباً محلياً)`);
    await checkScreen(page, vp, name + ' / الرئيسية');
    const info = await page.evaluate(() => ({
      zones: document.querySelectorAll('.zone').length,
      tiles: document.querySelectorAll('.tile').length,
      sleeping: document.querySelectorAll('.tile.is-sleeping').length,
      font: null,
      dir: document.documentElement.dir, lang: document.documentElement.lang,
      digits: !/[0-9]/.test(document.body.innerText)
    }));
    ok(info.zones === 3 && info.tiles === 20 && !!(await page.$('.gd-banner')), `${name}: ثلاث مناطق و٢٠ نشاطاً وبطاقة «بستاني» مستقلة`);
    ok(info.sleeping === 0, `${name}: كل الألعاب متاحة (لا أيقونات نائمة)`);
    const fontOk = await page.evaluate(async () => {
      const r = await Promise.all(['400', '700', '800'].map((w) => document.fonts.load(w + ' 20px Tajawal', 'بستان')));
      return r.every((a) => a.length > 0 && a[0].status === 'loaded');
    });
    ok(fontOk, `${name}: خط Tajawal المحلي (٤٠٠/٧٠٠/٨٠٠) يُحمَّل`);
    ok(info.dir === 'rtl' && info.lang === 'ar', `${name}: rtl / ar`);
    await page.__ctx.close();
  }

  /* ───── ٤) القطار: العرض التوضيحي والمعاينة بالمقاسات ───── */
  section('قطار الإشارة: العرض التوضيحي واللقطات');
  for (const [name, vp] of Object.entries(VIEWPORTS)) {
    const page = await newPage(browser, vp, base);
    await open(page, base, '?ts=1');
    await startTrain(page);
    await page.waitForTimeout(2500);
    await shot(page, 'train-intro-' + name);
    await checkScreen(page, vp, name + ' / قطار');
    // ننتظر اليد (العرض التوضيحي: يد تضغط الزر)
    await page.waitForFunction(() => !!document.querySelector('.hand'), null, { timeout: 25000, polling: 100 }).catch(() => {});
    const hasHand = await page.evaluate(() => !!document.querySelector('.hand'));
    ok(hasHand, `${name}: العرض التوضيحي يُظهر اليد الكرتونية`);
    await shot(page, 'train-demo-hand-' + name);
    ok(page.__log.errors.length === 0, `${name}: لا أخطاء console في القطار` + (page.__log.errors.length ? ' — ' + page.__log.errors[0] : ''));
    ok(page.__log.external.length === 0, `${name}: لا طلبات خارجية في القطار`);
    await page.__ctx.close();
  }

  /* ───── ٥) جلسة كاملة آلياً ───── */
  if (!QUICK) {
    for (const name of (process.env.FAST ? ['جوال-عمودي', 'آيباد-أفقي'] : ['جوال-عمودي', 'آيباد-أفقي', 'جوال-أفقي', 'آيباد-عمودي'])) {
      section('جلسة قطار كاملة آلياً — ' + name);
      const vp = VIEWPORTS[name];
      const page = await newPage(browser, vp, base);
      await open(page, base, '?ts=6');
      await startTrain(page);
      await seeDemoThrough(page);
      ok(true, 'انتهى العرض التوضيحي وبدأت الجولة الأولى');
      const demoSeen = await page.evaluate(() => Bustan.storage.demoSeen('train'));
      ok(demoSeen, 'حُفظ أن العرض شوهد');
      const res = await playBot(page, { wrong: 0.008, shots: name === 'جوال-عمودي' ? { bubble: 'train-question', hint: 'train-hint' } : {} });
      ok(res.done, `اكتملت الجلسة (${Math.round(res.ms / 1000)} ثانية)` + (res.timeout ? ' — انتهت المهلة' : ''));
      await page.waitForTimeout(1500);
      await shot(page, 'train-end-' + name);
      const st = await page.evaluate(() => ({
        lit: document.querySelectorAll('.bulb.lit').length, bulbs: document.querySelectorAll('.bulb').length,
        g: Bustan.storage.game('train'), end: !!document.querySelector('.end-screen'),
        day: Bustan.storage.data().days[Bustan.storage.todayKey()],
        hudHidden: document.querySelector('.hud').classList.contains('is-hidden'),
        endBtns: [...document.querySelectorAll('.end-screen button')].length,
        endText: document.querySelector('.end-screen').innerText,
        again: /مرة أخرى|العب/.test(document.body.innerText)
      }));
      ok(st.bulbs === 10 && st.lit === 10, 'عشرة مصابيح أُضيئت واحداً واحداً');
      ok(st.g.rounds === 10 && st.g.sessions === 1, 'سُجّلت ١٠ جولات وجلسة واحدة في التخزين');
      ok(st.day && st.day.rounds.train === 10 && st.day.sessions.train === 1, 'سُجّل اليوم في السجل');
      ok(st.end && st.hudHidden && st.endBtns === 1, 'شاشة ختامية هادئة وبها زر واحد فقط');
      ok(!st.again && st.endText.trim() === '', 'لا زر «العب مرة أخرى» ولا نص في الختام');
      // لا جولة تلقائية بعد الأخيرة
      await page.waitForTimeout(3000);
      const after = await page.evaluate(() => Bustan.storage.game('train').rounds);
      ok(after === 10, 'لا جولة تلقائية بعد انتهاء الجلسة');
      ok(page.__log.errors.length === 0, 'لا أخطاء console طوال الجلسة' + (page.__log.errors.length ? ' — ' + page.__log.errors[0] : ''));
      ok(page.__log.external.length === 0, 'لا طلبات خارجية طوال الجلسة');
      // العودة للرئيسية
      await page.tap('.end-home');
      await page.waitForSelector('.home .tile', { timeout: 4000 });
      ok(true, 'زر العودة يعيد إلى الرئيسية');
      await page.__ctx.close();
    }

    /* ───── ٦) سلّم المساعدة: لا نقر إطلاقاً ───── */
    section('سلّم المساعدة الصامتة');
    {
      const vp = VIEWPORTS['جوال-عمودي'];
      const page = await newPage(browser, vp, base);
      await open(page, base, '?ts=6');
      await page.evaluate(() => Bustan.storage.markDemoSeen('train'));
      await startTrain(page);
      await waitPlay(page);
      const r = await playBot(page, { sleepy: true, untilArmed: true, maxMs: 90000, shots: { hint: 'train-help-hint', hand: 'train-help-hand' } });
      ok(r.sawHint, 'بعد مرور الهدف بلا نقر: يومض العمود (تلميح)');
      ok(r.sawHand, 'بعد ثلاث إخفاقات: تظهر اليد الكرتونية');
      // ننتظر التوقف التلقائي: يصعد راكب دون أي نقر
      await page.waitForFunction(() => { const p = Bustan.games.train._probe(); return p.ready && p.stops >= 1; }, null, { timeout: 60000, polling: 100 });
      const p = await probe(page);
      ok(p.stops >= 1, 'توقف القطار تلقائياً وصعد راكب بلا نقر من الطفلة');
      await shot(page, 'train-auto-stop');
      ok(page.__log.errors.length === 0, 'لا أخطاء console');
      await page.__ctx.close();
    }

    /* ───── ٧) النقر الخاطئ: فقاعة استفهام بلا عقوبة ───── */
    section('النقر على غير الهدف');
    {
      const vp = VIEWPORTS['جوال-عمودي'];
      const page = await newPage(browser, vp, base);
      await open(page, base, '?ts=3');
      await page.evaluate(() => Bustan.storage.markDemoSeen('train'));
      await startTrain(page);
      await waitPlay(page);
      // ننتظر عموداً غير صالح عند المحطة ثم ننقر
      await page.waitForFunction(() => Bustan.games.train._probe().nearBlankOrBad, null, { timeout: 30000, polling: 20 });
      await tap(page);
      await page.waitForSelector('.q-bubble', { timeout: 3000 });
      ok(true, 'ظهرت فقاعة «؟» عند النقر على غير الهدف');
      await page.waitForTimeout(600);
      await shot(page, 'train-question-bubble');
      const q = await probe(page);
      ok(q.errors >= 1, 'سُجّل الخطأ للتكيّف فقط ولم يظهر شيء للطفلة');
      await page.waitForFunction(() => Bustan.games.train._probe().phase === 'play', null, { timeout: 15000, polling: 100 });
      ok(true, 'يكمل القطار بعد لحظة بلا أي عقوبة');
      const txt = await page.evaluate(() => document.body.innerText);
      ok(!/خطأ|حاولي|خسرت/.test(txt), 'لا نص فشل على الشاشة');
      await page.__ctx.close();
    }

    /* ───── ٨) المستويان ٤ و٥ ───── */
    for (const lv of [4, 5]) {
      section('المستوى ' + lv);
      const vp = VIEWPORTS['جوال-عمودي'];
      const page = await newPage(browser, vp, base);
      await open(page, base, '?ts=6');
      await page.evaluate((l) => { Bustan.storage.markDemoSeen('train'); Bustan.storage.game('train').level = l; Bustan.storage.save(); }, lv);
      await startTrain(page);
      await waitPlay(page);
      await page.waitForTimeout(600);
      await shot(page, 'train-level' + lv + '-card');
      const info = await probe(page);
      ok(info.level === lv, 'تبدأ الجولة بالمستوى ' + lv);
      ok(info.inverted === (lv === 5), lv === 5 ? 'القاعدة مقلوبة في المستوى ٥' : 'قاعدة عادية في المستوى ٤');
      const r = await playBot(page, { stopAfterLit: 1, maxMs: 90000 });
      ok((await lit(page)) >= 1, 'اكتملت جولة بالمستوى ' + lv);
      ok(page.__log.errors.length === 0, 'لا أخطاء console');
      await page.__ctx.close();
    }

    /* ───── ٩) تغيير الاتجاه أثناء اللعب ───── */
    section('تدوير الشاشة أثناء اللعب');
    {
      const page = await newPage(browser, VIEWPORTS['جوال-عمودي'], base);
      await open(page, base, '?ts=4');
      await page.evaluate(() => Bustan.storage.markDemoSeen('train'));
      await startTrain(page);
      await waitPlay(page);
      await page.setViewportSize({ width: 844, height: 390 });
      await page.waitForTimeout(900);
      await shot(page, 'train-rotated');
      const r = await playBot(page, { stopAfterLit: 1, maxMs: 90000 });
      ok((await lit(page)) >= 1, 'تستمر اللعبة وتُكمل جولة بعد التدوير');
      ok(page.__log.errors.length === 0, 'لا أخطاء console بعد التدوير');
      await page.__ctx.close();
    }

    /* ───── ١٠) لا زر إعادة عرض في الشريط العلوي؛ والوالد يعيده من ركنه ───── */
    section('إعادة العرض التوضيحي من ركن الوالدين');
    {
      const page = await newPage(browser, VIEWPORTS['جوال-عمودي'], base);
      await open(page, base, '?ts=6');
      await page.evaluate(() => Bustan.storage.markDemoSeen('train'));
      await startTrain(page);
      await waitPlay(page);
      ok((await page.evaluate(() => !document.querySelector('.game-screen .replay-btn') && document.querySelectorAll('.game-screen .hud-btn').length === 2)), 'لا سهم إعادة في الشريط العلوي (الرئيسية والإيقاف فقط)');
      await page.tap('.home-btn'); await page.waitForSelector('.home .tile');
      const box = await page.locator('.logo-corner').boundingBox();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down(); await page.waitForTimeout(3300); await page.mouse.up();
      await page.waitForSelector('.parent-overlay');
      await page.click('[data-act=replay-demo]');
      ok((await page.evaluate(() => !Bustan.storage.demoSeen('train'))), 'ركن الوالدين يعيد العرض التوضيحي');
      await page.__ctx.close();
    }

    /* ───── ١١) الصوت والحركة المخفّضة ───── */
    section('تفضيل تقليل الحركة');
    {
      const page = await newPage(browser, VIEWPORTS['جوال-عمودي'], base, { reduced: true });
      await open(page, base, '?ts=6');
      await page.evaluate(() => Bustan.storage.markDemoSeen('train'));
      await startTrain(page);
      await waitPlay(page);
      const r = await playBot(page, { stopAfterLit: 1, maxMs: 90000 });
      ok((await lit(page)) >= 1, 'تعمل اللعبة مع تقليل الحركة');
      ok(page.__log.errors.length === 0, 'لا أخطاء console');
      await page.__ctx.close();
    }
  }

  /* ───── الألعاب الأربع الجديدة: جلسة كاملة آلياً ───── */
  if (!QUICK) {
    const NAMES = { feed: 'أطعم الحيوان', hide: 'أين يختبئ؟', vanish: 'من اختفى؟', order: 'رتّب الأحجام', habitat: 'من يعيش هنا؟', tracing: 'ارسم الطريق', shadows: 'لعبة الظلال', more: 'أين الأكثر؟', odd: 'أين المختلف؟', memory: 'بطاقات الذاكرة', fruits: 'سلة الفواكه', letters: 'صيد الحروف', mirror: 'مرآة الأشكال', pattern: 'صانعة الأنماط', firstsound: 'أول صوت', bridge: 'جسر الروابط' };
    for (const vpName of (process.env.FAST ? ['جوال-عمودي', 'آيباد-أفقي'] : ['جوال-عمودي', 'آيباد-أفقي', 'جوال-أفقي', 'آيباد-عمودي'])) {
      for (const g of Object.keys(NAMES)) {
        section(`جلسة كاملة آلياً — ${NAMES[g]} — ${vpName}`);
        const vp = VIEWPORTS[vpName];
        const page = await newPage(browser, vp, base);
        await open(page, base, '?ts=6');
        await page.tap(`.tile[data-game=${g}]`);
        await page.waitForSelector('.game-screen');
        const total = await page.evaluate(() => document.querySelectorAll('.bulb').length);
        ok(total === (g === 'firstsound' || g === 'bridge' ? 8 : 10), 'عدد المصابيح ' + total);
        const gBefore = await page.evaluate(() => Bustan.storage.data().garden.length);
        let checked = false, sawHand = false; const t0 = Date.now();
        while (Date.now() - t0 < 240000) {
          if (await page.evaluate(() => !!document.querySelector('.end-screen'))) break;
          if (!sawHand) sawHand = await page.evaluate(() => !!document.querySelector('.kit-hand, .tr-paw'));
          const did = await page.evaluate((g) => { const go = document.querySelector('.guide-go'); if (go) { go.click(); return false; } return Bustan.games[g]._solveStep(); }, g);
          if (did && !checked && (await lit(page)) >= 1) { checked = true; await page.waitForTimeout(700); await checkScreen(page, vp, NAMES[g]); await shot(page, g + '-' + vpName); }
          await page.waitForTimeout(110);
        }
        ok(sawHand || (await page.evaluate((g) => Bustan.storage.demoSeen(g), g)), 'العرض التوضيحي الأول عُرض (باليد أو بكفّ التتبّع)');
        const st = await page.evaluate((g) => ({ end: !!document.querySelector('.end-screen'), lit: document.querySelectorAll('.bulb.lit').length, gm: Bustan.storage.game(g), btns: document.querySelectorAll('.end-screen button').length }), g);
        ok(st.end && st.lit === total, `اكتملت الجلسة وأُضيئت المصابيح كلها (${Math.round((Date.now() - t0) / 1000)} ث)`);
        ok(st.gm.rounds === total && st.gm.sessions === 1 && st.btns === 1, 'سُجّلت الجلسة، والختام بزر واحد');
        ok((await page.evaluate(() => Bustan.storage.data().garden.length)) === gBefore + 1 && !!(await page.$('.end-plant')), 'أُضيف عنصر جديد إلى «بستاني» عند اكتمال الجلسة');
        ok(page.__log.errors.length === 0, 'لا أخطاء console' + (page.__log.errors.length ? ' — ' + page.__log.errors[0] : ''));
        ok(page.__log.external.length === 0, 'لا طلبات خارجية');
        await page.__ctx.close();
      }
    }

    section('الإيقاف المؤقت');
    {
      const page = await newPage(browser, VIEWPORTS['جوال-عمودي'], base);
      await open(page, base, '?ts=1');
      await page.evaluate(() => Bustan.storage.markDemoSeen('train'));
      await startTrain(page);
      await waitPlay(page);
      ok((await page.evaluate(() => document.querySelectorAll('.game-screen .hud-btn').length)) === 2, 'الشريط العلوي: الرئيسية والإيقاف المؤقت');
      await page.tap('.pause-btn'); await page.waitForTimeout(300);
      const x1 = await page.evaluate(() => Bustan.games.train._probe().v + '|' + document.querySelector('.pole').style.transform);
      await page.waitForTimeout(1500);
      const x2 = await page.evaluate(() => Bustan.games.train._probe().v + '|' + document.querySelector('.pole').style.transform);
      ok(x1 === x2 && !!(await page.$('.pause-layer .resume-btn')), 'الإيقاف يجمّد القطار ويُظهر زر متابعة كبيراً');
      await shot(page, 'pause');
      await tap(page);
      ok((await probe(page)).phase === 'play', 'زر «قف» لا يعمل أثناء الإيقاف');
      await page.tap('.resume-btn'); await page.waitForTimeout(1200);
      const x3 = await page.evaluate(() => document.querySelector('.pole').style.transform);
      ok(x3 !== x2.split('|')[1] && !(await page.$('.pause-layer')), 'المتابعة تُكمل الحركة');
      ok(page.__log.errors.length === 0, 'لا أخطاء console');
      await page.__ctx.close();
    }

    section('سلّم المساعدة في ألعاب الاختيار (صانعة الأنماط)');
    {
      const page = await newPage(browser, VIEWPORTS['جوال-عمودي'], base);
      await open(page, base, '?ts=3');
      await page.evaluate(() => Bustan.storage.markDemoSeen('pattern'));
      await page.tap('.tile[data-game=pattern]');
      await page.waitForSelector('.g-tray .g-choice', { timeout: 15000 });
      await page.waitForTimeout(900);
      // ننقر خياراً خاطئاً ثلاث مرات
      const pickWrong = () => page.evaluate(() => { const bs = [...document.querySelectorAll('.g-tray .g-choice')]; const bad = bs.find((b) => b !== Bustan.games.pattern.__ans()); bad.click(); });
      await page.evaluate(() => { const P = Bustan.games.pattern; P.__ans = () => { let a = null; const bs = [...document.querySelectorAll('.g-tray .g-choice')]; const orig = HTMLElement.prototype.click; HTMLElement.prototype.click = function () { a = this; }; P._solveStep(); HTMLElement.prototype.click = orig; return a; }; });
      await pickWrong(); await page.waitForTimeout(500); await pickWrong(); await page.waitForTimeout(400);
      ok(await page.evaluate(() => !!document.querySelector('.g-tray .pulse-hint')), 'بعد إخفاقين: ينبض الخيار الصحيح');
      await shot(page, 'pattern-hint');
      await pickWrong();
      await page.waitForSelector('.kit-hand', { timeout: 4000 });
      ok(true, 'بعد الثالث: اليد الكرتونية تُظهر الحل');
      await page.waitForFunction(() => document.querySelectorAll('.bulb.lit').length >= 1, null, { timeout: 30000 });
      ok(true, 'تُكمَل الجولة بنجاح دون لوم');
      const txt = await page.evaluate(() => document.body.innerText);
      ok(!/خطأ|حاولي|خسرت/.test(txt), 'لا نص فشل');
      ok(page.__log.errors.length === 0, 'لا أخطاء console' + (page.__log.errors.length ? ' — ' + page.__log.errors[0] : ''));
      await page.__ctx.close();
    }
  }

  /* ───── القسم الإبداعي ───── */
  section('القسم الإبداعي: ورشة الأشكال ولوحة التلوين');
  for (const vpName of Object.keys(VIEWPORTS)) {
    const vp = VIEWPORTS[vpName];
    const page = await newPage(browser, vp, base);
    await open(page, base);
    await page.tap('.tile[data-game=workshop]');
    await page.waitForSelector('.free-screen .ws-piece-btn'); await page.waitForTimeout(800);
    await checkScreen(page, vp, vpName + ' / الورشة');
    await shot(page, 'workshop-' + vpName);
    const pieces = await page.evaluate(() => document.querySelectorAll('.ws-piece-btn').length);
    ok(pieces >= 4, `${vpName}: الورشة تعرض صورة متقطعة و${pieces} أشكال لبنائها`);
    ok((await page.evaluate(() => document.querySelectorAll('.bulb').length)) === 0, `${vpName}: لعب حرّ بلا مصابيح`);
    // سحب حقيقي: أول شكل إلى كل الأماكن حتى يلتصق في مكانه المطابق
    const pos = await page.evaluate(() => { const r = document.querySelector('.ws-piece-btn').getBoundingClientRect(); return { from: [r.left + r.width / 2, r.top + r.height / 2], slots: [...document.querySelectorAll('.ws-slot svg')].map((x) => { const q = x.getBoundingClientRect(); return [q.left + q.width / 2, q.top + q.height / 2]; }) }; });
    let snapped = false;
    for (const to of pos.slots) {
      await page.mouse.move(pos.from[0], pos.from[1]); await page.mouse.down();
      await page.mouse.move(to[0], to[1], { steps: 8 }); await page.mouse.up(); await page.waitForTimeout(450);
      if ((await page.evaluate(() => document.querySelectorAll('.ws-piece-btn').length)) < pieces) { snapped = true; break; }
    }
    ok(snapped, `${vpName}: سحب الشكل إلى مكانه يلصقه كالمغناطيس`);
    while (await page.evaluate(() => Bustan.free.workshop._solve())) await page.waitForTimeout(120);
    await page.waitForTimeout(1800);
    ok(await page.evaluate(() => document.querySelector('.ws-next').classList.contains('ready')), `${vpName}: اكتمال الصورة يُحييها ويُظهر زر الصورة التالية`);
    await page.tap('.home-btn'); await page.waitForSelector('.home .tile'); await page.waitForTimeout(400);
    await page.tap('.tile[data-game=coloring]');
    await page.waitForSelector('.cl-svg .rg'); await page.waitForTimeout(600);
    await page.tap('.cl-color >> nth=2');
    await page.dispatchEvent('.cl-svg .rg >> nth=0', 'pointerdown');
    ok((await page.evaluate(() => document.querySelector('.cl-svg .rg').getAttribute('fill'))) !== '#FFFFFF', `${vpName}: التلوين يعمل`);
    await checkScreen(page, vp, vpName + ' / التلوين');
    await shot(page, 'coloring-' + vpName);
    ok(page.__log.errors.length === 0, `${vpName}: لا أخطاء console` + (page.__log.errors.length ? ' — ' + page.__log.errors[0] : ''));
    await page.__ctx.close();
  }

  section('الوضع الليلي وزر فاجئني');
  {
    const page = await newPage(browser, VIEWPORTS['جوال-عمودي'], base);
    await open(page, base);
    await page.click('.hdr-tool >> nth=0'); await page.waitForTimeout(300);
    ok(await page.evaluate(() => document.documentElement.classList.contains('night') && Bustan.storage.data().settings.night === true), 'زر الوضع الليلي يعمل ويُحفظ');
    await page.reload(); await page.waitForSelector('.tile');
    ok(await page.evaluate(() => document.documentElement.classList.contains('night')), 'الوضع الليلي يبقى بعد إعادة التحميل');
    await page.click('.hdr-tool >> nth=0');
    ok(!(await page.evaluate(() => document.documentElement.classList.contains('night'))), 'وزر النهار يعيده');
    await page.waitForTimeout(2600);
    await page.tap('.surprise-btn'); await page.waitForSelector('.game-screen', { timeout: 6000 });
    ok(true, 'زر «فاجئني» يبدأ لعبة عشوائية');
    await page.__ctx.close();
  }

  section('شاشة الترحيب، الرسم الحر، البستان');
  {
    const page = await newPage(browser, VIEWPORTS['جوال-عمودي'], base);
    await open(page, base, '', { keepWelcome: true });
    ok(!!(await page.$('.guide-layer')) && /أهلاً بكم/.test(await page.evaluate(() => document.body.innerText)), 'شاشة ترحيب للوالدين عند أول دخول');
    ok(!/علاج|صعوبات|اضطراب|تشخيص/.test(await page.evaluate(() => document.body.innerText)), 'لا إشارة إلى علاج أو صعوبات تعلم');
    await page.click('.guide-go'); await page.waitForTimeout(500);
    ok(!(await page.$('.guide-layer')) && (await page.evaluate(() => Bustan.storage.data().welcomed)), 'يُغلق الترحيب ولا يعود');
    await page.reload(); await page.waitForSelector('.tile'); await page.waitForTimeout(800);
    ok(!(await page.$('.guide-layer')), 'لا يظهر الترحيب مرة ثانية');
    await page.waitForTimeout(1800);
    // الرسم الحر
    await page.tap('.tile[data-game=drawing]'); await page.waitForSelector('.dr-canvas'); await page.waitForTimeout(600);
    const c = await page.evaluate(() => { const r = document.querySelector('.dr-canvas').getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; });
    await page.mouse.move(c[0] + 40, c[1] + 60); await page.mouse.down(); await page.mouse.move(c[0] + c[2] - 40, c[1] + c[3] - 60, { steps: 10 }); await page.mouse.up();
    ok(await page.evaluate(() => { const cv = document.querySelector('.dr-canvas'); const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; for (let i = 0; i < d.length; i += 4) if (d[i + 2] < 200) return true; return false; }), 'الرسم بالإصبع يترك أثراً على اللوحة');
    await page.tap('.dr-mix'); await page.tap('.dr-tray .cl-color >> nth=0', { force: true }); await page.tap('.dr-tray .cl-color >> nth=2', { force: true });
    ok(await page.evaluate(() => getComputedStyle(document.querySelector('.dr-mixdot')).display !== 'none'), 'خلط لونين يُنتج لوناً جديداً في الوعاء');
    await checkScreen(page, VIEWPORTS['جوال-عمودي'], 'الرسم الحر');
    await page.tap('.home-btn'); await page.waitForSelector('.home .tile'); await page.waitForTimeout(400);
    // البستان
    await page.evaluate(() => { Bustan.garden.plant(); Bustan.garden.plant(); Bustan.garden.plant(); });
    await page.tap('.gd-banner'); await page.waitForSelector('.gd-item'); await page.waitForTimeout(700);
    ok((await page.evaluate(() => document.querySelectorAll('.gd-item').length)) === 3, 'البستان يعرض ما زُرع');
    ok(page.__log.errors.length === 0, 'لا أخطاء console' + (page.__log.errors.length ? ' — ' + page.__log.errors[0] : ''));
    await page.__ctx.close();
  }

  /* ───── ١٢) حدّ «وحدي» اليومي ───── */
  section('حدّ جلسات «وحدي» اليومي');
  {
    const page = await newPage(browser, VIEWPORTS['جوال-عمودي'], base);
    await open(page, base, '?ts=6');
    await page.evaluate(() => {
      const s = Bustan.storage;
      s.data().settings.soloLimit = 1;
      const d = s.data().days; d[s.todayKey()] = { sessions: { train: 1 }, rounds: { train: 10 } };
      s.save(); Bustan.home.show();
    });
    await page.waitForTimeout(800);
    const locked = await page.evaluate(() => ({ z: !!document.querySelector('.zone-solo.is-locked'), s: !!document.querySelector('.sleepy'), t: !!document.querySelector('.zone-together.is-locked') }));
    ok(locked.z && locked.s && !locked.t, 'عند بلوغ الحد: تنام الشخصية وتُغلق «وحدي» فقط');
    await shot(page, 'home-locked');
    await page.tap('.tile[data-game=train]');
    await page.waitForTimeout(900);
    ok(!(await page.evaluate(() => !!document.querySelector('.game-screen'))), 'النقر على لعبة مقفلة لا يبدأها (يهتز فقط)');
    // الوالد يفتحها
    await page.evaluate(() => { Bustan.storage.openSoloToday(); Bustan.home.show(); });
    await page.waitForTimeout(700);
    ok(!(await page.evaluate(() => !!document.querySelector('.zone-solo.is-locked'))), 'فتح الوالد يلغي القفل لليوم');
    await page.__ctx.close();
  }

  /* ───── ١٣) ركن الوالدين ───── */
  section('ركن الوالدين');
  {
    const vp = VIEWPORTS['جوال-عمودي'];
    const page = await newPage(browser, vp, base);
    await open(page, base);
    const box = await page.locator('.logo-corner').boundingBox();
    const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
    // ضغطة قصيرة لا تفتح شيئاً
    await page.mouse.move(cx, cy); await page.mouse.down(); await page.waitForTimeout(1200); await page.mouse.up();
    ok(!(await page.evaluate(() => !!document.querySelector('.parent-overlay'))), 'الضغطة القصيرة لا تفتح ركن الوالدين، ولا أثر ظاهر');
    await page.mouse.move(cx, cy); await page.mouse.down(); await page.waitForTimeout(3300);
    await page.mouse.up();
    await page.waitForSelector('.parent-overlay', { timeout: 2000 });
    ok(true, 'الضغطة المطولة ٣ ثوانٍ تفتح ركن الوالدين');
    await shot(page, 'parent-corner');
    const txt = await page.evaluate(() => document.querySelector('.parent-overlay').innerText);
    ok(!/[A-Za-z0-9]/.test(txt), 'لا حروف ولا أرقام لاتينية في ركن الوالدين');
    // الحدّ
    await page.click('.p-limit .p-step:last-child');
    ok((await page.evaluate(() => Bustan.storage.data().settings.soloLimit)) === 3, 'زيادة حدّ «وحدي»');
    // الصوت
    await page.click('[data-act=sound]');
    ok((await page.evaluate(() => Bustan.storage.data().settings.soundOn)) === false, 'مفتاح الصوت يعمل (كان مفعّلاً فصار مطفأً)');
    await page.click('[data-act=sound]');
    // نسخ
    await page.click('[data-act=copy]');
    await page.waitForTimeout(400);
    const msg = await page.evaluate(() => document.querySelector('.p-msg').textContent);
    ok(/تم النسخ|تعذّرت/.test(msg), 'زر النسخ يعطي رسالة عربية: «' + msg + '»');
    // استعادة: صالحة وتالفة
    const good = await page.evaluate(() => { const d = JSON.parse(Bustan.storage.exportJSON()); d.games.train.level = 4; d.games.train.rounds = 77; return JSON.stringify(d); });
    await page.fill('.p-ta', '{مكسور');
    await page.click('[data-act=restore]');
    ok((await page.evaluate(() => Bustan.storage.game('train').rounds)) !== 77, 'نسخة تالفة لا تغيّر البيانات');
    ok((await page.evaluate(() => document.querySelector('.p-msg').textContent)).includes('تعذّر'), 'رسالة عربية لنسخة تالفة');
    await page.fill('.p-ta', good);
    await page.click('[data-act=restore]');
    await page.waitForTimeout(500);
    ok((await page.evaluate(() => Bustan.storage.game('train').level === 4 && Bustan.storage.game('train').rounds === 77)), 'الاستعادة من النص تعمل');
    ok(!(await page.evaluate(() => !!document.querySelector('.parent-overlay'))), 'يُغلق الركن بعد الاستعادة');
    // إعادة ضبط اللعبة (ضغطتان)
    await page.mouse.move(cx, cy); await page.mouse.down(); await page.waitForTimeout(3300); await page.mouse.up();
    await page.waitForSelector('.parent-overlay');
    await page.click('[data-reset=train]');
    ok((await page.evaluate(() => Bustan.storage.game('train').rounds)) === 77, 'ضغطة واحدة لا تعيد الضبط (تأكيد أولاً)');
    await page.click('[data-reset=train]');
    ok((await page.evaluate(() => Bustan.storage.game('train').rounds === 0 && Bustan.storage.game('train').level === 1)), 'الضغطة الثانية تعيد ضبط اللعبة');
    ok(page.__log.errors.length === 0, 'لا أخطاء console في ركن الوالدين' + (page.__log.errors.length ? ' — ' + page.__log.errors[0] : ''));
    await page.__ctx.close();
  }

  /* ───── ١٤) التخزين غير متاح ───── */
  section('التخزين غير متاح');
  {
    const page = await newPage(browser, VIEWPORTS['جوال-عمودي'], base, { noStorage: true });
    await open(page, base, '?ts=6');
    await startTrain(page);
    await page.waitForTimeout(2500);
    ok(page.__log.errors.length === 0, 'يعمل التطبيق ويبدأ اللعبة دون تخزين' + (page.__log.errors.length ? ' — ' + page.__log.errors[0] : ''));
    ok(!(await page.evaluate(() => Bustan.storage.isPersistent())), 'يُكتشف غياب التخزين');
    await page.__ctx.close();
  }

  /* ───── ١٥) file:// بلا Service Worker ───── */
  section('فتح index.html مباشرة من file://');
  {
    const vp = VIEWPORTS['جوال-عمودي'];
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, hasTouch: true });
    const page = await ctx.newPage();
    const errs = [];
    page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
    page.on('pageerror', (e) => errs.push(e.message));
    await page.goto('file://' + path.join(ROOT, 'index.html') + '?ts=4');
    await page.waitForSelector('.tile', { timeout: 6000 });
    await page.waitForTimeout(800);
    ok((await page.evaluate(async () => {
      const r = await Promise.all(['400', '700', '800'].map((w) => document.fonts.load(w + ' 20px Tajawal', 'بستان')));
      return r.every((a) => a.length > 0 && a[0].status === 'loaded');
    })), 'file://: الخط المحلي يُحمَّل');
    { const gg = await page.$('.guide-go'); if (gg) { await gg.click(); await page.waitForTimeout(400); } }
    await page.tap('.tile[data-game=train]');
    await page.waitForSelector('.stop-btn', { timeout: 6000 });
    await page.waitForTimeout(2500);
    ok(errs.length === 0, 'file://: لا أخطاء' + (errs.length ? ' — ' + errs[0] : ''));
    await ctx.close();
  }

  /* ───── ١٦) PWA دون إنترنت ───── */
  section('Service Worker والعمل دون إنترنت');
  {
    const vp = VIEWPORTS['جوال-عمودي'];
    const page = await newPage(browser, vp, base, { sw: true });
    await page.goto(base + 'index.html');
    await page.waitForSelector('.tile');
    const ready = await page.evaluate(async () => { const r = await navigator.serviceWorker.ready; return !!r.active; });
    ok(ready, 'تسجّل Service Worker وتفعّل');
    await page.waitForTimeout(1200);
    const names = await page.evaluate(() => caches.keys());
    ok(names.length === 1 && /^bustan-v\d/.test(names[0]), 'اسم الذاكرة مرقّم بالإصدار: ' + names.join(','));
    const cached = await page.evaluate(async () => (await (await caches.open((await caches.keys())[0])).keys()).length);
    ok(cached >= 20, 'حُفظ ' + cached + ' ملفاً في الذاكرة');
    await page.evaluate(() => { Bustan.storage.data().welcomed = true; Bustan.storage.save(); });
    await page.__ctx.setOffline(true);
    await page.reload();
    await page.waitForSelector('.tile', { timeout: 8000 });
    ok(true, 'يعمل بعد قطع الإنترنت وإعادة التحميل');
    await page.tap('.tile[data-game=train]');
    await page.waitForSelector('.stop-btn', { timeout: 6000 });
    ok(true, 'تبدأ اللعبة دون إنترنت');
    await page.__ctx.close();
  }

  await browser.close();
  srv.close();

  console.log(`\n═══ النتيجة: ${pass} نجح، ${fail} فشل ═══`);
  if (fail) { console.log('الإخفاقات:\n - ' + failures.join('\n - ')); process.exit(1); }
})().catch((e) => { console.error('انهار الاختبار:', e); process.exit(2); });
