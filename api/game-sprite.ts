const ARCHIVE_API_URL = 'https://archives.bulbagarden.net/w/api.php';
// Game sprites are fetched server-side because Archive redirect URLs are not
// consistently reachable from mobile clients. In particular, the Archive's
// Special:Redirect endpoint may return an HTML challenge instead of the PNG
// for Sword/Shield models. Resolve the file through MediaWiki's imageinfo API
// first, then fetch its canonical media URL.
//
// This accepts every filename shape that the game-sprite resolver can
// generate, including Gen VIII regional-form suffixes with or without a
// hyphen (for example, `Spr_8s_078G_s.png`).
const GAME_SPRITE_FILE = /^Spr_[238][a-z0-9]*_\d{3}(?:-?[A-Z]+)?(?:_[mf])?_s\.png$/i;

const imageUrlPromises = new Map<string, Promise<string | null>>();

type SpriteRequest = {
  query?: Record<string, unknown>;
};

type SpriteResponse = {
  status: (code: number) => SpriteResponse;
  json: (body: unknown) => void;
  end: () => void;
  send: (body: Buffer) => void;
  setHeader: (name: string, value: string) => void;
};

const resolveArchiveImageUrl = (file: string): Promise<string | null> => {
  const cached = imageUrlPromises.get(file);
  if (cached) return cached;

  const request = (async () => {
    const url = new URL(ARCHIVE_API_URL);
    url.search = new URLSearchParams({
      action: 'query',
      format: 'json',
      formatversion: '2',
      prop: 'imageinfo',
      iiprop: 'url|mime',
      titles: `File:${file}`,
    }).toString();

    const response = await fetch(url, {
      headers: { 'User-Agent': 'PokeShinyTracker game-sprite proxy' },
    });
    if (!response.ok) return null;

    const payload = await response.json();
    const image = payload?.query?.pages?.[0]?.imageinfo?.[0];
    return image?.mime === 'image/png' && typeof image.url === 'string'
      ? image.url
      : null;
  })();

  imageUrlPromises.set(file, request);
  return request;
};

export default async function handler(request: SpriteRequest, response: SpriteResponse) {
  const file = typeof request.query?.file === 'string' ? request.query.file : '';

  if (!GAME_SPRITE_FILE.test(file)) {
    response.status(400).json({ error: 'Invalid game sprite file.' });
    return;
  }

  try {
    const imageUrl = await resolveArchiveImageUrl(file);
    if (!imageUrl) {
      response.status(404).end();
      return;
    }

    const upstream = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'PokeShinyTracker game-sprite proxy',
        Accept: 'image/png,image/*;q=0.8,*/*;q=0.5',
        Referer: 'https://archives.bulbagarden.net/',
      },
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
