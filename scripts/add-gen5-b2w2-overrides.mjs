import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';

const api = 'https://archives.bulbagarden.net/w/api.php';
const outputDir = path.resolve('public/img/game-sprites/bw2');
const overrides = ['Spr_5b2_248_s.png', 'Spr_5b2_546_s.png'];
const userAgent = 'PokeShinyTracker sprite archive builder';

const run = (command, args) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { stdio: 'inherit' });
  child.on('error', reject);
  child.on('exit', code => code === 0 ? resolve() : reject(new Error(`${command} exited with ${code}`)));
});

await mkdir(outputDir, { recursive: true });

for (const filename of overrides) {
  const url = new URL(api);
  for (const [key, value] of Object.entries({
    action: 'query',
    titles: `File:${filename}`,
    prop: 'imageinfo',
    iiprop: 'url|mime',
    format: 'json',
    formatversion: '2',
  })) url.searchParams.set(key, value);

  const response = await fetch(url, { headers: { 'User-Agent': userAgent } });
  if (!response.ok) throw new Error(`Metadata request failed for ${filename}: ${response.status}`);
  const metadata = await response.json();
  const sourceUrl = metadata.query?.pages?.[0]?.imageinfo?.[0]?.url;
  if (!sourceUrl) throw new Error(`Original file not found: ${filename}`);

  const sourcePath = path.resolve(filename);
  const image = await fetch(sourceUrl, { headers: { 'User-Agent': userAgent } });
  if (!image.ok) throw new Error(`Image request failed for ${filename}: ${image.status}`);
  await writeFile(sourcePath, Buffer.from(await image.arrayBuffer()));

  const outputName = filename.replace(/\.png$/i, '.webp');
  await run('ffmpeg', [
    '-loglevel', 'error', '-y', '-i', sourcePath,
    '-loop', '0', '-lossless', '1', '-compression_level', '4', '-q:v', '100',
    path.join(outputDir, outputName),
  ]);
  await rm(sourcePath, { force: true });
}

const manifest = (await readdir(outputDir))
  .filter(filename => filename.endsWith('.webp'))
  .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));

await writeFile(path.resolve('src/data/bw2-shiny-sprite-manifest.ts'),
  `// Generated optimized animated B2W2 overrides.\nexport const BW2_SHINY_SPRITE_FILES = ${JSON.stringify(manifest, null, 2)} as const;\n`);

if (manifest.length !== 11) throw new Error(`Expected 11 B2W2 overrides, found ${manifest.length}`);
