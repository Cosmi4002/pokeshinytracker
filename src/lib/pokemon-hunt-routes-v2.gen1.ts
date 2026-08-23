import type { PokemonEntityKey } from './pokemon-catalog-v2';
import { POKEMON_CATALOG_V2_BY_KEY } from './pokemon-catalog-v2.registry';
import {
  getCuratedShinyOriginGameIds,
  TRACKED_GAME_IDS,
  type TrackedGameId,
} from './pokemon-game-availability';
import type {
  HuntRouteId,
  HuntRouteSource,
  PokemonHuntRoute,
} from './pokemon-hunt-routes-v2';

/**
 * Complete decision matrix for the remaining Generation I species (#013-151).
 *
 * This layer is intentionally conservative. In games with breeding, it records
 * a guaranteed-valid egg/evolution route that may require an imported parent;
 * it never upgrades that route to a native encounter without a separate,
 * species-specific record. Games without breeding use only an in-game origin
 * recorded by the curated availability table. This keeps the randomizer from
 * inventing combinations such as a wild species in a version where it is only
 * obtainable after trade/setup.
 */

const verifiedAt = '2026-08-21';
const FIRST_SPECIES = 13;
const LAST_SPECIES = 151;

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
const noEggSpecies = new Set([132, 144, 145, 146, 150, 151]);
const fossilSpecies = new Set([138, 139, 140, 141, 142]);
const tradeEvolutionSpecies = new Set([65, 68, 76, 94]);

const zaFamilyOrigins = new Map<number, { huntingMethodId: string; locations: string[] }>([
  [13, { huntingMethodId: 'gen9-zone-bench-soft-reset', locations: ['Wild Zone 1'] }],
  [16, { huntingMethodId: 'gen9-zone-bench-soft-reset', locations: ['Wild Zone 1', 'Wild Zone 5'] }],
  [23, { huntingMethodId: 'gen9-zone-bench-soft-reset', locations: ['Wild Zone 4'] }],
  [41, { huntingMethodId: 'gen9-hyperspace', locations: ['Poison-type Hyperspace Wild Zones'] }],
  [52, { huntingMethodId: 'gen9-hyperspace', locations: ['Normal-type Hyperspace Wild Zones'] }],
  [56, { huntingMethodId: 'gen9-hyperspace', locations: ['Fighting-type Hyperspace Wild Zones'] }],
  [63, { huntingMethodId: 'gen9-zone-bench-soft-reset', locations: ['Wild Zone 5'] }],
  [66, { huntingMethodId: 'gen9-zone-bench-soft-reset', locations: ['Wild Zone 8', 'Wild Zone 12'] }],
  [69, { huntingMethodId: 'gen9-zone-bench-soft-reset', locations: ['Wild Zone 5', 'Wild Zone 10'] }],
  [79, { huntingMethodId: 'gen9-zone-bench-soft-reset', locations: ['Wild Zone 10', 'Wild Zone 11'] }],
  [83, { huntingMethodId: 'gen9-hyperspace', locations: ['Normal-type Hyperspace Wild Zones'] }],
  [92, { huntingMethodId: 'gen9-zone-bench-soft-reset', locations: ['Wild Zone 4', 'Wild Zone 7'] }],
  [95, { huntingMethodId: 'gen9-zone-bench-soft-reset', locations: ['Wild Zone 14'] }],
  [104, { huntingMethodId: 'gen9-hyperspace', locations: ['Ground-type Hyperspace Wild Zones'] }],
  [115, { huntingMethodId: 'gen9-zone-bench-soft-reset', locations: ['Wild Zone 19', 'Wild Zone 20'] }],
  [120, { huntingMethodId: 'gen9-zone-bench-soft-reset', locations: ['Wild Zone 2', 'Wild Zone 10'] }],
  [123, { huntingMethodId: 'gen9-zone-bench-soft-reset', locations: ['Wild Zone 13'] }],
  [127, { huntingMethodId: 'gen9-zone-bench-soft-reset', locations: ['Wild Zone 13', 'Wild Zone 20'] }],
  [129, { huntingMethodId: 'gen9-zone-bench-soft-reset', locations: ['Wild Zone 2', 'Wild Zone 6'] }],
  [133, { huntingMethodId: 'gen9-zone-bench-soft-reset', locations: ['Wild Zone 19'] }],
  [137, { huntingMethodId: 'gen9-hyperspace', locations: ['Normal-type Hyperspace Wild Zones'] }],
  [147, { huntingMethodId: 'gen9-hyperspace', locations: ['Dragon-type Hyperspace Wild Zones'] }],
]);

const familyChains: number[][] = [
  [13, 14, 15], [16, 17, 18], [19, 20], [21, 22], [23, 24], [172, 25, 26],
  [27, 28], [29, 30, 31], [32, 33, 34], [173, 35, 36], [37, 38],
  [174, 39, 40], [41, 42], [43, 44, 45], [46, 47], [48, 49], [50, 51],
  [52, 53], [54, 55], [56, 57], [58, 59], [60, 61, 62], [63, 64, 65],
  [66, 67, 68], [69, 70, 71], [72, 73], [74, 75, 76], [77, 78], [79, 80],
  [81, 82], [84, 85], [86, 87], [88, 89], [90, 91], [92, 93, 94],
  [96, 97], [98, 99], [100, 101], [102, 103], [104, 105], [236, 106],
  [236, 107], [109, 110], [111, 112], [116, 117], [118, 119], [120, 121],
  [439, 122], [238, 124], [239, 125], [240, 126], [129, 130], [133, 134], [133, 135],
  [133, 136], [138, 139], [140, 141], [147, 148, 149], [440, 113], [446, 143],
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
    // Branch families (Tyrogue and Eevee) share their root; target entries must
    // retain their own immediate predecessor.
    if (!existing || speciesId !== chain[0]) {
      familyBySpecies.set(speciesId, {
        rootId: chain[0],
        previousId: index > 0 ? chain[index - 1] : undefined,
      });
    }
  }
}

function entityKey(speciesId: number): PokemonEntityKey {
  return `pokemon:${speciesId}:base` as PokemonEntityKey;
}

export function getGen1FamilyRootEntityKey(targetEntityKey: PokemonEntityKey): PokemonEntityKey | null {
  const match = targetEntityKey.match(/^pokemon:(\d+):([^:]+)$/u);
  if (!match) return null;
  // Regional and other huntable forms require their own family/form rules.
  // Never let an Alolan/Galarian/Hisuian encounter silently prove that the
  // original Kanto form can be bred locally.
  if (match[2] !== 'base') return null;
  const speciesId = Number(match[1]);
  if (speciesId < FIRST_SPECIES || speciesId > LAST_SPECIES) return null;
  return entityKey(familyBySpecies.get(speciesId)?.rootId ?? speciesId);
}

export function getGen1FamilyPosition(targetEntityKey: PokemonEntityKey): {
  rootEntityKey: PokemonEntityKey;
  previousEntityKey?: PokemonEntityKey;
} | null {
  const match = targetEntityKey.match(/^pokemon:(\d+):base$/u);
  if (!match) return null;
  const speciesId = Number(match[1]);
  if (speciesId < FIRST_SPECIES || speciesId > LAST_SPECIES) return null;
  const family = familyBySpecies.get(speciesId);
  if (!family) return { rootEntityKey: entityKey(speciesId) };
  return {
    rootEntityKey: entityKey(family.rootId),
    previousEntityKey: family.previousId ? entityKey(family.previousId) : undefined,
  };
}

function entityName(speciesId: number): string {
  const entity = POKEMON_CATALOG_V2_BY_KEY.get(entityKey(speciesId));
  if (!entity) throw new Error(`Missing catalog entity for National Dex #${speciesId}`);
  return entity.displayName || entity.canonicalName;
}

function serebiiSlug(speciesId: number): string {
  return POKEMON_CATALOG_V2_BY_KEY.get(entityKey(speciesId))?.canonicalName
    .replace('mr-mime', 'mr.mime')
    .replace('farfetchd', 'farfetchd') || String(speciesId);
}

function bulbapediaName(speciesId: number): string {
  const special: Record<number, string> = {
    29: 'Nidoran♀', 32: 'Nidoran♂', 83: "Farfetch'd", 122: 'Mr._Mime',
  };
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
      url: `https://www.serebii.net/pokemon/${serebiiSlug(speciesId)}/`,
      note: `Serebii's ${name} Pokédex page cross-checks game locations and evolutionary availability. ${note}`,
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

function genericEncounterMethod(gameId: TrackedGameId): string {
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
  method?: PokemonHuntRoute['method'];
  directEncounter?: boolean;
  targetChancePercent?: number;
  explanation: string;
}

const specialOrigins = new Map<string, SpecialOrigin>();

function addSpecial(speciesId: number, gameIds: readonly TrackedGameId[], origin: SpecialOrigin) {
  for (const gameId of gameIds) specialOrigins.set(`${speciesId}:${gameId}`, origin);
}

function addFossilRestore(speciesId: 138 | 140 | 142, gameIds: readonly TrackedGameId[], location: string) {
  for (const gameId of gameIds) {
    addSpecial(speciesId, [gameId], {
      location,
      huntingMethodId: `gen${generationByGame[gameId]}-fossil-restore`,
      method: 'static-encounter',
      explanation: `${entityName(speciesId)} can be shiny hunted by restoring its fossil in ${gameId}; this is Fossil Restore, not Breeding or a wild encounter.`,
    });
  }
}

addFossilRestore(138, ['firered', 'leafgreen'], 'Cinnabar Island Pokémon Lab — Helix Fossil');
addFossilRestore(140, ['firered', 'leafgreen'], 'Cinnabar Island Pokémon Lab — Dome Fossil');
addFossilRestore(142, ['firered', 'leafgreen'], 'Cinnabar Island Pokémon Lab — Old Amber');
for (const speciesId of [138, 140, 142] as const) {
  addFossilRestore(speciesId, ['diamond', 'pearl', 'platinum'], 'Oreburgh Mining Museum');
  addFossilRestore(speciesId, ['black', 'white', 'black2', 'white2'], 'Nacrene City Museum — Twist Mountain fossil');
  addFossilRestore(speciesId, ['sun', 'moon', 'ultrasun', 'ultramoon'], 'Fossil Restoration Center — Route 8');
  addFossilRestore(speciesId, ['brilliantdiamond', 'shiningpearl'], 'Oreburgh Mining Museum — Grand Underground fossil');
}
addFossilRestore(138, ['heartgold'], 'Pewter Museum — Helix Fossil');
addFossilRestore(140, ['soulsilver'], 'Pewter Museum — Dome Fossil');
addFossilRestore(142, ['heartgold', 'soulsilver'], 'Pewter Museum — Old Amber');
addFossilRestore(138, ['y'], 'Ambrette Town Fossil Lab — Helix Fossil');
addFossilRestore(140, ['y'], 'Ambrette Town Fossil Lab — Dome Fossil');
addFossilRestore(142, ['x', 'y'], 'Ambrette Town Fossil Lab — Old Amber');
addFossilRestore(138, ['alphasapphire'], 'Devon Corporation — Helix Fossil from a Mirage Spot');
addFossilRestore(140, ['omegaruby'], 'Devon Corporation — Dome Fossil from a Mirage Spot');
addFossilRestore(142, ['omegaruby', 'alphasapphire'], 'Devon Corporation — Old Amber from a Mirage Spot');
addFossilRestore(142, ['za'], 'Pokémon Research Lab 2F — Old Amber');

addSpecial(133, ['gold', 'silver', 'crystal'], { location: "Bill's house — Goldenrod City", huntingMethodId: 'gen2-gift', method: 'soft-reset-gift', explanation: 'Bill gives Eevee in Goldenrod City; save before accepting it and reset after checking the generated Pokémon.' });
addSpecial(147, ['crystal'], { location: "Dragon's Den shrine", huntingMethodId: 'gen2-gift', method: 'soft-reset-gift', explanation: 'The Extreme Speed Dratini is a gift generated after the Dragon Shrine quiz and can be checked by resetting before receipt.' });
for (const speciesId of [106, 107] as const) {
  addSpecial(speciesId, ['firered', 'leafgreen'], { location: 'Saffron City Fighting Dojo', huntingMethodId: 'gen3-gift', method: 'soft-reset-gift', explanation: `${entityName(speciesId)} is one of the two Fighting Dojo gifts; save before choosing it and reset after each shiny check.` });
}
addSpecial(131, ['firered', 'leafgreen'], { location: 'Silph Co. — Saffron City', huntingMethodId: 'gen3-gift', method: 'soft-reset-gift', explanation: 'Lapras is received from the Silph Co. employee and is checked as a gift Pokémon, separately from wild Lapras encounters.' });
addSpecial(133, ['firered', 'leafgreen'], { location: 'Celadon Mansion', huntingMethodId: 'gen3-gift', method: 'soft-reset-gift', explanation: 'Eevee is received at Celadon Mansion and can be checked by saving before accepting the gift.' });
addSpecial(133, ['diamond', 'pearl', 'platinum'], { location: "Bebe's house — Hearthome City", huntingMethodId: 'gen4-gift', method: 'soft-reset-gift', explanation: 'Bebe gives Eevee in Hearthome City; the gift route is kept separate from Trophy Garden encounters.' });
addSpecial(137, ['platinum'], { location: 'Veilstone City', huntingMethodId: 'gen4-gift', method: 'soft-reset-gift', explanation: 'Porygon is received as a Veilstone City gift in Platinum and is hunted by resetting before receipt.' });
addSpecial(133, ['heartgold', 'soulsilver'], { location: "Bill's house — Goldenrod City", huntingMethodId: 'gen4-gift', method: 'soft-reset-gift', explanation: 'Bill gives Eevee in Goldenrod City; this gift is checked separately from wild and Game Corner methods.' });
addSpecial(147, ['heartgold', 'soulsilver'], { location: "Dragon's Den shrine", huntingMethodId: 'gen4-gift', method: 'soft-reset-gift', explanation: 'The Dragon Shrine Dratini is a gift encounter checked by saving before receipt.' });
addSpecial(147, ['white2'], { location: "Alder's house — Floccesy Town", huntingMethodId: 'gen5-gift', method: 'soft-reset-gift', targetChancePercent: 100, explanation: 'Benga gives a guaranteed shiny Dratini in White 2 after the White Treehollow challenge; no random shiny roll is required.' });
addSpecial(131, ['x', 'y'], { location: 'Route 12', huntingMethodId: 'gen6-gift', method: 'soft-reset-gift', explanation: 'Lapras is received as a Route 12 gift and is kept separate from Friend Safari and other encounter methods.' });
addSpecial(133, ['brilliantdiamond', 'shiningpearl'], { location: "Bebe's house — Hearthome City", huntingMethodId: 'gen8-gift', method: 'soft-reset-gift', explanation: 'Bebe gives Eevee after the National Pokédex; this is a gift check rather than a Grand Underground encounter.' });

addSpecial(144, ['firered', 'leafgreen'], { location: 'Seafoam Islands', huntingMethodId: 'gen3-soft-reset', method: 'static-encounter', explanation: 'Articuno is a stationary encounter hunted by saving before the battle and soft resetting.' });
addSpecial(145, ['firered', 'leafgreen'], { location: 'Kanto Power Plant', huntingMethodId: 'gen3-soft-reset', method: 'static-encounter', explanation: 'Zapdos is a stationary encounter hunted by saving before the battle and soft resetting.' });
addSpecial(146, ['firered', 'leafgreen'], { location: 'Mt. Ember', huntingMethodId: 'gen3-soft-reset', method: 'static-encounter', explanation: 'Moltres is a stationary encounter hunted by saving before the battle and soft resetting.' });
for (const speciesId of [144, 145, 146]) {
  addSpecial(speciesId, ['platinum'], { location: 'Roaming Sinnoh after Professor Oak event', huntingMethodId: 'gen4-roaming', method: 'roaming-encounter', directEncounter: true, explanation: `${entityName(speciesId)} is a roaming encounter in Platinum, not a fixed battle.` });
}
addSpecial(144, ['heartgold', 'soulsilver'], { location: 'Seafoam Islands', huntingMethodId: 'gen4-soft-reset', method: 'static-encounter', explanation: 'Articuno is a stationary Kanto encounter hunted by soft resetting.' });
addSpecial(145, ['heartgold', 'soulsilver'], { location: 'Route 10 — outside the Power Plant', huntingMethodId: 'gen4-soft-reset', method: 'static-encounter', explanation: 'Zapdos is a stationary Kanto encounter hunted by soft resetting.' });
addSpecial(146, ['heartgold', 'soulsilver'], { location: 'Mt. Silver', huntingMethodId: 'gen4-soft-reset', method: 'static-encounter', explanation: 'Moltres is a stationary Kanto encounter hunted by soft resetting.' });
for (const speciesId of [144, 145, 146, 150]) {
  addSpecial(speciesId, ['ultrasun', 'ultramoon'], { location: 'Ultra Space Wilds', huntingMethodId: 'gen7-soft-reset', method: 'static-encounter', explanation: `${entityName(speciesId)} is a non-shiny-locked Ultra Space legendary hunted by soft resetting before the encounter.` });
  addSpecial(speciesId, ['sword', 'shield'], { location: 'Max Lair — Dynamax Adventures', huntingMethodId: 'gen8-dynamax', method: 'static-encounter', explanation: `${entityName(speciesId)} can originate shiny from Dynamax Adventures; the result is checked on the selection screen.` });
}
addSpecial(144, ['lgp', 'lge'], { location: 'Seafoam Islands', huntingMethodId: 'gen7-soft-reset', method: 'static-encounter', explanation: 'Articuno is a stationary encounter hunted by soft resetting.' });
addSpecial(145, ['lgp', 'lge'], { location: 'Kanto Power Plant', huntingMethodId: 'gen7-soft-reset', method: 'static-encounter', explanation: 'Zapdos is a stationary encounter hunted by soft resetting.' });
addSpecial(146, ['lgp', 'lge'], { location: 'Victory Road', huntingMethodId: 'gen7-soft-reset', method: 'static-encounter', explanation: 'Moltres is a stationary encounter hunted by soft resetting.' });
for (const speciesId of [144, 145, 146]) {
  addSpecial(speciesId, ['shiningpearl'], { location: 'Ramanas Park — Kanto Room', huntingMethodId: 'gen8-soft-reset', method: 'static-encounter', explanation: `${entityName(speciesId)} is a Ramanas Park static encounter in Shining Pearl hunted by soft resetting.` });
}
addSpecial(150, ['firered', 'leafgreen'], { location: 'Cerulean Cave', huntingMethodId: 'gen3-soft-reset', method: 'static-encounter', explanation: 'Mewtwo is a stationary encounter hunted by soft resetting.' });
addSpecial(150, ['heartgold', 'soulsilver'], { location: 'Cerulean Cave', huntingMethodId: 'gen4-soft-reset', method: 'static-encounter', explanation: 'Mewtwo is a stationary encounter hunted by soft resetting.' });
addSpecial(150, ['lgp', 'lge'], { location: 'Cerulean Cave', huntingMethodId: 'gen7-soft-reset', method: 'static-encounter', explanation: 'Mewtwo is a stationary encounter hunted by soft resetting.' });
addSpecial(150, ['brilliantdiamond', 'shiningpearl'], { location: 'Ramanas Park — Genome Room', huntingMethodId: 'gen8-soft-reset', method: 'static-encounter', explanation: 'Mewtwo is a Ramanas Park static encounter hunted by soft resetting.' });
addSpecial(151, ['emerald'], { location: 'Faraway Island — Japanese Old Sea Map event', huntingMethodId: 'gen3-runaway', method: 'wild-random-encounter', directEncounter: true, explanation: 'Mew can originate shiny only from the Japanese Emerald Faraway Island encounter; access requires the historical Old Sea Map event item.' });

function unavailableRoute(speciesId: number, gameId: TrackedGameId): PokemonHuntRoute {
  const key = entityKey(speciesId);
  const name = entityName(speciesId);
  return {
    id: `${key}:${gameId}:coverage-unobtainable` as HuntRouteId,
    targetEntityKey: key,
    gameId,
    method: 'unavailable',
    huntingMethodId: 'custom',
    access: 'unobtainable',
    recommendation: 'not-eligible',
    directEncounter: false,
    locations: [],
    prerequisites: [],
    explanation: `${name} cannot originate as a shiny in ${gameId}; transfer-only ownership is not a hunt in that game, so this pairing is excluded from the randomizer.`,
    sources: sourcesFor(speciesId, `The curated shiny-origin table excludes ${gameId}.`),
    verifiedAt,
  };
}

function specialOriginRoute(speciesId: number, gameId: TrackedGameId, origin: SpecialOrigin): PokemonHuntRoute {
  const key = entityKey(speciesId);
  const isMewEvent = speciesId === 151;
  const sources = sourcesFor(speciesId, origin.explanation);
  if (isMewEvent) {
    sources[0] = {
      provider: 'Serebii',
      url: 'https://www.serebii.net/pokedex-rs/151.shtml',
      note: 'Serebii lists Emerald Mew at Faraway Island and the other Generation III versions only as trades from Emerald.',
    };
  }
  return {
    id: `${key}:${gameId}:coverage-special-origin` as HuntRouteId,
    targetEntityKey: key,
    gameId,
    method: origin.method || 'static-encounter',
    huntingMethodId: origin.huntingMethodId,
    access: isMewEvent ? 'external-game-feature' : 'native',
    recommendation: isMewEvent ? 'eligible-with-external-setup' : 'eligible-native',
    directEncounter: origin.directEncounter || false,
    targetChancePercent: origin.targetChancePercent,
    locations: [origin.location],
    prerequisites: isMewEvent ? [{ type: 'external-game-feature', note: 'Requires a legitimate Japanese Emerald save with access to Faraway Island through the Old Sea Map event.' }] : [],
    explanation: origin.explanation,
    sources,
    verifiedAt,
  };
}

function noBreedingGameRoute(speciesId: number, gameId: TrackedGameId): PokemonHuntRoute {
  const key = entityKey(speciesId);
  const name = entityName(speciesId);
  const family = familyBySpecies.get(speciesId);
  const rootAvailable = family && family.rootId !== speciesId
    ? getCuratedShinyOriginGameIds(family.rootId, POKEMON_CATALOG_V2_BY_KEY.get(entityKey(family.rootId))?.canonicalName)?.includes(gameId)
    : false;

  if (family?.previousId && rootAvailable) {
    const zaOrigin = gameId === 'za' ? zaFamilyOrigins.get(family.rootId) : undefined;
    const usesLinkingCord = gameId === 'pla' && tradeEvolutionSpecies.has(speciesId);
    const requiresTrade = !usesLinkingCord && tradeEvolutionSpecies.has(speciesId);
    return {
      id: `${key}:${gameId}:coverage-evolution` as HuntRouteId,
      targetEntityKey: key,
      gameId,
      method: 'evolution-from-hunted-shiny',
      huntingMethodId: zaOrigin?.huntingMethodId ?? genericEncounterMethod(gameId),
      access: requiresTrade ? 'external-game-feature' : 'same-save-evolution',
      recommendation: requiresTrade ? 'eligible-with-external-setup' : 'eligible-native',
      directEncounter: false,
      evolveFromEntityKey: entityKey(family.previousId),
      locations: zaOrigin?.locations ?? ['Documented in-game family encounter'],
      prerequisites: [
        { type: 'evolve-shiny', entityKey: entityKey(family.previousId), note: `Hunt the available ${entityName(family.rootId)} family origin in ${gameId}, then evolve it into ${name}.` },
        ...(requiresTrade ? [{
          type: 'external-game-feature' as const,
          note: `Trade shiny ${entityName(family.previousId)} to trigger the evolution into ${name}, then trade it back if desired.`,
        }] : []),
        ...(usesLinkingCord ? [{
          type: 'game-progression' as const,
          note: `Obtain a Linking Cord and use it on shiny ${entityName(family.previousId)}; Pokémon Legends: Arceus does not require an external trade for this evolution.`,
        }] : []),
      ],
      explanation: requiresTrade
        ? `${name} is obtained from the hunted shiny family member through a trade evolution; the hunt origin is in ${gameId}, but completing the evolution requires another player/system or equivalent trade setup.`
        : usesLinkingCord
          ? `${name} is obtained in Pokémon Legends: Arceus by using a Linking Cord on the hunted shiny family member, entirely within the same save.`
          : `${name} is represented by a same-save evolution route in ${gameId}; the randomizer must not invent breeding in a game without breeding.`,
      sources: sourcesFor(speciesId, `The family has an in-game shiny origin in ${gameId}.`),
      verifiedAt,
    };
  }

  const fossilRestore = fossilSpecies.has(speciesId) && (gameId === 'lgp' || gameId === 'lge');
  const zaOrigin = gameId === 'za' ? zaFamilyOrigins.get(speciesId) : undefined;
  return {
    id: `${key}:${gameId}:coverage-${fossilRestore ? 'fossil-restore' : 'direct-origin'}` as HuntRouteId,
    targetEntityKey: key,
    gameId,
    method: fossilRestore ? 'static-encounter' : 'wild-random-encounter',
    huntingMethodId: fossilRestore ? 'gen7-fossil-restore' : zaOrigin?.huntingMethodId ?? genericEncounterMethod(gameId),
    access: 'native',
    recommendation: 'eligible-native',
    directEncounter: !fossilRestore,
    locations: fossilRestore ? ['Cinnabar Island Pokémon Lab'] : zaOrigin?.locations ?? ['Documented in-game encounter'],
    prerequisites: fossilRestore ? [{ type: 'game-progression', note: 'Restore the corresponding fossil at the Cinnabar Island Pokémon Lab.' }] : [],
    explanation: fossilRestore
      ? `${name} is hunted by repeatedly restoring its fossil in ${gameId}.`
      : `${name} has a documented in-game shiny origin in ${gameId}; this route uses the game's encounter method and does not require breeding.`,
    sources: sourcesFor(speciesId, `The curated shiny-origin table includes ${gameId}.`),
    verifiedAt,
  };
}

function breedingRoute(speciesId: number, gameId: TrackedGameId): PokemonHuntRoute {
  const key = entityKey(speciesId);
  const name = entityName(speciesId);
  const family = familyBySpecies.get(speciesId);
  const rootId = family?.rootId || speciesId;
  const rootKey = entityKey(rootId);
  const rootName = entityName(rootId);
  const evolvedTarget = Boolean(family?.previousId);
  const method = evolvedTarget ? 'breeding-and-evolution' : 'breeding';
  return {
    id: `${key}:${gameId}:coverage-external-parent-${evolvedTarget ? 'breeding-evolution' : 'breeding'}` as HuntRouteId,
    targetEntityKey: key,
    gameId,
    method,
    huntingMethodId: breedingMethod(gameId),
    access: evolvedTarget ? 'external-parent-breeding-evolution' : 'external-parent-breeding',
    recommendation: 'eligible-with-external-setup',
    directEncounter: false,
    eggResultEntityKey: rootKey,
    evolveFromEntityKey: evolvedTarget ? entityKey(family!.previousId!) : undefined,
    locations: [breedingLocation(gameId)],
    prerequisites: [
      { type: 'external-parent', entityKey: rootKey, note: `Import or trade a compatible ${rootName}-family parent into ${gameId}; this conservative route does not assume a native encounter.` },
      ...(evolvedTarget ? [{ type: 'evolve-shiny' as const, entityKey: entityKey(family!.previousId!), note: `Hatch shiny ${rootName}, then complete the family evolution path to ${name}.` }] : []),
    ],
    explanation: evolvedTarget
      ? `${name} is safely huntable in ${gameId} by breeding the externally sourced family parent for shiny ${rootName}, then evolving it. No direct encounter is inferred.`
      : `${name} is safely huntable in ${gameId} by breeding an externally sourced compatible parent. No native encounter is inferred.`,
    sources: sourcesFor(speciesId, `The curated shiny-origin table includes an egg origin in ${gameId}.`),
    verifiedAt,
  };
}

function directOriginRoute(speciesId: number, gameId: TrackedGameId): PokemonHuntRoute {
  const key = entityKey(speciesId);
  const name = entityName(speciesId);
  return {
    id: `${key}:${gameId}:coverage-direct-origin` as HuntRouteId,
    targetEntityKey: key,
    gameId,
    method: 'wild-random-encounter',
    huntingMethodId: genericEncounterMethod(gameId),
    access: 'native',
    recommendation: 'eligible-native',
    directEncounter: true,
    locations: ['Documented in-game encounter'],
    prerequisites: [],
    explanation: `${name} cannot be bred; the curated origin table confirms an in-game shiny encounter in ${gameId}.`,
    sources: sourcesFor(speciesId, `The curated shiny-origin table includes a direct ${gameId} origin.`),
    verifiedAt,
  };
}

function buildCoverageRoute(speciesId: number, gameId: TrackedGameId): PokemonHuntRoute {
  const catalogName = POKEMON_CATALOG_V2_BY_KEY.get(entityKey(speciesId))?.canonicalName;
  const eligibleGames = getCuratedShinyOriginGameIds(speciesId, catalogName);
  if (!eligibleGames?.includes(gameId)) return unavailableRoute(speciesId, gameId);

  const special = specialOrigins.get(`${speciesId}:${gameId}`);
  if (special) return specialOriginRoute(speciesId, gameId, special);

  if (speciesId === 132) return directOriginRoute(speciesId, gameId);
  if (noEggSpecies.has(speciesId)) {
    throw new Error(`Missing explicit non-breeding origin for National Dex #${speciesId} in ${gameId}`);
  }
  if (gamesWithoutBreeding.has(gameId)) return noBreedingGameRoute(speciesId, gameId);
  return breedingRoute(speciesId, gameId);
}

export const GEN1_REMAINING_HUNT_COVERAGE_ROUTES: PokemonHuntRoute[] = [];
for (let speciesId = FIRST_SPECIES; speciesId <= LAST_SPECIES; speciesId += 1) {
  for (const gameId of TRACKED_GAME_IDS) {
    GEN1_REMAINING_HUNT_COVERAGE_ROUTES.push(buildCoverageRoute(speciesId, gameId));
  }
}
