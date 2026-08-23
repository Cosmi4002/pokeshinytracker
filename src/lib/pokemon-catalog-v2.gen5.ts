import {
  createPokemonEntityKey,
} from './pokemon-catalog-v2';
import type { PokemonCatalogEntity, PokemonCatalogEntityOverride } from './pokemon-catalog-v2';

const sources = (slug: string, serebiiSlug = slug.toLowerCase()) => ({
  status: 'verified' as const,
  sourceUrls: [
    `https://bulbapedia.bulbagarden.net/wiki/${slug}_(Pok%C3%A9mon)`,
    `https://www.serebii.net/pokemon/${serebiiSlug}/`,
  ],
  lastVerifiedAt: '2026-08-21',
  notes: 'Form identity and tracker classification cross-checked with Bulbapedia and Serebii; game-by-game shiny availability remains a separate dataset.',
});

export const GEN5_CATALOG_OVERRIDES: PokemonCatalogEntityOverride[] = [
  { speciesId: 555, canonicalName: 'darmanitan', formKey: 'standard', displayName: 'Darmanitan (Standard Mode)', kind: 'base', cardPolicy: 'species-card', completionPolicy: 'single', verification: sources('Darmanitan') },
  { speciesId: 555, canonicalName: 'darmanitan-galar', formKey: 'galar-standard', displayName: 'Galarian Darmanitan (Standard Mode)', generationIntroduced: 8, kind: 'regional', cardPolicy: 'separate-card', completionPolicy: 'single', verification: sources('Darmanitan') },
  { speciesId: 550, canonicalName: 'basculin-red-striped', formKey: 'red-striped', displayName: 'Basculin (Red-Striped Form)', kind: 'persistent', cardPolicy: 'separate-card', completionPolicy: 'per-form', verification: sources('Basculin') },
  { speciesId: 550, canonicalName: 'basculin-blue-striped', formKey: 'blue-striped', displayName: 'Basculin (Blue-Striped Form)', kind: 'persistent', cardPolicy: 'separate-card', completionPolicy: 'per-form', verification: sources('Basculin') },
  { speciesId: 550, canonicalName: 'basculin-white-striped', formKey: 'white-striped', displayName: 'Basculin (White-Striped Form)', generationIntroduced: 8, kind: 'regional', cardPolicy: 'separate-card', completionPolicy: 'per-form', verification: sources('Basculin') },

  { speciesId: 585, canonicalName: 'deerling (spring)', formKey: 'spring', displayName: 'Deerling (Spring Form)', kind: 'persistent', cardPolicy: 'separate-card', completionPolicy: 'per-form', verification: sources('Deerling') },
  { speciesId: 585, canonicalName: 'deerling-summer', formKey: 'summer', displayName: 'Deerling (Summer Form)', kind: 'persistent', cardPolicy: 'separate-card', completionPolicy: 'per-form', verification: sources('Deerling') },
  { speciesId: 585, canonicalName: 'deerling-autumn', formKey: 'autumn', displayName: 'Deerling (Autumn Form)', kind: 'persistent', cardPolicy: 'separate-card', completionPolicy: 'per-form', verification: sources('Deerling') },
  { speciesId: 585, canonicalName: 'deerling-winter', formKey: 'winter', displayName: 'Deerling (Winter Form)', kind: 'persistent', cardPolicy: 'separate-card', completionPolicy: 'per-form', verification: sources('Deerling') },

  { speciesId: 586, canonicalName: 'sawsbuck (spring)', formKey: 'spring', displayName: 'Sawsbuck (Spring Form)', kind: 'persistent', cardPolicy: 'separate-card', completionPolicy: 'per-form', verification: sources('Sawsbuck') },
  { speciesId: 586, canonicalName: 'sawsbuck-summer', formKey: 'summer', displayName: 'Sawsbuck (Summer Form)', kind: 'persistent', cardPolicy: 'separate-card', completionPolicy: 'per-form', verification: sources('Sawsbuck') },
  { speciesId: 586, canonicalName: 'sawsbuck-autumn', formKey: 'autumn', displayName: 'Sawsbuck (Autumn Form)', kind: 'persistent', cardPolicy: 'separate-card', completionPolicy: 'per-form', verification: sources('Sawsbuck') },
  { speciesId: 586, canonicalName: 'sawsbuck-winter', formKey: 'winter', displayName: 'Sawsbuck (Winter Form)', kind: 'persistent', cardPolicy: 'separate-card', completionPolicy: 'per-form', verification: sources('Sawsbuck') },

  ...([641, 642, 645] as const).flatMap((speciesId) => {
    const name = speciesId === 641 ? 'tornadus' : speciesId === 642 ? 'thundurus' : 'landorus';
    const label = name[0].toUpperCase() + name.slice(1);
    return [
      { speciesId, canonicalName: `${name}-incarnate`, formKey: 'incarnate', displayName: `${label} (Incarnate Forme)`, kind: 'persistent' as const, cardPolicy: 'separate-card' as const, completionPolicy: 'per-form' as const, verification: sources(label) },
      { speciesId, canonicalName: `${name}-therian`, formKey: 'therian', displayName: `${label} (Therian Forme)`, kind: 'persistent' as const, cardPolicy: 'separate-card' as const, completionPolicy: 'per-form' as const, verification: sources(label) },
    ];
  }),

  { speciesId: 648, canonicalName: 'meloetta-aria', formKey: 'aria', displayName: 'Meloetta (Aria Forme)', kind: 'base', cardPolicy: 'species-card', completionPolicy: 'single', verification: sources('Meloetta') },
  { speciesId: 648, canonicalName: 'meloetta-pirouette', formKey: 'pirouette', displayName: 'Meloetta (Pirouette Forme)', kind: 'battle-only', cardPolicy: 'species-card', completionPolicy: 'informational', verification: sources('Meloetta') },
  { speciesId: 649, canonicalName: 'genesect', formKey: 'no-drive', displayName: 'Genesect (No Drive)', kind: 'base', cardPolicy: 'species-card', completionPolicy: 'single', verification: sources('Genesect') },
];

function additionalEntity(params: {
  speciesId: number;
  formKey: string;
  canonicalName: string;
  displayName: string;
  generationIntroduced: number;
  kind: PokemonCatalogEntity['kind'];
  sourceSlug: string;
}): PokemonCatalogEntity {
  return {
    key: createPokemonEntityKey(params.speciesId, params.formKey),
    speciesId: params.speciesId,
    formKey: params.formKey,
    canonicalName: params.canonicalName,
    displayName: params.displayName,
    generationIntroduced: params.generationIntroduced,
    kind: params.kind,
    cardPolicy: 'species-card',
    completionPolicy: 'informational',
    assets: {},
    legacy: { pokemonIds: [params.speciesId], formNames: [params.canonicalName] },
    verification: sources(params.sourceSlug),
  };
}

/** Official forms missing from the legacy flat catalogue. */
export const GEN5_ADDITIONAL_ENTITIES: PokemonCatalogEntity[] = [
  additionalEntity({ speciesId: 555, formKey: 'zen', canonicalName: 'darmanitan-zen', displayName: 'Darmanitan (Zen Mode)', generationIntroduced: 5, kind: 'battle-only', sourceSlug: 'Darmanitan' }),
  additionalEntity({ speciesId: 555, formKey: 'galar-zen', canonicalName: 'darmanitan-galar-zen', displayName: 'Galarian Darmanitan (Zen Mode)', generationIntroduced: 8, kind: 'battle-only', sourceSlug: 'Darmanitan' }),
  additionalEntity({ speciesId: 649, formKey: 'shock-drive', canonicalName: 'genesect-shock-drive', displayName: 'Genesect (Shock Drive)', generationIntroduced: 5, kind: 'temporary', sourceSlug: 'Genesect' }),
  additionalEntity({ speciesId: 649, formKey: 'burn-drive', canonicalName: 'genesect-burn-drive', displayName: 'Genesect (Burn Drive)', generationIntroduced: 5, kind: 'temporary', sourceSlug: 'Genesect' }),
  additionalEntity({ speciesId: 649, formKey: 'chill-drive', canonicalName: 'genesect-chill-drive', displayName: 'Genesect (Chill Drive)', generationIntroduced: 5, kind: 'temporary', sourceSlug: 'Genesect' }),
  additionalEntity({ speciesId: 649, formKey: 'douse-drive', canonicalName: 'genesect-douse-drive', displayName: 'Genesect (Douse Drive)', generationIntroduced: 5, kind: 'temporary', sourceSlug: 'Genesect' }),
];
