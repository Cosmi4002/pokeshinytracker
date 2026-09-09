import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const CATEGORY = 'Category:Sword and Shield Shiny models';
const API_URL = 'https://archives.bulbagarden.net/w/api.php';
const OUTPUT = path.resolve('src/data/sword-shield-shiny-model-manifest.ts');
const REPORT = path.resolve('reports/sword-shield-shiny-model-import.json');
const CATALOG = path.resolve('src/lib/pokemon-catalog-v2.generated.json');
const USER_AGENT = 'PokeShinyTracker Sword/Shield manifest builder (https://github.com/Cosmi4002/pokeshinytracker)';

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const normalize = (value) => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Archive form suffixes are not self-describing.  Add an entry only after the
// corresponding file has been returned by the category API; unknown suffixes
// are deliberately reported instead of falling back to an incorrect base form.
const FORM_BY_SPECIES_AND_SUFFIX = {
  '52:G': 'meowth-galar',
  '77:G': 'ponyta-galar',
  '78:G': 'rapidash-galar',
  '83:G': 'farfetchd-galar',
  '110:G': 'weezing-galar',
  '122:G': 'mr-mime-galar',
  '144:G': 'articuno-galar',
  '145:G': 'zapdos-galar',
  '146:G': 'moltres-galar',
  '222:G': 'corsola-galar',
  '263:G': 'zigzagoon-galar',
  '264:G': 'linoone-galar',
  '554:G': 'darumaka-galar',
  '555:G': 'darmanitan-galar',
  '562:G': 'yamask-galar',
  '618:G': 'stunfisk-galar',
};

// Bulbagarden's category records some regional models with a hyphen before
// the form suffix, while their working redirect filenames omit it. Keep the
// explicit, verified redirect filenames for the affected Sword/Shield forms.
const VERIFIED_REDIRECT_FILENAME_BY_SPECIES_AND_SUFFIX = new Map([
  ...[26, 27, 28, 37, 38, 50, 51, 52, 53, 103, 105].map((speciesId) => [`${speciesId}:A`, `Spr_8s_${String(speciesId).padStart(3, '0')}A_s.png`]),
  ...[52, 77, 78, 79, 80, 83, 110, 122, 144, 145, 146, 199, 222, 263, 264, 554, 555, 562, 618].map((speciesId) => [`${speciesId}:G`, `Spr_8s_${String(speciesId).padStart(3, '0')}G_s.png`]),
]);

// These gender-different species use an explicit male filename on the
// Archive. The category's unqualified entry is not a working redirect, so
// retain the verified male filename and mark it as such in the manifest.
const VERIFIED_MALE_REDIRECT_SPECIES_IDS = new Set([
  3, 12, 25, 26, 41, 42, 44, 45, 64, 65, 111, 112, 118, 119, 123, 129, 130, 133,
  185, 186, 194, 195, 202, 208, 212, 214, 215, 221, 224, 272, 274, 275, 307,
  308, 315, 316, 317, 322, 323, 332, 350, 369, 403, 404, 405, 407, 415, 417,
  418, 419, 443, 444, 445, 449, 450, 453, 454, 456, 457, 459, 460, 461, 464,
  465, 473, 521, 592, 593, 668, 678, 876,
]);

// Eevee's female model is a verified redirect but is absent from the category
// feed. The remaining requested female models are already supplied by it.
const VERIFIED_FEMALE_REDIRECT_SPECIES_IDS = new Set([133]);

// These alternate forms have verified Sword/Shield Archive redirects but are
// not consistently exposed by the category feed. Add them from the canonical
// catalogue so every UI using the shared SWSH resolver receives the correct
// game model.
const VERIFIED_FORM_SPRITE_FILENAME_BY_CANONICAL_NAME = new Map([
  ['rotom-heat', 'Spr_8s_479O_s.png'], ['rotom-wash', 'Spr_8s_479W_s.png'],
  ['rotom-frost', 'Spr_8s_479F_s.png'], ['rotom-fan', 'Spr_8s_479R_s.png'], ['rotom-mow', 'Spr_8s_479L_s.png'],
  ['giratina-origin', 'Spr_8s_487O_s.png'], ['shellos-east', 'Spr_8s_422E_s.png'], ['gastrodon-east', 'Spr_8s_423E_s.png'],
  ['basculin-blue-striped', 'Spr_8s_550B_s.png'], ['tornadus-therian', 'Spr_8s_641T_s.png'],
  ['thundurus-therian', 'Spr_8s_642T_s.png'], ['landorus-therian', 'Spr_8s_645T_s.png'],
  ['kyurem-black', 'Spr_8s_646B_s.png'], ['kyurem-white', 'Spr_8s_646W_s.png'],
  ['pumpkaboo-small', 'Spr_8s_710Sm_s.png'], ['pumpkaboo-large', 'Spr_8s_710La_s.png'], ['pumpkaboo-super', 'Spr_8s_710Su_s.png'],
  ['gourgeist-small', 'Spr_8s_711Sm_s.png'], ['gourgeist-large', 'Spr_8s_711La_s.png'], ['gourgeist-super', 'Spr_8s_711Su_s.png'],
  ['zygarde-10', 'Spr_8s_718T_s.png'], ['lycanroc-midnight', 'Spr_8s_745Mn_s.png'], ['lycanroc-dusk', 'Spr_8s_745D_s.png'],
  ...['bug', 'dark', 'dragon', 'electric', 'fairy', 'fighting', 'fire', 'flying', 'ghost', 'grass', 'ground', 'ice', 'poison', 'psychic', 'rock', 'steel', 'water']
    .map((type) => [`silvally-${type}`, `Spr_8s_773${type[0].toUpperCase()}${type.slice(1)}_s.png`]),
  ['necrozma-dusk', 'Spr_8s_800DM_s.png'], ['necrozma-dawn', 'Spr_8s_800DW_s.png'],
  ['toxtricity-low-key', 'Spr_8s_849L_s.png'], ['urshifu-rapid-strike', 'Spr_8s_892R_s.png'],
  ['zacian-crowned', 'Spr_8s_888C_s.png'], ['zamazenta-crowned', 'Spr_8s_889C_s.png'],
  ['zarude-dada', 'Spr_8s_893D_s.png'], ['calyrex-ice', 'Spr_8s_898I_s.png'], ['calyrex-shadow', 'Spr_8s_898S_s.png'],
]);
const VERIFIED_NON_CATALOG_FORM_SPRITES = [
  { speciesId: 888, canonicalName: 'zacian-crowned', filename: 'Spr_8s_888C_s.png' },
  { speciesId: 889, canonicalName: 'zamazenta-crowned', filename: 'Spr_8s_889C_s.png' },
];

async function fetchCategoryFiles() {
  const files = [];
  let continuation;
  do {
    const url = new URL(API_URL);
    Object.entries({ action: 'query', generator: 'categorymembers', gcmtitle: CATEGORY, gcmtype: 'file', gcmlimit: 'max', prop: 'imageinfo', iiprop: 'url|size|mime', format: 'json', formatversion: '2' })
      .forEach(([key, value]) => url.searchParams.set(key, value));
    if (continuation) url.searchParams.set('gcmcontinue', continuation);
    const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!response.ok) throw new Error(`Category request failed (${response.status}): ${url}`);
    const payload = await response.json();
    for (const page of payload.query?.pages || []) {
      const info = page.imageinfo?.[0];
      if (info?.url && info.mime === 'image/png') files.push(page.title.replace(/^File:/, '').replaceAll(' ', '_'));
    }
    continuation = payload.continue?.gcmcontinue;
    if (continuation) await sleep(250);
  } while (continuation);
  return [...new Set(files)].sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
}

const parse = (filename) => {
  const match = filename.match(/^Spr_8s_(\d{3})(.*?)(?:_([mf]))?_s\.png$/i);
  if (!match) return null;
  return { filename, speciesId: Number(match[1]), suffix: match[2].replace(/^-/, '').toUpperCase(), gender: match[3]?.toLowerCase() === 'f' ? 'female' : match[3] ? 'male' : null };
};

const catalog = JSON.parse(await readFile(CATALOG, 'utf8'));
for (const entry of catalog.filter((entry) => entry.canonicalName.startsWith('alcremie-'))) {
  const sweet = ['berry', 'love', 'star', 'clover', 'flower', 'ribbon'].find((candidate) => entry.canonicalName.includes(`-${candidate}-sweet`));
  if (entry.canonicalName.includes('-strawberry-sweet')) VERIFIED_FORM_SPRITE_FILENAME_BY_CANONICAL_NAME.set(entry.canonicalName, 'Spr_8s_869_s.png');
  if (sweet) VERIFIED_FORM_SPRITE_FILENAME_BY_CANONICAL_NAME.set(
    entry.canonicalName,
    `Spr_8s_869${{ berry: 'B', love: 'L', star: 'S', clover: 'C', flower: 'F', ribbon: 'R' }[sweet]}_s.png`,
  );
}
const baseNameBySpecies = new Map(catalog.filter((entry) => entry.formKey === 'base').map((entry) => [entry.speciesId, entry.canonicalName]));
const regionalNameBySpeciesAndSuffix = new Map(
  catalog
    .filter((entry) => /-(?:alola|galar)$/.test(entry.canonicalName))
    .map((entry) => [
      `${entry.speciesId}:${entry.canonicalName.endsWith('-alola') ? 'A' : 'G'}`,
      entry.canonicalName,
    ]),
);
const files = await fetchCategoryFiles();
const entries = [];
const unparsed = [];
const unmapped = [];
for (const filename of files) {
  const parsed = parse(filename);
  if (!parsed) { unparsed.push(filename); continue; }
  // The archive uses the National Dex number, then `A`/`G` for the
  // regional variant and `m`/`f` for a gender-different model. Gigantamax
  // (`Gi`) is deliberately not a selectable Pokémon form in this manifest.
  if (parsed.suffix === 'GI') continue;
  const canonicalName = parsed.suffix
    ? regionalNameBySpeciesAndSuffix.get(`${parsed.speciesId}:${parsed.suffix}`)
      ?? FORM_BY_SPECIES_AND_SUFFIX[`${parsed.speciesId}:${parsed.suffix}`]
    : baseNameBySpecies.get(parsed.speciesId);
  if (!canonicalName) { unmapped.push({ filename, speciesId: parsed.speciesId, suffix: parsed.suffix || null }); continue; }
  const useVerifiedMaleRedirect = parsed.suffix === ''
    && parsed.gender === null
    && VERIFIED_MALE_REDIRECT_SPECIES_IDS.has(parsed.speciesId);
  entries.push({
    ...parsed,
    filename: VERIFIED_REDIRECT_FILENAME_BY_SPECIES_AND_SUFFIX.get(`${parsed.speciesId}:${parsed.suffix}`) ?? parsed.filename,
    ...(useVerifiedMaleRedirect
      ? { filename: `Spr_8s_${String(parsed.speciesId).padStart(3, '0')}_m_s.png`, gender: 'male' }
      : {}),
    canonicalName: normalize(canonicalName),
  });
}
for (const speciesId of VERIFIED_FEMALE_REDIRECT_SPECIES_IDS) {
  if (entries.some((entry) => entry.speciesId === speciesId && entry.gender === 'female')) continue;
  const canonicalName = baseNameBySpecies.get(speciesId);
  const filename = `Spr_8s_${String(speciesId).padStart(3, '0')}_f_s.png`;
  const parsed = parse(filename);
  if (!canonicalName || !parsed) throw new Error(`Invalid verified Sword/Shield female filename: ${filename}`);
  entries.push({ ...parsed, canonicalName });
}
for (const entry of catalog) {
  const filename = VERIFIED_FORM_SPRITE_FILENAME_BY_CANONICAL_NAME.get(entry.canonicalName);
  if (!filename || entries.some((candidate) => candidate.canonicalName === entry.canonicalName && candidate.gender === null)) continue;
  const parsed = parse(filename);
  if (!parsed) throw new Error(`Invalid verified Sword/Shield form filename: ${filename}`);
  entries.push({ ...parsed, canonicalName: entry.canonicalName });
}
for (const entry of VERIFIED_NON_CATALOG_FORM_SPRITES) {
  if (entries.some((candidate) => candidate.canonicalName === entry.canonicalName && candidate.gender === null)) continue;
  const parsed = parse(entry.filename);
  if (!parsed || parsed.speciesId !== entry.speciesId) throw new Error(`Invalid verified Sword/Shield form filename: ${entry.filename}`);
  entries.push({ ...parsed, canonicalName: entry.canonicalName });
}
entries.sort((a, b) => a.speciesId - b.speciesId || a.canonicalName.localeCompare(b.canonicalName) || (a.gender || '').localeCompare(b.gender || ''));
const report = { category: CATEGORY, files: files.length, mapped: entries.length, unparsed, unmapped };
await writeFile(OUTPUT, `// Generated by scripts/generate-swsh-shiny-model-manifest.mjs. Do not edit by hand.\n// Source: ${CATEGORY}, Bulbagarden Archives.\nexport const SWORD_SHIELD_SHINY_MODEL_ENTRIES = ${JSON.stringify(entries, null, 2)} as const;\n`);
await writeFile(REPORT, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ files: files.length, mapped: entries.length, unparsed: unparsed.length, unmapped: unmapped.length, output: OUTPUT, report: REPORT }, null, 2));
if (unparsed.length || unmapped.length) process.exitCode = 1;
