/* الشخصيات الحيّة: جسم كامل بأجزاء متحركة (ذراعان وساقان وذيل) + رمش + نظر نحو الإصبع + التفات + حركات عفوية.
   B.rig.html(k, ex, headSvg) يعيد شخصية مركّبة؛ B.life يدير النظر والرمش والحركات العفوية لكل الرؤوس في التطبيق. */
(function () {
  'use strict';
  var B = (window.Bustan = window.Bustan || {});
  var SPEC = {
    rabbit: { f: '#FFFFFF', s: '#D5CEEA', b: '#FFE3EC', foot: '#FFB8CC', tail: 'pom' },
    bear: { f: '#B67B4D', s: '#8A5A36', b: '#F3D6B0', foot: '#9A6540', tail: 'nub' },
    fox: { f: '#FF8A3D', s: '#C9611F', b: '#FFF1E0', foot: '#5A3A2A', tail: 'fox' },
    cat: { f: '#FFA24D', s: '#C9701F', b: '#FFE2C2', foot: '#FFC48A', tail: 'cat' },
    duck: { f: '#FFD84A', s: '#D9A81E', b: '#FFEFA0', foot: '#FF9A3D', tail: 'nub' },
    frog: { f: '#5ED38A', s: '#2F8F57', b: '#C9F5D8', foot: '#4BBF78', tail: null },
    lamb: { f: '#FFF6EA', s: '#E0CFAE', b: '#FFFFFF', foot: '#6A5648', tail: 'nub' },
    turtle: { f: '#6FCB8F', s: '#2F8F57', b: '#F6E7B8', foot: '#5FBF86', tail: null, shell: 1 },
    owl: { f: '#9B7BD8', s: '#6B4FB0', b: '#E4D8FF', foot: '#FFB62E', tail: null }
  };
  var POSE = { joy: 1, sad: 1, cry: 1, scared: 1, surprised: 1, think: 1, strain: 1, sleepy: 1, angry: 1 };

  function body(k) {
    var S = SPEC[k], st = ' stroke="' + S.s + '" stroke-width="1.6" stroke-linejoin="round"', o = '';
    if (S.tail === 'pom') o += '<circle class="rg-tail" cx="79" cy="36" r="7" fill="#fff"' + st + '/>';
    else if (S.tail === 'fox') o += '<g class="rg-tail"><path d="M70 38Q100 44 97 12Q90 28 68 26Z" fill="' + S.f + '"' + st + '/><path d="M97 12Q94 24 89 28Q96 28 98 20Z" fill="#fff"/></g>';
    else if (S.tail === 'cat') o += '<path class="rg-tail" d="M70 38Q96 40 92 14" fill="none" stroke="' + S.f + '" stroke-width="6.5" stroke-linecap="round"/>';
    else if (S.tail === 'nub') o += '<circle class="rg-tail" cx="75" cy="38" r="4.6" fill="' + S.f + '"' + st + '/>';
    var leg = function (cls, x) { return '<g class="rg-leg ' + cls + '"><rect x="' + x + '" y="40" width="13" height="17" rx="6" fill="' + S.f + '"' + st + '/><ellipse cx="' + (x + 6.5) + '" cy="56.5" rx="8" ry="3.8" fill="' + S.foot + '"' + st + '/></g>'; };
    o += leg('l', 32) + leg('r', 55);
    if (S.shell) {
      o += '<path d="M20 42Q20 3 50 3Q80 3 80 42Z" fill="#4FB06F"' + st + '/><path d="M36 20L50 14L64 20L64 34L50 40L36 34Z" fill="none" stroke="#2F8F57" stroke-width="1.8"/><path d="M50 14V8M36 20L28 16M64 20L72 16M36 34L28 38M64 34L72 38" stroke="#2F8F57" stroke-width="1.6" fill="none"/>';
    } else {
      o += '<ellipse cx="50" cy="25" rx="26" ry="22" fill="' + S.f + '"' + st + '/><ellipse cx="50" cy="29" rx="15" ry="14" fill="' + S.b + '"/>';
    }
    var arm = function (cls, x) { return '<g class="rg-arm ' + cls + '"><rect x="' + x + '" y="10" width="11" height="27" rx="5.5" fill="' + S.f + '"' + st + '/><circle cx="' + (x + 5.5) + '" cy="36" r="5.6" fill="' + (k === 'duck' ? S.foot : S.f) + '"' + st + '/></g>'; };
    o += arm('l', 18) + arm('r', 71);
    return '<svg class="rg-bd" viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' + o + '</svg>';
  }

  B.rig = {
    has: function (k) { return !!SPEC[k]; },
    /* ارتفاع الجسم الظاهر تحت الرأس (نسبة من عرض الشخصية): لرفع الشخصية كي تقف على الأرض */
    lift: 0.2,
    html: function (k, ex, head) {
      var pose = POSE[ex] ? ' p-' + ex : ' rg-neutral';
      return '<div class="rg rg-' + k + pose + '" data-k="' + k + '">' + body(k) + '<div class="rg-hd">' + head + '</div></div>';
    },
    setEx: function (el, ex) {
      Object.keys(POSE).forEach(function (e) { el.classList.remove('p-' + e); });
      el.classList.toggle('rg-neutral', !POSE[ex]); if (POSE[ex]) el.classList.add('p-' + ex);
    },
    /* حركة مؤقتة: hop / wave / talk / nod / shake / walk / stretch / scratch / cheer */
    act: function (el, name, ms) {
      if (!el) return; var cls = 'rg-a-' + name; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
      clearTimeout(el['_t' + name]); el['_t' + name] = setTimeout(function () { el.classList.remove(cls); }, (ms || 1200) / ((B.UI && B.UI.ts) || 1));
    },
    lookAt: function (el, target, ms) {
      if (!el) return; el._look = { el: target, until: Date.now() + (ms || 1500) }; B.life.update();
    }
  };

  /* ——— الحياة: نظر ورمش وحركات عفوية لكل الرؤوس ——— */
  var ptr = null, ptrT = 0, raf = 0, reduce = false;
  try { reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { }
  function onPtr(e) {
    var t = (e.touches && e.touches[0]) || e; ptr = { x: t.clientX, y: t.clientY }; ptrT = Date.now();
    if (!raf) raf = requestAnimationFrame(function () { raf = 0; update(); });
  }
  function center(el) { var r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height }; }
  function update() {
    var svgs = document.querySelectorAll('svg.animal, svg.pic, .rg-hd > svg'), now = Date.now(), vh = window.innerHeight, vw = window.innerWidth, seen = [];
    for (var i = 0; i < svgs.length; i++) {
      var sv = svgs[i]; if (seen.indexOf(sv) >= 0) continue; seen.push(sv);
      var eg = sv.querySelectorAll('.ey'); if (!eg.length) continue;
      var c = center(sv); if (c.w < 8 || c.y < -50 || c.y > vh + 50 || c.x < -50 || c.x > vw + 50) continue;
      var rg = sv.closest ? sv.closest('.rg') : null, tg = null, gx, gy, mag;
      if (rg && rg._look && rg._look.until > now && rg._look.el && rg._look.el.isConnected) { var tc = center(rg._look.el); tg = { x: tc.x, y: tc.y }; }
      else if (ptr && now - ptrT < 7000) tg = ptr;
      if (tg) {
        var dx = tg.x - c.x, dy = tg.y - c.y, d = Math.hypot(dx, dy) || 1; mag = Math.min(1, d / (c.w * 1.1)); gx = dx / d * mag; gy = dy / d * mag;
      } else { var g = sv._gz || (sv._gz = { x: 0, y: 0 }); gx = g.x; gy = g.y; mag = 1; }
      var tx = (gx * 2.7).toFixed(2), ty = (gy * 2.2).toFixed(2);
      for (var j = 0; j < eg.length; j++) eg[j].style.transform = 'translate(' + tx + 'px,' + ty + 'px)';
      var hd = rg && rg.firstElementChild && rg.querySelector('.rg-hd');
      if (hd) { hd.style.setProperty('--hr', (gx * 5).toFixed(1) + 'deg'); hd.style.setProperty('--hx', (gx * 3).toFixed(1) + '%'); hd.style.setProperty('--hy', (gy * 1.6).toFixed(1) + '%'); }
    }
  }
  var glances = [[-1, 0.1], [1, 0.1], [0, -0.7], [0.6, 0.5], [-0.6, 0.5], [0, 0], [-1, -0.3], [1, -0.3]];
  function idleTick() {
    if (reduce || document.hidden) return;
    var now = Date.now(); if (ptr && now - ptrT < 7000) return;
    var svgs = document.querySelectorAll('svg.animal, svg.pic, .rg-hd > svg');
    for (var i = 0; i < svgs.length; i++) if (Math.random() < 0.4) { var g = glances[Math.floor(Math.random() * glances.length)]; svgs[i]._gz = { x: g[0], y: g[1] }; }
    update();
  }
  function blinkTick() {
    if (reduce || document.hidden) return;
    var ev = document.querySelectorAll('.ev');
    for (var i = 0; i < ev.length; i++) if (Math.random() < 0.2) (function (n) { n.classList.add('bl'); setTimeout(function () { n.classList.remove('bl'); }, 170); })(ev[i]);
  }
  var ACTS = ['hop', 'stretch', 'wave', 'scratch', 'look', 'look'];
  function actTick() {
    if (reduce || document.hidden) return;
    var rgs = [].filter.call(document.querySelectorAll('.rg.rg-neutral'), function (r) { var b = r.getBoundingClientRect(); return b.width > 10 && b.bottom > 0 && b.top < window.innerHeight && !/rg-a-/.test(r.className); });
    if (!rgs.length) return;
    var r = rgs[Math.floor(Math.random() * rgs.length)], a = ACTS[Math.floor(Math.random() * ACTS.length)];
    if (a === 'look') { var others = rgs.filter(function (o) { return o !== r; }); if (others.length) B.rig.lookAt(r, others[Math.floor(Math.random() * others.length)].querySelector('.rg-hd'), 1700); else B.rig.act(r, 'hop', 700); }
    else B.rig.act(r, a, a === 'hop' ? 700 : 1500);
  }
  var life = (B.life = { update: update });
  document.addEventListener('pointermove', onPtr, { passive: true });
  document.addEventListener('pointerdown', onPtr, { passive: true });
  document.addEventListener('touchstart', onPtr, { passive: true });
  setInterval(idleTick, 2400); setInterval(blinkTick, 1500); setInterval(actTick, 3800);
  setTimeout(update, 400);
})();
