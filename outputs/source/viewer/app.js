/* عارض خطة التدريس (قراءة فقط): يقرأ ملف Excel في المتصفح، بلا إنترنت وبلا أي صلاحيات. */
(function () {
  'use strict';
  const N = {DB: 'بيانات_الفصول', CAT: 'فهرس الدروس', SUR: 'قائمة السور', SET: 'الإعدادات'};
  const TY_Q = 'قرآن', ST_ACT = 'نشط', ABS = 'غائب';
  const DAYS = {'الأحد': 0, 'الاثنين': 1, 'الثلاثاء': 2, 'الأربعاء': 3, 'الخميس': 4};
  const L0 = 8, L1 = 67, Q0 = 5, Q1 = 44, S0 = 11, S1 = 70;

  const $ = (s, e) => (e || document).querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  const isNum = v => typeof v === 'number' && isFinite(v);
  const str = v => (v == null ? '' : String(v).trim());
  const nowD = new Date();
  const TODAY = Math.floor(Date.UTC(nowD.getFullYear(), nowD.getMonth(), nowD.getDate()) / 864e5) + 25569;
  const ltr = t => '<bdi dir="ltr">' + t + '</bdi>';
  const dObj = s => new Date((s - 25569) * 864e5);
  const fmtD = s => { if (!isNum(s)) return ''; const d = dObj(s); return d.getUTCFullYear() + '/' + String(d.getUTCMonth() + 1).padStart(2, '0') + '/' + String(d.getUTCDate()).padStart(2, '0'); };
  const wday = s => dObj(s).getUTCDay();
  const dateOf = v => (isNum(v) && v > 20000 ? Math.floor(v) : null);

  let wb = null, M = null, fileInfo = null, view = {tab: 'over'};

  /* ------------------------------------------------------------ reading */
  const cellv = (ws, r, c) => { const x = ws[XLSX.utils.encode_cell({r: r - 1, c: c - 1})]; return x ? x.v : undefined; };

  function readModel(book) {
    const S = n => book.Sheets[n];
    if (!S(N.DB)) throw new Error('لم أجد ورقة «' + N.DB + '» في هذا الملف. تأكد أنه ملف خطة التدريس.');
    const set = S(N.SET) || {};
    const cfg = {
      week1: dateOf(cellv(set, 3, 3)),
      pass: isNum(cellv(set, 6, 3)) ? cellv(set, 6, 3) : 70,
      behind: isNum(cellv(set, 7, 3)) ? cellv(set, 7, 3) : 2,
      stale: isNum(cellv(set, 8, 3)) ? cellv(set, 8, 3) : 14,
      review: isNum(cellv(set, 9, 3)) ? cellv(set, 9, 3) : 7,
    };
    // catalog
    const cat = [], cs = S(N.CAT);
    if (cs) for (let r = 2; r <= 61; r++) cat.push({book: str(cellv(cs, r, 1)), week: cellv(cs, r, 2), ses: str(cellv(cs, r, 3)), topic: str(cellv(cs, r, 4)), pages: str(cellv(cs, r, 5))});
    // surah segments (default labels)
    const segs = [], ss = S(N.SUR);
    if (ss) for (let r = 2; r <= 500; r++) { const n = str(cellv(ss, r, 2)); if (n) segs.push(n + ' ' + str(cellv(ss, r, 3)) + ' (' + str(cellv(ss, r, 4)) + '-' + str(cellv(ss, r, 5)) + ')'); }

    // class table
    const db = S(N.DB), rows = [];
    for (let r = 2; r <= 301; r++) {
      const name = str(cellv(db, r, 1)); if (!name) continue;
      const c = {name, row: r, type: str(cellv(db, r, 2)) || 'مناهج', teacher: str(cellv(db, r, 3)), course: cellv(db, r, 4), part: str(cellv(db, r, 5)),
        startIn: dateOf(cellv(db, r, 6)), endIn: dateOf(cellv(db, r, 7)), wFrom: cellv(db, r, 8), wTo: cellv(db, r, 9),
        days: [10, 11, 12].map(k => str(cellv(db, r, k))).filter(Boolean), examA: dateOf(cellv(db, r, 13)), examF: dateOf(cellv(db, r, 14)),
        studentsIn: cellv(db, r, 15), next: str(cellv(db, r, 16)), trans: dateOf(cellv(db, r, 17)), status: str(cellv(db, r, 18)), prevIn: str(cellv(db, r, 26))};
      c.isQ = c.type === TY_Q; c.active = !c.status || c.status === ST_ACT;
      c.start = c.startIn != null ? c.startIn : (isNum(c.wFrom) && cfg.week1 != null ? cfg.week1 + (c.wFrom - 1) * 7 : null);
      c.end = c.endIn != null ? c.endIn : (isNum(c.wTo) && cfg.week1 != null ? cfg.week1 + (c.wTo - 1) * 7 + 4 : null);
      c.ws = S(name) || null; c.hasSheet = !!c.ws;
      rows.push(c);
    }
    const byName = new Map(rows.map(c => [c.name, c]));
    rows.forEach(c => {
      const q = rows.find(x => x.isQ && x.next === c.name && x.name !== c.name);
      c.prevName = c.prevIn || (q ? q.name : '');
    });
    // per-class analysis
    rows.forEach(c => { c.alerts = []; c.issues = []; analyse(c, cfg, cat, segs); });
    // duplicate academic numbers across Quran classes
    const ids = new Map();
    rows.filter(c => c.isQ && c.students).forEach(c => c.students.forEach(s => { if (!s.id) return; (ids.get(s.id) || ids.set(s.id, []).get(s.id)).push(c.name); }));
    ids.forEach((list, id) => { if (list.length > 1) list.forEach(n => byName.get(n).issues.push('الرقم الأكاديمي ' + id + ' مكرر في: ' + list.filter(x => x !== n).join('، '))); });
    const names = new Map();
    rows.forEach(c => names.set(c.name, (names.get(c.name) || 0) + 1));
    rows.forEach(c => { if (names.get(c.name) > 1) c.issues.push('رقم الفصل مكرر في بيانات_الفصول'); });
    return {cfg, rows, byName, cat, segs};
  }

  function expectedSessions(c) {
    if (c.start == null) return null;
    let set = c.days.map(d => DAYS[d]).filter(x => x != null);
    if (!set.length) return null;
    const to = Math.min(TODAY, c.end != null ? c.end : TODAY);
    let n = 0; for (let d = c.start; d <= to; d++) if (set.indexOf(wday(d)) >= 0) n++;
    return n;
  }
  function weekText(c) {
    if (c.start == null || c.end == null) return '';
    if (TODAY < c.start) return 'لم يبدأ';
    if (TODAY > c.end) return 'انتهت المدة';
    return (Math.floor((TODAY - c.start) / 7) + 1) + ' / ' + Math.ceil((c.end - c.start + 1) / 7);
  }

  function analyse(c, cfg, cat, segs) {
    c.week = weekText(c); c.expected = expectedSessions(c);
    c.done = 0; c.total = 0; c.lastDate = null; c.lastLabel = ''; c.lastExec = ''; c.skipped = 0; c.sub = false;
    if (!c.hasSheet) { c.items = []; return; }
    const ws = c.ws;
    if (c.isQ) {
      const cols = [];
      for (let k = Q0; k <= Q1; k++) {
        let lab = str(cellv(ws, 7, k)); if (!lab) lab = segs[k - Q0] || '';
        if (lab) cols.push({k, no: k - Q0 + 1, label: lab, date: dateOf(cellv(ws, 8, k)), exec: str(cellv(ws, 9, k))});
      }
      c.items = cols; c.total = cols.length; c.done = cols.filter(x => x.date != null && x.date <= TODAY).length;
      const past = cols.filter(x => x.date != null && x.date <= TODAY);
      if (past.length) { c.lastDate = Math.max.apply(null, past.map(x => x.date)); const li = past.filter(x => x.date === c.lastDate).pop(); c.lastLabel = li.label; c.lastExec = li.exec || '(لم يُسجَّل)'; const idx = cols.indexOf(li); c.skipped = cols.slice(0, idx).filter(x => x.date == null).length; }
      // students
      c.students = [];
      for (let r = S0; r <= S1; r++) {
        const id = str(cellv(ws, r, 2)), nm = str(cellv(ws, r, 3));
        const g = []; for (let k = Q0; k <= Q1; k++) g.push(cellv(ws, r, k));
        if (!id && !nm && !g.some(v => v != null && v !== '')) continue;
        let sum = 0, cnt = 0;
        g.forEach((v, i) => { if (isNum(v)) { sum += v; cnt++; if (v < 0 || v > 10) c.issues.push('درجة غير صالحة (' + v + ') للطالب ' + (id || nm) + ' في المقطع ' + (i + 1)); } else if (v != null && v !== '' && str(v) !== ABS) c.issues.push('قيمة غير صالحة («' + str(v) + '») للطالب ' + (id || nm) + ' في المقطع ' + (i + 1)); });
        const avg = cnt ? Math.ceil(Math.round(sum / cnt * 10 * 1e6) / 1e6) : null;
        if (!id) c.issues.push('طالب بلا رقم أكاديمي: ' + nm); else if (!nm) c.issues.push('طالب بلا اسم: ' + id);
        c.students.push({id, name: nm, grades: g, avg, count: cnt});
      }
      const avgs = c.students.filter(s => s.avg != null).map(s => s.avg);
      c.avg = avgs.length ? Math.round(avgs.reduce((a, b) => a + b, 0) / avgs.length) : null;
      c.below = avgs.filter(a => a < cfg.pass).length;
      c.nStudents = c.students.length;
      cols.forEach(x => { if (x.date != null && !c.students.some(s => isNum(s.grades[x.k - Q0]))) { /* dated, no grades */ } if (x.date == null && c.students.some(s => isNum(s.grades[x.k - Q0]))) c.issues.push('مقطع فيه درجات بلا تاريخ تنفيذ: ' + x.label); });
      cols.forEach(x => { if (x.date != null && !x.exec) c.issues.push('مقطع له تاريخ بلا منفذ: ' + x.label); });
    } else {
      const items = [];
      for (let r = L0; r <= L1; r++) {
        const ci = cat[r - 8]; if (!ci || !ci.topic) continue;
        items.push({row: r, book: ci.book, week: ci.week, ses: ci.ses, topic: ci.topic, pages: ci.pages, date: dateOf(cellv(ws, r, 6)), exec: str(cellv(ws, r, 7)), rev: str(cellv(ws, r, 8)), isRev: ci.ses === 'مراجعة'});
      }
      c.items = items; c.total = items.length; c.done = items.filter(x => x.date != null && x.date <= TODAY).length;
      const past = items.filter(x => x.date != null && x.date <= TODAY);
      if (past.length) { c.lastDate = Math.max.apply(null, past.map(x => x.date)); const li = past.filter(x => x.date === c.lastDate).pop(); c.lastLabel = li.topic; c.lastExec = li.exec || '(لم يُسجَّل)'; const idx = items.indexOf(li); c.skipped = items.slice(0, idx).filter(x => x.date == null && !x.isRev).length; }
      c.revA = items.some(x => x.isRev && /^العقيدة/.test(x.book) && x.rev === 'نعم');
      c.revF = items.some(x => x.isRev && /^الفقه/.test(x.book) && x.rev === 'نعم');
      c.nStudents = isNum(c.studentsIn) ? c.studentsIn : null;
      items.forEach(x => { if (x.date != null && !x.exec) c.issues.push('حصة لها تاريخ بلا منفذ: ' + x.topic.split('\n').pop()); });
    }
    c.sub = !!(c.lastExec && c.lastExec !== '(لم يُسجَّل)' && c.teacher && c.lastExec !== c.teacher);
    // weekend / outside period
    (c.items || []).forEach(x => { if (x.date != null) { const w = wday(x.date); if (w === 5 || w === 6) c.issues.push('تاريخ في الجمعة أو السبت: ' + fmtD(x.date)); if ((c.start != null && x.date < c.start) || (c.end != null && x.date > c.end)) c.issues.push('تاريخ خارج فترة الفصل: ' + fmtD(x.date)); } });
    if (c.active) buildAlerts(c, cfg);
  }

  function buildAlerts(c, cfg) {
    const A = c.alerts, add = (sev, t) => A.push({sev, t});
    if (!c.hasSheet) { add('w', 'ورقة ناقصة: سمِّها «' + c.name + '»'); return; }
    if (c.start != null && c.start > TODAY) add('i', 'لم يبدأ بعد');
    if (c.next && c.trans != null && c.trans <= TODAY) add('w', 'حان انتقاله إلى ' + c.next);
    if (c.skipped > 0) add('w', 'متخطاة ' + c.skipped);
    if (c.expected != null && c.expected - c.done >= cfg.behind) add('w', 'متأخر ' + (c.expected - c.done) + ' حصة');
    if (c.sub) add('i', 'آخر حصة بديل');
    if (c.lastDate != null && TODAY - c.lastDate > cfg.stale && (c.end == null || TODAY <= c.end)) add('w', 'لا حصة منذ ' + (TODAY - c.lastDate) + ' يومًا');
    if (!c.isQ) {
      if (c.examA != null && c.examA >= TODAY && c.examA - TODAY <= cfg.review && !c.revA) add('w', 'سلِّم مراجعة العقيدة');
      if (c.examF != null && c.examF >= TODAY && c.examF - TODAY <= cfg.review && !c.revF) add('w', 'سلِّم مراجعة الفقه');
    } else if (c.below > 0) add('i', c.below + ' دون الحد');
  }

  /* ------------------------------------------------------------ pairing */
  function pairRows(all) {
    const out = [], used = new Set(), by = M.byName;
    const partnerL = q => by.get(q.next) || M.rows.find(x => !x.isQ && x.prevIn === q.name) || null;
    const take = c => (all || c.active);
    M.rows.forEach(c => {
      if (used.has(c.name) || !take(c)) return;
      if (c.isQ) {
        const l = partnerL(c); if (l) used.add(l.name); used.add(c.name);
        out.push({q: c, l: l, lname: c.next});
      } else {
        const p = c.prevName ? by.get(c.prevName) : null;
        if (p && p.isQ && p.active && !used.has(p.name)) return;   // shown with its CC row
        used.add(c.name);
        out.push({q: p, qname: c.prevName, l: c});
      }
    });
    return out;
  }

  /* ------------------------------------------------------------ rendering helpers */
  const statusTag = c => { if (!c) return ''; if (c.active) return ''; return ' <span class="tag gray">' + esc(c.status) + '</span>'; };
  const linkCls = (c, nm, faded) => {
    if (!c) return nm ? '<span class="tag gray">' + esc(nm) + ' (لم يُنشأ)</span>' : '';
    return '<a class="cl" data-c="' + esc(c.name) + '">' + esc(c.name) + '</a>' + statusTag(c) + (c.hasSheet ? '' : ' <span class="tag warn">بلا ورقة</span>');
  };
  const prog = c => {
    if (!c || !c.hasSheet || !c.total) return '';
    const p = Math.round(c.done / c.total * 100);
    return '<div class="prog"><div class="t">' + ltr(c.done + ' / ' + c.total) + '</div><div class="b"><i style="width:' + p + '%"></i></div></div>';
  };
  const alertTags = c => c ? '<div class="alerts">' + c.alerts.map(a => '<span class="tag ' + (a.sev === 'w' ? 'warn' : 'info') + '">' + (a.sev === 'w' ? '⚠ ' : '') + esc(a.t) + '</span>').join('') + '</div>' : '';
  const lastCell = (c, fade) => (c && c.hasSheet && c.lastLabel) ? esc(c.lastLabel.split('\n').pop()) : '';

  /* ------------------------------------------------------------ filters */
  const F = {q: '', teacher: '', type: '', pulse: '', all: false, onlyAlerts: false};
  function passRow(r) {
    const sides = [r.q, r.l].filter(Boolean);
    if (F.teacher && !sides.some(c => c.teacher === F.teacher)) return false;
    if (F.type === 'q' && !r.q) return false;
    if (F.type === 'l' && !r.l) return false;
    if (F.pulse && !sides.some(c => c.part === F.pulse)) return false;
    if (F.onlyAlerts && !sides.some(c => c.alerts.length && c.active)) return false;
    if (F.q) { const t = (sides.map(c => c.name + ' ' + c.teacher + ' ' + c.part).join(' ') + ' ' + (r.lname || '') + ' ' + (r.qname || '')).toLowerCase(); if (t.indexOf(F.q.toLowerCase()) < 0) return false; }
    return true;
  }
  function filterBar(opts) {
    const teachers = [...new Set(M.rows.map(c => c.teacher).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ar'));
    const pulses = [...new Set(M.rows.map(c => c.part).filter(Boolean))].sort();
    const sel = (id, label, list, cur) => '<select id="' + id + '"><option value="">' + label + '</option>' + list.map(x => '<option value="' + esc(x[0]) + '"' + (cur === x[0] ? ' selected' : '') + '>' + esc(x[1]) + '</option>').join('') + '</select>';
    return '<div class="bar"><input type="search" id="fq" placeholder="بحث: فصل، مدرس، بلس، طالب…" value="' + esc(F.q) + '">' +
      sel('ft', 'كل المدرسين', teachers.map(t => [t, t]), F.teacher) +
      (opts.type ? sel('fy', 'كل الأنواع', [['q', 'القرآن (CC)'], ['l', 'العقيدة والفقه']], F.type) : '') +
      (opts.pulse === false ? '' : sel('fp', 'كل البلس', pulses.map(t => [t, t]), F.pulse)) +
      (opts.below ? '<label class="chk"><input type="checkbox" id="fb"' + (F.below ? ' checked' : '') + '> دون الحد فقط</label>'
        : (opts.alerts === false ? '' : '<label class="chk"><input type="checkbox" id="fa"' + (F.onlyAlerts ? ' checked' : '') + '> التنبيهات فقط</label>')) +
      (opts.all ? '<label class="chk"><input type="checkbox" id="fl"' + (F.all ? ' checked' : '') + '> إظهار المنتهي والمؤرشف</label>' : '') +
      '<span class="sp"></span>' + (opts.extra || '') + '</div>';
  }
  function bindBar(rerender) {
    const on = (id, ev, fn) => { const e = $('#' + id); if (e) e.addEventListener(ev, fn); };
    on('fq', 'input', e => { F.q = e.target.value; rerender(true); });
    on('ft', 'change', e => { F.teacher = e.target.value; rerender(); });
    on('fy', 'change', e => { F.type = e.target.value; rerender(); });
    on('fp', 'change', e => { F.pulse = e.target.value; rerender(); });
    on('fa', 'change', e => { F.onlyAlerts = e.target.checked; rerender(); });
    on('fl', 'change', e => { F.all = e.target.checked; rerender(); });
    on('fb', 'change', e => { F.below = e.target.checked; rerender(); });
  }

  /* ------------------------------------------------------------ views */
  function viewOver() {
    const act = M.rows.filter(c => c.active), q = act.filter(c => c.isQ), l = act.filter(c => !c.isQ);
    const al = act.filter(c => c.alerts.some(a => a.sev === 'w')).length, miss = act.filter(c => !c.hasSheet).length;
    const stu = q.reduce((a, c) => a + (c.nStudents || 0), 0), below = q.reduce((a, c) => a + (c.below || 0), 0);
    const wk = M.cfg.week1 != null ? Math.floor((TODAY - M.cfg.week1) / 7) + 1 : '—';
    const card = (k, v, cls) => '<div class="card ' + (cls || '') + '"><div class="k">' + k + '</div><div class="v">' + v + '</div></div>';
    let h = '<div class="cards">' + card('الفصول النشطة', act.length) + card('فصول القرآن', q.length) + card('العقيدة والفقه', l.length) +
      card('الأسبوع التدريبي', wk) + card('فصول عليها تنبيه', al, al ? 'warn' : 'ok') + card('أوراق ناقصة', miss, miss ? 'warn' : 'ok') +
      card('طلاب القرآن', stu) + card('دون الحد', below, below ? 'warn' : 'ok') + '</div>';
    h += filterBar({type: true, all: true, extra: '<button class="btn light" id="pr">🖨 طباعة</button>'});
    h += '<div class="tw"><table><thead><tr><th rowspan="2">#</th><th rowspan="2">البلس</th><th colspan="6" class="gq">فصل القرآن (CC)</th><th colspan="7" class="gl">فصل التخصص (العقيدة والفقه)</th><th rowspan="2">تنبيهات</th></tr>' +
      '<tr><th class="gq">الفصل</th><th class="gq">المدرس</th><th class="gq">آخر مقطع</th><th class="gq">تاريخه</th><th class="gq">المعدل</th><th class="gq">دون الحد</th>' +
      '<th class="gl">الفصل</th><th class="gl">المدرس</th><th class="gl">آخر درس منفذ</th><th class="gl">تاريخه</th><th class="gl">التقدم</th><th class="gl">الأسبوع</th><th class="gl">الاختبارات</th></tr></thead><tbody id="ob"></tbody></table></div>';
    h += '<div class="hint">اضغط اسم الفصل لفتح تفاصيله. الباهت = منتهٍ أو مؤرشف أو لم يُنشأ بعد. الأرقام تعكس آخر حفظ لملف Excel.</div>';
    return h;
  }
  function fillOver() {
    const rows = pairRows(F.all).filter(passRow);
    $('#ob').innerHTML = rows.map((r, i) => {
      const q = r.q, l = r.l, qf = q && !q.active ? ' fade' : '', lf = l && !l.active ? ' fade' : '';
      const part = (q || l || {}).part || '';
      const al = [];
      [q, l].forEach(c => { if (c && c.active && c.alerts.length) al.push(alertTags(c)); });
      return '<tr><td>' + (i + 1) + '</td><td>' + esc(part) + '</td>' +
        '<td class="gq' + qf + '">' + (q ? linkCls(q) : (r.qname ? '<span class="tag gray">' + esc(r.qname) + ' (غير موجود)</span>' : '')) + '</td>' +
        '<td class="gq' + qf + '">' + esc(q ? q.teacher : '') + '</td><td class="gq lt' + qf + '" title="' + esc(q ? lastCell(q) : '') + '">' + (q ? lastCell(q) : '') + '</td><td class="gq' + qf + '">' + (q && q.lastDate != null ? fmtD(q.lastDate) : '') + '</td>' +
        '<td class="gq' + qf + (q && q.avg != null && q.avg < M.cfg.pass ? ' low' : '') + '">' + (q && q.avg != null ? q.avg : '') + '</td>' +
        '<td class="gq' + qf + (q && q.below ? ' low' : '') + '">' + (q && q.hasSheet ? q.below || '' : '') + '</td>' +
        '<td class="' + lf + '">' + (l ? linkCls(l) : (r.lname ? '<span class="tag gray">' + esc(r.lname) + ' (لم يُنشأ)</span>' : '')) + '</td>' +
        '<td class="' + lf + '">' + esc(l ? l.teacher : '') + '</td><td class="lt' + lf + '" title="' + esc(l ? lastCell(l) : '') + '">' + (l ? lastCell(l) : '') + '</td><td class="' + lf + '">' + (l && l.lastDate != null ? fmtD(l.lastDate) : '') + '</td>' +
        '<td class="' + lf + '">' + (l && l.active ? prog(l) : '') + '</td><td class="' + lf + '">' + ltr(esc(l ? l.week : '')) + '</td>' +
        '<td class="' + lf + '">' + (l ? examCell(l) : '') + '</td><td class="alr r">' + al.join('') + '</td></tr>';
    }).join('') || '<tr><td colspan="16" style="padding:30px;color:var(--muted)">لا توجد فصول تطابق التصفية.</td></tr>';
    document.querySelectorAll('a.cl').forEach(a => a.addEventListener('click', () => openDrawer(a.dataset.c)));
    const pr = $('#pr'); if (pr) pr.onclick = () => window.print();
  }
  const examCell = c => {
    const f = (lab, d) => d == null ? '' : '<div style="font-size:14px;' + (d < TODAY ? 'color:#9a9a9a' : (d - TODAY <= M.cfg.review ? 'color:#7a5b00;font-weight:700' : '')) + '">' + lab + ' ' + fmtD(d) + '</div>';
    return f('ع', c.examA) + f('ف', c.examF);
  };

  function viewTeachers() {
    const by = new Map();
    M.rows.filter(c => c.active && c.teacher).forEach(c => (by.get(c.teacher) || by.set(c.teacher, []).get(c.teacher)).push(c));
    let list = [...by.entries()].sort((a, b) => a[0].localeCompare(b[0], 'ar'));
    if (F.q) list = list.filter(([t, cs]) => (t + ' ' + cs.map(c => c.name).join(' ')).toLowerCase().indexOf(F.q.toLowerCase()) >= 0);
    if (F.teacher) list = list.filter(([t]) => t === F.teacher);
    return filterBar({pulse: false, alerts: false}) +
      '<div class="grid">' + list.map(([t, cs]) => {
        const w = cs.filter(c => c.alerts.some(a => a.sev === 'w')).length;
        return '<div class="tcard"><h3>' + esc(t) + '</h3><div class="meta">' + cs.length + ' فصل نشط' + (w ? ' · <span class="tag warn">⚠ ' + w + ' عليها تنبيه</span>' : ' · <span class="tag ok">سليم</span>') + '</div>' +
          cs.map(c => '<div class="cls"><span><a class="cl" data-c="' + esc(c.name) + '">' + esc(c.name) + '</a> <span class="tag ' + (c.isQ ? 'q' : 'gray') + '">' + (c.isQ ? 'قرآن' : 'مناهج') + '</span></span><span>' +
            (c.isQ ? (c.avg != null ? 'المعدل ' + c.avg : '') : (c.total ? ltr(c.done + '/' + c.total) : '')) + (c.alerts.some(a => a.sev === 'w') ? ' <span class="tag warn">⚠</span>' : '') + '</span></div>').join('') + '</div>';
      }).join('') + '</div>';
  }
  function bindLinks() { document.querySelectorAll('a.cl').forEach(a => a.addEventListener('click', () => openDrawer(a.dataset.c))); }

  /* ---- students (Quran) ---- */
  let sSort = 'avg', sQ = '';
  function viewStudents() {
    return filterBar({below: true, extra: '<button class="btn light" id="csv">⬇ تصدير الدرجات CSV</button>'}) +
      '<div class="hint">درجات طلاب فصول القرآن النشطة. زر التصدير يخرج الأعمدة: Academic No, Cadet Name, Score, Class للفصول الظاهرة بعد التصفية (ملف CSV يفتحه Excel).</div>' +
      '<div class="tw"><table><thead><tr><th>#</th><th data-s="id">الرقم الأكاديمي</th><th data-s="name">الاسم</th><th data-s="cls">الفصل</th><th>البلس</th><th data-s="avg">المعدل /100</th><th>مقاطع مرصودة</th></tr></thead><tbody id="sb"></tbody></table></div>';
  }
  function studentRows() {
    let all = [];
    M.rows.filter(c => c.isQ && c.active && c.hasSheet).forEach(c => {
      if (F.teacher && c.teacher !== F.teacher) return; if (F.pulse && c.part !== F.pulse) return;
      c.students.forEach(s => all.push({s, c}));
    });
    if (F.q) { const q = F.q.toLowerCase(); all = all.filter(x => (x.s.id + ' ' + x.s.name + ' ' + x.c.name).toLowerCase().indexOf(q) >= 0); }
    if (F.below) all = all.filter(x => x.s.avg != null && x.s.avg < M.cfg.pass);
    const key = {avg: x => (x.s.avg == null ? 999 : x.s.avg), id: x => x.s.id, name: x => x.s.name, cls: x => x.c.name}[sSort];
    all.sort((a, b) => { const ka = key(a), kb = key(b); return ka < kb ? -1 : ka > kb ? 1 : 0; });
    return all;
  }
  function fillStudents() {
    const all = studentRows();
    $('#sb').innerHTML = all.map((x, i) => '<tr><td>' + (i + 1) + '</td><td>' + esc(x.s.id) + '</td><td class="r" dir="ltr" style="text-align:left">' + esc(x.s.name) + '</td><td><a class="cl" data-c="' + esc(x.c.name) + '">' + esc(x.c.name) + '</a></td><td>' + esc(x.c.part) + '</td><td class="' + (x.s.avg != null && x.s.avg < M.cfg.pass ? 'low' : (x.s.avg >= 90 ? 'good' : '')) + '">' + (x.s.avg == null ? '' : x.s.avg) + '</td><td>' + x.s.count + '</td></tr>').join('') || '<tr><td colspan="7" style="padding:30px;color:var(--muted)">لا يوجد طلاب مطابقون.</td></tr>';
    bindLinks();
    document.querySelectorAll('th[data-s]').forEach(th => th.style.cursor = 'pointer');
    document.querySelectorAll('th[data-s]').forEach(th => th.onclick = () => { sSort = th.dataset.s; fillStudents(); });
    $('#csv').onclick = () => {
      const lines = ['Academic No,Cadet Name,Score,Class'];
      all.forEach(x => lines.push([x.s.id, '"' + x.s.name.replace(/"/g, '""') + '"', x.s.avg == null ? '' : x.s.avg, '"' + x.c.name + '"'].join(',')));
      const blob = new Blob(['﻿' + lines.join('\r\n')], {type: 'text/csv;charset=utf-8'}), a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'Cadet_Scores_' + fmtD(TODAY).replace(/\//g, '') + '.csv'; document.body.appendChild(a); a.click(); a.remove();
    };
  }

  /* ---- alerts ---- */
  function viewAlerts() {
    const act = M.rows.filter(c => c.active && c.alerts.length), warn = act.filter(c => c.alerts.some(a => a.sev === 'w'));
    const iss = M.rows.filter(c => c.issues.length && (c.active || c.status));
    let h = '<h4 class="sec">فصول عليها تنبيه (' + warn.length + ')</h4><div class="tw" style="max-height:none"><table><thead><tr><th>الفصل</th><th>النوع</th><th>المدرس</th><th>التنبيهات</th></tr></thead><tbody>' +
      (warn.map(c => '<tr><td><a class="cl" data-c="' + esc(c.name) + '">' + esc(c.name) + '</a></td><td>' + (c.isQ ? 'قرآن' : 'مناهج') + '</td><td>' + esc(c.teacher) + '</td><td class="r">' + alertTags(c) + '</td></tr>').join('') || '<tr><td colspan="4" style="padding:24px;color:var(--ok)">لا توجد تنبيهات.</td></tr>') + '</tbody></table></div>';
    h += '<h4 class="sec">ملاحظات جودة البيانات (' + iss.reduce((a, c) => a + new Set(c.issues).size, 0) + ')</h4><div class="tw" style="max-height:none"><table><thead><tr><th>الفصل</th><th>الملاحظة</th></tr></thead><tbody>' +
      (iss.map(c => [...new Set(c.issues)].map(t => '<tr><td><a class="cl" data-c="' + esc(c.name) + '">' + esc(c.name) + '</a></td><td class="r">' + esc(t) + '</td></tr>').join('')).join('') || '<tr><td colspan="2" style="padding:24px;color:var(--ok)">لا توجد ملاحظات. البيانات سليمة.</td></tr>') + '</tbody></table></div>';
    return h;
  }

  /* ------------------------------------------------------------ drawer */
  function openDrawer(name) {
    const c = M.byName.get(name); if (!c) return;
    const fact = (k, v) => v === '' || v == null ? '' : '<div class="fact"><div class="k">' + k + '</div><div class="v">' + esc(v) + '</div></div>';
    let b = '<div class="facts">' + fact('النوع', c.isQ ? 'قرآن' : 'عقيدة وفقه') + fact('المدرس', c.teacher) + fact('البلس', c.part) + fact('الدورة', c.course) + fact('الحالة', c.status || 'نشط') +
      fact('الفترة', c.start != null ? fmtD(c.start) + ' ← ' + (c.end != null ? fmtD(c.end) : '؟') : '') + fact('الأسبوع', c.week.replace(/ \/ /g, ' من ')) + fact('أيام الحصص', c.days.join('، ')) +
      fact('الطلاب', c.nStudents) + (c.isQ ? fact('معدل الفصل', c.avg) + fact('دون الحد', c.below) + fact('الفصل التالي', c.next) + fact('تاريخ الانتقال', c.trans != null ? fmtD(c.trans) : '') : fact('اختبار العقيدة', fmtD(c.examA)) + fact('اختبار الفقه', fmtD(c.examF)) + fact('الفصل السابق', c.prevName)) + '</div>';
    if (!c.hasSheet) b += '<div class="err">لا توجد ورقة لهذا الفصل في الملف. أنشئها باسم «' + esc(c.name) + '».</div>';
    else {
      if (c.alerts.length) b += '<div style="margin-bottom:10px">' + alertTags(c) + '</div>';
      b += '<h4 class="sec">التقدم: ' + c.done + ' من ' + c.total + (c.total ? ' (' + Math.round(c.done / c.total * 100) + '٪)' : '') + '</h4>' + prog(c).replace('min-width:96px', '');
      if (c.isQ) {
        b += '<div class="seg" style="margin-top:10px">' + c.items.map(x => '<div class="chip ' + (x.date != null && x.date <= TODAY ? 'done' : '') + '">' + esc(x.label) + '<small>' + (x.date != null ? fmtD(x.date) : 'لم يُنفَّذ') + (x.exec ? ' · ' + esc(x.exec.replace(' (تجريبي)', '')) : '') + '</small></div>').join('') + '</div>';
        b += '<h4 class="sec">الطلاب (' + c.students.length + ')</h4><div class="tw" style="max-height:none"><table><thead><tr><th>#</th><th>الرقم</th><th>الاسم</th><th>المعدل</th>' + c.items.map(x => '<th title="' + esc(x.label) + '">' + x.no + '</th>').join('') + '</tr></thead><tbody>' +
          c.students.map((s, i) => '<tr><td>' + (i + 1) + '</td><td>' + esc(s.id) + '</td><td dir="ltr" style="text-align:left">' + esc(s.name) + '</td><td class="' + (s.avg != null && s.avg < M.cfg.pass ? 'low' : (s.avg >= 90 ? 'good' : '')) + '">' + (s.avg == null ? '' : s.avg) + '</td>' +
            c.items.map(x => { const v = s.grades[x.k - Q0]; if (v == null || v === '') return '<td class="gr na">·</td>'; if (typeof v === 'string') return '<td class="gr ' + (v.trim() === ABS ? 'abs' : 'bad') + '">' + (v.trim() === ABS ? 'غ' : esc(v)) + '</td>'; return '<td class="gr ' + (v < 0 || v > 10 ? 'bad' : (v < M.cfg.pass / 10 ? 'l' : '')) + '">' + v + '</td>'; }).join('') + '</tr>').join('') + '</tbody></table></div>';
      } else {
        b += '<h4 class="sec">الدروس</h4><div class="tw" style="max-height:none"><table><thead><tr><th>#</th><th>الكتاب</th><th>الأسبوع</th><th>الموضوع</th><th>الصفحة</th><th>التاريخ</th><th>المنفذ</th><th>الحالة</th></tr></thead><tbody>' +
          c.items.map((x, i) => { const done = x.date != null && x.date <= TODAY; const sk = !done && !x.isRev && c.lastDate != null && x.date == null && c.items.indexOf(c.items.filter(y => y.date === c.lastDate).pop()) > i;
            return '<tr><td>' + (i + 1) + '</td><td>' + esc(x.book) + '</td><td>' + esc(x.week == null ? '' : x.week) + '</td><td class="r">' + esc(x.topic.split('\n').join(' — ')) + '</td><td>' + esc(x.pages) + '</td><td>' + fmtD(x.date) + '</td><td>' + esc(x.exec) + '</td><td>' +
              (x.isRev ? '<span class="tag q">مراجعة' + (x.rev === 'نعم' ? ' · سُلِّمت' : '') + '</span>' : (done ? '<span class="st done">✓ منفذ</span>' : (sk ? '<span class="st skip">⚠ متخطّى</span>' : '<span class="st wait">لم يُنفَّذ</span>'))) + '</td></tr>'; }).join('') + '</tbody></table></div>';
      }
    }
    if (c.issues.length) b += '<h4 class="sec">ملاحظات على البيانات</h4><ul>' + [...new Set(c.issues)].map(t => '<li>' + esc(t) + '</li>').join('') + '</ul>';
    const d = document.createElement('div'); d.id = 'dr';
    d.innerHTML = '<div class="shade"></div><div class="drawer"><div class="dh"><h2>' + esc(c.name) + '</h2><button class="btn light" id="dp">🖨 طباعة</button><button class="btn" id="dx">✕ إغلاق</button></div><div class="db">' + b + '</div></div>';
    document.body.appendChild(d);
    const close = () => d.remove(); $('#dx', d).onclick = close; $('.shade', d).onclick = close; $('#dp', d).onclick = () => window.print();
    document.addEventListener('keydown', function esc_(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc_); } });
  }

  /* ------------------------------------------------------------ shell */
  const TABS = [['over', 'نظرة عامة'], ['teach', 'المدرسون'], ['stud', 'طلاب القرآن'], ['alert', 'التنبيهات والجودة']];
  function render() {
    if (!M) return;
    const nAlert = M.rows.filter(c => c.active && c.alerts.some(a => a.sev === 'w')).length;
    $('#main').innerHTML = '<div class="tabs">' + TABS.map(t => '<button class="tab' + (view.tab === t[0] ? ' on' : '') + '" data-t="' + t[0] + '">' + t[1] + (t[0] === 'alert' && nAlert ? '<span class="n">' + nAlert + '</span>' : '') + '</button>').join('') + '</div><div id="pane"></div>';
    document.querySelectorAll('.tab').forEach(b => b.onclick = () => { view.tab = b.dataset.t; render(); });
    const pane = $('#pane');
    if (view.tab === 'over') { pane.innerHTML = viewOver(); bindBar(keepFocus(() => fillOver())); fillOver(); }
    else if (view.tab === 'teach') { const rt = keepFocus(() => { pane.innerHTML = viewTeachers(); bindBar(rt); bindLinks(); }); rt(); }
    else if (view.tab === 'stud') { pane.innerHTML = viewStudents(); bindBar(keepFocus(() => fillStudents())); fillStudents(); }
    else { pane.innerHTML = viewAlerts(); bindLinks(); }
  }
  function keepFocus(fn) {
    return function (typing) {
      const pos = typing ? ($('#fq') || {}).selectionStart : null;
      fn();
      if (typing) { const e = $('#fq'); if (e) { e.focus(); try { e.setSelectionRange(pos, pos); } catch (x) {} } }
    };
  }

  /* ------------------------------------------------------------ file loading */
  function load(file) {
    $('#err').classList.add('hidden');
    const rd = new FileReader();
    rd.onload = e => {
      try {
        wb = XLSX.read(new Uint8Array(e.target.result), {type: 'array', cellDates: false});
        M = readModel(wb);
        fileInfo = {name: file.name, saved: file.lastModified ? new Date(file.lastModified) : null};
        $('#welcome').classList.add('hidden'); $('#app').classList.remove('hidden');
        $('#fname').textContent = file.name;
        $('#fsaved').textContent = fileInfo.saved ? 'آخر حفظ للملف: ' + fileInfo.saved.toLocaleString('ar-SA', {dateStyle: 'medium', timeStyle: 'short'}) : '';
        $('#ftoday').textContent = 'اليوم: ' + fmtD(TODAY);
        view.tab = 'over'; render();
        window.__M = M;
      } catch (err) {
        const el = $('#err'); el.textContent = 'تعذّر قراءة الملف: ' + (err && err.message ? err.message : err); el.classList.remove('hidden');
      }
    };
    rd.onerror = () => { const el = $('#err'); el.textContent = 'تعذّر فتح الملف. جرّب نسخه إلى سطح المكتب ثم اختياره.'; el.classList.remove('hidden'); };
    rd.readAsArrayBuffer(file);
  }
  window.addEventListener('DOMContentLoaded', () => {
    const inp = $('#file'), dz = $('#drop');
    dz.onclick = () => inp.click(); $('#again').onclick = () => inp.click();
    inp.onchange = () => { if (inp.files[0]) load(inp.files[0]); inp.value = ''; };
    ['dragover', 'dragenter'].forEach(ev => document.addEventListener(ev, e => { e.preventDefault(); dz.classList.add('over'); }));
    ['dragleave', 'drop'].forEach(ev => document.addEventListener(ev, e => { e.preventDefault(); dz.classList.remove('over'); }));
    document.addEventListener('drop', e => { const f = e.dataTransfer && e.dataTransfer.files[0]; if (f) load(f); });
  });
})();
