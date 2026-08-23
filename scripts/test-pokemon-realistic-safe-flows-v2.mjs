import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  planActiveHuntLegacyMapping,
  planBingoLegacyMapping,
  planCaughtLegacyMapping,
  resolveLegacyMapValue,
} from '../src/lib/pokemon-legacy-migration-v2.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'src/lib/pokemon-catalog-v2.generated.json'), 'utf8'));
const map = JSON.parse(fs.readFileSync(path.join(root, 'src/lib/pokemon-legacy-map-v2.generated.json'), 'utf8'));

const byKey = new Map(catalog.map((entry) => [entry.key, entry]));
const bySpecies = new Map();
catalog.forEach((entry) => {
  const rows = bySpecies.get(entry.speciesId) || [];
  rows.push(entry);
  bySpecies.set(entry.speciesId, rows);
});

function resolve(value) {
  const resolution = resolveLegacyMapValue(map, value);
  return resolution.status === 'resolved' ? resolution.entityKey : null;
}

function speciesFromKey(key) {
  const match = /^pokemon:(\d+):/.exec(key || '');
  return match ? Number(match[1]) : null;
}

function simulateCaughtStats(rows) {
  const species = new Set();
  const forms = new Set();
  rows.forEach((row) => {
    const key = row.entityKey || resolve({
      pokemonId: row.pokemonId,
      pokemonName: row.pokemonName,
      form: row.form,
    });
    if (key) {
      species.add(speciesFromKey(key));
      forms.add(`${key}:${row.gender || ''}`);
    } else {
      species.add(row.pokemonId);
      forms.add(`${row.pokemonId}:${row.form || row.pokemonName || 'base'}:${row.gender || ''}`);
    }
  });
  return { species, forms };
}

function counterSlotsPayload(slots) {
  return `__counter_slots_v1__:${JSON.stringify(slots)}`;
}

function pokemonOnlyGridKeys(ids) {
  const keys = ids.map((pokemonId) => resolve({ pokemonId }));
  return keys.every(Boolean) ? keys : [];
}

test('realistic collision: Giratina Origin and Unown H share old ID but resolve separately by form', () => {
  assert.equal(resolve({ pokemonId: 10007 }), null);
  assert.equal(resolve({ pokemonId: 10007, form: 'giratina-origin' }), 'pokemon:487:origin');
  assert.equal(resolve({ pokemonId: 10007, form: 'unown-h' }), 'pokemon:201:unown-h');
});

test('realistic Vivillon forms remain separate and never rely on colliding numeric IDs alone', () => {
  const monsoon = resolve({ pokemonId: 10015, form: 'vivillon-monsoon' });
  const fancy = resolve({ pokemonId: 10019, form: 'vivillon-fancy' });
  assert.equal(monsoon, 'pokemon:666:vivillon-monsoon');
  assert.equal(fancy, 'pokemon:666:vivillon-fancy');
  assert.notEqual(monsoon, fancy);

  const stats = simulateCaughtStats([
    { pokemonId: 10015, form: 'vivillon-monsoon', entityKey: monsoon },
  ]);
  assert.equal(stats.forms.has('pokemon:666:vivillon-monsoon:'), true);
  assert.equal(stats.forms.has('pokemon:666:vivillon-fancy:'), false);
});

test('realistic Alcremie coverage has 63 canonical sweets/cream entities plus seven safe shorthand aliases', () => {
  const alcremie = bySpecies.get(869) || [];
  assert.equal(alcremie.length, 63);
  assert.equal(new Set(alcremie.map((entry) => entry.key)).size, 63);

  const shorthand = ['strawberry', 'berry', 'love', 'star', 'clover', 'flower', 'ribbon'];
  shorthand.forEach((sweet) => {
    const key = resolve({ pokemonId: 869, form: `alcremie-${sweet}` });
    assert.ok(key, sweet);
    assert.equal(byKey.has(key), true, sweet);
  });
});

test('realistic caught collection backfill preserves existing keys and blocks invalid or ambiguous rows', () => {
  const plans = planCaughtLegacyMapping(map, [
    { id: 'existing', pokemonId: 10007, form: 'giratina-origin', entityKey: 'pokemon:487:origin' },
    { id: 'invalid', pokemonId: 1, entityKey: 'pokemon:9999:nope' },
    { id: 'ambiguous', pokemonId: 10007 },
  ]);

  assert.equal(plans[0].pokemon.status, 'already-mapped');
  assert.equal(plans[1].pokemon.status, 'needs-review');
  assert.equal(plans[2].pokemon.status, 'ambiguous');
});

test('realistic counter multi-slot saves aligned keys only when every selected slot resolves', () => {
  const valid = planActiveHuntLegacyMapping(map, [{
    id: 'valid-counter',
    pokemonName: counterSlotsPayload([
      { id: 1, name: 'Bulbasaur', form: '' },
      { id: 10007, name: 'Giratina', form: 'giratina-origin' },
      { id: 10007, name: 'Unown', form: 'unown-h' },
    ]),
  }])[0];

  assert.equal(valid.status, 'resolved');
  assert.deepEqual(valid.entityKeys, ['pokemon:1:base', 'pokemon:487:origin', 'pokemon:201:unown-h']);

  const unsafe = planActiveHuntLegacyMapping(map, [{
    id: 'unsafe-counter',
    pokemonName: counterSlotsPayload([
      { id: 1, name: 'Bulbasaur', form: '' },
      { id: 10007, name: 'unknown-colliding-form', form: '' },
    ]),
  }])[0];

  assert.equal(unsafe.status, 'needs-review');
  assert.deepEqual(unsafe.entityKeys, []);
});

test('realistic Bingo preserves positional keys for Pokémon grids and withholds them for ambiguous/game grids', () => {
  const valid = planBingoLegacyMapping(map, [{ userId: 'pokemon-grid', gridIds: [1, 2, 3], randomPokemonId: 25 }])[0];
  assert.equal(valid.grid.status, 'resolved');
  assert.deepEqual(valid.grid.entityKeys, ['pokemon:1:base', 'pokemon:2:base', 'pokemon:3:base']);
  assert.equal(valid.random.status, 'resolved');
  assert.equal(valid.random.entityKey, 'pokemon:25:base');

  const ambiguous = planBingoLegacyMapping(map, [{ userId: 'ambiguous-grid', gridIds: [1, 10007, 3] }])[0];
  assert.equal(ambiguous.grid.status, 'needs-review');
  assert.deepEqual(ambiguous.grid.entityKeys, []);

  assert.deepEqual(pokemonOnlyGridKeys([1, 2, 3]), ['pokemon:1:base', 'pokemon:2:base', 'pokemon:3:base']);
  assert.deepEqual(pokemonOnlyGridKeys([1, 20000, 3]), []);
});

test('realistic stats count canonical species/forms instead of duplicated legacy IDs', () => {
  const stats = simulateCaughtStats([
    { pokemonId: 10007, form: 'giratina-origin', entityKey: 'pokemon:487:origin' },
    { pokemonId: 10007, form: 'unown-h', entityKey: 'pokemon:201:unown-h' },
    { pokemonId: 10015, form: 'vivillon-monsoon', entityKey: 'pokemon:666:vivillon-monsoon' },
  ]);

  assert.deepEqual([...stats.species].sort((a, b) => a - b), [201, 487, 666]);
  assert.equal(stats.forms.has('pokemon:487:origin:'), true);
  assert.equal(stats.forms.has('pokemon:201:unown-h:'), true);
  assert.equal(stats.forms.has('pokemon:666:vivillon-monsoon:'), true);
});
