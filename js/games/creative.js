/* القسم الإبداعي: لعب حرّ بلا هدف ولا جولات ولا مصابيح.
   ١) ورشة الأشكال: قطع ملوّنة شفافة مثل المكعبات المغناطيسية — تُضاف بنقرة، وتُسحب، وتدور بنقرة.
   ٢) لوحة التلوين: رسمات بمناطق، تختار لوناً ثم تنقر المنطقة.
   عقد اللعب الحر (B.free[id]): open(ctx) و destroy(). */
(function () {
  'use strict';
  var B = (window.Bustan = window.Bustan || {});
  var UI = B.UI, h = UI.h, art = B.art;
  B.free = B.free || {};

  var COLS = ['#F2658E', '#FFC83D', '#2DBE7E', '#3D8BFD', '#8E5CF0', '#FF8A3D', '#5CC8FF', '#F0485A'];

  /* ═════════ ورشة الأشكال ═════════ */
  var SHAPES = {
    square: '<rect x="6" y="6" width="88" height="88" rx="10"/>',
    triangle: '<polygon points="50,8 94,92 6,92"/>',
    rect: '<rect x="6" y="28" width="88" height="44" rx="8"/>',
    circle: '<circle cx="50" cy="50" r="44"/>',
    diamond: '<polygon points="50,4 96,50 50,96 4,50"/>'
  };
  function piece(shape, col) {
    // قطعة شفافة بحدّ لامع كالمكعب المغناطيسي
    return '<svg viewBox="0 0 100 100"><g fill="' + col + '" fill-opacity=".72" stroke="' + col + '" stroke-width="6" stroke-linejoin="round">' + SHAPES[shape] + '</g>' +
      '<g fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="2.5" stroke-linejoin="round" transform="translate(12 12) scale(.76)">' + SHAPES[shape] + '</g></svg>';
  }

  var ws = null;
  B.free.workshop = {
    open: function (ctx) {
      var stage = ctx.stage, vp = UI.vp();
      stage.classList.add('g-stage', 'ws-stage');
      var size = vp.tablet ? 120 : 88, colorIdx = 0, z = 1;
      var canvas = h('div', { class: 'ws-canvas' });
      var tray = h('div', { class: 'g-tray ws-tray' });
      ws = { pieces: [] };

      function add(shape, btn) {
        var r = canvas.getBoundingClientRect();
        var x = r.width / 2 - size / 2 + (Math.random() - 0.5) * r.width * 0.5;
        var y = r.height / 2 - size / 2 + (Math.random() - 0.5) * r.height * 0.4;
        var el = h('div', { class: 'ws-piece', style: { width: size + 'px', height: size + 'px', zIndex: ++z }, html: piece(shape, COLS[colorIdx]) });
        var p = { el: el, x: x, y: y, rot: 0 };
        place(p);
        canvas.appendChild(el);
        ws.pieces.push(p);
        if (ws.pieces.length > 40) { var old = ws.pieces.shift(); old.el.remove(); }
        UI.anim(el.firstChild, [{ transform: 'scale(.2)' }, { transform: 'scale(1.15)' }, { transform: 'scale(1)' }], { dur: 420, easing: UI.SPRING, fill: 'none' });
        if (B.audio) B.audio.play('pop');
        drag(p);
      }
      function place(p) { p.el.style.transform = 'translate3d(' + p.x + 'px,' + p.y + 'px,0) rotate(' + p.rot + 'deg)'; }
      function drag(p) {
        var sx, sy, ox, oy, moved, active = false;
        p.el.addEventListener('pointerdown', function (e) {
          active = true; moved = false; sx = e.clientX; sy = e.clientY; ox = p.x; oy = p.y;
          p.el.style.zIndex = ++z; p.el.classList.add('lift');
          try { p.el.setPointerCapture(e.pointerId); } catch (err) {}
        });
        p.el.addEventListener('pointermove', function (e) {
          if (!active) return;
          var dx = e.clientX - sx, dy = e.clientY - sy;
          if (Math.abs(dx) + Math.abs(dy) > 8) moved = true;
          p.x = ox + dx; p.y = oy + dy; place(p);
        });
        function end() {
          if (!active) return;
          active = false; p.el.classList.remove('lift');
          var r = canvas.getBoundingClientRect();
          if (moved) { // التصاق مغناطيسي بشبكة خفية
            var g = size / 4;
            p.x = Math.max(-size * 0.3, Math.min(r.width - size * 0.7, Math.round(p.x / g) * g));
            p.y = Math.max(-size * 0.3, Math.min(r.height - size * 0.7, Math.round(p.y / g) * g));
            if (B.audio) B.audio.play('place');
          } else { p.rot += 45; if (B.audio) B.audio.play('pick'); } // نقرة بلا سحب: دوران
          p.el.classList.add('snap'); place(p);
          setTimeout(function () { p.el.classList.remove('snap'); }, 320);
        }
        p.el.addEventListener('pointerup', end);
        p.el.addEventListener('pointercancel', end);
      }

      // شريط الأدوات: زر اللون ثم الأشكال الخمسة ثم المكنسة
      var shapeBtns = [];
      var colorBtn = h('button', { class: 'g-choice ws-color', type: 'button', 'aria-label': B.S.create.color }, h('span', { class: 'ws-dot' }));
      function paint() {
        colorBtn.firstChild.style.background = COLS[colorIdx];
        shapeBtns.forEach(function (b) { b.innerHTML = piece(b.getAttribute('data-shape'), COLS[colorIdx]); });
      }
      UI.bindPress(colorBtn, function () { colorIdx = (colorIdx + 1) % COLS.length; paint(); if (B.audio) B.audio.play('pick'); });
      tray.appendChild(colorBtn);
      Object.keys(SHAPES).forEach(function (s) {
        var b = h('button', { class: 'g-choice ws-shape', type: 'button', 'data-shape': s });
        UI.bindPress(b, function () { add(s, b); });
        shapeBtns.push(b); tray.appendChild(b);
      });
      var broom = h('button', { class: 'g-choice ws-broom', type: 'button', 'aria-label': B.S.create.clear, html: art.svg('0 0 100 100', '<path d="M62 8L44 52" stroke="#8A5A33" stroke-width="9" stroke-linecap="round"/><path d="M26 50L62 60L56 92Q36 96 16 84Z" fill="#FFD34E" stroke="#E2A21B" stroke-width="4" stroke-linejoin="round"/><path d="M30 64l-4 22M42 66l-2 24M52 68l-1 22" stroke="#E2A21B" stroke-width="3" stroke-linecap="round"/>') });
      UI.bindPress(broom, function () {
        if (!ws.pieces.length) return;
        if (B.audio) B.audio.play('sweep');
        ws.pieces.forEach(function (p, i) {
          UI.anim(p.el, [{ opacity: 1 }, { opacity: 0, transform: p.el.style.transform + ' translateY(80px) scale(.6)' }], { dur: 450, delay: i * 20 }).then(function () { p.el.remove(); });
        });
        ws.pieces = [];
      });
      tray.appendChild(broom);
      paint();
      stage.appendChild(canvas);
      stage.appendChild(tray);
    },
    destroy: function () { ws = null; }
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
      stage.appendChild(h('div', { class: 'g-main' }, paper));
      stage.appendChild(tray);
      show();
    },
    destroy: function () { cl = null; }
  };
})();
