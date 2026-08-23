import { describe, expect, it } from 'vitest';
import {
  POKEMON_SPECIES_FORM_POLICY_BY_ID,
  validatePokemonSpeciesFormPolicies,
} from './pokemon-form-policies-v2';

describe('Pokemon form policies v2', () => {
  it('contains no duplicate or malformed species policies', () => {
    expect(validatePokemonSpeciesFormPolicies()).toEqual([]);
  });

  it.each([646, 647, 800])('keeps species %i on one card with per-form tracking', (speciesId) => {
    expect(POKEMON_SPECIES_FORM_POLICY_BY_ID.get(speciesId)).toMatchObject({
      cardMode: 'single-card',
      completionPolicy: 'per-form',
    });
  });

  it('keeps Giratina formes on separate cards', () => {
    expect(POKEMON_SPECIES_FORM_POLICY_BY_ID.get(487)).toMatchObject({
      cardMode: 'per-form-card',
      expectedTrackedForms: 2,
    });
  });
});

