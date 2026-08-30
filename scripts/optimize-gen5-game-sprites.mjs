import { mkdir, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';

const root = path.resolve('public/img/game-sprites');
const starterIds = new Set(Array.from({ length: 9 }, (_, index) => 495 + index));

const run = (command, args) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { stdio: 'inherit' });
  child.on('error', reject);
  child.on('exit', code => code === 0 ? resolve() : reject(new Error(`${command} exited with ${code}`)));
});

async function convertSet(set, keep) {
  const sourceDir = path.join(root, set);
  const outputDir = path.join(root, `${set}-optimized`);
  await rm(outputDir, { recursive: true, force: true });
  await mkdir(outputDir, { recursive: true });

  const files = (await readdir(sourceDir))
    .filter(filename => filename.endsWith('.png') && keep(filename))
    .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));

  let cursor = 0;
  const workers = Array.from({ length: 4 }, async () => {
    while (cursor < files.length) {
      const filename = files[cursor++];
      const outputName = filename.replace(/\.png$/i, '.webp');
      await run('ffmpeg', [
        '-loglevel', 'error', '-y', '-i', path.join(sourceDir, filename),
        '-loop', '0', '-lossless', '1', '-compression_level', '4', '-q:v', '100',
        path.join(outputDir, outputName),
      ]);
      if (cursor % 50 === 0 || cursor === files.length) console.log(`${set}: ${cursor}/${files.length}`);
    }
  });
  await Promise.all(workers);

  await rm(sourceDir, { recursive: true, force: true });
  await rename(outputDir, sourceDir);
  const manifest = files.map(filename => filename.replace(/\.png$/i, '.webp'));
  const constant = set === 'bw' ? 'BW_SHINY_SPRITE_FILES' : 'BW2_SHINY_SPRITE_FILES';
  await writeFile(path.resolve(`src/data/${set}-shiny-sprite-manifest.ts`),
    `// Generated optimized animated sprites.\nexport const ${constant} = ${JSON.stringify(manifest, null, 2)} as const;\n`);
}

await convertSet('bw', () => true);
await convertSet('bw2', filename => {
  const match = filename.match(/^Spr_5b2_(\d{3})/i);
  return Boolean(match && starterIds.has(Number(match[1])));
});
