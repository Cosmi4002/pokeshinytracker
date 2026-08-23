import type { PokemonEntityKey } from './pokemon-catalog-v2';
import { POKEMON_CATALOG_V2_BY_KEY } from './pokemon-catalog-v2.registry';
import type { TrackedGameId } from './pokemon-game-availability';
import type { HuntRouteId, PokemonHuntRoute } from './pokemon-hunt-routes-v2';

const verifiedAt = '2026-08-23';

function key(speciesId: number, formKey = 'base'): PokemonEntityKey {
  return `pokemon:${speciesId}:${formKey}` as PokemonEntityKey;
}

function name(targetEntityKey: PokemonEntityKey): string {
  const entity = POKEMON_CATALOG_V2_BY_KEY.get(targetEntityKey);
  return entity?.displayName ?? entity?.canonicalName ?? targetEntityKey;
}

function speciesSources(
  targetEntityKey: PokemonEntityKey,
  serebiiUrl: string,
  serebiiNote: string,
): PokemonHuntRoute['sources'] {
  const targetName = name(targetEntityKey);
  return [
    { provider: 'Serebii', url: serebiiUrl, note: serebiiNote },
    {
      provider: 'Bulbapedia',
      url: `https://bulbapedia.bulbagarden.net/wiki/${encodeURIComponent(targetName.replace(/ \(.+\)$/u, '').replace(/ /gu, '_'))}_(Pok%C3%A9mon)`,
      note: `Cross-checks ${targetName} form identity and game availability; this method is not inferred from Breeding or transfer ownership.`,
    },
  ];
}

interface GiftOrigin {
  target: PokemonEntityKey;
  games: readonly TrackedGameId[];
  location: string;
  explanation: string;
}

const gen7GiftOrigins: readonly GiftOrigin[] = [
  {
    target: key(133),
    games: ['sun', 'moon', 'ultrasun', 'ultramoon'],
    location: 'Paniola Ranch Pokémon Nursery — gift Egg',
    explanation: 'The Nursery gift Egg is generated as Eevee. Save before receiving the Egg, hatch it, and reset to the pre-receipt save after a non-shiny result.',
  },
  {
    target: key(137),
    games: ['sun', 'moon', 'ultrasun', 'ultramoon'],
    location: 'Aether House — Route 15',
    explanation: 'Porygon is an in-game gift at Aether House and is checked by saving before accepting the generated Pokémon.',
  },
  {
    target: key(142),
    games: ['sun', 'moon', 'ultrasun', 'ultramoon'],
    location: 'Seafolk Village — Huntail boat',
    explanation: 'Aerodactyl is received directly from the Ace Trainer in Seafolk Village; this Gift Pokémon route is distinct from Fossil Restore.',
  },
  {
    target: key(25),
    games: ['ultrasun', 'ultramoon'],
    location: 'Heahea City Surfing Association',
    explanation: 'The special Surf Pikachu is a generated in-game gift after clearing the Mantine Surf high scores; save before receipt and reset after each check.',
  },
];

const GEN1_GEN7_GIFT_ROUTES: PokemonHuntRoute[] = gen7GiftOrigins.flatMap((origin) => (
  origin.games.map((gameId): PokemonHuntRoute => ({
    id: `${origin.target}:${gameId}:gen1-explicit-gen7-gift` as HuntRouteId,
    targetEntityKey: origin.target,
    gameId,
    method: 'soft-reset-gift',
    huntingMethodId: 'gen7-gift',
    access: 'native',
    recommendation: 'eligible-native',
    directEncounter: false,
    locations: [origin.location],
    prerequisites: [{ type: 'game-progression', note: 'Reach the documented gift giver and save before the Pokémon or Egg is generated.' }],
    explanation: origin.explanation,
    sources: speciesSources(
      origin.target,
      gameId === 'sun' || gameId === 'moon'
        ? 'https://www.serebii.net/sunmoon/gift.shtml'
        : 'https://www.serebii.net/ultrasunultramoon/gift.shtml',
      `The Generation VII gift table lists ${name(origin.target)} at ${origin.location}.`,
    ),
    verifiedAt,
  }))
));

const gen8FishingLocations = new Map<PokemonEntityKey, readonly string[]>([
  [key(90), ['East Lake Axewell', "Giant's Seat", 'Courageous Cavern', 'Loop Lagoon']],
  [key(91), ["Giant's Seat", 'Courageous Cavern', 'Loop Lagoon']],
  [key(98), ["Giant's Cap"]],
  [key(118), ['Routes 4–6', 'East Lake Axewell', "Giant's Cap", 'West Lake Axewell', 'Forest of Focus']],
  [key(129), ['Galar fishing spots', 'Isle of Armor fishing spots', 'Crown Tundra fishing spots']],
  [key(130), ["Axew's Eye", 'Bridge Field', "Giant's Cap", "Giant's Seat", 'Lake of Outrage', 'Crown Tundra fishing spots']],
  [key(131), ['Route 9 — Circhester Bay']],
  [key(147), ['Ballimere Lake']],
]);

const GEN1_GEN8_FISHING_ROUTES: PokemonHuntRoute[] = [...gen8FishingLocations.entries()].flatMap(([target, locations]) => (
  (['sword', 'shield'] as const).map((gameId): PokemonHuntRoute => ({
    id: `${target}:${gameId}:gen1-explicit-gen8-fishing` as HuntRouteId,
    targetEntityKey: target,
    gameId,
    method: 'wild-random-encounter',
    huntingMethodId: 'gen8-fishing',
    access: 'native',
    recommendation: 'eligible-native',
    directEncounter: true,
    locations: [...locations],
    prerequisites: [],
    explanation: `${name(target)} is directly present in Sword and Shield fishing encounter tables. Surf and overworld water spawns remain separate Random Encounter routes.`,
    sources: speciesSources(
      target,
      `https://www.serebii.net/pokedex-swsh/${POKEMON_CATALOG_V2_BY_KEY.get(target)?.canonicalName ?? target}/locations.shtml`,
      `The Sword/Shield location table explicitly labels the listed ${name(target)} encounters as Fishing.`,
    ),
    verifiedAt,
  }))
));

const teraRaidBaseSpecies = [
  23, 25, 26, 27, 28, 35, 36, 37, 38, 39, 40, 43, 44, 45, 48, 49,
  50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 69, 70, 71,
  72, 73, 74, 75, 76, 79, 80, 81, 82, 84, 85, 86, 87, 88, 89, 90,
  91, 92, 93, 94, 96, 97, 100, 101, 102, 103, 106, 107, 111, 112,
  113, 116, 117, 123, 125, 126, 129, 130, 131, 132, 133, 134, 135,
  136, 137, 143, 147, 148, 149,
] as const;

// Forms introduced in later generations are deliberately excluded here and
// are audited with their introduction generation, not with Kanto's base forms.
const teraRaidTargets = teraRaidBaseSpecies.map((speciesId) => key(speciesId));

const GEN1_GEN9_TERA_RAID_ROUTES: PokemonHuntRoute[] = teraRaidTargets.flatMap((target) => (
  (['scarlet', 'violet'] as const).map((gameId): PokemonHuntRoute => ({
    id: `${target}:${gameId}:gen1-explicit-gen9-tera-raid` as HuntRouteId,
    targetEntityKey: target,
    gameId,
    method: 'static-encounter',
    huntingMethodId: 'gen9-tera-raid',
    access: 'native',
    recommendation: 'eligible-native',
    directEncounter: false,
    locations: ['Paldea, Kitakami or Terarium Tera Raid crystals'],
    prerequisites: [{ type: 'game-progression', note: 'Unlock the raid star tier and DLC area shown in the permanent Tera Raid table. Version-exclusive raids can be joined through another player.' }],
    explanation: `${name(target)} appears in the permanent Scarlet/Violet Tera Raid pool. Raid seed odds are approximately 1/4103.05; Shiny Charm and Sparkling Power do not affect this method.`,
    sources: [
      {
        provider: 'Serebii',
        url: 'https://www.serebii.net/scarletviolet/teraraidbattles.shtml',
        note: `The permanent Tera Raid availability table lists ${name(target)} and its raid star tier; temporary event-only raids are not used here.`,
      },
      {
        provider: 'Bulbapedia',
        url: 'https://bulbapedia.bulbagarden.net/wiki/Shiny_Pok%C3%A9mon#Generation_IX',
        note: 'Documents the 32-bit Tera Raid seed space and the resulting approximately 1/4103.05 shiny probability.',
      },
    ],
    verifiedAt,
  }))
));

const hyperspaceTargets = new Map<PokemonEntityKey, string>([
  [key(16), 'Normal-type Hyperspace Wild Zones'],
  [key(17), 'Normal-type Hyperspace Wild Zones'],
  [key(18), 'Normal-type Hyperspace Wild Zones'],
  [key(39), 'Fairy-type Hyperspace Wild Zones'],
  [key(40), 'Fairy-type Hyperspace Wild Zones'],
  [key(41), 'Poison-type Hyperspace Wild Zones'],
  [key(42), 'Poison-type Hyperspace Wild Zones'],
  [key(52), 'Normal-type Hyperspace Wild Zones'],
  [key(53), 'Normal-type Hyperspace Wild Zones'],
  [key(56), 'Fighting-type Hyperspace Wild Zones'],
  [key(57), 'Fighting-type Hyperspace Wild Zones'],
  [key(83), 'Normal-type Hyperspace Wild Zones'],
  [key(104), 'Ground-type Hyperspace Wild Zones'],
  [key(105), 'Ground-type Hyperspace Wild Zones'],
  [key(115), 'Normal-type Hyperspace Wild Zones'],
  [key(133), 'Normal- and Ice-type Hyperspace Wild Zones'],
  [key(137), 'Normal-type Hyperspace Wild Zones'],
]);

const GEN1_GEN9_HYPERSPACE_ROUTES: PokemonHuntRoute[] = [...hyperspaceTargets.entries()].map(([target, location]): PokemonHuntRoute => ({
  id: `${target}:za:gen1-explicit-gen9-hyperspace` as HuntRouteId,
  targetEntityKey: target,
  gameId: 'za',
  method: 'wild-random-encounter',
  huntingMethodId: 'gen9-hyperspace',
  access: 'native',
  recommendation: 'eligible-native',
  directEncounter: true,
  locations: [location],
  prerequisites: [{ type: 'dlc-access', note: 'Requires the Mega Dimension DLC and access to Hyperspace Lumiose portals.' }],
  explanation: `${name(target)} is a direct Hyperspace Lumiose spawn. It is kept separate from ordinary Lumiose Wild Zone / Bench / Soft Reset encounters.`,
  sources: [
    {
      provider: 'Serebii',
      url: location.startsWith('Normal')
        ? 'https://www.serebii.net/legendsz-a/hyperspacewildzone/normal.shtml'
        : location.startsWith('Ice')
          ? 'https://www.serebii.net/legendsz-a/hyperspacewildzone/ice.shtml'
          : location.startsWith('5-star')
            ? 'https://www.serebii.net/legendsz-a/hyperspacewildzone/special.shtml'
            : 'https://www.serebii.net/legendsz-a/hyperspacepokedex.shtml',
      note: `The Hyperspace encounter table lists ${name(target)} in ${location}.`,
    },
    {
      provider: 'Bulbapedia',
      url: 'https://bulbapedia.bulbagarden.net/wiki/Hyperspace_Lumiose',
      note: 'Cross-checks Hyperspace Lumiose as a distinct Mega Dimension DLC encounter system.',
    },
  ],
  verifiedAt,
}));

const zaWildZoneLocations = new Map<PokemonEntityKey, readonly string[]>([
  [key(13), ['Wild Zone 1']],
  [key(14), ['Wild Zone 2', 'Wild Zone 7']],
  [key(15), ['Wild Zone 15']],
  [key(16), ['Wild Zone 1', 'Wild Zone 5']],
  [key(17), ['Wild Zone 5']],
  [key(23), ['Wild Zone 4']],
  [key(24), ['Wild Zone 10']],
  [key(25), ['Wild Zone 3', 'Wild Zone 6']],
  [key(26), ['Wild Zone 20']],
  [key(35), ['Wild Zone 19']],
  [key(36), ['Wild Zone 20']],
  [key(63), ['Wild Zone 5']],
  [key(64), ['Wild Zone 9']],
  [key(65), ['Wild Zone 20']],
  [key(66), ['Wild Zone 8', 'Wild Zone 12']],
  [key(67), ['Wild Zone 12']],
  [key(68), ['Wild Zone 20']],
  [key(69), ['Wild Zone 5', 'Wild Zone 10']],
  [key(70), ['Wild Zone 13']],
  [key(71), ['Wild Zone 20']],
  [key(79), ['Wild Zone 10', 'Wild Zone 11']],
  [key(80), ['Wild Zone 11']],
  [key(92), ['Wild Zone 4', 'Wild Zone 7']],
  [key(93), ['Wild Zone 15']],
  [key(94), ['Wild Zone 20']],
  [key(95), ['Wild Zone 14']],
  [key(115), ['Wild Zone 19', 'Wild Zone 20']],
  [key(120), ['Wild Zone 2', 'Wild Zone 10']],
  [key(121), ['Wild Zone 16', 'Wild Zone 20']],
  [key(123), ['Wild Zone 13']],
  [key(127), ['Wild Zone 13', 'Wild Zone 20']],
  [key(129), ['Wild Zone 2', 'Wild Zone 6']],
  [key(130), ['Wild Zone 11', 'Wild Zone 20']],
  [key(133), ['Wild Zone 19']],
  [key(134), ['Wild Zone 20']],
  [key(135), ['Wild Zone 20']],
  [key(136), ['Wild Zone 20']],
  [key(149), ['Wild Zone 20']],
]);

const GEN1_GEN9_ZA_WILD_ZONE_ROUTES: PokemonHuntRoute[] = [...zaWildZoneLocations.entries()]
  .map(([target, locations]): PokemonHuntRoute => ({
    id: `${target}:za:gen1-explicit-gen9-wild-zones` as HuntRouteId,
    targetEntityKey: target,
    gameId: 'za',
    method: 'wild-random-encounter',
    huntingMethodId: 'gen9-zone-bench-soft-reset',
    access: 'native',
    recommendation: 'eligible-native',
    directEncounter: true,
    locations: [...locations],
    prerequisites: [{ type: 'game-progression', note: 'Unlock the listed Wild Zone and use the Zone / Bench / Soft Reset spawn-refresh procedure.' }],
    explanation: `${name(target)} appears directly in the listed Lumiose Wild Zone encounter table; this is separate from evolution and Hyperspace routes.`,
    sources: [
      ...locations.map((location) => ({
        provider: 'Serebii' as const,
        url: `https://www.serebii.net/pokearth/lumiosecity/wildzone${location.replace(/\D/gu, '')}.shtml`,
        note: `${location}'s encounter table directly lists ${name(target)}.`,
      })),
      {
        provider: 'Bulbapedia',
        url: `https://bulbapedia.bulbagarden.net/wiki/${encodeURIComponent(name(target).replace(/ /gu, '_'))}_(Pok%C3%A9mon)`,
        note: `Cross-checks ${name(target)} availability and identity in Pokémon Legends: Z-A.`,
      },
    ],
    verifiedAt,
  }));

const GEN1_LGPE_CORRECTION_ROUTES: PokemonHuntRoute[] = [
  ...([25, 39] as const).flatMap((baseSpeciesId) => {
    const targetSpeciesId = baseSpeciesId === 25 ? 26 : 40;
    const baseName = name(key(baseSpeciesId));
    const targetName = name(key(targetSpeciesId));
    const locations = baseSpeciesId === 25
      ? ['Viridian Forest']
      : ['Kanto Route 5', 'Kanto Route 6', 'Kanto Route 7', 'Kanto Route 8'];
    return (['lgp', 'lge'] as const).flatMap((gameId) => (
      ['gen7-lgpe-random', 'gen7-lgpe-combo'].map((huntingMethodId): PokemonHuntRoute => ({
        id: `${key(targetSpeciesId)}:${gameId}:gen1-explicit-evolution-${huntingMethodId}` as HuntRouteId,
        targetEntityKey: key(targetSpeciesId),
        gameId,
        method: 'evolution-from-hunted-shiny',
        huntingMethodId,
        access: 'same-save-evolution',
        recommendation: 'eligible-native',
        directEncounter: false,
        evolveFromEntityKey: key(baseSpeciesId),
        locations,
        prerequisites: [{
          type: 'evolve-shiny',
          entityKey: key(baseSpeciesId),
          note: `Hunt shiny ${baseName} with ${huntingMethodId}, then use the required evolution stone to obtain ${targetName}.`,
        }],
        explanation: `${targetName} is not a wild ${gameId} encounter for this route; hunt shiny ${baseName} in the listed habitat, then evolve it in the same save.`,
        sources: speciesSources(
          key(baseSpeciesId),
          `https://www.serebii.net/pokedex-sm/${String(baseSpeciesId).padStart(3, '0')}.shtml`,
          `The Let's Go location table lists ${baseName} at ${locations.join(', ')}; ${targetName} is obtained by evolution.`,
        ),
        verifiedAt,
      }))
    ));
  }),
  ...([
    { target: key(53), gameId: 'lgp' as const, requirement: 'Catch five Growlithe' },
    { target: key(59), gameId: 'lge' as const, requirement: 'Catch five Meowth' },
  ]).map(({ target, gameId, requirement }): PokemonHuntRoute => ({
    id: `${target}:${gameId}:gen1-explicit-lgpe-vermilion-gift` as HuntRouteId,
    targetEntityKey: target,
    gameId,
    method: 'soft-reset-gift',
    huntingMethodId: 'gen7-gift',
    access: 'native',
    recommendation: 'eligible-native',
    directEncounter: false,
    locations: ['Vermilion City — outside the Pokémon Fan Club'],
    prerequisites: [{ type: 'game-progression', note: `${requirement}, then save before accepting the gift Pokémon.` }],
    explanation: `${name(target)} is the version-specific Vermilion City gift in ${gameId}; it is not a wild encounter in that version.`,
    sources: [
      { provider: 'Serebii', url: 'https://www.serebii.net/letsgopikachueevee/gift.shtml', note: `Lists ${name(target)} as the Vermilion City gift in ${gameId}.` },
      { provider: 'Bulbapedia', url: 'https://bulbapedia.bulbagarden.net/wiki/List_of_in-game_event_Pok%C3%A9mon_in_Pok%C3%A9mon:_Let%27s_Go,_Pikachu!_and_Let%27s_Go,_Eevee!', note: 'Cross-checks the version-specific Persian/Arcanine gift and catch-five prerequisite.' },
    ],
    verifiedAt,
  })),
];

const GEN1_PLA_DISTORTION_ROUTES: PokemonHuntRoute[] = [
  { target: key(81), location: 'Cobalt Coastlands — space-time distortions' },
  { target: key(137), location: 'Crimson Mirelands — space-time distortions' },
].map(({ target, location }): PokemonHuntRoute => ({
  id: `${target}:pla:gen1-explicit-space-time-distortion` as HuntRouteId,
  targetEntityKey: target,
  gameId: 'pla',
  method: 'wild-random-encounter',
  huntingMethodId: 'pla-random',
  access: 'native',
  recommendation: 'eligible-native',
  directEncounter: true,
  locations: [location],
  prerequisites: [{ type: 'game-progression', note: 'Unlock space-time distortions and wait for one to form in the listed Hisui area.' }],
  explanation: `${name(target)} is directly huntable in the listed Pokémon Legends: Arceus space-time distortion; this is not a generic overworld spawn.`,
  sources: speciesSources(
    target,
    `https://www.serebii.net/pokedex-swsh/${POKEMON_CATALOG_V2_BY_KEY.get(target)?.canonicalName ?? target}/locations.shtml`,
    `The Legends: Arceus location table lists ${name(target)} in ${location}.`,
  ),
  verifiedAt,
}));

export const GEN1_ADDITIONAL_METHOD_ROUTES: PokemonHuntRoute[] = [
  ...GEN1_GEN7_GIFT_ROUTES,
  ...GEN1_GEN8_FISHING_ROUTES,
  ...GEN1_GEN9_TERA_RAID_ROUTES,
  ...GEN1_GEN9_HYPERSPACE_ROUTES,
  ...GEN1_GEN9_ZA_WILD_ZONE_ROUTES,
  ...GEN1_LGPE_CORRECTION_ROUTES,
  ...GEN1_PLA_DISTORTION_ROUTES,
];
