/* بنك الصور: أشياء وحيوانات مرسومة SVG (١٠٠×١٠٠) تُستعمل في «أول صوت» و«جسر الروابط» والتلوين.
   كل مفتاح له رسمة واضحة. لا صور لبالغين. */
(function () {
  'use strict';
  var B = (window.Bustan = window.Bustan || {});
  var art = B.art, K = '#1F2A5A';

  function c(x, y, r, f, o) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + f + '"' + (o || '') + '/>'; }
  function e(x, y, rx, ry, f, o) { return '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" fill="' + f + '"' + (o || '') + '/>'; }
  function r(x, y, w, h, rx, f, o) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + rx + '" fill="' + f + '"' + (o || '') + '/>'; }
  function p(d, f, o) { return '<path d="' + d + '" fill="' + (f || 'none') + '"' + (o || '') + '/>'; }
  function st(col, w) { return ' stroke="' + col + '" stroke-width="' + (w || 3) + '" stroke-linecap="round" stroke-linejoin="round"'; }
  function eye(x, y, s) { s = s || 3; return c(x, y, s, '#2B2340') + c(x + s * 0.3, y - s * 0.3, s * 0.35, '#fff'); }
  function an(n) { return art.animalInner(n); }
  function sym(shape, color) { return art.symbol({ shape: shape, color: color }).replace(/^<svg[^>]*>|<\/svg>$/g, ''); }
  function inner(svgStr) { return svgStr.replace(/^<svg[^>]*>|<\/svg>$/g, ''); }

  var P = {
    duck: function () { return an('duck'); },
    bear: function () { return an('bear'); },
    lamb: function () { return an('lamb'); },
    cat: function () { return an('cat'); },
    frog: function () { return an('frog'); },
    rabbit: function () { return an('rabbit'); },
    owl: function () { return '<g transform="translate(5 0) scale(.9)">' + inner(art.owl()) + '</g>'; },
    sun: function () { return '<g transform="scale(.833)">' + inner(art.sun()) + '</g>' + p('M50 6v10M50 84v10M6 50h10M84 50h10M19 19l7 7M74 74l7 7M19 81l7-7M74 26l7-7', '', st('#FFB52E', 5)); },
    moon: function () { return inner(art.moon()); },
    crescent: function () { return p('M66 12A40 40 0 1 0 66 88A30 30 0 1 1 66 12Z', '#FFE58A', st('#E2A21B', 3)) + c(80, 26, 4, '#FFF3B0') + c(88, 48, 2.5, '#FFF3B0'); },
    cloud: function () { return '<g transform="translate(0 18) scale(.62)">' + inner(art.cloud()) + '</g>' + p('M14 60h72', '', st('#C9D8F2', 0)); },
    balloon: function () { return '<g transform="translate(18 0) scale(.82)">' + inner(art.balloon('#F2658E', '#FFD34E')) + '</g>'; },
    windmill: function () { return '<g transform="translate(15 0) scale(.71)">' + inner(art.windmill()) + '</g>'; },
    hand: function () { return '<g transform="translate(8 4)">' + inner(art.hand()) + '</g>'; },
    star: function () { return sym('star', 'yellow'); },
    heart: function () { return sym('heart', 'red'); },
    triangle: function () { return sym('triangle', 'green'); },
    square: function () { return sym('square', 'blue'); },
    circle: function () { return sym('circle', 'orange'); },
    train: function () { return inner(art.gameIcon('train')); },
    butterfly: function () { return inner(art.gameIcon('mirror')); },
    fish: function () { return inner(art.gameIcon('firstsound')); },
    lantern: function () { return '<path d="M50 4v10" stroke="#1F2A5A" stroke-width="5" stroke-linecap="round"/><circle cx="50" cy="12" r="6" fill="none" stroke="#1F2A5A" stroke-width="4"/><path d="M30 24H70L62 36H38Z" fill="#1F2A5A"/><path d="M36 36H64Q82 58 64 80H36Q18 58 36 36Z" fill="#FFC83D" stroke="#E2A21B" stroke-width="4" stroke-linejoin="round"/><ellipse cx="50" cy="58" rx="9" ry="16" fill="#FFF3B0"/><path d="M50 38V78M38 44Q30 58 38 74M62 44Q70 58 62 74" stroke="#E2A21B" stroke-width="3" fill="none"/><path d="M34 80H66V88H34Z" fill="#1F2A5A"/><path d="M50 88V96" stroke="#F2658E" stroke-width="5" stroke-linecap="round"/><circle cx="50" cy="97" r="3.5" fill="#F2658E"/>'; },
    door: function () { return r(22, 8, 56, 86, 8, '#B67B4D') + r(28, 14, 44, 34, 5, '#D39A6A') + r(28, 54, 44, 34, 5, '#D39A6A') + c(66, 52, 4.5, '#FFD34E') + r(16, 90, 68, 6, 3, K); },
    house: function () { return p('M10 50L50 14l40 36', '#F2658E', st('#C23C69', 6)) + r(20, 48, 60, 44, 6, '#FFE9B8') + r(42, 62, 16, 30, 4, '#B67B4D') + r(26, 56, 12, 12, 3, '#8FD3F4') + r(62, 56, 12, 12, 3, '#8FD3F4') + r(64, 16, 9, 18, 2, '#C23C69'); },
    banana: function () { return p('M18 34Q30 86 84 70Q88 62 80 60Q46 66 30 30Q22 26 18 34Z', '#FFD84A', st('#D9A011', 3)) + p('M22 30l-3-8', '', st('#8A6A1F', 5)); },
    key: function () { return c(32, 36, 20, '#FFD34E', st('#E2A21B', 4)) + c(32, 36, 8, '#FAFCFF') + p('M46 50L84 88M70 74l8-8M78 82l8-8', '', st('#E2A21B', 8)); },
    clock: function () { return c(50, 52, 38, '#FAFCFF', st('#3D8BFD', 7)) + p('M50 52V28M50 52l16 10', '', st(K, 5)) + c(50, 52, 4, K) + c(50, 20, 2.5, K) + c(50, 84, 2.5, K) + c(18, 52, 2.5, K) + c(82, 52, 2.5, K) + p('M22 14l-8 8M78 14l8 8', '', st('#3D8BFD', 7)); },
    car: function () { return p('M10 62Q10 48 24 46L34 28Q36 24 42 24H66Q72 24 76 30L84 46Q94 48 94 60V70H10Z', '#F0485A') + p('M38 30h12v14H30ZM56 30h10l8 14H56Z', '#D6EEFF') + c(30, 72, 11, K) + c(30, 72, 5, '#8FA0D8') + c(74, 72, 11, K) + c(74, 72, 5, '#8FA0D8') + c(90, 56, 3, '#FFE58A'); },
    strawberry: function () { return p('M50 92C22 74 14 48 24 34Q50 22 76 34C86 48 78 74 50 92Z', '#F0485A') + p('M30 30Q50 16 70 30Q60 38 50 30Q40 38 30 30Z', '#2DBE7E') + p('M50 26v-10', '', st('#1C8F5C', 5)) + c(38, 48, 2, '#FFE58A') + c(52, 44, 2, '#FFE58A') + c(64, 52, 2, '#FFE58A') + c(44, 62, 2, '#FFE58A') + c(58, 66, 2, '#FFE58A') + c(50, 78, 2, '#FFE58A'); },
    lemon: function () { return p('M10 52Q22 20 54 22Q84 24 90 50Q84 80 52 80Q22 80 10 52Z', '#FFE45E', st('#D9A011', 3)) + e(40, 40, 9, 5, '#fff', ' opacity=".5" transform="rotate(-20 40 40)"') + p('M88 46q6-6 4-12', '', st('#1C8F5C', 4)) + p('M90 34q8-8 4-18q-10 4-4 18Z', '#2DBE7E'); },
    milk: function () { return '<path d="M26 34L50 16L74 34V90Q74 94 70 94H30Q26 94 26 90Z" fill="#fff" stroke="#3D8BFD" stroke-width="5" stroke-linejoin="round"/><path d="M26 34L50 16L74 34Z" fill="#3D8BFD"/><rect x="34" y="50" width="32" height="30" rx="8" fill="#5CC8FF"/><path d="M50 56Q41 66 41 70a9 9 0 0 0 18 0Q59 66 50 56Z" fill="#fff"/>'; },
    apple: function () { return p('M50 30C30 18 10 34 14 58C18 82 38 94 50 86C62 94 82 82 86 58C90 34 70 18 50 30Z', '#F0485A') + p('M50 30Q50 16 58 10', '', st('#6B4E2E', 5)) + p('M56 18Q70 6 80 16Q68 26 56 18Z', '#2DBE7E') + e(32, 48, 6, 10, '#fff', ' opacity=".35" transform="rotate(20 32 48)"'); },
    crown: function () { return p('M12 78L16 30L36 54L50 22L64 54L84 30L88 78Z', '#FFD34E', st('#E2A21B', 4)) + r(12, 74, 76, 12, 4, '#E2A21B') + c(50, 22, 5, '#F2658E') + c(16, 30, 4, '#3D8BFD') + c(84, 30, 4, '#3D8BFD') + c(50, 80, 3.5, '#F0485A') + c(30, 80, 3, '#2DBE7E') + c(70, 80, 3, '#2DBE7E'); },
    camel: function () { return r(26, 62, 8, 30, 4, '#C9925A') + r(40, 62, 8, 30, 4, '#C9925A') + r(58, 62, 8, 30, 4, '#C9925A') + r(70, 62, 8, 30, 4, '#C9925A') + e(52, 56, 32, 16, '#DDA86C') + e(44, 40, 12, 14, '#DDA86C') + e(64, 42, 11, 13, '#DDA86C') + p('M22 56Q14 40 16 22', '', st('#DDA86C', 11)) + e(13, 18, 11, 8, '#DDA86C') + eye(12, 15, 2.2) + p('M84 54q8 6 6 16', '', st('#C9925A', 4)); },
    carrot: function () { return p('M36 30Q62 22 68 40Q60 76 40 94Q28 60 36 30Z', '#FF8A3D', st('#D96A1F', 3)) + p('M50 28Q44 8 34 8Q38 20 46 28ZM54 28Q56 6 66 4Q66 18 58 28ZM60 30Q72 14 82 16Q76 28 64 32Z', '#2DBE7E') + p('M44 48h10M48 62h10M46 76h6', '', st('#D96A1F', 2.5)); },
    mountain: function () { return p('M4 90L40 22L62 60L72 46L96 90Z', '#8FB8E8') + p('M30 41L40 22L50 40Q46 46 42 41Q37 48 30 41Z', '#FAFCFF') + r(2, 86, 96, 8, 4, '#2DBE7E'); },
    horse: function () { return r(28, 64, 8, 28, 4, '#8A5A33') + r(42, 64, 8, 28, 4, '#8A5A33') + r(60, 64, 8, 28, 4, '#8A5A33') + r(72, 64, 8, 28, 4, '#8A5A33') + e(54, 58, 30, 15, '#B67B4D') + p('M30 56Q22 40 24 24', '', st('#B67B4D', 13)) + p('M18 14L34 12L32 30L12 34Q8 30 12 24Z', '#B67B4D', st('#B67B4D', 4)) + p('M30 12l3-8l4 9', '#B67B4D', st('#B67B4D', 2)) + p('M34 16Q44 26 40 46', '', st('#5A3A1F', 6)) + eye(22, 21, 2.3) + p('M84 54q10 4 8 22', '', st('#5A3A1F', 5)); },
    whale: function () { return p('M8 56Q10 30 40 28Q72 28 80 54L94 40L92 66Q84 62 78 66Q66 84 40 84Q10 82 8 56Z', '#3D8BFD') + p('M12 66Q30 80 62 74', '', st('#9CC8FF', 5)) + eye(24, 52, 3.2) + p('M40 26Q36 12 28 10M40 26Q44 12 52 10', '', st('#8FD3F4', 3.5)); },
    tent: function () { return p('M50 14L92 88H8Z', '#FF8A3D', st('#D96A1F', 3)) + p('M50 14L64 88H36Z', '#FFD34E') + p('M50 44L58 88H42Z', '#5A3A1F') + p('M50 14V6', '', st(K, 4)) + p('M50 6l14 5l-14 5Z', '#F2658E'); },
    hen: function () { return e(52, 60, 30, 26, '#FAFCFF', st('#D7CFF0', 2.5)) + c(30, 36, 16, '#FAFCFF', st('#D7CFF0', 2.5)) + p('M22 22q3-8 8-2q4-8 8 0q5-5 6 4', '#F0485A', st('#F0485A', 2)) + p('M14 38l-10 4l10 4Z', '#FFA63D') + p('M22 46q3 8 8 2', '#F0485A') + eye(27, 34, 2.6) + p('M78 50q14-6 12 12q-6 2-12-2', '#FAFCFF', st('#D7CFF0', 2.5)) + p('M46 86v8M58 86v8', '', st('#FFA63D', 4)); },
    pomegranate: function () { return c(50, 56, 34, '#D8344F') + p('M40 24L42 10L50 18L58 10L60 24Z', '#D8344F', st('#A8243B', 2)) + e(38, 46, 7, 11, '#fff', ' opacity=".3" transform="rotate(20 38 46)"') + c(50, 60, 3, '#FF9DB3') + c(60, 52, 3, '#FF9DB3') + c(58, 68, 3, '#FF9DB3') + c(44, 70, 3, '#FF9DB3'); },
    feather: function () { return p('M22 86Q20 40 60 12Q86 20 70 52Q54 80 22 86Z', '#8E5CF0') + p('M22 86Q46 50 62 16', '', st('#FAFCFF', 3)) + p('M36 62l14-2M44 48l14-2M52 34l10-2', '', st('#C9B8FF', 2.5)); },
    flower: function () { var s = ''; for (var i = 0; i < 6; i++) s += e(50, 22, 11, 17, '#F2658E', ' transform="rotate(' + i * 60 + ' 50 42)"'); return p('M50 50V94', '', st('#1C8F5C', 5)) + p('M50 76Q34 66 30 78Q42 84 50 76Z', '#2DBE7E') + s + c(50, 42, 11, '#FFD34E'); },
    rose: function () { return p('M50 54V94', '', st('#1C8F5C', 5)) + p('M50 80Q66 70 70 82Q58 88 50 80Z', '#2DBE7E') + c(50, 36, 26, '#F0485A') + p('M36 34Q50 16 64 34Q56 52 44 46Q40 36 50 34Q56 36 52 40', '', st('#A8243B', 3.5)); },
    button: function () { return c(50, 50, 38, '#3D8BFD') + c(50, 50, 28, '#5CA3FF') + c(40, 40, 5, K) + c(60, 40, 5, K) + c(40, 60, 5, K) + c(60, 60, 5, K); },
    tree: function () { return r(43, 58, 14, 36, 5, '#8A5A33') + c(50, 36, 28, '#2DBE7E') + c(28, 50, 17, '#2DBE7E') + c(72, 50, 17, '#2DBE7E') + c(40, 30, 4, '#F0485A') + c(62, 42, 4, '#F0485A') + c(34, 52, 4, '#F0485A'); },
    rocket: function () { return p('M50 6Q72 28 68 66H32Q28 28 50 6Z', '#FAFCFF', st('#8FA0D8', 3)) + p('M50 6Q62 18 66 34H34Q38 18 50 6Z', '#F0485A') + c(50, 46, 9, '#8FD3F4', st('#3D8BFD', 3)) + p('M32 52L16 74L32 68ZM68 52L84 74L68 68Z', '#3D8BFD') + p('M40 68Q50 100 60 68Z', '#FFB52E') + p('M45 68Q50 86 55 68Z', '#FFE45E'); },
    box: function () { return p('M14 36L50 22L86 36V76L50 92L14 76Z', '#DDA86C') + p('M14 36L50 50L86 36', '', st('#8A5A33', 3)) + p('M50 50V92', '', st('#8A5A33', 3)) + p('M30 29L66 43V56L30 42Z', '#F2658E', ' opacity=".85"'); },
    plane: function () { return p('M8 54Q10 44 24 44H76Q92 46 92 54Q92 62 76 62H24Q10 62 8 54Z', '#FAFCFF', st('#8FA0D8', 3)) + p('M44 46L56 14H66L60 46ZM44 60L56 90H66L60 60Z', '#3D8BFD') + p('M12 46L8 28H18L26 44Z', '#F2658E') + c(72, 52, 3.5, '#8FD3F4') + c(60, 52, 3.5, '#8FD3F4') + c(48, 52, 3.5, '#8FD3F4'); },
    grapes: function () { var s = '', pts = [[38, 40], [54, 40], [70, 40], [46, 54], [62, 54], [54, 68], [38, 68], [46, 82]]; pts.forEach(function (q) { s += c(q[0], q[1], 10, '#8E5CF0') + c(q[0] - 3, q[1] - 3, 2.5, '#fff', ' opacity=".5"'); }); return p('M54 30V14', '', st('#6B4E2E', 4)) + p('M54 18Q70 4 84 16Q72 28 54 18Z', '#2DBE7E') + s; },
    eye: function () { return p('M6 50Q50 10 94 50Q50 90 6 50Z', '#FAFCFF', st(K, 4)) + c(50, 50, 19, '#3D8BFD') + c(50, 50, 9, K) + c(56, 44, 4, '#fff') + p('M18 30l-6-8M34 20l-3-9M50 16v-9M66 20l3-9M82 30l6-8', '', st(K, 3.5)); },
    branch: function () { return p('M8 82Q50 70 92 24', '', st('#8A5A33', 7)) + p('M40 70Q32 46 44 38Q54 54 40 70ZM62 54Q60 32 74 28Q80 44 62 54ZM30 76Q14 66 14 52Q30 56 30 76ZM56 62Q72 66 74 80Q58 78 56 62Z', '#2DBE7E'); },
    book: function () { return p('M8 24Q30 16 50 26Q70 16 92 24V82Q70 74 50 84Q30 74 8 82Z', '#3D8BFD') + p('M14 28Q32 22 50 30V78Q32 70 14 76ZM86 28Q68 22 50 30V78Q68 70 86 76Z', '#FAFCFF') + p('M22 40h20M22 50h20M22 60h14M58 40h20M58 50h20M58 60h14', '', st('#C9D8F2', 3)); },
    ball: function () { return c(50, 52, 38, '#FAFCFF', st(K, 3)) + p('M12 52A38 38 0 0 1 50 14Q34 34 50 52Q30 62 12 52Z', '#F0485A') + p('M88 52A38 38 0 0 1 50 90Q66 70 50 52Q70 42 88 52Z', '#3D8BFD') + p('M50 14Q66 34 50 52', '#FFD34E') + p('M50 14A38 38 0 0 1 88 52Q70 42 50 52Q66 34 50 14Z', '#FFD34E'); },
    bee: function () { return e(30, 34, 14, 20, '#D6EEFF', st('#8FD3F4', 2) + ' transform="rotate(-30 30 34)"') + e(60, 30, 14, 20, '#D6EEFF', st('#8FD3F4', 2) + ' transform="rotate(20 60 30)"') + e(50, 60, 32, 24, '#FFD34E') + p('M40 38V82M58 37V83', '', st(K, 8)) + c(24, 58, 13, '#FFD34E') + eye(20, 55, 2.6) + p('M18 64q4 3 8 0', '', st(K, 2)) + p('M82 60l10 0', '', st(K, 4)) + p('M18 46Q14 34 8 34M28 44Q28 32 24 28', '', st(K, 2.5)); },
    pyramid: function () { return p('M50 12L94 86H6Z', '#FFD34E') + p('M50 12L94 86H62Z', '#E2A21B') + p('M28 50h30M20 64h40M12 78h50', '', st('#E2A21B', 2.5)) + r(2, 84, 96, 8, 4, '#F6CBA7'); },
    leaf: function () { return p('M14 86Q8 30 80 12Q92 70 30 86Q22 88 14 86Z', '#2DBE7E', st('#1C8F5C', 3)) + p('M14 86Q40 52 74 22M34 62l-2-18M50 46l-2-16M40 58l20 0M56 40l16 0', '', st('#1C8F5C', 3)); },
    pumpkin: function () { return e(50, 58, 40, 30, '#FF8A3D') + e(50, 58, 22, 30, '#FFA35C') + e(50, 58, 8, 30, '#FF8A3D') + p('M50 30Q48 16 58 12', '', st('#1C8F5C', 6)) + p('M56 20Q70 14 76 24Q66 30 56 20Z', '#2DBE7E'); },
    fox: function () { return p('M14 40L18 8L44 26ZM86 40L82 8L56 26Z', '#FF8A3D', st('#FF8A3D', 5)) + c(50, 54, 34, '#FF8A3D') + p('M18 60Q30 50 50 68Q70 50 82 60Q76 88 50 88Q24 88 18 60Z', '#FAFCFF') + e(50, 70, 6, 4.5, K) + eye(36, 50, 4.2) + eye(64, 50, 4.2) + p('M44 78q6 4 12 0', '', st(K, 2.4)); },
    snow: function () { var s = ''; for (var i = 0; i < 3; i++) s += '<g transform="rotate(' + i * 60 + ' 50 50)">' + p('M50 8V92M50 22l-10-9M50 22l10-9M50 78l-10 9M50 78l10 9', '', st('#5CC8FF', 5)) + '</g>'; return s + c(50, 50, 6, '#FAFCFF', st('#5CC8FF', 3)); },
    corn: function () { var s = ''; for (var y = 0; y < 6; y++) for (var x = 0; x < 3; x++) s += c(40 + x * 10, 22 + y * 10, 4.2, '#E2A21B'); return e(50, 46, 20, 38, '#FFD34E') + s + p('M30 50Q14 70 34 94Q50 96 50 80Q34 70 30 50ZM70 50Q86 70 66 94Q50 96 50 80Q66 70 70 50Z', '#2DBE7E', st('#1C8F5C', 2)); },
    envelope: function () { return r(8, 24, 84, 56, 8, '#FAFCFF', st('#8FA0D8', 4)) + p('M10 28L50 58L90 28', '', st('#8FA0D8', 4)) + p('M10 76L38 50M90 76L62 50', '', st('#C9D8F2', 3)) + '<g transform="translate(38 44) scale(.24)">' + sym('heart', 'red') + '</g>'; },
    /* صور خاصة بجمل «جسر الروابط» */
    brokenbridge: function () { return p('M0 78Q50 66 100 78V100H0Z', '#6FD1F4') + p('M4 62Q22 38 40 34', '', st('#8E5CF0', 11)) + p('M60 34Q78 38 96 62', '', st('#8E5CF0', 11)) + r(6, 58, 9, 28, 4, '#3A4789') + r(85, 58, 9, 28, 4, '#3A4789') + p('M42 30l5 8l-6 6l6 8M58 30l-5 8l6 6l-6 8', '', st(K, 3)) + p('M46 70l-4 10M54 68l4 12', '', st('#8E5CF0', 5)); },
    rain: function () { return '<g transform="translate(4 4) scale(.58)">' + inner(art.cloud()).replace(/#FFFFFF/g, '#B9C6EE') + '</g>' + p('M28 56l-6 14M44 56l-6 14M60 56l-6 14M76 56l-6 14M36 76l-6 14M52 76l-6 14M68 76l-6 14', '', st('#3D8BFD', 5)); },
    umbrella: function () { return p('M8 52A42 42 0 0 1 92 52Q82 42 71 52Q60 42 50 52Q40 42 29 52Q18 42 8 52Z', '#F2658E', st('#C23C69', 3)) + p('M50 12V8M50 52V84Q50 94 40 92', '', st(K, 5)); },
    sleepbear: function () { return art.animal('bear', { sleep: true }).replace(/^<svg[^>]*>|<\/svg>$/g, '') + '<g transform="translate(62 0) scale(.8)">' + inner(art.zzz()) + '</g>'; },
    bird: function () { return e(48, 56, 28, 24, '#3D8BFD') + c(72, 40, 15, '#3D8BFD') + p('M86 40l10 3l-10 4Z', '#FFA63D') + eye(76, 37, 2.8) + p('M40 52Q22 30 10 40Q24 46 34 62Z', '#2468D1') + p('M22 62L6 72L22 72Z', '#2468D1') + p('M44 80v10M56 80v10', '', st('#FFA63D', 4)); },
    turtle: function () { return e(70, 76, 9, 7, '#7AC98B') + e(34, 76, 9, 7, '#7AC98B') + p('M14 66A36 30 0 0 1 86 66Z', '#2DBE7E', st('#1C8F5C', 3)) + p('M32 46l10 18M50 38v26M68 46l-10 18M22 60h56', '', st('#1C8F5C', 2.5)) + e(90, 60, 10, 8, '#7AC98B') + eye(93, 57, 2.2) + p('M14 66l-8 4', '', st('#7AC98B', 5)); }
  };

  B.pics = {
    has: function (k) { return !!P[k]; },
    draw: function (k, cls) { return art.svg('0 0 100 100', (P[k] || P.star)(), cls || 'pic'); },
    keys: function () { return Object.keys(P); }
  };
})();
