import { createPokemonEntityKey } from './pokemon-catalog-v2';
import type { PokemonCatalogEntity } from './pokemon-catalog-v2';

const CASTFORM_SOURCES = [
  'https://bulbapedia.bulbagarden.net/wiki/Castform_(Pok%C3%A9mon)',
  'https://www.serebii.net/pokemon/castform/',
];

function castformWeatherForm(
  formKey: string,
  canonicalName: string,
  displayName: string,
  shinyStatic: string,
): PokemonCatalogEntity {
  return {
    key: createPokemonEntityKey(351, formKey),
    speciesId: 351,
    formKey,
    canonicalName,
    displayName,
    generationIntroduced: 3,
    kind: 'battle-only',
    cardPolicy: 'hidden',
    completionPolicy: 'informational',
    assets: { shinyStatic },
    legacy: { pokemonIds: [351], formNames: [canonicalName] },
    verification: {
      status: 'verified',
      sourceUrls: CASTFORM_SOURCES,
      lastVerifiedAt: '2026-08-21',
      notes: 'Weather transformation of the same Castform; retained for display but never counted as another shiny catch.',
    },
  };
}

export const ADDITIONAL_INFORMATIONAL_FORMS: PokemonCatalogEntity[] = [
  castformWeatherForm('sunny', 'castform-sunny', 'Castform (Sunny Form)', '/img/pokemon-sprites/remote/www.pokepedia.fr/images/8/88/Sprite_0351_Solaire_chromatique_HOME-v1.png'),
  castformWeatherForm('rainy', 'castform-rainy', 'Castform (Rainy Form)', '/img/pokemon-sprites/remote/www.pokepedia.fr/images/1/1a/Sprite_0351_Eau_de_Pluie_chromatique_HOME-v1.png'),
  castformWeatherForm('snowy', 'castform-snowy', 'Castform (Snowy Form)', '/img/pokemon-sprites/remote/www.pokepedia.fr/images/d/d7/Sprite_0351_Blizzard_chromatique_HOME-v1.png'),
  {
    key: createPokemonEntityKey(666, 'poke-ball-pattern'),
    speciesId: 666,
    formKey: 'poke-ball-pattern',
    canonicalName: 'vivillon-poke-ball',
    displayName: 'Vivillon (Poké Ball Pattern)',
    generationIntroduced: 6,
    kind: 'event',
    cardPolicy: 'species-card',
    completionPolicy: 'informational',
    assets: {},
    legacy: { pokemonIds: [666], formNames: ['vivillon-poke-ball', 'vivillon-pokeball'] },
    verification: {
      status: 'verified',
      sourceUrls: [
        'https://bulbapedia.bulbagarden.net/wiki/Vivillon_(Pok%C3%A9mon)',
        'https://www.serebii.net/pokemon/vivillon',
        'https://www.serebii.net/games/shiny.shtml',
      ],
      lastVerifiedAt: '2026-08-21',
      notes: 'Twentieth official pattern. Distributed only non-Shiny; retained as informational and excluded from shiny completion.',
    },
  },
];
