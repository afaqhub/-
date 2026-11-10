/* ركن الوالدين (مبسّط في المرحلة ١): إحصاءات، حدّ «وحدي»، الصوت، النسخ الاحتياطي، إعادة الضبط.
   لا يظهر له أثر للطفلة: لا زر ولا إشارة؛ يُفتح بضغطة مطولة ٣ ثوانٍ على زاوية الشعار.
   النصوص كلها عربية؛ ولا يُعرض نص JSON أبداً (النسخ عبر الحافظة أو ملف). */
(function () {
  'use strict';
  var B = (window.Bustan = window.Bustan || {});
  var UI = B.UI, h = UI.h;

  var overlay = null;

  function copyText(text) {
    function fallback() {
      // نسخ احتياطي بحقل مخفي (لا يظهر نص لاتيني)
      var ta = h('textarea', { style: { position: 'fixed', left: '-9999px', top: '0', opacity: '0' }, 'aria-hidden': 'true' });
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) {}
      ta.remove();
      return ok;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return fallback(); });
    }
    return Promise.resolve(fallback());
  }

  function build() {
    var S = B.S, P = S.parent, st = B.storage;
    var msg = h('div', { class: 'p-msg', role: 'status' });
    function say(t) {
      msg.textContent = t;
      UI.anim(msg, [{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { dur: 300, fill: 'both' });
    }

    /* الإحصاءات */
    var rows = B.catalog.filter(function (c) { return !c.free; }).map(function (c) {
      var g = st.game(c.id), built = !!B.games[c.id];
      return h('div', { class: 'p-row' },
        h('div', { class: 'p-game', text: S.games[c.id] }),
        built
          ? h('div', { class: 'p-nums' },
              h('span', { text: P.sessions + ': ' + UI.num(g.sessions) }),
              h('span', { text: P.rounds + ': ' + UI.num(g.rounds) }),
              h('span', { text: P.level + ': ' + UI.num(g.level) }))
          : h('div', { class: 'p-nums muted', text: P.notBuilt })
      );
    });

    /* آخر ٧ أيام */
    var days = st.lastDays(7);
    var maxR = Math.max.apply(null, days.map(function (d) { return d.rounds; }).concat([1]));
    var chart = h('div', { class: 'p-chart' }, days.map(function (d) {
      var hgt = d.rounds ? Math.max(8, Math.round((d.rounds / maxR) * 72)) : 3;
      return h('div', { class: 'p-day' },
        h('div', { class: 'p-day-n', text: d.rounds ? UI.num(d.rounds) : '' }),
        h('div', { class: 'p-bar', style: { height: hgt + 'px' } }),
        h('div', { class: 'p-day-l', text: P.daysShort[d.date.getDay()] })
      );
    }));

    /* حدّ «وحدي» */
    var limitVal = h('span', { class: 'p-limit-n', text: UI.num(st.data().settings.soloLimit) });
    function setLimit(d) {
      var s = st.data().settings;
      s.soloLimit = Math.max(1, Math.min(9, s.soloLimit + d));
      limitVal.textContent = UI.num(s.soloLimit);
      st.save();
    }
    var minus = h('button', { class: 'p-btn p-step', type: 'button', text: '−', 'aria-label': '−' });
    var plus = h('button', { class: 'p-btn p-step', type: 'button', text: '+', 'aria-label': '+' });
    minus.addEventListener('click', function () { setLimit(-1); });
    plus.addEventListener('click', function () { setLimit(1); });

    var openBtn = h('button', { class: 'p-btn', type: 'button', 'data-act': 'open-solo' });
    function refreshOpen() {
      var opened = st.data().lock.soloOpenDate === st.todayKey();
      openBtn.textContent = opened ? P.soloOpened : P.openSolo;
      openBtn.disabled = opened;
    }
    openBtn.addEventListener('click', function () { st.openSoloToday(); refreshOpen(); });
    refreshOpen();

    /* رابط الأسبوع (جسر الروابط): ٠ = حسب المستوى */
    var weekBtns = [P.weeklyAuto].concat(P.connectors).map(function (label, i) {
      var b = h('button', { class: 'p-btn p-week', type: 'button', 'data-week': i, text: label });
      b.addEventListener('click', function () { st.data().settings.weeklyConnector = i; st.save(); refreshWeek(); });
      return b;
    });
    function refreshWeek() {
      var w = st.data().settings.weeklyConnector | 0;
      weekBtns.forEach(function (b, i) { b.classList.toggle('off', i !== w); });
    }
    refreshWeek();

    /* الصوت */
    var soundBtn = h('button', { class: 'p-btn', type: 'button', 'data-act': 'sound' });
    function refreshSound() {
      var on = st.data().settings.soundOn;
      soundBtn.textContent = on ? P.soundOn : P.soundOff;
      soundBtn.classList.toggle('on', on);
    }
    soundBtn.addEventListener('click', function () {
      var s = st.data().settings; s.soundOn = !s.soundOn; st.save(); refreshSound();
      if (s.soundOn) { B.audio.unlock(); B.audio.play('chime'); }
    });
    refreshSound();

    /* النسخ الاحتياطي */
    var copyBtn = h('button', { class: 'p-btn', type: 'button', text: P.copy, 'data-act': 'copy' });
    copyBtn.addEventListener('click', function () {
      copyText(st.exportJSON()).then(function (ok) { say(ok ? P.copied : P.restoreFail); });
    });
    var fileBtn = h('button', { class: 'p-btn', type: 'button', text: P.saveFile, 'data-act': 'save-file' });
    fileBtn.addEventListener('click', function () {
      try {
        var blob = new Blob([st.exportJSON()], { type: 'application/json' });
        var a = h('a', { href: URL.createObjectURL(blob), download: 'bustan-progress.json' });
        document.body.appendChild(a); a.click(); a.remove();
        say(P.copied);
      } catch (e) { say(P.restoreFail); }
    });
    var ta = h('textarea', { class: 'p-ta', placeholder: P.restorePlaceholder, rows: 2, dir: 'ltr' });
    var restoreBtn = h('button', { class: 'p-btn', type: 'button', text: P.restore, 'data-act': 'restore' });
    function afterRestore(ok) {
      say(ok ? P.restored : P.restoreFail);
      if (ok) { ta.value = ''; close(); B.home.show(); }
    }
    restoreBtn.addEventListener('click', function () { afterRestore(st.importJSON(ta.value)); });
    var picker = h('input', { type: 'file', accept: '.json,application/json', style: { display: 'none' } });
    picker.addEventListener('change', function () {
      var f = picker.files && picker.files[0];
      if (!f) return;
      var rd = new FileReader();
      rd.onload = function () { afterRestore(st.importJSON(String(rd.result))); };
      rd.onerror = function () { say(P.restoreFail); };
      rd.readAsText(f);
    });
    var restoreFileBtn = h('button', { class: 'p-btn', type: 'button', text: P.restoreFile });
    restoreFileBtn.addEventListener('click', function () { picker.click(); });

    /* إعادة ضبط لعبة (ضغطتان للتأكيد) */
    var resetBtns = B.catalog.filter(function (c) { return !!B.games[c.id]; }).map(function (c) {
      var armed = false, t = null;
      var b = h('button', { class: 'p-btn warn', type: 'button', 'data-reset': c.id, text: P.resetGame + ' — ' + S.games[c.id] });
      b.addEventListener('click', function () {
        if (!armed) {
          armed = true; b.textContent = P.resetConfirm;
          t = setTimeout(function () { armed = false; b.textContent = P.resetGame + ' — ' + S.games[c.id]; }, 4000);
        } else {
          clearTimeout(t); armed = false;
          st.resetGame(c.id);
          b.textContent = P.resetGame + ' — ' + S.games[c.id];
          say(P.resetDone);
        }
      });
      return b;
    });

    var demoBtn = h('button', { class: 'p-btn', type: 'button', text: P.replayDemo, 'data-act': 'replay-demo' });
    demoBtn.addEventListener('click', function () {
      st.data().demoSeen = {}; st.save(); say(P.replayDemoDone);
    });

    var closeBtn = h('button', { class: 'p-close', type: 'button', 'aria-label': S.buttons.close, text: '✕' });
    closeBtn.addEventListener('click', function () { close(); B.home.show(); });

    var body = h('div', { class: 'p-body scrollable' },
      !st.isPersistent() ? h('div', { class: 'p-warn', text: P.storageWarn }) : null,
      h('section', { class: 'p-sec' }, rows),
      h('section', { class: 'p-sec' }, h('h3', { text: P.lastDays }), chart),
      h('section', { class: 'p-sec' },
        h('h3', { text: P.dailyLimit }),
        h('div', { class: 'p-limit' }, minus, limitVal, plus),
        h('div', { class: 'p-line', text: P.todaySessions + ': ' + UI.num(st.soloSessionsToday()) }),
        openBtn
      ),
      h('section', { class: 'p-sec' }, h('h3', { text: P.weekly }), h('div', { class: 'p-wrap' }, weekBtns)),
      h('section', { class: 'p-sec' }, h('h3', { text: P.sound }), soundBtn, h('div', { class: 'p-line muted', text: P.soundNote })),
      h('section', { class: 'p-sec' },
        h('h3', { text: P.backup }),
        h('div', { class: 'p-wrap' }, copyBtn, fileBtn),
        ta, h('div', { class: 'p-wrap' }, restoreBtn, restoreFileBtn), picker
      ),
      h('section', { class: 'p-sec' }, demoBtn, resetBtns),
      msg
    );

    return h('div', { class: 'parent-overlay', role: 'dialog' },
      h('div', { class: 'p-card' },
        h('header', { class: 'p-head' }, h('h2', { text: P.title }), closeBtn),
        body
      )
    );
  }

  function open() {
    if (overlay) return;
    overlay = build();
    document.body.appendChild(overlay);
    UI.anim(overlay, [{ opacity: 0 }, { opacity: 1 }], { dur: 260 });
  }
  function close() {
    if (!overlay) return;
    overlay.remove();
    overlay = null;
    B.storage.save();
  }

  B.parent = { open: open, close: close, isOpen: function () { return !!overlay; } };
})();
