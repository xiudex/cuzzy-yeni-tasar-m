/* ═══ 24. ONBOARDING TOUR (10 ADIM) ═══ */

const TOUR_STEPS = [
  {
    target: () => document.querySelector('.topnav-logo'),
    get title() { return t('tour_1_title'); },
    get text() { return t('tour_1_text'); },
    page: 'home'
  },
  {
    target: () => document.querySelector('.kpi-grid'),
    get title() { return t('tour_2_title'); },
    get text() { return t('tour_2_text'); },
    page: 'home'
  },
  {
    target: () => document.querySelector('[data-tour="quick-add"]'),
    get title() { return t('tour_3_title'); },
    get text() { return t('tour_3_text'); },
    page: 'home'
  },
  {
    target: () => document.querySelector('.ticker-wrap'),
    get title() { return t('tour_4_title'); },
    get text() { return t('tour_4_text'); },
    page: 'home'
  },
  {
    target: () => document.querySelector('[data-nav="finans"]'),
    get title() { return t('tour_5_title'); },
    get text() { return t('tour_5_text'); },
    page: 'home'
  },
  {
    target: () => document.querySelector('[data-nav="yatirim"]'),
    get title() { return t('tour_6_title'); },
    get text() { return t('tour_6_text'); },
    page: 'home'
  },
  {
    target: () => document.getElementById('settingsBtn'),
    get title() { return t('tour_7_title'); },
    get text() { return t('tour_7_text'); },
    page: 'home'
  },
  {
    target: () => document.querySelector('.kpi-card.balance'),
    get title() { return t('tour_8_title'); },
    get text() { return t('tour_8_text'); },
    page: 'home'
  },
  {
    target: () => document.querySelector('.topnav-avatar'),
    get title() { return t('tour_9_title'); },
    get text() { return t('tour_9_text'); },
    page: 'home'
  },
  {
    target: () => document.querySelector('[data-tour="quick-add"]'),
    get title() { return t('tour_10_title'); },
    get text() { return t('tour_10_text'); },
    page: 'home'
  }
];

let tourIndex = 0;
let tourActive = false;

function isMobileDevice() {
  return window.innerWidth < 768 || /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

let tourManualStart = false;

function startTour(manual) {
  if (isMobileView()) { try { toast(t('toast_tour_no_mobile')); } catch (e) {} return; }
  tourManualStart = manual === true;
  // Mobilde tur açma — sessizce tamamlanmış say
  if (isMobileDevice()) {
    if (!S.tourCompleted) {
      S.tourCompleted = true;
      save();
    }
    // Eğer kullanıcı manuel olarak Ayarlar > Görünüm > Turu başlat dedi ise toast
    if (tourManualStart) toast(t('toast_tour_desktop_only'), 't-info');
    tourManualStart = false;
    return;
  }
  tourIndex = 0;
  tourActive = true;
  goTo('home');
  document.getElementById('tourOverlay').classList.add('show');
  setTimeout(() => showTourStep(0), 400);
}

function showTourStep(i) {
  if (i < 0 || i >= TOUR_STEPS.length) return endTour(true);
  tourIndex = i;
  const step = TOUR_STEPS[i];

  if (step.page && step.page !== currentPage) goTo(step.page);

  setTimeout(() => {
    const target = step.target();
    const card = document.getElementById('tourCard');
    const spotlight = document.getElementById('tourSpotlight');

    document.getElementById('tourStepLabel').textContent = `${i + 1} / ${TOUR_STEPS.length}`;
    document.getElementById('tourTitle').textContent = step.title;
    document.getElementById('tourText').textContent = step.text;

    // Progress dots
    const prog = document.getElementById('tourProgress');
    prog.innerHTML = TOUR_STEPS.map((_, j) => `<div class="tour-progress-dot ${j === i ? 'active' : ''}"></div>`).join('');

    // Önceki/Sonraki butonlar
    document.getElementById('tourPrev').style.visibility = i === 0 ? 'hidden' : 'visible';
    document.getElementById('tourNext').textContent = i === TOUR_STEPS.length - 1 ? 'Bitir ' : 'İleri →';

    // Kart artık hedefe göre konumlanır (sabit değil): hedefin altına sığarsa
    // alta, sığmazsa üstüne; ekran dışına taşmayacak şekilde sabitlenir.
    card.style.display = 'block';

    if (target && target.getBoundingClientRect) {
      try { target.scrollIntoView({ block: 'center', behavior: 'instant' }); }
      catch (e) { try { target.scrollIntoView(); } catch (_) {} }
      const rect = target.getBoundingClientRect();
      const padding = 8;
      spotlight.style.display = 'block';
      spotlight.style.top = (rect.top - padding) + 'px';
      spotlight.style.left = (rect.left - padding) + 'px';
      spotlight.style.width = (rect.width + padding * 2) + 'px';
      spotlight.style.height = (rect.height + padding * 2) + 'px';
      spotlight.classList.add('show');
      document.getElementById('tourOverlay').classList.add('has-spotlight');

      // Kartı hedefe yakın konumlandır
      const vw = window.innerWidth, vh = window.innerHeight;
      const cardW = card.offsetWidth || 360, cardH = card.offsetHeight || 200;
      const gap = 16;
      let top;
      if (vh - rect.bottom >= cardH + gap + 12) top = rect.bottom + gap;          // alta
      else if (rect.top >= cardH + gap + 12)    top = rect.top - cardH - gap;     // üste
      else                                       top = vh - cardH - 12;            // sığmazsa alt kenar
      let left = rect.left + rect.width / 2 - cardW / 2;                           // hedefle ortala
      left = Math.min(Math.max(12, left), vw - cardW - 12);
      top  = Math.min(Math.max(12, top),  vh - cardH - 12);
      card.style.top = top + 'px';
      card.style.left = left + 'px';
      card.style.right = 'auto';
      card.style.bottom = 'auto';
      card.style.transform = 'none';
    } else {
      spotlight.style.display = 'none';
      document.getElementById('tourOverlay').classList.remove('has-spotlight');
      // Hedef yoksa CSS'e bırak (ekran alt-ortası, kayma animasyonu korunur)
      card.style.top = ''; card.style.left = ''; card.style.right = '';
      card.style.bottom = ''; card.style.transform = '';
    }
    setTimeout(() => card.classList.add('show'), 30);
  }, 200);
}

function nextTourStep() {
  if (tourIndex >= TOUR_STEPS.length - 1) return endTour(true);
  document.getElementById('tourCard').classList.remove('show');
  setTimeout(() => showTourStep(tourIndex + 1), 250);
}

function prevTourStep() {
  if (tourIndex <= 0) return;
  document.getElementById('tourCard').classList.remove('show');
  setTimeout(() => showTourStep(tourIndex - 1), 250);
}

function skipTour() {
  endTour(false);
}

function endTour(completed) {
  tourActive = false;
  document.getElementById('tourOverlay').classList.remove('show');
  document.getElementById('tourOverlay').classList.remove('has-spotlight');
  document.getElementById('tourSpotlight').style.display = 'none';
  document.getElementById('tourSpotlight').classList.remove('show');
  const card = document.getElementById('tourCard');
  card.classList.remove('show');
  setTimeout(() => {
    card.style.display = 'none';
    card.style.top = '';
    card.style.left = '';
    card.style.right = '';
    card.style.bottom = '';
    card.style.transform = '';
  }, 400);
  // Tour ne sebeple kapanırsa kapansın bir daha gösterme
  // (kullanıcı manuel olarak Ayarlar > Görünüm'den tekrar başlatabilir)
  if (!S.tourCompleted) {
    S.tourCompleted = true;
    save();
  }
  if (completed) {
    toast(t('toast_tour_completed'), 't-ok');
  }
}

/* ═══ 25. BOOT ═══ */

window.addEventListener('DOMContentLoaded', () => {
  // Tema/wallpaper kayıtlı varsa hemen uygula (auth gelmeden)
  try {
    const cached = localStorage.getItem('cuzzy_visual_v4');
    if (cached) {
      const v = JSON.parse(cached);
      if (v.theme) document.documentElement.setAttribute('data-theme', v.theme);
      if (v.wallpaper) document.documentElement.setAttribute('data-wallpaper', v.wallpaper);
      if (v.animSpeed && v.animSpeed !== 'normal') document.documentElement.classList.add('anim-' + v.animSpeed);
      if (typeof v.glassDensity === 'number' && typeof applyGlassBlur === 'function') applyGlassBlur(v.glassDensity);
    }
  } catch {}

  attachAuthListener();
});

// Tema/wallpaper değişince localStorage'a yaz (anında flicker önler)
window.addEventListener('storage-visual-update', () => {
  try {
    localStorage.setItem('cuzzy_visual_v4', JSON.stringify({
      theme: S.theme, wallpaper: S.wallpaper,
      animSpeed: S.animSpeed || 'normal',
      glassDensity: typeof S.glassDensity === 'number' ? S.glassDensity : 40
    }));
  } catch {}
});

// Eski setTheme/setWallpaper'ları wrap et
const _origSetTheme = setTheme;
setTheme = function(t) {
  _origSetTheme(t);
  try { if (typeof cacheVisual === 'function') cacheVisual(); } catch {}
};
const _origSetWallpaper = setWallpaper;
setWallpaper = function(w) {
  _origSetWallpaper(w);
  try { if (typeof cacheVisual === 'function') cacheVisual(); } catch {}
};

// Window unload — temizlik
window.addEventListener('beforeunload', () => {
  if (unsubscribeSnapshot) try { unsubscribeSnapshot(); } catch {}
  clearMarketIntervals();
});

function showRepairNoticeIfNeeded() {
  if (!localStorage.getItem('cuzzy_repair_v1')) {
    document.getElementById('repairNoticeOverlay').classList.remove('hidden');
  }
}

function dismissRepairNotice() {
  localStorage.setItem('cuzzy_repair_v1', '1');
  document.getElementById('repairNoticeOverlay').classList.add('hidden');
  if (!localStorage.getItem('cuzzy_features_v1')) {
    setTimeout(() => document.getElementById('featuresNoticeOverlay').classList.remove('hidden'), 350);
  }
}

function dismissFeaturesNotice() {
  localStorage.setItem('cuzzy_features_v1', '1');
  document.getElementById('featuresNoticeOverlay').classList.add('hidden');
}

/* ═══ ANA PANEL — SADE ÖZELLEŞTİRİCİ — mantık (zoom/tutamaç yok; veri aynı) ═══ */
(function () {
  var TOK = { t: 4, h: 6, tt: 8, f: 12 };
  var W = {
    summary:  { t: 'Gelir · Gider · Net', min: 6, def: 12 },
    quickadd: { t: 'Hızlı işlem',          min: 4, def: 4 },
    goals:    { t: 'Hedefler',             min: 4, def: 4 },
    account:  { t: 'Hesap özeti',          min: 4, def: 4 },
    note:     { t: 'Yapışkan not',         min: 4, def: 4 },
    recurring:{ t: 'Tekrarlayan & Borç',   min: 4, def: 4 },
    multi:    { t: 'Çoklu işlem',          min: 4, def: 4 },
    market:   { t: 'Canlı piyasa',         min: 6, def: 12 },
    recent:   { t: 'Son hareketler',       min: 6, def: 12 },
    kisayol:  { t: 'Hızlı erişim',         min: 4, def: 6 }
  };
  var ORIG = ['summary', 'quickadd', 'goals', 'account', 'note', 'recurring', 'multi', 'market', 'recent'];
  var DEFHID = { kisayol: 1, goals: 1, recurring: 1, multi: 1 };
  var ORDER = ORIG.concat(['kisayol']);
  var LINKS = [
    { n: 'Finans', d: 'İşlem, tekrarlayan, hedefler — hepsi tek yerde', fn: "goTo('finans')" },
    { n: 'Ekstre yükle', d: 'Banka ekstresini içe aktar', fn: "goTo('finans','ekstre')" },
    { n: 'Portföy', d: 'Yatırım ve canlı piyasa', fn: "goTo('yatirim')" }
  ];
  function makeWidget(id) {
    if (id !== 'kisayol') return null;
    var d = document.createElement('div'); d.className = 'home-col-card'; d.setAttribute('data-wid', 'kisayol');
    var h = '<div class="card-title"><span class="card-title-text">Hızlı erişim</span></div><div class="kx-list">';
    LINKS.forEach(function (l) { h += '<button type="button" class="kx-item" onclick="' + l.fn + '"><span class="kx-n">' + l.n + '</span><span class="kx-d">' + l.d + '</span></button>'; });
    h += '</div>';
    d.innerHTML = h;
    return d;
  }
  var WIDTHS = [{ s: 4, n: 'Dar' }, { s: 6, n: 'Orta' }, { s: 8, n: 'Geniş' }, { s: 12, n: 'Tam' }];

  function spanOf(it) {
    var s = it.size;
    if (typeof s === 'string') { s = TOK[s] !== undefined ? TOK[s] : parseInt(s, 10); }
    if (typeof s !== 'number' || isNaN(s)) s = W[it.id].def;
    return Math.max(W[it.id].min, Math.min(12, Math.round(s)));
  }
  function tpl(list) {
    var used = {}, out = [];
    list.forEach(function (p) { out.push({ id: p[0], size: p[1], hidden: false }); used[p[0]] = 1; });
    ORDER.forEach(function (id) { if (!used[id]) out.push({ id: id, size: W[id].def, hidden: true }); });
    return out;
  }
  var TEMPLATES = {
    default:   tpl([['summary', 12], ['quickadd', 4], ['account', 4], ['goals', 4], ['market', 12], ['recent', 12]]),
    sade:      tpl([['summary', 12], ['account', 6], ['recent', 12]]),
    yatirimci: tpl([['summary', 12], ['market', 12], ['kisayol', 6], ['account', 6], ['recent', 12]])
  };
  var ACCENT_VARS = ['--accent', '--accent-rgb', '--accent2', '--accent2-rgb', '--accent-soft', '--accent-strong', '--accent-glow'];

  var editing = false, drawer, overlay, built = false, selId = null, lastSig = '';
  function _S() { return (typeof S !== 'undefined') ? S : null; }
  function gid(x) { return document.getElementById(x); }
  function wEl(id) { return document.querySelector('.hw[data-hw="' + id + '"]'); }
  function clearSel() { document.querySelectorAll('.hw.sel').forEach(function (w) { w.classList.remove('sel'); }); }

  function getLayout() {
    var st = _S();
    var raw = (st && Array.isArray(st.homeLayout) && st.homeLayout.length) ? st.homeLayout : TEMPLATES.default;
    var seen = {}, out = [];
    raw.forEach(function (it) {
      if (!it || !W[it.id] || seen[it.id]) return;
      seen[it.id] = 1;
      out.push({ id: it.id, size: spanOf(it), hidden: it.hidden === true });
    });
    ORDER.forEach(function (id) { if (!seen[id]) out.push({ id: id, size: W[id].def, hidden: !!DEFHID[id] }); });
    return out;
  }
  function layoutSig() { var st = _S(); return JSON.stringify((st && st.homeLayout) || []) + '|' + JSON.stringify((st && st.homeAppearance) || {}); }
  function saveLayout(L) { var st = _S(); if (st) { st.homeLayout = L; lastSig = layoutSig(); if (typeof save === 'function') save(); } }
  function getApp() { var a = (_S() && _S().homeAppearance) || {}; return { card: a.card === 'raised' ? 'raised' : 'glass', accent: typeof a.accent === 'string' ? a.accent : '' }; }
  function saveApp(a) { var st = _S(); if (st) { st.homeAppearance = a; lastSig = layoutSig(); if (typeof save === 'function') save(); } }
  function cardColors() { var st = _S(); if (!st) return {}; if (!st.homeColors || typeof st.homeColors !== 'object' || Array.isArray(st.homeColors)) st.homeColors = {}; return st.homeColors; }
  function applyColor(id) {
    var w = wEl(id); if (!w) return;
    var blk = w.querySelector('[data-wid]'); if (!blk) return;
    var col = cardColors()[id];
    if (col) { blk.style.setProperty('--ctint', col); blk.classList.add('hc-tinted'); }
    else { blk.style.removeProperty('--ctint'); blk.classList.remove('hc-tinted'); }
  }
  function applyAllColors() { try { getLayout().forEach(function (it) { applyColor(it.id); }); } catch (e) {} }
  function applyCardColorLive(hex) { if (!selId || !/^#[0-9a-fA-F]{6}$/.test(hex)) return; cardColors()[selId] = hex; applyColor(selId); }
  function setCardColor(hex) { if (!selId || !/^#[0-9a-fA-F]{6}$/.test(hex)) return; cardColors()[selId] = hex; if (typeof save === 'function') save(); applyColor(selId); updateSelSection(); }
  function clearCardColor() { if (!selId) return; delete cardColors()[selId]; if (typeof save === 'function') save(); applyColor(selId); updateSelSection(); }
  function hexRgb(h) { var m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h); return m ? (parseInt(m[1], 16) + ', ' + parseInt(m[2], 16) + ', ' + parseInt(m[3], 16)) : null; }

  function flipMove(change) {
    var canvas = gid('homeCanvas');
    var items = canvas ? [].slice.call(canvas.querySelectorAll('.hw')).filter(function (i) { return i.style.display !== 'none'; }) : [];
    var first = items.map(function (i) { return i.getBoundingClientRect(); });
    change();
    var last = items.map(function (i) { return i.getBoundingClientRect(); });
    items.forEach(function (it, idx) {
      if (!last[idx]) return;
      var dx = first[idx].left - last[idx].left, dy = first[idx].top - last[idx].top;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
      it.style.transition = 'none'; it.style.transformOrigin = 'top left';
      it.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
    });
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      items.forEach(function (it) { it.style.transition = 'transform 0.6s cubic-bezier(0.34, 1, 0.4, 1)'; it.style.transform = ''; });
      setTimeout(function () { items.forEach(function (it) { it.style.transition = ''; }); }, 660);
    }); });
  }

  function render() {
    var home = gid('page-home'), canvas = gid('homeCanvas');
    if (!home || !canvas) return;
    var store = {};
    home.querySelectorAll('[data-wid]').forEach(function (el) { store[el.dataset.wid] = el; });
    Object.keys(store).forEach(function (k) { var el = store[k]; if (el.parentNode) el.parentNode.removeChild(el); });
    canvas.innerHTML = '';
    getLayout().forEach(function (it) {
      var block = store[it.id] || makeWidget(it.id); if (!block) return;
      var w = document.createElement('div');
      w.className = 'hw'; w.setAttribute('data-hw', it.id); w.dataset.size = it.size;
      w.style.gridColumn = 'span ' + it.size;
      if (it.hidden) w.style.display = 'none';
      w.appendChild(block);
      var rm = document.createElement('button');
      rm.type = 'button'; rm.className = 'hw-rm'; rm.textContent = '\u2212'; rm.setAttribute('aria-label', 'Kaldır');
      rm.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
      rm.addEventListener('click', function (e) { e.stopPropagation(); removeW(it.id); });
      w.appendChild(rm);
      w.addEventListener('pointerdown', function (e) { onWidgetDown(e, it.id); });
      canvas.appendChild(w);
    });
    applyApp();
    applyAllColors();
  }

  function build() {
    var home = gid('page-home');
    if (!home || built) return;
    var canvas = document.createElement('div');
    canvas.id = 'homeCanvas'; canvas.className = 'home-canvas';
    var header = home.querySelector('.page-header'), oldGrid = home.querySelector('.home-grid');
    if (header && header.nextSibling) home.insertBefore(canvas, header.nextSibling);
    else home.appendChild(canvas);
    built = true; render();
    if (oldGrid && oldGrid.parentNode) oldGrid.remove();
  }

  function markSel(id) { document.querySelectorAll('.hw').forEach(function (w) { w.classList.toggle('sel', w.dataset.hw === id); }); }
  function select(id) { if (selId === id) { deselect(); return; } selId = id; markSel(id); updateSelSection(); }
  function deselect() { selId = null; clearSel(); updateSelSection(); }

  /* TAP = seç · SÜRÜKLE = sırala (sakin marker; reflow sadece bırakınca) */
  var dragMarker = null;
  function placeMarker(best, after) {
    var canvas = gid('homeCanvas');
    if (!dragMarker) { dragMarker = document.createElement('div'); dragMarker.className = 'hw-marker'; }
    if (dragMarker.parentNode !== canvas) canvas.appendChild(dragMarker);
    dragMarker.classList.toggle('after', !!after);
    dragMarker.style.left = best.offsetLeft + 'px';
    dragMarker.style.top = best.offsetTop + 'px';
    dragMarker.style.width = best.offsetWidth + 'px';
    dragMarker.style.height = best.offsetHeight + 'px';
  }
  function clearMarker() { if (dragMarker && dragMarker.parentNode) dragMarker.parentNode.removeChild(dragMarker); }
  function onWidgetDown(e, id) {
    if (!editing) return;
    if (e.target.closest('.hw-rm')) return;
    var sx = e.clientX, sy = e.clientY, moved = false, dragging = false;
    var w = wEl(id), clone = null, offX = 0, offY = 0, tBest = null, tAfter = false;
    function mv(ev) {
      if (!moved && Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) > 8) { moved = true; dragging = true; begin(ev); }
      if (dragging) drag(ev);
    }
    function begin(ev) {
      var r = w.getBoundingClientRect();
      clone = w.cloneNode(true);
      clone.className = 'hw hw-clone';
      clone.removeAttribute('data-hw');
      clone.querySelectorAll('[id]').forEach(function (el) { el.removeAttribute('id'); });
      clone.querySelectorAll('.hw-rm, .hw-h').forEach(function (el) { el.parentNode && el.parentNode.removeChild(el); });
      clone.style.width = r.width + 'px'; clone.style.height = r.height + 'px';
      document.body.appendChild(clone);
      offX = ev.clientX - r.left; offY = ev.clientY - r.top;
      clone.style.transform = 'translate(' + (ev.clientX - offX) + 'px,' + (ev.clientY - offY) + 'px) scale(1.03)';
      w.classList.add('hw-dragging');
    }
    function drag(ev) {
      if (clone) clone.style.transform = 'translate(' + (ev.clientX - offX) + 'px,' + (ev.clientY - offY) + 'px) scale(1.03)';
      var canvas = gid('homeCanvas');
      var items = [].slice.call(canvas.querySelectorAll('.hw')).filter(function (x) { return x.style.display !== 'none' && x.dataset.hw !== id; });
      var over = null, best = null, bd = 1e9;
      items.forEach(function (x) {
        var r = x.getBoundingClientRect();
        if (ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom) over = x;
        var d = Math.hypot(ev.clientX - (r.left + r.width / 2), ev.clientY - (r.top + r.height / 2));
        if (d < bd) { bd = d; best = x; }
      });
      tBest = over || best; tAfter = false;
      if (tBest) placeMarker(tBest, false); else clearMarker();
    }
    function up() {
      document.removeEventListener('pointermove', mv);
      document.removeEventListener('pointerup', up);
      clearMarker();
      if (clone && clone.parentNode) clone.parentNode.removeChild(clone);
      if (dragging) {
        if (w) w.classList.remove('hw-dragging');
        if (tBest && tBest.dataset.hw !== id) {
          var target = tBest;
          flipMove(function () { swapNodes(w, target); });
          saveOrderFromDOM();
        }
      } else { select(id); }
    }
    document.addEventListener('pointermove', mv);
    document.addEventListener('pointerup', up);
  }
  function swapNodes(a, b) {
    if (!a || !b || a === b) return;
    var t = document.createComment('swap');
    a.parentNode.insertBefore(t, a);
    b.parentNode.insertBefore(a, b);
    t.parentNode.insertBefore(b, t);
    t.parentNode.removeChild(t);
  }
  function saveOrderFromDOM() {
    var canvas = gid('homeCanvas');
    var orderIds = [].slice.call(canvas.querySelectorAll('.hw')).map(function (x) { return x.dataset.hw; });
    var L = getLayout(), map = {}; L.forEach(function (x) { map[x.id] = x; });
    var newL = []; orderIds.forEach(function (id) { if (map[id]) { newL.push(map[id]); delete map[id]; } });
    Object.keys(map).forEach(function (id) { newL.push(map[id]); });
    saveLayout(newL);
  }

  function setWidth(span) {
    if (!selId) return;
    var L = getLayout(), it = L.filter(function (x) { return x.id === selId; })[0]; if (!it) return;
    var lo = W[selId].min, sp = Math.max(lo, Math.min(12, span));
    var w = wEl(selId); if (!w) return;
    flipMove(function () { it.size = sp; w.dataset.size = sp; w.style.gridColumn = 'span ' + sp; });
    saveLayout(L); updateSelSection();
  }
  function removeW(id) {
    var L = getLayout(), it = L.filter(function (x) { return x.id === id; })[0]; if (!it) return;
    if (selId === id) deselect();
    flipMove(function () { it.hidden = true; var w = wEl(id); if (w) w.style.display = 'none'; });
    saveLayout(L); buildCatalog();
  }
  function addW(id) {
    var L = getLayout(), it = L.filter(function (x) { return x.id === id; })[0]; if (!it) return;
    it.hidden = false; saveLayout(L); render(); buildCatalog();
  }
  function toggleW(id) { var L = getLayout(), it = L.filter(function (x) { return x.id === id; })[0]; if (!it) return; if (it.hidden) addW(id); else removeW(id); }
  function applyTemplate(name) {
    deselect();
    if (name === 'default') { saveApp({ card: 'glass', accent: '' }); clearAccent(); }
    var t = TEMPLATES[name] || TEMPLATES.default;
    saveLayout(t.map(function (x) { return { id: x.id, size: x.size, hidden: x.hidden }; }));
    render(); buildCatalog();
  }

  function clearAccent() { ACCENT_VARS.forEach(function (v) { document.documentElement.style.removeProperty(v); }); }
  function applyAccent(hex) {
    var rgb = hexRgb(hex); if (!rgb) return;
    var d = document.documentElement.style;
    d.setProperty('--accent', hex); d.setProperty('--accent-rgb', rgb);
    d.setProperty('--accent2', hex); d.setProperty('--accent2-rgb', rgb);
    d.setProperty('--accent-soft', 'rgba(' + rgb + ', 0.10)');
    d.setProperty('--accent-strong', 'rgba(' + rgb + ', 0.26)');
    d.setProperty('--accent-glow', 'rgba(' + rgb + ', 0.28)');
  }
  function applyApp() {
    var canvas = gid('homeCanvas'), a = getApp();
    if (canvas) canvas.classList.toggle('raised', a.card === 'raised');
    if (a.accent) applyAccent(a.accent); else clearAccent();
    syncControls();
  }
  function buildCatalog() {
    var box = gid('hcCat'); if (!box) return;
    var L = getLayout(); box.innerHTML = '';
    ORDER.forEach(function (id) {
      var it = L.filter(function (x) { return x.id === id; })[0], vis = it && !it.hidden;
      var b = document.createElement('button'); b.type = 'button'; b.textContent = W[id].t;
      b.className = vis ? 'on' : ''; b.addEventListener('click', function () { toggleW(id); });
      box.appendChild(b);
    });
  }
  function updateSelSection() {
    var box = gid('hcSelBody'); if (!box) return;
    if (!selId) { box.innerHTML = '<div class="hc-help" style="margin:0">Bir karta dokun → boyutunu ve rengini ayarla.</div>'; return; }
    var L = getLayout(), it = L.filter(function (x) { return x.id === selId; })[0]; if (!it) { box.innerHTML = ''; return; }
    var cur = it.size, lo = W[selId].min;
    var html = '<div class="hc-selname">' + (W[selId].t || '') + '</div><div class="hc-w">';
    WIDTHS.forEach(function (o) {
      if (o.s < lo) return;
      html += '<button type="button" data-s="' + o.s + '" class="' + (o.s === cur ? 'on' : '') + '">' + o.n + '</button>';
    });
    html += '</div>';
    var curCol = (cardColors()[selId] || '').toLowerCase();
    html += '<div class="hc-clbl">Kart rengi</div><div class="hc-colors">';
    ['#AF52DE', '#007AFF', '#34C759', '#FF9500', '#FF2D55', '#5AC8FA'].forEach(function (c) {
      html += '<span class="hc-cdot' + (curCol === c.toLowerCase() ? ' on' : '') + '" data-col="' + c + '" style="background:' + c + '"></span>';
    });
    html += '<label class="hc-ccustom"><input type="color" class="hc-cinput" value="' + (curCol || '#af52de') + '" aria-label="Özel renk"></label>';
    html += '</div>';
    if (curCol) html += '<button type="button" class="hc-creset">Rengi sıfırla</button>';
    html += '<button type="button" class="hc-rm-btn" data-rm="1">Bu kartı kaldır</button>';
    box.innerHTML = html;
    box.querySelector('.hc-w').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) setWidth(parseInt(b.dataset.s, 10)); });
    box.querySelectorAll('.hc-cdot').forEach(function (d) { d.addEventListener('click', function () { setCardColor(d.dataset.col); }); });
    var ci = box.querySelector('.hc-cinput');
    if (ci) {
      ci.addEventListener('input', function () { applyCardColorLive(ci.value); });
      ci.addEventListener('change', function () { setCardColor(ci.value); });
    }
    var cr = box.querySelector('.hc-creset'); if (cr) cr.addEventListener('click', clearCardColor);
    box.querySelector('.hc-rm-btn').addEventListener('click', function () { removeW(selId); });
  }
  function syncControls() {
    var a = getApp();
    document.querySelectorAll('#hcCard button').forEach(function (b) { b.classList.toggle('on', b.dataset.card === a.card); });
    var dark = _S() && (_S().theme === 'black' || _S().theme === 'grey');
    document.querySelectorAll('#hcBg button').forEach(function (b) { b.classList.toggle('on', (b.dataset.th === 'black') === !!dark); });
    document.querySelectorAll('#hcAcc span').forEach(function (d) { d.classList.toggle('on', !!a.accent && d.dataset.c && d.dataset.c.toLowerCase() === a.accent.toLowerCase()); });
  }

  function buildDrawer() {
    if (drawer) return;
    overlay = document.createElement('div'); overlay.className = 'hc-overlay';
    overlay.addEventListener('click', function () { if (selId) deselect(); else close(); });
    drawer = document.createElement('aside'); drawer.className = 'hc-drawer'; drawer.id = 'hcDrawer';
    drawer.innerHTML =
      '<div class="hc-scroll">' +
        '<div class="hc-title">Paneli özelleştir</div>' + 
        '<div class="hc-beta">bu bölüm geliştiriliyor, bazı şeyler hatalı çalışabilir. Verilerin etkilenmez.</div>' +
        '<p class="hc-help">Karta dokun → Sürükle → yerini değiştir.</p>' +
        '<div class="hc-sec"><div class="hc-lbl">Seçili kart</div><div id="hcSelBody"></div></div>' +
        '<div class="hc-sec"><div class="hc-lbl">Başlangıç düzeni</div><div class="hc-tpls" id="hcTpl">' +
          '<button type="button" data-tpl="default">Varsayılan</button>' +
          '<button type="button" data-tpl="sade">Sade</button>' +
          '<button type="button" data-tpl="yatirimci">Yatırımcı</button></div></div>' +
        '<div class="hc-sec"><div class="hc-lbl">Arka plan</div><div class="hc-chips" id="hcBg">' +
          '<button type="button" data-th="light">Beyaz</button>' +
          '<button type="button" data-th="black">Siyah</button></div></div>' +
        '<div class="hc-sec"><div class="hc-lbl">Kart stili</div><div class="hc-chips" id="hcCard">' +
          '<button type="button" data-card="glass">Şeffaf</button>' +
          '<button type="button" data-card="raised">Kabarık</button></div></div>' +
        '<div class="hc-sec"><div class="hc-lbl">Buton renkleri (belirli butonlar)</div><div class="hc-dots" id="hcAcc">' +
          '<span data-c="#007AFF" style="background:#007AFF"></span>' +
          '<span data-c="#34C759" style="background:#34C759"></span>' +
          '<span data-c="#AF52DE" style="background:#AF52DE"></span>' +
          '<span data-c="#FF9500" style="background:#FF9500"></span>' +
          '<span data-c="#FF2D55" style="background:#FF2D55"></span>' +
          '<label class="hc-custom"><input type="color" id="hcColor" value="#007AFF" aria-label="Özel renk"></label></div></div>' +
        '<div class="hc-sec"><div class="hc-lbl">Kartlar (Widget)</div><div class="hc-cat" id="hcCat"></div></div>' +
      '</div>' +
      '<div class="hc-toolbar">' +
        '<button type="button" class="hc-tool-btn" id="hcReset">Sıfırla</button>' +
        '<button type="button" class="hc-tool-btn hc-done" id="hcDone">Bitti</button>' +
      '</div>';
    document.body.appendChild(overlay);
    document.body.appendChild(drawer);

    drawer.querySelector('#hcTpl').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) applyTemplate(b.dataset.tpl); });
    drawer.querySelector('#hcBg').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (typeof setTheme === 'function') setTheme(b.dataset.th);
      if (typeof setWallpaper === 'function') setWallpaper(b.dataset.th);
      applyApp();
    });
    drawer.querySelector('#hcCard').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var a = getApp(); a.card = b.dataset.card; saveApp(a); applyApp();
    });
    drawer.querySelector('#hcAcc').addEventListener('click', function (e) {
      var d = e.target.closest('span'); if (!d || !d.dataset.c) return;
      var a = getApp(); a.accent = d.dataset.c; saveApp(a); applyApp();
    });
    drawer.querySelector('#hcColor').addEventListener('input', function () {
      var a = getApp(); a.accent = this.value; saveApp(a); applyApp();
    });
    drawer.querySelector('#hcReset').addEventListener('click', function () { var st = _S(); if (st) st.homeColors = {}; applyTemplate('default'); });
    drawer.querySelector('#hcDone').addEventListener('click', close);
  }

  function open() {
    if (typeof goTo === 'function') goTo('home');
    build(); buildDrawer();
    editing = true; selId = null;
    var canvas = gid('homeCanvas'); if (canvas) canvas.classList.add('editing');
    document.body.classList.add('hc-open');
    buildCatalog(); syncControls(); updateSelSection();
    requestAnimationFrame(function () { drawer.classList.add('open'); overlay.classList.add('show'); });
  }
  function close() {
    editing = false; selId = null; clearSel();
    var canvas = gid('homeCanvas'); if (canvas) canvas.classList.remove('editing');
    document.body.classList.remove('hc-open');
    if (drawer) drawer.classList.remove('open');
    if (overlay) overlay.classList.remove('show');
    var st = _S(); if (st) { st.homeOnboarded = true; if (typeof save === 'function') save(); }
  }

  window.openHomeCustomizer = function () {
    if (typeof isCustomizerSupported === 'function' && !isCustomizerSupported()) { showCustomizerNA(); return; }
    return open.apply(this, arguments);
  };
  window.closeHomeCustomizer = close;

  function maybeSync() {
    if (editing) { applyApp(); return; }
    var sig = layoutSig();
    if (sig !== lastSig) { lastSig = sig; if (!built) build(); else render(); }
    else applyApp();
  }
  function init() {
    build();
    if (typeof renderAll === 'function') {
      var _orig = renderAll;
      renderAll = function () { _orig.apply(this, arguments); maybeSync(); };
      window.renderAll = renderAll;
    }
    applyApp();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();


  /* ═══ ÖZEL SELECT & TAKVİM BİLEŞENİ (native kontrolleri siteye uyumlu hale getirir) ═══ */
(function () {
  let __czOpen = null; // { pop, wrap }
  const CAL_MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const CAL_DOW = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pa'];
  const CAL_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';

  function ymd(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function positionPop(pop, anchor) {
    const r = anchor.getBoundingClientRect();
    pop.style.minWidth = r.width + 'px';
    pop.style.visibility = 'hidden';
    pop.style.display = 'block';
    const ph = pop.offsetHeight, pw = pop.offsetWidth;
    let top = r.bottom + 6, up = false;
    if (top + ph > window.innerHeight - 8 && r.top - ph - 6 > 8) { top = r.top - ph - 6; up = true; }
    let left = r.left;
    if (left + pw > window.innerWidth - 8) left = window.innerWidth - 8 - pw;
    if (left < 8) left = 8;
    pop.style.top = top + 'px';
    pop.style.left = left + 'px';
    pop.classList.toggle('up', up);
    pop.style.visibility = '';
  }

  function showPop(pop, wrap, anchor) {
    closePop();
    __czOpen = { pop, wrap };
    wrap.classList.add('open');
    positionPop(pop, anchor);
    requestAnimationFrame(() => pop.classList.add('in'));
  }

  function closePop() {
    if (!__czOpen) return;
    const { pop, wrap } = __czOpen;
    __czOpen = null;
    wrap.classList.remove('open');
    pop.classList.remove('in');
    setTimeout(() => { if (!pop.classList.contains('in')) pop.style.display = 'none'; }, 240);
  }

  /* ---------- SELECT ---------- */
  function enhanceSelect(sel) {
    if (sel.dataset.czEnhanced) return;
    sel.dataset.czEnhanced = '1';

    const wrap = document.createElement('div');
    wrap.className = 'cz-select';
    if (sel.style.marginBottom) wrap.style.marginBottom = sel.style.marginBottom;
    wrap.style.width = sel.style.width || '100%';
    sel.parentNode.insertBefore(wrap, sel);
    wrap.appendChild(sel);
    sel.classList.add('cz-native-hidden');

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'cz-select-trigger';
    const label = document.createElement('span');
    label.className = 'cz-select-label';
    const caret = document.createElement('span');
    caret.className = 'cz-select-caret';
    caret.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';
    trigger.appendChild(label);
    trigger.appendChild(caret);
    wrap.appendChild(trigger);

    const pop = document.createElement('div');
    pop.className = 'cz-pop';
    const panel = document.createElement('div');
    panel.className = 'cz-select-panel';
    pop.appendChild(panel);
    pop.addEventListener('click', e => e.stopPropagation());
    document.body.appendChild(pop);

    function sync() {
      const opt = sel.options[sel.selectedIndex];
      label.textContent = opt ? opt.textContent : '';
    }
    function build() {
      panel.innerHTML = '';
      Array.from(sel.options).forEach((opt, i) => {
        const o = document.createElement('div');
        o.className = 'cz-select-option' + (i === sel.selectedIndex ? ' sel' : '');
        o.textContent = opt.textContent;
        o.addEventListener('click', () => {
          sel.selectedIndex = i;
          sel.dispatchEvent(new Event('change', { bubbles: true }));
          sync();
          closePop();
        });
        panel.appendChild(o);
      });
    }
    trigger.addEventListener('click', e => {
      e.stopPropagation();
      if (__czOpen && __czOpen.wrap === wrap) { closePop(); return; }
      build();
      showPop(pop, wrap, trigger);
    });
    sel.addEventListener('change', sync);
    sel._czSync = sync;
    sync();
  }

  /* ---------- DATE ---------- */
  function enhanceDate(inp) {
    if (inp.dataset.czEnhanced) return;
    inp.dataset.czEnhanced = '1';

    const wrap = document.createElement('div');
    wrap.className = 'cz-date';
    if (inp.style.marginBottom) wrap.style.marginBottom = inp.style.marginBottom;
    wrap.style.width = inp.style.width || '100%';
    inp.parentNode.insertBefore(wrap, inp);
    wrap.appendChild(inp);
    inp.classList.add('cz-native-hidden');

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'cz-select-trigger cz-date-trigger';
    const label = document.createElement('span');
    label.className = 'cz-select-label';
    const ic = document.createElement('span');
    ic.className = 'cz-date-ic';
    ic.innerHTML = CAL_ICON;
    trigger.appendChild(label);
    trigger.appendChild(ic);
    wrap.appendChild(trigger);

    const pop = document.createElement('div');
    pop.className = 'cz-pop';
    pop.addEventListener('click', e => e.stopPropagation());
    document.body.appendChild(pop);

    function fmt(v) { if (!v) return ''; const a = v.split('-'); return a[2] + '.' + a[1] + '.' + a[0]; }
    function sync() {
      if (inp.value) { label.textContent = fmt(inp.value); label.classList.remove('cz-ph'); }
      else { label.textContent = 'gg.aa.yyyy'; label.classList.add('cz-ph'); }
    }

    let view;
    function render() {
      const first = new Date(view.y, view.m, 1);
      const startDow = (first.getDay() + 6) % 7;
      const dim = new Date(view.y, view.m + 1, 0).getDate();
      const todayS = ymd(new Date());
      let cells = '';
      for (let i = 0; i < startDow; i++) cells += '<div class="cz-cal-day other"></div>';
      for (let d = 1; d <= dim; d++) {
        const ds = view.y + '-' + String(view.m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
        let cls = 'cz-cal-day';
        if (ds === todayS) cls += ' today';
        if (ds === inp.value) cls += ' sel';
        cells += '<div class="' + cls + '" data-d="' + ds + '">' + d + '</div>';
      }
      const total = startDow + dim, trail = 42 - total;
      for (let i = 0; i < trail; i++) cells += '<div class="cz-cal-day other"></div>';
      pop.innerHTML =
        '<div class="cz-cal">' +
          '<div class="cz-cal-head">' +
            '<div class="cz-cal-title">' + CAL_MONTHS[view.m] + ' ' + view.y + '</div>' +
            '<div class="cz-cal-nav">' +
              '<button class="cz-cal-navbtn" type="button" data-nav="-1">‹</button>' +
              '<button class="cz-cal-navbtn" type="button" data-nav="1">›</button>' +
            '</div>' +
          '</div>' +
          '<div class="cz-cal-grid">' + CAL_DOW.map(x => '<div class="cz-cal-dow">' + x + '</div>').join('') + cells + '</div>' +
          '<div class="cz-cal-foot"><button type="button" data-act="clear">Temizle</button><button type="button" data-act="today">Bugün</button></div>' +
        '</div>';
      pop.querySelectorAll('[data-nav]').forEach(b => b.addEventListener('click', e => {
        e.stopPropagation();
        view.m += parseInt(b.dataset.nav);
        if (view.m < 0) { view.m = 11; view.y--; }
        if (view.m > 11) { view.m = 0; view.y++; }
        render();
        positionPop(pop, trigger);
      }));
      pop.querySelectorAll('.cz-cal-day[data-d]').forEach(c => c.addEventListener('click', e => {
        e.stopPropagation();
        inp.value = c.dataset.d;
        inp.dispatchEvent(new Event('change', { bubbles: true }));
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        sync();
        closePop();
      }));
      pop.querySelector('[data-act="clear"]').addEventListener('click', e => {
        e.stopPropagation();
        inp.value = '';
        inp.dispatchEvent(new Event('change', { bubbles: true }));
        sync();
        closePop();
      });
      pop.querySelector('[data-act="today"]').addEventListener('click', e => {
        e.stopPropagation();
        inp.value = todayS;
        inp.dispatchEvent(new Event('change', { bubbles: true }));
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        sync();
        closePop();
      });
    }
    trigger.addEventListener('click', e => {
      e.stopPropagation();
      if (__czOpen && __czOpen.wrap === wrap) { closePop(); return; }
      const base = inp.value ? inp.value.split('-') : null;
      view = base ? { y: parseInt(base[0]), m: parseInt(base[1]) - 1 } : (function () { const t = new Date(); return { y: t.getFullYear(), m: t.getMonth() }; })();
      render();
      showPop(pop, wrap, trigger);
    });
    inp.addEventListener('change', sync);
    inp._czSync = sync;
    sync();
  }

  function scan(root) {
    if (!root || !root.querySelectorAll) return;
    if (root.matches && root.matches('select')) enhanceSelect(root);
    if (root.matches && root.matches('input[type="date"]')) enhanceDate(root);
    root.querySelectorAll('select:not([data-cz-enhanced])').forEach(enhanceSelect);
    root.querySelectorAll('input[type="date"]:not([data-cz-enhanced])').forEach(enhanceDate);
  }

  // tüm kayıtlı kontrolleri yeniden senkronla (programatik value değişimleri için)
  window.czRefresh = function () {
    document.querySelectorAll('[data-cz-enhanced]').forEach(el => { if (el._czSync) el._czSync(); });
  };

  function init() {
    scan(document.body);
    const mo = new MutationObserver(muts => {
      for (const m of muts) m.addedNodes.forEach(n => { if (n.nodeType === 1) scan(n); });
    });
    mo.observe(document.body, { childList: true, subtree: true });

    // dış tıklama / scroll / Escape / resize -> kapat
    document.addEventListener('click', closePop);
    document.addEventListener('scroll', e => { if (__czOpen && __czOpen.pop.contains(e.target)) return; closePop(); }, true);
    window.addEventListener('resize', closePop);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closePop(); });
    // herhangi bir değişiklikte (bağımlı select'ler dahil) etiketleri tazele
    document.addEventListener('change', () => setTimeout(window.czRefresh, 0), true);

    // Herhangi bir modal görünür olunca etiketleri tazele (tüm açılış yollarını yakalar)
    document.querySelectorAll('.modal-bg').forEach(m => {
      new MutationObserver(() => { if (m.classList.contains('show')) setTimeout(window.czRefresh, 0); })
        .observe(m, { attributes: true, attributeFilter: ['class'] });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();