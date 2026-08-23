import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pokedex = JSON.parse(fs.readFileSync(path.join(root, 'src/lib/pokedex.json'), 'utf8'));
const hookSource = fs.readFileSync(path.join(root, 'src/hooks/use-pokemon.ts'), 'utf8');
const seedSource = fs.readFileSync(path.join(root, 'src/lib/pokemon-catalog-v2.seed.ts'), 'utf8');

const NATIONAL_DEX_VERIFICATION = {
  status: 'verified',
  sourceUrls: [
    'https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_by_National_Pok%C3%A9dex_number',
    'https://www.serebii.net/pokemon/nationalpokedex.shtml',
  ],
  lastVerifiedAt: '2026-08-21',
  notes: 'National Pokédex identity cross-checked through #1025; later-generation entries are outside this nine-generation catalog.',
};
const FORM_INDEX_VERIFICATION = {
  status: 'verified',
  sourceUrls: [
    'https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_with_form_differences',
    'https://www.serebii.net/pokemon/forms.shtml',
  ],
  lastVerifiedAt: '2026-08-21',
  notes: 'Existing nine-generation form identity cross-checked against the form indexes; encounter and shiny-hunt availability are intentionally out of scope here.',
};

function normalizeKey(value) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseManualVarieties() {
  const start = hookSource.indexOf('const RAW_MANUAL_VARIETIES');
  const end = hookSource.indexOf('// PokeAPI form IDs', start);
  if (start < 0 || end < 0) throw new Error('RAW_MANUAL_VARIETIES block not found');

  const entries = [];
  let baseId = null;
  hookSource.slice(start, end).split('\n').forEach((line) => {
    const baseMatch = line.match(/^\s*(\d+):\s*\[/);
    if (baseMatch) baseId = Number(baseMatch[1]);
    if (baseId === null) return;
    for (const match of line.matchAll(/\{\s*id:\s*(\d+),\s*name:\s*'([^']+)'(?:,\s*generation:\s*(\d+))?\s*\}/g)) {
      entries.push({
        baseId,
        requestedId: Number(match[1]),
        name: match[2],
        generation: match[3] ? Number(match[3]) : undefined,
      });
    }
  });
  return entries;
}

function normalizeManualVarieties(entries) {
  const reserved = new Map(pokedex.map((entry) => [entry.id, entry.name]));
  const indexes = new Map();
  return entries.map((entry) => {
    const index = indexes.get(entry.baseId) || 0;
    indexes.set(entry.baseId, index + 1);
    let effectiveId = entry.requestedId;
    const existingName = reserved.get(effectiveId);
    if (existingName && existingName !== entry.name) effectiveId = entry.baseId * 10000 + index + 1;
    while (reserved.has(effectiveId) && reserved.get(effectiveId) !== entry.name) effectiveId += 1;
    reserved.set(effectiveId, entry.name);
    return { ...entry, effectiveId, alreadyInPokedex: existingName === entry.name };
  });
}

function generationForSpecies(speciesId) {
  if (speciesId <= 151) return 1;
  if (speciesId <= 251) return 2;
  if (speciesId <= 386) return 3;
  if (speciesId <= 493) return 4;
  if (speciesId <= 649) return 5;
  if (speciesId <= 721) return 6;
  if (speciesId <= 809) return 7;
  if (speciesId <= 905) return 8;
  return 9;
}

const seededFormKeys = new Map(
  [...seedSource.matchAll(/seedEntity\(\{ speciesId: (\d+), formKey: '([^']+)', canonicalName: '([^']+)'/g)]
    .map((match) => [`${match[1]}:${match[3]}`, match[2]]),
);

const manual = normalizeManualVarieties(parseManualVarieties());
const manualByName = new Map(manual.map((entry) => [`${entry.baseId}:${entry.name}`, entry]));
const canonicalLegacyAliases = new Map([
  ['869:alcremie-strawberry', 'alcremie-vanilla-cream-strawberry-sweet'],
  ['869:alcremie-berry', 'alcremie-vanilla-cream-berry-sweet'],
  ['869:alcremie-love', 'alcremie-vanilla-cream-love-sweet'],
  ['869:alcremie-star', 'alcremie-vanilla-cream-star-sweet'],
  ['869:alcremie-clover', 'alcremie-vanilla-cream-clover-sweet'],
  ['869:alcremie-flower', 'alcremie-vanilla-cream-flower-sweet'],
  ['869:alcremie-ribbon', 'alcremie-vanilla-cream-ribbon-sweet'],
]);
const effective = [
  ...pokedex.map((entry) => ({
    id: entry.id,
    speciesId: entry.baseId || entry.id,
    canonicalName: entry.name,
    generationIntroduced: entry.generation || generationForSpecies(entry.baseId || entry.id),
    requestedId: entry.id,
  })),
  ...manual
    .filter((entry) => !entry.alreadyInPokedex)
    .map((entry) => ({
      id: entry.effectiveId,
      speciesId: entry.baseId,
      canonicalName: entry.name,
      generationIntroduced: entry.generation || generationForSpecies(entry.baseId),
      requestedId: entry.requestedId,
    })),
];

const effectiveGroups = new Map();
effective.forEach((entry) => {
  const canonicalName = canonicalLegacyAliases.get(`${entry.speciesId}:${entry.canonicalName}`) || entry.canonicalName;
  const key = `${entry.speciesId}:${canonicalName}`;
  const group = effectiveGroups.get(key) || { canonicalName, entries: [] };
  group.entries.push(entry);
  effectiveGroups.set(key, group);
});

const identities = [...effectiveGroups.values()]
  .map(({ canonicalName, entries }) => {
    const primary = entries.find((entry) => entry.canonicalName === canonicalName) || entries[0];
    const seededFormKey = seededFormKeys.get(`${primary.speciesId}:${canonicalName}`);
    const formKey = seededFormKey || (primary.id === primary.speciesId ? 'base' : normalizeKey(canonicalName));
    const manualEntries = entries
      .map((entry) => manualByName.get(`${entry.speciesId}:${entry.canonicalName}`))
      .filter(Boolean);
    const pokemonIds = [...new Set([
      ...entries.flatMap((entry) => [entry.id, entry.requestedId]),
      ...manualEntries.flatMap((entry) => [entry.effectiveId, entry.requestedId]),
    ].filter(Number.isInteger))].sort((a, b) => a - b);
    return {
      key: `pokemon:${primary.speciesId}:${formKey}`,
      speciesId: primary.speciesId,
      formKey,
      canonicalName,
      generationIntroduced: Math.min(...entries.map((entry) => entry.generationIntroduced)),
      legacy: {
        pokemonIds,
        formNames: [...new Set(entries.map((entry) => entry.canonicalName))],
      },
      verification: formKey === 'base'
        ? NATIONAL_DEX_VERIFICATION
        : FORM_INDEX_VERIFICATION,
    };
  })
  .sort((a, b) => a.speciesId - b.speciesId || a.formKey.localeCompare(b.formKey));

const duplicateKeys = identities.filter((entry, index) =>
  identities.findIndex((candidate) => candidate.key === entry.key) !== index,
);
if (duplicateKeys.length) {
  throw new Error(`Duplicate canonical keys: ${[...new Set(duplicateKeys.map((entry) => entry.key))].join(', ')}`);
}

const outputPath = path.join(root, 'src/lib/pokemon-catalog-v2.generated.json');
fs.writeFileSync(outputPath, `${JSON.stringify(identities, null, 2)}\n`);
console.log(`Generated ${identities.length} canonical identities at ${path.relative(root, outputPath)}`);
