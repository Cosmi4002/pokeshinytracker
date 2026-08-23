import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'src/lib/pokemon-catalog-v2.generated.json'), 'utf8'));
const map = JSON.parse(fs.readFileSync(path.join(root, 'src/lib/pokemon-legacy-map-v2.generated.json'), 'utf8'));
const migration = fs.readFileSync(path.join(root, 'supabase/migrations/20260821090000_add_canonical_pokemon_entity_keys.sql'), 'utf8');

const canonicalPayload = catalog.map((entry) => ({ key: entry.key, ids: entry.legacy.pokemonIds, forms: entry.legacy.formNames }));
const expectedSha256 = crypto.createHash('sha256').update(JSON.stringify(canonicalPayload)).digest('hex');
const catalogKeys = new Set(catalog.map((entry) => entry.key));
const targets = [...new Set([
  ...Object.values(map.byExactIdAndForm).flat(),
  ...Object.values(map.byForm).flat(),
  ...Object.values(map.byName).flat(),
  ...Object.values(map.byId).flat(),
])];
const invalidTargets = targets.filter((key) => !catalogKeys.has(key));
const ambiguousExact = Object.entries(map.byExactIdAndForm).filter(([, values]) => values.length !== 1);
const ambiguousForms = Object.entries(map.byForm).filter(([, values]) => values.length !== 1);
const ambiguousNames = Object.entries(map.byName).filter(([, values]) => values.length !== 1);
const ambiguousIds = Object.entries(map.byId).filter(([, values]) => values.length > 1);
const requiredColumns = [
  'caught_shinies.entity_key', 'caught_shinies.evolved_from_entity_key',
  'active_hunts.pokemon_entity_keys', 'bingo_boards.grid_entity_keys',
  'bingo_boards.random_entity_key',
];
const migrationColumnTokens = [
  ['caught_shinies', 'entity_key'], ['caught_shinies', 'evolved_from_entity_key'],
  ['active_hunts', 'pokemon_entity_keys'], ['bingo_boards', 'grid_entity_keys'],
  ['bingo_boards', 'random_entity_key'],
];
const missingMigrationColumns = migrationColumnTokens
  .filter(([table, column]) => !migration.includes(`ALTER TABLE public.${table}`) || !migration.includes(column))
  .map(([table, column]) => `${table}.${column}`);

const summary = {
  mapVersion: map.version,
  canonicalEntities: map.counts.canonicalEntities,
  legacyFormAliases: map.counts.legacyFormAliases,
  exactMappings: Object.keys(map.byExactIdAndForm).length,
  uniqueFormMappings: Object.keys(map.byForm).length,
  uniqueNameMappings: Object.keys(map.byName).length,
  numericIdMappings: Object.keys(map.byId).length,
  intentionallyAmbiguousNumericIds: ambiguousIds.length,
  ambiguousExactMappings: ambiguousExact.length,
  ambiguousFormMappings: ambiguousForms.length,
  ambiguousNameMappings: ambiguousNames.length,
  invalidTargetKeys: invalidTargets.length,
  checksumMatchesCatalog: map.catalogSha256 === expectedSha256,
  requiredMigrationColumns: requiredColumns.length,
  missingMigrationColumns: missingMigrationColumns.length,
};

console.log('Pokemon legacy map v2 audit');
Object.entries(summary).forEach(([key, value]) => console.log(`${key}: ${value}`));

if (
  map.version !== 2
  || map.counts.canonicalEntities !== catalog.length
  || map.counts.legacyFormAliases !== 1334
  || ambiguousExact.length
  || ambiguousForms.length
  || ambiguousNames.length
  || invalidTargets.length
  || map.catalogSha256 !== expectedSha256
  || missingMigrationColumns.length
) process.exitCode = 1;
