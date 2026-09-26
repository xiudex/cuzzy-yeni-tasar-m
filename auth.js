/* ═══ 5. AUTH FLOW ═══ */

function hideSplash() {
  const s = document.getElementById('splash');
  if (s) {
    s.style.opacity = '0';
    setTimeout(() => s.classList.add('hidden'), 400);
  }
}

let splashTimeout = setTimeout(() => {
  const s = document.getElementById('splash');
  if (s && !s.classList.contains('hidden')) {
    console.warn('Splash timeout');
    hideSplash();
  }
}, 6000);

function previewOpenApp() {
  try { hideSplash(); } catch (e) {}
  try {
    const ver = (typeof KVKK_VERSION !== 'undefined') ? KVKK_VERSION : '1.1';
    let theme = 'light', wallpaper = 'light';
    try {
      const cached = JSON.parse(localStorage.getItem('cuzzy_visual_v4') || 'null');
      if (cached && cached.theme) { theme = cached.theme; wallpaper = cached.wallpaper || cached.theme; }
    } catch (e) {}
    S = normalizeState({ welcomeV2Seen: true, kvkkConsent: ver, theme, wallpaper });
  } catch (e) {}
  try { hideWelcomeNow(); } catch (e) {}
  try { applySettings(); } catch (e) {}
  const app = document.getElementById('app');
  if (app) app.classList.add('visible');
  try { renderAll(); } catch (e) {}
  try { if (typeof updateMbnPill === 'function') updateMbnPill(); } catch (e) {}
}

let authStateHandled = false;
function attachAuthListener() {
  if (authStateHandled) return;
  authStateHandled = true;

  if (new URLSearchParams(location.search).get('onizleme') === '1') {
    const open = () => { try { previewOpenApp(); } catch (e) {} };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', open);
    else open();
    return;
  }

  authPersistenceReady.finally(() => auth.onAuthStateChanged(async user => {
    clearTimeout(splashTimeout);

    if (!user) {
      hideSplash();
      if (new URLSearchParams(location.search).get('onizleme') === '1') return;
      // Index'te değilsek geri at
      if (!window.location.pathname.endsWith('index.html') && window.location.pathname !== '/') {
        setTimeout(() => window.location.replace('index.html'), 200);
      }
      return;
    }

    currentUser = user;

    try {
      const ref = db.collection('users').doc(user.uid);
      let doc = await ref.get();

      if (!doc.exists) {
        // Yeni kullanıcı — temel doküman oluştur
        const initial = { ...normalizeState({ profile: { name: user.displayName || 'Kullanıcı' }, emailVerified: false }), email: user.email };
        await ref.set(initial);
        S = initial;
      } else {
        S = normalizeState(doc.data());
        if (user.email) S.email = user.email;
      }

      pruneNotifs();
      checkPeriodicSummaries();

      applySettings();
      hideSplash();

      enterApp();

    } catch (err) {
      console.error('Auth bootstrap hatası:', err);
      hideSplash();
      toast(t('toast_load_failed'), 't-err');
      // App içinde fallback göster
      enterApp();
    }
  }));
}

function enterApp() {
  if (typeof welcomeAlreadySeen === 'function' && welcomeAlreadySeen()) {
    try { hideWelcomeNow(); } catch (e) {}
  } else {
    const w = document.getElementById('welcomeScreen');
    if (w) w.classList.remove('hidden');
  }
  document.getElementById('app').classList.add('visible');
  startListening(currentUser.uid);
  startLiveMarkets();
  startInactivityTimer();
  renderAll();
  renderKvkkSettings();
  // Pill konumunu hazırla
  setTimeout(updateTopnavPill, 100);
  var _mbnPillInit = function () { try { if (typeof updateMbnPill === 'function') updateMbnPill(); } catch (e) {} };
  (function _mbnPillPoll(tries) {
    _mbnPillInit();
    if (tries < 40) requestAnimationFrame(function () { _mbnPillPoll(tries + 1); });
  })(0);
  window.addEventListener('load', _mbnPillInit);
  updateVerifyBadge();

  // Açılış akışı: önce BETA bilgilendirmesi (kalıcı kapatılmadıysa her açılışta),
  // kapatılınca yeni kullanıcıya tur, eski kullanıcıya "Neler Değişti".
  const _postNotice = () => { /* açılış mesajları kaldırıldı — yeniden düzenlenecek */ };
  const _runLaunchNotices = () => {
    if (!S.hideBetaNotice) {
      if (_postNotice) _postNotice();
    } else {
      setTimeout(_postNotice, 700);
    }
    setTimeout(_setupMobilePanel, 300);
  };
  // Zorunlu KVKK onayı verilmemişse önce KVKK kapısı (gecikmesiz, etkileşim boşluğu olmasın).
  if (S.kvkkConsent !== KVKK_VERSION) {
    showKvkkGate(_runLaunchNotices);
  } else {
    _runLaunchNotices();
  }
  setTimeout(applyRecurringForMonth, 1500);
  initNumWordHints();
}

function startListening(uid) {
  if (unsubscribeSnapshot) unsubscribeSnapshot();
  ignoreNextSnapshot = false;
  unsubscribeSnapshot = db.collection('users').doc(uid).onSnapshot(doc => {
    if (!doc.exists || ignoreNextSnapshot) return;
    S = normalizeState(doc.data());
    applySettings();
    renderAll();
    setSyncStatus('synced');
    maybeShowUpdateNotice();
  }, err => {
    console.error('Snapshot error:', err);
    setSyncStatus('error');
  });
}

function save() {
  if (!currentUser) return;
  setSyncStatus('syncing');
  ignoreNextSnapshot = true; // debounce penceresinde gelen snapshot S'i eski veriye döndürüp yazmasın
  _savePending = true;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    ignoreNextSnapshot = true;
    const payload = { ...normalizeState(S), email: currentUser.email };
    db.collection('users').doc(currentUser.uid).set(payload)
      .then(() => {
        _savePending = false;
        setSyncStatus('synced');
        setTimeout(() => ignoreNextSnapshot = false, 1000);
      })
      .catch(err => {
        console.error('Save error:', err);
        setSyncStatus('error');
        ignoreNextSnapshot = false;
      });
  }, 500);
}
function saveImmediate() {
  if (!currentUser) return;
  clearTimeout(saveTimer);
  setSyncStatus('syncing');
  ignoreNextSnapshot = true;
  _savePending = true;
  const payload = { ...normalizeState(S), email: currentUser.email };
  db.collection('users').doc(currentUser.uid).set(payload)
    .then(() => {
      _savePending = false;
      setSyncStatus('synced');
      setTimeout(() => ignoreNextSnapshot = false, 1000);
    })
    .catch(err => {
      console.error('Save error:', err);
      setSyncStatus('error');
      ignoreNextSnapshot = false;
    });
}

/* Kritik veriler için ANINDA yazma (debounce yok). Bakiye gibi kayıp kabul edilemez değerlerde kullanılır. */
function saveNow() {
  if (!currentUser) return Promise.resolve();
  clearTimeout(saveTimer);
  ignoreNextSnapshot = true;
  _savePending = true;
  setSyncStatus('syncing');
  const payload = { ...normalizeState(S), email: currentUser.email };
  return db.collection('users').doc(currentUser.uid).set(payload)
    .then(() => {
      _savePending = false;
      setSyncStatus('synced');
      setTimeout(() => ignoreNextSnapshot = false, 1000);
    })
    .catch(err => {
      console.error('Save error (now):', err);
      setSyncStatus('error');
      ignoreNextSnapshot = false;
    });
}

function isMobileView() { return true; }
let _mobileNoticeShown = false;
let _mobilePanelSetup = false;
function _setupMobilePanel() {
  if (_mobilePanelSetup || !isMobileView()) return;
  _mobilePanelSetup = true;
  try {
    const note = document.querySelector('.sticky-note[data-wid="note"]');
    const noteHost = document.getElementById('mnoteHost');
    if (note && noteHost && note.parentElement !== noteHost) noteHost.appendChild(note);
  } catch (e) {}
}
var FIN_KEYS = ['islemler','tekrarlayan','borc','abonelik','hedefler','ekstre'];
function _finRestoreAll() {
  try {
    FIN_KEYS.forEach(function (k) {
      var host = document.getElementById('finSecHost-' + k);
      var card = document.getElementById('finans-' + k);
      if (host && card) Array.prototype.slice.call(host.children).forEach(function (ch) { card.appendChild(ch); });
    });
  } catch (e) {}
}
var _finSecListModal = { borc: 'modalDebtList', abonelik: 'modalSubList', tekrarlayan: 'modalRecList', ekstre: 'modalUploadHist' };
var _finSecCurKey = null;
function openFinSec(cardId) {
  _finRestoreAll();
  var key = cardId.replace('finans-', '');
  var card = document.getElementById(cardId);
  var host = document.getElementById('finSecHost-' + key);
  if (!card || !host) return;
  Array.prototype.slice.call(card.children).forEach(function (ch) {
    if (!ch.classList.contains('fin-ch')) host.appendChild(ch);
  });
  var t = document.getElementById('finSecTitle');
  if (t) t.textContent = (card.querySelector('.card-title-text') || {}).textContent || '';
  _finSecCurKey = key;
  var listBtn = document.getElementById('finSecListBtn');
  if (listBtn) listBtn.style.display = _finSecListModal[key] ? '' : 'none';
  try { showModal('modalFinSec'); } catch (e) {}
}
function finSecShowList() {
  var m = _finSecListModal[_finSecCurKey];
  if (m) { try { showModal(m); } catch (e) {} }
}
function closeFinSec() {
  _finRestoreAll();
  try { closeGenericModal('modalFinSec'); } catch (e) {}
}
try {
  var _finMq = window.matchMedia('(max-width: 760px)');
  var _finMqH = function (e) { if (!e.matches) { _finRestoreAll(); try { closeModal('modalFinSec'); } catch (x) {} } };
  if (_finMq.addEventListener) _finMq.addEventListener('change', _finMqH);
  else if (_finMq.addListener) _finMq.addListener(_finMqH);
} catch (e) {}
function maybeShowMobileNotice() {
  if (_mobileNoticeShown || !isMobileView()) return;
  _mobileNoticeShown = true;
  try { showModal('modalMobileNotice'); } catch (e) {}
}
function openMobileNotif(e) {
  try { closeQuickMenu(); } catch (x) {}
  try { if (typeof openNotifFromDrawer === 'function') openNotifFromDrawer(e); else toggleNotifPanel(e); }
  catch (err) { try { toggleNotifPanel(e); } catch (_) {} }
}
let _updateNoticeShown = false;
function maybeShowUpdateNotice() {
  if (_updateNoticeShown || !S || S.lastUpdateSeen === 'v3.10.3') return;
  _updateNoticeShown = true;
  try { showModal('modalUpdateNotice'); } catch (e) {}
}
function dismissUpdateNotice() {
  S.lastUpdateSeen = 'v3.10.3';
  try { save(); } catch (e) {}
  closeModal();
}

async function _czDeriveKey(pass, salt) {
  const km = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 150000, hash: 'SHA-256' },
    km, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
function _czB64(buf) { const b = new Uint8Array(buf); let s = ''; for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]); return btoa(s); }
function _czUnb64(str) { return Uint8Array.from(atob(str), c => c.charCodeAt(0)); }
async function czEncrypt(text, pass) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await _czDeriveKey(pass, salt);
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(text));
  const out = new Uint8Array(16 + 12 + ct.byteLength);
  out.set(salt, 0); out.set(iv, 16); out.set(new Uint8Array(ct), 28);
  return 'CUZZY1-' + _czB64(out);
}
async function czDecrypt(code, pass) {
  if (!code || code.indexOf('CUZZY1-') !== 0) throw new Error('format');
  const raw = _czUnb64(code.slice(7).trim());
  const salt = raw.slice(0, 16), iv = raw.slice(16, 28), ct = raw.slice(28);
  const key = await _czDeriveKey(pass, salt);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
  return new TextDecoder().decode(pt);
}

function openExportData() {
  const w = document.getElementById('exportCodeWrap'); if (w) w.style.display = 'none';
  const pp = document.getElementById('expPass'); if (pp) pp.value = '';
  const aa = document.getElementById('exportCodeArea'); if (aa) aa.value = '';
  showModal('modalExportData');
}
function openImportData() {
  const cc = document.getElementById('importCodeArea'); if (cc) cc.value = '';
  const pp = document.getElementById('impPass'); if (pp) pp.value = '';
  showModal('modalImportData');
}
async function exportDataCode() {
  const pass = (document.getElementById('expPass') && document.getElementById('expPass').value) || '';
  if (pass.length < 4) return toast(t('toast_password_min4'), 't-err');
  try {
    const payload = JSON.stringify({ v: 1, app: 'cuzzy', ts: Date.now(), data: normalizeState(S) });
    const code = await czEncrypt(payload, pass);
    const ta = document.getElementById('exportCodeArea');
    if (ta) ta.value = code;
    const wrap = document.getElementById('exportCodeWrap');
    if (wrap) wrap.style.display = 'block';
    toast(t('toast_encrypted_code_created'), 't-ok');
  } catch (e) { toast(t('toast_code_gen_failed'), 't-err'); }
}
function copyExportCode() {
  const ta = document.getElementById('exportCodeArea');
  if (!ta || !ta.value) return;
  ta.select();
  if (navigator.clipboard) navigator.clipboard.writeText(ta.value).then(() => toast(t('common_copied'), 't-ok')).catch(() => { try { document.execCommand('copy'); toast(t('common_copied'), 't-ok'); } catch (e) {} });
  else { try { document.execCommand('copy'); toast(t('common_copied'), 't-ok'); } catch (e) {} }
}
async function importDataCode() {
  const ta = document.getElementById('importCodeArea');
  const code = (ta && ta.value || '').trim();
  if (!code) return toast(t('toast_paste_code_first'), 't-err');
  const pass = (document.getElementById('impPass') && document.getElementById('impPass').value) || '';
  if (!pass) return toast(t('toast_enter_password'), 't-err');
  let obj;
  try {
    const json = await czDecrypt(code, pass);
    obj = JSON.parse(json);
  } catch (e) { return toast(t('toast_decrypt_failed'), 't-err'); }
  if (!obj || obj.app !== 'cuzzy' || !obj.data) return toast(t('toast_invalid_code'), 't-err');
  showConfirm({
    title: t('confirm_import_title'),
    msg: t('confirm_import_msg'),
    danger: true,
    onOk: () => {
      try {
        S = normalizeState(obj.data);
        saveNow();
        try { applySettings(); } catch (e) {}
        try { renderAll(); } catch (e) {}
        if (ta) ta.value = '';
        closeModal();
        toast(t('toast_import_complete'), 't-ok');
      } catch (e) { toast(t('toast_import_error'), 't-err'); }
    }
  });
}

function maskEmail(email) {
  if (!email || typeof email !== 'string' || email.indexOf('@') < 0) return email || '';
  const at = email.indexOf('@');
  const local = email.slice(0, at), domain = email.slice(at + 1);
  const keep = Math.min(2, local.length);
  const stars = '*'.repeat(Math.max(2, local.length - keep));
  // domain'i de kısmen maskele: ilk harf + uzantı
  const dot = domain.lastIndexOf('.');
  const dShown = dot > 1 ? domain[0] + '*'.repeat(Math.max(1, dot - 1)) + domain.slice(dot) : domain;
  return local.slice(0, keep) + stars + '@' + dShown;
}

let _inactivityTimer = null;
let _inactivityBound = false;
function startInactivityTimer() {
  clearTimeout(_inactivityTimer);
  const mins = parseInt(S.autoLogout) || 0;
  if (!mins || !currentUser) return;
  _inactivityTimer = setTimeout(() => {
    try { toast(t('toast_auto_logout'), 't-info'); } catch (e) {}
    logOut();
  }, mins * 60 * 1000);
  bindInactivityListeners();
}
function bindInactivityListeners() {
  if (_inactivityBound) return;
  _inactivityBound = true;
  ['mousedown', 'keydown', 'touchstart', 'scroll', 'click'].forEach(ev => {
    document.addEventListener(ev, () => {
      if (currentUser && (parseInt(S.autoLogout) || 0) > 0) startInactivityTimer();
    }, { passive: true });
  });
}
function setAutoLogoutPref(val) {
  S.autoLogout = parseInt(val) || 0;
  try { save(); } catch (e) {}
  startInactivityTimer();
  try { toast(S.autoLogout ? ('Zaman kilidi: ' + S.autoLogout + ' dk') : 'Zaman kilidi kapalı', 't-ok'); } catch (e) {}
}

function logOut() {
  try {
    if (unsubscribeSnapshot) { unsubscribeSnapshot(); unsubscribeSnapshot = null; }
  } catch (e) { console.warn('unsubscribe err:', e); }
  try { clearMarketIntervals(); } catch (e) {}

  // Hassas state'i temizle (memory'de kalmasın)
  try {
    S = JSON.parse(JSON.stringify(DEFAULT_STATE));
    livePrices = {};
    bistPrices = {};
    // Auth-bound timer'ı durdur
    clearTimeout(saveTimer);
    clearInterval(verifyTimerInt);
    // İnput'ları temizle (DOM)
    document.querySelectorAll('input[type="password"]').forEach(i => i.value = '');
  } catch (e) {}

  // Hangi durumda olursa olsun yönlendir
  const redirect = () => {
    try {
      window.location.replace('index.html');
    } catch (e) {
      window.location.href = 'index.html';
    }
  };

  // 2 saniye içinde Firebase yanıt vermezse zorla yönlendir
  const fallback = setTimeout(redirect, 2000);

  auth.signOut()
    .then(() => { clearTimeout(fallback); redirect(); })
    .catch(err => {
      console.error('signOut err:', err);
      clearTimeout(fallback);
      redirect();
    });
}

/* ═══ 6. EMAIL VERIFY (Firebase-native, sunucu taraflı) ═══ */

// Doğrulama tamamen Firebase'e devredildi: e-postayı Google gönderir,
// "emailVerified" bilgisi imzalı ID token'da tutulur — istemci sahteleyemez.

function updateVerifyBadge() {
  const b = document.getElementById('verifyBadge');
  if (currentUser && currentUser.emailVerified === false) {
    if (b) b.classList.remove('hidden');
    _startVerifyPolling();
  } else if (b) b.classList.add('hidden');
}

let _verifyPollTimer = null;
async function _recheckEmailVerified() {
  if (!currentUser) return;
  const was = currentUser.emailVerified;
  const _oldEmail = currentUser.email;
  try {
    await currentUser.reload();
    try { await currentUser.getIdToken(true); } catch (e) {}
    updateVerifyBadge();
    if (currentUser.email && currentUser.email !== _oldEmail) {
      try { await db.collection('users').doc(currentUser.uid).set({ email: currentUser.email }, { merge: true }); } catch (e) {}
      try { renderProfileModal(); } catch (e) {}
      try { applySettings(); } catch (e) {}
      try { toast(t('toast_email_updated'), 't-ok'); } catch (e) {}
    }
    if (currentUser.emailVerified && !was) {
      if (_verifyPollTimer) { clearInterval(_verifyPollTimer); _verifyPollTimer = null; }
      try { toast(t('toast_email_verified'), 't-ok'); } catch (e) {}
    }
  } catch (e) {}
}
function _startVerifyPolling() {
  if (_verifyPollTimer || !currentUser || currentUser.emailVerified) return;
  _verifyPollTimer = setInterval(() => {
    if (!currentUser || currentUser.emailVerified) { clearInterval(_verifyPollTimer); _verifyPollTimer = null; return; }
    if (document.visibilityState === 'visible') _recheckEmailVerified();
  }, 4000);
}

async function resendEmailVerification() {
  if (!currentUser) return;
  try { await currentUser.reload(); } catch (e) {}
  if (currentUser.emailVerified) { updateVerifyBadge(); return toast(t('toast_email_already_verified'), 't-ok'); }
  const g = guardAction('resendVerify');
  if (!g.ok) return toast(`${g.retrySec}s sonra tekrar dene`, 't-err');
  try {
    await currentUser.sendEmailVerification();
    toast(t('toast_verify_email_sent'), 't-ok');
  } catch (e) {
    const code = (e && e.code) || '';
    toast(code === 'auth/too-many-requests' ? 'Çok fazla istek, biraz sonra dene' : 'Gönderilemedi', 't-err');
  }
}

// Kullanıcı e-postadaki linke tıklayıp dönünce/sekmeye odaklanınca anında kontrol et
document.addEventListener('visibilitychange', () => { if (!document.hidden) _recheckEmailVerified(); });
window.addEventListener('focus', () => { _recheckEmailVerified(); });


/* ═══ NUMBER WORD HINTS ═══ */
const _NW_ONES = ['','bir','iki','üç','dört','beş','altı','yedi','sekiz','dokuz'];
const _NW_TENS = ['','on','yirmi','otuz','kırk','elli','altmış','yetmiş','seksen','doksan'];

function numberToTurkish(n) {
  n = Math.round(Math.abs(n));
  if (!n) return '';
  function sub(x) {
    if (!x) return '';
    let r = '';
    const h = Math.floor(x / 100), t = Math.floor((x % 100) / 10), o = x % 10;
    if (h) r += (h === 1 ? '' : _NW_ONES[h] + ' ') + 'yüz';
    if (t) r += (r ? ' ' : '') + _NW_TENS[t];
    if (o) r += (r ? ' ' : '') + _NW_ONES[o];
    return r;
  }
  if (n < 1000) return sub(n);
  const parts = [];
  const trilyon = Math.floor(n / 1e12);
  const milyar  = Math.floor((n % 1e12) / 1e9);
  const milyon  = Math.floor((n % 1e9)  / 1e6);
  const bin     = Math.floor((n % 1e6)  / 1000);
  const rest    = n % 1000;
  if (trilyon) parts.push(sub(trilyon) + ' trilyon');
  if (milyar)  parts.push(sub(milyar)  + ' milyar');
  if (milyon)  parts.push(sub(milyon)  + ' milyon');
  if (bin)     parts.push(bin === 1 ? 'bin' : sub(bin) + ' bin');
  if (rest)    parts.push(sub(rest));
  return parts.join(', ');
}

function updateNumWordHint(el) {
  if (!el) return;
  const hint = document.getElementById('h-' + el.id);
  if (!hint) return;
  const n = parseInputAmt(el.value);
  const intVal = isNaN(n) ? 0 : Math.floor(Math.abs(n));
  hint.textContent = intVal > 0 ? '(' + numberToTurkish(intVal) + ')' : '';
}

function formatWhileTyping(el) {
  const raw = el.value;
  const pos = el.selectionStart == null ? raw.length : el.selectionStart;
  const commaAt = raw.indexOf(',');
  const hasComma = commaAt !== -1;
  const intRaw = hasComma ? raw.slice(0, commaAt) : raw;
  const decRaw = hasComma ? raw.slice(commaAt + 1).replace(/\D/g, '').slice(0, 2) : '';
  const digits = intRaw.replace(/\D/g, '');
  if (!digits) {
    el.value = hasComma ? (decRaw ? '0,' + decRaw : ',') : '';
    try { el.setSelectionRange(el.value.length, el.value.length); } catch (e) {}
    updateNumWordHint(el);
    return;
  }
  const num = parseInt(digits, 10);
  if (isNaN(num) || num < 0) { updateNumWordHint(el); return; }
  let formatted = num.toLocaleString('tr-TR');
  if (hasComma) formatted += ',' + decRaw;
  if (formatted !== raw) {
    const before = raw.slice(0, pos);
    const cut = before.indexOf(',');
    const inDec = cut !== -1;
    const dbc = ((inDec ? before.slice(0, cut) : before).match(/\d/g) || []).length;
    const decCount = inDec ? (before.slice(cut + 1).match(/\d/g) || []).length : 0;
    el.value = formatted;
    let newPos = formatted.length;
    if (inDec) {
      const c = formatted.indexOf(',');
      newPos = Math.min(formatted.length, c + 1 + decCount);
    } else {
      let cnt = 0;
      newPos = 0;
      for (let i = 0; i < formatted.length; i++) {
        if (/\d/.test(formatted[i])) cnt++;
        if (cnt === dbc) { newPos = i + 1; break; }
      }
    }
    try { el.setSelectionRange(newPos, newPos); } catch (e) {}
  }
  updateNumWordHint(el);
}

const NUM_WORD_IDS = ['txAmt','recAmt','mRecAmt','debtAmt','subAmt','setBudget','qAmt','qmqaAmt','goalTarget','goalCurrent','invBuyPrice','invManualAmount','baseBalanceInput'];

function initNumWordHints() {
  for (const id of NUM_WORD_IDS) {
    const el = document.getElementById(id);
    if (!el) continue;
    el.addEventListener('input', () => formatWhileTyping(el));
    el.addEventListener('focus', () => el.select());
    el.addEventListener('blur',  () => updateNumWordHint(el));
  }
}

function _flushPendingSave() {
  // Sayfa kapanmadan önce bekleyen (debounce'lu) yazma varsa anında gönder — veri kaybını önler
  if (_savePending && currentUser) { try { saveNow(); } catch (e) {} }
}
window.addEventListener('pagehide', _flushPendingSave);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') _flushPendingSave(); });


/* ═══ 9b. PLAN / REKLAM SİSTEMİ ═══ */

// Hangi sayfa/sekmelerin hangi plan ile kilitli olduğu
const PLAN_BLOCKED = { none: [], few: [], many: [] };

function selectPlan(plan) {
  S.adPlan = plan;
  save();
  applyPlanRestrictions();
  toast(t('toast_plan_updated'), 't-info');
}

function applyPlanRestrictions() {
  const plan = 'none';
  const blocked = PLAN_BLOCKED[plan] || [];

  // Body class → CSS kontrollü reklam görünürlüğü
  document.body.classList.remove('plan-many', 'plan-few', 'plan-none');
  document.body.classList.add('plan-' + plan);

  // Plan kartı seçili göster
  ['none', 'few', 'many'].forEach(p => {
    const card = document.getElementById('planCard-' + p);
    if (card) card.classList.toggle('plan-selected', p === plan);
  });

  // Subnav'daki kilitli sekmeleri işaretle
  document.querySelectorAll('.subnav-item').forEach(btn => {
    const key = currentPage + '-' + btn.dataset.sub;
    btn.classList.toggle('nav-locked', blocked.includes(key));
  });

  // Topnav yatırım kilidini işaretle (none paketi)
  document.querySelectorAll('.topnav-item[data-nav]').forEach(btn => {
    const isLocked = false;
    btn.classList.toggle('nav-locked', isLocked);
  });

  // Şu an kilitli bir sayfadaysak, güvenli sayfaya yönlendir
  const currentKey = currentPage + (currentSub ? '-' + currentSub : '');
  if (blocked.includes(currentPage) || blocked.includes(currentKey)) {
    goTo('finans', 'islemler');
  }
}