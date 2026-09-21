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
   * No backend, no secret. GitHub's commit-status API is public for this repo
     and sends `access-control-allow-origin: *`, so the browser can read it.
     If a Sveltia GitHub token happens to be in local storage we send it, purely
     to get the 5000/h authenticated rate limit instead of 60/h per IP; the
     badge works without it.
   * Read-only, and scoped to this one repo's status endpoint.
   * Everything is namespaced under `.dpl-` and lives in a fixed-position
     element, so nothing here depends on Sveltia's internal DOM or CSS. A CMS
     upgrade can restyle the whole panel without touching this.
*/
(function () {
  'use strict';

  var REPO = 'boscmorgan/Enza---Chef-website-build';
  var BRANCH = 'main';

  // Vercel builds take a couple of minutes; poll faster while something is in
  // flight so the badge turns green shortly after the save, then back off.
  var POLL_IDLE = 60000;
  var POLL_ACTIVE = 15000;

  var els = {};
  var state = { sha: null, open: false, timer: null, lastGood: null };

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

  // Sveltia keeps its GitHub token in local storage. We only borrow it for the
  // rate limit — every call here is a read of this repo's public status.
  function token() {
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (!k || k.toLowerCase().indexOf('sveltia') === -1) continue;
        var raw = localStorage.getItem(k);
        if (!raw || raw.indexOf('token') === -1) continue;
        var hit = JSON.parse(raw);
        var t = hit && (hit.token || (hit.github && hit.github.token));
        if (typeof t === 'string' && t) return t;
      }
    } catch (_) { /* private mode, or a shape we don't recognise */ }
    return null;
  }

  function api(path) {
    var headers = { Accept: 'application/vnd.github+json' };
    var t = token();
    if (t) headers.Authorization = 'Bearer ' + t;
    return fetch('https://api.github.com/repos/' + REPO + path, { headers: headers })
      .then(function (r) {
        if (!r.ok) throw new Error('GitHub API ' + r.status + ' su ' + path);
        return r.json();
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
    api('/commits?sha=' + BRANCH + '&per_page=1')
      .then(function (list) {
        if (!list || !list.length) throw new Error('nessun commit su ' + BRANCH);
        var commit = list[0];
        state.sha = commit.sha;
        return api('/commits/' + commit.sha + '/status').then(function (st) {
          return interpret(commit, (st && st.statuses) || []);
        });
      })
      .then(function (view) {
        render(view);
        schedule(view.tone === 'wait' ? POLL_ACTIVE : POLL_IDLE);
      })
      .catch(function (err) {
        // A failed check is not a failed deploy — say so, rather than implying
        // the site is broken.
        render({
          tone: '', short: 'Stato pubblicazione non disponibile',
          what: 'Non riesco a controllare se il sito è aggiornato.',
          did: 'Non è detto che ci sia un problema: probabilmente è solo la connessione. Riprovo da solo.',
          meta: metaBlock(null, null, String(err && err.message || err))
        });
        schedule(POLL_IDLE);
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
      if (!document.hidden) schedule(1500);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
