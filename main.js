/* =========================================================
   Voz dos Sabores · movimento discreto
   - formas orgânicas entram quando a secção aparece no ecrã
   - paralaxe leve (8–16 px) só nas secções visíveis
   - galeria do Instagram com botões anterior/seguinte
   Respeita "reduzir movimento": as formas ficam fixas.
   ========================================================= */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var watched = document.querySelectorAll('.hero, section.wrap, .reveal');

  // 1. Entrada ao aparecer no ecrã
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in-view', 'was-seen'); }
        else { e.target.classList.remove('in-view'); }
      });
    }, { threshold: 0.12 });
    watched.forEach(function (el) { io.observe(el); });
  } else {
    watched.forEach(function (el) { el.classList.add('in-view'); });
  }

  // 2. Paralaxe leve (só posição, só secções visíveis)
  if (!reduce) {
    var decos = Array.prototype.slice.call(document.querySelectorAll('.deco'));
    var ticking = false;
    var update = function () {
      var vh = window.innerHeight;
      decos.forEach(function (d) {
        var host = d.parentElement;
        if (!host.classList.contains('in-view')) return;
        var r = host.getBoundingClientRect();
        var p = (r.top + r.height / 2 - vh / 2) / vh;       // -1 … 1
        var py = Math.max(-16, Math.min(16, -p * 14));
        d.style.setProperty('--py', py.toFixed(1) + 'px');
      });
      ticking = false;
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  // 3. Menu: marca a secção atual
  var links = {};
  document.querySelectorAll('.topnav ul a').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
  if ('IntersectionObserver' in window) {
    var navIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var a = links[e.target.id];
        if (!a) return;
        if (e.isIntersecting) {
          Object.keys(links).forEach(function (k) { links[k].removeAttribute('aria-current'); });
          a.setAttribute('aria-current', 'true');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(links).forEach(function (id) {
      var s = document.getElementById(id);
      if (s) navIO.observe(s);
    });
  }

  // 4. Galeria: botões anterior / seguinte
  document.querySelectorAll('.gallery').forEach(function (g) {
    var strip = g.querySelector('.strip');
    var prev = g.querySelector('[data-dir="-1"]');
    var next = g.querySelector('[data-dir="1"]');
    if (!strip || !prev || !next) return;
    var sync = function () {
      prev.disabled = strip.scrollLeft < 8;
      next.disabled = strip.scrollLeft + strip.clientWidth > strip.scrollWidth - 8;
    };
    [prev, next].forEach(function (b) {
      b.addEventListener('click', function () {
        strip.scrollBy({ left: Number(b.dataset.dir) * strip.clientWidth * 0.8, behavior: reduce ? 'auto' : 'smooth' });
      });
    });
    strip.addEventListener('scroll', function () { requestAnimationFrame(sync); }, { passive: true });
    window.addEventListener('resize', sync);
    sync();
  });
})();
