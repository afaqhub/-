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
      !built ? h('span', { class: 'tile-zzz', html: art.zzz() }) : null,
      (built && !it.free && B.storage.game(it.id) && B.storage.game(it.id).sessions > 0) ? h('span', { class: 'tile-done' }, h('span', { html: art.check() }), h('b', { text: S.home.done })) : null
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
    var items = B.catalog.filter(function (c) { return c.zone === zoneId && !c.hidden; });
    var z = h('section', { class: 'zone zone-' + zoneId + (locked ? ' is-locked' : ''), 'data-zone': zoneId },
      h('header', { class: 'zone-head' },
        h('span', { class: 'zone-badge', html: art.zoneBadge(zoneId) }),
        h('h2', { class: 'zone-name', text: S.zones[zoneId] })
      ),
      zoneId === 'solo'
        ? h('div', { class: 'groups' }, ['watch', 'num', 'move', 'know'].map(function (cat) {
            return h('div', { class: 'group g-' + cat },
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
  /* شريط «أكمل لعبتك» و«تحدي اليوم» */
  function dayNum() { var d = new Date(); return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000); }
  function dailyPool(locked) { return B.catalog.filter(function (c) { return !c.free && B.games[c.id] && c.zone !== 'garden' && !(locked && c.zone === 'solo'); }); }
  function chipsRow(locked) {
    var H = B.S.home, data = B.storage.data(), row = h('div', { class: 'chips-row' });
    function chip(cls, label, id, done) {
      var it = B.catalog.filter(function (c) { return c.id === id; })[0]; if (!it) return;
      var b = h('button', { class: 'home-chip ' + cls + (done ? ' done' : ''), type: 'button', 'data-chip': cls, 'data-game': id },
        h('span', { class: 'hc-ic', html: art.gameIcon ? art.gameIcon(id) : '' }),
        h('span', { class: 'hc-tx' }, h('small', { text: label }), h('b', { text: B.S.games[id] })));
      UI.bindPress(b, function () { var r = b.getBoundingClientRect(); B.session.start(id, { x: r.left + r.width / 2, y: r.top + r.height / 2 }); });
      row.appendChild(b);
    }
    var last = data.last; if (last && B.games[last] && !(locked && (B.catalog.filter(function (c) { return c.id === last; })[0] || {}).zone === 'solo')) chip('cont', H.cont, last, false);
    var pool = dailyPool(locked);
    if (pool.length) {
      var d = dayNum(), pick = pool[(d * 7 + 3) % pool.length].id;
      var dd = new Date(), today = dd.getFullYear() + '-' + ('0' + (dd.getMonth() + 1)).slice(-2) + '-' + ('0' + dd.getDate()).slice(-2), g = data.games && data.games[pick];
      chip('daily', H.daily, pick, !!(g && g.last === today));
    }
    row.__mascotSlot = true;
    return row;
  }
  function mascot(zonesEl) {
    var m = h('button', { class: 'mascot', type: 'button', 'aria-label': B.S.home.mascotHi, html: B.pics.draw('rabbit') });
    m.addEventListener('click', function () {
      if (B.audio) B.audio.play('pop');
      UI.anim(m, [{ transform: 'translateY(0)' }, { transform: 'translateY(-26px) rotate(-8deg)', offset: 0.4 }, { transform: 'translateY(0)' }, { transform: 'translateY(-10px)', offset: 0.75 }, { transform: 'translateY(0)' }], { dur: 700 });
    });
    return m;
  }
  /* «قصص»: رف بطاقات القصص داخل تبويبها */
  function storiesShelf() {
    var S = B.S, shelf = h('section', { class: 'stories-shelf' }, h('header', { class: 'zone-head' }, h('span', { class: 'zone-badge', html: art.zoneBadge('stories') }), h('h2', { class: 'zone-name', text: S.stories.title })));
    var grid = h('div', { class: 'st-lib' });
    B.free.stories.list().forEach(function (it) {
      var card = h('button', { class: 'st-card' + (it.read ? ' read' : ''), type: 'button', 'aria-label': it.title },
        B.free.stories.cover(it), h('b', { text: it.title }), h('small', { text: 'القيمة: ' + it.value }), it.read ? h('span', { class: 'st-read', html: art.check() }) : null);
      UI.bindPress(card, function () { var r = card.getBoundingClientRect(); B.free.stories.pick = it.id; B.session.start('stories', { x: r.left + r.width / 2, y: r.top + r.height / 2 }); });
      grid.appendChild(card);
    });
    shelf.appendChild(grid);
    return shelf;
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

  /* زر «ثبّت التطبيق»: يظهر دائماً ما دام التطبيق غير مثبّت */
  function isInstalled() { return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true; }
  function installBtn() {
    if (isInstalled()) return null;
    var I = B.S.install;
    var b = h('button', { class: 'install-btn', type: 'button', 'data-act': 'install' }, h('span', { class: 'ib-ic', html: art.installIcon() }), h('b', { text: B.S.home.install }));
    window.addEventListener('appinstalled', function () { b.remove(); });
    UI.bindPress(b, function () {
      if (B.installEvt) {
        var ev = B.installEvt; B.installEvt = null;
        try { ev.prompt(); ev.userChoice.then(function (r) { if (r && r.outcome === 'accepted') b.remove(); }); } catch (e) {}
        return;
      }
      var ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
      var steps = ios ? I.ios : I.android;
      var ok = h('button', { class: 'guide-go', type: 'button', text: I.ok });
      var card = h('div', { class: 'guide-card' }, h('h2', { text: I.title }), h('p', { class: 'ib-sub', text: I.sub }),
        h('ul', { class: 'guide-steps' }, steps.map(function (s, i) { return h('li', {}, h('b', { text: UI.num(i + 1) }), h('span', { text: s })); })), ok);
      var layer = h('div', { class: 'guide-layer', style: { zIndex: 96 } }, card);
      document.querySelector('.home').appendChild(layer);
      UI.anim(card, [{ opacity: 0, transform: 'translateY(20px) scale(.95)' }, { opacity: 1, transform: 'none' }], { dur: 400, easing: UI.SPRING, fill: 'none' });
      ok.addEventListener('click', function () { layer.remove(); });
    });
    return b;
  }
  var HOLD_MS = 1200; // ضغطة مطوّلة قصيرة: لا يفتحها الطفل بالخطأ، ولا يطول انتظار الكبير
  /* زر «الوالدان» الظاهر: ضغط مطوّل ثانية وبعض الثانية؛ والنقرة السريعة تذكّر بالضغط المستمر */
  function parentBtn(cls) {
    var H = B.S.home;
    var b = h('div', { class: 'parent-btn ' + cls, role: 'button', tabindex: '0', 'aria-label': H.parent },
      h('span', { class: 'pb-ic', html: art.gear() }), h('b', { class: 'pb-tx', text: H.parent }), h('i', { class: 'pb-fill' }));
    var timer = null, sx = 0, sy = 0, lbl = b.querySelector('.pb-tx'), t0 = 0;
    function cancel() { if (timer) { clearTimeout(timer); timer = null; } b.classList.remove('holding'); }
    b.addEventListener('pointerdown', function (e) {
      sx = e.clientX; sy = e.clientY; cancel(); t0 = Date.now(); b.classList.add('holding');
      timer = setTimeout(function () { timer = null; b.classList.remove('holding'); B.parent.open(); }, HOLD_MS);
    });
    b.addEventListener('pointermove', function (e) { if (Math.abs(e.clientX - sx) > 30 || Math.abs(e.clientY - sy) > 30) cancel(); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) { b.addEventListener(ev, function () {
      var early = timer && (Date.now() - t0 < HOLD_MS - 50); cancel();
      if (early && ev === 'pointerup') { lbl.textContent = H.parentHold; setTimeout(function () { lbl.textContent = H.parent; }, 1600); }
    }); });
    b.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    return b;
  }
  function attachLongPress(btn) {
    var timer = null, sx = 0, sy = 0;
    function cancel() { if (timer) { clearTimeout(timer); timer = null; } }
    btn.addEventListener('pointerdown', function (e) {
      sx = e.clientX; sy = e.clientY;
      cancel();
      timer = setTimeout(function () { timer = null; B.parent.open(); }, HOLD_MS);
    });
    btn.addEventListener('pointermove', function (e) {
      if (Math.abs(e.clientX - sx) > 24 || Math.abs(e.clientY - sy) > 24) cancel();
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) { btn.addEventListener(ev, cancel); });
  }

  var tabNow = 'all';
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
      h('div', { class: 'home-cloud c4', html: art.cloud() }),
      h('div', { class: 'home-balloon hb1', html: art.balloon('#F2658E', '#FFD34E') }),
      h('div', { class: 'home-balloon hb2', html: art.balloon('#8E5CF0', '#5CC8FF') }),
      h('div', { class: 'home-bird', html: art.bird('#FF8A3D') }),
      h('div', { class: 'home-bird b2', html: art.bird('#8E5CF0') }),
      h('div', { class: 'home-hills far', html: art.sceneTile('gfar', vp.W, Math.round(vp.H * 0.4)) }),
      h('div', { class: 'sc-windmill', html: B.pics.draw('windmill') }),
      h('div', { class: 'home-hills mid', html: art.sceneTile('gmid', vp.W, Math.round(vp.H * 0.3)) }),
      h('div', { class: 'sc-house', html: B.pics.draw('house') }),
      h('div', { class: 'sc-bunny', html: B.pics.draw('rabbit') }),
      h('div', { class: 'home-hills fore', html: art.sceneTile('fore', vp.W, Math.round(vp.H * 0.14)) }),
      h('div', { class: 'sc-fly bf1', html: B.pics.draw('butterfly') }),
      h('div', { class: 'sc-fly bf2', html: B.pics.draw('butterfly') }),
      h('div', { class: 'sc-fly bee', html: B.pics.draw('bee') })
    );

    var chips = chipsRow(locked);
    var zones = h('main', { class: 'zones scrollable', 'data-tab': tabNow }, h('div', { class: 'home-top' }, installBtn(), gardenRow(locked), chips), zone('solo', locked), zone('together', false), zone('create', false), storiesShelf());
    var tabbar = h('nav', { class: 'tabbar', role: 'tablist' }, ['all', 'solo', 'together', 'create', 'stories'].map(function (id) {
      var b = h('button', { class: 'tab-btn tab-' + id + (id === tabNow ? ' on' : ''), type: 'button', role: 'tab', 'data-tab': id, 'aria-label': B.S.zones[id] },
        h('span', { class: 'tab-ic', html: art.zoneBadge(id) }), h('b', { text: B.S.zones[id] }));
      b.addEventListener('click', function () { setTab(id); });
      return b;
    }));
    function setTab(id) {
      tabNow = id; zones.setAttribute('data-tab', id);
      tabbar.querySelectorAll('.tab-btn').forEach(function (x) { x.classList.toggle('on', x.getAttribute('data-tab') === id); });
      zones.scrollTop = 0;
      if (B.audio) B.audio.play('pick');
    }
    B.home._setTab = setTab;
    var fbPill = h('div', { class: 'fb-pill', role: 'button', tabindex: '0', text: B.S.feedback.pill });
    fbPill.addEventListener('click', function () { B.feedback.open(); });
    var dot = h('div', { class: 'adm-dot', role: 'button', tabindex: '0', 'aria-label': B.S.admin.dot, text: '·' });
    dot.addEventListener('click', function () { B.admin.open(); });
    var mas = mascot(); if (chips) chips.appendChild(mas);
    var el = h('div', { class: 'screen home' }, sky, zones, tabbar, logo, tools(), parentBtn('in-header'));
    zones.appendChild(fbPill); zones.appendChild(dot);
    // الأرنب يقفز وحده أحياناً ويلفت النظر إلى «فاجئني»
    var idle = setInterval(function () {
      if (!document.body.contains(el)) { clearInterval(idle); return; }
      var sbtn = el.querySelector('.surprise-btn');
      UI.anim(mas, [{ transform: 'translateY(0)' }, { transform: 'translateY(-22px)', offset: 0.4 }, { transform: 'translateY(0)' }], { dur: 600 });
      if (sbtn) UI.anim(sbtn, [{ transform: 'scale(1)' }, { transform: 'scale(1.08)', offset: 0.5 }, { transform: 'scale(1)' }], { dur: 700 });
    }, 14000);

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
    show: function () { if (B.audio) B.audio.theme(null); return UI.go(build()); },
    tab: function (id) { if (B.home._setTab) B.home._setTab(id); },
    build: build
  };
})();
