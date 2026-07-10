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

  function cardHtml(title, text, image, metaLine) {
    var img = image
      ? '<div class="card-img"><img src="' + escapeHtml(image) + '" alt="' + escapeHtml(title) + '" loading="lazy" /></div>'
      : '';
    var meta = metaLine ? '<p>' + escapeHtml(metaLine) + '</p>' : '';
    return '<article class="card">' + img +
      '<div class="card-body"><h3>' + escapeHtml(title) + '</h3><p>' + escapeHtml(text) + '</p>' + meta + '</div>' +
      '</article>';
  }

  var prevBtn = document.getElementById('corsiPrev');
  var nextBtn = document.getElementById('corsiNext');
  var track = document.getElementById('corsiCarousel');

  function updateArrows() {
    if (!track || !prevBtn || !nextBtn) return;
    var maxScroll = track.scrollWidth - track.clientWidth;
    prevBtn.disabled = track.scrollLeft <= 4;
    nextBtn.disabled = track.scrollLeft >= maxScroll - 4;
  }

  function scrollByOneCard(direction) {
    if (!track) return;
    var card = track.querySelector('.card');
    var step = card ? card.getBoundingClientRect().width + 24 : track.clientWidth;
    track.scrollBy({ left: direction * step, behavior: 'smooth' });
  }

  function renderCourses() {
    var section = document.getElementById('corsi-passati');
    if (!section || !track) return;
    var courses = (state.courses && state.courses.courses) || [];
    if (!courses.length) { section.hidden = true; return; }

    track.innerHTML = courses.map(function (c) {
      var meta = [c.schedule, c.price].filter(Boolean).join(' · ');
      return cardHtml(pick(c, 'title'), pick(c, 'description'), c.image, meta);
    }).join('');

    section.hidden = false;
    var needsArrows = courses.length > 3;
    if (prevBtn) prevBtn.hidden = !needsArrows;
    if (nextBtn) nextBtn.hidden = !needsArrows;
    track.scrollLeft = 0;
    updateArrows();
  }

  if (prevBtn) prevBtn.addEventListener('click', function () { scrollByOneCard(-1); });
  if (nextBtn) nextBtn.addEventListener('click', function () { scrollByOneCard(1); });
  if (track) track.addEventListener('scroll', updateArrows, { passive: true });

  fetchJson('content/site.json').then(function (d) { state.site = d; renderSite(); });
  fetchJson('content/courses.json').then(function (d) { state.courses = d; renderCourses(); });

  function applyArrowLabels() {
    var lang = currentLang();
    [prevBtn, nextBtn].forEach(function (btn) {
      if (!btn) return;
      var label = btn.getAttribute('data-' + lang + '-label');
      if (label) btn.setAttribute('aria-label', label);
    });
  }

  document.querySelectorAll('[data-set-lang]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      renderCourses();
      applyArrowLabels();
    });
  });
  applyArrowLabels();
})();
