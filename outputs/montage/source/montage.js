/* مونتاج: الاستخدام اليومي لمنصة متابعة التدريس
   - كل مشهد دالة في الزمن (قابلة للتقديم والإرجاع) ولذلك يصلح للعرض وللتحويل إلى فيديو.
   - التعليق الصوتي لاحقًا: ضع ملفات audio/s01.mp3 ... وملف audio/manifest.js (انظر الدليل). */
(function () {
  'use strict';
  const $ = s => document.querySelector(s);
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const P = (t, a, b) => clamp((t - a) / (b - a));
  const eo = x => 1 - Math.pow(1 - x, 3);
  const eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const lerp = (a, b, k) => a + (b - a) * k;
  function mk(tag, cls, html, parent) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; if (parent) parent.appendChild(e); return e; }
  const ST = $('#stage');

  /* ---------------------------------------------------------------- helpers */
  function fade(e, t, a, b, dy) { const p = eo(P(t, a, b == null ? a + .7 : b)); e.style.opacity = p; e.style.transform = 'translateY(' + ((1 - p) * (dy == null ? 22 : dy)) + 'px)'; return p; }
  function words(html) {
    let out = '', bold = false;
    html.split(/(<\/?b>)/).forEach(seg => {
      if (seg === '<b>') bold = true; else if (seg === '</b>') bold = false;
      else seg.split(/(\s+)/).forEach(w => { if (!w) return; if (/^\s+$/.test(w)) out += ' '; else out += '<span class="w">' + (bold ? '<b>' + w + '</b>' : w) + '</span>'; });
    });
    return out;
  }
  function revealWords(root, t, a, gap) {
    const ws = root.querySelectorAll('.w'); gap = gap || .3;
    ws.forEach((w, i) => { const p = eo(P(t, a + i * gap, a + i * gap + .55)); w.style.opacity = p; w.style.transform = 'translateY(' + ((1 - p) * 14) + 'px)'; });
    return a + ws.length * gap + .55;
  }
  function centerOf(e) { const r = e.getBoundingClientRect(), s = ST.getBoundingClientRect(), k = s.width / 1920; return {x: (r.left + r.width / 2 - s.left) / k, y: (r.top + r.height / 2 - s.top) / k, w: r.width / k, h: r.height / k, l: (r.left - s.left) / k, t: (r.top - s.top) / k}; }

  function Cursor(root) {
    const svg = mk('div', 'cur-svg', '<svg viewBox="0 0 44 44"><path d="M6 3 L6 33 L14 26 L20 40 L27 37 L21 24 L32 24 Z" fill="#fff" stroke="#111" stroke-width="2.6" stroke-linejoin="round"/></svg>', root);
    const rips = [];
    const o = {keys: [], clicks: [], res: null,
      go(t, target, d, dx, dy) { o.keys.push({t, target, d: d == null ? 1.1 : d, dx: dx || 0, dy: dy || 0}); return o; },
      click(t) { o.clicks.push(t); const r = mk('div', 'rip', '', root); rips.push(r); return o; },
      resolve() { o.res = o.keys.map(k => { const c = k.target && k.target.nodeType ? centerOf(k.target) : k.target; return {t: k.t, d: k.d, x: c.x + k.dx, y: c.y + k.dy}; }); },
      pos(t) {
        if (!o.res) o.resolve(); const R = o.res; if (!R.length) return null;
        let p = {x: R[0].x + 260, y: R[0].y + 230};
        for (let i = 0; i < R.length; i++) { const k = R[i], s = k.t - k.d; if (t < s) break; if (t >= k.t) { p = {x: k.x, y: k.y}; continue; } const q = eio((t - s) / k.d); return {x: lerp(p.x, k.x, q), y: lerp(p.y, k.y, q)}; }
        return p;
      },
      update(t) {
        if (!o.res) o.resolve(); const R = o.res; if (!R.length) return;
        const p = o.pos(t), vis = (t >= R[0].t - R[0].d - .5 && (o.hideAfter == null || t < o.hideAfter)) ? 1 : 0;
        svg.style.opacity = vis; svg.style.transform = 'translate(' + (p.x - 6) + 'px,' + (p.y - 3) + 'px)';
        o.clicks.forEach((tc, i) => { const q = P(t, tc, tc + .75), pc = o.pos(tc); const r = rips[i]; r.style.left = pc.x + 'px'; r.style.top = pc.y + 'px'; r.style.opacity = q > 0 && q < 1 ? (1 - q) : 0; r.style.transform = 'scale(' + (.3 + q * 1.5) + ')'; });
      }};
    return o;
  }
  function callout(root, text, cls, left, top, w) { const c = mk('div', 'callout ' + cls, text, root); c.style.left = left + 'px'; c.style.top = top + 'px'; if (w) c.style.width = w + 'px'; return c; }
  function typeInto(cell, str, t, a, dur) { const n = Math.floor(P(t, a, a + dur) * str.length + 1e-6); cell.textContent = t >= a ? str.slice(0, n) : ''; return t >= a + dur; }
  const LTR = x => '\u2066' + x + '\u2069';
  function Notes(root) {
    const box = mk('div', 'callout sl', '', root); box.style.cssText = 'left:1180px;top:650px;width:620px'; const ring = mk('div', 'ring', '', root);
    const o = {list: [], add(a, b, text, target, pad) { o.list.push({a, b, text, target, pad: pad == null ? 8 : pad}); return o; },
      update(t) { let cur = null; for (const n of o.list) if (t >= n.a && t < n.b) { cur = n; break; } if (!cur) { box.style.opacity = 0; ring.style.opacity = 0; return; }
        if (box._n !== cur) { box._n = cur; box.innerHTML = typeof cur.text === 'function' ? cur.text() : cur.text; } else if (typeof cur.text === 'function') box.innerHTML = cur.text();
        const p = eo(P(t, cur.a, cur.a + .6)) * (1 - P(t, cur.b - .5, cur.b)); box.style.opacity = p; box.style.transform = 'translateX(' + ((1 - p) * -24) + 'px)';
        const c = centerOf(cur.target); ring.style.left = (c.l - cur.pad) + 'px'; ring.style.top = (c.t - cur.pad) + 'px'; ring.style.width = (c.w + 2 * cur.pad) + 'px'; ring.style.height = (c.h + 2 * cur.pad) + 'px'; ring.style.opacity = p; ring.style.transform = 'scale(' + (1 + .025 * Math.sin(t * 5)) + ')'; }};
    return o;
  }
  function showIf(e, on) { e.style.opacity = on ? 1 : 0; }

  function header(root, step) {
    const b = mk('div', 'badge', step, root); return b;
  }
  function panel(root, kicker, title, lines, top) {
    const wrap = mk('div', '', '', root);
    const k = mk('div', 'kicker', kicker, wrap); k.style.cssText = 'position:absolute;right:110px;top:' + (top || 168) + 'px;width:660px';
    const h = mk('div', 'h1', title, wrap); h.style.top = ((top || 168) + 44) + 'px';
    const ps = lines.map((ln, i) => { const p = mk('div', 'txt', words(ln), wrap); return p; });
    return {k, h, ps, wrap};
  }
  function layoutPanel(R, y0) { let y = y0; R.ps.forEach(p => { p.style.top = y + 'px'; y += p.getBoundingClientRect().height / (ST.getBoundingClientRect().width / 1920) + 26; }); }

  function windowFrame(root, title, h) {
    const w = mk('div', 'win', '<div class="bar"><i></i><i></i><i></i><span>' + title + '</span></div><div class="body"></div>', root); if (h) w.style.height = h + 'px';
    return {win: w, body: w.querySelector('.body')};
  }

  /* ---------------------------------------------------------------- data */
  const NAMES = ['Faisal Alshehri', 'Omar Alshammari', 'Khalid Alruwaili', 'Hamad Alshehri', 'Ziyad Alyami', 'Rayan Alotaibi', 'Turki Aldosari', 'Nawaf Alqahtani'];
  const IDS = ['2545001', '2545002', '2545003', '2545004', '2545005', '2545006', '2545007', '2545008'];
  const PRIOR = [[9, 9.5, 9, 10], [8, 8.5, 9, 8.5], [10, 10, 9.5, 10], [6, 7, 6.5, 6], [9, 8, 9.5, 9], [5, 6, 4.5, 6], [8.5, 9, 8, 9], [7, 6, 7.5, 6.5]];
  const NEWG = [9.5, 8, 10, 10, 9, 5.5, 'ab', null];
  const SEGS = ['الأحزاب 1<br>(1-8)', 'الأحزاب 2<br>(9-20)', 'الأحزاب 3<br>(21-27)', 'الأحزاب 4<br>(28-35)', 'الأحزاب 5<br>(36-44)'];
  const DATES = ['2026/10/18', '2026/10/20', '2026/11/01', '2026/11/08'];
  const avgOf = g => { const n = g.filter(v => typeof v === 'number'); return n.length ? Math.ceil(Math.round(n.reduce((a, b) => a + b, 0) / n.length * 10 * 1e6) / 1e6) : null; };
  const AVG0 = PRIOR.map(g => avgOf(g));
  const AVG1 = PRIOR.map((g, i) => avgOf(g.concat([NEWG[i]])));
  const meanR = a => Math.round(a.reduce((x, y) => x + y, 0) / a.length);
  const cls = v => 'c avg' + (v < 70 ? ' low' : '');

  /* ---------------------------------------------------------------- quran sheet mock */
  function quranSheet(body, o) {
    o = o || {};
    const R = {cells: []};
    const st = mk('div', 'stats', '', body);
    const sdefs = [['المقاطع المنفذة', LTR('4 / 34'), 'seg'], ['آخر مقطع', 'الأحزاب 4 (28-35)', 'last'], ['تاريخه', DATES[3], 'date'], ['بواسطة', 'سالم العتيبي', 'by'], ['معدل الفصل', meanR(AVG0), 'avg'], ['دون الحد', AVG0.filter(a => a < 70).length, 'low']];
    R.st = {};
    sdefs.forEach(d => { const s = mk('div', 'stat', '<u>' + d[0] + '</u><span>' + d[1] + '</span>', st); R.st[d[2]] = s; R.st[d[2] + 'V'] = s.querySelector('span'); });
    const g = mk('div', 'grid', '', body); R.grid = g;
    const row = (r, arr) => { R.cells[r] = arr; };
    // row 0..2 : segment / date / executor
    const labels = ['المقطع', 'التاريخ', 'المنفذ'];
    for (let r = 0; r < 3; r++) {
      const sp = mk('div', 'c', r === 0 ? '<span style="font-size:17px;color:#6c7774;line-height:1.3;white-space:normal;text-align:right">الصق الأسماء في B و C. الدرجة من 10 أو «غائب».</span>' : '', g);
      sp.style.gridColumn = 'span 3'; sp.style.background = '#f7f2e8';
      const lab = mk('div', 'c lab', labels[r], g); const arr = [sp, null, null, lab];
      for (let k = 0; k < 5; k++) {
        const c = mk('div', 'c ' + (r === 0 ? 'seg' : '') + (k === 4 ? ' cur' : ''), '', g);
        if (r === 0) c.innerHTML = SEGS[k];
        else if (k < 4) c.textContent = r === 1 ? DATES[k] : 'سالم العتيبي', c.style.fontSize = r === 1 ? '19px' : '17px';
        if (k < 4 && r > 0) c.classList.add('done');
        arr.push(c);
      }
      row(r, arr);
    }
    const hd = ['م', 'الرقم', 'الاسم', 'المعدل'], harr = [];
    hd.forEach(h => harr.push(mk('div', 'c h', h, g)));
    for (let k = 0; k < 5; k++) harr.push(mk('div', 'c h', String(k + 1), g));
    row(3, harr);
    for (let i = 0; i < 8; i++) {
      const arr = [mk('div', 'c', String(i + 1), g), mk('div', 'c id', IDS[i], g), mk('div', 'c nm', NAMES[i], g), mk('div', cls(AVG0[i]), String(AVG0[i]), g)];
      for (let k = 0; k < 5; k++) {
        const v = k < 4 ? PRIOR[i][k] : '';
        const c = mk('div', 'c g' + (k === 4 ? ' cur' : '') + (typeof v === 'number' && v < 7 ? ' lo' : ''), String(v), g); arr.push(c);
      }
      row(4 + i, arr);
    }
    R.stu = i => R.cells[4 + i];
    R.setSt = (key, txt, on) => { R.st[key + 'V'].textContent = (typeof txt === 'string' && txt.indexOf(' / ') > 0) ? LTR(txt) : txt; R.st[key].classList.toggle('hot', !!on); };
    return R;
  }

  function ddMenu(root, items) { const d = mk('div', 'dd', items.map(x => '<div>' + x + '</div>').join(''), root); return d; }
  function ddUpdate(d, cell, t, a, pick, tPick, close) {
    const vis = t >= a && t < close; const p = eo(P(t, a, a + .35));
    if (!d._pos) { const c = centerOf(cell); d._pos = {x: c.l, y: c.t + c.h + 4}; d.style.left = d._pos.x + 'px'; d.style.top = d._pos.y + 'px'; }
    d.style.opacity = vis ? p : 0;
    const it = d.children; for (let i = 0; i < it.length; i++) it[i].classList.toggle('on', t >= tPick - .6 && i === pick);
  }

  /* ---------------------------------------------------------------- scenes */
  const SC = [];
  function scene(def) { SC.push(def); }

  /* ===== 1. العنوان ===== */
  scene({id: 's01', dur: 12, narr: ['مرحبًا بكم في هذا العرض.', 'سنتعرف معًا على الاستخدام اليومي لمنصة متابعة التدريس، من فتح الفصل، إلى تسجيل الحصة، ثم رصد الدرجات، وكيف تنعكس النتائج أمامكم.'],
    build(r) {
      const R = {};
      const logo = mk('div', '', '<div style="width:150px;height:150px;border-radius:44px;background:var(--gold);position:relative;box-shadow:0 20px 60px rgba(0,0,0,.4)"><div style="position:absolute;left:38px;top:44px;width:74px;height:40px;border-left:16px solid #0b3f38;border-bottom:16px solid #0b3f38;transform:rotate(-45deg)"></div></div>', r);
      logo.style.cssText = 'position:absolute;left:885px;top:230px'; R.logo = logo;
      R.h = mk('div', '', words('منصة متابعة التدريس'), r); R.h.style.cssText = 'position:absolute;left:0;right:0;top:440px;text-align:center;font-size:118px;font-weight:800;color:#fff';
      R.s = mk('div', '', words('الاستخدام اليومي: <b>سجّل الحصة</b> · <b>ارصد الدرجات</b> · <b>شاهد النتيجة</b>'), r); R.s.style.cssText = 'position:absolute;left:0;right:0;top:672px;text-align:center;font-size:46px;color:#d9e7e3;font-weight:600';
      R.l = mk('div', '', '', r); R.l.style.cssText = 'position:absolute;left:660px;width:600px;top:626px;height:4px;background:var(--gold);transform-origin:center;border-radius:4px';
      R.f = mk('div', '', 'دليل المدرس', r); R.f.style.cssText = 'position:absolute;left:0;right:0;top:880px;text-align:center;font-size:34px;color:var(--gold);font-weight:700;letter-spacing:1px';
      return R;
    },
    update(t, R) { fade(R.logo, t, .3, 1.4, 30); revealWords(R.h, t, 1.2, .45); R.l.style.transform = 'scaleX(' + eo(P(t, 2.8, 4)) + ')'; revealWords(R.s, t, 4.4, .35); fade(R.f, t, 8, 9.4, 10); }});

  /* ===== 2. الرحلة ===== */
  scene({id: 's02', dur: 18, narr: ['الرحلة اليومية قصيرة وواضحة:', 'نفتح فصلنا، ثم نسجّل الحصة، ثم نرصد درجات الطلاب، ثم نراجع النتيجة.'],
    build(r) {
      const R = {};
      R.h = mk('div', '', words('رحلة <b>الحصة الواحدة</b>'), r); R.h.style.cssText = 'position:absolute;left:0;right:0;top:150px;text-align:center;font-size:78px;font-weight:800';
      const items = [['1', 'افتح فصلك', 'من الصفحة الأساسية'], ['2', 'سجّل الحصة', 'التاريخ والمنفذ'], ['3', 'ارصد الدرجات', 'لكل طالب في مقطع اليوم'], ['4', 'شاهد النتيجة', 'المعدل والتنبيهات']];
      R.cards = items.map((it, i) => { const c = mk('div', 'card', '<div class="num">' + it[0] + '</div><div style="font-size:50px;font-weight:800;color:var(--ink2);margin-top:22px">' + it[1] + '</div><div class="sm" style="margin-top:10px">' + it[2] + '</div>', r); c.style.left = (1440 - i * 430) + 'px'; c.style.top = '380px'; c.style.width = '380px'; c.style.height = '380px'; return c; });
      R.line = mk('div', '', '', r); R.line.style.cssText = 'position:absolute;left:150px;width:1670px;top:340px;height:6px;background:linear-gradient(270deg,var(--gold),#f0d98f);border-radius:4px;transform-origin:right;transform:scaleX(0)';
      return R;
    },
    update(t, R) { revealWords(R.h, t, .6, .4); R.line.style.transform = 'scaleX(' + eio(P(t, 3, 13)) + ')'; R.cards.forEach((c, i) => fade(c, t, 3.2 + i * 2.6, 4.2 + i * 2.6, 40)); }});

  /* ===== 3. الخطوة 1: افتح فصلك ===== */
  scene({id: 's03', dur: 26, narr: ['نبدأ من الصفحة الأساسية.', 'نضغط على اسم فصلنا، فتفتح ورقته مباشرة.', 'وفي أعلاها نجد اسم الفصل والمدرس، وآخر مقطع وصل إليه الفصل، ومعدله الحالي.'],
    build(r) {
      const R = {};
      R.badge = header(r, 'الخطوة 1 من 4');
      R.p = panel(r, 'افتح فصلك', 'من الصفحة <em>الأساسية</em>', ['اضغط <b>اسم فصلك</b>', 'فتفتح ورقته مباشرة'], 168); layoutPanel(R.p, 390);
      const W = windowFrame(r, 'الصفحة الأساسية'); R.W = W;
      // dashboard layer
      const L1 = mk('div', '', '', W.body); L1.style.cssText = 'position:absolute;inset:18px 20px'; R.L1 = L1;
      const cols = '90px 150px 200px 230px 90px 222px';
      const t = mk('div', 'tbl', '', L1); t.style.gridTemplateColumns = cols; t.style.direction = 'rtl';
      ['البلس', 'الفصل', 'المدرس', 'آخر مقطع', 'المعدل', 'تنبيهات'].forEach(h => mk('div', 'c h', h, t));
      const rows = [['P38', 'CC-25-2', 'ماجد القحطاني', 'الحجرات 2 (7-13)', '79', ''], ['P38', 'CC-25-3', 'خالد الحربي', 'الحشر 2 (8-14)', '80', '<span class="tag w">⚠ متأخر 4 حصة</span>'], ['P40', 'CC-25-4', 'فهد الدوسري', '—', '', '<span class="tag i">لم يبدأ</span>'], ['P40', 'CC-25-5', 'سالم العتيبي', 'الأحزاب 4 (28-35)', '78', '<span class="tag w">⚠ متأخر 2 حصة</span>'], ['P40', 'CC-25-6', 'يوسف الغامدي', 'الأحزاب 2 (9-20)', '83', '']];
      R.link = null;
      rows.forEach((rw, i) => rw.forEach((v, j) => { const c = mk('div', 'c', j === 1 ? '<span class="lnk">' + v + '</span>' : v, t); if (j === 1 && i === 3) R.link = c; if (j === 3 || j === 5) c.style.justifyContent = 'flex-start'; if (i === 3) c.style.background = '#fff8e0'; }));
      // sheet layer
      const L2 = mk('div', '', '', W.body); L2.style.cssText = 'position:absolute;inset:0;padding:18px 20px;background:var(--sand);opacity:0'; R.L2 = L2;
      R.Q = quranSheet(L2);
            R.cur = Cursor(r); R.cur.go(8, R.link, 1.6, -30, 6).click(8.3); R.cur.hideAfter = 12;
      R.back = mk('div', '', '◀ الصفحة الأساسية', W.win); R.back.style.cssText = 'position:absolute;left:18px;top:8px;height:36px;padding:0 18px;border-radius:18px;background:var(--gold);color:#0b3f38;font-weight:800;font-size:20px;display:flex;align-items:center;opacity:0;z-index:5';
      R.N = Notes(r).add(5.6, 10, 'اضغط اسم فصلك', R.link).add(14.5, 21, 'اسم الفصل · المدرس · آخر مقطع · معدل الفصل', L2.querySelector('.stats')).add(21.5, 25.6, 'للرجوع في أي وقت: ◀ الصفحة الأساسية', R.back);
      return R;
    },
    update(t, R) { R.badge.style.opacity = eo(P(t, .3, 1)); revealWords(R.p.ps[0], t, 1.5, .35); revealWords(R.p.ps[1], t, 4, .35); fade(R.p.k, t, .6, 1.4); fade(R.p.h, t, 1, 2, 24);
      R.L1.style.opacity = 1; R.L2.style.opacity = eo(P(t, 10.4, 11.1)); R.back.style.opacity = eo(P(t, 11.5, 12.3)); R.cur.update(t); R.N.update(t); }});

  /* ===== 4. الخطوة 2: سجّل الحصة ===== */
  scene({id: 's04', dur: 30, narr: ['الخطوة الثانية: تسجيل الحصة.', 'نكتب تاريخ اليوم تحت المقطع، ثم نختار اسم من درّس الحصة من القائمة.', 'ويقبل الملف التواريخ من الأحد إلى الخميس، وداخل فترة الفصل فقط.'],
    build(r) {
      const R = {};
      R.badge = header(r, 'الخطوة 2 من 4');
      R.p = panel(r, 'سجّل الحصة', 'التاريخ <em>والمنفذ</em>', ['اكتب <b>تاريخ اليوم</b> تحت المقطع', 'ثم اختر <b>من درّس الحصة</b> من القائمة'], 168); layoutPanel(R.p, 390);
      const W = windowFrame(r, 'ورقة الفصل — CC-25-5'); R.Q = quranSheet(W.body); R.W = W;
      for (let i = 0; i < 8; i++) R.Q.stu(i).forEach(c => c.classList.add('dim'));
      R.dateCell = R.Q.cells[1][8]; R.execCell = R.Q.cells[2][8]; R.segCell = R.Q.cells[0][8];
      R.dd = ddMenu(W.win, ['سالم العتيبي', 'ماجد القحطاني', 'خالد الحربي', 'فهد الدوسري']);
      R.dd.style.position = 'absolute';
      R.cur = Cursor(r); R.cur.go(6.5, R.dateCell, 1.4).click(6.8).go(15, R.execCell, 1.4).click(15.3);
      R.cur.go(19.4, {x: 0, y: 0}, .01);
      R.N = Notes(r).add(11.2, 15, 'التاريخ: من الأحد إلى الخميس<br>وداخل فترة الفصل', R.dateCell).add(18.8, 26.5, 'المنفذ من القائمة<br>حتى لو كنت بديلًا', R.execCell);
      R.tag = mk('div', 'tag o', '✓ تم تسجيل الحصة', r); R.tag.style.cssText = 'position:absolute;left:500px;top:158px;z-index:41;opacity:0;font-size:30px;padding:8px 26px';
      return R;
    },
    update(t, R) { R.badge.style.opacity = eo(P(t, .3, 1)); revealWords(R.p.ps[0], t, 1.4, .35); revealWords(R.p.ps[1], t, 4, .35); fade(R.p.k, t, .6, 1.4); fade(R.p.h, t, 1, 2, 24);
      // fix last key target (offscreen-ish) once resolved
      if (R.cur.res && !R.fixed) { const e = R.cur.res[2]; e.x = 640; e.y = 520; R.fixed = true; }
      R.cur.update(t);
      const typed = typeInto(R.dateCell, '2026/11/15', t, 7.1, 3.2); R.dateCell.classList.toggle('act', t > 6.8 && t < 11); R.dateCell.classList.toggle('done', typed); R.dateCell.style.fontSize = '19px';
      const pick = t >= 17.4; R.execCell.textContent = pick ? 'سالم العتيبي' : ''; R.execCell.style.fontSize = '17px'; R.execCell.classList.toggle('act', t > 15.3 && t < 17.8); R.execCell.classList.toggle('done', pick);
      ddUpdate(R.dd, R.execCell, t, 15.6, 0, 17.4, 18.2);
      R.N.update(t);
      R.tag.style.opacity = P(t, 21, 22) * (1 - P(t, 28, 29)); R.tag.style.transform = 'translateY(' + ((1 - P(t, 21, 22)) * 14) + 'px)';
      R.Q.cells[0][8].classList.toggle('done', t > 4); }});

  /* ===== 5. الخطوة 3: ارصد الدرجات ===== */
  const E5 = [5.5, 8.5, 11.5, 14.5, 17.5, 20.5, 24, 28.5];
  scene({id: 's05', dur: 38, narr: ['الخطوة الثالثة: رصد الدرجات.', 'لكل طالب درجة من عشرة، وتقبل الكسور.', 'ومع كل درجة يتحدث المعدل أمامنا مباشرة.', 'وإذا غاب الطالب نختار «غائب»، فلا تُخصم منه درجة.', 'أما من لم نرصد له شيئًا فنتركه فارغًا.'],
    build(r) {
      const R = {};
      R.badge = header(r, 'الخطوة 3 من 4');
      R.p = panel(r, 'ارصد الدرجات', 'درجة <em>من 10</em>', ['لكل طالب في <b>مقطع اليوم</b>', 'والمعدل <b>يتحدث أمامك</b>'], 168); layoutPanel(R.p, 390);
      const W = windowFrame(r, 'ورقة الفصل — CC-25-5'); R.Q = quranSheet(W.body); R.W = W;
      R.Q.cells[0][8].classList.add('done'); R.Q.cells[1][8].textContent = '2026/11/15'; R.Q.cells[1][8].style.fontSize = '19px'; R.Q.cells[1][8].classList.add('done');
      R.Q.cells[2][8].textContent = 'سالم العتيبي'; R.Q.cells[2][8].style.fontSize = '17px'; R.Q.cells[2][8].classList.add('done');
      R.tg = R.Q.stu(0).map((c, k) => c); R.cur = Cursor(r);
      R.dd = ddMenu(W.win, ['غائب']); R.dd.style.position = 'absolute';
      for (let i = 0; i < 8; i++) { R.cur.go(E5[i], R.Q.stu(i)[8], 1.2); R.cur.click(E5[i] + .1); }
      R.N = Notes(r).add(7.2, 11.6, 'الدرجة من 10<br>وتقبل الكسور (9.5)', R.Q.stu(0)[8]).add(17.6, 21.4, 'تجاوز 70: يزول اللون الأحمر', R.Q.stu(3)[3]).add(22.2, 25.6, 'أقل من 70<br>يتلوّن بالأحمر', R.Q.stu(5)[3]).add(27, 31.4, '«غائب» للتنبيه فقط<br>ولا يخصم درجة', R.Q.stu(6)[8]).add(31.8, 37.6, 'فارغ = لم يُرصد<br>ولا يدخل في المعدل', R.Q.stu(7)[8]);
      return R;
    },
    update(t, R) {
      R.badge.style.opacity = eo(P(t, .3, 1)); revealWords(R.p.ps[0], t, 1.2, .35); revealWords(R.p.ps[1], t, 3.2, .35); fade(R.p.k, t, .6, 1.4); fade(R.p.h, t, 1, 2, 24);
      R.cur.update(t);
      const avgs = [], vals = [];
      for (let i = 0; i < 8; i++) {
        const c = R.Q.stu(i)[8], a = E5[i] + .3, nv = NEWG[i];
        c.classList.toggle('act', t > E5[i] && t < a + 1.6 && nv !== null);
        let done = false;
        if (typeof nv === 'number') { done = typeInto(c, String(nv), t, a, .9); c.classList.toggle('lo', nv < 7 && done); c.classList.toggle('in', t >= a + 1.2); }
        else if (nv === 'ab') { done = t >= 26.2; c.textContent = done ? 'غائب' : ''; c.classList.toggle('ab', done); }
        else { c.textContent = t > 28.5 ? '·' : ''; c.style.color = '#bbb'; done = false; }
        const k = typeof nv === 'number' ? eio(P(t, a + 1, a + 2.2)) : 0; const av = Math.round(lerp(AVG0[i], AVG1[i], k));
        const ac = R.Q.stu(i)[3]; ac.textContent = av; ac.className = cls(av); avgs.push(av);
      }
      const nLow = avgs.filter(a => a < 70).length;
      R.Q.setSt('seg', t > 6.5 ? '5 / 34' : '4 / 34', 0); R.Q.setSt('last', t > 6.5 ? 'الأحزاب 5 (36-44)' : 'الأحزاب 4 (28-35)'); R.Q.setSt('date', t > 6.5 ? '2026/11/15' : DATES[3]);
      R.Q.setSt('avg', meanR(avgs)); R.Q.setSt('low', nLow); R.Q.st.low.classList.toggle('bad', nLow > 0 && t > 22);
      R.N.update(t);
      ddUpdate(R.dd, R.Q.stu(6)[8], t, 24.4, 0, 26.2, 26.8);
      R.Q.cells[0][8].classList.toggle('done', true);
    }});

  /* ===== 6. كيف يُحسب المعدل ===== */
  scene({id: 's06', dur: 32, narr: ['كيف يُحسب المعدل؟', 'من الدرجات المرصودة فقط.', 'طالب رُصد له مقطعان وحصل على عشرة فيهما، معدله مئة.', 'وطالب رُصدت له عشرة مقاطع، فيها درجة واحدة وتسعة أصفار، معدله عشرة، لأن الصفر درجة مرصودة.', 'أما «غائب» فمثل الفارغ، لا يؤثر.'],
    build(r) {
      const R = {};
      R.h = mk('div', '', words('كيف يُحسب <b>المعدل</b>؟'), r); R.h.style.cssText = 'position:absolute;left:0;right:0;top:130px;text-align:center;font-size:76px;font-weight:800';
      const defs = [
        {t: 'طالب أ', ch: [10, 10], sub: 'رُصد له مقطعان فقط', final: 100},
        {t: 'طالب ب', ch: [10, 0, 0, 0, 0, 0, 0, 0, 0, 0], sub: 'الصفر درجة مرصودة فتُحتسب', final: 10},
        {t: 'طالب ج', ch: [9, 'ab', 8], sub: '«غائب» مثل الفارغ: لا يخصم', final: 85}];
      R.cards = defs.map((d, i) => {
        const c = mk('div', 'card', '', r); c.style.left = (1340 - i * 520) + 'px'; c.style.top = '290px'; c.style.width = '480px'; c.style.height = '560px';
        mk('div', '', d.t, c).style.cssText = 'font-size:40px;font-weight:800;color:var(--ink2);margin-bottom:18px';
        const chips = mk('div', '', '', c); chips.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;direction:rtl;min-height:140px;align-content:flex-start';
        d.chipEls = [];
        for (let k = 0; k < 10; k++) { const v = d.ch[k]; const e = mk('div', 'chip mini ' + (v === 0 ? 'z' : v === 'ab' ? 'ab' : (v === undefined ? 'em' : '')), v === undefined ? '·' : (v === 'ab' ? 'غ' : v), chips); e.style.cssText += ';min-width:40px;height:52px;font-size:24px;padding:0 4px'; d.chipEls.push(e); }
        d.res = mk('div', 'big', '', c); d.res.style.cssText = 'font-size:120px;font-weight:800;color:var(--ink2);margin-top:26px;text-align:center';
        d.sub = mk('div', 'sm', d.sub, c); d.sub.style.cssText = 'text-align:center;font-size:30px;color:#6c7774';
        d.card = c; return d;
      });
      R.f = mk('div', '', 'المعدل = مجموع المرصود ÷ ( 10 × عدد المرصود ) × 100 &nbsp;·&nbsp; ويُقرَّب إلى الأعلى', r); R.f.style.cssText = 'position:absolute;left:0;right:0;top:900px;text-align:center;font-size:40px;font-weight:700;color:var(--gold)';
      return R;
    },
    update(t, R) { revealWords(R.h, t, .5, .4);
      R.cards.forEach((d, i) => { const t0 = 3 + i * 8.5; fade(d.card, t, t0, t0 + 1, 40);
        d.chipEls.forEach((e, k) => { const p = eo(P(t, t0 + 1.2 + k * .22, t0 + 1.7 + k * .22)); e.style.opacity = d.ch[k] === undefined ? p * .85 : p; e.style.transform = 'scale(' + (.7 + .3 * p) + ')'; });
        const q = eio(P(t, t0 + 4.2, t0 + 5.6)); d.res.textContent = Math.round(q * d.final); d.res.style.opacity = q > 0 ? 1 : 0; fade(d.sub, t, t0 + 5.8, t0 + 6.8, 12); });
      fade(R.f, t, 27.5, 28.6, 14); }});

  /* ===== 7. الخطوة 4: النتيجة تنعكس ===== */
  scene({id: 's07', dur: 30, narr: ['بعد الرصد، تنعكس النتائج فورًا.', 'في الصفحة الأساسية يتغير آخر مقطع وتاريخه، ويظهر معدل الفصل، وعدد من هم دون السبعين.', 'فيعرف المدرس من يحتاج إلى متابعة.'],
    build(r) {
      const R = {};
      R.badge = header(r, 'الخطوة 4 من 4');
      R.p = panel(r, 'شاهد النتيجة', 'تنعكس <em>فورًا</em>', ['في الصفحة الأساسية', 'ويعرف المدرس <b>من يحتاج متابعة</b>'], 168); layoutPanel(R.p, 390);
      const W = windowFrame(r, 'ورقة الفصل  ←  الصفحة الأساسية'); R.W = W;
      const a = mk('div', '', 'ورقة الفصل: الملخص', W.body); a.style.cssText = 'font-size:26px;font-weight:700;color:var(--pri);margin-bottom:8px';
      const st = mk('div', 'stats', '', W.body); R.st = {};
      [['المقاطع المنفذة', 'seg'], ['آخر مقطع', 'last'], ['تاريخه', 'date'], ['بواسطة', 'by'], ['معدل الفصل', 'avg'], ['دون الحد', 'low']].forEach(d => { const s = mk('div', 'stat', '<u>' + d[0] + '</u><span></span>', st); R.st[d[1]] = s; });
      const b = mk('div', '', 'الصفحة الأساسية', W.body); b.style.cssText = 'font-size:26px;font-weight:700;color:var(--pri);margin:34px 0 8px';
      const cols = '90px 150px 200px 230px 90px 222px';
      const t = mk('div', 'tbl', '', W.body); t.style.gridTemplateColumns = cols; t.style.direction = 'rtl';
      ['البلس', 'الفصل', 'المدرس', 'آخر مقطع', 'المعدل', 'تنبيهات'].forEach(h => mk('div', 'c h', h, t));
      R.row = [mk('div', 'c', 'P40', t), mk('div', 'c', '<span class="lnk">CC-25-5</span>', t), mk('div', 'c', 'سالم العتيبي', t), mk('div', 'c', '', t), mk('div', 'c avg', '', t), mk('div', 'c', '', t)];
      R.row.forEach(c => c.style.height = '78px'); R.row[3].style.justifyContent = 'flex-start'; R.row[5].style.justifyContent = 'flex-start';
      const tag = mk('div', 'tag a', 'قبل رصد الحصة', W.body); tag.style.cssText = 'position:absolute;left:30px;top:12px;font-size:26px;padding:4px 22px'; R.when = tag;
      R.N = Notes(r).add(15, 29, () => { const n = AVG1.filter(x => x < 70).length; return (n === 2 ? 'طالبان' : n + ' طلاب') + ' دون 70<br>يحتاجان متابعة'; }, R.st.low);
      const fh = mk('div', '', 'يحتاجون متابعة', W.body); fh.style.cssText = 'font-size:26px;font-weight:700;color:var(--warn);margin:34px 0 8px;opacity:0'; R.fh = fh;
      R.fl = AVG1.map((a, i) => ({a, i})).filter(x => x.a < 70).map(x => { const e = mk('div', '', '<span dir="ltr" style="flex:1;text-align:left">' + NAMES[x.i] + '</span><b style="font-size:34px;color:var(--warn)">' + x.a + '</b>', W.body); e.style.cssText = 'display:flex;gap:20px;align-items:center;background:#fff;border:2px solid var(--warn-l);border-radius:14px;padding:10px 24px;font-size:26px;margin:8px 0;opacity:0'; return e; });
      R.arrow = mk('div', '', '▼', W.body); R.arrow.style.cssText = 'position:absolute;left:520px;top:310px;font-size:44px;color:var(--gold)';
      return R;
    },
    update(t, R) { R.badge.style.opacity = eo(P(t, .3, 1)); revealWords(R.p.ps[0], t, 1.2, .35); revealWords(R.p.ps[1], t, 3.2, .35); fade(R.p.k, t, .6, 1.4); fade(R.p.h, t, 1, 2, 24);
      const after = t >= 8; const k = eio(P(t, 8, 11));
      const a0 = meanR(AVG0), a1 = meanR(AVG1), l0 = AVG0.filter(x => x < 70).length, l1 = AVG1.filter(x => x < 70).length;
      const set = (key, txt, hot) => { const s = R.st[key]; s.querySelector('span').textContent = txt; s.classList.toggle('hot', !!hot); };
      const flash = (a, b) => t >= a && t < b;
      set('seg', after ? LTR('5 / 34') : LTR('4 / 34'), flash(8, 10)); set('last', after ? 'الأحزاب 5 (36-44)' : 'الأحزاب 4 (28-35)', flash(8.4, 10.4)); set('date', after ? '2026/11/15' : DATES[3], flash(8.8, 10.8)); set('by', 'سالم العتيبي', false);
      set('avg', after ? a1 : a0, flash(9.2, 11.2)); set('low', after ? l1 : l0, flash(9.6, 11.6)); R.st.low.classList.toggle('bad', after && t > 14);
      const d = t >= 12.5;
      R.row[3].textContent = d ? 'الأحزاب 5 (36-44)' : 'الأحزاب 4 (28-35)'; R.row[3].style.fontSize = '22px';
      R.row[4].textContent = d ? a1 : a0; R.row[4].style.background = d ? '#d9eee1' : ''; R.row[4].className = 'c avg' + ((d ? a1 : a0) < 70 ? ' low' : '');
      R.row[5].innerHTML = d ? '<span class="tag a" style="font-size:20px">' + l1 + ' دون الحد</span>' : '<span class="tag w">⚠ متأخر 2 حصة</span>'; R.row[5].style.fontSize = '20px';
      R.when.textContent = d ? 'بعد رصد الحصة' : 'قبل رصد الحصة'; R.when.className = 'tag ' + (d ? 'o' : 'a');
      fade(R.fh, t, 17.5, 18.3, 10); R.fl.forEach((e, k) => fade(e, t, 18.4 + k * .8, 19.2 + k * .8, 12)); R.N.update(t); R.arrow.style.opacity = P(t, 11.4, 12.4) * (1 - P(t, 14, 15)); }});

  /* ===== 8. المدرس البديل ===== */
  scene({id: 's08', dur: 22, narr: ['وإذا غاب المدرس وحلّ مكانه زميل،', 'يسجّل الحصة باسمه في خانة المنفذ.', 'فيرى المدرس الأصلي عند عودته أين وصل الفصل بالضبط، ومن درّس آخر حصة.'],
    build(r) {
      const R = {};
      R.h = mk('div', '', words('وإذا <b>غاب المدرس</b>؟'), r); R.h.style.cssText = 'position:absolute;left:0;right:0;top:140px;text-align:center;font-size:76px;font-weight:800';
      const days = [
        ['الأحد', 'سالم العتيبي', 'الأحزاب 4', '', 'ok'],
        ['الاثنين', 'غاب المدرس الأصلي', 'خالد الحربي (بديل)', 'الأحزاب 5', 'sub'],
        ['الثلاثاء', 'عاد سالم العتيبي', 'يرى: آخر حصة بديل، والفصل وصل إلى الأحزاب 5', '', 'back']];
      R.cards = days.map((d, i) => {
        const c = mk('div', 'card', '', r); c.style.left = (1260 - i * 560) + 'px'; c.style.top = '330px'; c.style.width = '520px'; c.style.height = '470px';
        mk('div', 'kicker', d[0], c).style.color = 'var(--pri)';
        const av = mk('div', '', '', c); av.style.cssText = 'width:90px;height:90px;border-radius:50%;display:grid;place-items:center;font-size:42px;font-weight:800;margin:14px 0 18px;color:#fff;background:' + (d[4] === 'sub' ? 'var(--amber)' : 'var(--pri)'); av.textContent = d[4] === 'sub' ? 'خ' : 'س';
        mk('div', '', d[1], c).style.cssText = 'font-size:34px;font-weight:700;color:var(--ink2);line-height:1.4';
        const m = mk('div', 'sm', d[2], c); m.style.cssText = 'font-size:30px;margin-top:12px;line-height:1.5;color:#44504d';
        if (d[3]) { const x = mk('div', 'sm', 'سجّل حصة: ' + d[3], c); x.style.cssText = 'font-size:28px;margin-top:10px;color:#44504d'; }
        if (d[4] === 'sub') { const tg = mk('div', 'tag a', 'المنفذ: بديل', c); tg.style.cssText += ';margin-top:16px;font-size:26px'; }
        if (d[4] === 'back') { const tg = mk('div', 'tag i', 'يعرف أين وصل الفصل', c); tg.style.cssText += ';margin-top:16px;font-size:26px'; }
        return c;
      });
      R.arr = [0, 1].map(i => { const a = mk('div', '', '◀', r); a.style.cssText = 'position:absolute;top:530px;font-size:60px;color:var(--gold);left:' + (1200 - i * 560 + 0) + 'px'; return a; });
      return R;
    },
    update(t, R) { revealWords(R.h, t, .5, .4); R.cards.forEach((c, i) => fade(c, t, 3 + i * 5, 4 + i * 5, 40)); R.arr.forEach((a, i) => { a.style.opacity = P(t, 4.8 + i * 5, 5.6 + i * 5); }); }});

  /* ===== 9. العقيدة والفقه ===== */
  const LROWS = [['الإيمان بالملائكة', '23-27', '2026/10/08', 'سالم العتيبي'], ['الإيمان بالكتب والقرآن الكريم', '28-33', '2026/10/12', 'سالم العتيبي'], ['الإيمان بالرسل', '34-37', '2026/10/14', 'سالم العتيبي'], ['الرسالة المحمدية', '38-46', '', ''], ['الإيمان باليوم الآخر', '47-52', '2026/10/28', 'سالم العتيبي'], ['ما يتضمنه الإيمان باليوم الآخر', '52-56', '', '']];
  scene({id: 's09', dur: 34, narr: ['وفي فصول العقيدة والفقه نسجّل كل درس بتاريخه ومنفذه.', 'فيتلوّن الصف بالأخضر، ويتقدم شريط التقدم.', 'وإذا تُخطّي درس يتلوّن بالبرتقالي حتى لا يُنسى.', 'وبالضغط على رقم الصفحة يفتح ملف الدرس.'],
    build(r) {
      const R = {};
      R.badge = header(r, 'فصول العقيدة والفقه');
      R.p = panel(r, 'كل درس', 'تاريخ <em>ومنفذ</em>', ['فيتلوّن الصف <b>بالأخضر</b>', 'والدرس المتخطّى <b>بالبرتقالي</b>'], 168); layoutPanel(R.p, 390);
      const W = windowFrame(r, 'ورقة الفصل — SMS 163', 690); R.W = W;
      const top = mk('div', '', '', W.body); top.style.cssText = 'display:flex;align-items:center;gap:20px;margin-bottom:14px';
      R.pt = mk('div', '', '', top); R.pt.style.cssText = 'font-size:30px;font-weight:700;color:var(--ink2);white-space:nowrap;min-width:230px'; const pb = mk('div', 'pbar', '<i></i>', top); pb.style.flex = '1'; R.pb = pb.querySelector('i');
      const g = mk('div', 'tbl lrow', '', W.body); g.style.gridTemplateColumns = '400px 120px 170px 200px 92px'; g.style.direction = 'rtl';
      ['الموضوع', 'الصفحة', 'التاريخ', 'المنفذ', 'الحالة'].forEach(h => mk('div', 'c h', h, g));
      R.cells = LROWS.map((rw, i) => rw.concat([i < 5 && i !== 3 ? '✓' : '']).map((v, j) => { const c = mk('div', 'c' + (j === 0 ? ' t' : ''), j === 1 ? '<span class="lnk">' + v + '</span>' : v, g); if (i < 5 && i !== 3) { c.classList.add('done'); } if (j === 2 || j === 3) c.style.fontSize = '20px'; if (j === 4) c.style.color = '#2e7d4f'; return c; }));
      R.dd = ddMenu(W.win, ['سالم العتيبي', 'ماجد القحطاني', 'خالد الحربي']); R.dd.style.position = 'absolute';
      R.pdf = mk('div', '', '', W.win); R.pdf.style.cssText = 'position:absolute;left:30px;top:150px;width:500px;height:600px;background:#fff;border-radius:16px;box-shadow:0 24px 60px rgba(0,0,0,.45);border:2px solid var(--line);padding:26px;opacity:0;z-index:30';
      R.pdf.innerHTML = '<div style="font-size:22px;color:#6c7774;margin-bottom:10px">PDF_Lessons \\ 52-56.pdf</div><div style="font-size:34px;font-weight:800;color:var(--ink2);margin-bottom:18px">ما يتضمنه الإيمان باليوم الآخر</div>' + [90, 100, 96, 70, 100, 88, 60, 100, 92, 74].map(w => '<div style="height:14px;border-radius:7px;background:#e8e2d3;width:' + w + '%;margin:14px 0"></div>').join('');
      R.cur = Cursor(r);
      R.cur.go(5, R.cells[5][2], 1.4).click(5.3).go(11.5, R.cells[5][3], 1.2).click(11.8).go(24.4, R.cells[5][1], 1.4, 0, 0).click(24.7); R.cur.hideAfter = 33;
      R.N = Notes(r).add(15.4, 19, 'تلوّن الصف بالأخضر<br>وتقدّم الشريط', R.cells[5][0]).add(19.4, 23.4, 'درس تُخطّي<br>فتلوّن بالبرتقالي', R.cells[3][0]).add(24, 31, 'اضغط رقم الصفحة<br>يفتح ملف الدرس', R.cells[5][1]);
      return R;
    },
    update(t, R) { R.badge.style.opacity = eo(P(t, .3, 1)); revealWords(R.p.ps[0], t, 1.2, .35); revealWords(R.p.ps[1], t, 3.2, .35); fade(R.p.k, t, .6, 1.4); fade(R.p.h, t, 1, 2, 24);
      const row = 5, typed = typeInto(R.cells[row][2], '2026/11/15', t, 5.8, 2.6); R.cells[row][2].classList.toggle('act', t > 5.3 && t < 9);
      const picked = t >= 13.4; R.cells[row][3].textContent = picked ? 'سالم العتيبي' : ''; R.cells[row][3].classList.toggle('act', t > 11.8 && t < 13.8);
      ddUpdate(R.dd, R.cells[row][3], t, 12, 0, 13.4, 14.2);
      const done = t >= 14.4; [0, 1, 2, 3, 4].forEach(j => R.cells[row][j].classList.toggle('done', done)); R.cells[row][4].textContent = done ? '✓' : ''; R.cells[row][4].style.color = '#2e7d4f';
      const n = done ? 7 : 6, p = done ? 7 / 47 : 6 / 47; R.pt.innerHTML = 'التقدم: ' + LTR(Math.round(lerp(6, 7, eio(P(t, 14.4, 15.4)))) + ' / 47'); R.pb.style.width = (lerp(6 / 47, 7 / 47, eio(P(t, 14.4, 15.4))) * 100) + '%';
      for (let j = 0; j < 5; j++) R.cells[3][j].style.background = t > 19 ? '#fdd9b5' : ''; R.cells[3][4].textContent = t > 19 ? '⚠' : ''; R.cells[3][4].style.color = '#b5472b';
      R.N.update(t);
      R.pdf.style.opacity = eo(P(t, 25.2, 26.2)) * (1 - P(t, 32.6, 33.6)); R.pdf.style.transform = 'translateX(' + ((1 - eo(P(t, 25.2, 26.2))) * -60) + 'px)';
      R.cur.update(t); }});

  /* ===== 10. الاختبار ===== */
  scene({id: 's10', dur: 34, narr: ['وماذا عن الاختبار؟', 'في القرآن، التقييم يكون داخل الفصل بالتسميع، والدرجات التي رصدناها هي التقييم نفسه، ومعدلها من مئة.', 'أما العقيدة والفقه، فيختبر الطلاب على الكمبيوتر في قسم الاختبارات.', 'ودور المدرس تسليم أوراق المراجعة قبل الاختبار وتسجيلها، وتذكّره الصفحة الأساسية قبل الموعد بأسبوع.'],
    build(r) {
      const R = {};
      R.h = mk('div', '', words('وكيف <b>يُختبر</b> الطلاب؟'), r); R.h.style.cssText = 'position:absolute;left:0;right:0;top:130px;text-align:center;font-size:76px;font-weight:800';
      const col = (x, color, title, steps) => {
        const c = mk('div', 'card', '', r); c.style.left = x + 'px'; c.style.top = '320px'; c.style.width = '800px'; c.style.height = '520px';
        const hd = mk('div', '', title, c); hd.style.cssText = 'font-size:48px;font-weight:800;color:#fff;background:' + color + ';margin:-28px -34px 22px;padding:20px 34px;border-radius:26px 26px 0 0';
        const items = steps.map((s, i) => { const d = mk('div', '', '<div class="num" style="width:60px;height:60px;font-size:34px;flex:none">' + (i + 1) + '</div><div style="font-size:33px;line-height:1.5;color:#2a3532">' + s + '</div>', c); d.style.cssText = 'display:flex;gap:20px;align-items:center;margin:20px 0;opacity:0'; return d; });
        return {c, items};
      };
      R.A = col(1020, 'var(--gold)', 'القرآن الكريم', ['التقييم <b>داخل الفصل</b> بالتسميع', 'الدرجات التي ترصدها هي <b>التقييم نفسه</b>', 'المعدل النهائي <b>من 100</b> لكل طالب']);
      R.B = col(120, 'var(--pri)', 'العقيدة والفقه', ['الاختبار <b>على الكمبيوتر</b> في قسم الاختبارات', 'دورك: <b>تسليم أوراق المراجعة</b> قبل الاختبار', 'سجّلها بـ «نعم» في صف المراجعة', 'وتذكّرك الصفحة الأساسية <b>قبل الموعد بأسبوع</b>']);
      return R;
    },
    update(t, R) { revealWords(R.h, t, .5, .4); fade(R.A.c, t, 3, 4, 40); fade(R.B.c, t, 12, 13, 40);
      R.A.items.forEach((e, i) => fade(e, t, 4.6 + i * 2.4, 5.4 + i * 2.4, 20)); R.B.items.forEach((e, i) => fade(e, t, 13.6 + i * 3, 14.4 + i * 3, 20)); }});

  /* ===== 11. عادات ===== */
  scene({id: 's11', dur: 28, narr: ['وللتلخيص، خمس عادات بسيطة:', 'سجّل الحصة في يومها.', 'واختر المنفذ دائمًا.', 'الفارغ يعني لم يُرصد، والصفر يعني رُصد.', '«غائب» تنبيه لك ولا يخصم.', 'وراجع الصفحة الأساسية: الأحمر والبرتقالي يحتاجان انتباهك.'],
    build(r) {
      const R = {};
      R.h = mk('div', '', words('خمس <b>عادات</b> بسيطة'), r); R.h.style.cssText = 'position:absolute;left:0;right:0;top:110px;text-align:center;font-size:76px;font-weight:800';
      const rules = ['سجّل الحصة <b>في يومها</b>', 'اختر <b>«المنفذ»</b> دائمًا', 'الفارغ = <b>لم يُرصد</b> · الصفر = <b>رُصد</b>', '«غائب» تنبيه لك <b>ولا يخصم</b>', 'راجع الصفحة الأساسية: <b>الأحمر والبرتقالي</b> يحتاجان انتباهك'];
      R.rows = rules.map((s, i) => { const d = mk('div', 'card', '<div class="num" style="width:70px;height:70px;font-size:40px;flex:none">' + (i + 1) + '</div><div style="font-size:42px;font-weight:700;color:var(--ink2);line-height:1.4">' + s.replace(/<b>/g, '<b style="color:#a2781f">') + '</div>', r); d.style.cssText += ';display:flex;gap:28px;align-items:center;left:340px;width:1240px;height:120px;padding:0 34px;top:' + (280 + i * 140) + 'px;border-radius:22px'; return d; });
      return R;
    },
    update(t, R) { revealWords(R.h, t, .5, .4); R.rows.forEach((d, i) => fade(d, t, 3.5 + i * 4, 4.5 + i * 4, 30)); }});

  /* ===== 12. الختام ===== */
  scene({id: 's12', dur: 12, narr: ['ابدأ بفصلك اليوم.', 'وتذكّر أن كل درجة ترصدها تظهر لك نتيجتها مباشرة.'],
    build(r) {
      const R = {};
      R.h = mk('div', '', words('ابدأ <b>بفصلك</b> اليوم'), r); R.h.style.cssText = 'position:absolute;left:0;right:0;top:360px;text-align:center;font-size:120px;font-weight:800';
      R.s = mk('div', '', words('وكل درجة ترصدها تظهر لك <b>نتيجتها مباشرة</b>'), r); R.s.style.cssText = 'position:absolute;left:0;right:0;top:610px;text-align:center;font-size:50px;color:#d9e7e3;font-weight:600';
      R.l = mk('div', '', '', r); R.l.style.cssText = 'position:absolute;left:660px;width:600px;top:566px;height:4px;background:var(--gold);border-radius:4px;transform-origin:center';
      return R;
    },
    update(t, R) { revealWords(R.h, t, .6, .5); R.l.style.transform = 'scaleX(' + eo(P(t, 2.4, 3.6)) + ')'; revealWords(R.s, t, 4, .35); }});

  /* ---------------------------------------------------------------- engine */
  const secs = [];
  const brand = mk('div', 'brand', '<i></i>منصة متابعة التدريس <small>· دليل المدرس</small>', ST);
  SC.forEach((sc, i) => { sc.base = sc.dur; sc.k = 1; sc.el = mk('section', 'scene', '', ST); sc.R = sc.build(sc.el); });
  const prog = mk('div', '', '<i></i>', ST); prog.id = 'progress';
  const dots = mk('div', '', '', ST); dots.id = 'dots'; SC.forEach(() => mk('b', '', '', dots));
  const cap = mk('div', '', '', ST); cap.id = 'cap';
  let capOn = false, starts = [], TOTAL = 0;
  function recompute() { let s = 0; starts = SC.map(sc => { const a = s; s += sc.dur; return a; }); TOTAL = s; }
  recompute();

  const audio = {};   // اختياري: انظر الدليل
  function applyManifest() {
    const M = window.MONTAGE_AUDIO; if (!M) return;
    SC.forEach(sc => { const m = M[sc.id]; if (!m) return; sc.audioSrc = m.src; if (m.duration) { sc.dur = Math.max(sc.base, m.duration + 1.6); sc.k = sc.dur / sc.base; } });
    recompute();
  }
  applyManifest();

  let T = 0, playing = false, speed = 1, last = 0;
  function sceneAt(T) { let i = 0; for (; i < SC.length - 1; i++) if (T < starts[i + 1]) break; return i; }
  function render(Tn) {
    T = clamp(Tn, 0, TOTAL - .001); const idx = sceneAt(T), sc = SC[idx], tl = T - starts[idx];
    SC.forEach((s, i) => { if (i !== idx) s.el.style.opacity = 0; });
    const fi = P(tl, 0, .8), fo = 1 - P(tl, sc.dur - .8, sc.dur); sc.el.style.opacity = Math.min(fi, fo);
    sc.update(tl / sc.k, sc.R);
    prog.firstChild.style.width = (T / TOTAL * 100) + '%';
    [...dots.children].forEach((d, i) => d.classList.toggle('on', i === idx));
    const n = sc.narr, per = sc.dur / n.length, ci = Math.min(n.length - 1, Math.floor(tl / per)); cap.textContent = n[ci]; cap.classList.toggle('show', capOn && tl > .6 && tl < sc.dur - .4);
    window.__idx = idx;
  }
  function stageFit() { const k = Math.min(innerWidth / 1920, innerHeight / 1080); ST.style.transform = 'scale(' + k + ')'; }
  addEventListener('resize', () => { stageFit(); render(T); }); stageFit();

  function tick(now) { if (playing) { const dt = Math.min(.1, (now - last) / 1000); last = now; T += dt * speed; if (T >= TOTAL) { T = TOTAL - .002; playing = false; setPlayLabel(); } render(T); playAudioSync(); } else last = now; requestAnimationFrame(tick); }
  function playAudioSync() {
    const M = window.MONTAGE_AUDIO; if (!M) return; const idx = sceneAt(T), sc = SC[idx]; if (!sc.audioSrc) return;
    let a = audio[sc.id]; if (!a) { a = audio[sc.id] = new Audio('audio/' + sc.audioSrc); a.onerror = () => { sc.audioSrc = null; }; }
    if (a._played !== true && T - starts[idx] > .8) { a._played = true; a.playbackRate = speed; a.play().catch(() => {}); }
  }
  function stopAudio() { Object.values(audio).forEach(a => { a.pause(); a._played = false; }); }
  function setPlayLabel() { const b = $('#bPlay'); if (b) b.textContent = playing ? '⏸ إيقاف' : '▶ تشغيل'; }
  function play() { if (T >= TOTAL - .05) { T = 0; stopAudio(); } playing = true; $('#start').style.display = 'none'; setPlayLabel(); }
  function pause() { playing = false; Object.values(audio).forEach(a => a.pause()); setPlayLabel(); }
  function jump(i) { i = clamp(i, 0, SC.length - 1); stopAudio(); render(starts[i] + .01); T = starts[i] + .01; }

  /* controls */
  const ctl = mk('div', '', '<button id="bPrev">⏮ السابق</button><button id="bPlay">▶ تشغيل</button><button id="bNext">التالي ⏭</button><input id="scr" type="range" min="0" max="1000" value="0"><button id="bSp">السرعة 1×</button><button id="bCap">الترجمة</button><button id="bFs">ملء الشاشة</button>', document.body); ctl.id = 'ctl';
  $('#bPlay').onclick = () => playing ? pause() : play();
  $('#bPrev').onclick = () => jump(__idx - ((T - starts[__idx]) > 3 ? 0 : 1)); $('#bNext').onclick = () => jump(__idx + 1);
  $('#bSp').onclick = () => { speed = speed === 1 ? .75 : speed === .75 ? 1.5 : 1; $('#bSp').textContent = 'السرعة ' + speed + '×'; };
  $('#bCap').onclick = () => { capOn = !capOn; render(T); };
  $('#bFs').onclick = () => { if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {}); else document.exitFullscreen(); };
  const scr = $('#scr'); scr.oninput = () => { stopAudio(); T = scr.value / 1000 * TOTAL; render(T); }; setInterval(() => { if (!document.activeElement || document.activeElement !== scr) scr.value = T / TOTAL * 1000; }, 250);
  const startEl = mk('div', '', '<div>▶ ابدأ العرض</div>', ST); startEl.id = 'start'; startEl.onclick = () => play();
  addEventListener('keydown', e => { if (e.code === 'Space') { e.preventDefault(); playing ? pause() : play(); } else if (e.key === 'ArrowLeft') jump(__idx + 1); else if (e.key === 'ArrowRight') jump(__idx - 1); else if (e.key === 'f' || e.key === 'F') $('#bFs').click(); else if (e.key === 'c' || e.key === 'C') $('#bCap').click(); else if (e.key === 'Home') { T = 0; stopAudio(); render(0); } });
  let hideT; addEventListener('mousemove', () => { ctl.classList.add('show'); document.body.classList.remove('hidecur'); clearTimeout(hideT); hideT = setTimeout(() => { ctl.classList.remove('show'); if (playing) document.body.classList.add('hidecur'); }, 2600); });
  if (/render/.test(location.search)) document.body.classList.add('render');

  window.__seek = t => { render(t); }; window.__total = () => TOTAL; window.__scenes = () => SC.map((s, i) => ({id: s.id, start: starts[i], dur: s.dur, narr: s.narr}));
  render(0); requestAnimationFrame(tick);
})();
