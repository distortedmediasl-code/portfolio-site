/* ============================================================
   enhance.js — portfolio enrichment layer
   Mohamed Aashiq · Creative Multimedia Designer

   Runs alongside the .dc.html component runtime. Everything here
   is additive and defensive: it observes the DOM for content the
   runtime renders asynchronously (sc-for galleries) and attaches
   behaviour by delegation, so nothing breaks if markup changes.

   Modules
     1. preloader        brand mark + real asset progress
     2. film grain       fixed animated noise plate
     3. custom cursor    dot + ring, "VIEW" state over images
     4. lightbox         full-screen gallery viewer w/ keyboard, swipe, zoom
     5. back to top      appears past one viewport
     6. skip link        keyboard bypass to main content
   Respects prefers-reduced-motion throughout.
   ============================================================ */
(function () {
  'use strict';

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  // The mobile nav hides its links behind a menu button this script builds,
  // so the CSS that hides them waits for this flag.
  document.documentElement.classList.add('e-js');
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function el(tag, attrs, html) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (html != null) n.innerHTML = html;
    return n;
  }

  /* Scroll to an absolute Y. Smooth reads well over a screen or two, but the
     collateral gallery is ~80,000px tall — animating that far just wastes the
     visitor's time, so long hops jump instantly.
     Note: must be 'instant', not 'auto'. The page sets html{scroll-behavior:smooth},
     and 'auto' defers to that CSS value rather than jumping. */
  function scrollToY(y) {
    var far = Math.abs(y - window.scrollY) > window.innerHeight * 3;
    window.scrollTo({ top: Math.max(0, y), behavior: (REDUCED || far) ? 'instant' : 'smooth' });
  }

  /* Bring a child into view HORIZONTALLY inside its own scroller.
     scrollIntoView() would also scroll every ancestor — including the page —
     which, called from a scroll handler, fights the user and traps the page. */
  function scrollXInto(box, child) {
    if (!box || !child) return;
    var b = box.getBoundingClientRect(), c = child.getBoundingClientRect();
    var target = box.scrollLeft + (c.left - b.left) - (b.width - c.width) / 2;
    var max = box.scrollWidth - box.clientWidth;
    box.scrollLeft = Math.max(0, Math.min(max, target));
  }

  /* Y position of an element, offset clear of the fixed nav (+ extra chrome). */
  function topOf(target, extra) {
    var nav = document.querySelector('nav');
    var off = (nav ? nav.getBoundingClientRect().height : 63) + 8 + (extra || 0);
    return target.getBoundingClientRect().top + window.scrollY - off;
  }

  /* =========================================================
     1. PRELOADER
     ========================================================= */
  function preloader() {
    if (sessionStorage.getItem('e-seen') === '1') return;

    var wrap = el('div', { id: 'e-preload' });
    var mark = el('div', { class: 'e-pl-mark' });
    'AASHIQ'.split('').forEach(function (c, i) {
      var s = el('span', { style: 'animation-delay:' + (i * 55) + 'ms' }, c);
      mark.appendChild(s);
    });
    mark.appendChild(el('span', { class: 'e-pl-dot', style: 'animation-delay:340ms' }, '.'));

    /* No progress bar: the page can't know its own load progress, so any
       percentage shown here would be invented. The wordmark alone covers
       the async render. */
    wrap.appendChild(mark);
    document.body.appendChild(wrap);
    var done = false;
    function finish() {
      if (done) return;
      done = true;
      sessionStorage.setItem('e-seen', '1');
      setTimeout(function () {
        wrap.classList.add('done');
        setTimeout(function () { wrap.remove(); }, 800);
      }, 260);
    }
    if (document.readyState === 'complete') setTimeout(finish, 400);
    else window.addEventListener('load', function () { setTimeout(finish, 350); });
    setTimeout(finish, 4500); // hard ceiling — never trap the visitor
  }

  /* =========================================================
     2. FILM GRAIN
     ========================================================= */
  function grain() {
    if (document.getElementById('e-grain')) return;
    document.body.appendChild(el('div', { id: 'e-grain', 'aria-hidden': 'true' }));
  }

  /* =========================================================
     3. CUSTOM CURSOR
     ========================================================= */
  function cursor() {
    if (!FINE || REDUCED) return;

    var dot = el('div', { id: 'e-cur', 'aria-hidden': 'true' });
    var ring = el('div', { id: 'e-cur-ring', 'aria-hidden': 'true', 'data-label': 'VIEW' });
    document.body.appendChild(dot);
    document.body.appendChild(ring);
    document.documentElement.classList.add('e-cursor-on');

    var mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my, raf;

    // Runs only while the ring is still catching up, instead of every frame
    // forever — a still mouse should cost nothing.
    function loop() {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      dot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';
      ring.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0)';
      raf = (Math.abs(mx - rx) + Math.abs(my - ry) > 0.3) ? requestAnimationFrame(loop) : 0;
    }
    loop();

    var HOT = 'a,button,[role="button"],[tabindex]:not([tabindex="-1"]),input,select,textarea,video';
    document.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      if (!raf) raf = requestAnimationFrame(loop);
      var t = e.target;
      var view = t.closest && t.closest('figure[data-lb], #e-lb .e-lb-img');
      var hot = t.closest && t.closest(HOT);
      document.documentElement.classList.toggle('e-view', !!view);
      document.documentElement.classList.toggle('e-hot', !view && !!hot);
    }, { passive: true });

    document.addEventListener('mousedown', function () { document.documentElement.classList.add('e-down'); });
    document.addEventListener('mouseup', function () { document.documentElement.classList.remove('e-down'); });
    document.addEventListener('mouseleave', function () { dot.style.opacity = ring.style.opacity = '0'; });
    document.addEventListener('mouseenter', function () { dot.style.opacity = ring.style.opacity = ''; });
    window.addEventListener('blur', function () { if (raf) cancelAnimationFrame(raf); raf = null; });
    window.addEventListener('focus', function () { if (!raf) loop(); });
  }

  /* =========================================================
     4. LIGHTBOX
     ========================================================= */
  var LB = {
    items: [],   // [{src, caption, group}]
    i: 0,
    root: null,
    lastFocus: null,

    build: function () {
      if (this.root) return;
      var r = el('div', {
        id: 'e-lb', role: 'dialog', 'aria-modal': 'true',
        'aria-label': 'Image viewer', tabindex: '-1'
      });
      r.innerHTML =
        '<div class="e-lb-top">' +
          '<div class="e-lb-cap"></div>' +
          '<div class="e-lb-tools">' +
            '<button class="e-btn e-lb-zoom" type="button" aria-label="Toggle actual size">' +
              '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="20" y1="20" x2="16.7" y2="16.7"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>' +
            '</button>' +
            '<a class="e-btn e-lb-open" target="_blank" rel="noopener noreferrer" aria-label="Open image in a new tab">' +
              '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>' +
            '</a>' +
            '<button class="e-btn e-lb-close" type="button" aria-label="Close viewer (Esc)">' +
              '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
            '</button>' +
          '</div>' +
        '</div>' +
        '<button class="e-btn e-lb-prev" type="button" aria-label="Previous image">' +
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>' +
        '</button>' +
        '<button class="e-btn e-lb-next" type="button" aria-label="Next image">' +
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>' +
        '</button>' +
        '<div class="e-lb-stage"><img class="e-lb-img" alt=""></div>' +
        '<div class="e-lb-strip"></div>' +
        '<div class="e-lb-bot">' +
          '<div class="e-lb-count"></div>' +
          '<div class="e-lb-line"><span></span></div>' +
          '<div class="e-lb-hint"><kbd>←</kbd> <kbd>→</kbd> browse &nbsp;·&nbsp; <kbd>Z</kbd> zoom &nbsp;·&nbsp; <kbd>T</kbd> thumbs &nbsp;·&nbsp; <kbd>Esc</kbd> close</div>' +
        '</div>';
      document.body.appendChild(r);
      this.root = r;

      var self = this;
      $('.e-lb-close', r).addEventListener('click', function () { self.close(); });
      $('.e-lb-prev', r).addEventListener('click', function () { self.go(-1); });
      $('.e-lb-next', r).addEventListener('click', function () { self.go(1); });
      $('.e-lb-zoom', r).addEventListener('click', function () { self.zoom(); });
      $('.e-lb-img', r).addEventListener('click', function (e) { self.zoom(e); });
      r.addEventListener('click', function (e) { if (e.target === r || e.target.classList.contains('e-lb-stage')) self.close(); });

      // touch swipe
      var x0 = null, y0 = null;
      r.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
      r.addEventListener('touchend', function (e) {
        if (x0 == null || r.classList.contains('zoomed')) return;
        var dx = e.changedTouches[0].clientX - x0;
        var dy = e.changedTouches[0].clientY - y0;
        if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)) self.go(dx < 0 ? 1 : -1);
        x0 = y0 = null;
      }, { passive: true });
    },

    open: function (items, index) {
      this.build();
      this.items = items;
      this.i = index;
      this.lastFocus = document.activeElement;
      this.root.classList.add('open');
      // show the filmstrip automatically once a set is big enough to get lost in
      this.root.classList.toggle('strip', items.length > 6);
      document.body.style.overflow = 'hidden';
      // force reflow so the opacity transition runs
      void this.root.offsetWidth;
      this.root.classList.add('shown');
      this.strip();
      this.render();
      $('.e-lb-close', this.root).focus();
    },

    /* Build the thumbnail rail once per open. */
    strip: function () {
      var rail = $('.e-lb-strip', this.root);
      rail.innerHTML = '';
      if (this.items.length < 2) return;
      var self = this;
      this.items.forEach(function (it, n) {
        var b = el('button', {
          class: 'e-lb-thumb', type: 'button',
          'aria-label': 'Go to image ' + (n + 1)
        }, '<img src="' + it.src + '" alt="" loading="lazy">');
        b.addEventListener('click', function () { self.i = n; self.render(); });
        rail.appendChild(b);
      });
    },

    toggleStrip: function () { this.root.classList.toggle('strip'); },

    close: function () {
      if (!this.root) return;
      var r = this.root;
      r.classList.remove('shown');
      this.unzoom();
      document.body.style.overflow = '';
      setTimeout(function () { r.classList.remove('open'); }, 320);
      if (this.lastFocus && this.lastFocus.focus) this.lastFocus.focus();
    },

    isOpen: function () { return this.root && this.root.classList.contains('open'); },

    go: function (d) {
      if (!this.items.length) return;
      this.i = (this.i + d + this.items.length) % this.items.length;
      this.render();
    },

    /* Zoom to a readable magnification, centred on the point that was
       tapped — not straight to the image's natural size from its top-left
       corner. On a phone, natural size is absurd: a 2000px document page is
       more than five screens wide, so all anyone saw was one enormous letter
       (and swiping is off while zoomed, so it felt stuck). Narrow or touch
       screens stop at 2.5x the fitted size; a wide screen with a mouse keeps
       natural size, where that is already a sensible magnification. */
    zoom: function (e) {
      var r = this.root, img = $('.e-lb-img', r), stage = $('.e-lb-stage', r);
      if (r.classList.contains('zoomed')) { this.unzoom(); return; }
      var fit = img.getBoundingClientRect();
      if (!fit.width || !img.naturalWidth) return;
      var small = window.innerWidth <= 900 || window.matchMedia('(pointer: coarse)').matches;
      var targetW = small ? Math.min(img.naturalWidth, Math.round(fit.width * 2.5)) : img.naturalWidth;

      // where on the image the tap landed, 0..1 — the centre for key/button zoom
      var tapped = e && e.clientX != null;
      var fx = tapped ? (e.clientX - fit.left) / fit.width : .5;
      var fy = tapped ? (e.clientY - fit.top) / fit.height : .5;
      fx = Math.max(0, Math.min(1, fx));
      fy = Math.max(0, Math.min(1, fy));

      img.style.width = targetW + 'px';
      r.classList.add('zoomed');
      var zr = img.getBoundingClientRect(), sr = stage.getBoundingClientRect();
      // keep that same spot of the page under the finger after zooming
      stage.scrollLeft = fx * zr.width - (tapped ? e.clientX - sr.left : sr.width / 2);
      stage.scrollTop = fy * zr.height - (tapped ? e.clientY - sr.top : sr.height / 2);
    },

    unzoom: function () {
      if (!this.root) return;
      this.root.classList.remove('zoomed');
      var img = $('.e-lb-img', this.root), stage = $('.e-lb-stage', this.root);
      if (img) img.style.width = '';
      if (stage) { stage.scrollLeft = 0; stage.scrollTop = 0; }
    },

    render: function () {
      var it = this.items[this.i], r = this.root;
      this.unzoom(); // any change of image (arrows, thumbs, Home/End) starts fitted
      var img = $('.e-lb-img', r);
      img.classList.remove('ready');
      var loader = new Image();
      loader.onload = function () { img.src = it.src; img.classList.add('ready'); };
      loader.onerror = function () { img.src = it.src; img.classList.add('ready'); };
      loader.src = it.src;

      img.alt = it.caption || '';
      $('.e-lb-cap', r).innerHTML = it.group
        ? '<b>' + it.group + '</b>' + (it.caption ? ' — ' + it.caption : '')
        : (it.caption || '');
      $('.e-lb-open', r).href = it.src;

      var n = this.i + 1, t = this.items.length;
      $('.e-lb-count', r).innerHTML = String(n).padStart(2, '0') + ' <i>/ ' + String(t).padStart(2, '0') + '</i>';
      $('.e-lb-line span', r).style.width = (n / t * 100) + '%';

      var one = t < 2;
      $('.e-lb-prev', r).disabled = one;
      $('.e-lb-next', r).disabled = one;

      // sync the filmstrip selection and keep it scrolled into view
      var thumbs = $$('.e-lb-thumb', r);
      thumbs.forEach(function (b, k) { b.setAttribute('aria-current', k === this.i ? 'true' : 'false'); }, this);
      scrollXInto($('.e-lb-strip', r), thumbs[this.i]);

      // preload neighbours so browsing feels instant
      [1, -1].forEach(function (d) {
        var nx = this.items[(this.i + d + t) % t];
        if (nx) { var p = new Image(); p.src = nx.src; }
      }, this);
    }
  };

  /* Collect every gallery image on the page, grouped by section heading. */
  function collect() {
    var figs = $$('figure[data-lb]');
    return figs.map(function (f) {
      // a transition cell opens on whichever frame is showing right now
      var src = f.getAttribute('data-tran-active') || $('img', f).getAttribute('src');
      return { src: src, caption: f.getAttribute('data-cap') || '', group: f.getAttribute('data-group') || '' };
    });
  }

  /* Reserve layout space from the generated dimension manifest.
     Without this the page reflows as lazy images arrive, which shifts content
     under the reader and makes in-page jumps land in the wrong place. */
  function reserve(img, box) {
    var dims = window.__DIMS;
    if (!dims) return;
    var src = img.getAttribute('src');
    var d = dims[src] || dims[decodeURIComponent(src || '')];
    if (!d) return;
    if (!img.getAttribute('width')) { img.setAttribute('width', d[0]); img.setAttribute('height', d[1]); }
    if (box && !box.style.aspectRatio) box.style.aspectRatio = d[0] + ' / ' + d[1];
  }

  function reserveAll() {
    if (!window.__DIMS) return;
    $$('img').forEach(function (i) {
      // skip the enrichment layer's own chrome — those boxes are fixed by design
      if (i.closest('#e-lb, #e-cmd, #e-preload')) return;
      var fig = i.closest('figure');
      reserve(i, fig && $('img', fig) === i ? fig : null);
    });
  }

  /* =========================================================
     4b. IN-PLACE TRANSITIONS
     Files named "<base>-tran-<n>" are frames of ONE cell that cycles in
     place — an English/Arabic poster pair, a five-frame trolley set — rather
     than separate images in a row. The data emits every frame as its own
     figure; this collapses each run back into a single stacked figure.
     ========================================================= */
  var TRAN_MS = 2000;

  function tranBase(src) {
    // accepts both "-tran-" and "-trans-", any case
    var m = (src || '').match(/^(.*?)[-_]?Trans?[-_]?\d+\.\w+$/i);
    return m ? m[1] : null;
  }

  function transitions() {
    // group consecutive figures that share a -tran- base
    var runs = [], cur = null;
    $$('figure').forEach(function (f) {
      if (f.hasAttribute('data-tran')) { cur = null; return; }   // already built
      var img = $('img', f);
      var base = img && tranBase(img.getAttribute('src'));
      if (!base) { cur = null; return; }
      if (!cur || cur.base !== base) { cur = { base: base, figs: [] }; runs.push(cur); }
      cur.figs.push(f);
    });

    runs.forEach(function (run) {
      if (run.figs.length < 2) return;
      var host = run.figs[0];
      var frames = run.figs.map(function (f) { return $('img', f); });

      host.setAttribute('data-tran', '');
      host.setAttribute('aria-label', frames.length + ' versions, shown in turn');

      // the first frame keeps the layout; the rest stack on top of it
      frames.slice(1).forEach(function (img) {
        img.classList.add('e-tran-layer');
        host.appendChild(img);
      });
      frames[0].classList.add('e-tran-layer', 'e-tran-base');
      run.figs.slice(1).forEach(function (f) { f.remove(); });

      // progress dots — also the manual control when motion is reduced
      var dots = el('div', { class: 'e-tran-dots', 'aria-hidden': 'true' });
      frames.forEach(function (_, i) {
        var d = el('span', i === 0 ? { class: 'on' } : {});
        d.addEventListener('click', function (e) { e.stopPropagation(); show(i); stop(); });
        dots.appendChild(d);
      });
      host.appendChild(dots);

      var idx = 0, timer = null;
      function show(n) {
        idx = (n + frames.length) % frames.length;
        frames.forEach(function (im, i) { im.style.opacity = i === idx ? '1' : '0'; });
        $$('span', dots).forEach(function (d, i) { d.className = i === idx ? 'on' : ''; });
        host.setAttribute('data-tran-active', frames[idx].getAttribute('src'));
      }
      function start() { if (!timer && !REDUCED) timer = setInterval(function () { show(idx + 1); }, TRAN_MS); }
      function stop() { if (timer) { clearInterval(timer); timer = null; } }

      show(0);

      // pause on hover/focus (WCAG 2.2.2 — auto-updating content must be pausable)
      host.addEventListener('mouseenter', stop);
      host.addEventListener('mouseleave', start);
      host.addEventListener('focusin', stop);
      host.addEventListener('focusout', start);

      // only run while on screen
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (es) {
          es.forEach(function (e) { e.isIntersecting ? start() : stop(); });
        }, { rootMargin: '100px' }).observe(host);
      } else start();
    });

    if (runs.some(function (r) { return r.figs.length > 1; })) reserveAll();
  }

  /* =========================================================
     4c. VIDEO CELLS
     A gallery slot can hold an .mp4 (e.g. "Main.mp4" leading a 3D group).
     The template only knows how to emit <img>, so swap those for a real
     player here.
     ========================================================= */
  function videoCells() {
    $$('figure img').forEach(function (img) {
      var src = img.getAttribute('src') || '';
      if (!/\.mp4$/i.test(src)) return;
      var fig = img.closest('figure');
      /* Autoplay muted and looping so a walkthrough render reads as motion
         straight away; controls stay so sound and scrubbing are available. */
      var v = el('video', {
        src: src, controls: '', playsinline: '', loop: '', muted: '',
        preload: 'metadata',
        poster: src.replace(/\.mp4$/i, '.poster.webp'),
        style: 'width:100%;display:block;background:#000'
      });
      v.muted = true;            // must be set as a property for autoplay to stick
      v.setAttribute('autoplay', '');
      img.replaceWith(v);
      fig.setAttribute('data-video-cell', '');

      // only run while visible — no point decoding off-screen
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (es) {
          es.forEach(function (e) {
            if (e.isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
            else if (!v.paused) v.pause();
          });
        }, { rootMargin: '150px' }).observe(v);
      }
    });
  }

  /* =========================================================
     4d. DOCUMENT VIEWER — swipeable flipbook
     Decks and PDFs are pre-rendered to page images; this turns a
     <div data-doc='{…}'> placeholder into an inline reader with a stage,
     arrows, counter and thumbnail rail. Pages also open in the lightbox.

     The stage doubles as a flipbook: page changes animate as a page
     turn (two pages briefly coexist, rotating on the Y axis), pages
     can be swiped/dragged left-right, and hovering the stage reveals
     edge zones for flipping without hunting for the arrow buttons.
     On first scroll into view the book auto-turns a few pages once
     — pure motion, to signal it's interactive — then stops and hands
     control to the visitor the moment they touch or hover it.
     ========================================================= */

  /* =========================================================
  /* =========================================================
     4d-ii. OPEN-BOOK READER
     For documents flagged "flip":"turn". Hand-built, deliberately: this
     used to run on the page-flip library, and three separate regressions
     came out of behaviour that library owns and does not expose —
        · its canvas renderer ignores devicePixelRatio, so every page was
          drawn at CSS resolution and upscaled (soft, pixelated on HiDPI);
        · a designated cover is forced through a rigid "hard" turn that
          data-density cannot override, so one turn never matched the rest;
        · working around the half-empty cover frame meant sliding the whole
          book sideways after a turn had already landed.
     What is left here is the part that was always fine: two facing pages
     and one leaf rotating on the spine. Real <img> elements, so the browser
     rasterises at full device resolution; plain CSS, so there is nothing
     here that can only be understood by reading someone else's renderer.

     Rule this file follows: a page change is committed to state FIRST and
     animated second. If the transition never runs — reduced motion, a
     background tab, a stalled frame — the spread is still correct. The
     animation is decoration, never the mechanism.
     ========================================================= */
  function bookReader(host, cfg, pages) {
    host.classList.add('e-doc', 'e-book-host');
    var count = pages.length;
    var pad = function (n) { return String(n).padStart(2, '0'); };

    /* The book opens like a book: the cover alone, then facing pairs, and a
       lone final page when the count leaves one over. Leaf t carries page
       2t-1 on the left and 2t on the right, which makes t=0 the cover (right
       side only) and the last leaf the inside back. */
    var lastLeaf = Math.floor(count / 2); // highest leaf that still carries a page:
                                        // an even count ends on a lone LEFT page (leaf count/2),
                                        // an odd one ends on a right page (leaf (count-1)/2)
    var turned = 0;
    var busy = false;
    /* A phone is too narrow for a spread — two pages of a text document at
       ~160px each is unreadable — so below SINGLE_AT the book shows one page
       at a time, full width. `turned` stays the leaf cursor for spreads;
       `solo` is the page cursor used in single mode, and the two are kept in
       step whenever the mode flips so the reader never jumps position. */
    var SINGLE_AT = 700;
    var single = false;
    var solo = 0;
    var natW = cfg.w || 0, natH = cfg.h || 0;
    var leftAt  = function (t) { return t > 0 ? pages[2 * t - 1] : null; };
    var rightAt = function (t) { return pages[2 * t] || null; };
    var idxOf   = function (t) { return rightAt(t) ? 2 * t : (leftAt(t) ? 2 * t - 1 : 0); };
    var leafOf  = function (i) { return i <= 0 ? 0 : Math.floor((i + 1) / 2); };
    /* The page actually on screen. In single-page mode `turned` goes stale
       (only `solo` moves), so anything that needs "the current page" must ask
       here — reading idxOf(turned) directly sent the magnifier to page 1
       while a phone was showing page 2. */
    var curIdx  = function () { return single ? solo : idxOf(turned); };

    host.innerHTML =
      '<div class="e-doc-head">' +
        '<div><span class="e-doc-title">' + (cfg.title || 'Document') + '</span>' +
        '<span class="e-doc-kind">' + (cfg.kind || '') + ' · ' + count + ' pages</span></div>' +
        '<div class="e-book-tools">' +
          '<button class="e-book-tool e-book-zoom" type="button" aria-label="View full size">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="20" y1="20" x2="16.7" y2="16.7"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>' +
          '</button>' +
          '<button class="e-book-tool e-book-full" type="button" aria-label="Fullscreen">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>' +
          '</button>' +
        '</div>' +
      '</div>' +
      (cfg.desc ? '<p class="e-doc-desc">' + cfg.desc + '</p>' : '') +
      '<div class="e-book-stage">' +
        '<div class="e-book">' +
          '<div class="e-book-side e-book-l"></div>' +
          '<div class="e-book-side e-book-r"></div>' +
        '</div>' +
        '<button class="e-book-edge e-book-edge-l" type="button" aria-label="Previous page">' +
          '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg></button>' +
        '<button class="e-book-edge e-book-edge-r" type="button" aria-label="Next page">' +
          '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg></button>' +
        '<div class="e-book-tip"><span>Click the edge to turn</span><i>&rarr;</i></div>' +
      '</div>' +
      '<div class="e-doc-bar">' +
        '<button class="e-doc-prev" type="button" aria-label="Previous page">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg></button>' +
        '<button class="e-doc-count" type="button" aria-label="Go to page"></button>' +
        '<button class="e-doc-next" type="button" aria-label="Next page">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg></button>' +
      '</div>' +
      '<div class="e-doc-strip"></div>' +
      '<div class="e-book-sr" aria-live="polite"></div>';

    var stage = $('.e-book-stage', host);
    var book = $('.e-book', host);
    var sideL = $('.e-book-l', host);
    var sideR = $('.e-book-r', host);
    var strip = $('.e-doc-strip', host);
    var countBtn = $('.e-doc-count', host);
    var prevBtn = $('.e-doc-prev', host);
    var nextBtn = $('.e-doc-next', host);
    var sr = $('.e-book-sr', host);
    var thumbs = (cfg.thumbs && cfg.thumbs.length === count) ? cfg.thumbs : pages;

    var hintTimer = null;
    function dropHint() {
      if (hintTimer) { clearTimeout(hintTimer); hintTimer = null; }
      host.classList.remove('e-book-hint');
    }

    /* Only the pages in play are fetched, so opening a case study doesn't
       pull the whole document down the wire; neighbours are warmed a leaf
       ahead so a turn never reveals an empty page. */
    var warmed = {};
    function warm(t) {
      for (var i = 2 * t - 2; i <= 2 * t + 3; i++) {
        if (i < 0 || i >= count || warmed[i]) continue;
        warmed[i] = true;
        var im = new Image();
        im.src = pages[i];
      }
    }

    function pageImg(src, n) {
      if (!src) return '';
      return '<img src="' + src + '" alt="' + (cfg.title ? cfg.title + ' — ' : '') + 'page ' + n +
        '" draggable="false" decoding="async">';
    }

    pages.forEach(function (p, n) {
      var b = el('button', { type: 'button', tabindex: '-1', 'aria-label': 'Page ' + (n + 1) },
        '<img src="' + thumbs[n] + '" alt="" loading="lazy">');
      b.addEventListener('click', function () { jumpToPage(n); });
      strip.appendChild(b);
    });
    var stripBtns = $$('button', strip);

    /* A lone page — the cover, and the last page when the count is even —
       fills only one half of the two-page frame, so it sat half a page off
       centre. Sliding the book a quarter of its width (half a page) puts
       that page dead centre, the way a closed book sits before you open it.
       During a turn the slide runs with the same duration and curve as the
       leaf, so opening the cover is one motion — the book glides open as the
       page swings — never a separate jump after the page has landed. */
    function offsetFor(t) {
      if (single) return 0;
      var l = leftAt(t), r = rightAt(t);
      return (r && !l) ? -25 : (l && !r) ? 25 : 0;
    }
    function applyOffset(pct, animate) {
      if (!animate) book.style.transition = 'none';
      book.style.transform = pct ? 'translateX(' + pct + '%)' : '';
      if (!animate) { void book.offsetWidth; book.style.transition = ''; }
    }

    function paint() {
      var l, r, from, to, cur;
      if (single) {
        l = null; r = pages[solo];
        from = to = solo + 1;
        cur = solo;
      } else {
        l = leftAt(turned); r = rightAt(turned);
        from = l ? 2 * turned : (r ? 2 * turned + 1 : 1);
        to = r ? 2 * turned + 1 : from;
        cur = idxOf(turned);
      }
      sideL.innerHTML = pageImg(l, from);
      sideR.innerHTML = pageImg(r, to);
      // an absent half stays empty and stage-coloured — never a white sheet
      sideL.classList.toggle('e-book-empty', !l);
      sideR.classList.toggle('e-book-empty', !r);

      countBtn.textContent = (from === to ? pad(from) : pad(from) + '–' + pad(to)) + ' / ' + pad(count);
      sr.textContent = 'Page ' + from + (from === to ? '' : ' and ' + to) + ' of ' + count +
        (cfg.title ? ', ' + cfg.title : '');

      stripBtns.forEach(function (b, k) {
        var on = single ? k === solo : ((l && k === 2 * turned - 1) || (r && k === 2 * turned));
        b.setAttribute('aria-current', on ? 'true' : 'false');
        b.tabIndex = k === cur ? 0 : -1;
      });
      scrollXInto(strip, stripBtns[cur]);

      var atStart = single ? solo === 0 : turned === 0;
      var atEnd = single ? solo >= count - 1 : turned >= lastLeaf;
      prevBtn.disabled = atStart;
      nextBtn.disabled = atEnd;
      host.classList.toggle('e-book-at-start', atStart);
      host.classList.toggle('e-book-at-end', atEnd);
      warm(single ? leafOf(solo) : turned);
      applyOffset(offsetFor(turned), false); // instant: already there after a turn, or a jump/resize
      try { history.replaceState(null, '', location.pathname + location.search + '#page=' + (cur + 1)); } catch (e) {}
    }

    /* Size the book to what the viewport actually has left, so it never runs
       off the top and bottom of a laptop screen. Plain layout maths on a
       fixed two-page frame: height from the budget, width from the page's
       own ratio. The frame keeps the same size in every view, so nothing
       shifts or resizes as you turn. */
    function measure() {
      if (!natW || !natH) return;
      var full = document.fullscreenElement === host;
      var chrome = 0;
      if (!full) {
        var nav = document.querySelector('nav');
        if (nav) chrome += nav.getBoundingClientRect().height;
      }
      ['.e-doc-head', '.e-doc-desc', '.e-doc-bar', '.e-doc-strip'].forEach(function (sel) {
        var e2 = $(sel, host);
        if (e2) chrome += e2.getBoundingClientRect().height;
      });
      var stagePad = 2 * (parseFloat(getComputedStyle(stage).paddingTop) || 22);
      var budgetH = Math.max(240, window.innerHeight - chrome - stagePad - 24);
      var avail = Math.max(280, stage.clientWidth - stagePad);

      /* Flip between spread and single-page when the viewport crosses the
         threshold, carrying the reading position across so nothing jumps. */
      var wantSingle = window.innerWidth <= SINGLE_AT && !full;
      if (wantSingle !== single) {
        if (wantSingle) solo = idxOf(turned);
        else turned = leafOf(solo);
        single = wantSingle;
        host.classList.toggle('e-book-single', single);
      }

      var perPage = single ? avail : avail / 2;
      var capW = Math.min(full ? 900 : 560, perPage);
      var pageW = Math.max(150, Math.round(Math.min(capW, budgetH * natW / natH)));
      var pageH = Math.round(pageW * natH / natW);
      book.style.width = (single ? pageW : pageW * 2) + 'px';
      book.style.height = pageH + 'px';
      paint(); // the mode may have changed which halves carry a page
    }

    /* One leaf, rotating on the spine. In single-page mode the leaf is the
       whole book rather than half of it (see the CSS), and it steps one page
       instead of one spread — otherwise the mechanics are identical. */
    function go(d) {
      if (busy) return;
      var fwd = d > 0;
      var to, frontSrc, backSrc, underL, underR;

      if (single) {
        to = solo + d;
        if (to < 0 || to > count - 1) return;
        frontSrc = pages[solo];
        backSrc = pages[to];
        underL = null;
        underR = pages[to];
      } else {
        to = turned + d;
        if (to < 0 || to > lastLeaf) return;
        frontSrc = fwd ? pages[2 * turned]     : pages[2 * turned - 2];
        backSrc  = fwd ? pages[2 * turned + 1] : pages[2 * turned - 1];
        underL   = fwd ? leftAt(turned)        : leftAt(to);
        underR   = fwd ? rightAt(to)           : rightAt(turned);
      }
      dropHint();

      if (REDUCED || !frontSrc) {
        if (single) solo = to; else turned = to;
        paint();
        return;
      }

      busy = true;
      // the book slides to its destination centring alongside the leaf
      if (!single) applyOffset(offsetFor(to), true);
      // the halves underneath are already the post-turn spread
      sideL.innerHTML = pageImg(underL, 0);
      sideR.innerHTML = pageImg(underR, 0);
      sideL.classList.toggle('e-book-empty', !underL);
      sideR.classList.toggle('e-book-empty', !underR);

      var leaf = el('div', { class: 'e-book-leaf' },
        '<div class="e-book-face e-book-front">' + pageImg(frontSrc, 0) + '</div>' +
        '<div class="e-book-face e-book-back">' + pageImg(backSrc, 0) + '</div>');
      book.appendChild(leaf);

      /* Commit the start angle, force it to take, then transition — starting
         from a committed value rather than a frame callback means the turn
         still runs where requestAnimationFrame is throttled. */
      leaf.style.transform = fwd ? 'rotateY(0deg)' : 'rotateY(-180deg)';
      void leaf.offsetWidth;
      leaf.classList.add('e-book-turning');
      leaf.style.transform = fwd ? 'rotateY(-180deg)' : 'rotateY(0deg)';

      var done = false;
      function settle() {
        if (done) return;
        done = true;
        if (leaf.parentNode) leaf.remove();
        if (single) solo = to; else turned = to;
        paint();
        busy = false;
      }
      leaf.addEventListener('transitionend', function fin(e) {
        if (e.propertyName !== 'transform') return;
        leaf.removeEventListener('transitionend', fin);
        settle();
      });
      setTimeout(settle, 1200); // safety net if transitionend never arrives
    }

    /* Takes a PAGE index, so callers (thumbnails, Home/End, the page-number
       box) don't have to know whether the reader is showing spreads or
       single pages. */
    function jumpToPage(i) {
      if (busy) return;
      i = Math.max(0, Math.min(count - 1, i));
      dropHint();
      if (single) solo = i;
      else turned = Math.max(0, Math.min(lastLeaf, leafOf(i)));
      paint();
    }

    prevBtn.addEventListener('click', function () { go(-1); });
    nextBtn.addEventListener('click', function () { go(1); });
    $('.e-book-edge-l', host).addEventListener('click', function () { go(-1); });
    $('.e-book-edge-r', host).addEventListener('click', function () { go(1); });

    countBtn.addEventListener('click', function () {
      if (countBtn.querySelector('input')) return;
      var cur = curIdx() + 1;
      countBtn.innerHTML = '<input type="number" min="1" max="' + count + '" value="' + cur + '">';
      var input = countBtn.querySelector('input');
      input.focus(); input.select();
      function commit() {
        var n = Math.min(count, Math.max(1, parseInt(input.value, 10) || cur));
        jumpToPage(n - 1);
        paint();
      }
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); commit(); }
        else if (e.key === 'Escape') { e.preventDefault(); paint(); }
        e.stopPropagation();
      });
      input.addEventListener('blur', commit);
    });

    $('.e-book-zoom', host).addEventListener('click', function () {
      dropHint();
      LB.open(pages.map(function (p, n) { return { src: p, caption: 'Page ' + (n + 1), group: cfg.title || '' }; }),
        curIdx());
    });
    $('.e-book-full', host).addEventListener('click', function () {
      dropHint();
      if (document.fullscreenElement === host) document.exitFullscreen();
      else if (host.requestFullscreen) host.requestFullscreen();
    });
    document.addEventListener('fullscreenchange', function () {
      host.classList.toggle('e-book-fullscreen', document.fullscreenElement === host);
      setTimeout(measure, 60);
    });

    host.setAttribute('tabindex', '0');
    host.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
      else if (e.key === 'Home') { e.preventDefault(); jumpToPage(0); }
      else if (e.key === 'End') { e.preventDefault(); jumpToPage(count - 1); }
      else if (e.key === 'PageUp') { e.preventDefault(); go(-1); }
      else if (e.key === 'PageDown') { e.preventDefault(); go(1); }
      else if ((e.key === 'f' || e.key === 'F') && !e.metaKey && !e.ctrlKey) { e.preventDefault(); $('.e-book-full', host).click(); }
      else if (e.key === 'Escape' && document.fullscreenElement === host) { document.exitFullscreen(); }
    });

    // swipe / drag across the spread
    var dragX = null;
    book.addEventListener('pointerdown', function (e) { dragX = e.clientX; });
    book.addEventListener('pointerup', function (e) {
      if (dragX === null) return;
      var dx = e.clientX - dragX;
      dragX = null;
      if (Math.abs(dx) > 45) go(dx < 0 ? 1 : -1);
    });
    book.addEventListener('pointercancel', function () { dragX = null; });
    host.addEventListener('pointerdown', dropHint);

    var rt = null;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(measure, 150);
    });

    /* Page size is known at build time (doc-meta.js reads the first
       extracted page), so the book is sized correctly before a single image
       has loaded. Falls back to a one-off probe for older builds. */
    function start() {
      /* Read a #page=N link BEFORE the first measure(): measure() paints,
         and painting rewrites the address to the current page — which
         silently replaced the link with #page=1 before it was ever read. */
      var m = /[#&]page=(\d+)/.exec(location.hash);
      var startPage = m ? Math.min(count, Math.max(1, parseInt(m[1], 10))) - 1 : 0;
      measure(); // settles spread vs single-page mode for this screen
      // then land on the exact page, in whichever cursor that mode reads
      if (single) solo = startPage;
      else turned = Math.max(0, Math.min(lastLeaf, leafOf(startPage)));
      paint();

      /* One unprompted turn once the book is on screen — motion says "this
         opens" better than a label. Once only, from the cover only, and
         never after the visitor has touched it or arrived deep-linked. */
      var onCover = curIdx() === 0;
      if (count > 1 && onCover) host.classList.add('e-book-hint');
      if (!REDUCED && count > 1 && onCover && 'IntersectionObserver' in window) {
        var nudged = false;
        var obs = new IntersectionObserver(function (entries) {
          entries.forEach(function (ent) {
            if (!ent.isIntersecting) { if (hintTimer) { clearTimeout(hintTimer); hintTimer = null; } return; }
            if (nudged || !host.classList.contains('e-book-hint') || hintTimer) return;
            hintTimer = setTimeout(function () {
              hintTimer = null;
              if (nudged || !host.classList.contains('e-book-hint')) return;
              nudged = true;
              obs.disconnect();
              dropHint();
              if (curIdx() === 0) go(1);
            }, 2200);
          });
        }, { threshold: .4 });
        obs.observe(host);
      }
    }

    if (natW && natH) start();
    else {
      var probe = new Image();
      probe.onload = function () { natW = probe.naturalWidth || 900; natH = probe.naturalHeight || 1200; start(); };
      probe.onerror = function () { natW = 900; natH = 1200; start(); };
      probe.src = pages[0];
    }
  }

  function documents() {
    $$('[data-doc]').forEach(function (host) {
      if (host.dataset.docBuilt) return;
      host.dataset.docBuilt = '1';
      var cfg;
      try { cfg = JSON.parse(host.getAttribute('data-doc')); } catch (e) { return; }
      var pages = cfg.pages || [];
      if (!pages.length) return;

      /* "flip":"turn" hands the document to the open-book reader below: two
         facing pages with a leaf turning between them. It is a separate
         implementation rather than a mode of this one, because a spread has a
         different structure (two visible pages, a two-sided leaf) than the
         single-page viewer. Documents without the flag are untouched. */
      if (cfg.flip === 'turn') { bookReader(host, cfg, pages); return; }

      host.classList.add('e-doc', 'e-doc-flip');
      host.innerHTML =
        '<div class="e-doc-head">' +
          '<div><span class="e-doc-title">' + (cfg.title || 'Document') + '</span>' +
          '<span class="e-doc-kind">' + (cfg.kind || '') + ' · ' + pages.length + ' pages</span></div>' +
        '</div>' +
        (cfg.desc ? '<p class="e-doc-desc">' + cfg.desc + '</p>' : '') +
        '<div class="e-doc-stage">' +
          '<button class="e-doc-zone e-doc-zone-l" type="button" aria-label="Previous page">' +
            '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></button>' +
          '<button class="e-doc-zone e-doc-zone-r" type="button" aria-label="Next page">' +
            '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></button>' +
        '</div>' +
        '<div class="e-doc-bar">' +
          '<button class="e-doc-prev" type="button" aria-label="Previous page">' +
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></button>' +
          '<span class="e-doc-count"></span>' +
          '<button class="e-doc-next" type="button" aria-label="Next page">' +
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></button>' +
        '</div>' +
        '<div class="e-doc-strip"></div>';

      var stage = $('.e-doc-stage', host);
      var strip = $('.e-doc-strip', host);
      var i = 0;
      var flipping = false;
      var autoOn = false;      // true while the auto-flip demo is running
      var handedOver = false;  // true once the visitor has taken control

      function mediaEl() { return stage.querySelector('img, video'); }

      function buildPage(p) {
        var isVideo = /\.mp4$/i.test(p);
        var node = isVideo
          ? el('video', { src: p, controls: '', playsinline: '', loop: '', muted: '', preload: 'metadata', poster: p.replace(/\.mp4$/i, '.poster.webp') })
          /* The page on the stage is the reader's actual content, not a
             thumbnail, so it loads eagerly: a lazy one can still be 0x0 when a
             turn (or the auto-demo) starts, which animates an invisible box and
             collapses the stage. Only one or two of these exist at a time —
             the thumbnail rail below stays lazy. */
          : el('img', { src: p, alt: (cfg.title || '') + ' — page ' + (i + 1), loading: 'eager', draggable: 'false' });
        if (isVideo) { node.muted = true; node.setAttribute('autoplay', ''); }
        return node;
      }

      function syncChrome() {
        $('.e-doc-count', host).textContent = String(i + 1).padStart(2, '0') + ' / ' + String(pages.length).padStart(2, '0');
        $$('button', strip).forEach(function (b, k) { b.setAttribute('aria-current', k === i ? 'true' : 'false'); });
        scrollXInto(strip, $$('button', strip)[i]);
      }

      /* Run cb once the page can be measured. Images report complete only when
         decoded, so a freshly built one has to be waited on; the timeout keeps
         a stalled or broken file from parking the reader mid-turn. */
      function whenReady(node, cb) {
        if (node.tagName !== 'IMG' || node.complete) return cb();
        var fired = false;
        var once = function () { if (fired) return; fired = true; cb(); };
        node.addEventListener('load', once, { once: true });
        node.addEventListener('error', once, { once: true });
        setTimeout(once, 2500);
      }

      /* dir: 0 = instant (no animation); +1/-1 = animated, and for a page-turn
         document the sign decides which way the leaf swings.

         Two animations share this one function because every navigation path
         (arrows, edge zones, thumbnails, keyboard, drag, the auto-demo) funnels
         through render() — so the choice is made here once rather than at each
         call site. TURN documents opt in via "flip":"turn"; everything else
         keeps the cross-dissolve. */
      function render(dir) {
        var old = mediaEl();
        var next = buildPage(pages[i]);

        if (REDUCED || !dir || !old) {
          if (old) old.remove();
          stage.insertBefore(next, stage.firstChild);
        } else {
          flipping = true;
          // pin the stage's current height for the dissolve only — the
          // outgoing page is about to leave normal flow (page-out pulls it
          // absolute), which would otherwise collapse the box to its
          // min-height and crop both pages until the new one settles.
          var frozenH = stage.getBoundingClientRect().height;
          stage.style.height = frozenH + 'px';

          old.classList.add('e-doc-page-out');   // sits on top, fades 1 -> 0
          next.classList.add('e-doc-page-in');    // sits beneath, fades 0 -> 1
          next.style.opacity = '0';
          stage.insertBefore(next, stage.firstChild);
          void next.offsetWidth; // reflow so the starting opacity above takes hold before animating
          requestAnimationFrame(function () {
            old.style.opacity = '0';
            next.style.opacity = '1';
          });
          var settle = function () {
            if (old.parentNode) old.remove();
            next.classList.remove('e-doc-page-in');
            next.style.opacity = '';
            stage.style.height = ''; // hand height back to normal flow, sized to the new page
            flipping = false;
          };
          next.addEventListener('transitionend', function done() {
            next.removeEventListener('transitionend', done);
            settle();
          }, { once: true });
          // safety net in case a transitionend never fires (e.g. tab backgrounded)
          setTimeout(function () { if (flipping) settle(); }, 600);
        }

        syncChrome();
      }
      function go(d) {
        if (flipping) return;
        i = (i + d + pages.length) % pages.length;
        render(d);
      }
      function jump(n) {
        if (flipping || n === i) return;
        var d = n > i ? 1 : -1;
        i = n;
        render(d);
      }

      /* ---- auto-flip demo: a few pages turn themselves once the
         book scrolls into view, so it reads as touchable before
         anyone has to guess. Any touch, hover or manual nav ends it
         for good — the visitor is now in charge. ---- */
      var demoLimit = Math.min(pages.length, 6);
      var demoStep = 0;
      var demoTimer = null;

      function handOver() {
        if (handedOver) return;
        handedOver = true;
        autoOn = false;
        if (demoTimer) { clearTimeout(demoTimer); demoTimer = null; }
        host.classList.remove('e-doc-demo');
      }
      function scheduleDemo() {
        demoTimer = setTimeout(function () {
          demoTimer = null;
          if (handedOver) return;
          var nextP = pages[(i + 1) % pages.length];
          demoStep++;
          if (demoStep >= demoLimit || /\.mp4$/i.test(nextP)) { handOver(); return; }
          go(1);
          scheduleDemo();
        }, 1600);
      }
      if (!REDUCED && pages.length > 1 && 'IntersectionObserver' in window) {
        host.classList.add('e-doc-demo');
        var demoObs = new IntersectionObserver(function (es) {
          es.forEach(function (e) {
            if (handedOver) { demoObs.disconnect(); return; }
            if (e.isIntersecting && !autoOn && !demoTimer) {
              autoOn = true;
              scheduleDemo();
            } else if (!e.isIntersecting && demoTimer) {
              clearTimeout(demoTimer); demoTimer = null; autoOn = false;
            }
          });
        }, { threshold: .45 });
        demoObs.observe(host);
      } else {
        handedOver = true;
      }
      // any deliberate interaction — a tap/click/drag or keyboard focus —
      // hands control to the visitor immediately. Plain hovering doesn't:
      // moving the mouse over the book to look at it shouldn't cut the
      // demo off before it's shown any motion (the zone arrows still
      // reveal on hover via CSS, independent of this).
      host.addEventListener('pointerdown', handOver);
      host.addEventListener('focusin', handOver);

      pages.forEach(function (p, n) {
        var b = el('button', { type: 'button', 'aria-label': 'Page ' + (n + 1) },
          /\.mp4$/i.test(p) ? '<span class="e-doc-vthumb">▶</span>'
                            : '<img src="' + p + '" alt="" loading="lazy">');
        b.addEventListener('click', function () { handOver(); jump(n); });
        strip.appendChild(b);
      });

      $('.e-doc-prev', host).addEventListener('click', function () { handOver(); go(-1); });
      $('.e-doc-next', host).addEventListener('click', function () { handOver(); go(1); });
      $('.e-doc-zone-l', host).addEventListener('click', function (e) { e.stopPropagation(); handOver(); go(-1); });
      $('.e-doc-zone-r', host).addEventListener('click', function (e) { e.stopPropagation(); handOver(); go(1); });
      host.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft') { e.preventDefault(); handOver(); go(-1); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); handOver(); go(1); }
      });

      // swipe / drag to flip
      var dragging = false, startX = 0, startY = 0, moved = false, suppressClick = false;
      stage.addEventListener('pointerdown', function (e) {
        if (e.target.closest('.e-doc-zone') || e.target.tagName === 'VIDEO') return;
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        dragging = true; moved = false;
        startX = e.clientX; startY = e.clientY;
      });
      stage.addEventListener('pointermove', function (e) {
        if (!dragging) return;
        if (!moved && Math.abs(e.clientX - startX) > 6) moved = true;
      });
      function endDrag(e) {
        if (!dragging) return;
        dragging = false;
        if (!moved) return;
        var dx = e.clientX - startX, dy = e.clientY - startY;
        suppressClick = true;
        setTimeout(function () { suppressClick = false; }, 60);
        if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) go(dx < 0 ? 1 : -1);
      }
      stage.addEventListener('pointerup', endDrag);
      stage.addEventListener('pointercancel', function () { dragging = false; });

      // clicking the page (not dragging, not a zone) opens the full-size reader
      stage.addEventListener('click', function (e) {
        if (suppressClick || moved) return;
        if (e.target.tagName === 'VIDEO' || e.target.closest('.e-doc-zone')) return;
        LB.open(pages.filter(function (p) { return !/\.mp4$/i.test(p); })
          .map(function (p, n) { return { src: p, caption: 'Page ' + (n + 1), group: cfg.title || '' }; }), i);
      });
      host.setAttribute('tabindex', '0');
      render(0);
    });
  }

  /* Tag gallery figures so they are clickable, focusable and numbered. */
  function tagFigures() {
    var groups = $$('section figure');
    if (!groups.length) return;

    // Establish the group name for each figure from its nearest preceding h3
    var counters = {};
    groups.forEach(function (f) {
      var img = $('img', f);
      if (!img || !img.getAttribute('src')) return;
      if (f.hasAttribute('data-lb')) return;

      var block = f.closest('div[style*="margin-bottom"]') || f.parentElement.parentElement;
      var h = block ? $('h3', block) : null;
      var g = h ? h.textContent.trim() : '';

      counters[g] = (counters[g] || 0) + 1;
      var n = counters[g];

      reserve(img, f);
      /* Record how many columns this figure was authored at, so the
         responsive rules in enhance.css can widen it on small screens
         (a 3-up row is ~100px per image on a phone otherwise). */
      var wStyle = f.style.width || '';
      var cols = /33\.3/.test(wStyle) ? 3 : /25%/.test(wStyle) ? 4
               : /20%/.test(wStyle) ? 5 : /50%/.test(wStyle) ? 2 : 1;
      f.setAttribute('data-cols', cols);
      f.setAttribute('data-lb', '');
      f.setAttribute('data-group', g);
      f.setAttribute('data-cap', 'Image ' + n);
      f.setAttribute('tabindex', '0');
      f.setAttribute('role', 'button');
      f.setAttribute('aria-label', 'View ' + (g ? g + ' ' : '') + 'image ' + n + ' full screen');

      // give every image a meaningful, unique alt instead of the repeated group name
      if (g) img.setAttribute('alt', g + ' — image ' + n);

      if (!$('.e-fig-n', f)) {
        f.appendChild(el('span', { class: 'e-fig-n', 'aria-hidden': 'true' }, String(n).padStart(2, '0')));
      }
    });
  }

  function bindLightbox() {
    document.addEventListener('click', function (e) {
      var f = e.target.closest && e.target.closest('figure[data-lb]');
      if (!f) return;
      e.preventDefault();
      var items = collect();
      var idx = $$('figure[data-lb]').indexOf(f);
      LB.open(items, Math.max(0, idx));
    });

    document.addEventListener('keydown', function (e) {
      // open from a focused figure
      if (!LB.isOpen()) {
        var f = document.activeElement;
        if (f && f.matches && f.matches('figure[data-lb]') && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          f.click();
        }
        return;
      }
      // viewer shortcuts
      if (e.key === 'Escape') { e.preventDefault(); LB.close(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); LB.go(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); LB.go(-1); }
      else if (e.key === 'z' || e.key === 'Z') { e.preventDefault(); LB.zoom(); }
      else if (e.key === 't' || e.key === 'T') { e.preventDefault(); LB.toggleStrip(); }
      else if (e.key === 'Home') { e.preventDefault(); LB.i = 0; LB.render(); }
      else if (e.key === 'End') { e.preventDefault(); LB.i = LB.items.length - 1; LB.render(); }
      else if (e.key === 'Tab') {
        // keep focus inside the dialog
        var f2 = $$('button, a[href], [tabindex]:not([tabindex="-1"])', LB.root).filter(function (n) { return !n.disabled; });
        if (!f2.length) return;
        var first = f2[0], last = f2[f2.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* =========================================================
     5. BACK TO TOP
     ========================================================= */
  function backToTop() {
    if (document.getElementById('e-top')) return;
    var b = el('button', { id: 'e-top', type: 'button', 'aria-label': 'Back to top' },
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>');
    document.body.appendChild(b);
    b.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: REDUCED ? 'instant' : 'smooth' });
    });
    var tick = false;
    window.addEventListener('scroll', function () {
      if (tick) return;
      tick = true;
      requestAnimationFrame(function () {
        b.classList.toggle('show', window.scrollY > window.innerHeight * 0.9);
        tick = false;
      });
    }, { passive: true });
  }

  /* =========================================================
     6. SKIP LINK + landmark
     ========================================================= */
  function landmarks() {
    var root = document.getElementById('site') || document.getElementById('page') || document.getElementById('mpage');
    if (root && !root.hasAttribute('role')) {
      root.setAttribute('id', root.id);
      root.setAttribute('role', 'main');
    }
    if (!$('.e-skip')) {
      var a = el('a', { href: '#' + (root ? root.id : 'top'), class: 'e-skip' }, 'Skip to content');
      document.body.insertBefore(a, document.body.firstChild);
    }
  }

  /* =========================================================
     7. COMMAND PALETTE  (⌘K / Ctrl+K)
     Nine pages and 190 gallery images is enough surface that
     jumping straight to a project beats scrolling to find it.
     ========================================================= */
  /* Ordered to match the site: strongest and most recent first. */
  var PROJECTS = [
    ['Home Care Plus', 'Brand Identity · Logo · Guidelines', 'Home-Care-Plus.dc.html', 'assets_web/projects/Infinity Hospitality/cover.webp'],
    ['Hi-Wash Designs', 'Social · Print · 3D', 'HiWash-Brand-Collateral.dc.html', 'assets_web/projects/hiwashwork/cover.webp'],
    ['Skyora', 'Real Estate · Branding · Print', 'Skyora.dc.html', 'assets_web/projects/skyora/cover.webp'],
    ['Mr Valet', 'Branding · Social · 3D · Print', 'Mr-Valet.dc.html', 'assets_web/projects/Mr Valet/cover.webp'],
    ['Killian Social Media', 'Social Media', 'Killian-Social-Media.dc.html', 'assets_web/projects/killian/cover.webp']
  ];

  /* Browse-by-category pages: the same work indexed by discipline instead of
     by client. */
  var CATEGORIES = [
    ['Social Media', '48 designs · 4 projects', 'Category-Social-Media.dc.html', 'assets_web/projects/killian/cover.webp'],
    ['Print Designs', '36 designs · 3 documents', 'Category-Print-Designs.dc.html', 'assets_web/projects/hiwashwork/cover.webp'],
    ['Company Profiles', '5 designs · 2 documents', 'Category-Company-Profiles.dc.html', 'assets_web/projects/skyora/cover.webp'],
    ['Presentations', '1 concept deck', 'Category-Presentations.dc.html', 'assets_web/projects/Mr Valet/cover.webp'],
  ];

  /* Film & direction work — playable straight from the palette. */
  var FILMS = [
    ['Inayathadam', 'Tamil short film · Actor & Editor', 'https://www.youtube.com/embed/lJIxDHUOXwI?autoplay=1&rel=0'],
    ['Link Up', 'Concept ad · Director & Editor', 'https://drive.google.com/file/d/1a4V4d_4h2wnZQr_L06hG4IXSIuqxB73D/preview'],
    ['Loki Scene', 'VFX Artist', 'https://drive.google.com/file/d/1aPT54muu082z6rE7WtOWquBc_Beu2pUp/preview'],
    ['Multiverse Madness', 'Behind the scenes · Videographer & Editor', 'https://drive.google.com/file/d/1xwTjE0sbeHri7l5lxcORMn30emP0M6Zs/preview'],
    ['Featured showreel', 'Motion graphics to 2024', 'https://www.youtube.com/embed/xU7i4-z8nug?autoplay=1&rel=0']
  ];

  var ICON = {
    page: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
    jump: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>',
    mail: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22 6 12 13 2 6"/></svg>',
    link: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>',
    doc: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
    play: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>'
  };

  var CMD = {
    root: null, items: [], shown: [], sel: 0, lastFocus: null,

    /* On the home page the section links scroll; elsewhere they navigate. */
    data: function () {
      var home = !!document.getElementById('site');
      var list = [];

      PROJECTS.forEach(function (p) {
        list.push({ g: 'Projects', label: p[0], sub: p[1], thumb: p[3], run: function () { location.href = p[2]; } });
      });

      CATEGORIES.forEach(function (c) {
        list.push({ g: 'Browse by category', label: c[0], sub: c[1], thumb: c[3], run: function () { location.href = c[2]; } });
      });

      FILMS.forEach(function (v) {
        list.push({
          g: 'Film & video', label: v[0], sub: v[1], icon: ICON.play,
          run: function () { VID.open(v[2], v[0]); }
        });
      });

      var secs = [['Work', 'work'], ['Browse by category', 'browse'], ['Motion', 'motion'], ['3D & CGI', 'threed'], ['About', 'about'], ['Contact', 'contact']];
      secs.forEach(function (s) {
        list.push({
          g: 'Go to', label: s[0], sub: home ? 'Jump to section' : 'Back to home', icon: ICON.jump,
          run: function () {
            if (home) {
              var elx = document.getElementById(s[1]);
              if (elx) scrollToY(topOf(elx));
            } else location.href = 'Portfolio.dc.html#' + s[1];
          }
        });
      });
      list.push({ g: 'Go to', label: 'All motion & video', sub: 'Motion page', icon: ICON.page, run: function () { location.href = 'Motion.dc.html'; } });
      list.push({ g: 'Go to', label: '3D studies', sub: 'Personal Blender work', icon: ICON.page, run: function () { location.href = '3D-Studies.dc.html'; } });

      list.push({ g: 'Contact', label: 'Email Mohamed', sub: 'aashiqazwar@gmail.com', icon: ICON.mail, run: function () { location.href = 'mailto:aashiqazwar@gmail.com'; } });
      list.push({ g: 'Contact', label: 'Copy email address', sub: 'aashiqazwar@gmail.com', icon: ICON.mail, run: function () { copy('aashiqazwar@gmail.com'); } });
      list.push({ g: 'Contact', label: 'WhatsApp', sub: 'wa.me/94702313329', icon: ICON.link, run: function () { window.open('https://wa.me/94702313329', '_blank', 'noopener'); } });
      list.push({ g: 'Contact', label: 'Download CV', sub: 'PDF', icon: ICON.doc, run: function () { window.open('assets_web/brand/resume.pdf', '_blank', 'noopener'); } });
      list.push({ g: 'Elsewhere', label: 'Behance', sub: 'behance.net/aashxqarts', icon: ICON.link, run: function () { window.open('https://www.behance.net/aashxqarts', '_blank', 'noopener'); } });
      list.push({ g: 'Elsewhere', label: 'ArtStation', sub: 'Full 3D archive · artstation.com/aashxq', icon: ICON.link, run: function () { window.open('https://www.artstation.com/aashxq', '_blank', 'noopener'); } });
      list.push({ g: 'Elsewhere', label: 'LinkedIn', sub: 'linkedin.com/in/mohamedaashxq', icon: ICON.link, run: function () { window.open('https://linkedin.com/in/mohamedaashxq', '_blank', 'noopener'); } });
      return list;
    },

    build: function () {
      if (this.root) return;
      var r = el('div', { id: 'e-cmd', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Command palette' });
      r.innerHTML =
        '<div class="e-cmd-box">' +
          '<div class="e-cmd-head">' +
            '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><line x1="20" y1="20" x2="16.7" y2="16.7"/></svg>' +
            '<input type="text" placeholder="Search projects, sections, links…" aria-label="Search" autocomplete="off" spellcheck="false">' +
            '<span class="e-cmd-esc">ESC</span>' +
          '</div>' +
          '<div class="e-cmd-list" role="listbox"></div>' +
          '<div class="e-cmd-foot"><span><kbd>↑</kbd><kbd>↓</kbd>navigate</span><span><kbd>↵</kbd>open</span><span><kbd>esc</kbd>close</span></div>' +
        '</div>';
      document.body.appendChild(r);
      this.root = r;

      var self = this;
      var input = $('input', r);
      input.addEventListener('input', function () { self.filter(input.value); });
      r.addEventListener('click', function (e) { if (e.target === r) self.close(); });
      r.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { e.preventDefault(); self.close(); }
        else if (e.key === 'ArrowDown') { e.preventDefault(); self.move(1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); self.move(-1); }
        else if (e.key === 'Enter') { e.preventDefault(); self.run(); }
        else if (e.key === 'Tab') { e.preventDefault(); }
      });
    },

    open: function () {
      this.build();
      this.items = this.data();
      this.lastFocus = document.activeElement;
      this.root.classList.add('open');
      void this.root.offsetWidth;
      this.root.classList.add('shown');
      var input = $('input', this.root);
      input.value = '';
      this.filter('');
      input.focus();
    },

    close: function () {
      if (!this.root) return;
      var r = this.root;
      r.classList.remove('shown');
      setTimeout(function () { r.classList.remove('open'); }, 220);
      if (this.lastFocus && this.lastFocus.focus) this.lastFocus.focus();
    },

    isOpen: function () { return this.root && this.root.classList.contains('open'); },

    /* subsequence match — "hbc" finds "HiWash Brand Collateral" */
    score: function (hay, needle) {
      if (!needle) return 1;
      hay = hay.toLowerCase(); needle = needle.toLowerCase();
      if (hay.indexOf(needle) > -1) return 100 - hay.indexOf(needle);
      var i = 0;
      for (var c = 0; c < hay.length && i < needle.length; c++) if (hay[c] === needle[i]) i++;
      return i === needle.length ? 1 : 0;
    },

    filter: function (q) {
      var self = this;
      this.shown = this.items
        .map(function (it) { return { it: it, s: Math.max(self.score(it.label, q), self.score(it.sub || '', q) * 0.6) }; })
        .filter(function (x) { return x.s > 0; })
        .sort(function (a, b) { return b.s - a.s; })
        .map(function (x) { return x.it; });
      this.sel = 0;
      this.paint();
    },

    paint: function () {
      var list = $('.e-cmd-list', this.root);
      list.innerHTML = '';
      if (!this.shown.length) {
        list.appendChild(el('div', { class: 'e-cmd-empty' }, 'Nothing matches that.'));
        return;
      }
      var self = this, lastG = null;
      this.shown.forEach(function (it, n) {
        if (it.g !== lastG) { list.appendChild(el('div', { class: 'e-cmd-group' }, it.g)); lastG = it.g; }
        var b = el('button', { class: 'e-cmd-item', type: 'button', role: 'option', 'aria-selected': n === self.sel ? 'true' : 'false' },
          '<span class="e-cmd-ico">' + (it.thumb ? '<img src="' + it.thumb + '" alt="">' : (it.icon || ICON.page)) + '</span>' +
          '<span class="e-cmd-txt">' + it.label + '<span class="e-cmd-sub">' + (it.sub || '') + '</span></span>' +
          '<span class="e-cmd-go">↵</span>');
        b.addEventListener('click', function () { self.sel = n; self.run(); });
        b.addEventListener('mousemove', function () {
          if (self.sel === n) return;
          self.sel = n;
          $$('.e-cmd-item', list).forEach(function (x, k) { x.setAttribute('aria-selected', k === n ? 'true' : 'false'); });
        });
        list.appendChild(b);
      });
    },

    move: function (d) {
      if (!this.shown.length) return;
      this.sel = (this.sel + d + this.shown.length) % this.shown.length;
      var items = $$('.e-cmd-item', this.root);
      items.forEach(function (x, k) { x.setAttribute('aria-selected', k === this.sel ? 'true' : 'false'); }, this);
      if (items[this.sel]) items[this.sel].scrollIntoView({ block: 'nearest' });
    },

    run: function () {
      var it = this.shown[this.sel];
      if (!it) return;
      this.close();
      setTimeout(function () { it.run(); }, 60);
    }
  };

  function commandPalette() {
    var btn = el('button', { id: 'e-cmd-btn', type: 'button', 'aria-label': 'Open search (Control or Command + K)' },
      '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><line x1="20" y1="20" x2="16.7" y2="16.7"/></svg>' +
      '<span>Search</span><kbd>' + (/Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl') + ' K</kbd>');
    document.body.appendChild(btn);
    btn.addEventListener('click', function () { CMD.open(); });

    document.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        CMD.isOpen() ? CMD.close() : CMD.open();
        return;
      }
      // "/" opens search, as long as the visitor isn't typing into something
      if (e.key === '/' && !CMD.isOpen() && !LB.isOpen() &&
          !/^(INPUT|TEXTAREA)$/.test((document.activeElement || {}).tagName)) {
        e.preventDefault();
        CMD.open();
      }
    });
  }

  /* =========================================================
     7b. VIDEO MODAL
     The film cards carry data-video (a YouTube or Drive embed URL).
     Keeping playback here means the markup stays static and the
     component runtime's state machine is left alone.
     ========================================================= */
  var VID = {
    root: null, lastFocus: null,

    build: function () {
      if (this.root) return;
      var r = el('div', { id: 'e-vid', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Video player' });
      r.innerHTML =
        '<div class="e-vid-inner">' +
          '<div class="e-vid-bar">' +
            '<span class="e-vid-title"></span>' +
            '<button class="e-btn e-vid-close" type="button" aria-label="Close video (Esc)">' +
              '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
            '</button>' +
          '</div>' +
          '<div class="e-vid-frame"></div>' +
        '</div>';
      document.body.appendChild(r);
      this.root = r;
      var self = this;
      $('.e-vid-close', r).addEventListener('click', function () { self.close(); });
      r.addEventListener('click', function (e) { if (e.target === r) self.close(); });
    },

    open: function (src, title) {
      this.build();
      this.lastFocus = document.activeElement;
      $('.e-vid-title', this.root).textContent = title || '';
      $('.e-vid-frame', this.root).innerHTML =
        '<iframe src="' + src + '" title="' + (title || 'Video') + '" allow="autoplay; fullscreen; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
      this.root.classList.add('open');
      document.body.style.overflow = 'hidden';
      void this.root.offsetWidth;
      this.root.classList.add('shown');
      $('.e-vid-close', this.root).focus();
    },

    close: function () {
      if (!this.root) return;
      var r = this.root;
      r.classList.remove('shown');
      document.body.style.overflow = '';
      // drop the iframe so audio actually stops
      setTimeout(function () { r.classList.remove('open'); $('.e-vid-frame', r).innerHTML = ''; }, 260);
      if (this.lastFocus && this.lastFocus.focus) this.lastFocus.focus();
    },

    isOpen: function () { return this.root && this.root.classList.contains('open'); }
  };

  function filmCards() {
    document.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-video]');
      if (!b) return;
      e.preventDefault();
      VID.open(b.getAttribute('data-video'), b.getAttribute('data-vtitle') || '');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && VID.isOpen()) { e.preventDefault(); VID.close(); }
    });
  }

  /* =========================================================
     8. COPY TO CLIPBOARD + TOAST
     ========================================================= */
  function toast(msg) {
    var t = document.getElementById('e-toast');
    if (!t) { t = el('div', { id: 'e-toast', role: 'status', 'aria-live': 'polite' }); document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._h);
    t._h = setTimeout(function () { t.classList.remove('show'); }, 2000);
  }

  function copy(text) {
    var done = function () { toast('Copied  ·  ' + text); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { fallback(); });
    } else fallback();
    function fallback() {
      var ta = el('textarea'); ta.value = text;
      ta.style.cssText = 'position:fixed;left:-9999px';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { toast('Press Ctrl+C to copy'); }
      ta.remove();
    }
  }

  /* Put a copy button next to the big mailto link on the contact block. */
  function copyEmail() {
    var link = $('a[href^="mailto:"]');
    if (!link || link.parentElement.querySelector('.e-copy')) return;
    var addr = link.getAttribute('href').replace('mailto:', '');
    var b = el('button', { class: 'e-copy', type: 'button', 'aria-label': 'Copy email address to clipboard' },
      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Copy');
    b.addEventListener('click', function (e) { e.preventDefault(); copy(addr); });
    link.insertAdjacentElement('afterend', b);
  }

  /* =========================================================
     9. GALLERY GROUP JUMP BAR
     Only earns its place when a case study has several groups.
     ========================================================= */
  function groupBar() {
    if (document.getElementById('e-groups')) return;
    // a gallery group is a block that holds both a heading and a figure grid
    var blocks = $$('section > div').filter(function (d) { return $('h3', d) && $('figure', d); });
    if (blocks.length < 2) return;

    var bar = el('div', { id: 'e-groups', role: 'navigation', 'aria-label': 'Jump to gallery section' });
    blocks.forEach(function (b, n) {
      var h = $('h3', b);
      var count = $$('figure', b).length;
      if (!b.id) b.id = 'e-grp-' + n;
      var btn = el('button', { type: 'button', 'aria-current': n === 0 ? 'true' : 'false', 'data-target': b.id },
        h.textContent.trim() + '<b>' + count + '</b>');
      btn.addEventListener('click', function () {
        scrollToY(topOf(b, bar.getBoundingClientRect().height + 4));
      });
      bar.appendChild(btn);
    });

    var host = blocks[0].closest('section');
    host.parentElement.insertBefore(bar, host);

    // keep the bar's active pill in sync with scroll position
    var btns = $$('button', bar);
    var tick = false;
    window.addEventListener('scroll', function () {
      if (tick) return;
      tick = true;
      requestAnimationFrame(function () {
        var mid = window.innerHeight * 0.35, best = 0;
        blocks.forEach(function (b, n) { if (b.getBoundingClientRect().top <= mid) best = n; });
        btns.forEach(function (x, k) { x.setAttribute('aria-current', k === best ? 'true' : 'false'); });
        scrollXInto(bar, btns[best]);
        tick = false;
      });
    }, { passive: true });
  }

  /* =========================================================
     9b. DEEP LINK TO A GALLERY GROUP
     The home page's 3D cards link to "<page>#g=Al Maha Island Station".
     Groups are rendered by the runtime, so wait until the matching
     heading exists, then scroll to it and flash it once.
     ========================================================= */
  function groupDeepLink() {
    if (groupDeepLink._done) return;
    var hash = decodeURIComponent(location.hash || '');
    if (hash.indexOf('#g=') !== 0) { groupDeepLink._done = true; return; }
    var want = hash.slice(3).trim().toLowerCase();

    /* Re-query every time: the component runtime replaces these nodes on
       re-render, and a captured reference goes stale (its rect reads 0). */
    function findBlock() {
      return $$('section > div').filter(function (d) {
        var h = $('h3', d);
        return h && $('figure', d) && h.textContent.trim().toLowerCase() === want;
      })[0];
    }
    if (!findBlock()) return;   // not rendered yet — enrich() will call again

    groupDeepLink._done = true;

    /* Scrolling immediately overshoots: the document viewer is still mounting,
       transition frames are still collapsing and lazy images are still
       arriving, so the page height keeps moving. Wait for it to hold steady,
       then aim once and correct only if it drifts again. */
    var lastH = -1, stable = 0, waited = 0;
    (function settle() {
      var h = document.documentElement.scrollHeight;
      stable = (h === lastH) ? stable + 1 : 0;
      lastH = h;
      waited += 200;

      if (stable < 3 && waited < 6000) { setTimeout(settle, 200); return; }

      var bar = document.getElementById('e-groups');
      var navH = (document.querySelector('nav') || { getBoundingClientRect: function () { return { height: 63 }; } })
        .getBoundingClientRect().height;
      var want = navH + 8 + (bar ? bar.getBoundingClientRect().height + 4 : 0);

      var passes = 0;
      (function aim() {
        var block = findBlock();
        if (!block) return;
        var d = block.getBoundingClientRect().top - want;
        if (Math.abs(d) > 8 && passes < 6) {
          window.scrollTo({ top: Math.max(0, window.scrollY + d), behavior: 'instant' });
          passes++;
          setTimeout(aim, 140);
          return;
        }
        block.classList.add('e-group-cue');
        setTimeout(function () { block.classList.remove('e-group-cue'); }, 1800);
      })();
    })();
  }

  /* Deep-link straight to any element by id (e.g. "#company-profile", a
     Heyzine embed, or "#group-print-design", a gallery group's own wrapper).
     Same problem as groupDeepLink() and the same fix: nothing exists in the
     DOM at the browser's one native anchor-scroll attempt — this whole page
     is client-rendered, so even markup that looks "static" in the source
     isn't actually there until the component runtime mounts it. A plain
     href="#hash" link can never rely on the browser to get this right here. */
  function idDeepLink() {
    if (idDeepLink._done) return;
    var hash = decodeURIComponent(location.hash || '');
    if (!hash || hash.indexOf('#') !== 0 || hash.indexOf('#g=') === 0) { idDeepLink._done = true; return; }
    var id = hash.slice(1).trim();
    if (!id || !document.getElementById(id)) return; // not rendered yet — enrich() will call again

    idDeepLink._done = true;

    var lastH = -1, stable = 0, waited = 0;
    (function settle() {
      var h = document.documentElement.scrollHeight;
      stable = (h === lastH) ? stable + 1 : 0;
      lastH = h;
      waited += 200;
      if (stable < 3 && waited < 6000) { setTimeout(settle, 200); return; }

      var nav = document.querySelector('nav');
      var navH = nav ? nav.getBoundingClientRect().height : 63;

      var passes = 0;
      (function aim() {
        var el = document.getElementById(id);
        if (!el) return;
        var d = el.getBoundingClientRect().top - (navH + 8);
        if (Math.abs(d) > 8 && passes < 6) {
          window.scrollTo({ top: Math.max(0, window.scrollY + d), behavior: 'instant' });
          passes++;
          setTimeout(aim, 140);
          return;
        }
        el.classList.add('e-group-cue');
        setTimeout(function () { el.classList.remove('e-group-cue'); }, 1800);
      })();
    })();
  }

  /* =========================================================
     10. NAV SCROLL-SPY (home only)
     ========================================================= */
  var SPY_IDS = ['work', 'motion', 'threed', 'about', 'contact'];
  var SPY_LABEL = { work: 'work', motion: 'motion', '3d': 'threed', about: 'about', contact: 'contact' };

  function spyPaint() {
    // query fresh every time — the runtime swaps these nodes on re-render
    var links = $$('nav [data-spy]');
    if (!links.length) return;
    var mid = window.innerHeight * 0.4, active = null;
    SPY_IDS.forEach(function (id) {
      var s = document.getElementById(id);
      if (s && s.getBoundingClientRect().top <= mid) active = id;
    });
    links.forEach(function (l) { l.classList.toggle('e-active', l.getAttribute('data-spy') === active); });
  }

  function scrollSpy() {
    // Tagging runs on every enrich() because the component runtime replaces
    // the nav nodes on re-render; the scroll listener binds only once.
    var links = $$('nav [role="button"]').filter(function (b) {
      return !!SPY_LABEL[b.textContent.trim().toLowerCase()];
    });
    if (!links.length) return;
    links.forEach(function (l) { l.setAttribute('data-spy', SPY_LABEL[l.textContent.trim().toLowerCase()]); });

    if (!scrollSpy._bound) {
      scrollSpy._bound = true;
      var tick = false;
      window.addEventListener('scroll', function () {
        if (tick) return;
        tick = true;
        requestAnimationFrame(function () { spyPaint(); tick = false; });
      }, { passive: true });
    }
    spyPaint();
  }

  /* =========================================================
     11. MAGNETIC CTAs — buttons lean toward the cursor
     ========================================================= */
  function magnetic() {
    if (!FINE || REDUCED) return;
    var sel = 'nav a[data-resume], header [role="button"], #e-cmd-btn, #e-top';
    $$(sel).forEach(function (b) {
      if (b.dataset.mag) return;
      b.dataset.mag = '1';
      b.setAttribute('data-mag', '');
      var raf = null;
      b.addEventListener('mousemove', function (e) {
        var r = b.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) * 0.28;
        var dy = (e.clientY - (r.top + r.height / 2)) * 0.34;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () { b.style.transform = 'translate(' + dx + 'px,' + dy + 'px)'; });
      });
      b.addEventListener('mouseleave', function () {
        if (raf) cancelAnimationFrame(raf);
        b.style.transition = 'transform .45s cubic-bezier(.2,.8,.2,1)';
        b.style.transform = '';
        setTimeout(function () { b.style.transition = ''; }, 460);
      });
    });
  }

  /* =========================================================
     12. NATIVE ON PHONES
     ========================================================= */

  /* The component runtime compiles every style-hover attribute into an
     ungated ".scpN:hover" rule. On touch that hover sticks after a tap.
     Re-home each one inside a capability query, in place, so cascade order
     is unchanged. enhance.css is gated at source, so only inline sheets are
     touched here. */
  var HOVER_Q = '(hover: hover) and (pointer: fine)';
  function gateHover() {
    for (var s = 0; s < document.styleSheets.length; s++) {
      var ss = document.styleSheets[s], rules;
      if (ss.href) continue;
      try { rules = ss.cssRules; } catch (e) { continue; }
      for (var i = rules.length - 1; i >= 0; i--) {
        var r = rules[i];
        if (r.type !== 1 || r.selectorText.indexOf(':hover') < 0) continue;
        var text = r.cssText;
        try {
          ss.deleteRule(i);
          ss.insertRule('@media ' + HOVER_Q + ' { ' + text + ' }', i);
        } catch (e) { /* leave the rule as it was */ }
      }
    }
  }

  /* One row on phones: logo, CV, menu. The links stay the page's own
     elements (their handlers intact); CSS re-lays them as a sheet. */
  function siteNav() {
    var resume = $('nav > div > [data-resume]');
    if (!resume) return null;
    return { nav: resume.parentElement.parentElement, links: resume.parentElement };
  }

  function mobileNav() {
    var sn = siteNav();
    if (!sn) return;
    sn.links.id = 'e-navlinks';

    var btn = $('#e-menu-btn');
    if (!btn) {
      btn = el('button', { id: 'e-menu-btn', type: 'button', 'aria-label': 'Menu',
        'aria-expanded': 'false', 'aria-controls': 'e-navlinks' },
        '<svg class="e-bars" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 8h16M4 16h16"/></svg>' +
        '<svg class="e-x" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>');
      document.body.appendChild(btn);

      var root = document.documentElement;
      var close = function (refocus) {
        if (!root.classList.contains('e-menu-open')) return;
        root.classList.remove('e-menu-open');
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-label', 'Menu');
        if (refocus) btn.focus();
      };
      btn.addEventListener('click', function () {
        if (root.classList.contains('e-menu-open')) { close(false); return; }
        var cur = siteNav();
        if (cur) root.style.setProperty('--e-nav-h', cur.nav.getBoundingClientRect().height + 'px');
        root.classList.add('e-menu-open');
        btn.setAttribute('aria-expanded', 'true');
        btn.setAttribute('aria-label', 'Close menu');
        var first = cur && cur.links.firstElementChild;
        if (first && first.focus) first.focus();
      });
      // any pick closes the sheet first, so a same-page scroll isn't blocked
      document.addEventListener('click', function (e) {
        var cur = siteNav();
        if (cur && cur.links.contains(e.target)) close(false);
      }, true);
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(true); });
      window.matchMedia('(max-width: 720px)').addEventListener('change', function (m) { if (!m.matches) close(false); });
    }
  }

  /* Mark the current page in the nav. The home page has its own scroll-spy;
     every case study and category page belongs to Work. */
  function navCurrent() {
    var sn = siteNav();
    if (!sn) return;
    var page = decodeURIComponent(location.pathname.split('/').pop() || '');
    if (!page || page === 'Portfolio.dc.html' || page === 'index.html') return;
    var links = $$('a[href]', sn.links).filter(function (a) { return !a.hasAttribute('data-resume'); });
    var hit = links.filter(function (a) { return a.getAttribute('href').split('#')[0] === page; })[0] ||
              links.filter(function (a) { return /#work$/.test(a.getAttribute('href')); })[0];
    links.forEach(function (a) {
      if (a === hit) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  /* Scroll reveals start hidden. If the page's observer never fires for an
     element — a tall block that can't reach its threshold, an observer that
     was suspended — the content would stay invisible. Anything already on or
     above the screen is shown; with reduced motion, everything is shown at
     once, with no movement. */
  function revealSafety() {
    var pending = $$('[data-reveal]').filter(function (x) { return x.style.opacity === '0'; });
    if (!pending.length) return;
    var edge = window.innerHeight * 0.96;
    pending.forEach(function (x) {
      if (!REDUCED && x.getBoundingClientRect().top > edge) return;
      if (REDUCED) x.style.transition = 'none';
      else if (!x.style.transition) x.style.transition = 'opacity .8s ease, transform .9s cubic-bezier(.2,.8,.2,1)';
      x.style.opacity = '1';
      x.style.transform = 'none';
    });
    if (!revealSafety._bound) {
      revealSafety._bound = true;
      var tick = false;
      window.addEventListener('scroll', function () {
        if (tick) return;
        tick = true;
        requestAnimationFrame(function () { tick = false; revealSafety(); });
      }, { passive: true });
      window.addEventListener('load', function () { setTimeout(revealSafety, 600); });
    }
  }

  /* =========================================================
     BOOT — the component runtime renders asynchronously, so
     re-run the DOM-dependent parts whenever the tree changes.
     ========================================================= */
  function enrich() {
    reserveAll();
    videoCells();    // swap .mp4 "images" for real players before anything else
    documents();
    transitions();   // must precede tagFigures so collapsed frames aren't numbered
    tagFigures();
    landmarks();
    copyEmail();
    groupBar();
    magnetic();
    scrollSpy();
    groupDeepLink();
    idDeepLink();
    gateHover();
    mobileNav();
    navCurrent();
    revealSafety();
  }

  function boot() {
    preloader();
    grain();
    cursor();
    backToTop();
    bindLightbox();
    commandPalette();
    filmCards();
    enrich();

    var pending = null;
    new MutationObserver(function () {
      clearTimeout(pending);
      pending = setTimeout(enrich, 120);
    }).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
