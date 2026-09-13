/* GitHub OAuth callback for Sveltia CMS (/admin).
   Exchanges the code for a token and hands it to the CMS window that
   opened this popup. */

// The token is posted to these origins only. postMessage('*') would hand a
// repo-scoped GitHub token to whatever page happened to open the popup.
// Both hosts are listed because the site canonicalises to the apex while
// admin/config.yml's base_url uses www — whichever one the admin opens must work.
// Override per-environment (comma-separated) with OAUTH_ALLOWED_ORIGIN.
// Never derived from request headers: those are attacker-controlled.
const ALLOWED_ORIGINS = (process.env.OAUTH_ALLOWED_ORIGIN ||
  'https://www.enzaebasta.it,https://enzaebasta.it')
  .split(',').map((o) => o.trim()).filter(Boolean);

// redirect_uri must match the OAuth App exactly; the first entry is canonical.
const ALLOWED_ORIGIN = ALLOWED_ORIGINS[0];

// Sveltia stores `state` for us; we only have to check it comes back intact.
function readCookie(req, name) {
  const raw = req.headers.cookie || '';
  const hit = raw.split(';').map((c) => c.trim())
    .find((c) => c.startsWith(name + '='));
  return hit ? decodeURIComponent(hit.slice(name.length + 1)) : null;
}

function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

module.exports = async (req, res) => {
  const { code, state } = req.query || {};

  if (!code) {
    res.statusCode = 400;
    res.end('Missing OAuth code.');
    return;
  }

  // Without this check, an attacker can feed their own `code` to a logged-in
  // admin's browser and bind the CMS session to an account they control.
  const expectedState = readCookie(req, 'oauth_state');
  if (!expectedState || !timingSafeEqual(String(state || ''), expectedState)) {
    res.statusCode = 400;
    res.end('Invalid OAuth state. Please start the login again from /admin.');
    return;
  }

  // One-shot: burn the state cookie so the same code can't be replayed.
  res.setHeader('Set-Cookie', 'oauth_state=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax');

  const clientId = process.env.OAUTH_CLIENT_ID;
  const clientSecret = process.env.OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    res.statusCode = 500;
    res.end('Missing OAuth environment variables.');
    return;
  }

  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: `${ALLOWED_ORIGIN}/api/callback`,
      }),
    });

    const data = await tokenRes.json();

    if (!data.access_token) {
      res.statusCode = 401;
      // GitHub's message can echo back parts of the request — don't reflect it.
      console.error('GitHub OAuth error:', data.error_description || data.error);
      res.end('GitHub OAuth error. Please try signing in again.');
      return;
    }

    const message = 'authorization:github:success:' + JSON.stringify({
      token: data.access_token,
      provider: 'github',
    });

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    // The token is in this document — never let it be cached or framed.
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'none'; script-src 'unsafe-inline'; frame-ancestors 'none'"
    );

    // Sveltia's listener (a) only accepts messages whose origin exactly matches
    // the auth URL it opened — base_url in admin/config.yml — and (b) expects an
    // "authorizing:github" handshake before the token. Answer that handshake on
    // the opener's own origin, but only after checking it against the allowlist,
    // so the token still can't reach an attacker's page.
    res.end(`<!doctype html>
<html>
<body>
<script>
(function () {
  var ALLOWED = ${JSON.stringify(ALLOWED_ORIGINS)};
  var MESSAGE = ${JSON.stringify(message)};
  if (!window.opener) {
    document.body.textContent = 'Please start the login again from /admin.';
    return;
  }

  function send(origin) {
    window.opener.postMessage(MESSAGE, origin);
    window.close();
  }

  // The opener announces itself; we answer only a known-good origin.
  window.addEventListener('message', function (e) {
    if (ALLOWED.indexOf(e.origin) === -1) return;
    if (e.data !== 'authorizing:github') return;
    send(e.origin);
  });

  // Start the handshake on each allowed origin. Only the real opener sees it.
  ALLOWED.forEach(function (origin) {
    try { window.opener.postMessage('authorizing:github', origin); } catch (err) { /* ignore */ }
  });
})();
</script>
</body>
</html>
`);
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    // err.message can carry internal detail; keep it in the logs only.
    res.end('OAuth callback failed.');
  }
};
