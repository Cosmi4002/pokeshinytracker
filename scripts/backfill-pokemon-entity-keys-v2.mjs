import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPokemonLegacyBackfillPlan } from '../src/lib/pokemon-legacy-migration-v2.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const map = JSON.parse(fs.readFileSync(path.join(root, 'src/lib/pokemon-legacy-map-v2.generated.json'), 'utf8'));
const reportsDir = path.join(root, 'reports');
const args = new Set(process.argv.slice(2));
const apply = args.has('--apply');
const outPath = path.join(reportsDir, apply
  ? 'pokemon-legacy-backfill-v2-apply-plan.json'
  : 'pokemon-legacy-backfill-v2-plan.json');
const backupPath = path.join(reportsDir, 'pokemon-legacy-backfill-v2-backup.json');

const requiredEnv = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length) {
  console.error(`Missing required environment variables: ${missingEnv.join(', ')}`);
  console.error('No database rows were read or written.');
  process.exit(1);
}

if (apply && process.env.POKEMON_ENTITY_BACKFILL_ALLOW_APPLY !== 'yes') {
  console.error('Refusing to write: set POKEMON_ENTITY_BACKFILL_ALLOW_APPLY=yes and pass --apply deliberately.');
  console.error('No database rows were modified.');
  process.exit(1);
}

const { createClient } = await import('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function selectAll(table, columns) {
  const pageSize = 1000;
  const rows = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase.from(table).select(columns).range(from, from + pageSize - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...(data || []));
    if (!data || data.length < pageSize) break;
  }
  return rows;
}

const caughtShinies = await selectAll(
  'caught_shinies',
  'id,pokemon_id,pokemon_name,form,entity_key,evolved_from_id,evolved_from_name,evolved_from_entity_key',
);
const activeHunts = await selectAll(
  'active_hunts',
  'id,pokemon_id,pokemon_name,form,gender,pokemon_entity_keys',
);
const bingoBoards = await selectAll(
  'bingo_boards',
  'user_id,grid_ids,grid_entity_keys,random_pokemon_id,random_pokemon_name,random_entity_key',
);

const rows = {
  caughtShinies: caughtShinies.map((row) => ({
    id: row.id,
    pokemonId: row.pokemon_id,
    pokemonName: row.pokemon_name,
    form: row.form,
    entityKey: row.entity_key,
    evolvedFromId: row.evolved_from_id,
    evolvedFromName: row.evolved_from_name,
    evolvedFromEntityKey: row.evolved_from_entity_key,
  })),
  activeHunts: activeHunts.map((row) => ({
    id: row.id,
    pokemonId: row.pokemon_id,
    pokemonName: row.pokemon_name,
    form: row.form,
    gender: row.gender,
    pokemonEntityKeys: row.pokemon_entity_keys,
  })),
  bingoBoards: bingoBoards.map((row) => ({
    userId: row.user_id,
    gridIds: row.grid_ids || [],
    gridEntityKeys: row.grid_entity_keys,
    randomPokemonId: row.random_pokemon_id,
    randomPokemonName: row.random_pokemon_name,
    randomEntityKey: row.random_entity_key,
  })),
};

const plan = buildPokemonLegacyBackfillPlan(map, rows);
const report = {
  version: 2,
  generatedAt: new Date().toISOString(),
  mode: apply ? 'apply' : 'dry-run-live-read',
  catalogSha256: map.catalogSha256,
  rowsRead: {
    caughtShinies: rows.caughtShinies.length,
    activeHunts: rows.activeHunts.length,
    bingoBoards: rows.bingoBoards.length,
  },
  summary: plan.summary,
  review: plan.review,
  skipped: plan.skipped,
  writesAttempted: apply ? plan.updates.length : 0,
  writesCompleted: 0,
  gate: {
    applyRequested: apply,
    ambiguousRowsBlocked: plan.review.length,
    legacyColumnsPreserved: true,
    backupCreatedBeforeApply: false,
  },
};

fs.mkdirSync(reportsDir, { recursive: true });
fs.writeFileSync(outPath, `${JSON.stringify({ ...report, updates: plan.updates }, null, 2)}\n`);

if (!apply) {
  console.log('Pokemon entity key backfill v2');
  console.log('mode: dry-run-live-read');
  console.log(`updates planned: ${plan.summary.updates}`);
  console.log(`needs review: ${plan.summary.review}`);
  console.log(`skipped: ${plan.summary.skipped}`);
  console.log('writes attempted: 0');
  console.log(`report: ${path.relative(root, outPath)}`);
  process.exit(0);
}

fs.writeFileSync(backupPath, `${JSON.stringify({ version: 2, generatedAt: report.generatedAt, rows }, null, 2)}\n`);
report.gate.backupCreatedBeforeApply = true;

for (const update of plan.updates) {
  if (update.table === 'caught_shinies') {
    const payload = {};
    if ('entity_key' in update) payload.entity_key = update.entity_key;
    if ('evolved_from_entity_key' in update) payload.evolved_from_entity_key = update.evolved_from_entity_key;
    const { error } = await supabase.from('caught_shinies').update(payload).eq('id', update.id);
    if (error) throw new Error(`caught_shinies ${update.id}: ${error.message}`);
  } else if (update.table === 'active_hunts') {
    const { error } = await supabase.from('active_hunts')
      .update({ pokemon_entity_keys: update.pokemon_entity_keys })
      .eq('id', update.id);
    if (error) throw new Error(`active_hunts ${update.id}: ${error.message}`);
  } else {
    const payload = {};
    if ('grid_entity_keys' in update) payload.grid_entity_keys = update.grid_entity_keys;
    if ('random_entity_key' in update) payload.random_entity_key = update.random_entity_key;
    const { error } = await supabase.from('bingo_boards').update(payload).eq('user_id', update.user_id);
    if (error) throw new Error(`bingo_boards ${update.user_id}: ${error.message}`);
  }
  report.writesCompleted += 1;
}

fs.writeFileSync(outPath, `${JSON.stringify({ ...report, updates: plan.updates }, null, 2)}\n`);
console.log('Pokemon entity key backfill v2');
console.log('mode: apply');
console.log(`writes completed: ${report.writesCompleted}`);
console.log(`needs review: ${plan.summary.review}`);
console.log(`backup: ${path.relative(root, backupPath)}`);
console.log(`report: ${path.relative(root, outPath)}`);
