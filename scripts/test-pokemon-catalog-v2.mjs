import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import {
  createPokemonEntityKey,
  planLegacyPokemonBackfill,
  resolveLegacyPokemonIdentity,
  validatePokemonCatalog,
} from '../src/lib/pokemon-catalog-v2.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const generated = JSON.parse(fs.readFileSync(path.join(root, 'src/lib/pokemon-catalog-v2.generated.json'), 'utf8'));
const source = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const mockEntity = ({ key, speciesId, formKey, canonicalName, ids, forms }) => ({
  key,
  speciesId,
  formKey,
  canonicalName,
  displayName: canonicalName,
  generationIntroduced: 1,
  kind: formKey === 'base' ? 'base' : 'persistent',
  cardPolicy: 'species-card',
  completionPolicy: 'per-form',
  assets: {},
  legacy: { pokemonIds: ids, formNames: forms, displayNames: [canonicalName] },
  verification: { status: 'verified', sourceUrls: ['https://bulbapedia.bulbagarden.net/', 'https://www.serebii.net/'] },
});

test('all generated keys are canonical, unique and source verified', () => {
  assert.equal(generated.length, 1327);
  assert.equal(new Set(generated.map((entry) => entry.key)).size, generated.length);
  for (const entry of generated) {
    assert.equal(entry.key, createPokemonEntityKey(entry.speciesId, entry.formKey));
    assert.equal(entry.verification.status, 'verified');
    assert.ok(entry.verification.lastVerifiedAt);
    assert.ok(entry.verification.sourceUrls.some((url) => url.includes('bulbapedia.bulbagarden.net')));
    assert.ok(entry.verification.sourceUrls.some((url) => url.includes('serebii.net')));
  }
});

test('catalog generation is deterministic', () => {
  const catalogPath = path.join(root, 'src/lib/pokemon-catalog-v2.generated.json');
  const before = fs.readFileSync(catalogPath, 'utf8');
  execFileSync(process.execPath, [path.join(root, 'scripts/generate-pokemon-catalog-v2.mjs')], {
    cwd: root,
    stdio: 'ignore',
  });
  assert.equal(fs.readFileSync(catalogPath, 'utf8'), before);
});

test('all 1,334 legacy form names remain represented exactly once', () => {
  const names = generated.flatMap((entry) => entry.legacy.formNames);
  assert.equal(names.length, 1334);
  assert.equal(new Set(names).size, 1334);
});

test('every legacy form alias resolves to one and only one canonical entity', () => {
  for (const expected of generated) {
    for (const formName of expected.legacy.formNames) {
      const resolution = resolveLegacyPokemonIdentity(generated, {
        pokemonId: expected.legacy.pokemonIds[0],
        formName,
      });
      assert.equal(resolution.status, 'resolved', `${expected.key} / ${formName}`);
      assert.equal(resolution.entity.key, expected.key, `${expected.key} / ${formName}`);
    }
  }
});

test('normalization produces stable safe keys and rejects invalid species IDs', () => {
  assert.equal(createPokemonEntityKey(669, 'Flabébé — Blue Flower'), 'pokemon:669:flabebe-blue-flower');
  assert.throws(() => createPokemonEntityKey(0, 'base'), /Invalid species ID/);
  assert.throws(() => createPokemonEntityKey(1, '---'), /Invalid form key/);
});

test('Alcremie has 63 canonical combinations and preserves seven shorthand aliases', () => {
  const alcremie = generated.filter((entry) => entry.speciesId === 869);
  assert.equal(alcremie.length, 63);
  const aliases = alcremie.flatMap((entry) => entry.legacy.formNames)
    .filter((name) => /^alcremie-(strawberry|berry|love|star|clover|flower|ribbon)$/.test(name));
  assert.deepEqual(aliases.sort(), [
    'alcremie-berry', 'alcremie-clover', 'alcremie-flower', 'alcremie-love',
    'alcremie-ribbon', 'alcremie-star', 'alcremie-strawberry',
  ]);
});

test('critical multi-form families contain the expected tracked inventory', () => {
  const expected = new Map([
    [201, 28], [386, 4], [412, 3], [413, 3], [479, 6], [550, 3],
    [585, 4], [586, 4], [646, 3], [647, 2], [666, 19], [676, 10],
    [773, 18], [774, 14], [800, 4], [869, 63], [1017, 4], [1024, 3],
  ]);
  for (const [speciesId, count] of expected) {
    assert.equal(generated.filter((entry) => entry.speciesId === speciesId).length, count, `species ${speciesId}`);
  }
});

test('catalog validator rejects duplicate keys and accepts valid entities', () => {
  const entity = mockEntity({ key: 'pokemon:1:base', speciesId: 1, formKey: 'base', canonicalName: 'bulbasaur', ids: [1], forms: ['bulbasaur'] });
  assert.deepEqual(validatePokemonCatalog([entity]), []);
  assert.ok(validatePokemonCatalog([entity, entity]).some((error) => error.includes('duplicate key')));
});

test('legacy resolution uses exact form aliases before colliding numeric IDs', () => {
  const unown = mockEntity({ key: 'pokemon:201:b', speciesId: 201, formKey: 'b', canonicalName: 'unown-b', ids: [10001, 2010001], forms: ['unown-b'] });
  const deoxys = mockEntity({ key: 'pokemon:386:attack', speciesId: 386, formKey: 'attack', canonicalName: 'deoxys-attack', ids: [10001], forms: ['deoxys-attack'] });
  const catalog = [unown, deoxys];
  assert.equal(resolveLegacyPokemonIdentity(catalog, { pokemonId: 10001, formName: 'unown-b' }).entity.key, unown.key);
  assert.equal(resolveLegacyPokemonIdentity(catalog, { pokemonId: 10001 }).status, 'ambiguous');
  assert.equal(resolveLegacyPokemonIdentity(catalog, { pokemonId: 999999 }).status, 'unresolved');
});

test('backfill planner never guesses ambiguous rows and preserves migrated rows', () => {
  const a = mockEntity({ key: 'pokemon:201:b', speciesId: 201, formKey: 'b', canonicalName: 'unown-b', ids: [10001], forms: ['unown-b'] });
  const b = mockEntity({ key: 'pokemon:386:attack', speciesId: 386, formKey: 'attack', canonicalName: 'deoxys-attack', ids: [10001], forms: ['deoxys-attack'] });
  const plan = planLegacyPokemonBackfill([a, b], [
    { rowId: 'exact', pokemonId: 10001, formName: 'unown-b' },
    { rowId: 'ambiguous', pokemonId: 10001 },
    { rowId: 'unknown', pokemonId: 999999 },
    { rowId: 'done', pokemonId: 10001, existingEntityKey: a.key },
  ]);
  assert.equal(plan.updates.length, 1);
  assert.equal(plan.ambiguous.length, 1);
  assert.equal(plan.unresolved.length, 1);
  assert.equal(plan.alreadyMigrated.length, 1);
});

test('additional forms are verified and preserve the three Castform sprite assets', () => {
  const additional = source('src/lib/pokemon-catalog-v2.additional.ts');
  const gen5 = source('src/lib/pokemon-catalog-v2.gen5.ts');
  assert.equal([...additional.matchAll(/castformWeatherForm\('/g)].length, 3);
  assert.match(additional, /canonicalName: 'vivillon-poke-ball'/);
  assert.equal([...gen5.matchAll(/additionalEntity\(\{/g)].length, 6);
  assert.match(additional, /status: 'verified'/);
  assert.match(gen5, /status: 'verified'/);
  for (const asset of [...additional.matchAll(/'(\/img\/pokemon-sprites\/[^']+)'/g)].map((match) => match[1])) {
    assert.ok(fs.existsSync(path.join(root, 'public', asset.replace(/^\//, ''))), asset);
  }
});

test('release policies contain no duplicated species IDs', () => {
  const policies = source('src/lib/pokemon-form-policies-v2.ts');
  const ids = [...policies.matchAll(/\{ speciesId: (\d+), cardMode:/g)].map((match) => Number(match[1]));
  assert.equal(new Set(ids).size, ids.length);
  assert.doesNotMatch(policies, /verificationStatus: '(?:partial|unverified)'/);
});

test('critical card policies preserve explicit product decisions', () => {
  const policies = source('src/lib/pokemon-form-policies-v2.ts');
  for (const speciesId of [646, 647, 800]) {
    assert.match(policies, new RegExp(`speciesId: ${speciesId}, cardMode: 'single-card', completionPolicy: 'per-form'`));
  }
  assert.match(policies, /speciesId: 487, cardMode: 'per-form-card', completionPolicy: 'per-form'/);
  assert.match(policies, /speciesId: 648, cardMode: 'single-card', completionPolicy: 'single'/);
  assert.match(policies, /speciesId: 869, cardMode: 'single-card', completionPolicy: 'per-form'.*expectedTrackedForms: 63/);
});

test('all new TypeScript module imports point to existing project modules', () => {
  const files = [
    'src/lib/pokemon-catalog-v2.ts',
    'src/lib/pokemon-catalog-v2.seed.ts',
    'src/lib/pokemon-catalog-v2.gen5.ts',
    'src/lib/pokemon-catalog-v2.additional.ts',
    'src/lib/pokemon-catalog-v2.registry.ts',
    'src/lib/pokemon-form-classification-v2.ts',
    'src/lib/pokemon-form-policies-v2.ts',
  ];
  for (const relativePath of files) {
    const content = source(relativePath);
    for (const match of content.matchAll(/from '([^']+)'/g)) {
      if (!match[1].startsWith('.')) continue;
      const target = path.resolve(root, path.dirname(relativePath), match[1]);
      assert.ok(
        fs.existsSync(target) || fs.existsSync(`${target}.ts`) || fs.existsSync(`${target}.json`),
        `${relativePath}: ${match[1]}`,
      );
    }
  }
});
