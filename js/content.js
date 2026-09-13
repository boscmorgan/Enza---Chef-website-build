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

  /* Image paths come from the CMS, so they're only as trustworthy as the
     GitHub account that wrote them. Anything but a plain relative path or an
     http(s)/data image is dropped: "javascript:..." in an src is script
     execution, and escapeHtml does nothing to stop it. */
  function safeImageUrl(value) {
    var s = String(value == null ? '' : value).trim();
    if (!s) return '';
    // Strip control characters browsers ignore when parsing a scheme.
    var probe = s.replace(/[\u0000-\u001F\u007F\s]/g, '').toLowerCase();
    if (/^(?:javascript|vbscript|file):/.test(probe)) return '';
    if (/^data:/.test(probe) && !/^data:image\//.test(probe)) return '';
    return s;
  }

  function fetchJson(path) {
    return fetch(path, { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }

  function locale() {
    return currentLang() === 'en' ? 'en-GB' : 'it-IT';
  }

  /* ---------- dates ----------
     The CMS stores a course date as plain Italian wall-clock time
     ("2026-09-05T16:30"). Handing that to new Date() reads it in the
     *visitor's* zone, so the same class would show at a different hour for
     someone browsing from London or New York. Resolve it against Rome
     instead. Older entries that still carry a Z or a numeric offset are
     already absolute instants, so they pass straight through. */
  var ROME = 'Europe/Rome';
  var NAIVE_DATE = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/;
  var romeParts = new Intl.DateTimeFormat('en-US', {
    timeZone: ROME, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  });

  // How far Rome sits from UTC at a given instant, in milliseconds.
  function romeOffsetMs(instantMs) {
    var p = {};
    romeParts.formatToParts(new Date(instantMs)).forEach(function (part) {
      if (part.type !== 'literal') p[part.type] = parseInt(part.value, 10);
    });
    // hour12:false renders midnight as 24 in some engines.
    return Date.UTC(p.year, p.month - 1, p.day, p.hour % 24, p.minute, p.second) - instantMs;
  }

  function parseCourseDate(value) {
    if (!value) return null;
    var m = NAIVE_DATE.exec(String(value).trim());
    if (!m) {
      var absolute = new Date(value);
      return isNaN(absolute) ? null : absolute;
    }
    var wall = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0));
    // Two passes, so a time sitting near a DST switch lands on the right side.
    var utc = wall - romeOffsetMs(wall);
    utc = wall - romeOffsetMs(utc);
    var d = new Date(utc);
    return isNaN(d) ? null : d;
  }

  // Midnight tonight in Rome: a class stays "upcoming" for the whole of its
  // own day rather than flipping to "past" the minute it starts.
  function startOfTodayInRome() {
    var ymd = new Intl.DateTimeFormat('en-CA', {
      timeZone: ROME, year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(new Date());
    return parseCourseDate(ymd + 'T00:00');
  }

  function shortDate(dateStr) {
    var d = parseCourseDate(dateStr);
    if (!d) return '';
    return new Intl.DateTimeFormat(locale(), { day: 'numeric', month: 'short', timeZone: ROME }).format(d);
  }

  function longDate(dateStr) {
    var d = parseCourseDate(dateStr);
    if (!d) return '';
    return new Intl.DateTimeFormat(locale(), {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: ROME
    }).format(d);
  }

  /* The CMS now stores the number on its own ("60") and the € is ours to add,
     so every card reads the same. Anything that isn't a bare number — a
     legacy "€60", or free text like "Gratis" — is left exactly as written. */
  function formatPrice(value) {
    var s = String(value == null ? '' : value).trim();
    if (!s) return '';
    return /^\d+([.,]\d{1,2})?$/.test(s) ? '€' + s : s;
  }

  function pinSvg() {
    return '<svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">' +
      '<path d="M12 21s7-5.6 7-12a7 7 0 10-14 0c0 6.4 7 12 7 12z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/>' +
      '<circle cx="12" cy="9" r="2.2" fill="none" stroke="currentColor" stroke-width="2.4"/></svg>';
  }

  var state = { site: null, courses: null, copy: null };

  /* ---------- editable copy (content/copy.json) ----------
     Each element tagged data-copy="section.key" gets its data-it /
     data-en attributes replaced from the JSON, so the IT/EN toggle in
     script.js keeps working on the updated strings. */
  function applyCopy() {
    var copy = state.copy;
    if (!copy) return;
    var lang = currentLang();
    document.querySelectorAll('[data-copy]').forEach(function (el) {
      var path = el.getAttribute('data-copy').split('.');
      var section = copy[path[0]];
      if (!section) return;
      var it = section[path[1] + '_it'];
      var en = section[path[1] + '_en'];
      if (typeof it !== 'string' || typeof en !== 'string' || !it) return;
      el.setAttribute('data-it', it);
      el.setAttribute('data-en', en || it);
      el.textContent = lang === 'en' && en ? en : it;
    });
    renderTimeline();
    // Course cards carry copy of their own (the "next up" badge), and copy.json
    // may land after courses.json — re-render so it isn't left on the fallback.
    // Only once the courses are actually in, or we'd flash the empty state.
    if (state.courses) renderCourses();
  }

  function renderTimeline() {
    var ol = document.getElementById('bioTimeline');
    var items = state.copy && state.copy.biografia && state.copy.biografia.timeline;
    if (!ol || !items || !items.length) return;
    var lang = currentLang();
    ol.innerHTML = items.map(function (step) {
      function span(tag, key, cls) {
        var it = step[key + '_it'] || '';
        var en = step[key + '_en'] || it;
        return '<' + tag + (cls ? ' class="' + cls + '"' : '') +
          ' data-it="' + escapeHtml(it) + '" data-en="' + escapeHtml(en) + '">' +
          escapeHtml(lang === 'en' ? en : it) + '</' + tag + '>';
      }
      return '<li>' + span('span', 'year', 'year') +
        '<div>' + span('h3', 'title') + span('p', 'text') + '</div></li>';
    }).join('');
    if (window.ENZA_reinitTimeline) window.ENZA_reinitTimeline();
  }

  function renderSite() {
    var s = state.site;
    if (!s) return;
    var map = {
      chiSonoPhotoImg: s.chi_sono_image,
      corsiPhotoImg: s.corsi_image,
      biografiaPhotoImg: s.biografia_image
    };
    Object.keys(map).forEach(function (id) {
      var src = map[id];
      if (!src) return;
      var safe = safeImageUrl(src);
      if (!safe) return;
      var img = document.getElementById(id);
      if (img) img.src = safe;
    });

    renderHeroPhoto(s.hero_photos);
    renderAlternatingPhoto('domicilioPhotoImg', s.domicilio_photos);
    renderAlternatingPhoto('aziendaliPhotoImg', s.aziendali_photos);
  }

  /* ---------- photos that alternate on each page load, list managed in the CMS ---------- */
  function renderHeroPhoto(photos) {
    var img = document.getElementById('heroPhotoImg');
    if (!img || !photos || !photos.length) return;
    var choice = photos[Math.floor(Math.random() * photos.length)];
    var heroSrc = safeImageUrl(choice.image);
    if (heroSrc) img.src = heroSrc;
    if (choice.alt_it) img.setAttribute('data-it-alt', choice.alt_it);
    if (choice.alt_en) {
      img.setAttribute('data-en-alt', choice.alt_en);
    } else if (choice.alt_it) {
      img.setAttribute('data-en-alt', choice.alt_it);
    }
    if (choice.alt_it || choice.alt_en) {
      img.alt = choice['alt_' + currentLang()] || choice.alt_it || choice.alt_en || img.alt || '';
    }
  }

  function renderAlternatingPhoto(id, photos) {
    var img = document.getElementById(id);
    if (!img || !photos || !photos.length) return;
    var src = safeImageUrl(photos[Math.floor(Math.random() * photos.length)]);
    if (src) img.src = src;
  }

  /* ---------- overlay (click on a tile) ---------- */
  var modal = document.getElementById('corsoModal');
  var modalImg = document.getElementById('corsoModalImg');
  var modalTitle = document.getElementById('corsoModalTitle');
  var modalMeta = document.getElementById('corsoModalMeta');
  var modalDesc = document.getElementById('corsoModalDesc');
  var modalClose = document.getElementById('corsoModalClose');
  var modalBackdrop = document.getElementById('corsoModalBackdrop');
  var modalCta = document.getElementById('corsoModalCta');
  var lastFocused = null;

  function openModal(data) {
    if (!modal) return;
    if (modalTitle) modalTitle.textContent = data.title || '';
    if (modalDesc) modalDesc.textContent = data.desc || '';
    var metaParts = [];
    if (data.date) metaParts.push(longDate(data.date));
    if (data.location) metaParts.push(data.location);
    if (formatPrice(data.price)) metaParts.push(formatPrice(data.price));
    if (modalMeta) modalMeta.textContent = metaParts.join(' · ');
    if (modalCta) modalCta.hidden = !!data.isPast;
    if (modalImg) {
      var modalSrc = safeImageUrl(data.image);
      if (modalSrc) {
        modalImg.src = modalSrc;
        modalImg.alt = data.title || '';
        modalImg.hidden = false;
      } else {
        modalImg.hidden = true;
        modalImg.src = '';
        modalImg.alt = '';
      }
    }
    lastFocused = document.activeElement;
    modal.hidden = false;
    document.body.classList.add('modal-open');
    if (modalClose && modalClose.focus) modalClose.focus();
  }

  function closeModal() {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    document.body.classList.remove('modal-open');
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);
  if (modalCta) modalCta.addEventListener('click', closeModal);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });

  /* ---------- carousel ---------- */
  var track = document.getElementById('corsiCarousel');
  var prevBtn = document.getElementById('corsiPrev');
  var nextBtn = document.getElementById('corsiNext');
  var carousel = document.querySelector('#corsi-calendario .carousel');
  var corsiEmpty = document.getElementById('corsiEmpty');
  var corsiEmptyPast = document.getElementById('corsiEmptyPast');
  var corsiEmptyCta = document.getElementById('corsiEmptyCta');
  var corsiSub = document.getElementById('corsiSub');
  var tabsEl = document.getElementById('corsiTabs');
  var dotsEl = document.getElementById('corsiDots');
  var activeBucket = 'upcoming';

  function tileStep() {
    var tile = track && track.querySelector('.corso-tile');
    if (!tile) return track ? track.clientWidth : 0;
    var gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 0;
    return tile.getBoundingClientRect().width + gap;
  }

  function updateArrows() {
    if (!track || !prevBtn || !nextBtn) return;
    var maxScroll = track.scrollWidth - track.clientWidth;
    prevBtn.disabled = track.scrollLeft <= 4;
    nextBtn.disabled = track.scrollLeft >= maxScroll - 4;
  }

  function scrollByOneTile(direction) {
    if (!track) return;
    track.scrollBy({ left: direction * tileStep(), behavior: 'smooth' });
  }

  /* Stories-style progress bars under the track: one per card, the current
     one filled. CSS hides them above the phone breakpoint, where three cards
     are on screen at once and a position indicator would just be noise. */
  function renderDots(count) {
    if (!dotsEl) return;
    dotsEl.hidden = count < 2;
    if (dotsEl.hidden) { dotsEl.innerHTML = ''; return; }
    var bars = '';
    for (var i = 0; i < count; i++) bars += '<span class="carousel-dot"></span>';
    dotsEl.innerHTML = bars;
    updateDots();
  }

  function updateDots() {
    if (!dotsEl || dotsEl.hidden || !track) return;
    var step = tileStep();
    var index = step ? Math.round(track.scrollLeft / step) : 0;
    var dots = dotsEl.children;
    if (index > dots.length - 1) index = dots.length - 1;
    if (index < 0) index = 0;
    for (var i = 0; i < dots.length; i++) {
      dots[i].classList.toggle('is-active', i === index);
    }
  }

  if (prevBtn) prevBtn.addEventListener('click', function () { scrollByOneTile(-1); });
  if (nextBtn) nextBtn.addEventListener('click', function () { scrollByOneTile(1); });

  if (track) {
    track.addEventListener('scroll', function () {
      updateArrows();
      updateDots();
    }, { passive: true });
    track.addEventListener('click', function (e) {
      var tile = e.target.closest('.corso-tile');
      if (!tile) return;
      openModal({
        title: tile.getAttribute('data-full-title'),
        desc: tile.getAttribute('data-full-desc'),
        image: tile.getAttribute('data-full-image'),
        date: tile.getAttribute('data-full-date'),
        location: tile.getAttribute('data-full-location'),
        price: tile.getAttribute('data-full-price'),
        isPast: tile.classList.contains('corso-tile--past')
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

  function copyText(key, fallback) {
    var section = state.copy && state.copy.calendario;
    var value = section && section[key + '_' + currentLang()];
    if (!value) value = section && section[key + '_it'];
    return value || fallback;
  }

  function tileHtml(c, isPast, isNext) {
    var title = pick(c, 'title');
    var desc = pick(c, 'description');
    var tileSrc = safeImageUrl(c.image);
    var img = tileSrc
      ? '<img src="' + escapeHtml(tileSrc) + '" alt="' + escapeHtml(title) + '" loading="lazy" />'
      : '';
    var tag = shortDate(c.date)
      ? '<span class="corso-tile-tag">' + escapeHtml(shortDate(c.date)) + '</span>'
      : '';
    var ribbon = '';
    if (isPast) {
      ribbon = '<span class="corso-tile-ribbon">' + (currentLang() === 'en' ? 'Past' : 'Passato') + '</span>';
    } else if (isNext) {
      ribbon = '<span class="corso-tile-ribbon corso-tile-ribbon--next">' +
        escapeHtml(copyText('next_badge', currentLang() === 'en' ? 'Next up' : 'Il prossimo')) + '</span>';
    }
    var price = formatPrice(c.price);
    var metaBits = '';
    if (c.location) {
      metaBits += '<p class="corso-tile-meta">' + pinSvg() + '<span>' + escapeHtml(c.location) + '</span></p>';
    }
    if (price) {
      metaBits += '<p class="corso-tile-price">' + escapeHtml(price) + '</p>';
    }
    return '<article class="corso-tile' + (isPast ? ' corso-tile--past' : '') +
      (isNext ? ' corso-tile--next' : '') + '" tabindex="0" role="button" aria-haspopup="dialog" ' +
      'data-full-title="' + escapeHtml(title) + '" data-full-desc="' + escapeHtml(desc) + '" ' +
      'data-full-image="' + escapeHtml(tileSrc) + '" data-full-date="' + escapeHtml(c.date || '') + '" ' +
      'data-full-location="' + escapeHtml(c.location || '') + '" data-full-price="' + escapeHtml(c.price || '') + '">' +
      img + '<div class="corso-tile-scrim"></div>' + ribbon + tag +
      '<div class="corso-tile-body"><h3>' + escapeHtml(title) + '</h3>' +
      '<p class="corso-tile-desc">' + escapeHtml(desc) + '</p>' + metaBits + '</div>' +
      '</article>';
  }

  /* Upcoming soonest-first (what a visitor is actually shopping for), past
     most-recent-first (an archive reads backwards). A course with no usable
     date is still being planned, so it sits at the end of the upcoming list
     rather than disappearing. */
  function splitCourses(all) {
    var todayStart = startOfTodayInRome();
    var floor = todayStart ? todayStart.getTime() : Date.now();
    var upcoming = [], past = [], undated = [];

    all.forEach(function (course) {
      var when = parseCourseDate(course.date);
      if (!when) undated.push({ course: course, when: null });
      else if (when.getTime() >= floor) upcoming.push({ course: course, when: when });
      else past.push({ course: course, when: when });
    });

    upcoming.sort(function (a, b) { return a.when - b.when; });
    past.sort(function (a, b) { return b.when - a.when; });
    return { upcoming: upcoming.concat(undated), past: past };
  }

  function updateTabs(counts) {
    if (!tabsEl) return;
    // With nothing in the archive there's nothing to switch between, so the
    // control would only be clutter.
    tabsEl.hidden = !counts.past || !(counts.upcoming + counts.past);
    tabsEl.querySelectorAll('.corsi-tab').forEach(function (tab) {
      var bucket = tab.getAttribute('data-bucket');
      var isActive = bucket === activeBucket;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
      tab.tabIndex = isActive ? 0 : -1;
      var count = tab.querySelector('.corsi-tab-count');
      if (count) count.textContent = counts[bucket] ? String(counts[bucket]) : '';
    });
  }

  function renderCourses() {
    var section = document.getElementById('corsi-calendario');
    if (!section || !track) return;
    var all = ((state.courses && state.courses.courses) || []).slice();

    // Always show the section (never a dead scroll target for CTAs that link
    // to #corsi-calendario) — fall back to a friendly message when there's
    // currently nothing to show, instead of hiding the whole section.
    section.hidden = false;

    var buckets = splitCourses(all);
    var counts = { upcoming: buckets.upcoming.length, past: buckets.past.length };
    if (!counts[activeBucket] && counts.upcoming) activeBucket = 'upcoming';
    updateTabs(counts);

    var shown = buckets[activeBucket] || [];
    var isPastBucket = activeBucket === 'past';

    if (!shown.length) {
      track.innerHTML = '';
      if (carousel) carousel.hidden = true;
      if (corsiSub) corsiSub.hidden = true;
      if (corsiEmpty) corsiEmpty.hidden = isPastBucket;
      if (corsiEmptyPast) corsiEmptyPast.hidden = !isPastBucket;
      if (corsiEmptyCta) corsiEmptyCta.hidden = isPastBucket;
      if (prevBtn) prevBtn.hidden = true;
      if (nextBtn) nextBtn.hidden = true;
      renderDots(0);
      return;
    }

    if (carousel) carousel.hidden = false;
    if (corsiSub) corsiSub.hidden = false;
    if (corsiEmpty) corsiEmpty.hidden = true;
    if (corsiEmptyPast) corsiEmptyPast.hidden = true;
    if (corsiEmptyCta) corsiEmptyCta.hidden = true;

    track.innerHTML = shown.map(function (entry, i) {
      return tileHtml(entry.course, isPastBucket, !isPastBucket && i === 0 && !!entry.when);
    }).join('');

    var needsArrows = shown.length > 3;
    if (prevBtn) prevBtn.hidden = !needsArrows;
    if (nextBtn) nextBtn.hidden = !needsArrows;

    // Both lists start with the card that matters most — the next class, or
    // the most recent one — so the opening view is the start of the track.
    track.scrollLeft = 0;
    renderDots(shown.length);
    updateArrows();
  }

  if (tabsEl) {
    tabsEl.addEventListener('click', function (e) {
      var tab = e.target.closest('.corsi-tab');
      if (!tab) return;
      var bucket = tab.getAttribute('data-bucket');
      if (!bucket || bucket === activeBucket) return;
      activeBucket = bucket;
      renderCourses();
    });
    // Left/right arrows move between tabs, as the tablist pattern expects.
    tabsEl.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var tabs = Array.prototype.slice.call(tabsEl.querySelectorAll('.corsi-tab'));
      var current = tabs.indexOf(e.target.closest('.corsi-tab'));
      if (current < 0) return;
      e.preventDefault();
      var next = tabs[(current + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      if (next) { next.click(); next.focus(); }
    });
  }

  window.addEventListener('resize', function () {
    updateArrows();
    updateDots();
  }, { passive: true });

  fetchJson('content/site.json').then(function (d) { state.site = d; renderSite(); });
  fetchJson('content/courses.json').then(function (d) { state.courses = d; renderCourses(); });
  fetchJson('content/copy.json').then(function (d) { state.copy = d; applyCopy(); });

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
