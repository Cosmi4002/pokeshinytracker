import type { PokemonEntityKey } from './pokemon-catalog-v2';
import { POKEMON_CATALOG_V2_BY_KEY } from './pokemon-catalog-v2.registry';
import type { HuntRouteId, PokemonHuntRoute } from './pokemon-hunt-routes-v2';
import type { TrackedGameId } from './pokemon-game-availability';

type SvRegion = 'Paldea' | 'Kitakami' | 'Terarium';
type SvOutbreakRecord = readonly [region: SvRegion, slugs: readonly string[]];

const SV_OUTBREAK_RECORDS: readonly SvOutbreakRecord[] = [
  ['Paldea', [
    '025', '026', '039', '040', '048', '049', '050', '051', '052', '053', '054', '055', '056', '057',
    '058', '059', '079', '080', '081', '082', '088', '089', '090', '091', '092', '093', '096', '097',
    '100', '101', '113', '123', '128-a', '128-b', '128-p', '129', '130', '132', '133', '134', '135',
    '136', '147', '148', '172', '174', '179', '180', '181', '183', '184', '185', '187', '188', '189',
    '192', '194-p', '196', '197', '198', '200', '203', '204', '205', '206', '211', '214', '215', '216',
    '217', '225', '228', '229', '231', '232', '234', '242', '246', '247', '278', '279', '280', '281',
    '282', '283', '284', '285', '286', '287', '288', '289', '296', '297', '298', '302', '307', '308',
    '316', '317', '322', '323', '324', '325', '326', '331', '332', '333', '334', '335', '336', '339',
    '340', '353', '354', '357', '361', '362', '370', '371', '372', '396', '397', '398', '401', '402',
    '403', '404', '405', '415', '416', '417', '418', '419', '422', '422-e', '423', '423-e', '425',
    '426', '429', '430', '434', '435', '436', '437', '438', '440', '443', '444', '447', '448', '449',
    '450', '453', '454', '456', '457', '459', '460', '461', '470', '471', '475', '478', '479',
  ]],
  ['Kitakami', [
    '023', '024', '025', '027', '028', '035', '037', '056', '057', '058', '060', '061', '069', '070',
    '074', '075', '092', '093', '094', '109', '129', '130', '161', '162', '163', '164', '167', '168',
    '172', '173', '185', '190', '193', '194', '195', '206', '207', '214', '215', '218', '220', '221',
    '228', '229', '234', '261', '262', '270', '271', '273', '274', '280', '281', '282', '283', '284',
    '299', '313', '314', '325', '339', '340', '341', '342', '349', '355', '356', '358', '361', '396',
    '397', '398', '401', '402', '403', '404', '405', '417', '433', '436', '437', '438', '443', '444',
    '446', '447', '448', '475',
  ]],
  ['Terarium', [
    '001', '004', '007', '027-a', '037-a', '043', '044', '045', '048', '049', '050-a', '051-a',
    '072', '073', '074-a', '075-a', '079-g', '081', '082', '084', '085', '086', '087', '088-a',
    '089-a', '102', '103', '103-a', '106', '107', '111', '112', '113', '116', '117', '123', '125',
    '126', '128', '131', '137', '152', '155', '158', '170', '171', '182', '203', '209', '210', '211-h',
    '212', '227', '235', '236', '237', '239', '240', '242', '252', '255', '258', '287', '288', '289',
    '311', '312', '322', '323', '324', '328', '329', '330', '333', '334', '335', '336', '370', '374',
    '375', '387', '390', '393', '408', '410', '440', '456', '457', '459', '460', '479',
  ]],
];

const targetByFormSlug: Record<string, PokemonEntityKey> = {
  '027-a': 'pokemon:27:sandshrew-alola',
  '037-a': 'pokemon:37:vulpix-alola',
  '050-a': 'pokemon:50:diglett-alola',
  '051-a': 'pokemon:51:dugtrio-alola',
  '074-a': 'pokemon:74:geodude-alola',
  '075-a': 'pokemon:75:graveler-alola',
  '079-g': 'pokemon:79:slowpoke-galar',
  '088-a': 'pokemon:88:grimer-alola',
  '089-a': 'pokemon:89:muk-alola',
  '103-a': 'pokemon:103:exeggutor-alola',
  '128-a': 'pokemon:128:tauros-paldea-aqua-breed',
  '128-b': 'pokemon:128:tauros-paldea-blaze-breed',
  '128-p': 'pokemon:128:tauros-paldea-combat-breed',
  '194-p': 'pokemon:194:wooper-paldea',
  '211-h': 'pokemon:211:qwilfish-hisui',
  '422-e': 'pokemon:422:east-sea',
  '423-e': 'pokemon:423:east-sea',
  '422': 'pokemon:422:west-sea',
  '423': 'pokemon:423:west-sea',
};

const scarletOnlySlugs = new Set(['037-a', '128-b', '207', '246', '247', '408', '425', '426', '434', '435']);
const violetOnlySlugs = new Set(['027-a', '128-a', '190', '200', '302', '371', '372', '410']);

function targetForSlug(slug: string): PokemonEntityKey {
  return targetByFormSlug[slug] ?? `pokemon:${Number.parseInt(slug, 10)}:base` as PokemonEntityKey;
}

function gamesForSlug(slug: string): readonly Extract<TrackedGameId, 'scarlet' | 'violet'>[] {
  if (scarletOnlySlugs.has(slug)) return ['scarlet'];
  if (violetOnlySlugs.has(slug)) return ['violet'];
  return ['scarlet', 'violet'];
}

const outbreakRegionsByTargetAndGame = new Map<string, { targetEntityKey: PokemonEntityKey; gameId: 'scarlet' | 'violet'; regions: SvRegion[] }>();
for (const [region, slugs] of SV_OUTBREAK_RECORDS) {
  for (const slug of slugs) {
    const targetEntityKey = targetForSlug(slug);
    for (const gameId of gamesForSlug(slug)) {
      const key = `${targetEntityKey}:${gameId}`;
      const existing = outbreakRegionsByTargetAndGame.get(key);
      if (existing) existing.regions.push(region);
      else outbreakRegionsByTargetAndGame.set(key, { targetEntityKey, gameId, regions: [region] });
    }
  }
}

const verifiedAt = '2026-08-22';

function buildOutbreakRoute(
  targetEntityKey: PokemonEntityKey,
  gameId: 'scarlet' | 'violet',
  regions: SvRegion[],
  withSandwich: boolean,
): PokemonHuntRoute | null {
  const entity = POKEMON_CATALOG_V2_BY_KEY.get(targetEntityKey);
  if (!entity) return null;
  const huntingMethodId = withSandwich ? 'gen9-outbreak-sandwich' : 'gen9-outbreak';
  return {
    id: `${targetEntityKey}:${gameId}:${withSandwich ? 'mass-outbreak-sandwich' : 'mass-outbreak'}` as HuntRouteId,
    targetEntityKey,
    gameId,
    method: 'wild-random-encounter',
    huntingMethodId,
    access: 'native',
    recommendation: 'eligible-native',
    directEncounter: true,
    locations: [...regions],
    prerequisites: [{
      type: 'game-progression',
      note: withSandwich
        ? 'Clear at least 60 outbreak spawns, then use a level 3 Sparkling Power sandwich matching the target type.'
        : 'Refresh the daily Mass Outbreak map until this species appears, then clear at least 60 outbreak spawns.',
    }],
    explanation: `${entity.displayName} is listed in the permanent ${gameId} Mass Outbreak table for ${regions.join(', ')}${withSandwich ? ' and can combine the outbreak bonus with Sparkling Power' : ''}.`,
    sources: [
      {
        provider: 'Serebii',
        url: 'https://www.serebii.net/scarletviolet/massoutbreaks.shtml',
        note: `Lists ${entity.displayName} in the permanent outbreak table and documents the 60+ clear shiny rolls${withSandwich ? ' with Meal Power Level 3' : ''}.`,
      },
      {
        provider: 'Bulbapedia',
        url: 'https://bulbapedia.bulbagarden.net/wiki/Mass_outbreak#Pok%C3%A9mon_Scarlet_and_Violet',
        note: 'Documents Scarlet/Violet Mass Outbreak mechanics, version availability and shiny bonuses.',
      },
    ],
    verifiedAt,
  };
}

export const SV_MASS_OUTBREAK_HUNT_ROUTES: PokemonHuntRoute[] = [...outbreakRegionsByTargetAndGame.values()]
  .flatMap(({ targetEntityKey, gameId, regions }) => [
    buildOutbreakRoute(targetEntityKey, gameId, regions, false),
    buildOutbreakRoute(targetEntityKey, gameId, regions, true),
  ])
  .filter((route): route is PokemonHuntRoute => route !== null);

export const SV_MASS_OUTBREAK_EXPECTED_TARGET_GAME_COUNT = outbreakRegionsByTargetAndGame.size;
