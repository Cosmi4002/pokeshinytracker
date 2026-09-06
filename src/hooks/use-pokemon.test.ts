import { describe, expect, it } from 'vitest';
import { formatPokemonName, hasPokemonGenderDifference } from './use-pokemon';

describe('hasPokemonGenderDifference', () => {
  it.each([
    [19, 'rattata-alola'],
    [20, 'raticate-alola'],
    [26, 'raichu-alola'],
    [194, 'wooper-paldea'],
    [215, 'sneasel-hisui'],
    [25, 'pikachu-partner-cap'],
  ])('does not inherit the base species gender sprite for %s %s', (baseId, formName) => {
    expect(hasPokemonGenderDifference(baseId, formName)).toBe(false);
  });

  it('keeps the gender selector for a base form that has a visible difference', () => {
    expect(hasPokemonGenderDifference(25, 'pikachu')).toBe(true);
  });
});

describe('formatPokemonName', () => {
  it.each([
    ['arceus-fighting', 10047, 493, 'Arceus (Fighting-type)'],
    ['toxtricity-amped', 849, 849, 'Toxtricity (Amped Form)'],
    ['toxtricity-low-key', 10184, 849, 'Toxtricity (Low Key Form)'],
    ['tatsugiri-stretchy', 978, 978, 'Tatsugiri (Stretchy Form)'],
    ['maushold-family-of-three', 10255, 925, 'Maushold (Family of Three)'],
  ])('uses the official English display name for %s', (name, id, baseId, expected) => {
    expect(formatPokemonName(name, id, baseId)).toBe(expected);
  });
});
