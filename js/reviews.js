/* =========================================================
   ENZA E BASTA — carosello recensioni
   Reads content/reviews.json (edited via /admin) and renders an
   infinite, auto-advancing carousel above the Contatti section.

   How the loop works: the visible slides are followed and preceded by
   clones, so the track can always step one card further in either
   direction. When a transition lands on a clone we jump back to the
   real card with the animation switched off — invisible to the eye,
   and it keeps the arrows/drag/dots from ever hitting an edge.
   ========================================================= */
(function () {
  'use strict';

  var DWELL = 6000;          // how long a review stays before the next slides in
  var DRAG_THRESHOLD = 45;   // px of travel before a drag counts as a swipe

  var section = document.getElementById('recensioni');
  var track = document.getElementById('recensioniTrack');
  var prevBtn = document.getElementById('recensioniPrev');
  var nextBtn = document.getElementById('recensioniNext');
  var dotsWrap = document.getElementById('recensioniDots');
  var shell = document.getElementById('recensioniCarousel');
  if (!section || !track || !shell) return;

  // The track is transform-driven, so it needs a clipping parent that the
  // shared .carousel-track styles don't provide. Wrap it once, here, rather
  // than complicating the markup Enza never sees.
  var viewport = document.createElement('div');
  viewport.className = 'reviews-viewport';
  track.parentNode.insertBefore(viewport, track);
  viewport.appendChild(track);

  var reviews = [];          // real reviews, in order
  var perView = 3;           // cards visible at once — recomputed on resize
  var index = 0;             // logical index into `reviews`
  var offset = 0;            // number of leading clones
  var timer = null;
  var paused = false;        // hover / focus / drag / tab hidden
  var animating = false;

  // Hiding the section has to take its menu entry with it, or the side menu
  // offers a link that scrolls nowhere.
  function showSection(show) {
    section.hidden = !show;
    document.querySelectorAll('.side-links a[href="#recensioni"]').forEach(function (a) {
      var li = a.closest('li') || a;
      li.hidden = !show;
    });
  }

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

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // Coarse pointers (touch) get swipe + dots and no arrows; fine pointers
  // (mouse) get arrows + drag. Checked live so a hybrid laptop follows
  // whatever the person actually used last.
  function isTouch() {
    return window.matchMedia && window.matchMedia('(hover: none), (pointer: coarse)').matches;
  }

  // Read the count from CSS so the breakpoints live in one place only.
  function slidesPerView() {
    var v = parseInt(getComputedStyle(viewport).getPropertyValue('--reviews-per-view'), 10);
    return v > 0 ? v : 1;
  }

  function gapPx() {
    var g = parseFloat(getComputedStyle(viewport).getPropertyValue('--reviews-gap'));
    return isNaN(g) ? 24 : g;
  }

  // The track is max-content wide (it carries clones), so the cards can't
  // size themselves off it — measure the viewport and hand CSS the width.
  // Set the card width from the viewport's content box. The track is
  // max-content wide (it carries clones) so the cards can't size themselves
  // off it, and clientWidth includes the bleed padding they must not spill
  // into.
  function setCardWidth() {
    perView = slidesPerView();
    var cs = getComputedStyle(viewport);
    var padL = parseFloat(cs.paddingLeft) || 0;
    var padR = parseFloat(cs.paddingRight) || 0;
    var avail = viewport.clientWidth - padL - padR;
    var w = (avail - gapPx() * (perView - 1)) / perView;
    viewport.style.setProperty('--reviews-card-w', w + 'px');
  }

  // Read the pitch back from layout rather than trusting the width we just
  // asked for: sub-pixel rounding and any CSS that overrides the card width
  // would otherwise desync every translate from where the cards really are.
  function measure() {
    setCardWidth();
    var cards = track.querySelectorAll('.review-card');
    if (cards.length > 1) return cards[1].offsetLeft - cards[0].offsetLeft;
    if (cards.length === 1) return cards[0].offsetWidth + gapPx();
    var cs = getComputedStyle(viewport);
    var avail = viewport.clientWidth
      - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
    return (avail - gapPx() * (perView - 1)) / perView + gapPx();
  }

  function initials(name) {
    return String(name || '')
      .split(/\s+/).filter(Boolean).slice(0, 2)
      .map(function (part) { return part.charAt(0).toUpperCase(); })
      .join('');
  }

  function cardHtml(r) {
    var quote = pick(r, 'quote');
    var role = pick(r, 'role');
    var name = r.name || '';
    var avatar = r.image
      ? '<img src="' + escapeHtml(r.image) + '" alt="' + escapeHtml(name) + '" loading="lazy" draggable="false" />'
      : '<span aria-hidden="true">' + escapeHtml(initials(name)) + '</span>';
    return '<figure class="review-card">' +
      '<blockquote class="review-quote"><p>' + escapeHtml(quote) + '</p></blockquote>' +
      '<div class="review-avatar">' + avatar + '</div>' +
      '<figcaption>' +
      '<p class="review-name">' + escapeHtml(name) + '</p>' +
      (role ? '<p class="review-role">' + escapeHtml(role) + '</p>' : '') +
      '</figcaption>' +
      '</figure>';
  }

  var pitch = 0;   // one card + one gap, in px

  function step() { return pitch; }

  function setTranslate(px, animate) {
    track.classList.toggle('is-animating', !!animate && !prefersReducedMotion());
    track.style.transform = 'translate3d(' + px + 'px,0,0)';
  }

  function position(logicalIndex) {
    // static mode: the flex row centres itself, so leave it untranslated
    if (reviews.length && reviews.length <= perView) return 0;
    return -(logicalIndex + offset) * step();
  }

  function render() {
    if (!reviews.length) return;
    setCardWidth();

    // When everything already fits there is nothing to scroll: render the
    // reviews once, centred, with no clones. Cloning here would just show
    // the same review twice side by side.
    var loops;
    if (reviews.length <= perView) {
      offset = 0;
      loops = reviews;
      track.classList.add('is-static');
    } else {
      // Enough clones on each side to cover a full view, so no gap is ever
      // visible mid-transition however few reviews there are.
      offset = Math.min(reviews.length, Math.max(perView, 1));
      loops = reviews.slice(reviews.length - offset)
        .concat(reviews, reviews.slice(0, offset));
      track.classList.remove('is-static');
    }

    track.innerHTML = loops.map(cardHtml).join('');
    // Clones are duplicates — keep them out of the a11y tree and tab order.
    var cards = track.querySelectorAll('.review-card');
    cards.forEach(function (el, i) {
      var isClone = i < offset || i >= offset + reviews.length;
      if (isClone) el.setAttribute('aria-hidden', 'true');
    });

    index = Math.min(index, reviews.length - 1);
    if (reviews.length <= perView) index = 0;
    pitch = measure();          // now that the cards are laid out
    setTranslate(position(index), false);
    renderDots();
    updateControls();
  }

  function renderDots() {
    if (!dotsWrap) return;
    // One dot per starting position. With 5 reviews shown 3-up the loop is
    // still 5 stops long, so dots track reviews, not pages.
    var needed = reviews.length > perView;
    dotsWrap.hidden = !needed;
    if (!needed) { dotsWrap.innerHTML = ''; return; }
    var lang = currentLang();
    var label = dotsWrap.getAttribute('data-' + lang + '-label') || 'Go to review';
    dotsWrap.innerHTML = reviews.map(function (r, i) {
      return '<button type="button" role="tab" data-index="' + i + '" ' +
        'aria-label="' + escapeHtml(label + ' ' + (i + 1)) + '" aria-selected="false"></button>';
    }).join('');
    syncDots();
  }

  function syncDots() {
    if (!dotsWrap || dotsWrap.hidden) return;
    dotsWrap.querySelectorAll('button').forEach(function (b, i) {
      var active = i === ((index % reviews.length) + reviews.length) % reviews.length;
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-selected', active ? 'true' : 'false');
    });
  }

  function updateControls() {
    // Arrows are a mouse affordance; touch users swipe and use the dots.
    var showArrows = reviews.length > perView && !isTouch();
    if (prevBtn) prevBtn.hidden = !showArrows;
    if (nextBtn) nextBtn.hidden = !showArrows;
    // The loop never ends, so the arrows are never disabled.
    if (prevBtn) prevBtn.disabled = false;
    if (nextBtn) nextBtn.disabled = false;
    syncDots();
  }

  // Bring a clone index back onto the real card it duplicates.
  function normalize() {
    if (index >= reviews.length) index -= reviews.length;
    else if (index < 0) index += reviews.length;
  }

  function go(target, animate) {
    if (!reviews.length) return;
    // Without a transition there is no transitionend to snap us back off a
    // clone, so land on the clone first and correct on the next frame.
    var willAnimate = animate !== false && !prefersReducedMotion();
    index = target;
    animating = willAnimate;
    setTranslate(position(index), animate !== false);
    syncDots();
    if (!willAnimate) {
      animating = false;
      requestAnimationFrame(function () {
        var before = index;
        normalize();
        if (index !== before) setTranslate(position(index), false);
        syncDots();
      });
    }
  }

  function next() { go(index + 1, true); }
  function prev() { go(index - 1, true); }

  // After each animated move, snap back from a clone to the real card.
  track.addEventListener('transitionend', function (e) {
    if (e.propertyName !== 'transform') return;
    animating = false;
    var before = index;
    normalize();
    if (index !== before) setTranslate(position(index), false);
    syncDots();
  });

  /* ---------- autoplay ---------- */
  function tick() {
    if (paused || document.hidden || reviews.length <= perView) return;
    next();
  }

  function startAuto() {
    stopAuto();
    if (reviews.length <= perView) return;
    if (prefersReducedMotion()) return;   // no unattended movement
    timer = setInterval(tick, DWELL);
  }

  function stopAuto() {
    if (timer) { clearInterval(timer); timer = null; }
  }

  // Restart the dwell clock after any manual move, so a review the person
  // just brought into view gets its full 6 seconds.
  function restartAuto() { startAuto(); }

  function pause() { paused = true; }
  function resume() { paused = false; }

  shell.addEventListener('mouseenter', pause);
  shell.addEventListener('mouseleave', resume);
  shell.addEventListener('focusin', pause);
  shell.addEventListener('focusout', function (e) {
    if (!shell.contains(e.relatedTarget)) resume();
  });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stopAuto(); else startAuto();
  });

  if (prevBtn) prevBtn.addEventListener('click', function () { prev(); restartAuto(); });
  if (nextBtn) nextBtn.addEventListener('click', function () { next(); restartAuto(); });

  if (dotsWrap) {
    dotsWrap.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-index]');
      if (!btn) return;
      go(parseInt(btn.getAttribute('data-index'), 10), true);
      restartAuto();
    });
  }

  // Keyboard: arrows move the carousel when it holds focus.
  shell.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); restartAuto(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); next(); restartAuto(); }
  });

  /* ---------- drag / swipe ---------- */
  var drag = null;

  function dragStart(e) {
    if (reviews.length <= perView) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (animating) {
      // Freeze wherever the in-flight transition is, so the grab feels direct.
      var m = new DOMMatrixReadOnly(getComputedStyle(track).transform);
      setTranslate(m.m41, false);
      animating = false;
    }
    drag = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      base: position(index),
      moved: false,
      axis: null
    };
    pause();
    stopAuto();
    track.classList.add('is-dragging');
  }

  function dragMove(e) {
    if (!drag || e.pointerId !== drag.id) return;
    var dx = e.clientX - drag.x;
    var dy = e.clientY - drag.y;

    // Decide once whether this gesture is a swipe or a page scroll, so a
    // vertical flick on a phone never gets captured by the carousel.
    if (!drag.axis) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      drag.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (drag.axis === 'x' && track.setPointerCapture) {
        try { track.setPointerCapture(drag.id); } catch (err) { /* ignore */ }
      }
    }
    if (drag.axis !== 'x') return;

    if (e.cancelable) e.preventDefault();
    drag.moved = Math.abs(dx) > 3;
    setTranslate(drag.base + dx, false);
  }

  function dragEnd(e) {
    if (!drag || (e.pointerId != null && e.pointerId !== drag.id)) return;
    var dx = (e.clientX != null ? e.clientX : drag.x) - drag.x;
    var wasX = drag.axis === 'x';
    if (track.releasePointerCapture && track.hasPointerCapture && track.hasPointerCapture(drag.id)) {
      try { track.releasePointerCapture(drag.id); } catch (err) { /* ignore */ }
    }
    drag = null;
    track.classList.remove('is-dragging');

    if (wasX && Math.abs(dx) > DRAG_THRESHOLD) {
      go(index + (dx < 0 ? 1 : -1), true);
    } else if (wasX) {
      go(index, true);   // didn't travel far enough — settle back
    }
    resume();
    restartAuto();
  }

  track.addEventListener('pointerdown', dragStart);
  track.addEventListener('pointermove', dragMove);
  track.addEventListener('pointerup', dragEnd);
  track.addEventListener('pointercancel', dragEnd);
  // A drag that ends outside the track still has to settle.
  window.addEventListener('pointerup', function (e) { if (drag) dragEnd(e); });
  track.addEventListener('dragstart', function (e) { e.preventDefault(); });

  /* ---------- resize ---------- */
  var resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      var before = perView;
      pitch = measure();      // card width follows the viewport
      if (before !== perView) {
        render();             // clone count depends on perView
        startAuto();
      } else {
        setTranslate(position(index), false);
      }
    }, 150);
  });

  /* ---------- language toggle ---------- */
  document.querySelectorAll('[data-set-lang]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      render();
      var lang = currentLang();
      [prevBtn, nextBtn, track, dotsWrap].forEach(function (el) {
        if (!el) return;
        var label = el.getAttribute('data-' + lang + '-label');
        if (label) el.setAttribute('aria-label', label);
      });
    });
  });

  /* ---------- load ---------- */
  fetch('content/reviews.json', { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .catch(function () { return null; })
    .then(function (data) {
      var list = (data && data.reviews) || [];
      // A review needs a quote and a name to be worth showing; `hidden`
      // lets Enza park one in the CMS without deleting it.
      reviews = list.filter(function (r) {
        return r && !r.hidden && (r.quote_it || r.quote_en) && r.name;
      });
      if (!reviews.length) { showSection(false); return; }
      showSection(true);
      render();
      startAuto();
    });
})();
