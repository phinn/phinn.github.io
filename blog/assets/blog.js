/* Kinet blog — shared page JS
   1) Reading progress bar (articles only; element optional)
   2) TOC scrollspy (anchors inside #toc, targets are h2[id] in .p-body) */
(function () {
  'use strict';
  var bar = document.querySelector('.progress');
  var ticking = false;
  function updBar() {
    ticking = false;
    if (!bar) return;
    var d = document.documentElement;
    var max = d.scrollHeight - d.clientHeight;
    var p = max > 0 ? Math.min(100, (d.scrollTop || document.body.scrollTop) / max * 100) : 0;
    bar.style.width = p + '%';
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(updBar); }
  }, { passive: true });
  updBar();

  // TOC scrollspy: highlight the heading closest above viewport top
  var links = document.querySelectorAll('#toc a[href^="#"]');
  if (links.length) {
    var map = [];
    links.forEach(function (a) {
      var id = a.getAttribute('href').slice(1);
      var h = document.getElementById(id);
      if (h) map.push([h, a]);
    });
    function updSpy() {
      var y = window.scrollY + 120, cur = null;
      for (var i = 0; i < map.length; i++) if (map[i][0].offsetTop <= y) cur = map[i][1];
      links.forEach(function (a) { a.classList.toggle('on', a === cur); });
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(function () { updBar(); updSpy(); }); }
    }, { passive: true });
    updSpy();
  }

  var y = document.getElementById('y');
  if (y) y.textContent = new Date().getFullYear();
})();
