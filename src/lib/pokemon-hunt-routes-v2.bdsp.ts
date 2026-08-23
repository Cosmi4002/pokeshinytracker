import type { PokemonEntityKey } from './pokemon-catalog-v2';
import { POKEMON_CATALOG_V2_BY_KEY } from './pokemon-catalog-v2.registry';
import type { HuntRouteId, PokemonHuntRoute } from './pokemon-hunt-routes-v2';
import type { TrackedGameId } from './pokemon-game-availability';

type BdspRadarRecord = readonly [
  speciesId: number,
  games: readonly Extract<TrackedGameId, 'brilliantdiamond' | 'shiningpearl'>[],
  locations: readonly string[],
];

const bothVersions = ['brilliantdiamond', 'shiningpearl'] as const;
const brilliantDiamondOnly = ['brilliantdiamond'] as const;
const shiningPearlOnly = ['shiningpearl'] as const;

/**
 * Species and locations in Serebii's BDSP Poké Radar table. Keeping this as an
 * explicit version matrix prevents a general wild route from incorrectly
 * making a version-exclusive Radar encounter available in both games.
 */
const BDSP_RADAR_RECORDS: readonly BdspRadarRecord[] = [
  [29, bothVersions, ['Route 201']],
  [30, bothVersions, ['Route 221', 'Valor Lakefront']],
  [32, bothVersions, ['Route 201']],
  [33, bothVersions, ['Route 221', 'Valor Lakefront']],
  [48, bothVersions, ['Route 229']],
  [49, bothVersions, ['Route 229']],
  [56, bothVersions, ['Route 225', 'Route 226']],
  [57, bothVersions, ['Route 225', 'Route 226']],
  [79, shiningPearlOnly, ['Route 205']],
  [88, bothVersions, ['Route 212']],
  [128, bothVersions, ['Route 209', 'Route 210']],
  [132, bothVersions, ['Route 218']],
  [161, bothVersions, ['Route 202']],
  [175, bothVersions, ['Route 230']],
  [179, bothVersions, ['Valley Windworks']],
  [180, bothVersions, ['Route 222']],
  [187, bothVersions, ['Route 205', 'Fuego Ironworks']],
  [188, bothVersions, ['Route 205', 'Fuego Ironworks']],
  [191, bothVersions, ['Route 204']],
  [202, bothVersions, ['Lake Verity', 'Lake Valor', 'Lake Acuity']],
  [228, shiningPearlOnly, ['Route 214', 'Route 215']],
  [234, shiningPearlOnly, ['Route 207']],
  [235, bothVersions, ['Route 212']],
  [236, bothVersions, ['Route 208', 'Route 211']],
  [241, bothVersions, ['Route 209', 'Route 210']],
  [246, brilliantDiamondOnly, ['Route 207']],
  [262, brilliantDiamondOnly, ['Route 214', 'Route 215']],
  [277, bothVersions, ['Route 213']],
  [280, bothVersions, ['Route 203', 'Route 204']],
  [281, bothVersions, ['Route 203', 'Route 204']],
  [290, bothVersions, ['Eterna Forest']],
  [294, bothVersions, ['Mt. Coronet']],
  [304, brilliantDiamondOnly, ['Fuego Ironworks']],
  [324, bothVersions, ['Route 227', 'Stark Mountain']],
  [328, bothVersions, ['Route 228']],
  [329, bothVersions, ['Route 228']],
  [333, bothVersions, ['Route 211']],
  [343, bothVersions, ['Route 206']],
  [352, brilliantDiamondOnly, ['Route 210']],
  [355, bothVersions, ['Route 224']],
  [356, bothVersions, ['Route 224']],
  [361, bothVersions, ['Route 216', 'Route 217', 'Acuity Lakefront']],
  [371, shiningPearlOnly, ['Route 210']],
];

const verifiedAt = '2026-08-22';

export const BDSP_POKE_RADAR_HUNT_ROUTES: PokemonHuntRoute[] = BDSP_RADAR_RECORDS.flatMap(([
  speciesId,
  games,
  locations,
]) => {
  const targetEntityKey = `pokemon:${speciesId}:base` as PokemonEntityKey;
  const entity = POKEMON_CATALOG_V2_BY_KEY.get(targetEntityKey);
  if (!entity) return [];

  return games.map((gameId): PokemonHuntRoute => ({
    id: `${targetEntityKey}:${gameId}:bdsp-poke-radar` as HuntRouteId,
    targetEntityKey,
    gameId,
    method: 'poke-radar',
    huntingMethodId: 'gen8-bdsp-pokeradar',
    access: 'native',
    recommendation: 'eligible-native',
    directEncounter: true,
    locations: [...locations],
    prerequisites: [{
      type: 'game-progression',
      note: 'Obtain the National Pokédex and receive the Poké Radar from Professor Rowan.',
    }],
    explanation: `${entity.displayName} is a documented Poké Radar encounter in ${gameId}; build a chain in one of the listed grass locations for the Radar shiny odds.`,
    sources: [
      {
        provider: 'Serebii',
        url: 'https://www.serebii.net/brilliantdiamondshiningpearl/pokeradar.shtml',
        note: `Lists ${entity.displayName}, its BDSP version availability and the recorded Poké Radar locations.`,
      },
      {
        provider: 'Bulbapedia',
        url: 'https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9_Radar',
        note: 'Documents BDSP Poké Radar chaining and the National Pokédex prerequisite.',
      },
    ],
    verifiedAt,
  }));
});

export const BDSP_POKE_RADAR_EXPECTED_ROUTE_COUNT = BDSP_RADAR_RECORDS.reduce(
  (total, [, games]) => total + games.length,
  0,
);
