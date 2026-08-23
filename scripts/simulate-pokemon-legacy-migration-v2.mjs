import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  planActiveHuntLegacyMapping,
  planBingoLegacyMapping,
  planCaughtLegacyMapping,
  resolveLegacyMapValue,
} from '../src/lib/pokemon-legacy-migration-v2.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const map = JSON.parse(fs.readFileSync(path.join(root, 'src/lib/pokemon-legacy-map-v2.generated.json'), 'utf8'));
const reportPath = path.join(root, 'reports/pokemon-legacy-migration-v2-dry-run.json');

const counts = (items, statusOf = (item) => item.status) => items.reduce((result, item) => {
  const status = statusOf(item);
  result[status] = (result[status] || 0) + 1;
  return result;
}, {});

const exactCases = Object.entries(map.byExactIdAndForm).map(([compound, targets], index) => {
  const [pokemonId, form] = compound.split('\u0000');
  return {
    id: `exact-${index}`,
    pokemonId: Number(pokemonId),
    form,
    expected: targets[0],
  };
});
const exactResolutions = exactCases.map((item) => resolveLegacyMapValue(map, item));
exactResolutions.forEach((resolution, index) => {
  assert.equal(resolution.status, 'resolved');
  assert.equal(resolution.entityKey, exactCases[index].expected);
  assert.equal(resolution.confidence, 'exact');
});

const nameCases = Object.entries(map.byName).map(([pokemonName, targets], index) => ({
  id: `name-${index}`, pokemonId: null, pokemonName, expected: targets[0],
}));
const nameResolutions = nameCases.map((item) => resolveLegacyMapValue(map, item));
nameResolutions.forEach((resolution, index) => {
  assert.equal(resolution.status, 'resolved');
  assert.equal(resolution.entityKey, nameCases[index].expected);
});

const idCases = Object.entries(map.byId).map(([pokemonId, targets]) => ({
  pokemonId: Number(pokemonId), targets,
}));
const idResolutions = idCases.map((item) => resolveLegacyMapValue(map, item));
idResolutions.forEach((resolution, index) => {
  assert.equal(resolution.status, idCases[index].targets.length === 1 ? 'resolved' : 'ambiguous');
});

const caughtRows = exactCases.map((item) => ({
  id: item.id, pokemonId: item.pokemonId, form: item.form,
}));
const caughtPlans = planCaughtLegacyMapping(map, caughtRows);
assert.equal(caughtPlans.filter((item) => item.pokemon.status === 'resolved').length, caughtRows.length);

const activeRows = [];
for (let index = 0; index < exactCases.length; index += 3) {
  const slots = exactCases.slice(index, index + 3).map((item) => ({
    id: item.pokemonId, name: '', form: item.form,
  }));
  activeRows.push({
    id: `hunt-${index / 3}`,
    pokemonName: `__counter_slots_v1__:${JSON.stringify(slots)}`,
  });
}
const activePlans = planActiveHuntLegacyMapping(map, activeRows);
assert.equal(activePlans.filter((item) => item.status === 'resolved').length, activeRows.length);

const uniqueIds = idCases.filter((item) => item.targets.length === 1).map((item) => item.pokemonId);
const ambiguousIds = idCases.filter((item) => item.targets.length > 1).map((item) => item.pokemonId);
const bingoRows = [];
for (let index = 0; index < uniqueIds.length; index += 25) {
  bingoRows.push({ userId: `bingo-${index / 25}`, gridIds: uniqueIds.slice(index, index + 25) });
}
ambiguousIds.forEach((pokemonId, index) => bingoRows.push({
  userId: `bingo-ambiguous-${index}`, gridIds: [uniqueIds[0], pokemonId],
}));
const bingoPlans = planBingoLegacyMapping(map, bingoRows);
assert.equal(bingoPlans.filter((item) => item.grid.status === 'resolved').length, Math.ceil(uniqueIds.length / 25));
assert.equal(bingoPlans.filter((item) => item.grid.status === 'needs-review').length, ambiguousIds.length);

const safetyRows = {
  caught: [
    { id: 'valid-existing', pokemonId: 1, entityKey: 'pokemon:1:base' },
    { id: 'invalid-existing', pokemonId: 1, entityKey: 'pokemon:9999:nope' },
    { id: 'missing', pokemonId: null },
  ],
  active: [
    { id: 'empty' },
    { id: 'malformed', pokemonName: '__counter_slots_v1__:{bad' },
    { id: 'partial', pokemonName: '__counter_slots_v1__:[{"id":1},{"id":10007}]' },
  ],
  bingo: [
    { userId: 'invalid-grid', gridIds: [1], gridEntityKeys: ['pokemon:9999:nope'] },
    { userId: 'invalid-random', gridIds: [1], randomEntityKey: 'pokemon:9999:nope' },
  ],
};
const safetyPlans = {
  caught: planCaughtLegacyMapping(map, safetyRows.caught),
  active: planActiveHuntLegacyMapping(map, safetyRows.active),
  bingo: planBingoLegacyMapping(map, safetyRows.bingo),
};
assert.equal(safetyPlans.caught[0].pokemon.status, 'already-mapped');
assert.equal(safetyPlans.caught[1].pokemon.status, 'needs-review');
assert.equal(safetyPlans.caught[2].pokemon.status, 'unresolved');
assert.equal(safetyPlans.active[0].status, 'empty');
assert.equal(safetyPlans.active[1].status, 'needs-review');
assert.equal(safetyPlans.active[2].status, 'needs-review');
assert.equal(safetyPlans.bingo[0].grid.status, 'needs-review');
assert.equal(safetyPlans.bingo[1].random.status, 'needs-review');

const report = {
  version: 2,
  generatedAt: new Date().toISOString(),
  mode: 'read-only-synthetic-exhaustive',
  writesAttempted: 0,
  source: {
    catalogSha256: map.catalogSha256,
    exactMappingsExercised: exactCases.length,
    nameMappingsExercised: nameCases.length,
    numericMappingsExercised: idCases.length,
  },
  tables: {
    caughtShinies: { rowsSimulated: caughtRows.length, pokemon: counts(caughtPlans, (item) => item.pokemon.status) },
    activeHunts: { rowsSimulated: activeRows.length, rows: counts(activePlans) },
    bingoBoards: { rowsSimulated: bingoRows.length, grids: counts(bingoPlans, (item) => item.grid.status) },
  },
  numericIds: { unique: uniqueIds.length, ambiguousAndBlocked: ambiguousIds.length },
  safetyScenarios: {
    rowsSimulated: Object.values(safetyRows).reduce((sum, rows) => sum + rows.length, 0),
    allBehavedAsRequired: true,
    protections: [
      'invalid-existing-key-blocked',
      'unresolved-row-not-guessed',
      'malformed-counter-payload-blocked',
      'partial-counter-write-blocked',
      'invalid-existing-bingo-grid-blocked',
      'invalid-existing-random-key-blocked',
    ],
  },
  gate: {
    passed: true,
    unsafeAutomaticMappings: 0,
    productionDataRead: false,
    productionDataModified: false,
  },
};

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log('Pokemon legacy migration v2 dry-run');
console.log(`exact mappings exercised: ${exactCases.length}`);
console.log(`name mappings exercised: ${nameCases.length}`);
console.log(`numeric IDs: ${uniqueIds.length} resolvable, ${ambiguousIds.length} blocked`);
console.log(`caught_shinies rows simulated: ${caughtRows.length}`);
console.log(`active_hunts rows simulated: ${activeRows.length}`);
console.log(`bingo_boards rows simulated: ${bingoRows.length}`);
console.log(`safety scenarios: ${report.safetyScenarios.rowsSimulated}`);
console.log('writes attempted: 0');
console.log(`gate: ${report.gate.passed ? 'PASS' : 'FAIL'}`);
