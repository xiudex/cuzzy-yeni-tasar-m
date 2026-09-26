/* ═══ 11. TRANSACTIONS ═══ */

function setTxType(type) {
  currentTxType = type;
  document.getElementById('txTypeIncome').classList.toggle('active', type === 'income');
  document.getElementById('txTypeExpense').classList.toggle('active', type === 'expense');
}

function addTx() {
  const desc = validateString(document.getElementById('txDesc').value, 50);
  const amt = validateAmount(document.getElementById('txAmt').value);
  const cat = document.getElementById('txCat').value;
  const date = validateDate(document.getElementById('txDate').value || todayStr());
  const note = validateString(document.getElementById('txNote').value, 200);

  if (!desc || !amt) return toast(t('toast_desc_amount_required'), 't-err');

  S.transactions.push({
    id: uid(), type: currentTxType, desc, amount: amt,
    category: cat, date, note, ts: Date.now()
  });
  save();
  notify(
    currentTxType,
    currentTxType === 'income' ? 'Gelir eklendi' : 'Gider eklendi',
    '₺' + amt.toLocaleString('tr-TR') + ' · ' + desc
  );
  toast(currentTxType === 'income' ? '+ Gelir eklendi' : '- Gider eklendi', 't-ok');

  document.getElementById('txDesc').value = '';
  document.getElementById('txAmt').value = '';
  updateNumWordHint(document.getElementById('txAmt'));
  document.getElementById('txNote').value = '';
  renderAll();
}

let qmQaType = '';
const QM_EXP_CATS = ['Market','Yemek','Ulaşım','Fatura','Kira','Sağlık','Eğlence'];
const QM_INC_CATS = ['Maaş','Yatırım','EFT - Para Alımı','Diğer'];

function qmQaResetType() {
  qmQaType = '';
  const bI = document.getElementById('qmqaTypeIncome'), bE = document.getElementById('qmqaTypeExpense');
  if (bI) bI.classList.remove('active');
  if (bE) bE.classList.remove('active');
  const sub = document.getElementById('qmqaSubmit');
  if (sub) {
    sub.classList.remove('income', 'expense');
    sub.textContent = 'Ekle';
  }
}
function qmQaSetType(type) {
  qmQaType = type;
  const bI = document.getElementById('qmqaTypeIncome'), bE = document.getElementById('qmqaTypeExpense');
  if (bI) bI.classList.toggle('active', type === 'income');
  if (bE) bE.classList.toggle('active', type === 'expense');
  const sub = document.getElementById('qmqaSubmit');
  if (sub) {
    sub.classList.toggle('income', type === 'income');
    sub.classList.toggle('expense', type === 'expense');
    sub.textContent = type === 'income' ? t('rec_add_income') : t('rec_add_expense');
  }
  const primary = type === 'income' ? QM_INC_CATS : QM_EXP_CATS;
  const sel = document.getElementById('qmqaCat');
  if (sel && !primary.includes(sel.value)) sel.value = primary[0];
  qmQaSyncCatLabel();
}
function qmQaSyncCatLabel() {
  const sel = document.getElementById('qmqaCat');
  const btn = document.getElementById('qmqaCatBtn');
  if (!sel || !btn) return;
  const opt = sel.options[sel.selectedIndex];
  btn.textContent = opt ? opt.textContent : sel.value;
}
function qmQaToggleCat(e) {
  if (e) e.stopPropagation();
  const pop = document.getElementById('qmqaCatPop');
  const sel = document.getElementById('qmqaCat');
  if (!pop || !sel) return;
  if (!pop.hasAttribute('hidden')) { pop.setAttribute('hidden', ''); return; }
  pop.innerHTML = '';
  Array.prototype.forEach.call(sel.options, function (opt) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = opt.textContent;
    if (opt.value === sel.value) b.className = 'is-on';
    b.onclick = function (ev) {
      ev.stopPropagation();
      sel.value = opt.value;
      qmQaSyncCatLabel();
      pop.setAttribute('hidden', '');
    };
    pop.appendChild(b);
  });
  pop.removeAttribute('hidden');
}
document.addEventListener('click', function (e) {
  const box = document.getElementById('qmqaCatBox');
  const pop = document.getElementById('qmqaCatPop');
  if (!box || !pop || pop.hasAttribute('hidden')) return;
  if (!box.contains(e.target)) pop.setAttribute('hidden', '');
});
function qmQaArmTapHint() {
  const hint = document.getElementById('qmqaTapHint');
  const slot = document.getElementById('qmqaHintSlot');
  if (!hint || !slot) return;
  let n = 0;
  try { n = parseInt(localStorage.getItem('cuzzy_qa_hint_n') || '0', 10) || 0; } catch (e) {}
  if (n >= 5) { hint.hidden = true; return; }
  hint.hidden = false;
  slot.classList.remove('qm-qa-tapped');
  try { localStorage.setItem('cuzzy_qa_hint_n', String(n + 1)); } catch (e) {}
}
function qmQaHideTapHint() {
  const amt = document.getElementById('qmqaAmt');
  const s = document.getElementById('qmqaHintSlot');
  if (!s || !amt || !String(amt.value || '').trim()) return;
  s.classList.add('qm-qa-tapped');
}
function qmQaDateLabel() {
  const inp = document.getElementById('qmqaDate');
  const lab = document.getElementById('qmqaDateLabel');
  if (!inp || !lab) return;
  if (!inp.value) inp.value = todayStr();
  const p = inp.value.split('-');
  if (p.length !== 3) return;
  lab.textContent = p[2] + '.' + p[1] + '.' + p[0];
}
function qmQaSetCat(el) {
  const sel = document.getElementById('qmqaCat');
  if (sel && el && el.dataset && el.dataset.cat) sel.value = el.dataset.cat;
}
function quickAddMobile() {
  if (qmQaType !== 'income' && qmQaType !== 'expense') return toast('Gelir veya gider seç', 't-err');
  const amt = validateAmount(document.getElementById('qmqaAmt').value);
  if (!amt) return toast(t('toast_amount_required'), 't-err');
  const sel = document.getElementById('qmqaCat');
  const cat = (sel && sel.value) || 'Diğer';
  const desc = validateString(document.getElementById('qmqaDesc').value, 50) || cat;
  const dateInp = document.getElementById('qmqaDate');
  const dateVal = validateDate((dateInp && dateInp.value) || todayStr());
  S.transactions.push({
    id: uid(), type: qmQaType, desc, amount: amt, category: cat,
    date: dateVal, note: 'Hızlı işlem', ts: new Date(dateVal + 'T12:00:00').getTime()
  });
  save();
  notify(qmQaType === 'income' ? 'income' : 'expense',
    qmQaType === 'income' ? 'Hızlı Gelir eklendi' : 'Hızlı Gider eklendi',
    '₺' + amt.toLocaleString('tr-TR') + ' · ' + desc
  );
  toast(qmQaType === 'income' ? '+ Gelir eklendi' : '- Gider eklendi', 't-ok');
  document.getElementById('qmqaAmt').value = '';
  updateNumWordHint(document.getElementById('qmqaAmt'));
  const hintSlot = document.getElementById('qmqaHintSlot');
  if (hintSlot) hintSlot.classList.remove('qm-qa-tapped');
  document.getElementById('qmqaDesc').value = '';
  if (dateInp) dateInp.value = todayStr();
  qmQaDateLabel();
  if (sel) sel.value = 'Market';
  qmQaSyncCatLabel();
  qmQaResetType();
  renderAll();
  try { haptic('success'); } catch (e) {}
  closeGenericModal('modalQuickAdd');
}

function quickAdd(type) {
  const amt = validateAmount(document.getElementById('qAmt').value);
  const cat = document.getElementById('qCat')?.value || 'Diğer';
  const desc = validateString(document.getElementById('qDesc').value, 50) || cat;
  if (!amt) return toast(t('toast_amount_required'), 't-err');
  const dateVal = validateDate(document.getElementById('qDate')?.value || todayStr());
  S.transactions.push({
    id: uid(), type, desc, amount: amt, category: cat,
    date: dateVal, note: 'Hızlı işlem', ts: new Date(dateVal + 'T12:00:00').getTime()
  });
  save();
  notify(type === 'income' ? 'income' : 'expense',
    type === 'income' ? 'Hızlı Gelir eklendi' : 'Hızlı Gider eklendi',
    '₺' + amt.toLocaleString('tr-TR') + ' · ' + desc
  );
  toast(t('common_added'), 't-ok');
  document.getElementById('qAmt').value = '';
  updateNumWordHint(document.getElementById('qAmt'));
  document.getElementById('qDesc').value = '';
  const qCatEl = document.getElementById('qCat'); if (qCatEl) qCatEl.value = 'Diğer';
  const qDateEl = document.getElementById('qDate'); if (qDateEl) { qDateEl.value = ''; qDateEl.dispatchEvent(new Event('change', { bubbles: true })); }
  renderAll();
}

function deleteTx(id) {
  const t = S.transactions.find(x => x.id === id);
  showConfirm({
    title: t('confirm_del_tx_title'),
    msg: t('confirm_del_tx_msg'),
    danger: true,
    onOk: () => {
      S.transactions = S.transactions.filter(x => x.id !== id);
      save();
      if (t) notify(t.type, t.type === 'income' ? 'Gelir silindi' : 'Gider silindi',
                    '₺' + Number(t.amount).toLocaleString('tr-TR') + ' · ' + (t.desc || ''));
      renderAll();
      toast(t('common_deleted'), 't-ok');
    }
  });
}

function setTxFilter(f, btn) {
  txFilter = f;
  document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  softModalResize(renderTxList);
}

function renderDashRecent() {
  const dr = document.getElementById('dashRecentTx');
  if (!dr) return;
  const txs = [...S.transactions].sort((a, b) => b.ts - a.ts);
  const recent = txs.slice(0, 8);
  dr.innerHTML = recent.length
    ? recent.map(txItemHTML).join('')
    : '<div class="empty-state">' + t('empty_no_tx_hint') + '</div>';
  if (typeof _censorOn !== 'undefined' && _censorOn) { try { applyCensor(); } catch (e) {} }
}

function txItemHTML(t) {
  const safeDesc = sanitize(t.desc);
  const safeCat = sanitize(catLabel(t.category));
  const dateStr = new Date(t.date).toLocaleDateString(localeCode());
  const safeId = t.id.replace(/"/g, '&quot;');
  return `<div class="tx-item ${t.type}">
    <div class="tx-icon ${t.type}">${t.type === 'income' ? '↗' : '↘'}</div>
    <div class="tx-body">
      <div class="tx-name">${safeDesc}</div>
      <div class="tx-cat">${safeCat}</div>
      <div class="tx-amt ${t.type}">${fmt(t.amount)}</div>
    </div>
    <div class="tx-date">${dateStr}</div>
    <button class="tx-edit" onclick="showEditTx('${safeId}')" title="Düzenle">✎</button>
    <button class="tx-del" onclick="deleteTx('${safeId}')" title="Sil">✕</button>
  </div>`;
}

function renderTxList() {
  const list = document.getElementById('txList');
  if (!list) return;
  let txs = [...S.transactions];
  if (txFilter !== 'all') txs = txs.filter(t => t.type === txFilter);
  txs.sort((a, b) => b.ts - a.ts);
  if (!txs.length) { list.innerHTML = '<div class="empty-state">' + t('empty_no_tx') + '</div>'; return; }

  const _td   = todayStr();
  const _ydObj = new Date(); _ydObj.setDate(_ydObj.getDate() - 1);
  const _yd   = _ydObj.getFullYear() + '-' + String(_ydObj.getMonth() + 1).padStart(2, '0') + '-' + String(_ydObj.getDate()).padStart(2, '0');
  const _wkObj = new Date(); _wkObj.setDate(_wkObj.getDate() - 7);
  const _wk   = _wkObj.getFullYear() + '-' + String(_wkObj.getMonth() + 1).padStart(2, '0') + '-' + String(_wkObj.getDate()).padStart(2, '0');
  const _moObj = new Date(); _moObj.setDate(1);
  const _mo   = _moObj.getFullYear() + '-' + String(_moObj.getMonth() + 1).padStart(2, '0') + '-01';

  const getGroup = d => {
    if (d >= _td)  return 'Bugün';
    if (d >= _yd)  return 'Dün';
    if (d >= _wk)  return 'Bu hafta';
    if (d >= _mo)  return 'Bu ay';
    return new Date(d + 'T12:00:00').toLocaleDateString(localeCode(), { year: 'numeric', month: 'long' });
  };

  let html = '', lastG = null;
  for (const t of txs) {
    const g = getGroup(t.date);
    if (g !== lastG) { html += '<div class="tx-date-header">' + g + '</div>'; lastG = g; }
    html += txItemHTML(t);
  }
  list.innerHTML = html;
  if (typeof _censorOn !== 'undefined' && _censorOn) { try { applyCensor(); } catch (e) {} }
}

/* ═══ 12. RECURRING ═══ */

function setRecType(type) {
  currentRecType = type;
  document.getElementById('recTypeIncome').classList.toggle('active', type === 'income');
  document.getElementById('recTypeExpense').classList.toggle('active', type === 'expense');
}

function addRecurring() {
  const desc = validateString(document.getElementById('recDesc').value, 50);
  const amt = validateAmount(document.getElementById('recAmt').value);
  const day = Math.min(31, Math.max(1, parseInt(document.getElementById('recDay').value) || 1));
  if (!desc || !amt) return toast(t('toast_desc_amount_required'), 't-err');

  S.recurring.push({ id: uid(), type: currentRecType, desc, amount: amt, day });
  save();
  toast(t('toast_recurring_added'), 't-ok');
  document.getElementById('recDesc').value = '';
  document.getElementById('recAmt').value = '';
  const _rd = document.getElementById('recDay'); if (_rd) _rd.value = '';
  renderAll();
}

function deleteRecurring(id) {
  showConfirm({
    title: t('confirm_del_rec_title'),
    msg: t('confirm_del_rec_msg'),
    danger: true,
    onOk: () => {
      S.recurring = S.recurring.filter(r => r.id !== id);
      save();
      renderAll();
      toast(t('toast_recurring_deleted'), 't-ok');
    }
  });
}


/* ═══ 11b. İŞLEM DÜZENLEME ═══ */

let _editTxType = 'income';

function setEditTxType(type) {
  _editTxType = type;
  document.getElementById('editTxTypeIncome').classList.toggle('active', type === 'income');
  document.getElementById('editTxTypeExpense').classList.toggle('active', type === 'expense');
  document.getElementById('editTxTypeIncome').classList.toggle('income', type === 'income');
  document.getElementById('editTxTypeExpense').classList.toggle('expense', type === 'expense');
}

function showEditTx(id) {
  const t = S.transactions.find(x => x.id === id);
  if (!t) return toast(t('toast_tx_not_found'), 't-err');
  _editTxType = t.type;
  document.getElementById('editTxId').value = t.id;
  document.getElementById('editTxDesc').value = t.desc;
  document.getElementById('editTxAmt').value = t.amount;
  document.getElementById('editTxCat').value = t.category || 'Diğer';
  document.getElementById('editTxDate').value = t.date;
  document.getElementById('editTxNote').value = t.note || '';
  setEditTxType(t.type);
  showModal('modalEditTx');
}

function saveEditTx() {
  const id = document.getElementById('editTxId').value;
  const idx = S.transactions.findIndex(x => x.id === id);
  if (idx === -1) return toast(t('toast_tx_not_found'), 't-err');

  const desc = validateString(document.getElementById('editTxDesc').value, 50);
  const amt  = validateAmount(document.getElementById('editTxAmt').value);
  const cat  = document.getElementById('editTxCat').value;
  const date = validateDate(document.getElementById('editTxDate').value || todayStr());
  const note = validateString(document.getElementById('editTxNote').value, 200);

  if (!desc || !amt) return toast(t('toast_desc_amount_required'), 't-err');

  S.transactions[idx] = { ...S.transactions[idx], type: _editTxType, desc, amount: amt, category: cat, date, note };
  save();
  closeModal();
  toast(t('toast_tx_updated'), 't-ok');
  renderAll();
}

/* ═══ 12b. OTOMATİK TEKRARLAYANlar ═══ */

function applyRecurringForMonth() {
  if (!S.recurring.length && !S.subscriptions.length) return;

  const now   = new Date();
  const year  = now.getFullYear();
  const mm    = String(now.getMonth() + 1).padStart(2, '0');
  const today = now.getDate();
  const monthPrefix = year + '-' + mm;

  if (!Array.isArray(S.recurringApplied)) S.recurringApplied = [];

  let added = 0;
  const newKeys = [];

  // — Tekrarlayan işlemler —
  for (const r of S.recurring) {
    if (r.months > 0 && r.startMonth) {
      const [sy, sm] = r.startMonth.split('-').map(Number);
      const monthsPassed = (year - sy) * 12 + (now.getMonth() + 1 - sm);
      if (monthsPassed >= r.months) continue;
    }
    const _rLastDay = new Date(year, now.getMonth() + 1, 0).getDate();
    const _rChargeDay = Math.min(r.day, _rLastDay);
    if (_rChargeDay > today) continue;
    const key = monthPrefix + '-r-' + r.id;
    if (S.recurringApplied.includes(key)) continue;
    // Bu ay aynı açıklama+tutar+tür zaten varsa duplicate oluşturma
    const exists = S.transactions.some(t =>t.desc === r.desc && t.amount === r.amount && t.type === r.type && t.date.startsWith(monthPrefix)
    );
    if (!exists) {
      const dateStr = monthPrefix + '-' + String(_rChargeDay).padStart(2, '0');
      S.transactions.push({
        id: uid(), type: r.type, desc: r.desc, amount: r.amount,
        category: r.type === 'income' ? 'Maaş' : 'Fatura',
        date: dateStr, note: 'Otomatik — Tekrarlayan', ts: new Date(dateStr + 'T00:00:00').getTime()
      });
      added++;
    }
    newKeys.push(key);
  }

  // — Abonelikler —
  for (const sub of S.subscriptions) {
    const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
    const chargeDay = Math.min(sub.day, lastDay);
    if (chargeDay > today) continue;
    const key = monthPrefix + '-s-' + sub.id;
    if (S.recurringApplied.includes(key)) continue;
    const exists = S.transactions.some(t =>t.desc === sub.name && t.amount === sub.amount && t.type === 'expense' && t.date.startsWith(monthPrefix)
    );
    if (!exists) {
      const dateStr = monthPrefix + '-' + String(chargeDay).padStart(2, '0');
      S.transactions.push({
        id: uid(), type: 'expense', desc: sub.name, amount: sub.amount,
        category: 'Fatura', date: dateStr, note: 'Otomatik — Abonelik',
        ts: new Date(dateStr + 'T00:00:00').getTime()
      });
      added++;
    }
    newKeys.push(key);
  }

  if (newKeys.length > 0) {
    S.recurringApplied.push(...newKeys);
    save();
    if (added > 0) {
      renderAll();
      notify('general', 'Otomatik işlemler oluşturuldu', added + ' tekrarlayan/abonelik işlemi bu ay için eklendi.');
      toast(added + ' otomatik işlem eklendi', 't-ok');
    }
  }
}

function renderRecurring() {
  const c = document.getElementById('recList');
  if (!c) return;
  if (!S.recurring.length) {
    c.innerHTML = '<div class="empty-state">' + t('empty_none') + '</div>';
    return;
  }
  c.innerHTML = '<div class="planner-list">' + S.recurring.map(r => {
    const safeDesc = sanitize(r.desc);
    const safeId = r.id.replace(/"/g, '&quot;');
    const color = r.type === 'income' ? 'var(--income)' : 'var(--expense)';
    const sign = r.type === 'income' ? '+' : '-';
    return `<div class="planner-item">
      <div>
        <div class="planner-item-title">${safeDesc}</div>
        <div class="planner-item-meta">Her ayın ${r.day}. günü · ${r.type === 'income' ? 'Gelir' : 'Gider'}${r.months > 0 ? ' · ' + r.months + ' ay' : ''}</div>
      </div>
      <div>
        <div class="planner-item-amount" style="color:${color}">${sign}${fmt(r.amount)}</div>
        <div class="planner-item-actions">
          <button class="mrec-del" onclick="deleteRecurring('${safeId}')" aria-label="Sil">✕</button>
        </div>
      </div>
    </div>`;
  }).join('') + '</div>';
}

/* ═══ 13. DEBTS ═══ */

function addDebt() {
  const name = validateString(document.getElementById('debtName').value, 60);
  const amount = validateAmount(document.getElementById('debtAmt').value);
  const dueDate = validateString(document.getElementById('debtDue').value, 12);
  const type = validateString(document.getElementById('debtType').value, 30) || 'Borç';
  const installments = Math.min(99, Math.max(0, Math.trunc(Number(document.getElementById('debtInst').value) || 0)));
  if (!name || !amount) return toast(t('toast_title_amount_required'), 't-err');
  S.debts.push({ id: uid(), name, amount, dueDate, type, paid: false, installments, paidCount: 0, ts: Date.now() });
  save();
  notify(type === 'Alacak' ? 'income' : 'expense', type === 'Alacak' ? 'Alacak eklendi' : 'Borç eklendi', '₺' + amount.toLocaleString('tr-TR') + ' · ' + name);
  toast(t('toast_debt_added'), 't-ok');
  document.getElementById('debtName').value = '';
  document.getElementById('debtAmt').value = '';
  updateNumWordHint(document.getElementById('debtAmt'));
  document.getElementById('debtDue').value = '';
  document.getElementById('debtInst').value = '';
  renderAll();
}

function toggleDebtPaid(id) {
  const d = S.debts.find(x => x.id === id);
  if (!d) return;
  d.paid = !d.paid;
  save();
  renderAll();
}

function advanceDebtInstallment(id) {
  const d = S.debts.find(x => x.id === id);
  if (!d || !d.installments) return;
  if (d.paidCount < d.installments) d.paidCount++;
  if (d.paidCount >= d.installments) d.paid = true;
  save();
  renderAll();
}

function undoDebtInstallment(id) {
  const d = S.debts.find(x => x.id === id);
  if (!d || !d.installments) return;
  if (d.paidCount > 0) d.paidCount--;
  d.paid = false;
  save();
  renderAll();
}

function deleteDebt(id) {
  S.debts = S.debts.filter(d => d.id !== id);
  save();
  renderAll();
  toast(t('common_deleted'), 't-ok');
}

function renderDebts() {
  const c = document.getElementById('debtList');
  if (!c) return;
  const debts = [...S.debts].sort((a, b) => Number(a.paid) - Number(b.paid) || a.ts - b.ts);
  if (!debts.length) {
    c.innerHTML = '<div class="empty-state">' + t('empty_no_debt') + '</div>';
    return;
  }
  const todayKey = new Date().toISOString().split('T')[0];
  c.innerHTML = '<div class="debt-list">' + debts.map(d => {
    const safeName = sanitize(d.name);
    const safeType = sanitize(debtTypeLabel(d.type));
    const safeId = d.id.replace(/"/g, '&quot;');
    const due = d.dueDate ? new Date(d.dueDate).toLocaleDateString(localeCode()) : t('common_no_date');
    const isInstallment = d.installments > 0;
    const overdue = !d.paid && d.dueDate && d.dueDate < todayKey;

    if (isInstallment) {
      const pct = Math.min(100, Math.round((d.paidCount / d.installments) * 100));
      const remaining = Math.max(0, d.installments - d.paidCount) * d.amount;
      const done = d.paidCount >= d.installments;
      return `<div class="planner-item debt-item${done ? ' debt-done' : ''}">
        <div class="debt-item-top">
          <div>
            <div class="planner-item-title">${safeName}</div>
            <div class="planner-item-meta">${safeType} · ${d.paidCount}/${d.installments} taksit${overdue ? ' · <span class="debt-overdue">Gecikti</span>' : done ? ' · Tamamlandı' : ' · Son ödeme: ' + due}</div>
          </div>
          <div class="planner-item-amount" style="color:${done ? 'var(--text-muted)' : overdue ? 'var(--warning)' : 'var(--expense)'}">${done ? fmt(d.amount * d.installments) : fmt(remaining)}</div>
        </div>
        <div class="debt-progress-track"><div class="debt-progress-fill" style="width:${pct}%"></div></div>
        <div class="planner-item-actions">
          ${!done ? `<button class="btn btn-sm mdebt-pay" onclick="advanceDebtInstallment('${safeId}')">Taksit öde</button>` : ''}
          ${d.paidCount > 0 ? `<button class="btn btn-sm mdebt-plain" onclick="undoDebtInstallment('${safeId}')">Geri al</button>` : ''}
          <button class="btn btn-sm mdebt-del" onclick="deleteDebt('${safeId}')">Sil</button>
        </div>
      </div>`;
    }

    return `<div class="planner-item debt-item" style="opacity:${d.paid ? '.65' : '1'}">
      <div class="debt-item-top">
        <div>
          <div class="planner-item-title">${safeName}</div>
          <div class="planner-item-meta">${safeType} · ${overdue ? '<span class="debt-overdue">Gecikti</span> · ' : ''}Son ödeme: ${due}${d.paid ? ' · Ödendi' : ''}</div>
        </div>
        <div class="planner-item-amount" style="color:${d.paid ? 'var(--text-muted)' : overdue ? 'var(--warning)' : 'var(--expense)'}">${fmt(d.amount)}</div>
      </div>
      <div class="planner-item-actions">
        <button class="btn btn-sm mdebt-plain" onclick="toggleDebtPaid('${safeId}')">${d.paid ? 'Geri aç' : 'Ödendi'}</button>
        <button class="btn btn-sm mdebt-del" onclick="deleteDebt('${safeId}')">Sil</button>
      </div>
    </div>`;
  }).join('') + '</div>';
}

/* ═══ 14. SUBSCRIPTIONS ═══ */

function toggleDayPicker(e, inputId, popId) {
  if (e) e.stopPropagation();
  const pop = document.getElementById(popId);
  if (!pop) return;
  document.querySelectorAll('.subday-pop.open').forEach(p => { if (p !== pop) p.classList.remove('open'); });
  if (pop.classList.contains('open')) { pop.classList.remove('open'); return; }
  pop.innerHTML = '';
  for (let d = 1; d <= 31; d++) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = d;
    b.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const inp = document.getElementById(inputId);
      if (inp) inp.value = d;
      pop.classList.remove('open');
    });
    pop.appendChild(b);
  }
  pop.classList.add('open');
}
function toggleSubDayPicker(e) { toggleDayPicker(e, 'subDay', 'subDayPop'); }
function mRecDurInputClick(e) {
  const inp = document.getElementById('mRecDur');
  if (inp && inp.readOnly) toggleMonthDurPicker(e);
}
function toggleMonthDurPicker(e) {
  if (e) e.stopPropagation();
  const pop = document.getElementById('mRecDurPop');
  if (!pop) return;
  document.querySelectorAll('.subday-pop.open').forEach(p => { if (p !== pop) p.classList.remove('open'); });
  if (pop.classList.contains('open')) { pop.classList.remove('open'); return; }
  _renderRecDurGrid(pop);
  pop.classList.add('open');
}
function _renderRecDurGrid(pop) {
  pop.innerHTML = '';
  const isEn = (typeof S !== 'undefined' && S.language === 'en');
  const indefiniteLabel = t('rec_indefinite');
  const opts = [[indefiniteLabel, 0]];
  for (let m = 1; m <= 12; m++) opts.push([isEn ? (m + (m === 1 ? ' month' : ' months')) : (m + ' ay'), m]);
  opts.forEach(([label, val]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.style.gridColumn = label === indefiniteLabel ? '1 / -1' : '';
    b.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const inp = document.getElementById('mRecDur');
      if (inp) { inp.readOnly = true; inp.value = label; inp.dataset.months = val; }
      pop.classList.remove('open');
    });
    pop.appendChild(b);
  });
  const custom = document.createElement('button');
  custom.type = 'button';
  custom.textContent = t('rec_custom_duration');
  custom.style.gridColumn = '1 / -1';
  custom.addEventListener('click', (ev) => {
    ev.stopPropagation();
    pop.classList.remove('open');
    const inp = document.getElementById('mRecDur');
    if (inp) {
      inp.readOnly = false;
      inp.value = '';
      inp.placeholder = t('rec_month_count_placeholder');
      inp.dataset.months = 0;
      inp.focus();
    }
  });
  pop.appendChild(custom);
}
document.addEventListener('input', (e) => {
  if (e.target && e.target.id === 'mRecDur' && !e.target.readOnly) {
    let v = e.target.value.replace(/[^0-9]/g, '');
    if (v && parseInt(v, 10) > 99) v = '99';
    e.target.value = v;
    e.target.dataset.months = v ? parseInt(v, 10) : 0;
  }
});
document.addEventListener('click', (e) => {
  if (!e.target.closest('.subday-wrap')) document.querySelectorAll('.subday-pop.open').forEach(p => p.classList.remove('open'));
});
// Tutar alanlarına yalnızca rakam ve ayraç (,.) — harf/metin engellenir
document.addEventListener('input', (e) => {
  const el = e.target;
  if (el && el.tagName === 'INPUT' && el.type === 'text' && el.getAttribute('inputmode') === 'numeric') {
    const cleaned = el.value.replace(/[^0-9.,]/g, '');
    if (cleaned !== el.value) {
      const pos = Math.max(0, (el.selectionStart || cleaned.length) - 1);
      el.value = cleaned;
      try { el.setSelectionRange(pos, pos); } catch (_) {}
    }
  }
}, true);

function addSubscription() {
  const name = validateString(document.getElementById('subName').value, 60);
  const amount = validateAmount(document.getElementById('subAmt').value);
  const day = Math.min(31, Math.max(1, parseInt(document.getElementById('subDay').value) || 1));
  if (!name || !amount) return toast(t('toast_service_amount_required'), 't-err');
  S.subscriptions.push({ id: uid(), name, amount, day, ts: Date.now() });
  save();
  toast(t('toast_sub_added'), 't-ok');
  document.getElementById('subName').value = '';
  document.getElementById('subAmt').value = '';
  updateNumWordHint(document.getElementById('subAmt'));
  document.getElementById('subDay').value = '';
  renderAll();
}

function deleteSubscription(id) {
  S.subscriptions = S.subscriptions.filter(s => s.id !== id);
  save();
  renderAll();
  toast(t('common_deleted'), 't-ok');
}

function renderSubscriptions() {
  const c = document.getElementById('subList');
  if (!c) return;
  const subs = [...S.subscriptions].sort((a, b) => a.day - b.day);
  if (!subs.length) {
    c.innerHTML = '<div class="empty-state">' + t('empty_no_sub') + '</div>';
    return;
  }
  c.innerHTML = subs.map(s => {
    const safeName = sanitize(s.name);
    const safeId = s.id.replace(/"/g, '&quot;');
    return `<div class="planner-item">
      <div>
        <div class="planner-item-title">${safeName}</div>
        <div class="planner-item-meta">${t("sub_renews_on").replace("{day}", s.day)}</div>
      </div>
      <div>
        <div class="planner-item-amount msub-amt">${fmt(s.amount)}</div>
        <div class="planner-item-actions">
          <button class="btn btn-sm msub-del" onclick="deleteSubscription('${safeId}')">${t("common_delete_btn")}</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

/* ═══ 15. GOALS ═══ */

function addGoal() {
  const name = validateString(document.getElementById('goalName').value, 50);
  const target = validateAmount(document.getElementById('goalTarget').value);
  const current = Math.max(0, parseInputAmt(document.getElementById('goalCurrent').value) || 0);
  const date = validateString(document.getElementById('goalDate').value, 12);
  if (!name || !target) return toast(t('toast_name_target_required'), 't-err');
  S.goals.push({ id: uid(), name, target, current, date });
  save();
  notify('goals', 'Hedef eklendi', name + ' · ₺' + target.toLocaleString('tr-TR'));
  closeModal();
  document.getElementById('goalName').value = '';
  document.getElementById('goalTarget').value = '';
  updateNumWordHint(document.getElementById('goalTarget'));
  document.getElementById('goalCurrent').value = '0';
  updateNumWordHint(document.getElementById('goalCurrent'));
  toast(t('toast_goal_added'), 't-ok');
  renderAll();
}

function addToGoal(id) {
  const btn = document.getElementById('goalPay-' + id);
  const del = document.getElementById('goalDel-' + id);
  if (!btn) return;
  const inp = document.createElement('input');
  inp.type = 'text';
  inp.inputMode = 'decimal';
  inp.placeholder = '0,00';
  inp.className = 'goal-amt-in';
  inp.addEventListener('input', () => formatWhileTyping(inp));
  inp.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); commitGoalAdd(id, inp); }
  });
  inp.addEventListener('blur', () => {
    setTimeout(() => {
      if (!inp.isConnected || inp.dataset.done) return;
      if (!String(inp.value || '').trim()) restoreGoalPay(id, inp);
    }, 140);
  });
  btn.replaceWith(inp);
  if (del) {
    const ekle = document.createElement('button');
    ekle.type = 'button';
    ekle.className = 'btn btn-sm mgoal-ekle';
    ekle.id = 'goalEkle-' + id;
    ekle.textContent = 'Ekle';
    ekle.addEventListener('mousedown', (e) => e.preventDefault());
    ekle.addEventListener('click', () => commitGoalAdd(id, inp));
    del.replaceWith(ekle);
  }
  inp.focus();
}
function restoreGoalPay(id, inp) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn btn-sm mgoal-pay';
  btn.id = 'goalPay-' + id;
  btn.textContent = 'Para ekle';
  btn.onclick = () => addToGoal(id);
  if (inp && inp.parentNode) inp.replaceWith(btn);
  const ekle = document.getElementById('goalEkle-' + id);
  if (ekle) {
    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'btn btn-sm mgoal-del';
    del.id = 'goalDel-' + id;
    del.textContent = 'Sil';
    del.onclick = () => deleteGoal(id);
    ekle.replaceWith(del);
  }
}
function commitGoalAdd(id, inp) {
  if (!inp || inp.dataset.done) return;
  const v = validateAmount(inp.value);
  if (!v) return toast('Tutar gerekli', 't-err');
  const g = S.goals.find(x => x.id === id);
  if (!g) return;
  inp.dataset.done = '1';
  g.current = (g.current || 0) + v;
  save();
  toast(g.current >= g.target ? 'Hedefe ulaştın' : 'Eklendi', 't-ok');
  try { renderAll(); } catch (e) {}
}

function deleteGoal(id) {
  showConfirm({
    title: t('confirm_del_goal_title'),
    msg: t('confirm_del_goal_msg'),
    danger: true,
    onOk: () => {
      S.goals = S.goals.filter(g => g.id !== id);
      save(); renderAll(); toast(t('common_deleted'), 't-ok');
    }
  });
}

function renderGoals() {
  const c = document.getElementById('goalList');
  if (!c) return;
  if (!S.goals.length) {
    c.innerHTML = '<div class="card"><div class="empty-state">' + t('empty_no_goals') + '</div></div>';
    return;
  }
  c.innerHTML = S.goals.map(g => {
    const safeName = sanitize(g.name);
    const safeId = g.id.replace(/"/g, '&quot;');
    const pct = Math.min(100, Math.round((g.current / g.target) * 100));
    const remaining = Math.max(0, g.target - g.current);
    const fillClass = pct >= 100 ? '' : pct >= 70 ? '' : pct >= 30 ? 'warning' : 'danger';
    return `<div class="card goal-card">
      <div class="goal-top">
        <div class="goal-name">${safeName}</div>
        <div class="goal-pct">%${pct}</div>
      </div>
      <div class="goal-money">${fmt(g.current)} / ${fmt(g.target)} · Kalan ${fmt(remaining)}</div>
      <div class="progress"><div class="progress-fill ${fillClass}" style="width:${pct}%"></div></div>
      <div class="goal-actions">
        <button type="button" class="btn btn-sm mgoal-pay" id="goalPay-${safeId}" onclick="addToGoal('${safeId}')">Para ekle</button>
        <button type="button" class="btn btn-sm mgoal-del" id="goalDel-${safeId}" onclick="deleteGoal('${safeId}')">Sil</button>
      </div>
    </div>`;
  }).join('');
}

function renderDashboardGoals() {
  const c = document.getElementById('dashGoals');
  if (!c) return;
  if (!S.goals.length) {
    c.innerHTML = '<div class="empty-state">' + t('empty_no_goals') + '</div>';
    return;
  }
  const top3 = S.goals.slice(0, 3);
  c.innerHTML = top3.map(g => {
    const pct = Math.min(100, Math.round((g.current / g.target) * 100));
    return `<div style="padding:10px 0;border-bottom:1px solid var(--glass-border)">
      <div class="row-between" style="margin-bottom:6px">
        <span style="font-size:0.84rem;font-weight:600">${sanitize(g.name)}</span>
        <span style="font-size:0.78rem;color:var(--accent);font-weight:700">%${pct}</span>
      </div>
      <div class="progress"><div class="progress-fill" style="width:${pct}%"></div></div>
    </div>`;
  }).join('');
}

/* ═══ 16. NOTES ═══ */

function addNote() {
  const t = validateString(document.getElementById('noteTitle').value, 200);
  if (!t) return toast(t('toast_note_title_required'), 't-err');
  S.notes.push({ id: uid(), title: t, date: todayStr() });
  save();
  document.getElementById('noteTitle').value = '';
  renderNotes();
  toast(t('toast_note_added'), 't-ok');
}

function deleteNote(id) {
  S.notes = S.notes.filter(n => n.id !== id);
  save();
  renderNotes();
  toast(t('common_deleted'), 't-ok');
}

function renderNotes() {
  const c = document.getElementById('noteList');
  if (!c) return;
  if (!S.notes.length) {
    c.innerHTML = '<div class="empty-state">' + t('empty_no_note') + '</div>';
    return;
  }
  c.innerHTML = S.notes.map(n => {
    const safeTitle = sanitize(n.title);
    const safeId = n.id.replace(/"/g, '&quot;');
    return `<div class="note-item">
      <div>
        <div class="note-title-text"> ${safeTitle}</div>
        <div class="note-date">${n.date}</div>
      </div>
      <button class="btn btn-sm btn-ghost" onclick="deleteNote('${safeId}')">✕</button>
    </div>`;
  }).join('');
}

function openBalanceModal() {
  const inp = document.getElementById('baseBalanceInput');
  if (inp) {
    const _net = S.transactions.reduce((a, t) => a + (t.type === 'income' ? t.amount : -t.amount), 0);
    const _cur = S.baseBalanceSet ? ((S.baseBalance || 0) + _net) : 0;
    inp.value = _cur ? _cur.toLocaleString('tr-TR') : '';
    updateNumWordHint(inp);
  }
  showModal('modalBalance');
}

function saveBaseBalance() {
  const v = parseInputAmt(document.getElementById('baseBalanceInput').value);
  const x = (isNaN(v) || v < 0) ? 0 : v;
  const _net = S.transactions.reduce((a, t) => a + (t.type === 'income' ? t.amount : -t.amount), 0);
  S.baseBalance = x - _net;
  S.baseBalanceSet = true;
  saveNow(); // kritik: debounce yok, anında Firestore'a yaz (yenileme ile kaybolmasın)
  renderAll();
  closeModal();
  toast(t('toast_balance_updated'), 't-ok');
}