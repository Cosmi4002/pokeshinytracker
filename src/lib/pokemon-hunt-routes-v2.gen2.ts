import type { PokemonEntityKey } from './pokemon-catalog-v2';
import { POKEMON_CATALOG_V2_BY_KEY } from './pokemon-catalog-v2.registry';
import {
  getCuratedShinyOriginGameIds,
  TRACKED_GAME_IDS,
  type TrackedGameId,
} from './pokemon-game-availability';
import type {
  HuntRouteId,
  HuntRoutePrerequisite,
  HuntRouteSource,
  PokemonHuntRoute,
} from './pokemon-hunt-routes-v2';

/** Conservative game-by-game decision matrix for National Dex #152-251. */
const verifiedAt = '2026-08-21';
const FIRST_SPECIES = 152;
const LAST_SPECIES = 251;

const generationByGame: Record<TrackedGameId, 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9> = {
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
const noEggSpecies = new Set([201, 243, 244, 245, 249, 250, 251]);

const familyChains: number[][] = [
  [152, 153, 154], [155, 156, 157], [158, 159, 160], [161, 162], [163, 164],
  [165, 166], [167, 168], [41, 42, 169], [170, 171], [172], [173], [174],
  [175, 176], [177, 178], [179, 180, 181], [43, 44, 182], [183, 184],
  [185], [60, 61, 186], [187, 188, 189], [190], [191, 192], [193],
  [194, 195], [133, 196], [133, 197], [198], [79, 199], [200], [202],
  [203], [204, 205], [206], [207], [95, 208], [209, 210], [211], [123, 212],
  [213], [214], [215], [216, 217], [218, 219], [220, 221], [222], [223, 224],
  [225], [226], [227], [228, 229], [116, 117, 230], [231, 232], [137, 233],
  [234], [235], [236], [236, 237], [238], [239], [240], [241], [113, 242],
  [246, 247, 248],
];

interface FamilyPosition {
  rootId: number;
  previousId?: number;
}

const familyBySpecies = new Map<number, FamilyPosition>();
for (const chain of familyChains) {
  for (let index = 0; index < chain.length; index += 1) {
    const speciesId = chain[index];
    const existing = familyBySpecies.get(speciesId);
    if (!existing || speciesId !== chain[0]) {
      familyBySpecies.set(speciesId, {
        rootId: chain[0],
        previousId: index > 0 ? chain[index - 1] : undefined,
      });
    }
  }
}

const breedableParentByBaby = new Map<number, number>([
  [172, 25], [173, 35], [174, 39], [175, 176],
  [236, 106], [238, 124], [239, 125], [240, 126],
]);

function entityKey(speciesId: number): PokemonEntityKey {
  return `pokemon:${speciesId}:base` as PokemonEntityKey;
}

function entityName(speciesId: number): string {
  const entity = POKEMON_CATALOG_V2_BY_KEY.get(entityKey(speciesId));
  if (!entity) throw new Error(`Missing catalog entity for National Dex #${speciesId}`);
  return entity.displayName || entity.canonicalName;
}

function canonicalName(speciesId: number): string {
  return POKEMON_CATALOG_V2_BY_KEY.get(entityKey(speciesId))?.canonicalName || String(speciesId);
}

function bulbapediaName(speciesId: number): string {
  const special: Record<number, string> = { 250: 'Ho-Oh' };
  const raw = special[speciesId] || entityName(speciesId)
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('_');
  return encodeURIComponent(raw);
}

function pokemonCentralUrl(speciesId: number): string {
  return `https://wiki.pokemoncentral.it/${encodeURIComponent(entityName(speciesId).replace(/ /gu, '_'))}`;
}

function sourcesFor(speciesId: number, note: string): HuntRouteSource[] {
  const name = entityName(speciesId);
  return [
    {
      provider: 'Serebii',
      url: `https://www.serebii.net/pokemon/${canonicalName(speciesId)}/`,
      note: `Serebii's ${name} Pokédex page cross-checks game locations and evolution data. ${note}`,
    },
    {
      provider: 'Bulbapedia',
      url: `https://bulbapedia.bulbagarden.net/wiki/${bulbapediaName(speciesId)}_(Pok%C3%A9mon)`,
      note: `Bulbapedia cross-checks ${name}'s game availability, Egg Group and evolution data. ${note}`,
    },
    {
      provider: 'Pokémon Central Wiki',
      url: pokemonCentralUrl(speciesId),
      note: `Pokémon Central Wiki cross-checks ${name}'s Italian game-location table for Oro, Argento and Cristallo. ${note}`,
    },
  ];
}

function breedingMethod(gameId: TrackedGameId): string {
  return `gen${generationByGame[gameId]}-egg-hatching`;
}

function encounterMethod(gameId: TrackedGameId): string {
  if (gameId === 'lgp' || gameId === 'lge') return 'gen7-lgpe-random';
  if (gameId === 'pla') return 'pla-random';
  if (gameId === 'za') return 'gen9-zone-bench-soft-reset';
  return `gen${generationByGame[gameId]}-random`;
}

function breedingLocation(gameId: TrackedGameId): string {
  const locations: Partial<Record<TrackedGameId, string>> = {
    gold: 'Route 34 Day Care', silver: 'Route 34 Day Care', crystal: 'Route 34 Day Care',
    ruby: 'Route 117 Day Care', sapphire: 'Route 117 Day Care', emerald: 'Route 117 Day Care',
    firered: 'Four Island Day Care', leafgreen: 'Four Island Day Care',
    diamond: 'Solaceon Town Day Care', pearl: 'Solaceon Town Day Care', platinum: 'Solaceon Town Day Care',
    heartgold: 'Route 34 Day Care', soulsilver: 'Route 34 Day Care',
    black: 'Route 3 Day Care', white: 'Route 3 Day Care', black2: 'Route 3 Day Care', white2: 'Route 3 Day Care',
    x: 'Route 7 Day Care', y: 'Route 7 Day Care', omegaruby: 'Route 117 Day Care', alphasapphire: 'Route 117 Day Care',
    sun: 'Paniola Ranch Pokémon Nursery', moon: 'Paniola Ranch Pokémon Nursery',
    ultrasun: 'Paniola Ranch Pokémon Nursery', ultramoon: 'Paniola Ranch Pokémon Nursery',
    sword: 'Route 5 Pokémon Nursery', shield: 'Route 5 Pokémon Nursery',
    brilliantdiamond: 'Solaceon Town Pokémon Nursery', shiningpearl: 'Solaceon Town Pokémon Nursery',
    scarlet: 'Picnic — Egg breeding', violet: 'Picnic — Egg breeding',
  };
  const location = locations[gameId];
  if (!location) throw new Error(`Missing breeding location for ${gameId}`);
  return location;
}

interface SpecialOrigin {
  location: string;
  huntingMethodId: string;
  method: PokemonHuntRoute['method'];
  directEncounter?: boolean;
  access?: 'native' | 'external-game-feature';
  prerequisite?: string;
  explanation: string;
}

const specialOrigins = new Map<string, SpecialOrigin>();

function addSpecial(speciesId: number, gameIds: readonly TrackedGameId[], origin: SpecialOrigin) {
  for (const gameId of gameIds) specialOrigins.set(`${speciesId}:${gameId}`, origin);
}

// Johto starters: native soft-reset choices in G/S/C and HG/SS.
for (const [baseId, middleId, finalId] of [[152, 153, 154], [155, 156, 157], [158, 159, 160]] as const) {
  for (const gameId of ['gold', 'silver', 'crystal', 'heartgold', 'soulsilver'] as const) {
    const generation = generationByGame[gameId];
    addSpecial(baseId, [gameId], {
      location: 'New Bark Town — starter choice', huntingMethodId: `gen${generation}-soft-reset`, method: 'soft-reset-gift',
      explanation: `${entityName(baseId)} is a native Johto starter choice hunted by soft resetting before selection.`,
    });
    addSpecial(middleId, [gameId], {
      location: 'New Bark Town — starter choice', huntingMethodId: `gen${generation}-soft-reset`, method: 'evolution-from-hunted-shiny',
      explanation: `${entityName(middleId)} is obtained by evolving the shiny ${entityName(baseId)} starter in the same save.`,
    });
    addSpecial(finalId, [gameId], {
      location: 'New Bark Town — starter choice', huntingMethodId: `gen${generation}-soft-reset`, method: 'evolution-from-hunted-shiny',
      explanation: `${entityName(finalId)} is obtained by completing the shiny ${entityName(baseId)} starter evolution line.`,
    });
  }
}

// Smeargle is encountered natively outside the Ruins of Alph in every Generation II
// version. A breeding hunt can therefore be prepared entirely within the same save;
// it must never be described as requiring an imported family parent.
for (const gameId of ['gold', 'silver', 'crystal'] as const) {
  addSpecial(235, [gameId], {
    location: 'Route 34 Day Care',
    huntingMethodId: 'gen2-egg-hatching',
    method: 'breeding',
    prerequisite: 'Catch compatible Smeargle parent(s) natively outside the Ruins of Alph, then leave them at the Route 34 Day Care; no transfer or trade is required.',
    explanation: `Smeargle is native outside the Ruins of Alph in ${gameId}, so its breeding hunt uses locally caught parents without external setup.`,
  });
}

// Legendary beasts in Generation II.
for (const speciesId of [243, 244, 245]) {
  addSpecial(speciesId, ['gold', 'silver'], { location: 'Roaming Johto', huntingMethodId: 'gen2-roaming', method: 'roaming-encounter', directEncounter: true, explanation: `${entityName(speciesId)} roams Johto in Gold and Silver.` });
}
for (const speciesId of [243, 244]) {
  addSpecial(speciesId, ['crystal'], { location: 'Roaming Johto', huntingMethodId: 'gen2-roaming', method: 'roaming-encounter', directEncounter: true, explanation: `${entityName(speciesId)} roams Johto in Crystal.` });
}
addSpecial(245, ['crystal'], { location: 'Tin Tower', huntingMethodId: 'gen2-soft-reset', method: 'static-encounter', explanation: 'Suicune is the fixed Tin Tower battle in Crystal and is hunted by soft resetting.' });

// FireRed/LeafGreen roaming beast depends on the chosen Kanto starter.
for (const [speciesId, starter] of [[243, 'Squirtle'], [244, 'Bulbasaur'], [245, 'Charmander']] as const) {
  addSpecial(speciesId, ['firered', 'leafgreen'], { location: 'Roaming Kanto after the Elite Four', huntingMethodId: 'gen3-roaming', method: 'roaming-encounter', directEncounter: true, prerequisite: `Choose ${starter} as the starter and complete the required postgame progression.`, explanation: `${entityName(speciesId)} is the roaming beast unlocked after choosing ${starter}.` });
}
for (const speciesId of [243, 244]) {
  addSpecial(speciesId, ['heartgold', 'soulsilver'], { location: 'Roaming Johto', huntingMethodId: 'gen4-roaming', method: 'roaming-encounter', directEncounter: true, explanation: `${entityName(speciesId)} is a roaming encounter in HeartGold and SoulSilver.` });
}
addSpecial(245, ['heartgold', 'soulsilver'], { location: 'Route 25', huntingMethodId: 'gen4-soft-reset', method: 'static-encounter', explanation: 'Suicune is a stationary Route 25 encounter after completing its roaming story sequence.' });
for (const speciesId of [243, 244, 245]) {
  addSpecial(speciesId, ['omegaruby', 'alphasapphire'], { location: 'Trackless Forest', huntingMethodId: 'gen6-soft-reset', method: 'static-encounter', prerequisite: 'Make Trackless Forest appear with Ho-Oh or Lugia in the party and enter during the species-specific time window.', explanation: `${entityName(speciesId)} is a Trackless Forest dimensional-ring encounter hunted by soft resetting.` });
  addSpecial(speciesId, ['sword', 'shield'], { location: 'Max Lair — Dynamax Adventures', huntingMethodId: 'gen8-dynamax', method: 'static-encounter', explanation: `${entityName(speciesId)} can originate shiny from Dynamax Adventures.` });
  addSpecial(speciesId, ['brilliantdiamond'], { location: 'Ramanas Park — Johto Room', huntingMethodId: 'gen8-soft-reset', method: 'static-encounter', explanation: `${entityName(speciesId)} is a Brilliant Diamond Ramanas Park encounter hunted by soft resetting.` });
}
addSpecial(243, ['ultrasun'], { location: 'Ultra Space Wilds', huntingMethodId: 'gen7-soft-reset', method: 'static-encounter', explanation: 'Raikou is an Ultra Sun Ultra Space legendary hunted by soft resetting.' });
addSpecial(244, ['ultramoon'], { location: 'Ultra Space Wilds', huntingMethodId: 'gen7-soft-reset', method: 'static-encounter', explanation: 'Entei is an Ultra Moon Ultra Space legendary hunted by soft resetting.' });
addSpecial(245, ['ultrasun', 'ultramoon'], { location: 'Ultra Space Wilds', huntingMethodId: 'gen7-soft-reset', method: 'static-encounter', prerequisite: 'Have both Raikou and Entei in the party to make Suicune available.', explanation: 'Suicune is an Ultra Space legendary hunted by soft resetting.' });

// Lugia and Ho-Oh.
for (const gameId of ['gold', 'silver', 'crystal'] as const) {
  addSpecial(249, [gameId], { location: 'Whirl Islands', huntingMethodId: 'gen2-soft-reset', method: 'static-encounter', explanation: `Lugia is the fixed Whirl Islands encounter in ${gameId}.` });
  addSpecial(250, [gameId], { location: 'Tin Tower', huntingMethodId: 'gen2-soft-reset', method: 'static-encounter', explanation: `Ho-Oh is the fixed Tin Tower encounter in ${gameId}.` });
}
for (const speciesId of [249, 250]) {
  addSpecial(speciesId, ['firered', 'leafgreen'], { location: 'Navel Rock', huntingMethodId: 'gen3-soft-reset', method: 'static-encounter', access: 'external-game-feature', prerequisite: 'Requires legitimate access to Navel Rock through the historical MysticTicket event.', explanation: `${entityName(speciesId)} is a Navel Rock static encounter hunted by soft resetting.` });
  addSpecial(speciesId, ['emerald'], { location: 'Navel Rock', huntingMethodId: 'gen3-runaway', method: 'static-encounter', access: 'external-game-feature', prerequisite: 'Requires legitimate access to Navel Rock through the historical MysticTicket event.', explanation: `${entityName(speciesId)} uses Runaway in Emerald: flee, leave the room and re-enter without repeatedly restarting the fixed-seed game.` });
  addSpecial(speciesId, ['sword', 'shield'], { location: 'Max Lair — Dynamax Adventures', huntingMethodId: 'gen8-dynamax', method: 'static-encounter', explanation: `${entityName(speciesId)} can originate shiny from Dynamax Adventures.` });
}
addSpecial(249, ['heartgold', 'soulsilver'], { location: 'Whirl Islands', huntingMethodId: 'gen4-soft-reset', method: 'static-encounter', explanation: 'Lugia is the fixed Whirl Islands encounter hunted by soft resetting.' });
addSpecial(250, ['heartgold', 'soulsilver'], { location: 'Bell Tower', huntingMethodId: 'gen4-soft-reset', method: 'static-encounter', explanation: 'Ho-Oh is the fixed Bell Tower encounter hunted by soft resetting.' });
addSpecial(249, ['alphasapphire'], { location: 'Sea Mauville', huntingMethodId: 'gen6-soft-reset', method: 'static-encounter', explanation: 'Lugia is the Alpha Sapphire Sea Mauville dimensional-ring encounter.' });
addSpecial(250, ['omegaruby'], { location: 'Sea Mauville', huntingMethodId: 'gen6-soft-reset', method: 'static-encounter', explanation: 'Ho-Oh is the Omega Ruby Sea Mauville dimensional-ring encounter.' });
addSpecial(249, ['ultramoon'], { location: 'Ultra Space Wilds', huntingMethodId: 'gen7-soft-reset', method: 'static-encounter', explanation: 'Lugia is an Ultra Moon Ultra Space legendary hunted by soft resetting.' });
addSpecial(250, ['ultrasun'], { location: 'Ultra Space Wilds', huntingMethodId: 'gen7-soft-reset', method: 'static-encounter', explanation: 'Ho-Oh is an Ultra Sun Ultra Space legendary hunted by soft resetting.' });
addSpecial(249, ['shiningpearl'], { location: 'Ramanas Park — Squall Room', huntingMethodId: 'gen8-soft-reset', method: 'static-encounter', explanation: 'Lugia is a Shining Pearl Ramanas Park encounter hunted by soft resetting.' });
addSpecial(250, ['brilliantdiamond'], { location: 'Ramanas Park — Rainbow Room', huntingMethodId: 'gen8-soft-reset', method: 'static-encounter', explanation: 'Ho-Oh is a Brilliant Diamond Ramanas Park encounter hunted by soft resetting.' });

// Celebi's only own-OT shiny origin represented by the console-game matrix.
addSpecial(251, ['crystal'], { location: 'Ilex Forest shrine', huntingMethodId: 'gen2-soft-reset', method: 'static-encounter', access: 'external-game-feature', prerequisite: 'Use the Crystal Virtual Console GS Ball sequence (or legitimate original Japanese event access) to unlock the shrine encounter.', explanation: 'Celebi is hunted by soft resetting the Ilex Forest shrine encounter; Gold and Silver distributions are not own-OT hunts.' });

const unownLocations: Partial<Record<TrackedGameId, string>> = {
  gold: 'Ruins of Alph', silver: 'Ruins of Alph', crystal: 'Ruins of Alph',
  firered: 'Tanoby Chambers', leafgreen: 'Tanoby Chambers',
  diamond: 'Solaceon Ruins', pearl: 'Solaceon Ruins', platinum: 'Solaceon Ruins',
  heartgold: 'Ruins of Alph', soulsilver: 'Ruins of Alph',
  omegaruby: 'Mirage Caves', alphasapphire: 'Mirage Caves',
  brilliantdiamond: 'Solaceon Ruins', shiningpearl: 'Solaceon Ruins', pla: 'Solaceon Ruins',
};

function unavailableRoute(speciesId: number, gameId: TrackedGameId): PokemonHuntRoute {
  const key = entityKey(speciesId);
  return {
    id: `${key}:${gameId}:gen2-coverage-unobtainable` as HuntRouteId,
    targetEntityKey: key, gameId, method: 'unavailable', huntingMethodId: 'custom', access: 'unobtainable', recommendation: 'not-eligible', directEncounter: false,
    locations: [], prerequisites: [], explanation: `${entityName(speciesId)} cannot originate as a shiny in ${gameId}; transfer-only ownership is excluded from the randomizer.`,
    sources: sourcesFor(speciesId, `The curated shiny-origin table excludes ${gameId}.`), verifiedAt,
  };
}

function specialRoute(speciesId: number, gameId: TrackedGameId, origin: SpecialOrigin): PokemonHuntRoute {
  const key = entityKey(speciesId);
  const family = familyBySpecies.get(speciesId);
  const evolved = origin.method === 'evolution-from-hunted-shiny';
  const external = origin.access === 'external-game-feature';
  const prerequisites: HuntRoutePrerequisite[] = [];
  if ([152, 155, 158].includes(speciesId) && origin.location.includes('starter')) {
    prerequisites.push({ type: 'starter-choice', entityKey: key, note: `Choose ${entityName(speciesId)} as the Johto starter.` });
  }
  if (evolved && family?.previousId) {
    prerequisites.push({ type: 'evolve-shiny', entityKey: entityKey(family.previousId), note: `Evolve the shiny family member into ${entityName(speciesId)}.` });
  }
  if (origin.prerequisite) {
    prerequisites.push({ type: external ? 'external-game-feature' : 'game-progression', note: origin.prerequisite });
  }
  const sources = sourcesFor(speciesId, origin.explanation);
  if (speciesId === 251) {
    sources[0] = { provider: 'Serebii', url: 'https://www.serebii.net/pokedex-gs/251.shtml', note: 'Serebii lists Celebi at Ilex Forest in Crystal and only as event distributions in Gold/Silver.' };
  }
  return {
    id: `${key}:${gameId}:gen2-coverage-special-origin` as HuntRouteId,
    targetEntityKey: key, gameId, method: origin.method, huntingMethodId: origin.huntingMethodId,
    access: external ? 'external-game-feature' : evolved ? 'same-save-evolution' : 'native',
    recommendation: external ? 'eligible-with-external-setup' : 'eligible-native', directEncounter: origin.directEncounter || false,
    evolveFromEntityKey: evolved ? entityKey(family!.previousId!) : undefined,
    locations: [origin.location], prerequisites, explanation: origin.explanation, sources, verifiedAt,
  };
}

function unownRoute(gameId: TrackedGameId): PokemonHuntRoute {
  const speciesId = 201;
  if (generationByGame[gameId] === 2) {
    return {
      id: `pokemon:201:base:${gameId}:gen2-coverage-shiny-locked-form-a`,
      targetEntityKey: 'pokemon:201:base', gameId, method: 'unavailable', huntingMethodId: 'custom',
      access: 'shiny-locked', recommendation: 'not-eligible', directEncounter: false,
      locations: ['Ruins of Alph'], prerequisites: [],
      explanation: 'This catalog entry is Unown A. In Generation II, Unown form and shininess both depend on DVs; only forms I and V can have shiny-compatible DVs, so form A is impossible as shiny.',
      sources: [
        { provider: 'Serebii', url: 'https://www.serebii.net/pokedex-gs/201.shtml', note: 'Generation II Unown encounter and Pokédex reference.' },
        { provider: 'Bulbapedia', url: 'https://bulbapedia.bulbagarden.net/wiki/Unown_(Pok%C3%A9mon)', note: 'Documents the Generation II DV relationship that limits shiny Unown to forms I and V.' },
      ],
      verifiedAt,
    };
  }
  const prerequisites: HuntRoutePrerequisite[] = gameId === 'pla'
    ? [{ type: 'game-progression', note: 'Find all 28 fixed, shiny-locked Unown first; repeatable Unown then spawn in Solaceon Ruins and can be shiny.' }]
    : [];
  return {
    id: `pokemon:201:base:${gameId}:gen2-coverage-direct-origin`, targetEntityKey: 'pokemon:201:base', gameId,
    method: 'wild-random-encounter', huntingMethodId: encounterMethod(gameId), access: 'native', recommendation: 'eligible-native', directEncounter: true,
    locations: [unownLocations[gameId] || 'Documented Unown ruins encounter'], prerequisites,
    explanation: gameId === 'pla' ? 'Only the repeatable Solaceon Ruins Unown unlocked after collecting all forms can be shiny; the 28 fixed overworld Unown are shiny locked.' : `Unown is a native ruins encounter in ${gameId}.`,
    sources: sourcesFor(speciesId, `The curated shiny-origin table includes ${gameId}.`), verifiedAt,
  };
}

function noBreedingGameRoute(speciesId: number, gameId: TrackedGameId): PokemonHuntRoute {
  const key = entityKey(speciesId);
  const family = familyBySpecies.get(speciesId);
  const rootAvailable = family?.previousId
    ? getCuratedShinyOriginGameIds(family.rootId, canonicalName(family.rootId))?.includes(gameId)
    : false;
  if (family?.previousId && rootAvailable) {
    return {
      id: `${key}:${gameId}:gen2-coverage-evolution` as HuntRouteId, targetEntityKey: key, gameId,
      method: 'evolution-from-hunted-shiny', huntingMethodId: encounterMethod(gameId), access: 'same-save-evolution', recommendation: 'eligible-native', directEncounter: false,
      evolveFromEntityKey: entityKey(family.previousId), locations: [gameId === 'za' ? 'Lumiose City hunt origin' : 'Documented in-game family encounter'],
      prerequisites: [{ type: 'evolve-shiny', entityKey: entityKey(family.previousId), note: `Hunt the available ${entityName(family.rootId)} family origin, then evolve it into ${entityName(speciesId)}.` }],
      explanation: `${entityName(speciesId)} uses a same-save evolution route in ${gameId}; breeding is not invented for this game.`,
      sources: sourcesFor(speciesId, `The family has an in-game shiny origin in ${gameId}.`), verifiedAt,
    };
  }
  return {
    id: `${key}:${gameId}:gen2-coverage-direct-origin` as HuntRouteId, targetEntityKey: key, gameId,
    method: 'wild-random-encounter', huntingMethodId: encounterMethod(gameId), access: 'native', recommendation: 'eligible-native', directEncounter: true,
    locations: [gameId === 'za' ? 'Lumiose City hunt origin' : 'Documented in-game encounter'], prerequisites: [],
    explanation: `${entityName(speciesId)} has a documented in-game shiny origin in ${gameId}; this route does not invent breeding.`,
    sources: sourcesFor(speciesId, `The curated shiny-origin table includes ${gameId}.`), verifiedAt,
  };
}

function breedingRoute(speciesId: number, gameId: TrackedGameId): PokemonHuntRoute {
  const key = entityKey(speciesId);
  const family = familyBySpecies.get(speciesId);
  const rootId = family?.rootId || speciesId;
  const rootKey = entityKey(rootId);
  const parentId = breedableParentByBaby.get(rootId) || rootId;
  const evolved = Boolean(family?.previousId);
  return {
    id: `${key}:${gameId}:gen2-coverage-external-parent-${evolved ? 'breeding-evolution' : 'breeding'}` as HuntRouteId,
    targetEntityKey: key, gameId, method: evolved ? 'breeding-and-evolution' : 'breeding', huntingMethodId: breedingMethod(gameId),
    access: evolved ? 'external-parent-breeding-evolution' : 'external-parent-breeding', recommendation: 'eligible-with-external-setup', directEncounter: false,
    eggResultEntityKey: rootKey, evolveFromEntityKey: evolved ? entityKey(family!.previousId!) : undefined,
    locations: [breedingLocation(gameId)],
    prerequisites: [
      { type: 'external-parent', entityKey: entityKey(parentId), note: `Import or trade a compatible ${entityName(parentId)}-family parent into ${gameId}; no native encounter is assumed.` },
      ...(evolved ? [{ type: 'evolve-shiny' as const, entityKey: entityKey(family!.previousId!), note: `Hatch shiny ${entityName(rootId)}, then complete the evolution path to ${entityName(speciesId)}.` }] : []),
    ],
    explanation: evolved ? `${entityName(speciesId)} is safely huntable by breeding shiny ${entityName(rootId)} and evolving it; no direct encounter is inferred.` : `${entityName(speciesId)} is safely huntable by breeding a compatible externally sourced parent; no native encounter is inferred.`,
    sources: sourcesFor(speciesId, `The curated shiny-origin table includes an egg origin in ${gameId}.`), verifiedAt,
  };
}

function buildRoute(speciesId: number, gameId: TrackedGameId): PokemonHuntRoute {
  const eligibleGames = getCuratedShinyOriginGameIds(speciesId, canonicalName(speciesId));
  if (!eligibleGames?.includes(gameId)) return unavailableRoute(speciesId, gameId);
  const special = specialOrigins.get(`${speciesId}:${gameId}`);
  if (special) return specialRoute(speciesId, gameId, special);
  if (speciesId === 201) return unownRoute(gameId);
  if (noEggSpecies.has(speciesId)) throw new Error(`Missing explicit non-breeding origin for National Dex #${speciesId} in ${gameId}`);
  if (gamesWithoutBreeding.has(gameId)) return noBreedingGameRoute(speciesId, gameId);
  return breedingRoute(speciesId, gameId);
}

export const GEN2_HUNT_COVERAGE_ROUTES: PokemonHuntRoute[] = [];
for (let speciesId = FIRST_SPECIES; speciesId <= LAST_SPECIES; speciesId += 1) {
  for (const gameId of TRACKED_GAME_IDS) GEN2_HUNT_COVERAGE_ROUTES.push(buildRoute(speciesId, gameId));
}
