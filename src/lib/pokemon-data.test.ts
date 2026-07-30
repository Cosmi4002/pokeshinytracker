import { describe, expect, it } from 'vitest';
import { getPokemonSpriteFallbackUrl, getPokemonSpriteUrl } from './pokemon-data';

describe('pokemon sprite helpers', () => {
  it('returns a stable fallback asset for missing sprite images', () => {
    expect(getPokemonSpriteFallbackUrl()).toBe('/placeholder.svg');
  });

  it('builds the expected HOME sprite URL for a base shiny Pokémon', () => {
    expect(getPokemonSpriteUrl(25, { shiny: true })).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/shiny/25.png'
    );
  });
});
