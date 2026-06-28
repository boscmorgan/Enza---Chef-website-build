/* =========================================================
   ENZA E BASTA — interactions
   - side menu open/close (+ hamburger)
   - smooth anchor scroll
   - IT / EN language toggle
   - contact form mailto composer
   ========================================================= */
(function () {
  'use strict';

  var body = document.body;
  var sideMenu = document.getElementById('sideMenu');
  var btnOpen = document.getElementById('menuOpen');
  var btnClose = document.getElementById('menuClose');
  var scrim = document.getElementById('menuScrim');

  var DESKTOP = window.matchMedia('(min-width:980px)');

  /* ---------- SIDE MENU ---------- */
  function openMenu() {
    body.classList.add('menu-open');
    body.classList.remove('menu-closed');
    btnOpen.setAttribute('aria-expanded', 'true');
    if (!DESKTOP.matches) {
      scrim.hidden = false;
    }
  }
  function closeMenu() {
    body.classList.add('menu-closed');
    body.classList.remove('menu-open');
    btnOpen.setAttribute('aria-expanded', 'false');
    scrim.hidden = true;
  }

  btnOpen.addEventListener('click', openMenu);
  btnClose.addEventListener('click', closeMenu);
  scrim.addEventListener('click', closeMenu);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && body.classList.contains('menu-open')) closeMenu();
  });

  // Initial state: closed, matching the full-width hero design.
  function initMenu() {
    closeMenu();
  }
  initMenu();

  /* ---------- SMOOTH SCROLL + close on mobile ---------- */
  document.querySelectorAll('a[data-scroll], a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var id = link.getAttribute('href');
      if (!id || id === '#' || id.charAt(0) !== '#') return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
      if (!DESKTOP.matches) closeMenu();
    });
  });

  /* ---------- LANGUAGE TOGGLE ---------- */
  var langButtons = document.querySelectorAll('[data-set-lang]');

  var jiggleEls = '.btn, .tag-row li, .kicker, .sticker, .lang-toggle, .side-lang-toggle, .servizi-sub';

  function jiggle() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    document.querySelectorAll(jiggleEls).forEach(function (el) {
      el.classList.remove('jiggle');
      void el.offsetWidth; // restart animation
      el.classList.add('jiggle');
    });
  }
  document.addEventListener('animationend', function (e) {
    if (e.target.classList && e.target.classList.contains('jiggle')) {
      e.target.classList.remove('jiggle');
    }
  });

  function applyLang(lang, animate) {
    body.setAttribute('data-lang', lang);
    document.documentElement.setAttribute('lang', lang);

    // text content
    document.querySelectorAll('[data-it][data-en]').forEach(function (el) {
      var val = el.getAttribute('data-' + lang);
      if (val !== null) el.textContent = val;
    });

    // placeholders
    document.querySelectorAll('[data-it-ph][data-en-ph]').forEach(function (el) {
      var val = el.getAttribute('data-' + lang + '-ph');
      if (val !== null) el.setAttribute('placeholder', val);
    });

    // expand/collapse buttons keep the right label for their current state
    document.querySelectorAll('.read-more').forEach(function (b) {
      var open = b.getAttribute('aria-expanded') === 'true';
      var v = b.getAttribute('data-' + lang + (open ? '-close' : ''));
      if (v !== null) b.textContent = v;
    });

    // toggle button state
    langButtons.forEach(function (b) {
      var active = b.getAttribute('data-set-lang') === lang;
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    if (animate) jiggle();
  }

  langButtons.forEach(function (b) {
    b.addEventListener('click', function () {
      applyLang(b.getAttribute('data-set-lang'), true);
    });
  });

  applyLang('it', false); // default, no animation on load

  /* ---------- EXPAND / "Espandi" ---------- */
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function setExpandLabel(btn, open) {
    var lang = body.getAttribute('data-lang') || 'it';
    var v = btn.getAttribute('data-' + lang + (open ? '-close' : ''));
    if (v !== null) btn.textContent = v;
  }

  document.querySelectorAll('.more-content').forEach(function (target) {
    target.classList.add('is-collapsed');
    target.style.maxHeight = '0px';
  });

  document.querySelectorAll('.read-more').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var target = document.getElementById(btn.getAttribute('aria-controls'));
      if (!target) return;
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      setExpandLabel(btn, !open);

      if (reduceMotion.matches) {
        target.hidden = open;
        target.classList.toggle('is-collapsed', open);
        target.style.maxHeight = open ? '0px' : 'none';
        return;
      }

      clearTimeout(target._expandTimer);

      if (open) {
        target.style.maxHeight = target.scrollHeight + 'px';
        target.classList.add('is-collapsing');
        requestAnimationFrame(function () {
          target.classList.add('is-collapsed');
          target.style.maxHeight = '0px';
        });
        target._expandTimer = setTimeout(function () {
          target.hidden = true;
          target.classList.remove('is-collapsing');
        }, 340);
      } else {
        target.hidden = false;
        target.classList.add('is-expanding');
        target.classList.remove('is-collapsed');
        target.style.maxHeight = target.scrollHeight + 'px';
        target._expandTimer = setTimeout(function () {
          target.style.maxHeight = 'none';
          target.classList.remove('is-expanding');
        }, 340);
      }
    });
  });

  /* ---------- BIOGRAFIA timeline active dot on scroll ---------- */
  var timelineItems = Array.prototype.slice.call(document.querySelectorAll('.timeline li'));
  if (timelineItems.length) {
    var timelineTick = false;

    function activateTimelineItem(item) {
      timelineItems.forEach(function (li) {
        li.classList.toggle('is-active', li === item);
      });
    }

    function updateActiveTimelineOnScroll() {
      var targetY = window.innerHeight * 0.42;
      var current = timelineItems[0];
      var currentDistance = Infinity;

      timelineItems.forEach(function (item) {
        var rect = item.getBoundingClientRect();
        var markerY = rect.top + 14;
        var distance = Math.abs(markerY - targetY);
        if (distance < currentDistance) {
          current = item;
          currentDistance = distance;
        }
      });

      activateTimelineItem(current);
    }

    function requestTimelineUpdate() {
      if (timelineTick) return;
      timelineTick = true;
      requestAnimationFrame(function () {
        updateActiveTimelineOnScroll();
        timelineTick = false;
      });
    }

    activateTimelineItem(timelineItems[0]);
    window.addEventListener('scroll', requestTimelineUpdate, { passive: true });
    window.addEventListener('resize', requestTimelineUpdate);
    requestTimelineUpdate();

    if ('IntersectionObserver' in window && !reduceMotion.matches) {
      var timelineObserver = new IntersectionObserver(function (entries) {
        if (entries.some(function (entry) { return entry.isIntersecting; })) {
          requestTimelineUpdate();
        }
      }, {
        root: null,
        rootMargin: '-32% 0px -52% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1]
      });

      timelineItems.forEach(function (item) { timelineObserver.observe(item); });
    }
  }

  /* ---------- CONTACT FORM MAILTO ---------- */
  var form = document.getElementById('contactForm');
  var success = document.getElementById('formSuccess');
  var mailFallback = document.getElementById('mailFallback');
  var mailFallbackText = document.getElementById('mailFallbackText');
  var copyMailFallback = document.getElementById('copyMailFallback');
  var lastFallbackMessage = '';

  function formValue(name) {
    var field = form.elements[name];
    return field ? field.value.trim() : '';
  }

  function buildMailBody(data) {
    return [
      'Nome: ' + data.name,
      'Email: ' + data.email,
      'Telefono: ' + (data.phone || '-'),
      '',
      'Oggetto: ' + data.subject,
      '',
      'Messaggio:',
      data.message,
      '',
      '---',
      'Inviato dal modulo contatti di enzaebasta.it',
      'Pagina: ' + window.location.href,
      'Lingua: ' + data.lang.toUpperCase()
    ].join('\n');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    var data = {
      name: formValue('nome'),
      email: formValue('email'),
      phone: formValue('telefono'),
      subject: formValue('oggetto'),
      message: formValue('messaggio'),
      lang: body.getAttribute('data-lang') || 'it'
    };

    var mailSubject = 'Richiesta dal sito: ' + data.subject;
    var mailBody = buildMailBody(data);
    lastFallbackMessage = 'A: ciao@enzaebasta.it\n'
      + 'Oggetto: ' + mailSubject + '\n\n'
      + mailBody;
    var mailto = 'mailto:ciao@enzaebasta.it'
      + '?subject=' + encodeURIComponent(mailSubject)
      + '&body=' + encodeURIComponent(mailBody);

    mailFallbackText.value = lastFallbackMessage;
    mailFallback.hidden = false;

    window.location.href = mailto;
    success.hidden = false;
    mailFallback.scrollIntoView({ behavior: 'smooth', block: 'center' });
    clearTimeout(form._t);
    form._t = setTimeout(function () { success.hidden = true; }, 8000);
  });

  copyMailFallback.addEventListener('click', function () {
    function markCopied() {
      var lang = body.getAttribute('data-lang') || 'it';
      var defaultLabel = copyMailFallback.getAttribute('data-' + lang) || 'Copia messaggio';
      copyMailFallback.textContent = lang === 'en' ? 'Copied' : 'Copiato';
      mailFallbackText.blur();
      if (window.getSelection) window.getSelection().removeAllRanges();
      clearTimeout(copyMailFallback._t);
      copyMailFallback._t = setTimeout(function () {
        copyMailFallback.textContent = defaultLabel;
      }, 1800);
    }

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(lastFallbackMessage).then(markCopied, function () {
        mailFallbackText.select();
        document.execCommand('copy');
        markCopied();
      });
      return;
    }

    mailFallbackText.select();
    document.execCommand('copy');
    markCopied();
  });

  /* ---------- shrink floating UI on scroll (mobile) ---------- */
  var scrollTick = false;
  function onScroll() {
    if (scrollTick) return;
    scrollTick = true;
    requestAnimationFrame(function () {
      body.classList.toggle('is-scrolled', window.scrollY > 24);
      scrollTick = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- FOOTER YEAR ---------- */
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
