import type { PokemonEntityKey } from './pokemon-catalog-v2';
import { POKEMON_CATALOG_V2 } from './pokemon-catalog-v2.registry';
import { getCuratedShinyOriginGameIds, TRACKED_GAME_IDS, type TrackedGameId } from './pokemon-game-availability';
import type { HuntRouteId, HuntRoutePrerequisite, HuntRouteSource, PokemonHuntRoute } from './pokemon-hunt-routes-v2';

const FIRST_SPECIES = 387;
const LAST_SPECIES = 493;
const verifiedAt = '2026-08-21';

const generationByGame: Record<TrackedGameId, number> = {
  gold: 2, silver: 2, crystal: 2,
  ruby: 3, sapphire: 3, firered: 3, leafgreen: 3, emerald: 3,
  diamond: 4, pearl: 4, platinum: 4, heartgold: 4, soulsilver: 4,
  black: 5, white: 5, black2: 5, white2: 5,
  x: 6, y: 6, omegaruby: 6, alphasapphire: 6,
  sun: 7, moon: 7, ultrasun: 7, ultramoon: 7, lgp: 7, lge: 7,
  sword: 8, shield: 8, brilliantdiamond: 8, shiningpearl: 8, pla: 8,
  scarlet: 9, violet: 9, za: 9,
};

const gamesWithoutBreeding = new Set<TrackedGameId>(['lgp', 'lge', 'pla', 'za']);
const formOnlySpecies = new Set([412, 413, 422, 423, 483, 484, 487, 492]);
const legendaryOrMythical = new Set(Array.from({ length: 14 }, (_, index) => 480 + index));

function entityForSpecies(speciesId: number) {
  const item = POKEMON_CATALOG_V2.find((entry) => entry.speciesId === speciesId && entry.formKey === 'base')
    || POKEMON_CATALOG_V2.find((entry) => entry.speciesId === speciesId);
  if (!item) throw new Error(`Missing Generation IV catalog species ${speciesId}`);
  return item;
}

function entityForKey(key: PokemonEntityKey) {
  const item = POKEMON_CATALOG_V2.find((entry) => entry.key === key);
  if (!item) throw new Error(`Missing Generation IV catalog entity ${key}`);
  return item;
}

const baseKey = (speciesId: number) => `pokemon:${speciesId}:base` as PokemonEntityKey;
const title = (value: string) => value.replace(/(^|[-\s])(\p{L})/gu, (_, prefix: string, letter: string) => `${prefix}${letter.toUpperCase()}`);

function serebiiUrl(speciesId: number, gameId: TrackedGameId, canonicalName: string): string {
  const generation = generationByGame[gameId];
  if (generation <= 4) return `https://www.serebii.net/pokedex-dp/${speciesId.toString().padStart(3, '0')}.shtml`;
  if (generation === 5) return `https://www.serebii.net/pokedex-bw/${speciesId.toString().padStart(3, '0')}.shtml`;
  if (generation === 6) return `https://www.serebii.net/pokedex-xy/${speciesId.toString().padStart(3, '0')}.shtml`;
  if (generation === 7) return `https://www.serebii.net/pokedex-sm/${speciesId.toString().padStart(3, '0')}.shtml`;
  if (generation === 8) return `https://www.serebii.net/pokedex-swsh/${canonicalName}`;
  return `https://www.serebii.net/pokedex-sv/${canonicalName}`;
}

function sourcesFor(key: PokemonEntityKey, gameId: TrackedGameId, note: string): HuntRouteSource[] {
  const item = entityForKey(key);
  const speciesName = item.speciesId === 439 ? 'Mime_Jr.' : title(entityForSpecies(item.speciesId).canonicalName.replace(/-.*/u, ''));
  return [
    { provider: 'Serebii', url: serebiiUrl(item.speciesId, gameId, item.canonicalName), note },
    { provider: 'Bulbapedia', url: `https://bulbapedia.bulbagarden.net/wiki/${speciesName}_(Pok%C3%A9mon)`, note: `Cross-checks ${item.displayName}'s game availability, evolution and form rules.` },
  ];
}

const familyBySpecies = new Map<number, { rootId: number; previousId?: number }>();
function addFamily(...speciesIds: number[]) {
  speciesIds.forEach((speciesId, index) => familyBySpecies.set(speciesId, { rootId: speciesIds[0], previousId: index ? speciesIds[index - 1] : undefined }));
}

[
  [387, 388, 389], [390, 391, 392], [393, 394, 395], [396, 397, 398], [399, 400], [401, 402],
  [403, 404, 405], [406], [408, 409], [410, 411], [415, 416], [417], [418, 419], [420, 421],
  [425, 426], [427, 428], [431, 432], [433], [434, 435], [436, 437], [438], [439], [440], [441],
  [442], [443, 444, 445], [446], [447, 448], [449, 450], [451, 452], [453, 454], [455], [456, 457],
  [458], [459, 460], [479], [489],
].forEach((family) => addFamily(...family));

const crossGenerationEvolution = new Map<number, { rootId: number; previousId: number }>([
  [407, { rootId: 406, previousId: 315 }], [424, { rootId: 190, previousId: 190 }], [429, { rootId: 200, previousId: 200 }],
  [430, { rootId: 198, previousId: 198 }], [461, { rootId: 215, previousId: 215 }], [462, { rootId: 81, previousId: 82 }],
  [463, { rootId: 108, previousId: 108 }], [464, { rootId: 111, previousId: 112 }], [465, { rootId: 114, previousId: 114 }],
  [466, { rootId: 239, previousId: 125 }], [467, { rootId: 240, previousId: 126 }], [468, { rootId: 175, previousId: 176 }],
  [469, { rootId: 193, previousId: 193 }], [470, { rootId: 133, previousId: 133 }], [471, { rootId: 133, previousId: 133 }],
  [472, { rootId: 207, previousId: 207 }], [473, { rootId: 220, previousId: 221 }], [474, { rootId: 137, previousId: 233 }],
  [475, { rootId: 280, previousId: 281 }], [476, { rootId: 299, previousId: 299 }], [477, { rootId: 355, previousId: 356 }],
  [478, { rootId: 361, previousId: 361 }],
]);

for (const [speciesId, family] of crossGenerationEvolution) familyBySpecies.set(speciesId, family);

const incenseByBaby = new Map<number, string>([
  [406, 'Rose Incense'], [433, 'Pure Incense'], [438, 'Rock Incense'], [439, 'Odd Incense'],
  [440, 'Luck Incense'], [446, 'Full Incense'], [458, 'Wave Incense'],
]);

function breedingMethod(gameId: TrackedGameId): string {
  const generation = generationByGame[gameId];
  if (gameId === 'brilliantdiamond' || gameId === 'shiningpearl') return 'gen8-egg-hatching';
  return `gen${generation}-egg-hatching`;
}

function randomEncounterMethod(gameId: TrackedGameId): string {
  if (gameId === 'pla') return 'pla-random';
  return `gen${generationByGame[gameId]}-random`;
}

function breedingLocation(gameId: TrackedGameId): string {
  if (['diamond', 'pearl', 'platinum'].includes(gameId)) return 'Solaceon Town Day Care';
  if (['heartgold', 'soulsilver'].includes(gameId)) return 'Route 34 Day Care';
  if (['brilliantdiamond', 'shiningpearl'].includes(gameId)) return 'Solaceon Town Nursery';
  if (['scarlet', 'violet'].includes(gameId)) return 'Picnic — Egg Basket';
  return 'Pokémon Day Care / Nursery';
}

function unavailableRoute(key: PokemonEntityKey, gameId: TrackedGameId, explanation?: string, access: 'unobtainable' | 'shiny-locked' | 'transfer-only' = 'unobtainable'): PokemonHuntRoute {
  const item = entityForKey(key);
  return {
    id: `${key}:${gameId}:gen4-coverage-unavailable` as HuntRouteId,
    targetEntityKey: key, gameId, method: 'unavailable', huntingMethodId: 'custom', access,
    recommendation: 'not-eligible', directEncounter: false, locations: [], prerequisites: [],
    explanation: explanation || `${item.displayName} has no own-origin shiny hunt in ${gameId}; it is excluded rather than receiving an invented encounter.`,
    sources: sourcesFor(key, gameId, `The verified Generation IV coverage decision excludes ${gameId} as an own-origin shiny hunt.`), verifiedAt,
  };
}

interface SpecialOrigin {
  location: string;
  method: PokemonHuntRoute['method'];
  huntingMethodId: string;
  access?: PokemonHuntRoute['access'];
  recommendation?: PokemonHuntRoute['recommendation'];
  directEncounter?: boolean;
  prerequisite?: HuntRoutePrerequisite;
  explanation: string;
}

const specialOrigins = new Map<string, SpecialOrigin>();
function addSpecial(speciesId: number, gameIds: readonly TrackedGameId[], origin: SpecialOrigin) {
  for (const gameId of gameIds) specialOrigins.set(`${speciesId}:${gameId}`, origin);
}

for (const [base, middle, final] of [[387, 388, 389], [390, 391, 392], [393, 394, 395]] as const) {
  for (const gameId of ['diamond', 'pearl', 'platinum'] as const) {
    addSpecial(base, [gameId], { location: 'Lake Verity — first partner choice', method: 'soft-reset-gift', huntingMethodId: 'gen4-soft-reset', explanation: `${entityForSpecies(base).displayName} is a non-shiny-locked Sinnoh first partner hunted by soft resetting before selection.` });
    addSpecial(middle, [gameId], { location: 'Lake Verity — first partner line', method: 'evolution-from-hunted-shiny', huntingMethodId: 'gen4-soft-reset', explanation: `Evolve the shiny ${entityForSpecies(base).displayName} first partner in the same save.` });
    addSpecial(final, [gameId], { location: 'Lake Verity — first partner line', method: 'evolution-from-hunted-shiny', huntingMethodId: 'gen4-soft-reset', explanation: `Complete the shiny ${entityForSpecies(base).displayName} evolution line in the same save.` });
  }
  for (const gameId of ['brilliantdiamond', 'shiningpearl'] as const) {
    addSpecial(base, [gameId], { location: 'Lake Verity — first partner choice', method: 'soft-reset-gift', huntingMethodId: 'gen8-soft-reset', explanation: `${entityForSpecies(base).displayName} is not shiny locked as the BDSP first partner and is hunted by soft resetting.` });
    addSpecial(middle, [gameId], { location: 'Lake Verity — first partner line', method: 'evolution-from-hunted-shiny', huntingMethodId: 'gen8-soft-reset', explanation: `Evolve the shiny ${entityForSpecies(base).displayName} first partner in the same save.` });
    addSpecial(final, [gameId], { location: 'Lake Verity — first partner line', method: 'evolution-from-hunted-shiny', huntingMethodId: 'gen8-soft-reset', explanation: `Complete the shiny ${entityForSpecies(base).displayName} evolution line in the same save.` });
  }
  addSpecial(base, ['pla'], { location: 'Hisui wild areas / space-time distortions', method: 'wild-random-encounter', huntingMethodId: 'pla-random', directEncounter: true, explanation: `${entityForSpecies(base).displayName} has repeatable wild encounters in Hisui; the shiny-locked starter gift is not used.` });
  addSpecial(middle, ['pla'], { location: 'Hisui first-partner line', method: 'evolution-from-hunted-shiny', huntingMethodId: 'pla-random', explanation: `Evolve a wild-origin shiny ${entityForSpecies(base).displayName} in Hisui.` });
  addSpecial(final, ['pla'], { location: 'Hisui first-partner line', method: 'evolution-from-hunted-shiny', huntingMethodId: 'pla-random', explanation: `Complete the wild-origin shiny ${entityForSpecies(base).displayName} line in Hisui.` });
  for (const gameId of ['scarlet', 'violet'] as const) {
    addSpecial(base, [gameId], { location: 'Terarium — biome biodiversity upgrade', method: 'wild-random-encounter', huntingMethodId: 'gen9-random', directEncounter: true, prerequisite: { type: 'dlc-access', note: 'Requires The Indigo Disk and the corresponding Terarium biome biodiversity upgrade.' }, explanation: `${entityForSpecies(base).displayName} is a repeatable Terarium wild encounter after the biodiversity upgrade.` });
    addSpecial(middle, [gameId], { location: 'Terarium first-partner line', method: 'evolution-from-hunted-shiny', huntingMethodId: 'gen9-random', explanation: `Evolve a Terarium-origin shiny ${entityForSpecies(base).displayName}.` });
    addSpecial(final, [gameId], { location: 'Terarium first-partner line', method: 'evolution-from-hunted-shiny', huntingMethodId: 'gen9-random', explanation: `Complete the Terarium-origin shiny ${entityForSpecies(base).displayName} evolution line.` });
  }
}

for (const gameId of ['diamond', 'platinum'] as const) addSpecial(408, [gameId], { location: 'Oreburgh Mining Museum — Skull Fossil restoration', method: 'gift-pokemon', huntingMethodId: 'gen4-fossil-restore', explanation: 'Restore a Skull Fossil; Cranidos is generated by the fossil restoration and is not a wild encounter.' });
for (const gameId of ['pearl', 'platinum'] as const) addSpecial(410, [gameId], { location: 'Oreburgh Mining Museum — Armor Fossil restoration', method: 'gift-pokemon', huntingMethodId: 'gen4-fossil-restore', explanation: 'Restore an Armor Fossil; Shieldon is generated by the fossil restoration and is not a wild encounter.' });
addSpecial(408, ['brilliantdiamond'], { location: 'Oreburgh Mining Museum — Skull Fossil restoration', method: 'gift-pokemon', huntingMethodId: 'gen8-fossil-restore', explanation: 'Restore the Brilliant Diamond Skull Fossil to generate Cranidos.' });
addSpecial(410, ['shiningpearl'], { location: 'Oreburgh Mining Museum — Armor Fossil restoration', method: 'gift-pokemon', huntingMethodId: 'gen8-fossil-restore', explanation: 'Restore the Shining Pearl Armor Fossil to generate Shieldon.' });
for (const [base, evolved] of [[408, 409], [410, 411]] as const) {
  for (const gameId of ['pla', 'scarlet', 'violet'] as const) {
    addSpecial(base, [gameId], { location: gameId === 'pla' ? 'Coronet Highlands — space-time distortions' : 'Terarium — Canyon Biome', method: 'wild-random-encounter', huntingMethodId: randomEncounterMethod(gameId), directEncounter: true, explanation: `${entityForSpecies(base).displayName} has a repeatable wild origin in ${gameId}.` });
    addSpecial(evolved, [gameId], { location: gameId === 'pla' ? 'Coronet Highlands fossil line' : 'Terarium fossil line', method: 'evolution-from-hunted-shiny', huntingMethodId: randomEncounterMethod(gameId), explanation: `Evolve shiny ${entityForSpecies(base).displayName} in the same save.` });
  }
}

for (const gameId of ['diamond', 'pearl', 'platinum'] as const) addSpecial(479, [gameId], { location: 'Old Chateau — television encounter', method: 'static-encounter', huntingMethodId: 'gen4-soft-reset', explanation: 'Rotom is a stationary Old Chateau television encounter hunted by soft resetting.' });
for (const gameId of ['brilliantdiamond', 'shiningpearl'] as const) addSpecial(479, [gameId], { location: 'Old Chateau — television encounter', method: 'static-encounter', huntingMethodId: 'gen8-soft-reset', explanation: 'Rotom is a stationary Old Chateau television encounter hunted by soft resetting.' });

const legendaryLocations: Record<number, Partial<Record<TrackedGameId, string>>> = {
  480: { diamond: 'Lake Acuity', pearl: 'Lake Acuity', platinum: 'Lake Acuity', black2: 'Nacrene City', white2: 'Nacrene City', omegaruby: 'Nameless Cavern', alphasapphire: 'Nameless Cavern', ultrasun: 'Ultra Space Wilds', ultramoon: 'Ultra Space Wilds', sword: 'Max Lair — Dynamax Adventures', shield: 'Max Lair — Dynamax Adventures', brilliantdiamond: 'Lake Acuity', shiningpearl: 'Lake Acuity' },
  481: { diamond: 'Roaming Sinnoh', pearl: 'Roaming Sinnoh', platinum: 'Roaming Sinnoh', black2: 'Celestial Tower', white2: 'Celestial Tower', omegaruby: 'Nameless Cavern', alphasapphire: 'Nameless Cavern', ultrasun: 'Ultra Space Wilds', ultramoon: 'Ultra Space Wilds', sword: 'Max Lair — Dynamax Adventures', shield: 'Max Lair — Dynamax Adventures', brilliantdiamond: 'Roaming Sinnoh', shiningpearl: 'Roaming Sinnoh' },
  482: { diamond: 'Lake Valor', pearl: 'Lake Valor', platinum: 'Lake Valor', black2: 'Route 23', white2: 'Route 23', omegaruby: 'Nameless Cavern', alphasapphire: 'Nameless Cavern', ultrasun: 'Ultra Space Wilds', ultramoon: 'Ultra Space Wilds', sword: 'Max Lair — Dynamax Adventures', shield: 'Max Lair — Dynamax Adventures', brilliantdiamond: 'Lake Valor', shiningpearl: 'Lake Valor' },
  483: { diamond: 'Spear Pillar', platinum: 'Spear Pillar', heartgold: 'Sinjoh Ruins', soulsilver: 'Sinjoh Ruins', alphasapphire: 'Dimensional Rift', ultrasun: 'Ultra Space Wilds', sword: 'Max Lair — Dynamax Adventures', shield: 'Max Lair — Dynamax Adventures', brilliantdiamond: 'Spear Pillar' },
  484: { pearl: 'Spear Pillar', platinum: 'Spear Pillar', heartgold: 'Sinjoh Ruins', soulsilver: 'Sinjoh Ruins', omegaruby: 'Dimensional Rift', ultramoon: 'Ultra Space Wilds', sword: 'Max Lair — Dynamax Adventures', shield: 'Max Lair — Dynamax Adventures', shiningpearl: 'Spear Pillar' },
  485: { diamond: 'Stark Mountain', pearl: 'Stark Mountain', platinum: 'Stark Mountain', black2: 'Reversal Mountain', white2: 'Reversal Mountain', omegaruby: 'Scorched Slab', alphasapphire: 'Scorched Slab', ultrasun: 'Ultra Space Wilds', sword: 'Max Lair — Dynamax Adventures', shield: 'Max Lair — Dynamax Adventures', brilliantdiamond: 'Stark Mountain', shiningpearl: 'Stark Mountain' },
  486: { diamond: 'Snowpoint Temple', pearl: 'Snowpoint Temple', platinum: 'Snowpoint Temple', black2: 'Twist Mountain', white2: 'Twist Mountain', omegaruby: 'Island Cave', alphasapphire: 'Island Cave', ultramoon: 'Ultra Space Wilds', sword: 'Giant’s Bed — Regi temples completed', shield: 'Giant’s Bed — Regi temples completed', brilliantdiamond: 'Snowpoint Temple', shiningpearl: 'Snowpoint Temple' },
  487: { diamond: 'Turnback Cave', pearl: 'Turnback Cave', heartgold: 'Sinjoh Ruins', soulsilver: 'Sinjoh Ruins', omegaruby: 'Dimensional Rift', alphasapphire: 'Dimensional Rift', ultrasun: 'Ultra Space Wilds', ultramoon: 'Ultra Space Wilds', sword: 'Max Lair — Dynamax Adventures', shield: 'Max Lair — Dynamax Adventures', brilliantdiamond: 'Turnback Cave', shiningpearl: 'Turnback Cave' },
  488: { diamond: 'Roaming Sinnoh', pearl: 'Roaming Sinnoh', platinum: 'Roaming Sinnoh', black2: 'Marvelous Bridge', white2: 'Marvelous Bridge', omegaruby: 'Crescent Isle', alphasapphire: 'Crescent Isle', ultrasun: 'Ultra Space Wilds', ultramoon: 'Ultra Space Wilds', sword: 'Max Lair — Dynamax Adventures', shield: 'Max Lair — Dynamax Adventures', brilliantdiamond: 'Roaming Sinnoh', shiningpearl: 'Roaming Sinnoh' },
};

function legendaryRoute(key: PokemonEntityKey, gameId: TrackedGameId, location: string): PokemonHuntRoute {
  const speciesId = entityForKey(key).speciesId;
  const roaming = [481, 488].includes(speciesId) && ['diamond', 'pearl', 'platinum', 'brilliantdiamond', 'shiningpearl'].includes(gameId);
  const dynamax = location.includes('Dynamax Adventures');
  const wormhole = location.includes('Ultra Space');
  const sinjoh = location.includes('Sinjoh');
  return {
    id: `${key}:${gameId}:gen4-coverage-legendary-origin` as HuntRouteId,
    targetEntityKey: key, gameId, method: roaming ? 'roaming-encounter' : 'static-encounter',
    huntingMethodId: dynamax ? 'gen8-dynamax' : wormhole ? 'gen7-wormhole' : roaming && generationByGame[gameId] === 8 ? 'gen8-soft-reset' : roaming ? `gen${generationByGame[gameId]}-roaming` : `gen${generationByGame[gameId]}-soft-reset`,
    access: sinjoh ? 'external-game-feature' : 'native', recommendation: sinjoh ? 'eligible-with-external-setup' : 'eligible-native', directEncounter: roaming,
    locations: [location], prerequisites: sinjoh ? [{ type: 'external-game-feature', note: 'Requires a legitimate event Arceus to unlock the Sinjoh Ruins creation event.' }] : [],
    explanation: dynamax ? `${entityForKey(key).displayName} can be shiny after capture in Dynamax Adventures.` : `${entityForKey(key).displayName} is a documented non-shiny-locked ${roaming ? 'roaming' : 'stationary'} encounter in ${gameId}.`,
    sources: sourcesFor(key, gameId, `Cross-checked for the ${location} shiny origin.`), verifiedAt,
  };
}

function specialRoute(speciesId: number, gameId: TrackedGameId, origin: SpecialOrigin): PokemonHuntRoute {
  const key = baseKey(speciesId);
  const family = familyBySpecies.get(speciesId);
  const evolved = origin.method === 'evolution-from-hunted-shiny';
  const prerequisites: HuntRoutePrerequisite[] = origin.prerequisite ? [origin.prerequisite] : [];
  if (evolved && family?.previousId) prerequisites.push({ type: 'evolve-shiny', entityKey: baseKey(family.previousId), note: `Evolve the shiny family member into ${entityForSpecies(speciesId).displayName}.` });
  return {
    id: `${key}:${gameId}:gen4-coverage-special-origin` as HuntRouteId,
    targetEntityKey: key, gameId, method: origin.method, huntingMethodId: origin.huntingMethodId,
    access: origin.access || (evolved ? 'same-save-evolution' : 'native'), recommendation: origin.recommendation || 'eligible-native', directEncounter: origin.directEncounter || false,
    evolveFromEntityKey: evolved && family?.previousId ? baseKey(family.previousId) : undefined,
    locations: [origin.location], prerequisites, explanation: origin.explanation,
    sources: sourcesFor(key, gameId, origin.explanation), verifiedAt,
  };
}

function breedingRoute(speciesId: number, gameId: TrackedGameId): PokemonHuntRoute {
  const key = baseKey(speciesId);
  const family = familyBySpecies.get(speciesId) || { rootId: speciesId };
  const evolved = Boolean(family.previousId);
  const rootKey = baseKey(family.rootId);
  const prerequisites: HuntRoutePrerequisite[] = [{ type: 'external-parent', entityKey: rootKey, note: `Obtain or import a compatible ${entityForSpecies(family.rootId).displayName}-family parent before breeding.` }];
  const incense = incenseByBaby.get(family.rootId);
  if (incense && generationByGame[gameId] <= 8) prerequisites.push({ type: 'game-progression', note: `Use ${incense} on the compatible parent so the Egg hatches as ${entityForSpecies(family.rootId).displayName}.` });
  if (evolved) prerequisites.push({ type: 'evolve-shiny', entityKey: baseKey(family.previousId!), note: `Complete the verified evolution path to ${entityForSpecies(speciesId).displayName}.` });
  if (speciesId === 416) prerequisites.push({ type: 'game-progression', note: 'Only female Combee evolves into Vespiquen.' });
  if (speciesId === 475) prerequisites.push({ type: 'game-progression', note: 'Only male Kirlia evolves into Gallade with a Dawn Stone.' });
  if (speciesId === 478) prerequisites.push({ type: 'game-progression', note: 'Only female Snorunt evolves into Froslass with a Dawn Stone.' });
  return {
    id: `${key}:${gameId}:gen4-coverage-${evolved ? 'breeding-evolution' : 'breeding'}` as HuntRouteId,
    targetEntityKey: key, gameId, method: evolved ? 'breeding-and-evolution' : 'breeding', huntingMethodId: breedingMethod(gameId),
    access: evolved ? 'external-parent-breeding-evolution' : 'external-parent-breeding', recommendation: 'eligible-with-external-setup', directEncounter: false,
    eggResultEntityKey: rootKey, evolveFromEntityKey: evolved ? baseKey(family.previousId!) : undefined,
    locations: [breedingLocation(gameId)], prerequisites,
    explanation: evolved ? `Breed a shiny ${entityForSpecies(family.rootId).displayName}-line origin, then evolve it into ${entityForSpecies(speciesId).displayName}; no direct encounter is invented.` : `Breed a compatible parent to generate shiny ${entityForSpecies(speciesId).displayName} in ${gameId}.`,
    sources: sourcesFor(key, gameId, `Cross-checked for breeding and evolution in ${gameId}.`), verifiedAt,
  };
}

function noBreedingRoute(speciesId: number, gameId: TrackedGameId): PokemonHuntRoute {
  const key = baseKey(speciesId);
  const family = familyBySpecies.get(speciesId);
  if (family?.previousId) {
    return {
      id: `${key}:${gameId}:gen4-coverage-evolution` as HuntRouteId,
      targetEntityKey: key, gameId, method: 'evolution-from-hunted-shiny', huntingMethodId: gameId === 'za' ? 'gen9-zone-bench-soft-reset' : randomEncounterMethod(gameId),
      access: 'same-save-evolution', recommendation: 'eligible-native', directEncounter: false, evolveFromEntityKey: baseKey(family.previousId),
      locations: [gameId === 'za' ? 'Lumiose City / Hyperspace Lumiose' : 'Hisui wild family origin'], prerequisites: [{ type: 'evolve-shiny', entityKey: baseKey(family.previousId), note: `Hunt the available shiny family origin, then evolve it into ${entityForSpecies(speciesId).displayName}.` }],
      explanation: `${entityForSpecies(speciesId).displayName} uses a same-save evolution route because ${gameId} has no breeding.`, sources: sourcesFor(key, gameId, `Cross-checked for the native family origin in ${gameId}.`), verifiedAt,
    };
  }
  return {
    id: `${key}:${gameId}:gen4-coverage-direct-origin` as HuntRouteId,
    targetEntityKey: key, gameId, method: 'wild-random-encounter', huntingMethodId: gameId === 'za' ? 'gen9-zone-bench-soft-reset' : randomEncounterMethod(gameId), access: 'native', recommendation: 'eligible-native', directEncounter: true,
    locations: [gameId === 'za' ? 'Lumiose City / Hyperspace Lumiose' : 'Documented Hisui wild encounter'], prerequisites: [], explanation: `${entityForSpecies(speciesId).displayName} has a repeatable native shiny origin in ${gameId}.`, sources: sourcesFor(key, gameId, `The curated shiny-origin table includes ${gameId}.`), verifiedAt,
  };
}

function mythicalRoute(speciesId: number, gameId: TrackedGameId): PokemonHuntRoute {
  const key = baseKey(speciesId);
  if (speciesId === 489) {
    if (gameId === 'pla') return unavailableRoute(key, gameId, 'The fixed Phione encounters in Legends: Arceus are shiny locked.', 'shiny-locked');
    return breedingRoute(speciesId, gameId);
  }
  if (speciesId === 490 && ['diamond', 'pearl', 'platinum', 'heartgold', 'soulsilver'].includes(gameId)) {
    return { id: `${key}:${gameId}:gen4-coverage-ranger-egg` as HuntRouteId, targetEntityKey: key, gameId, method: 'gift-egg', huntingMethodId: 'gen4-gift-egg', access: 'external-game-feature', recommendation: 'eligible-with-external-setup', directEncounter: false, eggResultEntityKey: key, locations: ['Pokémon Ranger Manaphy Egg transfer'], prerequisites: [{ type: 'external-game-feature', note: 'Transfer a legitimate Ranger Manaphy Egg, trade it to a different Trainer ID/Secret ID save, then hatch it there; it cannot be shiny for the original receiving save.' }], explanation: 'The Generation IV Ranger Egg trade-and-hatch procedure is the only core-series shiny Manaphy origin; it is a Gift Egg route, while ordinary Manaphy gifts are shiny locked.', sources: sourcesFor(key, gameId, 'Cross-checked for the Generation IV Ranger Manaphy Egg shiny exception.'), verifiedAt };
  }
  if (speciesId === 491 && (gameId === 'platinum' || gameId === 'brilliantdiamond' || gameId === 'shiningpearl')) {
    return { id: `${key}:${gameId}:gen4-coverage-member-card` as HuntRouteId, targetEntityKey: key, gameId, method: 'static-encounter', huntingMethodId: gameId === 'platinum' ? 'gen4-soft-reset' : 'gen8-soft-reset', access: 'external-game-feature', recommendation: 'eligible-with-external-setup', directEncounter: false, locations: ['Newmoon Island'], prerequisites: [{ type: 'external-game-feature', note: 'Requires legitimate historical Member Card event access.' }], explanation: 'The Newmoon Island Darkrai is not shiny locked, but the Member Card was a limited event item.', sources: sourcesFor(key, gameId, 'Cross-checked for the Member Card Newmoon Island encounter.'), verifiedAt };
  }
  if (speciesId === 493 && (gameId === 'brilliantdiamond' || gameId === 'shiningpearl')) {
    return { id: `${key}:${gameId}:gen4-coverage-hall-of-origin` as HuntRouteId, targetEntityKey: key, gameId, method: 'static-encounter', huntingMethodId: 'gen8-soft-reset', access: 'external-game-feature', recommendation: 'eligible-with-external-setup', directEncounter: false, locations: ['Hall of Origin'], prerequisites: [{ type: 'external-game-feature', note: 'Requires Legends: Arceus save data with all main missions completed, plus the BDSP National Pokédex.' }], explanation: 'The BDSP Hall of Origin Arceus is a repeatable, non-shiny-locked static encounter; the original Generation IV Azure Flute was never legitimately distributed.', sources: sourcesFor(key, gameId, 'Cross-checked for the BDSP Hall of Origin encounter and its PLA save-data requirement.'), verifiedAt };
  }
  const shinyLockedInPla = ['pla'].includes(gameId) && [490, 491, 492, 493].includes(speciesId);
  return unavailableRoute(key, gameId, shinyLockedInPla ? `${entityForSpecies(speciesId).displayName} is obtainable in Legends: Arceus but its encounter is shiny locked.` : undefined, shinyLockedInPla ? 'shiny-locked' : 'unobtainable');
}

function buildBaseRoute(speciesId: number, gameId: TrackedGameId): PokemonHuntRoute {
  const key = baseKey(speciesId);
  const special = specialOrigins.get(`${speciesId}:${gameId}`);
  if (special) return specialRoute(speciesId, gameId, special);
  const legendaryLocation = legendaryLocations[speciesId]?.[gameId];
  if (legendaryLocation) return legendaryRoute(key, gameId, legendaryLocation);
  if (legendaryOrMythical.has(speciesId)) return mythicalRoute(speciesId, gameId);
  const item = entityForKey(key);
  const eligibleGames = new Set(getCuratedShinyOriginGameIds(speciesId, item.canonicalName) || []);
  if (!eligibleGames.has(gameId)) return unavailableRoute(key, gameId);
  if (gamesWithoutBreeding.has(gameId)) return noBreedingRoute(speciesId, gameId);
  return breedingRoute(speciesId, gameId);
}

function formRouteFromOrigin(key: PokemonEntityKey, gameId: TrackedGameId, origin: PokemonHuntRoute, note: string, changeNote: string): PokemonHuntRoute {
  if (origin.recommendation === 'not-eligible') return unavailableRoute(key, gameId, `${entityForKey(key).displayName} has no own-origin shiny route in ${gameId}; ${note}`);
  const external = origin.recommendation === 'eligible-with-external-setup';
  return {
    id: `${key}:${gameId}:gen4-coverage-form-change` as HuntRouteId, targetEntityKey: key, gameId, method: 'form-change-from-hunted-shiny', huntingMethodId: origin.huntingMethodId,
    access: external ? 'external-game-feature' : 'same-save-form-change', recommendation: origin.recommendation, directEncounter: false,
    locations: origin.locations, prerequisites: [...origin.prerequisites, { type: 'change-form', note: changeNote }], explanation: `${origin.explanation} Then ${changeNote} ${note}`, sources: sourcesFor(key, gameId, note), verifiedAt,
  };
}

function burmyOrWormadamRoute(key: PokemonEntityKey, gameId: TrackedGameId): PokemonHuntRoute {
  const item = entityForKey(key);
  const eligible = new Set(getCuratedShinyOriginGameIds(item.speciesId, entityForSpecies(item.speciesId).canonicalName) || []).has(gameId);
  if (!eligible) return unavailableRoute(key, gameId);
  const plantBurmyKey = 'pokemon:412:plant-cloak' as PokemonEntityKey;
  if (item.speciesId === 412 && item.formKey === 'plant-cloak') {
    const direct = ['diamond', 'pearl', 'platinum', 'brilliantdiamond', 'shiningpearl', 'pla'].includes(gameId);
    return { id: `${key}:${gameId}:gen4-coverage-burmy-origin` as HuntRouteId, targetEntityKey: key, gameId, method: direct ? 'wild-random-encounter' : 'breeding', huntingMethodId: direct ? (generationByGame[gameId] === 4 ? 'gen4-honey-tree' : randomEncounterMethod(gameId)) : breedingMethod(gameId), access: direct ? 'native' : 'external-parent-breeding', recommendation: direct ? 'eligible-native' : 'eligible-with-external-setup', directEncounter: direct, eggResultEntityKey: direct ? undefined : plantBurmyKey, locations: [gameId === 'pla' ? 'Shaking trees in Hisui' : direct ? 'Honey Trees' : breedingLocation(gameId)], prerequisites: direct ? [] : [{ type: 'external-parent', entityKey: plantBurmyKey, note: 'Obtain a compatible Burmy or Mothim parent first.' }], explanation: direct ? 'Hunt shiny Burmy in its Plant Cloak encounter state.' : 'Burmy Eggs hatch in Plant Cloak; hunt the shiny through breeding before changing cloak.', sources: sourcesFor(key, gameId, 'Burmy cloak behavior and origin were cross-checked.'), verifiedAt };
  }
  const plantOrigin = burmyOrWormadamRoute(plantBurmyKey, gameId);
  if (item.speciesId === 412) return formRouteFromOrigin(key, gameId, plantOrigin, 'Burmy changes cloak after battling in the matching environment; this is not a new shiny roll.', `Battle with shiny Burmy in the environment that produces the ${item.formKey.replace('-cloak', '')} cloak.`);
  const cloakKey = `pokemon:412:${item.formKey}` as PokemonEntityKey;
  const cloakOrigin = item.formKey === 'plant-cloak' ? plantOrigin : burmyOrWormadamRoute(cloakKey, gameId);
  if (cloakOrigin.recommendation === 'not-eligible') return unavailableRoute(key, gameId);
  return { id: `${key}:${gameId}:gen4-coverage-wormadam-evolution` as HuntRouteId, targetEntityKey: key, gameId, method: 'evolution-from-hunted-shiny', huntingMethodId: cloakOrigin.huntingMethodId, access: cloakOrigin.recommendation === 'eligible-native' ? 'same-save-evolution' : 'external-game-feature', recommendation: cloakOrigin.recommendation, directEncounter: false, evolveFromEntityKey: cloakKey, locations: cloakOrigin.locations, prerequisites: [...cloakOrigin.prerequisites, { type: 'evolve-shiny', entityKey: cloakKey, note: `Use a female shiny Burmy in ${item.formKey.replace('-cloak', '')} cloak and evolve it; Wormadam's cloak is then permanent.` }], explanation: `Evolve a female shiny ${entityForKey(cloakKey).displayName}; Wormadam retains that cloak permanently.`, sources: sourcesFor(key, gameId, 'Burmy cloak inheritance on evolution into Wormadam was cross-checked.'), verifiedAt };
}

function shellosRoute(key: PokemonEntityKey, gameId: TrackedGameId): PokemonHuntRoute {
  const item = entityForKey(key);
  const eligible = new Set(getCuratedShinyOriginGameIds(item.speciesId, entityForSpecies(item.speciesId).canonicalName) || []).has(gameId);
  if (!eligible) return unavailableRoute(key, gameId);
  const shellosKey = `pokemon:422:${item.formKey}` as PokemonEntityKey;
  const directGames = new Set<TrackedGameId>(['diamond', 'pearl', 'platinum', 'brilliantdiamond', 'shiningpearl', 'pla', 'scarlet', 'violet']);
  if (item.speciesId === 422) {
    const direct = directGames.has(gameId);
    return { id: `${key}:${gameId}:gen4-coverage-shellos-origin` as HuntRouteId, targetEntityKey: key, gameId, method: direct ? 'wild-random-encounter' : 'breeding', huntingMethodId: direct ? randomEncounterMethod(gameId) : breedingMethod(gameId), access: direct ? 'native' : 'external-parent-breeding', recommendation: direct ? 'eligible-native' : 'eligible-with-external-setup', directEncounter: direct, eggResultEntityKey: direct ? undefined : key, locations: [direct ? `${item.displayName} documented regional habitat` : breedingLocation(gameId)], prerequisites: direct ? [] : [{ type: 'external-parent', entityKey: key, note: `Use a parent of the same ${item.formKey.replace('-sea', '')} Sea form; Shellos form is inherited rather than randomized.` }], explanation: direct ? `${item.displayName} is hunted in its own fixed regional form.` : `Breed the matching ${item.displayName} parent; East and West Sea forms are not interchangeable hunt results.`, sources: sourcesFor(key, gameId, 'Shellos regional form inheritance and locations were cross-checked.'), verifiedAt };
  }
  const origin = shellosRoute(shellosKey, gameId);
  if (origin.recommendation === 'not-eligible') return unavailableRoute(key, gameId);
  return { id: `${key}:${gameId}:gen4-coverage-gastrodon-evolution` as HuntRouteId, targetEntityKey: key, gameId, method: 'evolution-from-hunted-shiny', huntingMethodId: origin.huntingMethodId, access: origin.recommendation === 'eligible-native' ? 'same-save-evolution' : 'external-game-feature', recommendation: origin.recommendation, directEncounter: false, evolveFromEntityKey: shellosKey, locations: origin.locations, prerequisites: [...origin.prerequisites, { type: 'evolve-shiny', entityKey: shellosKey, note: `Evolve the matching ${entityForKey(shellosKey).displayName}; its sea form is retained.` }], explanation: `Evolve shiny ${entityForKey(shellosKey).displayName}; East and West Sea Gastrodon remain separate form decisions.`, sources: sourcesFor(key, gameId, 'Gastrodon retains the Shellos sea form on evolution.'), verifiedAt };
}

function rotomFormRoute(key: PokemonEntityKey, gameId: TrackedGameId): PokemonHuntRoute {
  if (['diamond', 'pearl'].includes(gameId)) return unavailableRoute(key, gameId, `${entityForKey(key).displayName} is not available in original Diamond/Pearl; appliance forms became usable starting in Platinum.`);
  const origin = buildBaseRoute(479, gameId);
  const location = gameId === 'platinum' ? 'Rotom’s Room — Eterna Galactic Building (Secret Key)' : ['heartgold', 'soulsilver'].includes(gameId) ? 'Rotom’s Room — Silph Co.' : ['brilliantdiamond', 'shiningpearl'].includes(gameId) ? 'Rotom’s Room / Rotom Catalog' : gameId === 'pla' ? 'Jubilife Village quarters — mechanical appliance' : gameId === 'za' ? 'Rotom Catalog from Side Mission 170' : 'Rotom Catalog / documented appliance room';
  return formRouteFromOrigin(key, gameId, origin, `${entityForKey(key).displayName} is the same shiny Rotom after possessing an appliance.`, `Use ${location} to select ${entityForKey(key).displayName}.`);
}

function alteredLegendaryFormRoute(key: PokemonEntityKey, gameId: TrackedGameId): PokemonHuntRoute {
  const speciesId = entityForKey(key).speciesId;
  const location = legendaryLocations[speciesId]?.[gameId];
  if (location) return legendaryRoute(key, gameId, location);
  if (speciesId === 487 && gameId === 'platinum') {
    const originKey = 'pokemon:487:origin' as PokemonEntityKey;
    const origin = giratinaOriginRoute(originKey, gameId);
    return formRouteFromOrigin(key, gameId, origin, 'Altered Forme is obtained by removing the Griseous Orb outside the Distortion World.', 'Move the shiny Giratina outside the Distortion World without the Griseous Orb to select Altered Forme.');
  }
  if (gameId === 'pla') return unavailableRoute(key, gameId, `${entityForKey(key).displayName} is obtainable in Legends: Arceus, but the fixed legendary encounter is shiny locked.`, 'shiny-locked');
  if ((speciesId === 483 || speciesId === 484) && gameId === 'scarlet' || gameId === 'violet') return unavailableRoute(key, gameId, `${entityForKey(key).displayName} can be owned through transfer in ${gameId}, but has no own-origin shiny hunt there.`, 'transfer-only');
  return unavailableRoute(key, gameId);
}

function originDialgaPalkiaRoute(key: PokemonEntityKey, gameId: TrackedGameId): PokemonHuntRoute {
  if (gameId === 'pla' || gameId === 'scarlet' || gameId === 'violet') return unavailableRoute(key, gameId, `${entityForKey(key).displayName} can be obtained by transferring a legitimate shiny Altered Forme and using the Adamant/Lustrous Crystal or Globe; the local legendary encounter is not a shiny origin.`, 'transfer-only');
  return unavailableRoute(key, gameId, `${entityForKey(key).displayName} did not exist before Legends: Arceus or is unsupported in this game.`);
}

function giratinaOriginRoute(key: PokemonEntityKey, gameId: TrackedGameId): PokemonHuntRoute {
  if (gameId === 'platinum') return { id: `${key}:${gameId}:gen4-coverage-distortion-world` as HuntRouteId, targetEntityKey: key, gameId, method: 'static-encounter', huntingMethodId: 'gen4-soft-reset', access: 'native', recommendation: 'eligible-native', directEncounter: false, locations: ['Distortion World'], prerequisites: [], explanation: 'Giratina is encountered directly in Origin Forme in the Distortion World and is not shiny locked.', sources: sourcesFor(key, gameId, 'Cross-checked for the Platinum Distortion World Origin Forme encounter.'), verifiedAt };
  const alteredKey = 'pokemon:487:altered' as PokemonEntityKey;
  const altered = alteredLegendaryFormRoute(alteredKey, gameId);
  if (altered.recommendation !== 'not-eligible') return formRouteFromOrigin(key, gameId, altered, 'Origin Forme uses the same caught shiny Giratina, not a separate shiny roll.', 'Give the shiny Giratina the Griseous Orb/Core to select Origin Forme.');
  if (gameId === 'pla' || gameId === 'scarlet' || gameId === 'violet') return unavailableRoute(key, gameId, 'A legitimate shiny Giratina may be transferred and changed with the Griseous Core/Orb, but this game has no own-origin shiny Giratina hunt.', 'transfer-only');
  return unavailableRoute(key, gameId);
}

function shayminRoute(key: PokemonEntityKey, gameId: TrackedGameId): PokemonHuntRoute {
  const landKey = 'pokemon:492:land' as PokemonEntityKey;
  if (key === landKey) {
    if (gameId === 'platinum' || gameId === 'brilliantdiamond' || gameId === 'shiningpearl') return { id: `${key}:${gameId}:gen4-coverage-oaks-letter` as HuntRouteId, targetEntityKey: key, gameId, method: 'static-encounter', huntingMethodId: gameId === 'platinum' ? 'gen4-runaway' : 'gen8-soft-reset', access: 'external-game-feature', recommendation: 'eligible-with-external-setup', directEncounter: false, locations: ['Flower Paradise'], prerequisites: [{ type: 'external-game-feature', note: 'Requires legitimate historical Oak’s Letter event access.' }], explanation: gameId === 'platinum' ? 'Shaymin can be shiny at Flower Paradise; Runaway and re-entering refreshes the encounter without treating the event item itself as permanent availability.' : 'The BDSP Flower Paradise Shaymin is not shiny locked, but Oak’s Letter was a limited-time event item.', sources: sourcesFor(key, gameId, 'Cross-checked for Oak’s Letter and the Flower Paradise shiny encounter.'), verifiedAt };
    if (gameId === 'pla') return unavailableRoute(key, gameId, 'The save-data bonus Shaymin encounter in Legends: Arceus is shiny locked.', 'shiny-locked');
    return unavailableRoute(key, gameId);
  }
  const land = shayminRoute(landKey, gameId);
  return formRouteFromOrigin(key, gameId, land, 'Sky Forme is a reversible Gracidea transformation of the same shiny Shaymin.', 'Use the Gracidea on shiny Land Forme Shaymin during the permitted daytime conditions.');
}

function arceusTypeRoute(key: PokemonEntityKey, gameId: TrackedGameId): PokemonHuntRoute {
  if (gameId === 'brilliantdiamond' || gameId === 'shiningpearl') {
    const normal = mythicalRoute(493, gameId);
    return formRouteFromOrigin(key, gameId, normal, 'Arceus’s type form is a held-Plate transformation of the same shiny Arceus.', `Give shiny Arceus the ${entityForKey(key).formKey.replace('arceus-', '')}-type Plate.`);
  }
  const introduced = entityForKey(key).formKey === 'arceus-fairy' ? 6 : 4;
  if (generationByGame[gameId] >= introduced && ['diamond', 'pearl', 'platinum', 'heartgold', 'soulsilver', 'black', 'white', 'black2', 'white2', 'x', 'y', 'omegaruby', 'alphasapphire', 'sun', 'moon', 'ultrasun', 'ultramoon', 'pla', 'scarlet', 'violet'].includes(gameId)) {
    return unavailableRoute(key, gameId, `${entityForKey(key).displayName} can be owned by transferring a legitimate shiny Arceus and applying the matching Plate, but ${gameId} has no own-origin shiny Arceus hunt.`, 'transfer-only');
  }
  return unavailableRoute(key, gameId, `${entityForKey(key).displayName} is unsupported in ${gameId}.`);
}

function buildFormRoute(key: PokemonEntityKey, gameId: TrackedGameId): PokemonHuntRoute {
  const item = entityForKey(key);
  if (item.speciesId === 412 || item.speciesId === 413) return burmyOrWormadamRoute(key, gameId);
  if (item.speciesId === 422 || item.speciesId === 423) return shellosRoute(key, gameId);
  if (item.speciesId === 479) return rotomFormRoute(key, gameId);
  if (item.speciesId === 483 || item.speciesId === 484) return item.formKey === 'altered' ? alteredLegendaryFormRoute(key, gameId) : originDialgaPalkiaRoute(key, gameId);
  if (item.speciesId === 487) return item.formKey === 'altered' ? alteredLegendaryFormRoute(key, gameId) : giratinaOriginRoute(key, gameId);
  if (item.speciesId === 492) return shayminRoute(key, gameId);
  if (item.speciesId === 493) return arceusTypeRoute(key, gameId);
  throw new Error(`Unhandled Generation IV form ${key}`);
}

export const GEN4_HUNT_COVERAGE_ROUTES: PokemonHuntRoute[] = [];
for (let speciesId = FIRST_SPECIES; speciesId <= LAST_SPECIES; speciesId += 1) {
  if (formOnlySpecies.has(speciesId)) continue;
  for (const gameId of TRACKED_GAME_IDS) GEN4_HUNT_COVERAGE_ROUTES.push(buildBaseRoute(speciesId, gameId));
}

const gen4FormEntities = POKEMON_CATALOG_V2.filter((item) => item.speciesId >= FIRST_SPECIES && item.speciesId <= LAST_SPECIES && item.formKey !== 'base');
for (const form of gen4FormEntities) {
  for (const gameId of TRACKED_GAME_IDS) GEN4_HUNT_COVERAGE_ROUTES.push(buildFormRoute(form.key, gameId));
}
