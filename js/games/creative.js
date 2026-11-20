/* القسم الإبداعي: لعب حرّ بلا هدف ولا جولات ولا مصابيح.
   ١) ورشة الأشكال: ابنِ الصورة من الأشكال (بيت، صاروخ، قطار…)، تلتصق القطع في أماكنها كالمغناطيس.
   ٢) لوحة التلوين: رسمات بمناطق، تختار لوناً ثم تنقر المنطقة.
   عقد اللعب الحر (B.free[id]): open(ctx) و destroy(). */
(function () {
  'use strict';
  var B = (window.Bustan = window.Bustan || {});
  var UI = B.UI, h = UI.h, art = B.art, kit = B.kit;
  B.free = B.free || {};

  /* «تم الحفظ»: علامة ✓ تقفز وسط الشاشة */
  function savedMark(stage) {
    var m = h('div', { class: 'saved-mark', html: art.check() });
    stage.appendChild(m);
    if (B.audio) B.audio.play('place');
    UI.anim(m, [{ opacity: 0, transform: 'scale(.3)' }, { opacity: 1, transform: 'scale(1.15)', offset: 0.35 }, { opacity: 1, transform: 'scale(1)', offset: 0.75 }, { opacity: 0, transform: 'scale(.9) translateY(-20px)' }], { dur: 1100 }).then(function () { m.remove(); });
  }
  function saveToGallery(stage, src) { B.gallery.add(src); savedMark(stage); }

  var COLS = ['#F2658E', '#FFC83D', '#2DBE7E', '#3D8BFD', '#8E5CF0', '#FF8A3D', '#5CC8FF', '#F0485A'];

  /* ═════════ ورشة الأشكال: ابنِ الصورة ═════════
     صورة مرسومة بخطوط متقطعة (بيت، صاروخ، قطار…) تتكوّن من أشكال تعرفها:
     مربع، مثلث، مستطيل، دائرة، معيّن. تسحب الشكل إلى مكانه فيلتصق كالمغناطيس
     (أو تلمس الشكل ثم تلمس مكانه). الشكل في غير مكانه يعود بلطف إلى الصينية.
     حين تكتمل الصورة تحيا: الصاروخ يطير، والسيارة تسير، ونوافذ البيت تُضاء. */

  // رسم شكل داخل صندوق 0..100 (للأماكن والقطع): s = نوع الشكل
  function shapePath(s) {
    switch (s) {
      case 'triangle': return '<polygon points="50,4 96,96 4,96"/>';
      case 'circle': return '<circle cx="50" cy="50" r="48"/>';
      case 'diamond': return '<polygon points="50,2 98,50 50,98 2,50"/>';
      default: return '<rect x="2" y="2" width="96" height="96" rx="6"/>'; // مربع ومستطيل (الأبعاد من الصندوق)
    }
  }
  /* الصور: كل قطعة {s: الشكل، x,y,w,h: الصندوق من ١٠٠، r: دوران، c: اللون} */
  var Y = '#FFC83D', R = '#F0485A', G = '#2DBE7E', BL = '#3D8BFD', P = '#8E5CF0', O = '#FF8A3D', PK = '#F2658E', BR = '#B67B4D';
  var PICS = [
    { k: 'house', live: 'shine', parts: [
      { s: 'square', x: 22, y: 44, w: 56, h: 46, c: Y }, { s: 'triangle', x: 14, y: 12, w: 72, h: 34, c: R },
      { s: 'rect', x: 43, y: 64, w: 15, h: 26, c: BR }, { s: 'square', x: 28, y: 52, w: 12, h: 12, c: BL, win: 1 }, { s: 'square', x: 61, y: 52, w: 12, h: 12, c: BL, win: 1 }] },
    { k: 'tree', live: 'bounce', parts: [
      { s: 'rect', x: 43, y: 58, w: 14, h: 36, c: BR }, { s: 'circle', x: 20, y: 6, w: 60, h: 58, c: G },
      { s: 'circle', x: 34, y: 22, w: 11, h: 11, c: R }, { s: 'circle', x: 57, y: 38, w: 11, h: 11, c: R }] },
    { k: 'rocket', live: 'fly', parts: [
      { s: 'rect', x: 38, y: 30, w: 24, h: 50, c: '#FAFCFF' }, { s: 'triangle', x: 38, y: 6, w: 24, h: 25, c: R },
      { s: 'circle', x: 43, y: 40, w: 14, h: 14, c: BL }, { s: 'triangle', x: 22, y: 62, w: 17, h: 24, c: P }, { s: 'triangle', x: 61, y: 62, w: 17, h: 24, c: P },
      { s: 'diamond', x: 42, y: 80, w: 16, h: 16, c: O }] },
    { k: 'car', live: 'drive', parts: [
      { s: 'rect', x: 8, y: 46, w: 84, h: 26, c: BL }, { s: 'rect', x: 26, y: 24, w: 46, h: 23, c: BL },
      { s: 'square', x: 32, y: 29, w: 14, h: 14, c: '#D6EEFF' }, { s: 'square', x: 52, y: 29, w: 14, h: 14, c: '#D6EEFF' },
      { s: 'circle', x: 16, y: 62, w: 22, h: 22, c: '#1F2A5A' }, { s: 'circle', x: 62, y: 62, w: 22, h: 22, c: '#1F2A5A' }] },
    { k: 'boat', live: 'drive', parts: [
      { s: 'rect', x: 14, y: 66, w: 72, h: 16, c: BR }, { s: 'rect', x: 47, y: 14, w: 6, h: 52, c: '#8A5A33' },
      { s: 'triangle', x: 54, y: 16, w: 30, h: 46, c: PK }, { s: 'triangle', x: 18, y: 26, w: 28, h: 36, c: Y }, { s: 'circle', x: 28, y: 70, w: 8, h: 8, c: '#FAFCFF' }] },
    { k: 'train', live: 'drive', parts: [
      { s: 'rect', x: 8, y: 44, w: 52, h: 28, c: G }, { s: 'square', x: 58, y: 28, w: 32, h: 44, c: Y }, { s: 'rect', x: 16, y: 26, w: 12, h: 18, c: '#1F2A5A' },
      { s: 'square', x: 66, y: 35, w: 16, h: 16, c: '#D6EEFF' }, { s: 'circle', x: 14, y: 64, w: 20, h: 20, c: '#1F2A5A' }, { s: 'circle', x: 38, y: 64, w: 20, h: 20, c: '#1F2A5A' },
      { s: 'circle', x: 66, y: 62, w: 22, h: 22, c: '#1F2A5A' }] },
    { k: 'flower', live: 'bounce', parts: [
      { s: 'rect', x: 47, y: 50, w: 6, h: 44, c: G }, { s: 'diamond', x: 52, y: 64, w: 20, h: 14, c: G },
      { s: 'circle', x: 38, y: 6, w: 24, h: 24, c: PK }, { s: 'circle', x: 58, y: 24, w: 24, h: 24, c: PK }, { s: 'circle', x: 38, y: 42, w: 24, h: 24, c: PK },
      { s: 'circle', x: 18, y: 24, w: 24, h: 24, c: PK }, { s: 'circle', x: 40, y: 26, w: 20, h: 20, c: Y }] },
    { k: 'kite', live: 'fly', parts: [
      { s: 'diamond', x: 22, y: 6, w: 56, h: 60, c: O }, { s: 'diamond', x: 38, y: 22, w: 24, h: 28, c: Y },
      { s: 'triangle', x: 44, y: 66, w: 12, h: 10, c: PK }, { s: 'triangle', x: 48, y: 78, w: 12, h: 10, c: BL }, { s: 'triangle', x: 44, y: 88, w: 12, h: 10, c: G }] }
  ];
  function key(pt) { return pt.s + ':' + Math.round(pt.w) + 'x' + Math.round(pt.h); } // القطع المتطابقة يمكن تبادلها

  function partSvg(pt, cls, fill, extra) {
    return '<svg class="' + cls + '" viewBox="0 0 100 100" preserveAspectRatio="none" style="left:' + pt.x + '%;top:' + pt.y + '%;width:' + pt.w + '%;height:' + pt.h + '%"' + (extra || '') + '>' +
      '<g ' + fill + ' vector-effect="non-scaling-stroke">' + shapePath(pt.s) + '</g></svg>';
  }

  var ws = null;
  B.free.workshop = {
    open: function (ctx) {
      var stage = ctx.stage, vp = UI.vp();
      stage.classList.add('g-stage', 'ws-stage');
      var board = h('div', { class: 'ws-board' });
      var tray = h('div', { class: 'ws-tray' });
      var nextBtn = h('button', { class: 'g-choice ws-next', type: 'button', 'aria-label': B.S.create.next, html: B.art.playIcon() });
      ws = { idx: Math.floor(Math.random() * PICS.length), sel: null, done: 0 };
      stage.appendChild(h('div', { class: 'g-main ws-main' }, board));
      stage.appendChild(h('div', { class: 'ws-bottom' }, tray, nextBtn));
      UI.bindPress(nextBtn, function () { ws.idx = (ws.idx + 1) % PICS.length; if (B.audio) B.audio.play('whoosh'); show(); });

      function show() {
        var pic = PICS[ws.idx];
        board.innerHTML = ''; tray.innerHTML = '';
        nextBtn.classList.remove('ready');
        ws.sel = null;
        var art = h('div', { class: 'ws-art' });
        board.appendChild(art);
        // بعد ثلاث صور مكتملة: «ابنِ من نموذج» — صورة صغيرة ملوّنة للنظر، وتختفي الخطوط المتقطعة
        var model = ws.done >= 3;
        board.classList.toggle('model', model);
        if (model) {
          board.appendChild(h('div', { class: 'ws-model' }, h('div', { class: 'ws-art', html: pic.parts.map(function (pt) { return partSvg(pt, 'ws-fill', 'fill="' + pt.c + '" stroke="rgba(31,42,90,.35)" stroke-width="3"'); }).join('') })));
        }
        ws.slots = pic.parts.map(function (pt, i) {
          // المكان: شكل متقطع، ومساحة لمس شفافة لا تقل عن حدّ اللمس
          var el = h('div', { class: 'ws-slot', 'data-i': i, html: partSvg(pt, 'ws-ghost', 'fill="rgba(255,255,255,.6)" stroke="#8FA0D8" stroke-width="3" stroke-dasharray="7 6"') });
          art.appendChild(el);
          return { el: el, pt: pt, k: key(pt), filled: false };
        });
        // القطع في الصينية، مختلطة
        kit.shuffle(pic.parts.map(function (pt, i) { return i; })).forEach(function (i, n) {
          var pt = pic.parts[i];
          var ar = pt.w / pt.h, iw = ar >= 1 ? 76 : 76 * ar, ih = ar >= 1 ? 76 / ar : 76;
          var b = h('button', { class: 'ws-piece-btn', type: 'button' },
            h('span', { class: 'ws-piece-art', style: { width: iw + '%', height: ih + '%' }, html: '<svg viewBox="0 0 100 100" preserveAspectRatio="none"><g fill="' + pt.c + '" stroke="rgba(31,42,90,.35)" stroke-width="3" vector-effect="non-scaling-stroke">' + shapePath(pt.s) + '</g></svg>' }));
          b.__pt = pt; b.__k = key(pt);
          tray.appendChild(b);
          UI.anim(b, [{ transform: 'scale(0)' }, { transform: 'scale(1)' }], { dur: 380, delay: 200 + n * 70, easing: UI.SPRING, fill: 'backwards' });
          dragify(b);
        });
        UI.anim(art, [{ opacity: 0, transform: 'scale(.9)' }, { opacity: 1, transform: 'none' }], { dur: 450, easing: UI.SPRING, fill: 'none' });
        layout();
      }
      function layout() { // اللوحة مربعة بأكبر حجم يتسع
        var m = board.parentNode, s = Math.min(m.clientWidth - 8, m.clientHeight - 8);
        board.style.width = board.style.height = Math.max(160, s) + 'px';
      }

      function slotAt(k, x, y) { // أقرب مكان فارغ مطابق تحت الإصبع (مسافة التقاط متسامحة)
        var best = null, bd = 1e9;
        ws.slots.forEach(function (sl) {
          if (sl.filled || sl.k !== k) return;
          var r = sl.el.querySelector('svg').getBoundingClientRect();
          var cx = r.left + r.width / 2, cy = r.top + r.height / 2, d = Math.hypot(cx - x, cy - y);
          var tol = Math.max(70, Math.max(r.width, r.height) * 0.6);
          if (d < tol && d < bd) { bd = d; best = sl; }
        });
        return best;
      }
      function firstFree(k) { return ws.slots.filter(function (sl) { return !sl.filled && sl.k === k; })[0]; }

      function place(b, sl) {
        sl.filled = true;
        var pt = sl.pt;
        sl.el.innerHTML = partSvg(pt, 'ws-fill' + (pt.win ? ' win' : ''), 'fill="' + pt.c + '" stroke="rgba(31,42,90,.35)" stroke-width="3"');
        var sv = sl.el.firstChild;
        UI.anim(sv, [{ transform: 'scale(1.35)', opacity: 0.4 }, { transform: 'scale(.92)', opacity: 1, offset: 0.6 }, { transform: 'scale(1)', opacity: 1 }], { dur: 380, easing: UI.SPRING, fill: 'none' });
        if (B.audio) B.audio.play('place'); // صوت «طق» المغناطيس
        b.remove();
        ws.sel = null;
        if (ws.slots.every(function (x) { return x.filled; })) complete();
      }
      function reject(b) { // يعود الشكل بلطف إلى الصينية
        kit.wrong(b);
        b.classList.remove('picked');
      }

      function dragify(b) {
        var ghost = null, sx = 0, sy = 0, moved = false;
        b.addEventListener('pointerdown', function (e) {
          if (ctx.paused) return;
          sx = e.clientX; sy = e.clientY; moved = false;
          try { b.setPointerCapture(e.pointerId); } catch (err) {}
          if (B.audio) B.audio.play('pick');
        });
        b.addEventListener('pointermove', function (e) {
          if (!b.hasPointerCapture || !b.hasPointerCapture(e.pointerId)) return;
          if (!moved && Math.hypot(e.clientX - sx, e.clientY - sy) < 10) return;
          if (!moved) {
            moved = true;
            // قطعة تتبع الإصبع بحجمها في الصورة
            var br = board.getBoundingClientRect(), pt = b.__pt;
            ghost = h('div', { class: 'ws-drag', style: { width: br.width * pt.w / 100 + 'px', height: br.height * pt.h / 100 + 'px' },
              html: '<svg viewBox="0 0 100 100" preserveAspectRatio="none"><g fill="' + pt.c + '" stroke="rgba(31,42,90,.35)" stroke-width="3" vector-effect="non-scaling-stroke">' + shapePath(pt.s) + '</g></svg>' });
            document.body.appendChild(ghost);
            b.classList.add('lifted');
          }
          ghost.style.transform = 'translate(' + (e.clientX - ghost.offsetWidth / 2) + 'px,' + (e.clientY - ghost.offsetHeight / 2) + 'px)';
        });
        function up(e) {
          if (ghost) { ghost.remove(); ghost = null; }
          b.classList.remove('lifted');
          if (!b.isConnected) return;
          if (moved) {
            var sl = slotAt(b.__k, e.clientX, e.clientY);
            if (sl) place(b, sl); else reject(b);
          } else {
            // نقرة: اختيار الشكل (ثم لمس مكانه)
            tray.querySelectorAll('.picked').forEach(function (x) { x.classList.remove('picked'); });
            ws.sel = b; b.classList.add('picked');
          }
        }
        b.addEventListener('pointerup', up);
        b.addEventListener('pointercancel', function () { if (ghost) { ghost.remove(); ghost = null; } b.classList.remove('lifted'); });
      }
      // لمس مكان بعد اختيار شكل
      board.addEventListener('pointerdown', function (e) {
        if (!ws.sel || ctx.paused) return;
        var sl = slotAt(ws.sel.__k, e.clientX, e.clientY);
        if (sl) place(ws.sel, sl);
        else {
          // لمس مكان لا يناسب هذا الشكل
          var any = ws.slots.some(function (x) { var r = x.el.querySelector('svg').getBoundingClientRect(); return !x.filled && e.clientX > r.left - 20 && e.clientX < r.right + 20 && e.clientY > r.top - 20 && e.clientY < r.bottom + 20; });
          if (any) reject(ws.sel);
        }
      });

      function complete() {
        var pic = PICS[ws.idx], art = board.querySelector('.ws-art');
        if (B.audio) { B.audio.play('cheer'); }
        var c = kit.center(board, stage);
        UI.burst(stage, c.x, c.y, { n: 26, spread: 170, dur: 1500 });
        board.classList.add('done'); ws.done++;
        // تُحفظ الصورة المكتملة تلقائياً في «إبداعاتي»
        var svgStr = '<svg xmlns="http://www.w3.org/2000/svg" width="260" height="260" viewBox="0 0 100 100"><rect width="100" height="100" rx="8" fill="#fff"/>' +
          pic.parts.map(function (pt) { return '<svg x="' + pt.x + '" y="' + pt.y + '" width="' + pt.w + '" height="' + pt.h + '" viewBox="0 0 100 100" preserveAspectRatio="none"><g fill="' + pt.c + '" stroke="rgba(31,42,90,.35)" stroke-width="3" vector-effect="non-scaling-stroke">' + shapePath(pt.s) + '</g></svg>'; }).join('') + '</svg>';
        B.gallery.add('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr));
        if (pic.live === 'fly') {
          if (B.audio) B.audio.play('whoosh');
          UI.anim(art, [{ transform: 'translateY(0)' }, { transform: 'translateY(8px)', offset: 0.15 }, { transform: 'translateY(-120%)', offset: 0.6 }, { transform: 'translateY(-120%)', offset: 0.61, opacity: 0 }, { transform: 'translateY(30%)', opacity: 0, offset: 0.62 }, { transform: 'translateY(0)', opacity: 1 }], { dur: 2600, easing: 'ease-in-out', fill: 'none' });
        } else if (pic.live === 'drive') {
          if (B.audio) B.audio.play('toot');
          UI.anim(art, [{ transform: 'translateX(0)' }, { transform: 'translateX(-130%)', offset: 0.45 }, { transform: 'translateX(-130%)', opacity: 0, offset: 0.46 }, { transform: 'translateX(130%)', opacity: 0, offset: 0.47 }, { transform: 'translateX(0)', opacity: 1 }], { dur: 2600, easing: 'ease-in-out', fill: 'none' });
        } else if (pic.live === 'shine') {
          board.querySelectorAll('.ws-fill.win g').forEach(function (g) { g.setAttribute('fill', '#FFE45E'); });
          UI.anim(art, [{ transform: 'scale(1)' }, { transform: 'scale(1.08)' }, { transform: 'scale(1)' }], { dur: 700, easing: UI.SPRING, fill: 'none' });
        } else {
          UI.anim(art, [{ transform: 'rotate(0)' }, { transform: 'rotate(-5deg) scale(1.05)' }, { transform: 'rotate(5deg) scale(1.05)' }, { transform: 'rotate(0)' }], { dur: 1000, fill: 'none' });
        }
        // زر الصورة التالية يظهر وينبض (لا انتقال مفاجئ)
        setTimeout(function () { if (ws) { nextBtn.classList.add('ready'); board.classList.remove('done'); } }, 1400 / UI.ts);
      }

      ws.solve = function () { // للاختبار الآلي
        var b = tray.querySelector('.ws-piece-btn');
        if (!b) return false;
        var sl = firstFree(b.__k); if (sl) place(b, sl);
        return true;
      };
      ws.onResize = function () { layout(); };
      window.addEventListener('resize', ws.onResize);
      requestAnimationFrame(show);
    },
    destroy: function () { if (ws) window.removeEventListener('resize', ws.onResize); ws = null; },
    _pics: function () { return PICS; },
    _solve: function () { return !!(ws && ws.solve && ws.solve()); }
  };

  /* ═════════ لوحة التلوين ═════════ */
  /* كل رسمة قائمة مناطق SVG (بلا تعبئة). تُلوَّن كل منطقة بنقرة. */
  var PAGES = [
    // فراشة
    ['<path d="M100 100C92 40 40 20 24 50C14 78 44 98 100 104Z"/>', '<path d="M100 100C108 40 160 20 176 50C186 78 156 98 100 104Z"/>',
      '<path d="M100 108C56 112 30 142 44 166C60 186 92 160 100 112Z"/>', '<path d="M100 108C144 112 170 142 156 166C140 186 108 160 100 112Z"/>',
      '<circle cx="56" cy="62" r="13"/>', '<circle cx="144" cy="62" r="13"/>', '<circle cx="62" cy="146" r="10"/>', '<circle cx="138" cy="146" r="10"/>',
      '<rect x="92" y="54" width="16" height="96" rx="8"/>'],
    // زهرة في أصيص
    ['<ellipse cx="100" cy="34" rx="18" ry="24"/>', '<ellipse cx="134" cy="54" rx="18" ry="24" transform="rotate(60 134 54)"/>', '<ellipse cx="134" cy="92" rx="18" ry="24" transform="rotate(120 134 92)"/>',
      '<ellipse cx="100" cy="112" rx="18" ry="24"/>', '<ellipse cx="66" cy="92" rx="18" ry="24" transform="rotate(60 66 92)"/>', '<ellipse cx="66" cy="54" rx="18" ry="24" transform="rotate(120 66 54)"/>',
      '<circle cx="100" cy="73" r="20"/>', '<rect x="95" y="130" width="10" height="34" rx="4"/>',
      '<path d="M100 150Q70 132 62 152Q82 164 100 150Z"/>', '<path d="M100 150Q130 132 138 152Q118 164 100 150Z"/>', '<path d="M68 162H132L124 194H76Z"/>'],
    // بيت
    ['<rect x="8" y="150" width="184" height="42" rx="10"/>', '<rect x="44" y="84" width="112" height="82" rx="6"/>', '<path d="M30 90L100 30L170 90Z"/>',
      '<rect x="88" y="120" width="26" height="46" rx="5"/>', '<rect x="54" y="100" width="24" height="24" rx="4"/>', '<rect x="124" y="100" width="24" height="24" rx="4"/>',
      '<rect x="132" y="38" width="16" height="30" rx="3"/>', '<circle cx="36" cy="36" r="20"/>', '<path d="M150 22a12 12 0 0 1 22 2a10 10 0 0 1 4 20h-34a10 10 0 0 1 8-22Z"/>'],
    // سمكة
    ['<path d="M20 100Q40 46 100 46Q150 48 164 100Q150 152 100 154Q40 154 20 100Z"/>', '<path d="M158 100L194 62L188 100L194 138Z"/>',
      '<path d="M88 48Q104 16 130 22Q122 40 116 50Z"/>', '<path d="M92 152Q104 178 124 174Q118 160 114 152Z"/>',
      '<path d="M74 60Q92 100 74 142Q56 100 74 60Z"/>', '<path d="M112 54Q130 100 112 148Q98 100 112 54Z"/>',
      '<circle cx="46" cy="88" r="10"/>', '<circle cx="24" cy="40" r="9"/>', '<circle cx="44" cy="22" r="6"/>'],
    // بالون طائر
    ['<path d="M100 14C50 14 30 54 30 86C30 120 70 140 86 166H114C130 140 170 120 170 86C170 54 150 14 100 14Z"/>',
      '<path d="M100 14C80 14 70 54 70 86C70 120 88 140 94 166H106C112 140 130 120 130 86C130 54 120 14 100 14Z"/>',
      '<rect x="80" y="176" width="40" height="18" rx="5"/>', '<path d="M14 150a12 12 0 0 1 22 2a10 10 0 0 1 4 20H6a10 10 0 0 1 8-22Z"/>',
      '<circle cx="170" cy="160" r="16"/>']
  ];

  var cl = null;
  B.free.coloring = {
    open: function (ctx) {
      var stage = ctx.stage;
      stage.classList.add('g-stage', 'cl-stage');
      var page = 0, color = COLS[0];
      var paper = h('div', { class: 'cl-paper' });
      var tray = h('div', { class: 'g-tray cl-tray' });
      cl = {};
      function show() {
        paper.innerHTML = '<svg viewBox="0 0 200 200" class="cl-svg">' +
          PAGES[page].map(function (s) { return s.replace(/\/>$/, ' class="rg" fill="#FFFFFF" stroke="#1F2A5A" stroke-width="3.5" stroke-linejoin="round"/>'); }).join('') + '</svg>';
        UI.anim(paper.firstChild, [{ opacity: 0, transform: 'scale(.85) rotate(-3deg)' }, { opacity: 1, transform: 'none' }], { dur: 480, easing: UI.SPRING, fill: 'none' });
      }
      paper.addEventListener('pointerdown', function (e) {
        var t = e.target;
        if (!t.classList || !t.classList.contains('rg')) return;
        t.setAttribute('fill', color);
        if (B.audio) B.audio.play('place');
        UI.anim(t, [{ opacity: 0.4 }, { opacity: 1 }], { dur: 300, fill: 'none' });
      });
      var sw = COLS.map(function (c, i) {
        var b = h('button', { class: 'g-choice cl-color' + (i === 0 ? ' selected' : ''), type: 'button' }, h('span', { class: 'ws-dot', style: { background: c } }));
        UI.bindPress(b, function () {
          color = c; sw.forEach(function (x) { x.classList.toggle('selected', x === b); });
          if (B.audio) B.audio.play('pick');
        });
        tray.appendChild(b);
        return b;
      });
      // زر الرسمة التالية (ورقة جديدة)
      var next = h('button', { class: 'g-choice cl-next', type: 'button', 'aria-label': B.S.create.next, html: art.svg('0 0 100 100', '<rect x="22" y="14" width="56" height="72" rx="8" fill="#FAFCFF" stroke="#1F2A5A" stroke-width="5"/><path d="M60 40L40 50L60 60" fill="none" stroke="#F2658E" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>') });
      UI.bindPress(next, function () { page = (page + 1) % PAGES.length; if (B.audio) B.audio.play('whoosh'); show(); });
      tray.appendChild(next);
      var csave = h('button', { class: 'g-choice dr-tool cl-save', type: 'button', 'aria-label': B.S.create.save, html: art.toolSave() }, h('small', { text: B.S.create.save }));
      UI.bindPress(csave, function () {
        var s = paper.querySelector('svg'); if (!s) return;
        var xml = new XMLSerializer().serializeToString(s).replace('<svg ', '<svg width="300" height="300" style="background:#fff" ');
        saveToGallery(stage, 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml));
      });
      tray.appendChild(csave);
      stage.appendChild(h('div', { class: 'g-main' }, paper));
      stage.appendChild(tray);
      show();
    },
    destroy: function () { cl = null; }
  };

  /* ═════════ الرسم الحر ═════════
     لوحة بيضاء يرسم عليها الطفل بإصبعه: ٦ ألوان، ثلاثة أحجام للفرشاة، ممحاة، مكنسة،
     و«وعاء الخلط»: يلمس لونين فيُخلط لون جديد (متوسط اللونين) ويصير لون الفرشاة. */
  var DCOLS = ['#F0485A', '#FFC83D', '#3D8BFD', '#2DBE7E', '#8E5CF0', '#FF8A3D'];
  function hexRgb(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
  function mixHex(a, b) {
    var x = hexRgb(a), y = hexRgb(b), o = '#';
    for (var i = 0; i < 3; i++) o += ('0' + Math.round((x[i] + y[i]) / 2).toString(16)).slice(-2);
    return o;
  }
  var dr = null;
  B.free.drawing = {
    open: function (ctx) {
      var stage = ctx.stage;
      stage.classList.add('g-stage', 'dr-stage');
      var canvas = h('canvas', { class: 'dr-canvas' });
      var wrap = h('div', { class: 'dr-wrap' }, canvas);
      var tray = h('div', { class: 'dr-tray scrollable' });
      dr = { color: DCOLS[0], size: 1, eraser: false, mixing: false, mixSel: null };
      stage.appendChild(h('div', { class: 'g-main dr-main' }, wrap));
      stage.appendChild(tray);
      var g;
      function fitCanvas() {
        var r = wrap.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
        var keep = canvas.width ? canvas.toDataURL() : null;
        canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
        g = canvas.getContext('2d'); g.scale(dpr, dpr); g.lineCap = 'round'; g.lineJoin = 'round';
        if (keep) { var im = new Image(); im.onload = function () { g.drawImage(im, 0, 0, r.width, r.height); }; im.src = keep; }
      }
      var SIZES = [6, 16, 34];
      var px, py, drawing = false;
      function pos(e) { var r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
      canvas.addEventListener('pointerdown', function (e) {
        if (ctx.paused) return;
        drawing = true; var q = pos(e); px = q[0]; py = q[1];
        try { canvas.setPointerCapture(e.pointerId); } catch (x) {}
        g.strokeStyle = dr.eraser ? '#FFFFFF' : dr.color; g.lineWidth = SIZES[dr.size] * (dr.eraser ? 1.6 : 1);
        g.beginPath(); g.moveTo(px, py); g.lineTo(px + 0.01, py); g.stroke();
        if (B.audio) B.audio.play('tap');
      });
      canvas.addEventListener('pointermove', function (e) {
        if (!drawing) return; var q = pos(e);
        g.beginPath(); g.moveTo(px, py); g.lineTo(q[0], q[1]); g.stroke(); px = q[0]; py = q[1];
      });
      ['pointerup', 'pointercancel'].forEach(function (ev) { canvas.addEventListener(ev, function () { drawing = false; }); });

      // الأدوات: ألوان، وعاء الخلط، حجم، ممحاة، مكنسة
      var colorBtns = [];
      function setColor(c) { dr.color = c; dr.eraser = false; refresh(); }
      function refresh() {
        colorBtns.forEach(function (b) { b.classList.toggle('selected', !dr.eraser && b.__c === dr.color); });
        eraseBtn.classList.toggle('selected', dr.eraser);
        mixBtn.classList.toggle('selected', dr.mixing);
        sizeBtn.querySelectorAll('circle').forEach(function (c, i) { c.setAttribute('fill', i === dr.size ? '#8E5CF0' : '#C9D8F2'); });
      }
      DCOLS.forEach(function (c) {
        var b = h('button', { class: 'g-choice cl-color', type: 'button' }, h('span', { class: 'ws-dot', style: { background: c } }));
        b.__c = c;
        UI.bindPress(b, function () {
          if (dr.mixing) { // خلط: لونان متتاليان
            if (!dr.mixSel) { dr.mixSel = c; if (B.audio) B.audio.play('pick'); b.classList.add('selected'); return; }
            var m = mixHex(dr.mixSel, c); dr.mixSel = null; dr.mixing = false;
            if (B.audio) B.audio.play('sweep');
            mixDot.style.background = m; mixDot.classList.add('on');
            UI.anim(mixBtn, [{ transform: 'rotate(0)' }, { transform: 'rotate(360deg)' }], { dur: 700, fill: 'none' });
            setColor(m); return;
          }
          if (B.audio) B.audio.play('pick'); setColor(c);
        });
        colorBtns.push(b); tray.appendChild(b);
      });
      function tool(cls, svgStr, label, fn) {
        var b = h('button', { class: 'g-choice dr-tool ' + cls, type: 'button', 'aria-label': label, html: svgStr }, h('small', { text: label }));
        UI.bindPress(b, fn); return b;
      }
      var mixDot = h('span', { class: 'dr-mixdot' });
      var mixBtn = tool('dr-mix', art.toolMix(), B.S.create.tMix, function () { dr.mixing = !dr.mixing; dr.mixSel = null; refresh(); if (B.audio) B.audio.play('pick'); });
      mixBtn.appendChild(mixDot);
      var sizeBtn = tool('dr-size', art.toolSize(), B.S.create.tSize, function () { dr.size = (dr.size + 1) % 3; refresh(); if (B.audio) B.audio.play('pick'); });
      var saveBtn = tool('dr-save', art.toolSave(), B.S.create.save, function () {
        var w0 = 260, h0 = Math.round(w0 * canvas.height / canvas.width), c2 = document.createElement('canvas'); c2.width = w0; c2.height = h0;
        var x = c2.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, w0, h0); x.drawImage(canvas, 0, 0, w0, h0);
        saveToGallery(stage, c2.toDataURL('image/jpeg', 0.72));
      });
      var eraseBtn = tool('dr-erase', art.toolErase(), B.S.create.tErase, function () { dr.eraser = !dr.eraser; refresh(); });
      var broom = tool('dr-broom', art.toolClear(), B.S.create.tClear, function () { var r = wrap.getBoundingClientRect(); g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, r.width, r.height); if (B.audio) B.audio.play('sweep'); });
      [mixBtn, sizeBtn, eraseBtn, broom, saveBtn].forEach(function (b) { tray.appendChild(b); });
      // فاصل واضح بين الألوان والأدوات
      tray.insertBefore(h('span', { class: 'dr-sep' }), mixBtn);
      requestAnimationFrame(function () { fitCanvas(); g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, canvas.width, canvas.height); refresh(); });
      dr.onResize = function () { if (!drawing) fitCanvas(); };
      window.addEventListener('resize', dr.onResize);
    },
    destroy: function () { if (dr) window.removeEventListener('resize', dr.onResize); dr = null; }
  };

  /* ═════════ بستاني ═════════
     كل ما زرعه الطفل بإكمال جلساته. يلمس أي عنصر فيهتز. فارغ؟ شتلة صغيرة بانتظار أول جلسة. */
  B.free.garden = {
    open: function (ctx) {
      var stage = ctx.stage, items = B.garden.items();
      stage.classList.add('g-stage', 'gd-stage');
      stage.appendChild(h('div', { class: 'gd-sun', html: art.sun() }));
      var hills = h('div', { class: 'gd-hills', html: art.sceneTile('mid', Math.max(600, UI.vp().W), 260) });
      stage.appendChild(hills);
      var field = h('div', { class: 'gd-field' });
      stage.appendChild(field);
      stage.appendChild(h('div', { class: 'gd-count' }, h('span', { class: 'gd-count-ic', html: B.pics.draw('leaf') }), h('b', { text: UI.num(items.length) })));
      if (!items.length) {
        field.appendChild(h('div', { class: 'gd-empty' }, h('div', { class: 'gd-seed', html: B.pics.draw('leaf') }), h('div', { class: 'gd-bear', html: art.animal('bear') })));
      }
      items.forEach(function (k, i) {
        function rnd(n) { var s = Math.sin((i + 1) * 12.9898 + n * 78.233) * 43758.5453; return s - Math.floor(s); }
        var depth = rnd(1), x = 4 + rnd(2) * 84, y = 8 + depth * 78;
        var sz = 10 + depth * 9;
        var el = h('div', { class: 'gd-item', role: 'button', style: { left: x + '%', top: y + '%', width: sz + 'vmin', zIndex: Math.round(y) }, html: B.pics.draw(k) });
        field.appendChild(el);
        UI.anim(el, [{ transform: 'scale(0)' }, { transform: 'scale(1)' }], { dur: 420, delay: Math.min(1500, i * 25), easing: UI.SPRING, fill: 'backwards' });
        el.addEventListener('pointerdown', function () {
          if (B.audio) B.audio.play('pop');
          UI.anim(el, [{ transform: 'rotate(0) scale(1)' }, { transform: 'rotate(-10deg) scale(1.2)' }, { transform: 'rotate(10deg) scale(1.2)' }, { transform: 'rotate(0) scale(1)' }], { dur: 500, fill: 'none' });
        });
      });
    },
    destroy: function () {}
  };


  /* ═════════ مشهدي: ألصق الملصقات على خلفية واحفظ مشهدك ═════════ */
  var SCN_BG = [
    { id: 'day', n: 'نهار', css: 'linear-gradient(180deg,#9AD8F7 0%,#E6F6FF 60%,#9BDB8A 61%,#6FC46E 100%)', svg: ['#9AD8F7', '#E6F6FF', '#9BDB8A'] },
    { id: 'night', n: 'ليل', css: 'linear-gradient(180deg,#1D2A6B 0%,#4A3FA6 62%,#3F8F6A 63%,#2E6F50 100%)', svg: ['#1D2A6B', '#4A3FA6', '#3F8F6A'] },
    { id: 'sea', n: 'بحر', css: 'linear-gradient(180deg,#CDEFFF 0%,#8FD3F4 38%,#3D9FE0 39%,#2468D1 100%)', svg: ['#CDEFFF', '#8FD3F4', '#3D9FE0'] },
    { id: 'sand', n: 'صحراء', css: 'linear-gradient(180deg,#FFE9B8 0%,#FFD28A 60%,#F0B860 61%,#E0A04A 100%)', svg: ['#FFE9B8', '#FFD28A', '#F0B860'] }
  ];
  var SCN_ST = ['sun', 'moon', 'cloud', 'tree', 'flower', 'rose', 'house', 'rabbit', 'bear', 'duck', 'turtle', 'fox', 'owl', 'cat', 'butterfly', 'bird', 'star', 'heart', 'balloon', 'car', 'rocket', 'fish'];
  B.free.scene = {
    open: function (ctx) {
      var stage = ctx.stage; stage.classList.add('g-stage', 'sc-stage');
      var items = [], sel = SCN_ST[3], bg = SCN_BG[0];
      var board = h('div', { class: 'sc-board', style: { background: bg.css } }), tray = h('div', { class: 'sc-tray scrollable' }), bgRow = h('div', { class: 'sc-bgs' });
      function paintBg() { board.style.background = bg.css; bgRow.querySelectorAll('.sc-bg').forEach(function (b) { b.classList.toggle('on', b.dataset.id === bg.id); }); }
      SCN_BG.forEach(function (b) { var el = h('button', { class: 'sc-bg', type: 'button', 'data-id': b.id, style: { background: b.css } }, h('span', { text: b.n })); el.addEventListener('click', function () { bg = b; paintBg(); if (B.audio) B.audio.play('pick'); }); bgRow.appendChild(el); });
      SCN_ST.forEach(function (k) {
        var b = h('button', { class: 'sc-st' + (k === sel ? ' on' : ''), type: 'button', 'data-k': k, 'aria-label': k, html: B.pics.draw(k) });
        b.addEventListener('click', function () { sel = k; tray.querySelectorAll('.sc-st').forEach(function (x) { x.classList.toggle('on', x === b); }); if (B.audio) B.audio.play('pick'); });
        tray.appendChild(b);
      });
      function stamp(x, y) {
        var size = 20, it = { k: sel, x: x, y: y, s: size };
        var el = h('div', { class: 'sc-item', style: { left: x * 100 + '%', top: y * 100 + '%', width: size + '%' }, html: B.pics.draw(sel) });
        board.appendChild(el); it.el = el; items.push(it);
        UI.anim(el, [{ transform: 'translate(-50%,-62%) scale(.2)', opacity: 0 }, { transform: 'translate(-50%,-62%) scale(1.15)', opacity: 1 }, { transform: 'translate(-50%,-62%) scale(1)', opacity: 1 }], { dur: 380, easing: UI.SPRING, fill: 'forwards' });
        if (B.audio) B.audio.play('place');
      }
      board.addEventListener('pointerdown', function (e) { if (e.target.closest('.sc-item') && false) return; var r = board.getBoundingClientRect(); stamp(Math.max(0.08, Math.min(0.92, (e.clientX - r.left) / r.width)), Math.max(0.1, Math.min(0.95, (e.clientY - r.top) / r.height))); });
      function btn(cls, label, fn) { var b = h('button', { class: 'g-choice dr-tool ' + cls, type: 'button', 'aria-label': label }, h('small', { text: label })); b.addEventListener('click', fn); return b; }
      var undo = btn('sc-undo', 'تراجع', function () { var it = items.pop(); if (it) { it.el.remove(); if (B.audio) B.audio.play('soft'); } });
      var clr = btn('sc-clear', 'مسح', function () { items.splice(0).forEach(function (it) { it.el.remove(); }); if (B.audio) B.audio.play('sweep'); });
      var save = btn('sc-save', 'حفظ', function () {
        var W = 400, H = 300, g = bg.svg, out = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + g[0] + '"/><stop offset=".6" stop-color="' + g[1] + '"/></linearGradient></defs><rect width="400" height="300" fill="url(#g)"/><rect y="180" width="400" height="120" fill="' + g[2] + '"/>';
        items.forEach(function (it) {
          var sz = it.s / 100 * W, svg = B.pics.draw(it.k).replace(/<svg /, '<svg x="' + (it.x * W - sz / 2) + '" y="' + (it.y * H - sz * 0.62) + '" width="' + sz + '" height="' + sz + '" ').replace(/ class="pic"/, '').replace(/ focusable="false"/, '').replace(/ aria-hidden="true"/, '');
          out += svg;
        });
        out += '</svg>';
        saveToGallery(stage, 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(out));
      });
      var hint = h('div', { class: 'sc-hint', text: 'اختر ملصقًا ثم المس المشهد لتلصقه' });
      stage.appendChild(h('div', { class: 'sc-wrap' }, bgRow, board, hint, tray, h('div', { class: 'sc-actions' }, undo, clr, save)));
    },
    destroy: function () {}
  };

  /* ═════════ إبداعاتي (المعرض) ═════════ */
  B.free.gallery = {
    open: function (ctx) {
      var stage = ctx.stage, list = B.gallery.list();
      stage.classList.add('g-stage', 'gl-stage');
      var grid = h('div', { class: 'gl-grid scrollable' });
      var big = h('div', { class: 'gl-big', style: { display: 'none' } });
      if (!list.length) {
        grid.classList.add('empty');
        grid.appendChild(h('div', { class: 'gl-empty' }, h('div', { class: 'gl-empty-ic', html: art.toolSave() }), h('div', { text: B.S.create.galleryEmpty })));
      }
      function render() { stage.innerHTML = ''; B.free.gallery.open(ctx); }
      list.slice().reverse().forEach(function (src, i) {
        var idx = list.length - 1 - i;
        var card = h('div', { class: 'gl-card', role: 'button', tabindex: '0' }, h('img', { src: src, alt: '' }));
        UI.anim(card, [{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'none' }], { dur: 400, delay: Math.min(1200, i * 50), easing: UI.SPRING, fill: 'backwards' });
        card.addEventListener('click', function () {
          big.innerHTML = '';
          var del = h('button', { class: 'gl-del', type: 'button', 'aria-label': B.S.create.del, html: art.trash() }, h('small', { text: B.S.create.del }));
          var ask = h('div', { class: 'gl-ask', style: { display: 'none' } }, h('b', { text: B.S.create.delAsk }),
            h('div', { class: 'gl-ask-row' }, h('button', { class: 'gl-yes', type: 'button', text: B.S.create.delYes }), h('button', { class: 'gl-no', type: 'button', text: B.S.create.delNo })));
          del.addEventListener('click', function (e) { e.stopPropagation(); del.style.display = 'none'; ask.style.display = ''; });
          ask.querySelector('.gl-no').addEventListener('click', function (e) { e.stopPropagation(); ask.style.display = 'none'; del.style.display = ''; });
          ask.querySelector('.gl-yes').addEventListener('click', function (e) { e.stopPropagation(); B.gallery.remove(idx); if (B.audio) B.audio.play('sweep'); render(); });
          big.appendChild(h('img', { src: src, alt: '' })); big.appendChild(del); big.appendChild(ask);
          big.style.display = ''; UI.anim(big, [{ opacity: 0, transform: 'scale(.8)' }, { opacity: 1, transform: 'none' }], { dur: 350, easing: UI.SPRING, fill: 'none' });
          if (B.audio) B.audio.play('pick');
        });
        grid.appendChild(card);
      });
      big.addEventListener('click', function () { big.style.display = 'none'; });
      stage.appendChild(grid); stage.appendChild(big);
    },
    destroy: function () {}
  };
})();
