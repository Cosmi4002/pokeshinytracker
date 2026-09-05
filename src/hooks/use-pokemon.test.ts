import { describe, expect, it } from 'vitest';
import { hasPokemonGenderDifference } from './use-pokemon';

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
