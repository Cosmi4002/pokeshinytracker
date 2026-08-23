import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  decodeLegacyCounterSlots,
  buildPokemonLegacyBackfillPlan,
  planActiveHuntLegacyMapping,
  planBingoLegacyMapping,
  planCaughtLegacyMapping,
  resolveLegacyMapValue,
} from '../src/lib/pokemon-legacy-migration-v2.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mapPath = path.join(root, 'src/lib/pokemon-legacy-map-v2.generated.json');
const map = JSON.parse(fs.readFileSync(mapPath, 'utf8'));

test('mapping generation is deterministic and bound to a catalog checksum', () => {
  const before = fs.readFileSync(mapPath, 'utf8');
  execFileSync(process.execPath, [path.join(root, 'scripts/generate-pokemon-legacy-map-v2.mjs')], { cwd: root, stdio: 'ignore' });
  assert.equal(fs.readFileSync(mapPath, 'utf8'), before);
  assert.match(map.catalogSha256, /^[a-f0-9]{64}$/);
});

test('mapping preserves all legacy aliases without ambiguous exact pairs', () => {
  assert.equal(map.counts.canonicalEntities, 1327);
  assert.equal(map.counts.legacyFormAliases, 1334);
  assert.equal(Object.values(map.byExactIdAndForm).filter((values) => values.length !== 1).length, 0);
  assert.equal(Object.values(map.byForm).filter((values) => values.length !== 1).length, 0);
  assert.equal(Object.values(map.byId).filter((values) => values.length > 1).length, 41);
});

test('colliding ID alone remains ambiguous while form resolves it exactly', () => {
  assert.equal(resolveLegacyMapValue(map, { pokemonId: 10007 }).status, 'ambiguous');
  assert.deepEqual(resolveLegacyMapValue(map, { pokemonId: 10007, form: 'giratina-origin' }), {
    status: 'resolved', confidence: 'exact', entityKey: 'pokemon:487:origin',
  });
  assert.deepEqual(resolveLegacyMapValue(map, { pokemonId: 10007, form: 'unown-h' }), {
    status: 'resolved', confidence: 'exact', entityKey: 'pokemon:201:unown-h',
  });
});

test('all seven Alcremie shorthand names resolve to canonical Vanilla Cream targets', () => {
  const sweets = ['strawberry', 'berry', 'love', 'star', 'clover', 'flower', 'ribbon'];
  for (const sweet of sweets) {
    const resolution = resolveLegacyMapValue(map, { pokemonId: 869, form: `alcremie-${sweet}` });
    assert.equal(resolution.status, 'resolved', sweet);
    assert.match(resolution.entityKey, sweet === 'strawberry'
      ? /^pokemon:869:base$/
      : new RegExp(`^pokemon:869:alcremie-vanilla-cream-${sweet}-sweet$`));
  }
});

test('caught rows map Pokémon and evolution independently and preserve existing keys', () => {
  const plans = planCaughtLegacyMapping(map, [
    { id: 'caught', pokemonId: 10007, form: 'giratina-origin', evolvedFromId: 487, evolvedFromName: 'giratina-altered' },
    { id: 'existing', pokemonId: 1, entityKey: 'pokemon:1:base', evolvedFromEntityKey: 'pokemon:2:base' },
  ]);
  assert.equal(plans[0].pokemon.status, 'resolved');
  assert.equal(plans[0].pokemon.entityKey, 'pokemon:487:origin');
  assert.equal(plans[0].evolution.status, 'resolved');
  assert.equal(plans[1].pokemon.status, 'already-mapped');
  assert.equal(plans[1].evolution.status, 'already-mapped');
});

test('counter decoder supports legacy single slots and encoded three-slot payloads', () => {
  assert.deepEqual(decodeLegacyCounterSlots({ id: 'single', pokemonId: 1, pokemonName: 'Bulbasaur' }), [
    { pokemonId: 1, pokemonName: 'Bulbasaur', form: undefined },
  ]);
  const encoded = '__counter_slots_v1__:' + JSON.stringify([
    { id: 1, name: 'Bulbasaur', form: '', gender: '' },
    { id: 10007, name: 'Giratina', form: 'giratina-origin', gender: '' },
    { id: 25, name: 'Pikachu', form: '', gender: 'female' },
  ]);
  const plan = planActiveHuntLegacyMapping(map, [{ id: 'multi', pokemonName: encoded }])[0];
  assert.equal(plan.status, 'resolved');
  assert.deepEqual(plan.entityKeys, ['pokemon:1:base', 'pokemon:487:origin', 'pokemon:25:base']);
});

test('counter row is never partially written when one slot needs review', () => {
  const encoded = '__counter_slots_v1__:' + JSON.stringify([
    { id: 1, name: 'Bulbasaur', form: '' },
    { id: 10007, name: '', form: '' },
  ]);
  const plan = planActiveHuntLegacyMapping(map, [{ id: 'mixed', pokemonName: encoded }])[0];
  assert.equal(plan.status, 'needs-review');
  assert.deepEqual(plan.entityKeys, []);
});

test('invalid existing keys and misaligned key arrays require review', () => {
  const caught = planCaughtLegacyMapping(map, [{ id: 'bad-key', pokemonId: 1, entityKey: 'pokemon:9999:nope' }])[0];
  assert.equal(caught.pokemon.status, 'needs-review');
  const hunt = planActiveHuntLegacyMapping(map, [{
    id: 'bad-array', pokemonId: 1, pokemonName: 'Bulbasaur', pokemonEntityKeys: ['pokemon:1:base', 'pokemon:2:base'],
  }])[0];
  assert.equal(hunt.status, 'needs-review');
});

test('Bingo preserves positional alignment or withholds the complete grid', () => {
  const valid = planBingoLegacyMapping(map, [{ userId: 'u1', gridIds: [1, 2, 3], randomPokemonId: 25 }])[0];
  assert.equal(valid.grid.status, 'resolved');
  assert.deepEqual(valid.grid.entityKeys, ['pokemon:1:base', 'pokemon:2:base', 'pokemon:3:base']);
  assert.equal(valid.random.status, 'resolved');

  const ambiguous = planBingoLegacyMapping(map, [{ userId: 'u2', gridIds: [1, 10007, 3] }])[0];
  assert.equal(ambiguous.grid.status, 'needs-review');
  assert.deepEqual(ambiguous.grid.entityKeys, []);

  const invalidExisting = planBingoLegacyMapping(map, [{
    userId: 'u3', gridIds: [1], gridEntityKeys: ['pokemon:9999:nope'], randomEntityKey: 'pokemon:9999:nope',
  }])[0];
  assert.equal(invalidExisting.grid.status, 'needs-review');
  assert.equal(invalidExisting.random.status, 'needs-review');
});

test('empty and malformed inputs remain explicit instead of being guessed', () => {
  assert.equal(resolveLegacyMapValue(map, { pokemonId: null }).status, 'unresolved');
  assert.equal(planActiveHuntLegacyMapping(map, [{ id: 'empty' }])[0].status, 'empty');
  assert.equal(planActiveHuntLegacyMapping(map, [{ id: 'bad', pokemonName: '__counter_slots_v1__:{bad' }])[0].status, 'needs-review');
});

test('backfill plan only emits complete safe updates and isolates review rows', () => {
  const encoded = '__counter_slots_v1__:' + JSON.stringify([
    { id: 1, name: 'Bulbasaur', form: '' },
    { id: 10007, name: 'Giratina', form: 'giratina-origin' },
  ]);
  const plan = buildPokemonLegacyBackfillPlan(map, {
    caughtShinies: [
      { id: 'caught-safe', pokemonId: 10007, form: 'giratina-origin', evolvedFromId: 487, evolvedFromName: 'giratina-altered' },
      { id: 'caught-ambiguous', pokemonId: 10007 },
    ],
    activeHunts: [
      { id: 'hunt-safe', pokemonName: encoded },
      { id: 'hunt-review', pokemonName: '__counter_slots_v1__:[{"id":10007}]' },
    ],
    bingoBoards: [
      { userId: 'bingo-safe', gridIds: [1, 2, 3], randomPokemonId: 25 },
      { userId: 'bingo-review', gridIds: [1, 10007] },
    ],
  });

  assert.deepEqual(plan.updates, [
    {
      table: 'caught_shinies',
      id: 'caught-safe',
      entity_key: 'pokemon:487:origin',
      evolved_from_entity_key: 'pokemon:487:altered',
    },
    {
      table: 'active_hunts',
      id: 'hunt-safe',
      pokemon_entity_keys: ['pokemon:1:base', 'pokemon:487:origin'],
    },
    {
      table: 'bingo_boards',
      user_id: 'bingo-safe',
      grid_entity_keys: ['pokemon:1:base', 'pokemon:2:base', 'pokemon:3:base'],
      random_entity_key: 'pokemon:25:base',
    },
  ]);
  assert.equal(plan.review.length, 3);
  assert.equal(plan.summary.updates, 3);
});
