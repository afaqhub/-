/* الشاشة الرئيسية: منطقتان بلونين وأيقونات (وحدي / معك).
   الألعاب غير المنجزة أيقونات نائمة. الضغطة المطولة ٣ ثوانٍ على زاوية الشعار تفتح ركن الوالدين. */
(function () {
  'use strict';
  var B = (window.Bustan = window.Bustan || {});
  var UI = B.UI, h = UI.h, art = B.art;

  function sleepyWobble(el) {
    UI.anim(el, [
      { transform: 'rotate(0)' }, { transform: 'rotate(-4deg)' }, { transform: 'rotate(4deg)' },
      { transform: 'rotate(-3deg)' }, { transform: 'rotate(0)' }
    ], { dur: 700, fill: 'none', deco: true });
    // نفَس نائم صغير يطفو
    var z = h('div', { class: 'zzz-float', html: art.zzz() });
    el.appendChild(z);
    UI.anim(z, [
      { transform: 'translateY(6px) scale(.6)', opacity: 0 },
      { transform: 'translateY(-18px) scale(1)', opacity: 1, offset: 0.4 },
      { transform: 'translateY(-44px) scale(1.1)', opacity: 0 }
    ], { dur: 1400, fill: 'both' }).then(function () { z.remove(); });
  }

  function tile(it, locked) {
    var S = B.S;
    var built = !!(B.games[it.id] || B.free[it.id]);
    var sleeping = !built || locked;
    var el = h('button', {
      class: 'tile' + (sleeping ? ' is-sleeping' : ''), type: 'button', 'data-game': it.id,
      'aria-label': S.games[it.id]
    },
      h('span', { class: 'tile-art', html: art.gameIcon(it.id, !built) }),
      h('span', { class: 'tile-name', text: S.games[it.id] }),
      !built ? h('span', { class: 'tile-zzz', html: art.zzz() }) : null
    );
    UI.bindPress(el, function (e) {
      if (!built || locked) { sleepyWobble(el); return; }
      var r = el.getBoundingClientRect();
      UI.anim(el, [{ transform: 'scale(1)' }, { transform: 'scale(1.12)' }, { transform: 'scale(1)' }], { dur: 300, fill: 'none', easing: UI.SPRING });
      B.session.start(it.id, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
    });
    return el;
  }

  function zone(zoneId, locked) {
    var S = B.S;
    var items = B.catalog.filter(function (c) { return c.zone === zoneId; });
    var z = h('section', { class: 'zone zone-' + zoneId + (locked ? ' is-locked' : ''), 'data-zone': zoneId },
      h('header', { class: 'zone-head' },
        h('span', { class: 'zone-badge', html: art.zoneBadge(zoneId) }),
        h('h2', { class: 'zone-name', text: S.zones[zoneId] })
      ),
      h('div', { class: 'tiles' }, items.map(function (it) { return tile(it, locked && zoneId === 'solo'); }))
    );
    if (locked && zoneId === 'solo') {
      // شخصية نائمة تغطي المنطقة حتى الغد
      z.appendChild(h('div', { class: 'sleepy' },
        h('span', { class: 'sleepy-art', html: art.animal('bear', { sleep: true }) }),
        h('span', { class: 'sleepy-z', html: art.zzz() })
      ));
    }
    return z;
  }

  function attachLongPress(btn) {
    var timer = null, sx = 0, sy = 0;
    function cancel() { if (timer) { clearTimeout(timer); timer = null; } }
    btn.addEventListener('pointerdown', function (e) {
      sx = e.clientX; sy = e.clientY;
      cancel();
      timer = setTimeout(function () { timer = null; B.parent.open(); }, 3000); // ثلاث ثوانٍ فعلية
    });
    btn.addEventListener('pointermove', function (e) {
      if (Math.abs(e.clientX - sx) > 24 || Math.abs(e.clientY - sy) > 24) cancel();
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) { btn.addEventListener(ev, cancel); });
  }

  function build() {
    var locked = B.storage.soloLocked();
    var logo = h('button', { class: 'logo-corner', type: 'button', 'aria-label': B.S.appName },
      h('span', { class: 'logo-mark', html: art.logo() }),
      h('span', { class: 'logo-name', text: B.S.appName })
    );
    attachLongPress(logo);

    var vp = UI.vp();
    var sky = h('div', { class: 'home-sky' },
      h('div', { class: 'home-sun', html: art.sun() }),
      h('div', { class: 'home-cloud c1', html: art.cloud() }),
      h('div', { class: 'home-cloud c2', html: art.cloud() }),
      h('div', { class: 'home-cloud c3', html: art.cloud() }),
      h('div', { class: 'home-rainbow', html: art.rainbow() }),
      h('div', { class: 'home-balloon hb1', html: art.balloon('#F2658E', '#FFD34E') }),
      h('div', { class: 'home-balloon hb2', html: art.balloon('#8E5CF0', '#5CC8FF') }),
      h('div', { class: 'home-bird', html: art.bird('#FF8A3D') }),
      h('div', { class: 'home-hills far', html: art.sceneTile('far', vp.W, Math.round(vp.H * 0.38)) }),
      h('div', { class: 'home-hills mid', html: art.sceneTile('mid', vp.W, Math.round(vp.H * 0.3)) })
    );

    var zones = h('main', { class: 'zones' }, zone('solo', locked), zone('together', false), zone('create', false));
    var el = h('div', { class: 'screen home' }, sky, zones, logo);

    // ظهور متتابع بحركة زنبركية (بعد الإدراج في الصفحة)
    requestAnimationFrame(function () {
      var tiles = el.querySelectorAll('.tile');
      for (var i = 0; i < tiles.length; i++) {
        UI.anim(tiles[i], [
          { opacity: 0, transform: 'translateY(26px) scale(.86)' },
          { opacity: 1, transform: 'none' }
        ], { dur: 520, delay: 120 + i * 80, easing: UI.SPRING });
      }
      UI.anim(el.querySelectorAll('.zone-head')[0], [{ opacity: 0, transform: 'translateY(-10px)' }, { opacity: 1, transform: 'none' }], { dur: 420 });
      UI.anim(el.querySelectorAll('.zone-head')[1], [{ opacity: 0, transform: 'translateY(-10px)' }, { opacity: 1, transform: 'none' }], { dur: 420, delay: 200 });
      UI.anim(el.querySelectorAll('.zone-head')[2], [{ opacity: 0, transform: 'translateY(-10px)' }, { opacity: 1, transform: 'none' }], { dur: 420, delay: 400 });
    });
    return el;
  }

  B.home = {
    show: function () { return UI.go(build()); },
    build: build
  };
})();
