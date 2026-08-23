import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pokedexPath = path.join(root, 'src/lib/pokedex.json');
const hookPath = path.join(root, 'src/hooks/use-pokemon.ts');

const pokedex = JSON.parse(fs.readFileSync(pokedexPath, 'utf8'));
const hookSource = fs.readFileSync(hookPath, 'utf8');

function duplicates(items, keyOf) {
  const groups = new Map();
  items.forEach((item) => {
    const key = keyOf(item);
    const group = groups.get(key) || [];
    group.push(item);
    groups.set(key, group);
  });
  return [...groups.entries()]
    .filter(([, group]) => group.length > 1)
    .map(([key, group]) => ({ key, entries: group }));
}

function parseManualVarieties(source) {
  const start = source.indexOf('const RAW_MANUAL_VARIETIES');
  const end = source.indexOf('// PokeAPI form IDs', start);
  if (start < 0 || end < 0) throw new Error('RAW_MANUAL_VARIETIES block not found');

  const block = source.slice(start, end);
  const entries = [];
  let baseId = null;

  block.split('\n').forEach((line) => {
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
    if (existingName && existingName !== entry.name) {
      effectiveId = entry.baseId * 10000 + index + 1;
    }
    while (reserved.has(effectiveId) && reserved.get(effectiveId) !== entry.name) {
      effectiveId += 1;
    }
    reserved.set(effectiveId, entry.name);

    return {
      ...entry,
      effectiveId,
      remapped: effectiveId !== entry.requestedId,
      collidesWith: existingName && existingName !== entry.name ? existingName : null,
      alreadyInPokedex: existingName === entry.name,
    };
  });
}

const manual = normalizeManualVarieties(parseManualVarieties(hookSource));
const effectiveEntities = [
  ...pokedex,
  ...manual
    .filter((entry) => !entry.alreadyInPokedex)
    .map((entry) => ({ id: entry.effectiveId, baseId: entry.baseId, name: entry.name })),
];
const pokedexIds = new Set(pokedex.map((entry) => entry.id));
const effectiveIds = duplicates(effectiveEntities, (entry) => entry.id);
const effectiveNames = duplicates(effectiveEntities, (entry) => entry.name);
const missingBases = effectiveEntities.filter((entry) => !pokedexIds.has(entry.baseId));
const invalidBaseSpecies = pokedex.filter(
  (entry) => entry.id <= 1025 && entry.baseId !== entry.id && !pokedexIds.has(entry.baseId),
);

const report = {
  summary: {
    pokedexEntries: pokedex.length,
    manualDeclarations: manual.length,
    manualAlreadyInPokedex: manual.filter((entry) => entry.alreadyInPokedex).length,
    manualAddedAtRuntime: manual.filter((entry) => !entry.alreadyInPokedex).length,
    manualIdsRemappedAtRuntime: manual.filter((entry) => entry.remapped).length,
    effectiveEntities: effectiveEntities.length,
    duplicateEffectiveIds: effectiveIds.length,
    duplicateEffectiveNames: effectiveNames.length,
    missingBaseEntries: missingBases.length,
    invalidBaseSpecies: invalidBaseSpecies.length,
  },
  remappedManualEntries: manual.filter((entry) => entry.remapped),
  duplicateEffectiveIds: effectiveIds,
  duplicateEffectiveNames: effectiveNames,
  missingBaseEntries: missingBases,
  invalidBaseSpecies,
};

const jsonMode = process.argv.includes('--json');
if (jsonMode) {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} else {
  console.log('Pokemon identity audit');
  Object.entries(report.summary).forEach(([key, value]) => console.log(`${key}: ${value}`));
  if (report.remappedManualEntries.length) {
    console.log('\nRuntime ID remaps:');
    report.remappedManualEntries.forEach((entry) => {
      console.log(`- ${entry.name}: ${entry.requestedId} -> ${entry.effectiveId} (collision: ${entry.collidesWith})`);
    });
  }
}

if (effectiveIds.length || effectiveNames.length || missingBases.length || invalidBaseSpecies.length) {
  process.exitCode = 1;
}
