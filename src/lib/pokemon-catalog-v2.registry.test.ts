import { describe, expect, it } from 'vitest';
import {
  POKEMON_CATALOG_V2,
  POKEMON_CATALOG_V2_BY_KEY,
  POKEMON_CATALOG_V2_ERRORS,
} from './pokemon-catalog-v2.registry';

describe('complete Pokemon catalog v2 registry', () => {
  it('contains every legacy entity plus missing official Gen 5 forms', () => {
    expect(POKEMON_CATALOG_V2).toHaveLength(1337);
  });

  it('has no schema or identity validation errors', () => {
    expect(POKEMON_CATALOG_V2_ERRORS).toEqual([]);
  });

  it('classifies transient forms without treating them as separate catches', () => {
    expect(POKEMON_CATALOG_V2_BY_KEY.get('pokemon:648:pirouette')).toMatchObject({
      kind: 'battle-only',
      completionPolicy: 'informational',
    });
    expect(POKEMON_CATALOG_V2_BY_KEY.get('pokemon:555:zen')).toMatchObject({
      kind: 'battle-only',
      completionPolicy: 'informational',
    });
  });
});
