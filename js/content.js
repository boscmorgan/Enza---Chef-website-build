/* =========================================================
   ENZA E BASTA — CMS content loader
   Fetches content/site.json and content/courses.json (edited via
   /admin) and renders them into the page. Falls back to the static
   markup already in index.html if a fetch fails.
   ========================================================= */
(function () {
  'use strict';

  function currentLang() {
    return document.body.getAttribute('data-lang') || 'it';
  }

  function pick(obj, key) {
    var lang = currentLang();
    return (obj && obj[key + '_' + lang]) || (obj && obj[key + '_it']) || '';
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function fetchJson(path) {
    return fetch(path, { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }

  function locale() {
    return currentLang() === 'en' ? 'en-GB' : 'it-IT';
  }

  function shortDate(dateStr) {
    var d = new Date(dateStr);
    if (isNaN(d)) return '';
    return new Intl.DateTimeFormat(locale(), { day: 'numeric', month: 'short' }).format(d);
  }

  function longDate(dateStr) {
    var d = new Date(dateStr);
    if (isNaN(d)) return '';
    return new Intl.DateTimeFormat(locale(), {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    }).format(d);
  }

  function pinSvg() {
    return '<svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">' +
      '<path d="M12 21s7-5.6 7-12a7 7 0 10-14 0c0 6.4 7 12 7 12z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/>' +
      '<circle cx="12" cy="9" r="2.2" fill="none" stroke="currentColor" stroke-width="2.4"/></svg>';
  }

  var state = { site: null, courses: null };

  function renderSite() {
    var s = state.site;
    if (!s) return;
    var map = {
      heroPhotoImg: s.hero_image,
      chiSonoPhotoImg: s.chi_sono_image,
      corsiPhotoImg: s.corsi_image
    };
    Object.keys(map).forEach(function (id) {
      var src = map[id];
      if (!src) return;
      var img = document.getElementById(id);
      if (img) img.src = src;
    });
  }

  /* ---------- overlay (click on a tile) ---------- */
  var modal = document.getElementById('corsoModal');
  var modalImg = document.getElementById('corsoModalImg');
  var modalTitle = document.getElementById('corsoModalTitle');
  var modalMeta = document.getElementById('corsoModalMeta');
  var modalDesc = document.getElementById('corsoModalDesc');
  var modalClose = document.getElementById('corsoModalClose');
  var modalBackdrop = document.getElementById('corsoModalBackdrop');
  var lastFocused = null;

  function openModal(data) {
    if (!modal) return;
    modalTitle.textContent = data.title || '';
    modalDesc.textContent = data.desc || '';
    var metaParts = [];
    if (data.date) metaParts.push(longDate(data.date));
    if (data.location) metaParts.push(data.location);
    if (data.price) metaParts.push(data.price);
    modalMeta.textContent = metaParts.join(' · ');
    if (data.image) {
      modalImg.src = data.image;
      modalImg.alt = data.title || '';
      modalImg.hidden = false;
    } else {
      modalImg.hidden = true;
    }
    lastFocused = document.activeElement;
    modal.hidden = false;
    document.body.classList.add('modal-open');
    modalClose.focus();
  }

  function closeModal() {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    document.body.classList.remove('modal-open');
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });

  /* ---------- carousel ---------- */
  var track = document.getElementById('corsiCarousel');
  var prevBtn = document.getElementById('corsiPrev');
  var nextBtn = document.getElementById('corsiNext');
  var hasSetInitialView = false;

  function updateArrows() {
    if (!track || !prevBtn || !nextBtn) return;
    var maxScroll = track.scrollWidth - track.clientWidth;
    prevBtn.disabled = track.scrollLeft <= 4;
    nextBtn.disabled = track.scrollLeft >= maxScroll - 4;
  }

  function scrollByOneTile(direction) {
    if (!track) return;
    var tile = track.querySelector('.corso-tile');
    var step = tile ? tile.getBoundingClientRect().width + 24 : track.clientWidth;
    track.scrollBy({ left: direction * step, behavior: 'smooth' });
  }

  if (prevBtn) prevBtn.addEventListener('click', function () { scrollByOneTile(-1); });
  if (nextBtn) nextBtn.addEventListener('click', function () { scrollByOneTile(1); });

  if (track) {
    track.addEventListener('scroll', updateArrows, { passive: true });
    track.addEventListener('click', function (e) {
      var tile = e.target.closest('.corso-tile');
      if (!tile) return;
      openModal({
        title: tile.getAttribute('data-full-title'),
        desc: tile.getAttribute('data-full-desc'),
        image: tile.getAttribute('data-full-image'),
        date: tile.getAttribute('data-full-date'),
        location: tile.getAttribute('data-full-location'),
        price: tile.getAttribute('data-full-price')
      });
    });
    track.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var tile = e.target.closest('.corso-tile');
      if (!tile) return;
      e.preventDefault();
      tile.click();
    });
  }

  function tileHtml(c) {
    var title = pick(c, 'title');
    var desc = pick(c, 'description');
    var isPast = new Date(c.date) < new Date();
    var img = c.image
      ? '<img src="' + escapeHtml(c.image) + '" alt="' + escapeHtml(title) + '" loading="lazy" />'
      : '';
    var tag = shortDate(c.date)
      ? '<span class="corso-tile-tag">' + escapeHtml(shortDate(c.date)) + '</span>'
      : '';
    var ribbon = isPast
      ? '<span class="corso-tile-ribbon">' + (currentLang() === 'en' ? 'Past' : 'Passato') + '</span>'
      : '';
    var metaLine = c.location
      ? '<p class="corso-tile-meta">' + pinSvg() + '<span>' + escapeHtml(c.location) + '</span></p>'
      : '';
    return '<article class="corso-tile' + (isPast ? ' corso-tile--past' : '') + '" tabindex="0" role="button" aria-haspopup="dialog" ' +
      'data-full-title="' + escapeHtml(title) + '" data-full-desc="' + escapeHtml(desc) + '" ' +
      'data-full-image="' + escapeHtml(c.image || '') + '" data-full-date="' + escapeHtml(c.date || '') + '" ' +
      'data-full-location="' + escapeHtml(c.location || '') + '" data-full-price="' + escapeHtml(c.price || '') + '">' +
      img + '<div class="corso-tile-scrim"></div>' + ribbon + tag +
      '<div class="corso-tile-body"><h3>' + escapeHtml(title) + '</h3><p>' + escapeHtml(desc) + '</p>' + metaLine + '</div>' +
      '</article>';
  }

  function renderCourses() {
    var section = document.getElementById('corsi-calendario');
    if (!section || !track) return;
    var all = ((state.courses && state.courses.courses) || []).slice();
    if (!all.length) { section.hidden = true; return; }

    var now = new Date();
    var upcoming = all.filter(function (c) { return new Date(c.date) >= now; })
      .sort(function (a, b) { return new Date(a.date) - new Date(b.date); });
    var past = all.filter(function (c) { return new Date(c.date) < now; })
      .sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
    var ordered = upcoming.concat(past);

    var preservedScrollLeft = hasSetInitialView ? track.scrollLeft : null;

    track.innerHTML = ordered.map(tileHtml).join('');
    section.hidden = false;

    var needsArrows = ordered.length > 3;
    if (prevBtn) prevBtn.hidden = !needsArrows;
    if (nextBtn) nextBtn.hidden = !needsArrows;

    // Upcoming classes (soonest first) sit at the far left by construction,
    // so the default view is simply the start of the track.
    track.scrollLeft = preservedScrollLeft !== null ? preservedScrollLeft : 0;
    hasSetInitialView = true;
    updateArrows();
  }

  fetchJson('content/site.json').then(function (d) { state.site = d; renderSite(); });
  fetchJson('content/courses.json').then(function (d) { state.courses = d; renderCourses(); });

  function applyArrowLabels() {
    var lang = currentLang();
    document.querySelectorAll('.carousel-arrow').forEach(function (btn) {
      var label = btn.getAttribute('data-' + lang + '-label');
      if (label) btn.setAttribute('aria-label', label);
    });
    if (modalClose) {
      var closeLabel = modalClose.getAttribute('data-' + lang + '-label');
      if (closeLabel) modalClose.setAttribute('aria-label', closeLabel);
    }
  }

  document.querySelectorAll('[data-set-lang]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      renderCourses();
      applyArrowLabels();
    });
  });
  applyArrowLabels();
})();
