import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const routesFile = path.join(root, 'src/lib/pokemon-hunt-routes-v2.ts');
const catalogFile = path.join(root, 'src/lib/pokemon-catalog-v2.generated.json');
const gamesFile = path.join(root, 'src/lib/pokemon-game-availability.ts');
const methodsFile = path.join(root, 'src/lib/pokemon-data.ts');
const reportFile = path.join(root, 'reports/pokemon-hunt-routes-v2-structure-report.json');

const allowedHosts = new Set(['serebii.net', 'www.serebii.net', 'bulbapedia.bulbagarden.net', 'wiki.pokemoncentral.it']);
const allowedProvidersByHost = new Map([
  ['serebii.net', 'Serebii'],
  ['www.serebii.net', 'Serebii'],
  ['bulbapedia.bulbagarden.net', 'Bulbapedia'],
  ['wiki.pokemoncentral.it', 'Pokémon Central Wiki'],
]);

const errors = [];
const warnings = [];

function fail(message) {
  errors.push(message);
}

function extractArrayLiteral(code, exportName) {
  const marker = `export const ${exportName}`;
  const markerIndex = code.indexOf(marker);
  if (markerIndex === -1) throw new Error(`Missing ${exportName}`);
  const assignmentIndex = code.indexOf('=', markerIndex);
  if (assignmentIndex === -1) throw new Error(`Missing assignment for ${exportName}`);
  const arrayStart = code.indexOf('[', assignmentIndex);
  if (arrayStart === -1) throw new Error(`Missing array start for ${exportName}`);

  let depth = 0;
  let quote = '';
  let escaped = false;
  for (let index = arrayStart; index < code.length; index += 1) {
    const char = code[index];
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === quote) {
        quote = '';
      }
      continue;
    }
    if (char === '\'' || char === '"' || char === '`') {
      quote = char;
      continue;
    }
    if (char === '[') depth += 1;
    if (char === ']') {
      depth -= 1;
      if (depth === 0) return code.slice(arrayStart, index + 1);
    }
  }
  throw new Error(`Missing array end for ${exportName}`);
}

async function evaluateRoutes() {
  // Import the TypeScript module so generated route blocks (e.g. Gen 2 families)
  // are evaluated exactly as the application evaluates them.
  const module = await import('../src/lib/pokemon-hunt-routes-v2.ts');
  return module.POKEMON_HUNT_ROUTES_V2;
}

function extractStringArray(code, name) {
  const arrayLiteral = extractArrayLiteral(code, name);
  return vm.runInNewContext(arrayLiteral.replace(/\s+as\s+const\s*$/u, ''), {}, { timeout: 1000 });
}

const routes = await evaluateRoutes();
const { GENERATED_NATIVE_ENCOUNTER_TUPLES } = await import('../src/lib/pokemon-hunt-routes-v2.encounters.generated.ts');
const { GENERATED_CONTEXT_ENCOUNTER_TUPLES } = await import('../src/lib/pokemon-hunt-routes-v2.encounters.context.generated.ts');
const { GENERATED_SPECIAL_ENCOUNTER_TUPLES } = await import('../src/lib/pokemon-hunt-routes-v2.encounters.special.generated.ts');
const {
  chooseRandomHuntRoute,
  HUNT_ROUTE_METHOD_WEIGHTS,
} = await import('../src/lib/pokemon-hunt-route-randomizer.ts');
const { HUNTING_METHODS } = await import('../src/lib/pokemon-data.ts');
const {
  BDSP_POKE_RADAR_EXPECTED_ROUTE_COUNT,
} = await import('../src/lib/pokemon-hunt-routes-v2.bdsp.ts');
const {
  PLA_MASS_OUTBREAK_EXPECTED_TARGET_COUNT,
  PLA_MASSIVE_MASS_OUTBREAK_EXPECTED_TARGET_COUNT,
} = await import('../src/lib/pokemon-hunt-routes-v2.pla.ts');
const {
  SV_MASS_OUTBREAK_EXPECTED_TARGET_GAME_COUNT,
} = await import('../src/lib/pokemon-hunt-routes-v2.sv.ts');
const { getCuratedShinyOriginGameIds } = await import('../src/lib/pokemon-game-availability.ts');
const {
  getGen1FamilyPosition,
  getGen1FamilyRootEntityKey,
} = await import('../src/lib/pokemon-hunt-routes-v2.gen1.ts');
const forbiddenWords = ['unverified', 'partial'];
for (const route of routes) {
  const verificationText = [route.explanation, ...route.sources.map((item) => item.note)].join(' ');
  for (const word of forbiddenWords) {
    if (new RegExp(`\\b${word}\\b`, 'iu').test(verificationText)) {
      fail(`Forbidden verification word found in ${route.id}: ${word}`);
    }
  }
}
const { POKEMON_CATALOG_V2 } = await import('../src/lib/pokemon-catalog-v2.registry.ts');
const catalog = POKEMON_CATALOG_V2;
const entityKeys = new Set(catalog.map((entry) => entry.key));
const speciesIdByEntityKey = new Map(catalog.map((entry) => [entry.key, entry.speciesId]));
const gameIds = new Set(extractStringArray(fs.readFileSync(gamesFile, 'utf8'), 'TRACKED_GAME_IDS'));
const methodIds = new Set([...fs.readFileSync(methodsFile, 'utf8').matchAll(/\{\s*id:\s*'([^']+)'/gu)].map((match) => match[1]));

if (!Array.isArray(routes) || routes.length === 0) fail('POKEMON_HUNT_ROUTES_V2 must contain at least one verified route');

const routeIds = new Set();
for (const [index, route] of routes.entries()) {
  const label = `route[${index}] ${route?.id ?? '(missing id)'}`;

  if (!route.id) fail(`${label}: missing id`);
  if (routeIds.has(route.id)) fail(`${label}: duplicate id`);
  routeIds.add(route.id);

  if (!entityKeys.has(route.targetEntityKey)) fail(`${label}: unknown targetEntityKey ${route.targetEntityKey}`);
  if (route.eggResultEntityKey && !entityKeys.has(route.eggResultEntityKey)) fail(`${label}: unknown eggResultEntityKey ${route.eggResultEntityKey}`);
  if (route.evolveFromEntityKey && !entityKeys.has(route.evolveFromEntityKey)) fail(`${label}: unknown evolveFromEntityKey ${route.evolveFromEntityKey}`);

  if (!gameIds.has(route.gameId)) fail(`${label}: unknown gameId ${route.gameId}`);
  if (!methodIds.has(route.huntingMethodId)) fail(`${label}: unknown huntingMethodId ${route.huntingMethodId}`);
  if (!route.verifiedAt || !/^\d{4}-\d{2}-\d{2}$/u.test(route.verifiedAt)) fail(`${label}: missing or invalid verifiedAt`);
  if (route.targetChancePercent !== undefined && (!(route.targetChancePercent > 0) || route.targetChancePercent > 100)) {
    fail(`${label}: targetChancePercent must be greater than 0 and no more than 100`);
  }

  if (!Array.isArray(route.sources) || route.sources.length === 0) {
    fail(`${label}: at least one Serebii/Bulbapedia source is required`);
  } else {
    for (const [sourceIndex, routeSource] of route.sources.entries()) {
      let host = '';
      try {
        host = new URL(routeSource.url).hostname;
      } catch {
        fail(`${label}: source[${sourceIndex}] invalid URL`);
      }
      if (host && !allowedHosts.has(host)) fail(`${label}: source[${sourceIndex}] forbidden host ${host}`);
      if (host && allowedProvidersByHost.get(host) !== routeSource.provider) {
        fail(`${label}: source[${sourceIndex}] provider/host mismatch`);
      }
      if (!routeSource.note) fail(`${label}: source[${sourceIndex}] missing note`);
    }
  }

  for (const [prereqIndex, prerequisite] of route.prerequisites.entries()) {
    if (prerequisite.entityKey && !entityKeys.has(prerequisite.entityKey)) fail(`${label}: prerequisite[${prereqIndex}] unknown entityKey ${prerequisite.entityKey}`);
    for (const gameId of prerequisite.sourceGameIds ?? []) {
      if (!gameIds.has(gameId)) fail(`${label}: prerequisite[${prereqIndex}] unknown sourceGameId ${gameId}`);
    }
  }

  if (route.recommendation === 'eligible-native' && !['native', 'same-save-evolution', 'same-save-form-change'].includes(route.access)) {
    fail(`${label}: eligible-native route cannot require external setup`);
  }
  if (route.recommendation === 'eligible-with-external-setup' && !route.prerequisites.some((item) => item.type === 'external-parent' || item.type === 'external-game-feature')) {
    fail(`${label}: external setup route must declare an external-parent or external-game-feature prerequisite`);
  }
  if (route.directEncounter && !['wild-random-encounter', 'poke-radar', 'roaming-encounter'].includes(route.method)) {
    fail(`${label}: direct encounter route must use a direct encounter method`);
  }
  if (route.method === 'breeding-and-evolution' && (!route.eggResultEntityKey || !route.evolveFromEntityKey)) {
    fail(`${label}: breeding-and-evolution requires eggResultEntityKey and evolveFromEntityKey`);
  }
}

const gen1FamilyRoots = new Set(routes
  .filter((route) => route.id.includes(':coverage-') && route.eggResultEntityKey)
  .map((route) => route.eggResultEntityKey));
const nativeGen1FamilyGames = new Set(routes
  .filter((route) => route.recommendation === 'eligible-native' && route.huntingMethodId !== 'gen6-friend-safari')
  .map((route) => {
    const familyRoot = getGen1FamilyRootEntityKey(route.targetEntityKey)
      ?? (gen1FamilyRoots.has(route.targetEntityKey) ? route.targetEntityKey : null);
    return familyRoot ? `${familyRoot}:${route.gameId}` : null;
  })
  .filter(Boolean));
for (const route of routes.filter((item) => item.id.includes(':coverage-external-parent-breeding'))) {
  const familyRoot = getGen1FamilyRootEntityKey(route.targetEntityKey);
  if (familyRoot && nativeGen1FamilyGames.has(`${familyRoot}:${route.gameId}`)) {
    fail(`${route.id}: family is obtainable in the same save, so normal breeding must not require import or trade`);
  }
}

for (const gameId of ['gold', 'silver', 'crystal', 'black', 'white']) {
  const localGeodudeBreeding = routes.find((route) => route.targetEntityKey === 'pokemon:74:base'
    && route.gameId === gameId
    && route.huntingMethodId === `gen${gameId === 'black' || gameId === 'white' ? 5 : 2}-egg-hatching`);
  if (!localGeodudeBreeding || localGeodudeBreeding.recommendation !== 'eligible-native'
    || localGeodudeBreeding.prerequisites.some((item) => item.type === 'external-parent')) {
    fail(`Geodude ${gameId} normal breeding must use a locally obtainable family parent`);
  }
}
for (const gameId of ['black2', 'white2']) {
  const externalGeodudeBreeding = routes.find((route) => route.targetEntityKey === 'pokemon:74:base'
    && route.gameId === gameId
    && route.huntingMethodId === 'gen5-egg-hatching');
  if (!externalGeodudeBreeding || externalGeodudeBreeding.recommendation !== 'eligible-with-external-setup'
    || !externalGeodudeBreeding.prerequisites.some((item) => item.type === 'external-parent')) {
    fail(`Geodude ${gameId} normal breeding must retain the external family-parent prerequisite`);
  }
}
for (const gameId of ['omegaruby', 'alphasapphire']) {
  const geodudeMethods = new Set(routes.filter((route) => route.targetEntityKey === 'pokemon:74:base'
    && route.gameId === gameId
    && route.recommendation !== 'not-eligible')
    .map((route) => route.huntingMethodId));
  for (const methodId of ['gen6-random', 'gen6-horde', 'gen6-dexnav', 'gen6-rock-smash', 'gen6-egg-hatching', 'gen6-masuda']) {
    if (!geodudeMethods.has(methodId)) fail(`Geodude ${gameId} is missing ${methodId}`);
  }
}
if (routes.some((route) => route.targetEntityKey === 'pokemon:74:base'
  && route.huntingMethodId === 'gen3-safari'
  && route.locations.some((location) => /safari zone/iu.test(location)))) {
  fail('Geodude Rock Smash encounters in the Hoenn Safari Zone must not be relabelled as Safari grass encounters');
}

const masudaRoutes = routes.filter((route) => route.huntingMethodId.includes('masuda'));
if (masudaRoutes.length === 0) fail('Masuda Method must have separately generated hunt routes');
for (const route of masudaRoutes) {
  const generationMatch = route.huntingMethodId.match(/^gen([4-9])-(?:bdsp-)?masuda$/u);
  if (!generationMatch) fail(`${route.id}: invalid generation-specific Masuda Method id`);
  if (route.method !== 'breeding' && route.method !== 'breeding-and-evolution') {
    fail(`${route.id}: Masuda Method must remain an Egg breeding route`);
  }
  if (route.recommendation !== 'eligible-with-external-setup') {
    fail(`${route.id}: Masuda Method must declare its different-language parent setup`);
  }
  if (!route.prerequisites.some((item) => item.type === 'external-parent' && item.note.includes('different language origins'))) {
    fail(`${route.id}: Masuda Method must require parents with different language origins`);
  }
}

if (HUNT_ROUTE_METHOD_WEIGHTS.standard !== 1
  || HUNT_ROUTE_METHOD_WEIGHTS.masuda !== 0.25
  || HUNT_ROUTE_METHOD_WEIGHTS.breeding !== 0.05) {
  fail('Random hunt method weights must keep standard=1, Masuda=0.25 and Breeding=0.05');
}

const weightedMethodFixtures = [
  { id: 'standard', gameId: 'diamond', huntingMethodId: 'gen4-random', method: 'wild-random-encounter' },
  { id: 'masuda', gameId: 'diamond', huntingMethodId: 'gen4-masuda', method: 'breeding' },
  { id: 'breeding', gameId: 'diamond', huntingMethodId: 'gen4-egg-hatching', method: 'breeding' },
];
const masudaFixturePick = chooseRandomHuntRoute(weightedMethodFixtures, (() => {
  const values = [0.8, 0, 0, 0];
  return () => values.shift() ?? 0;
})());
if (masudaFixturePick?.id !== 'masuda') fail('Weighted route selector did not preserve the reduced Masuda Method band');
const breedingFixturePick = chooseRandomHuntRoute(weightedMethodFixtures, (() => {
  const values = [0.99, 0, 0, 0];
  return () => values.shift() ?? 0;
})());
if (breedingFixturePick?.id !== 'breeding') fail('Weighted route selector did not preserve the strongly reduced Breeding band');

function findRoute(id) {
  return routes.find((route) => route.id === id);
}

const requiredNativeMethodMinimums = new Map([
  ['gen2-game-corner', 18],
  ['gen2-fishing', 50],
  ['gen2-headbutt', 35],
  ['gen4-random', 1_000],
  ['gen4-pokeradar', 450],
  ['gen4-double-encounter', 90],
  ['gen4-fishing', 130],
  ['gen4-game-corner', 12],
  ['gen6-dexnav', 40],
  ['gen6-chain-fishing', 55],
  ['gen6-horde', 170],
  ['gen6-pokeradar-bonus-music', 150],
  ['gen7-sos', 175],
  ['gen7-island-scan', 60],
  ['gen7-gift', 12],
  ['gen7-lgpe-combo', 200],
  ['gen7-npc-trade', 10],
  ['gen8-bdsp-pokeradar', BDSP_POKE_RADAR_EXPECTED_ROUTE_COUNT],
  ['gen8-bdsp-underground-diglett', 7],
  ['gen8-max-raid', 450],
  ['gen8-murder', 450],
  ['gen8-fishing', 16],
  ['pla-mass-outbreak', PLA_MASS_OUTBREAK_EXPECTED_TARGET_COUNT],
  ['pla-massive', PLA_MASSIVE_MASS_OUTBREAK_EXPECTED_TARGET_COUNT],
  ['gen9-sandwich-lv3', 30],
  ['gen9-outbreak', SV_MASS_OUTBREAK_EXPECTED_TARGET_GAME_COUNT],
  ['gen9-outbreak-sandwich', SV_MASS_OUTBREAK_EXPECTED_TARGET_GAME_COUNT],
  ['gen9-tera-raid', 150],
  ['gen9-hyperspace', 15],
]);
for (const [methodId, minimum] of requiredNativeMethodMinimums) {
  const count = routes.filter((route) => route.huntingMethodId === methodId && route.recommendation !== 'not-eligible').length;
  if (count < minimum) fail(`${methodId}: expected at least ${minimum} eligible routes, found ${count}`);
}

const generatedMethodMatrix = [
  ...GENERATED_NATIVE_ENCOUNTER_TUPLES,
  ...GENERATED_CONTEXT_ENCOUNTER_TUPLES,
  ...GENERATED_SPECIAL_ENCOUNTER_TUPLES,
];
const officialFriendSafariSpecies = new Set([
  190, 206, 216, 506, 294, 352, 531, 572, 113, 132, 133, 235,
  12, 46, 165, 415, 267, 284, 313, 314, 49, 127, 214, 666,
  262, 274, 624, 629, 215, 332, 342, 551, 302, 359, 510, 686,
  444, 611, 148, 372, 714, 621, 705, 101, 417, 587, 702, 25,
  125, 618, 694, 310, 404, 523, 596, 175, 209, 281, 39, 303,
  682, 684, 35, 670, 56, 67, 307, 619, 538, 539, 674, 236,
  286, 297, 447, 58, 77, 126, 513, 5, 218, 636, 668, 38,
  654, 662, 16, 21, 83, 84, 163, 520, 527, 581, 357, 627,
  701, 353, 608, 708, 710, 356, 426, 442, 623, 43, 114, 191,
  511, 2, 541, 548, 586, 556, 651, 673, 27, 194, 231, 328,
  51, 105, 290, 323, 423, 536, 660, 225, 361, 363, 459, 614,
  712, 87, 91, 131, 221, 14, 44, 268, 336, 168, 317, 569,
  89, 452, 454, 544, 63, 96, 326, 517, 202, 561, 677, 178,
  203, 575, 578, 299, 525, 557, 95, 219, 222, 247, 112, 213,
  689, 82, 597, 205, 227, 375, 600, 437, 530, 707, 98, 224,
  400, 515, 8, 130, 195, 419, 61, 184, 657,
]);
const radarIncompatibleLocationPattern = /(?:cave|mine|tunnel|ravaged path|oreburgh gate|mt\.? coronet|iron island|victory road|snowpoint temple|old chateau|galactic|warehouse|interior|inside|\b[bu]?\d+f\b)/iu;
for (const [speciesId, gameId, originalMethodId, locations] of generatedMethodMatrix) {
  if (originalMethodId === 'gen4-pokeradar'
    && locations.every((location) => radarIncompatibleLocationPattern.test(location))) continue;
  if (originalMethodId === 'gen6-random'
    && ['x', 'y'].includes(gameId)
    && locations.every((location) => /friend safari/iu.test(location))
    && !officialFriendSafariSpecies.has(speciesId)) continue;
  const generationMatch = originalMethodId.match(/^gen([234])-(?:random|fishing)$/u);
  const huntingMethodId = originalMethodId === 'gen6-random' && ['x', 'y'].includes(gameId) && locations.every((location) => /friend safari/iu.test(location))
    ? 'gen6-friend-safari'
    : generationMatch && locations.every((location) => /safari zone|great marsh/iu.test(location))
    ? `gen${generationMatch[1]}-safari`
    : originalMethodId === 'gen5-fishing'
      ? 'gen5-super-rod'
      : originalMethodId;
  const connectedRoute = routes.find((route) => speciesIdByEntityKey.get(route.targetEntityKey) === speciesId
    && route.gameId === gameId
    && route.huntingMethodId === huntingMethodId
    && route.recommendation !== 'not-eligible');
  if (!connectedRoute) {
    fail(`Generated method matrix disconnected: species ${speciesId}, ${gameId}, ${huntingMethodId}`);
  }
}

for (const speciesId of [90, 91, 98, 118, 129, 130, 131, 147]) {
  for (const gameId of ['sword', 'shield']) {
    if (!routes.some((route) => route.targetEntityKey === `pokemon:${speciesId}:base`
      && route.gameId === gameId
      && route.huntingMethodId === 'gen8-fishing'
      && route.directEncounter
      && route.recommendation === 'eligible-native')) {
      fail(`Generation I fishing matrix is missing species ${speciesId} in ${gameId}`);
    }
  }
}

for (const speciesId of [133, 137, 142]) {
  for (const gameId of ['sun', 'moon', 'ultrasun', 'ultramoon']) {
    if (!routes.some((route) => route.targetEntityKey === `pokemon:${speciesId}:base`
      && route.gameId === gameId
      && route.huntingMethodId === 'gen7-gift'
      && route.recommendation === 'eligible-native')) {
      fail(`Generation I gift matrix is missing species ${speciesId} in ${gameId}`);
    }
  }
}

const gen1TeraRaidRoutes = routes.filter((route) => route.huntingMethodId === 'gen9-tera-raid'
  && speciesIdByEntityKey.get(route.targetEntityKey) <= 151
  && route.recommendation !== 'not-eligible');
if (gen1TeraRaidRoutes.some((route) => route.targetEntityKey === 'pokemon:128:base')) {
  fail('Scarlet/Violet permanent Tera raids contain Paldean Tauros breeds, not base Kanto Tauros');
}
for (const targetKey of ['pokemon:16:base', 'pokemon:18:base', 'pokemon:52:base', 'pokemon:83:base', 'pokemon:115:base', 'pokemon:137:base']) {
  if (!routes.some((route) => route.targetEntityKey === targetKey
    && route.gameId === 'za'
    && route.huntingMethodId === 'gen9-hyperspace'
    && route.directEncounter
    && route.recommendation === 'eligible-native')) {
    fail(`Generation I Hyperspace matrix is missing ${targetKey}`);
  }
}

for (const [speciesId, zone] of [[13, 'Wild Zone 1'], [25, 'Wild Zone 3'], [65, 'Wild Zone 20'], [95, 'Wild Zone 14'], [120, 'Wild Zone 2'], [149, 'Wild Zone 20']]) {
  if (!routes.some((route) => route.targetEntityKey === `pokemon:${speciesId}:base`
    && route.gameId === 'za'
    && route.huntingMethodId === 'gen9-zone-bench-soft-reset'
    && route.directEncounter
    && route.locations.includes(zone))) {
    fail(`Generation I Z-A Wild Zone matrix is missing species ${speciesId} at ${zone}`);
  }
}
if (routes.some((route) => route.targetEntityKey.startsWith('pokemon:')
  && Number(route.targetEntityKey.split(':')[1]) <= 151
  && route.gameId === 'za'
  && route.recommendation !== 'not-eligible'
  && route.locations.some((location) => location === 'Lumiose City hunt origin'))) {
  fail('Generation I Z-A routes must not retain the generic Lumiose City hunt origin placeholder');
}

const isGenericCoverageRoute = (route) => route.locations.some((location) => (
  /^(?:Documented in-game(?: family)? encounter|Lumiose City hunt origin)$/iu.test(location)
));
for (const route of routes.filter((item) => speciesIdByEntityKey.get(item.targetEntityKey) <= 151
  && item.recommendation !== 'not-eligible'
  && isGenericCoverageRoute(item))) {
  if (!routes.some((alternative) => alternative !== route
    && alternative.targetEntityKey === route.targetEntityKey
    && alternative.gameId === route.gameId
    && alternative.recommendation !== 'not-eligible'
    && !isGenericCoverageRoute(alternative))) {
    fail(`${route.id}: generic Generation I coverage route has no precise method/location alternative`);
  }
}

const teraRaidMethod = HUNTING_METHODS.find((method) => method.id === 'gen9-tera-raid');
if (teraRaidMethod?.baseOdds !== 4103.05 || teraRaidMethod.supportsShinyCharm) {
  fail('Tera Raid method must use approximately 1/4103.05 seed odds and ignore the Shiny Charm');
}
const gen1BaseTargets = catalog.filter((entry) => entry.speciesId >= 13 && entry.speciesId <= 151 && entry.formKey === 'base');
for (const target of gen1BaseTargets) {
  const family = getGen1FamilyPosition(target.key);
  if (!family?.previousEntityKey || family.rootEntityKey === target.key) continue;
  const sourceRoutes = routes.filter((route) => route.targetEntityKey === family.rootEntityKey
    && route.recommendation !== 'not-eligible'
    && !['breeding', 'breeding-and-evolution', 'evolution-from-hunted-shiny'].includes(route.method));
  for (const source of sourceRoutes) {
    const replacesGenericZaBabyOrigin = source.gameId === 'za'
      && source.locations.includes('Lumiose City hunt origin');
    if (!routes.some((route) => route.targetEntityKey === target.key
      && route.gameId === source.gameId
      && (replacesGenericZaBabyOrigin
        ? !route.locations.includes('Lumiose City hunt origin')
        : route.huntingMethodId === source.huntingMethodId)
      && route.method === 'evolution-from-hunted-shiny')) {
      fail(`${target.key}: missing evolution route from ${family.rootEntityKey} ${source.gameId} ${source.huntingMethodId}`);
    }
  }
}

for (const speciesId of [65, 68, 76, 94]) {
  const targetKey = `pokemon:${speciesId}:base`;
  for (const route of routes.filter((item) => item.targetEntityKey === targetKey
    && item.method === 'evolution-from-hunted-shiny'
    && item.gameId !== 'pla')) {
    if (route.access !== 'external-game-feature'
      || route.recommendation !== 'eligible-with-external-setup'
      || !route.prerequisites.some((item) => item.type === 'external-game-feature' && /trade/iu.test(item.note))
      || /evolving it in the same save/iu.test(route.explanation)) {
      fail(`${route.id}: Generation I trade evolution must declare the external trade setup`);
    }
  }
  for (const route of routes.filter((item) => item.targetEntityKey === targetKey
    && item.method === 'evolution-from-hunted-shiny'
    && item.gameId === 'pla')) {
    if (route.access !== 'same-save-evolution'
      || route.recommendation !== 'eligible-native'
      || !route.prerequisites.some((item) => /Linking Cord/iu.test(item.note))) {
      fail(`${route.id}: Pokémon Legends: Arceus trade evolution must use the same-save Linking Cord route`);
    }
  }
  for (const route of routes.filter((item) => item.targetEntityKey === targetKey
    && item.method === 'breeding-and-evolution'
    && item.recommendation === 'eligible-native')) {
    fail(`${route.id}: Generation I trade evolution cannot be marked fully native after breeding`);
  }
}

const gameGeneration = {
  gold: 2, silver: 2, crystal: 2,
  ruby: 3, sapphire: 3, firered: 3, leafgreen: 3, emerald: 3,
  diamond: 4, pearl: 4, platinum: 4, heartgold: 4, soulsilver: 4,
  black: 5, white: 5, black2: 5, white2: 5,
  x: 6, y: 6, omegaruby: 6, alphasapphire: 6,
  sun: 7, moon: 7, ultrasun: 7, ultramoon: 7, lgp: 7, lge: 7,
  sword: 8, shield: 8, brilliantdiamond: 8, shiningpearl: 8, pla: 8,
  scarlet: 9, violet: 9, za: 9,
};
const methodGeneration = new Map(HUNTING_METHODS.map((method) => [method.id, method.generation]));
for (const route of routes.filter((item) => item.recommendation !== 'not-eligible')) {
  const generation = methodGeneration.get(route.huntingMethodId);
  if (generation && generation !== gameGeneration[route.gameId]) {
    fail(`${route.id}: generation ${generation} method cannot be used in generation ${gameGeneration[route.gameId]} game ${route.gameId}`);
  }
  if (route.gameId === 'pla' && !route.huntingMethodId.startsWith('pla-')) {
    fail(`${route.id}: Legends: Arceus route must use a PLA-specific method, found ${route.huntingMethodId}`);
  }
}

const derivedMethodRequirements = new Map([
  ['gen6-pokeradar', 'gen6-pokeradar-bonus-music'],
  ['gen7-lgpe-random', 'gen7-lgpe-combo'],
  ['gen8-bdsp-underground', 'gen8-bdsp-underground-diglett'],
]);
for (const [sourceMethodId, derivedMethodId] of derivedMethodRequirements) {
  const eligibleSourceRoutes = routes.filter((route) => route.recommendation !== 'not-eligible'
    && route.directEncounter
    && route.huntingMethodId === sourceMethodId);
  for (const sourceRoute of eligibleSourceRoutes) {
    const derivedRoute = routes.find((route) => route.targetEntityKey === sourceRoute.targetEntityKey
      && route.gameId === sourceRoute.gameId
      && route.huntingMethodId === derivedMethodId
      && route.recommendation !== 'not-eligible');
    if (!derivedRoute) fail(`${sourceRoute.id}: missing applicable alternative ${derivedMethodId}`);
  }
}

for (const sourceRoute of routes.filter((route) => route.recommendation !== 'not-eligible'
  && route.directEncounter
  && (route.gameId === 'sword' || route.gameId === 'shield')
  && route.huntingMethodId === 'gen8-random')) {
  if (!routes.some((route) => route.targetEntityKey === sourceRoute.targetEntityKey
    && route.gameId === sourceRoute.gameId
    && route.huntingMethodId === 'gen8-murder'
    && route.recommendation !== 'not-eligible')) {
    fail(`${sourceRoute.id}: missing applicable Brilliant Aura method`);
  }
}

for (const sourceRoute of routes.filter((route) => route.recommendation !== 'not-eligible'
  && route.directEncounter
  && (route.gameId === 'scarlet' || route.gameId === 'violet')
  && route.huntingMethodId === 'gen9-random')) {
  if (!routes.some((route) => route.targetEntityKey === sourceRoute.targetEntityKey
    && route.gameId === sourceRoute.gameId
    && route.huntingMethodId === 'gen9-sandwich-lv3'
    && route.recommendation !== 'not-eligible')) {
    fail(`${sourceRoute.id}: missing applicable Sparkling Power method`);
  }
}

const bdspRadarRoutes = routes.filter((route) => route.id.endsWith(':bdsp-poke-radar')
  && route.recommendation !== 'not-eligible');
if (bdspRadarRoutes.length !== BDSP_POKE_RADAR_EXPECTED_ROUTE_COUNT) {
  fail(`BDSP Poké Radar matrix expected exactly ${BDSP_POKE_RADAR_EXPECTED_ROUTE_COUNT} routes, found ${bdspRadarRoutes.length}`);
}

const plaMassOutbreakRoutes = routes.filter((route) => route.gameId === 'pla'
  && route.id.endsWith(':mass-outbreak')
  && route.huntingMethodId === 'pla-mass-outbreak'
  && route.recommendation !== 'not-eligible');
if (plaMassOutbreakRoutes.length !== PLA_MASS_OUTBREAK_EXPECTED_TARGET_COUNT) {
  fail(`PLA Mass Outbreak matrix expected exactly ${PLA_MASS_OUTBREAK_EXPECTED_TARGET_COUNT} targets, found ${plaMassOutbreakRoutes.length}`);
}
for (const regionalTarget of ['pokemon:58:growlithe-hisui', 'pokemon:100:voltorb-hisui', 'pokemon:211:qwilfish-hisui', 'pokemon:215:sneasel-hisui']) {
  if (!plaMassOutbreakRoutes.some((route) => route.targetEntityKey === regionalTarget)) {
    fail(`PLA Mass Outbreak matrix is missing regional target ${regionalTarget}`);
  }
}
for (const wrongBaseTarget of ['pokemon:58:base', 'pokemon:100:base', 'pokemon:211:base']) {
  if (plaMassOutbreakRoutes.some((route) => route.targetEntityKey === wrongBaseTarget)) {
    fail(`PLA Mass Outbreak matrix must not substitute the original form ${wrongBaseTarget} for its Hisuian outbreak`);
  }
}

const plaMassiveRoutes = routes.filter((route) => route.gameId === 'pla'
  && route.id.endsWith(':massive-mass-outbreak')
  && route.huntingMethodId === 'pla-massive'
  && route.recommendation !== 'not-eligible');
if (plaMassiveRoutes.length !== PLA_MASSIVE_MASS_OUTBREAK_EXPECTED_TARGET_COUNT) {
  fail(`PLA Massive Mass Outbreak matrix expected exactly ${PLA_MASSIVE_MASS_OUTBREAK_EXPECTED_TARGET_COUNT} targets, found ${plaMassiveRoutes.length}`);
}
const unownMassiveRoutes = plaMassiveRoutes.filter((route) => speciesIdByEntityKey.get(route.targetEntityKey) === 201);
if (unownMassiveRoutes.length !== 28) {
  fail(`PLA Massive Mass Outbreak must keep all 28 Unown forms separate, found ${unownMassiveRoutes.length}`);
}
for (const regionalTarget of ['pokemon:58:growlithe-hisui', 'pokemon:59:arcanine-hisui', 'pokemon:100:voltorb-hisui', 'pokemon:101:electrode-hisui', 'pokemon:157:typhlosion-hisui', 'pokemon:211:qwilfish-hisui', 'pokemon:215:sneasel-hisui']) {
  if (!plaMassiveRoutes.some((route) => route.targetEntityKey === regionalTarget)) {
    fail(`PLA Massive Mass Outbreak matrix is missing regional target ${regionalTarget}`);
  }
}

const svOutbreakRoutes = routes.filter((route) => route.huntingMethodId === 'gen9-outbreak'
  && route.id.endsWith(':mass-outbreak')
  && route.recommendation !== 'not-eligible');
const svOutbreakSandwichRoutes = routes.filter((route) => route.huntingMethodId === 'gen9-outbreak-sandwich'
  && route.id.endsWith(':mass-outbreak-sandwich')
  && route.recommendation !== 'not-eligible');
if (svOutbreakRoutes.length !== SV_MASS_OUTBREAK_EXPECTED_TARGET_GAME_COUNT
  || svOutbreakSandwichRoutes.length !== SV_MASS_OUTBREAK_EXPECTED_TARGET_GAME_COUNT) {
  fail(`SV outbreak matrices must each contain ${SV_MASS_OUTBREAK_EXPECTED_TARGET_GAME_COUNT} target/game decisions`);
}
for (const outbreakRoute of svOutbreakRoutes) {
  if (!svOutbreakSandwichRoutes.some((route) => route.targetEntityKey === outbreakRoute.targetEntityKey
    && route.gameId === outbreakRoute.gameId)) {
    fail(`${outbreakRoute.id}: missing Outbreak + Sandwich counterpart`);
  }
}
for (const [targetEntityKey, unavailableGame] of [
  ['pokemon:27:sandshrew-alola', 'scarlet'],
  ['pokemon:37:vulpix-alola', 'violet'],
  ['pokemon:128:tauros-paldea-aqua-breed', 'scarlet'],
  ['pokemon:128:tauros-paldea-blaze-breed', 'violet'],
  ['pokemon:190:base', 'scarlet'],
  ['pokemon:207:base', 'violet'],
  ['pokemon:408:base', 'violet'],
  ['pokemon:410:base', 'scarlet'],
]) {
  if (svOutbreakRoutes.some((route) => route.targetEntityKey === targetEntityKey && route.gameId === unavailableGame)) {
    fail(`${targetEntityKey} must not receive its version-exclusive outbreak in ${unavailableGame}`);
  }
}
for (const [speciesId, unavailableGame] of [[79, 'brilliantdiamond'], [228, 'brilliantdiamond'], [234, 'brilliantdiamond'], [371, 'brilliantdiamond'], [246, 'shiningpearl'], [262, 'shiningpearl'], [304, 'shiningpearl'], [352, 'shiningpearl']]) {
  if (bdspRadarRoutes.some((route) => speciesIdByEntityKey.get(route.targetEntityKey) === speciesId
    && route.gameId === unavailableGame)) {
    fail(`BDSP Poké Radar version-exclusive species ${speciesId} must not appear in ${unavailableGame}`);
  }
}

const silcoonDiamondRoutes = routes.filter((route) => route.targetEntityKey === 'pokemon:266:base' && route.gameId === 'diamond');
for (const methodId of ['gen4-random', 'gen4-double-encounter', 'gen4-honey-tree', 'gen4-pokeradar']) {
  if (!silcoonDiamondRoutes.some((route) => route.huntingMethodId === methodId && route.recommendation === 'eligible-native')) {
    fail(`Silcoon Diamond must include native ${methodId}`);
  }
}

const cranidosDiamond = findRoute('pokemon:408:base:diamond:gen4-coverage-special-origin');
if (!cranidosDiamond || cranidosDiamond.huntingMethodId !== 'gen4-fossil-restore') {
  fail('Cranidos Diamond must include the Skull Fossil restoration route');
}
if (routes.some((route) => route.targetEntityKey === 'pokemon:408:base' && route.gameId === 'pearl' && route.huntingMethodId === 'gen4-fossil-restore')) {
  fail('Cranidos must not be offered as a Pearl fossil restoration');
}

let randomState = 0x5eed1234;
const seededRandom = () => {
  randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;
  return randomState / 0x100000000;
};
const silcoonDistribution = { standard: 0, masuda: 0, breeding: 0 };
for (let index = 0; index < 10_000; index += 1) {
  const selected = chooseRandomHuntRoute(silcoonDiamondRoutes, seededRandom);
  if (!selected) continue;
  if (selected.huntingMethodId.includes('masuda')) silcoonDistribution.masuda += 1;
  else if (selected.method === 'breeding' || selected.method === 'breeding-and-evolution') silcoonDistribution.breeding += 1;
  else silcoonDistribution.standard += 1;
}
if (silcoonDistribution.standard < 7_000 || silcoonDistribution.masuda > 2_500 || silcoonDistribution.breeding > 700) {
  fail(`Silcoon Diamond weighted distribution is still breeding-heavy: ${JSON.stringify(silcoonDistribution)}`);
}

const puruglyPearl = findRoute('pokemon:432:base:pearl:wild-route-222-229');
if (!puruglyPearl) {
  fail('Missing required pilot route: Purugly Pearl wild Routes 222/229');
} else {
  if (puruglyPearl.gameId !== 'pearl') fail('Purugly Pearl pilot route must be in Pearl');
  if (puruglyPearl.targetEntityKey !== 'pokemon:432:base') fail('Purugly Pearl pilot route must target Purugly');
  if (puruglyPearl.method !== 'wild-random-encounter') fail('Purugly Pearl pilot route must be random encounter');
  if (puruglyPearl.recommendation !== 'eligible-native') fail('Purugly Pearl pilot route must be native eligible');
}

const puruglyDiamond = findRoute('pokemon:432:base:diamond:external-parent-breeding-evolution');
if (!puruglyDiamond) {
  fail('Missing required pilot route: Purugly Diamond external parent breeding + evolution');
} else {
  if (puruglyDiamond.method !== 'breeding-and-evolution') fail('Purugly Diamond must not be modeled as a random encounter');
  if (puruglyDiamond.eggResultEntityKey !== 'pokemon:431:base') fail('Purugly Diamond breeding route must hatch Glameow');
  if (puruglyDiamond.recommendation !== 'eligible-with-external-setup') fail('Purugly Diamond must require external setup');
  if (puruglyDiamond.directEncounter) fail('Purugly Diamond must not be a direct encounter');
}

const impossiblePuruglyDiamondEncounter = routes.find((route) => {
  return route.targetEntityKey === 'pokemon:432:base'
    && route.gameId === 'diamond'
    && route.method === 'wild-random-encounter';
});
if (impossiblePuruglyDiamondEncounter) fail('Forbidden route found: Purugly Diamond random encounter');

const grotleDiamond = findRoute('pokemon:388:base:diamond:starter-evolution');
if (!grotleDiamond) {
  fail('Missing required pilot route: Grotle Diamond starter evolution');
} else {
  if (grotleDiamond.method !== 'evolution-from-hunted-shiny') fail('Grotle Diamond must be modeled as evolution from hunted shiny Turtwig');
  if (grotleDiamond.evolveFromEntityKey !== 'pokemon:387:base') fail('Grotle Diamond must evolve from Turtwig');
  if (grotleDiamond.directEncounter) fail('Grotle Diamond must not be a direct encounter');
}

const impossibleGrotleDiamondEncounter = routes.find((route) => {
  return route.targetEntityKey === 'pokemon:388:base'
    && route.gameId === 'diamond'
    && route.method === 'wild-random-encounter';
});
if (impossibleGrotleDiamondEncounter) fail('Forbidden route found: Grotle Diamond random encounter');

const suicuneCrystal = findRoute('pokemon:245:base:crystal:tin-tower');
if (!suicuneCrystal) {
  fail('Missing required Gen 2 route: Suicune Crystal Tin Tower');
} else {
  if (suicuneCrystal.method !== 'static-encounter') fail('Suicune Crystal must be a static encounter');
  if (suicuneCrystal.huntingMethodId !== 'gen2-soft-reset') fail('Suicune Crystal must use the Gen 2 Soft Reset hunting method');
  if (suicuneCrystal.locations.join('|') !== 'Tin Tower') fail('Suicune Crystal must be located at Tin Tower');
}
if (routes.some((route) => route.targetEntityKey === 'pokemon:245:base' && route.gameId === 'crystal' && route.method === 'roaming-encounter')) {
  fail('Forbidden route found: Suicune Crystal roaming encounter');
}
if (routes.some((route) => ['gold', 'silver', 'crystal'].includes(route.gameId) && /surf/iu.test(route.huntingMethodId))) {
  fail('Generation II Surf must remain classified under Random Encounter, not a separate hunting method');
}
if (routes.some((route) => ['ruby', 'sapphire', 'emerald', 'firered', 'leafgreen'].includes(route.gameId) && /surf/iu.test(route.huntingMethodId))) {
  fail('Generation III Surf must remain classified under Random Encounter, not a separate hunting method');
}
if (routes.some((route) => ['diamond', 'pearl', 'platinum', 'heartgold', 'soulsilver'].includes(route.gameId) && /surf/iu.test(route.huntingMethodId))) {
  fail('Generation IV Surf must remain classified under Random Encounter, not a separate hunting method');
}
if (routes.some((route) => ['black', 'white', 'black2', 'white2'].includes(route.gameId) && /surf/iu.test(route.huntingMethodId))) {
  fail('Generation V Surf must remain classified under Random Encounter, not a separate hunting method');
}
if (routes.some((route) => ['x', 'y', 'omegaruby', 'alphasapphire'].includes(route.gameId) && /surf/iu.test(route.huntingMethodId))) {
  fail('Generation VI Surf must remain classified under Random Encounter, not a separate hunting method');
}
const gen2NativeMethods = new Set(['gen2-random', 'gen2-fishing', 'gen2-headbutt', 'gen2-rock-smash']);
for (const route of routes) {
  if (['gold', 'silver', 'crystal'].includes(route.gameId)
    && route.recommendation !== 'not-eligible'
    && gen2NativeMethods.has(route.huntingMethodId)
    && !route.sources.some((source) => source.provider === 'Pokémon Central Wiki')) {
    fail(`${route.id}: Generation II native route must include Pokémon Central Wiki as a cross-check source`);
  }
}
const gen3NativeMethods = new Set(['gen3-random', 'gen3-fishing', 'gen3-rock-smash', 'gen3-safari']);
for (const route of routes) {
  if (['ruby', 'sapphire', 'emerald', 'firered', 'leafgreen'].includes(route.gameId)
    && route.recommendation !== 'not-eligible'
    && gen3NativeMethods.has(route.huntingMethodId)
    && !route.sources.some((source) => source.provider === 'Pokémon Central Wiki')) {
    fail(`${route.id}: Generation III native route must include Pokémon Central Wiki as a cross-check source`);
  }
}
const gen4Games = ['diamond', 'pearl', 'platinum', 'heartgold', 'soulsilver'];
for (const route of routes) {
  if (gen4Games.includes(route.gameId)
    && route.recommendation !== 'not-eligible'
    && !route.sources.some((source) => source.provider === 'Pokémon Central Wiki')) {
    fail(`${route.id}: Generation IV route must include Pokémon Central Wiki as a cross-check source`);
  }
}
const gen5Games = ['black', 'white', 'black2', 'white2'];
for (const route of routes) {
  if (gen5Games.includes(route.gameId)
    && route.recommendation !== 'not-eligible'
    && !route.sources.some((source) => source.provider === 'Pokémon Central Wiki')) {
    fail(`${route.id}: Generation V route must include Pokémon Central Wiki as a cross-check source`);
  }
}
const gen6Games = ['x', 'y', 'omegaruby', 'alphasapphire'];
for (const route of routes) {
  if (gen6Games.includes(route.gameId)
    && route.recommendation !== 'not-eligible'
    && !route.sources.some((source) => source.provider === 'Pokémon Central Wiki')) {
    fail(`${route.id}: Generation VI route must include Pokémon Central Wiki as a cross-check source`);
  }
}

for (const gameId of ['gold', 'silver', 'crystal']) {
  for (const methodId of ['gen2-random', 'gen2-fishing', 'gen2-headbutt', 'gen2-rock-smash']) {
    const hasMethod = routes.some((route) => route.gameId === gameId && route.huntingMethodId === methodId && route.recommendation !== 'not-eligible');
    if (!hasMethod) fail(`${gameId} is missing native ${methodId} coverage`);
  }
  const redGyarados = findRoute(`pokemon:130:base:${gameId}:red-gyarados`);
  if (redGyarados?.huntingMethodId !== 'static overworld game gift') fail(`Red Gyarados ${gameId} must remain Static Overworld / Game Gift`);
  for (const speciesId of [249, 250]) {
    const legendary = routes.find((route) => route.targetEntityKey === `pokemon:${speciesId}:base` && route.gameId === gameId);
    if (legendary?.huntingMethodId !== 'gen2-soft-reset') fail(`Generation 2 static legendary ${speciesId} in ${gameId} must use Soft Reset`);
  }
}
for (const gameId of ['ruby', 'sapphire', 'emerald', 'firered', 'leafgreen']) {
  for (const methodId of ['gen3-random', 'gen3-fishing', 'gen3-rock-smash']) {
    const hasMethod = routes.some((route) => route.gameId === gameId && route.huntingMethodId === methodId && route.recommendation !== 'not-eligible');
    if (!hasMethod) fail(`${gameId} is missing native ${methodId} coverage`);
  }
}
const gen4ExpectedMethodsByGame = {
  diamond: ['gen4-random', 'gen4-double-encounter', 'gen4-fishing', 'gen4-honey-tree', 'gen4-pokeradar', 'gen4-safari', 'gen4-soft-reset', 'gen4-fossil-restore', 'gen4-gift-egg'],
  pearl: ['gen4-random', 'gen4-double-encounter', 'gen4-fishing', 'gen4-honey-tree', 'gen4-pokeradar', 'gen4-safari', 'gen4-soft-reset', 'gen4-fossil-restore', 'gen4-gift-egg'],
  platinum: ['gen4-random', 'gen4-double-encounter', 'gen4-fishing', 'gen4-honey-tree', 'gen4-pokeradar', 'gen4-safari', 'gen4-soft-reset', 'gen4-fossil-restore', 'gen4-roaming', 'gen4-runaway', 'gen4-gift-egg'],
  heartgold: ['gen4-random', 'gen4-fishing', 'gen4-headbutt', 'gen4-rock-smash', 'gen4-safari', 'gen4-game-corner', 'gen4-soft-reset', 'gen4-fossil-restore', 'gen4-gift-egg'],
  soulsilver: ['gen4-random', 'gen4-fishing', 'gen4-headbutt', 'gen4-rock-smash', 'gen4-safari', 'gen4-game-corner', 'gen4-soft-reset', 'gen4-fossil-restore', 'gen4-gift-egg'],
};
for (const [gameId, methodIds] of Object.entries(gen4ExpectedMethodsByGame)) {
  for (const methodId of methodIds) {
    const hasMethod = routes.some((route) => route.gameId === gameId && route.huntingMethodId === methodId && route.recommendation !== 'not-eligible');
    if (!hasMethod) fail(`${gameId} is missing Generation IV ${methodId} coverage`);
  }
}
const gen5ExpectedMethodsByGame = {
  black: ['gen5-random', 'gen5-double-encounter', 'gen5-rustling-grass', 'gen5-dust-clouds', 'gen5-super-rod', 'gen5-rippling-waters', 'gen5-soft-reset', 'gen5-fossil-restore', 'gen5-gift', 'gen5-egg-hatching', 'gen5-masuda'],
  white: ['gen5-random', 'gen5-double-encounter', 'gen5-rustling-grass', 'gen5-dust-clouds', 'gen5-super-rod', 'gen5-rippling-waters', 'gen5-soft-reset', 'gen5-fossil-restore', 'gen5-gift', 'gen5-egg-hatching', 'gen5-masuda'],
  black2: ['gen5-random', 'gen5-double-encounter', 'gen5-rustling-grass', 'gen5-double-rustling-grass', 'gen5-dust-clouds', 'gen5-double-dust-clouds', 'gen5-super-rod', 'gen5-rippling-waters', 'gen5-soft-reset', 'gen5-fossil-restore', 'gen5-gift', 'gen5-guaranteed-shiny', 'gen5-egg-hatching', 'gen5-masuda'],
  white2: ['gen5-random', 'gen5-double-encounter', 'gen5-rustling-grass', 'gen5-double-rustling-grass', 'gen5-dust-clouds', 'gen5-double-dust-clouds', 'gen5-super-rod', 'gen5-rippling-waters', 'gen5-soft-reset', 'gen5-fossil-restore', 'gen5-gift', 'gen5-guaranteed-shiny', 'gen5-egg-hatching', 'gen5-masuda'],
};
for (const [gameId, methodIds] of Object.entries(gen5ExpectedMethodsByGame)) {
  for (const methodId of methodIds) {
    const hasMethod = routes.some((route) => route.gameId === gameId && route.huntingMethodId === methodId && route.recommendation !== 'not-eligible');
    if (!hasMethod) fail(`${gameId} is missing Generation V ${methodId} coverage`);
  }
}
for (const entity of catalog) {
  if (entity.generationIntroduced > 6) continue;
  if (entity.completionPolicy === 'informational') continue;
  if (['battle-only', 'temporary', 'fusion'].includes(entity.kind)) continue;
  const availability = getCuratedShinyOriginGameIds(entity.speciesId, entity.canonicalName);
  if (!availability) continue;
  for (const gameId of gen6Games) {
    if (!availability.includes(gameId)) continue;
    const eligible = routes.some((route) => route.targetEntityKey === entity.key
      && route.gameId === gameId
      && route.recommendation !== 'not-eligible');
    if (!eligible) fail(`${entity.key} must have an eligible Generation VI route in ${gameId}`);
  }
}
for (const key of ['pokemon:495:base', 'pokemon:498:base', 'pokemon:501:base']) {
  for (const gameId of gen6Games) {
    const route = routes.find((item) => item.targetEntityKey === key
      && item.gameId === gameId
      && item.id.includes(':gen6-supplemental-egg-hatching'));
    if (!route || route.huntingMethodId !== 'gen6-egg-hatching' || route.recommendation !== 'eligible-with-external-setup') {
      fail(`${key} must have a Generation VI supplemental breeding route in ${gameId}`);
    }
  }
}
for (const [key, gameId] of [['pokemon:380:base', 'alphasapphire'], ['pokemon:381:base', 'omegaruby'], ['pokemon:638:base', 'omegaruby'], ['pokemon:638:base', 'alphasapphire'], ['pokemon:641:therian', 'omegaruby'], ['pokemon:642:therian', 'alphasapphire']]) {
  const route = routes.find((item) => item.targetEntityKey === key
    && item.gameId === gameId
    && item.id.includes(':gen6-supplemental-soft-reset'));
  if (!route || route.huntingMethodId !== 'gen6-soft-reset' || route.recommendation !== 'eligible-native') {
    fail(`${key} must have a Generation VI supplemental Soft Reset route in ${gameId}`);
  }
}
if (routes.some((route) => gen5Games.includes(route.gameId)
  && route.recommendation !== 'not-eligible'
  && ['gen5-fishing', 'gen5-old-rod', 'gen5-good-rod'].includes(route.huntingMethodId))) {
  fail('Generation V ordinary fishing must use Super Rod; Old Rod and Good Rod must not be invented for Gen 5');
}
for (const speciesId of [495, 498, 501]) {
  for (const gameId of gen5Games) {
    const starter = routes.find((route) => route.targetEntityKey === `pokemon:${speciesId}:base`
      && route.gameId === gameId
      && route.huntingMethodId === 'gen5-soft-reset');
    if (!starter || starter.method !== 'soft-reset-gift' || starter.recommendation !== 'eligible-native') {
      fail(`Unova starter #${speciesId} in ${gameId} must use native Soft Reset gift`);
    }
  }
}
if (routes.some((route) => gen5Games.includes(route.gameId)
  && route.recommendation !== 'not-eligible'
  && /hidden.?grotto/iu.test(`${route.huntingMethodId} ${route.locations.join(' ')} ${route.explanation}`))) {
  fail('Hidden Grotto encounters are shiny locked and must not be exposed as eligible Generation V shiny routes');
}
if (routes.some((route) => route.targetEntityKey === 'pokemon:494:base'
  && gen5Games.includes(route.gameId)
  && route.recommendation !== 'not-eligible')) {
  fail('Victini must remain excluded as shiny locked in Generation V');
}
for (const gameId of ['black2', 'white2']) {
  const haxorus = routes.find((route) => route.targetEntityKey === 'pokemon:612:base'
    && route.gameId === gameId
    && route.locations.includes('Nature Sanctuary Area')
    && route.recommendation !== 'not-eligible');
  if (!haxorus || haxorus.huntingMethodId !== 'gen5-guaranteed-shiny' || haxorus.method !== 'static-encounter') {
    fail(`Nature Sanctuary Haxorus in ${gameId} must use Guaranteed Shiny Encounter`);
  }
}
const gen6ExpectedMethodsByGame = {
  x: ['gen6-random', 'gen6-horde', 'gen6-pokeradar', 'gen6-pokeradar-bonus-music', 'gen6-fishing', 'gen6-chain-fishing', 'gen6-rock-smash', 'gen6-friend-safari', 'gen6-soft-reset', 'gen6-fossil-restore', 'gen6-gift', 'gen6-egg-hatching', 'gen6-masuda'],
  y: ['gen6-random', 'gen6-horde', 'gen6-pokeradar', 'gen6-pokeradar-bonus-music', 'gen6-fishing', 'gen6-chain-fishing', 'gen6-rock-smash', 'gen6-friend-safari', 'gen6-soft-reset', 'gen6-fossil-restore', 'gen6-gift', 'gen6-egg-hatching', 'gen6-masuda'],
  omegaruby: ['gen6-random', 'gen6-horde', 'gen6-dexnav', 'gen6-rock-smash', 'gen6-soft-reset', 'gen6-fossil-restore', 'gen6-egg-hatching', 'gen6-masuda'],
  alphasapphire: ['gen6-random', 'gen6-horde', 'gen6-dexnav', 'gen6-rock-smash', 'gen6-soft-reset', 'gen6-fossil-restore', 'gen6-egg-hatching', 'gen6-masuda'],
};
for (const [gameId, methodIds] of Object.entries(gen6ExpectedMethodsByGame)) {
  for (const methodId of methodIds) {
    const hasMethod = routes.some((route) => route.gameId === gameId && route.huntingMethodId === methodId && route.recommendation !== 'not-eligible');
    if (!hasMethod) fail(`${gameId} is missing Generation VI ${methodId} coverage`);
  }
}
for (let speciesId = 650; speciesId <= 721; speciesId += 1) {
  for (const gameId of gen6Games) {
    const decisions = routes.filter((route) => route.targetEntityKey === `pokemon:${speciesId}:base`
      && route.gameId === gameId
      && route.id.includes(':gen6-coverage-'));
    if (decisions.length !== 1) fail(`National Dex #${speciesId} ${gameId} must have exactly one Generation VI coverage decision; found ${decisions.length}`);
  }
}
const gen6FormEntities = catalog.filter((entry) => entry.speciesId >= 650 && entry.speciesId <= 721 && entry.formKey !== 'base');
for (const entity of gen6FormEntities) {
  for (const gameId of gen6Games) {
    const decisions = routes.filter((route) => route.targetEntityKey === entity.key
      && route.gameId === gameId
      && route.id.includes(':gen6-form-coverage-'));
    if (decisions.length !== 1) fail(`${entity.key} ${gameId} must have exactly one Generation VI form coverage decision; found ${decisions.length}`);
  }
}
const xyExclusiveSpecies = [
  [682, 'y', 'x'], [683, 'y', 'x'],
  [684, 'x', 'y'], [685, 'x', 'y'],
  [690, 'y', 'x'], [691, 'y', 'x'],
  [692, 'x', 'y'], [693, 'x', 'y'],
];
for (const [speciesId, nativeGame, externalGame] of xyExclusiveSpecies) {
  const nativeRoute = routes.find((route) => route.targetEntityKey === `pokemon:${speciesId}:base`
    && route.gameId === nativeGame
    && route.id.includes(':gen6-coverage-'));
  const isTradeEvolution = [683, 685].includes(speciesId);
  if (!nativeRoute || nativeRoute.recommendation !== (isTradeEvolution ? 'eligible-with-external-setup' : 'eligible-native') || ![isTradeEvolution ? 'external-game-feature' : 'native', 'same-save-evolution'].includes(nativeRoute.access) || nativeRoute.huntingMethodId !== 'gen6-random') {
    fail(`Generation VI version-exclusive #${speciesId} must be native only in ${nativeGame}`);
  }
  const externalRoute = routes.find((route) => route.targetEntityKey === `pokemon:${speciesId}:base`
    && route.gameId === externalGame
    && route.id.includes(':gen6-coverage-'));
  if (!externalRoute || externalRoute.recommendation !== 'eligible-with-external-setup' || !['external-parent-breeding', 'external-parent-breeding-evolution'].includes(externalRoute.access) || externalRoute.huntingMethodId !== 'gen6-egg-hatching') {
    fail(`Generation VI version-exclusive #${speciesId} must require an external parent in ${externalGame}`);
  }
}
for (const speciesId of officialFriendSafariSpecies) {
  for (const gameId of ['x', 'y']) {
    const route = routes.find((item) => speciesIdByEntityKey.get(item.targetEntityKey) === speciesId
      && item.gameId === gameId
      && item.huntingMethodId === 'gen6-friend-safari'
      && item.directEncounter
      && item.locations.some((location) => /friend safari/iu.test(location)));
    if (!route || route.recommendation !== 'eligible-native' || route.access !== 'native' || !route.directEncounter) {
      fail(`Generation VI #${speciesId} must have a native Friend Safari route in ${gameId}; Friend Safari ignores X/Y exclusivity`);
    }
  }
}
for (const speciesId of [683, 685]) {
  for (const gameId of ['x', 'y']) {
    const route = routes.find((item) => item.targetEntityKey === `pokemon:${speciesId}:base`
      && item.gameId === gameId
      && item.huntingMethodId === 'gen6-friend-safari'
      && item.locations.some((location) => /friend safari/iu.test(location)));
    if (!route || route.recommendation !== 'eligible-with-external-setup' || route.access !== 'external-game-feature' || route.directEncounter) {
      fail(`Generation VI trade evolution #${speciesId} must be available from Friend Safari only through external trade-evolution setup in ${gameId}`);
    }
  }
}
if (routes.some((route) => ['x', 'y'].includes(route.gameId)
  && route.huntingMethodId === 'gen6-random'
  && route.locations.some((location) => /friend safari/iu.test(location)))) {
  fail('Generation VI Friend Safari locations must use gen6-friend-safari, not gen6-random');
}
const directFriendSafariSpecies = new Set(routes
  .filter((route) => ['x', 'y'].includes(route.gameId)
    && route.huntingMethodId === 'gen6-friend-safari'
    && route.directEncounter
    && route.recommendation !== 'not-eligible')
  .map((route) => speciesIdByEntityKey.get(route.targetEntityKey)));
for (const speciesId of directFriendSafariSpecies) {
  if (!officialFriendSafariSpecies.has(speciesId)) {
    fail(`Generation VI direct Friend Safari route for #${speciesId} is not in the official Serebii Friend Safari table`);
  }
}
for (const key of ['pokemon:666:poke-ball-pattern', 'pokemon:666:vivillon-fancy']) {
  for (const gameId of gen6Games) {
    const route = routes.find((item) => item.targetEntityKey === key && item.gameId === gameId && item.id.includes(':gen6-form-coverage-'));
    if (!route || route.recommendation !== 'not-eligible' || route.access !== 'event-only') fail(`${key} must be event-only/not-eligible in ${gameId}`);
  }
}
for (const key of ['pokemon:705:sliggoo-hisui', 'pokemon:706:goodra-hisui', 'pokemon:713:avalugg-hisui']) {
  for (const gameId of gen6Games) {
    const route = routes.find((item) => item.targetEntityKey === key && item.gameId === gameId && item.id.includes(':gen6-form-coverage-'));
    if (!route || route.recommendation !== 'not-eligible' || route.access !== 'unobtainable') fail(`${key} must be unobtainable/not-eligible in Generation VI ${gameId}`);
  }
}
for (const key of ['pokemon:666:vivillon-archipelago', 'pokemon:669:flabebe-blue', 'pokemon:670:floette-blue', 'pokemon:671:florges-blue', 'pokemon:676:furfrou-heart', 'pokemon:710:pumpkaboo-super', 'pokemon:711:gourgeist-super']) {
  for (const gameId of gen6Games) {
    const route = routes.find((item) => item.targetEntityKey === key && item.gameId === gameId && item.id.includes(':gen6-form-coverage-'));
    if (!route || route.recommendation === 'not-eligible') fail(`${key} must have an eligible Generation VI form route in ${gameId}`);
  }
}
for (const speciesId of [650, 653, 656]) {
  for (const gameId of ['x', 'y']) {
    const route = routes.find((item) => item.targetEntityKey === `pokemon:${speciesId}:base` && item.gameId === gameId && item.id.includes(':gen6-coverage-kalos-starter'));
    if (!route || route.method !== 'soft-reset-gift' || route.huntingMethodId !== 'gen6-soft-reset' || route.recommendation !== 'eligible-native') fail(`Kalos starter #${speciesId} must use Soft Reset gift in ${gameId}`);
  }
}
for (const speciesId of [696, 698]) {
  for (const gameId of ['x', 'y']) {
    const route = routes.find((item) => item.targetEntityKey === `pokemon:${speciesId}:base` && item.gameId === gameId && item.id.includes(':gen6-coverage-fossil-restore'));
    if (!route || route.method !== 'gift-pokemon' || route.huntingMethodId !== 'gen6-fossil-restore' || route.recommendation !== 'eligible-native') fail(`Kalos fossil #${speciesId} must use Fossil Restore in ${gameId}`);
  }
}
for (const speciesId of [716, 717, 718, 719, 720, 721]) {
  for (const gameId of gen6Games) {
    const route = routes.find((item) => item.targetEntityKey === `pokemon:${speciesId}:base` && item.gameId === gameId && item.id.includes(':gen6-coverage-'));
    if (!route || route.recommendation !== 'not-eligible' || !['shiny-locked', 'event-only'].includes(route.access)) fail(`Generation VI legendary/mythical #${speciesId} must not be exposed as an eligible shiny route in ${gameId}`);
    if (speciesId === 718 && route && !route.explanation.includes('Generation VII onward')) fail(`Generation VI Zygarde must state that 10%/form-management routes begin in Generation VII onward in ${gameId}`);
  }
}
for (const gameId of gen6Games) {
  const zygarde10 = routes.find((route) => route.targetEntityKey === 'pokemon:718:zygarde-10'
    && route.gameId === gameId
    && route.id.includes(':gen6-form-coverage-'));
  if (!zygarde10 || zygarde10.recommendation !== 'not-eligible' || zygarde10.access !== 'shiny-locked' || !zygarde10.explanation.includes('Generation VII onward')) {
    fail(`Zygarde 10% must be a not-eligible Generation VI form decision stating Generation VII onward in ${gameId}`);
  }
}
for (const [speciesId, gameId] of [[345, 'omegaruby'], [347, 'omegaruby'], [345, 'alphasapphire'], [347, 'alphasapphire']]) {
  const route = routes.find((item) => item.targetEntityKey === `pokemon:${speciesId}:base`
    && item.gameId === gameId
    && item.id.includes(':gen3-coverage-special-origin'));
  if (!route || route.huntingMethodId !== 'gen6-fossil-restore' || route.method !== 'gift-pokemon') fail(`ORAS Hoenn fossil #${speciesId} must use Gen 6 Fossil Restore in ${gameId}`);
}
for (const gameId of ['ruby', 'sapphire', 'emerald']) {
  for (const speciesId of [252, 253, 254, 255, 256, 257, 258, 259, 260]) {
    const route = routes.find((item) => item.targetEntityKey === `pokemon:${speciesId}:base`
      && item.gameId === gameId
      && item.id.includes(':gen3-coverage-special-origin'));
    if (!route || route.huntingMethodId !== 'gen3-soft-reset') fail(`Hoenn starter line #${speciesId} in ${gameId} must use Gen 3 Soft Reset`);
    if (route && !route.locations.includes('Hoenn starter choice')) fail(`Hoenn starter line #${speciesId} in ${gameId} must keep Hoenn starter choice as location`);
  }
  for (const speciesId of [345, 347]) {
    const route = routes.find((item) => item.targetEntityKey === `pokemon:${speciesId}:base`
      && item.gameId === gameId
      && item.id.includes(':gen3-coverage-special-origin'));
    if (!route || route.huntingMethodId !== 'gen3-fossil-restore' || route.method !== 'gift-pokemon') {
      fail(`Hoenn fossil #${speciesId} in ${gameId} must use Gen 3 Fossil Restore`);
    }
  }
}

const expectedOddEggOdds = new Map([[172, 1], [173, 3], [174, 3], [236, 1], [238, 2], [239, 2], [240, 2]]);
for (const [speciesId, chance] of expectedOddEggOdds) {
  const route = findRoute(`pokemon:${speciesId}:base:crystal:odd-egg`);
  if (!route) fail(`Missing Crystal Odd Egg route for species ${speciesId}`);
  else if (route.targetChancePercent !== chance) fail(`Crystal Odd Egg species ${speciesId} must have ${chance}% exact shiny-species chance`);
}

for (const gameId of ['gold', 'silver', 'crystal']) {
  const bulbasaur = findRoute(`pokemon:1:base:${gameId}:external-parent-breeding`);
  if (!bulbasaur) fail(`Missing Bulbasaur external-parent breeding route in ${gameId}`);
  else {
    if (bulbasaur.recommendation !== 'eligible-with-external-setup') fail(`Bulbasaur ${gameId} must require external setup`);
    if (bulbasaur.eggResultEntityKey !== 'pokemon:1:base') fail(`Bulbasaur ${gameId} breeding must hatch Bulbasaur`);
  }
  for (const speciesId of [2, 3]) {
    const route = findRoute(`pokemon:${speciesId}:base:${gameId}:external-parent-breeding-evolution`);
    if (!route || route.method !== 'breeding-and-evolution') fail(`Species ${speciesId} in ${gameId} must use external-parent breeding and evolution`);
  }
}
if (routes.some((route) => [1, 2, 3].some((speciesId) => route.targetEntityKey === `pokemon:${speciesId}:base`) && ['gold', 'silver', 'crystal'].includes(route.gameId) && route.method === 'wild-random-encounter')) {
  fail('Forbidden route found: Bulbasaur family random encounter in Gold/Silver/Crystal');
}

const bulbasaurCoveredGames = new Set(routes.filter((route) => route.targetEntityKey === 'pokemon:1:base').map((route) => route.gameId));
for (const gameId of gameIds) {
  if (!bulbasaurCoveredGames.has(gameId)) fail(`Bulbasaur coverage missing for tracked game ${gameId}`);
}
const bulbasaurPla = findRoute('pokemon:1:base:pla:unobtainable');
if (!bulbasaurPla || bulbasaurPla.recommendation !== 'not-eligible' || bulbasaurPla.access !== 'unobtainable') {
  fail('Bulbasaur must be explicitly unobtainable and excluded in Legends: Arceus');
}

for (let speciesId = 1; speciesId <= 386; speciesId += 1) {
  const coveredGames = new Set(routes.filter((route) => route.targetEntityKey === `pokemon:${speciesId}:base`).map((route) => route.gameId));
  for (const gameId of gameIds) {
    if (!coveredGames.has(gameId)) fail(`National Dex #${speciesId.toString().padStart(3, '0')} coverage missing for ${gameId}`);
  }
}

for (let speciesId = 252; speciesId <= 386; speciesId += 1) {
  const catalogEntity = catalog.find((entry) => entry.key === `pokemon:${speciesId}:base`);
  const curatedEligibleGames = new Set(getCuratedShinyOriginGameIds(speciesId, catalogEntity?.canonicalName) || []);
  for (const gameId of gameIds) {
    const decisions = routes.filter((route) => route.targetEntityKey === `pokemon:${speciesId}:base`
      && route.gameId === gameId
      && route.id.includes(':gen3-coverage-'));
    if (decisions.length !== 1) {
      fail(`National Dex #${speciesId.toString().padStart(3, '0')} ${gameId} must have exactly one Gen 3 coverage decision; found ${decisions.length}`);
      continue;
    }
    const decision = decisions[0];
    let expectedEligible = curatedEligibleGames.has(gameId);
    if (speciesId === 385) expectedEligible = gameId === 'ruby' || gameId === 'sapphire';
    if (speciesId === 386) expectedEligible = false;
    if (speciesId === 384 && (gameId === 'ruby' || gameId === 'sapphire')) expectedEligible = true;
    if (speciesId === 384 && (gameId === 'scarlet' || gameId === 'violet')) expectedEligible = false;
    if (speciesId === 380 && gameId === 'alphasapphire') expectedEligible = false;
    if (speciesId === 381 && gameId === 'omegaruby') expectedEligible = false;
    if (expectedEligible && decision.recommendation === 'not-eligible') {
      fail(`National Dex #${speciesId.toString().padStart(3, '0')} ${gameId} is an allowed shiny origin but its Gen 3 decision excluded it`);
    }
    if (!expectedEligible && decision.recommendation !== 'not-eligible') {
      fail(`National Dex #${speciesId.toString().padStart(3, '0')} ${gameId} is not a repeatable shiny origin but its Gen 3 decision marked it eligible`);
    }
  }
}

const gen3FormEntities = catalog.filter((entry) => entry.speciesId >= 252 && entry.speciesId <= 386 && entry.formKey !== 'base');
if (gen3FormEntities.length !== 8) fail(`Generation III species must currently expose 8 separately classified form entities; found ${gen3FormEntities.length}`);
for (const entity of gen3FormEntities) {
  for (const gameId of gameIds) {
    const decisions = routes.filter((route) => route.targetEntityKey === entity.key
      && route.gameId === gameId
      && route.id.includes(':gen3-form-coverage-'));
    if (decisions.length !== 1) {
      fail(`${entity.key} ${gameId} must have exactly one Gen 3 form decision; found ${decisions.length}`);
      continue;
    }
    const decision = decisions[0];
    const expectedEligible = (entity.key === 'pokemon:263:zigzagoon-galar' || entity.key === 'pokemon:264:linoone-galar')
      ? gameId === 'sword' || gameId === 'shield'
      : entity.key === 'pokemon:386:deoxys-attack'
        ? gameId === 'firered'
        : entity.key === 'pokemon:386:deoxys-defense'
          ? gameId === 'leafgreen'
          : entity.key === 'pokemon:386:deoxys-speed'
            ? gameId === 'emerald'
            : false;
    if (expectedEligible && decision.recommendation === 'not-eligible') fail(`${entity.key} must be eligible in ${gameId}`);
    if (!expectedEligible && decision.recommendation !== 'not-eligible') fail(`${entity.key} must be excluded in ${gameId}`);
  }
}

const castformForms = gen3FormEntities.filter((entry) => entry.speciesId === 351);
if (castformForms.length !== 3 || castformForms.some((form) => routes.some((route) => route.targetEntityKey === form.key && route.recommendation !== 'not-eligible'))) {
  fail('Castform Sunny, Rainy and Snowy must remain informational battle transformations, never separate shiny targets');
}
const spindaEntities = catalog.filter((entry) => entry.speciesId === 327);
if (spindaEntities.length !== 1 || spindaEntities[0].formKey !== 'base') fail('Spinda spot patterns must not be enumerated as separate forms');
const jirachiEligible = routes.filter((route) => route.targetEntityKey === 'pokemon:385:base' && route.id.includes(':gen3-coverage-') && route.recommendation !== 'not-eligible');
if (jirachiEligible.length !== 2 || jirachiEligible.some((route) => !['ruby', 'sapphire'].includes(route.gameId) || route.access !== 'external-game-feature')) {
  fail('Jirachi must only expose the external game-based Ruby/Sapphire shiny distribution origins');
}
const deoxysNormalEligible = routes.filter((route) => route.targetEntityKey === 'pokemon:386:base' && route.recommendation !== 'not-eligible');
if (deoxysNormalEligible.length !== 0) fail('Deoxys Normal Forme must not be presented as a direct own-origin shiny hunt');
for (const gameId of ['ruby', 'sapphire']) {
  const decision = routes.find((route) => route.targetEntityKey === 'pokemon:386:base' && route.gameId === gameId && route.id.includes(':gen3-coverage-transfer-normal-forme'));
  if (!decision || decision.access !== 'transfer-only' || !decision.explanation.includes('automatically appears as Normal Forme')) {
    fail(`Deoxys Normal Forme must be obtainable by transfer in ${gameId}, while remaining excluded as an own-origin hunt`);
  }
}
for (const gameId of ['diamond', 'heartgold', 'black', 'x', 'omegaruby', 'sun', 'brilliantdiamond', 'scarlet']) {
  const normal = routes.find((route) => route.targetEntityKey === 'pokemon:386:base' && route.gameId === gameId && route.id.includes(':gen3-coverage-transfer-normal-forme'));
  if (!normal || normal.access !== 'transfer-only' || normal.recommendation !== 'not-eligible') fail(`Deoxys Normal Forme transfer/form-change ownership missing in ${gameId}`);
  for (const key of ['pokemon:386:deoxys-attack', 'pokemon:386:deoxys-defense', 'pokemon:386:deoxys-speed']) {
    const form = routes.find((route) => route.targetEntityKey === key && route.gameId === gameId && route.id.includes(':gen3-form-coverage-'));
    if (!form || form.access !== 'transfer-only' || form.recommendation !== 'not-eligible') fail(`${key} transfer/form-change ownership missing in ${gameId}`);
  }
}
for (const [key, gameId] of [['pokemon:386:deoxys-attack', 'firered'], ['pokemon:386:deoxys-defense', 'leafgreen'], ['pokemon:386:deoxys-speed', 'emerald']]) {
  const decision = routes.find((route) => route.targetEntityKey === key && route.gameId === gameId && route.id.includes(':gen3-form-coverage-birth-island'));
  if (!decision || decision.access !== 'external-game-feature' || decision.locations.join('|') !== 'Birth Island') fail(`${key} must use its correct Birth Island origin in ${gameId}`);
}
for (const speciesId of [377, 378, 379, 380, 381, 382, 383, 384, 385, 386]) {
  const eligible = routes.filter((route) => route.targetEntityKey === `pokemon:${speciesId}:base` && route.id.includes(':gen3-coverage-') && route.recommendation !== 'not-eligible');
  if (eligible.some((route) => route.method === 'breeding' || route.method === 'breeding-and-evolution')) fail(`Non-breeding National Dex #${speciesId} received a breeding route`);
}
const shedinjaRoutes = routes.filter((route) => route.targetEntityKey === 'pokemon:292:base' && route.id.includes(':gen3-coverage-') && route.recommendation !== 'not-eligible');
if (shedinjaRoutes.some((route) => !route.prerequisites.some((item) => item.note.includes('empty party slot')))) fail('Every eligible Shedinja route must document the empty-party-slot evolution condition');

const isEmeraldHoennStarterSoftReset = (route) => route.gameId === 'emerald'
  && route.locations.includes('Hoenn starter choice')
  && /^pokemon:(25[2-9]|260):base$/u.test(route.targetEntityKey);
const emeraldSoftResetRoutes = routes.filter((route) => route.gameId === 'emerald'
  && route.recommendation !== 'not-eligible'
  && route.huntingMethodId === 'gen3-soft-reset'
  && !isEmeraldHoennStarterSoftReset(route));
if (emeraldSoftResetRoutes.length) {
  fail(`Emerald fixed-seed RNG forbids recommending rapid Soft Reset; offending routes: ${emeraldSoftResetRoutes.map((route) => route.id).join(', ')}`);
}
for (const speciesId of [249, 250, 377, 378, 379, 382, 383, 384]) {
  const route = routes.find((item) => item.targetEntityKey === `pokemon:${speciesId}:base` && item.gameId === 'emerald' && item.recommendation !== 'not-eligible');
  if (!route || route.huntingMethodId !== 'gen3-runaway') fail(`Emerald static National Dex #${speciesId} must use Runaway rather than Soft Reset`);
}
const emeraldSpeedDeoxys = routes.find((route) => route.targetEntityKey === 'pokemon:386:deoxys-speed' && route.gameId === 'emerald');
if (!emeraldSpeedDeoxys || emeraldSpeedDeoxys.huntingMethodId !== 'gen3-runaway') fail('Emerald Speed Forme Deoxys must use Runaway at Birth Island');
const emeraldRayquaza = routes.find((route) => route.targetEntityKey === 'pokemon:384:base' && route.gameId === 'emerald');
if (!emeraldRayquaza || emeraldRayquaza.huntingMethodId !== 'gen3-runaway' || emeraldRayquaza.locations.join('|') !== 'Sky Pillar') fail('Emerald Rayquaza must use Runaway at Sky Pillar');
for (const gameId of ['heartgold', 'soulsilver', 'ultrasun', 'ultramoon']) {
  const route = routes.find((item) => item.targetEntityKey === 'pokemon:384:base' && item.gameId === gameId);
  if (!route || route.recommendation !== 'eligible-with-external-setup' || !route.prerequisites.some((item) => item.type === 'external-game-feature')) {
    fail(`Rayquaza ${gameId} must document the cross-version Kyogre/Groudon prerequisite`);
  }
}
for (const gameId of ['sword', 'shield']) {
  const route = routes.find((item) => item.targetEntityKey === 'pokemon:384:base' && item.gameId === gameId);
  if (!route || !route.prerequisites.some((item) => item.type === 'dlc-access')) fail(`Rayquaza ${gameId} must document Crown Tundra DLC access`);
}
const zaRayquaza = routes.find((route) => route.targetEntityKey === 'pokemon:384:base' && route.gameId === 'za');
if (!zaRayquaza || zaRayquaza.access !== 'shiny-locked' || zaRayquaza.recommendation !== 'not-eligible' || !zaRayquaza.explanation.includes('Hyperspace Sky Pillar')) {
  fail('Legends: Z-A Rayquaza must be recorded as a shiny-locked Hyperspace Sky Pillar encounter');
}

for (let speciesId = 152; speciesId <= 251; speciesId += 1) {
  const catalogEntity = catalog.find((entry) => entry.key === `pokemon:${speciesId}:base`);
  const eligibleGames = new Set(getCuratedShinyOriginGameIds(speciesId, catalogEntity?.canonicalName) || []);
  for (const gameId of gameIds) {
    const decisions = routes.filter((route) => route.targetEntityKey === `pokemon:${speciesId}:base`
      && route.gameId === gameId
      && route.id.includes(':gen2-coverage-'));
    if (decisions.length !== 1) {
      fail(`National Dex #${speciesId.toString().padStart(3, '0')} ${gameId} must have exactly one Gen 2 coverage decision; found ${decisions.length}`);
      continue;
    }
    const decision = decisions[0];
    const expectedEligible = speciesId === 201 && ['gold', 'silver', 'crystal'].includes(gameId)
      ? false
      : eligibleGames.has(gameId);
    if (expectedEligible && decision.recommendation === 'not-eligible') {
      fail(`National Dex #${speciesId.toString().padStart(3, '0')} ${gameId} is an allowed shiny origin but its Gen 2 decision excluded it`);
    }
    if (!expectedEligible && decision.recommendation !== 'not-eligible') {
      fail(`National Dex #${speciesId.toString().padStart(3, '0')} ${gameId} is not a shiny origin but its Gen 2 decision marked it eligible`);
    }
  }
}

const unownCatalogEntities = catalog.filter((entry) => entry.speciesId === 201);
const unownAdditionalForms = unownCatalogEntities.filter((entry) => entry.formKey !== 'base');
if (unownCatalogEntities.length !== 28) fail(`Unown catalog must contain 28 individual forms; found ${unownCatalogEntities.length}`);
if (unownAdditionalForms.length !== 27) fail(`Unown must contain 27 non-base form entities; found ${unownAdditionalForms.length}`);

const unownNativeGames = new Set([
  'gold', 'silver', 'crystal', 'firered', 'leafgreen', 'diamond', 'pearl', 'platinum',
  'heartgold', 'soulsilver', 'omegaruby', 'alphasapphire', 'brilliantdiamond', 'shiningpearl', 'pla',
]);
for (const entity of unownAdditionalForms) {
  for (const gameId of gameIds) {
    const decisions = routes.filter((route) => route.targetEntityKey === entity.key
      && route.gameId === gameId
      && route.id.includes(':unown-coverage-'));
    if (decisions.length !== 1) {
      fail(`${entity.key} ${gameId} must have exactly one individual Unown-form decision; found ${decisions.length}`);
      continue;
    }
    const decision = decisions[0];
    const isPunctuation = entity.formKey === 'unown-exclamation' || entity.formKey === 'unown-question';
    const isGen2Game = ['gold', 'silver', 'crystal'].includes(gameId);
    const isGen2ShinyForm = entity.formKey === 'unown-i' || entity.formKey === 'unown-v';
    const expectedEligible = unownNativeGames.has(gameId) && (!isGen2Game || (!isPunctuation && isGen2ShinyForm));
    if (expectedEligible && decision.recommendation !== 'eligible-native') {
      fail(`${entity.key} ${gameId} must be an eligible native shiny origin`);
    }
    if (!expectedEligible && decision.recommendation !== 'not-eligible') {
      fail(`${entity.key} ${gameId} must be excluded from shiny-origin selection`);
    }
    if (isGen2Game && !isPunctuation && !isGen2ShinyForm && decision.access !== 'shiny-locked') {
      fail(`${entity.key} ${gameId} must record the Generation II DV shiny lock`);
    }
    if (isGen2Game && isPunctuation && decision.access !== 'unobtainable') {
      fail(`${entity.key} ${gameId} must be unobtainable because punctuation Unown began in Generation III`);
    }
  }
}

for (const gameId of ['gold', 'silver', 'crystal']) {
  const formA = routes.find((route) => route.targetEntityKey === 'pokemon:201:base'
    && route.gameId === gameId
    && route.id.includes(':gen2-coverage-'));
  if (!formA || formA.access !== 'shiny-locked' || formA.recommendation !== 'not-eligible') {
    fail(`Unown A must be DV-shiny-locked in ${gameId}`);
  }
}
for (const key of [
  'pokemon:157:typhlosion-hisui',
  'pokemon:194:wooper-paldea',
  'pokemon:199:slowking-galar',
  'pokemon:211:qwilfish-hisui',
  'pokemon:215:sneasel-hisui',
  'pokemon:222:corsola-galar',
]) {
  for (const gameId of ['gold', 'silver', 'crystal']) {
    const route = routes.find((item) => item.targetEntityKey === key
      && item.gameId === gameId
      && item.id.includes(':form-coverage-unavailable'));
    if (!route || route.recommendation !== 'not-eligible' || route.access !== 'unobtainable') {
      fail(`${key} must be explicitly marked unobtainable in Generation II ${gameId}`);
    }
  }
}
for (const entity of unownCatalogEntities) {
  const plaDecision = routes.find((route) => route.targetEntityKey === entity.key && route.gameId === 'pla');
  if (!plaDecision || plaDecision.recommendation !== 'eligible-native' || !plaDecision.prerequisites.some((item) => item.note.includes('28 fixed'))) {
    fail(`${entity.key} PLA must separate fixed shiny-locked specimens from repeatable post-completion spawns`);
  }
}

for (const speciesId of [201, 243, 244, 245, 249, 250, 251]) {
  const eligible = routes.filter((route) => route.targetEntityKey === `pokemon:${speciesId}:base` && route.id.includes(':gen2-coverage-') && route.recommendation !== 'not-eligible');
  if (eligible.some((route) => ['breeding', 'breeding-and-evolution'].includes(route.method))) {
    fail(`Non-breeding National Dex #${speciesId} must never receive a Gen 2 breeding route`);
  }
}

const celebiEligible = routes.filter((route) => route.targetEntityKey === 'pokemon:251:base' && route.id.includes(':gen2-coverage-') && route.recommendation !== 'not-eligible');
if (celebiEligible.length !== 1 || celebiEligible[0].gameId !== 'crystal' || celebiEligible[0].huntingMethodId !== 'gen2-soft-reset' || celebiEligible[0].locations.join('|') !== 'Ilex Forest shrine') {
  fail('Celebi must have exactly one eligible own-origin decision: Crystal Ilex Forest shrine via Soft Reset');
}

const plaUnown = findRoute('pokemon:201:base:pla:gen2-coverage-direct-origin');
if (!plaUnown || !plaUnown.prerequisites.some((item) => item.note.includes('28 fixed'))) {
  fail('Legends: Arceus Unown must distinguish the 28 fixed shiny-locked Unown from repeatable Solaceon Ruins spawns');
}

const plaTyphlosion = findRoute('pokemon:157:base:pla:gen2-coverage-unobtainable');
if (!plaTyphlosion || plaTyphlosion.recommendation !== 'not-eligible') {
  fail('Johto Typhlosion must be excluded as an own-origin shiny in Legends: Arceus');
}

for (const speciesId of [152, 155, 158]) {
  for (const gameId of ['gold', 'silver', 'crystal', 'heartgold', 'soulsilver']) {
    const starter = findRoute(`pokemon:${speciesId}:base:${gameId}:gen2-coverage-special-origin`);
    if (!starter || starter.method !== 'soft-reset-gift' || starter.recommendation !== 'eligible-native') {
      fail(`Johto starter #${speciesId} must use native Soft Reset in ${gameId}`);
    }
  }
}

for (const gameId of ['gold', 'silver', 'crystal']) {
  const smeargle = findRoute(`pokemon:235:base:${gameId}:gen2-coverage-special-origin`);
  if (!smeargle) {
    fail(`Smeargle native-parent breeding route missing in ${gameId}`);
    continue;
  }
  if (smeargle.method !== 'breeding' || smeargle.huntingMethodId !== 'gen2-egg-hatching') {
    fail(`Smeargle ${gameId} must use the Generation II Breeding method`);
  }
  if (smeargle.access !== 'native' || smeargle.recommendation !== 'eligible-native') {
    fail(`Smeargle ${gameId} breeding must be available with native parents`);
  }
  if (smeargle.prerequisites.some((item) => item.type === 'external-parent' || /import or trade|requires? (?:an? )?(?:import|trade)/iu.test(item.note))) {
    fail(`Smeargle ${gameId} must not require an imported or traded parent`);
  }
  if (!smeargle.prerequisites.some((item) => item.note.includes('Ruins of Alph'))) {
    fail(`Smeargle ${gameId} must explain that its parents are caught outside the Ruins of Alph`);
  }
}

for (let speciesId = 13; speciesId <= 151; speciesId += 1) {
  const catalogEntity = catalog.find((entry) => entry.key === `pokemon:${speciesId}:base`);
  const eligibleGames = new Set(getCuratedShinyOriginGameIds(speciesId, catalogEntity?.canonicalName) || []);
  for (const gameId of gameIds) {
    const decisionRoutes = routes.filter((route) => route.targetEntityKey === `pokemon:${speciesId}:base`
      && route.gameId === gameId
      && route.id.includes(':coverage-'));
    if (decisionRoutes.length !== 1) {
      fail(`National Dex #${speciesId.toString().padStart(3, '0')} ${gameId} must have exactly one generated coverage decision; found ${decisionRoutes.length}`);
      continue;
    }
    const decision = decisionRoutes[0];
    if (eligibleGames.has(gameId) && decision.recommendation === 'not-eligible') {
      fail(`National Dex #${speciesId.toString().padStart(3, '0')} ${gameId} is an allowed shiny origin but was excluded`);
    }
    if (!eligibleGames.has(gameId) && decision.recommendation !== 'not-eligible') {
      fail(`National Dex #${speciesId.toString().padStart(3, '0')} ${gameId} is not a shiny origin but was marked eligible`);
    }
  }
}

const gen5FormEntities = catalog.filter((entry) => entry.speciesId >= 494 && entry.speciesId <= 649 && entry.formKey !== 'base');
for (const entity of gen5FormEntities) {
  for (const gameId of gen5Games) {
    const decisions = routes.filter((route) => route.targetEntityKey === entity.key
      && route.gameId === gameId
      && (route.id.includes(':gen5-form-coverage-') || route.id.includes(':form-coverage-unavailable')));
    if (decisions.length !== 1) fail(`${entity.key} ${gameId} must have exactly one Generation V form decision; found ${decisions.length}`);
  }
}
for (const key of ['pokemon:585:autumn', 'pokemon:585:spring', 'pokemon:585:summer', 'pokemon:585:winter']) {
  for (const gameId of gen5Games) {
    const route = routes.find((item) => item.targetEntityKey === key && item.gameId === gameId && item.id.includes(':gen5-form-coverage-season'));
    if (!route || route.huntingMethodId !== 'gen5-random' || route.method !== 'wild-random-encounter' || route.recommendation !== 'eligible-native') {
      fail(`${key} must be a native seasonal Deerling random encounter in ${gameId}`);
    }
  }
}
for (const key of ['pokemon:586:autumn', 'pokemon:586:spring', 'pokemon:586:summer', 'pokemon:586:winter']) {
  for (const gameId of gen5Games) {
    const route = routes.find((item) => item.targetEntityKey === key && item.gameId === gameId && item.id.includes(':gen5-form-coverage-season-evolution'));
    if (!route || route.huntingMethodId !== 'gen5-random' || route.method !== 'evolution-from-hunted-shiny' || route.recommendation !== 'eligible-native') {
      fail(`${key} must be obtained by evolving the matching shiny Deerling season in ${gameId}`);
    }
  }
}
const basculinExpectations = [
  ['pokemon:550:red-striped', ['black', 'black2'], ['white', 'white2']],
  ['pokemon:550:blue-striped', ['white', 'white2'], ['black', 'black2']],
];
for (const [key, nativeGames, externalGames] of basculinExpectations) {
  for (const gameId of nativeGames) {
    const route = routes.find((item) => item.targetEntityKey === key && item.gameId === gameId && item.id.includes(':gen5-form-coverage-basculin-native'));
    if (!route || route.huntingMethodId !== 'gen5-random' || route.recommendation !== 'eligible-native') fail(`${key} must be native in ${gameId}`);
  }
  for (const gameId of externalGames) {
    const route = routes.find((item) => item.targetEntityKey === key && item.gameId === gameId && item.id.includes(':gen5-form-coverage-basculin-external-parent'));
    if (!route || route.huntingMethodId !== 'gen5-egg-hatching' || route.recommendation !== 'eligible-with-external-setup') fail(`${key} must require external parent breeding in ${gameId}`);
  }
}
for (const gameId of gen5Games) {
  const whiteStripe = routes.find((item) => item.targetEntityKey === 'pokemon:550:white-striped' && item.gameId === gameId);
  if (!whiteStripe || whiteStripe.recommendation !== 'not-eligible' || whiteStripe.access !== 'unobtainable') fail(`White-Striped Basculin must be unobtainable in Generation V ${gameId}`);
  const zen = routes.find((item) => item.targetEntityKey === 'pokemon:555:zen' && item.gameId === gameId);
  if (!zen || zen.method !== 'form-change-from-hunted-shiny' || zen.access !== 'same-save-form-change') fail(`Darmanitan Zen Mode must be a form-change route in ${gameId}`);
}

const gen7Games = ['sun', 'moon', 'ultrasun', 'ultramoon', 'lgp', 'lge'];
const gen7CatalogEntities = catalog.filter((entry) => (entry.speciesId >= 722 && entry.speciesId <= 809) || entry.formKey.includes('alola'));
for (const entity of gen7CatalogEntities) {
  for (const gameId of gen7Games) {
    const decisions = routes.filter((route) => route.targetEntityKey === entity.key
      && route.gameId === gameId
      && route.id.includes(':gen7-coverage-'));
    if (decisions.length !== 1) fail(`${entity.key} ${gameId} must have exactly one Generation VII coverage decision; found ${decisions.length}`);
  }
}

for (const speciesId of [722, 725, 728]) {
  for (const gameId of ['sun', 'moon', 'ultrasun', 'ultramoon']) {
    const route = routes.find((item) => item.targetEntityKey === `pokemon:${speciesId}:base`
      && item.gameId === gameId
      && item.id.includes(':gen7-coverage-starter-soft-reset'));
    if (!route || route.method !== 'soft-reset-gift' || route.huntingMethodId !== 'gen7-soft-reset' || route.recommendation !== 'eligible-native') {
      fail(`Alola starter #${speciesId} must be a Soft Reset starter route in ${gameId}`);
    }
  }
}

for (const key of ['pokemon:741:oricorio-pau', 'pokemon:741:oricorio-pom-pom', 'pokemon:741:oricorio-sensu', 'pokemon:774:minior-blue', 'pokemon:774:minior-yellow']) {
  for (const gameId of ['sun', 'moon', 'ultrasun', 'ultramoon']) {
    const route = routes.find((item) => item.targetEntityKey === key && item.gameId === gameId && item.id.includes(':gen7-coverage-form-random'));
    if (!route || route.huntingMethodId !== 'gen7-random' || route.method !== 'wild-random-encounter' || route.recommendation !== 'eligible-native') {
      fail(`${key} must be a separate Gen 7 form random encounter in ${gameId}`);
    }
  }
}

for (const gameId of ['ultrasun', 'ultramoon']) {
  const dusk = routes.find((item) => item.targetEntityKey === 'pokemon:745:lycanroc-dusk' && item.gameId === gameId);
  if (!dusk || dusk.huntingMethodId !== 'gen7-egg-hatching' || dusk.method !== 'breeding-and-evolution' || dusk.recommendation !== 'eligible-with-external-setup') {
    fail(`Lycanroc Dusk must require Own Tempo Rockruff breeding/evolution setup in ${gameId}`);
  }
}
for (const gameId of ['sun', 'moon']) {
  const dusk = routes.find((item) => item.targetEntityKey === 'pokemon:745:lycanroc-dusk' && item.gameId === gameId);
  if (!dusk || dusk.recommendation !== 'not-eligible') fail(`Lycanroc Dusk must be unavailable in ${gameId}`);
}

for (const key of ['pokemon:773:silvally-fire', 'pokemon:773:silvally-water', 'pokemon:773:silvally-fairy']) {
  for (const gameId of ['sun', 'moon', 'ultrasun', 'ultramoon']) {
    const route = routes.find((item) => item.targetEntityKey === key && item.gameId === gameId);
    if (!route || route.method !== 'form-change-from-hunted-shiny' || route.access !== 'same-save-form-change') {
      fail(`${key} must be a Silvally Memory form-change route in ${gameId}`);
    }
  }
}

const gen7UltraBeastExpectations = [
  ['pokemon:793:base', ['sun', 'moon'], 'gen7-soft-reset'],
  ['pokemon:793:base', ['ultrasun', 'ultramoon'], 'gen7-wormhole'],
  ['pokemon:794:base', ['sun'], 'gen7-soft-reset'],
  ['pokemon:794:base', ['ultrasun'], 'gen7-wormhole'],
  ['pokemon:795:base', ['moon'], 'gen7-soft-reset'],
  ['pokemon:795:base', ['ultramoon'], 'gen7-wormhole'],
  ['pokemon:805:base', ['ultramoon'], 'gen7-wormhole'],
  ['pokemon:806:base', ['ultrasun'], 'gen7-wormhole'],
];
for (const [key, gameList, methodId] of gen7UltraBeastExpectations) {
  for (const gameId of gameList) {
    const route = routes.find((item) => item.targetEntityKey === key && item.gameId === gameId);
    if (!route || route.huntingMethodId !== methodId || route.recommendation !== 'eligible-native') {
      fail(`${key} must use ${methodId} in ${gameId}`);
    }
  }
}

for (const speciesId of [785, 786, 787, 788, 789, 790, 791, 792, 800, 801, 802, 807]) {
  for (const gameId of ['sun', 'moon', 'ultrasun', 'ultramoon']) {
    const route = routes.find((item) => item.targetEntityKey === `pokemon:${speciesId}:base` && item.gameId === gameId);
    if (!route || route.recommendation !== 'not-eligible') fail(`Shiny-locked/event Gen 7 species #${speciesId} must not be eligible in ${gameId}`);
  }
}

for (const key of ['pokemon:19:rattata-alola', 'pokemon:26:raichu-alola', 'pokemon:103:exeggutor-alola', 'pokemon:105:marowak-alola']) {
  for (const gameId of ['lgp', 'lge']) {
    const route = routes.find((item) => item.targetEntityKey === key && item.gameId === gameId);
    if (!route || route.huntingMethodId !== 'gen7-npc-trade' || route.method !== 'npc-trade' || route.recommendation !== 'eligible-native') {
      fail(`${key} must be an explicit shiny-eligible NPC Trade route in ${gameId}`);
    }
  }
}

const gen7IntentionalNotOwnOrigin = new Set([
  'pokemon:808:base:lgp',
  'pokemon:808:base:lge',
  'pokemon:809:base:lgp',
  'pokemon:809:base:lge',
]);
for (const entity of catalog) {
  if (entity.generationIntroduced > 7) continue;
  if (entity.completionPolicy === 'informational') continue;
  if (['battle-only', 'temporary', 'fusion'].includes(entity.kind)) continue;
  const availability = getCuratedShinyOriginGameIds(entity.speciesId, entity.canonicalName);
  if (!availability) continue;
  for (const gameId of gen7Games) {
    if (!availability.includes(gameId)) continue;
    if (gen7IntentionalNotOwnOrigin.has(`${entity.key}:${gameId}`)) continue;
    const eligible = routes.some((route) => route.targetEntityKey === entity.key
      && route.gameId === gameId
      && route.recommendation !== 'not-eligible');
    if (!eligible) fail(`${entity.key} must have an eligible Generation VII route in ${gameId}`);
  }
}

for (const key of ['pokemon:495:base', 'pokemon:498:base', 'pokemon:501:base', 'pokemon:650:base', 'pokemon:653:base', 'pokemon:656:base']) {
  for (const gameId of ['sun', 'moon', 'ultrasun', 'ultramoon']) {
    const route = routes.find((item) => item.targetEntityKey === key
      && item.gameId === gameId
      && item.id.includes(':gen7-supplemental-egg-hatching'));
    if (!route || route.huntingMethodId !== 'gen7-egg-hatching' || route.recommendation !== 'eligible-with-external-setup') {
      fail(`${key} must have a Generation VII supplemental breeding route in ${gameId}`);
    }
  }
}

for (const key of ['pokemon:638:base', 'pokemon:641:incarnate', 'pokemon:641:therian', 'pokemon:643:base', 'pokemon:716:base']) {
  const expectedGames = key === 'pokemon:641:incarnate' || key === 'pokemon:641:therian' || key === 'pokemon:643:base' || key === 'pokemon:716:base'
    ? ['ultrasun']
    : ['ultrasun', 'ultramoon'];
  for (const gameId of expectedGames) {
    const route = routes.find((item) => item.targetEntityKey === key
      && item.gameId === gameId
      && item.id.includes(':gen7-supplemental-wormhole'));
    if (!route || route.huntingMethodId !== 'gen7-wormhole' || route.recommendation !== 'eligible-native') {
      fail(`${key} must have a Generation VII supplemental Ultra Wormhole route in ${gameId}`);
    }
  }
}

for (const speciesId of [144, 145, 146, 150]) {
  const eligible = routes.filter((route) => route.targetEntityKey === `pokemon:${speciesId}:base` && route.recommendation !== 'not-eligible');
  if (eligible.some((route) => ['breeding', 'breeding-and-evolution'].includes(route.method))) {
    fail(`Legendary National Dex #${speciesId} must never receive a breeding route`);
  }
}
const mewEligible = routes.filter((route) => route.targetEntityKey === 'pokemon:151:base' && route.recommendation !== 'not-eligible');
if (mewEligible.length !== 1 || mewEligible[0].gameId !== 'emerald' || mewEligible[0].huntingMethodId !== 'gen3-runaway') {
  fail('Mew must have exactly one eligible own-origin route: Japanese Emerald Faraway Island via Runaway');
}
for (const gameId of ['scarlet', 'violet', 'za']) {
  const route = findRoute(`pokemon:10:base:${gameId}:unobtainable`);
  if (!route || route.recommendation !== 'not-eligible') fail(`Caterpie must be excluded as unobtainable in ${gameId}`);
}
for (const speciesId of [2, 5, 8]) {
  for (const gameId of ['x', 'y']) {
    if (!findRoute(`pokemon:${speciesId}:base:${gameId}:friend-safari`)) fail(`Missing Friend Safari route for species ${speciesId} in ${gameId}`);
  }
}
for (const gameId of ['lgp', 'lge']) {
  if (!findRoute(`pokemon:6:base:${gameId}:flying-wild-spawn`)) fail(`Missing direct Charizard flying encounter in ${gameId}`);
}

const gen4CatalogEntities = catalog.filter((entry) => entry.speciesId >= 387 && entry.speciesId <= 493);
for (const entity of gen4CatalogEntities) {
  for (const gameId of gameIds) {
    const decisions = routes.filter((route) => route.targetEntityKey === entity.key
      && route.gameId === gameId
      && route.id.includes(':gen4-coverage-'));
    if (decisions.length !== 1) fail(`${entity.key} ${gameId} must have exactly one Generation IV decision; found ${decisions.length}`);
  }
}

for (const speciesId of [387, 390, 393]) {
  for (const gameId of ['diamond', 'pearl', 'platinum', 'brilliantdiamond', 'shiningpearl']) {
    const route = routes.find((item) => item.targetEntityKey === `pokemon:${speciesId}:base` && item.gameId === gameId && item.id.includes(':gen4-coverage-'));
    if (!route || route.method !== 'soft-reset-gift' || !route.huntingMethodId.includes('soft-reset') || route.recommendation !== 'eligible-native') fail(`Sinnoh starter #${speciesId} must be a non-shiny-locked Soft Reset gift in ${gameId}`);
    if (route?.huntingMethodId.includes('gift')) fail(`Sinnoh starter #${speciesId} in ${gameId} must not be categorized as generic Gift Pokémon`);
  }
  const pla = routes.find((item) => item.targetEntityKey === `pokemon:${speciesId}:base` && item.gameId === 'pla' && item.id.includes(':gen4-coverage-'));
  if (!pla || pla.method !== 'wild-random-encounter' || pla.recommendation !== 'eligible-native') fail(`Sinnoh starter #${speciesId} must use its repeatable wild PLA origin, not the shiny-locked gift`);
}

for (const speciesId of [480, 481, 482, 485, 486, 488]) {
  for (const gameId of ['diamond', 'pearl']) {
    const route = routes.find((item) => item.targetEntityKey === `pokemon:${speciesId}:base` && item.gameId === gameId && item.id.includes(':gen4-coverage-'));
    if (!route || route.recommendation !== 'eligible-native') fail(`National Dex #${speciesId} must retain its original Diamond/Pearl shiny hunt in ${gameId}`);
  }
}

for (const [speciesId, gameId] of [[408, 'diamond'], [410, 'pearl'], [408, 'brilliantdiamond'], [410, 'shiningpearl']]) {
  const route = routes.find((item) => item.targetEntityKey === `pokemon:${speciesId}:base` && item.gameId === gameId && item.id.includes(':gen4-coverage-'));
  if (!route || !route.huntingMethodId.includes('fossil-restore') || route.method !== 'gift-pokemon') fail(`Fossil species #${speciesId} must use Fossil Restore in ${gameId}`);
}
for (const [speciesId, gameIdsForSpecies] of [[408, ['diamond', 'platinum']], [410, ['pearl', 'platinum']]]) {
  for (const gameId of gameIdsForSpecies) {
    const route = routes.find((item) => item.targetEntityKey === `pokemon:${speciesId}:base` && item.gameId === gameId && item.id.includes(':gen4-coverage-'));
    if (!route || route.huntingMethodId !== 'gen4-fossil-restore' || route.method !== 'gift-pokemon') fail(`Generation IV fossil species #${speciesId} must use Gen 4 Fossil Restore in ${gameId}`);
  }
}

for (const speciesId of [412, 413]) {
  const forms = gen4CatalogEntities.filter((entry) => entry.speciesId === speciesId);
  if (forms.length !== 3) fail(`National Dex #${speciesId} must expose Plant, Sandy and Trash cloak decisions`);
}
for (const speciesId of [422, 423]) {
  const forms = gen4CatalogEntities.filter((entry) => entry.speciesId === speciesId);
  if (forms.length !== 2) fail(`National Dex #${speciesId} must expose East Sea and West Sea decisions`);
}

const rotomForms = gen4CatalogEntities.filter((entry) => entry.speciesId === 479 && entry.formKey !== 'base');
if (rotomForms.length !== 5) fail(`Rotom must expose five appliance forms; found ${rotomForms.length}`);
for (const form of rotomForms) {
  for (const gameId of ['diamond', 'pearl']) {
    const route = routes.find((item) => item.targetEntityKey === form.key && item.gameId === gameId && item.id.includes(':gen4-coverage-'));
    if (!route || route.recommendation !== 'not-eligible') fail(`${form.key} must be unavailable in original ${gameId}`);
  }
  const platinum = routes.find((item) => item.targetEntityKey === form.key && item.gameId === 'platinum' && item.id.includes(':gen4-coverage-'));
  if (!platinum || platinum.method !== 'form-change-from-hunted-shiny' || platinum.recommendation !== 'eligible-native') fail(`${form.key} must be a same-shiny appliance form change in Platinum`);
}

for (const key of ['pokemon:483:origin', 'pokemon:484:origin']) {
  const eligible = routes.filter((route) => route.targetEntityKey === key && route.id.includes(':gen4-coverage-') && route.recommendation !== 'not-eligible');
  if (eligible.length !== 0) fail(`${key} must not be presented as a separate own-origin shiny hunt; it is a later form change`);
  for (const gameId of ['pla', 'scarlet', 'violet']) {
    const route = routes.find((item) => item.targetEntityKey === key && item.gameId === gameId && item.id.includes(':gen4-coverage-'));
    if (!route || route.access !== 'transfer-only') fail(`${key} must record transfer/form-change ownership in ${gameId}`);
  }
}

const giratinaOriginPlatinum = routes.find((route) => route.targetEntityKey === 'pokemon:487:origin' && route.gameId === 'platinum' && route.id.includes(':gen4-coverage-'));
if (!giratinaOriginPlatinum || giratinaOriginPlatinum.locations.join('|') !== 'Distortion World' || giratinaOriginPlatinum.method !== 'static-encounter') fail('Giratina Origin Forme must have its direct Platinum Distortion World shiny hunt');
for (const gameId of ['brilliantdiamond', 'shiningpearl']) {
  const route = routes.find((item) => item.targetEntityKey === 'pokemon:487:origin' && item.gameId === gameId && item.id.includes(':gen4-coverage-'));
  if (!route || route.method !== 'form-change-from-hunted-shiny') fail(`Giratina Origin Forme in ${gameId} must come from the same shiny via the Griseous Orb`);
}

const manaphyEligible = routes.filter((route) => route.targetEntityKey === 'pokemon:490:base' && route.id.includes(':gen4-coverage-') && route.recommendation !== 'not-eligible');
if (manaphyEligible.length !== 5 || manaphyEligible.some((route) => route.access !== 'external-game-feature' || route.eggResultEntityKey !== 'pokemon:490:base' || route.method !== 'gift-egg' || route.huntingMethodId !== 'gen4-gift-egg')) fail('Manaphy must expose only the five Generation IV Ranger Gift Egg trade-and-hatch routes');
const darkraiEligible = routes.filter((route) => route.targetEntityKey === 'pokemon:491:base' && route.id.includes(':gen4-coverage-') && route.recommendation !== 'not-eligible');
if (darkraiEligible.length !== 3 || darkraiEligible.some((route) => !['platinum', 'brilliantdiamond', 'shiningpearl'].includes(route.gameId))) fail('Darkrai must be limited to legitimate Member Card encounter origins');
const shayminLandEligible = routes.filter((route) => route.targetEntityKey === 'pokemon:492:land' && route.id.includes(':gen4-coverage-') && route.recommendation !== 'not-eligible');
if (shayminLandEligible.length !== 3 || shayminLandEligible.some((route) => !['platinum', 'brilliantdiamond', 'shiningpearl'].includes(route.gameId))) fail('Shaymin Land Forme must be limited to Oak’s Letter Flower Paradise origins');
const arceusEligible = routes.filter((route) => route.targetEntityKey === 'pokemon:493:base' && route.id.includes(':gen4-coverage-') && route.recommendation !== 'not-eligible');
if (arceusEligible.length !== 2 || arceusEligible.some((route) => !['brilliantdiamond', 'shiningpearl'].includes(route.gameId))) fail('Arceus must only expose the non-shiny-locked BDSP Hall of Origin origins');
for (const speciesId of [490, 491, 492, 493]) {
  const plaKey = speciesId === 492 ? 'pokemon:492:land' : `pokemon:${speciesId}:base`;
  const route = routes.find((item) => item.targetEntityKey === plaKey && item.gameId === 'pla' && item.id.includes(':gen4-coverage-'));
  if (!route || route.access !== 'shiny-locked' || route.recommendation !== 'not-eligible') fail(`${plaKey} must be shiny locked in Legends: Arceus`);
}
for (let speciesId = 480; speciesId <= 493; speciesId += 1) {
  if (speciesId === 489) continue;
  const eligible = routes.filter((route) => route.targetEntityKey.startsWith(`pokemon:${speciesId}:`) && route.id.includes(':gen4-coverage-') && route.recommendation !== 'not-eligible');
  if (eligible.some((route) => route.method === 'breeding' || route.method === 'breeding-and-evolution')) fail(`Non-breeding National Dex #${speciesId} received a breeding route`);
}

const summary = {
  generatedAt: new Date().toISOString(),
  routeCount: routes.length,
  generation1Coverage: {
    species: 151,
    trackedGames: gameIds.size,
    remainingGeneratedDecisions: routes.filter((route) => route.id.includes(':coverage-') && /^pokemon:(?:1[3-9]|[2-9][0-9]|1[0-4][0-9]|150|151):base:/u.test(route.id)).length,
  },
  generation2Coverage: {
    species: 100,
    trackedGames: gameIds.size,
    generatedDecisions: routes.filter((route) => route.id.includes(':gen2-coverage-')).length,
  },
  generation3Coverage: {
    species: 135,
    trackedGames: gameIds.size,
    baseDecisions: routes.filter((route) => route.id.includes(':gen3-coverage-')).length,
    separatelyClassifiedForms: gen3FormEntities.length,
    formDecisions: routes.filter((route) => route.id.includes(':gen3-form-coverage-')).length,
  },
  generation4Coverage: {
    species: 107,
    trackedGames: gameIds.size,
    catalogEntities: gen4CatalogEntities.length,
    generatedDecisions: routes.filter((route) => route.id.includes(':gen4-coverage-')).length,
    separatelyClassifiedForms: gen4CatalogEntities.filter((entry) => entry.formKey !== 'base').length,
  },
  unownFormCoverage: {
    forms: unownCatalogEntities.length,
    trackedGames: gameIds.size,
    totalFormDecisions: routes.filter((route) => route.targetEntityKey.startsWith('pokemon:201:')).length,
    additionalGeneratedDecisions: routes.filter((route) => route.id.includes(':unown-coverage-')).length,
  },
  sourceHosts: [...new Set(routes.flatMap((route) => route.sources.map((item) => new URL(item.url).hostname)))].sort(),
  checkedPilotCases: [
    'Purugly Pearl native wild route',
    'Glameow Diamond external-parent breeding',
    'Purugly Diamond external-parent breeding then evolution',
    'Turtwig Diamond starter soft reset',
    'Grotle Diamond starter evolution',
    'Suicune Crystal static Tin Tower encounter',
    'National Dex #001-151 every tracked game has an explicit decision',
    'National Dex #013-151 decisions agree with curated shiny-origin availability',
    'Mew own-origin hunt limited to Japanese Emerald Faraway Island',
    'National Dex #152-251 every tracked game has an explicit decision',
    'National Dex #152-251 decisions agree with curated shiny-origin availability',
    'Celebi own-origin hunt limited to Crystal Ilex Forest shrine',
    'All 28 Unown forms tracked individually across every game',
    'Generation II shiny Unown restricted to forms I and V by DVs',
    'Unown ! and ? excluded from Generation II and enabled from Generation III',
    'Legends: Arceus fixed Unown separated from repeatable shiny-capable spawns',
    'National Dex #252-386 every tracked game has an explicit decision',
    'Galarian Zigzagoon and Linoone tracked as separate regional forms',
    'Castform weather forms retained as informational battle transformations',
    'Spinda spot patterns not misclassified as separate forms',
    'Deoxys Attack, Defense and Speed forms tied to their correct Birth Island games',
    'Deoxys Normal Forme recorded as transfer-obtainable in Ruby/Sapphire without inventing a local shiny origin',
    'Later Deoxys meteorite form changes recorded as transfer-only ownership for all four forms',
    'ORAS story Eon Pokémon, super-ancient Pokémon and Deoxys shiny locks excluded',
    'Limited-time shiny Rayquaza Tera Raid recorded but excluded from repeatable randomizer origins',
    'Emerald fixed-seed encounters never recommend rapid Soft Reset',
    'Emerald Rayquaza, Regis, weather trio, Navel Rock legends and Speed Deoxys use Runaway',
    'Rayquaza cross-version, DLC and Ramanas Park prerequisites recorded',
    'Legends: Z-A Hyperspace Sky Pillar Rayquaza recorded as shiny locked',
    'National Dex #387-493 and every catalogued form have one decision per tracked game',
    'Sinnoh starters distinguish Soft Reset gifts, PLA wild origins and Terarium encounters',
    'Burmy, Wormadam, Shellos, Gastrodon and Rotom forms tracked individually',
    'Dialga, Palkia, Giratina, Shaymin and Arceus form changes separated from shiny origins',
    'Generation IV Ranger Manaphy Egg trade-and-hatch exception recorded',
    'Darkrai, Shaymin and Arceus event/save-data prerequisites and shiny locks audited',
  ],
  errors,
  warnings,
};

fs.mkdirSync(path.dirname(reportFile), { recursive: true });
fs.writeFileSync(reportFile, `${JSON.stringify(summary, null, 2)}\n`);

if (errors.length > 0) {
  console.error(`pokemon hunt routes v2 audit failed with ${errors.length} error(s)`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`pokemon hunt routes v2 audit passed: ${routes.length} route(s), ${summary.sourceHosts.join(', ')}`);
