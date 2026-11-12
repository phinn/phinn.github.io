/* Kinet blog — shared page JS
   1) Reading progress bar (articles only; element optional)
   2) TOC scrollspy (anchors inside #toc, targets are h2[id] in the article)
   NOTE: one shared scroll listener + one rAF — separate listeners sharing a
   `ticking` flag starve each other (the second sees ticked=true and skips). */
(function () {
  'use strict';

  /* ---- theme toggle (opt-in dark; key 'phinn-theme' shared with the main site) ---- */
  var root = document.documentElement;
  var tbtn = document.getElementById('theme-btn');
  function applyTheme(t) {
    if (t === 'dark') root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');
  }
  var tsaved = null;
  try { tsaved = localStorage.getItem('phinn-theme'); } catch (e) {}
  applyTheme(tsaved === 'dark' ? 'dark' : 'light');
  if (tbtn) {
    if (tsaved === 'dark') tbtn.setAttribute('aria-pressed', 'true');
    tbtn.addEventListener('click', function () {
      var dark = root.getAttribute('data-theme') === 'dark';
      var next = dark ? 'light' : 'dark';
      applyTheme(next);
      tbtn.setAttribute('aria-pressed', dark ? 'false' : 'true');
      try { localStorage.setItem('phinn-theme', next); } catch (e) {}
    });
  }
  var bar = document.querySelector('.progress');
  var links = document.querySelectorAll('#toc a[href^="#"]');
  var map = [];
  links.forEach(function (a) {
    var id = a.getAttribute('href').slice(1);
    var h = document.getElementById(id);
    if (h) map.push([h, a]);
  });
  var ticking = false;

  function docTop(el) {
    // getBoundingClientRect is viewport-relative and always correct,
    // unlike offsetTop (relative to the nearest positioned ancestor).
    return el.getBoundingClientRect().top + window.scrollY;
  }

  function frame() {
    ticking = false;
    var d = document.documentElement;
    var max = d.scrollHeight - d.clientHeight;
    if (bar) {
      var y = window.scrollY || document.body.scrollTop;
      bar.style.width = (max > 0 ? Math.min(100, y / max * 100) : 0) + '%';
    }
    if (map.length) {
      var line = (window.scrollY || 0) + 120, cur = null;
      for (var i = 0; i < map.length; i++) {
        if (docTop(map[i][0]) <= line) cur = map[i][1];
      }
      links.forEach(function (a) { a.classList.toggle('on', a === cur); });
    }
  }

  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(frame); }
  }, { passive: true });
  window.addEventListener('resize', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(frame); }
  }, { passive: true });
  frame();

  var y = document.getElementById('y');
  if (y) y.textContent = new Date().getFullYear();
})();
