/* التخزين: localStorage داخل try/catch، مع إصدار للمخطط ودوال ترحيل.
   إن لم يتوفر التخزين يعمل التطبيق من الذاكرة. */
(function () {
  'use strict';
  var B = (window.Bustan = window.Bustan || {});

  var KEY = 'bustan.progress';
  var SCHEMA = 3;
  var GAME_IDS = ['train', 'mirror', 'pattern', 'fruits', 'letters', 'memory', 'shadows', 'more', 'odd', 'tracing', 'feed', 'hide', 'vanish', 'order', 'habitat', 'missing', 'water', 'maze', 'treasure', 'mimic', 'firstsound', 'bridge'];
  var MAX_DAYS = 60;

  var data = null;
  var persistent = false; // هل التخزين الفعلي متاح؟

  function newGame() {
    return { level: 1, smooth: 0, rough: 0, sessions: 0, rounds: 0, last: '' };
  }

  function defaults() {
    var games = {};
    GAME_IDS.forEach(function (id) { games[id] = newGame(); });
    return {
      schemaVersion: SCHEMA,
      created: Date.now(),
      settings: { soundOn: true, timerMin: 0, pin: '', soloLimit: 2, soloLimitOn: false, weeklyConnector: 0, night: false },
      games: games,
      days: {},          // 'YYYY-MM-DD' -> { sessions:{id:n}, rounds:{id:n} }
      lock: { soloOpenDate: '' }, // تاريخ اليوم الذي فتح فيه الوالد «وحدي» رغم الحد
      demoSeen: {},      // id -> true
      garden: [],        // أنواع ما زُرع في «بستاني»
      gallery: [],       // صور «إبداعاتي» (روابط data)
      timer: { date: '', usedMs: 0, extraMs: 0, locked: false },   // مؤقّت وقت اللعب
      stories: {},       // id -> { read:true } القصص التي أُكملت
      last: '',          // آخر لعبة لُعبت (لبطاقة «أكمل»)
      welcomed: false    // هل عُرضت شاشة الترحيب
    };
  }

  /* جدول الترحيل: المفتاح هو الإصدار القديم، والدالة تُرقّي بمقدار واحد.
     عند رفع SCHEMA أضف دالة هنا ولا تغيّر القديمة. */
  var MIGRATIONS = {
    0: function (d) { d.schemaVersion = 1; return d; },
    // ١ → ٢: كان الصوت مطفأً افتراضياً، وصار مفعّلاً؛ نفعّله لمن حُفظ عنده الافتراضي القديم
    1: function (d) { if (d.settings) d.settings.soundOn = true; d.schemaVersion = 2; return d; },
    // ٢ → ٣: البستان وشاشة الترحيب
    2: function (d) { d.garden = d.garden || []; d.schemaVersion = 3; return d; }
  };

  function isObj(x) { return x && typeof x === 'object' && !Array.isArray(x); }

  // دمج عميق للقيم الناقصة من الافتراضات
  function fill(target, def) {
    Object.keys(def).forEach(function (k) {
      if (isObj(def[k])) {
        if (!isObj(target[k])) target[k] = {};
        fill(target[k], def[k]);
      } else if (target[k] === undefined || typeof target[k] !== typeof def[k]) {
        target[k] = def[k];
      }
    });
    return target;
  }

  function migrate(d) {
    if (!isObj(d)) return defaults();
    var v = typeof d.schemaVersion === 'number' ? d.schemaVersion : 0;
    while (v < SCHEMA) {
      var fn = MIGRATIONS[v];
      if (!fn) break;
      d = fn(d);
      v = d.schemaVersion;
    }
    d.schemaVersion = SCHEMA;
    fill(d, defaults());
    // قيود سلامة
    GAME_IDS.forEach(function (id) {
      var g = d.games[id];
      g.level = Math.max(1, Math.min(5, g.level | 0));
    });
    d.settings.soloLimit = Math.max(1, Math.min(9, d.settings.soloLimit | 0));
    return d;
  }

  function probe() {
    try {
      var k = KEY + '.probe';
      window.localStorage.setItem(k, '1');
      window.localStorage.removeItem(k);
      return true;
    } catch (e) { return false; }
  }

  function load() {
    persistent = probe();
    var raw = null;
    if (persistent) {
      try { raw = window.localStorage.getItem(KEY); } catch (e) { raw = null; }
    }
    if (raw) {
      try { data = migrate(JSON.parse(raw)); } catch (e) { data = defaults(); }
    } else {
      data = defaults();
    }
  }

  function save() {
    if (!persistent) return false;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      persistent = false;
      return false;
    }
  }

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function dateKey(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function todayKey() { return dateKey(new Date()); }

  function day(key) {
    key = key || todayKey();
    if (!data.days[key]) data.days[key] = { sessions: {}, rounds: {} };
    return data.days[key];
  }

  function prune() {
    var keys = Object.keys(data.days).sort();
    while (keys.length > MAX_DAYS) delete data.days[keys.shift()];
  }

  function zoneOf(id) {
    var c = B.catalog || [];
    for (var i = 0; i < c.length; i++) if (c[i].id === id) return c[i].zone;
    return 'solo';
  }

  var S = {
    SCHEMA: SCHEMA,
    GAME_IDS: GAME_IDS,
    init: function () { load(); },
    data: function () { return data; },
    save: save,
    isPersistent: function () { return persistent; },
    todayKey: todayKey,
    dateKey: dateKey,
    migrate: migrate,
    defaults: defaults,

    game: function (id) { return data.games[id]; },

    recordRound: function (id) {
      var g = data.games[id];
      data.last = id;
      g.rounds++;
      g.last = todayKey();
      var d = day();
      d.rounds[id] = (d.rounds[id] || 0) + 1;
      prune();
      save();
    },

    recordSession: function (id) {
      data.games[id].sessions++;
      var d = day();
      d.sessions[id] = (d.sessions[id] || 0) + 1;
      save();
    },

    /* عدد جلسات منطقة «وحدي» المكتملة اليوم */
    soloSessionsToday: function () {
      var d = data.days[todayKey()];
      if (!d) return 0;
      var n = 0;
      Object.keys(d.sessions).forEach(function (id) {
        if (zoneOf(id) === 'solo') n += d.sessions[id];
      });
      return n;
    },

    /* هل قسم «وحدي» مقفل اليوم؟ */
    soloLocked: function () {
      if (!data.settings.soloLimitOn) return false;   // الحد اليومي اختياري يفعّله الوالد
      if (data.lock.soloOpenDate === todayKey()) return false;
      return S.soloSessionsToday() >= data.settings.soloLimit;
    },

    openSoloToday: function () { data.lock.soloOpenDate = todayKey(); save(); },

    markDemoSeen: function (id) { data.demoSeen[id] = true; save(); },
    demoSeen: function (id) { return !!data.demoSeen[id]; },

    /* آخر ٧ أيام (الأقدم أولاً): [{key, date, sessions, rounds}] */
    lastDays: function (n) {
      n = n || 7;
      var out = [];
      var now = new Date();
      for (var i = n - 1; i >= 0; i--) {
        var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        var k = dateKey(d);
        var rec = data.days[k];
        var s = 0, r = 0;
        if (rec) {
          Object.keys(rec.sessions).forEach(function (x) { s += rec.sessions[x]; });
          Object.keys(rec.rounds).forEach(function (x) { r += rec.rounds[x]; });
        }
        out.push({ key: k, date: d, sessions: s, rounds: r });
      }
      return out;
    },

    resetGame: function (id) {
      data.games[id] = newGame();
      delete data.demoSeen[id];
      save();
    },

    exportJSON: function () { return JSON.stringify(data); },

    /* استعادة: تُرجع true عند النجاح. لا تمسّ البيانات الحالية إن فشلت. */
    importJSON: function (text) {
      try {
        var parsed = JSON.parse(text);
        if (!isObj(parsed) || !isObj(parsed.games)) return false;
        if (typeof parsed.schemaVersion === 'number' && parsed.schemaVersion > SCHEMA) return false;
        data = migrate(parsed);
        save();
        return true;
      } catch (e) { return false; }
    }
  };

  B.storage = S;
})();
