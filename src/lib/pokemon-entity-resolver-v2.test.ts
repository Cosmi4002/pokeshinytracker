import { describe, expect, it } from 'vitest';
import { resolvePokemonEntityKey, resolvePokemonSpriteIdentity } from './pokemon-entity-resolver-v2';

describe('Pokémon entity resolver', () => {
  it('keeps legacy regional display labels distinct from their base forms', () => {
    const input = { pokemonId: 78, pokemonName: 'Galarian Rapidash', form: null };

    expect(resolvePokemonEntityKey(input)).toBe('pokemon:78:rapidash-galar');
    expect(resolvePokemonSpriteIdentity(input)).toEqual({
      pokemonId: 78,
      name: 'rapidash-galar',
      form: 'rapidash-galar',
    });
  });

  it('uses entity_key as the authoritative identity for saved regional forms', () => {
    expect(resolvePokemonSpriteIdentity({
      pokemonId: 78,
      pokemonName: 'Rapidash',
      entityKey: 'pokemon:78:rapidash-galar',
    })).toMatchObject({ name: 'rapidash-galar', form: 'rapidash-galar' });
  });
});
