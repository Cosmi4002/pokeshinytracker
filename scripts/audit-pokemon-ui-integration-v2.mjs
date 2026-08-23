import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const failures = [];
const checks = [];

function check(label, condition, detail = '') {
  checks.push(label);
  if (!condition) failures.push(detail ? `${label}: ${detail}` : label);
}

const sources = {
  add: read('src/components/collection/AddShinyDialog.tsx'),
  edit: read('src/components/collection/EditShinyDialog.tsx'),
  evolve: read('src/components/collection/EvolveDialog.tsx'),
  finish: read('src/components/counter/FinishHuntDialog.tsx'),
  counter: read('src/components/counter/ShinyCounter.tsx'),
  counterPage: read('src/pages/Counter.tsx'),
  collection: read('src/pages/Collection.tsx'),
  pokedex: read('src/pages/Pokedex.tsx'),
  details: read('src/pages/PokemonDetails.tsx'),
  bingo: read('src/pages/Bingo.tsx'),
  stats: read('src/pages/Stats.tsx'),
  publicCollections: read('src/pages/UserCollectionsSearch.tsx'),
  resolver: read('src/lib/pokemon-entity-resolver-v2.ts'),
};

check(
  'resolver prefers stored canonical entity_key',
  sources.resolver.includes('if (isKnownEntityKey(input.entityKey)) return input.entityKey;'),
);
check(
  'resolver falls back to legacy map without guessing ambiguous rows',
  sources.resolver.includes("resolution.status === 'resolved' ? resolution.entityKey : null"),
);
check(
  'counter entity key list is all-or-nothing',
  sources.resolver.includes('return keys.every(Boolean) ? keys as PokemonEntityKey[] : [];'),
);

for (const [label, source] of Object.entries({
  'manual add writes caught_shinies.entity_key': sources.add,
  'manual edit writes caught_shinies.entity_key': sources.edit,
  'finish hunt writes caught_shinies.entity_key': sources.finish,
})) {
  check(label, source.includes('entity_key: entityKey'));
}

check(
  'evolution writes current and previous canonical identity keys',
  sources.evolve.includes('entity_key: nextEntityKey')
    && sources.evolve.includes('evolved_from_entity_key: previousEntityKey'),
);
check(
  'counter autosave writes pokemon_entity_keys',
  sources.counter.includes('pokemon_entity_keys: pokemonEntityKeys'),
);
check(
  'empty counter creation starts with an empty canonical key array',
  sources.counterPage.includes('pokemon_entity_keys: []'),
);
check(
  'collection resolves cards through canonical key before legacy fallbacks',
  sources.collection.includes('resolvePokemonBasicByEntity')
    && sources.collection.indexOf('resolvePokemonBasicByEntity') < sources.collection.indexOf('const formAliases'),
);
check(
  'pokedex fetches entity_key and adds canonical form aliases to caught stats',
  sources.pokedex.includes("select('pokemon_id, entity_key, pokemon_name, gender, form')")
    && sources.pokedex.includes('entity.legacy.formNames.forEach'),
);
check(
  'pokemon details reads entity_key for caught status',
  sources.details.includes("select('pokemon_id, entity_key, gender, form, game, secondary_game')")
    && sources.details.includes('matchedByEntity'),
);
check(
  'pokemon details writes entity_key when toggling a form caught',
  sources.details.includes('entity_key: entityKey'),
);
check(
  'bingo persists random and grid canonical keys',
  sources.bingo.includes('random_entity_key:')
    && sources.bingo.includes('grid_entity_keys:')
    && sources.bingo.includes('getGridEntityKeys'),
);
check(
  'stats count species and forms through canonical entity when present',
  sources.stats.includes('resolvePokemonEntity')
    && sources.stats.includes('entity?.speciesId')
    && sources.stats.includes('entity?.key'),
);
check(
  'public collection stats include and use entity_key',
  sources.publicCollections.includes("'entity_key'")
    && sources.publicCollections.includes('resolvePokemonEntity')
    && sources.publicCollections.includes('entity?.speciesId'),
);

const writePaths = [
  ['AddShinyDialog.tsx', sources.add],
  ['EditShinyDialog.tsx', sources.edit],
  ['FinishHuntDialog.tsx', sources.finish],
  ['EvolveDialog.tsx', sources.evolve],
  ['ShinyCounter.tsx', sources.counter],
  ['Counter.tsx', sources.counterPage],
  ['PokemonDetails.tsx', sources.details],
  ['Bingo.tsx', sources.bingo],
];
writePaths.forEach(([file, source]) => {
  if (source.includes(".from('caught_shinies')") && source.includes('.insert(')) {
    check(`${file} caught insert has canonical identity`, source.includes('entity_key:'));
  }
  if (source.includes(".from('caught_shinies')") && source.includes('.update(')) {
    check(`${file} caught update has canonical identity`, source.includes('entity_key:'));
  }
  if (/from\('active_hunts'\)[\s\S]{0,160}\.(insert|update)\(/.test(source)) {
    check(`${file} active hunt write has canonical identity array`, source.includes('pokemon_entity_keys:'));
  }
  if (source.includes(".from('bingo_boards')") && source.includes('.upsert(')) {
    check(`${file} bingo write has canonical identity keys`, source.includes('grid_entity_keys:') && source.includes('random_entity_key:'));
  }
});

console.log('Pokemon UI integration v2 audit');
console.log(`checks: ${checks.length}`);
console.log(`failures: ${failures.length}`);

if (failures.length) {
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
}
