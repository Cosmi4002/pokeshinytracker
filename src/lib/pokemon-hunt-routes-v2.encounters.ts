import { POKEMON_CATALOG_V2_BY_KEY } from './pokemon-catalog-v2.registry';
import type { PokemonEntityKey } from './pokemon-catalog-v2';
import { HUNTING_METHODS } from './pokemon-data';
import type { TrackedGameId } from './pokemon-game-availability';
import type {
  HuntRouteId,
  HuntRoutePrerequisite,
  PokemonHuntRoute,
} from './pokemon-hunt-routes-v2';
import { GENERATED_NATIVE_ENCOUNTER_TUPLES } from './pokemon-hunt-routes-v2.encounters.generated';
import { GENERATED_CONTEXT_ENCOUNTER_TUPLES } from './pokemon-hunt-routes-v2.encounters.context.generated';
import { GENERATED_SPECIAL_ENCOUNTER_TUPLES } from './pokemon-hunt-routes-v2.encounters.special.generated';
import { GENERATED_GEN5_ENCOUNTER_TUPLES } from './pokemon-hunt-routes-v2.gen5.generated';

type NativeEncounterTuple = readonly [
  speciesId: number,
  gameId: TrackedGameId,
  huntingMethodId: string,
  locations: readonly string[],
  progressionNotes: readonly string[],
  externalNotes: readonly string[],
];

const verifiedAt = '2026-08-22';
const methodNames = new Map(HUNTING_METHODS.map((method) => [method.id, method.name]));

function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-|-$/gu, '');
}

function serebiiUrl(speciesId: number, name: string, huntingMethodId: string): string {
  const generation = huntingMethodId.match(/^gen([2-7])-/u)?.[1];
  const generationPath: Record<string, string> = {
    '2': 'pokedex-gs',
    '3': 'pokedex-rs',
    '4': 'pokedex-dp',
    '5': 'pokedex-bw',
    '6': 'pokedex-xy',
    '7': 'pokedex-sm',
  };
  if (generation) {
    return `https://www.serebii.net/${generationPath[generation]}/${String(speciesId).padStart(3, '0')}.shtml`;
  }
  return `https://www.serebii.net/pokemon/${slugify(name)}/`;
}

function bulbapediaUrl(name: string): string {
  return `https://bulbapedia.bulbagarden.net/wiki/${encodeURIComponent(name.replace(/ /gu, '_'))}_(Pok%C3%A9mon)`;
}

function pokemonCentralUrl(name: string): string {
  return `https://wiki.pokemoncentral.it/${encodeURIComponent(name.replace(/ /gu, '_'))}`;
}

const generatedTargetsForFormOnlySpecies: Partial<Record<number, readonly PokemonEntityKey[]>> = {
  412: ['pokemon:412:plant-cloak'],
  413: ['pokemon:413:plant-cloak'],
  422: ['pokemon:422:east-sea', 'pokemon:422:west-sea'],
  423: ['pokemon:423:east-sea', 'pokemon:423:west-sea'],
  483: ['pokemon:483:altered'],
  484: ['pokemon:484:altered'],
  487: ['pokemon:487:altered'],
  492: ['pokemon:492:land'],
};

function buildNativeEncounterRoutes(tuple: NativeEncounterTuple): PokemonHuntRoute[] {
  const [speciesId, gameId, huntingMethodId, locations, progressionNotes, externalNotes] = tuple;
  const baseKey = `pokemon:${speciesId}:base` as PokemonEntityKey;
  const targetEntityKeys = POKEMON_CATALOG_V2_BY_KEY.has(baseKey)
    ? [baseKey]
    : [...(generatedTargetsForFormOnlySpecies[speciesId] ?? [])];

  const prerequisites: HuntRoutePrerequisite[] = [
    ...progressionNotes.map((note): HuntRoutePrerequisite => ({ type: 'game-progression', note })),
    ...externalNotes.map((note): HuntRoutePrerequisite => ({ type: 'external-game-feature', note })),
  ];
  const isRadar = huntingMethodId.includes('pokeradar');
  const isRoaming = huntingMethodId.includes('roaming');
  const isStatic = huntingMethodId.includes('soft-reset')
    || huntingMethodId.includes('runaway')
    || huntingMethodId === 'gen5-guaranteed-shiny'
    || huntingMethodId === 'gen8-dynamax'
    || huntingMethodId === 'gen8-max-raid';
  const isGift = huntingMethodId === 'gen5-gift' || huntingMethodId === 'gen5-fossil-restore';
  const isGen5StarterGift = huntingMethodId === 'gen5-soft-reset'
    && ['black', 'white', 'black2', 'white2'].includes(gameId)
    && [495, 498, 501].includes(speciesId);
  const usesExternalSetup = externalNotes.length > 0;
  const methodName = methodNames.get(huntingMethodId) ?? huntingMethodId;

  return targetEntityKeys.flatMap((targetEntityKey): PokemonHuntRoute[] => {
    const entity = POKEMON_CATALOG_V2_BY_KEY.get(targetEntityKey);
    if (!entity) return [];
    return [{
      id: `${targetEntityKey}:${gameId}:native-${slugify(huntingMethodId)}${usesExternalSetup ? '-external' : ''}` as HuntRouteId,
      targetEntityKey,
      gameId,
      method: isGen5StarterGift ? 'soft-reset-gift' : isGift ? 'gift-pokemon' : isRadar ? 'poke-radar' : isRoaming ? 'roaming-encounter' : isStatic ? 'static-encounter' : 'wild-random-encounter',
      huntingMethodId,
      access: usesExternalSetup ? 'external-game-feature' : 'native',
      recommendation: usesExternalSetup ? 'eligible-with-external-setup' : 'eligible-native',
      directEncounter: !isStatic && !isGift && !isGen5StarterGift,
      locations: [...locations],
      prerequisites,
      explanation: isGen5StarterGift
        ? `${entity.displayName} is a non-shiny-locked Unova first partner in ${gameId}; it is hunted by soft resetting before selection and kept separate from Breeding and Masuda Method alternatives.`
        : `${entity.displayName} has a documented ${methodName} encounter in ${gameId}; this native route is kept separate from Breeding and Masuda Method alternatives.`,
      sources: [
        {
          provider: 'Serebii',
          url: serebiiUrl(speciesId, entity.canonicalName, huntingMethodId),
          note: `Species encounter reference used to cross-check ${entity.displayName} availability and hunting origins.`,
        },
        {
          provider: 'Bulbapedia',
          url: bulbapediaUrl(entity.canonicalName),
          note: `Species game-location tables used to cross-check the listed ${methodName} route.`,
        },
        ...(huntingMethodId.startsWith('gen2-') || huntingMethodId.startsWith('gen3-') || huntingMethodId.startsWith('gen5-') ? [{
          provider: 'Pokémon Central Wiki' as const,
          url: pokemonCentralUrl(entity.canonicalName),
          note: huntingMethodId.startsWith('gen2-')
            ? `Pokémon Central Wiki is used as the Italian Gen 2 cross-check for the species' game zones and encounter table; Surf entries are intentionally treated as Random Encounter, while Fishing, Headbutt and Rock Smash remain separate methods.`
            : huntingMethodId.startsWith('gen3-')
              ? `Pokémon Central Wiki is used as the Italian Gen 3 cross-check for the species' game zones and encounter table; Surf entries are intentionally treated as Random Encounter, while Fishing, Safari Zone and Rock Smash remain separate methods.`
              : `Pokémon Central Wiki is used as the Italian Gen 5 cross-check for the species' game zones and encounter table; Fishing, Fishing — Rippling Waters, Surf and other encounter categories remain separate.`,
        }] : []),
      ],
      verifiedAt,
    }];
  });
}

const ALL_GENERATED_ENCOUNTER_TUPLES = [
  ...GENERATED_NATIVE_ENCOUNTER_TUPLES,
  ...GENERATED_CONTEXT_ENCOUNTER_TUPLES,
  ...GENERATED_SPECIAL_ENCOUNTER_TUPLES,
  ...GENERATED_GEN5_ENCOUNTER_TUPLES,
] as readonly NativeEncounterTuple[];

function deriveAdditionalMethods(tuple: NativeEncounterTuple): NativeEncounterTuple[] {
  const [speciesId, gameId, huntingMethodId, locations, progressionNotes, externalNotes] = tuple;
  const derived: NativeEncounterTuple[] = [];
  const locationText = locations.join(' ');

  if (huntingMethodId === 'gen6-pokeradar') {
    derived.push([speciesId, gameId, 'gen6-pokeradar-bonus-music', locations, [
      ...progressionNotes,
      'Continue the Poké Radar chain when bonus music activates; the boosted sparkling-patch odds apply during the music.',
    ], externalNotes]);
  }
  // In Black 2/White 2, the partner-assisted sections of Pinwheel Forest
  // turn rustling-grass encounters into double battles. Keep this distinct
  // from ordinary Rustling Grass because the encounter odds and battle flow
  // are different while the companion is present.
  if ((gameId === 'black2' || gameId === 'white2')
    && huntingMethodId === 'gen5-rustling-grass'
    && /pinwheel forest/iu.test(locationText)) {
    const partnerLocations = locations.filter((location) => /pinwheel forest/iu.test(location));
    derived.push([speciesId, gameId, 'gen5-double-rustling-grass', partnerLocations, [
      ...progressionNotes,
      'Use the partner-assisted Pinwheel Forest section; the rustling-grass battle is a double encounter while the companion is present.',
    ], externalNotes]);
  }
  if ((gameId === 'black2' || gameId === 'white2')
    && huntingMethodId === 'gen5-dust-clouds'
    && /reversal mountain/iu.test(locationText)) {
    const partnerLocations = locations.filter((location) => /reversal mountain/iu.test(location));
    derived.push([speciesId, gameId, 'gen5-double-dust-clouds', partnerLocations, [
      ...progressionNotes,
      'Use the Bianca-assisted section of Reversal Mountain; dust-cloud encounters become double battles while Bianca is present.',
    ], externalNotes]);
  }
  if ((gameId === 'brilliantdiamond' || gameId === 'shiningpearl') && huntingMethodId === 'gen8-random') {
    if (/route|forest|lake|garden|meadow|field/iu.test(locationText)) {
      derived.push([speciesId, gameId, 'gen8-bdsp-pokeradar', locations, [
        ...progressionNotes,
        'Obtain the National Pokédex and Poké Radar, then build a compatible grass chain.',
      ], externalNotes]);
    }
    if (/grand underground/iu.test(locationText)) {
      derived.push([speciesId, gameId, 'gen8-bdsp-underground', locations, progressionNotes, externalNotes]);
      derived.push([speciesId, gameId, 'gen8-bdsp-underground-diglett', locations, [
        ...progressionNotes,
        'Activate the Grand Underground 40-Diglett bonus before checking hideaway spawns.',
      ], externalNotes]);
    }
  }
  if ((gameId === 'sword' || gameId === 'shield') && huntingMethodId === 'gen8-random') {
    derived.push([speciesId, gameId, 'gen8-murder', locations, [
      ...progressionNotes,
      'Build the species battled count to 500+, then check Brilliant Aura encounters.',
    ], externalNotes]);
  }
  if ((gameId === 'scarlet' || gameId === 'violet') && huntingMethodId === 'gen9-random') {
    derived.push([speciesId, gameId, 'gen9-sandwich-lv3', locations, [
      ...progressionNotes,
      'Use a level 3 Sparkling Power sandwich matching the target type.',
    ], externalNotes]);
  }
  if ((gameId === 'omegaruby' || gameId === 'alphasapphire') && huntingMethodId === 'gen6-random') {
    derived.push([speciesId, gameId, 'gen6-dexnav', locations, [
      ...progressionNotes,
      'Register the species, then use DexNav Search Level encounters in the same habitat.',
    ], externalNotes]);
  }

  return derived;
}

const safariLocationPattern = /safari zone|great marsh/iu;
const friendSafariLocationPattern = /friend safari/iu;
const radarIncompatibleLocationPattern = /(?:cave|mine|tunnel|ravaged path|oreburgh gate|mt\.? coronet|iron island|victory road|snowpoint temple|old chateau|galactic|warehouse|interior|inside|\b[bu]?\d+f\b)/iu;

function normalizeGeneratedTuple(tuple: NativeEncounterTuple): NativeEncounterTuple[] {
  const [speciesId, gameId, huntingMethodId, locations, progressionNotes, externalNotes] = tuple;

  if (huntingMethodId === 'gen5-fishing') {
    return [[speciesId, gameId, 'gen5-super-rod', locations, progressionNotes, externalNotes]];
  }

  if (huntingMethodId === 'gen4-pokeradar') {
    const grassLocations = locations.filter((location) => !radarIncompatibleLocationPattern.test(location));
    if (grassLocations.length === 0) return [];
    return [[speciesId, gameId, huntingMethodId, grassLocations, progressionNotes, externalNotes]];
  }

  // Friend Safari has its own shiny odds and method filter in X/Y, so remove it
  // from ordinary Random Encounter rows. The authoritative Friend Safari list
  // is generated separately from Serebii's Friend Safari table.
  if (huntingMethodId === 'gen6-random' && (gameId === 'x' || gameId === 'y')) {
    const friendSafariLocations = locations.filter((location) => friendSafariLocationPattern.test(location));
    if (friendSafariLocations.length > 0) {
      const ordinaryLocations = locations.filter((location) => !friendSafariLocationPattern.test(location));
      return ordinaryLocations.length > 0 ? [[speciesId, gameId, huntingMethodId, ordinaryLocations, progressionNotes, externalNotes]] : [];
    }
  }

  // Safari is an encounter location/ruleset, not a synonym for the source
  // interaction. Split grass/fishing Safari habitats from ordinary habitats;
  // Rock Smash remains Rock Smash even when the rock is inside a Safari Zone.
  const generationMatch = huntingMethodId.match(/^gen([234])-(?:random|fishing)$/u);
  if (!generationMatch) return [tuple];
  const safariLocations = locations.filter((location) => safariLocationPattern.test(location));
  if (safariLocations.length === 0) return [tuple];
  const ordinaryLocations = locations.filter((location) => !safariLocationPattern.test(location));
  const normalized: NativeEncounterTuple[] = [];
  if (ordinaryLocations.length > 0) {
    normalized.push([speciesId, gameId, huntingMethodId, ordinaryLocations, progressionNotes, externalNotes]);
  }
  normalized.push([
    speciesId,
    gameId,
    `gen${generationMatch[1]}-safari`,
    safariLocations,
    progressionNotes,
    externalNotes,
  ]);
  return normalized;
}

const NORMALIZED_GENERATED_ENCOUNTER_TUPLES = ALL_GENERATED_ENCOUNTER_TUPLES
  .flatMap(normalizeGeneratedTuple);

const EXPANDED_GENERATED_ENCOUNTER_TUPLES = NORMALIZED_GENERATED_ENCOUNTER_TUPLES.flatMap((tuple) => [
  tuple,
  ...deriveAdditionalMethods(tuple),
]);

const uniqueGeneratedTuples = new Map<string, NativeEncounterTuple>();
for (const tuple of EXPANDED_GENERATED_ENCOUNTER_TUPLES) {
  const [speciesId, gameId, huntingMethodId, locations, progressionNotes, externalNotes] = tuple;
  const key = `${speciesId}:${gameId}:${huntingMethodId}:${externalNotes.length ? 'external' : 'native'}`;
  const existing = uniqueGeneratedTuples.get(key);
  uniqueGeneratedTuples.set(key, existing ? [
    speciesId,
    gameId,
    huntingMethodId,
    [...new Set([...existing[3], ...locations])].slice(0, 5),
    [...new Set([...existing[4], ...progressionNotes])],
    [...new Set([...existing[5], ...externalNotes])],
  ] : tuple);
}

export const NATIVE_ENCOUNTER_HUNT_ROUTES = [...uniqueGeneratedTuples.values()]
  .flatMap(buildNativeEncounterRoutes);
