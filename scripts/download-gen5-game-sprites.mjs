import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const API = 'https://archives.bulbagarden.net/w/api.php';
const jobs = [
  ['bw', 'Black_and_White_Shiny_sprites'],
  ['bw2', 'Black_2_and_White_2_Shiny_sprites'],
];
const ua = 'PokeShinyTracker sprite archive builder';

for (const [set, category] of jobs) {
  const files = [];
  let cont;
  do {
    const url = new URL(API);
    for (const [key, value] of Object.entries({ action: 'query', generator: 'categorymembers', gcmtitle: `Category:${category.replaceAll('_', ' ')}`, gcmtype: 'file', gcmlimit: 'max', prop: 'imageinfo', iiprop: 'url|mime', format: 'json', formatversion: '2' })) url.searchParams.set(key, value);
    if (cont) url.searchParams.set('gcmcontinue', cont);
    const data = await (await fetch(url, { headers: { 'User-Agent': ua } })).json();
    for (const page of data.query?.pages || []) {
      const info = page.imageinfo?.[0];
      if (info?.mime === 'image/png') files.push({ filename: page.title.replace(/^File:/, '').replaceAll(' ', '_'), url: info.url });
    }
    cont = data.continue?.gcmcontinue;
  } while (cont);
  files.sort((a, b) => a.filename.localeCompare(b.filename, 'en', { numeric: true }));
  const dir = path.resolve(`public/img/game-sprites/${set}`);
  await mkdir(dir, { recursive: true });
  for (let i = 0; i < files.length; i++) {
    const bytes = Buffer.from(await (await fetch(files[i].url, { headers: { 'User-Agent': ua } })).arrayBuffer());
    await writeFile(path.join(dir, files[i].filename), bytes);
    if ((i + 1) % 50 === 0 || i + 1 === files.length) console.log(`${set}: ${i + 1}/${files.length}`);
  }
  await writeFile(path.resolve(`src/data/${set}-shiny-sprite-manifest.ts`), `// Generated from Bulbagarden Archives: Category:${category.replaceAll('_', ' ')}.\nexport const ${set.toUpperCase()}_SHINY_SPRITE_FILES = ${JSON.stringify(files.map((f) => f.filename), null, 2)} as const;\n`);
}
