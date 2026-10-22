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

/* =========================================================
   Fotografias: visualizador em ecrã inteiro (lightbox)
   Funciona com qualquer lista marcada com data-gallery cujos links
   tenham data-lightbox. Sem JavaScript, o link abre a imagem grande.
   ========================================================= */
(function () {
  if (!window.HTMLDialogElement) return;
  var en = (document.documentElement.lang || '').indexOf('en') === 0;
  var T = en
    ? { close: 'Close', prev: 'Previous photo', next: 'Next photo', of: ' of ' }
    : { close: 'Fechar', prev: 'Fotografia anterior', next: 'Fotografia seguinte', of: ' de ' };
  var dlg, img, cap, list = [], idx = 0;

  function build() {
    dlg = document.createElement('dialog');
    dlg.className = 'lb';
    dlg.setAttribute('aria-label', en ? 'Photo viewer' : 'Visualizador de fotografias');
    dlg.innerHTML =
      '<img alt="">' +
      '<p class="lb-caption" aria-live="polite"></p>' +
      '<button type="button" class="lb-prev" aria-label="' + T.prev + '">←</button>' +
      '<button type="button" class="lb-next" aria-label="' + T.next + '">→</button>' +
      '<button type="button" class="lb-close" aria-label="' + T.close + '">✕</button>';
    document.body.appendChild(dlg);
    img = dlg.querySelector('img');
    cap = dlg.querySelector('.lb-caption');
    dlg.querySelector('.lb-prev').addEventListener('click', function () { show(idx - 1); });
    dlg.querySelector('.lb-next').addEventListener('click', function () { show(idx + 1); });
    dlg.querySelector('.lb-close').addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
    dlg.addEventListener('close', function () { document.documentElement.style.overflow = ''; });
    var x0 = null;
    dlg.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    dlg.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
      x0 = null;
    }, { passive: true });
  }

  function preload(i) {
    var a = list[(i + list.length) % list.length];
    if (a) { var p = new Image(); p.src = a.href; }
  }

  function show(i) {
    idx = (i + list.length) % list.length;
    var a = list[idx], thumb = a.querySelector('img');
    img.src = a.href;
    img.width = Number(a.dataset.w) || 0;
    img.height = Number(a.dataset.h) || 0;
    img.alt = thumb ? thumb.alt : '';
    cap.textContent = (img.alt ? img.alt + ' · ' : '') + (idx + 1) + T.of + list.length;
    preload(idx + 1); preload(idx - 1);
  }

  document.querySelectorAll('[data-gallery]').forEach(function (g) {
    var links = Array.prototype.slice.call(g.querySelectorAll('a[data-lightbox]'));
    links.forEach(function (a, i) {
      a.addEventListener('click', function (e) {
        if (e.ctrlKey || e.metaKey || e.shiftKey) return;   // abrir em novo separador
        e.preventDefault();
        if (!dlg) build();
        list = links;
        show(i);
        document.documentElement.style.overflow = 'hidden';
        dlg.showModal();
        if (window.goatcounter && window.goatcounter.count) {
          window.goatcounter.count({ path: 'foto-ampliar', title: 'Fotografia ampliada', event: true });
        }
      });
    });
  });
})();

/* =========================================================
   Vídeo do Vimeo: o leitor (pesado) só carrega ao carregar no play.
   dnt=1 pede ao Vimeo para não usar cookies de seguimento.
   ========================================================= */
(function () {
  document.querySelectorAll('.video[data-vimeo]').forEach(function (box) {
    var btn = box.querySelector('.video-play');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var f = document.createElement('iframe');
      f.src = 'https://player.vimeo.com/video/' + box.dataset.vimeo +
              '?autoplay=1&dnt=1&title=0&byline=0&portrait=0';
      f.title = box.dataset.title || 'Vimeo';
      f.allow = 'autoplay; fullscreen; picture-in-picture';
      f.allowFullscreen = true;
      box.replaceChildren(f);
    });
  });
})();
