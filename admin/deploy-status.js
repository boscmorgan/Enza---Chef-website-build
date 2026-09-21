/* Deploy status badge for /admin.
   ---------------------------------
   Sveltia tells you a save succeeded as soon as the commit lands on GitHub.
   That is only half the story: the commit still has to survive Vercel's build,
   and when it doesn't, the CMS has no way of knowing — the panel says "saved",
   the site keeps serving the old content, and the only visible symptom is an
   edit that seems to do nothing. That gap is what produced the duplicated
   "A Tutto Tofu!" entry on 2026-09-21: four saves in a row were blocked by
   Vercel, so the same change was made over and over.

   This badge closes the gap by reading the commit status GitHub already
   publishes for the newest commit on the branch, and saying — in plain Italian
   for Enza, with the technical detail folded away for us — whether the site
   actually updated.

   Design notes
   ------------
   * No backend, no secret, no token. GitHub's commit-status API is public for
     this repo and sends `access-control-allow-origin: *`, so the browser reads
     it directly — which also means the unauthenticated 60/hour-per-IP limit
     applies, and the polling intervals below are sized to stay under it.
   * Read-only, and scoped to this one repo's status endpoint.
   * Everything is namespaced under `.dpl-` and lives in a fixed-position
     element, so nothing here depends on Sveltia's internal DOM or CSS. A CMS
     upgrade can restyle the whole panel without touching this.
*/
(function () {
  'use strict';

  var REPO = 'boscmorgan/Enza---Chef-website-build';
  var BRANCH = 'main';

  // Unauthenticated GitHub allows 60 requests/hour per IP, shared with
  // everything else on that connection — and we get no token (see token()
  // in api()). So the budget, not the UI, sets the pace: idle polling is rare,
  // and the fast polling only runs while a build is actually in flight, which
  // lasts a couple of minutes at most.
  var POLL_IDLE = 300000;   // 5 min — 12 checks/hour when nothing is happening
  var POLL_ACTIVE = 20000;  // during a build only
  var POLL_THROTTLED = 600000; // after a 403: back off hard until the reset
  var FOCUS_MIN_GAP = 60000;   // ignore tab-focus re-checks inside this window

  var els = {};
  var state = {
    sha: null, open: false, timer: null,
    lastFetch: 0,       // when the last network round-trip happened
    lastView: null,     // last rendered view, reused while throttled
    commitMeta: null,   // author/message/date for the current sha
    etagCommits: null,  // ETags save bandwidth; they do not save quota
    etagStatus: null,
    cacheCommits: null,
    cacheStatus: null
  };

  function css() {
    var s = document.createElement('style');
    s.textContent = [
      '.dpl{position:fixed;right:16px;bottom:16px;z-index:2147483000;',
      'font:13px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;',
      'max-width:min(380px,calc(100vw - 32px));color-scheme:light dark}',
      '.dpl-pill{display:flex;align-items:center;gap:8px;width:100%;',
      'padding:9px 13px;border-radius:999px;border:1px solid rgba(128,128,128,.32);',
      'background:Canvas;color:CanvasText;cursor:pointer;text-align:left;',
      'box-shadow:0 2px 12px rgba(0,0,0,.16);font:inherit}',
      '.dpl-pill:hover{border-color:rgba(128,128,128,.55)}',
      '.dpl-pill:focus-visible{outline:2px solid Highlight;outline-offset:2px}',
      '.dpl-dot{flex:none;width:9px;height:9px;border-radius:50%;background:#9aa0a6}',
      '.dpl-dot.ok{background:#1a9c4b}.dpl-dot.bad{background:#d32f2f}',
      '.dpl-dot.wait{background:#e2a03f;animation:dpl-p 1.3s ease-in-out infinite}',
      '@keyframes dpl-p{50%{opacity:.35}}',
      '@media (prefers-reduced-motion:reduce){.dpl-dot.wait{animation:none}}',
      '.dpl-txt{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.dpl-car{flex:none;opacity:.5;transition:transform .15s}',
      '.dpl[data-open="1"] .dpl-car{transform:rotate(180deg)}',
      '.dpl-panel{margin-top:8px;padding:13px 15px;border-radius:12px;',
      'border:1px solid rgba(128,128,128,.32);background:Canvas;color:CanvasText;',
      'box-shadow:0 6px 24px rgba(0,0,0,.2)}',
      '.dpl-panel[hidden]{display:none}',
      '.dpl-panel p{margin:0 0 9px}',
      '.dpl-what{font-weight:600}',
      '.dpl-do{opacity:.88}',
      '.dpl-meta{margin:10px 0 0;padding-top:9px;border-top:1px solid rgba(128,128,128,.2);',
      'font-size:11.5px;opacity:.62;word-break:break-word}',
      '.dpl-meta code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}',
      '.dpl-meta a{color:inherit}',
      '.dpl-meta summary{cursor:pointer;opacity:.8}'
    ].join('');
    document.head.appendChild(s);
  }

  function build() {
    var root = document.createElement('div');
    root.className = 'dpl';
    root.setAttribute('data-open', '0');
    root.innerHTML =
      '<button type="button" class="dpl-pill" aria-expanded="false">' +
        '<span class="dpl-dot" aria-hidden="true"></span>' +
        '<span class="dpl-txt">Controllo pubblicazione…</span>' +
        '<span class="dpl-car" aria-hidden="true">▾</span>' +
      '</button>' +
      '<div class="dpl-panel" hidden>' +
        '<p class="dpl-what"></p>' +
        '<p class="dpl-do"></p>' +
        '<div class="dpl-meta"></div>' +
      '</div>';

    els.root = root;
    els.pill = root.querySelector('.dpl-pill');
    els.dot = root.querySelector('.dpl-dot');
    els.txt = root.querySelector('.dpl-txt');
    els.panel = root.querySelector('.dpl-panel');
    els.what = root.querySelector('.dpl-what');
    els.doing = root.querySelector('.dpl-do');
    els.meta = root.querySelector('.dpl-meta');

    els.pill.addEventListener('click', function () {
      state.open = !state.open;
      els.panel.hidden = !state.open;
      els.root.setAttribute('data-open', state.open ? '1' : '0');
      els.pill.setAttribute('aria-expanded', state.open ? 'true' : 'false');
    });

    document.body.appendChild(root);
  }

  // No token. An earlier version tried to reuse Sveltia's GitHub token for the
  // higher rate limit, but Sveltia does not keep it anywhere we can read: local
  // storage holds only prefs and a translations blob, and its IndexedDB holds
  // only UI settings. Reaching further into its internals would be guesswork
  // that breaks on the next CMS upgrade, so the badge stays unauthenticated and
  // lives within the 60/hour budget instead — see the polling constants above.
  //
  // ETags are still sent, but only to save bandwidth: measured against this
  // repo, an unauthenticated 304 DOES decrement x-ratelimit-remaining, so they
  // buy no extra headroom. The polling intervals are what keep us inside the
  // budget — at worst 2 requests per 5 min idle (24/h), leaving room for the
  // faster polling during a build and for anything else sharing the IP.
  function api(path, etagKey, cacheKey) {
    var headers = { Accept: 'application/vnd.github+json' };
    if (state[etagKey]) headers['If-None-Match'] = state[etagKey];

    return fetch('https://api.github.com/repos/' + REPO + path, { headers: headers })
      .then(function (r) {
        var remaining = r.headers.get('x-ratelimit-remaining');
        if (remaining !== null) state.remaining = Number(remaining);

        if (r.status === 304 && state[cacheKey]) return state[cacheKey];

        if (r.status === 403 || r.status === 429) {
          var err = new Error('rate limit GitHub esaurito');
          err.throttled = true;
          err.reset = r.headers.get('x-ratelimit-reset');
          throw err;
        }

        if (!r.ok) throw new Error('GitHub API ' + r.status + ' su ' + path);

        var tag = r.headers.get('etag');
        if (tag) state[etagKey] = tag;
        return r.json().then(function (body) {
          state[cacheKey] = body;
          return body;
        });
      });
  }

  function when(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    var mins = Math.round((Date.now() - d.getTime()) / 60000);
    if (mins < 1) return 'poco fa';
    if (mins < 60) return mins + ' min fa';
    if (mins < 1440) return 'circa ' + Math.round(mins / 60) + ' ore fa';
    return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' });
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // The two audiences the badge serves: `what`/`did` speak plain Italian to
  // whoever is editing; `meta` carries the detail we need to debug.
  function render(v) {
    els.dot.className = 'dpl-dot ' + v.tone;
    els.txt.textContent = v.short;
    els.what.textContent = v.what;
    els.doing.textContent = v.did;
    els.meta.innerHTML = v.meta;
    els.pill.setAttribute('title', v.what);
  }

  function metaBlock(commit, status, extra) {
    var rows = [];
    if (commit) {
      rows.push('commit <code>' + esc(commit.sha.slice(0, 7)) + '</code> di ' +
        esc((commit.commit.author && commit.commit.author.name) || '—') +
        ' · ' + esc(when(commit.commit.author && commit.commit.author.date)));
      rows.push('«' + esc(commit.commit.message.split('\n')[0]) + '»');
    }
    if (status) {
      rows.push('Vercel: <code>' + esc(status.state) + '</code> — ' + esc(status.description || '—'));
      if (status.target_url) {
        rows.push('<a href="' + esc(status.target_url) + '" target="_blank" rel="noopener">log del deploy ↗</a>');
      }
    }
    if (extra) rows.push(esc(extra));
    return '<details><summary>Dettagli tecnici</summary><div style="margin-top:7px">' +
      rows.join('<br>') + '</div></details>';
  }

  function interpret(commit, statuses) {
    // Vercel reports under the "Vercel" context; the Actions run posts a check,
    // not a status, and is deliberately ignored — it goes green merely for
    // firing the deploy hook, which is exactly the false reassurance that hid
    // the September breakage.
    var vercel = null;
    for (var i = 0; i < statuses.length; i++) {
      if ((statuses[i].context || '').toLowerCase().indexOf('vercel') === 0) { vercel = statuses[i]; break; }
    }

    var ago = when(commit.commit.author && commit.commit.author.date);

    if (!vercel) {
      return {
        tone: 'wait', short: 'Pubblicazione in corso…',
        what: 'La modifica è stata salvata, ma la pubblicazione non è ancora iniziata.',
        did: 'Aspetta un minuto: di solito parte da sola. Questa finestra si aggiorna.',
        meta: metaBlock(commit, null, 'Nessuno stato Vercel sul commit (build non ancora avviata).')
      };
    }

    if (vercel.state === 'success') {
      state.lastGood = commit.sha;
      return {
        tone: 'ok', short: 'Online — ultima modifica ' + ago,
        what: 'Tutto pubblicato. Le tue modifiche sono visibili sul sito.',
        did: 'Se non le vedi, ricarica la pagina del sito tenendo premuto Shift.',
        meta: metaBlock(commit, vercel)
      };
    }

    if (vercel.state === 'pending') {
      return {
        tone: 'wait', short: 'Pubblicazione in corso…',
        what: 'Modifica salvata, il sito si sta aggiornando.',
        did: 'Ci vogliono un paio di minuti. Non serve salvare di nuovo.',
        meta: metaBlock(commit, vercel)
      };
    }

    // failure or error
    var blocked = /block/i.test(vercel.description || '');
    return {
      tone: 'bad', short: 'NON pubblicato — errore',
      what: blocked
        ? 'La modifica è salvata, ma il sito non è stato aggiornato: la pubblicazione è stata bloccata.'
        : 'La modifica è salvata, ma la pubblicazione è fallita: il sito mostra ancora la versione precedente.',
      did: 'Non rifare la stessa modifica: è già salvata, e ripeterla crea doppioni. Avvisa Morgan con lo screenshot di questa finestra.',
      meta: metaBlock(commit, vercel)
    };
  }

  function tick() {
    state.lastFetch = Date.now();
    // One request covers the common case: /commits/<branch>/status resolves the
    // branch itself and returns both the head sha and its statuses. The commit
    // details (author, message, date) need a second request, so we only spend
    // it when the sha has actually changed — on a quiet repo that is never.
    api('/commits/' + BRANCH + '/status', 'etagStatus', 'cacheStatus')
      .then(function (st) {
        var sha = st && st.sha;
        if (!sha) throw new Error('nessuno stato per ' + BRANCH);
        var statuses = (st && st.statuses) || [];

        if (state.commitMeta && state.commitMeta.sha === sha) {
          return interpret(state.commitMeta, statuses);
        }
        state.sha = sha;
        return api('/commits/' + sha, 'etagCommits', 'cacheCommits')
          .then(function (commit) {
            state.commitMeta = commit;
            return interpret(commit, statuses);
          });
      })
      .then(function (view) {
        state.lastView = view;
        render(view);
        schedule(view.tone === 'wait' ? POLL_ACTIVE : POLL_IDLE);
      })
      .catch(function (err) {
        // Running out of quota says nothing about the deploy. Keep showing the
        // last known answer rather than replacing it with an alarm, and just
        // note underneath that the check is paused.
        if (err && err.throttled && state.lastView) {
          var stale = {};
          for (var k in state.lastView) stale[k] = state.lastView[k];
          stale.did = 'Controllo in pausa per qualche minuto (limite di richieste a GitHub). ' +
            'Il dato qui sopra è l\'ultimo verificato; riprendo da solo.';
          stale.meta = metaBlock(null, null,
            'HTTP 403: rate limit GitHub non autenticato (60/h per IP) esaurito. Ripresa automatica.');
          render(stale);
          schedule(POLL_THROTTLED);
          return;
        }

        // A failed check is not a failed deploy — say so, rather than implying
        // the site is broken.
        var throttled = !!(err && err.throttled);
        render({
          tone: '', short: 'Stato pubblicazione non disponibile',
          what: 'Non riesco a controllare se il sito è aggiornato.',
          did: throttled
            ? 'Non è un problema del sito: ho fatto troppe richieste a GitHub e devo aspettare. Riprendo da solo fra qualche minuto.'
            : 'Non è detto che ci sia un problema: probabilmente è solo la connessione. Riprovo da solo.',
          meta: metaBlock(null, null, throttled
            ? 'HTTP 403: rate limit GitHub non autenticato (60/h per IP) esaurito. Ripresa automatica.'
            : String(err && err.message || err))
        });
        schedule(err && err.throttled ? POLL_THROTTLED : POLL_IDLE);
      });
  }

  function schedule(ms) {
    clearTimeout(state.timer);
    state.timer = setTimeout(tick, ms);
  }

  function start() {
    css();
    build();
    tick();
    // A save is the moment the answer changes, so re-check shortly after the
    // tab comes back into focus too.
    document.addEventListener('visibilitychange', function () {
      // Rate-limited, so don't re-check on every tab switch: only if the last
      // round-trip is old enough to be worth spending a request on.
      if (!document.hidden && Date.now() - state.lastFetch > FOCUS_MIN_GAP) schedule(1500);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
