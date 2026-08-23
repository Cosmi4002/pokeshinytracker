import type { PokemonEntityKey } from './pokemon-catalog-v2';
import { POKEMON_CATALOG_V2, POKEMON_CATALOG_V2_BY_KEY } from './pokemon-catalog-v2.registry';
import { getCuratedShinyOriginGameIds, TRACKED_GAME_IDS, type TrackedGameId } from './pokemon-game-availability';
import type { HuntRouteId, HuntRoutePrerequisite, HuntRouteSource, PokemonHuntRoute } from './pokemon-hunt-routes-v2';

/** Conservative game-by-game decision matrix for National Dex #252-386 and their catalogued forms. */
const verifiedAt = '2026-08-21';
const FIRST_SPECIES = 252;
const LAST_SPECIES = 386;

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
const noEggSpecies = new Set([377, 378, 379, 380, 381, 382, 383, 384, 385, 386]);

const familyChains: number[][] = [
  [252, 253, 254], [255, 256, 257], [258, 259, 260], [261, 262], [263, 264],
  [265, 266, 267], [265, 268, 269], [270, 271, 272], [273, 274, 275], [276, 277],
  [278, 279], [280, 281, 282], [283, 284], [285, 286], [287, 288, 289],
  [290, 291], [290, 292], [293, 294, 295], [296, 297], [298], [299], [300, 301],
  [302], [303], [304, 305, 306], [307, 308], [309, 310], [311], [312], [313],
  [314], [315], [316, 317], [318, 319], [320, 321], [322, 323], [324], [325, 326],
  [327], [328, 329, 330], [331, 332], [333, 334], [335], [336], [337], [338],
  [339, 340], [341, 342], [343, 344], [345, 346], [347, 348], [349, 350], [351],
  [352], [353, 354], [355, 356], [357], [358], [359], [360], [361, 362],
  [363, 364, 365], [366, 367], [366, 368], [369], [370], [371, 372, 373],
  [374, 375, 376],
];

interface FamilyPosition { rootId: number; previousId?: number }
const familyBySpecies = new Map<number, FamilyPosition>();
for (const chain of familyChains) {
  for (let index = 0; index < chain.length; index += 1) {
    const speciesId = chain[index];
    const existing = familyBySpecies.get(speciesId);
    if (!existing || speciesId !== chain[0]) {
      familyBySpecies.set(speciesId, { rootId: chain[0], previousId: index ? chain[index - 1] : undefined });
    }
  }
}

const breedableParentByBaby = new Map<number, number>([[298, 183], [360, 202]]);

function entityKey(speciesId: number): PokemonEntityKey {
  return `pokemon:${speciesId}:base` as PokemonEntityKey;
}

function entity(speciesId: number) {
  const value = POKEMON_CATALOG_V2_BY_KEY.get(entityKey(speciesId));
  if (!value) throw new Error(`Missing catalog entity for National Dex #${speciesId}`);
  return value;
}

function sourcesFor(speciesId: number, note: string): HuntRouteSource[] {
  const current = entity(speciesId);
  const displayName = current.displayName || current.canonicalName;
  const wikiName = displayName.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join('_');
  return [
    { provider: 'Serebii', url: `https://www.serebii.net/pokemon/${current.canonicalName}/`, note: `Serebii cross-checks ${displayName}'s game locations and evolution data. ${note}` },
    { provider: 'Bulbapedia', url: `https://bulbapedia.bulbagarden.net/wiki/${encodeURIComponent(wikiName)}_(Pok%C3%A9mon)`, note: `Bulbapedia cross-checks ${displayName}'s availability, breeding, forms and shiny restrictions. ${note}` },
  ];
}

function encounterMethod(gameId: TrackedGameId): string {
  if (gameId === 'lgp' || gameId === 'lge') return 'gen7-lgpe-random';
  if (gameId === 'pla') return 'pla-random';
  if (gameId === 'za') return 'gen9-zone-bench-soft-reset';
  return `gen${generationByGame[gameId]}-random`;
}

function breedingMethod(gameId: TrackedGameId): string {
  return `gen${generationByGame[gameId]}-egg-hatching`;
}

function breedingLocation(gameId: TrackedGameId): string {
  const locations: Partial<Record<TrackedGameId, string>> = {
    ruby: 'Route 117 Day Care', sapphire: 'Route 117 Day Care', emerald: 'Route 117 Day Care',
    firered: 'Four Island Day Care', leafgreen: 'Four Island Day Care',
    diamond: 'Solaceon Town Day Care', pearl: 'Solaceon Town Day Care', platinum: 'Solaceon Town Day Care',
    heartgold: 'Route 34 Day Care', soulsilver: 'Route 34 Day Care',
    black: 'Route 3 Day Care', white: 'Route 3 Day Care', black2: 'Route 3 Day Care', white2: 'Route 3 Day Care',
    x: 'Route 7 Day Care', y: 'Route 7 Day Care', omegaruby: 'Route 117 Day Care', alphasapphire: 'Route 117 Day Care',
    sun: 'Paniola Ranch Pokémon Nursery', moon: 'Paniola Ranch Pokémon Nursery', ultrasun: 'Paniola Ranch Pokémon Nursery', ultramoon: 'Paniola Ranch Pokémon Nursery',
    sword: 'Route 5 Pokémon Nursery', shield: 'Route 5 Pokémon Nursery',
    brilliantdiamond: 'Solaceon Town Pokémon Nursery', shiningpearl: 'Solaceon Town Pokémon Nursery',
    scarlet: 'Picnic — Egg breeding', violet: 'Picnic — Egg breeding',
  };
  const location = locations[gameId];
  if (!location) throw new Error(`Missing Generation III-family breeding location for ${gameId}`);
  return location;
}

interface SpecialOrigin {
  location: string;
  huntingMethodId: string;
  method: PokemonHuntRoute['method'];
  explanation: string;
  directEncounter?: boolean;
  access?: 'native' | 'external-game-feature';
  prerequisite?: string;
  prerequisiteType?: HuntRoutePrerequisite['type'];
}

const specialOrigins = new Map<string, SpecialOrigin>();
function addSpecial(speciesId: number, gameIds: readonly TrackedGameId[], origin: SpecialOrigin) {
  for (const gameId of gameIds) specialOrigins.set(`${speciesId}:${gameId}`, origin);
}

// Hoenn starter choices and their same-save evolutions.
for (const [baseId, middleId, finalId] of [[252, 253, 254], [255, 256, 257], [258, 259, 260]] as const) {
  for (const gameId of ['ruby', 'sapphire', 'emerald', 'omegaruby', 'alphasapphire'] as const) {
    const huntingMethodId = `gen${generationByGame[gameId]}-soft-reset`;
    const baseMethod: PokemonHuntRoute['method'] = 'soft-reset-gift';
    const emeraldNote = gameId === 'emerald' ? ' Because Emerald always starts from the same RNG seed, repeated quick soft resets are not prescribed; use varied live frames, a Battle Video timing setup, or new-save cycles.' : '';
    addSpecial(baseId, [gameId], { location: 'Hoenn starter choice', huntingMethodId, method: baseMethod, explanation: `${entity(baseId).displayName} is a native starter choice and is not shiny locked.${emeraldNote}` });
    addSpecial(middleId, [gameId], { location: 'Hoenn starter choice', huntingMethodId, method: 'evolution-from-hunted-shiny', explanation: `Evolve the shiny ${entity(baseId).displayName} starter in the same save.${emeraldNote}` });
    addSpecial(finalId, [gameId], { location: 'Hoenn starter choice', huntingMethodId, method: 'evolution-from-hunted-shiny', explanation: `Complete the shiny ${entity(baseId).displayName} starter evolution line in the same save.${emeraldNote}` });
  }
  for (const gameId of ['heartgold', 'soulsilver'] as const) {
    addSpecial(baseId, [gameId], { location: 'Silph Co. — Steven Stone gift after defeating Red', huntingMethodId: 'gen4-soft-reset', method: 'soft-reset-gift', prerequisite: 'Defeat Red, then choose one of Steven Stone’s Hoenn starters.', explanation: `${entity(baseId).displayName} can be shiny when received from Steven and can be hunted by soft resetting.` });
    addSpecial(middleId, [gameId], { location: 'Silph Co. — Steven Stone gift', huntingMethodId: 'gen4-soft-reset', method: 'evolution-from-hunted-shiny', explanation: `Evolve Steven’s shiny ${entity(baseId).displayName} in the same save.` });
    addSpecial(finalId, [gameId], { location: 'Silph Co. — Steven Stone gift', huntingMethodId: 'gen4-soft-reset', method: 'evolution-from-hunted-shiny', explanation: `Complete Steven’s shiny ${entity(baseId).displayName} evolution line.` });
  }
}

// Fossils are direct soft-reset hunts where the revived Pokémon is generated.
for (const [speciesId, fossil] of [[345, 'Root Fossil'], [347, 'Claw Fossil']] as const) {
  for (const gameId of ['ruby', 'sapphire', 'emerald'] as const) {
    const emerald = gameId === 'emerald';
    addSpecial(speciesId, [gameId], { location: 'Devon Corporation — fossil revival', huntingMethodId: 'gen3-fossil-restore', method: 'gift-pokemon', prerequisite: `Obtain the ${fossil}.`, explanation: emerald ? `${entity(speciesId).displayName} uses Fossil Restore with varied live RNG frames or a Battle Video timing setup; repeated quick soft resets would repeat Emerald’s fixed-seed frames.` : `${entity(speciesId).displayName} is generated when its fossil is revived; it is categorized as Fossil Restore rather than a generic gift.` });
  }
  for (const gameId of ['omegaruby', 'alphasapphire'] as const) {
    addSpecial(speciesId, [gameId], { location: 'Devon Corporation — fossil revival', huntingMethodId: 'gen6-fossil-restore', method: 'gift-pokemon', prerequisite: `Obtain the ${fossil}.`, explanation: `${entity(speciesId).displayName} is generated on fossil revival; this is Fossil Restore, not a generic gift or starter-style Soft Reset route.` });
  }
}

for (const gameId of ['ruby', 'sapphire', 'emerald'] as const) {
  const emerald = gameId === 'emerald';
  addSpecial(351, [gameId], { location: 'Weather Institute — Castform gift', huntingMethodId: emerald ? 'gen3-gift' : 'gen3-soft-reset', method: emerald ? 'gift-pokemon' : 'soft-reset-gift', explanation: emerald ? 'Normal Form Castform is the gift origin. In Emerald, vary live RNG frames or use a Battle Video timing setup instead of repeated quick soft resets.' : 'Normal Form Castform is the actual received Pokémon; weather forms are temporary battle transformations.' });
  addSpecial(374, [gameId], { location: 'Mossdeep City — Steven Stone’s Beldum gift', huntingMethodId: emerald ? 'gen3-gift' : 'gen3-soft-reset', method: emerald ? 'gift-pokemon' : 'soft-reset-gift', prerequisite: 'Enter Steven’s house after becoming Champion.', explanation: emerald ? 'Beldum is generated as a gift. Emerald’s fixed initial seed requires varied live frames or a Battle Video timing setup, not repeated quick soft resets.' : 'Beldum is generated as a gift and can be hunted by soft resetting before accepting it.' });
}
for (const gameId of ['omegaruby', 'alphasapphire'] as const) {
  addSpecial(351, [gameId], { location: 'Weather Institute — Castform gift', huntingMethodId: 'gen6-soft-reset', method: 'soft-reset-gift', explanation: 'Normal Form Castform is the hunt origin; its weather forms remain temporary.' });
  addSpecial(374, [gameId], { location: 'Mossdeep City — Steven Stone’s Beldum gift', huntingMethodId: 'gen6-soft-reset', method: 'soft-reset-gift', prerequisite: 'Complete the Delta Episode.', explanation: 'Beldum is generated when accepted from Steven’s house and is not shiny locked.' });
}

// Eon duo: distinguish native roamers, event-item encounters and ORAS story shiny locks.
addSpecial(380, ['ruby'], { location: 'Southern Island', huntingMethodId: 'gen3-soft-reset', method: 'static-encounter', access: 'external-game-feature', prerequisite: 'Use legitimate Eon Ticket access.', explanation: 'Ruby’s own-origin shiny Latias is the Southern Island Eon Ticket encounter; the roaming Eon Pokémon is Latios.' });
addSpecial(380, ['sapphire'], { location: 'Roaming Hoenn', huntingMethodId: 'gen3-roaming', method: 'roaming-encounter', directEncounter: true, explanation: 'Latias is Sapphire’s post-Champion roaming Eon Pokémon and is not shiny locked.' });
addSpecial(380, ['emerald'], { location: 'Roaming Hoenn', huntingMethodId: 'gen3-roaming', method: 'roaming-encounter', directEncounter: true, prerequisite: 'Choose red when the television report asks for the roaming Pokémon’s color.', explanation: 'Choosing red makes Latias the native Emerald roamer.' });
addSpecial(381, ['ruby'], { location: 'Roaming Hoenn', huntingMethodId: 'gen3-roaming', method: 'roaming-encounter', directEncounter: true, explanation: 'Latios is Ruby’s post-Champion roaming Eon Pokémon and is not shiny locked.' });
addSpecial(381, ['sapphire'], { location: 'Southern Island', huntingMethodId: 'gen3-soft-reset', method: 'static-encounter', access: 'external-game-feature', prerequisite: 'Use legitimate Eon Ticket access.', explanation: 'Sapphire’s own-origin shiny Latios is the Southern Island Eon Ticket encounter; the roaming Eon Pokémon is Latias.' });
addSpecial(381, ['emerald'], { location: 'Roaming Hoenn', huntingMethodId: 'gen3-roaming', method: 'roaming-encounter', directEncounter: true, prerequisite: 'Choose blue when the television report asks for the roaming Pokémon’s color.', explanation: 'Choosing blue makes Latios the native Emerald roamer.' });
addSpecial(380, ['heartgold'], { location: 'Pewter City — Enigma Stone encounter', huntingMethodId: 'gen4-soft-reset', method: 'static-encounter', access: 'external-game-feature', prerequisite: 'Use legitimate historical Enigma Stone event access.', explanation: 'Latias is HeartGold’s Enigma Stone counterpart; it is not the native roamer.' });
addSpecial(380, ['soulsilver'], { location: 'Roaming Kanto', huntingMethodId: 'gen4-roaming', method: 'roaming-encounter', directEncounter: true, explanation: 'Latias is SoulSilver’s native roaming Eon Pokémon.' });
addSpecial(381, ['heartgold'], { location: 'Roaming Kanto', huntingMethodId: 'gen4-roaming', method: 'roaming-encounter', directEncounter: true, explanation: 'Latios is HeartGold’s native roaming Eon Pokémon.' });
addSpecial(381, ['soulsilver'], { location: 'Pewter City — Enigma Stone encounter', huntingMethodId: 'gen4-soft-reset', method: 'static-encounter', access: 'external-game-feature', prerequisite: 'Use legitimate historical Enigma Stone event access.', explanation: 'Latios is SoulSilver’s Enigma Stone counterpart; it is not the native roamer.' });
addSpecial(380, ['omegaruby'], { location: 'Southern Island — Eon Ticket encounter', huntingMethodId: 'gen6-soft-reset', method: 'static-encounter', access: 'external-game-feature', prerequisite: 'Receive the Eon Ticket through the game’s distribution/StreetPass feature.', explanation: 'Latias is the non-story Eon Ticket counterpart in Omega Ruby and is not shiny locked.' });
addSpecial(381, ['alphasapphire'], { location: 'Southern Island — Eon Ticket encounter', huntingMethodId: 'gen6-soft-reset', method: 'static-encounter', access: 'external-game-feature', prerequisite: 'Receive the Eon Ticket through the game’s distribution/StreetPass feature.', explanation: 'Latios is the non-story Eon Ticket counterpart in Alpha Sapphire and is not shiny locked.' });

for (const gameId of ['ruby', 'sapphire'] as const) {
  addSpecial(384, [gameId], { location: 'Sky Pillar', huntingMethodId: 'gen3-soft-reset', method: 'static-encounter', explanation: `Rayquaza is a non-shiny-locked Sky Pillar encounter in ${gameId}.` });
}
for (const gameId of ['heartgold', 'soulsilver'] as const) {
  addSpecial(384, [gameId], { location: 'Embedded Tower', huntingMethodId: 'gen4-soft-reset', method: 'static-encounter', access: 'external-game-feature', prerequisite: 'Show Professor Oak the Kyogre caught in HeartGold and the Groudon caught in SoulSilver to receive the Jade Orb; one must come from the opposite version.', explanation: 'Rayquaza is then a non-shiny-locked Embedded Tower encounter.' });
}
for (const gameId of ['ultrasun', 'ultramoon'] as const) {
  addSpecial(384, [gameId], { location: 'Ultra Space Wilds — red wormhole', huntingMethodId: 'gen7-soft-reset', method: 'static-encounter', access: 'external-game-feature', prerequisite: 'Have both Kyogre and Groudon in the party; normally this requires obtaining the opposite-version legendary.', explanation: 'Rayquaza is a non-shiny-locked Ultra Space encounter after satisfying the two-legendary party requirement.' });
}
for (const gameId of ['sword', 'shield'] as const) {
  addSpecial(384, [gameId], { location: 'Max Lair — Dynamax Adventures', huntingMethodId: 'gen8-dynamax', method: 'static-encounter', prerequisiteType: 'dlc-access', prerequisite: 'Access the Crown Tundra expansion and unlock Dynamax Adventures.', explanation: 'Rayquaza can be shiny on the post-adventure results screen.' });
}
for (const gameId of ['brilliantdiamond', 'shiningpearl'] as const) {
  addSpecial(384, [gameId], { location: 'Ramanas Park — Stratospheric Room', huntingMethodId: 'gen8-soft-reset', method: 'static-encounter', prerequisite: 'Unlock Ramanas Park and the Stratospheric Slate after catching the required preceding legendary group.', explanation: 'Rayquaza is a non-shiny-locked Ramanas Park encounter hunted by soft resetting.' });
}

const legendaryLocations: Partial<Record<number, Partial<Record<TrackedGameId, string>>>> = {
  377: { ruby: 'Desert Ruins', sapphire: 'Desert Ruins', emerald: 'Desert Ruins', platinum: 'Rock Peak Ruins', black2: 'Underground Ruins', white2: 'Underground Ruins', omegaruby: 'Desert Ruins', alphasapphire: 'Desert Ruins', ultrasun: 'Ultra Space Wilds', ultramoon: 'Ultra Space Wilds', sword: 'Rock Peak Ruins', shield: 'Rock Peak Ruins', brilliantdiamond: 'Ramanas Park — Discovery Room', shiningpearl: 'Ramanas Park — Discovery Room' },
  378: { ruby: 'Island Cave', sapphire: 'Island Cave', emerald: 'Island Cave', platinum: 'Iceberg Ruins', black2: 'Underground Ruins', white2: 'Underground Ruins', omegaruby: 'Island Cave', alphasapphire: 'Island Cave', ultrasun: 'Ultra Space Wilds', ultramoon: 'Ultra Space Wilds', sword: 'Iceberg Ruins', shield: 'Iceberg Ruins', brilliantdiamond: 'Ramanas Park — Discovery Room', shiningpearl: 'Ramanas Park — Discovery Room' },
  379: { ruby: 'Ancient Tomb', sapphire: 'Ancient Tomb', emerald: 'Ancient Tomb', platinum: 'Iron Ruins', black2: 'Underground Ruins', white2: 'Underground Ruins', omegaruby: 'Ancient Tomb', alphasapphire: 'Ancient Tomb', ultrasun: 'Ultra Space Wilds', ultramoon: 'Ultra Space Wilds', sword: 'Iron Ruins', shield: 'Iron Ruins', brilliantdiamond: 'Ramanas Park — Discovery Room', shiningpearl: 'Ramanas Park — Discovery Room' },
  380: { ruby: 'Roaming Hoenn / Southern Island', sapphire: 'Roaming Hoenn / Southern Island', emerald: 'Roaming Hoenn / Southern Island', heartgold: 'Pewter City Enigma Stone encounter', soulsilver: 'Roaming Kanto', white2: 'Dreamyard', omegaruby: 'Southern Island Eon Ticket encounter', alphasapphire: 'Southern Island Eon Ticket encounter', ultramoon: 'Ultra Space Wilds', sword: 'Max Lair — Dynamax Adventures', shield: 'Max Lair — Dynamax Adventures', brilliantdiamond: 'Ramanas Park — Soul Room', shiningpearl: 'Ramanas Park — Soul Room', za: 'Hyperspace Lumiose' },
  381: { ruby: 'Roaming Hoenn / Southern Island', sapphire: 'Roaming Hoenn / Southern Island', emerald: 'Roaming Hoenn / Southern Island', heartgold: 'Roaming Kanto', soulsilver: 'Pewter City Enigma Stone encounter', black2: 'Dreamyard', omegaruby: 'Southern Island Eon Ticket encounter', alphasapphire: 'Southern Island Eon Ticket encounter', ultrasun: 'Ultra Space Wilds', sword: 'Max Lair — Dynamax Adventures', shield: 'Max Lair — Dynamax Adventures', brilliantdiamond: 'Ramanas Park — Soul Room', shiningpearl: 'Ramanas Park — Soul Room', za: 'Hyperspace Lumiose' },
  382: { sapphire: 'Cave of Origin', emerald: 'Marine Cave', heartgold: 'Embedded Tower', ultramoon: 'Ultra Space Wilds', sword: 'Max Lair — Dynamax Adventures', shield: 'Max Lair — Dynamax Adventures', brilliantdiamond: 'Ramanas Park — Oceanic Room', shiningpearl: 'Ramanas Park — Oceanic Room' },
  383: { ruby: 'Cave of Origin', emerald: 'Terra Cave', soulsilver: 'Embedded Tower', ultrasun: 'Ultra Space Wilds', sword: 'Max Lair — Dynamax Adventures', shield: 'Max Lair — Dynamax Adventures', brilliantdiamond: 'Ramanas Park — Tectonic Room', shiningpearl: 'Ramanas Park — Tectonic Room' },
  384: { emerald: 'Sky Pillar', heartgold: 'Embedded Tower', soulsilver: 'Embedded Tower', ultrasun: 'Ultra Space Wilds', ultramoon: 'Ultra Space Wilds', sword: 'Max Lair — Dynamax Adventures', shield: 'Max Lair — Dynamax Adventures', brilliantdiamond: 'Ramanas Park — Stratospheric Room', shiningpearl: 'Ramanas Park — Stratospheric Room', scarlet: 'Paldea event raid origin', violet: 'Paldea event raid origin' },
};

function legendaryRoute(speciesId: number, gameId: TrackedGameId): PokemonHuntRoute {
  const location = legendaryLocations[speciesId]?.[gameId] || 'Documented stationary legendary encounter';
  const isRoaming = (speciesId === 380 || speciesId === 381) && ['ruby', 'sapphire', 'emerald', 'heartgold', 'soulsilver'].includes(gameId) && location.includes('Roaming');
  const dynamax = location.includes('Dynamax Adventures');
  return {
    id: `${entityKey(speciesId)}:${gameId}:gen3-coverage-legendary-origin` as HuntRouteId,
    targetEntityKey: entityKey(speciesId), gameId,
    method: isRoaming ? 'roaming-encounter' : 'static-encounter',
    huntingMethodId: dynamax ? 'gen8-dynamax' : isRoaming ? `gen${generationByGame[gameId]}-roaming` : gameId === 'emerald' ? 'gen3-runaway' : `gen${generationByGame[gameId]}-soft-reset`,
    access: 'native', recommendation: 'eligible-native', directEncounter: isRoaming,
    locations: [location], prerequisites: [],
    explanation: dynamax ? `${entity(speciesId).displayName} can originate shiny after capture in Dynamax Adventures.` : gameId === 'emerald' ? `${entity(speciesId).displayName} uses Runaway in Emerald: flee, leave and re-enter the encounter area while the RNG continues advancing, rather than repeating fixed-seed soft resets.` : `${entity(speciesId).displayName} is a documented non-shiny-locked ${isRoaming ? 'roaming' : 'stationary'} encounter in ${gameId}.`,
    sources: sourcesFor(speciesId, `Cross-checked for the ${gameId} legendary origin and shiny availability.`), verifiedAt,
  };
}

function unavailableRoute(
  speciesId: number,
  gameId: TrackedGameId,
  override?: { access: 'unobtainable' | 'shiny-locked'; explanation: string },
): PokemonHuntRoute {
  return {
    id: `${entityKey(speciesId)}:${gameId}:gen3-coverage-unobtainable` as HuntRouteId,
    targetEntityKey: entityKey(speciesId), gameId, method: 'unavailable', huntingMethodId: 'custom',
    access: override?.access || (speciesId >= 382 && speciesId <= 386 && ['omegaruby', 'alphasapphire'].includes(gameId) ? 'shiny-locked' : 'unobtainable'),
    recommendation: 'not-eligible', directEncounter: false, locations: [], prerequisites: [],
    explanation: override?.explanation || `${entity(speciesId).displayName} has no own-origin shiny hunt in ${gameId}; transfer-only ownership and shiny-locked encounters are excluded.`,
    sources: sourcesFor(speciesId, `The curated shiny-origin table excludes ${gameId}.`), verifiedAt,
  };
}

function eventOnlyRoute(speciesId: number, gameId: TrackedGameId, explanation: string): PokemonHuntRoute {
  return {
    id: `${entityKey(speciesId)}:${gameId}:gen3-coverage-event-only` as HuntRouteId,
    targetEntityKey: entityKey(speciesId), gameId, method: 'fixed-shiny-encounter', huntingMethodId: 'distribution/event',
    access: 'event-only', recommendation: 'not-eligible', directEncounter: false,
    locations: ['Limited-time event distribution or raid'], prerequisites: [], explanation,
    sources: sourcesFor(speciesId, explanation), verifiedAt,
  };
}

function specialRoute(speciesId: number, gameId: TrackedGameId, origin: SpecialOrigin): PokemonHuntRoute {
  const family = familyBySpecies.get(speciesId);
  const evolved = origin.method === 'evolution-from-hunted-shiny';
  const prerequisites: HuntRoutePrerequisite[] = [];
  if (origin.prerequisite) prerequisites.push({ type: origin.prerequisiteType || (origin.access === 'external-game-feature' ? 'external-game-feature' : 'game-progression'), note: origin.prerequisite });
  if (evolved && family?.previousId) prerequisites.push({ type: 'evolve-shiny', entityKey: entityKey(family.previousId), note: `Evolve the shiny family member into ${entity(speciesId).displayName}.` });
  return {
    id: `${entityKey(speciesId)}:${gameId}:gen3-coverage-special-origin` as HuntRouteId,
    targetEntityKey: entityKey(speciesId), gameId, method: origin.method, huntingMethodId: origin.huntingMethodId,
    access: origin.access === 'external-game-feature' ? 'external-game-feature' : evolved ? 'same-save-evolution' : 'native',
    recommendation: origin.access === 'external-game-feature' ? 'eligible-with-external-setup' : 'eligible-native',
    directEncounter: origin.directEncounter || false, evolveFromEntityKey: evolved ? entityKey(family!.previousId!) : undefined,
    locations: [origin.location], prerequisites, explanation: origin.explanation,
    sources: sourcesFor(speciesId, origin.explanation), verifiedAt,
  };
}

function breedingRoute(speciesId: number, gameId: TrackedGameId): PokemonHuntRoute {
  const family = familyBySpecies.get(speciesId);
  const rootId = family?.rootId || speciesId;
  const parentId = breedableParentByBaby.get(rootId) || rootId;
  const evolved = Boolean(family?.previousId);
  const prerequisites: HuntRoutePrerequisite[] = [
    { type: 'external-parent', entityKey: entityKey(parentId), note: `Obtain or import a compatible ${entity(parentId).displayName}-family parent; this safe route does not invent a direct encounter.` },
  ];
  if (rootId === 298 && generationByGame[gameId] <= 8) prerequisites.push({ type: 'game-progression', note: 'Use Sea Incense on the Marill/Azumarill parent so the Egg hatches as Azurill.' });
  if (rootId === 360 && generationByGame[gameId] <= 8) prerequisites.push({ type: 'game-progression', note: 'Use Lax Incense on the Wobbuffet parent so the Egg hatches as Wynaut.' });
  if (speciesId === 292) prerequisites.push({ type: 'game-progression', note: 'Evolve shiny Nincada with an empty party slot and the game-required spare Poké Ball to obtain Shedinja.' });
  if (evolved) prerequisites.push({ type: 'evolve-shiny', entityKey: entityKey(family!.previousId!), note: `Complete the shiny evolution path to ${entity(speciesId).displayName}.` });
  return {
    id: `${entityKey(speciesId)}:${gameId}:gen3-coverage-${evolved ? 'breeding-evolution' : 'breeding'}` as HuntRouteId,
    targetEntityKey: entityKey(speciesId), gameId, method: evolved ? 'breeding-and-evolution' : 'breeding', huntingMethodId: breedingMethod(gameId),
    access: evolved ? 'external-parent-breeding-evolution' : 'external-parent-breeding', recommendation: 'eligible-with-external-setup', directEncounter: false,
    eggResultEntityKey: entityKey(rootId), evolveFromEntityKey: evolved ? entityKey(family!.previousId!) : undefined,
    locations: [breedingLocation(gameId)], prerequisites,
    explanation: evolved ? `Breed shiny ${entity(rootId).displayName}, then evolve it into ${entity(speciesId).displayName}; no direct encounter is inferred.` : `Breed a compatible parent to hatch shiny ${entity(speciesId).displayName}; no direct encounter is inferred.`,
    sources: sourcesFor(speciesId, `Cross-checked for breeding and evolution in ${gameId}.`), verifiedAt,
  };
}

function noBreedingGameRoute(speciesId: number, gameId: TrackedGameId): PokemonHuntRoute {
  const family = familyBySpecies.get(speciesId);
  if (family?.previousId) {
    return {
      id: `${entityKey(speciesId)}:${gameId}:gen3-coverage-evolution` as HuntRouteId,
      targetEntityKey: entityKey(speciesId), gameId, method: 'evolution-from-hunted-shiny', huntingMethodId: encounterMethod(gameId),
      access: 'same-save-evolution', recommendation: 'eligible-native', directEncounter: false,
      evolveFromEntityKey: entityKey(family.previousId), locations: [gameId === 'za' ? 'Lumiose City / Hyperspace Lumiose' : 'Documented in-game family origin'],
      prerequisites: [{ type: 'evolve-shiny', entityKey: entityKey(family.previousId), note: `Hunt the available family origin, then evolve it into ${entity(speciesId).displayName}.` }],
      explanation: `${entity(speciesId).displayName} uses a same-save evolution route because ${gameId} has no breeding.`,
      sources: sourcesFor(speciesId, `Cross-checked for the family origin in ${gameId}.`), verifiedAt,
    };
  }
  return {
    id: `${entityKey(speciesId)}:${gameId}:gen3-coverage-direct-origin` as HuntRouteId,
    targetEntityKey: entityKey(speciesId), gameId, method: 'wild-random-encounter', huntingMethodId: encounterMethod(gameId),
    access: 'native', recommendation: 'eligible-native', directEncounter: true,
    locations: [gameId === 'za' ? 'Lumiose City / Hyperspace Lumiose' : 'Documented in-game encounter'], prerequisites: [],
    explanation: `${entity(speciesId).displayName} has a documented native shiny origin in ${gameId}; breeding is not invented for a game without breeding.`,
    sources: sourcesFor(speciesId, `The curated shiny-origin table includes ${gameId}.`), verifiedAt,
  };
}

const deoxysTransferLocations: Partial<Record<TrackedGameId, string>> = {
  ruby: 'Trade from FireRed, LeafGreen or Emerald — automatically becomes Normal Forme',
  sapphire: 'Trade from FireRed, LeafGreen or Emerald — automatically becomes Normal Forme',
  diamond: 'Veilstone City meteorites', pearl: 'Veilstone City meteorites', platinum: 'Veilstone City meteorites',
  heartgold: 'Route 3 meteorites', soulsilver: 'Route 3 meteorites',
  black: 'Nacrene Museum meteorite', white: 'Nacrene Museum meteorite', black2: 'Nacrene Museum meteorite', white2: 'Nacrene Museum meteorite',
  x: 'Ambrette Town Fossil Lab meteorite', y: 'Ambrette Town Fossil Lab meteorite',
  omegaruby: 'Fallarbor Town — Professor Cozmo’s meteorite', alphasapphire: 'Fallarbor Town — Professor Cozmo’s meteorite',
  sun: 'Hokulani Observatory meteorite', moon: 'Hokulani Observatory meteorite', ultrasun: 'Hokulani Observatory meteorite', ultramoon: 'Hokulani Observatory meteorite',
  brilliantdiamond: 'Veilstone City meteorites', shiningpearl: 'Veilstone City meteorites',
  scarlet: 'Porto Marinada Auction — Meteorite', violet: 'Porto Marinada Auction — Meteorite',
};

function deoxysNormalOwnershipRoute(gameId: TrackedGameId): PokemonHuntRoute {
  const key = entityKey(386);
  const location = deoxysTransferLocations[gameId];
  if (!location) return unavailableRoute(386, gameId);
  return {
    id: `${key}:${gameId}:gen3-coverage-transfer-normal-forme` as HuntRouteId,
    targetEntityKey: key, gameId, method: 'form-change-from-hunted-shiny', huntingMethodId: 'custom',
    access: 'transfer-only', recommendation: 'not-eligible', directEncounter: false,
    locations: [location], prerequisites: [{ type: 'external-game-feature', entityKey: key, sourceGameIds: ['firered', 'leafgreen', 'emerald'], note: 'Transfer a legitimate shiny Deoxys originating from an eligible Birth Island encounter.' }],
    explanation: gameId === 'ruby' || gameId === 'sapphire'
      ? `A transferred shiny Deoxys is obtainable in ${gameId} and automatically appears as Normal Forme. It is not an own-origin Ruby/Sapphire shiny hunt, so it remains excluded from the randomizer.`
      : `A legitimate transferred shiny Deoxys can be changed to Normal Forme at ${location}. This records obtainability without misclassifying the destination game as a shiny origin.`,
    sources: [
      { provider: 'Serebii', url: gameId === 'brilliantdiamond' || gameId === 'shiningpearl' ? 'https://www.serebii.net/brilliantdiamondshiningpearl/formchange.shtml' : gameId === 'scarlet' || gameId === 'violet' ? 'https://www.serebii.net/scarletviolet/formchange.shtml' : 'https://www.serebii.net/games/deoxys.shtml', note: 'Documents Deoxys transfer availability and game-specific form changing.' },
      { provider: 'Bulbapedia', url: 'https://bulbapedia.bulbagarden.net/wiki/Deoxys_(Pok%C3%A9mon)', note: 'Documents the four Deoxys formes and their form-change behavior.' },
    ], verifiedAt,
  };
}

function buildBaseRoute(speciesId: number, gameId: TrackedGameId): PokemonHuntRoute {
  if (speciesId === 386) return deoxysNormalOwnershipRoute(gameId);
  if ((speciesId === 380 && gameId === 'alphasapphire') || (speciesId === 381 && gameId === 'omegaruby')) {
    return unavailableRoute(speciesId, gameId, {
      access: 'shiny-locked',
      explanation: `${entity(speciesId).displayName} is the mandatory Southern Island story gift in ${gameId} and is shiny locked; the opposite Eon species is the Eon Ticket hunt.`,
    });
  }
  if (speciesId === 384 && (gameId === 'scarlet' || gameId === 'violet')) {
    return eventOnlyRoute(speciesId, gameId, 'The shiny Rayquaza Tera Raid was a limited-time guaranteed-shiny event, not a repeatable hunt, so it is recorded but excluded from randomizer origins.');
  }
  if (speciesId === 384 && gameId === 'za') {
    return unavailableRoute(speciesId, gameId, {
      access: 'shiny-locked',
      explanation: 'Rayquaza is caught at Hyperspace Sky Pillar during the Mega Dimension story, but this fixed encounter is coded never to be Shiny.',
    });
  }
  const special = specialOrigins.get(`${speciesId}:${gameId}`);
  if (special) return specialRoute(speciesId, gameId, special);
  const current = entity(speciesId);
  const eligibleGames = getCuratedShinyOriginGameIds(speciesId, current.canonicalName) || [];
  if (!eligibleGames.includes(gameId)) return unavailableRoute(speciesId, gameId);
  if (speciesId >= 377 && speciesId <= 384) return legendaryRoute(speciesId, gameId);
  if (noEggSpecies.has(speciesId)) return unavailableRoute(speciesId, gameId);
  if (gamesWithoutBreeding.has(gameId)) return noBreedingGameRoute(speciesId, gameId);
  return breedingRoute(speciesId, gameId);
}

// Shiny Jirachi is a game-based distribution, not a normal encounter or Egg hunt.
for (const gameId of ['ruby', 'sapphire'] as const) {
  addSpecial(385, [gameId], {
    location: 'Pokémon Colosseum Bonus Disc / Pokémon Channel distribution to a Ruby or Sapphire save',
    huntingMethodId: 'distribution/event', method: 'soft-reset-gift', access: 'external-game-feature',
    prerequisite: 'Use compatible original hardware and an eligible save; the distribution can produce a legitimate shiny Jirachi only through its restricted generated spreads.',
    explanation: 'Jirachi has no ordinary core-game encounter. This route represents the legitimate game-based WISHMKR/Channel shiny origin and requires external hardware.',
  });
}

const formSources: HuntRouteSource[] = [
  { provider: 'Serebii', url: 'https://www.serebii.net/pokemon/forms.shtml', note: 'Cross-check index for regional, temporary and persistent form behavior.' },
  { provider: 'Bulbapedia', url: 'https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_with_form_differences', note: 'Cross-checks which Generation III appearances are separate forms and which are temporary transformations or patterns.' },
];

function unavailableFormRoute(key: PokemonEntityKey, gameId: TrackedGameId, explanation: string, access: 'unobtainable' | 'shiny-locked' = 'unobtainable'): PokemonHuntRoute {
  return {
    id: `${key}:${gameId}:gen3-form-coverage-unavailable` as HuntRouteId,
    targetEntityKey: key, gameId, method: 'unavailable', huntingMethodId: 'custom', access,
    recommendation: 'not-eligible', directEncounter: false, locations: [], prerequisites: [], explanation,
    sources: formSources, verifiedAt,
  };
}

function galarFormRoute(key: PokemonEntityKey, gameId: TrackedGameId, speciesName: string, evolved: boolean): PokemonHuntRoute {
  if (gameId !== 'sword' && gameId !== 'shield') return unavailableFormRoute(key, gameId, `${speciesName} is a Galarian regional form and has no own-origin shiny hunt in ${gameId}.`);
  return {
    id: `${key}:${gameId}:gen3-form-coverage-galar-native` as HuntRouteId,
    targetEntityKey: key, gameId, method: 'wild-random-encounter', huntingMethodId: 'gen8-random', access: 'native', recommendation: 'eligible-native', directEncounter: true,
    locations: [evolved ? 'Giant’s Cap / Bridge Field / Max Raid Battles' : 'Route 2 / Route 3 / Wild Area / Max Raid Battles'], prerequisites: [],
    explanation: `${speciesName} is encountered directly in its Galarian form; breeding a non-Galar parent is not substituted.`,
    sources: [
      { provider: 'Serebii', url: `https://www.serebii.net/pokedex-swsh/${evolved ? 'linoone' : 'zigzagoon'}/locations.shtml`, note: `Sword and Shield wild locations for ${speciesName}.` },
      formSources[1],
    ], verifiedAt,
  };
}

function castformBattleFormRoute(key: PokemonEntityKey, gameId: TrackedGameId, formName: string): PokemonHuntRoute {
  return unavailableFormRoute(key, gameId, `${formName} is a temporary Forecast weather transformation of the same shiny Castform. It is informational, not a separately obtainable shiny or randomizer target.`);
}

function deoxysFormRoute(key: PokemonEntityKey, gameId: TrackedGameId, form: 'Attack' | 'Defense' | 'Speed'): PokemonHuntRoute {
  const requiredGame: TrackedGameId = form === 'Attack' ? 'firered' : form === 'Defense' ? 'leafgreen' : 'emerald';
  if (gameId === requiredGame) return {
    id: `${key}:${gameId}:gen3-form-coverage-birth-island` as HuntRouteId,
    targetEntityKey: key, gameId, method: 'static-encounter', huntingMethodId: gameId === 'emerald' ? 'gen3-runaway' : 'gen3-soft-reset',
    access: 'external-game-feature', recommendation: 'eligible-with-external-setup', directEncounter: false,
    locations: ['Birth Island'], prerequisites: [{ type: 'external-game-feature', note: 'Obtain legitimate AuroraTicket access and complete the Birth Island triangle puzzle.' }],
    explanation: gameId === 'emerald'
      ? 'Birth Island Deoxys becomes Speed Forme in Emerald. Use Runaway and re-enter the area so the live RNG advances; repeated quick soft resets reuse fixed-seed frames.'
      : `Birth Island Deoxys becomes ${form} Forme in ${requiredGame} and can legitimately be shiny; the Omega Ruby/Alpha Sapphire story Deoxys is shiny locked.`,
    sources: [
      { provider: 'Serebii', url: 'https://www.serebii.net/games/deoxys.shtml', note: 'Documents Birth Island and the game-dependent Deoxys formes.' },
      { provider: 'Bulbapedia', url: 'https://bulbapedia.bulbagarden.net/wiki/List_of_unobtainable_Shiny_Pok%C3%A9mon', note: 'Confirms legitimate shiny Deoxys from AuroraTicket FireRed, LeafGreen and eligible Emerald releases.' },
    ], verifiedAt,
  };
  const location = deoxysTransferLocations[gameId];
  if (!location || gameId === 'ruby' || gameId === 'sapphire') return unavailableFormRoute(key, gameId, `Deoxys ${form} Forme cannot be maintained in ${gameId}; Ruby and Sapphire automatically use Normal Forme.`);
  return {
    id: `${key}:${gameId}:gen3-form-coverage-transfer-form-change` as HuntRouteId,
    targetEntityKey: key, gameId, method: 'form-change-from-hunted-shiny', huntingMethodId: 'custom',
    access: 'transfer-only', recommendation: 'not-eligible', directEncounter: false,
    locations: [location], prerequisites: [{ type: 'external-game-feature', entityKey: key, sourceGameIds: ['firered', 'leafgreen', 'emerald'], note: 'Transfer a legitimate shiny Deoxys originating from an eligible Birth Island encounter, then select this form in the destination game.' }],
    explanation: `Deoxys ${form} Forme is obtainable in ${gameId} by transfer and form change, but it is not a new shiny origin and remains excluded from the hunt randomizer.`,
    sources: [
      { provider: 'Serebii', url: 'https://www.serebii.net/games/deoxys.shtml', note: 'Documents transfer and meteorite-based access to all four Deoxys formes.' },
      { provider: 'Bulbapedia', url: 'https://bulbapedia.bulbagarden.net/wiki/Deoxys_(Pok%C3%A9mon)', note: 'Documents Deoxys form changes and destination-game availability.' },
    ], verifiedAt,
  };
}

export const GEN3_HUNT_COVERAGE_ROUTES: PokemonHuntRoute[] = [];
for (let speciesId = FIRST_SPECIES; speciesId <= LAST_SPECIES; speciesId += 1) {
  for (const gameId of TRACKED_GAME_IDS) GEN3_HUNT_COVERAGE_ROUTES.push(buildBaseRoute(speciesId, gameId));
}

const gen3FormEntities = POKEMON_CATALOG_V2.filter((item) => item.speciesId >= FIRST_SPECIES && item.speciesId <= LAST_SPECIES && item.formKey !== 'base');
for (const form of gen3FormEntities) {
  for (const gameId of TRACKED_GAME_IDS) {
    if (form.key === 'pokemon:263:zigzagoon-galar') GEN3_HUNT_COVERAGE_ROUTES.push(galarFormRoute(form.key, gameId, 'Galarian Zigzagoon', false));
    else if (form.key === 'pokemon:264:linoone-galar') GEN3_HUNT_COVERAGE_ROUTES.push(galarFormRoute(form.key, gameId, 'Galarian Linoone', true));
    else if (form.speciesId === 351) GEN3_HUNT_COVERAGE_ROUTES.push(castformBattleFormRoute(form.key, gameId, form.displayName));
    else if (form.key === 'pokemon:386:deoxys-attack') GEN3_HUNT_COVERAGE_ROUTES.push(deoxysFormRoute(form.key, gameId, 'Attack'));
    else if (form.key === 'pokemon:386:deoxys-defense') GEN3_HUNT_COVERAGE_ROUTES.push(deoxysFormRoute(form.key, gameId, 'Defense'));
    else if (form.key === 'pokemon:386:deoxys-speed') GEN3_HUNT_COVERAGE_ROUTES.push(deoxysFormRoute(form.key, gameId, 'Speed'));
    else throw new Error(`Unhandled Generation III catalog form ${form.key}`);
  }
}
