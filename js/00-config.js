if (typeof pdfjsLib !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
}

/* Android performans modu: backdrop-filter (blur) Android Chrome'da çok pahalı.
   Android'de <html>'e 'reduce-fx' sınıfı eklenir; components.css'teki mobil
   medya sorgusu (max-width:760px) İÇİNDE bu sınıf altında blur kapatılır —
   masaüstü genişliğinde (UA ne derse desin) hiçbir etkisi yoktur. */
(function () {
  try {
    var isAndroid = /Android/i.test(navigator.userAgent || '');
    if (isAndroid) document.documentElement.classList.add('reduce-fx');
  } catch (e) {}
})();