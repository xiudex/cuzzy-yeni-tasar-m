(function () {
  function initFinJump() {
    var jump = document.getElementById('finJump');
    if (!jump) return;
    jump.querySelectorAll('.fin-jump-item[data-target]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var el = document.getElementById(btn.dataset.target);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
    var items = [].slice.call(jump.querySelectorAll('.fin-jump-item[data-target]'));
    function spy() {
      var fin = document.getElementById('page-finans');
      if (!fin || !fin.classList.contains('active')) return;
      var activeId = items[0] ? items[0].dataset.target : null;
      items.forEach(function (btn) {
        var el = document.getElementById(btn.dataset.target);
        if (el && el.getBoundingClientRect().top - 160 <= 0) activeId = btn.dataset.target;
      });
      items.forEach(function (btn) { btn.classList.toggle('active', btn.dataset.target === activeId); });
    }
    window.addEventListener('scroll', spy, { passive: true });
    window.addEventListener('resize', spy, { passive: true });
    spy();
  }
  if (document.readyState !== 'loading') initFinJump();
  else document.addEventListener('DOMContentLoaded', initFinJump);
})();