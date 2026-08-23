import { describe, expect, it } from 'vitest';
import { classifyPokemonForm } from './pokemon-form-classification-v2';

describe('classifyPokemonForm', () => {
  it('keeps regional forms as separate cards', () => {
    expect(classifyPokemonForm(19, 'rattata-alola', 'rattata-alola')).toEqual({
      kind: 'regional', cardPolicy: 'separate-card', completionPolicy: 'single',
    });
  });

  it('applies explicit single-card policies without losing per-form completion', () => {
    expect(classifyPokemonForm(646, 'kyurem-black', 'kyurem-black')).toEqual({
      kind: 'fusion', cardPolicy: 'species-card', completionPolicy: 'per-form',
    });
  });

  it('hides transformations that are not separate shiny catches', () => {
    expect(classifyPokemonForm(648, 'meloetta-pirouette', 'meloetta-pirouette')).toEqual({
      kind: 'battle-only', cardPolicy: 'hidden', completionPolicy: 'informational',
    });
  });

  it('classifies uncatalogued non-base variants conservatively as events', () => {
    expect(classifyPokemonForm(25, 'pikachu-partner-cap', 'pikachu-partner-cap')).toEqual({
      kind: 'event', cardPolicy: 'separate-card', completionPolicy: 'single',
    });
  });
});
