module.exports = async (req, res) => {
  const { code } = req.query || {};

  if (!code) {
    res.statusCode = 400;
    res.end('Missing OAuth code.');
    return;
  }

  const clientId = process.env.OAUTH_CLIENT_ID;
  const clientSecret = process.env.OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    res.statusCode = 500;
    res.end('Missing OAUTH_CLIENT_ID / OAUTH_CLIENT_SECRET environment variables.');
    return;
  }

  let data;
  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
    });
    data = await tokenRes.json();
  } catch (err) {
    res.statusCode = 502;
    res.end('Could not reach GitHub for token exchange.');
    return;
  }

  if (!data || data.error || !data.access_token) {
    res.statusCode = 401;
    res.end('GitHub OAuth error: ' + ((data && (data.error_description || data.error)) || 'unknown'));
    return;
  }

  const payload = JSON.stringify({
  token: data.access_token,
  provider: 'github'
});

res.setHeader('Content-Type', 'text/html; charset=utf-8');

res.end(`<!doctype html>
<html>
<body>
<script>
(function () {
  const message = 'authorization:github:success:${payload}';

  if (window.opener) {
    window.opener.postMessage(message, '*');
  }

  window.close();
})();
</script>
</body>
</html>`);
