/* ═══ 17. RENDER ALL ═══ */

function getCurrentMonthExpense() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  return S.transactions
    .filter(t => t.type === 'expense')
    .filter(t => {
      const d = new Date(t.date || t.ts);
      return d.getFullYear() === y && d.getMonth() === m;
    })
    .reduce((s, t) => s + t.amount, 0);
}

function getCurrentMonthIncome() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  return S.transactions
    .filter(t => t.type === 'income')
    .filter(t => {
      const d = new Date(t.date || t.ts);
      return d.getFullYear() === y && d.getMonth() === m;
    })
    .reduce((s, t) => s + t.amount, 0);
}

function currentMonthKey() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
}

function updateBudgetBanner() {
  const banner = document.getElementById('budgetBanner');
  const text = document.getElementById('budgetText');
  const chip = document.getElementById('budgetChip');
  if (!banner) return;

  banner.className = 'summary-budget';
  const limit = S.monthlyBudget;
  if (limit <= 0) {
    text.textContent = 'Bütçe belirlenmedi. Ayarlar > Güvenlik bölümünden ekleyebilirsin.';
    chip.textContent = '—';
    banner.classList.add('show');
    return;
  }

  const exp = getCurrentMonthExpense();
  const usage = (exp / Math.max(limit, 1)) * 100;
  const left = Math.max(0, limit - exp);
  const monthKey = currentMonthKey();
  const threshold = S.budgetWarningThreshold || 80;

  text.textContent = `Bu ay ${fmt(exp)} harcandı · Kalan ${fmt(left)}`;
  chip.textContent = `%${usage.toFixed(0)}`;
  banner.classList.add('show');

  if (usage >= 100) {
    banner.classList.add('danger');
    if (S.budgetAlertSentMonth !== `${monthKey}-d` && S.notifications.expense) {
      toast(t('toast_budget_exceeded'), 't-err');
      S.budgetAlertSentMonth = `${monthKey}-d`;
      save();
    }
  } else if (usage >= threshold) {
    banner.classList.add('warn');
    if (S.budgetAlertSentMonth !== monthKey && S.notifications.expense) {
      toast(`Bütçe %${usage.toFixed(0)} doldu`, 't-info');
      S.budgetAlertSentMonth = monthKey;
      save();
    }
  }
}

let mRecType = 'income';
function mSetRecType(type) {
  mRecType = type === 'expense' ? 'expense' : (type === 'sub' ? 'sub' : 'income');
  const inc = document.getElementById('mRecTypeIncome');
  const exp = document.getElementById('mRecTypeExpense');
  const subBtn = document.getElementById('mRecTypeSub');
  if (inc) inc.classList.toggle('active', mRecType === 'income');
  if (exp) exp.classList.toggle('active', mRecType === 'expense');
  if (subBtn) subBtn.classList.toggle('active', mRecType === 'sub');
  const box = document.querySelector('#modalRecurring .modal-box');
  if (box) box.classList.toggle('mrec-is-sub', mRecType === 'sub');
  const sub = document.querySelector('#modalRecurring .mrec-submit');
  const dur = document.getElementById('mRecDurField');
  const label = document.getElementById('mRecDescLabel');
  const desc = document.getElementById('mRecDesc');
  if (dur) dur.style.display = mRecType === 'sub' ? 'none' : '';
  if (label) label.textContent = mRecType === 'sub' ? 'Servis' : 'Açıklama';
  if (desc) desc.placeholder = mRecType === 'sub' ? 'Örn: Spotify' : 'Örn: Kira';
  if (sub) {
    sub.classList.toggle('income', mRecType === 'income');
    sub.classList.toggle('expense', mRecType === 'expense');
    sub.classList.toggle('sub', mRecType === 'sub');
    sub.textContent = mRecType === 'income' ? t('rec_add_income') : (mRecType === 'sub' ? 'Abonelik ekle' : t('rec_add_expense'));
  }
}
function openRecurringModal() {
  mSetRecType('income');
  ['mRecDesc','mRecAmt'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  try { clearStaleNumHints(document.getElementById('modalRecurring')); } catch (e) {}
  const day = document.getElementById('mRecDay'); if (day) day.value = '1';
  const dur = document.getElementById('mRecDur'); if (dur) { dur.value = t('rec_indefinite'); dur.dataset.months = '0'; dur.readOnly = true; dur.placeholder = ''; }
  showModal('modalRecurring');
}
function addRecurringQuick() {
  const desc = validateString(document.getElementById('mRecDesc').value, 50);
  const amt = validateAmount(document.getElementById('mRecAmt').value);
  const day = Math.min(31, Math.max(1, parseInt(document.getElementById('mRecDay').value) || 1));
  const durEl = document.getElementById('mRecDur');
  const months = Math.min(99, Math.max(0, parseInt(durEl && durEl.dataset.months, 10) || 0));
  if (!desc || !amt) return toast(t('toast_desc_amount_required'), 't-err');
  if (mRecType === 'sub') {
    S.subscriptions.push({ id: uid(), name: desc, amount: amt, day, ts: Date.now() });
    save();
    renderAll();
    closeGenericModal('modalRecurring');
    toast(t('toast_sub_added'), 't-ok');
    return;
  }
  const now = new Date();
  const startMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  S.recurring.push({ id: uid(), type: mRecType, desc, amount: amt, day, months, startMonth });
  save();
  renderAll();
  closeGenericModal('modalRecurring');
  toast(t('toast_recurring_added'), 't-ok');
}

let mDebtType = 'Kredi Kartı';
function mDebtSetType(el) {
  mDebtType = el.dataset.type || 'Kredi Kartı';
  document.querySelectorAll('#mDebtTypeChips .mdebt-type-btn').forEach(b => b.classList.toggle('active', b === el));
}
function openDebtAddModal() {
  mDebtType = 'Kredi Kartı';
  document.querySelectorAll('#mDebtTypeChips .mdebt-type-btn').forEach(b => b.classList.toggle('active', b.dataset.type === 'Kredi Kartı'));
  ['mDebtName', 'mDebtAmt', 'mDebtDue', 'mDebtInst'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  try { clearStaleNumHints(document.getElementById('modalDebtAdd')); } catch (e) {}
  showModal('modalDebtAdd');
}
function addDebtQuick() {
  const nameEl = document.getElementById('mDebtName');
  const amtEl = document.getElementById('mDebtAmt');
  const dueEl = document.getElementById('mDebtDue');
  const instEl = document.getElementById('mDebtInst');
  const name = validateString(nameEl && nameEl.value, 60);
  const amount = validateAmount(amtEl && amtEl.value);
  const dueDate = validateString(dueEl && dueEl.value, 12);
  const installments = Math.min(99, Math.max(0, Math.trunc(Number(instEl && instEl.value) || 0)));
  if (!name || !amount) return toast('Başlık ve tutar gerekli', 't-err');
  S.debts.push({ id: uid(), name, amount, dueDate, type: mDebtType, paid: false, installments, paidCount: 0, ts: Date.now() });
  save();
  if (nameEl) nameEl.value = '';
  if (amtEl) amtEl.value = '';
  if (dueEl) dueEl.value = '';
  if (instEl) instEl.value = '';
  const hint = document.getElementById('h-mDebtAmt');
  if (hint) hint.textContent = '';
  toast('Borç eklendi', 't-ok');
  try { renderAll(); } catch (e) {}
}

function openSubAddModal() {
  ['mSubName', 'mSubAmt', 'mSubDay'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  try { clearStaleNumHints(document.getElementById('modalSubAdd')); } catch (e) {}
  showModal('modalSubAdd');
}
function addSubscriptionQuick() {
  const nameEl = document.getElementById('mSubName');
  const amtEl = document.getElementById('mSubAmt');
  const dayEl = document.getElementById('mSubDay');
  const name = validateString(nameEl && nameEl.value, 60);
  const amount = validateAmount(amtEl && amtEl.value);
  const dayRaw = parseInt(dayEl && dayEl.value, 10);
  if (!name || !amount) return toast('Servis ve tutar gerekli', 't-err');
  if (!dayRaw || dayRaw < 1 || dayRaw > 31) return toast('Yenileme günü seç', 't-err');
  S.subscriptions.push({ id: uid(), name, amount, day: dayRaw, ts: Date.now() });
  save();
  if (nameEl) nameEl.value = '';
  if (amtEl) amtEl.value = '';
  if (dayEl) dayEl.value = '';
  const hint = document.getElementById('h-mSubAmt');
  if (hint) hint.textContent = '';
  toast('Abonelik eklendi', 't-ok');
  try { renderAll(); } catch (e) {}
}

function openGoalAddModal() {
  ['mGoalName', 'mGoalTarget'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  const cur = document.getElementById('mGoalCurrent'); if (cur) cur.value = '0';
  try { clearStaleNumHints(document.getElementById('modalGoalAdd')); } catch (e) {}
  showModal('modalGoalAdd');
}
function addGoalQuick() {
  const nameEl = document.getElementById('mGoalName');
  const targetEl = document.getElementById('mGoalTarget');
  const curEl = document.getElementById('mGoalCurrent');
  const name = validateString(nameEl && nameEl.value, 50);
  const target = validateAmount(targetEl && targetEl.value);
  const current = Math.max(0, parseInputAmt(curEl && curEl.value) || 0);
  if (!name || !target) return toast('Hedef adı ve fiyat gerekli', 't-err');
  S.goals.push({ id: uid(), name, target, current, date: '' });
  save();
  if (nameEl) nameEl.value = '';
  if (targetEl) targetEl.value = '';
  if (curEl) curEl.value = '0';
  const h1 = document.getElementById('h-mGoalTarget');
  const h2 = document.getElementById('h-mGoalCurrent');
  if (h1) h1.textContent = '';
  if (h2) h2.textContent = '';
  toast('Hedef eklendi', 't-ok');
  try { renderAll(); } catch (e) {}
}

let allTxType = 'all';
let allTxRange = 'all';
function openAllTx() {
  allTxType = 'all'; allTxRange = 'all';
  const fromEl = document.getElementById('allTxFrom'), toEl = document.getElementById('allTxTo');
  if (fromEl) fromEl.value = ''; if (toEl) toEl.value = '';
  document.querySelectorAll('#allTxFilters .atx-seg[data-f]').forEach(b => b.classList.toggle('active', b.dataset.f === 'all'));
  document.querySelectorAll('#allTxFilters .atx-seg[data-r]').forEach(b => b.classList.toggle('active', b.dataset.r === 'all'));
  renderAllTxList();
  showModal('modalAllTx');
}
function setAllTxFilter(f) {
  allTxType = f;
  document.querySelectorAll('#allTxFilters .atx-seg[data-f]').forEach(b => b.classList.toggle('active', b.dataset.f === f));
  renderAllTxList();
}
function setAllTxRange(r) {
  allTxRange = r;
  const fromEl = document.getElementById('allTxFrom'), toEl = document.getElementById('allTxTo');
  if (fromEl) fromEl.value = ''; if (toEl) toEl.value = '';
  document.querySelectorAll('#allTxFilters .atx-seg[data-r]').forEach(b => b.classList.toggle('active', b.dataset.r === r));
  renderAllTxList();
}
function setAllTxCustomDate() {
  const fromEl = document.getElementById('allTxFrom'), toEl = document.getElementById('allTxTo');
  if (fromEl && fromEl.value || toEl && toEl.value) {
    allTxRange = 'custom';
    document.querySelectorAll('#allTxFilters .atx-seg[data-r]').forEach(b => b.classList.remove('active'));
  }
  renderAllTxList();
}
function renderAllTxList() {
  const c = document.getElementById('allTxList');
  if (!c) return;
  let txs = [...S.transactions];
  if (allTxType !== 'all') txs = txs.filter(t => t.type === allTxType);
  if (allTxRange === 'month' || allTxRange === 'week') {
    const now = new Date();
    const from = allTxRange === 'month'
      ? new Date(now.getFullYear(), now.getMonth(), 1)
      : (() => { const d = new Date(); d.setDate(d.getDate() - 7); return d; })();
    const fromStr = from.getFullYear() + '-' + String(from.getMonth() + 1).padStart(2, '0') + '-' + String(from.getDate()).padStart(2, '0');
    txs = txs.filter(t => t.date >= fromStr);
  } else if (allTxRange === 'custom') {
    const fromEl = document.getElementById('allTxFrom'), toEl = document.getElementById('allTxTo');
    const fromV = fromEl && fromEl.value, toV = toEl && toEl.value;
    if (fromV) txs = txs.filter(t => t.date >= fromV);
    if (toV) txs = txs.filter(t => t.date <= toV);
  }
  txs.sort((a, b) => b.ts - a.ts);
  c.innerHTML = txs.length ? txs.map(txItemHTML).join('') : '<div class="empty-state">' + t('empty_no_filtered_tx') + '</div>';
  if (typeof _censorOn !== 'undefined' && _censorOn) { try { applyCensor(); } catch (e) {} }
}

function onStickyInput(el) {
  S.stickyNote = (el.value || '').slice(0, 2000);
  const cnt = document.getElementById('mnoteCount');
  if (cnt) cnt.textContent = S.stickyNote.length + '/2000';
  const saved = document.getElementById('mnoteSaved');
  if (saved) saved.classList.remove('show');
  clearTimeout(window._snTimer);
  window._snTimer = setTimeout(() => {
    try { save(); } catch (e) {}
    if (saved) { saved.classList.add('show'); clearTimeout(window._snSavedTimer); window._snSavedTimer = setTimeout(() => saved.classList.remove('show'), 1400); }
  }, 600);
}

function renderAll() {
  try { renderPanelDate(); } catch (e) {}
  // KPI
  const monthInc = getCurrentMonthIncome();
  const monthExp = getCurrentMonthExpense();
  const totalInc = S.transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExp = S.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = totalInc - totalExp;
  const savingRate = monthInc > 0 ? Math.max(0, Math.round(((monthInc - monthExp) / monthInc) * 100)) : 0;
  const _wk = new Date(); _wk.setDate(_wk.getDate() - 6); // son 7 gün (bugün dahil)
  const _wkStr = _wk.getFullYear() + '-' + String(_wk.getMonth() + 1).padStart(2, '0') + '-' + String(_wk.getDate()).padStart(2, '0');
  const weekInc = S.transactions.filter(t => t.type === 'income' && t.date >= _wkStr).reduce((a, t) => a + t.amount, 0);
  const weekExp = S.transactions.filter(t => t.type === 'expense' && t.date >= _wkStr).reduce((a, t) => a + t.amount, 0);

  const setText = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  setText('kpiIncome', fmt(monthInc));
  const _acct = document.getElementById('acctSummary');
  if (_acct) _acct.innerHTML =
    '<div class="acct-row"><span>'+t('acct_total_income')+'</span><strong class="pos">'+fmt(totalInc)+'</strong></div>'+
    '<div class="acct-row"><span>'+t('acct_total_expense')+'</span><strong class="neg">'+fmt(totalExp)+'</strong></div>'+
    '<div class="acct-row"><span>'+t('acct_net')+'</span><strong>'+fmt(balance)+'</strong></div>'+
    '<div class="acct-row"><span>'+t('acct_tx_count')+'</span><strong>'+S.transactions.length+'</strong></div>'+
    '<div class="acct-row"><span>'+t('acct_month_net')+'</span><strong>'+fmt(monthInc - monthExp)+'</strong></div>'+
    '<div class="acct-row"><span>'+t('acct_active_goals')+'</span><strong>'+((S.goals&&S.goals.length)||0)+'</strong></div>';
  const _sn = document.getElementById('stickyNote');
  if (_sn && document.activeElement !== _sn) _sn.value = S.stickyNote || '';
  const _snCnt = document.getElementById('mnoteCount');
  if (_snCnt) _snCnt.textContent = (S.stickyNote || '').length + '/2000';
  try { if (typeof isMobileView === 'function' && isMobileView() && typeof renderCategoryDonut === 'function') renderCategoryDonut('panelCategoryDonut'); } catch (e) {}
  setText('kpiExpense', fmt(monthExp));
  setText('kpiWeekIncome', fmt(weekInc));
  setText('kpiWeekExpense', fmt(weekExp));
  setText('kpiBalance', fmt(monthInc - monthExp));
  const _curBal = S.baseBalanceSet ? ((S.baseBalance || 0) + balance) : 0;
  setText('kpiCurrentBalance', fmt(_curBal));
  setText('kpiCurBalTrend', S.transactions.length + ' ' + t('acct_tx_suffix'));
  setText('kpiIncomeTotal', fmt(totalInc));
  setText('kpiExpenseTotal', fmt(totalExp));
  setText('kpiSavingRate', monthInc > 0 ? `%${savingRate}` : '—');

  updateBudgetBanner();

  // Dashboard recent tx (filtreli)
  renderDashRecent();
  if (window.czRefresh) window.czRefresh();

  renderDashboardGoals();
  renderTxList();
  renderRecurring();
  renderDebts();
  renderSubscriptions();
  renderGoals();
  renderNotes();
  renderInvest();
  renderUploadHistory();
  renderRpRecentTx();
  renderRpGoalSummary();
  renderTicker();
  updateDashboardMarkets();
  updateAvatar();
  applyPlanRestrictions();
  updateNotifBadge();
  const _sb = document.getElementById('surveyNavBtn');
  if (_sb) _sb.style.display = S.surveyVersion === 'v3.8.2' ? 'none' : '';
  const _tk = document.getElementById('page-takip');
  if (_tk && _tk.classList.contains('active')) { try { renderCharts(); } catch (e) {} }
  if (_censorOn) applyCensor();
}

/* ═══ Sağ panel widget'ları ═══ */

function renderRpRecentTx() {
  const c = document.getElementById('rpRecentTx');
  if (!c) return;
  const recent = [...S.transactions].sort((a, b) => b.ts - a.ts).slice(0, 3);
  if (!recent.length) {
    c.innerHTML = '<div class="empty-state" style="padding:20px 12px;font-size:0.78rem">Henüz işlem yok</div>';
    return;
  }
  c.innerHTML = recent.map(t => {
    const safeDesc = sanitize(t.desc);
    const sign = t.type === 'income' ? '+' : '-';
    return `<div class="rp-mini-tx">
      <div class="rp-mini-tx-icon ${t.type}">${t.type === 'income' ? '↗' : '↘'}</div>
      <div class="rp-mini-tx-body">
        <div class="rp-mini-tx-name">${safeDesc}</div>
        <div class="rp-mini-tx-date">${new Date(t.date).toLocaleDateString(localeCode(), {day:'2-digit',month:'short'})}</div>
      </div>
      <div class="rp-mini-tx-amt ${t.type}">${sign}${fmt(t.amount)}</div>
    </div>`;
  }).join('');
}

function renderRpGoalSummary() {
  const c = document.getElementById('rpGoalSummary');
  if (!c) return;
  if (!S.goals.length) {
    c.innerHTML = '<div class="empty-state" style="padding:20px 12px;font-size:0.78rem">Hedef yok<br><a onclick="goTo(\'finans\',\'hedefler\');closeModal()" style="color:var(--accent);cursor:pointer;font-size:0.78rem;display:inline-block;margin-top:8px">+ Hedef ekle</a></div>';
    return;
  }
  // En yakın 2 hedef (en yüksek tamamlanma oranı)
  const top = [...S.goals]
    .map(g => ({ ...g, pct: Math.min(100, (g.current / g.target) * 100) }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 3);
  c.innerHTML = top.map(g => `
    <div class="rp-goal-item">
      <div class="row-between" style="margin-bottom:4px">
        <span style="font-size:0.78rem;font-weight:600;color:var(--text)">${sanitize(g.name)}</span>
        <span style="font-size:0.72rem;color:var(--accent);font-weight:700">%${Math.round(g.pct)}</span>
      </div>
      <div class="progress" style="height:5px"><div class="progress-fill" style="width:${g.pct}%"></div></div>
    </div>
  `).join('');
}

/* ═══ Üst nav: ticker (takip listesi) ═══ */

function renderTicker() {
  const track = document.getElementById('tickerTrack');
  if (!track) return;
  if (!S.watchlist || !S.watchlist.length) {
    track.innerHTML = '<span class="ticker-empty">+ Takip ekle</span>';
    return;
  }
  const usd = livePrices.usdtry || 0;
  track.innerHTML = S.watchlist.map((w, i) => {
    let label = w.symbol;
    let value = '—';
    if (w.type === 'forex') {
      const fxKey = (w.symbol === 'USD' ? 'usdtry' : w.symbol === 'EUR' ? 'eurtry' : w.symbol === 'GBP' ? 'gbptry' : w.symbol === 'TRYJPY' ? 'tryjpy' : null);
      const v = fxKey ? livePrices[fxKey] : null;
      if (v) value = '₺' + v.toFixed(w.symbol === 'TRYJPY' ? 3 : 4);
      label = w.symbol === 'TRYJPY' ? 'TRY/JPY' : w.symbol + '/TRY';
    } else if (w.type === 'crypto') {
      const k = KriptoListesi.find(x => x.sembol === w.symbol);
      if (k && livePrices[k.id] && usd) {
        const tryPrice = livePrices[k.id] * usd;
        value = '₺' + tryPrice.toLocaleString('tr-TR', { maximumFractionDigits: tryPrice > 100 ? 0 : 2 });
      }
    } else if (w.type === 'bist') {
      const v = bistPrices[w.symbol];
      if (v) value = '₺' + v.toFixed(2);
    }
    const sep = i < S.watchlist.length - 1 ? '<span class="ticker-divider"></span>' : '';
    return `<span class="ticker-item">
      <span class="ticker-item-symbol">${sanitize(label)}</span>
      <span class="ticker-item-value">${value}</span>
    </span>${sep}`;
  }).join('');
}

function populateWatchlistSymbols() {
  const type = document.getElementById('wlType').value;
  const sel = document.getElementById('wlSymbol');
  const q = (document.getElementById('wlSearch')?.value || '').trim().toLowerCase();
  let items = [];
  if (type === 'forex') {
    items = ['USD','EUR','GBP','TRYJPY'].map(x => ({ value: x, label: x === 'TRYJPY' ? 'TRY/JPY' : x + '/TRY' }));
  } else if (type === 'crypto') {
    items = KriptoListesi.map(k => ({ value: k.sembol, label: k.sembol + ' — ' + k.isim }));
  } else if (type === 'bist') {
    items = BIST100.map(x => ({ value: x, label: x }));
  }
  if (q) items = items.filter(it => it.label.toLowerCase().includes(q) || String(it.value).toLowerCase().includes(q));
  sel.innerHTML = items.length
    ? items.map(it => `<option value="${it.value}">${it.label}</option>`).join('')
    : '<option value="">Sonuç bulunamadı</option>';
}

function addToWatchlist() {
  const type = document.getElementById('wlType').value;
  const symbol = document.getElementById('wlSymbol').value.toUpperCase();
  if (!symbol) return;
  if (S.watchlist.some(w => w.type === type && w.symbol === symbol)) return toast(t('toast_already_listed'), 't-info');
  if (S.watchlist.length >= 18) return toast(t('toast_max_18_watch'), 't-err');
  S.watchlist.push({ type, symbol });
  save();
  renderTicker();
  renderWatchlistCurrent();
  toast(t('toast_added_to_watch'), 't-ok');
}

function removeFromWatchlist(idx) {
  S.watchlist.splice(idx, 1);
  save();
  renderTicker();
  renderWatchlistCurrent();
}

function renderWatchlistCurrent() {
  const c = document.getElementById('watchlistCurrent');
  const countLabel = document.getElementById('wlCountLabel');
  if (!c) return;
  if (countLabel) countLabel.textContent = `${S.watchlist.length}/18 takip`;

  if (!S.watchlist.length) {
    c.innerHTML = '<div class="empty-state" style="padding:24px 14px;font-size:0.82rem">Henüz takip yok.<br><span style="font-size:0.76rem;color:var(--text-muted);margin-top:6px;display:block">Soldan ekle, listene düşsün.</span></div>';
    return;
  }

  const usd = livePrices.usdtry || 0;
  c.innerHTML = S.watchlist.map((w, i) => {
    const icon = w.type === 'forex' ? '' : w.type === 'crypto' ? '' : '';
    let symbolLabel = w.symbol;
    let metaLabel = '';
    let priceLabel = '—';

    if (w.type === 'forex') {
      symbolLabel = w.symbol === 'TRYJPY' ? 'TRY/JPY' : w.symbol + '/TRY';
      metaLabel = 'Döviz kuru';
      const fxKey = (w.symbol === 'USD' ? 'usdtry' : w.symbol === 'EUR' ? 'eurtry' : w.symbol === 'GBP' ? 'gbptry' : w.symbol === 'TRYJPY' ? 'tryjpy' : null);
      const v = fxKey ? livePrices[fxKey] : null;
      if (v) priceLabel = '₺' + v.toFixed(w.symbol === 'TRYJPY' ? 3 : 4);
    } else if (w.type === 'crypto') {
      const k = KriptoListesi.find(x => x.sembol === w.symbol);
      metaLabel = k ? k.isim : 'Kripto';
      if (k && livePrices[k.id] && usd) {
        const tryPrice = livePrices[k.id] * usd;
        priceLabel = '₺' + tryPrice.toLocaleString('tr-TR', { maximumFractionDigits: tryPrice > 100 ? 0 : 2 });
      }
    } else if (w.type === 'bist') {
      metaLabel = 'BIST hissesi';
      const v = bistPrices[w.symbol];
      if (v) priceLabel = '₺' + v.toFixed(2);
    }

    return `<div class="wl-item">
      <div class="wl-item-icon">${icon}</div>
      <div class="wl-item-body">
        <div class="wl-item-symbol">${sanitize(symbolLabel)}</div>
        <div class="wl-item-meta">${metaLabel}</div>
      </div>
      <div class="wl-item-price">${priceLabel}</div>
      <button class="wl-item-remove" onclick="removeFromWatchlist(${i})" title="Listeden çıkar">✕</button>
    </div>`;
  }).join('');
}

/* ═══ Üst nav: avatar ═══ */

function updateAvatar() {
  const el = document.getElementById('navAvatarText');
  if (!el) return;
  const name = (S.profile?.name || 'K').trim();
  el.textContent = name.charAt(0).toUpperCase();
}

/* ═══ Topnav pill kayma ═══ */

function updateTopnavPill() {
  const pill = document.getElementById('topnavPillBg');
  if (!pill) return;
  const active = document.querySelector('.topnav-item.active');
  if (!active) { pill.classList.remove('ready'); return; }
  pill.style.transform = `translateX(${active.offsetLeft}px)`;
  pill.style.width = active.offsetWidth + 'px';
  // İlk girişte transition'sız konumlandır, sonra hazırla
  if (!pill.classList.contains('ready')) {
    requestAnimationFrame(() => pill.classList.add('ready'));
  }
}

function updateMbnPill() {
  const pill = document.getElementById('mbnPillBg');
  if (!pill) return;
  const active = document.querySelector('.mbn-item.active');
  if (!active) { pill.classList.remove('ready'); return; }
  pill.style.transform = `translateX(${active.offsetLeft}px)`;
  pill.style.width = active.offsetWidth + 'px';
  if (!pill.classList.contains('ready')) {
    requestAnimationFrame(() => pill.classList.add('ready'));
  }
}

window.addEventListener('resize', () => {
  updateTopnavPill();
  updateSubnavPill();
  updateMbnPill();
});

/* ═══ Sayfa yenileme ═══ */

function refreshApp() {
  if (currentUser) {
    // Manuel re-render + manuel canlı veri çekme
    renderAll();
    toast(t('common_renewed'), 't-ok'); // anında geri bildirim — market verisini beklemez
    if (typeof startLiveMarkets === 'function') {
      // Marketleri arka planda zorla yenile
      Promise.allSettled([fetchForex(), fetchCrypto(), fetchBIST()]).then(() => {
        renderTicker();
        if (typeof updateDashboardMarkets === 'function') updateDashboardMarkets();
      });
    }
  } else {
    location.reload();
  }
}


/* ═════════════════════════════════════════════════════════════════ */

/* ─── Panel basligi tarihi + tutar sansuru ─── */
function renderPanelDate() {
  var el = document.getElementById('panelDate');
  if (el) el.textContent = new Date().toLocaleDateString(localeCode(), { day: 'numeric', month: 'long', weekday: 'long' });
}
var _censorOn = false;
function _maskNum(s) { return String(s).replace(/[0-9]/g, '\u2022'); }
function applyCensor() {
  document.querySelectorAll('.kpi-value, .tx-amt, .acct-row strong').forEach(function (el) {
    if (_censorOn) {
      var cur = el.textContent;
      if (cur.indexOf('\u2022') === -1) el.dataset.real = cur;
      el.textContent = _maskNum(el.dataset.real != null ? el.dataset.real : cur);
    } else if (el.dataset.real != null) {
      el.textContent = el.dataset.real; delete el.dataset.real;
    }
  });
}
function toggleTxCensor() {
  _censorOn = !_censorOn;
  document.body.classList.toggle('tx-censored', _censorOn);
  document.querySelectorAll('.pb-eye, .tx-eye-desk').forEach(function (b) { b.classList.toggle('eye-off', _censorOn); b.setAttribute('title', _censorOn ? 'Rakamları göster' : 'Rakamları gizle'); });
  applyCensor();
}
try {
  var _censorMq = window.matchMedia('(max-width: 760px)');
  var _censorMqH = function () { if (_censorOn) { _censorOn = false; document.body.classList.remove('tx-censored'); document.querySelectorAll('.pb-eye, .tx-eye-desk').forEach(function (b) { b.classList.remove('eye-off'); b.setAttribute('title', 'Rakamları gizle'); }); applyCensor(); } };
  if (_censorMq.addEventListener) _censorMq.addEventListener('change', _censorMqH);
  else if (_censorMq.addListener) _censorMq.addListener(_censorMqH);
} catch (e) {}