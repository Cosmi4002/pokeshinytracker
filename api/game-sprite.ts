const ARCHIVE_BASE_URL = 'https://archives.bulbagarden.net/wiki/Special:Redirect/file/';
// Game sprites are fetched server-side because Archive redirect URLs are not
// consistently reachable from mobile clients. This accepts every filename
// shape that the game-sprite resolver can generate, including Gen VIII's
// hyphenated regional-form suffixes (for example, `Spr_8s_078-G_s.png`).
const GAME_SPRITE_FILE = /^Spr_[238][a-z0-9]*_\d{3}(?:-[A-Z]+)?(?:_[mf])?_s\.png$/i;

export default async function handler(request: any, response: any) {
  const file = typeof request.query?.file === 'string' ? request.query.file : '';

  if (!GAME_SPRITE_FILE.test(file)) {
    response.status(400).json({ error: 'Invalid game sprite file.' });
    return;
  }

  try {
    const upstream = await fetch(`${ARCHIVE_BASE_URL}${encodeURIComponent(file)}`, {
      headers: { 'User-Agent': 'PokeShinyTracker game-sprite proxy' },
    });

    if (!upstream.ok || !upstream.headers.get('content-type')?.startsWith('image/')) {
      response.status(upstream.status === 404 ? 404 : 502).end();
      return;
    }

    response.setHeader('Content-Type', upstream.headers.get('content-type'));
    response.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=31536000, immutable');
    response.status(200).send(Buffer.from(await upstream.arrayBuffer()));
  } catch {
    response.status(502).end();
  }
}
