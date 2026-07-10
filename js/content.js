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

  /* ---------- overlay (click on a tile) ---------- */
  var modal = document.getElementById('corsoModal');
  var modalImg = document.getElementById('corsoModalImg');
  var modalTitle = document.getElementById('corsoModalTitle');
  var modalDesc = document.getElementById('corsoModalDesc');
  var modalClose = document.getElementById('corsoModalClose');
  var modalBackdrop = document.getElementById('corsoModalBackdrop');
  var lastFocused = null;

  function openModal(data) {
    if (!modal) return;
    modalTitle.textContent = data.title || '';
    modalDesc.textContent = data.desc || '';
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

  function tileHtml(title, text, image) {
    var img = image
      ? '<img src="' + escapeHtml(image) + '" alt="' + escapeHtml(title) + '" loading="lazy" />'
      : '';
    return img;
  }

  function bindTileInteractions(track) {
    track.addEventListener('click', function (e) {
      var tile = e.target.closest('.corso-tile');
      if (!tile) return;
      openModal({
        title: tile.getAttribute('data-full-title'),
        desc: tile.getAttribute('data-full-desc'),
        image: tile.getAttribute('data-full-image')
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

  /* ---------- carousel (shared by "prossimi" and "passati") ---------- */
  function makeCarousel(trackId, prevId, nextId) {
    var track = document.getElementById(trackId);
    var prevBtn = document.getElementById(prevId);
    var nextBtn = document.getElementById(nextId);
    if (!track) return null;

    function updateArrows() {
      if (!prevBtn || !nextBtn) return;
      var maxScroll = track.scrollWidth - track.clientWidth;
      prevBtn.disabled = track.scrollLeft <= 4;
      nextBtn.disabled = track.scrollLeft >= maxScroll - 4;
    }

    function scrollByOneTile(direction) {
      var tile = track.querySelector('.corso-tile');
      var step = tile ? tile.getBoundingClientRect().width + 24 : track.clientWidth;
      track.scrollBy({ left: direction * step, behavior: 'smooth' });
    }

    if (prevBtn) prevBtn.addEventListener('click', function () { scrollByOneTile(-1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { scrollByOneTile(1); });
    track.addEventListener('scroll', updateArrows, { passive: true });
    bindTileInteractions(track);

    return {
      render: function (list) {
        track.innerHTML = list.map(function (c) {
          var title = pick(c, 'title');
          var desc = pick(c, 'description');
          var meta = [c.schedule, c.price].filter(Boolean).join(' · ');
          var tag = meta ? '<span class="corso-tile-tag">' + escapeHtml(meta) + '</span>' : '';
          return '<article class="corso-tile" tabindex="0" role="button" aria-haspopup="dialog" ' +
            'data-full-title="' + escapeHtml(title) + '" data-full-desc="' + escapeHtml(desc) + '" data-full-image="' + escapeHtml(c.image || '') + '">' +
            tileHtml(title, desc, c.image) +
            '<div class="corso-tile-scrim"></div>' + tag +
            '<div class="corso-tile-body"><h3>' + escapeHtml(title) + '</h3><p>' + escapeHtml(desc) + '</p></div>' +
            '</article>';
        }).join('');

        var needsArrows = list.length > 3;
        if (prevBtn) prevBtn.hidden = !needsArrows;
        if (nextBtn) nextBtn.hidden = !needsArrows;
        track.scrollLeft = 0;
        updateArrows();
      },
      prevBtn: prevBtn,
      nextBtn: nextBtn
    };
  }

  var upcomingCarousel = makeCarousel('corsiUpcomingCarousel', 'corsiUpcomingPrev', 'corsiUpcomingNext');
  var pastCarousel = makeCarousel('corsiPastCarousel', 'corsiPastPrev', 'corsiPastNext');
  var upcomingGroup = document.getElementById('corsiUpcomingGroup');
  var pastGroup = document.getElementById('corsiPastGroup');

  function renderCourses() {
    var section = document.getElementById('corsi-calendario');
    if (!section) return;
    var all = (state.courses && state.courses.courses) || [];
    var upcoming = all.filter(function (c) { return c.type !== 'past'; });
    var past = all.filter(function (c) { return c.type === 'past'; });

    if (upcomingCarousel && upcomingGroup) {
      if (upcoming.length) { upcomingCarousel.render(upcoming); upcomingGroup.hidden = false; }
      else { upcomingGroup.hidden = true; }
    }
    if (pastCarousel && pastGroup) {
      if (past.length) { pastCarousel.render(past); pastGroup.hidden = false; }
      else { pastGroup.hidden = true; }
    }

    section.hidden = !(upcoming.length || past.length);
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
