import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const OUTPUT_ROOT = path.join(ROOT, 'public', 'img', 'pokemon-sprites', 'remote');
const MAP_FILE = path.join(ROOT, 'src', 'lib', 'local-sprite-map.generated.ts');
const SOURCE_FILES = [
  'src/lib/pokemon-data.ts',
  'src/lib/game-themes.ts',
  'src/components/collection/ShinyCard.tsx',
  'src/components/counter/ShinyCounter.tsx',
  'src/components/counter/FinishHuntDialog.tsx',
  'src/components/collection/AddShinyDialog.tsx',
  'src/components/collection/EditShinyDialog.tsx',
  'src/components/collection/EvolveDialog.tsx',
  'src/pages/Bingo.tsx',
  'src/pages/UserCollectionsSearch.tsx',
];

const POKEAPI_HOME_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home';
const CONCURRENCY = Number(process.env.SPRITE_CACHE_CONCURRENCY || 8);

function localPathForUrl(remoteUrl) {
  const url = new URL(remoteUrl);
  const decodedPath = decodeURIComponent(url.pathname)
    .replace(/^\/+/, '')
    .replace(/[^a-zA-Z0-9._/-]/g, '-');
  const querySuffix = url.search
    ? `-${url.searchParams.toString().replace(/[^a-zA-Z0-9._-]/g, '-')}`
    : '';
  const extensionMatch = decodedPath.match(/\.[a-zA-Z0-9]+$/);
  const extension = extensionMatch?.[0] || '.png';
  const withoutExtension = extensionMatch ? decodedPath.slice(0, -extension.length) : decodedPath;
  const relativePath = path.posix.join(
    'img',
    'pokemon-sprites',
    'remote',
    url.hostname,
    `${withoutExtension}${querySuffix}${extension}`,
  );

  return {
    publicUrl: `/${relativePath}`,
    filePath: path.join(ROOT, 'public', ...relativePath.split('/')),
  };
}

async function collectLiteralUrls() {
  const urls = new Set();
  const urlPattern = /https?:\/\/[^'"`\s)]+/g;

  for (const file of SOURCE_FILES) {
    try {
      const content = await fs.readFile(path.join(ROOT, file), 'utf8');
      for (const match of content.matchAll(urlPattern)) {
        urls.add(match[0].replace(/[;,]+$/, ''));
      }
    } catch {
      // Optional files can be absent in local experiments.
    }
  }

  return urls;
}

async function collectPokemonHomeUrls() {
  const urls = new Set();
  const pokedex = JSON.parse(await fs.readFile(path.join(ROOT, 'src', 'lib', 'pokedex.json'), 'utf8'));
  const ids = new Set();

  for (const entry of pokedex) {
    if (Number.isFinite(entry.id)) ids.add(entry.id);
    if (Number.isFinite(entry.baseId)) ids.add(entry.baseId);
  }

  const usePokemon = await fs.readFile(path.join(ROOT, 'src', 'hooks', 'use-pokemon.ts'), 'utf8');
  for (const match of usePokemon.matchAll(/\{\s*id:\s*(\d+),\s*name:/g)) {
    ids.add(Number(match[1]));
  }

  for (const id of ids) {
    urls.add(`${POKEAPI_HOME_BASE}/${id}.png`);
    urls.add(`${POKEAPI_HOME_BASE}/shiny/${id}.png`);
  }

  return urls;
}

async function download(url, map) {
  const { publicUrl, filePath } = localPathForUrl(url);
  map[url] = publicUrl;

  try {
    await fs.access(filePath);
    return { ok: true, skipped: true, url };
  } catch {
    // File does not exist yet.
  }

  const MAX_RETRIES = 3;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'user-agent': 'pokeshinytracker-sprite-cache/1.0',
          'accept': 'image/avif,image/webp,image/png,image/jpeg,image/*,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(15000),
      });

      if (response.status === 404) {
        return { ok: false, status: 404, url };
      }

      if (!response.ok) {
        if (response.status === 429) {
          console.log(`Rate limit 429 on ${url}, waiting...`);
          await new Promise(r => setTimeout(r, 5000 + (attempt * 2000)));
          continue; // retry even past max retries for 429
        }
        if (attempt < MAX_RETRIES) {
          await new Promise(r => setTimeout(r, 1000 * attempt));
          continue;
        }
        return { ok: false, status: response.status, url };
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, buffer);
      return { ok: true, skipped: false, url };
    } catch (err) {
      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, 1500 * attempt));
      } else {
        return { ok: false, status: 0, error: err.message, url };
      }
    }
  }
}

async function runQueue(items, worker) {
  let index = 0;
  const results = [];
  const FIXED_CONCURRENCY = 3;
  const workers = Array.from({ length: FIXED_CONCURRENCY }, async () => {
    while (index < items.length) {
      const current = items[index++];
      results.push(await worker(current));
      if (results.length % 100 === 0) {
        console.log(`Processed ${results.length}/${items.length}`);
      }
    }
  });

  await Promise.all(workers);
  return results;
}

const literalUrls = await collectLiteralUrls();
const homeUrls = await collectPokemonHomeUrls();
const urls = [...new Set([...literalUrls, ...homeUrls])]
  .filter((url) => /^https?:\/\//.test(url))
  .sort();

console.log(`Caching ${urls.length} remote sprite/image URLs...`);

const map = {};
const results = await runQueue(urls, (url) => download(url, map));
const failed = results.filter((result) => !result.ok);
const successfulUrls = new Set(results.filter((result) => result.ok).map((result) => result.url));
const successfulMap = Object.fromEntries(Object.entries(map).filter(([url]) => successfulUrls.has(url)));

const generated = `// Generated by scripts/cache-pokemon-sprites.mjs\nexport const LOCAL_SPRITE_URLS: Record<string, string> = ${JSON.stringify(successfulMap, null, 2)};\n`;
await fs.writeFile(MAP_FILE, generated);

console.log(`Cached or found locally: ${successfulUrls.size}`);
console.log(`Failed: ${failed.length}`);

if (failed.length > 0) {
  await fs.writeFile(
    path.join(ROOT, 'public', 'img', 'pokemon-sprites', 'failed-downloads.json'),
    JSON.stringify(failed, null, 2),
  );
  console.log('Failed download list written to public/img/pokemon-sprites/failed-downloads.json');
}
