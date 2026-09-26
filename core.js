/* ═══════════════════════════════════════════════════════════════════
   CÜZZY V3 — JAVASCRIPT
   ═══════════════════════════════════════════════════════════════════ */

/* ═══ 1. SECURITY & FIREBASE ═══ */

const currentDomain = window.location.hostname;
const isFileProtocol = window.location.protocol === 'file:';
const isLocalDev = currentDomain === 'localhost' || currentDomain === '127.0.0.1' || isFileProtocol || currentDomain === '';

if (window.location.protocol !== 'https:' && !isLocalDev) {
  document.body.innerHTML = '<div style="padding:40px;text-align:center;color:#f87171"><h1>⛔ Güvensiz bağlantı</h1><p>Lütfen HTTPS üzerinden açın.</p></div>';
  throw new Error('Insecure protocol');
}

// Production'da console temizliği — debug log'ları kullanıcıdan gizle (error kalsın)
if (!isLocalDev) {
  const _noop = () => {};
  console.log = _noop;
  console.info = _noop;
  console.debug = _noop;
  // console.warn ve console.error kalır — kritik bilgiler için
}

// Firebase / EmailJS yüklendi mi kontrolü
function showLoadError(missing) {
  const isFile = window.location.protocol === 'file:';
  const splashEl = document.getElementById('splash');
  if (splashEl) splashEl.classList.add('hidden');

  const html = `
    <div style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;padding:20px;font-family:system-ui,-apple-system,sans-serif;background:#050816;color:#f0f4ff;z-index:99999">
      <div style="max-width:560px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.18);border-radius:20px;padding:32px;backdrop-filter:blur(24px)">
        <div style="font-size:2.5rem;margin-bottom:12px"></div>
        <h1 style="font-size:1.5rem;font-weight:700;margin-bottom:12px;letter-spacing:-0.02em">Cüzzy yüklenemedi</h1>
        <p style="color:#a5b0c8;line-height:1.6;margin-bottom:16px">
          ${missing} kütüphanesi yüklenemedi.
          ${isFile ? `<br><br>
          <strong style="color:#22d3ee">Sorun:</strong> Dosyayı çift tıklayarak (file://) açtın. Tarayıcılar güvenlik gereği file:// protokolünden CDN'e erişimi engeller.
          <br><br>
          <strong style="color:#22d3ee">Çözüm:</strong> Yerel sunucu üzerinden aç:
          <pre style="background:rgba(0,0,0,0.4);padding:12px 14px;border-radius:10px;font-family:'JetBrains Mono',monospace;font-size:0.85rem;margin:12px 0;color:#34d399;overflow-x:auto;text-align:left">cd "$(dirname "$(realpath app.html)")"<br>python3 -m http.server 8000</pre>Sonra tarayıcıda: <code style="background:rgba(0,0,0,0.4);padding:3px 8px;border-radius:6px;color:#22d3ee">http://localhost:8000/app.html</code>
          ` : `<br><br>İnternet bağlantını ve tarayıcı eklentilerini kontrol et. CDN engelleyen bir uBlock/Brave Shields aktif olabilir.`}
        </p>
        <button onclick="location.reload()" style="background:linear-gradient(135deg,#22d3ee,#818cf8);border:none;color:#07101a;padding:10px 20px;border-radius:10px;font-weight:700;font-size:0.9rem;cursor:pointer;font-family:inherit">↻ Yeniden dene</button>
      </div>
    </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
  throw new Error(missing + ' not loaded');
}

if (typeof firebase === 'undefined') showLoadError('Firebase');
if (typeof firebase.firestore === 'undefined') showLoadError('Firebase Firestore');

const _0x = ['QUl6YVN5QkUz', 'QmdFQ2NTMmZY', 'UmNZSzZub18t', 'Y3dyRjJOQy00bl9Z'];
const _p = ['Y3V6enktYXBw', 'LTFjZTg3'];
const firebaseConfig = {
  apiKey: atob(_0x.join('')),
  authDomain: atob(_p.join('')) + ".firebaseapp.com",
  projectId: atob(_p.join('')),
  storageBucket: atob(_p.join('')) + ".firebasestorage.app",
  messagingSenderId: "572246140076",
  appId: "1:572246140076:web:bdbe0a492db4599c206b09"
};

try {
  if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
} catch (e) {
  console.error('Firebase init failed:', e);
  showLoadError('Firebase init');
}

const auth = firebase.auth();
const db = firebase.firestore();
auth.languageCode = 'tr';

const authPersistenceReady = auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(e => console.warn(e));
db.enablePersistence({ synchronizeTabs: true }).catch(() => {});

const _e = ['c2VydmljZV9pc2F1aHRs', 'dGVtcGxhdGVfeXZyZHptYQ==', 'LUtUZWFEUU5nOGVOelpqbjA='];
const EMAILJS_CONFIG = { serviceId: atob(_e[0]), templateId: atob(_e[1]), publicKey: atob(_e[2]) };
if (typeof emailjs !== 'undefined') emailjs.init(EMAILJS_CONFIG.publicKey);

/* ═══ 2. STATE ═══ */

const DEFAULT_STATE = {
  transactions: [], recurring: [], goals: [], investments: [],
  debts: [], subscriptions: [], notes: [], uploads: [],
  watchlist: [], stickyNote: '', baseBalance: 0, baseBalanceSet: false,
  homeLayout: [], homeAppearance: { card: 'glass', accent: '' }, homeOnboarded: false, homeColors: {},
  recurringApplied: [],
  profile: { name: 'Kullanıcı' },
  email: '',
  theme: 'light', wallpaper: 'light', language: 'tr', animSpeed: 'normal', glassDensity: 40, themeReset4: false, themeReset5: false,
  adsEnabled: false, adPlan: 'none', autoLogout: 30,
  monthlyBudget: 0, budgetWarningThreshold: 80, budgetAlertSentMonth: '',
  notifications: { income: true, expense: true, goals: true },
  emailVerified: true, tourCompleted: false, welcomeV2Seen: false,
  whatsNewSeen: '', hideBetaNotice: false, kvkkConsent: '',
  appNotifs: [], notifSummary: { day: '', week: '', month: '' },
  surveyCompleted: false, surveyVersion: '', lastUpdateSeen: ''
};

let S = JSON.parse(JSON.stringify(DEFAULT_STATE));
let currentUser = null;
let unsubscribeSnapshot = null;
let saveTimer = null;
let _savePending = false;
let ignoreNextSnapshot = false;
let txFilter = 'all';
let currentTxType = 'income';
let currentRecType = 'income';
let currentInvMode = 'live';
let currentMarketTab = 'forex';

/* ═══ 3. UTILS ═══ */

const fmt = n => {
  const num = Number(n) || 0;
  return '₺' + num.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const fmtShort = n => {
  const num = Number(n) || 0;
  if (Math.abs(num) >= 1e6) return '₺' + (num/1e6).toFixed(1) + 'M';
  if (Math.abs(num) >= 1e3) return '₺' + (num/1e3).toFixed(1) + 'K';
  return '₺' + num.toFixed(0);
};

const uid = () => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
};

const todayStr = () => new Date().toISOString().split('T')[0];

const sanitize = (str) => {
  if (typeof str !== 'string') return '';
  const div = document.createElement('div');
  div.textContent = str.replace(/[\u200B-\u200D\uFEFF]/g, '').normalize('NFC');
  return div.innerHTML;
};

/* Banka ekstresi açıklamalarındaki ÜÇÜNCÜ KİŞİ kişisel verilerini (IBAN, ad-soyad,
   telefon, uzun hesap/kart/referans no) kayıttan ÖNCE maskeler. Heuristiktir; her
   varyasyonu yakalamayı garanti etmez ama depolanan açıklamayı kimlikten arındırır. */
function redactPII(text) {
  if (!text || typeof text !== 'string') return text || '';
  let s = text;
  // 1) IBAN: TR + 24 hane (boşluklu/boşluksuz)
  s = s.replace(/\bTR\d{2}(?:[ ]?\d){22}\b/gi, 'TR••••');
  // 2) Türk cep telefonu: 05xx / +90 5xx (boşluklu olabilir)
  s = s.replace(/(?:\+?90[ ]?)?0?5\d{2}[ ]?\d{3}[ ]?\d{2}[ ]?\d{2}\b/g, '•••');
  // 3) Transfer açıklamalarında ad-soyad (GÖNDEREN/ALICI vb. anahtar kelime sonrası)
  s = s.replace(/\b(GÖNDEREN|GÖNDERİCİ|GONDEREN|ALICI|ALACAKLI|BORÇLU|BORCLU|AD[ ]?SOYAD|ADI[ ]?SOYADI|İSİM|ISIM|NAME)\b\s*[:\-]?\s*([A-ZÇĞİÖŞÜ][A-ZÇĞİÖŞÜa-zçğıöşü]*(?:\s+[A-ZÇĞİÖŞÜ][A-ZÇĞİÖŞÜa-zçğıöşü]*){0,3})/gi,
    (m, kw) => `${kw}: •••`);
  // 4) Uzun rakam dizileri: hesap/kart/referans no (10+ hane)
  s = s.replace(/\b\d{10,}\b/g, '•••');
  return s.replace(/\s{2,}/g, ' ').trim();
}

/* Ekstre açıklamasını KAYDETMEDEN, içinden yalnızca kişisel-veri içermeyen bir
   işlem TÜRÜ etiketi çıkarır. Tanınmayan satırlar gelir/gidere göre genel etiket alır.
   Böylece açıklamadaki IBAN/isim/referans hiçbir zaman saklanmaz. */
function cleanTxLabel(raw, type) {
  const s = String(raw || '').toLocaleUpperCase('tr');
  const has = (re) => re.test(s);
  if (has(/HAVALE\s*MASRAF/)) return 'Havale Masrafı';
  if (has(/GELEN\s*FAST/)) return 'Gelen FAST';
  if (has(/G[İI]DEN\s*FAST/)) return 'Giden FAST';
  if (has(/GELEN\s*HAVALE/)) return 'Gelen Havale';
  if (has(/HAVALE/)) return 'Havale';
  if (has(/(EFT).*ÜCRET|ÜCRET.*EFT|ELEKTRON[İI]K\s*FON\s*TRANSFER[İI].*ÜCRET/)) return 'EFT Ücreti';
  if (has(/ELEKTRON[İI]K\s*FON\s*TRANSFER[İI]/)) return 'EFT';
  if (has(/MAA[ŞS]/)) return 'Maaş';
  if (has(/TURN[İI]KE/)) return 'Turnike Geçiş';
  if (has(/POS\b/)) return 'POS Harcaması';
  if (has(/\bATM\b/)) return 'ATM İşlemi';
  if (has(/CASHBACK|NAK[İI]T\s*KAZAN/)) return 'Cashback';
  if (has(/B[İI]R[İI]K[İI]M/)) return 'Birikim Hesabı';
  if (has(/AL[İI][ŞS]VER[İI][ŞS]|ALISVERIS/)) return 'Alışveriş';
  if (has(/PAPARA\s*CARD/)) return 'Kart Harcaması';
  if (has(/PARA\s*Y[Aa]T[İI]RMA/)) return 'Para Yatırma';
  if (has(/PARA\s*[ÇC]EKME/)) return 'Para Çekme';
  if (has(/[İI]TEM\s*SAT/)) return 'Uygulama İçi Satın Alma';
  if (has(/FAST|PARA\s*TRANSFER[İI]/)) return 'Para Transferi';
  return type === 'income' ? 'Gelen ödeme' : 'Harcama';
}

/* Geri döndürülemez kısa parmak izi (djb2). Mükerrer ekstre tespitinde kullanılır;
   saklanan değer okunamaz bir sayıdır, içinden isim/IBAN geri çıkarılamaz. */
function hashStr(str) {
  let h = 5381;
  const s = String(str);
  for (let i = 0; i < s.length; i++) h = (((h << 5) + h) + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

/* Binlik ayraç ve/veya ondalık içeren girişi sayıya çevirir.
   "1.500" → 1500  |  "1,500" → 1500  |  "1.500,50" → 1500.50  |  "34,5" → 34.5 */
function parseInputAmt(raw) {
  if (raw == null || raw === '') return NaN;
  let s = String(raw).trim().replace(/\s/g, '');
  if (!s) return NaN;
  if (s.includes('.') && s.includes(',')) {
    if (s.lastIndexOf('.') > s.lastIndexOf(',')) s = s.replace(/,/g, '');      // 1,234.56
    else s = s.replace(/\./g, '').replace(',', '.');                           // 1.234,56
  } else if (s.includes(',')) {
    const parts = s.split(',');
    if (parts[parts.length - 1].length === 3) s = s.replace(/,/g, '');        // 1,500
    else s = s.replace(',', '.');                                               // 34,5
  } else if (s.includes('.')) {
    const parts = s.split('.');
    if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3))
      s = s.replace(/\./g, '');                                                // 1.500
  }
  return parseFloat(s);
}

const validateAmount = (amt) => {
  const n = parseInputAmt(String(amt ?? ''));
  return (n > 0 && n <= 999999999999999) ? n : null;
};

const validateString = (str, maxLen = 100) => {
  if (!str || typeof str !== 'string') return '';
  // Trim, max length, control char temizliği, NFC normalize
  let cleaned = str
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')  // C0 control chars
    .replace(/[\u200B-\u200D\uFEFF\u2028\u2029]/g, '')  // zero-width + line/para sep
    .normalize('NFC')
    .trim();
  return cleaned.substring(0, maxLen);
};

const validateDate = (d) => {
  if (!d || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return todayStr();
  return d;
};


const toFiniteNumber = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const ACTION_GUARDS = {
  changePassword: { cooldownMs: 15000, maxAttempts: 4, windowMs: 30 * 60 * 1000 },
  changeEmail: { cooldownMs: 15000, maxAttempts: 4, windowMs: 30 * 60 * 1000 },
  deleteAccount: { cooldownMs: 30000, maxAttempts: 2, windowMs: 60 * 60 * 1000 },
  clearAll: { cooldownMs: 20000, maxAttempts: 2, windowMs: 60 * 60 * 1000 },
  resendVerify: { cooldownMs: 45000, maxAttempts: 4, windowMs: 15 * 60 * 1000 },
  exportData: { cooldownMs: 8000, maxAttempts: 10, windowMs: 60 * 60 * 1000 },
  fileUpload: { cooldownMs: 5000, maxAttempts: 20, windowMs: 60 * 60 * 1000 }
};

// Brute-force koruması — guardState localStorage'a yedeklenir, refresh sonrası da geçerli
const GUARD_STATE_KEY = 'cuzzy_guard_state_v1';
let guardState = (() => {
  try {
    const cached = localStorage.getItem(GUARD_STATE_KEY);
    return cached ? JSON.parse(cached) : {};
  } catch { return {}; }
})();

function persistGuardState() {
  try { localStorage.setItem(GUARD_STATE_KEY, JSON.stringify(guardState)); } catch {}
}

function guardAction(key) {
  const cfg = ACTION_GUARDS[key];
  if (!cfg) return { ok: true };
  const now = Date.now();
  const state = guardState[key] || { lastRun: 0, attempts: [] };
  state.attempts = state.attempts.filter(ts => now - ts < cfg.windowMs);
  if (cfg.maxAttempts && state.attempts.length >= cfg.maxAttempts) {
    const retry = Math.max(0, cfg.windowMs - (now - state.attempts[0]));
    guardState[key] = state;
    persistGuardState();
    return { ok: false, retrySec: Math.ceil(retry / 1000) };
  }
  if (cfg.cooldownMs && (now - state.lastRun) < cfg.cooldownMs) {
    const retry = cfg.cooldownMs - (now - state.lastRun);
    guardState[key] = state;
    persistGuardState();
    return { ok: false, retrySec: Math.ceil(retry / 1000) };
  }
  state.lastRun = now;
  state.attempts.push(now);
  guardState[key] = state;
  persistGuardState();
  return { ok: true };
}

function normalizeState(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  return {
    transactions: (Array.isArray(src.transactions) ? src.transactions : []).map(t => ({
      id: validateString(String(t?.id || uid()), 64) || uid(),
      type: t?.type === 'income' ? 'income' : 'expense',
      desc: validateString(t?.desc, 50) || 'İşlem',
      amount: Math.max(0, toFiniteNumber(t?.amount, 0)),
      category: validateString(t?.category, 40) || 'Diğer',
      date: validateDate(t?.date),
      note: validateString(t?.note, 200),
      ts: toFiniteNumber(t?.ts, Date.now())
    })).filter(t => t.amount > 0),
    recurring: (Array.isArray(src.recurring) ? src.recurring : []).map(r => ({
      id: validateString(String(r?.id || uid()), 64) || uid(),
      type: r?.type === 'income' ? 'income' : 'expense',
      desc: validateString(r?.desc, 50) || 'Tekrarlayan',
      amount: Math.max(0, toFiniteNumber(r?.amount, 0)),
      day: Math.min(28, Math.max(1, Math.trunc(toFiniteNumber(r?.day, 1)))),
      months: Math.min(99, Math.max(0, Math.trunc(toFiniteNumber(r?.months, 0)))),
      startMonth: /^\d{4}-\d{2}$/.test(r?.startMonth) ? r.startMonth : ''
    })).filter(r => r.amount > 0),
    goals: (Array.isArray(src.goals) ? src.goals : []).map(g => ({
      id: validateString(String(g?.id || uid()), 64) || uid(),
      name: validateString(g?.name, 50) || 'Hedef',
      target: Math.max(1, toFiniteNumber(g?.target, 0)),
      current: Math.max(0, toFiniteNumber(g?.current, 0)),
      date: validateString(g?.date, 12)
    })),
    investments: (Array.isArray(src.investments) ? src.investments : []).map(i => ({
      id: validateString(String(i?.id || uid()), 64) || uid(),
      name: validateString(i?.name, 50) || 'Yatırım',
      note: validateString(i?.note, 200),
      date: validateDate(i?.date),
      mode: i?.mode === 'manual' ? 'manual' : 'live',
      type: validateString(i?.type, 20) || 'Diğer',
      symbol: validateString(i?.symbol, 10).toUpperCase(),
      quantity: Math.max(0, toFiniteNumber(i?.quantity, 0)),
      buyPrice: Math.max(0, toFiniteNumber(i?.buyPrice, 0)),
      amount: Math.max(0, toFiniteNumber(i?.amount, 0))
    })).filter(i => i.amount > 0),
    debts: (Array.isArray(src.debts) ? src.debts : []).map(d => {
      const installments = Math.min(99, Math.max(0, Math.trunc(toFiniteNumber(d?.installments, 0))));
      return {
        id: validateString(String(d?.id || uid()), 64) || uid(),
        name: validateString(d?.name, 60) || 'Borç',
        amount: Math.max(0, toFiniteNumber(d?.amount, 0)),
        dueDate: validateString(d?.dueDate, 12),
        type: validateString(d?.type, 30) || 'Borç',
        paid: d?.paid === true,
        installments,
        paidCount: Math.min(installments, Math.max(0, Math.trunc(toFiniteNumber(d?.paidCount, 0)))),
        ts: toFiniteNumber(d?.ts, Date.now())
      };
    }).filter(d => d.amount > 0),
    subscriptions: (Array.isArray(src.subscriptions) ? src.subscriptions : []).map(s => ({
      id: validateString(String(s?.id || uid()), 64) || uid(),
      name: validateString(s?.name, 60) || 'Abonelik',
      amount: Math.max(0, toFiniteNumber(s?.amount, 0)),
      day: Math.min(31, Math.max(1, Math.trunc(toFiniteNumber(s?.day, 1)))),
      ts: toFiniteNumber(s?.ts, Date.now())
    })).filter(s => s.amount > 0),
    notes: (Array.isArray(src.notes) ? src.notes : []).map(n => ({
      id: validateString(String(n?.id || uid()), 64) || uid(),
      title: validateString(n?.title, 200) || 'Not',
      date: validateDate(n?.date)
    })),
    uploads: (Array.isArray(src.uploads) ? src.uploads : []).map(u => ({
      date: validateDate(u?.date),
      file: validateString(u?.file, 100) || 'Dosya',
      count: Math.max(0, Math.trunc(toFiniteNumber(u?.count, 0)))
    })).filter(u => {
      const _c = new Date(); _c.setDate(_c.getDate() - 7);
      const _cStr = _c.getFullYear() + '-' + String(_c.getMonth() + 1).padStart(2, '0') + '-' + String(_c.getDate()).padStart(2, '0');
      return u.date >= _cStr;
    }),
    watchlist: (Array.isArray(src.watchlist) ? src.watchlist : []).map(w => ({
      type: ['forex','crypto','bist'].includes(w?.type) ? w.type : 'forex',
      symbol: validateString(w?.symbol, 20).toUpperCase()
    })).filter(w => w.symbol).slice(0, 10),
    recurringApplied: (() => {
      if (!Array.isArray(src.recurringApplied)) return [];
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - 2);
      const cutoff = cutoffDate.getFullYear() + '-' + String(cutoffDate.getMonth() + 1).padStart(2, '0');
      return src.recurringApplied
        .filter(k => typeof k === 'string' && /^\d{4}-\d{2}-/.test(k) && k.substring(0, 7) >= cutoff)
        .slice(-200);
    })(),
    profile: { name: validateString(src?.profile?.name, 30) || 'Kullanıcı' },
  email: validateString(src?.email, 120) || '',
    theme: ['light','black','grey','aurora','midnight','sunset','forest','royal'].includes(src.theme) ? src.theme : 'light',
    themeReset4: src.themeReset4 === true,
    themeReset5: src.themeReset5 === true,
    wallpaper: ['light','black','grey','aurora','ocean','sunset','forest','mesh','solid','royal','dag','cicek'].includes(src.wallpaper) ? src.wallpaper : 'light',
    language: src.language === 'en' ? 'en' : 'tr',
    animSpeed: ['fast', 'normal', 'slow', 'off'].includes(src.animSpeed) ? src.animSpeed : 'normal',
    glassDensity: Math.min(100, Math.max(0, Math.round(toFiniteNumber(src.glassDensity, 40)))),
    adsEnabled: false,
    adPlan: 'none',
    autoLogout: Math.min(120, Math.max(5, Math.trunc(toFiniteNumber(src.autoLogout, 30)))),
    monthlyBudget: Math.max(0, toFiniteNumber(src.monthlyBudget, 0)),
    budgetWarningThreshold: Math.min(100, Math.max(50, Math.trunc(toFiniteNumber(src.budgetWarningThreshold, 80)))),
    budgetAlertSentMonth: validateString(src.budgetAlertSentMonth, 14),
    notifications: {
      income: src?.notifications?.income !== false,
      expense: src?.notifications?.expense !== false,
      goals: src?.notifications?.goals !== false
    },
    emailVerified: src.emailVerified !== false,
    tourCompleted: src.tourCompleted === true,
    welcomeV2Seen: src.welcomeV2Seen === true,
    whatsNewSeen: validateString(src.whatsNewSeen, 20),
    hideBetaNotice: src.hideBetaNotice === true,
    kvkkConsent: validateString(src.kvkkConsent, 10),
    stickyNote: typeof src.stickyNote === 'string' ? src.stickyNote.slice(0, 2000) : '',
    baseBalance: (typeof src.baseBalance === 'number' && isFinite(src.baseBalance)) ? src.baseBalance : 0,
    baseBalanceSet: src.baseBalanceSet === true,
    homeLayout: Array.isArray(src.homeLayout) ? src.homeLayout.filter(x => x && typeof x === 'object').slice(0, 20).map(x => ({ id: validateString(String(x.id || ''), 20), size: validateString(String(x.size || ''), 4), hidden: x.hidden === true })) : [],
    homeColors: (src.homeColors && typeof src.homeColors === 'object' && !Array.isArray(src.homeColors)) ? Object.keys(src.homeColors).filter(k => typeof src.homeColors[k] === 'string' && /^#[0-9a-fA-F]{6}$/.test(src.homeColors[k])).slice(0, 20).reduce((o, k) => { o[k] = src.homeColors[k]; return o; }, {}) : {},
    homeAppearance: { card: (src.homeAppearance && src.homeAppearance.card === 'raised') ? 'raised' : 'glass', accent: validateString(src.homeAppearance && src.homeAppearance.accent, 9) },
    homeOnboarded: src.homeOnboarded === true,
    appNotifs: (() => {
      if (!Array.isArray(src.appNotifs)) return [];
      const cutoff = Date.now() - 15 * 24 * 60 * 60 * 1000;
      return src.appNotifs
        .filter(n => n && typeof n === 'object' && (n.ts || 0) >= cutoff)
        .slice(0, 100)
        .map(n => ({
          id: validateString(String(n.id || ''), 40),
          title: validateString(n.title, 80),
          body: validateString(n.body, 200),
          ts: Number(n.ts) || Date.now(),
          read: n.read === true
        }));
    })(),
    notifSummary: {
      day: validateString(src.notifSummary?.day, 10),
      week: validateString(src.notifSummary?.week, 10),
      month: validateString(src.notifSummary?.month, 10)
    },
    surveyCompleted: src.surveyCompleted === true,
    surveyVersion: src.surveyVersion || '',
    lastUpdateSeen: src.lastUpdateSeen || ''
  };
}

/* ═══ 4. UI HELPERS ═══ */

let toastTimer = null;
/* ═══ HAPTİK (TİTREŞİM) MOTORU ═══
   Tek merkezi fonksiyon. Şimdilik navigator.vibrate() (Android Chrome'da çalışır,
   iOS Safari'de sessizce no-op olur). Capacitor'a geçince SADECE bu fonksiyon
   Haptics.impact(...) çağıracak şekilde değişecek — çağıran yerler hiç değişmeyecek.
   type: 'tap' | 'success' | 'warning' | 'celebrate' */
function haptic(type) {
  try {
    if (!navigator.vibrate) return;
    switch (type) {
      case 'tap':       navigator.vibrate(10); break;
      case 'success':   navigator.vibrate([12, 40, 12]); break;
      case 'warning':   navigator.vibrate(35); break;
      case 'celebrate': navigator.vibrate([15, 30, 15, 30, 45]); break;
      default:          navigator.vibrate(10);
    }
  } catch (e) {}
}

function toast(msg, type = 't-info') {
  const w = document.getElementById('welcomeScreen');
  if (w && !w.classList.contains('hidden')) return;
  const el = document.getElementById('toast');
  if (!el) return;
  clearTimeout(toastTimer);
  el.textContent = msg;
  el.className = 'toast ' + type;   // önce sıfırla (show kalkar)
  void el.offsetWidth;              // reflow -> her seferinde yeniden insin
  el.classList.add('show');
  toastTimer = setTimeout(() => el.classList.remove('show'), 1800);
  if (type === 't-ok') haptic('success');
  else if (type === 't-err') haptic('warning');
  else haptic('tap');
}

function setSyncStatus(s) {
  const dot = document.getElementById('syncPulse') || document.getElementById('syncDot');
  if (dot) dot.className = (dot.id === 'syncPulse' ? 'sync-pulse ' : 'sync-dot ') + (s || '');
}

function renderProfileModal() {
  const name = (S.profile?.name || 'Kullanıcı').trim();
  const initial = name.charAt(0).toUpperCase();
  const setText = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };

  setText('profileAvatarLarge', initial);
  setText('profileNameDisplay', name);
  setText('profileEmailDisplay', currentUser?.email || '—');
  setText('profileStatTx', S.transactions.length);
  setText('profileStatGoal', S.goals.length);
  setText('profileStatInv', S.investments.length);
}

function softModalResize(fn, boxEl) {
  const box = boxEl || document.querySelector('.modal-bg.show .modal-box');
  if (!box || box.style.transform) { if (fn) fn(); return; }
  const start = box.getBoundingClientRect().height;
  if (fn) fn();
  const prevH = box.style.height;
  box.style.height = 'auto';
  const end = box.getBoundingClientRect().height;
  if (Math.abs(end - start) < 3) { box.style.height = prevH; return; }
  box.style.height = start + 'px';
  void box.offsetWidth;
  box.style.transition = 'height 0.42s cubic-bezier(0.25, 1, 0.3, 1)';
  box.style.height = end + 'px';
  clearTimeout(box._srt);
  box._srt = setTimeout(() => { box.style.height = ''; box.style.transition = ''; }, 460);
}

// Tetikleyici butonun şeklini (border-radius) çıkarır: yuvarlak/pill ise '50%', değilse px.
function _triggerRadius(el, rect) {
  if (!el || !rect) return null;
  let br;
  try { br = getComputedStyle(el).borderRadius || ''; } catch (e) { return null; }
  br = br.split('/')[0].trim().split(' ')[0].trim();
  if (!br) return null;
  if (br.indexOf('%') !== -1) return '50%';
  const px = parseFloat(br) || 0;
  const minSide = Math.min(rect.width, rect.height);
  if (px * 2 >= minSide - 1.5) return '50%';
  return px > 0 ? px + 'px' : '0px';
}

// Açılış ve kapanış İÇİN ORTAK eğri/süre/ölçek — simetrik morph (buton.html tarzı)
const _MORPH_EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';
const _MORPH_MS = 360;
function _morphDelta(tr, fr) {
  const tx = (tr.left + tr.width / 2) - (fr.left + fr.width / 2);
  const ty = (tr.top + tr.height / 2) - (fr.top + fr.height / 2);
  let sc = Math.min(tr.width / fr.width, tr.height / fr.height);
  if (!isFinite(sc) || sc <= 0) sc = 0.2;
  sc = Math.max(0.1, Math.min(0.45, sc));
  return { tx, ty, sc };
}

function _closeModalAnim(m) {
  if (!m || !m.classList.contains('show') || m._closing) return;
  const box = m.querySelector('.modal-box');
  const tr = m._morphRect;
  const trig = m._hiddenTrigger;
  const finish = () => {
    if (m.id === 'modalSettings') document.documentElement.classList.remove('settings-layer');
    m.classList.remove('show');
    m.style.transition = ''; m.style.opacity = '';
    if (box) { box.style.transition = ''; box.style.transform = ''; box.style.opacity = ''; box.style.transformOrigin = ''; box.style.borderRadius = ''; }
    if (m._morphKids) { m._morphKids.forEach(k => { k.style.transition = ''; k.style.opacity = ''; }); m._morphKids = null; }
    if (trig) { trig.style.transition = ''; trig.style.opacity = ''; trig.style.transform = ''; trig.style.visibility = ''; }
    m._hiddenTrigger = null;
    m._closing = false;
  };
  if (!box) { finish(); return; }
  m._closing = true;

  // İçerik (kutu çocukları) daha hızlı solsun → kabuk/şekil morph'u net görünür
  const _kids = Array.prototype.slice.call(box.children);
  m._morphKids = _kids;
  _kids.forEach(k => { k.style.transition = 'opacity ' + Math.round(_MORPH_MS * 0.32) + 'ms ease'; });
  void box.offsetWidth;
  _kids.forEach(k => { k.style.opacity = '0'; });

  // Arkaplan kararmasını yumuşak söndür (display:none snap'i yerine)
  m.style.transition = 'opacity ' + _MORPH_MS + 'ms ease';
  void m.offsetWidth;
  m.style.opacity = '0';

  const fr = box.getBoundingClientRect();
  if (!tr || fr.width < 4) {
    // Morph yok: yerinde hafif küçülerek kapan
    box.style.transformOrigin = 'center center';
    box.style.transition = 'transform ' + _MORPH_MS + 'ms ' + _MORPH_EASE + ', opacity ' + Math.round(_MORPH_MS * 0.7) + 'ms ease';
    void box.offsetWidth;
    box.style.transform = 'scale(0.9)';
    box.style.opacity = '0';
    setTimeout(finish, _MORPH_MS + 20);
    return;
  }

  const d = _morphDelta(tr, fr);
  // Kutu butona doğru küçülür VE butonun şekline (yuvarlak/kare) dönüşür.
  // Kabuk opacity SADECE en sonda (son ~%30) solar → şekil morph'u net görünür, buton devralır.
  box.style.transformOrigin = 'center center';
  box.style.transition = 'transform ' + _MORPH_MS + 'ms ' + _MORPH_EASE +
    ', border-radius ' + _MORPH_MS + 'ms ' + _MORPH_EASE +
    ', opacity ' + Math.round(_MORPH_MS * 0.3) + 'ms ease ' + Math.round(_MORPH_MS * 0.68) + 'ms';
  void box.offsetWidth;
  box.style.transform = 'translate(' + d.tx + 'px, ' + d.ty + 'px) scale(' + d.sc + ')';
  if (m._morphRadius) box.style.borderRadius = m._morphRadius;
  box.style.opacity = '0';

  // Buton çapraz-geçişle belirir (ikinci yarıda) — zıplama yok
  if (trig) {
    trig.style.visibility = '';
    trig.style.transition = 'none';
    trig.style.opacity = '0';
    trig.style.transform = 'scale(0.6)';
    void trig.offsetWidth;
    trig.style.transition = 'opacity ' + Math.round(_MORPH_MS * 0.5) + 'ms ease ' + Math.round(_MORPH_MS * 0.45) + 'ms' +
      ', transform ' + Math.round(_MORPH_MS * 0.55) + 'ms ' + _MORPH_EASE + ' ' + Math.round(_MORPH_MS * 0.4) + 'ms';
    trig.style.opacity = '1';
    trig.style.transform = 'scale(1)';
  }
  setTimeout(finish, _MORPH_MS + 30);
}
let __cuzzyPointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
let __cuzzyTriggerRect = null;
let __cuzzyTriggerEl = null;
document.addEventListener('pointerdown', e => {
  __cuzzyPointer = { x: e.clientX, y: e.clientY };
  const t = e.target.closest('button, .btn, [onclick], .topnav-item, .notif-btn, .set-side-item, .fin-card, .hw');
  const outside = t && !t.closest('.modal-box');
  __cuzzyTriggerRect = outside ? t.getBoundingClientRect() : null;
  __cuzzyTriggerEl = outside ? t : null;
}, true);

function _isHidableTrigger(el) {
  if (!el) return false;
  if (el.matches('.topnav-item, .nav-drawer-item, .fin-card, .hw, .set-side-item')) return false;
  return el.matches('button, .btn');
}

function _lockBodyScroll() {
  document.body.classList.add('modal-open');
}
function _unlockBodyScrollIfNoneOpen() {
  if (document.querySelector('.modal-bg.show')) return;
  document.body.classList.remove('modal-open');
}

var _instantShow = false;

/* ── Mobil pop-up'lar (tam ekran Ayarlar hariç): X yok, üstteki çubuktan
   tutup aşağı çekince kapanır, hepsi aynı mantık — modal başına ayrı kod yok. ── */
function clearStaleNumHints(root) {
  const scope = root || document;
  scope.querySelectorAll('.num-word-hint').forEach(h => {
    const id = h.id && h.id.indexOf('h-') === 0 ? h.id.slice(2) : '';
    const el = id ? document.getElementById(id) : null;
    let n = 0;
    try { n = el && el.value ? parseInputAmt(el.value) : 0; } catch (e) { n = 0; }
    if (!el || !n) h.textContent = '';
  });
}
function closeGenericModal(id) {
  const m = document.getElementById(id || (document.querySelector('.modal-bg.show') || {}).id);
  const box = m && m.querySelector('.modal-box');
  if (!m || !box || !m.classList.contains('show')) return;
  try { clearStaleNumHints(m); } catch (e) {}
  const trig = m._hiddenTrigger;
  box.style.transition = 'transform 0.32s cubic-bezier(0.4, 0, 0.2, 1)';
  box.style.transform = 'translateY(100%)';
  m.style.transition = 'opacity 0.3s ease';
  m.style.opacity = '0';
  setTimeout(() => {
    m.classList.remove('show');
    box.style.transition = ''; box.style.transform = '';
    m.style.transition = ''; m.style.opacity = '';
    if (trig) { trig.style.visibility = ''; m._hiddenTrigger = null; }
    _unlockBodyScrollIfNoneOpen();
  }, 300);
}
(function () {
  var dragging = false, startY = 0, curY = 0, moved = false, activeBox = null, activeId = null;
  function onMove(e) {
    if (!dragging) return;
    var dy = e.clientY - startY;
    if (!moved && Math.abs(dy) > 6) moved = true;
    curY = Math.max(0, dy * (dy > 0 ? 1 : 0.25));
    if (moved) { e.preventDefault(); activeBox.style.transition = 'none'; activeBox.style.transform = 'translateY(' + curY + 'px)'; }
  }
  function onUp() {
    if (!dragging) return;
    dragging = false;
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
    document.removeEventListener('pointercancel', onUp);
    activeBox.style.transition = 'transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)';
    if (curY > 90) { closeGenericModal(activeId); } else { activeBox.style.transform = ''; }
    moved = false;
  }
  document.addEventListener('pointerdown', function (e) {
    if (typeof isMobileView === 'function' && !isMobileView()) return;
    var box = e.target.closest('.modal-box:not(.set-modal):not(.no-sheet)');
    if (!box) return;
    var rect = box.getBoundingClientRect();
    if (e.clientY - rect.top > 30) return;
    var bg = box.closest('.modal-bg');
    if (!bg) return;
    dragging = true; startY = e.clientY; curY = 0; moved = false;
    activeBox = box; activeId = bg.id;
    document.addEventListener('pointermove', onMove, { passive: false });
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onUp);
  });
})();
function springOpenModal(m) {
  const box = m.querySelector('.modal-box');
  if (_instantShow) { _instantShow = false; m.style.transition = 'none'; m.classList.add('show'); m.style.opacity = '1'; if (box) { box.style.transition = 'none'; box.style.transform = 'none'; box.style.opacity = '1'; } void m.offsetWidth; m.style.transition = ''; if (box) box.style.transition = ''; return; }
  m.classList.add('show');
  if (!box) return;
  box.style.transition = 'none';
  box.style.transform = 'none';
  box.style.opacity = '0';
  void box.offsetWidth;
  const fr = box.getBoundingClientRect();
  const _noMorph = box.classList.contains('set-modal') || (typeof isMobileView === 'function' && isMobileView());
  const tr = _noMorph ? null : __cuzzyTriggerRect;
  const _clear = () => { box.style.transition = ''; box.style.transform = ''; box.style.opacity = ''; box.style.transformOrigin = ''; box.style.borderRadius = ''; };
  m._morphRect = (tr && fr.width > 4 && fr.height > 4) ? tr : null;
  m._hiddenTrigger = (m._morphRect && _isHidableTrigger(__cuzzyTriggerEl)) ? __cuzzyTriggerEl : null;
  if (m._hiddenTrigger) m._hiddenTrigger.style.visibility = 'hidden';
  m._morphRadius = m._morphRect ? _triggerRadius(__cuzzyTriggerEl, tr) : null;
  m._boxRadius = getComputedStyle(box).borderRadius;
  if (tr && fr.width > 4 && fr.height > 4) {
    // FLIP morph: kutu, tıklanan butonun konumundan/şeklinden başlar -> merkeze büyür (kapanışın birebir aynası)
    const d = _morphDelta(tr, fr);
    box.style.transformOrigin = 'center center';
    box.style.transform = 'translate(' + d.tx + 'px, ' + d.ty + 'px) scale(' + d.sc + ')';
    box.style.opacity = '0';
    if (m._morphRadius) box.style.borderRadius = m._morphRadius;
    void box.offsetWidth;
    requestAnimationFrame(() => {
      box.style.transition = 'transform ' + _MORPH_MS + 'ms ' + _MORPH_EASE +
        ', border-radius ' + _MORPH_MS + 'ms ' + _MORPH_EASE +
        ', opacity ' + Math.round(_MORPH_MS * 0.45) + 'ms ease';
      box.style.transform = 'translate(0, 0) scale(1)';
      box.style.opacity = '1';
      if (m._morphRadius) box.style.borderRadius = m._boxRadius || '';
      setTimeout(_clear, _MORPH_MS + 30);
    });
  } else {
    // Tetikleyici yok: tıklama noktasından yaylanarak açıl
    const p = __cuzzyPointer;
    box.style.transformOrigin = 'center center';
    box.style.transform = 'scale(0.86) translateY(24px)';
    box.style.opacity = '0';
    void box.offsetWidth;
    const r = box.getBoundingClientRect();
    const clamp = v => Math.max(2, Math.min(98, v));
    box.style.transformOrigin = clamp(((p.x - r.left) / r.width) * 100) + '% ' + clamp(((p.y - r.top) / r.height) * 100) + '%';
    requestAnimationFrame(() => {
      box.style.transition = 'transform 0.4s cubic-bezier(0.2, 1.15, 0.3, 1), opacity 0.3s ease';
      box.style.transform = 'none';
      box.style.opacity = '1';
      setTimeout(_clear, 430);
    });
  }
}

function _hideModalInstant(m) {
  if (typeof m === 'string') m = document.getElementById(m);
  if (!m || !m.classList.contains('show')) return;
  if (m.id === 'modalSettings') document.documentElement.classList.remove('settings-layer');
  var box = m.querySelector('.modal-box'); var trig = m._hiddenTrigger;
  m._closing = false; m.style.transition = 'none'; m.classList.remove('show'); m.style.opacity = '';
  if (box) { box.style.transition = 'none'; box.style.transform = ''; box.style.opacity = ''; box.style.transformOrigin = ''; box.style.borderRadius = ''; }
  if (trig) { trig.style.transition = ''; trig.style.opacity = ''; trig.style.transform = ''; trig.style.visibility = ''; m._hiddenTrigger = null; }
  void m.offsetWidth; m.style.transition = ''; if (box) box.style.transition = '';
  _unlockBodyScrollIfNoneOpen();
}
function _hideNotifInstant() {
  var panel = document.getElementById('notifPanel');
  if (!panel || panel.style.display === 'none') return;
  panel.style.transition = 'none'; panel.style.display = 'none';
  panel.classList.remove('closing', 'np-collapsed');
  panel.style.opacity = ''; panel.style.width = ''; panel.style.height = ''; panel.style.borderRadius = '';
  var btn = document.getElementById('notifBtn'); if (btn) btn.classList.remove('active');
  void panel.offsetWidth; panel.style.transition = '';
}
function showModal(id) {
  const m = (typeof id === 'string') ? document.getElementById(id) : id;
  if (!m || m.classList.contains('show')) return;
  var _openM = document.querySelectorAll('.modal-bg.show');
  if (_openM.length) { var _mz = 10000; _openM.forEach(function (o) { var z = parseInt(getComputedStyle(o).zIndex, 10) || 10000; if (z > _mz) _mz = z; }); m.style.zIndex = (_mz + 10); } else { m.style.zIndex = ''; }
  springOpenModal(m);
  _lockBodyScroll();
  if (id === 'modalWatchlist') { try { populateWatchlistSymbols(); renderWatchlistCurrent(); } catch (e) {} }
  if (id === 'modalProfile') { try { renderProfileModal(); } catch (e) {} }
}

function closeModal(id) {
  setTimeout(_unlockBodyScrollIfNoneOpen, 420);
  if (id && typeof id === 'string') { _closeModalAnim(document.getElementById(id)); return; }
  const open = Array.prototype.slice.call(document.querySelectorAll('.modal-bg.show'));
  if (open.length <= 1) { open.forEach(_closeModalAnim); return; }
  let top = open[0], topZ = -Infinity;
  open.forEach(m => { const z = parseInt(getComputedStyle(m).zIndex, 10) || 0; if (z >= topZ) { topZ = z; top = m; } });
  _closeModalAnim(top);
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeModal();
    closeNotifPanel();
    const _nb = document.getElementById('notifBtn'); if (_nb) _nb.classList.remove('active');
  }
});

document.addEventListener('click', e => {
  const wrap = document.getElementById('notifWrap');
  const panel = document.getElementById('notifPanel');
  if (wrap && !wrap.contains(e.target) && (!panel || !panel.contains(e.target))) {
    closeNotifPanel();
    const _b = document.getElementById('notifBtn'); if (_b) _b.classList.remove('active');
  }
});

/* ── Bildirim Paneli ── */
// pop_up.html tarzı: panel zilden esneyerek büyür (boyut morph, scale değil)
function _openNotifPanelMorph(panel) {
  const bell = document.getElementById('notifBtn');
  const _br = bell ? bell.getBoundingClientRect() : null;
  if (_br && window.innerWidth > 760) {
    panel.style.top = (_br.bottom + 8) + 'px';
    panel.style.right = (window.innerWidth - _br.right) + 'px';
    panel.style.left = 'auto'; panel.style.bottom = 'auto';
  }
  // Sade, normal açılış (ayarlar gibi) — hafif fade + minik ölçek, jelibon yok
  panel.classList.remove('np-collapsed');
  panel.style.width = ''; panel.style.height = ''; panel.style.borderRadius = '';
  panel.style.transformOrigin = 'top right';
  panel.style.willChange = 'transform, opacity';
  panel.style.transition = 'none';
  panel.style.transform = 'translateY(-6px) scale(0.98)';
  panel.style.opacity = '0';
  void panel.offsetWidth;
  panel.style.transition = 'transform 0.16s ease-out, opacity 0.16s ease-out';
  panel.style.transform = 'translateY(0) scale(1)';
  panel.style.opacity = '1';
  clearTimeout(panel._npContentT);
  clearTimeout(panel._npT);
  panel._npT = setTimeout(() => {
    panel.style.transition = ''; panel.style.transform = ''; panel.style.opacity = '';
    panel.style.transformOrigin = ''; panel.style.willChange = '';
  }, 200);
}
function closeNotifPanel() {
  const panel = document.getElementById('notifPanel');
  if (!panel || panel.style.display === 'none' || panel.classList.contains('closing')) return;
  panel.classList.add('closing');
  const btn = document.getElementById('notifBtn'); if (btn) btn.classList.remove('active');
  try { var _cp = (typeof currentPage !== 'undefined') ? currentPage : 'home'; document.querySelectorAll('.mbn-item').forEach(function (i) { i.classList.toggle('active', i.dataset.nav === _cp); }); } catch (e) {}
  if (window.innerWidth <= 760) {
    panel.style.transition = 'opacity 0.2s ease';
    panel.style.opacity = '0';
    clearTimeout(panel._npContentT); clearTimeout(panel._npT);
    panel._npT = setTimeout(() => {
      panel.style.display = 'none';
      panel.classList.remove('closing', 'np-collapsed');
      panel.style.transition = ''; panel.style.opacity = '';
      panel.style.width = ''; panel.style.height = ''; panel.style.borderRadius = '';
    }, 210);
    return;
  }
  // desktop: sade, hızlı kapanış (jelibon yok)
  panel.style.transformOrigin = 'top right';
  panel.style.willChange = 'transform, opacity';
  panel.style.transition = 'transform 0.14s ease-in, opacity 0.14s ease-in';
  void panel.offsetWidth;
  panel.style.transform = 'translateY(-6px) scale(0.98)';
  panel.style.opacity = '0';
  clearTimeout(panel._npContentT);
  clearTimeout(panel._npT);
  panel._npT = setTimeout(() => {
    panel.style.display = 'none';
    panel.classList.remove('closing', 'np-collapsed');
    panel.style.transition = ''; panel.style.transform = ''; panel.style.opacity = '';
    panel.style.transformOrigin = ''; panel.style.willChange = '';
    panel.style.width = ''; panel.style.height = '';
    if (btn) btn.style.visibility = '';
  }, 150);
}
function toggleNotifPanel(e) {
  if (e) e.stopPropagation();
  const panel = document.getElementById('notifPanel');
  if (!panel) return;
  const btn   = document.getElementById('notifBtn');
  const open  = panel.style.display !== 'none' && !panel.classList.contains('closing');
  if (open) { closeNotifPanel(); return; }
  var _wasSet = (function () { var s = document.getElementById('modalSettings'); return !!(s && s.classList.contains('show')); })();
  try { _hideModalInstant('modalSettings'); } catch (e2) {}
  try { document.querySelectorAll('.mbn-item').forEach(function (i) { i.classList.toggle('active', i.dataset.nav === 'bildirim'); }); } catch (e2) {}
  const mobile = window.innerWidth <= 760;
  panel.classList.remove('closing');
  panel.style.display = mobile ? 'flex' : 'block';
  if (btn) btn.classList.toggle('active', true);
  const badge = document.getElementById('notifBadge');
  if (badge) badge.style.display = 'none';
  (S.appNotifs || []).forEach(n => n.read = true);
  save();
  renderAppNotifs();
  if (mobile) {
    panel.classList.remove('np-collapsed');
    panel.style.width = ''; panel.style.height = ''; panel.style.borderRadius = '';
    panel.style.top = ''; panel.style.right = ''; panel.style.left = ''; panel.style.bottom = '';
    if (_wasSet) { panel.style.transition = 'none'; panel.style.opacity = '1'; }
    else { panel.style.transition = 'none'; panel.style.opacity = '0'; void panel.offsetWidth; panel.style.transition = 'opacity 0.24s ease'; panel.style.opacity = '1'; }
  } else {
    _openNotifPanelMorph(panel);
  }
}

/* Sol menüden (drawer) bildirimleri aç — mobilde zil yok */
function openNotifFromDrawer(e) {
  if (e) e.stopPropagation();
  if (typeof closeNavDrawer === 'function') closeNavDrawer();
  const panel = document.getElementById('notifPanel');
  if (panel && panel.style.display !== 'none' && !panel.classList.contains('closing')) return;
  toggleNotifPanel();
}

function switchNotifTab(tab) {
  document.getElementById('notifBodySurum').style.display    = tab === 'surum'    ? 'block' : 'none';
  document.getElementById('notifBodyBildirim').style.display = tab === 'bildirim' ? 'block' : 'none';
  document.getElementById('ntab-surum').classList.toggle('active',    tab === 'surum');
  document.getElementById('ntab-bildirim').classList.toggle('active', tab === 'bildirim');
  if (tab === 'bildirim') {
    (S.appNotifs || []).forEach(n => n.read = true);
    save();
    const badge = document.getElementById('notifBadge');
    if (badge) badge.style.display = 'none';
    renderAppNotifs();
  }
}

/* ═══ APP BİLDİRİMLERİ (kalıcı · 15 gün saklanır) ═══ */
function pruneNotifs() {
  if (!Array.isArray(S.appNotifs)) { S.appNotifs = []; return; }
  const cutoff = Date.now() - 15 * 24 * 60 * 60 * 1000;   // 15 gün
  S.appNotifs = S.appNotifs.filter(n => (n.ts || 0) >= cutoff).slice(0, 100);
}
function updateNotifBadge() {
  const unread = (S.appNotifs || []).filter(n => !n.read).length;
  const badge = document.getElementById('notifBadge');
  if (badge) { badge.textContent = unread; badge.style.display = unread > 0 ? '' : 'none'; }
}

/* ── PERİYODİK ÖZET BİLDİRİMLERİ (günlük / haftalık / aylık) ──
   Açılışta yeni gün/hafta/ay başlamışsa, biten döneme ait özet üretilir.
   İlk kez (notifSummary boş) sadece anahtarlar yazılır, bildirim üretilmez. */
function _dayKey(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function _monthKey(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }
function _weekKey(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - dayNum + 3);
  const firstTh = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((date - firstTh) / 86400000 - 3 + ((firstTh.getUTCDay() + 6) % 7)) / 7);
  return date.getUTCFullYear() + '-W' + String(week).padStart(2, '0');
}
function _mondayOf(d) { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); const day = (x.getDay() + 6) % 7; x.setDate(x.getDate() - day); return x; }
function _sumRange(start, end) {
  let inc = 0, exp = 0;
  for (const t of (S.transactions || [])) {
    const d = new Date(t.date || t.ts);
    if (d >= start && d < end) { if (t.type === 'income') inc += (t.amount || 0); else exp += (t.amount || 0); }
  }
  return { inc, exp, net: inc - exp };
}
function _summaryText(label, r) {
  const a = Math.abs(r.net);
  const tag = r.net >= 0 ? 'kâr' : 'zarar';
  return `${label} ${fmt(r.exp)} harcadın, ${fmt(r.inc)} kazandın. Net ${r.net >= 0 ? '+' : '−'}${fmt(a)} ${tag}.`;
}
function checkPeriodicSummaries() {
  if (!S.notifSummary || typeof S.notifSummary !== 'object') S.notifSummary = { day: '', week: '', month: '' };
  const now = new Date();
  const today = _dayKey(now), thisWeek = _weekKey(now), thisMonth = _monthKey(now);
  const firstRun = !S.notifSummary.day && !S.notifSummary.week && !S.notifSummary.month;
  let changed = false;

  if (S.notifSummary.day !== today) {
    if (!firstRun) {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const r = _sumRange(start, end);
      if (r.inc > 0 || r.exp > 0) notify('general', 'Günlük özet', _summaryText('Dün', r));
    }
    S.notifSummary.day = today; changed = true;
  }
  if (S.notifSummary.week !== thisWeek) {
    if (!firstRun) {
      const monday = _mondayOf(now);
      const start = new Date(monday); start.setDate(start.getDate() - 7);
      const r = _sumRange(start, monday);
      if (r.inc > 0 || r.exp > 0) notify('general', 'Haftalık özet', _summaryText('Geçen hafta', r));
    }
    S.notifSummary.week = thisWeek; changed = true;
  }
  if (S.notifSummary.month !== thisMonth) {
    if (!firstRun) {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 1);
      const r = _sumRange(start, end);
      if (r.inc > 0 || r.exp > 0) notify('general', 'Aylık özet', _summaryText('Geçen ay', r));
    }
    S.notifSummary.month = thisMonth; changed = true;
  }
  if (changed) save();
}

/* Bildirim zili/paneli kaldırıldı (yama notları artık Ayarlar > Destek altında statik).
   Mevcut notify() çağrı yerlerine dokunulmadı, fonksiyon artık sessizce hiçbir şey yapmıyor. */
function notify(kind, title, body) {
  return;
}

function pushAppNotif(title, body) {
  if (!Array.isArray(S.appNotifs)) S.appNotifs = [];
  S.appNotifs.unshift({ id: Date.now() + '-' + Math.random().toString(36).slice(2, 7), title, body, ts: Date.now(), read: false });
  pruneNotifs();
  save();                       // kalıcı: Firestore'a yazılır
  updateNotifBadge();
  const panel = document.getElementById('notifPanel');
  const bildirimActive = document.getElementById('ntab-bildirim')?.classList.contains('active');
  if (panel && panel.style.display !== 'none' && bildirimActive) renderAppNotifs();
}

function renderAppNotifs() {
  const body = document.getElementById('notifBodyBildirim');
  if (!body) return;
  pruneNotifs();
  const list = S.appNotifs || [];
  body.innerHTML = '';
  if (list.length === 0) {
    const el = document.createElement('div');
    el.className = 'notif-empty';
    el.textContent = 'Henüz uygulama bildirimi yok.';
    body.appendChild(el);
    return;
  }
  for (const n of list) {
    const item = document.createElement('div');
    item.className = 'notif-item';
    const t = document.createElement('div');
    t.className = 'notif-item-title';
    t.textContent = n.title;
    const b = document.createElement('div');
    b.className = 'notif-item-body';
    b.textContent = n.body;
    const d = document.createElement('div');
    d.className = 'notif-item-date';
    d.textContent = new Date(n.ts).toLocaleString('tr-TR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' });
    item.appendChild(t); item.appendChild(b); item.appendChild(d);
    body.appendChild(item);
  }
}


/* ═════════════════════════════════════════════════════════════════ */