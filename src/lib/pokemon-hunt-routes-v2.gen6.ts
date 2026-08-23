import type { PokemonEntityKey } from './pokemon-catalog-v2';
import { POKEMON_CATALOG_V2 } from './pokemon-catalog-v2.registry';
import generatedEvolutionData from './evolution-data.generated.json';
import { getCuratedShinyOriginGameIds, TRACKED_GAME_IDS, type TrackedGameId } from './pokemon-game-availability';
import type { HuntRouteId, PokemonHuntRoute } from './pokemon-hunt-routes-v2';

const verifiedAt = '2026-08-23';
const gen6Games = ['x', 'y', 'omegaruby', 'alphasapphire'] as const;
const xyGames = ['x', 'y'] as const;
const shinyLockedOrEventOnly = new Set([716, 717, 718, 719, 720, 721]);
const noEggSpecies = new Set([
  144, 145, 146, 150, 151, 201, 243, 244, 245, 249, 250, 251,
  377, 378, 379, 380, 381, 382, 383, 384, 385, 386,
  480, 481, 482, 483, 484, 485, 486, 487, 488, 489, 490, 491, 492, 493, 494,
  638, 639, 640, 641, 642, 643, 644, 645, 646, 647, 648, 649,
  716, 717, 718, 719, 720, 721,
]);
const tradeEvolutionSpecies = new Set([683, 685]);
const xyVersionNativeGameBySpecies = new Map<number, 'x' | 'y'>([
  [682, 'y'], [683, 'y'],
  [684, 'x'], [685, 'x'],
  [690, 'y'], [691, 'y'],
  [692, 'x'], [693, 'x'],
]);
const eventOnlyFormKeys = new Set<PokemonEntityKey>([
  'pokemon:666:poke-ball-pattern',
  'pokemon:666:vivillon-fancy',
]);
const postGen6FormKeys = new Set<PokemonEntityKey>([
  'pokemon:705:sliggoo-hisui',
  'pokemon:706:goodra-hisui',
  'pokemon:713:avalugg-hisui',
  'pokemon:718:zygarde-10',
]);
const officialFriendSafariEntries = [
  [190, 'Normal'], [206, 'Normal'], [216, 'Normal'], [506, 'Normal'],
  [294, 'Normal'], [352, 'Normal'], [531, 'Normal'], [572, 'Normal'],
  [113, 'Normal'], [132, 'Normal'], [133, 'Normal'], [235, 'Normal'],
  [12, 'Bug'], [46, 'Bug'], [165, 'Bug'], [415, 'Bug'],
  [267, 'Bug'], [284, 'Bug'], [313, 'Bug'], [314, 'Bug'],
  [49, 'Bug'], [127, 'Bug'], [214, 'Bug'], [666, 'Bug'],
  [262, 'Dark'], [274, 'Dark'], [624, 'Dark'], [629, 'Dark'],
  [215, 'Dark'], [332, 'Dark'], [342, 'Dark'], [551, 'Dark'],
  [302, 'Dark'], [359, 'Dark'], [510, 'Dark'], [686, 'Dark'],
  [444, 'Dragon'], [611, 'Dragon'], [148, 'Dragon'], [372, 'Dragon'],
  [714, 'Dragon'], [621, 'Dragon'], [705, 'Dragon'], [101, 'Electric'],
  [417, 'Electric'], [587, 'Electric'], [702, 'Electric'], [25, 'Electric'],
  [125, 'Electric'], [618, 'Electric'], [694, 'Electric'], [310, 'Electric'],
  [404, 'Electric'], [523, 'Electric'], [596, 'Electric'], [175, 'Fairy'],
  [209, 'Fairy'], [281, 'Fairy'], [702, 'Fairy'], [39, 'Fairy'],
  [303, 'Fairy'], [682, 'Fairy'], [684, 'Fairy'], [35, 'Fairy'],
  [670, 'Fairy'], [56, 'Fighting'], [67, 'Fighting'], [307, 'Fighting'],
  [619, 'Fighting'], [538, 'Fighting'], [539, 'Fighting'], [674, 'Fighting'],
  [236, 'Fighting'], [286, 'Fighting'], [297, 'Fighting'], [447, 'Fighting'],
  [58, 'Fire'], [77, 'Fire'], [126, 'Fire'], [513, 'Fire'],
  [5, 'Fire'], [218, 'Fire'], [636, 'Fire'], [668, 'Fire'],
  [38, 'Fire'], [654, 'Fire'], [662, 'Fire'], [16, 'Flying'],
  [21, 'Flying'], [83, 'Flying'], [84, 'Flying'], [163, 'Flying'],
  [520, 'Flying'], [527, 'Flying'], [581, 'Flying'], [357, 'Flying'],
  [627, 'Flying'], [662, 'Flying'], [701, 'Flying'], [353, 'Ghost'],
  [608, 'Ghost'], [708, 'Ghost'], [710, 'Ghost'], [356, 'Ghost'],
  [426, 'Ghost'], [442, 'Ghost'], [623, 'Ghost'], [43, 'Grass'],
  [114, 'Grass'], [191, 'Grass'], [511, 'Grass'], [2, 'Grass'],
  [541, 'Grass'], [548, 'Grass'], [586, 'Grass'], [556, 'Grass'],
  [651, 'Grass'], [673, 'Grass'], [27, 'Ground'], [194, 'Ground'],
  [231, 'Ground'], [328, 'Ground'], [51, 'Ground'], [105, 'Ground'],
  [290, 'Ground'], [323, 'Ground'], [423, 'Ground'], [536, 'Ground'],
  [660, 'Ground'], [225, 'Ice'], [361, 'Ice'], [363, 'Ice'],
  [459, 'Ice'], [215, 'Ice'], [614, 'Ice'], [712, 'Ice'],
  [87, 'Ice'], [91, 'Ice'], [131, 'Ice'], [221, 'Ice'],
  [14, 'Poison'], [44, 'Poison'], [268, 'Poison'], [336, 'Poison'],
  [49, 'Poison'], [168, 'Poison'], [317, 'Poison'], [569, 'Poison'],
  [89, 'Poison'], [452, 'Poison'], [454, 'Poison'], [544, 'Poison'],
  [63, 'Psychic'], [96, 'Psychic'], [326, 'Psychic'], [517, 'Psychic'],
  [202, 'Psychic'], [561, 'Psychic'], [677, 'Psychic'], [178, 'Psychic'],
  [203, 'Psychic'], [575, 'Psychic'], [578, 'Psychic'], [299, 'Rock'],
  [525, 'Rock'], [557, 'Rock'], [95, 'Rock'], [219, 'Rock'],
  [222, 'Rock'], [247, 'Rock'], [112, 'Rock'], [213, 'Rock'],
  [689, 'Rock'], [82, 'Steel'], [303, 'Steel'], [597, 'Steel'],
  [205, 'Steel'], [227, 'Steel'], [375, 'Steel'], [600, 'Steel'],
  [437, 'Steel'], [530, 'Steel'], [707, 'Steel'], [98, 'Water'],
  [224, 'Water'], [400, 'Water'], [515, 'Water'], [8, 'Water'],
  [130, 'Water'], [195, 'Water'], [419, 'Water'], [61, 'Water'],
  [184, 'Water'], [657, 'Water'],
] as const;
const officialFriendSafariTypesBySpecies = new Map<number, string[]>();
for (const [speciesId, safariType] of officialFriendSafariEntries) {
  officialFriendSafariTypesBySpecies.set(speciesId, [...(officialFriendSafariTypesBySpecies.get(speciesId) ?? []), safariType]);
}

const familyBySpecies = new Map<number, { rootId: number; previousId?: number }>();
function addFamily(...speciesIds: number[]) {
  speciesIds.forEach((speciesId, index) => familyBySpecies.set(speciesId, { rootId: speciesIds[0], previousId: index ? speciesIds[index - 1] : undefined }));
}

[
  [650, 651, 652], [653, 654, 655], [656, 657, 658], [659, 660], [661, 662, 663],
  [664, 665, 666], [667, 668], [669, 670, 671], [672, 673], [674, 675], [676],
  [677, 678], [679, 680, 681], [682, 683], [684, 685], [686, 687], [688, 689],
  [690, 691], [692, 693], [694, 695], [696, 697], [698, 699], [700], [701], [702],
  [703], [704, 705, 706], [707], [708, 709], [710, 711], [712, 713], [714, 715],
].forEach((family) => addFamily(...family));

function entityForSpecies(speciesId: number) {
  const item = POKEMON_CATALOG_V2.find((entry) => entry.speciesId === speciesId && entry.formKey === 'base')
    || POKEMON_CATALOG_V2.find((entry) => entry.speciesId === speciesId);
  if (!item) throw new Error(`Missing Generation VI catalog species ${speciesId}`);
  return item;
}

function entityForKey(key: PokemonEntityKey) {
  const item = POKEMON_CATALOG_V2.find((entry) => entry.key === key);
  if (!item) throw new Error(`Missing Generation VI catalog entity ${key}`);
  return item;
}

function baseKey(speciesId: number) {
  return `pokemon:${speciesId}:base` as PokemonEntityKey;
}

function rootSpeciesId(speciesId: number): number {
  const previous = (generatedEvolutionData as Record<string, { prev: number[]; next: number[] }>)[String(speciesId)]?.prev ?? [];
  if (!previous.length) return speciesId;
  return rootSpeciesId(previous[0]);
}

function title(value: string) {
  return value.replace(/(^|[-\s])(\p{L})/gu, (_, prefix: string, letter: string) => `${prefix}${letter.toUpperCase()}`);
}

function sourcesFor(speciesId: number): PokemonHuntRoute['sources'] {
  const entity = entityForSpecies(speciesId);
  const pageName = title(entity.canonicalName.replace(/-.*/u, ''));
  return [
    { provider: 'Serebii', url: `https://www.serebii.net/pokedex-xy/${speciesId.toString().padStart(3, '0')}.shtml`, note: `Cross-checks ${entity.displayName}'s Generation VI availability and obtainment family.` },
    { provider: 'Bulbapedia', url: `https://bulbapedia.bulbagarden.net/wiki/${pageName}_(Pok%C3%A9mon)`, note: `Cross-checks ${entity.displayName}'s availability, evolution and shiny-lock context.` },
  ];
}

function breedingLocation(gameId: TrackedGameId) {
  return gameId === 'x' || gameId === 'y' ? 'Route 7 Day Care' : 'Route 117 Day Care';
}

function unavailableRoute(speciesId: number, gameId: TrackedGameId, explanation?: string, access: PokemonHuntRoute['access'] = 'shiny-locked'): PokemonHuntRoute {
  const key = baseKey(speciesId);
  const entity = entityForSpecies(speciesId);
  return {
    id: `${key}:${gameId}:gen6-coverage-unavailable` as HuntRouteId,
    targetEntityKey: key,
    gameId,
    method: 'unavailable',
    huntingMethodId: 'custom',
    access,
    recommendation: 'not-eligible',
    directEncounter: false,
    locations: [],
    prerequisites: [],
    explanation: explanation || `${entity.displayName} has no eligible own-origin shiny hunt in ${gameId}.`,
    sources: sourcesFor(speciesId),
    verifiedAt,
  };
}

function starterRoute(speciesId: number, gameId: TrackedGameId): PokemonHuntRoute {
  const key = baseKey(speciesId);
  const family = familyBySpecies.get(speciesId);
  const evolved = Boolean(family?.previousId);
  const rootId = family?.rootId ?? speciesId;
  const rootKey = baseKey(rootId);
  return {
    id: `${key}:${gameId}:gen6-coverage-kalos-starter` as HuntRouteId,
    targetEntityKey: key,
    gameId,
    method: evolved ? 'evolution-from-hunted-shiny' : 'soft-reset-gift',
    huntingMethodId: 'gen6-soft-reset',
    access: evolved ? 'same-save-evolution' : 'native',
    recommendation: 'eligible-native',
    directEncounter: false,
    evolveFromEntityKey: evolved && family?.previousId ? baseKey(family.previousId) : undefined,
    locations: ['Aquacorde Town — first partner choice'],
    prerequisites: evolved
      ? [{ type: 'evolve-shiny', entityKey: rootKey, note: `Hunt shiny ${entityForSpecies(rootId).displayName}, then evolve it in the same save.` }]
      : [{ type: 'starter-choice', entityKey: key, note: `Choose ${entityForSpecies(speciesId).displayName} as the Kalos first partner and soft reset before selection.` }],
    explanation: evolved
      ? `${entityForSpecies(speciesId).displayName} is obtained by evolving the shiny Kalos first partner in the same save.`
      : `${entityForSpecies(speciesId).displayName} is a non-shiny-locked Kalos starter gift; use Soft Reset, not generic Gift Pokémon.`,
    sources: sourcesFor(speciesId),
    verifiedAt,
  };
}

function fossilRoute(speciesId: number, gameId: TrackedGameId): PokemonHuntRoute {
  const key = baseKey(speciesId);
  const family = familyBySpecies.get(speciesId);
  const evolved = Boolean(family?.previousId);
  const rootId = family?.rootId ?? speciesId;
  const rootKey = baseKey(rootId);
  return {
    id: `${key}:${gameId}:gen6-coverage-fossil-restore` as HuntRouteId,
    targetEntityKey: key,
    gameId,
    method: evolved ? 'evolution-from-hunted-shiny' : 'gift-pokemon',
    huntingMethodId: 'gen6-fossil-restore',
    access: evolved ? 'same-save-evolution' : 'native',
    recommendation: 'eligible-native',
    directEncounter: false,
    evolveFromEntityKey: evolved && family?.previousId ? baseKey(family.previousId) : undefined,
    locations: ['Ambrette Town Fossil Lab'],
    prerequisites: evolved
      ? [{ type: 'evolve-shiny', entityKey: rootKey, note: `Restore shiny ${entityForSpecies(rootId).displayName}, then evolve it.` }]
      : [{ type: 'game-progression', note: speciesId === 696 ? 'Restore the Jaw Fossil.' : 'Restore the Sail Fossil.' }],
    explanation: evolved
      ? `${entityForSpecies(speciesId).displayName} comes from evolving a restored shiny fossil Pokémon.`
      : `${entityForSpecies(speciesId).displayName} is generated by Fossil Restore; it is not a generic Gift Pokémon route.`,
    sources: sourcesFor(speciesId),
    verifiedAt,
  };
}

function directOrBreedingRoute(speciesId: number, gameId: TrackedGameId): PokemonHuntRoute {
  const key = baseKey(speciesId);
  const family = familyBySpecies.get(speciesId);
  const evolved = Boolean(family?.previousId);
  const rootId = family?.rootId ?? speciesId;
  const rootKey = baseKey(rootId);
  const xyExclusiveNativeGame = xyVersionNativeGameBySpecies.get(speciesId);
  const direct = (gameId === 'x' || gameId === 'y') && (!xyExclusiveNativeGame || xyExclusiveNativeGame === gameId);
  const sourceGameIds = xyExclusiveNativeGame ? [xyExclusiveNativeGame] : ['x', 'y'];
  const requiresTradeEvolution = tradeEvolutionSpecies.has(speciesId);
  const externalEvolution = evolved && requiresTradeEvolution;
  const breedingAccess = evolved ? 'external-parent-breeding-evolution' : 'external-parent-breeding';
  return {
    id: `${key}:${gameId}:gen6-coverage-${direct ? 'kalos-origin' : breedingAccess}` as HuntRouteId,
    targetEntityKey: key,
    gameId,
    method: direct
      ? evolved ? 'evolution-from-hunted-shiny' : 'wild-random-encounter'
      : evolved ? 'breeding-and-evolution' : 'breeding',
    huntingMethodId: direct ? 'gen6-random' : 'gen6-egg-hatching',
    access: direct ? externalEvolution ? 'external-game-feature' : evolved ? 'same-save-evolution' : 'native' : breedingAccess,
    recommendation: direct && !externalEvolution ? 'eligible-native' : 'eligible-with-external-setup',
    directEncounter: direct && !evolved,
    eggResultEntityKey: direct ? undefined : rootKey,
    evolveFromEntityKey: evolved && family?.previousId ? baseKey(family.previousId) : undefined,
    locations: [direct ? 'Documented Kalos encounter' : breedingLocation(gameId)],
    prerequisites: direct
      ? evolved ? [
        { type: 'evolve-shiny', entityKey: baseKey(family!.previousId!), note: `Hunt the shiny family origin, then evolve it into ${entityForSpecies(speciesId).displayName}.` },
        ...(externalEvolution ? [{ type: 'external-game-feature' as const, note: `Trade shiny ${entityForSpecies(family!.previousId!).displayName} while it holds the required evolution item, then trade it back if desired.` }] : []),
      ] : []
      : [{ type: 'external-parent', entityKey: rootKey, sourceGameIds, note: `Use a compatible ${entityForSpecies(rootId).displayName}-family parent from ${sourceGameIds.map((item) => item.toUpperCase()).join('/')} or another compatible source.` },
        ...(evolved && family?.previousId ? [
          { type: 'evolve-shiny' as const, entityKey: baseKey(family.previousId), note: `Evolve the shiny bred family member into ${entityForSpecies(speciesId).displayName}.` },
          ...(externalEvolution ? [{ type: 'external-game-feature' as const, note: `The final evolution requires trading shiny ${entityForSpecies(family.previousId).displayName} with its held evolution item.` }] : []),
        ] : [])],
    explanation: direct
      ? externalEvolution
        ? `${entityForSpecies(speciesId).displayName} comes from a Kalos-native shiny ${entityForSpecies(family!.previousId!).displayName}, but the final evolution requires the external trade-evolution setup.`
        : `${entityForSpecies(speciesId).displayName} has a Kalos-native shiny origin in ${gameId.toUpperCase()}; specific boosted methods remain separate where generated encounter data provides them.`
      : xyExclusiveNativeGame && (gameId === 'x' || gameId === 'y')
        ? `${entityForSpecies(speciesId).displayName} is version-exclusive to ${xyExclusiveNativeGame.toUpperCase()}; in ${gameId.toUpperCase()} it requires breeding from an external parent, so no native wild route is invented.`
        : `${entityForSpecies(speciesId).displayName} is hunted in ORAS by breeding from a compatible external parent; no wild ORAS encounter is invented.`,
    sources: sourcesFor(speciesId),
    verifiedAt,
  };
}

function xyFriendSafariRoute(speciesId: number, gameId: 'x' | 'y'): PokemonHuntRoute {
  const entity = entityForSpecies(speciesId);
  const key = entity.key;
  const safariTypes = officialFriendSafariTypesBySpecies.get(speciesId) ?? ['Unknown'];
  return {
    id: `${key}:${gameId}:gen6-friend-safari` as HuntRouteId,
    targetEntityKey: key,
    gameId,
    method: 'wild-random-encounter',
    huntingMethodId: 'gen6-friend-safari',
    access: 'native',
    recommendation: 'eligible-native',
    directEncounter: true,
    locations: safariTypes.map((safariType) => `Friend Safari — ${safariType}`),
    prerequisites: [{ type: 'game-progression', note: `Reach Kiloude City and register a 3DS friend code with the matching ${safariTypes.join(' or ')}-type Friend Safari slot.` }],
    explanation: `${entity.displayName} is directly huntable in the X/Y Friend Safari. Friend Safari has its own shiny odds/method and ignores the ordinary X/Y version-exclusive split, so it is kept distinct from Random Encounter.`,
    sources: sourcesFor(speciesId),
    verifiedAt,
  };
}

function xyFriendSafariTradeEvolutionRoute(speciesId: 683 | 685, gameId: 'x' | 'y'): PokemonHuntRoute {
  const key = baseKey(speciesId);
  const previousId = speciesId === 683 ? 682 : 684;
  const previousKey = baseKey(previousId);
  const entity = entityForSpecies(speciesId);
  const previous = entityForSpecies(previousId);
  return {
    id: `${key}:${gameId}:gen6-friend-safari-trade-evolution` as HuntRouteId,
    targetEntityKey: key,
    gameId,
    method: 'evolution-from-hunted-shiny',
    huntingMethodId: 'gen6-friend-safari',
    access: 'external-game-feature',
    recommendation: 'eligible-with-external-setup',
    directEncounter: false,
    evolveFromEntityKey: previousKey,
    locations: ['Friend Safari — Fairy'],
    prerequisites: [
      { type: 'external-game-feature', note: 'Register a 3DS friend code with the matching Fairy-type Friend Safari slot.' },
      { type: 'evolve-shiny', entityKey: previousKey, note: `Hunt shiny ${previous.displayName} in Friend Safari, then evolve it into ${entity.displayName}.` },
      { type: 'external-game-feature', note: `Trade shiny ${previous.displayName} while it holds the required evolution item, then trade it back if desired.` },
    ],
    explanation: `${entity.displayName} is not a direct Friend Safari encounter; hunt shiny ${previous.displayName} through Friend Safari, then use the required held-item trade evolution.`,
    sources: sourcesFor(speciesId),
    verifiedAt,
  };
}

function unavailableFormRoute(key: PokemonEntityKey, gameId: TrackedGameId, explanation: string, access: PokemonHuntRoute['access'] = 'unobtainable'): PokemonHuntRoute {
  const entity = entityForKey(key);
  return {
    id: `${key}:${gameId}:gen6-form-coverage-unavailable` as HuntRouteId,
    targetEntityKey: key,
    gameId,
    method: 'unavailable',
    huntingMethodId: 'custom',
    access,
    recommendation: 'not-eligible',
    directEncounter: false,
    locations: [],
    prerequisites: [],
    explanation,
    sources: sourcesFor(entity.speciesId),
    verifiedAt,
  };
}

function vivillonFormRoute(key: PokemonEntityKey, gameId: TrackedGameId): PokemonHuntRoute {
  const entity = entityForKey(key);
  const xyNative = gameId === 'x' || gameId === 'y';
  return {
    id: `${key}:${gameId}:gen6-form-coverage-vivillon-pattern` as HuntRouteId,
    targetEntityKey: key,
    gameId,
    method: xyNative ? 'evolution-from-hunted-shiny' : 'breeding-and-evolution',
    huntingMethodId: xyNative ? 'gen6-random' : 'gen6-egg-hatching',
    access: xyNative ? 'same-save-evolution' : 'external-parent-breeding-evolution',
    recommendation: xyNative ? 'eligible-native' : 'eligible-with-external-setup',
    directEncounter: false,
    eggResultEntityKey: xyNative ? undefined : 'pokemon:664:base',
    evolveFromEntityKey: 'pokemon:665:base',
    locations: [xyNative ? 'Kalos regional-pattern Scatterbug line' : breedingLocation(gameId)],
    prerequisites: xyNative
      ? [{ type: 'evolve-shiny', entityKey: 'pokemon:664:base', note: `Hunt shiny Scatterbug/Spewpa in an X/Y save with the matching regional pattern, then evolve it into ${entity.displayName}.` }]
      : [{ type: 'external-parent', entityKey: 'pokemon:664:base', sourceGameIds: ['x', 'y'], note: `Breed from a Scatterbug-family parent tied to the matching Vivillon pattern, then evolve it into ${entity.displayName}.` }],
    explanation: `${entity.displayName} is tracked as its own pattern. In Generation VI the non-event Vivillon pattern is determined by the save-region data of the Scatterbug line, so the shiny route is the matching Scatterbug/Spewpa hunt followed by evolution.`,
    sources: sourcesFor(666),
    verifiedAt,
  };
}

function flabebeFamilyFormRoute(key: PokemonEntityKey, gameId: TrackedGameId): PokemonHuntRoute {
  const entity = entityForKey(key);
  const color = entity.formKey.replace(/^flabebe-|^floette-|^florges-/u, '') || 'red';
  const xyNative = gameId === 'x' || gameId === 'y';
  const isFlabebe = entity.speciesId === 669;
  const previousKey = entity.speciesId === 670
    ? `pokemon:669:${entity.formKey.replace(/^floette-/u, 'flabebe-')}` as PokemonEntityKey
    : entity.speciesId === 671
      ? `pokemon:670:${entity.formKey.replace(/^florges-/u, 'floette-')}` as PokemonEntityKey
      : undefined;
  return {
    id: `${key}:${gameId}:gen6-form-coverage-flabebe-color` as HuntRouteId,
    targetEntityKey: key,
    gameId,
    method: xyNative ? isFlabebe ? 'wild-random-encounter' : 'evolution-from-hunted-shiny' : isFlabebe ? 'breeding' : 'breeding-and-evolution',
    huntingMethodId: xyNative ? 'gen6-random' : 'gen6-egg-hatching',
    access: xyNative ? isFlabebe ? 'native' : 'same-save-evolution' : isFlabebe ? 'external-parent-breeding' : 'external-parent-breeding-evolution',
    recommendation: xyNative ? 'eligible-native' : 'eligible-with-external-setup',
    directEncounter: xyNative && isFlabebe,
    eggResultEntityKey: xyNative ? undefined : key,
    evolveFromEntityKey: previousKey,
    locations: [xyNative ? `Kalos flower patches — ${color} flower form` : breedingLocation(gameId)],
    prerequisites: xyNative
      ? isFlabebe ? [] : [{ type: 'evolve-shiny', entityKey: previousKey, note: `Hunt the matching shiny ${color} flower line, then evolve it into ${entity.displayName}.` }]
      : [{ type: 'external-parent', entityKey: isFlabebe ? key : previousKey, sourceGameIds: ['x', 'y'], note: `Use a matching ${color} flower family parent from X/Y; ORAS does not provide a native wild Flabébé-family encounter.` }],
    explanation: `${entity.displayName} is tracked separately by flower colour. X/Y provide the own-origin colour line; ORAS requires an imported matching parent and breeding/evolution rather than an invented wild encounter.`,
    sources: sourcesFor(entity.speciesId),
    verifiedAt,
  };
}

function furfrouTrimRoute(key: PokemonEntityKey, gameId: TrackedGameId): PokemonHuntRoute {
  const entity = entityForKey(key);
  const xyNative = gameId === 'x' || gameId === 'y';
  return {
    id: `${key}:${gameId}:gen6-form-coverage-furfrou-trim` as HuntRouteId,
    targetEntityKey: key,
    gameId,
    method: 'form-change-from-hunted-shiny',
    huntingMethodId: xyNative ? 'gen6-random' : 'gen6-egg-hatching',
    access: xyNative ? 'same-save-form-change' : 'external-game-feature',
    recommendation: xyNative ? 'eligible-native' : 'eligible-with-external-setup',
    directEncounter: false,
    eggResultEntityKey: xyNative ? undefined : 'pokemon:676:base',
    locations: [xyNative ? 'Friseur Furfrou / Kalos grooming after hunting base Furfrou' : breedingLocation(gameId)],
    prerequisites: xyNative
      ? [{ type: 'change-form', entityKey: 'pokemon:676:base', note: `Hunt shiny base Furfrou in X/Y, then apply the ${entity.displayName} trim.` }]
      : [{ type: 'external-parent', entityKey: 'pokemon:676:base', sourceGameIds: ['x', 'y'], note: `Breed a shiny Furfrou from an external parent, then use a compatible grooming/form-change setup for ${entity.displayName}.` }],
    explanation: `${entity.displayName} is not a separate shiny roll: hunt shiny Furfrou, then apply the trim as a form change. ORAS has no native wild Furfrou, so it requires external setup.`,
    sources: sourcesFor(676),
    verifiedAt,
  };
}

function pumpkabooFamilyFormRoute(key: PokemonEntityKey, gameId: TrackedGameId): PokemonHuntRoute {
  const entity = entityForKey(key);
  const size = entity.formKey.replace(/^pumpkaboo-|^gourgeist-/u, '') || 'average';
  const xyNative = gameId === 'x' || gameId === 'y';
  const isPumpkaboo = entity.speciesId === 710;
  const previousKey = isPumpkaboo ? undefined : `pokemon:710:${entity.formKey.replace(/^gourgeist-/u, 'pumpkaboo-')}` as PokemonEntityKey;
  return {
    id: `${key}:${gameId}:gen6-form-coverage-pumpkaboo-size` as HuntRouteId,
    targetEntityKey: key,
    gameId,
    method: xyNative ? isPumpkaboo ? 'wild-random-encounter' : 'evolution-from-hunted-shiny' : isPumpkaboo ? 'breeding' : 'breeding-and-evolution',
    huntingMethodId: xyNative ? 'gen6-random' : 'gen6-egg-hatching',
    access: xyNative ? isPumpkaboo ? 'native' : 'same-save-evolution' : isPumpkaboo ? 'external-parent-breeding' : 'external-parent-breeding-evolution',
    recommendation: xyNative ? 'eligible-native' : 'eligible-with-external-setup',
    directEncounter: xyNative && isPumpkaboo,
    eggResultEntityKey: xyNative ? undefined : isPumpkaboo ? key : previousKey,
    evolveFromEntityKey: previousKey,
    locations: [xyNative ? `Route 16 — ${size} size Pumpkaboo line` : breedingLocation(gameId)],
    prerequisites: xyNative
      ? isPumpkaboo ? [] : [{ type: 'evolve-shiny', entityKey: previousKey, note: `Hunt shiny ${size} size Pumpkaboo, then evolve it into ${entity.displayName}.` }]
      : [{ type: 'external-parent', entityKey: isPumpkaboo ? key : previousKey, sourceGameIds: ['x', 'y'], note: `Use a matching ${size} size Pumpkaboo-family parent from X/Y, then breed/evolve in ${gameId}.` }],
    explanation: `${entity.displayName} is tracked separately by size. X/Y provide the native Route 16 Pumpkaboo size hunt; ORAS needs a matching external parent and breeding/evolution.`,
    sources: sourcesFor(entity.speciesId),
    verifiedAt,
  };
}

function buildFormRoute(key: PokemonEntityKey, gameId: TrackedGameId): PokemonHuntRoute {
  const entity = entityForKey(key);
  if (!gen6Games.includes(gameId as (typeof gen6Games)[number])) {
    return unavailableFormRoute(key, gameId, `${entity.displayName} is outside this Generation VI game audit.`, 'unobtainable');
  }
  if (eventOnlyFormKeys.has(key)) {
    return unavailableFormRoute(key, gameId, `${entity.displayName} is an event-only Vivillon pattern in Generation VI and is not exposed as a normal shiny hunt.`, 'event-only');
  }
  if (postGen6FormKeys.has(key)) {
    return unavailableFormRoute(key, gameId, key === 'pokemon:718:zygarde-10'
      ? 'Zygarde 10% and form-management routes belong to Generation VII onward, not Pokémon X/Y/ORAS.'
      : `${entity.displayName} is a later regional/form addition and is unobtainable in Generation VI.`, key === 'pokemon:718:zygarde-10' ? 'shiny-locked' : 'unobtainable');
  }
  if (entity.speciesId === 666) return vivillonFormRoute(key, gameId);
  if ([669, 670, 671].includes(entity.speciesId)) return flabebeFamilyFormRoute(key, gameId);
  if (entity.speciesId === 676) return furfrouTrimRoute(key, gameId);
  if ([710, 711].includes(entity.speciesId)) return pumpkabooFamilyFormRoute(key, gameId);
  return unavailableFormRoute(key, gameId, `${entity.displayName} has no separate Generation VI form route configured yet.`, 'unobtainable');
}

function buildRoute(speciesId: number, gameId: TrackedGameId): PokemonHuntRoute {
  if (!gen6Games.includes(gameId as (typeof gen6Games)[number])) return unavailableRoute(speciesId, gameId, `${entityForSpecies(speciesId).displayName} is outside this Generation VI game audit.`, 'unobtainable');
  if (shinyLockedOrEventOnly.has(speciesId)) {
    return unavailableRoute(speciesId, gameId, speciesId === 718
      ? 'Zygarde 50% is the Generation VI encounter form and is shiny locked; Zygarde 10% and form-management routes belong to Generation VII onward.'
      : `${entityForSpecies(speciesId).displayName} has no non-shiny-locked own-origin hunt in the Generation VI core games.`, speciesId >= 719 ? 'event-only' : 'shiny-locked');
  }
  if ([650, 651, 652, 653, 654, 655, 656, 657, 658].includes(speciesId)) {
    if (xyGames.includes(gameId as (typeof xyGames)[number])) return starterRoute(speciesId, gameId);
    return directOrBreedingRoute(speciesId, gameId);
  }
  if ([696, 697, 698, 699].includes(speciesId) && xyGames.includes(gameId as (typeof xyGames)[number])) {
    return fossilRoute(speciesId, gameId);
  }
  return directOrBreedingRoute(speciesId, gameId);
}

function shouldSkipSupplementalEntity(key: PokemonEntityKey) {
  const entity = entityForKey(key);
  if (entity.generationIntroduced > 6) return true;
  if (entity.completionPolicy === 'informational') return true;
  if (entity.kind === 'battle-only' || entity.kind === 'temporary' || entity.kind === 'fusion') return true;
  if (eventOnlyFormKeys.has(key) || postGen6FormKeys.has(key)) return true;
  return false;
}

function supplementalEggOriginKey(key: PokemonEntityKey): PokemonEntityKey {
  const entity = entityForKey(key);
  if (entity.formKey !== 'base') return key;
  return baseKey(rootSpeciesId(entity.speciesId));
}

function supplementalBreedingRoute(key: PokemonEntityKey, gameId: TrackedGameId, masuda: boolean): PokemonHuntRoute | null {
  const entity = entityForKey(key);
  if (!gen6Games.includes(gameId as (typeof gen6Games)[number])) return null;
  if (shouldSkipSupplementalEntity(key) || noEggSpecies.has(entity.speciesId)) return null;
  const eggKey = supplementalEggOriginKey(key);
  const evolves = eggKey !== key;
  const methodId = masuda ? 'gen6-masuda' : 'gen6-egg-hatching';
  return {
    id: `${key}:${gameId}:gen6-supplemental-${masuda ? 'masuda' : 'egg-hatching'}` as HuntRouteId,
    targetEntityKey: key,
    gameId,
    method: evolves ? 'breeding-and-evolution' : 'breeding',
    huntingMethodId: methodId,
    access: evolves ? 'external-parent-breeding-evolution' : 'external-parent-breeding',
    recommendation: 'eligible-with-external-setup',
    directEncounter: false,
    eggResultEntityKey: eggKey,
    evolveFromEntityKey: evolves ? eggKey : undefined,
    locations: [breedingLocation(gameId)],
    prerequisites: [
      {
        type: 'external-parent',
        entityKey: eggKey,
        note: masuda
          ? 'Use two compatible parents with different language origins for Masuda Method breeding in Generation VI.'
          : 'Use compatible parents or a transferred compatible parent to hatch this shiny line in Generation VI.',
      },
      ...(evolves ? [{ type: 'evolve-shiny' as const, entityKey: eggKey, note: `Hatch shiny ${entityForKey(eggKey).displayName}, then evolve it into ${entity.displayName}.` }] : []),
    ],
    explanation: `${entity.displayName} has no more specific eligible Gen 6 route in the current matrix for ${gameId}; this supplemental route records its Generation VI ${masuda ? 'Masuda Method' : 'Breeding'} availability when compatible parents are available.`,
    sources: sourcesFor(entity.speciesId),
    verifiedAt,
  };
}

function supplementalSoftResetRoute(key: PokemonEntityKey, gameId: TrackedGameId): PokemonHuntRoute | null {
  const entity = entityForKey(key);
  const latiPair = (key === 'pokemon:380:base' && gameId === 'alphasapphire') || (key === 'pokemon:381:base' && gameId === 'omegaruby');
  const orasLegendary = gameId === 'omegaruby' || gameId === 'alphasapphire';
  const gen5Legendary = orasLegendary && [638, 639, 640, 641, 642, 643, 644, 645, 646].includes(entity.speciesId);
  if (!latiPair && !gen5Legendary) return null;
  const isTherian = ['pokemon:641:therian', 'pokemon:642:therian', 'pokemon:645:therian'].includes(key);
  const originKey = isTherian ? key.replace(':therian', ':incarnate') as PokemonEntityKey : key;
  return {
    id: `${key}:${gameId}:gen6-supplemental-soft-reset` as HuntRouteId,
    targetEntityKey: key,
    gameId,
    method: isTherian ? 'form-change-from-hunted-shiny' : 'static-encounter',
    huntingMethodId: 'gen6-soft-reset',
    access: isTherian ? 'same-save-form-change' : 'native',
    recommendation: 'eligible-native',
    directEncounter: false,
    locations: [latiPair ? 'Southern Island / Eon Pokémon encounter' : isTherian ? 'Reveal Glass form change from ORAS Mirage Spot origin' : 'ORAS Mirage Spot legendary encounter'],
    prerequisites: isTherian
      ? [{ type: 'change-form', entityKey: originKey, note: `Catch shiny ${entityForKey(originKey).displayName} from the ORAS Mirage Spot route, then use Reveal Glass for ${entity.displayName}.` }]
      : [{ type: 'game-progression', note: latiPair ? 'Soft reset before the non-shiny-locked Eon Pokémon encounter in the matching ORAS version.' : 'Use the required ORAS Mirage Spot conditions and soft reset before the encounter.' }],
    explanation: `${entity.displayName} is a Generation VI ORAS ${latiPair ? 'version-specific static shiny hunt' : isTherian ? 'form-change route from the same shiny Forces of Nature Pokémon' : 'Mirage Spot static shiny hunt'} and must not be treated as breeding-only.`,
    sources: sourcesFor(entity.speciesId),
    verifiedAt,
  };
}

export function buildGen6SupplementalAllGamesRoutes(existingRoutes: readonly PokemonHuntRoute[]): PokemonHuntRoute[] {
  const hasEligibleRoute = new Set(existingRoutes
    .filter((route) => route.recommendation !== 'not-eligible')
    .map((route) => `${route.targetEntityKey}:${route.gameId}`));
  const additions: PokemonHuntRoute[] = [];
  for (const entity of POKEMON_CATALOG_V2) {
    if (shouldSkipSupplementalEntity(entity.key)) continue;
    const availability = getCuratedShinyOriginGameIds(entity.speciesId, entity.canonicalName);
    if (!availability) continue;
    for (const gameId of gen6Games) {
      if (!availability.includes(gameId)) continue;
      if (hasEligibleRoute.has(`${entity.key}:${gameId}`)) continue;
      const softReset = supplementalSoftResetRoute(entity.key, gameId);
      const breeding = supplementalBreedingRoute(entity.key, gameId, false);
      const masuda = supplementalBreedingRoute(entity.key, gameId, true);
      if (softReset) additions.push(softReset);
      if (breeding) additions.push(breeding);
      if (masuda) additions.push(masuda);
    }
  }
  return additions;
}

export const GEN6_HUNT_COVERAGE_ROUTES: PokemonHuntRoute[] = [];
for (let speciesId = 650; speciesId <= 721; speciesId += 1) {
  for (const gameId of TRACKED_GAME_IDS) GEN6_HUNT_COVERAGE_ROUTES.push(buildRoute(speciesId, gameId));
}
for (const entity of POKEMON_CATALOG_V2.filter((entry) => entry.speciesId >= 650 && entry.speciesId <= 721 && entry.formKey !== 'base')) {
  for (const gameId of TRACKED_GAME_IDS) GEN6_HUNT_COVERAGE_ROUTES.push(buildFormRoute(entity.key, gameId));
}
for (const gameId of xyGames) {
  for (const speciesId of officialFriendSafariTypesBySpecies.keys()) {
    GEN6_HUNT_COVERAGE_ROUTES.push(xyFriendSafariRoute(speciesId, gameId));
  }
  GEN6_HUNT_COVERAGE_ROUTES.push(xyFriendSafariTradeEvolutionRoute(683, gameId));
  GEN6_HUNT_COVERAGE_ROUTES.push(xyFriendSafariTradeEvolutionRoute(685, gameId));
}
