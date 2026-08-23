import type { PokemonEntityKey } from './pokemon-catalog-v2';
import { POKEMON_CATALOG_V2_BY_KEY } from './pokemon-catalog-v2.registry';
import type { HuntRouteId, PokemonHuntRoute } from './pokemon-hunt-routes-v2';

type PlaOutbreakArea = readonly [area: string, targetEntityKeys: readonly PokemonEntityKey[]];

const base = (speciesId: number) => `pokemon:${speciesId}:base` as PokemonEntityKey;
const baseKeys = (...speciesIds: number[]) => speciesIds.map(base);

/**
 * Permanent Mass Outbreak tables documented for Legends: Arceus. Regional and
 * sea-form targets are explicit so a Hisuian outbreak never becomes a route for
 * the corresponding original form (or vice versa).
 */
const PLA_MASS_OUTBREAK_AREAS: readonly PlaOutbreakArea[] = [
  ['Obsidian Fieldlands', [
    ...baseKeys(25, 41, 42, 46, 47, 54, 55, 63, 64, 77, 78, 113, 122, 123, 129, 130, 133, 172, 234,
      265, 266, 267, 268, 269, 390, 391, 396, 397, 398, 399, 400, 401, 402, 403, 404, 405, 406, 415,
      418, 419, 420, 427, 439, 440),
    'pokemon:211:qwilfish-hisui',
    'pokemon:422:west-sea',
    'pokemon:423:west-sea',
  ]],
  ['Crimson Mirelands', [
    ...baseKeys(46, 47, 54, 55, 74, 75, 92, 93, 108, 111, 112, 113, 114, 175, 185, 193, 198, 216,
      217, 315, 339, 340, 387, 388, 401, 402, 406, 415, 417, 418, 420, 434, 435, 438, 440, 449,
      450, 453, 454, 455, 463, 465),
  ]],
  ['Cobalt Coastlands', [
    ...baseKeys(37, 66, 67, 72, 73, 113, 114, 126, 175, 190, 223, 224, 226, 240, 355, 356, 363,
      364, 365, 393, 394, 396, 397, 398, 418, 419, 424, 425, 426, 431, 432, 440, 441, 451, 452,
      456, 457, 458, 465),
    'pokemon:58:growlithe-hisui',
    'pokemon:211:qwilfish-hisui',
    'pokemon:422:east-sea',
    'pokemon:423:east-sea',
  ]],
  ['Coronet Highlands', [
    ...baseKeys(35, 41, 42, 74, 75, 95, 111, 112, 113, 123, 125, 129, 130, 173, 185, 193, 200,
      207, 214, 216, 217, 239, 299, 315, 358, 403, 404, 406, 433, 434, 435, 436, 438, 440, 443,
      444, 446, 447, 449, 450, 453, 454, 469, 479),
    'pokemon:100:voltorb-hisui',
    'pokemon:215:sneasel-hisui',
  ]],
  ['Alabaster Icelands', [
    ...baseKeys(66, 67, 92, 93, 108, 113, 133, 190, 200, 207, 215, 220, 221, 234, 280, 281, 282,
      355, 356, 358, 361, 362, 399, 400, 424, 425, 426, 433, 436, 437, 440, 443, 444, 446, 447,
      449, 450, 459, 460, 473),
  ]],
];

const verifiedAt = '2026-08-22';

const massOutbreakAreaByTarget = new Map<PokemonEntityKey, string[]>();
for (const [area, targetEntityKeys] of PLA_MASS_OUTBREAK_AREAS) {
  for (const targetEntityKey of targetEntityKeys) {
    const existing = massOutbreakAreaByTarget.get(targetEntityKey);
    if (existing) existing.push(area);
    else massOutbreakAreaByTarget.set(targetEntityKey, [area]);
  }
}

export const PLA_MASS_OUTBREAK_HUNT_ROUTES: PokemonHuntRoute[] = [...massOutbreakAreaByTarget.entries()]
  .flatMap(([targetEntityKey, areas]): PokemonHuntRoute[] => {
    const entity = POKEMON_CATALOG_V2_BY_KEY.get(targetEntityKey);
    if (!entity) return [];
    return [{
      id: `${targetEntityKey}:pla:mass-outbreak` as HuntRouteId,
      targetEntityKey,
      gameId: 'pla',
      method: 'wild-random-encounter',
      huntingMethodId: 'pla-mass-outbreak',
      access: 'native',
      recommendation: 'eligible-native',
      directEncounter: true,
      locations: [...areas],
      prerequisites: [{
        type: 'game-progression',
        note: 'Progress until Mass Outbreaks can appear, then refresh the area reports from Jubilife Village.',
      }],
      explanation: `${entity.displayName} is listed in the permanent Legends: Arceus Mass Outbreak table for the recorded region or regions.`,
      sources: [
        {
          provider: 'Serebii',
          url: 'https://www.serebii.net/legendsarceus/massoutbreaks.shtml',
          note: `Lists ${entity.displayName} in the permanent Mass Outbreak table for ${areas.join(', ')}.`,
        },
        {
          provider: 'Bulbapedia',
          url: 'https://bulbapedia.bulbagarden.net/wiki/Mass_outbreak#Pok%C3%A9mon_Legends:_Arceus',
          note: 'Documents Legends: Arceus Mass Outbreak mechanics and boosted shiny rolls.',
        },
      ],
      verifiedAt,
    }];
  });

export const PLA_MASS_OUTBREAK_EXPECTED_TARGET_COUNT = massOutbreakAreaByTarget.size;

const regionalMassiveTargetBySlug: Record<string, PokemonEntityKey> = {
  '058-h': 'pokemon:58:growlithe-hisui',
  '059-h': 'pokemon:59:arcanine-hisui',
  '100-h': 'pokemon:100:voltorb-hisui',
  '101-h': 'pokemon:101:electrode-hisui',
  '157-h': 'pokemon:157:typhlosion-hisui',
  '211-h': 'pokemon:211:qwilfish-hisui',
  '215-h': 'pokemon:215:sneasel-hisui',
  '422-e': 'pokemon:422:east-sea',
  '423-e': 'pokemon:423:east-sea',
  '422': 'pokemon:422:west-sea',
  '423': 'pokemon:423:west-sea',
};

const massiveSlugs = (...slugs: string[]) => slugs.flatMap((slug): PokemonEntityKey[] => {
  if (slug === '201') {
    return [...POKEMON_CATALOG_V2_BY_KEY.values()]
      .filter((entity) => entity.speciesId === 201)
      .map((entity) => entity.key);
  }
  return [regionalMassiveTargetBySlug[slug] ?? base(Number.parseInt(slug, 10))];
});

const PLA_MASSIVE_MASS_OUTBREAK_AREAS: readonly PlaOutbreakArea[] = [
  ['Obsidian Fieldlands', massiveSlugs(
    '25', '26', '41', '42', '46', '47', '63', '64', '65', '74', '75', '76', '77', '78', '122', '123',
    '143', '169', '172', '234', '265', '266', '267', '268', '269', '363', '364', '390', '391', '392',
    '396', '397', '398', '399', '400', '401', '402', '403', '404', '405', '418', '419', '422', '423',
    '425', '426', '427', '428', '439', '441', '446',
  )],
  ['Crimson Mirelands', massiveSlugs(
    '46', '47', '54', '55', '92', '93', '94', '95', '108', '111', '112', '114', '155', '156', '157-h',
    '185', '193', '198', '201', '208', '216', '217', '220', '221', '315', '387', '388', '389', '401',
    '402', '406', '407', '417', '430', '434', '435', '436', '437', '438', '442', '449', '450', '451',
    '452', '453', '454', '455', '463', '464', '465', '469',
  )],
  ['Cobalt Coastlands', massiveSlugs(
    '35', '37', '38', '54', '55', '058-h', '059-h', '66', '67', '68', '72', '73', '74', '75', '76',
    '95', '113', '126', '129', '130', '173', '175', '176', '190', '208', '211-h', '226', '240', '242',
    '363', '364', '365', '393', '394', '395', '396', '397', '398', '422-e', '423-e', '424', '431',
    '432', '440', '441', '447', '448', '451', '452', '456', '457', '458', '467', '468',
  )],
  ['Coronet Highlands', massiveSlugs(
    '35', '36', '74', '75', '76', '77', '78', '92', '93', '94', '100-h', '101-h', '111', '112', '122',
    '125', '173', '193', '200', '207', '214', '215-h', '239', '299', '355', '356', '358', '403', '404',
    '405', '429', '433', '434', '435', '436', '437', '439', '443', '444', '445', '449', '450', '459',
    '460', '464', '466', '469', '472', '476', '477', '479',
  )],
  ['Alabaster Icelands', massiveSlugs(
    '37', '38', '63', '64', '65', '66', '67', '68', '92', '93', '94', '108', '126', '190', '200', '220',
    '221', '240', '280', '281', '282', '355', '356', '361', '362', '399', '400', '417', '424', '425',
    '426', '427', '428', '429', '431', '432', '436', '437', '447', '448', '459', '460', '463', '473',
    '475', '477', '478',
  )],
];

const massiveOutbreakAreaByTarget = new Map<PokemonEntityKey, string[]>();
for (const [area, targetEntityKeys] of PLA_MASSIVE_MASS_OUTBREAK_AREAS) {
  for (const targetEntityKey of targetEntityKeys) {
    const existing = massiveOutbreakAreaByTarget.get(targetEntityKey);
    if (existing) existing.push(area);
    else massiveOutbreakAreaByTarget.set(targetEntityKey, [area]);
  }
}

export const PLA_MASSIVE_MASS_OUTBREAK_HUNT_ROUTES: PokemonHuntRoute[] = [...massiveOutbreakAreaByTarget.entries()]
  .flatMap(([targetEntityKey, areas]): PokemonHuntRoute[] => {
    const entity = POKEMON_CATALOG_V2_BY_KEY.get(targetEntityKey);
    if (!entity) return [];
    return [{
      id: `${targetEntityKey}:pla:massive-mass-outbreak` as HuntRouteId,
      targetEntityKey,
      gameId: 'pla',
      method: 'wild-random-encounter',
      huntingMethodId: 'pla-massive',
      access: 'native',
      recommendation: 'eligible-native',
      directEncounter: true,
      locations: [...areas],
      prerequisites: [{
        type: 'game-progression',
        note: 'Complete Request 102: Daybreak, then reveal Massive Mass Outbreak icons during the area storm.',
      }],
      explanation: `${entity.displayName} is listed in the permanent Legends: Arceus Massive Mass Outbreak table for the recorded region or regions.`,
      sources: [
        {
          provider: 'Serebii',
          url: 'https://www.serebii.net/legendsarceus/massivemassoutbreaks.shtml',
          note: `Lists ${entity.displayName} in the Massive Mass Outbreak table for ${areas.join(', ')}.`,
        },
        {
          provider: 'Bulbapedia',
          url: 'https://bulbapedia.bulbagarden.net/wiki/Mass_outbreak#Massive_mass_outbreaks',
          note: 'Documents Massive Mass Outbreak access, spawn waves and shiny rolls.',
        },
      ],
      verifiedAt,
    }];
  });

export const PLA_MASSIVE_MASS_OUTBREAK_EXPECTED_TARGET_COUNT = massiveOutbreakAreaByTarget.size;
