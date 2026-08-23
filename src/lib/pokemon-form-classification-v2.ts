import type { PokemonCatalogEntity, PokemonFormKind } from './pokemon-catalog-v2';
import { POKEMON_SPECIES_FORM_POLICY_BY_ID } from './pokemon-form-policies-v2';

/** Cross-check indexes; individual verified records may add more specific pages. */
export const FORM_CLASSIFICATION_REFERENCE_URLS = [
  'https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_with_form_differences',
  'https://www.serebii.net/pokemon/forms.shtml',
] as const;

const REGIONAL_FORM = /-(alola|galar|hisui|paldea)(?:-|$)/;
const INFORMATIONAL_BATTLE_FORMS = new Set([
  'meloetta-pirouette',
  'darmanitan-zen',
  'darmanitan-galar-zen',
  'terapagos-terastal',
  'terapagos-stellar',
]);
const INFORMATIONAL_ITEM_FORMS = new Set([
  'genesect-burn-drive',
  'genesect-chill-drive',
  'genesect-douse-drive',
  'genesect-shock-drive',
]);

export interface ClassifiedFormDefaults {
  kind: PokemonFormKind;
  cardPolicy: PokemonCatalogEntity['cardPolicy'];
  completionPolicy: PokemonCatalogEntity['completionPolicy'];
}

/**
 * Product classification only. Encounter availability and shiny mechanics live
 * in the future hunt-method dataset and must never be inferred from this rule.
 */
export function classifyPokemonForm(
  speciesId: number,
  canonicalName: string,
  formKey: string,
): ClassifiedFormDefaults {
  if (INFORMATIONAL_BATTLE_FORMS.has(canonicalName)) {
    return { kind: 'battle-only', cardPolicy: 'hidden', completionPolicy: 'informational' };
  }
  if (INFORMATIONAL_ITEM_FORMS.has(canonicalName)) {
    return { kind: 'temporary', cardPolicy: 'hidden', completionPolicy: 'informational' };
  }

  const policy = POKEMON_SPECIES_FORM_POLICY_BY_ID.get(speciesId);
  if (policy) {
    return {
      kind: policy.defaultKind,
      cardPolicy: policy.cardMode === 'single-card' ? 'species-card' : 'separate-card',
      completionPolicy: policy.completionPolicy,
    };
  }

  if (REGIONAL_FORM.test(canonicalName)) {
    return { kind: 'regional', cardPolicy: 'separate-card', completionPolicy: 'single' };
  }

  return {
    kind: formKey === 'base' ? 'base' : 'event',
    cardPolicy: formKey === 'base' ? 'species-card' : 'separate-card',
    completionPolicy: 'single',
  };
}
