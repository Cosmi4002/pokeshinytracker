import type { PokemonEntityKey } from './pokemon-catalog-v2';
import { POKEMON_CATALOG_V2_BY_KEY } from './pokemon-catalog-v2.registry';
import { HUNTING_METHODS } from './pokemon-data';
import { TRACKED_GAME_IDS, type TrackedGameId } from './pokemon-game-availability';
import {
  GEN1_REMAINING_HUNT_COVERAGE_ROUTES,
  getGen1FamilyPosition,
  getGen1FamilyRootEntityKey,
} from './pokemon-hunt-routes-v2.gen1';
import { GEN1_ADDITIONAL_METHOD_ROUTES } from './pokemon-hunt-routes-v2.gen1-methods';
import { GEN2_HUNT_COVERAGE_ROUTES } from './pokemon-hunt-routes-v2.gen2';
import { UNOWN_FORM_HUNT_COVERAGE_ROUTES } from './pokemon-hunt-routes-v2.unown';
import { GEN3_HUNT_COVERAGE_ROUTES } from './pokemon-hunt-routes-v2.gen3';
import { GEN4_HUNT_COVERAGE_ROUTES } from './pokemon-hunt-routes-v2.gen4';
import { GEN5_FORM_HUNT_COVERAGE_ROUTES } from './pokemon-hunt-routes-v2.gen5-forms';
import { GEN6_HUNT_COVERAGE_ROUTES, buildGen6SupplementalAllGamesRoutes } from './pokemon-hunt-routes-v2.gen6';
import { GEN7_HUNT_COVERAGE_ROUTES, buildGen7SupplementalAllGamesRoutes } from './pokemon-hunt-routes-v2.gen7';
import { NATIVE_ENCOUNTER_HUNT_ROUTES } from './pokemon-hunt-routes-v2.encounters';
import { BDSP_POKE_RADAR_HUNT_ROUTES } from './pokemon-hunt-routes-v2.bdsp';
import {
  PLA_MASS_OUTBREAK_HUNT_ROUTES,
  PLA_MASSIVE_MASS_OUTBREAK_HUNT_ROUTES,
} from './pokemon-hunt-routes-v2.pla';
import { SV_MASS_OUTBREAK_HUNT_ROUTES } from './pokemon-hunt-routes-v2.sv';

export type HuntRouteId = `${PokemonEntityKey}:${TrackedGameId}:${string}`;

export type HuntRouteAccess =
  | 'native'
  | 'same-save-evolution'
  | 'same-save-form-change'
  | 'external-parent-breeding'
  | 'external-parent-breeding-evolution'
  | 'external-game-feature'
  | 'trade-only'
  | 'transfer-only'
  | 'event-only'
  | 'unobtainable'
  | 'shiny-locked';

export type HuntRouteMethod =
  | 'wild-random-encounter'
  | 'roaming-encounter'
  | 'static-encounter'
  | 'fixed-shiny-encounter'
  | 'unavailable'
  | 'poke-radar'
  | 'soft-reset-gift'
  | 'gift-pokemon'
  | 'gift-egg'
  | 'npc-trade'
  | 'breeding'
  | 'breeding-and-evolution'
  | 'evolution-from-hunted-shiny'
  | 'form-change-from-hunted-shiny';

export type HuntRouteRecommendation = 'eligible-native' | 'eligible-with-external-setup' | 'not-eligible';

export interface HuntRouteSource {
  provider: 'Serebii' | 'Bulbapedia' | 'Pokémon Central Wiki';
  url: string;
  note: string;
}

export interface HuntRoutePrerequisite {
  type: 'starter-choice' | 'external-parent' | 'external-game-feature' | 'evolve-shiny' | 'change-form' | 'game-progression' | 'dlc-access';
  entityKey?: PokemonEntityKey;
  sourceGameIds?: TrackedGameId[];
  note: string;
}

export interface PokemonHuntRoute {
  id: HuntRouteId;
  targetEntityKey: PokemonEntityKey;
  gameId: TrackedGameId;
  method: HuntRouteMethod;
  huntingMethodId: string;
  access: HuntRouteAccess;
  recommendation: HuntRouteRecommendation;
  directEncounter: boolean;
  eggResultEntityKey?: PokemonEntityKey;
  evolveFromEntityKey?: PokemonEntityKey;
  locations: string[];
  prerequisites: HuntRoutePrerequisite[];
  explanation: string;
  targetChancePercent?: number;
  sources: HuntRouteSource[];
  verifiedAt: string;
}

const verifiedAt = '2026-08-21';

const GEN1_TRADE_EVOLUTION_TARGETS = new Set<PokemonEntityKey>([
  'pokemon:65:base',
  'pokemon:68:base',
  'pokemon:76:base',
  'pokemon:94:base',
]);

const GEN1_ZA_BABY_FAMILY_ORIGINS = new Map<PokemonEntityKey, {
  huntingMethodId: string;
  locations: string[];
}>([
  ['pokemon:25:base', { huntingMethodId: 'gen9-zone-bench-soft-reset', locations: ['Wild Zone 1 — Pichu origin'] }],
  ['pokemon:26:base', { huntingMethodId: 'gen9-zone-bench-soft-reset', locations: ['Wild Zone 1 — Pichu origin'] }],
  ['pokemon:35:base', { huntingMethodId: 'gen9-hyperspace', locations: ['Fairy-type Hyperspace Wild Zones — Cleffa origin'] }],
  ['pokemon:36:base', { huntingMethodId: 'gen9-hyperspace', locations: ['Fairy-type Hyperspace Wild Zones — Cleffa origin'] }],
  ['pokemon:39:base', { huntingMethodId: 'gen9-hyperspace', locations: ['Fairy-type Hyperspace Wild Zones — Igglybuff origin'] }],
  ['pokemon:40:base', { huntingMethodId: 'gen9-hyperspace', locations: ['Fairy-type Hyperspace Wild Zones — Igglybuff origin'] }],
]);

const gen2StarterFamilies = [
  { base: 152, middle: 153, final: 154, name: 'Chikorita', middleName: 'Bayleef', finalName: 'Meganium', url: 'https://www.serebii.net/pokedex-gs/152.shtml', wiki: 'https://bulbapedia.bulbagarden.net/wiki/Chikorita_(Pok%C3%A9mon)' },
  { base: 155, middle: 156, final: 157, name: 'Cyndaquil', middleName: 'Quilava', finalName: 'Typhlosion', url: 'https://www.serebii.net/pokedex-gs/155.shtml', wiki: 'https://bulbapedia.bulbagarden.net/wiki/Cyndaquil_(Pok%C3%A9mon)' },
  { base: 158, middle: 159, final: 160, name: 'Totodile', middleName: 'Croconaw', finalName: 'Feraligatr', url: 'https://www.serebii.net/pokedex-gs/158.shtml', wiki: 'https://bulbapedia.bulbagarden.net/wiki/Totodile_(Pok%C3%A9mon)' },
] as const;

const gen2Games: TrackedGameId[] = ['gold', 'silver', 'crystal'];
const gen3Games: TrackedGameId[] = ['ruby', 'sapphire', 'emerald', 'firered', 'leafgreen'];
const gen4Games: TrackedGameId[] = ['diamond', 'pearl', 'platinum', 'heartgold', 'soulsilver'];
const gen5Games: TrackedGameId[] = ['black', 'white', 'black2', 'white2'];
const gen6Games: TrackedGameId[] = ['x', 'y', 'omegaruby', 'alphasapphire'];

const gen2SpecialRoutes: PokemonHuntRoute[] = [
  {
    id: 'pokemon:130:base:gold:red-gyarados', targetEntityKey: 'pokemon:130:base', gameId: 'gold', method: 'static-encounter', huntingMethodId: 'static overworld game gift', access: 'native', recommendation: 'eligible-native', directEncounter: false,
    locations: ['Lake of Rage'], prerequisites: [], explanation: 'The Lake of Rage Gyarados is a guaranteed shiny static encounter in Gold; it is recorded separately from ordinary random encounters.',
    sources: [{ provider: 'Serebii', url: 'https://www.serebii.net/pokedex-gs/130.shtml', note: 'Serebii lists Gyarados at Lake of Rage in Gold.' }, { provider: 'Bulbapedia', url: 'https://bulbapedia.bulbagarden.net/wiki/Red_Gyarados', note: 'Bulbapedia documents the Lake of Rage Gyarados as the guaranteed shiny encounter.' }], verifiedAt,
  },
  {
    id: 'pokemon:130:base:silver:red-gyarados', targetEntityKey: 'pokemon:130:base', gameId: 'silver', method: 'static-encounter', huntingMethodId: 'static overworld game gift', access: 'native', recommendation: 'eligible-native', directEncounter: false,
    locations: ['Lake of Rage'], prerequisites: [], explanation: 'The Lake of Rage Gyarados is a guaranteed shiny static encounter in Silver; it is recorded separately from ordinary random encounters.',
    sources: [{ provider: 'Serebii', url: 'https://www.serebii.net/pokedex-gs/130.shtml', note: 'Serebii lists Gyarados at Lake of Rage in Silver.' }, { provider: 'Bulbapedia', url: 'https://bulbapedia.bulbagarden.net/wiki/Red_Gyarados', note: 'Bulbapedia documents the Lake of Rage Gyarados as the guaranteed shiny encounter.' }], verifiedAt,
  },
  {
    id: 'pokemon:130:base:crystal:red-gyarados', targetEntityKey: 'pokemon:130:base', gameId: 'crystal', method: 'static-encounter', huntingMethodId: 'static overworld game gift', access: 'native', recommendation: 'eligible-native', directEncounter: false,
    locations: ['Lake of Rage'], prerequisites: [], explanation: 'The Lake of Rage Gyarados is a guaranteed shiny static encounter in Crystal; it is recorded separately from ordinary random encounters.',
    sources: [{ provider: 'Serebii', url: 'https://www.serebii.net/pokedex-gs/130.shtml', note: 'Serebii lists Gyarados at Lake of Rage in Crystal.' }, { provider: 'Bulbapedia', url: 'https://bulbapedia.bulbagarden.net/wiki/Red_Gyarados', note: 'Bulbapedia documents the Lake of Rage Gyarados as the guaranteed shiny encounter.' }], verifiedAt,
  },
];

const gen2RoamingBeasts: PokemonHuntRoute[] = [
  { id: 'pokemon:243:base:gold:roaming-johto', targetEntityKey: 'pokemon:243:base', gameId: 'gold', method: 'roaming-encounter', huntingMethodId: 'gen2-roaming', access: 'native', recommendation: 'eligible-native', directEncounter: true, locations: ['Roaming Johto'], prerequisites: [], explanation: 'Raikou roams Johto in Gold and must be encountered as a roaming Pokémon; it is not a normal fixed or random route encounter.', sources: [{ provider: 'Serebii', url: 'https://www.serebii.net/pokedex-gs/243.shtml', note: 'Serebii lists Raikou in Gold as Roaming Johto.' }, { provider: 'Bulbapedia', url: 'https://bulbapedia.bulbagarden.net/wiki/Raikou_(Pok%C3%A9mon)', note: 'Bulbapedia documents Raikou as a roaming legendary in Generation II.' }], verifiedAt },
  { id: 'pokemon:244:base:gold:roaming-johto', targetEntityKey: 'pokemon:244:base', gameId: 'gold', method: 'roaming-encounter', huntingMethodId: 'gen2-roaming', access: 'native', recommendation: 'eligible-native', directEncounter: true, locations: ['Roaming Johto'], prerequisites: [], explanation: 'Entei roams Johto in Gold and must be encountered as a roaming Pokémon.', sources: [{ provider: 'Serebii', url: 'https://www.serebii.net/pokedex-gs/244.shtml', note: 'Serebii lists Entei in Gold as Roaming Johto.' }, { provider: 'Bulbapedia', url: 'https://bulbapedia.bulbagarden.net/wiki/Entei_(Pok%C3%A9mon)', note: 'Bulbapedia documents Entei as a roaming legendary in Generation II.' }], verifiedAt },
  { id: 'pokemon:245:base:gold:roaming-johto', targetEntityKey: 'pokemon:245:base', gameId: 'gold', method: 'roaming-encounter', huntingMethodId: 'gen2-roaming', access: 'native', recommendation: 'eligible-native', directEncounter: true, locations: ['Roaming Johto'], prerequisites: [], explanation: 'Suicune roams Johto in Gold and must be encountered as a roaming Pokémon.', sources: [{ provider: 'Serebii', url: 'https://www.serebii.net/pokedex-gs/245.shtml', note: 'Serebii lists Suicune in Gold as Roaming Johto.' }, { provider: 'Bulbapedia', url: 'https://bulbapedia.bulbagarden.net/wiki/Suicune_(Pok%C3%A9mon)', note: 'Bulbapedia documents Suicune as a roaming legendary in Generation II.' }], verifiedAt },
  { id: 'pokemon:243:base:silver:roaming-johto', targetEntityKey: 'pokemon:243:base', gameId: 'silver', method: 'roaming-encounter', huntingMethodId: 'gen2-roaming', access: 'native', recommendation: 'eligible-native', directEncounter: true, locations: ['Roaming Johto'], prerequisites: [], explanation: 'Raikou roams Johto in Silver and must be encountered as a roaming Pokémon.', sources: [{ provider: 'Serebii', url: 'https://www.serebii.net/pokedex-gs/243.shtml', note: 'Serebii lists Raikou in Silver as Roaming Johto.' }, { provider: 'Bulbapedia', url: 'https://bulbapedia.bulbagarden.net/wiki/Raikou_(Pok%C3%A9mon)', note: 'Bulbapedia documents Raikou as a roaming legendary in Generation II.' }], verifiedAt },
  { id: 'pokemon:244:base:silver:roaming-johto', targetEntityKey: 'pokemon:244:base', gameId: 'silver', method: 'roaming-encounter', huntingMethodId: 'gen2-roaming', access: 'native', recommendation: 'eligible-native', directEncounter: true, locations: ['Roaming Johto'], prerequisites: [], explanation: 'Entei roams Johto in Silver and must be encountered as a roaming Pokémon.', sources: [{ provider: 'Serebii', url: 'https://www.serebii.net/pokedex-gs/244.shtml', note: 'Serebii lists Entei in Silver as Roaming Johto.' }, { provider: 'Bulbapedia', url: 'https://bulbapedia.bulbagarden.net/wiki/Entei_(Pok%C3%A9mon)', note: 'Bulbapedia documents Entei as a roaming legendary in Generation II.' }], verifiedAt },
  { id: 'pokemon:245:base:silver:roaming-johto', targetEntityKey: 'pokemon:245:base', gameId: 'silver', method: 'roaming-encounter', huntingMethodId: 'gen2-roaming', access: 'native', recommendation: 'eligible-native', directEncounter: true, locations: ['Roaming Johto'], prerequisites: [], explanation: 'Suicune roams Johto in Silver and must be encountered as a roaming Pokémon.', sources: [{ provider: 'Serebii', url: 'https://www.serebii.net/pokedex-gs/245.shtml', note: 'Serebii lists Suicune in Silver as Roaming Johto.' }, { provider: 'Bulbapedia', url: 'https://bulbapedia.bulbagarden.net/wiki/Suicune_(Pok%C3%A9mon)', note: 'Bulbapedia documents Suicune as a roaming legendary in Generation II.' }], verifiedAt },
  { id: 'pokemon:243:base:crystal:roaming-johto', targetEntityKey: 'pokemon:243:base', gameId: 'crystal', method: 'roaming-encounter', huntingMethodId: 'gen2-roaming', access: 'native', recommendation: 'eligible-native', directEncounter: true, locations: ['Roaming Johto'], prerequisites: [], explanation: 'Raikou roams Johto in Crystal and must be encountered as a roaming Pokémon.', sources: [{ provider: 'Serebii', url: 'https://www.serebii.net/pokedex-gs/243.shtml', note: 'Serebii lists Raikou in Crystal as Roaming Johto.' }, { provider: 'Bulbapedia', url: 'https://bulbapedia.bulbagarden.net/wiki/Raikou_(Pok%C3%A9mon)', note: 'Bulbapedia documents Raikou as a roaming legendary in Generation II.' }], verifiedAt },
  { id: 'pokemon:244:base:crystal:roaming-johto', targetEntityKey: 'pokemon:244:base', gameId: 'crystal', method: 'roaming-encounter', huntingMethodId: 'gen2-roaming', access: 'native', recommendation: 'eligible-native', directEncounter: true, locations: ['Roaming Johto'], prerequisites: [], explanation: 'Entei roams Johto in Crystal and must be encountered as a roaming Pokémon.', sources: [{ provider: 'Serebii', url: 'https://www.serebii.net/pokedex-gs/244.shtml', note: 'Serebii lists Entei in Crystal as Roaming Johto.' }, { provider: 'Bulbapedia', url: 'https://bulbapedia.bulbagarden.net/wiki/Entei_(Pok%C3%A9mon)', note: 'Bulbapedia documents Entei as a roaming legendary in Generation II.' }], verifiedAt },
  { id: 'pokemon:245:base:crystal:tin-tower', targetEntityKey: 'pokemon:245:base', gameId: 'crystal', method: 'static-encounter', huntingMethodId: 'gen2-soft-reset', access: 'native', recommendation: 'eligible-native', directEncounter: false, locations: ['Tin Tower'], prerequisites: [], explanation: 'Suicune is encountered in a fixed battle at the Tin Tower in Crystal and is shiny hunted by soft resetting; its earlier overworld appearances are story events, not roaming battles.', sources: [{ provider: 'Serebii', url: 'https://www.serebii.net/pokedex-gs/245.shtml', note: 'Serebii lists Suicune in Crystal at Tin Tower, while Gold and Silver list Roaming Johto.' }, { provider: 'Bulbapedia', url: 'https://bulbapedia.bulbagarden.net/wiki/Suicune_(Pok%C3%A9mon)', note: 'Bulbapedia documents the Crystal overworld appearances followed by the battle in Tin Tower.' }], verifiedAt },
];

const gen2LegendaryStatics: PokemonHuntRoute[] = [
  { id: 'pokemon:249:base:gold:whirl-islands', targetEntityKey: 'pokemon:249:base', gameId: 'gold', method: 'static-encounter', huntingMethodId: 'gen2-soft-reset', access: 'native', recommendation: 'eligible-native', directEncounter: false, locations: ['Whirl Islands'], prerequisites: [], explanation: 'Lugia is a single static encounter hunted by soft resetting in the Whirl Islands in Gold.', sources: [{ provider: 'Serebii', url: 'https://www.serebii.net/pokedex-gs/249.shtml', note: 'Serebii lists Lugia in Gold at Whirl Islands.' }, { provider: 'Bulbapedia', url: 'https://bulbapedia.bulbagarden.net/wiki/Lugia_(Pok%C3%A9mon)', note: 'Bulbapedia lists the Generation II Gold Whirl Islands encounter.' }], verifiedAt },
  { id: 'pokemon:249:base:silver:whirl-islands', targetEntityKey: 'pokemon:249:base', gameId: 'silver', method: 'static-encounter', huntingMethodId: 'gen2-soft-reset', access: 'native', recommendation: 'eligible-native', directEncounter: false, locations: ['Whirl Islands'], prerequisites: [], explanation: 'Lugia is a single static encounter hunted by soft resetting in the Whirl Islands in Silver.', sources: [{ provider: 'Serebii', url: 'https://www.serebii.net/pokedex-gs/249.shtml', note: 'Serebii lists Lugia in Silver at Whirl Islands.' }, { provider: 'Bulbapedia', url: 'https://bulbapedia.bulbagarden.net/wiki/Lugia_(Pok%C3%A9mon)', note: 'Bulbapedia lists the Generation II Silver Whirl Islands encounter.' }], verifiedAt },
  { id: 'pokemon:249:base:crystal:whirl-islands', targetEntityKey: 'pokemon:249:base', gameId: 'crystal', method: 'static-encounter', huntingMethodId: 'gen2-soft-reset', access: 'native', recommendation: 'eligible-native', directEncounter: false, locations: ['Whirl Islands'], prerequisites: [], explanation: 'Lugia is a single static encounter hunted by soft resetting in the Whirl Islands in Crystal.', sources: [{ provider: 'Serebii', url: 'https://www.serebii.net/pokedex-gs/249.shtml', note: 'Serebii lists Lugia in Crystal at Whirl Islands.' }, { provider: 'Bulbapedia', url: 'https://bulbapedia.bulbagarden.net/wiki/Lugia_(Pok%C3%A9mon)', note: 'Bulbapedia lists the Generation II Crystal Whirl Islands encounter.' }], verifiedAt },
  { id: 'pokemon:250:base:gold:tin-tower', targetEntityKey: 'pokemon:250:base', gameId: 'gold', method: 'static-encounter', huntingMethodId: 'gen2-soft-reset', access: 'native', recommendation: 'eligible-native', directEncounter: false, locations: ['Tin Tower'], prerequisites: [], explanation: 'Ho-Oh is a single static encounter hunted by soft resetting in the Tin Tower in Gold.', sources: [{ provider: 'Serebii', url: 'https://www.serebii.net/pokedex-gs/250.shtml', note: 'Serebii lists Ho-Oh in Gold at Tin Tower.' }, { provider: 'Bulbapedia', url: 'https://bulbapedia.bulbagarden.net/wiki/Ho-Oh_(Pok%C3%A9mon)', note: 'Bulbapedia lists the Generation II Gold Tin Tower encounter.' }], verifiedAt },
  { id: 'pokemon:250:base:silver:tin-tower', targetEntityKey: 'pokemon:250:base', gameId: 'silver', method: 'static-encounter', huntingMethodId: 'gen2-soft-reset', access: 'native', recommendation: 'eligible-native', directEncounter: false, locations: ['Tin Tower'], prerequisites: [], explanation: 'Ho-Oh is a single static encounter hunted by soft resetting in the Tin Tower in Silver.', sources: [{ provider: 'Serebii', url: 'https://www.serebii.net/pokedex-gs/250.shtml', note: 'Serebii lists Ho-Oh in Silver at Tin Tower.' }, { provider: 'Bulbapedia', url: 'https://bulbapedia.bulbagarden.net/wiki/Ho-Oh_(Pok%C3%A9mon)', note: 'Bulbapedia lists the Generation II Silver Tin Tower encounter.' }], verifiedAt },
  { id: 'pokemon:250:base:crystal:tin-tower', targetEntityKey: 'pokemon:250:base', gameId: 'crystal', method: 'static-encounter', huntingMethodId: 'gen2-soft-reset', access: 'native', recommendation: 'eligible-native', directEncounter: false, locations: ['Tin Tower'], prerequisites: [], explanation: 'Ho-Oh is a single static encounter hunted by soft resetting in the Tin Tower in Crystal.', sources: [{ provider: 'Serebii', url: 'https://www.serebii.net/pokedex-gs/250.shtml', note: 'Serebii lists Ho-Oh in Crystal at Tin Tower.' }, { provider: 'Bulbapedia', url: 'https://bulbapedia.bulbagarden.net/wiki/Ho-Oh_(Pok%C3%A9mon)', note: 'Bulbapedia lists the Generation II Crystal Tin Tower encounter.' }], verifiedAt },
];

const crystalOddEggRoutes: PokemonHuntRoute[] = ([
  [172, 'Pichu', 1], [173, 'Cleffa', 3], [174, 'Igglybuff', 3], [236, 'Tyrogue', 1],
  [238, 'Smoochum', 2], [239, 'Elekid', 2], [240, 'Magby', 2],
] as const).map(([speciesId, name, targetChancePercent]) => {
  const targetEntityKey = `pokemon:${speciesId}:base` as PokemonEntityKey;
  return {
    id: `${targetEntityKey}:crystal:odd-egg`, targetEntityKey, gameId: 'crystal', method: 'soft-reset-gift', huntingMethodId: 'gen2-odd-egg', access: 'native', recommendation: 'eligible-native', directEncounter: false,
    locations: ['Route 34 Day Care — Odd Egg'], prerequisites: [], targetChancePercent,
    explanation: `In an international copy of Pokémon Crystal, the Odd Egg can hatch as shiny ${name}; the per-Egg chance of this exact shiny species is ${targetChancePercent}%.`,
    sources: [{ provider: 'Bulbapedia', url: 'https://bulbapedia.bulbagarden.net/wiki/Odd_Egg', note: `Bulbapedia's international Odd Egg table gives shiny ${name} a ${targetChancePercent}% outcome rate.` }], verifiedAt,
  } satisfies PokemonHuntRoute;
});

const gen2BulbasaurFamilyRoutes: PokemonHuntRoute[] = gen2Games.flatMap((gameId) => {
  const commonSources: HuntRouteSource[] = [
    { provider: 'Serebii', url: 'https://www.serebii.net/pokedex-gs/001.shtml', note: 'Serebii lists Bulbasaur in Gold, Silver and Crystal only as transferred from Red, Green, Blue or Yellow.' },
    { provider: 'Bulbapedia', url: 'https://bulbapedia.bulbagarden.net/wiki/Bulbasaur_(Pok%C3%A9mon)', note: 'Bulbapedia documents Bulbasaur as breedable and the base member of its evolutionary family.' },
  ];
  const externalParent: HuntRoutePrerequisite = {
    type: 'external-parent', entityKey: 'pokemon:1:base',
    note: 'Requires a Bulbasaur, Ivysaur or Venusaur parent transferred from a Generation I game into this Generation II save.',
  };
  return [
    {
      id: `pokemon:1:base:${gameId}:external-parent-breeding`, targetEntityKey: 'pokemon:1:base', gameId,
      method: 'breeding', huntingMethodId: 'gen2-egg-hatching', access: 'external-parent-breeding', recommendation: 'eligible-with-external-setup', directEncounter: false,
      eggResultEntityKey: 'pokemon:1:base', locations: ['Route 34 Day Care'], prerequisites: [externalParent],
      explanation: `Bulbasaur has no native encounter in ${gameId}. After transferring a compatible family parent from Generation I, it can be shiny hunted by breeding in ${gameId}.`, sources: commonSources, verifiedAt,
    },
    {
      id: `pokemon:2:base:${gameId}:external-parent-breeding-evolution`, targetEntityKey: 'pokemon:2:base', gameId,
      method: 'breeding-and-evolution', huntingMethodId: 'gen2-egg-hatching', access: 'external-parent-breeding-evolution', recommendation: 'eligible-with-external-setup', directEncounter: false,
      eggResultEntityKey: 'pokemon:1:base', evolveFromEntityKey: 'pokemon:1:base', locations: ['Route 34 Day Care'], prerequisites: [externalParent, { type: 'evolve-shiny', entityKey: 'pokemon:1:base', note: 'Hatch shiny Bulbasaur, then evolve it into Ivysaur.' }],
      explanation: `Ivysaur is not directly obtainable in ${gameId}; breed shiny Bulbasaur using the transferred parent, then evolve it.`, sources: [...commonSources, { provider: 'Serebii', url: 'https://www.serebii.net/pokedex-gs/002.shtml', note: 'Serebii lists Ivysaur as transfer-only in all three Generation II versions.' }], verifiedAt,
    },
    {
      id: `pokemon:3:base:${gameId}:external-parent-breeding-evolution`, targetEntityKey: 'pokemon:3:base', gameId,
      method: 'breeding-and-evolution', huntingMethodId: 'gen2-egg-hatching', access: 'external-parent-breeding-evolution', recommendation: 'eligible-with-external-setup', directEncounter: false,
      eggResultEntityKey: 'pokemon:1:base', evolveFromEntityKey: 'pokemon:2:base', locations: ['Route 34 Day Care'], prerequisites: [externalParent, { type: 'evolve-shiny', entityKey: 'pokemon:2:base', note: 'Hatch shiny Bulbasaur, evolve it into Ivysaur, then into Venusaur.' }],
      explanation: `Venusaur is not directly obtainable in ${gameId}; breed shiny Bulbasaur using the transferred parent and complete the evolution chain.`, sources: [...commonSources, { provider: 'Serebii', url: 'https://www.serebii.net/pokedex-gs/003.shtml', note: 'Serebii lists Venusaur as transfer-only in all three Generation II versions.' }], verifiedAt,
    },
  ] satisfies PokemonHuntRoute[];
});

const bulbasaurSources = {
  gen3: 'https://www.serebii.net/pokedex-rs/001.shtml',
  gen4: 'https://www.serebii.net/pokedex-dp/001.shtml',
  gen5: 'https://www.serebii.net/pokedex-bw/001.shtml',
  gen6: 'https://www.serebii.net/pokedex-xy/001.shtml',
  gen7: 'https://www.serebii.net/pokedex-sm/001.shtml',
  gen8: 'https://www.serebii.net/pokedex-swsh/bulbasaur',
  gen9: 'https://www.serebii.net/pokedex-sv/bulbasaur',
  bulbapedia: 'https://bulbapedia.bulbagarden.net/wiki/Bulbasaur_(Pok%C3%A9mon)',
} as const;

const sourcePair = (generation: keyof Omit<typeof bulbasaurSources, 'bulbapedia'>, note: string): HuntRouteSource[] => [
  { provider: 'Serebii', url: bulbasaurSources[generation], note },
  { provider: 'Bulbapedia', url: bulbasaurSources.bulbapedia, note: 'Bulbapedia cross-checks Bulbasaur game locations and availability across generations.' },
];

const externalBulbasaurBreedingRoute = (gameId: TrackedGameId, generation: 3 | 4 | 5 | 6 | 7 | 8, sourceGeneration: keyof Omit<typeof bulbasaurSources, 'bulbapedia'>, note: string): PokemonHuntRoute => ({
  id: `pokemon:1:base:${gameId}:external-parent-breeding`, targetEntityKey: 'pokemon:1:base', gameId,
  method: 'breeding', huntingMethodId: `gen${generation}-egg-hatching`, access: 'external-parent-breeding', recommendation: 'eligible-with-external-setup', directEncounter: false,
  eggResultEntityKey: 'pokemon:1:base', locations: ['Pokémon Day Care / Nursery'], prerequisites: [{ type: 'external-parent', entityKey: 'pokemon:1:base', note }],
  explanation: `Bulbasaur has no permanent native hunt in ${gameId}; after importing or trading a compatible Bulbasaur-family parent, eggs hatch as Bulbasaur.`, sources: sourcePair(sourceGeneration, note), verifiedAt,
});

const bulbasaurAllGenerationRoutes: PokemonHuntRoute[] = [
  ...(['ruby', 'sapphire', 'emerald'] as const).map((gameId) => externalBulbasaurBreedingRoute(gameId, 3, 'gen3', 'Requires a Bulbasaur-family parent traded from FireRed or LeafGreen.')),
  ...(['firered', 'leafgreen'] as const).map((gameId): PokemonHuntRoute => ({
    id: `pokemon:1:base:${gameId}:pallet-town-starter`, targetEntityKey: 'pokemon:1:base', gameId, method: 'soft-reset-gift', huntingMethodId: 'gen3-soft-reset', access: 'native', recommendation: 'eligible-native', directEncounter: false,
    locations: ['Pallet Town — Professor Oak'], prerequisites: [{ type: 'starter-choice', entityKey: 'pokemon:1:base', note: 'Choose Bulbasaur as the Kanto first partner.' }], explanation: `Bulbasaur is a starter choice in ${gameId} and can be shiny hunted by soft resetting before selection.`, sources: sourcePair('gen3', 'Serebii lists Bulbasaur as the Pallet Town starter in FireRed and LeafGreen.'), verifiedAt,
  })),
  ...(['diamond', 'pearl', 'platinum'] as const).map((gameId) => externalBulbasaurBreedingRoute(gameId, 4, 'gen4', 'Requires a Bulbasaur-family parent transferred through Pal Park or traded from a compatible game.')),
  ...(['heartgold', 'soulsilver'] as const).map((gameId): PokemonHuntRoute => ({
    id: `pokemon:1:base:${gameId}:professor-oak-gift`, targetEntityKey: 'pokemon:1:base', gameId, method: 'soft-reset-gift', huntingMethodId: 'gen4-soft-reset', access: 'native', recommendation: 'eligible-native', directEncounter: false,
    locations: ['Pallet Town — Professor Oak'], prerequisites: [{ type: 'game-progression', note: 'Defeat Red, then choose Bulbasaur from Professor Oak.' }], explanation: `Professor Oak offers Bulbasaur in ${gameId} after Red is defeated; the gift is hunted by soft resetting.`, sources: sourcePair('gen4', 'Serebii lists Bulbasaur as received from Professor Oak in HeartGold and SoulSilver.'), verifiedAt,
  })),
  ...(['black', 'white', 'black2', 'white2'] as const).map((gameId) => externalBulbasaurBreedingRoute(gameId, 5, 'gen5', 'Requires a Bulbasaur-family parent obtained through Poké Transfer, trade or an applicable historical distribution.')),
  ...(['x', 'y'] as const).map((gameId): PokemonHuntRoute => ({
    id: `pokemon:1:base:${gameId}:sycamore-gift`, targetEntityKey: 'pokemon:1:base', gameId, method: 'soft-reset-gift', huntingMethodId: 'gen6-soft-reset', access: 'native', recommendation: 'eligible-native', directEncounter: false,
    locations: ['Lumiose City — Professor Sycamore'], prerequisites: [{ type: 'starter-choice', entityKey: 'pokemon:1:base', note: 'Choose Bulbasaur after defeating Professor Sycamore.' }], explanation: `Bulbasaur is one of Professor Sycamore's Kanto starter gifts in Pokémon ${gameId}; use soft reset for the shiny hunt.`, sources: sourcePair('gen6', 'Serebii lists Bulbasaur at Professor Sycamore’s Lab in X and Y.'), verifiedAt,
  })),
  ...(['omegaruby', 'alphasapphire'] as const).map((gameId) => externalBulbasaurBreedingRoute(gameId, 6, 'gen6', 'Requires a Bulbasaur-family parent traded from X/Y or another compatible source.')),
  ...(['sun', 'moon'] as const).map((gameId) => externalBulbasaurBreedingRoute(gameId, 7, 'gen7', 'Requires a Bulbasaur-family parent traded from Ultra Sun/Ultra Moon or another compatible source.')),
  ...(['ultrasun', 'ultramoon'] as const).map((gameId): PokemonHuntRoute => ({
    id: `pokemon:1:base:${gameId}:route-2-island-scan`, targetEntityKey: 'pokemon:1:base', gameId, method: 'wild-random-encounter', huntingMethodId: 'gen7-random', access: 'native', recommendation: 'eligible-native', directEncounter: true,
    locations: ['Route 2 — Island Scan (Friday)'], prerequisites: [{ type: 'game-progression', note: 'Activate Island Scan on Route 2 on Friday.' }], explanation: `Bulbasaur is a Friday Island Scan encounter on Route 2 in ${gameId}.`, sources: sourcePair('gen7', 'Serebii lists Route 2 Island Scan on Friday for Ultra Sun and Ultra Moon.'), verifiedAt,
  })),
  ...(['lgp', 'lge'] as const).flatMap((gameId): PokemonHuntRoute[] => ([
    { id: `pokemon:1:base:${gameId}:viridian-forest-random`, targetEntityKey: 'pokemon:1:base', gameId, method: 'wild-random-encounter', huntingMethodId: 'gen7-lgpe-random', access: 'native', recommendation: 'eligible-native', directEncounter: true, locations: ['Viridian Forest'], prerequisites: [], explanation: `Bulbasaur can spawn in Viridian Forest in ${gameId}.`, sources: sourcePair('gen7', 'Serebii lists Bulbasaur in Viridian Forest in both Let’s Go games.'), verifiedAt },
    { id: `pokemon:1:base:${gameId}:viridian-forest-catch-combo`, targetEntityKey: 'pokemon:1:base', gameId, method: 'wild-random-encounter', huntingMethodId: 'gen7-lgpe-combo', access: 'native', recommendation: 'eligible-native', directEncounter: true, locations: ['Viridian Forest'], prerequisites: [], explanation: `Bulbasaur can be hunted in Viridian Forest using the Let’s Go catch-combo mechanics in ${gameId}.`, sources: sourcePair('gen7', 'Serebii lists the native Viridian Forest spawn used for Let’s Go hunting methods.'), verifiedAt },
  ])),
  ...(['sword', 'shield'] as const).map((gameId) => externalBulbasaurBreedingRoute(gameId, 8, 'gen8', 'Requires a compatible Bulbasaur-family parent from Pokémon HOME, trade, the Expansion Pass gift or an applicable raid event.')),
  ...(['brilliantdiamond', 'shiningpearl'] as const).map((gameId): PokemonHuntRoute => ({
    id: `pokemon:1:base:${gameId}:grand-underground`, targetEntityKey: 'pokemon:1:base', gameId, method: 'wild-random-encounter', huntingMethodId: 'gen8-bdsp-underground', access: 'native', recommendation: 'eligible-native', directEncounter: true,
    locations: ['Grand Underground'], prerequisites: [{ type: 'game-progression', note: 'Obtain the National Pokédex.' }], explanation: `Bulbasaur is a Grand Underground spawn in ${gameId} after obtaining the National Pokédex.`, sources: sourcePair('gen8', 'Bulbapedia lists Bulbasaur in multiple Grand Underground hideaways after the National Pokédex.'), verifiedAt,
  })),
  { id: 'pokemon:1:base:pla:unobtainable', targetEntityKey: 'pokemon:1:base', gameId: 'pla', method: 'unavailable', huntingMethodId: 'custom', access: 'unobtainable', recommendation: 'not-eligible', directEncounter: false, locations: [], prerequisites: [], explanation: 'Bulbasaur is unobtainable in Pokémon Legends: Arceus and must never be proposed for this game.', sources: sourcePair('gen8', 'Bulbapedia lists Bulbasaur as unobtainable in Pokémon Legends: Arceus.'), verifiedAt },
  ...(['scarlet', 'violet'] as const).flatMap((gameId): PokemonHuntRoute[] => ([
    { id: `pokemon:1:base:${gameId}:terarium-wild`, targetEntityKey: 'pokemon:1:base', gameId, method: 'wild-random-encounter', huntingMethodId: 'gen9-random', access: 'native', recommendation: 'eligible-native', directEncounter: true, locations: ['Coastal Biome', 'Torchlit Labyrinth'], prerequisites: [{ type: 'dlc-access', note: 'Requires The Indigo Disk and the Coastal Biome biodiversity upgrade.' }], explanation: `Bulbasaur appears in the Terarium in ${gameId} after the Coastal Biome upgrade.`, sources: sourcePair('gen9', 'Serebii lists Bulbasaur in the Coastal Biome and Torchlit Labyrinth.'), verifiedAt },
    { id: `pokemon:1:base:${gameId}:terarium-sandwich`, targetEntityKey: 'pokemon:1:base', gameId, method: 'wild-random-encounter', huntingMethodId: 'gen9-sandwich-lv3', access: 'native', recommendation: 'eligible-native', directEncounter: true, locations: ['Coastal Biome', 'Torchlit Labyrinth'], prerequisites: [{ type: 'dlc-access', note: 'Requires The Indigo Disk, Coastal Biome biodiversity upgrade and Sparkling Power.' }], explanation: `The same native Terarium Bulbasaur spawns can be hunted with Sparkling Power in ${gameId}.`, sources: sourcePair('gen9', 'Serebii confirms the native Terarium spawn locations.'), verifiedAt },
  ])),
  { id: 'pokemon:1:base:za:wild-zone-20', targetEntityKey: 'pokemon:1:base', gameId: 'za', method: 'wild-random-encounter', huntingMethodId: 'gen9-zone-bench-soft-reset', access: 'native', recommendation: 'eligible-native', directEncounter: true, locations: ['Wild Zone 20'], prerequisites: [{ type: 'game-progression', note: 'Unlock Wild Zone 20.' }], explanation: 'Bulbasaur appears in Wild Zone 20 in Pokémon Legends: Z-A and uses the site’s Zone / Bench / Soft Reset method.', sources: sourcePair('gen9', 'Serebii lists Bulbasaur in Wild Zone 20 in Pokémon Legends: Z-A.'), verifiedAt },
];

const bulbasaurBaseRoutes = [
  ...gen2BulbasaurFamilyRoutes.filter((route) => route.targetEntityKey === 'pokemon:1:base'),
  ...bulbasaurAllGenerationRoutes,
];

interface KantoStarterCloneConfig {
  baseId: 4 | 7;
  name: 'Charmander' | 'Squirtle';
  gen7Page: string;
  bulbapediaPage: string;
  islandScanLocation: string;
  islandScanSchedule: string;
  letsGoLocations: string[];
  terariumLocations: string[];
}

function cloneBaseRoutesForKantoStarter(config: KantoStarterCloneConfig): PokemonHuntRoute[] {
  const targetKey = `pokemon:${config.baseId}:base` as PokemonEntityKey;
  return bulbasaurBaseRoutes.map((route) => {
    const clone = structuredClone(route) as PokemonHuntRoute;
    clone.id = clone.id.replace('pokemon:1:base', targetKey) as HuntRouteId;
    clone.targetEntityKey = targetKey;
    clone.eggResultEntityKey = clone.eggResultEntityKey ? targetKey : undefined;
    clone.prerequisites = clone.prerequisites.map((item) => ({
      ...item,
      entityKey: item.entityKey === 'pokemon:1:base' ? targetKey : item.entityKey,
      note: item.note.replaceAll('Bulbasaur', config.name).replaceAll('Bulbasaur-family', `${config.name} family`),
    }));
    clone.explanation = clone.explanation.replaceAll('Bulbasaur', config.name);
    clone.sources = clone.sources.map((source) => {
      let url = source.url;
      if (url.includes('bulbapedia.bulbagarden.net/wiki/Bulbasaur_')) url = config.bulbapediaPage;
      else if (config.baseId === 4) url = url.replace('/001.shtml', '/004.shtml').replace('/bulbasaur', '/charmander');
      else url = url.replace('/001.shtml', '/007.shtml').replace('/bulbasaur', '/squirtle');
      return { ...source, url, note: source.note.replaceAll('Bulbasaur', config.name) };
    });

    if (route.gameId === 'ultrasun' || route.gameId === 'ultramoon') {
      clone.id = `${targetKey}:${route.gameId}:island-scan`;
      clone.locations = [config.islandScanLocation];
      clone.prerequisites = [{ type: 'game-progression', note: `Activate Island Scan at ${config.islandScanLocation} ${config.islandScanSchedule}.` }];
      clone.explanation = `${config.name} is an Island Scan encounter at ${config.islandScanLocation} ${config.islandScanSchedule} in ${route.gameId}.`;
      clone.sources = [{ provider: 'Serebii', url: config.gen7Page, note: `Serebii lists ${config.name} at ${config.islandScanLocation} ${config.islandScanSchedule}.` }, { provider: 'Bulbapedia', url: config.bulbapediaPage, note: `Bulbapedia cross-checks ${config.name}'s Generation VII availability.` }];
    }
    if (route.gameId === 'lgp' || route.gameId === 'lge') {
      clone.locations = config.letsGoLocations;
      clone.explanation = clone.explanation.replace(/Viridian Forest/gu, config.letsGoLocations.join(', '));
    }
    if (route.gameId === 'scarlet' || route.gameId === 'violet') {
      clone.locations = config.terariumLocations;
      clone.explanation = clone.explanation.replace(/Coastal Biome|Torchlit Labyrinth/gu, config.terariumLocations.join(', '));
    }
    return clone;
  });
}

function deriveEvolutionRoutes(baseRoutes: PokemonHuntRoute[], baseId: number, middleId: number, finalId: number, names: [string, string, string]): PokemonHuntRoute[] {
  return baseRoutes.flatMap((baseRoute) => [middleId, finalId].map((targetId, index): PokemonHuntRoute => {
    const targetKey = `pokemon:${targetId}:base` as PokemonEntityKey;
    const previousKey = `pokemon:${index === 0 ? baseId : middleId}:base` as PokemonEntityKey;
    const inaccessible = baseRoute.recommendation === 'not-eligible';
    const external = baseRoute.recommendation === 'eligible-with-external-setup';
    return {
      ...baseRoute,
      id: `${targetKey}:${baseRoute.gameId}:${inaccessible ? 'unobtainable' : 'evolve-from-hunted-base'}-${baseRoute.id.split(':').at(-1)}` as HuntRouteId,
      targetEntityKey: targetKey,
      method: inaccessible ? 'unavailable' : external ? 'breeding-and-evolution' : 'evolution-from-hunted-shiny',
      access: inaccessible ? 'unobtainable' : external ? 'external-parent-breeding-evolution' : 'same-save-evolution',
      directEncounter: false,
      eggResultEntityKey: external ? `pokemon:${baseId}:base` as PokemonEntityKey : undefined,
      evolveFromEntityKey: inaccessible ? undefined : previousKey,
      prerequisites: inaccessible ? [] : [...baseRoute.prerequisites, { type: 'evolve-shiny', entityKey: previousKey, note: `Obtain shiny ${names[0]} through the documented route, then evolve the line into ${names[index + 1]}.` }],
      explanation: inaccessible ? `${names[index + 1]} is unobtainable in ${baseRoute.gameId} because the ${names[0]} family is unavailable.` : `${names[index + 1]} is obtained by hunting shiny ${names[0]} with the documented ${baseRoute.gameId} route and evolving it; it is not presented as a direct encounter.`,
    };
  }));
}

const charmanderBaseRoutes = cloneBaseRoutesForKantoStarter({ baseId: 4, name: 'Charmander', gen7Page: 'https://www.serebii.net/pokedex-sm/004.shtml', bulbapediaPage: 'https://bulbapedia.bulbagarden.net/wiki/Charmander_(Pok%C3%A9mon)', islandScanLocation: 'Route 3', islandScanSchedule: 'on Sunday', letsGoLocations: ['Route 3', 'Route 4', 'Rock Tunnel'], terariumLocations: ['Savanna Biome'] });
const squirtleBaseRoutes = cloneBaseRoutesForKantoStarter({ baseId: 7, name: 'Squirtle', gen7Page: 'https://www.serebii.net/pokedex-sm/007.shtml', bulbapediaPage: 'https://bulbapedia.bulbagarden.net/wiki/Squirtle_(Pok%C3%A9mon)', islandScanLocation: 'Seaward Cave', islandScanSchedule: 'on Monday', letsGoLocations: ['Route 24', 'Route 25', 'Seafoam Islands'], terariumLocations: ['Canyon Biome'] });
const bulbasaurEvolutionRoutes = deriveEvolutionRoutes(
  bulbasaurBaseRoutes.filter((route) => !gen2Games.includes(route.gameId)),
  1, 2, 3, ['Bulbasaur', 'Ivysaur', 'Venusaur'],
);
const charmanderEvolutionRoutes = deriveEvolutionRoutes(charmanderBaseRoutes, 4, 5, 6, ['Charmander', 'Charmeleon', 'Charizard']);
const squirtleEvolutionRoutes = deriveEvolutionRoutes(squirtleBaseRoutes, 7, 8, 9, ['Squirtle', 'Wartortle', 'Blastoise']);

const kantoStarterDirectEvolutionExceptions: PokemonHuntRoute[] = [
  ...([['pokemon:2:base', 'Ivysaur', 'https://www.serebii.net/pokedex-xy/002.shtml'], ['pokemon:5:base', 'Charmeleon', 'https://www.serebii.net/pokedex-xy/005.shtml'], ['pokemon:8:base', 'Wartortle', 'https://www.serebii.net/pokedex-xy/008.shtml']] as const).flatMap(([targetEntityKey, name, url]) =>
    (['x', 'y'] as const).map((gameId): PokemonHuntRoute => ({
      id: `${targetEntityKey}:${gameId}:friend-safari`, targetEntityKey, gameId, method: 'wild-random-encounter', huntingMethodId: 'gen6-friend-safari', access: 'native', recommendation: 'eligible-native', directEncounter: true,
      locations: ['Friend Safari'], prerequisites: [], explanation: `${name} can be encountered directly in the Friend Safari in Pokémon ${gameId}.`, sources: [{ provider: 'Serebii', url, note: `Serebii lists ${name} in the X/Y Friend Safari.` }], verifiedAt,
    }))),
  ...(['lgp', 'lge'] as const).map((gameId): PokemonHuntRoute => ({
    id: `pokemon:6:base:${gameId}:flying-wild-spawn`, targetEntityKey: 'pokemon:6:base', gameId, method: 'wild-random-encounter', huntingMethodId: 'gen7-lgpe-random', access: 'native', recommendation: 'eligible-native', directEncounter: true,
    locations: gameId === 'lgp' ? ['Routes 1–4', 'Routes 6–8', 'Routes 10–25 (selected routes)'] : ['Routes 2–4', 'Routes 7–8', 'Routes 10–25 (selected routes)'], prerequisites: [{ type: 'game-progression', note: 'Unlock flying wild spawns.' }], explanation: `Charizard can appear directly as a flying wild spawn in ${gameId}.`, sources: [{ provider: 'Serebii', url: 'https://www.serebii.net/pokedex-sm/006.shtml', note: 'Serebii lists the direct Let’s Go route encounters for Charizard.' }], verifiedAt,
  })),
];

const caterpieSource = (url: string, note: string): HuntRouteSource[] => [
  { provider: 'Serebii', url, note },
  { provider: 'Bulbapedia', url: 'https://bulbapedia.bulbagarden.net/wiki/Caterpie_(Pok%C3%A9mon)', note: 'Bulbapedia cross-checks Caterpie game locations from Generation II through IX.' },
  { provider: 'Pokémon Central Wiki', url: 'https://wiki.pokemoncentral.it/Caterpie', note: 'Pokémon Central Wiki cross-checks Caterpie encounter rows for Oro, Argento and Cristallo.' },
];

const caterpieRoute = (gameId: TrackedGameId, suffix: string, data: Partial<PokemonHuntRoute> & Pick<PokemonHuntRoute, 'method' | 'huntingMethodId' | 'access' | 'recommendation' | 'directEncounter' | 'locations' | 'prerequisites' | 'explanation' | 'sources'>): PokemonHuntRoute => ({
  id: `pokemon:10:base:${gameId}:${suffix}`, targetEntityKey: 'pokemon:10:base', gameId, verifiedAt, ...data,
});

const caterpieRoutes: PokemonHuntRoute[] = [
  caterpieRoute('gold', 'wild', { method: 'wild-random-encounter', huntingMethodId: 'gen2-random', access: 'native', recommendation: 'eligible-native', directEncounter: true, locations: ['Routes 2, 30–31, 26–27, 34–39', 'Ilex Forest', 'National Park', 'Azalea Town', 'Lake of Rage'], prerequisites: [], explanation: 'Caterpie has multiple native grass encounters in Gold.', sources: caterpieSource('https://www.serebii.net/pokedex-gs/010.shtml', 'Serebii lists Caterpie’s Gold encounters.') }),
  caterpieRoute('gold', 'headbutt', { method: 'wild-random-encounter', huntingMethodId: 'gen2-headbutt', access: 'native', recommendation: 'eligible-native', directEncounter: true, locations: ['Routes 34–39', 'Azalea Town', 'Ilex Forest', 'Lake of Rage'], prerequisites: [], explanation: 'Caterpie can also be hunted from Headbutt trees in Gold.', sources: caterpieSource('https://www.serebii.net/pokedex-gs/010.shtml', 'Serebii lists Caterpie in Gold Headbutt locations.') }),
  caterpieRoute('silver', 'bug-catching-contest', { method: 'wild-random-encounter', huntingMethodId: 'gen2-random', access: 'native', recommendation: 'eligible-native', directEncounter: true, locations: ['National Park — Bug-Catching Contest'], prerequisites: [{ type: 'game-progression', note: 'Enter the Bug-Catching Contest on Tuesday, Thursday or Saturday.' }], explanation: 'Caterpie is available natively in Silver through the Bug-Catching Contest.', sources: caterpieSource('https://www.serebii.net/pokedex-gs/010.shtml', 'Serebii lists Silver Caterpie at National Park.') }),
  caterpieRoute('crystal', 'wild', { method: 'wild-random-encounter', huntingMethodId: 'gen2-random', access: 'native', recommendation: 'eligible-native', directEncounter: true, locations: ['Routes 2, 24–25, 30–31, 45–46', 'Ilex Forest', 'National Park'], prerequisites: [], explanation: 'Caterpie has native grass encounters in Crystal.', sources: caterpieSource('https://www.serebii.net/pokedex-gs/010.shtml', 'Serebii lists Caterpie’s Crystal encounters.') }),
  caterpieRoute('crystal', 'headbutt', { method: 'wild-random-encounter', huntingMethodId: 'gen2-headbutt', access: 'native', recommendation: 'eligible-native', directEncounter: true, locations: ['Ilex Forest'], prerequisites: [], explanation: 'Caterpie can also be hunted with Headbutt in Ilex Forest in Crystal.', sources: caterpieSource('https://www.serebii.net/pokedex-gs/010.shtml', 'Serebii lists Crystal Caterpie in Ilex Forest Headbutt trees.') }),
  ...(['ruby', 'sapphire', 'emerald'] as const).map((gameId) => caterpieRoute(gameId, 'external-parent-breeding', { method: 'breeding', huntingMethodId: 'gen3-egg-hatching', access: 'external-parent-breeding', recommendation: 'eligible-with-external-setup', directEncounter: false, eggResultEntityKey: 'pokemon:10:base', locations: ['Pokémon Day Care'], prerequisites: [{ type: 'external-parent', entityKey: 'pokemon:10:base', note: 'Requires a Caterpie-family parent traded from FireRed or LeafGreen.' }], explanation: `Caterpie is not native in ${gameId}; after importing its family, breeding produces Caterpie eggs.`, sources: caterpieSource('https://www.serebii.net/pokedex-rs/010.shtml', 'Serebii lists RSE Caterpie as traded from FireRed/LeafGreen.') })),
  ...(['firered', 'leafgreen'] as const).map((gameId) => caterpieRoute(gameId, 'wild', { method: 'wild-random-encounter', huntingMethodId: 'gen3-random', access: 'native', recommendation: 'eligible-native', directEncounter: true, locations: ['Viridian Forest', 'Route 25', 'Pattern Bush'], prerequisites: [], explanation: `Caterpie is a native random encounter in ${gameId}.`, sources: caterpieSource('https://www.serebii.net/pokedex-rs/010.shtml', 'Serebii lists Viridian Forest, Route 25 and Pattern Bush.') })),
  ...(['diamond', 'pearl', 'platinum'] as const).map((gameId) => caterpieRoute(gameId, 'firered-slot-encounter', { method: 'wild-random-encounter', huntingMethodId: 'gen4-random', access: 'external-game-feature', recommendation: 'eligible-with-external-setup', directEncounter: true, locations: gameId === 'platinum' ? ['Route 204', 'Eterna Forest'] : ['Route 204 South'], prerequisites: [{ type: 'external-game-feature', note: 'Requires Pokémon FireRed inserted in the Nintendo DS Game Boy Advance slot.' }], explanation: `Caterpie appears in ${gameId} through the FireRed dual-slot encounter feature.`, sources: caterpieSource('https://www.serebii.net/pokedex-dp/010.shtml', 'Serebii lists Caterpie as a FireRed dual-slot encounter in DPPt.') })),
  caterpieRoute('heartgold', 'wild', { method: 'wild-random-encounter', huntingMethodId: 'gen4-random', access: 'native', recommendation: 'eligible-native', directEncounter: true, locations: ['Routes 2, 30–31', 'Ilex Forest', 'National Park', 'Viridian Forest'], prerequisites: [], explanation: 'Caterpie has native grass encounters in HeartGold.', sources: caterpieSource('https://www.serebii.net/pokedex-dp/010.shtml', 'Serebii lists HeartGold Caterpie encounters.') }),
  caterpieRoute('heartgold', 'headbutt', { method: 'wild-random-encounter', huntingMethodId: 'gen4-headbutt', access: 'native', recommendation: 'eligible-native', directEncounter: true, locations: ['Ilex Forest'], prerequisites: [], explanation: 'Caterpie can also be hunted by Headbutt in HeartGold.', sources: caterpieSource('https://www.serebii.net/pokedex-dp/010.shtml', 'Serebii lists Ilex Forest Headbutt Caterpie.') }),
  caterpieRoute('soulsilver', 'bug-catching-contest', { method: 'wild-random-encounter', huntingMethodId: 'gen4-random', access: 'native', recommendation: 'eligible-native', directEncounter: true, locations: ['National Park — Bug-Catching Contest'], prerequisites: [], explanation: 'Caterpie is natively huntable in SoulSilver through the Bug-Catching Contest.', sources: caterpieSource('https://www.serebii.net/pokedex-dp/010.shtml', 'Serebii lists SoulSilver Caterpie in the Bug-Catching Contest.') }),
  ...(['black', 'black2'] as const).map((gameId) => caterpieRoute(gameId, 'external-parent-breeding', { method: 'breeding', huntingMethodId: 'gen5-egg-hatching', access: 'external-parent-breeding', recommendation: 'eligible-with-external-setup', directEncounter: false, eggResultEntityKey: 'pokemon:10:base', locations: ['Pokémon Day Care'], prerequisites: [{ type: 'external-parent', entityKey: 'pokemon:10:base', note: 'Requires a Caterpie-family parent traded from the paired White version.' }], explanation: `Caterpie requires an externally sourced parent in ${gameId}, after which it can be shiny hunted by breeding.`, sources: caterpieSource('https://www.serebii.net/pokedex-bw/010.shtml', 'Serebii lists Caterpie as trade-required in Black and Black 2.') })),
  ...(['white', 'white2'] as const).map((gameId) => caterpieRoute(gameId, 'native-parent-breeding', { method: 'breeding', huntingMethodId: 'gen5-egg-hatching', access: 'native', recommendation: 'eligible-native', directEncounter: false, eggResultEntityKey: 'pokemon:10:base', locations: ['Pokémon Day Care'], prerequisites: [{ type: 'game-progression', note: 'Obtain the native Metapod or Butterfree family parent, then breed it.' }], explanation: `Caterpie is obtained natively in ${gameId} by breeding a locally obtainable evolved family member.`, sources: caterpieSource('https://www.serebii.net/pokedex-bw/010.shtml', 'Serebii lists Caterpie as bred from its evolved family in White and White 2.') })),
  ...(['x', 'y'] as const).map((gameId) => caterpieRoute(gameId, 'wild', { method: 'wild-random-encounter', huntingMethodId: 'gen6-random', access: 'native', recommendation: 'eligible-native', directEncounter: true, locations: gameId === 'x' ? ['Santalune Forest'] : ['Route 2', 'Santalune Forest'], prerequisites: [], explanation: `Caterpie is a native random encounter in Pokémon ${gameId}.`, sources: caterpieSource('https://www.serebii.net/pokedex-xy/010.shtml', 'Serebii lists Caterpie in Santalune Forest and, in Y, Route 2.') })),
  ...(['omegaruby', 'alphasapphire'] as const).map((gameId) => caterpieRoute(gameId, 'external-parent-breeding', { method: 'breeding', huntingMethodId: 'gen6-egg-hatching', access: 'external-parent-breeding', recommendation: 'eligible-with-external-setup', directEncounter: false, eggResultEntityKey: 'pokemon:10:base', locations: ['Pokémon Day Care'], prerequisites: [{ type: 'external-parent', entityKey: 'pokemon:10:base', note: 'Requires a Caterpie-family parent traded from X or Y.' }], explanation: `Caterpie is not native in ${gameId}; an imported family parent enables breeding.`, sources: caterpieSource('https://www.serebii.net/pokedex-xy/010.shtml', 'Serebii lists ORAS Caterpie as trade from X/Y.') })),
  ...(['sun', 'moon', 'ultrasun', 'ultramoon'] as const).flatMap((gameId) => [
    caterpieRoute(gameId, 'wild', { method: 'wild-random-encounter', huntingMethodId: 'gen7-random', access: 'native', recommendation: 'eligible-native', directEncounter: true, locations: ['Route 1', 'Route 5', 'Melemele Meadow', ...(gameId === 'sun' || gameId === 'moon' ? ['Lush Jungle'] : [])], prerequisites: [], explanation: `Caterpie has native random encounters in ${gameId}.`, sources: caterpieSource('https://www.serebii.net/pokedex-sm/010.shtml', 'Serebii lists Caterpie’s Alola encounters.') }),
    ...(gameId === 'ultrasun' || gameId === 'ultramoon' ? [caterpieRoute(gameId, 'lush-jungle-sos', { method: 'wild-random-encounter', huntingMethodId: 'gen7-sos', access: 'native', recommendation: 'eligible-native', directEncounter: true, locations: ['Lush Jungle'], prerequisites: [], explanation: `Caterpie can be hunted through SOS calls in Lush Jungle in ${gameId}.`, sources: caterpieSource('https://www.serebii.net/pokedex-sm/010.shtml', 'Serebii marks Lush Jungle Caterpie as SOS-only in USUM.') })] : []),
  ]),
  ...(['lgp', 'lge'] as const).flatMap((gameId) => [
    caterpieRoute(gameId, 'wild', { method: 'wild-random-encounter', huntingMethodId: 'gen7-lgpe-random', access: 'native', recommendation: 'eligible-native', directEncounter: true, locations: ['Route 2', 'Viridian Forest'], prerequisites: [], explanation: `Caterpie is a native wild spawn in ${gameId}.`, sources: caterpieSource('https://www.serebii.net/pokedex-sm/010.shtml', 'Serebii lists Route 2 and Viridian Forest.') }),
    caterpieRoute(gameId, 'catch-combo', { method: 'wild-random-encounter', huntingMethodId: 'gen7-lgpe-combo', access: 'native', recommendation: 'eligible-native', directEncounter: true, locations: ['Route 2', 'Viridian Forest'], prerequisites: [], explanation: `Caterpie can be hunted with the Let’s Go Catch Combo method in ${gameId}.`, sources: caterpieSource('https://www.serebii.net/pokedex-sm/010.shtml', 'Serebii confirms the native Caterpie spawn locations used by Catch Combo.') }),
  ]),
  ...(['sword', 'shield'] as const).flatMap((gameId) => [
    caterpieRoute(gameId, 'route-1', { method: 'wild-random-encounter', huntingMethodId: 'gen8-random', access: 'native', recommendation: 'eligible-native', directEncounter: true, locations: ['Route 1'], prerequisites: [], explanation: `Caterpie is a native random encounter on Route 1 in ${gameId}.`, sources: caterpieSource('https://www.serebii.net/pokedex-swsh/caterpie', 'Serebii lists Route 1 Caterpie in Sword and Shield.') }),
    caterpieRoute(gameId, 'max-raid', { method: 'static-encounter', huntingMethodId: 'gen8-max-raid', access: 'native', recommendation: 'eligible-native', directEncounter: false, locations: ['Bridge Field', 'Dappled Grove', 'Rolling Fields', 'South Lake Miloch'], prerequisites: [], explanation: `Caterpie is also available in permanent Max Raid dens in ${gameId}.`, sources: caterpieSource('https://www.serebii.net/pokedex-swsh/caterpie', 'Serebii lists Caterpie Max Raid locations.') }),
  ]),
  caterpieRoute('brilliantdiamond', 'grand-underground', { method: 'wild-random-encounter', huntingMethodId: 'gen8-bdsp-underground', access: 'native', recommendation: 'eligible-native', directEncounter: true, locations: ['Grand Underground'], prerequisites: [{ type: 'game-progression', note: 'Obtain the National Pokédex.' }], explanation: 'Caterpie is a native Grand Underground encounter in Brilliant Diamond after the National Pokédex.', sources: caterpieSource('https://www.serebii.net/pokedex-swsh/caterpie', 'Serebii lists Caterpie in the Brilliant Diamond Grand Underground.') }),
  caterpieRoute('shiningpearl', 'external-parent-breeding', { method: 'breeding', huntingMethodId: 'gen8-egg-hatching', access: 'external-parent-breeding', recommendation: 'eligible-with-external-setup', directEncounter: false, eggResultEntityKey: 'pokemon:10:base', locations: ['Pokémon Nursery'], prerequisites: [{ type: 'external-parent', entityKey: 'pokemon:10:base', sourceGameIds: ['brilliantdiamond'], note: 'Requires a Caterpie-family parent traded from Brilliant Diamond.' }], explanation: 'Caterpie is version-exclusive away from Shining Pearl; after trading a family parent, it can be bred there.', sources: caterpieSource('https://www.serebii.net/pokedex-swsh/caterpie', 'Serebii lists Shining Pearl Caterpie as trade from Brilliant Diamond.') }),
  caterpieRoute('pla', 'unobtainable', { method: 'unavailable', huntingMethodId: 'custom', access: 'unobtainable', recommendation: 'not-eligible', directEncounter: false, locations: [], prerequisites: [], explanation: 'Caterpie is unobtainable in Pokémon Legends: Arceus.', sources: caterpieSource('https://www.serebii.net/pokemon/caterpie/', 'Serebii and Bulbapedia list Caterpie as unobtainable in Legends: Arceus.') }),
  ...(['scarlet', 'violet', 'za'] as const).map((gameId) => caterpieRoute(gameId, 'unobtainable', { method: 'unavailable', huntingMethodId: 'custom', access: 'unobtainable', recommendation: 'not-eligible', directEncounter: false, locations: [], prerequisites: [], explanation: `Caterpie is unobtainable in ${gameId} and must be excluded from the random hunt generator.`, sources: caterpieSource('https://www.serebii.net/pokemon/caterpie/', 'Serebii and Bulbapedia list Caterpie as unobtainable throughout Generation IX.') })),
];

const caterpieEvolutionRoutes = deriveEvolutionRoutes(caterpieRoutes, 10, 11, 12, ['Caterpie', 'Metapod', 'Butterfree']);

const caterpieLineDirectGen2Routes: PokemonHuntRoute[] = ([
  [11, 'Metapod'], [12, 'Butterfree'],
] as const).flatMap(([speciesId, name]) => ([
  caterpieRoute('gold', `${name.toLowerCase()}-wild`, { id: `pokemon:${speciesId}:base:gold:wild`, targetEntityKey: `pokemon:${speciesId}:base`, method: 'wild-random-encounter', huntingMethodId: 'gen2-random', access: 'native', recommendation: 'eligible-native', directEncounter: true, locations: speciesId === 11 ? ['Routes 2, 30–31, 26–27, 34–39', 'Azalea Town', 'Ilex Forest', 'National Park', 'Lake of Rage'] : ['Routes 2, 26–27, 34–39', 'Azalea Town', 'Ilex Forest', 'National Park', 'Lake of Rage'], prerequisites: [], explanation: `${name} has direct native encounters in Gold.`, sources: [{ provider: 'Serebii', url: `https://www.serebii.net/pokedex-gs/0${speciesId}.shtml`, note: `Serebii lists ${name}'s Gold encounters.` }, { provider: 'Pokémon Central Wiki', url: `https://wiki.pokemoncentral.it/${name}`, note: `Pokémon Central Wiki cross-checks ${name}'s Gold encounter rows.` }], verifiedAt }),
  caterpieRoute('silver', `${name.toLowerCase()}-contest`, { id: `pokemon:${speciesId}:base:silver:bug-catching-contest`, targetEntityKey: `pokemon:${speciesId}:base`, method: 'wild-random-encounter', huntingMethodId: 'gen2-random', access: 'native', recommendation: 'eligible-native', directEncounter: true, locations: ['National Park — Bug-Catching Contest'], prerequisites: [], explanation: `${name} is directly huntable in Silver's Bug-Catching Contest.`, sources: [{ provider: 'Serebii', url: `https://www.serebii.net/pokedex-gs/0${speciesId}.shtml`, note: `Serebii lists ${name} in Silver's National Park.` }, { provider: 'Pokémon Central Wiki', url: `https://wiki.pokemoncentral.it/${name}`, note: `Pokémon Central Wiki cross-checks ${name}'s Silver Bug-Catching Contest rows.` }], verifiedAt }),
  caterpieRoute('crystal', `${name.toLowerCase()}-wild`, { id: `pokemon:${speciesId}:base:crystal:wild`, targetEntityKey: `pokemon:${speciesId}:base`, method: 'wild-random-encounter', huntingMethodId: 'gen2-random', access: 'native', recommendation: 'eligible-native', directEncounter: true, locations: speciesId === 11 ? ['Routes 24–25, 45–46', 'Ilex Forest', 'National Park'] : ['Routes 2, 24–25, 45–46', 'Ilex Forest', 'National Park'], prerequisites: [], explanation: `${name} has direct native encounters in Crystal.`, sources: [{ provider: 'Serebii', url: `https://www.serebii.net/pokedex-gs/0${speciesId}.shtml`, note: `Serebii lists ${name}'s Crystal encounters.` }, { provider: 'Pokémon Central Wiki', url: `https://wiki.pokemoncentral.it/${name}`, note: `Pokémon Central Wiki cross-checks ${name}'s Crystal encounter rows.` }], verifiedAt }),
]));

function buildGen2StarterRoutes(): PokemonHuntRoute[] {
  const routes: PokemonHuntRoute[] = [];
  for (const family of gen2StarterFamilies) {
    for (const gameId of gen2Games) {
      const baseKey = `pokemon:${family.base}:base` as PokemonEntityKey;
      const middleKey = `pokemon:${family.middle}:base` as PokemonEntityKey;
      const finalKey = `pokemon:${family.final}:base` as PokemonEntityKey;
      const source = [
        { provider: 'Serebii' as const, url: family.url, note: `Serebii Gold/Silver/Crystal Pokédex identifies ${family.name} as a Johto starter choice and lists its evolution chain.` },
        { provider: 'Bulbapedia' as const, url: family.wiki, note: `Bulbapedia documents ${family.name}'s starter availability and evolution into ${family.middleName} and ${family.finalName}.` },
      ];
      routes.push({
        id: `${baseKey}:${gameId}:starter-soft-reset`, targetEntityKey: baseKey, gameId,
        method: 'soft-reset-gift', huntingMethodId: 'gen2-soft-reset', access: 'native', recommendation: 'eligible-native', directEncounter: false,
        locations: ['New Bark Town — starter choice'], prerequisites: [{ type: 'starter-choice', entityKey: baseKey, note: `Choose ${family.name} as the Johto first partner, then soft reset until shiny.` }],
        explanation: `${family.name} is selected as the starter in Pokémon ${gameId}; it is a soft-reset hunt, not a random encounter.`, sources: source, verifiedAt,
      });
      routes.push({
        id: `${middleKey}:${gameId}:starter-evolution`, targetEntityKey: middleKey, gameId,
        method: 'evolution-from-hunted-shiny', huntingMethodId: 'gen2-soft-reset', access: 'same-save-evolution', recommendation: 'eligible-native', directEncounter: false,
        evolveFromEntityKey: baseKey, locations: ['New Bark Town — starter choice'], prerequisites: [{ type: 'evolve-shiny', entityKey: baseKey, note: `Hunt shiny ${family.name}, then evolve it into ${family.middleName}.` }],
        explanation: `${family.middleName} is obtained by evolving the shiny ${family.name} starter in the same save; it must not be offered as a wild encounter.`, sources: source, verifiedAt,
      });
      routes.push({
        id: `${finalKey}:${gameId}:starter-evolution`, targetEntityKey: finalKey, gameId,
        method: 'evolution-from-hunted-shiny', huntingMethodId: 'gen2-soft-reset', access: 'same-save-evolution', recommendation: 'eligible-native', directEncounter: false,
        evolveFromEntityKey: middleKey, locations: ['New Bark Town — starter choice'], prerequisites: [{ type: 'evolve-shiny', entityKey: middleKey, note: `Hunt shiny ${family.name}, evolve to ${family.middleName}, then evolve again into ${family.finalName}.` }],
        explanation: `${family.finalName} is obtained by evolving the shiny starter line in the same save; it is not a random encounter in Gold, Silver or Crystal.`, sources: source, verifiedAt,
      });
    }
  }
  return routes;
}

const RAW_BASE_POKEMON_HUNT_ROUTES_V2: PokemonHuntRoute[] = [
  {
    id: 'pokemon:432:base:pearl:wild-route-222-229',
    targetEntityKey: 'pokemon:432:base',
    gameId: 'pearl',
    method: 'wild-random-encounter',
    huntingMethodId: 'gen4-random',
    access: 'native',
    recommendation: 'eligible-native',
    directEncounter: true,
    locations: ['Route 222', 'Route 229'],
    prerequisites: [],
    explanation: 'Purugly is directly found in Pokémon Pearl on Routes 222 and 229, so it may be proposed as a native random encounter hunt in Pearl.',
    sources: [
      {
        provider: 'Serebii',
        url: 'https://www.serebii.net/pokedex-dp/432.shtml',
        note: 'Serebii DP Pokédex lists Purugly in Pearl at Routes 222 & 229 and Diamond as trade with Pearl.',
      },
      {
        provider: 'Bulbapedia',
        url: 'https://bulbapedia.bulbagarden.net/wiki/Purugly_(Pok%C3%A9mon)',
        note: 'Bulbapedia species page lists Purugly locations including Routes 222 and 229.',
      },
    ],
    verifiedAt,
  },
  {
    id: 'pokemon:431:base:diamond:external-parent-breeding',
    targetEntityKey: 'pokemon:431:base',
    gameId: 'diamond',
    method: 'breeding',
    huntingMethodId: 'gen4-egg-hatching',
    access: 'external-parent-breeding',
    recommendation: 'eligible-with-external-setup',
    directEncounter: false,
    eggResultEntityKey: 'pokemon:431:base',
    locations: ['Solaceon Town Day Care'],
    prerequisites: [
      {
        type: 'external-parent',
        entityKey: 'pokemon:431:base',
        sourceGameIds: ['pearl'],
        note: 'Requires a Glameow or Purugly line parent obtained from Pearl and traded into Diamond.',
      },
    ],
    explanation: 'Glameow is not a native Diamond encounter, but a compatible Glameow/Purugly parent from Pearl can be bred in Diamond; the egg hatches as Glameow.',
    sources: [
      {
        provider: 'Serebii',
        url: 'https://www.serebii.net/pokedex-dp/432.shtml',
        note: 'Serebii marks Purugly in Diamond as trade with Pearl and Pearl as the native source.',
      },
      {
        provider: 'Bulbapedia',
        url: 'https://bulbapedia.bulbagarden.net/wiki/Glameow_(Pok%C3%A9mon)',
        note: 'Bulbapedia documents Glameow as the base member of the Glameow/Purugly evolutionary line.',
      },
    ],
    verifiedAt,
  },
  {
    id: 'pokemon:432:base:diamond:external-parent-breeding-evolution',
    targetEntityKey: 'pokemon:432:base',
    gameId: 'diamond',
    method: 'breeding-and-evolution',
    huntingMethodId: 'gen4-egg-hatching',
    access: 'external-parent-breeding-evolution',
    recommendation: 'eligible-with-external-setup',
    directEncounter: false,
    eggResultEntityKey: 'pokemon:431:base',
    evolveFromEntityKey: 'pokemon:431:base',
    locations: ['Solaceon Town Day Care'],
    prerequisites: [
      {
        type: 'external-parent',
        entityKey: 'pokemon:431:base',
        sourceGameIds: ['pearl'],
        note: 'Requires a Glameow or Purugly line parent obtained from Pearl and traded into Diamond.',
      },
      {
        type: 'evolve-shiny',
        entityKey: 'pokemon:431:base',
        note: 'Hatch shiny Glameow first, then evolve it into Purugly.',
      },
    ],
    explanation: 'Purugly should not be suggested as a Diamond random encounter. In Diamond it is only a valid hunt with external setup: breed Glameow, then evolve the shiny Glameow.',
    sources: [
      {
        provider: 'Serebii',
        url: 'https://www.serebii.net/pokedex-dp/432.shtml',
        note: 'Serebii lists Diamond as trade with Pearl, not a wild Diamond encounter.',
      },
      {
        provider: 'Bulbapedia',
        url: 'https://bulbapedia.bulbagarden.net/wiki/Glameow_(Pok%C3%A9mon)',
        note: 'Bulbapedia documents that Glameow evolves into Purugly starting at level 38.',
      },
    ],
    verifiedAt,
  },
  {
    id: 'pokemon:387:base:diamond:starter-soft-reset',
    targetEntityKey: 'pokemon:387:base',
    gameId: 'diamond',
    method: 'soft-reset-gift',
    huntingMethodId: 'gen4-soft-reset',
    access: 'native',
    recommendation: 'eligible-native',
    directEncounter: false,
    locations: ['Starter choice'],
    prerequisites: [
      {
        type: 'starter-choice',
        entityKey: 'pokemon:387:base',
        note: 'Choose Turtwig as the Sinnoh first partner Pokémon.',
      },
    ],
    explanation: 'Turtwig is available at the beginning of Pokémon Diamond as a first partner Pokémon, so its shiny hunt is a starter soft-reset hunt, not a random encounter.',
    sources: [
      {
        provider: 'Bulbapedia',
        url: 'https://bulbapedia.bulbagarden.net/wiki/Turtwig_(Pok%C3%A9mon)',
        note: 'Bulbapedia states Turtwig is one of the Sinnoh first partner Pokémon available at the beginning of Diamond/Pearl/Platinum.',
      },
      {
        provider: 'Serebii',
        url: 'https://www.serebii.net/diamondpearl/shinoudex.shtml',
        note: 'Serebii Sinnoh Pokédex includes Turtwig as the first Sinnoh Pokédex entry.',
      },
    ],
    verifiedAt,
  },
  {
    id: 'pokemon:388:base:diamond:starter-evolution',
    targetEntityKey: 'pokemon:388:base',
    gameId: 'diamond',
    method: 'evolution-from-hunted-shiny',
    huntingMethodId: 'gen4-soft-reset',
    access: 'same-save-evolution',
    recommendation: 'eligible-native',
    directEncounter: false,
    evolveFromEntityKey: 'pokemon:387:base',
    locations: ['Starter choice'],
    prerequisites: [
      {
        type: 'starter-choice',
        entityKey: 'pokemon:387:base',
        note: 'Hunt shiny Turtwig as the starter first.',
      },
      {
        type: 'evolve-shiny',
        entityKey: 'pokemon:387:base',
        note: 'Evolve shiny Turtwig into Grotle starting at level 18.',
      },
    ],
    explanation: 'Grotle must not be proposed as a Diamond random encounter. The valid native route is to hunt shiny Turtwig as the starter, then evolve it into Grotle.',
    sources: [
      {
        provider: 'Serebii',
        url: 'https://www.serebii.net/pokedex-dp/388.shtml',
        note: 'Serebii DP Pokédex lists Grotle in Diamond as evolve from Turtwig.',
      },
      {
        provider: 'Bulbapedia',
        url: 'https://bulbapedia.bulbagarden.net/wiki/Turtwig_(Pok%C3%A9mon)',
        note: 'Bulbapedia states Turtwig evolves into Grotle starting at level 18.',
      },
    ],
    verifiedAt,
  },
  ...buildGen2StarterRoutes(),
  ...gen2SpecialRoutes,
  ...gen2RoamingBeasts,
  ...gen2LegendaryStatics,
  ...crystalOddEggRoutes,
  ...bulbasaurBaseRoutes,
  ...gen2BulbasaurFamilyRoutes.filter((route) => route.targetEntityKey !== 'pokemon:1:base'),
  ...bulbasaurEvolutionRoutes,
  ...charmanderBaseRoutes,
  ...charmanderEvolutionRoutes,
  ...squirtleBaseRoutes,
  ...squirtleEvolutionRoutes,
  ...kantoStarterDirectEvolutionExceptions,
  ...caterpieRoutes,
  ...caterpieEvolutionRoutes,
  ...caterpieLineDirectGen2Routes,
  ...GEN1_REMAINING_HUNT_COVERAGE_ROUTES,
  ...GEN1_ADDITIONAL_METHOD_ROUTES,
  ...GEN2_HUNT_COVERAGE_ROUTES,
  ...UNOWN_FORM_HUNT_COVERAGE_ROUTES,
  ...GEN3_HUNT_COVERAGE_ROUTES,
  ...GEN4_HUNT_COVERAGE_ROUTES,
  ...NATIVE_ENCOUNTER_HUNT_ROUTES,
  ...BDSP_POKE_RADAR_HUNT_ROUTES,
  ...PLA_MASS_OUTBREAK_HUNT_ROUTES,
  ...PLA_MASSIVE_MASS_OUTBREAK_HUNT_ROUTES,
  ...SV_MASS_OUTBREAK_HUNT_ROUTES,
];

/**
 * The Gen I coverage matrix deliberately starts with conservative breeding
 * fallbacks. Once every explicit encounter/gift/static route has been loaded,
 * upgrade those fallbacks when any compatible family member is obtainable in
 * the same save. This prevents misleading instructions such as importing a
 * Geodude-family parent into a game that already contains wild Geodude or
 * Graveler, while preserving a genuinely external setup in versions where the
 * family is absent.
 */
function resolveGen1SameSaveBreeding(routes: PokemonHuntRoute[]): PokemonHuntRoute[] {
  const nativeFamilyGames = new Set<string>();
  const gen1FamilyRoots = new Set(routes
    .filter((route) => route.id.includes(':coverage-external-parent-breeding'))
    .map((route) => route.eggResultEntityKey)
    .filter((key): key is PokemonEntityKey => Boolean(key)));

  for (const route of routes) {
    if (route.recommendation !== 'eligible-native') continue;
    const familyRoot = getGen1FamilyRootEntityKey(route.targetEntityKey)
      ?? (gen1FamilyRoots.has(route.targetEntityKey) ? route.targetEntityKey : null);
    if (familyRoot) nativeFamilyGames.add(`${familyRoot}:${route.gameId}`);
  }

  return routes.map((route) => {
    const isBaseFallback = route.id.includes(':coverage-external-parent-breeding');
    if (!isBaseFallback) return route;
    const familyRoot = getGen1FamilyRootEntityKey(route.targetEntityKey);
    if (!familyRoot || !nativeFamilyGames.has(`${familyRoot}:${route.gameId}`)) return route;

    const evolvedTarget = route.method === 'breeding-and-evolution';
    const requiresTradeEvolution = GEN1_TRADE_EVOLUTION_TARGETS.has(route.targetEntityKey)
      && route.gameId !== 'pla';
    const targetName = POKEMON_CATALOG_V2_BY_KEY.get(route.targetEntityKey)?.displayName
      ?? route.targetEntityKey;
    const rootName = POKEMON_CATALOG_V2_BY_KEY.get(familyRoot)?.displayName ?? familyRoot;
    return {
      ...route,
      id: route.id.replace(
        ':coverage-external-parent-',
        ':coverage-local-family-',
      ) as HuntRouteId,
      access: requiresTradeEvolution ? 'external-game-feature' : evolvedTarget ? 'same-save-evolution' : 'native',
      recommendation: requiresTradeEvolution ? 'eligible-with-external-setup' : 'eligible-native',
      prerequisites: [
        ...route.prerequisites.filter((prerequisite) => prerequisite.type !== 'external-parent'),
        ...(requiresTradeEvolution ? [{
          type: 'external-game-feature' as const,
          note: `Trade the shiny ${rootName} family member to trigger the evolution into ${targetName}, then trade it back if desired. A second system/player or equivalent trade setup is required.`,
        }] : []),
      ],
      explanation: evolvedTarget
        ? requiresTradeEvolution
          ? `${targetName} can be hunted without importing a parent in ${route.gameId}: breed shiny ${rootName} from a locally obtainable family member, then use a trade evolution. The breeding hunt is local, but the evolution is not a same-save action.`
          : `${targetName} can be hunted without transfer in ${route.gameId}: obtain a compatible member of the ${rootName} family in the same save, breed shiny ${rootName}, then complete the required evolution.`
        : `${targetName} can be hunted by normal full-odds breeding in ${route.gameId} after obtaining a compatible member of its family in the same save; no imported parent is required.`,
    };
  });
}

const BASE_POKEMON_HUNT_ROUTES_V2 = resolveGen1SameSaveBreeding(RAW_BASE_POKEMON_HUNT_ROUTES_V2);

function getMasudaMethodId(route: PokemonHuntRoute): string | null {
  const generationMatch = route.huntingMethodId.match(/^gen([4-9])-egg-hatching$/u);
  if (!generationMatch) return null;
  if (generationMatch[1] === '8' && (route.gameId === 'brilliantdiamond' || route.gameId === 'shiningpearl')) {
    return 'gen8-bdsp-masuda';
  }
  return `gen${generationMatch[1]}-masuda`;
}

function buildMasudaRoute(route: PokemonHuntRoute): PokemonHuntRoute | null {
  if (route.method !== 'breeding' && route.method !== 'breeding-and-evolution') return null;
  const huntingMethodId = getMasudaMethodId(route);
  if (!huntingMethodId) return null;

  const originalSetup = route.prerequisites[0];
  const originalRouteSuffix = route.id.split(':').slice(4).join('-');
  const languageSetup: HuntRoutePrerequisite = {
    type: 'external-parent',
    ...(originalSetup?.entityKey ? { entityKey: originalSetup.entityKey } : {}),
    ...(originalSetup?.sourceGameIds ? { sourceGameIds: originalSetup.sourceGameIds } : {}),
    note: `Masuda Method requires two compatible parents with different language origins; a foreign-language Ditto can be one parent but is not mandatory.${originalSetup ? ` ${originalSetup.note}` : ''}`,
  };

  return {
    ...route,
    id: `${route.targetEntityKey}:${route.gameId}:masuda-${originalRouteSuffix}` as HuntRouteId,
    huntingMethodId,
    access: route.method === 'breeding-and-evolution'
      ? 'external-parent-breeding-evolution'
      : 'external-parent-breeding',
    recommendation: 'eligible-with-external-setup',
    prerequisites: [languageSetup, ...route.prerequisites.slice(1)],
    explanation: `Masuda Method alternative: ${route.explanation} The two breeding parents must have different language origins; the save file language itself is irrelevant.`,
    sources: [
      ...route.sources,
      {
        provider: 'Bulbapedia',
        url: 'https://bulbapedia.bulbagarden.net/wiki/Masuda_method',
        note: 'Documents the different-language parent requirement and generation-specific Masuda Method shiny rolls.',
      },
    ],
  };
}

const MASUDA_HUNT_ROUTES_V2 = BASE_POKEMON_HUNT_ROUTES_V2
  .map(buildMasudaRoute)
  .filter((route): route is PokemonHuntRoute => route !== null);

function buildGen2ShinyBreedingRoute(route: PokemonHuntRoute): PokemonHuntRoute | null {
  if (route.huntingMethodId !== 'gen2-egg-hatching') return null;
  if (route.method !== 'breeding' && route.method !== 'breeding-and-evolution') return null;
  const originalRouteSuffix = route.id.split(':').slice(4).join('-');
  return {
    ...route,
    id: `${route.targetEntityKey}:${route.gameId}:shiny-gene-${originalRouteSuffix}` as HuntRouteId,
    huntingMethodId: 'gen2-breeding-shiny',
    access: route.method === 'breeding-and-evolution'
      ? 'external-parent-breeding-evolution'
      : 'external-parent-breeding',
    recommendation: 'eligible-with-external-setup',
    prerequisites: [{
      type: 'external-parent',
      ...(route.eggResultEntityKey ? { entityKey: route.eggResultEntityKey } : {}),
      note: 'Use a compatible parent carrying the Generation II shiny DVs; a Shiny Ditto setup gives the consistent 1/64 breeding route.',
    }, ...route.prerequisites],
    explanation: `Generation II shiny-DV breeding alternative: ${route.explanation}`,
    sources: [...route.sources, {
      provider: 'Bulbapedia',
      url: 'https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9mon_breeding#Generation_II',
      note: 'Documents Generation II DV inheritance and shiny breeding probabilities.',
    }],
  };
}

const GEN2_SHINY_BREEDING_ROUTES_V2 = BASE_POKEMON_HUNT_ROUTES_V2
  .map(buildGen2ShinyBreedingRoute)
  .filter((route): route is PokemonHuntRoute => route !== null);

const baseMethodKeys = new Set(BASE_POKEMON_HUNT_ROUTES_V2.map((route) => (
  `${route.targetEntityKey}:${route.gameId}:${route.huntingMethodId}`
)));

function buildDerivedNativeMethodRoute(route: PokemonHuntRoute): PokemonHuntRoute | null {
  if (route.recommendation === 'not-eligible' || !route.directEncounter) return null;
  let huntingMethodId: string | null = null;
  let note = '';
  let sourceUrl = '';

  if (route.huntingMethodId === 'gen6-pokeradar') {
    huntingMethodId = 'gen6-pokeradar-bonus-music';
    note = 'Continue the chain when Poké Radar bonus music activates; use the bonus-music sparkling-patch odds.';
    sourceUrl = 'https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9_Radar';
  } else if ((route.gameId === 'lgp' || route.gameId === 'lge') && route.huntingMethodId === 'gen7-lgpe-random') {
    huntingMethodId = 'gen7-lgpe-combo';
    note = 'Build and maintain a Catch Combo for this species; the boosted rolls apply to the next matching spawn after each catch.';
    sourceUrl = 'https://www.serebii.net/letsgopikachueevee/shinypokemon.shtml';
  } else if (route.huntingMethodId === 'gen8-bdsp-underground') {
    huntingMethodId = 'gen8-bdsp-underground-diglett';
    note = 'Collect 40 Diglett points, then check Grand Underground hideaway spawns during the four-minute bonus.';
    sourceUrl = 'https://www.serebii.net/brilliantdiamondshiningpearl/grandunderground.shtml';
  } else if ((route.gameId === 'sword' || route.gameId === 'shield') && route.huntingMethodId === 'gen8-random') {
    huntingMethodId = 'gen8-murder';
    note = 'Build the species battled count to 500+, then check Brilliant Aura encounters.';
    sourceUrl = 'https://www.serebii.net/swordshield/shinypokemon.shtml';
  } else if ((route.gameId === 'scarlet' || route.gameId === 'violet') && route.huntingMethodId === 'gen9-random') {
    huntingMethodId = 'gen9-sandwich-lv3';
    note = 'Use a level 3 Sparkling Power sandwich matching the target type.';
    sourceUrl = 'https://www.serebii.net/scarletviolet/sandwich.shtml';
  } else if ((route.gameId === 'brilliantdiamond' || route.gameId === 'shiningpearl')
    && route.huntingMethodId === 'gen8-random'
    && /route|forest|lake|garden|meadow|field/iu.test(route.locations.join(' '))) {
    huntingMethodId = 'gen8-bdsp-pokeradar';
    note = 'Obtain the National Pokédex and Poké Radar, then build the chain in a compatible grass patch.';
    sourceUrl = 'https://www.serebii.net/brilliantdiamondshiningpearl/pokeradar.shtml';
  }

  if (!huntingMethodId || baseMethodKeys.has(`${route.targetEntityKey}:${route.gameId}:${huntingMethodId}`)) return null;
  return {
    ...route,
    id: `${route.targetEntityKey}:${route.gameId}:derived-${huntingMethodId}` as HuntRouteId,
    method: huntingMethodId.includes('pokeradar') ? 'poke-radar' : route.method,
    huntingMethodId,
    prerequisites: [...route.prerequisites, { type: 'game-progression', note }],
    explanation: `${route.explanation} Alternative verified hunting method: ${note}`,
    sources: [...route.sources, {
      provider: sourceUrl.includes('serebii.net') ? 'Serebii' : 'Bulbapedia',
      url: sourceUrl,
      note: `Documents the ${huntingMethodId} mechanic and its shiny-hunting conditions.`,
    }],
  };
}

const derivedNativeMethodRouteCandidates = BASE_POKEMON_HUNT_ROUTES_V2
  .map(buildDerivedNativeMethodRoute)
  .filter((route): route is PokemonHuntRoute => route !== null);

const DERIVED_NATIVE_METHOD_ROUTES_V2 = [...new Map(
  derivedNativeMethodRouteCandidates.map((route) => [route.id, route]),
).values()];

function buildGen1EvolutionMethodRoutes(sourceRoutes: PokemonHuntRoute[]): PokemonHuntRoute[] {
  const routes: PokemonHuntRoute[] = [];
  const gen1Targets = [...POKEMON_CATALOG_V2_BY_KEY.values()]
    .filter((entity) => entity.speciesId >= 13 && entity.speciesId <= 151 && entity.formKey === 'base');

  for (const target of gen1Targets) {
    const position = getGen1FamilyPosition(target.key);
    if (!position?.previousEntityKey || position.rootEntityKey === target.key) continue;
    const targetName = target.displayName || target.canonicalName;
    const previousName = POKEMON_CATALOG_V2_BY_KEY.get(position.previousEntityKey)?.displayName
      ?? position.previousEntityKey;
    const rootName = POKEMON_CATALOG_V2_BY_KEY.get(position.rootEntityKey)?.displayName
      ?? position.rootEntityKey;

    for (const source of sourceRoutes) {
      if (source.targetEntityKey !== position.rootEntityKey || source.recommendation === 'not-eligible') continue;
      if (source.method === 'breeding' || source.method === 'breeding-and-evolution'
        || source.method === 'evolution-from-hunted-shiny') continue;
      const sourceSuffix = source.id.split(':').slice(4).join('-');
      const zaBabyOrigin = source.gameId === 'za'
        && source.locations.includes('Lumiose City hunt origin')
        ? GEN1_ZA_BABY_FAMILY_ORIGINS.get(target.key)
        : undefined;
      const usesLinkingCord = GEN1_TRADE_EVOLUTION_TARGETS.has(target.key)
        && source.gameId === 'pla';
      const requiresTradeEvolution = GEN1_TRADE_EVOLUTION_TARGETS.has(target.key)
        && source.gameId !== 'pla';
      routes.push({
        ...source,
        id: `${target.key}:${source.gameId}:evolution-from-${sourceSuffix}` as HuntRouteId,
        targetEntityKey: target.key,
        method: 'evolution-from-hunted-shiny',
        huntingMethodId: zaBabyOrigin?.huntingMethodId ?? source.huntingMethodId,
        access: requiresTradeEvolution
          ? 'external-game-feature'
          : source.recommendation === 'eligible-native' ? 'same-save-evolution' : source.access,
        recommendation: requiresTradeEvolution ? 'eligible-with-external-setup' : source.recommendation,
        directEncounter: false,
        eggResultEntityKey: undefined,
        evolveFromEntityKey: position.previousEntityKey,
        locations: zaBabyOrigin?.locations ?? source.locations,
        prerequisites: [
          ...source.prerequisites,
          {
            type: 'evolve-shiny',
            entityKey: position.previousEntityKey,
            note: `Hunt shiny ${rootName} with this method, then complete its evolution path through ${previousName} into ${targetName}.`,
          },
          ...(requiresTradeEvolution ? [{
            type: 'external-game-feature' as const,
            note: `Trade the shiny ${previousName} to trigger its evolution into ${targetName}, then trade it back if desired. A second system/player or equivalent trade setup is required.`,
          }] : []),
          ...(usesLinkingCord ? [{
            type: 'game-progression' as const,
            note: `Obtain a Linking Cord and use it on shiny ${previousName}; Pokémon Legends: Arceus does not require an external trade for this evolution.`,
          }] : []),
        ],
        explanation: requiresTradeEvolution
          ? `${targetName} can be obtained in ${source.gameId} by hunting shiny ${rootName} with ${source.huntingMethodId}, reaching ${previousName}, then performing the required trade evolution. This is not a direct ${targetName} encounter and cannot be completed only within one save.`
          : usesLinkingCord
            ? `${targetName} can be obtained in Pokémon Legends: Arceus by hunting shiny ${rootName} with ${source.huntingMethodId}, reaching ${previousName}, then using a Linking Cord in the same save.`
            : `${targetName} can be obtained in ${source.gameId} by hunting shiny ${rootName} with ${source.huntingMethodId}, then evolving it in the same save. This is an evolution route, not a direct ${targetName} encounter.`,
      });
    }
  }

  return [...new Map(routes.map((route) => [
    `${route.targetEntityKey}:${route.gameId}:${route.huntingMethodId}:${route.recommendation}`,
    route,
  ])).values()];
}

const GEN1_EVOLUTION_METHOD_ROUTES_V2 = buildGen1EvolutionMethodRoutes([
  ...BASE_POKEMON_HUNT_ROUTES_V2,
  ...DERIVED_NATIVE_METHOD_ROUTES_V2,
  ...GEN6_HUNT_COVERAGE_ROUTES,
]);

function pokemonCentralRouteSource(route: PokemonHuntRoute): HuntRouteSource {
  const entity = POKEMON_CATALOG_V2_BY_KEY.get(route.targetEntityKey);
  const displayName = entity?.displayName || entity?.canonicalName || route.targetEntityKey;
  const pageName = route.targetEntityKey.startsWith('pokemon:201:unown-') ? 'Unown' : displayName.replace(/ /gu, '_');
  return {
    provider: 'Pokémon Central Wiki',
    url: `https://wiki.pokemoncentral.it/${encodeURIComponent(pageName)}`,
    note: gen2Games.includes(route.gameId)
      ? `Pokémon Central Wiki is used as the Italian cross-check for ${displayName}'s Oro, Argento and Cristallo availability, including method/location distinctions.`
      : gen3Games.includes(route.gameId)
        ? `Pokémon Central Wiki is used as the Italian cross-check for ${displayName}'s Rubino, Zaffiro, Smeraldo, Rosso Fuoco and Verde Foglia availability, including method/location distinctions.`
        : gen4Games.includes(route.gameId)
          ? `Pokémon Central Wiki is used as the Italian cross-check for ${displayName}'s Diamante, Perla, Platino, HeartGold and SoulSilver availability, including method/location distinctions.`
          : gen5Games.includes(route.gameId)
            ? `Pokémon Central Wiki is used as the Italian cross-check for ${displayName}'s Nero, Bianco, Nero 2 and Bianco 2 availability, including method/location distinctions such as Super Rod fishing and rippling-water fishing.`
            : `Pokémon Central Wiki is used as the Italian cross-check for ${displayName}'s X, Y, Rubino Omega and Zaffiro Alpha availability, including method/location distinctions such as Horde, DexNav, Poké Radar, Chain Fishing, Fossil Restore and Soft Reset.`,
  };
}

function withEarlyGenerationCentralSource(route: PokemonHuntRoute): PokemonHuntRoute {
  if (![...gen2Games, ...gen3Games, ...gen4Games, ...gen5Games, ...gen6Games].includes(route.gameId) || route.recommendation === 'not-eligible') return route;
  if (route.sources.some((source) => source.provider === 'Pokémon Central Wiki')) return route;
  return { ...route, sources: [...route.sources, pokemonCentralRouteSource(route)] };
}

const CORE_POKEMON_HUNT_ROUTES_V2: PokemonHuntRoute[] = [
  ...BASE_POKEMON_HUNT_ROUTES_V2,
  ...DERIVED_NATIVE_METHOD_ROUTES_V2,
  ...GEN1_EVOLUTION_METHOD_ROUTES_V2,
  ...MASUDA_HUNT_ROUTES_V2,
  ...GEN2_SHINY_BREEDING_ROUTES_V2,
  ...GEN5_FORM_HUNT_COVERAGE_ROUTES,
  ...GEN6_HUNT_COVERAGE_ROUTES,
  ...GEN7_HUNT_COVERAGE_ROUTES,
];

export const POKEMON_HUNT_ROUTES_V2: PokemonHuntRoute[] = [
  ...CORE_POKEMON_HUNT_ROUTES_V2,
  ...buildGen6SupplementalAllGamesRoutes(CORE_POKEMON_HUNT_ROUTES_V2),
  ...buildGen7SupplementalAllGamesRoutes(CORE_POKEMON_HUNT_ROUTES_V2),
].map(withEarlyGenerationCentralSource);

const POKEMON_HUNT_ROUTES_V2_BY_ENTITY = new Map<PokemonEntityKey, PokemonHuntRoute[]>();
for (const route of POKEMON_HUNT_ROUTES_V2) {
  const entityRoutes = POKEMON_HUNT_ROUTES_V2_BY_ENTITY.get(route.targetEntityKey);
  if (entityRoutes) entityRoutes.push(route);
  else POKEMON_HUNT_ROUTES_V2_BY_ENTITY.set(route.targetEntityKey, [route]);
}

const allowedSourceHosts = ['serebii.net', 'www.serebii.net', 'bulbapedia.bulbagarden.net', 'wiki.pokemoncentral.it'];
const validGameIds = new Set<string>(TRACKED_GAME_IDS);
const validMethodIds = new Set(HUNTING_METHODS.map((method) => method.id));

export function validatePokemonHuntRoutesV2(routes: PokemonHuntRoute[] = POKEMON_HUNT_ROUTES_V2): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const nativeGen1FamilyGames = new Set<string>();
  const gen1FamilyRoots = new Set(routes
    .filter((route) => route.id.includes(':coverage-external-parent-breeding'))
    .map((route) => route.eggResultEntityKey)
    .filter((key): key is PokemonEntityKey => Boolean(key)));

  for (const route of routes) {
    if (route.recommendation !== 'eligible-native') continue;
    const familyRoot = getGen1FamilyRootEntityKey(route.targetEntityKey)
      ?? (gen1FamilyRoots.has(route.targetEntityKey) ? route.targetEntityKey : null);
    if (familyRoot) nativeGen1FamilyGames.add(`${familyRoot}:${route.gameId}`);
  }

  routes.forEach((route, index) => {
    const location = `huntRoutes[${index}] (${route.id})`;
    if (ids.has(route.id)) errors.push(`${location}: duplicate route id`);
    ids.add(route.id);
    if (!POKEMON_CATALOG_V2_BY_KEY.has(route.targetEntityKey)) {
      errors.push(`${location}: unknown targetEntityKey ${route.targetEntityKey}`);
    }
    if (route.eggResultEntityKey && !POKEMON_CATALOG_V2_BY_KEY.has(route.eggResultEntityKey)) {
      errors.push(`${location}: unknown eggResultEntityKey ${route.eggResultEntityKey}`);
    }
    if (route.evolveFromEntityKey && !POKEMON_CATALOG_V2_BY_KEY.has(route.evolveFromEntityKey)) {
      errors.push(`${location}: unknown evolveFromEntityKey ${route.evolveFromEntityKey}`);
    }
    route.prerequisites.forEach((prerequisite, prerequisiteIndex) => {
      if (prerequisite.entityKey && !POKEMON_CATALOG_V2_BY_KEY.has(prerequisite.entityKey)) {
        errors.push(`${location}: prerequisite[${prerequisiteIndex}] unknown entityKey ${prerequisite.entityKey}`);
      }
      prerequisite.sourceGameIds?.forEach((gameId) => {
        if (!validGameIds.has(gameId)) errors.push(`${location}: prerequisite[${prerequisiteIndex}] unknown sourceGameId ${gameId}`);
      });
    });
    if (!validGameIds.has(route.gameId)) errors.push(`${location}: unknown gameId ${route.gameId}`);
    if (!validMethodIds.has(route.huntingMethodId)) errors.push(`${location}: unknown huntingMethodId ${route.huntingMethodId}`);
    if (!route.sources.length) errors.push(`${location}: at least one source is required`);
    route.sources.forEach((source, sourceIndex) => {
      let host = '';
      try {
        host = new URL(source.url).hostname;
      } catch {
        errors.push(`${location}: source[${sourceIndex}] invalid URL`);
      }
      if (host && !allowedSourceHosts.includes(host)) {
        errors.push(`${location}: source[${sourceIndex}] forbidden host ${host}`);
      }
      if (source.provider === 'Serebii' && !host.endsWith('serebii.net')) {
        errors.push(`${location}: source[${sourceIndex}] provider/host mismatch`);
      }
      if (source.provider === 'Bulbapedia' && host !== 'bulbapedia.bulbagarden.net') {
        errors.push(`${location}: source[${sourceIndex}] provider/host mismatch`);
      }
    });
    if (route.recommendation === 'eligible-native' && route.access !== 'native' && route.access !== 'same-save-evolution' && route.access !== 'same-save-form-change') {
      errors.push(`${location}: eligible-native cannot require external setup`);
    }
    if (route.directEncounter && route.method !== 'wild-random-encounter' && route.method !== 'poke-radar' && route.method !== 'roaming-encounter') {
      errors.push(`${location}: direct encounters must use an encounter method`);
    }
    if (route.method === 'breeding-and-evolution' && (!route.eggResultEntityKey || !route.evolveFromEntityKey)) {
      errors.push(`${location}: breeding-and-evolution requires eggResultEntityKey and evolveFromEntityKey`);
    }
    if (route.id.includes(':coverage-external-parent-breeding')) {
      const familyRoot = getGen1FamilyRootEntityKey(route.targetEntityKey);
      if (familyRoot && nativeGen1FamilyGames.has(`${familyRoot}:${route.gameId}`)) {
        errors.push(`${location}: external parent is invalid because this family is obtainable in the same save`);
      }
    }
  });

  return errors;
}

export function getVerifiedHuntRoutesForEntity(entityKey: PokemonEntityKey, options: { includeExternalSetup?: boolean } = {}) {
  const entityRoutes = POKEMON_HUNT_ROUTES_V2_BY_ENTITY.get(entityKey) ?? [];
  const isGenericCoverageRoute = (route: PokemonHuntRoute) => route.locations.some((location) => (
    /^(?:Documented in-game(?: family)? encounter|Lumiose City hunt origin)$/iu.test(location)
  ));
  return entityRoutes.filter((route) => {
    if (route.recommendation === 'not-eligible') return false;
    if (!options.includeExternalSetup && route.recommendation === 'eligible-with-external-setup') return false;
    if (isGenericCoverageRoute(route) && entityRoutes.some((alternative) => (
      alternative !== route
      && alternative.gameId === route.gameId
      && alternative.recommendation !== 'not-eligible'
      && !isGenericCoverageRoute(alternative)
    ))) return false;
    return true;
  });
}
