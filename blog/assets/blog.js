/* Kinet blog — shared page JS
   1) Reading progress bar (articles only; element optional)
   2) TOC scrollspy (anchors inside #toc, targets are h2[id] in the article)
   NOTE: one shared scroll listener + one rAF — separate listeners sharing a
   `ticking` flag starve each other (the second sees ticked=true and skips). */
(function () {
  'use strict';

  /* ---- theme menu: Light / Sepia / Dark / System (key 'phinn-theme' shared with the main site) ---- */
  var root = document.documentElement;
  var tbtn = document.getElementById('theme-btn');
  var THEMES = [
    { id: 'light', label: 'Light',  svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>' },
    { id: 'sepia', label: 'Sepia',  svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4a2 2 0 0 0-2-2H6.5A2.5 2.5 0 0 0 4 4.5v15z"/></svg>' },
    { id: 'dark',  label: 'Dark',   svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>' },
    { id: 'auto',  label: 'System', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg>' }
  ];
  var menu = null;
  function storedTheme() { try { return localStorage.getItem('phinn-theme') || 'light'; } catch (e) { return 'light'; } }
  function saveTheme(t) { try { localStorage.setItem('phinn-theme', t); } catch (e) {} }
  function resolveTheme(t) { return t === 'auto' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : t; }
  function applyTheme(t) {
    var r = resolveTheme(t);
    if (r === 'dark') root.setAttribute('data-theme', 'dark');
    else if (r === 'sepia') root.setAttribute('data-theme', 'sepia');
    else root.removeAttribute('data-theme');
    syncMenu(t);
  }
  function syncMenu(current) {
    if (!menu) return;
    var opts = menu.querySelectorAll('.tm-opt');
    for (var i = 0; i < opts.length; i++) {
      var on = opts[i].getAttribute('data-t') === current;
      opts[i].classList.toggle('on', on);
      opts[i].querySelector('.tm-check').textContent = on ? '\u2713' : '';
    }
  }
  function ensureWrap() {
    if (!tbtn.parentNode.className || tbtn.parentNode.className.indexOf('theme-anchor') === -1) {
      var w = document.createElement('span');
      w.className = 'theme-anchor';
      tbtn.parentNode.insertBefore(w, tbtn);
      w.appendChild(tbtn);
    }
    return tbtn.parentNode;
  }
  function buildMenu() {
    menu = document.createElement('div');
    menu.className = 'theme-menu';
    menu.setAttribute('role', 'menu');
    THEMES.forEach(function (th) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'tm-opt';
      b.setAttribute('data-t', th.id); b.setAttribute('role', 'menuitem');
      b.innerHTML = th.svg + '<span>' + th.label + '</span><span class="tm-check"></span>';
      b.addEventListener('click', function () {
        var t = this.getAttribute('data-t');
        saveTheme(t); applyTheme(t); closeMenu();
      });
      menu.appendChild(b);
    });
  }
  function onDocClick(e) {
    if (menu && !menu.contains(e.target) && !tbtn.contains(e.target)) closeMenu();
  }
  function openMenu() {
    if (!menu) buildMenu();
    syncMenu(storedTheme());
    ensureWrap().appendChild(menu);
    tbtn.setAttribute('aria-expanded', 'true');
    setTimeout(function () { document.addEventListener('click', onDocClick, true); }, 0);
  }
  function closeMenu() {
    if (menu && menu.parentNode) menu.parentNode.removeChild(menu);
    if (tbtn) tbtn.setAttribute('aria-expanded', 'false');
    document.removeEventListener('click', onDocClick, true);
  }
  applyTheme(storedTheme());
  if (tbtn) {
    tbtn.addEventListener('click', function () {
      if (menu && menu.parentNode) closeMenu(); else openMenu();
    });
  }
  var mq = window.matchMedia('(prefers-color-scheme: dark)');
  var mqHandler = function () { if (storedTheme() === 'auto') applyTheme('auto'); };
  if (mq.addEventListener) mq.addEventListener('change', mqHandler);
  else if (mq.addListener) mq.addListener(mqHandler);
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
