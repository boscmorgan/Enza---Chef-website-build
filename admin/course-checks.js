/* Save-time checks for the course calendar in /admin.
   ---------------------------------------------------
   The course list is one long form, so a slip is easy to miss and only shows
   up on the live site: "Zucca EBBASTA" was saved as 14 May instead of
   14 November (2026-09-30) and silently landed among the past courses, and
   "A Tutto Tofu!" was once saved twice. Before every save of the course list
   this asks Enza to confirm anything that looks like a mistake:

   * a new or re-dated course whose date is already past, or implausibly far
     back (a wrong year) or far ahead;
   * a course with no date;
   * two identical courses (same title, same date): an accidental copy;
   * two courses on the same day, or with the same title;
   * a course switched to sold out, or back.

   "Salva comunque" saves as usual; "Torna a modificare" cancels the save and
   leaves the form as it was, so nothing is lost.

   Design notes
   ------------
   * Hooks into Sveltia's `preSave` event (CMS.registerEventListener). A
     handler that throws `saving_failed` aborts the save and Sveltia shows the
     error's `cause` message, which is how "cancel" is reported.
   * Past-date and same-day/same-title checks only look at courses that are
     new or whose title/date changed in this save. Old courses are
     legitimately in the past, and repeat editions legitimately share a
     title, so re-warning about them on every save would teach Enza to click
     through without reading.
   * "What changed" needs the list as it was before the edit. Sveltia's hook
     only hands over the new data, so the last committed version is read from
     GitHub's public API (falling back to the deployed copy). If neither is
     reachable, the duplicate checks still run and the rest are skipped: a
     check must never be the reason a save can't happen.
   * Everything is namespaced under `.chk-` and lives in its own overlay, so
     nothing depends on Sveltia's internal DOM or CSS.
*/
(function () {
  'use strict';

  var REPO = 'boscmorgan/Enza---Chef-website-build';
  var BRANCH = 'main';
  var FILE = 'content/courses.json';
  var COLLECTION = 'courses';

  var DAY = 86400000;
  var FAR_PAST_DAYS = 365;   // older than this is almost surely a wrong year
  var FAR_FUTURE_DAYS = 730; // same for typos the other way (2062 for 2026)
  var FETCH_TIMEOUT = 6000;

  /* ---------- dates (all wall-clock Italian time, as the CMS stores them) ---------- */

  function todayInRome() {
    // sv-SE formats as YYYY-MM-DD, which compares correctly as a string.
    try {
      return new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Rome' });
    } catch (e) {
      return new Date().toISOString().slice(0, 10);
    }
  }

  function dayOf(value) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value || ''));
    return m ? m[1] + '-' + m[2] + '-' + m[3] : null;
  }

  function daysBetween(fromDay, toDay) {
    return Math.round((Date.parse(toDay + 'T00:00Z') - Date.parse(fromDay + 'T00:00Z')) / DAY);
  }

  function prettyDay(day) {
    var p = day.split('-');
    return p[2] + '/' + p[1] + '/' + p[0];
  }

  /* ---------- course identity ---------- */

  function norm(s) {
    return String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
  }

  function keyOf(c) {
    return norm(c.title_it) + '|' + String(c.date || '');
  }

  function isSoldOut(c) {
    return c.sold_out === true || c.sold_out === 'true';
  }

  function label(c) {
    var t = String(c.title_it || '').trim() || '(senza titolo)';
    var d = dayOf(c.date);
    return '«' + t + '»' + (d ? ' del ' + prettyDay(d) : '');
  }

  // Finds a course's previous version: same title+date first, then the same
  // title if only one course had it (covers a date edited in the same save).
  function findBefore(c, before) {
    if (!before) return null;
    var key = keyOf(c);
    for (var i = 0; i < before.length; i++) if (keyOf(before[i]) === key) return before[i];
    var sameTitle = before.filter(function (b) { return norm(b.title_it) && norm(b.title_it) === norm(c.title_it); });
    return sameTitle.length === 1 ? sameTitle[0] : null;
  }

  /* ---------- the checks ---------- */

  function check(after, before) {
    var today = todayInRome();
    var warnings = [];
    var confirms = [];
    var beforeKeys = {};
    if (before) before.forEach(function (b) { beforeKeys[keyOf(b)] = true; });

    // Without the previous version, treat nothing as new: better to miss a
    // warning than to nag about every past course on each save.
    function isNewOrChanged(c) { return !!before && !beforeKeys[keyOf(c)]; }

    after.forEach(function (c) {
      var day = dayOf(c.date);
      if (!day) {
        warnings.push(label(c) + ' non ha una data: comparirà in fondo ai prossimi corsi.');
        return;
      }
      if (!isNewOrChanged(c)) return;
      var diff = daysBetween(today, day);
      if (diff < -FAR_PAST_DAYS) {
        warnings.push(label(c) + ' ha una data di più di un anno fa. L\'anno è giusto?');
      } else if (diff < 0) {
        warnings.push(label(c) + ' ha una data già passata: finirà fra i corsi passati, non fra i prossimi.');
      } else if (diff > FAR_FUTURE_DAYS) {
        warnings.push(label(c) + ' è fra più di due anni. L\'anno è giusto?');
      }
    });

    // Identical copies: always worth flagging, new or not.
    var seenKey = {};
    after.forEach(function (c) {
      var k = keyOf(c);
      if (!norm(c.title_it)) return;
      if (seenKey[k] === 1) {
        warnings.push(label(c) + ' compare due volte, identico. Forse un doppione creato per sbaglio?');
      }
      seenKey[k] = (seenKey[k] || 0) + 1;
    });

    // Same day or same title: only when one side of the pair is new/changed.
    for (var i = 0; i < after.length; i++) {
      for (var j = i + 1; j < after.length; j++) {
        var a = after[i], b = after[j];
        if (keyOf(a) === keyOf(b)) continue; // already reported as a copy
        if (!isNewOrChanged(a) && !isNewOrChanged(b)) continue;
        var da = dayOf(a.date), db = dayOf(b.date);
        if (da && da === db) {
          warnings.push(label(a) + ' e ' + label(b) + ' sono nello stesso giorno.');
        }
        if (norm(a.title_it) && norm(a.title_it) === norm(b.title_it)) {
          warnings.push('Due corsi hanno lo stesso titolo: ' + label(a) + ' e ' + label(b) + '.');
        }
      }
    }

    if (before) {
      after.forEach(function (c) {
        var prev = findBefore(c, before);
        var was = prev ? isSoldOut(prev) : false;
        var now = isSoldOut(c);
        if (now && !was) {
          confirms.push(label(c) + ' diventa SOLD OUT: compare la fascia e sparisce il bottone per prenotare.');
        } else if (!now && was) {
          confirms.push(label(c) + ' non è più sold out: torna il bottone per prenotare.');
        }
      });
    } else {
      after.forEach(function (c) {
        if (isSoldOut(c)) confirms.push(label(c) + ' è segnato come SOLD OUT.');
      });
    }

    return { warnings: warnings, confirms: confirms };
  }

  /* ---------- previous version ---------- */

  function fetchWithTimeout(url, options) {
    var ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, FETCH_TIMEOUT) : null;
    if (ctrl) options.signal = ctrl.signal;
    return fetch(url, options).then(function (r) {
      if (timer) clearTimeout(timer);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }, function (e) {
      if (timer) clearTimeout(timer);
      throw e;
    });
  }

  function loadBefore() {
    var api = 'https://api.github.com/repos/' + REPO + '/contents/' + FILE + '?ref=' + BRANCH;
    return fetchWithTimeout(api, {
      cache: 'no-store',
      headers: { Accept: 'application/vnd.github.raw+json' }
    }).catch(function () {
      // Deployed copy: may be a save behind, but better than nothing.
      return fetchWithTimeout('/' + FILE + '?t=' + Date.now(), { cache: 'no-store' });
    }).then(function (d) {
      return d && Array.isArray(d.courses) ? d.courses : null;
    }).catch(function () { return null; });
  }

  /* ---------- dialog ---------- */

  function css() {
    if (document.getElementById('chk-style')) return;
    var s = document.createElement('style');
    s.id = 'chk-style';
    s.textContent = [
      '.chk-overlay{position:fixed;inset:0;z-index:2147483600;display:flex;align-items:center;justify-content:center;',
      'padding:16px;background:rgba(20,10,10,.55);color-scheme:light dark;',
      'font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}',
      '.chk-box{width:min(520px,100%);max-height:calc(100vh - 32px);overflow:auto;border-radius:12px;',
      'background:#fff;color:#1d1d1f;box-shadow:0 20px 60px rgba(0,0,0,.35);padding:22px 22px 18px}',
      '.chk-box h2{margin:0 0 6px;font-size:18px;line-height:1.3}',
      '.chk-box p{margin:0 0 12px;color:#555}',
      '.chk-box h3{margin:14px 0 6px;font-size:13px;letter-spacing:.04em;text-transform:uppercase;color:#7f1117}',
      '.chk-box ul{margin:0;padding:0 0 0 20px}',
      '.chk-box li{margin:0 0 6px}',
      '.chk-actions{display:flex;flex-wrap:wrap;gap:10px;justify-content:flex-end;margin-top:18px}',
      '.chk-btn{font:inherit;font-weight:600;border-radius:8px;padding:9px 16px;cursor:pointer;border:1px solid #c9c2bb;',
      'background:#fff;color:#1d1d1f}',
      '.chk-btn--go{background:#7f1117;border-color:#7f1117;color:#fff}',
      '.chk-btn:focus-visible{outline:3px solid #e8a33d;outline-offset:2px}',
      '@media (prefers-color-scheme:dark){',
      '.chk-box{background:#232326;color:#f2f2f2}.chk-box p{color:#b9b9be}.chk-box h3{color:#ff8f94}',
      '.chk-btn{background:#2f2f33;color:#f2f2f2;border-color:#4a4a50}',
      '.chk-btn--go{background:#b51f24;border-color:#b51f24;color:#fff}}'
    ].join('');
    document.head.appendChild(s);
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function section(box, title, items) {
    if (!items.length) return;
    box.appendChild(el('h3', null, title));
    var ul = el('ul');
    items.forEach(function (t) { ul.appendChild(el('li', null, t)); });
    box.appendChild(ul);
  }

  // Resolves true to save, false to go back to the form.
  function ask(result) {
    css();
    return new Promise(function (resolve) {
      var hasWarnings = result.warnings.length > 0;
      var overlay = el('div', 'chk-overlay');
      var box = el('div', 'chk-box');
      box.setAttribute('role', 'alertdialog');
      box.setAttribute('aria-modal', 'true');
      box.setAttribute('aria-labelledby', 'chk-title');

      var h = el('h2', null, hasWarnings ? 'Controlla prima di salvare' : 'Confermi?');
      h.id = 'chk-title';
      box.appendChild(h);
      box.appendChild(el('p', null, hasWarnings
        ? 'Ho notato qualcosa che potrebbe essere un errore. Se va bene così, salva pure.'
        : 'Questa modifica cambia ciò che vedono i visitatori.'));
      section(box, 'Da controllare', result.warnings);
      section(box, 'Sold out', result.confirms);

      var actions = el('div', 'chk-actions');
      var back = el('button', 'chk-btn', 'Torna a modificare');
      var go = el('button', 'chk-btn chk-btn--go', hasWarnings ? 'Salva comunque' : 'Sì, salva');
      back.type = go.type = 'button';
      actions.appendChild(back);
      actions.appendChild(go);
      box.appendChild(actions);
      overlay.appendChild(box);

      var previous = document.activeElement;
      function done(value) {
        document.removeEventListener('keydown', onKey, true);
        overlay.remove();
        if (previous && previous.focus) previous.focus();
        resolve(value);
      }
      function onKey(e) {
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); done(false); }
        if (e.key === 'Tab') { // keep focus inside the two buttons
          e.preventDefault();
          (document.activeElement === back ? go : back).focus();
        }
      }
      back.addEventListener('click', function () { done(false); });
      go.addEventListener('click', function () { done(true); });
      document.addEventListener('keydown', onKey, true);
      document.body.appendChild(overlay);
      // With a possible mistake the safe choice gets the focus, so Enter
      // doesn't save by reflex; a plain sold-out confirmation defaults to yes.
      (hasWarnings ? back : go).focus();
    });
  }

  /* ---------- hook ---------- */

  function cancelled() {
    return new Error('saving_failed', {
      cause: new Error('Salvataggio annullato: nessuna modifica è stata pubblicata. Correggi e salva di nuovo.')
    });
  }

  function preSave(args) {
    var entry = args && args.entry;
    if (!entry || entry.get('collection') !== COLLECTION) return;
    var data = entry.get('data');
    data = data && data.toJS ? data.toJS() : data;
    var after = data && Array.isArray(data.courses) ? data.courses : null;
    if (!after) return;

    return loadBefore().then(function (before) {
      var result;
      try {
        result = check(after.filter(Boolean), before && before.filter(Boolean));
      } catch (e) {
        // A bug in here must never be what stops Enza from saving.
        console.warn('Course checks skipped:', e);
        return;
      }
      if (!result.warnings.length && !result.confirms.length) return;
      return ask(result).then(function (ok) {
        if (!ok) throw cancelled();
        // Returning nothing tells Sveltia to save the data unchanged.
      });
    });
  }

  // Exposed for testing from the console: CourseChecks.check(after, before).
  window.CourseChecks = { check: check };

  // This script is a classic one and runs before Sveltia's module, so wait
  // for the CMS global instead of assuming it exists.
  var tries = 0;
  (function register() {
    if (window.CMS && typeof window.CMS.registerEventListener === 'function') {
      try {
        window.CMS.registerEventListener({ name: 'preSave', handler: preSave });
      } catch (e) {
        console.warn('Course checks not active:', e);
      }
      return;
    }
    if (++tries < 200) setTimeout(register, 100);
  })();
})();
