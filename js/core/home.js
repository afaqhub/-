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
      zoneId === 'solo'
        ? h('div', { class: 'groups' }, ['watch', 'num', 'move', 'know'].map(function (cat) {
            return h('div', { class: 'group' },
              h('div', { class: 'group-label', text: S.cats[cat] }),
              h('div', { class: 'tiles' }, items.filter(function (c) { return c.cat === cat; }).map(function (it) { return tile(it, locked); })));
          }))
        : h('div', { class: 'tiles' }, items.map(function (it) { return tile(it, locked && zoneId === 'solo'); }))
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

  /* بطاقة «بستاني» المستقلة: معاينة مما زُرع + عدده. وبجانبها «فاجئني» تختار لعبة عشوائية. */
  function gardenRow(locked) {
    var H = B.S.home, items = B.garden.items(), recent = items.slice(-4).reverse();
    var preview = h('span', { class: 'gb-prev' }, recent.length
      ? recent.map(function (k) { return h('span', { class: 'gb-item', html: B.pics.draw(k) }); })
      : [h('span', { class: 'gb-item gb-seed', html: B.pics.draw('leaf') })]);
    var gb = h('button', { class: 'gd-banner', type: 'button', 'data-game': 'garden', 'aria-label': H.garden },
      h('span', { class: 'gb-title' }, h('b', { text: H.garden }), h('small', { text: H.gardenNote })),
      preview,
      h('span', { class: 'gb-count', text: UI.num(items.length) }));
    UI.bindPress(gb, function () { var r = gb.getBoundingClientRect(); B.session.start('garden', { x: r.left + r.width / 2, y: r.top + r.height / 2 }); });
    var sb = h('button', { class: 'surprise-btn', type: 'button', 'aria-label': H.surprise, html: art.dice() }, h('small', { text: H.surprise }));
    UI.bindPress(sb, function () {
      var pool = B.catalog.filter(function (c) { return !c.free && B.games[c.id] && !(locked && c.zone === 'solo'); });
      var it = kit_pick(pool); if (!it) return;
      var r = sb.getBoundingClientRect(); B.session.start(it.id, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
    });
    return h('div', { class: 'gd-row' }, gb, sb);
  }
  function kit_pick(a) { return a.length ? a[Math.floor(Math.random() * a.length)] : null; }

  /* أدوات الصفحة: ملء الشاشة، والوضع الليلي/النهاري (للكبار؛ ليست أزرار لعب) */
  function applyNight(on) { document.documentElement.classList.toggle('night', !!on); }
  B.applyNight = applyNight;
  function tools() {
    var H = B.S.home, set = B.storage.data().settings;
    var box = h('div', { class: 'hdr-tools' });
    var night = h('div', { class: 'hdr-tool', role: 'button', tabindex: '0' });
    function paintNight() { night.innerHTML = set.night ? art.sunBtn() : art.moonBtn(); night.setAttribute('aria-label', set.night ? H.day : H.night); }
    night.addEventListener('click', function () { set.night = !set.night; B.storage.save(); applyNight(set.night); paintNight(); if (B.audio) B.audio.play('pick'); });
    paintNight(); box.appendChild(night);
    var de = document.documentElement;
    if (de.requestFullscreen || de.webkitRequestFullscreen) {
      var fs = h('div', { class: 'hdr-tool', role: 'button', tabindex: '0', 'aria-label': H.full, html: art.full() });
      fs.addEventListener('click', function () {
        var on = document.fullscreenElement || document.webkitFullscreenElement;
        try { if (on) (document.exitFullscreen || document.webkitExitFullscreen).call(document); else (de.requestFullscreen || de.webkitRequestFullscreen).call(de); } catch (e) {}
      });
      box.appendChild(fs);
    }
    return box;
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
      h('div', { class: 'home-balloon hb1', html: art.balloon('#F2658E', '#FFD34E') }),
      h('div', { class: 'home-balloon hb2', html: art.balloon('#8E5CF0', '#5CC8FF') }),
      h('div', { class: 'home-bird', html: art.bird('#FF8A3D') }),
      h('div', { class: 'home-hills far', html: art.sceneTile('far', vp.W, Math.round(vp.H * 0.38)) }),
      h('div', { class: 'home-hills mid', html: art.sceneTile('mid', vp.W, Math.round(vp.H * 0.3)) })
    );

    var zones = h('main', { class: 'zones scrollable' }, gardenRow(locked), zone('solo', locked), zone('together', false), zone('create', false));
    var fbPill = h('div', { class: 'fb-pill', role: 'button', tabindex: '0', text: B.S.feedback.pill });
    fbPill.addEventListener('click', function () { B.feedback.open(); });
    var dot = h('div', { class: 'adm-dot', role: 'button', tabindex: '0', 'aria-label': B.S.admin.dot, text: '·' });
    dot.addEventListener('click', function () { B.admin.open(); });
    var el = h('div', { class: 'screen home' }, sky, zones, logo, tools(), fbPill, dot);

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
    // شاشة ترحيب للوالدين مرة واحدة
    if (!B.storage.data().welcomed) {
      var W = B.S.welcome, go = h('button', { class: 'guide-go', type: 'button', text: W.go });
      var card = h('div', { class: 'guide-card' }, h('h2', { text: W.title }),
        h('ul', { class: 'guide-steps' }, W.lines.map(function (t) { return h('li', {}, h('b', { text: '•' }), h('span', { text: t })); })), go);
      var layer = h('div', { class: 'guide-layer', style: { zIndex: 50 } }, card);
      el.appendChild(layer);
      requestAnimationFrame(function () { UI.anim(card, [{ opacity: 0, transform: 'translateY(20px) scale(.95)' }, { opacity: 1, transform: 'none' }], { dur: 450, easing: UI.SPRING, fill: 'none' }); });
      go.addEventListener('click', function () {
        B.storage.data().welcomed = true; B.storage.save();
        UI.anim(layer, [{ opacity: 1 }, { opacity: 0 }], { dur: 250 }).then(function () { layer.remove(); });
      });
    }
    return el;
  }

  B.home = {
    show: function () { return UI.go(build()); },
    build: build
  };
})();
