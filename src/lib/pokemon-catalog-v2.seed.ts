import { createPokemonEntityKey } from './pokemon-catalog-v2';
import type { PokemonCatalogEntity } from './pokemon-catalog-v2';

const CATALOG_SOURCES = {
  burmy: [
    'https://bulbapedia.bulbagarden.net/wiki/Burmy_(Pok%C3%A9mon)',
    'https://www.serebii.net/pokedex-swsh/burmy',
  ],
  dialga: [
    'https://bulbapedia.bulbagarden.net/wiki/Dialga_(Pok%C3%A9mon)',
    'https://www.serebii.net/pokemon/dialga',
  ],
  gastrodon: [
    'https://bulbapedia.bulbagarden.net/wiki/Gastrodon_(Pok%C3%A9mon)',
    'https://www.serebii.net/pokedex-swsh/gastrodon',
  ],
  palkia: [
    'https://bulbapedia.bulbagarden.net/wiki/Palkia_(Pok%C3%A9mon)',
    'https://www.serebii.net/pokemon/palkia',
  ],
  rotom: [
    'https://bulbapedia.bulbagarden.net/wiki/Rotom_(Pok%C3%A9mon)',
    'https://www.serebii.net/pokedex-sm/479.shtml',
  ],
  giratina: [
    'https://bulbapedia.bulbagarden.net/wiki/Giratina_(Pok%C3%A9mon)',
    'https://www.serebii.net/pokedex-sm/487.shtml',
  ],
  kyurem: [
    'https://bulbapedia.bulbagarden.net/wiki/Kyurem_(Pok%C3%A9mon)',
    'https://www.serebii.net/pokedex-bw/646.shtml',
  ],
  keldeo: [
    'https://bulbapedia.bulbagarden.net/wiki/Keldeo_(Pok%C3%A9mon)',
    'https://www.serebii.net/pokedex-bw/647.shtml',
  ],
  necrozma: [
    'https://bulbapedia.bulbagarden.net/wiki/Necrozma_(Pok%C3%A9mon)',
    'https://www.serebii.net/pokedex-sm/800.shtml',
  ],
  shaymin: [
    'https://bulbapedia.bulbagarden.net/wiki/Shaymin_(Pok%C3%A9mon)',
    'https://www.serebii.net/pokedex-sm/492.shtml',
  ],
  shellos: [
    'https://bulbapedia.bulbagarden.net/wiki/Shellos_(Pok%C3%A9mon)',
    'https://www.serebii.net/pokedex-swsh/shellos',
  ],
  wormadam: [
    'https://bulbapedia.bulbagarden.net/wiki/Wormadam_(Pok%C3%A9mon)',
    'https://www.serebii.net/pokedex-swsh/wormadam',
  ],
} as const;

function seedEntity(
  entity: Omit<PokemonCatalogEntity, 'key' | 'verification'> & {
    sourceUrls: readonly string[];
  },
): PokemonCatalogEntity {
  const { sourceUrls, ...data } = entity;
  return {
    ...data,
    key: createPokemonEntityKey(data.speciesId, data.formKey),
    verification: {
      status: 'verified',
      sourceUrls: [...sourceUrls],
      lastVerifiedAt: '2026-08-21',
      notes: 'Form identity and tracker classification cross-checked with Bulbapedia and Serebii. Game-by-game hunt availability belongs to the later hunt-method dataset.',
    },
  };
}

/**
 * First source-backed v2 seed. These entries cover the collision/fusion cases
 * already discussed and provide fixtures for the legacy migration resolver.
 */
export const POKEMON_CATALOG_V2_SEED: PokemonCatalogEntity[] = [
  seedEntity({ speciesId: 412, formKey: 'plant-cloak', canonicalName: 'burmy-plant', displayName: 'Burmy (Plant Cloak)', generationIntroduced: 4, kind: 'temporary', cardPolicy: 'separate-card', completionPolicy: 'per-form', assets: { shinyStatic: '/img/pokemon-sprites/remote/raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/shiny/412.png' }, legacy: { pokemonIds: [412], formNames: ['burmy-plant', 'burmy'], displayNames: ['Burmy', 'Burmy (Plant Cloak)'] }, sourceUrls: CATALOG_SOURCES.burmy }),
  seedEntity({ speciesId: 412, formKey: 'sandy-cloak', canonicalName: 'burmy-sandy', displayName: 'Burmy (Sandy Cloak)', generationIntroduced: 4, kind: 'temporary', cardPolicy: 'separate-card', completionPolicy: 'per-form', assets: { shinyStatic: '/img/pokemon-sprites/remote/img.pokemondb.net/sprites/home/shiny/burmy-sandy.png' }, legacy: { pokemonIds: [1041201], formNames: ['burmy-sandy'], displayNames: ['Burmy (Sandy Cloak)'] }, sourceUrls: CATALOG_SOURCES.burmy }),
  seedEntity({ speciesId: 412, formKey: 'trash-cloak', canonicalName: 'burmy-trash', displayName: 'Burmy (Trash Cloak)', generationIntroduced: 4, kind: 'temporary', cardPolicy: 'separate-card', completionPolicy: 'per-form', assets: { shinyStatic: '/img/pokemon-sprites/remote/img.pokemondb.net/sprites/home/shiny/burmy-trash.png' }, legacy: { pokemonIds: [1041202], formNames: ['burmy-trash'], displayNames: ['Burmy (Trash Cloak)'] }, sourceUrls: CATALOG_SOURCES.burmy }),

  seedEntity({ speciesId: 413, formKey: 'plant-cloak', canonicalName: 'wormadam-plant', displayName: 'Wormadam (Plant Cloak)', generationIntroduced: 4, kind: 'persistent', cardPolicy: 'separate-card', completionPolicy: 'per-form', assets: { shinyStatic: '/img/pokemon-sprites/remote/raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/shiny/413.png' }, legacy: { pokemonIds: [413], formNames: ['wormadam-plant', 'wormadam'], displayNames: ['Wormadam', 'Wormadam (Plant Cloak)'] }, sourceUrls: CATALOG_SOURCES.wormadam }),
  seedEntity({ speciesId: 413, formKey: 'sandy-cloak', canonicalName: 'wormadam-sandy', displayName: 'Wormadam (Sandy Cloak)', generationIntroduced: 4, kind: 'persistent', cardPolicy: 'separate-card', completionPolicy: 'per-form', assets: { shinyStatic: '/img/pokemon-sprites/remote/img.pokemondb.net/sprites/home/shiny/wormadam-sandy.png' }, legacy: { pokemonIds: [1041301], formNames: ['wormadam-sandy'], displayNames: ['Wormadam (Sandy Cloak)'] }, sourceUrls: CATALOG_SOURCES.wormadam }),
  seedEntity({ speciesId: 413, formKey: 'trash-cloak', canonicalName: 'wormadam-trash', displayName: 'Wormadam (Trash Cloak)', generationIntroduced: 4, kind: 'persistent', cardPolicy: 'separate-card', completionPolicy: 'per-form', assets: { shinyStatic: '/img/pokemon-sprites/remote/img.pokemondb.net/sprites/home/shiny/wormadam-trash.png' }, legacy: { pokemonIds: [1041302], formNames: ['wormadam-trash'], displayNames: ['Wormadam (Trash Cloak)'] }, sourceUrls: CATALOG_SOURCES.wormadam }),

  seedEntity({ speciesId: 422, formKey: 'west-sea', canonicalName: 'shellos-west', displayName: 'Shellos (West Sea)', generationIntroduced: 4, kind: 'persistent', cardPolicy: 'separate-card', completionPolicy: 'per-form', assets: { shinyStatic: '/img/pokemon-sprites/remote/raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/shiny/422.png' }, legacy: { pokemonIds: [422], formNames: ['shellos', 'shellos-west'], displayNames: ['Shellos', 'Shellos (West Sea)'] }, sourceUrls: CATALOG_SOURCES.shellos }),
  seedEntity({ speciesId: 422, formKey: 'east-sea', canonicalName: 'shellos-east', displayName: 'Shellos (East Sea)', generationIntroduced: 4, kind: 'persistent', cardPolicy: 'separate-card', completionPolicy: 'per-form', assets: { shinyStatic: '/img/pokemon-sprites/remote/img.pokemondb.net/sprites/home/shiny/shellos-east.png' }, legacy: { pokemonIds: [10026, 4220001], formNames: ['shellos-east'], displayNames: ['Shellos (East Sea)'] }, sourceUrls: CATALOG_SOURCES.shellos }),

  seedEntity({ speciesId: 423, formKey: 'west-sea', canonicalName: 'gastrodon-west', displayName: 'Gastrodon (West Sea)', generationIntroduced: 4, kind: 'persistent', cardPolicy: 'separate-card', completionPolicy: 'per-form', assets: { shinyStatic: '/img/pokemon-sprites/remote/raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/shiny/423.png' }, legacy: { pokemonIds: [423], formNames: ['gastrodon', 'gastrodon-west'], displayNames: ['Gastrodon', 'Gastrodon (West Sea)'] }, sourceUrls: CATALOG_SOURCES.gastrodon }),
  seedEntity({ speciesId: 423, formKey: 'east-sea', canonicalName: 'gastrodon-east', displayName: 'Gastrodon (East Sea)', generationIntroduced: 4, kind: 'persistent', cardPolicy: 'separate-card', completionPolicy: 'per-form', assets: {}, legacy: { pokemonIds: [10027, 4230001], formNames: ['gastrodon-east'], displayNames: ['Gastrodon (East Sea)'] }, sourceUrls: CATALOG_SOURCES.gastrodon }),

  seedEntity({ speciesId: 479, formKey: 'base', canonicalName: 'rotom', displayName: 'Rotom', generationIntroduced: 4, kind: 'base', cardPolicy: 'separate-card', completionPolicy: 'per-form', assets: { shinyStatic: '/img/pokemon-sprites/remote/raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/shiny/479.png' }, legacy: { pokemonIds: [479], formNames: ['rotom'], displayNames: ['Rotom'] }, sourceUrls: CATALOG_SOURCES.rotom }),
  seedEntity({ speciesId: 479, formKey: 'heat', canonicalName: 'rotom-heat', displayName: 'Heat Rotom', generationIntroduced: 4, kind: 'persistent', cardPolicy: 'separate-card', completionPolicy: 'per-form', assets: { shinyStatic: '/img/pokemon-sprites/remote/raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/shiny/10008.png' }, legacy: { pokemonIds: [10008, 4790001], formNames: ['rotom-heat'], displayNames: ['Rotom Heat', 'Heat Rotom'] }, sourceUrls: CATALOG_SOURCES.rotom }),
  seedEntity({ speciesId: 479, formKey: 'wash', canonicalName: 'rotom-wash', displayName: 'Wash Rotom', generationIntroduced: 4, kind: 'persistent', cardPolicy: 'separate-card', completionPolicy: 'per-form', assets: { shinyStatic: '/img/pokemon-sprites/remote/raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/shiny/10009.png' }, legacy: { pokemonIds: [10009, 4790002], formNames: ['rotom-wash'], displayNames: ['Rotom Wash', 'Wash Rotom'] }, sourceUrls: CATALOG_SOURCES.rotom }),
  seedEntity({ speciesId: 479, formKey: 'frost', canonicalName: 'rotom-frost', displayName: 'Frost Rotom', generationIntroduced: 4, kind: 'persistent', cardPolicy: 'separate-card', completionPolicy: 'per-form', assets: { shinyStatic: '/img/pokemon-sprites/remote/raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/shiny/10010.png' }, legacy: { pokemonIds: [10010, 4790003], formNames: ['rotom-frost'], displayNames: ['Rotom Frost', 'Frost Rotom'] }, sourceUrls: CATALOG_SOURCES.rotom }),
  seedEntity({ speciesId: 479, formKey: 'fan', canonicalName: 'rotom-fan', displayName: 'Fan Rotom', generationIntroduced: 4, kind: 'persistent', cardPolicy: 'separate-card', completionPolicy: 'per-form', assets: { shinyStatic: '/img/pokemon-sprites/remote/raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/shiny/10011.png' }, legacy: { pokemonIds: [10011, 4790004], formNames: ['rotom-fan'], displayNames: ['Rotom Fan', 'Fan Rotom'] }, sourceUrls: CATALOG_SOURCES.rotom }),
  seedEntity({ speciesId: 479, formKey: 'mow', canonicalName: 'rotom-mow', displayName: 'Mow Rotom', generationIntroduced: 4, kind: 'persistent', cardPolicy: 'separate-card', completionPolicy: 'per-form', assets: { shinyStatic: '/img/pokemon-sprites/remote/raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/shiny/10012.png' }, legacy: { pokemonIds: [10012, 4790005], formNames: ['rotom-mow'], displayNames: ['Rotom Mow', 'Mow Rotom'] }, sourceUrls: CATALOG_SOURCES.rotom }),

  seedEntity({ speciesId: 483, formKey: 'altered', canonicalName: 'dialga', displayName: 'Dialga (Altered Forme)', generationIntroduced: 4, kind: 'base', cardPolicy: 'separate-card', completionPolicy: 'per-form', assets: { shinyStatic: '/img/pokemon-sprites/remote/raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/shiny/483.png' }, legacy: { pokemonIds: [483], formNames: ['dialga'], displayNames: ['Dialga', 'Dialga (Altered Forme)'] }, sourceUrls: CATALOG_SOURCES.dialga }),
  seedEntity({ speciesId: 483, formKey: 'origin', canonicalName: 'dialga-origin', displayName: 'Dialga (Origin Forme)', generationIntroduced: 8, kind: 'persistent', cardPolicy: 'separate-card', completionPolicy: 'per-form', assets: { shinyStatic: '/img/pokemon-sprites/remote/img.pokemondb.net/sprites/home/shiny/dialga-origin.png' }, legacy: { pokemonIds: [10243, 4830001], formNames: ['dialga-origin'], displayNames: ['Dialga (Origin)', 'Dialga (Origin Forme)'] }, sourceUrls: CATALOG_SOURCES.dialga }),

  seedEntity({ speciesId: 484, formKey: 'altered', canonicalName: 'palkia', displayName: 'Palkia (Altered Forme)', generationIntroduced: 4, kind: 'base', cardPolicy: 'separate-card', completionPolicy: 'per-form', assets: { shinyStatic: '/img/pokemon-sprites/remote/raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/shiny/484.png' }, legacy: { pokemonIds: [484], formNames: ['palkia'], displayNames: ['Palkia', 'Palkia (Altered Forme)'] }, sourceUrls: CATALOG_SOURCES.palkia }),
  seedEntity({ speciesId: 484, formKey: 'origin', canonicalName: 'palkia-origin', displayName: 'Palkia (Origin Forme)', generationIntroduced: 8, kind: 'persistent', cardPolicy: 'separate-card', completionPolicy: 'per-form', assets: { shinyStatic: '/img/pokemon-sprites/remote/img.pokemondb.net/sprites/home/shiny/palkia-origin.png' }, legacy: { pokemonIds: [10244, 4840001], formNames: ['palkia-origin'], displayNames: ['Palkia (Origin)', 'Palkia (Origin Forme)'] }, sourceUrls: CATALOG_SOURCES.palkia }),

  seedEntity({ speciesId: 487, formKey: 'altered', canonicalName: 'giratina-altered', displayName: 'Giratina (Altered Forme)', generationIntroduced: 4, kind: 'persistent', cardPolicy: 'separate-card', completionPolicy: 'per-form', assets: {}, legacy: { pokemonIds: [487], formNames: ['giratina-altered', 'giratina'], displayNames: ['Giratina', 'Giratina (Altered Forme)'] }, sourceUrls: CATALOG_SOURCES.giratina }),
  seedEntity({ speciesId: 487, formKey: 'origin', canonicalName: 'giratina-origin', displayName: 'Giratina (Origin Forme)', generationIntroduced: 4, kind: 'persistent', cardPolicy: 'separate-card', completionPolicy: 'per-form', assets: { shinyStatic: '/img/pokemon-sprites/remote/img.pokemondb.net/sprites/home/shiny/giratina-origin.png' }, legacy: { pokemonIds: [10007, 4870001], formNames: ['giratina-origin'], displayNames: ['Giratina (Origin)', 'Giratina (Origin Forme)'] }, sourceUrls: CATALOG_SOURCES.giratina }),

  seedEntity({ speciesId: 492, formKey: 'land', canonicalName: 'shaymin-land', displayName: 'Shaymin (Land Forme)', generationIntroduced: 4, kind: 'persistent', cardPolicy: 'separate-card', completionPolicy: 'per-form', assets: { shinyStatic: '/img/pokemon-sprites/remote/raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/shiny/492.png' }, legacy: { pokemonIds: [492], formNames: ['shaymin-land', 'shaymin'], displayNames: ['Shaymin', 'Shaymin (Land Forme)'] }, sourceUrls: CATALOG_SOURCES.shaymin }),
  seedEntity({ speciesId: 492, formKey: 'sky', canonicalName: 'shaymin-sky', displayName: 'Shaymin (Sky Forme)', generationIntroduced: 4, kind: 'persistent', cardPolicy: 'separate-card', completionPolicy: 'per-form', assets: {}, legacy: { pokemonIds: [10006, 4920001], formNames: ['shaymin-sky'], displayNames: ['Shaymin Sky', 'Shaymin (Sky Forme)'] }, sourceUrls: CATALOG_SOURCES.shaymin }),

  seedEntity({ speciesId: 646, formKey: 'base', canonicalName: 'kyurem', displayName: 'Kyurem', generationIntroduced: 5, kind: 'base', cardPolicy: 'species-card', completionPolicy: 'per-form', assets: {}, legacy: { pokemonIds: [646], formNames: ['kyurem'], displayNames: ['Kyurem'] }, sourceUrls: CATALOG_SOURCES.kyurem }),
  seedEntity({ speciesId: 646, formKey: 'black', canonicalName: 'kyurem-black', displayName: 'Black Kyurem', generationIntroduced: 5, kind: 'fusion', cardPolicy: 'species-card', completionPolicy: 'per-form', assets: {}, legacy: { pokemonIds: [10022, 6460001], formNames: ['kyurem-black'], displayNames: ['Kyurem Black', 'Black Kyurem'] }, sourceUrls: CATALOG_SOURCES.kyurem }),
  seedEntity({ speciesId: 646, formKey: 'white', canonicalName: 'kyurem-white', displayName: 'White Kyurem', generationIntroduced: 5, kind: 'fusion', cardPolicy: 'species-card', completionPolicy: 'per-form', assets: { shinyStatic: '/img/pokemon-sprites/remote/raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/shiny/10023.png' }, legacy: { pokemonIds: [10023, 6460002], formNames: ['kyurem-white'], displayNames: ['Kyurem White', 'White Kyurem'] }, sourceUrls: CATALOG_SOURCES.kyurem }),

  seedEntity({ speciesId: 647, formKey: 'ordinary', canonicalName: 'keldeo-ordinary', displayName: 'Keldeo (Ordinary Form)', generationIntroduced: 5, kind: 'persistent', cardPolicy: 'species-card', completionPolicy: 'per-form', assets: {}, legacy: { pokemonIds: [647], formNames: ['keldeo-ordinary', 'keldeo'], displayNames: ['Keldeo', 'Keldeo (Ordinary Form)'] }, sourceUrls: CATALOG_SOURCES.keldeo }),
  seedEntity({ speciesId: 647, formKey: 'resolute', canonicalName: 'keldeo-resolute', displayName: 'Keldeo (Resolute Form)', generationIntroduced: 5, kind: 'persistent', cardPolicy: 'species-card', completionPolicy: 'per-form', assets: { shinyStatic: '/img/pokemon-sprites/remote/raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/shiny/10024.png' }, legacy: { pokemonIds: [10024, 6470001], formNames: ['keldeo-resolute'], displayNames: ['Keldeo Resolute', 'Keldeo (Resolute Form)'] }, sourceUrls: CATALOG_SOURCES.keldeo }),

  seedEntity({ speciesId: 800, formKey: 'base', canonicalName: 'necrozma', displayName: 'Necrozma', generationIntroduced: 7, kind: 'base', cardPolicy: 'species-card', completionPolicy: 'per-form', assets: { shinyStatic: '/img/pokemon-sprites/remote/raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/shiny/800.png' }, legacy: { pokemonIds: [800], formNames: ['necrozma'], displayNames: ['Necrozma'] }, sourceUrls: CATALOG_SOURCES.necrozma }),
  seedEntity({ speciesId: 800, formKey: 'dusk-mane', canonicalName: 'necrozma-dusk', displayName: 'Dusk Mane Necrozma', generationIntroduced: 7, kind: 'fusion', cardPolicy: 'species-card', completionPolicy: 'per-form', assets: { shinyStatic: '/img/pokemon-sprites/remote/raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/shiny/10155.png' }, legacy: { pokemonIds: [10155], formNames: ['necrozma-dusk'], displayNames: ['Necrozma Dusk', 'Dusk Mane Necrozma'] }, sourceUrls: CATALOG_SOURCES.necrozma }),
  seedEntity({ speciesId: 800, formKey: 'dawn-wings', canonicalName: 'necrozma-dawn', displayName: 'Dawn Wings Necrozma', generationIntroduced: 7, kind: 'fusion', cardPolicy: 'species-card', completionPolicy: 'per-form', assets: { shinyStatic: '/img/pokemon-sprites/remote/raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/shiny/10156.png' }, legacy: { pokemonIds: [10156], formNames: ['necrozma-dawn'], displayNames: ['Necrozma Dawn', 'Dawn Wings Necrozma'] }, sourceUrls: CATALOG_SOURCES.necrozma }),
  seedEntity({ speciesId: 800, formKey: 'ultra', canonicalName: 'necrozma-ultra', displayName: 'Ultra Necrozma', generationIntroduced: 7, kind: 'battle-only', cardPolicy: 'species-card', completionPolicy: 'per-form', assets: {}, legacy: { pokemonIds: [10157], formNames: ['necrozma-ultra'], displayNames: ['Necrozma Ultra', 'Ultra Necrozma'] }, sourceUrls: CATALOG_SOURCES.necrozma }),
];
