/* =========================================================
   ENZA E BASTA — pagina Aggiornamenti
   Reads content/updates.json (edited via /admin) and renders the
   site changelog as a vertical timeline, newest entry first.

   Entries are sorted here rather than in the CMS so Enza never has to
   drag them into order: she just picks a date. The static message in
   updates.html stays visible if the fetch fails.
   ========================================================= */
(function () {
  'use strict';

  var list = document.getElementById('updatesList');
  var empty = document.getElementById('updatesEmpty');
  if (!list) return;

  var updates = [];

  function currentLang() {
    return document.body.getAttribute('data-lang') || 'it';
  }

  // Falls back to the Italian field so a half-translated entry still reads.
  function pick(obj, key) {
    return (obj && obj[key + '_' + currentLang()]) || (obj && obj[key + '_it']) || '';
  }

  function locale() {
    return currentLang() === 'en' ? 'en-GB' : 'it-IT';
  }

  /* The CMS stores the date as a plain "2026-09-13". Splitting it by hand
     avoids new Date('2026-09-13') being read as UTC midnight, which shows
     the previous day to anyone browsing west of Greenwich. */
  var PLAIN_DATE = /^(\d{4})-(\d{2})-(\d{2})/;

  function parseDate(value) {
    var m = PLAIN_DATE.exec(String(value || ''));
    if (!m) return null;
    var d = new Date(+m[1], +m[2] - 1, +m[3]);
    return isNaN(d.getTime()) ? null : d;
  }

  function formatDate(date) {
    if (!date) return '';
    try {
      return date.toLocaleDateString(locale(), {
        day: 'numeric', month: 'long', year: 'numeric'
      });
    } catch (e) {
      return date.toISOString().slice(0, 10);
    }
  }

  var TAG_LABELS = {
    'nuova-sezione': { it: 'Nuova sezione', en: 'New section' },
    'migliorie':     { it: 'Migliorie',     en: 'Improvements' },
    'correzioni':    { it: 'Correzioni',    en: 'Fixes' },
    'online':        { it: 'Online',        en: 'Live' }
  };

  function tagLabel(tag) {
    var entry = TAG_LABELS[tag];
    return entry ? (entry[currentLang()] || entry.it) : '';
  }

  function render() {
    list.textContent = '';

    if (!updates.length) return;

    updates.forEach(function (item) {
      var li = document.createElement('li');
      li.className = 'update';

      var meta = document.createElement('p');
      meta.className = 'update-meta';

      var time = document.createElement('time');
      var date = parseDate(item.date);
      if (date) {
        time.dateTime = date.getFullYear() + '-' +
          String(date.getMonth() + 1).padStart(2, '0') + '-' +
          String(date.getDate()).padStart(2, '0');
      }
      time.textContent = formatDate(date);
      meta.appendChild(time);

      var label = tagLabel(item.tag);
      if (label) {
        var tag = document.createElement('span');
        tag.className = 'update-tag update-tag--' + item.tag;
        tag.textContent = label;
        meta.appendChild(tag);
      }

      var h2 = document.createElement('h2');
      h2.className = 'update-title';
      h2.textContent = pick(item, 'title');

      var body = document.createElement('p');
      body.className = 'update-body';
      body.textContent = pick(item, 'body');

      li.appendChild(meta);
      li.appendChild(h2);
      li.appendChild(body);
      list.appendChild(li);
    });

    list.hidden = false;
    if (empty) empty.hidden = true;
  }

  // Re-render on language change: the entries are built from JSON, so
  // applyLang's [data-it]/[data-en] sweep in script.js can't reach them.
  document.querySelectorAll('[data-set-lang]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      // applyLang runs on the same click; let it set data-lang first.
      setTimeout(render, 0);
    });
  });

  fetch('content/updates.json', { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      var items = (data && Array.isArray(data.updates)) ? data.updates : [];

      updates = items
        .filter(function (item) { return item && !item.hidden && pick(item, 'title'); })
        .sort(function (a, b) {
          var da = parseDate(a.date);
          var db = parseDate(b.date);
          return (db ? db.getTime() : 0) - (da ? da.getTime() : 0);
        });

      if (!updates.length) {
        // Nothing to show yet — swap the error wording for a calmer note.
        if (empty) {
          empty.setAttribute('data-it', 'Non c’è ancora nulla da segnalare.');
          empty.setAttribute('data-en', 'Nothing to report yet.');
          empty.textContent = currentLang() === 'en'
            ? 'Nothing to report yet.'
            : 'Non c’è ancora nulla da segnalare.';
        }
        return;
      }

      render();
    })
    .catch(function () { /* static fallback message stays visible */ });
})();
