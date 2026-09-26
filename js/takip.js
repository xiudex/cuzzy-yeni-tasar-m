/* ═══ 20. CHARTS ═══ */

let chartBalance = null;
let chartWeekly = null;

function renderCharts() {
  [renderBalanceTrend, renderCategoryDonut, renderWeeklyTrend, renderMonthlyTrend, renderYearlyBars].forEach(function (f) {
    try { f(); } catch (e) { console.error('grafik hatası:', e); }
  });
}

function ensureCanvas(id) {
  const el = document.getElementById(id);
  if (!el) return null;
  if (el.tagName === 'CANVAS') return el;
  const canvas = document.createElement('canvas');
  canvas.id = id;
  canvas.className = el.className || '';
  el.replaceWith(canvas);
  return canvas;
}

function renderBalanceTrend() {
  const canvas = ensureCanvas('balanceChart');
  if (!canvas || typeof Chart === 'undefined') return;
  const now = Date.now();
  const tsOf = t => (typeof t.ts === 'number' && t.ts) ? t.ts : new Date((t.date || '1970-01-01') + 'T00:00:00').getTime();
  const labels = [], data = [];
  for (let i = 23; i >= 0; i--) {
    const end = new Date(now - i * 3600000), endMs = end.getTime();
    let bal = 0;
    S.transactions.forEach(t => { if (tsOf(t) <= endMs) bal += (t.type === 'income' ? t.amount : -t.amount); });
    labels.push(String(end.getHours()).padStart(2, '0') + ':00');
    data.push(bal);
  }
  if (chartBalance) chartBalance.destroy();
  chartBalance = _tkLine(canvas, labels, data);
}


function renderCategoryDonut(targetId) {
  const c = document.getElementById(targetId || 'categoryDonut');
  if (!c) return;
  const expenses = S.transactions.filter(t => t.type === 'expense');
  if (!expenses.length) { c.innerHTML = '<div class="empty-state" style="width:100%">' + t('common_no_data') + '</div>'; return; }
  const byCat = {};
  expenses.forEach(t => { const k = t.category || 'Diğer'; byCat[k] = (byCat[k] || 0) + t.amount; });
  const entries = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  const slices = entries.slice(0, 6);
  const rest = entries.slice(6);
  if (rest.length) { const r = rest.reduce((s, [, v]) => s + v, 0); if (r > 0) { const ex = slices.find(e => e[0] === 'Diğer'); if (ex) ex[1] += r; else slices.push(['Diğer', r]); } }
  const palette = ['#007AFF', '#AF52DE', '#FF9500', '#34C759', '#FF2D55', '#5AC8FA', '#8E8E93'];
  let cumulative = 0;
  const radius = 60, cx = 80, cy = 80, stroke = 22, circ = 2 * Math.PI * radius;
  let svg = '<svg viewBox="0 0 160 160" class="donut-svg" preserveAspectRatio="xMidYMid meet">';
  svg += '<circle cx="' + cx + '" cy="' + cy + '" r="' + radius + '" fill="none" stroke="var(--glass-border)" stroke-width="' + stroke + '"/>';
  slices.forEach(([cat, val], i) => {
    const pct = val / total, len = circ * pct, offset = circ * cumulative;
    svg += '<circle cx="' + cx + '" cy="' + cy + '" r="' + radius + '" fill="none" stroke="' + palette[i % palette.length] + '" stroke-width="' + stroke + '" stroke-dasharray="' + len + ' ' + (circ - len) + '" stroke-dashoffset="' + (-offset) + '" transform="rotate(-90 ' + cx + ' ' + cy + ')"/>';
    cumulative += pct;
  });
  svg += '<text x="' + cx + '" y="' + (cy - 2) + '" text-anchor="middle" fill="var(--text)" font-size="15" font-weight="700">' + fmtShort(total) + '</text>';
  svg += '<text x="' + cx + '" y="' + (cy + 14) + '" text-anchor="middle" fill="var(--text-muted)" font-size="9">' + t('inv_total_expense') + '</text>';
  svg += '</svg>';
  let legend = '<div class="donut-legend">';
  slices.forEach(([cat, val], i) => {
    const pct = ((val / total) * 100).toFixed(1);
    legend += '<div class="donut-legend-item"><span class="donut-legend-dot" style="background:' + palette[i % palette.length] + '"></span><span class="donut-legend-name">' + sanitize(catLabel(cat)) + '</span><span class="donut-legend-val">%' + pct + '</span></div>';
  });
  legend += '</div>';
  c.innerHTML = svg + legend;
}


function renderWeeklyBars() {
  const canvas = ensureCanvas('weeklyChart');
  if (!canvas || typeof Chart === 'undefined') return;

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const labels = [];
  const incomes = [];
  const expenses = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const k = d.toISOString().split('T')[0];
    labels.push(d.toLocaleDateString('tr-TR', { weekday: 'short' }));
    let inc = 0, exp = 0;
    S.transactions.filter(t => t.date === k).forEach(t => {
      if (t.type === 'income') inc += t.amount;
      else exp += t.amount;
    });
    incomes.push(inc);
    expenses.push(exp);
  }

  if (chartWeekly) chartWeekly.destroy();
  const text = getComputedStyle(document.documentElement).getPropertyValue('--text-soft').trim() || '#a5b0c8';
  const income = getComputedStyle(document.documentElement).getPropertyValue('--income').trim() || '#34d399';
  const expense = getComputedStyle(document.documentElement).getPropertyValue('--expense').trim() || '#f87171';

  chartWeekly = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Gelir', data: incomes, backgroundColor: income + 'cc', borderRadius: 6 },
        { label: 'Gider', data: expenses, backgroundColor: expense + 'cc', borderRadius: 6 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { labels: { color: text, font: { size: 11 } } },
        tooltip: { callbacks: { label: ctx => (ctx.dataset.label ? ctx.dataset.label + ': ' : '') + fmt(ctx.parsed.y) } }
      },
      scales: {
        x: { ticks: { color: text }, grid: { display: false } },
        y: { ticks: { color: text, callback: v => fmtShort(v) }, grid: { color: 'rgba(255,255,255,0.05)' } }
      }
    }
  });
}

let chartWeeklyT = null, chartMonthlyT = null, chartYearlyT = null;

function _tkLine(canvas, labels, data) {
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#22d3ee';
  const text = getComputedStyle(document.documentElement).getPropertyValue('--text-soft').trim() || '#a5b0c8';
  var _dmin = data.length ? Math.min.apply(null, data) : 0;
  var _dmax = data.length ? Math.max.apply(null, data) : 0;
  var _mid = (_dmin + _dmax) / 2;
  var _half = Math.max((_dmax - _dmin) * 1.25, Math.abs(_mid) * 0.15, 100);
  return new Chart(canvas, {
    type: 'line',
    data: { labels, datasets: [{ data, borderColor: accent, backgroundColor: accent + '22', fill: true, tension: 0.35, pointRadius: 0, borderWidth: 2 }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => fmt(ctx.parsed.y) } }
      },
      scales: {
        x: { ticks: { color: text, maxRotation: 0, autoSkip: true, maxTicksLimit: 6 }, grid: { display: false } },
        y: { min: _mid - _half, max: _mid + _half, ticks: { color: text, maxTicksLimit: 5, callback: v => fmtShort(v) }, grid: { color: 'rgba(255,255,255,0.05)' } }
      }
    }
  });
}

function _balanceAt(endKey) {
  let bal = 0;
  S.transactions.forEach(t => { if (t.date <= endKey) bal += (t.type === 'income' ? t.amount : -t.amount); });
  return bal;
}

function renderWeeklyTrend() {
  const c = ensureCanvas('tkWeekly');
  if (!c || typeof Chart === 'undefined') return;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const labels = [], data = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    labels.push(d.toLocaleDateString('tr-TR', { weekday: 'short' }));
    data.push(_balanceAt(d.toISOString().split('T')[0]));
  }
  if (chartWeeklyT) chartWeeklyT.destroy();
  chartWeeklyT = _tkLine(c, labels, data);
}

function renderMonthlyTrend() {
  const c = ensureCanvas('tkMonthly');
  if (!c || typeof Chart === 'undefined') return;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const labels = [], data = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    labels.push(d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' }));
    data.push(_balanceAt(d.toISOString().split('T')[0]));
  }
  if (chartMonthlyT) chartMonthlyT.destroy();
  chartMonthlyT = _tkLine(c, labels, data);
}

function renderYearlyBars() {
  const c = ensureCanvas('tkYearly');
  if (!c || typeof Chart === 'undefined') return;
  const year = new Date().getFullYear();
  const _yl = document.getElementById('tkYearLbl'); if (_yl) _yl.textContent = (typeof t === 'function' ? t('takip_year_trend').replace('{year}', year) : year + ' yılı trendi');
  const labels = [], inc = [], exp = [];
  for (let m = 0; m < 12; m++) {
    const first = new Date(year, m, 1), last = new Date(year, m + 1, 0);
    const fk = first.toISOString().split('T')[0], lk = last.toISOString().split('T')[0];
    let i = 0, e = 0;
    S.transactions.forEach(t => { if (t.date >= fk && t.date <= lk) { if (t.type === 'income') i += t.amount; else e += t.amount; } });
    labels.push(first.toLocaleDateString('tr-TR', { month: 'short' }));
    inc.push(i); exp.push(e);
  }
  if (chartYearlyT) chartYearlyT.destroy();
  const text = getComputedStyle(document.documentElement).getPropertyValue('--text-soft').trim() || '#a5b0c8';
  const income = getComputedStyle(document.documentElement).getPropertyValue('--income').trim() || '#34d399';
  const expense = getComputedStyle(document.documentElement).getPropertyValue('--expense').trim() || '#f87171';
  chartYearlyT = new Chart(c, {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Gelir', data: inc, backgroundColor: income + 'cc', borderRadius: 5 }, { label: 'Gider', data: exp, backgroundColor: expense + 'cc', borderRadius: 5 }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { labels: { color: text, font: { size: 11 } } },
        tooltip: { callbacks: { label: ctx => (ctx.dataset.label ? ctx.dataset.label + ': ' : '') + fmt(ctx.parsed.y) } }
      },
      scales: { x: { ticks: { color: text }, grid: { display: false } }, y: { ticks: { color: text, callback: v => fmtShort(v) }, grid: { color: 'rgba(255,255,255,0.05)' } } }
    }
  });
}

/* ─── Takip: mobil kart-liste pop-up ─── */
var _tkOrigin = null;
var TK_MAP = {
  'tk-saatlik': renderBalanceTrend,
  'tk-gunluk': renderWeeklyTrend,
  'tk-aylik': renderMonthlyTrend,
  'tk-yillik': renderYearlyBars,
  'tk-kategori': renderCategoryDonut
};
function _tkRestore() {
  var host = document.getElementById('tkSecHost');
  if (_tkOrigin && host) Array.prototype.slice.call(host.children).forEach(function (ch) { _tkOrigin.appendChild(ch); });
  _tkOrigin = null;
}
function openTkSec(cardId) {
  _tkRestore();
  var card = document.getElementById(cardId);
  var host = document.getElementById('tkSecHost');
  if (!card || !host) return;
  Array.prototype.slice.call(card.children).forEach(function (ch) {
    if (!ch.classList.contains('card-title')) host.appendChild(ch);
  });
  _tkOrigin = card;
  var t = document.getElementById('tkSecTitle');
  if (t) t.textContent = (card.querySelector('.card-title-text') || {}).textContent || '';
  try { showModal('modalTkSec'); } catch (e) {}
  var fn = TK_MAP[cardId];
  if (fn) setTimeout(function () { try { fn(); } catch (e) {} }, 420);
}
function closeTkSec() { _tkRestore(); try { closeModal('modalTkSec'); } catch (e) {} }
try {
  var _tkMq = window.matchMedia('(max-width: 760px)');
  var _tkMqH = function (e) { if (!e.matches) { _tkRestore(); try { closeModal('modalTkSec'); } catch (x) {} try { renderCharts(); } catch (x) {} } };
  if (_tkMq.addEventListener) _tkMq.addEventListener('change', _tkMqH);
  else if (_tkMq.addListener) _tkMq.addListener(_tkMqH);
} catch (e) {}