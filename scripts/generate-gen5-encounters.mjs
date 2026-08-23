import fs from 'node:fs/promises';

const games = new Map([
  ['black', 'black'], ['white', 'white'], ['black-2', 'black2'], ['white-2', 'white2'],
]);
const methods = new Map([
  ['walk', 'gen5-random'], ['dark-grass', 'gen5-double-encounter'],
  ['grass-spots', 'gen5-rustling-grass'],
  ['cave-spots', 'gen5-dust-clouds'],
  ['dust-clouds', 'gen5-dust-clouds'], ['surf', 'gen5-random'],
  ['old-rod', 'gen5-old-rod'], ['good-rod', 'gen5-good-rod'], ['super-rod', 'gen5-super-rod'],
  ['super-rod-spots', 'gen5-rippling-waters'],
  ['surf-spots', 'gen5-rippling-waters'], ['bridge-spots', 'gen5-rippling-waters'],
  // Hidden Grotto encounters are shiny-locked in Gen 5. They must not become
  // native shiny-hunt routes; eligible offspring are handled by the breeding
  // layer when a family can legitimately produce eggs.
  ['static', 'gen5-soft-reset'],
  ['gift', 'gen5-gift'], ['gift-egg', 'gen5-gift'], ['only-one', 'gen5-gift'],
]);
const starterSpecies = new Set([495, 498, 501]);
const fossilSpecies = new Set([564, 566]);
// Victini is permanently shiny-locked in the Liberty Garden encounter.
// Do not expose it as a Soft Reset route in the shiny-hunt dataset.
const shinyLockedSpecies = new Set([494]);
const rows = new Map();
const clean = (value) => value.replace(/-/gu, ' ').replace(/\b\w/gu, (m) => m.toUpperCase());
for (let speciesId = 494; speciesId <= 649; speciesId += 1) {
  const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${speciesId}/encounters`);
  if (!response.ok) throw new Error(`PokeAPI ${speciesId}: ${response.status}`);
  const data = await response.json();
  for (const area of data) {
    const location = clean(area.location_area.name);
    for (const detail of area.version_details ?? []) {
      const gameId = games.get(detail.version.name);
      if (!gameId) continue;
      for (const encounter of detail.encounter_details ?? []) {
        if (shinyLockedSpecies.has(speciesId)) continue;
        let method = methods.get(encounter.method.name);
        if (speciesId === 612 && method === 'gen5-soft-reset') method = 'gen5-guaranteed-shiny';
        if (method === 'gen5-gift' && starterSpecies.has(speciesId)) method = 'gen5-soft-reset';
        if (method === 'gen5-gift' && fossilSpecies.has(speciesId)) method = 'gen5-fossil-restore';
        if (!method) continue;
        const key = `${speciesId}:${gameId}:${method}`;
        const existing = rows.get(key);
        rows.set(key, { speciesId, gameId, method, locations: [...new Set([...(existing?.locations ?? []), location])] });
      }
    }
  }
}
const output = [...rows.values()].sort((a, b) => a.speciesId - b.speciesId || a.gameId.localeCompare(b.gameId) || a.method.localeCompare(b.method));
const lines = output.map((row) => `  [${row.speciesId}, '${row.gameId}', '${row.method}', ${JSON.stringify(row.locations)}, [], []],`);
await fs.writeFile('src/lib/pokemon-hunt-routes-v2.gen5.generated.ts', `export const GENERATED_GEN5_ENCOUNTER_TUPLES = [\n${lines.join('\n')}\n] as const;\n`);
console.log(`generated ${output.length} Gen 5 encounter tuples`);
