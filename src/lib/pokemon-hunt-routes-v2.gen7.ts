import type { PokemonEntityKey } from './pokemon-catalog-v2';
import { POKEMON_CATALOG_V2, POKEMON_CATALOG_V2_BY_KEY } from './pokemon-catalog-v2.registry';
import generatedEvolutionData from './evolution-data.generated.json';
import { getCuratedShinyOriginGameIds, type TrackedGameId } from './pokemon-game-availability';
import type { HuntRouteId, PokemonHuntRoute } from './pokemon-hunt-routes-v2';

const verifiedAt = '2026-08-23';
const gen7Games = ['sun', 'moon', 'ultrasun', 'ultramoon', 'lgp', 'lge'] as const;
const alolaMainGames = ['sun', 'moon', 'ultrasun', 'ultramoon'] as const;
const lgpeGames = ['lgp', 'lge'] as const;

const starterRoots = new Set([722, 725, 728]);
const shinyLockedOrEventOnly = new Set([785, 786, 787, 788, 789, 790, 791, 792, 800, 801, 802, 807, 808, 809]);
const postGen7FormKeys = new Set<PokemonEntityKey>(['pokemon:724:decidueye-hisui']);
const eventOnlySpecies = new Set([801, 802, 807]);
const notOwnOtSpecies = new Set([808, 809]);
const noEggSpecies = new Set([
  144, 145, 146, 150, 151, 201, 243, 244, 245, 249, 250, 251,
  377, 378, 379, 380, 381, 382, 383, 384, 385, 386,
  480, 481, 482, 483, 484, 485, 486, 487, 488, 489, 490, 491, 492, 493, 494,
  638, 639, 640, 641, 642, 643, 644, 645, 646, 647, 648, 649,
  716, 717, 718, 719, 720, 721,
  772, 773, 785, 786, 787, 788, 789, 790, 791, 792, 793, 794, 795, 796, 797, 798, 799, 800, 801, 802, 803, 804, 805, 806, 807, 808, 809,
]);
const fishingSpecies = new Set([746, 779, 781]);
const sosOnlySpecies = new Set([747]);
const ultraBeastGames = new Map<number, readonly TrackedGameId[]>([
  [793, ['sun', 'moon', 'ultrasun', 'ultramoon']],
  [794, ['sun', 'ultrasun']],
  [795, ['moon', 'ultramoon']],
  [796, ['sun', 'moon', 'ultrasun', 'ultramoon']],
  [797, ['moon', 'ultramoon']],
  [798, ['sun', 'ultrasun']],
  [799, ['sun', 'moon', 'ultrasun', 'ultramoon']],
  [805, ['ultramoon']],
  [806, ['ultrasun']],
]);

const familyPrevious = new Map<number, number>();
[
  [722, 723, 724], [725, 726, 727], [728, 729, 730], [731, 732, 733],
  [734, 735], [736, 737, 738], [739, 740], [742, 743], [747, 748],
  [749, 750], [751, 752], [753, 754], [755, 756], [757, 758],
  [759, 760], [761, 762, 763], [767, 768], [769, 770], [772, 773],
  [782, 783, 784], [803, 804],
].forEach((family) => family.forEach((speciesId, index) => {
  if (index > 0) familyPrevious.set(speciesId, family[index - 1]);
}));

const alolaEvolvesFrom = new Map<PokemonEntityKey, PokemonEntityKey>([
  ['pokemon:20:raticate-alola', 'pokemon:19:rattata-alola'],
  ['pokemon:26:raichu-alola', 'pokemon:25:base'],
  ['pokemon:28:sandslash-alola', 'pokemon:27:sandshrew-alola'],
  ['pokemon:38:ninetales-alola', 'pokemon:37:vulpix-alola'],
  ['pokemon:51:dugtrio-alola', 'pokemon:50:diglett-alola'],
  ['pokemon:53:persian-alola', 'pokemon:52:meowth-alola'],
  ['pokemon:75:graveler-alola', 'pokemon:74:geodude-alola'],
  ['pokemon:76:golem-alola', 'pokemon:75:graveler-alola'],
  ['pokemon:89:muk-alola', 'pokemon:88:grimer-alola'],
  ['pokemon:103:exeggutor-alola', 'pokemon:102:base'],
  ['pokemon:105:marowak-alola', 'pokemon:104:base'],
]);

const lgpeNpcTradeTargets = new Set<PokemonEntityKey>([
  'pokemon:19:rattata-alola', 'pokemon:26:raichu-alola', 'pokemon:27:sandshrew-alola',
  'pokemon:37:vulpix-alola', 'pokemon:50:diglett-alola', 'pokemon:52:meowth-alola',
  'pokemon:74:geodude-alola', 'pokemon:88:grimer-alola', 'pokemon:103:exeggutor-alola',
  'pokemon:105:marowak-alola',
]);

function entity(key: PokemonEntityKey) {
  const current = POKEMON_CATALOG_V2_BY_KEY.get(key);
  if (!current) throw new Error(`Missing catalog entity ${key}`);
  return current;
}

function keyFor(speciesId: number) {
  return `pokemon:${speciesId}:base` as PokemonEntityKey;
}

function rootSpeciesId(speciesId: number): number {
  const previous = (generatedEvolutionData as Record<string, { prev: number[]; next: number[] }>)[String(speciesId)]?.prev ?? [];
  if (!previous.length) return speciesId;
  return rootSpeciesId(previous[0]);
}

function titleName(value: string) {
  return value.replace(/(^|-)(\p{L})/gu, (_, prefix: string, letter: string) => `${prefix}${letter.toUpperCase()}`).replace(/-/gu, '_');
}

function sourcesFor(key: PokemonEntityKey): PokemonHuntRoute['sources'] {
  const current = entity(key);
  const pageName = titleName((current.displayName || current.canonicalName).replace(/\s*\(.+\)$/u, ''));
  return [
    {
      provider: 'Serebii',
      url: `https://www.serebii.net/pokedex-sm/${String(current.speciesId).padStart(3, '0')}.shtml`,
      note: `Cross-checks ${current.displayName}'s Generation VII availability, method and version context.`,
    },
    {
      provider: 'Bulbapedia',
      url: `https://bulbapedia.bulbagarden.net/wiki/${encodeURIComponent(pageName)}_(Pok%C3%A9mon)`,
      note: `Cross-checks ${current.displayName}'s form mechanics, evolution path and shiny-lock context.`,
    },
    {
      provider: 'Pokémon Central Wiki',
      url: `https://wiki.pokemoncentral.it/${encodeURIComponent(pageName)}`,
      note: `Italian cross-check for ${current.displayName}'s Generation VII locations, methods, forms and version availability.`,
    },
  ];
}

function unavailable(key: PokemonEntityKey, gameId: TrackedGameId, explanation: string, access: PokemonHuntRoute['access'] = 'unobtainable'): PokemonHuntRoute {
  return {
    id: `${key}:${gameId}:gen7-coverage-unavailable` as HuntRouteId,
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
    sources: sourcesFor(key),
    verifiedAt,
  };
}

function route(params: Omit<PokemonHuntRoute, 'sources' | 'verifiedAt'>): PokemonHuntRoute {
  return { ...params, sources: sourcesFor(params.targetEntityKey), verifiedAt };
}

function normalAlolaRoute(key: PokemonEntityKey, gameId: TrackedGameId): PokemonHuntRoute {
  const current = entity(key);
  if (lgpeGames.includes(gameId as (typeof lgpeGames)[number])) {
    const available = getCuratedShinyOriginGameIds(current.speciesId, current.canonicalName)?.includes(gameId) ?? false;
    if (!available) return unavailable(key, gameId, `${current.displayName} is not an own-origin shiny route in ${gameId}.`);
    if (lgpeNpcTradeTargets.has(key)) {
      return route({
        id: `${key}:${gameId}:gen7-coverage-npc-trade` as HuntRouteId,
        targetEntityKey: key,
        gameId,
        method: 'npc-trade',
        huntingMethodId: 'gen7-npc-trade',
        access: 'native',
        recommendation: 'eligible-native',
        directEncounter: false,
        locations: ['Let’s Go in-game Alolan-form NPC trade'],
        prerequisites: [],
        explanation: `${current.displayName} is shiny-eligible through the repeatable Alolan-form NPC trade in ${gameId}; it is tracked separately from Kanto-form encounters.`,
      });
    }
    const previous = alolaEvolvesFrom.get(key);
    const requiresTradeEvolution = previous === 'pokemon:75:graveler-alola';
    return route({
      id: `${key}:${gameId}:gen7-coverage-lgpe-evolution` as HuntRouteId,
      targetEntityKey: key,
      gameId,
      method: 'evolution-from-hunted-shiny',
      huntingMethodId: requiresTradeEvolution ? 'gen7-npc-trade' : 'gen7-lgpe-random',
      access: requiresTradeEvolution ? 'external-game-feature' : 'same-save-evolution',
      recommendation: requiresTradeEvolution ? 'eligible-with-external-setup' : 'eligible-native',
      directEncounter: false,
      evolveFromEntityKey: previous,
      locations: ['Let’s Go Alolan-form evolution line'],
      prerequisites: previous ? [
        ...(requiresTradeEvolution ? [{ type: 'external-game-feature' as const, entityKey: previous as PokemonEntityKey, note: 'Requires a compatible trade-evolution setup for shiny Alolan Graveler.' }] : []),
        { type: 'evolve-shiny', entityKey: previous, note: `Obtain shiny ${entity(previous).displayName}, then evolve it into ${current.displayName}.` },
      ] : [],
      explanation: `${current.displayName} is tracked as its own Alolan form and comes from evolving the shiny Alolan-form family member in Let’s Go.`,
    });
  }

  const previous = alolaEvolvesFrom.get(key);
  if (previous) {
    return route({
      id: `${key}:${gameId}:gen7-coverage-alola-evolution` as HuntRouteId,
      targetEntityKey: key,
      gameId,
      method: 'evolution-from-hunted-shiny',
      huntingMethodId: 'gen7-random',
      access: 'same-save-evolution',
      recommendation: 'eligible-native',
      directEncounter: false,
      evolveFromEntityKey: previous,
      locations: ['Alola regional-form evolution line'],
      prerequisites: [{ type: 'evolve-shiny', entityKey: previous, note: `Hunt or hatch the shiny Alolan-form origin, then evolve it into ${current.displayName}.` }],
      explanation: `${current.displayName} is tracked separately from the Kanto form and is obtained by evolving the shiny Alolan-form line in ${gameId}.`,
    });
  }

  return route({
    id: `${key}:${gameId}:gen7-coverage-alola-random` as HuntRouteId,
    targetEntityKey: key,
    gameId,
    method: 'wild-random-encounter',
    huntingMethodId: 'gen7-random',
    access: 'native',
    recommendation: 'eligible-native',
    directEncounter: true,
    locations: ['Documented Alola regional-form encounter'],
    prerequisites: [],
    explanation: `${current.displayName} is a distinct Alolan regional form and is recorded as its own Generation VII random-encounter shiny route.`,
  });
}

function gen7EntityRoute(key: PokemonEntityKey, gameId: TrackedGameId): PokemonHuntRoute {
  const current = entity(key);
  const speciesId = current.speciesId;
  if (postGen7FormKeys.has(key)) return unavailable(key, gameId, `${current.displayName} is a later regional form and is not obtainable in Generation VII.`);
  if (lgpeGames.includes(gameId as (typeof lgpeGames)[number])) {
    if (notOwnOtSpecies.has(speciesId)) return unavailable(key, gameId, `${current.displayName} in Let’s Go depends on Pokémon GO/event transfer context and is not recorded as an in-game own-origin shiny encounter.`, 'transfer-only');
    return unavailable(key, gameId, `${current.displayName} is not obtainable as a native shiny route in Let’s Go Pikachu/Eevee.`);
  }
  if (eventOnlySpecies.has(speciesId)) return unavailable(key, gameId, `${current.displayName} is event-only/shiny-locked for Generation VII own-origin hunting.`, 'event-only');
  if (shinyLockedOrEventOnly.has(speciesId)) return unavailable(key, gameId, `${current.displayName} is shiny locked or unavailable as a repeatable own-origin shiny hunt in Generation VII.`, 'shiny-locked');

  if (starterRoots.has(speciesId)) {
    return route({
      id: `${key}:${gameId}:gen7-coverage-starter-soft-reset` as HuntRouteId,
      targetEntityKey: key,
      gameId,
      method: 'soft-reset-gift',
      huntingMethodId: 'gen7-soft-reset',
      access: 'native',
      recommendation: 'eligible-native',
      directEncounter: false,
      locations: ['Starter selection'],
      prerequisites: [{ type: 'starter-choice', entityKey: key, note: `Choose ${current.displayName} as the starter and soft reset before accepting it.` }],
      explanation: `${current.displayName} is the Generation VII starter route and is hunted by soft resetting the starter gift.`,
    });
  }

  if ([723, 724, 726, 727, 729, 730].includes(speciesId)) {
    const previous = familyPrevious.get(speciesId)!;
    const root = speciesId < 725 ? 722 : speciesId < 728 ? 725 : 728;
    return route({
      id: `${key}:${gameId}:gen7-coverage-starter-evolution` as HuntRouteId,
      targetEntityKey: key,
      gameId,
      method: 'evolution-from-hunted-shiny',
      huntingMethodId: 'gen7-soft-reset',
      access: 'same-save-evolution',
      recommendation: 'eligible-native',
      directEncounter: false,
      evolveFromEntityKey: keyFor(previous),
      locations: ['Starter evolution line'],
      prerequisites: [{ type: 'evolve-shiny', entityKey: keyFor(root), note: `Soft reset for shiny ${entity(keyFor(root)).displayName}, then evolve through the line.` }],
      explanation: `${current.displayName} is obtained by evolving the shiny Generation VII starter family member in ${gameId}.`,
    });
  }

  if (speciesId === 772) {
    return route({
      id: `${key}:${gameId}:gen7-coverage-type-null-gift` as HuntRouteId,
      targetEntityKey: key,
      gameId,
      method: 'soft-reset-gift',
      huntingMethodId: 'gen7-soft-reset',
      access: 'native',
      recommendation: 'eligible-native',
      directEncounter: false,
      locations: ['Aether Paradise / Ancient Poni Path gift'],
      prerequisites: [{ type: 'game-progression', note: 'Soft reset before receiving the Type: Null gift.' }],
      explanation: `${current.displayName} is a shiny-eligible gift in Generation VII and belongs under Soft Reset, not generic Gift.`,
    });
  }

  if (speciesId === 773) {
    const isTypedMemory = key !== 'pokemon:773:base';
    return route({
      id: `${key}:${gameId}:gen7-coverage-silvally-${isTypedMemory ? 'memory-form' : 'evolution'}` as HuntRouteId,
      targetEntityKey: key,
      gameId,
      method: isTypedMemory ? 'form-change-from-hunted-shiny' : 'evolution-from-hunted-shiny',
      huntingMethodId: 'gen7-soft-reset',
      access: isTypedMemory ? 'same-save-form-change' : 'same-save-evolution',
      recommendation: 'eligible-native',
      directEncounter: false,
      evolveFromEntityKey: isTypedMemory ? undefined : 'pokemon:772:base',
      locations: [isTypedMemory ? 'Memory item form change' : 'Type: Null evolution line'],
      prerequisites: [{ type: isTypedMemory ? 'change-form' : 'evolve-shiny', entityKey: 'pokemon:772:base', note: isTypedMemory ? 'Use the matching Memory on shiny Silvally; the type form is not a separate shiny roll.' : 'Soft reset shiny Type: Null, then evolve it into Silvally.' }],
      explanation: `${current.displayName} is tracked as a distinct Silvally state but derives from the same shiny Type: Null/Silvally, not a separate wild encounter.`,
    });
  }

  if (speciesId === 803) {
    if (gameId === 'ultrasun' || gameId === 'ultramoon') {
      return route({
        id: `${key}:${gameId}:gen7-coverage-poipole-gift` as HuntRouteId,
        targetEntityKey: key,
        gameId,
        method: 'soft-reset-gift',
        huntingMethodId: 'gen7-soft-reset',
        access: 'native',
        recommendation: 'eligible-native',
        directEncounter: false,
        locations: ['Ultra Megalopolis gift'],
        prerequisites: [{ type: 'game-progression', note: 'Soft reset before receiving the Poipole gift in Ultra Sun/Ultra Moon.' }],
        explanation: `${current.displayName} is a shiny-eligible Ultra Sun/Ultra Moon gift and is hunted by soft reset.`,
      });
    }
    return unavailable(key, gameId, `${current.displayName} is not available as a shiny hunt in Sun/Moon.`);
  }

  if (speciesId === 804) {
    if (gameId === 'ultrasun' || gameId === 'ultramoon') {
      return route({
        id: `${key}:${gameId}:gen7-coverage-poipole-evolution` as HuntRouteId,
        targetEntityKey: key,
        gameId,
        method: 'evolution-from-hunted-shiny',
        huntingMethodId: 'gen7-soft-reset',
        access: 'same-save-evolution',
        recommendation: 'eligible-native',
        directEncounter: false,
        evolveFromEntityKey: 'pokemon:803:base',
        locations: ['Poipole evolution line'],
        prerequisites: [{ type: 'evolve-shiny', entityKey: 'pokemon:803:base', note: 'Soft reset shiny Poipole, then evolve it into Naganadel.' }],
        explanation: `${current.displayName} comes from evolving shiny Poipole in Ultra Sun/Ultra Moon.`,
      });
    }
    return unavailable(key, gameId, `${current.displayName} is not available as a shiny hunt in Sun/Moon.`);
  }

  const ubGames = ultraBeastGames.get(speciesId);
  if (ubGames) {
    if (!ubGames.includes(gameId)) return unavailable(key, gameId, `${current.displayName} is version-exclusive and not a native own-origin shiny route in ${gameId}.`, 'trade-only');
    const isUltra = gameId === 'ultrasun' || gameId === 'ultramoon';
    return route({
      id: `${key}:${gameId}:gen7-coverage-ultra-beast-${isUltra ? 'wormhole' : 'static'}` as HuntRouteId,
      targetEntityKey: key,
      gameId,
      method: 'static-encounter',
      huntingMethodId: isUltra ? 'gen7-wormhole' : 'gen7-soft-reset',
      access: 'native',
      recommendation: 'eligible-native',
      directEncounter: false,
      locations: [isUltra ? 'Ultra Wormhole / Ultra Space Wilds' : 'Ultra Beast post-game encounter'],
      prerequisites: [{ type: 'game-progression', note: isUltra ? 'Use the correct Ultra Wormhole/Ultra Space destination.' : 'Complete the Ultra Beast post-game mission and soft reset before the encounter.' }],
      explanation: `${current.displayName} is a non-shiny-locked Ultra Beast; Sun/Moon use fixed UB encounters, while Ultra Sun/Ultra Moon use Ultra Wormhole access where applicable.`,
    });
  }

  if (speciesId === 745) {
    if (key === 'pokemon:745:lycanroc-dusk') {
      const ultra = gameId === 'ultrasun' || gameId === 'ultramoon';
      return ultra ? route({
        id: `${key}:${gameId}:gen7-coverage-own-tempo-breeding` as HuntRouteId,
        targetEntityKey: key,
        gameId,
        method: 'breeding-and-evolution',
        huntingMethodId: 'gen7-egg-hatching',
        access: 'external-parent-breeding-evolution',
        recommendation: 'eligible-with-external-setup',
        directEncounter: false,
        eggResultEntityKey: 'pokemon:744:base',
        evolveFromEntityKey: 'pokemon:744:base',
        locations: ['Paniola Ranch Pokémon Nursery — Own Tempo Rockruff line'],
        prerequisites: [{ type: 'external-parent', entityKey: 'pokemon:744:base', note: 'Requires an Own Tempo Rockruff parent/setup, then hatch a shiny Own Tempo Rockruff and evolve it at dusk.' }],
        explanation: `${current.displayName} is tracked separately and requires the Own Tempo Rockruff evolution condition introduced for Ultra Sun/Ultra Moon.`,
      }) : unavailable(key, gameId, `${current.displayName} is not available in Sun/Moon because the Dusk form/Own Tempo route is Ultra Sun/Ultra Moon-era.`);
    }
    const midday = key === 'pokemon:745:base';
    const native = midday ? ['sun', 'ultrasun'].includes(gameId) : ['moon', 'ultramoon'].includes(gameId);
    return route({
      id: `${key}:${gameId}:gen7-coverage-lycanroc-${native ? 'native' : 'external-version'}` as HuntRouteId,
      targetEntityKey: key,
      gameId,
      method: native ? 'evolution-from-hunted-shiny' : 'breeding-and-evolution',
      huntingMethodId: native ? 'gen7-random' : 'gen7-egg-hatching',
      access: native ? 'same-save-evolution' : 'external-parent-breeding-evolution',
      recommendation: native ? 'eligible-native' : 'eligible-with-external-setup',
      directEncounter: false,
      eggResultEntityKey: native ? undefined : 'pokemon:744:base',
      evolveFromEntityKey: 'pokemon:744:base',
      locations: [native ? 'Rockruff evolution line — version/time form' : 'Paniola Ranch Pokémon Nursery — version form parent'],
      prerequisites: [{ type: native ? 'evolve-shiny' : 'external-parent', entityKey: 'pokemon:744:base', note: native ? `Hunt shiny Rockruff and evolve it into ${current.displayName} under this version's evolution condition.` : `Use a compatible Rockruff/Lycanroc parent setup for ${current.displayName}'s form condition.` }],
      explanation: `${current.displayName} is a separate Lycanroc form; Sun/Ultra Sun produce Midday natively and Moon/Ultra Moon produce Midnight natively.`,
    });
  }

  if (speciesId === 741 || speciesId === 774) {
    return route({
      id: `${key}:${gameId}:gen7-coverage-form-random` as HuntRouteId,
      targetEntityKey: key,
      gameId,
      method: 'wild-random-encounter',
      huntingMethodId: 'gen7-random',
      access: 'native',
      recommendation: 'eligible-native',
      directEncounter: true,
      locations: [speciesId === 741 ? 'Alola island-specific Oricorio encounter/form source' : 'Alola Minior wild encounter — color/form tracked separately'],
      prerequisites: speciesId === 774 ? [{ type: 'game-progression', note: 'Track the Minior meteor/core color as its own form entry; the shiny roll belongs to the encountered Minior.' }] : [],
      explanation: `${current.displayName} is handled as its own Generation VII form instead of collapsing to the base species.`,
    });
  }

  const previous = familyPrevious.get(speciesId);
  if (previous) {
    return route({
      id: `${key}:${gameId}:gen7-coverage-family-evolution` as HuntRouteId,
      targetEntityKey: key,
      gameId,
      method: 'evolution-from-hunted-shiny',
      huntingMethodId: 'gen7-random',
      access: 'same-save-evolution',
      recommendation: 'eligible-native',
      directEncounter: false,
      evolveFromEntityKey: keyFor(previous),
      locations: ['Alola evolution line'],
      prerequisites: [{ type: 'evolve-shiny', entityKey: keyFor(previous), note: `Hunt or hatch shiny ${entity(keyFor(previous)).displayName}, then evolve it into ${current.displayName}.` }],
      explanation: `${current.displayName} is obtained by evolving a shiny member of its Alola family in ${gameId}.`,
    });
  }

  const available = getCuratedShinyOriginGameIds(speciesId, current.canonicalName)?.includes(gameId) ?? false;
  if (!available) return unavailable(key, gameId, `${current.displayName} is not listed as an own-origin shiny route in ${gameId}.`);

  return route({
    id: `${key}:${gameId}:gen7-coverage-random` as HuntRouteId,
    targetEntityKey: key,
    gameId,
    method: 'wild-random-encounter',
    huntingMethodId: 'gen7-random',
    access: 'native',
    recommendation: 'eligible-native',
    directEncounter: true,
    locations: ['Documented Alola encounter'],
    prerequisites: [],
    explanation: `${current.displayName} is covered as a Generation VII random encounter; Surf/water movement remains part of Random Encounter rather than a separate method.`,
  });
}

function gen7AdditionalBreedingRoute(key: PokemonEntityKey, gameId: TrackedGameId, masuda: boolean): PokemonHuntRoute | null {
  const current = entity(key);
  if (!['sun', 'moon', 'ultrasun', 'ultramoon'].includes(gameId)) return null;
  if (postGen7FormKeys.has(key) || noEggSpecies.has(current.speciesId)) return null;
  if (current.speciesId === 745 && key === 'pokemon:745:lycanroc-dusk' && !['ultrasun', 'ultramoon'].includes(gameId)) return null;
  const huntingMethodId = masuda ? 'gen7-masuda' : 'gen7-egg-hatching';
  const idSuffix = masuda ? 'masuda' : 'egg-hatching';
  const previous = familyPrevious.get(current.speciesId);
  const isFormChange = current.speciesId === 741 && key !== 'pokemon:741:base';
  const isEvolution = Boolean(previous) && !isFormChange;
  const eggKey = isEvolution ? keyFor(previous!) : current.speciesId === 745 ? 'pokemon:744:base' as PokemonEntityKey : key;
  return route({
    id: `${key}:${gameId}:gen7-additional-${idSuffix}` as HuntRouteId,
    targetEntityKey: key,
    gameId,
    method: isEvolution ? 'breeding-and-evolution' : 'breeding',
    huntingMethodId,
    access: current.speciesId === 745 && key === 'pokemon:745:lycanroc-dusk' ? 'external-parent-breeding-evolution' : isEvolution ? 'external-parent-breeding-evolution' : 'external-parent-breeding',
    recommendation: current.speciesId === 745 && key === 'pokemon:745:lycanroc-dusk' ? 'eligible-with-external-setup' : 'eligible-with-external-setup',
    directEncounter: false,
    eggResultEntityKey: isFormChange ? 'pokemon:741:base' : eggKey,
    evolveFromEntityKey: isEvolution ? keyFor(previous!) : undefined,
    locations: ['Paniola Ranch Pokémon Nursery'],
    prerequisites: [
      {
        type: 'external-parent',
        entityKey: isFormChange ? 'pokemon:741:base' : eggKey,
        note: masuda
          ? 'Use two compatible parents with different language origins for Masuda Method breeding in Generation VII.'
          : 'Use compatible parents to hatch this shiny line in Generation VII.',
      },
      ...(isEvolution ? [{ type: 'evolve-shiny' as const, entityKey: eggKey, note: `Hatch shiny ${entity(eggKey).displayName}, then evolve it into ${current.displayName}.` }] : []),
      ...(isFormChange ? [{ type: 'change-form' as const, entityKey: 'pokemon:741:base' as PokemonEntityKey, note: `Hatch shiny Oricorio, then use the matching Nectar to obtain ${current.displayName}.` }] : []),
    ],
    explanation: `${current.displayName} has a Generation VII ${masuda ? 'Masuda Method' : 'Breeding'} route when compatible parents are available; evolutions and form states are tracked separately from the egg species.`,
  });
}

function shouldSkipSupplementalEntity(key: PokemonEntityKey) {
  const current = entity(key);
  if (current.generationIntroduced > 7) return true;
  if (current.completionPolicy === 'informational') return true;
  if (current.kind === 'battle-only' || current.kind === 'temporary' || current.kind === 'fusion') return true;
  if (postGen7FormKeys.has(key)) return true;
  return false;
}

function supplementalEggOriginKey(key: PokemonEntityKey): PokemonEntityKey {
  const current = entity(key);
  if (current.formKey.includes('alola')) {
    let root = key;
    while (alolaEvolvesFrom.has(root)) root = alolaEvolvesFrom.get(root)!;
    return root;
  }
  if (current.formKey !== 'base') return key;
  return keyFor(rootSpeciesId(current.speciesId));
}

function gen7SupplementalBreedingRoute(key: PokemonEntityKey, gameId: TrackedGameId, masuda: boolean): PokemonHuntRoute | null {
  const current = entity(key);
  if (!alolaMainGames.includes(gameId as (typeof alolaMainGames)[number])) return null;
  if (shouldSkipSupplementalEntity(key) || noEggSpecies.has(current.speciesId)) return null;
  const eggKey = supplementalEggOriginKey(key);
  const isEvolution = eggKey !== key;
  const huntingMethodId = masuda ? 'gen7-masuda' : 'gen7-egg-hatching';
  return route({
    id: `${key}:${gameId}:gen7-supplemental-${masuda ? 'masuda' : 'egg-hatching'}` as HuntRouteId,
    targetEntityKey: key,
    gameId,
    method: isEvolution ? 'breeding-and-evolution' : 'breeding',
    huntingMethodId,
    access: isEvolution ? 'external-parent-breeding-evolution' : 'external-parent-breeding',
    recommendation: 'eligible-with-external-setup',
    directEncounter: false,
    eggResultEntityKey: eggKey,
    evolveFromEntityKey: isEvolution ? eggKey : undefined,
    locations: ['Paniola Ranch Pokémon Nursery'],
    prerequisites: [
      {
        type: 'external-parent',
        entityKey: eggKey,
        note: masuda
          ? 'Use two compatible parents with different language origins for Masuda Method breeding in Generation VII.'
          : 'Use compatible parents or a transferred compatible parent to hatch this shiny line in Generation VII.',
      },
      ...(isEvolution ? [{ type: 'evolve-shiny' as const, entityKey: eggKey, note: `Hatch shiny ${entity(eggKey).displayName}, then evolve or form-preserve it into ${current.displayName}.` }] : []),
    ],
    explanation: `${current.displayName} has no more specific eligible Gen 7 route in the current matrix for ${gameId}; this supplemental route records its Generation VII ${masuda ? 'Masuda Method' : 'Breeding'} availability when compatible parents are available.`,
  });
}

function gen7SupplementalWormholeRoute(key: PokemonEntityKey, gameId: TrackedGameId): PokemonHuntRoute | null {
  const current = entity(key);
  if (!['ultrasun', 'ultramoon'].includes(gameId)) return null;
  if (notOwnOtSpecies.has(current.speciesId) || eventOnlySpecies.has(current.speciesId)) return null;
  if (!noEggSpecies.has(current.speciesId)) return null;
  if (current.generationIntroduced > 7 || current.completionPolicy === 'informational') return null;
  const isFormChange = ['pokemon:641:therian', 'pokemon:642:therian', 'pokemon:645:therian'].includes(key);
  const originKey = isFormChange ? key.replace(':therian', ':incarnate') as PokemonEntityKey : key;
  return route({
    id: `${key}:${gameId}:gen7-supplemental-wormhole${isFormChange ? '-form-change' : ''}` as HuntRouteId,
    targetEntityKey: key,
    gameId,
    method: isFormChange ? 'form-change-from-hunted-shiny' : 'static-encounter',
    huntingMethodId: 'gen7-wormhole',
    access: isFormChange ? 'same-save-form-change' : 'native',
    recommendation: 'eligible-native',
    directEncounter: false,
    locations: [isFormChange ? 'Reveal Glass form change from Ultra Wormhole origin' : 'Ultra Wormhole / Ultra Space Wilds'],
    prerequisites: isFormChange
      ? [{ type: 'change-form', entityKey: originKey, note: `Catch shiny ${entity(originKey).displayName} from Ultra Wormhole, then use Reveal Glass for ${current.displayName}.` }]
      : [{ type: 'game-progression', note: 'Use the correct Ultra Wormhole/Ultra Space destination and soft reset before the encounter.' }],
    explanation: `${current.displayName} is covered as a Generation VII Ultra Wormhole shiny route in ${gameId}.`,
  });
}

export function buildGen7SupplementalAllGamesRoutes(existingRoutes: readonly PokemonHuntRoute[]): PokemonHuntRoute[] {
  const hasEligibleRoute = new Set(existingRoutes
    .filter((route) => route.recommendation !== 'not-eligible')
    .map((route) => `${route.targetEntityKey}:${route.gameId}`));
  const additions: PokemonHuntRoute[] = [];
  for (const current of POKEMON_CATALOG_V2) {
    if (shouldSkipSupplementalEntity(current.key)) continue;
    const availability = getCuratedShinyOriginGameIds(current.speciesId, current.canonicalName);
    if (!availability) continue;
    for (const gameId of alolaMainGames) {
      if (!availability.includes(gameId)) continue;
      if (hasEligibleRoute.has(`${current.key}:${gameId}`)) continue;
      const breeding = gen7SupplementalBreedingRoute(current.key, gameId, false);
      const masuda = gen7SupplementalBreedingRoute(current.key, gameId, true);
      const wormhole = gen7SupplementalWormholeRoute(current.key, gameId);
      if (breeding) additions.push(breeding);
      if (masuda) additions.push(masuda);
      if (wormhole) additions.push(wormhole);
    }
  }
  return additions;
}

function gen7AdditionalFishingRoute(key: PokemonEntityKey, gameId: TrackedGameId): PokemonHuntRoute | null {
  const current = entity(key);
  if (!['sun', 'moon', 'ultrasun', 'ultramoon'].includes(gameId) || !fishingSpecies.has(current.speciesId) || key !== keyFor(current.speciesId)) return null;
  return route({
    id: `${key}:${gameId}:gen7-additional-fishing` as HuntRouteId,
    targetEntityKey: key,
    gameId,
    method: 'wild-random-encounter',
    huntingMethodId: 'gen7-fishing',
    access: 'native',
    recommendation: 'eligible-native',
    directEncounter: true,
    locations: ['Documented Alola fishing encounter'],
    prerequisites: [],
    explanation: `${current.displayName} is available from Generation VII fishing tables and must be selectable separately from ordinary Random Encounter.`,
  });
}

function gen7AdditionalSosRoute(key: PokemonEntityKey, gameId: TrackedGameId): PokemonHuntRoute | null {
  const current = entity(key);
  if (!['sun', 'moon', 'ultrasun', 'ultramoon'].includes(gameId)) return null;
  if (key !== keyFor(current.speciesId)) return null;
  if (noEggSpecies.has(current.speciesId) || starterRoots.has(current.speciesId) || familyPrevious.has(current.speciesId)) return null;
  if ([772, 773, 774, 775, 781].includes(current.speciesId)) return null;
  const baseRoute = gen7EntityRoute(key, gameId);
  if (baseRoute.recommendation !== 'eligible-native' || baseRoute.method !== 'wild-random-encounter') return null;
  return route({
    id: `${key}:${gameId}:gen7-additional-sos` as HuntRouteId,
    targetEntityKey: key,
    gameId,
    method: 'wild-random-encounter',
    huntingMethodId: 'gen7-sos',
    access: 'native',
    recommendation: 'eligible-native',
    directEncounter: true,
    locations: [sosOnlySpecies.has(current.speciesId) ? 'SOS ally call encounter' : 'Alola SOS Battle chain'],
    prerequisites: [{ type: 'game-progression', note: sosOnlySpecies.has(current.speciesId) ? 'Encounter the caller species and chain SOS ally calls for this target.' : 'Use Adrenaline Orb/SOS mechanics to chain ally calls.' }],
    explanation: `${current.displayName} is available through Generation VII SOS chaining and is selectable separately from ordinary Random Encounter.`,
  });
}

const gen7Entities = POKEMON_CATALOG_V2
  .filter((entry) => entry.speciesId >= 722 && entry.speciesId <= 809)
  .map((entry) => entry.key);

const alolaFormEntities = POKEMON_CATALOG_V2
  .filter((entry) => entry.formKey.includes('alola'))
  .map((entry) => entry.key);

export const GEN7_HUNT_COVERAGE_ROUTES: PokemonHuntRoute[] = [
  ...gen7Entities.flatMap((key) => gen7Games.map((gameId) => gen7EntityRoute(key, gameId))),
  ...alolaFormEntities.flatMap((key) => gen7Games.map((gameId) => normalAlolaRoute(key, gameId))),
  ...gen7Entities.flatMap((key) => alolaMainGames.flatMap((gameId) => [
    gen7AdditionalBreedingRoute(key, gameId, false),
    gen7AdditionalBreedingRoute(key, gameId, true),
    gen7AdditionalFishingRoute(key, gameId),
    gen7AdditionalSosRoute(key, gameId),
  ])).filter((item): item is PokemonHuntRoute => Boolean(item)),
  ...alolaFormEntities.flatMap((key) => alolaMainGames.flatMap((gameId) => [
    gen7AdditionalBreedingRoute(key, gameId, false),
    gen7AdditionalBreedingRoute(key, gameId, true),
  ])).filter((item): item is PokemonHuntRoute => Boolean(item)),
];
