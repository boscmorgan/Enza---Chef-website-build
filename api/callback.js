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
    res.end('Missing OAuth environment variables.');
    return;
  }

  try {
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const redirectUri = `${proto}://${host}/api/callback`;

    const tokenRes = await fetch(
      'https://github.com/login/oauth/access_token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: redirectUri,
        }),
      }
    );

    const data = await tokenRes.json();

    if (!data.access_token) {
      res.statusCode = 401;
      res.end(
        'GitHub OAuth error: ' +
        (data.error_description || data.error || 'unknown')
      );
      return;
    }

    const message =
      'authorization:github:success:' +
      JSON.stringify({
        token: data.access_token,
        provider: 'github',
      });

    res.setHeader('Content-Type', 'text/html; charset=utf-8');

    res.end(`
<!doctype html>
<html>
<body>
<script>
window.opener.postMessage(
  ${JSON.stringify(message)},
  '*'
);
window.close();
</script>
</body>
</html>
`);
  } catch (err) {
    console.error(err);

    res.statusCode = 500;
    res.end(
      'OAuth callback failed: ' + err.message
    );
  }
};