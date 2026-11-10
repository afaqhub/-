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
async function open(page, base, query = '') {
  await page.goto(base + 'index.html' + query);
  await page.waitForSelector('.tile', { timeout: 8000 });
  await page.waitForTimeout(900);
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
      if (cs.display === 'none' || cs.visibility === 'hidden') return;
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
        if (/node_modules|\.git$|tests|tools/.test(p)) return;
        if (fs.statSync(p).isDirectory()) walk(p);
        else if (/\.(js|css|html|webmanifest)$/.test(f) && f !== 'dua-card.html') files.push(p);
      });
    })(ROOT);
    let bad = [];
    files.forEach((f) => {
      const s = fs.readFileSync(f, 'utf8');
      if (/speechSynthesis|SpeechSynthesis|new Audio\(|<audio|XMLHttpRequest|serviceWorker.*postMessage/.test(s)) bad.push(f + ' (api ممنوع)');
      if (!/sw\.js$/.test(f) && /\bfetch\(/.test(s)) bad.push(f + ' (fetch)');
      const urls = (s.match(/https?:\/\/[^\s"'`)]+/g) || []).filter((u) => !/w3\.org/.test(u));
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
      out.migrate = m.schemaVersion === 1 && m.games.train.level === 4 && !!m.games.mirror && m.settings.soloLimit === 2;
      out.migrateBad = Bustan.storage.migrate('x').schemaVersion === 1;
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
      return out;
    });
    ok(r.up, 'التكيّف: ٣ جولات سلسة ← صعود');
    ok(r.twoBreaks, 'التكيّف: جولة بخطأين تقطع السلسلة');
    ok(r.down, 'التكيّف: جولتان صعبتان متتاليتان ← هبوط');
    ok(r.noDownIfBroken, 'التكيّف: لا هبوط إن قطعتهما جولة سلسة');
    ok(r.cap5 && r.floor1, 'التكيّف: لا تجاوز للمستويين ١ و٥');
    ok(r.migrate && r.migrateBad, 'التخزين: ترحيل البيانات القديمة والتالفة');
    ok(r.importBad && r.importFuture && r.importOk, 'التخزين: رفض النسخ التالفة والأحدث، وقبول الصحيحة');
    ok(r.soundDefaultOff && r.limitDefault2, 'الافتراضات: الصوت مفعّل وحدّ «وحدي» = ٢');
    ok(r.probs.length === 0, 'بناء جولات القطار (٢٥٠٠ جولة) يطابق قواعد المستويات' + (r.probs.length ? ' — ' + r.probs.join(',') : ''));
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
    ok(info.zones === 2 && info.tiles === 5, `${name}: منطقتان و٥ ألعاب`);
    ok(info.sleeping === 4, `${name}: الألعاب غير المنجزة (٤) نائمة`);
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
    for (const name of ['جوال-عمودي', 'آيباد-أفقي', 'جوال-أفقي', 'آيباد-عمودي']) {
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

    /* ───── ١٠) إعادة العرض بالأيقونة أثناء الجلسة ───── */
    section('إعادة العرض التوضيحي بالأيقونة');
    {
      const page = await newPage(browser, VIEWPORTS['جوال-عمودي'], base);
      await open(page, base, '?ts=6');
      await page.evaluate(() => Bustan.storage.markDemoSeen('train'));
      await startTrain(page);
      await waitPlay(page);
      await page.tap('.replay-btn');
      await page.waitForFunction(() => Bustan.games.train._probe().demo === true, null, { timeout: 10000, polling: 50 });
      ok(true, 'الضغط على أيقونة اليد يعيد العرض التوضيحي');
      await seeDemoThrough(page);
      ok((await lit(page)) === 0, 'العرض لا يُضيء مصباحاً ولا يُحتسب جولة');
      const rounds = await page.evaluate(() => Bustan.storage.game('train').rounds);
      ok(rounds === 0, 'ولا يُسجَّل في التقدم');
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
