import type { PokemonEntityKey } from './pokemon-catalog-v2';
import { POKEMON_CATALOG_V2_BY_KEY } from './pokemon-catalog-v2.registry';
import { TRACKED_GAME_IDS, type TrackedGameId } from './pokemon-game-availability';
import type { HuntRouteId, HuntRoutePrerequisite, HuntRouteSource, PokemonHuntRoute } from './pokemon-hunt-routes-v2';

/** Per-form decisions for Unown B-Z, ! and ?. Unown A is pokemon:201:base. */
const verifiedAt = '2026-08-21';
const alphabet = 'BCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

interface UnownFormDefinition {
  symbol: string;
  formKey: string;
  entityKey: PokemonEntityKey;
  introducedGeneration: 2 | 3;
}

const forms: UnownFormDefinition[] = [
  ...alphabet.map((symbol) => ({
    symbol,
    formKey: `unown-${symbol.toLowerCase()}`,
    entityKey: `pokemon:201:unown-${symbol.toLowerCase()}` as PokemonEntityKey,
    introducedGeneration: 2 as const,
  })),
  { symbol: '!', formKey: 'unown-exclamation', entityKey: 'pokemon:201:unown-exclamation', introducedGeneration: 3 },
  { symbol: '?', formKey: 'unown-question', entityKey: 'pokemon:201:unown-question', introducedGeneration: 3 },
];

const originGames = new Set<TrackedGameId>([
  'gold', 'silver', 'crystal',
  'firered', 'leafgreen',
  'diamond', 'pearl', 'platinum', 'heartgold', 'soulsilver',
  'omegaruby', 'alphasapphire',
  'brilliantdiamond', 'shiningpearl', 'pla',
]);
const generation2Games = new Set<TrackedGameId>(['gold', 'silver', 'crystal']);
const punctuationUnlockGames = new Set<TrackedGameId>(['diamond', 'pearl', 'platinum', 'heartgold', 'soulsilver', 'brilliantdiamond', 'shiningpearl']);

const frlgChamberBySymbol: Record<string, string> = {
  A: 'Monean Chamber', '?': 'Monean Chamber',
  C: 'Liptoo Chamber', D: 'Liptoo Chamber', H: 'Liptoo Chamber', O: 'Liptoo Chamber', U: 'Liptoo Chamber',
  E: 'Weepth Chamber', I: 'Weepth Chamber', N: 'Weepth Chamber', S: 'Weepth Chamber',
  J: 'Dilford Chamber', L: 'Dilford Chamber', P: 'Dilford Chamber', Q: 'Dilford Chamber', R: 'Dilford Chamber',
  F: 'Scufib Chamber', G: 'Scufib Chamber', K: 'Scufib Chamber', T: 'Scufib Chamber', Y: 'Scufib Chamber',
  B: 'Rixy Chamber', M: 'Rixy Chamber', V: 'Rixy Chamber', W: 'Rixy Chamber', X: 'Rixy Chamber',
  Z: 'Viapois Chamber', '!': 'Viapois Chamber',
};

const sources: HuntRouteSource[] = [
  { provider: 'Serebii', url: 'https://www.serebii.net/red_green/unown.shtml', note: 'Documents the individual Unown forms and their Tanoby Chamber groups in FireRed and LeafGreen.' },
  { provider: 'Bulbapedia', url: 'https://bulbapedia.bulbagarden.net/wiki/Unown_(Pok%C3%A9mon)', note: 'Documents the 26 Generation II letter forms, the Generation III punctuation forms, and Generation II shiny-form restrictions.' },
  { provider: 'Pokémon Central Wiki', url: 'https://wiki.pokemoncentral.it/Unown', note: 'Pokémon Central Wiki cross-checks Unown availability in Oro, Argento and Cristallo.' },
];

function huntingMethodId(gameId: TrackedGameId): string {
  if (generation2Games.has(gameId)) return 'gen2-random';
  if (gameId === 'firered' || gameId === 'leafgreen') return 'gen3-random';
  if (['diamond', 'pearl', 'platinum', 'heartgold', 'soulsilver'].includes(gameId)) return 'gen4-random';
  if (gameId === 'omegaruby' || gameId === 'alphasapphire') return 'gen6-random';
  if (gameId === 'pla') return 'pla-random';
  return 'gen8-random';
}

function locationFor(form: UnownFormDefinition, gameId: TrackedGameId): string {
  if (generation2Games.has(gameId) || gameId === 'heartgold' || gameId === 'soulsilver') return 'Ruins of Alph';
  if (gameId === 'firered' || gameId === 'leafgreen') return `Tanoby Ruins — ${frlgChamberBySymbol[form.symbol]}`;
  if (['diamond', 'pearl', 'platinum', 'brilliantdiamond', 'shiningpearl'].includes(gameId)) {
    return form.introducedGeneration === 3 ? 'Solaceon Ruins — Ruin Maniac Tunnel hidden chamber' : 'Solaceon Ruins';
  }
  if (gameId === 'omegaruby' || gameId === 'alphasapphire') return 'Mirage Cave south of Route 107';
  return 'Solaceon Ruins — repeatable post-research spawns';
}

function unavailable(form: UnownFormDefinition, gameId: TrackedGameId, reason?: string): PokemonHuntRoute {
  return {
    id: `${form.entityKey}:${gameId}:unown-coverage-unobtainable` as HuntRouteId,
    targetEntityKey: form.entityKey, gameId, method: 'unavailable', huntingMethodId: 'custom',
    access: 'unobtainable', recommendation: 'not-eligible', directEncounter: false,
    locations: [], prerequisites: [],
    explanation: reason || `Unown ${form.symbol} has no shiny origin in ${gameId}; transfer-only ownership is excluded.`,
    sources, verifiedAt,
  };
}

function generation2Locked(form: UnownFormDefinition, gameId: TrackedGameId): PokemonHuntRoute {
  return {
    id: `${form.entityKey}:${gameId}:unown-coverage-shiny-locked-dvs` as HuntRouteId,
    targetEntityKey: form.entityKey, gameId, method: 'unavailable', huntingMethodId: 'custom',
    access: 'shiny-locked', recommendation: 'not-eligible', directEncounter: false,
    locations: ['Ruins of Alph'], prerequisites: [],
    explanation: `Unown ${form.symbol} exists in Generation II, but cannot be shiny: form and shininess both depend on DVs, and only forms I and V have shiny-compatible DV combinations.`,
    sources, verifiedAt,
  };
}

function native(form: UnownFormDefinition, gameId: TrackedGameId): PokemonHuntRoute {
  const prerequisites: HuntRoutePrerequisite[] = [];
  if (gameId === 'firered' || gameId === 'leafgreen') {
    prerequisites.push({ type: 'game-progression', note: 'Complete the Tanoby Key puzzle to make Unown appear in the Tanoby Chambers.' });
  }
  if (form.introducedGeneration === 3 && punctuationUnlockGames.has(gameId)) {
    prerequisites.push({ type: 'game-progression', note: 'Register or catch all 26 alphabetic Unown forms to unlock the punctuation-form chamber.' });
  }
  if (gameId === 'pla') {
    prerequisites.push({ type: 'game-progression', note: 'Catch all 28 fixed, shiny-locked Unown first; only the repeatable Solaceon Ruins spawns can be shiny.' });
  }
  return {
    id: `${form.entityKey}:${gameId}:unown-coverage-native` as HuntRouteId,
    targetEntityKey: form.entityKey, gameId, method: 'wild-random-encounter', huntingMethodId: huntingMethodId(gameId),
    access: 'native', recommendation: 'eligible-native', directEncounter: true,
    locations: [locationFor(form, gameId)], prerequisites,
    explanation: gameId === 'pla'
      ? `Hunt Unown ${form.symbol} only among the repeatable Solaceon Ruins spawns; its fixed overworld specimen is shiny locked.`
      : `Unown ${form.symbol} is a native, individually tracked wild form in ${gameId}.`,
    sources: gameId === 'pla'
      ? [...sources, { provider: 'Serebii', url: 'https://www.serebii.net/legendsarceus/unownlocations.shtml', note: 'Separates the 28 fixed shiny-locked Unown from repeatable post-completion spawns.' }]
      : sources,
    verifiedAt,
  };
}

function buildRoute(form: UnownFormDefinition, gameId: TrackedGameId): PokemonHuntRoute {
  if (generation2Games.has(gameId)) {
    if (form.introducedGeneration === 3) {
      return unavailable(form, gameId, `Unown ${form.symbol} did not exist in Generation II; the ! and ? forms were introduced in Generation III.`);
    }
    if (form.symbol !== 'I' && form.symbol !== 'V') return generation2Locked(form, gameId);
    return native(form, gameId);
  }
  if (!originGames.has(gameId)) return unavailable(form, gameId);
  return native(form, gameId);
}

for (const form of forms) {
  if (!POKEMON_CATALOG_V2_BY_KEY.has(form.entityKey)) throw new Error(`Missing Unown catalog entity ${form.entityKey}`);
}

export const UNOWN_FORM_HUNT_COVERAGE_ROUTES: PokemonHuntRoute[] = forms.flatMap((form) =>
  TRACKED_GAME_IDS.map((gameId) => buildRoute(form, gameId)),
);
