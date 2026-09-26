/* ═══ 23. ACCOUNT OPS ═══ */

function passwordStrengthError(pw) {
  if (!pw || typeof pw !== 'string') return 'Şifre boş olamaz';
  if (pw.length < 8) return 'En az 8 karakter olmalı';
  if (pw.length > 200) return 'Şifre çok uzun (max 200)';

  const hasLower = /[a-zçğıöşüа-я]/.test(pw);
  const hasUpper = /[A-ZÇĞİÖŞÜА-Я]/.test(pw);
  const hasDigit = /[0-9]/.test(pw);
  const hasSpecial = /[^A-Za-z0-9]/.test(pw);

  // En az 3 farklı karakter sınıfı kullansın
  const classCount = [hasLower, hasUpper, hasDigit, hasSpecial].filter(Boolean).length;
  if (classCount < 3) return 'En az 3 farklı tip karakter (büyük/küçük harf, rakam, sembol) kullanın';

  // Yaygın zayıf kalıplar
  const weak = ['12345678', 'qwerty', 'password', 'sifre123', '123456789', 'abcdefgh', '1234abcd'];
  const lo = pw.toLowerCase();
  for (const w of weak) {
    if (lo.includes(w)) return 'Şifre çok yaygın bir kalıp içeriyor';
  }

  // Aynı karakter ardışık tekrarı (5+ kere)
  if (/(.)\1{4,}/.test(pw)) return 'Aynı karakter çok fazla tekrar ediyor';

  return null;
}

async function changePassword() {
  const g = guardAction('changePassword');
  if (!g.ok) return toast(`${g.retrySec}s bekleyin`, 't-err');

  const old = document.getElementById('cpOld').value;
  const ny = document.getElementById('cpNew').value;
  const ny2 = document.getElementById('cpNew2').value;

  if (!old) return toast(t('toast_enter_current_pw'), 't-err');
  if (ny !== ny2) return toast(t('toast_passwords_mismatch'), 't-err');
  if (ny === old) return toast(t('toast_new_pw_same'), 't-err');

  const pwErr = passwordStrengthError(ny);
  if (pwErr) return toast(pwErr, 't-err');

  try {
    const cred = firebase.auth.EmailAuthProvider.credential(currentUser.email, old);
    await currentUser.reauthenticateWithCredential(cred);
    await currentUser.updatePassword(ny);
    closeModal();
    document.getElementById('cpOld').value = '';
    document.getElementById('cpNew').value = '';
    document.getElementById('cpNew2').value = '';
    toast(t('toast_password_changed'), 't-ok');
  } catch (e) {
    if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') toast(t('toast_current_pw_wrong'), 't-err');
    else if (e.code === 'auth/weak-password') toast(t('toast_password_weak'), 't-err');
    else if (e.code === 'auth/too-many-requests') toast(t('toast_too_many_attempts'), 't-err');
    else if (e.code === 'auth/requires-recent-login') toast(t('toast_relogin_required'), 't-err');
    else toast(t('common_error_prefix') + (e.code || 'bilinmiyor'), 't-err');
  }
}

async function changeEmail() {
  const g = guardAction('changeEmail');
  if (!g.ok) return toast(`${g.retrySec}s bekleyin`, 't-err');
  if (!currentUser) return toast(t('toast_session_not_found'), 't-err');
  const newEmail = (document.getElementById('ceEmail').value || '').trim().toLowerCase();
  const pass = document.getElementById('cePass').value;
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(newEmail)) return toast(t('toast_valid_email'), 't-err');
  if (newEmail === (currentUser.email || '').toLowerCase()) return toast(t('toast_already_current_email'), 't-err');
  if (!pass) return toast(t('toast_enter_current_pw'), 't-err');
  try {
    const cred = firebase.auth.EmailAuthProvider.credential(currentUser.email, pass);
    await currentUser.reauthenticateWithCredential(cred);
    await currentUser.verifyBeforeUpdateEmail(newEmail);
    closeModal();
    document.getElementById('ceEmail').value = '';
    document.getElementById('cePass').value = '';
    toast(t('toast_verify_link_sent_new'), 't-ok');
  } catch (e) {
    if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') toast(t('toast_current_pw_wrong'), 't-err');
    else if (e.code === 'auth/email-already-in-use') toast(t('toast_email_in_use'), 't-err');
    else if (e.code === 'auth/invalid-email') toast(t('toast_invalid_email'), 't-err');
    else if (e.code === 'auth/requires-recent-login') toast(t('toast_relogin_retry'), 't-err');
    else if (e.code === 'auth/too-many-requests') toast(t('toast_too_many_attempts'), 't-err');
    else toast(t('common_error_prefix') + (e.code || 'bilinmiyor'), 't-err');
  }
}

async function deleteAccount() {
  const g = guardAction('deleteAccount');
  if (!g.ok) return toast(`${g.retrySec}s bekleyin`, 't-err');

  const p = document.getElementById('delPass').value;
  if (!p) return toast(t('toast_enter_password2'), 't-err');

  showConfirm({
    title: t('confirm_del_account_title'),
    msg: t('confirm_del_account_msg'),
    danger: true,
    onOk: async () => {
      try {
        const cred = firebase.auth.EmailAuthProvider.credential(currentUser.email, p);
        await currentUser.reauthenticateWithCredential(cred);
        await db.collection('users').doc(currentUser.uid).delete().catch(() => {});
        await db.collection('verificationCodes').doc(currentUser.uid).delete().catch(() => {});
        await currentUser.delete();
        toast(t('toast_account_deleted'), 't-ok');
        setTimeout(() => window.location.replace('index.html'), 1000);
      } catch (e) {
        toast(t('common_error_prefix') + (e.code || e.message), 't-err');
      }
    }
  });
}

function clearAllData() {
  const g = guardAction('clearAll');
  if (!g.ok) return toast(`${g.retrySec}s bekleyin`, 't-err');
  showConfirm({
    title: t('confirm_del_alldata_title'),
    msg: t('confirm_del_alldata_msg'),
    danger: true,
    onOk: () => {
      S.transactions = [];
      S.recurring = [];
      S.goals = [];
      S.investments = [];
      S.debts = [];
      S.subscriptions = [];
      S.notes = [];
      S.uploads = [];
      save();
      renderAll();
      toast(t('toast_all_data_deleted'), 't-ok');
    }
  });
}


/* ═════════════════════════════════════════════════════════════════ */

/* ═══ DESTEK / İLETİŞİM ═══ */
// EmailJS destek template ID — EmailJS dashboard'ından oluşturulacak
// Template parametreleri: from_name, reply_to, category, subject_line, message_body
// To Email (template'de sabit): cuzzyapp@gmail.com
const EMAILJS_SUPPORT_TPL = 'template_support'; // <-- kendi template ID'nle değiştir

let _supportCat = 'Hata Bildirimi';

function selectSupportCat(btn) {
  _supportCat = btn.dataset.cat;
  document.querySelectorAll('.support-cat-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function updateSupportChar(inputId, charId, max) {
  const len = document.getElementById(inputId)?.value.length || 0;
  const el = document.getElementById(charId);
  if (el) el.textContent = `${len} / ${max}`;
}

async function sendSupportEmail() {
  const subject = document.getElementById('supportSubject')?.value.trim();
  const message = document.getElementById('supportMessage')?.value.trim();
  if (!subject) return toast(t('toast_subject_required'), 't-err');
  if (!message || message.length < 10) return toast(t('toast_desc_min10'), 't-err');

  const btn = document.getElementById('supportSendBtn');
  btn.disabled = true;
  btn.textContent = 'Gönderiliyor…';

  const params = {
    from_name: S.profile?.name || 'Cüzzy Kullanıcısı',
    reply_to: currentUser?.email || 'bilinmiyor',
    category: _supportCat,
    subject_line: subject,
    message_body: message,
    // Mevcut template alanlarına map et
    to_email: 'cuzzyapp@gmail.com',
    to_name: 'Cüzzy Destek',
    email: 'cuzzyapp@gmail.com',
    email_subject: `[Cüzzy Destek] ${_supportCat}: ${subject}`,
    email_message: `Gönderen: ${S.profile?.name || 'Kullanıcı'} (${currentUser?.email || '?'})\nKategori: ${_supportCat}\nKonu: ${subject}\n\n${message}`
  };

  try {
    if (typeof emailjs === 'undefined') throw new Error('emailjs_missing');
    await emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateId, params);
    toast(t('toast_message_sent'), 't-ok');
    closeModal();
    document.getElementById('supportSubject').value = '';
    document.getElementById('supportMessage').value = '';
    document.getElementById('supportSubjectChar').textContent = '0 / 80';
    document.getElementById('supportMessageChar').textContent = '0 / 800';
    document.querySelectorAll('.support-cat-btn').forEach((b, i) => b.classList.toggle('active', i === 0));
    _supportCat = 'Hata Bildirimi';
  } catch {
    // EmailJS template hazır değilse mailto fallback
    const body = encodeURIComponent(
      `Kategori: ${_supportCat}\nKonu: ${subject}\n\nAçıklama:\n${message}\n\n---\nGönderen: ${params.from_name} (${params.reply_to})`
    );
    const mailtoLink = `mailto:cuzzyapp@gmail.com?subject=${encodeURIComponent(`[Cüzzy] ${_supportCat}: ${subject}`)}&body=${body}`;
    window.open(mailtoLink, '_blank');
    toast(t('toast_opening_mail'), 't-info');
    closeModal();
  } finally {
    btn.disabled = false;
    btn.textContent = 'Gönder';
  }
}

/* ═══ MEMNUNİYET ANKETİ ═══ */
const SURVEY_QUESTIONS = [
  { id: 'genel',      get text() { return t('survey_q_general'); } },
  { id: 'guncelleme', get text() { return t('survey_q_update'); } },
  { id: 'tavsiye',    get text() { return t('survey_q_recommend'); } }
];
let _surveyIdx = 0;
let _surveyAnswers = {};

function openSurvey() {
  _surveyIdx = 0;
  _surveyAnswers = {};
  SURVEY_QUESTIONS.forEach(q => { _surveyAnswers[q.id] = { rating: null, text: '' }; });
  showModal('modalSurvey');
  renderSurveyStep();
}

function _surveySaveCurrent() {
  const q = SURVEY_QUESTIONS[_surveyIdx];
  if (!q) return;
  const txt = document.getElementById('surveyText');
  if (txt) _surveyAnswers[q.id].text = txt.value;
}

function renderSurveyStep() {
  const q = SURVEY_QUESTIONS[_surveyIdx];
  const total = SURVEY_QUESTIONS.length;
  const prog = document.getElementById('surveyProgress');
  const qtext = document.getElementById('surveyQText');
  if (prog) prog.textContent = t('survey_progress').replace('{n}', _surveyIdx + 1).replace('{total}', total);
  if (qtext) qtext.textContent = q.text;

  const rc = document.getElementById('surveyRating');
  if (rc) {
    rc.innerHTML = '';
    const sel = _surveyAnswers[q.id].rating;
    for (let i = 1; i <= 10; i++) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = i;
      if (sel === i) b.classList.add('sel');
      b.onclick = () => surveySetRating(i);
      rc.appendChild(b);
    }
  }
  const txt = document.getElementById('surveyText');
  if (txt) txt.value = _surveyAnswers[q.id].text || '';

  const prev = document.getElementById('surveyPrev');
  const next = document.getElementById('surveyNext');
  if (prev) prev.style.visibility = _surveyIdx === 0 ? 'hidden' : 'visible';
  if (next) next.textContent = _surveyIdx === total - 1 ? 'Gönder' : 'İleri →';
}

function surveySetRating(n) {
  const q = SURVEY_QUESTIONS[_surveyIdx];
  _surveyAnswers[q.id].rating = n;
  const rc = document.getElementById('surveyRating');
  if (rc) [...rc.children].forEach((b, idx) => b.classList.toggle('sel', idx + 1 === n));
}

function surveyPrev() {
  _surveySaveCurrent();
  if (_surveyIdx > 0) { _surveyIdx--; renderSurveyStep(); }
}

function surveyNext() {
  _surveySaveCurrent();
  const _q = SURVEY_QUESTIONS[_surveyIdx];
  if (_q && _surveyAnswers[_q.id].rating == null) {
    return toast(t('toast_pick_score'), 't-err');
  }
  if (_surveyIdx < SURVEY_QUESTIONS.length - 1) { _surveyIdx++; renderSurveyStep(); }
  else submitSurvey();
}

async function submitSurvey() {
  _surveySaveCurrent();
  const answered = SURVEY_QUESTIONS.some(q =>
    _surveyAnswers[q.id].rating != null || (_surveyAnswers[q.id].text || '').trim());
  if (!answered) return toast(t('toast_answer_one'), 't-err');

  const btn = document.getElementById('surveyNext');
  const prevTxt = btn ? btn.textContent : '';
  if (btn) { btn.disabled = true; btn.textContent = 'Gönderiliyor…'; }

  const lines = [];
  lines.push('CÜZZY MEMNUNİYET ANKETİ');
  lines.push('Gönderen: ' + (S.profile?.name || 'Kullanıcı') + ' (' + (currentUser?.email || '?') + ')');
  lines.push('Tarih: ' + new Date().toLocaleString('tr-TR'));
  lines.push('');
  SURVEY_QUESTIONS.forEach((q, i) => {
    const a = _surveyAnswers[q.id];
    lines.push((i + 1) + '. ' + q.text);
    lines.push('   Puan: ' + (a.rating != null ? a.rating + '/10' : '—'));
    lines.push('   Yorum: ' + ((a.text || '').trim() || '—'));
    lines.push('');
  });
  const body = lines.join('\n');

  const params = {
    from_name: S.profile?.name || 'Cüzzy Kullanıcısı',
    reply_to: currentUser?.email || 'bilinmiyor',
    category: 'Memnuniyet Anketi',
    subject_line: 'Memnuniyet Anketi',
    message_body: body,
    to_email: 'cuzzyapp@gmail.com',
    to_name: 'Cüzzy Destek',
    email: 'cuzzyapp@gmail.com',
    email_subject: '[Cüzzy Anket] Memnuniyet Anketi',
    email_message: body
  };

  try {
    if (typeof emailjs === 'undefined') throw new Error('emailjs_missing');
    await emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateId, params);
    S.surveyCompleted = true;
    S.surveyVersion = 'v3.8.2';
    save();
    const _sb = document.getElementById('surveyNavBtn');
    if (_sb) _sb.style.display = 'none';
    toast(t('toast_survey_sent'), 't-ok');
    closeModal();
  } catch {
    const mailtoLink = 'mailto:cuzzyapp@gmail.com?subject=' +
      encodeURIComponent('[Cüzzy Anket] Memnuniyet Anketi') + '&body=' + encodeURIComponent(body);
    window.open(mailtoLink, '_blank');
    toast(t('toast_opening_mail'), 't-info');
    closeModal();
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = prevTxt; }
  }
}

/* ═══ EVRENSEL ONAY MODALI ═══ */
let _confirmCallback = null;
function showConfirm({ title = 'Emin misin?', msg = '', danger = false, onOk }) {
  _confirmCallback = onOk || null;
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmMsg').textContent = msg;
  const btn = document.getElementById('confirmOkBtn');
  btn.className = danger ? 'btn btn-danger' : 'btn btn-primary';
  btn.textContent = danger ? 'Evet, sil' : 'Onayla';
  document.getElementById('modalConfirm').classList.add('show');
  try { haptic(danger ? 'warning' : 'tap'); } catch (e) {}
}
function _confirmOk() {
  document.getElementById('modalConfirm').classList.remove('show');
  if (_confirmCallback) { const cb = _confirmCallback; _confirmCallback = null; cb(); }
}
function _confirmCancel() {
  _confirmCallback = null;
  document.getElementById('modalConfirm').classList.remove('show');
}

/* ═══ 24b. WHAT'S NEW POPUP ═══ */
/* ═══ KVKK / GİZLİLİK ═══ */
const KVKK_VERSION = '1.1';
const KVKK_EFFECTIVE_DATE = 'Haziran 2026';
const KVKK_TITLE = 'Cüzzy — KVKK Aydınlatma Metni ve Gizlilik Politikası';

// METNİ GÜNCELLERKEN: değişen bölüme `changedIn: '<yeni sürüm>'` ekle ve KVKK_VERSION'ı
// o sürüme yükselt. Önceki sürümü onaylamış kullanıcılar açılışta "Güncellendi" uyarısı
// görür, değişen bölümler altı çizili/vurgulu işaretlenir ve yeniden onay istenir.
// Örn: { h: '3. ...', changedIn: '1.1', p: [ ... ] }
const KVKK_SECTIONS = [
  { h: 'Giriş', p: [
    `Bu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında, Cüzzy ("Uygulama") üzerinden işlenen kişisel verilerinize ilişkin olarak sizi bilgilendirmek amacıyla hazırlanmıştır. Uygulamayı kullanarak bu metinde açıklanan veri işleme faaliyetlerini okuduğunuzu ve anladığınızı kabul edersiniz.`
  ]},
  { h: '1. Veri Sorumlusu', p: [
    `Kişisel verileriniz, veri sorumlusu sıfatıyla [Veri Sorumlusu Unvanı / Ad Soyad] tarafından işlenmektedir.`,
    `İletişim: [E-posta adresi] · [Açık adres] · [varsa KEP adresi]`
  ]},
  { h: '2. İşlenen Kişisel Veriler', changedIn: '1.1', p: [
    `Kimlik ve iletişim verisi: Hesap oluştururken sağladığınız e-posta adresiniz ve görünen adınız.`,
    `Finansal veriler: Uygulamaya girdiğiniz gelir/gider işlemleri, kategoriler, bütçe ve tasarruf hedefleri, tekrarlayan ödemeler, abonelikler, borç kayıtları ile yatırım/portföy bilgileriniz.`,
    `Banka ekstresi verileri: İsteğe bağlı olarak yüklediğiniz ekstre dosyalarından yalnızca işlem tarihi, işlem tutarı ve kişisel veri içermeyen genel bir işlem türü etiketi (örneğin "Giden FAST", "Maaş", "Alışveriş") alınır. İşlem açıklamaları, üçüncü kişilere ait IBAN, isim gibi veriler içerebileceğinden alınmaz ve saklanmaz.`,
    `Teknik veriler: Oturum yönetimi ve güvenlik amacıyla kimlik doğrulama sağlayıcısı tarafından işlenen oturum, cihaz ve bağlantı bilgileri.`
  ]},
  { h: '3. Banka Ekstrelerinin İşlenmesi', changedIn: '1.1', p: [
    `Yüklediğiniz banka ekstresi dosyaları (PDF/metin) yalnızca kendi tarayıcınızda, yani kendi cihazınızda çözümlenir. Ham ekstre dosyası hiçbir şekilde sunucularımıza gönderilmez, tarafımızca saklanmaz ve bu işleme dair herhangi bir kayıt (log) tutulmaz.`,
    `İşlem açıklamaları bilinçli olarak alınmaz; bunun yerine yalnızca tarih, tutar ve kişisel veri içermeyen bir işlem türü etiketi hesabınıza kaydedilir. Böylece ekstrede yer alabilecek üçüncü kişilere ait isim, IBAN, telefon veya referans numarası gibi veriler hiçbir zaman saklanmaz.`,
    `Aynı ekstrenin yanlışlıkla iki kez yüklenmesini önlemek için, işleme ait geri döndürülemez teknik bir parmak izi (tek yönlü bir özet değeri) saklanabilir; bu değer okunabilir kişisel veri içermez ve içinden açıklama, isim veya IBAN geri elde edilemez.`
  ]},
  { h: '4. Kişisel Verilerin İşlenme Amaçları', p: [
    `Kişisel verileriniz; hesabınızın oluşturulması ve yönetilmesi, kişisel finans takibi hizmetinin sunulması, verilerinizin cihazlarınız arasında senkronize edilmesi, hizmet güvenliğinin sağlanması, yasal yükümlülüklerin yerine getirilmesi ve hizmetin iyileştirilmesi amaçlarıyla işlenir.`
  ]},
  { h: '5. İşlemenin Hukuki Sebepleri', p: [
    `Kişisel verileriniz KVKK m.5 uyarınca; sizinle kurulan hizmet ilişkisinin (sözleşmenin) ifası için gerekli olması, hizmet güvenliği gibi meşru menfaatlerimiz, hukuki yükümlülüklerimizin yerine getirilmesi ve gerekli hallerde açık rızanız hukuki sebeplerine dayanılarak işlenir.`
  ]},
  { h: '6. Kişisel Verilerin Aktarılması', p: [
    `Verileriniz, hizmetin sunulabilmesi için kullandığımız altyapı sağlayıcılarıyla paylaşılabilir. Kimlik doğrulama ve veri saklama için Google Firebase (Firebase Authentication, Cloud Firestore) hizmetleri kullanılmaktadır.`,
    `Yatırım takibi özelliğinde, seçtiğiniz borsa sembollerinin güncel fiyatları üçüncü taraf finansal veri kaynaklarından sorgulanır; bu sorgularda kimliğinizi belirleyen herhangi bir bilgi paylaşılmaz.`,
    `Uygulamada reklam gösterilmesi halinde, reklam sağlayıcıları kendi gizlilik politikaları çerçevesinde teknik verileri işleyebilir.`
  ]},
  { h: '7. Yurt Dışına Aktarım', p: [
    `Kullanılan bulut altyapı sağlayıcılarının (Google Firebase) sunucuları yurt dışında bulunabilir. Bu nedenle kişisel verileriniz, KVKK m.9 kapsamında gerekli şartların sağlanması ve gerekli hallerde açık rızanıza dayanılarak yurt dışına aktarılabilir.`
  ]},
  { h: '8. Saklama Süresi', p: [
    `Kişisel verileriniz, hesabınız aktif olduğu sürece ve ilgili mevzuatta öngörülen süreler boyunca saklanır. Hesabınızı veya verilerinizi sildiğinizde, ilgili kayıtlar makul süre içinde sistemlerden silinir.`
  ]},
  { h: '9. Veri Güvenliği', p: [
    `Verileriniz, yetkilendirme kuralları aracılığıyla yalnızca kendi hesabınızdan erişilebilecek şekilde yapılandırılmıştır. Tüm veri iletişimi şifreli bağlantı (HTTPS) üzerinden gerçekleştirilir ve yetkisiz erişimi önlemek için makul teknik ve idari tedbirler uygulanır.`
  ]},
  { h: '10. Çerezler ve Yerel Depolama', p: [
    `Oturumunuzun sürdürülmesi ve tercihlerinizin (tema, görünüm vb.) hatırlanması için tarayıcınızın yerel depolama alanı ve kimlik doğrulama çerezleri kullanılır. Bu veriler hizmetin çalışması için gereklidir.`
  ]},
  { h: '11. Reşit Olmayanlar', p: [
    `Uygulama 18 yaşından küçük kullanıcılara yönelik değildir. Bir kullanıcının 18 yaşından küçük olduğunun tespiti halinde ilgili hesap ve veriler silinebilir.`
  ]},
  { h: '12. Veri Sahibi Olarak Haklarınız (KVKK m.11)', p: [
    `KVKK m.11 uyarınca aşağıdaki haklara sahipsiniz:`,
    `• Kişisel verilerinizin işlenip işlenmediğini öğrenme,`,
    `• İşlenmişse buna ilişkin bilgi talep etme,`,
    `• İşlenme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenme,`,
    `• Yurt içinde veya yurt dışında verilerin aktarıldığı üçüncü kişileri bilme,`,
    `• Eksik veya yanlış işlenmiş verilerin düzeltilmesini isteme,`,
    `• Verilerinizin silinmesini veya yok edilmesini isteme,`,
    `• Düzeltme, silme veya yok etme işlemlerinin aktarıldığı üçüncü kişilere bildirilmesini isteme,`,
    `• İşlenen verilerin analizi sonucu aleyhinize bir sonuç çıkmasına itiraz etme,`,
    `• Hukuka aykırı işleme nedeniyle zarara uğramanız halinde zararın giderilmesini talep etme.`
  ]},
  { h: '13. Başvuru Yöntemi', p: [
    `Yukarıdaki haklarınıza ilişkin taleplerinizi [E-posta adresi] üzerinden veya [Açık adres] adresine yazılı olarak iletebilirsiniz. Talepleriniz, KVKK'da öngörülen süreler içinde sonuçlandırılır. Verilerinizin önemli bir kısmına Uygulama içindeki "Ayarlar → Veri" bölümünden doğrudan erişebilir, bunları dışa aktarabilir veya silebilirsiniz.`
  ]},
  { h: '14. Değişiklikler', p: [
    `Bu metin zaman zaman güncellenebilir. Önemli bir değişiklik olması halinde, Uygulamayı kullanmaya devam etmeden önce güncel metni yeniden onaylamanız istenebilir.`
  ]}
];

/* Sürüm karşılaştırma: cmpVer('1.2','1.1') → 1, eşit → 0, küçük → -1 */
function cmpVer(a, b) {
  const pa = String(a || '0').split('.').map(n => parseInt(n, 10) || 0);
  const pb = String(b || '0').split('.').map(n => parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d !== 0) return d > 0 ? 1 : -1;
  }
  return 0;
}

/* priorVersion verilirse (güncelleme akışı), changedIn'i kullanıcının onayladığı
   sürümden YENİ olan bölümler "Güncellendi" rozeti + vurgu + altı çizili gösterilir.
   İlk onayda priorVersion boş bırakılır → hiçbir vurgu olmaz. */
function kvkkHtml(priorVersion) {
  return KVKK_SECTIONS.map(s => {
    const changed = priorVersion && s.changedIn && cmpVer(s.changedIn, priorVersion) > 0;
    const badge = changed ? ' <span class="kvkk-badge">Güncellendi</span>' : '';
    return `<div class="kvkk-sec${changed ? ' kvkk-changed' : ''}"><h4 class="kvkk-h">${s.h}${badge}</h4>` +
           s.p.map(par => `<p class="kvkk-p">${par}</p>`).join('') + `</div>`;
  }).join('');
}
function _kvkkStrip(s) { const d = document.createElement('div'); d.innerHTML = s; return d.textContent || ''; }
function kvkkPlainText() {
  const out = [KVKK_TITLE, '', `Yürürlük: ${KVKK_EFFECTIVE_DATE}  ·  Sürüm: ${KVKK_VERSION}`, ''];
  KVKK_SECTIONS.forEach(s => {
    out.push(s.h);
    s.p.forEach(par => out.push(_kvkkStrip(par)));
    out.push('');
  });
  return out.join('\n');
}
function downloadKvkk() {
  dl('\uFEFF' + kvkkPlainText(), 'Cuzzy-KVKK-Aydinlatma-Metni.txt', 'text/plain;charset=utf-8');
}

function renderKvkkSettings() {
  const c = document.getElementById('kvkkSettingsBody');
  if (c && !c.dataset.filled) { c.innerHTML = kvkkHtml(); c.dataset.filled = '1'; }
}

// ── ZORUNLU KVKK ONAY KAPISI ────────────────────────────────────────
let _kvkkOnAccept = null;
let _kvkkScrolled = false;

function showKvkkGate(onAccept) {
  _kvkkOnAccept = (typeof onAccept === 'function') ? onAccept : null;
  _kvkkScrolled = false;
  // Daha önce eski bir sürümü onaylamışsa → güncelleme akışı (değişen bölümler vurgulanır)
  const prior = S.kvkkConsent;
  const isUpdate = !!prior && prior !== KVKK_VERSION;
  const body = document.getElementById('kvkkGateText');
  if (body) body.innerHTML = kvkkHtml(isUpdate ? prior : null);
  const titleEl = document.getElementById('kvkkGateTitle');
  const subEl = document.getElementById('kvkkGateSub');
  const banner = document.getElementById('kvkkUpdateBanner');
  if (titleEl) titleEl.textContent = isUpdate ? ' KVKK Metni Güncellendi' : ' KVKK Aydınlatma Metni';
  if (subEl) subEl.textContent = isUpdate
    ? 'Aydınlatma metnimiz güncellendi. Değişen bölümler aşağıda işaretlendi; lütfen gözden geçirip yeniden onaylayın.'
    : 'Devam etmeden önce lütfen aşağıdaki metni okuyun. Metni sonuna kadar kaydırınca onay kutusu etkinleşir.';
  if (banner) banner.style.display = isUpdate ? 'block' : 'none';
  const cb = document.getElementById('kvkkGateCheck');
  const btn = document.getElementById('kvkkGateBtn');
  const hint = document.getElementById('kvkkScrollHint');
  if (cb) { cb.checked = false; cb.disabled = true; }
  if (btn) btn.disabled = true;
  if (hint) hint.style.display = '';
  const ov = document.getElementById('kvkkGateOverlay');
  if (ov) ov.classList.add('show');
  const scroller = document.getElementById('kvkkGateScroll');
  if (scroller) {
    scroller.scrollTop = 0;
    const onScroll = () => {
      // Sonuna ~24px kala "okundu" say → onay kutusunu aç
      if (scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 24) {
        _kvkkScrolled = true;
        if (cb) cb.disabled = false;
        if (hint) hint.style.display = 'none';
        scroller.onscroll = null;
      }
    };
    scroller.onscroll = onScroll;
    // İçerik kısa olup kaydırma çubuğu hiç çıkmazsa da okunmuş kabul et
    setTimeout(() => { if (scroller.scrollHeight <= scroller.clientHeight + 8) onScroll(); }, 150);
  }
}

function kvkkCheckToggle() {
  const cb = document.getElementById('kvkkGateCheck');
  const btn = document.getElementById('kvkkGateBtn');
  if (btn) btn.disabled = !(_kvkkScrolled && cb && cb.checked);
}

function acceptKvkk() {
  const cb = document.getElementById('kvkkGateCheck');
  if (!_kvkkScrolled || !cb || !cb.checked) return; // okumadan/onaylamadan geçiş yok
  S.kvkkConsent = KVKK_VERSION;
  save();
  const ov = document.getElementById('kvkkGateOverlay');
  if (ov) ov.classList.remove('show');
  const fn = _kvkkOnAccept; _kvkkOnAccept = null;
  if (fn) setTimeout(fn, 250);
}

/* ═══ ÇOKLU İŞLEM GİRİŞİ ═══ */
const MULTI_CATS = ['Diğer', 'Market', 'Fatura', 'Kira', 'Ulaşım', 'Yemek', 'Sağlık', 'Eğlence', 'Eğitim', 'Maaş', 'Yatırım', 'EFT - Para Gönderimi', 'EFT - Para Alımı'];
let _multiRowSeq = 0;

const MULTI_CAT_KEYS = { 'Diğer': 'cat_other', 'Market': 'cat_market', 'Fatura': 'cat_bill', 'Kira': 'cat_rent', 'Ulaşım': 'cat_transport', 'Yemek': 'cat_food', 'Sağlık': 'cat_health', 'Eğlence': 'cat_entertainment', 'Eğitim': 'cat_education', 'Maaş': 'cat_salary', 'Yatırım': 'cat_investment', 'EFT - Para Gönderimi': 'cat_eft_send', 'EFT - Para Alımı': 'cat_eft_receive' };
function _multiRowHTML(rid) {
  const opts = MULTI_CATS.map(c => `<option value="${c}"${c === 'Market' ? ' selected' : ''}>${t(MULTI_CAT_KEYS[c])}</option>`).join('');
  return `<div class="multi-row" id="mrow-${rid}" data-type="">
    <div class="mrow-main">
      <div class="mr-type-wrap">
        <button type="button" class="mr-type-opt expense" onclick="mrPickType('${rid}','expense', event)">${t('common_expense_btn')}</button>
        <button type="button" class="mr-type-opt income" onclick="mrPickType('${rid}','income', event)">${t('common_income_btn')}</button>
      </div>
      <input class="mr-amt" inputmode="decimal" placeholder="0,00" oninput="formatWhileTyping(this)">
      <button type="button" class="mr-expand" id="mr-exp-${rid}" onclick="mrToggleExpand('${rid}')" aria-label="Notu göster"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg></button>
      <button type="button" class="mr-del" onclick="removeMultiRow('${rid}')" title="Satırı sil">✕</button>
    </div>
    <div class="mrow-pair">
      <select class="mr-cat">${opts}</select>
      <input class="mr-date" type="date" value="${todayStr()}">
    </div>
    <div class="mrow-extra" id="mrow-extra-${rid}">
      <input class="mr-desc" placeholder="${t('mtx_desc_ph')}">
    </div>
  </div>`;
}

function addMultiRow() {
  const wrap = document.getElementById('multiTxRows');
  if (!wrap) return;
  const rid = 'r' + (++_multiRowSeq);
  wrap.insertAdjacentHTML('beforeend', _multiRowHTML(rid));
}

function removeMultiRow(rid) {
  const el = document.getElementById('mrow-' + rid);
  if (el) el.remove();
}

function mrSetType(rid, type) {
  const row = document.getElementById('mrow-' + rid);
  if (!row) return;
  row.dataset.type = type === 'income' ? 'income' : 'expense';
  row.querySelectorAll('.mr-type-opt').forEach(b => b.classList.toggle('is-on', b.classList.contains(row.dataset.type)));
}
function mrPickType(rid, type, e) {
  if (e) e.stopPropagation();
  mrSetType(rid, type);
}

function mrToggleExpand(rid) {
  const extra = document.getElementById('mrow-extra-' + rid);
  const btn = document.getElementById('mr-exp-' + rid);
  if (!extra) return;
  const open = extra.classList.toggle('open');
  if (btn) btn.classList.toggle('open', open);
}

function openMultiTx() {
  const wrap = document.getElementById('multiTxRows');
  if (wrap) {
    wrap.innerHTML = '';
    _multiRowSeq = 0;
    for (let i = 0; i < (typeof isMobileView === "function" && isMobileView() ? 1 : 3); i++) addMultiRow();
    // Son satırda Enter → yeni satır aç ve odaklan
    wrap.onkeydown = (e) => {
      if (e.key !== 'Enter') return;
      if (!e.target.classList || (!e.target.classList.contains('mr-amt') && !e.target.classList.contains('mr-desc'))) return;
      const rowsNow = wrap.querySelectorAll('.multi-row');
      const last = rowsNow[rowsNow.length - 1];
      if (last && last.contains(e.target)) {
        e.preventDefault();
        addMultiRow();
        const nr = wrap.querySelector('.multi-row:last-child .mr-amt');
        if (nr) nr.focus();
      }
    };
  }
  showModal('modalMultiTx');
}

function commitMultiTx() {
  const rows = Array.from(document.querySelectorAll('#multiTxRows .multi-row'));
  let added = 0, dup = 0, invalid = 0;
  const _txSig = (t) => `${t.date}|${t.type}|${Number(t.amount).toFixed(2)}|${String(t.desc || '').trim().toLowerCase().replace(/\s+/g, ' ')}`;
  const sigs = new Set(S.transactions.map(_txSig));

  rows.forEach(row => {
    const amtRaw = (row.querySelector('.mr-amt').value || '').trim();
    const descRaw = (row.querySelector('.mr-desc').value || '').trim();
    if (!amtRaw && !descRaw) return;
    const amt = validateAmount(amtRaw);
    if (!amt) { invalid++; return; }
    if (row.dataset.type !== 'income' && row.dataset.type !== 'expense') { invalid++; return; }
    const type = row.dataset.type === 'income' ? 'income' : 'expense';
    const cat = row.querySelector('.mr-cat').value || 'Diğer';
    const dateEl = row.querySelector('.mr-date');
    const dateVal = (dateEl && dateEl.value) || todayStr();
    const txObj = {
      id: uid(), type,
      desc: validateString(redactPII(descRaw), 50) || cat,
      amount: amt,
      category: cat,
      date: validateDate(dateVal),
      note: 'Çoklu giriş',
      ts: Date.now()
    };
    const sig = _txSig(txObj);
    if (sigs.has(sig)) { dup++; return; }
    S.transactions.push(txObj);
    added++;
  });

  if (added === 0 && dup === 0 && invalid === 0) { toast(t('toast_no_tx_to_add'), 't-err'); return; }

  if (added > 0) {
    save();
    closeModal();
    renderAll();
    notify('general', 'Çoklu işlem eklendi', `${added} işlem eklendi.`);
    const extra = [];
    if (dup > 0) extra.push(`${dup} mükerrer atlandı`);
    if (invalid > 0) extra.push(`${invalid} geçersiz satır`);
    toast(`${added} işlem eklendi${extra.length ? ' · ' + extra.join(' · ') : ''}`, 't-ok');
  } else {
    const extra = [];
    if (dup > 0) extra.push(`${dup} mükerrer`);
    if (invalid > 0) extra.push(`${invalid} geçersiz`);
    toast(`İşlem eklenmedi · ${extra.join(' · ')}`, 't-info');
  }
}

const WN_VERSION = '4.0';
const WN_SLIDE_COUNT = 4;
let wnCurrent = 0;

function showWhatsNew() {
  if (S.whatsNewSeen === WN_VERSION) return;
  wnCurrent = 0;
  _wnRenderDots();
  _wnGoto(0);
  document.getElementById('wnOverlay').classList.add('show');
}

function closeWhatsNew() {
  S.whatsNewSeen = WN_VERSION;
  save();
  document.getElementById('wnOverlay').classList.remove('show');
}

// ── BETA BİLGİLENDİRME ──────────────────────────────────────────────
let _betaOnClose = null;
function showBetaNotice(onClose) {
  _betaOnClose = (typeof onClose === 'function') ? onClose : null;
  // "Bir daha gösterme" işaretlenmişse hiç gösterme, varsa devam akışını çalıştır
  if (S.hideBetaNotice) { const fn = _betaOnClose; _betaOnClose = null; if (fn) fn(); return; }
  const cb = document.getElementById('betaDontShow');
  if (cb) cb.checked = false;
  const ov = document.getElementById('betaOverlay');
  if (ov) ov.classList.add('show');
}
function _betaPersistIfChecked() {
  const cb = document.getElementById('betaDontShow');
  if (cb && cb.checked) { S.hideBetaNotice = true; save(); }
}
function closeBetaNotice() {
  _betaPersistIfChecked();
  const ov = document.getElementById('betaOverlay');
  if (ov) ov.classList.remove('show');
  const fn = _betaOnClose; _betaOnClose = null;
  if (fn) setTimeout(fn, 250);   // kapandıktan sonra tur/yenilikler (varsa)
}
function betaGoSupport() {
  _betaPersistIfChecked();
  _betaOnClose = null;           // destek açılıyor; tur/yenilikleri tetikleme
  const ov = document.getElementById('betaOverlay');
  if (ov) ov.classList.remove('show');
  openSettings('destek');
}

function nextWhatsNew() {
  if (wnCurrent < WN_SLIDE_COUNT - 1) {
    _wnGoto(wnCurrent + 1);
  } else {
    closeWhatsNew();
  }
}

function _wnGoto(idx) {
  wnCurrent = idx;
  document.getElementById('wnTrack').style.transform = `translateX(-${idx * 100}%)`;
  _wnRenderDots();
  const btn = document.getElementById('wnNext');
  const skip = document.getElementById('wnSkip');
  if (btn) btn.textContent = idx === WN_SLIDE_COUNT - 1 ? 'Kapat' : 'Devam →';
  if (skip) skip.style.visibility = idx === WN_SLIDE_COUNT - 1 ? 'hidden' : 'visible';
}

function _wnRenderDots() {
  const el = document.getElementById('wnDots');
  if (!el) return;
  el.innerHTML = Array.from({ length: WN_SLIDE_COUNT }, (_, i) =>
    `<div class="wn-dot${i === wnCurrent ? ' active' : ''}" onclick="_wnGoto(${i})" style="cursor:pointer"></div>`
  ).join('');
}