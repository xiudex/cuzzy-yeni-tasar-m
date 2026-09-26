/* ═══ 21. FILE UPLOAD ═══ */

let uploadParsed = null;     // { headers, rows, fileName }
let uploadMapping = null;    // { date, desc, amount, debit, credit, type }

// Parses a raw cell value into a signed float; returns 0 if unparseable
function parseExtrAmt(str) {
  if (str === undefined || str === null) return 0;
  let s = String(str)
    .replace(/[\u2212\u2013\u2014\u2010\u2011]/g, '-') // unicode eksi/tire çeşitlerini ASCII '-' yap
    .replace(/[₺TLtry€$£\s]/gi, '')
    .trim();
  if (!s) return 0;
  // Muhasebe stili parantez negatifi: (1.234,56) → -1234.56
  const neg = s.startsWith('(') && s.endsWith(')');
  if (neg) s = '-' + s.slice(1, -1).trim();
  s = s.replace(/^\+/, ''); // baştaki + işaretini at
  const isNeg = s.startsWith('-');
  const n = parseInputAmt(s.replace(/^-/, '').trim());
  if (!Number.isFinite(n) || n === 0) return 0;
  return isNeg ? -n : n;
}

function autoDetectColumns(headers) {
  // Türkçe 'İ'.toLowerCase() → 'i̇' (birleşik nokta U+0307) sorununu gider: nokta atılır
  const lower = headers.map(h => String(h || '').toLowerCase().replace(/\u0307/g, '').trim());
  // Returns column index of first header containing any of the given substrings
  const findIdx = (patterns) => {
    for (const p of patterns) {
      for (let i = 0; i < lower.length; i++) {
        if (lower[i].includes(p)) return i;
      }
    }
    return -1;
  };
  return {
    date:   findIdx(['tarih', 'date', 'işlem tar', 'işlem zaman', 'zaman', 'valör', 'valor', 'transaction date', 'tarih/saat', 'işl.tar', 'i\u015flem tar']),
    desc:   findIdx(['açıklama', 'aciklama', 'description', 'detay', 'işlem açık', 'hareket açık',
                     'karşı taraf', 'alıcı', 'gönderici', 'bilgi', 'işlem bilg', 'açiklama',
                     'i\u015flem a\u00e7\u0131k', 'hareket a\u00e7\u0131k', 'ad soyad', 'açıklama/karşı']),
    amount: findIdx(['tutar', 'amount', 'miktar', 'meblağ', 'net tutar', 'işlem tutarı', 'bakiye değ']),
    debit:  findIdx(['borç', 'bor\u00e7', 'çıkış', '\u00e7\u0131k\u0131\u015f', 'çıkan', 'giden', 'debit',
                     'ödeme', 'harcama', 'out', 'withdraw', 'para çık']),
    credit: findIdx(['alacak', 'giriş', 'giri\u015f', 'gelen', 'credit', 'tahsilat', 'yatırılan',
                     'yatırma', 'giren', 'inflow', 'deposit', 'para gir', 'cashback']),
    type:   findIdx(['tür', 'type', 'işlem tipi', 'işlem tür', 'hareket tipi', 'hareket tür', 'yön', 'yon', 'i\u015flem tipi'])
  };
}

function buildPreviewTable() {
  if (!uploadParsed) return;
  const { headers, rows } = uploadParsed;
  const head = document.getElementById('previewHead');
  const body = document.getElementById('previewBody');
  head.innerHTML = '<tr>' + headers.map(h => `<th>${sanitize(String(h || ''))}</th>`).join('') + '</tr>';
  body.innerHTML = rows.slice(0, 50).map(r =>
    '<tr>' + headers.map((_, i) => {
      let cell = String(r[i] ?? '');
      if (i === uploadMapping.desc) cell = cleanTxLabel(cell, '');   // önizlemede de açıklama yerine temiz etiket
      return `<td>${sanitize(cell)}</td>`;
    }).join('') + '</tr>'
  ).join('');

  const mapper = document.getElementById('colMapper');
  const opts = ['<option value="-1">— Yok —</option>'].concat(headers.map((h, i) => `<option value="${i}">${sanitize(String(h || 'Sütun ' + (i+1)))}</option>`)).join('');
  mapper.innerHTML = `
    <div class="field"><label>Tarih sütunu</label><select id="mapDate">${opts}</select></div>
    <div class="field"><label>Açıklama sütunu</label><select id="mapDesc">${opts}</select></div>
    <div class="field"><label>Tutar (tek sütun)</label><select id="mapAmount">${opts}</select></div>
    <div class="field"><label>Borç / Çıkış sütunu</label><select id="mapDebit">${opts}</select></div>
    <div class="field"><label>Alacak / Giriş sütunu</label><select id="mapCredit">${opts}</select></div>
    <div class="field"><label>Tür sütunu (opsiyonel)</label><select id="mapType">${opts}</select></div>
  `;
  // Safely select an option by value (avoids browser inconsistencies with el.value = number)
  const selSet = (id, val) => {
    const el = document.getElementById(id); if (!el) return;
    const v = String(val ?? -1);
    const opt = [...el.options].find(o => o.value === v);
    el.value = opt ? v : '-1';
    el.dispatchEvent(new Event('change', { bubbles: true }));
  };
  selSet('mapDate',   uploadMapping.date);
  selSet('mapDesc',   uploadMapping.desc);
  selSet('mapAmount', uploadMapping.amount);
  selSet('mapDebit',  uploadMapping.debit);
  selSet('mapCredit', uploadMapping.credit);
  selSet('mapType',   uploadMapping.type);
}

function reparseUpload() {
  if (!uploadParsed) return;
  uploadMapping = {
    date:   parseInt(document.getElementById('mapDate').value),
    desc:   parseInt(document.getElementById('mapDesc').value),
    amount: parseInt(document.getElementById('mapAmount').value),
    debit:  parseInt(document.getElementById('mapDebit').value),
    credit: parseInt(document.getElementById('mapCredit').value),
    type:   parseInt(document.getElementById('mapType').value)
  };
  toast(t('toast_mapping_updated'), 't-info');
}

function parseCSV(text) {
  // Strip UTF-8 BOM if present (common in Turkish bank CSV exports)
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
  const allLines = text.split(/\r?\n/);
  if (!allLines.length) return null;

  // Auto-detect separator: tab > semicolon > comma
  const sample = allLines.filter(l => l.trim()).slice(0, 10);
  const cnt = (ch) => sample.reduce((s, l) => s + (l.split(ch).length - 1), 0);
  const tabs = cnt('\t'), semis = cnt(';'), comms = cnt(',');
  const sep = tabs >= semis && tabs >= comms ? '\t' : semis >= comms ? ';' : ',';

  const parseRow = (line) => {
    const out = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') inQ = !inQ;
      else if (ch === sep && !inQ) { out.push(cur.trim()); cur = ''; }
      else cur += ch;
    }
    out.push(cur.trim());
    return out;
  };

  const parsed = allLines.map(parseRow);

  // Auto-detect header row: first row with ≥2 finance keywords (skips bank metadata rows)
  const HKEYS = ['tarih', 'date', 'tutar', 'amount', 'açıklama', 'aciklama', 'description',
                 'borç', 'alacak', 'giriş', 'çıkış', 'gelen', 'giden', 'miktar', 'detay', 'işlem'];
  let headerIdx = 0;
  for (let i = 0; i < Math.min(parsed.length, 15); i++) {
    const rowStr = parsed[i].join(' ').toLowerCase();
    if (HKEYS.filter(k => rowStr.includes(k)).length >= 2) { headerIdx = i; break; }
  }

  const headers = parsed[headerIdx];
  const rows = parsed.slice(headerIdx + 1).filter(r => r.some(c => c && c.trim()));
  return { headers, rows };
}

async function parseExcel(file) {
  if (typeof XLSX === 'undefined') { toast(t('toast_excel_lib_missing'), 't-err'); return null; }
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const arr = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });
  if (!arr.length) return null;
  // Auto-detect header row: first row with ≥2 finance keywords (skips bank metadata rows)
  const HKEYS = ['tarih', 'date', 'tutar', 'amount', 'açıklama', 'aciklama', 'description',
                 'borç', 'alacak', 'giriş', 'çıkış', 'gelen', 'giden', 'miktar', 'detay', 'işlem'];
  let headerIdx = 0;
  for (let i = 0; i < Math.min(arr.length, 15); i++) {
    const rowStr = arr[i].map(c => String(c ?? '')).join(' ').toLowerCase();
    if (HKEYS.filter(k => rowStr.includes(k)).length >= 2) { headerIdx = i; break; }
  }
  const rows = arr.slice(headerIdx + 1).filter(r => r.some(c => String(c ?? '').trim()));
  return { headers: arr[headerIdx], rows };
}

async function parsePDFFile(file) {
  if (typeof pdfjsLib === 'undefined') { toast(t('toast_pdf_lib_not_loaded'), 't-err'); return null; }
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const allLines = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const textContent = await page.getTextContent();
    // Group by Y coordinate to reconstruct rows
    const items = textContent.items.map(it => ({
      str: it.str,
      x: it.transform[4],
      y: Math.round(it.transform[5])
    }));
    items.sort((a, b) => b.y - a.y || a.x - b.x);
    const lineMap = {};
    items.forEach(it => {
      if (!lineMap[it.y]) lineMap[it.y] = [];
      lineMap[it.y].push(it.str);
    });
    Object.keys(lineMap).sort((a, b) => Number(b) - Number(a)).forEach(y => {
      const line = lineMap[y].join(' ').trim();
      if (line.length > 5) allLines.push(line);
    });
  }

  if (!allLines.length) return null;

  // ── PAPARA ÖZEL PROFİLİ ─────────────────────────────────────────────
  // Papara PDF'inde pdf.js metni "tarih → (işlem satırı + tutar) → saat"
  // sırasında veriyor; ayrıca "İşlem Tipi" iki satıra bölünebiliyor. Bu yüzden
  // metni TARİH sınırlarıyla bloklara ayırıp her blokta "TRY <tutar> <ücret>
  // <bakiye>" kalıbından ilk sayıyı (işaretli tutar) alıyoruz — okuma
  // sırasından bağımsız ve sağlam. Gider negatif → gelir/gider işaretten gelir.
  const fullText = allLines.join(' ').replace(/\s+/g, ' ');
  const isPapara = /papara\s*elektronik/i.test(fullText) ||
                   (/papara/i.test(fullText) && /mersis/i.test(fullText));
  if (isPapara) {
    const dateRe = /\d{2}\.\d{2}\.\d{4}/;
    const blocks = [];
    let curB = null;
    for (const line of allLines) {
      if (dateRe.test(line)) { if (curB) blocks.push(curB); curB = [line]; }
      else if (curB) curB.push(line);
    }
    if (curB) blocks.push(curB);

    const numP = '-?\\d[\\d.]*(?:,\\d{1,2})?';
    const tryRe = new RegExp('TRY\\s+(' + numP + ')\\s+(' + numP + ')\\s+(' + numP + ')');
    const pRows = [];
    for (const blk of blocks) {
      const text = blk.join(' ').replace(/\s+/g, ' ').trim();
      const dm = text.match(/(\d{2}\.\d{2}\.\d{4})/);
      const tm = text.match(tryRe);
      if (!dm || !tm) continue;                 // başlık/footer blokları elenir
      const pVal = parseExtrAmt(tm[1]);          // tm[1] = işaretli Tutar
      if (!pVal) continue;
      let pDesc = text
        .replace(/\d{2}\.\d{2}\.\d{4}/g, '')
        .replace(/\d{2}:\d{2}:\d{2}/g, '')
        .replace(tm[0], '')                      // "TRY tutar ücret bakiye" bloğu
        .replace(/\bTRY\b/g, '');
      pDesc = pDesc.split(/Papara Elektronik|Mersis No|İşlem Zamanı/)[0]
                   .replace(/\s+/g, ' ').trim().substring(0, 80);
      pRows.push([dm[1], pDesc || 'Papara işlemi', tm[1], pVal >= 0 ? 'Gelir' : 'Gider']);
    }
    if (pRows.length) {
      return { headers: ['Tarih', 'Açıklama', 'Tutar', 'Tür'], rows: pRows, bank: 'Papara' };
    }
    // İmza var ama hiçbir kayıt çözülemedi → genel ayrıştırıcıya düş
  }

  // ── HALKBANK ÖZEL PROFİLİ ────────────────────────────────────────────
  // Halkbank PDF düzeni: "İşlem Tarihi | İşlem Tutarı | Bakiye | Açıklama".
  // Tarih GG-AA-YYYY; tutar işaretli ve hep virgüllü (-39,99 / 1.500,00),
  // açıklama uzun ve satıra bölünebiliyor. Tarihle başlayan satır = yeni işlem.
  // Blok içindeki ilk virgüllü sayı = İşlem Tutarı (kart no/IBAN gibi uzun
  // tamsayılar virgülsüz olduğu için karışmaz), ikinci = bakiye (yok sayılır).
  if (/halkbank/i.test(fullText) || /halk\s*bankas/i.test(fullText)) {
    const startRe = /^\s*\d{2}[.\-\/]\d{2}[.\-\/]\d{4}\b/;
    const dRe = /\d{2}[.\-\/]\d{2}[.\-\/]\d{4}/;
    const hBlocks = [];
    let hCur = null;
    for (const line of allLines) {
      if (startRe.test(line)) { if (hCur) hBlocks.push(hCur); hCur = [line]; }
      else if (hCur) hCur.push(line);
    }
    if (hCur) hBlocks.push(hCur);

    const amtRe = /-?\d[\d.]*,\d{2}/g;        // virgüllü tutar/bakiye
    const hRows = [];
    for (const blk of hBlocks) {
      const text = blk.join(' ').replace(/\s+/g, ' ').trim();
      const dm = text.match(dRe);
      const nums = text.match(amtRe);
      if (!dm || !nums || !nums.length) continue;
      const hVal = parseExtrAmt(nums[0]);      // ilk virgüllü sayı = İşlem Tutarı
      if (!hVal) continue;
      let hDesc = text.replace(dm[0], '').replace(nums[0], '');
      if (nums[1]) hDesc = hDesc.replace(nums[1], '');
      hDesc = hDesc.split(/HESAP ÖZET|Türkiye Halk Bankası|Sayfa No/)[0]
                   .replace(/\s+/g, ' ').trim().substring(0, 80);
      hRows.push([dm[0], hDesc || 'Halkbank işlemi', nums[0], hVal >= 0 ? 'Gelir' : 'Gider']);
    }
    if (hRows.length) {
      return { headers: ['Tarih', 'Açıklama', 'Tutar', 'Tür'], rows: hRows, bank: 'Halkbank' };
    }
  }


  const datePat = /(\d{1,2}[.\/-]\d{1,2}[.\/-]\d{2,4})/;

  // 4 columns so autoDetectColumns can pick up the Tür column for income/expense
  const headers = ['Tarih', 'Açıklama', 'Tutar', 'Tür'];
  const rows = [];

  // ── GENEL YEDEK (tanınmayan banka) — "çok yakın" ─────────────────────
  // Blok-bazlı: tarihle başlayan satır yeni işlem; blok içindeki İLK virgüllü
  // tutar (-?d,dd) işlem tutarı kabul edilir. Virgüllü şartı; tarih, kart no,
  // referans gibi tamsayıları eler (eski "17052026" tipi çöpü engeller).
  // İşaretli tutarda gelir/gider işaretten gelir; tutar yoksa satır atlanır.
  const gStartRe = /^\s*\d{1,2}[.\-\/]\d{1,2}[.\-\/]\d{2,4}\b/;
  const gDateRe  = /\d{1,2}[.\-\/]\d{1,2}[.\-\/]\d{2,4}/;
  const gBlocks = [];
  let gCur = null;
  for (const line of allLines) {
    if (gStartRe.test(line)) { if (gCur) gBlocks.push(gCur); gCur = [line]; }
    else if (gCur) gCur.push(line);
  }
  if (gCur) gBlocks.push(gCur);

  const gAmtRe = /-?\d[\d.]*,\d{2}/g;
  for (const blk of gBlocks) {
    const text = blk.join(' ').replace(/\s+/g, ' ').trim();
    const dm = text.match(gDateRe);
    const nums = text.match(gAmtRe);
    if (!dm || !nums || !nums.length) continue;
    const val = parseExtrAmt(nums[0]);
    if (!val) continue;
    let desc = text.replace(dm[0], '').replace(nums[0], '');
    if (nums[1]) desc = desc.replace(nums[1], '');
    desc = desc.replace(/\b\d{1,2}:\d{2}(:\d{2})?\b/g, '')   // saat damgalarını temizle
               .replace(/\b(TL|TRY)\b|₺/g, '')               // artık para birimi sözcükleri
               .replace(/\s+/g, ' ').trim().substring(0, 80);
    rows.push([dm[0], desc || 'Açıklama yok', nums[0], val >= 0 ? 'Gelir' : 'Gider']);
  }

  if (!rows.length) return null;
  return { headers, rows };
}

async function handleFileUpload(event) {
  const g = guardAction('fileUpload');
  if (!g.ok) { toast(`${g.retrySec}s bekleyin`, 't-err'); event.target.value = ''; return; }

  const file = event.target.files[0];
  if (!file) return;

  // Dosya boyutu — max 5MB
  if (file.size > 5 * 1024 * 1024) {
    toast(t('toast_file_max_5mb'), 't-err');
    event.target.value = '';
    return;
  }

  // Dosya adı uzunluğu güvenliği
  if (file.name.length > 100) {
    toast(t('toast_filename_too_long'), 't-err');
    event.target.value = '';
    return;
  }

  // Dosya türü beyaz liste
  const ext = file.name.split('.').pop().toLowerCase();
  const ALLOWED_EXT = ['csv', 'txt', 'xlsx', 'xls', 'pdf'];
  if (!ALLOWED_EXT.includes(ext)) {
    toast(t('toast_file_types'), 't-err');
    event.target.value = '';
    return;
  }

  // MIME type ek kontrol (taklit edilebilir ama yine de iyi savunma)
  const ALLOWED_MIME = [
    'text/csv', 'application/csv', 'text/plain', 'text/tab-separated-values',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/pdf',
    '' // bazı tarayıcılar CSV/TXT için boş döner
  ];
  if (file.type && !ALLOWED_MIME.includes(file.type)) {
    console.warn('Suspicious MIME type:', file.type);
  }

  toast(t('toast_file_processing'), 't-info');

  let parsed = null;
  try {
    if (ext === 'csv' || ext === 'txt') {
      const text = await file.text();
      parsed = parseCSV(text);
    } else if (ext === 'xlsx' || ext === 'xls') {
      parsed = await parseExcel(file);
    } else if (ext === 'pdf') {
      parsed = await parsePDFFile(file);
    }
  } catch (e) {
    console.error('Parse error:', e);
    toast(t('toast_file_read_error') + e.message, 't-err');
    event.target.value = '';
    return;
  }

  if (!parsed || !parsed.rows?.length) {
    toast(t('toast_no_tx_in_file'), 't-err');
    event.target.value = '';
    return;
  }

  uploadParsed = { ...parsed, fileName: file.name };
  uploadMapping = autoDetectColumns(parsed.headers);
  buildPreviewTable();
  showModal('modalUploadPreview');
  event.target.value = '';
}

function showImportWarn() {
  if (!uploadParsed || !uploadMapping) return toast(t('toast_select_file_first'), 't-err');
  const w = document.getElementById('importWarn');
  if (w) softModalResize(() => { w.style.display = 'block'; });
}
function hideImportWarn() {
  const w = document.getElementById('importWarn');
  if (w && w.style.display !== 'none') softModalResize(() => { w.style.display = 'none'; });
}

function confirmUploadImport() {
  if (!uploadParsed || !uploadMapping) return;
  hideImportWarn();
  const _netBefore = S.transactions.reduce((a, t) => a + (t.type === 'income' ? t.amount : -t.amount), 0);
  const { rows, fileName } = uploadParsed;
  const m = uploadMapping;

  const hasCombined = m.amount >= 0;
  const hasDebit    = m.debit  >= 0;
  const hasCredit   = m.credit >= 0;
  const hasSplit    = hasDebit || hasCredit;
  if (!hasCombined && !hasSplit) return toast(t('toast_pick_amount_col'), 't-err');

  let added = 0;
  let dup = 0;
  // Mükerrer-yükleme koruması: ham satırdan türetilen geri-döndürülemez parmak izi.
  // Etiket genelleştiği için kontrol ham veriden yapılır; saklanan değer okunamaz hash'tir.
  const existingHashes = new Set(S.transactions.map(t => t._sh).filter(Boolean));
  rows.forEach(r => {
    const dateStr = m.date >= 0 ? r[m.date] : '';
    const desc    = m.desc >= 0 ? String(r[m.desc] ?? '').trim() : 'İçe aktarıldı';
    const typeStr = m.type >= 0 ? String(r[m.type] ?? '') : '';

    let amt, type;

    if (hasSplit) {
      // Banks with separate Borç/Alacak or Çıkış/Giriş columns
      const debitAmt  = hasDebit  ? Math.abs(parseExtrAmt(r[m.debit]))  : 0;
      const creditAmt = hasCredit ? Math.abs(parseExtrAmt(r[m.credit])) : 0;

      if (creditAmt > 0 && debitAmt === 0) {
        amt = creditAmt; type = 'income';
      } else if (debitAmt > 0 && creditAmt === 0) {
        amt = debitAmt; type = 'expense';
      } else if (creditAmt > 0 && debitAmt > 0) {
        // Both filled → net
        const net = creditAmt - debitAmt;
        amt = Math.abs(net); type = net >= 0 ? 'income' : 'expense';
      } else if (hasCombined) {
        const n = parseExtrAmt(r[m.amount]);
        if (!n) return;
        amt = Math.abs(n); type = n >= 0 ? 'income' : 'expense';
      } else {
        return;
      }
    } else {
      const n = parseExtrAmt(r[m.amount]);
      if (!n) return;
      amt = Math.abs(n); type = n >= 0 ? 'income' : 'expense';
    }

    if (!amt || amt <= 0) return;

    // Explicit type column overrides sign-based detection
    if (typeStr) {
      const lo = typeStr.toLowerCase();
      if (lo.includes('gel') || lo.includes('alacak') || lo.includes('income') ||
          lo.includes('giriş') || lo.includes('gelen') || lo.includes('tahsilat')) {
        type = 'income';
      } else if (lo.includes('gid') || lo.includes('borç') || lo.includes('expense') ||
                 lo.includes('çıkış') || lo.includes('ödeme') || lo.includes('harcama')) {
        type = 'expense';
      }
    }

    // Parse date
    let date = todayStr();
    if (dateStr) {
      const ds = String(dateStr).trim();
      const m2 = ds.match(/(\d{4})-(\d{2})-(\d{2})/);
      const m1 = ds.match(/(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})/);
      if (m2) date = `${m2[1]}-${m2[2]}-${m2[3]}`;
      else if (m1) {
        let y = m1[3]; if (y.length === 2) y = '20' + y;
        date = `${y}-${m1[2].padStart(2,'0')}-${m1[1].padStart(2,'0')}`;
      }
    }

    const finalDate = validateDate(date);
    // Parmak izi HAM açıklamadan hesaplanır (yalnızca bellekte; asla saklanmaz)
    const sh = hashStr(`${finalDate}|${type}|${amt.toFixed(2)}|${String(desc || '').trim().toLowerCase().replace(/\s+/g, ' ')}`);
    if (existingHashes.has(sh)) { dup++; return; }   // mükerrer kayıt → atla
    existingHashes.add(sh);
    S.transactions.push({
      id: uid(), type,
      desc: cleanTxLabel(desc, type),               // açıklama SAKLANMAZ; temiz tür etiketi saklanır
      amount: amt,
      category: 'Diğer',
      date: finalDate,
      note: 'Ekstreden',
      ts: Date.now(),
      _sh: sh
    });
    added++;
  });

  if (S.baseBalanceSet) {
    const _netAfter = S.transactions.reduce((a, t) => a + (t.type === 'income' ? t.amount : -t.amount), 0);
    S.baseBalance -= (_netAfter - _netBefore);
  }
  S.uploads.push({ date: todayStr(), file: fileName.substring(0, 60), count: added });
  save();
  closeModal();
  uploadParsed = null;
  uploadMapping = null;
  const unreadable = Math.max(0, rows.length - added - dup);
  if (added > 0) {
    const extra = [];
    if (dup > 0) extra.push(`${dup} mükerrer atlandı`);
    if (unreadable > 0) extra.push(`${unreadable} satır okunamadı`);
    toast(`${added} işlem eklendi${extra.length ? ' · ' + extra.join(' · ') : ''}`, 't-ok');
  } else if (dup > 0) {
    toast(`Bu ekstre zaten yüklenmiş · ${dup} mükerrer işlem atlandı`, 't-info');
  } else {
    toast(t('toast_no_tx_read'), 't-err');
  }
  if (added > 0) notify('general', 'Ekstre içe aktarıldı', `${added} işlem eklendi.`);
  renderAll();
}

function renderUploadHistory() {
  const c = document.getElementById('uploadHistory');
  if (!c) return;
  if (!S.uploads.length) {
    c.innerHTML = '<div class="empty-state">' + t('empty_not_uploaded') + '</div>';
    return;
  }
  c.innerHTML = S.uploads.slice(-10).reverse().map(u => `
    <div class="planner-item">
      <div>
        <div class="planner-item-title"> ${sanitize(u.file)}</div>
        <div class="planner-item-meta">${u.date} · ${u.count} işlem eklendi</div>
      </div>
    </div>
  `).join('');
}

/* ═══ 22. EXPORT ═══ */

function dl(content, name, type = 'text/plain') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 200);
}

function exportCSV() {
  const g = guardAction('exportData');
  if (!g.ok) return toast(`${g.retrySec}s bekleyin`, 't-err');
  if (!S.transactions.length) return toast(t('toast_no_tx'), 't-err');
  const rows = [['Tarih','Tür','Açıklama','Tutar','Kategori','Not']];
  S.transactions.forEach(t => {
    rows.push([
      t.date,
      t.type === 'income' ? 'Gelir' : 'Gider',
      redactPII(String(t.desc || '')),
      t.amount,
      t.category,
      redactPII(String(t.note || ''))
    ]);
  });
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  dl('\ufeff' + csv, `cuzzy-${todayStr()}.csv`, 'text/csv;charset=utf-8');
  toast(t('toast_csv_downloaded'), 't-ok');
}

function exportJSON() {
  const g = guardAction('exportData');
  if (!g.ok) return toast(`${g.retrySec}s bekleyin`, 't-err');
  // KVKK: dışa aktarmadan ÖNCE açıklama/not/dosya-adı alanlarındaki kişisel verileri
  // maskele. Ekstre/içe-aktarma sistemine dokunulmaz; yalnızca çıkış güvenli hale gelir.
  const safeState = JSON.parse(JSON.stringify(S));
  if (Array.isArray(safeState.transactions)) {
    safeState.transactions.forEach(t => {
      if (t.desc) t.desc = redactPII(String(t.desc));
      if (t.note) t.note = redactPII(String(t.note));
    });
  }
  if (Array.isArray(safeState.uploads)) {
    safeState.uploads.forEach(u => { if (u.file) u.file = redactPII(String(u.file)); });
  }
  const data = {
    version: '3.0',
    exportDate: new Date().toISOString(),
    user: currentUser?.email || '',
    state: safeState
  };
  dl(JSON.stringify(data, null, 2), `cuzzy-yedek-${todayStr()}.json`, 'application/json');
  toast(t('toast_json_downloaded'), 't-ok');
}

function exportPDF() {
  const g = guardAction('exportData');
  if (!g.ok) return toast(`${g.retrySec}s bekleyin`, 't-err');
  if (typeof window.jspdf === 'undefined') { toast(t('toast_pdf_lib_missing'), 't-err'); return; }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Türkçe karakter düzeltme — jsPDF default fontu Türkçe karakterleri eksik gösterir
  // Çözüm: ASCII'ye çevir
  const tr = s => String(s)
    .replace(/ş/g, 's').replace(/Ş/g, 'S')
    .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
    .replace(/ü/g, 'u').replace(/Ü/g, 'U')
    .replace(/ç/g, 'c').replace(/Ç/g, 'C')
    .replace(/ı/g, 'i').replace(/İ/g, 'I')
    .replace(/ö/g, 'o').replace(/Ö/g, 'O');

  doc.setFontSize(20);
  doc.text('CUZZY - Finansal Rapor', 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Olusturma: ${new Date().toLocaleDateString(localeCode())} ${new Date().toLocaleTimeString(localeCode(), {hour:'2-digit', minute:'2-digit'})}`, 14, 25);
  doc.text(`Kullanici: ${tr(S.profile.name)}`, 14, 30);

  // Özet
  doc.setFontSize(13);
  doc.setTextColor(0);
  doc.text('Ozet', 14, 42);
  const totalInc = S.transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExp = S.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const monthInc = getCurrentMonthIncome();
  const monthExp = getCurrentMonthExpense();

  doc.setFontSize(10);
  doc.text(`Toplam Gelir: ${tr(fmt(totalInc))}`, 14, 50);
  doc.text(`Toplam Gider: ${tr(fmt(totalExp))}`, 14, 56);
  doc.text(`Net Bakiye: ${tr(fmt(totalInc - totalExp))}`, 14, 62);
  doc.text(`Bu Ay Gelir: ${tr(fmt(monthInc))}`, 110, 50);
  doc.text(`Bu Ay Gider: ${tr(fmt(monthExp))}`, 110, 56);
  doc.text(`Bu Ay Net: ${tr(fmt(monthInc - monthExp))}`, 110, 62);

  // İşlem tablosu
  doc.setFontSize(13);
  doc.text('Son Islemler', 14, 76);
  let y = 84;

  doc.setFontSize(9);
  doc.setFillColor(220, 220, 220);
  doc.rect(14, y - 5, 182, 7, 'F');
  doc.setTextColor(0);
  doc.text('Tarih', 16, y);
  doc.text('Tur', 42, y);
  doc.text('Aciklama', 60, y);
  doc.text('Kategori', 130, y);
  doc.text('Tutar', 175, y);
  y += 7;

  const sorted = [...S.transactions].sort((a, b) => b.ts - a.ts).slice(0, 80);
  sorted.forEach(t => {
    if (y > 280) { doc.addPage(); y = 20; }
    doc.setTextColor(0);
    doc.text(t.date, 16, y);
    doc.setTextColor(t.type === 'income' ? 30 : 200, t.type === 'income' ? 150 : 50, t.type === 'income' ? 80 : 50);
    doc.text(t.type === 'income' ? 'Gelir' : 'Gider', 42, y);
    doc.setTextColor(0);
    doc.text(tr(redactPII(String(t.desc))).substring(0, 35), 60, y);
    doc.text(tr(String(t.category)).substring(0, 18), 130, y);
    doc.text(tr(fmt(t.amount)), 175, y);
    y += 6;
  });

  // Hedefler
  if (S.goals.length) {
    if (y > 250) { doc.addPage(); y = 20; }
    y += 6;
    doc.setFontSize(13);
    doc.text('Hedefler', 14, y);
    y += 8;
    doc.setFontSize(9);
    S.goals.forEach(g => {
      if (y > 280) { doc.addPage(); y = 20; }
      const pct = Math.min(100, Math.round((g.current / g.target) * 100));
      doc.text(`${tr(String(g.name))}: ${tr(fmt(g.current))} / ${tr(fmt(g.target))} (%${pct})`, 14, y);
      y += 6;
    });
  }

  doc.save(`cuzzy-rapor-${todayStr()}.pdf`);
  toast(t('toast_pdf_downloaded'), 't-ok');
}