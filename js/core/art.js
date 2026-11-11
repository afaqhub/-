/* مكتبة الرسوم: كل شيء SVG مرسوم في الكود، بلا صور خارجية.
   كل دالة تُرجع نص SVG. الشخصيات: حيوانات لطيفة مستديرة وأشياء وطبيعة.
   (لا صور لبالغين إطلاقاً.) */
(function () {
  'use strict';
  var B = (window.Bustan = window.Bustan || {});

  var INK = '#1F2A5A';
  var EYE = '#2B2340';

  function svg(vb, inner, cls, attrs) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + vb + '"' +
      (cls ? ' class="' + cls + '"' : '') + (attrs ? ' ' + attrs : '') +
      ' focusable="false" aria-hidden="true">' + inner + '</svg>';
  }

  /* ───────── الوجوه ───────── */
  function eyes(x1, x2, y, r, closed) {
    if (closed) {
      return '<path d="M' + (x1 - r) + ' ' + y + 'q' + r + ' ' + r + ' ' + (2 * r) + ' 0M' +
        (x2 - r) + ' ' + y + 'q' + r + ' ' + r + ' ' + (2 * r) + ' 0" stroke="' + EYE +
        '" stroke-width="3" fill="none" stroke-linecap="round"/>';
    }
    return '<circle cx="' + x1 + '" cy="' + y + '" r="' + r + '" fill="' + EYE + '"/>' +
      '<circle cx="' + x2 + '" cy="' + y + '" r="' + r + '" fill="' + EYE + '"/>' +
      '<circle cx="' + (x1 + r * 0.35) + '" cy="' + (y - r * 0.35) + '" r="' + (r * 0.33) + '" fill="#fff"/>' +
      '<circle cx="' + (x2 + r * 0.35) + '" cy="' + (y - r * 0.35) + '" r="' + (r * 0.33) + '" fill="#fff"/>';
  }
  function cheeks(x1, x2, y) {
    return '<circle cx="' + x1 + '" cy="' + y + '" r="5.5" fill="#FF9DB3" opacity=".6"/>' +
      '<circle cx="' + x2 + '" cy="' + y + '" r="5.5" fill="#FF9DB3" opacity=".6"/>';
  }

  /* ───────── الحيوانات (مربع ١٠٠×١٠٠) ───────── */
  var ANIMALS = {
    bear: function (c) {
      return '<circle cx="24" cy="27" r="13" fill="#9A6540"/><circle cx="24" cy="27" r="7" fill="#E9B68E"/>' +
        '<circle cx="76" cy="27" r="13" fill="#9A6540"/><circle cx="76" cy="27" r="7" fill="#E9B68E"/>' +
        '<circle cx="50" cy="55" r="36" fill="#B67B4D"/>' +
        '<ellipse cx="50" cy="68" rx="17" ry="13" fill="#F3D6B0"/>' +
        '<ellipse cx="50" cy="61" rx="6.5" ry="4.8" fill="#3A2A3F"/>' +
        '<path d="M50 65.5v4M42.5 71.5q7.5 6 15 0" stroke="#3A2A3F" stroke-width="2.6" fill="none" stroke-linecap="round"/>' +
        eyes(36, 64, 47, 4.8, c) + cheeks(25, 75, 62);
    },
    rabbit: function (c) {
      return '<ellipse cx="35" cy="24" rx="9.5" ry="23" fill="#fff" stroke="#D5CEEA" stroke-width="2.5"/>' +
        '<ellipse cx="35" cy="26" rx="4.5" ry="15" fill="#FFB8CC"/>' +
        '<ellipse cx="65" cy="24" rx="9.5" ry="23" fill="#fff" stroke="#D5CEEA" stroke-width="2.5"/>' +
        '<ellipse cx="65" cy="26" rx="4.5" ry="15" fill="#FFB8CC"/>' +
        '<circle cx="50" cy="61" r="32" fill="#fff" stroke="#D5CEEA" stroke-width="2.5"/>' +
        '<ellipse cx="50" cy="65" rx="4.5" ry="3.4" fill="#FF8FAE"/>' +
        '<path d="M50 68.5v3.5M44 73q6 5 12 0" stroke="#7C6A9A" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
        eyes(37, 63, 57, 4.6, c) + cheeks(27, 73, 69);
    },
    cat: function (c) {
      return '<path d="M17 44L21 11L46 29Z" fill="#F08A3C" stroke="#F08A3C" stroke-width="6" stroke-linejoin="round"/>' +
        '<path d="M83 44L79 11L54 29Z" fill="#F08A3C" stroke="#F08A3C" stroke-width="6" stroke-linejoin="round"/>' +
        '<path d="M25 36L26 22L38 30Z" fill="#FFB8CC"/><path d="M75 36L74 22L62 30Z" fill="#FFB8CC"/>' +
        '<circle cx="50" cy="57" r="34" fill="#FFA24D"/>' +
        '<path d="M50 25v9M40 27l2 8M60 27l-2 8" stroke="#E57B2A" stroke-width="3.5" stroke-linecap="round"/>' +
        '<ellipse cx="50" cy="69" rx="14" ry="10" fill="#FFE2C2"/>' +
        '<path d="M46 63h8l-4 5z" fill="#FF7FA0" stroke="#FF7FA0" stroke-width="2" stroke-linejoin="round"/>' +
        '<path d="M50 68v3M43 72q3.5 4 7 0q3.5 4 7 0" stroke="#7A4A2B" stroke-width="2.2" fill="none" stroke-linecap="round"/>' +
        '<path d="M13 62l15 3M13 72l15-2M87 62l-15 3M87 72l-15-2" stroke="#B85F1E" stroke-width="2" opacity=".55" stroke-linecap="round"/>' +
        eyes(37, 63, 52, 4.8, c);
    },
    lamb: function (c) {
      var wool = 'fill="#F7F3FF" stroke="#D7CFF0" stroke-width="2.5"';
      return '<circle cx="26" cy="40" r="16" ' + wool + '/><circle cx="74" cy="40" r="16" ' + wool + '/>' +
        '<circle cx="22" cy="60" r="14" ' + wool + '/><circle cx="78" cy="60" r="14" ' + wool + '/>' +
        '<ellipse cx="17" cy="57" rx="10" ry="5.5" fill="#F6CBA7" transform="rotate(-20 17 57)"/>' +
        '<ellipse cx="83" cy="57" rx="10" ry="5.5" fill="#F6CBA7" transform="rotate(20 83 57)"/>' +
        '<ellipse cx="50" cy="62" rx="24" ry="28" fill="#F6CBA7"/>' +
        '<circle cx="36" cy="33" r="13" ' + wool + '/><circle cx="50" cy="29" r="14" ' + wool + '/><circle cx="64" cy="33" r="13" ' + wool + '/>' +
        '<ellipse cx="50" cy="68" rx="4.6" ry="3.4" fill="#E8809A"/>' +
        '<path d="M50 71.5v3M44 76q6 5 12 0" stroke="#7A4A5A" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
        eyes(39, 61, 58, 4.4, c) + cheeks(31, 69, 69);
    },
    duck: function (c) {
      return '<circle cx="50" cy="55" r="36" fill="#FFD84A"/>' +
        '<path d="M44 22q-2-12 8-12q-3 6 2 10" fill="#FFD84A" stroke="#FFD84A" stroke-width="3" stroke-linejoin="round"/>' +
        '<ellipse cx="50" cy="67" rx="17" ry="10.5" fill="#FF9A3D"/>' +
        '<path d="M36 66q14 6 28 0" stroke="#E57B1F" stroke-width="2" fill="none" stroke-linecap="round"/>' +
        '<circle cx="45" cy="62" r="1.8" fill="#C25F12"/><circle cx="55" cy="62" r="1.8" fill="#C25F12"/>' +
        eyes(36, 64, 46, 4.8, c) + cheeks(23, 77, 58);
    },
    frog: function (c) {
      var eyeBits = c
        ? '<path d="M22 36q8 8 16 0M62 36q8 8 16 0" stroke="' + EYE + '" stroke-width="3" fill="none" stroke-linecap="round"/>'
        : '<circle cx="30" cy="34" r="10" fill="#fff"/><circle cx="70" cy="34" r="10" fill="#fff"/>' +
          '<circle cx="31" cy="35" r="5.5" fill="' + EYE + '"/><circle cx="69" cy="35" r="5.5" fill="' + EYE + '"/>' +
          '<circle cx="33" cy="33" r="1.8" fill="#fff"/><circle cx="71" cy="33" r="1.8" fill="#fff"/>';
      return '<ellipse cx="50" cy="62" rx="40" ry="31" fill="#5ED38A"/>' +
        '<circle cx="30" cy="34" r="15" fill="#5ED38A"/><circle cx="70" cy="34" r="15" fill="#5ED38A"/>' +
        eyeBits +
        '<path d="M24 66q26 22 52 0" stroke="#2F8F57" stroke-width="3.4" fill="none" stroke-linecap="round"/>' +
        '<circle cx="45" cy="52" r="1.8" fill="#2F8F57"/><circle cx="55" cy="52" r="1.8" fill="#2F8F57"/>' +
        cheeks(22, 78, 66);
    }
  };
  var ANIMAL_NAMES = ['bear', 'rabbit', 'cat', 'lamb', 'duck', 'frog'];

  function animal(name, opts) {
    opts = opts || {};
    var fn = ANIMALS[name] || ANIMALS.bear;
    return svg('0 0 100 100', '<g class="breathe">' + fn(opts.sleep) + '</g>', 'animal animal-' + name);
  }

  /* ناظر المحطة: بومة بقبعة (مربع ١٠٠×١١٠) */
  function owl(opts) {
    opts = opts || {};
    var c = opts.sleep;
    var eyeBits = c
      ? '<path d="M24 52q11 10 22 0M54 52q11 10 22 0" stroke="' + EYE + '" stroke-width="3.4" fill="none" stroke-linecap="round"/>'
      : '<circle cx="35" cy="52" r="13" fill="#fff"/><circle cx="65" cy="52" r="13" fill="#fff"/>' +
        '<circle cx="37" cy="53" r="6.5" fill="' + EYE + '"/><circle cx="63" cy="53" r="6.5" fill="' + EYE + '"/>' +
        '<circle cx="39.5" cy="50.5" r="2.2" fill="#fff"/><circle cx="65.5" cy="50.5" r="2.2" fill="#fff"/>';
    var inner =
      '<ellipse cx="38" cy="104" rx="9" ry="4.5" fill="#FFA63D"/><ellipse cx="62" cy="104" rx="9" ry="4.5" fill="#FFA63D"/>' +
      '<g class="breathe">' +
      '<ellipse cx="50" cy="66" rx="36" ry="38" fill="#7E6BD6"/>' +
      '<ellipse cx="14" cy="72" rx="9" ry="22" fill="#6A57C4" transform="rotate(8 14 72)"/>' +
      '<ellipse cx="86" cy="72" rx="9" ry="22" fill="#6A57C4" transform="rotate(-8 86 72)"/>' +
      '<ellipse cx="50" cy="78" rx="22" ry="22" fill="#E3DCFF"/>' +
      '<path d="M40 76q3 4 6 0M54 76q3 4 6 0M47 87q3 4 6 0" stroke="#B8AAF0" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
      eyeBits +
      '<path d="M44 62l6 9l6-9z" fill="#FFA63D" stroke="#FFA63D" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M20 40Q50 2 80 40Z" fill="' + INK + '"/>' +
      '<rect x="16" y="36" width="68" height="9" rx="4.5" fill="#2E3B7E"/>' +
      '<circle cx="50" cy="26" r="6" fill="#FFD34E"/>' +
      '</g>';
    return svg('0 0 100 110', inner, 'animal owl');
  }

  /* ───────── الرموز (على لوحات الإشارة والبطاقات) ───────── */
  var COLORS = {
    red:    { fill: '#F0485A', stroke: '#C22E40' },
    blue:   { fill: '#3D8BFD', stroke: '#2468D1' },
    green:  { fill: '#2DBE7E', stroke: '#1C8F5C' },
    yellow: { fill: '#FFC83D', stroke: '#D9A011' },
    purple: { fill: '#8E5CF0', stroke: '#6B3CC9' },
    orange: { fill: '#FF8A3D', stroke: '#D96A1F' }
  };
  var COLOR_KEYS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
  var SHAPES = ['star', 'circle', 'square', 'triangle', 'heart', 'diamond'];

  function starPoints() {
    var pts = [], cx = 50, cy = 54, ro = 40, ri = 18;
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5;
      var r = i % 2 === 0 ? ro : ri;
      pts.push((cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a)).toFixed(1));
    }
    return pts.join(' ');
  }
  var STAR = starPoints();

  /* رمز في صندوق ١٠٠×١٠٠ (عنصر g) */
  function symbolG(sym) {
    var c = COLORS[sym.color];
    var a = 'fill="' + c.fill + '" stroke="' + c.stroke + '" stroke-width="6" stroke-linejoin="round"';
    var s;
    switch (sym.shape) {
      case 'star': s = '<polygon points="' + STAR + '" ' + a + '/>'; break;
      case 'circle': s = '<circle cx="50" cy="50" r="33" ' + a + '/>'; break;
      case 'square': s = '<rect x="18" y="18" width="64" height="64" rx="12" ' + a + '/>'; break;
      case 'triangle': s = '<polygon points="50,16 86,80 14,80" ' + a + '/>'; break;
      case 'heart': s = '<path d="M50 84C12 58 14 24 34 24C44 24 50 31 50 35C50 31 56 24 66 24C86 24 88 58 50 84Z" ' + a + '/>'; break;
      default: s = '<polygon points="50,12 86,50 50,88 14,50" ' + a + '/>'; // معين
    }
    // لمعة صغيرة تعطي إحساس الحلوى
    return '<g>' + s + '<ellipse cx="38" cy="36" rx="6" ry="3.2" fill="#fff" opacity=".55" transform="rotate(-30 38 36)"/></g>';
  }

  function symbol(sym, cls) {
    return svg('0 0 100 100', symbolG(sym), cls || 'symbol');
  }

  /* خط مائل يعني «عدا هذا» (بلون الحبر لا الأحمر) */
  function symbolNot(sym, cls) {
    return svg('0 0 100 100',
      '<g opacity=".55">' + symbolG(sym) + '</g>' +
      '<circle cx="50" cy="50" r="42" fill="none" stroke="' + INK + '" stroke-width="7" stroke-linecap="round"/>' +
      '<path d="M20 80L80 20" stroke="' + INK + '" stroke-width="8" stroke-linecap="round"/>', cls || 'symbol');
  }

  /* عمود الإشارة (٠ ٠ ١٠٠ ٢٠٠): لوحة في الأعلى وساق تحتها */
  function pole(sym) {
    var face = sym
      ? '<g transform="translate(15 13) scale(.7)">' + symbolG(sym) + '</g>'
      : '<circle cx="50" cy="48" r="5" fill="#DCE6F8"/>';
    return svg('0 0 100 200',
      '<rect x="44" y="84" width="12" height="116" rx="4" fill="#3A4789"/>' +
      '<rect x="40" y="86" width="20" height="8" rx="4" fill="' + INK + '"/>' +
      '<rect x="6" y="4" width="88" height="88" rx="20" fill="#FAFCFF" stroke="' + INK + '" stroke-width="5"/>' +
      '<rect x="12" y="10" width="76" height="76" rx="15" fill="none" stroke="#DCE6F8" stroke-width="2"/>' +
      face, 'pole-svg');
  }

  /* علامة استفهام داخل فقاعة */
  function bubbleQ() {
    return svg('0 0 80 90',
      '<path d="M40 4C20 4 6 17 6 34s14 30 34 30c3 0 6 0 9-1l14 18l-2-20c7-6 11-15 11-27C72 17 60 4 40 4Z" fill="#FAFCFF" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/>' +
      '<path d="M28 28q0-11 12-11t12 10q0 7-8 11q-4 2-4 7" fill="none" stroke="' + INK + '" stroke-width="6" stroke-linecap="round"/>' +
      '<circle cx="40" cy="52" r="4.2" fill="' + INK + '"/>', 'bubble-q');
  }

  /* ───────── القطار ───────── */
  function wheel(cx, cy, r) {
    return '<g class="wheel"><circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + INK + '"/>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r * 0.58) + '" fill="#8FA0D8"/>' +
      '<path d="M' + (cx - r * 0.5) + ' ' + cy + 'h' + r + 'M' + cx + ' ' + (cy - r * 0.5) + 'v' + r + '" stroke="#FAFCFF" stroke-width="2.6" stroke-linecap="round"/>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="2.4" fill="' + INK + '"/></g>';
  }

  function loco() {
    return svg('0 0 130 100',
      '<rect x="16" y="14" width="16" height="24" rx="4" fill="' + INK + '"/>' +
      '<rect x="11" y="9" width="26" height="10" rx="5" fill="#3A4789"/>' +
      '<rect x="6" y="34" width="78" height="44" rx="20" fill="#19B394"/>' +
      '<rect x="44" y="34" width="8" height="44" fill="#0B8269"/>' +
      '<path d="M55 34a11 11 0 0 1 22 0z" fill="#FFD34E"/>' +
      '<rect x="78" y="18" width="46" height="62" rx="10" fill="#FFD34E"/>' +
      '<rect x="74" y="12" width="54" height="11" rx="5.5" fill="' + INK + '"/>' +
      '<rect x="88" y="28" width="26" height="22" rx="7" fill="#EAF6FF" stroke="' + INK + '" stroke-width="3"/>' +
      '<rect x="2" y="74" width="126" height="10" rx="5" fill="' + INK + '"/>' +
      '<circle cx="9" cy="52" r="4.5" fill="#FFF3B0" stroke="#E2A21B" stroke-width="2"/>' +
      eyes(24, 40, 52, 4.2) + cheeks(18, 46, 62).replace(/r="5.5"/g, 'r="3.6"') +
      '<path d="M27 61q5 5 10 0" stroke="#0B5E4C" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
      wheel(24, 90, 10) + wheel(54, 90, 10) + wheel(102, 87, 13),
      'car loco-svg');
  }

  var WAGON_COLORS = [
    { fill: '#FFD34E', deep: '#E2A21B' },
    { fill: '#F2658E', deep: '#C23C69' },
    { fill: '#3D8BFD', deep: '#2468D1' },
    { fill: '#8E5CF0', deep: '#6B3CC9' },
    { fill: '#FF8A3D', deep: '#D96A1F' }
  ];

  /* العربة: النافذة هي موضع الراكب (x14 y34 w62 h46 من ٩٠×١١٠) */
  function wagon(i) {
    var c = WAGON_COLORS[((i % 5) + 5) % 5];
    return svg('0 0 90 110',
      '<rect x="4" y="22" width="82" height="68" rx="14" fill="' + c.fill + '"/>' +
      '<rect x="2" y="16" width="86" height="12" rx="6" fill="' + c.deep + '"/>' +
      '<rect x="14" y="34" width="62" height="46" rx="12" fill="#EAF6FF" stroke="' + c.deep + '" stroke-width="3"/>' +
      '<rect x="2" y="86" width="86" height="9" rx="4.5" fill="' + INK + '"/>' +
      wheel(24, 99, 9) + wheel(66, 99, 9), 'car wagon-svg');
  }

  /* ───────── أشياء ومناظر ───────── */
  /* كفّ دب لطيف يضغط (بدل يد بإصبع): نقطة اللمس في منتصف الأعلى، والذراع تمتد للأسفل */
  function hand() {
    var BR = '#B67B4D', PAD = '#F3C9A0', arm = '<rect x="26" y="46" width="36" height="50" rx="18"/>',
      head = '<circle cx="44" cy="32" r="28"/>';
    return svg('0 0 88 96',
      '<g fill="' + INK + '" stroke="' + INK + '" stroke-width="7" stroke-linejoin="round">' + arm + head + '</g>' +
      '<g fill="' + BR + '">' + arm + head + '</g>' +
      '<ellipse cx="44" cy="38" rx="15" ry="12.5" fill="' + PAD + '"/>' +
      '<circle cx="23" cy="24" r="6.5" fill="' + PAD + '"/><circle cx="36" cy="13" r="6.5" fill="' + PAD + '"/>' +
      '<circle cx="52" cy="13" r="6.5" fill="' + PAD + '"/><circle cx="65" cy="24" r="6.5" fill="' + PAD + '"/>' +
      '<rect x="26" y="78" width="36" height="8" fill="#F2658E"/>', 'hand-svg');
  }

  function house() {
    return svg('0 0 48 48',
      '<path d="M6 24L24 8l18 16" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M11 22v18h26V22" fill="currentColor" opacity=".25"/>' +
      '<path d="M11 22v18h26V22" fill="none" stroke="currentColor" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>' +
      '<rect x="20" y="28" width="8" height="12" rx="3" fill="currentColor"/>', 'icon-svg');
  }

  /* علامة «تمّ»: دائرة خضراء بصح أبيض — تظهر فور اكتمال المطلوب */
  function check() {
    return svg('0 0 100 100', '<circle cx="50" cy="50" r="46" fill="#2DBE7E" stroke="#1C8F5C" stroke-width="5"/>' +
      '<path d="M28 52L44 67L73 36" fill="none" stroke="#fff" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>', 'check-svg');
  }

  function moonIcon() {
    return svg('0 0 48 48', '<path d="M30 6A19 19 0 1 0 42 32A15 15 0 0 1 30 6Z" fill="currentColor"/>', 'icon-svg');
  }
  function sunIcon() {
    return svg('0 0 48 48', '<circle cx="24" cy="24" r="9" fill="currentColor"/><path d="M24 4v6M24 38v6M4 24h6M38 24h6M10 10l4 4M34 34l4 4M10 38l4-4M34 14l4-4" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>', 'icon-svg');
  }
  function fullIcon() {
    return svg('0 0 48 48', '<path d="M6 18V6h12M30 6h12v12M42 30v12H30M18 42H6V30" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>', 'icon-svg');
  }
  function diceIcon() {
    return svg('0 0 48 48', '<rect x="6" y="6" width="36" height="36" rx="9" fill="currentColor"/><circle cx="17" cy="17" r="3.4" fill="#fff"/><circle cx="31" cy="17" r="3.4" fill="#fff"/><circle cx="24" cy="24" r="3.4" fill="#fff"/><circle cx="17" cy="31" r="3.4" fill="#fff"/><circle cx="31" cy="31" r="3.4" fill="#fff"/>', 'icon-svg');
  }
  /* أدوات الرسم: أيقونات واضحة */
  function mixIcon() { // دائرتان متداخلتان تتولد منهما ثالثة
    return svg('0 0 100 100', '<circle cx="36" cy="46" r="26" fill="#F0485A" opacity=".85"/><circle cx="64" cy="46" r="26" fill="#3D8BFD" opacity=".85"/><path d="M50 26a26 26 0 0 1 0 40a26 26 0 0 1 0-40Z" fill="#8E5CF0"/><path d="M30 84H70M60 76l10 8l-10 8" stroke="#1F2A5A" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>', 'tool-svg');
  }
  function sizeIcon() {
    return svg('0 0 100 100', '<circle cx="20" cy="54" r="8" fill="#1F2A5A"/><circle cx="46" cy="54" r="14" fill="#1F2A5A"/><circle cx="80" cy="54" r="20" fill="#1F2A5A"/>', 'tool-svg');
  }
  function eraserIcon() {
    return svg('0 0 100 100', '<g transform="rotate(-30 50 50)"><rect x="14" y="30" width="72" height="40" rx="10" fill="#FF9DB3" stroke="#C23C69" stroke-width="5"/><rect x="14" y="30" width="26" height="40" rx="10" fill="#8FD3F4" stroke="#2468D1" stroke-width="5"/></g>', 'tool-svg');
  }
  function broomIcon() {
    return svg('0 0 100 100', '<path d="M62 8L44 52" stroke="#8A5A33" stroke-width="9" stroke-linecap="round"/><path d="M26 50L62 60L56 92Q36 96 16 84Z" fill="#FFD34E" stroke="#E2A21B" stroke-width="4" stroke-linejoin="round"/><path d="M30 64l-4 22M42 66l-2 24M52 68l-1 22" stroke="#E2A21B" stroke-width="3" stroke-linecap="round"/>', 'tool-svg');
  }

  function pauseIcon() {
    return svg('0 0 48 48', '<rect x="13" y="10" width="8" height="28" rx="3" fill="currentColor"/><rect x="27" y="10" width="8" height="28" rx="3" fill="currentColor"/>', 'icon-svg');
  }
  function playIcon() {
    return svg('0 0 48 48', '<path d="M16 10L38 24L16 38Z" fill="currentColor" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>', 'icon-svg');
  }

  function replayIcon() {
    // يد صغيرة مع سهم تشغيل
    return svg('0 0 48 48',
      '<circle cx="24" cy="24" r="17" fill="none" stroke="currentColor" stroke-width="4.5"/>' +
      '<path d="M20 16l13 8-13 8z" fill="currentColor" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>', 'icon-svg');
  }

  function bulb() {
    return svg('0 0 32 44',
      '<circle class="glow" cx="16" cy="16" r="15"/>' +
      '<rect x="11" y="0" width="10" height="6" rx="2" fill="#3A4789"/>' +
      '<path class="glass" d="M16 4a11 11 0 0 1 7 19.6V28a3 3 0 0 1-3 3h-8a3 3 0 0 1-3-3v-4.4A11 11 0 0 1 16 4z"/>' +
      '<rect x="10.5" y="29" width="11" height="4.5" rx="2" fill="#3A4789"/>' +
      '<rect x="12" y="34" width="8" height="4" rx="2" fill="#3A4789"/>' +
      '<ellipse class="shine" cx="11.5" cy="12" rx="2.6" ry="4.2" transform="rotate(20 11.5 12)"/>', 'bulb-svg');
  }

  function cloud() {
    return svg('0 0 160 70',
      '<g fill="#FFFFFF" opacity=".95"><circle cx="45" cy="40" r="22"/><circle cx="76" cy="30" r="27"/><circle cx="108" cy="40" r="21"/>' +
      '<rect x="22" y="40" width="108" height="24" rx="12"/></g>', 'cloud-svg');
  }

  function moon() {
    return svg('0 0 100 100',
      '<path d="M62 8A42 42 0 1 0 92 72A34 34 0 1 1 62 8Z" fill="#FFF1A8"/>' +
      '<circle cx="36" cy="46" r="5" fill="#F2DC7A" opacity=".7"/><circle cx="48" cy="68" r="3.5" fill="#F2DC7A" opacity=".7"/>', 'moon-svg');
  }

  function sun() {
    return svg('0 0 120 120',
      '<circle cx="60" cy="60" r="56" fill="#FFF3B0" opacity=".35"/><circle cx="60" cy="60" r="40" fill="#FFE58A" opacity=".6"/>' +
      '<circle cx="60" cy="60" r="28" fill="#FFD34E"/>', 'sun-svg');
  }

  /* رموز النوم «ز ز» مرسومة كخطوط لا حروف */
  function zzz() {
    var z = function (x, y, k) {
      var d = 'M' + x + ' ' + y + 'h' + (8 * k) + 'l' + (-8 * k) + ' ' + (9 * k) + 'h' + (8 * k);
      return '<path d="' + d + '" fill="none" stroke="#3A4789" stroke-opacity=".55" stroke-width="' + (5.4 * k) + '" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<path d="' + d + '" fill="none" stroke="#FAFCFF" stroke-width="' + (2.8 * k) + '" stroke-linecap="round" stroke-linejoin="round"/>';
    };
    return svg('0 0 44 44', z(4, 30, 1) + z(17, 17, 1.2) + z(30, 4, 1.4), 'zzz-svg');
  }

  /* ───────── مناظر القطار (بلاطات قابلة للتكرار بسلاسة) ───────── */
  // تلّة دورية: مجموع جيوب بتردد صحيح فتتصل الحافتان
  function hillFn(w, base, waves) {
    return function (x) {
      var y = base;
      for (var j = 0; j < waves.length; j++) {
        var wv = waves[j];
        y -= wv.a * (Math.sin((2 * Math.PI * wv.k * x) / w + wv.p) + 1) / 2;
      }
      return y;
    };
  }
  function hillPath(w, h, fn) {
    var steps = Math.max(8, Math.ceil(w / 12)), d = 'M0 ' + h;
    for (var i = 0; i <= steps; i++) {
      var x = (i * w) / steps;
      d += 'L' + x.toFixed(1) + ' ' + fn(x).toFixed(1);
    }
    return d + 'L' + w + ' ' + h + 'Z';
  }

  function tree(x, y, s, col) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' +
      '<rect x="-4" y="-22" width="8" height="24" rx="3" fill="#6B4E86"/>' +
      '<circle cx="0" cy="-34" r="20" fill="' + col + '"/><circle cx="-12" cy="-24" r="13" fill="' + col + '"/><circle cx="12" cy="-24" r="13" fill="' + col + '"/></g>';
  }
  function bush(x, y, s, col) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' +
      '<circle cx="0" cy="-10" r="12" fill="' + col + '"/><circle cx="-13" cy="-4" r="9" fill="' + col + '"/><circle cx="13" cy="-4" r="9" fill="' + col + '"/></g>';
  }
  function flower(x, y, col) {
    return '<g transform="translate(' + x + ' ' + y + ')"><rect x="-1.2" y="-14" width="2.4" height="14" fill="#2A9B6C"/>' +
      '<circle cx="0" cy="-17" r="5" fill="' + col + '"/><circle cx="0" cy="-17" r="2" fill="#FFF3B0"/></g>';
  }

  function fence(x, y, s) {
    var out = '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><rect x="-2" y="-16" width="64" height="4" rx="2" fill="#E9F3FF"/><rect x="-2" y="-8" width="64" height="4" rx="2" fill="#E9F3FF"/>';
    for (var i = 0; i < 4; i++) out += '<rect x="' + (i * 18 - 3) + '" y="-22" width="7" height="24" rx="3" fill="#FAFCFF" stroke="#C9D8F2" stroke-width="1.5"/>';
    return out + '</g>';
  }

  /* kind: far | mid | clouds | fore | ties */
  function sceneTile(kind, w, h) {
    var s = '', fn;
    if (kind === 'far') {
      fn = hillFn(w, h * 0.78, [{ a: h * 0.42, k: 2, p: 0.6 }, { a: h * 0.12, k: 5, p: 2.0 }]);
      s = '<path d="' + hillPath(w, h, fn) + '" fill="#A5E3D5"/>';
    } else if (kind === 'mid') {
      fn = hillFn(w, h * 0.9, [{ a: h * 0.4, k: 3, p: 1.7 }, { a: h * 0.1, k: 7, p: 0.4 }]);
      s = '<path d="' + hillPath(w, h, fn) + '" fill="#5CCBAE"/>';
      var at = function (f) { return fn(w * f) + 4; };
      s += tree(w * 0.1, at(0.1), 1.1, '#2FA886') + tree(w * 0.17, at(0.17), 0.8, '#3DB993') +
        tree(w * 0.5, at(0.5), 1.25, '#2FA886') + bush(w * 0.68, at(0.68), 1.2, '#3DB993') +
        tree(w * 0.86, at(0.86), 0.95, '#2FA886') + bush(w * 0.33, at(0.33), 1, '#3DB993');
    } else if (kind === 'clouds') {
      var c = '<g transform="translate(%X %Y) scale(%S)">' + cloud().replace(/<svg[^>]*>|<\/svg>/g, '') + '</g>';
      s = c.replace('%X', w * 0.05).replace('%Y', h * 0.15).replace('%S', 0.9) +
        c.replace('%X', w * 0.42).replace('%Y', h * 0.45).replace('%S', 0.6) +
        c.replace('%X', w * 0.72).replace('%Y', h * 0.1).replace('%S', 0.75);
    } else if (kind === 'fore') {
      var cols = ['#FFD34E', '#F2658E', '#FAFCFF', '#B79BFF'];
      for (var i = 0; i < 12; i++) {
        s += flower(w * (0.03 + i * 0.082 + (i % 2) * 0.02), h * (0.5 + (i % 4) * 0.14), cols[i % 4]).replace('<g ', '<g ').replace('translate(', 'translate(');
      }
      s += bush(w * 0.22, h * 0.98, 1.5, '#1F9C7D') + bush(w * 0.7, h * 0.95, 1.2, '#1F9C7D') + fence(w * 0.44, h * 0.9, 1.25) + bush(w * 0.93, h * 0.97, 1.3, '#27AE8B');
    } else if (kind === 'ties') {
      var n = 8, gap = w / n;
      for (var t = 0; t < n; t++) {
        s += '<rect x="' + (t * gap + gap * 0.2) + '" y="0" width="' + (gap * 0.5) + '" height="' + h + '" rx="3" fill="#3A4789"/>';
      }
    }
    return svg('0 0 ' + w + ' ' + h, s, 'scene-tile', 'width="' + w + '" height="' + h + '" preserveAspectRatio="none"');
  }

  /* ───────── أيقونات الألعاب للشاشة الرئيسية (١٠٠×١٠٠) ───────── */
  var GAME_ICONS = {
    train: function () {
      return '<rect x="14" y="30" width="46" height="34" rx="16" fill="#19B394"/><rect x="52" y="22" width="34" height="46" rx="9" fill="#FFD34E"/>' +
        '<rect x="48" y="16" width="42" height="9" rx="4.5" fill="' + INK + '"/><rect x="60" y="30" width="18" height="16" rx="5" fill="#EAF6FF" stroke="' + INK + '" stroke-width="2.5"/>' +
        '<rect x="20" y="14" width="12" height="20" rx="3" fill="' + INK + '"/><rect x="16" y="10" width="20" height="8" rx="4" fill="#3A4789"/>' +
        '<rect x="10" y="62" width="82" height="9" rx="4.5" fill="' + INK + '"/>' +
        '<circle cx="26" cy="76" r="9" fill="' + INK + '"/><circle cx="26" cy="76" r="4" fill="#8FA0D8"/><circle cx="72" cy="74" r="11" fill="' + INK + '"/><circle cx="72" cy="74" r="5" fill="#8FA0D8"/>' +
        eyes(28, 42, 46, 3.4) + '<path d="M30 53q5 4 10 0" stroke="#0B5E4C" stroke-width="2.2" fill="none" stroke-linecap="round"/>' +
        '<circle cx="86" cy="12" r="6" fill="#fff" opacity=".8"/><circle cx="76" cy="6" r="4" fill="#fff" opacity=".6"/>';
    },
    mirror: function () {
      var w = function (m) {
        return '<g transform="' + (m ? 'translate(100 0) scale(-1 1)' : '') + '">' +
          '<path d="M50 50C46 22 22 10 14 24C8 36 22 48 50 52Z" fill="#8E5CF0"/>' +
          '<path d="M50 54C28 56 14 70 22 82C30 92 46 80 50 56Z" fill="#F2658E"/>' +
          '<circle cx="28" cy="30" r="6" fill="#FFD34E"/><circle cx="30" cy="74" r="4.5" fill="#FFD34E"/></g>';
      };
      return w(0) + w(1) + '<rect x="46" y="28" width="8" height="44" rx="4" fill="' + INK + '"/>' +
        '<path d="M48 28Q42 14 34 12M52 28Q58 14 66 12" stroke="' + INK + '" stroke-width="3" fill="none" stroke-linecap="round"/>' +
        '<path d="M50 6v88" stroke="#fff" stroke-width="2.4" stroke-dasharray="3 5" opacity=".7"/>';
    },
    pattern: function () {
      var l = function (x, c, d) {
        return '<rect x="' + (x - 3) + '" y="12" width="6" height="12" rx="3" fill="' + INK + '"/>' +
          '<rect x="' + (x - 13) + '" y="22" width="26" height="8" rx="4" fill="' + INK + '"/>' +
          '<ellipse cx="' + x + '" cy="52" rx="15" ry="22" fill="' + c + '"/>' +
          '<rect x="' + (x - 13) + '" y="74" width="26" height="7" rx="3.5" fill="' + INK + '"/>' +
          '<ellipse cx="' + (x - 5) + '" cy="44" rx="3.5" ry="8" fill="#fff" opacity=".45"/>' +
          '<path d="M' + x + ' 81v10" stroke="' + d + '" stroke-width="3" stroke-linecap="round"/>';
      };
      return l(20, '#F2658E', '#F2658E') + l(50, '#FFD34E', '#FFD34E') + l(80, '#F2658E', '#F2658E');
    },
    firstsound: function () {
      return '<ellipse cx="46" cy="52" rx="32" ry="22" fill="#3D8BFD"/>' +
        '<path d="M70 52L94 34L90 52L94 70Z" fill="#2468D1" stroke="#2468D1" stroke-width="4" stroke-linejoin="round"/>' +
        '<ellipse cx="44" cy="60" rx="20" ry="9" fill="#9CC8FF"/>' +
        '<path d="M44 30q8-14 18-10q-4 8-8 12Z" fill="#2468D1"/>' +
        '<circle cx="28" cy="46" r="6" fill="#fff"/><circle cx="29" cy="47" r="3.2" fill="' + EYE + '"/>' +
        '<path d="M18 58q5 5 10 1" stroke="#1B4FA6" stroke-width="2.6" fill="none" stroke-linecap="round"/>' +
        '<circle cx="14" cy="26" r="5" fill="none" stroke="#fff" stroke-width="2.4"/><circle cx="24" cy="14" r="3.4" fill="none" stroke="#fff" stroke-width="2.2"/>';
    },
    bridge: function () {
      return '<path d="M0 74Q50 58 100 74V100H0Z" fill="#6FD1F4"/>' +
        '<path d="M4 66Q50 28 96 66" fill="none" stroke="#8E5CF0" stroke-width="12" stroke-linecap="round"/>' +
        '<path d="M4 66Q50 28 96 66" fill="none" stroke="#B79BFF" stroke-width="4" stroke-linecap="round" stroke-dasharray="1 9"/>' +
        '<rect x="8" y="62" width="10" height="26" rx="4" fill="#3A4789"/><rect x="82" y="62" width="10" height="26" rx="4" fill="#3A4789"/>' +
        '<g transform="translate(34 12) scale(.32)">' + ANIMALS.rabbit(false) + '</g>';
    }
  };

  GAME_ICONS.fruits = function () {
    return '<circle cx="34" cy="30" r="15" fill="#F0485A"/><circle cx="60" cy="24" r="15" fill="#F0485A"/><circle cx="48" cy="44" r="15" fill="#FF8A3D"/>' +
      '<path d="M34 16q2-8 8-10M60 10q2-6 8-8" stroke="#6B4E2E" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '<ellipse cx="28" cy="25" rx="4" ry="6" fill="#fff" opacity=".4"/>' +
      '<path d="M10 52H90L80 90Q79 94 74 94H26Q21 94 20 90Z" fill="#DDA86C" stroke="#8A5A33" stroke-width="4" stroke-linejoin="round"/>' +
      '<path d="M16 66H84M20 80H80M38 52L40 94M62 52L60 94" stroke="#B67B4D" stroke-width="3"/>' +
      '<rect x="6" y="46" width="88" height="10" rx="5" fill="#C9925A" stroke="#8A5A33" stroke-width="3"/>';
  };
  GAME_ICONS.letters = function () {
    return '<path d="M0 72Q50 60 100 72V100H0Z" fill="#6FD1F4"/>' +
      '<path d="M84 46L100 26V66Z" fill="#FF8A3D" stroke="#FF8A3D" stroke-width="5" stroke-linejoin="round"/>' +
      '<ellipse cx="50" cy="46" rx="40" ry="28" fill="#FF8A3D"/><ellipse cx="54" cy="48" rx="24" ry="21" fill="#FAFCFF"/>' +
      '<circle cx="20" cy="40" r="5" fill="#fff"/><circle cx="19" cy="40" r="3" fill="#2B2340"/>' +
      '<text x="54" y="60" text-anchor="middle" font-family="Tajawal, sans-serif" font-weight="800" font-size="34" fill="#1F2A5A">ب</text>' +
      '<circle cx="14" cy="16" r="5" fill="none" stroke="#5CC8FF" stroke-width="2.5"/><circle cx="26" cy="8" r="3" fill="none" stroke="#5CC8FF" stroke-width="2"/>';
  };
  GAME_ICONS.memory = function () {
    return '<rect x="8" y="14" width="38" height="50" rx="8" fill="#8E5CF0" transform="rotate(-10 27 39)"/>' +
      '<path d="M27 30q2 8 9 9q-7 1-9 9q-2-8-9-9q7-1 9-9z" fill="#FFF7C2" transform="rotate(-10 27 39)"/>' +
      '<rect x="44" y="30" width="44" height="58" rx="9" fill="#FAFCFF" stroke="#8E5CF0" stroke-width="4" transform="rotate(8 66 59)"/>' +
      '<g transform="translate(48 38) scale(.38) rotate(8 50 50)">' + ANIMALS.cat(false) + '</g>';
  };
  GAME_ICONS.shadows = function () {
    return '<g transform="translate(2 22) scale(.56)" fill="#1F2A5A" opacity=".85"><circle cx="24" cy="27" r="13"/><circle cx="76" cy="27" r="13"/><circle cx="50" cy="55" r="36"/></g>' +
      '<g transform="translate(42 22) scale(.56)">' + ANIMALS.bear(false) + '</g>';
  };
  GAME_ICONS.more = function () {
    var a = function (x, y) { return '<circle cx="' + x + '" cy="' + y + '" r="9" fill="#F0485A"/>'; };
    return '<ellipse cx="24" cy="74" rx="20" ry="7" fill="#C9D8F2"/>' + a(24, 62) +
      '<ellipse cx="68" cy="74" rx="28" ry="8" fill="#FFD34E"/>' + a(52, 62) + a(68, 62) + a(84, 62) + a(60, 46) + a(76, 46) + a(68, 30);
  };
  GAME_ICONS.odd = function () {
    var c = function (x, y, f) { return '<circle cx="' + x + '" cy="' + y + '" r="17" fill="' + f + '"/>'; };
    return c(28, 28, '#3D8BFD') + c(72, 28, '#3D8BFD') + c(28, 72, '#3D8BFD') +
      '<rect x="55" y="55" width="34" height="34" rx="8" fill="#FF8A3D"/><circle cx="72" cy="72" r="27" fill="none" stroke="#FFD34E" stroke-width="5" stroke-dasharray="6 6"/>';
  };
  GAME_ICONS.tracing = function () {
    return '<path d="M16 78Q20 24 56 40T86 20" fill="none" stroke="#EEF3FF" stroke-width="16" stroke-linecap="round"/>' +
      '<path d="M16 78Q20 24 56 40T86 20" fill="none" stroke="#8FA0D8" stroke-width="3" stroke-dasharray="2 8" stroke-linecap="round"/>' +
      '<path d="M16 78Q20 24 40 36" fill="none" stroke="#2DBE7E" stroke-width="9" stroke-linecap="round"/>' +
      '<circle cx="86" cy="20" r="9" fill="#F2658E"/><circle cx="86" cy="20" r="3.5" fill="#FFD34E"/>' +
      '<g transform="translate(24 56) scale(.3)">' + ANIMALS.duck(false) + '</g>';
  };
  GAME_ICONS.drawing = function () {
    return '<path d="M18 74Q30 30 50 52T84 24" fill="none" stroke="#F0485A" stroke-width="9" stroke-linecap="round"/>' +
      '<path d="M24 86Q46 60 62 80T90 56" fill="none" stroke="#3D8BFD" stroke-width="9" stroke-linecap="round"/>' +
      '<path d="M70 10L90 30L56 40Z" fill="#FFC83D" stroke="#E2A21B" stroke-width="4" stroke-linejoin="round"/><path d="M56 40L52 52L66 44Z" fill="#FFE5B8"/>';
  };
  GAME_ICONS.garden = function () {
    return '<path d="M0 78Q50 62 100 78V100H0Z" fill="#2DBE7E"/>' +
      '<rect x="22" y="42" width="8" height="30" rx="3" fill="#8A5A33"/><circle cx="26" cy="36" r="17" fill="#5ED38A"/><circle cx="22" cy="30" r="3.5" fill="#F0485A"/><circle cx="32" cy="40" r="3.5" fill="#F0485A"/>' +
      '<rect x="66" y="52" width="4" height="22" rx="2" fill="#1C8F5C"/><circle cx="68" cy="46" r="10" fill="#F2658E"/><circle cx="68" cy="46" r="4" fill="#FFD34E"/>' +
      '<g transform="translate(38 54) scale(.26)">' + ANIMALS.rabbit(false) + '</g>';
  };
  GAME_ICONS.feed = function () {
    return '<g transform="translate(14 8) scale(.62)">' + ANIMALS.rabbit(false) + '</g>' +
      '<path d="M62 60Q92 54 82 90Q60 96 52 70Z" fill="#FF8A3D" stroke="#D96A1F" stroke-width="3" stroke-linejoin="round"/><path d="M62 58Q58 44 50 42M66 58Q70 44 80 44" stroke="#2DBE7E" stroke-width="5" fill="none" stroke-linecap="round"/>';
  };
  GAME_ICONS.hide = function () {
    return '<g transform="translate(34 4) scale(.5)">' + ANIMALS.cat(false) + '</g>' +
      '<circle cx="30" cy="70" r="22" fill="#2DBE7E"/><circle cx="56" cy="62" r="26" fill="#3DD08A"/><circle cx="78" cy="72" r="19" fill="#2DBE7E"/><rect x="8" y="80" width="86" height="12" rx="6" fill="#1C8F5C"/>';
  };
  GAME_ICONS.vanish = function () {
    return '<circle cx="24" cy="40" r="16" fill="#F0485A"/><circle cx="62" cy="40" r="16" fill="#FFC83D"/>' +
      '<circle cx="42" cy="76" r="16" fill="none" stroke="#8FA0D8" stroke-width="4" stroke-dasharray="5 6"/><path d="M82 70q8-10 0-20M88 78q12-14 0-30" stroke="#8E5CF0" stroke-width="4" fill="none" stroke-linecap="round" opacity=".6"/>';
  };
  GAME_ICONS.order = function () {
    return '<circle cx="20" cy="76" r="9" fill="#3D8BFD"/><circle cx="42" cy="70" r="14" fill="#3D8BFD"/><circle cx="72" cy="60" r="22" fill="#3D8BFD"/>' +
      '<path d="M14 40H86M72 32l14 8l-14 8" stroke="#1F2A5A" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
  };
  GAME_ICONS.habitat = function () {
    return '<rect x="6" y="8" width="42" height="42" rx="10" fill="#5CC8FF"/><path d="M6 30Q16 24 27 30T48 30V50H6Z" fill="#3D8BFD"/>' +
      '<rect x="52" y="8" width="42" height="42" rx="10" fill="#BFEAD0"/><circle cx="66" cy="28" r="12" fill="#2DBE7E"/><rect x="63" y="34" width="5" height="12" fill="#8A5A33"/>' +
      '<g transform="translate(22 52) scale(.5)">' + ANIMALS.frog(false) + '</g>';
  };
  GAME_ICONS.workshop = function () {
    return '<rect x="10" y="50" width="38" height="38" rx="6" fill="#3D8BFD" fill-opacity=".8" stroke="#3D8BFD" stroke-width="4"/>' +
      '<polygon points="50,10 74,50 26,50" fill="#F2658E" fill-opacity=".8" stroke="#F2658E" stroke-width="4" stroke-linejoin="round"/>' +
      '<circle cx="72" cy="70" r="19" fill="#FFC83D" fill-opacity=".8" stroke="#FFC83D" stroke-width="4"/>' +
      '<polygon points="80,14 94,28 80,42 66,28" fill="#2DBE7E" fill-opacity=".8" stroke="#2DBE7E" stroke-width="4" stroke-linejoin="round"/>';
  };
  GAME_ICONS.coloring = function () {
    return '<path d="M50 10C24 10 8 28 8 50C8 76 30 90 48 90C58 90 58 80 54 74C50 66 56 60 66 62C82 64 92 56 92 44C92 24 74 10 50 10Z" fill="#FAFCFF" stroke="' + INK + '" stroke-width="4"/>' +
      '<circle cx="30" cy="42" r="8" fill="#F2658E"/><circle cx="48" cy="28" r="8" fill="#FFC83D"/><circle cx="70" cy="34" r="8" fill="#2DBE7E"/><circle cx="30" cy="64" r="8" fill="#3D8BFD"/>' +
      '<path d="M60 96L92 60" stroke="#8A5A33" stroke-width="7" stroke-linecap="round"/><path d="M86 54l10 10l-4-16Z" fill="#8E5CF0" stroke="#8E5CF0" stroke-width="4" stroke-linejoin="round"/>';
  };

  function gameIcon(id, sleeping) {
    var fn = GAME_ICONS[id] || GAME_ICONS.train;
    return svg('0 0 100 100', '<g class="icon-art">' + fn() + '</g>', 'game-icon' + (sleeping ? ' is-sleeping' : ''));
  }

  /* شارة المنطقتين: «وحدي» دبّ واحد، «معك» أرنب كبير وصغير */
  function zoneBadge(zone) {
    if (zone === 'solo') {
      return svg('0 0 100 100', '<g transform="translate(6 6) scale(.88)">' + ANIMALS.bear() + '</g>', 'zone-badge');
    }
    if (zone === 'create') {
      return svg('0 0 100 100', '<path d="M50 6q7 34 44 44q-37 10-44 44q-7-34-44-44q37-10 44-44z" fill="#FFD34E" stroke="#E2A21B" stroke-width="4" stroke-linejoin="round"/><circle cx="80" cy="18" r="7" fill="#F2658E"/><circle cx="18" cy="80" r="6" fill="#5CC8FF"/>', 'zone-badge');
    }
    return svg('0 0 120 100',
      '<g transform="translate(2 2) scale(.86)">' + ANIMALS.rabbit() + '</g>' +
      '<g transform="translate(70 40) scale(.52)">' + ANIMALS.rabbit() + '</g>', 'zone-badge');
  }

  /* شعار التطبيق (زاوية الشاشة الرئيسية): شتلة فوق تلّة */
  function logo() {
    return svg('0 0 64 64',
      '<circle cx="32" cy="32" r="30" fill="#FFD34E"/>' +
      '<path d="M2 44Q32 28 62 44V64H2Z" fill="#19B394"/>' +
      '<path d="M32 46V28" stroke="#0B8269" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M32 32Q20 30 18 20Q30 20 32 32Z" fill="#2DBE7E"/><path d="M32 28Q44 26 46 16Q34 16 32 28Z" fill="#5ED38A"/>', 'logo-svg');
  }

  B.art = {
    svg: svg,
    animal: animal,
    ANIMAL_NAMES: ANIMAL_NAMES,
    animalInner: function (n) { return (ANIMALS[n] || ANIMALS.bear)(false); },
    owl: owl,
    COLORS: COLORS,
    COLOR_KEYS: COLOR_KEYS,
    SHAPES: SHAPES,
    symbol: symbol,
    symbolNot: symbolNot,
    pole: pole,
    bubbleQ: bubbleQ,
    loco: loco,
    wagon: wagon,
    hand: hand,
    house: house,
    replayIcon: replayIcon,
    pauseIcon: pauseIcon,
    moonBtn: moonIcon, sunBtn: sunIcon, full: fullIcon, dice: diceIcon, toolMix: mixIcon, toolSize: sizeIcon, toolErase: eraserIcon, toolClear: broomIcon,
    check: check,
    playIcon: playIcon,
    bulb: bulb,
    cloud: cloud,
    moon: moon,
    sun: sun,
    zzz: zzz,
    sceneTile: sceneTile,
    gameIcon: gameIcon,
    zoneBadge: zoneBadge,
    logo: logo
  };

  /* ───────── زينة تُحيي السماء ───────── */
  function balloon(col, col2) {
    return svg('0 0 80 120',
      '<path d="M40 4C16 4 6 24 6 44c0 22 20 36 30 56h8c10-20 30-34 30-56C74 24 64 4 40 4Z" fill="' + col + '"/>' +
      '<path d="M40 4c-8 0-14 20-14 40 0 22 8 36 12 56h4c4-20 12-34 12-56C54 24 48 4 40 4Z" fill="' + col2 + '"/>' +
      '<ellipse cx="28" cy="30" rx="6" ry="12" fill="#fff" opacity=".35" transform="rotate(-12 28 30)"/>' +
      '<path d="M34 100l-4 10M46 100l4 10" stroke="' + INK + '" stroke-width="2.5" stroke-linecap="round"/>' +
      '<rect x="29" y="108" width="22" height="10" rx="3" fill="#B67B4D"/><rect x="29" y="108" width="22" height="3" fill="#8A5A33"/>', 'balloon-svg');
  }
  function bird(col) {
    return svg('0 0 60 40',
      '<g class="wing-l"><path d="M30 24Q16 4 2 14Q14 14 30 24Z" fill="' + col + '"/></g>' +
      '<g class="wing-r"><path d="M30 24Q44 4 58 14Q46 14 30 24Z" fill="' + col + '"/></g>' +
      '<ellipse cx="30" cy="26" rx="10" ry="8" fill="' + col + '"/>' +
      '<circle cx="35" cy="24" r="1.8" fill="' + EYE + '"/><path d="M40 26l6 1-6 2z" fill="#FFA63D"/>', 'bird-svg');
  }
  function windmill() {
    return svg('0 0 100 140',
      '<path d="M38 140L44 50h12l6 90z" fill="#FAFCFF" stroke="#C9D8F2" stroke-width="3"/>' +
      '<path d="M30 140h40" stroke="#3A4789" stroke-width="5" stroke-linecap="round"/>' +
      '<circle cx="50" cy="50" r="8" fill="' + INK + '"/>' +
      '<g class="sails"><g fill="#F2658E" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round">' +
      '<path d="M50 50L46 8h8z"/><path d="M50 50L92 46v8z"/><path d="M50 50l4 42h-8z"/><path d="M50 50L8 54v-8z"/></g>' +
      '<circle cx="50" cy="50" r="4" fill="#FFD34E"/></g>', 'windmill-svg');
  }
  function sparkle(col) {
    return svg('0 0 40 40', '<path d="M20 2q3 15 18 18q-15 3-18 18q-3-15-18-18q15-3 18-18z" fill="' + (col || '#fff') + '"/>', 'sparkle-svg');
  }
  function mountains(w, h) {
    var s = '', n = 4, step = w / n;
    for (var i = 0; i < n; i++) {
      var x = i * step + step / 2, pk = h * (0.1 + (i % 2) * 0.12), base = h;
      s += '<path d="M' + (x - step * 0.75) + ' ' + base + 'L' + x + ' ' + pk + 'L' + (x + step * 0.75) + ' ' + base + 'Z" fill="#8FB8E8"/>' +
        '<path d="M' + (x - step * 0.2) + ' ' + (pk + h * 0.26) + 'L' + x + ' ' + pk + 'L' + (x + step * 0.2) + ' ' + (pk + h * 0.26) + 'q-' + (step * 0.07) + ' ' + (h * 0.06) + ' -' + (step * 0.13) + ' 0q-' + (step * 0.07) + ' ' + (h * 0.06) + ' -' + (step * 0.14) + ' 0z" fill="#FAFCFF"/>';
    }
    return svg('0 0 ' + w + ' ' + h, s, 'scene-tile', 'width="' + w + '" height="' + h + '" preserveAspectRatio="none"');
  }
  function star(col) {
    return svg('0 0 20 20', '<circle cx="10" cy="10" r="3" fill="' + (col || '#FFF7C2') + '"/>', 'star-svg');
  }

  B.art.balloon = balloon; B.art.bird = bird; B.art.windmill = windmill;
  B.art.sparkle = sparkle; B.art.mountains = mountains; B.art.star = star;
})();
