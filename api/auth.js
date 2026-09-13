/* GitHub OAuth entry point for Sveltia CMS (/admin).
   Redirects to GitHub's consent screen; api/callback.js finishes the flow. */

const crypto = require('crypto');

// Pinned, not derived from the request: building redirect_uri from the Host
// header lets anyone who can spoof it point the callback at their own domain.
// Comma-separated like callback.js; the first entry is canonical and must match
// the OAuth App's registered callback URL and admin/config.yml's base_url.
const ALLOWED_ORIGIN = (process.env.OAUTH_ALLOWED_ORIGIN ||
  'https://www.enzaebasta.it,https://enzaebasta.it')
  .split(',').map((o) => o.trim()).filter(Boolean)[0];

module.exports = (req, res) => {
  const clientId = process.env.OAUTH_CLIENT_ID;

  if (!clientId) {
    res.statusCode = 500;
    res.end('Missing OAUTH_CLIENT_ID environment variable.');
    return;
  }

  // Ties this redirect to the callback that comes back, so a code minted for
  // someone else's login can't be swapped in (CSRF on the OAuth flow).
  const state = crypto.randomBytes(16).toString('hex');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${ALLOWED_ORIGIN}/api/callback`,
    scope: 'repo',
    state,
  });

  res.setHeader('Set-Cookie',
    `oauth_state=${state}; Path=/; Max-Age=600; HttpOnly; Secure; SameSite=Lax`);
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.writeHead(302, { Location: `https://github.com/login/oauth/authorize?${params.toString()}` });
  res.end();
};
