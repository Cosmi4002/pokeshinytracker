import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'src/lib/pokemon-catalog-v2.generated.json'), 'utf8'));

const normalize = (value) => String(value || '').normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
const add = (map, alias, entityKey) => {
  if (!alias) return;
  const values = map.get(alias) || new Set();
  values.add(entityKey);
  map.set(alias, values);
};
const serialize = (map) => Object.fromEntries(
  [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, values]) => [key, [...values].sort()]),
);

const byId = new Map();
const byForm = new Map();
const byName = new Map();
const byExactIdAndForm = new Map();

for (const entity of catalog) {
  const formAliases = new Set([...entity.legacy.formNames, entity.canonicalName]);
  for (const id of entity.legacy.pokemonIds) {
    add(byId, String(id), entity.key);
    for (const form of formAliases) add(byExactIdAndForm, `${id}\u0000${normalize(form)}`, entity.key);
  }
  for (const form of formAliases) add(byForm, normalize(form), entity.key);
  for (const name of [entity.canonicalName, ...(entity.legacy.displayNames || [])]) {
    add(byName, normalize(name), entity.key);
  }
}

const canonicalPayload = catalog.map((entry) => ({
  key: entry.key,
  ids: entry.legacy.pokemonIds,
  forms: entry.legacy.formNames,
}));
const output = {
  version: 2,
  generatedAt: '2026-08-21',
  catalogSha256: crypto.createHash('sha256').update(JSON.stringify(canonicalPayload)).digest('hex'),
  counts: {
    canonicalEntities: catalog.length,
    legacyFormAliases: catalog.reduce((total, entry) => total + entry.legacy.formNames.length, 0),
  },
  byExactIdAndForm: serialize(byExactIdAndForm),
  byForm: serialize(byForm),
  byName: serialize(byName),
  byId: serialize(byId),
};

const outputPath = path.join(root, 'src/lib/pokemon-legacy-map-v2.generated.json');
fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(`Generated legacy mapping with ${output.counts.legacyFormAliases} aliases at ${path.relative(root, outputPath)}`);
