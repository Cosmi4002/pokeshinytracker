import { describe, expect, it } from 'vitest';
import {
  createPokemonEntityKey,
  normalizeFormKey,
  planLegacyPokemonBackfill,
  PokemonCatalogEntity,
  resolveLegacyPokemonIdentity,
  validatePokemonCatalog,
} from './pokemon-catalog-v2';
import { POKEMON_CATALOG_V2_SEED } from './pokemon-catalog-v2.seed';

const giratinaOrigin: PokemonCatalogEntity = {
  key: 'pokemon:487:origin',
  speciesId: 487,
  formKey: 'origin',
  canonicalName: 'giratina-origin',
  displayName: 'Giratina (Origin Forme)',
  generationIntroduced: 4,
  kind: 'persistent',
  cardPolicy: 'separate-card',
  completionPolicy: 'per-form',
  assets: {},
  legacy: {
    pokemonIds: [10007, 4870001],
    formNames: ['giratina-origin'],
  },
  verification: {
    status: 'unverified',
    sourceUrls: [],
  },
};

describe('canonical Pokemon identity', () => {
  it('creates a species-scoped key that cannot collide across species', () => {
    expect(createPokemonEntityKey(487, 'origin')).toBe('pokemon:487:origin');
    expect(createPokemonEntityKey(666, 'garden')).toBe('pokemon:666:garden');
  });

  it('normalizes accents and punctuation deterministically', () => {
    expect(normalizeFormKey('Poké Ball Pattern')).toBe('poke-ball-pattern');
  });

  it('accepts a valid migration-safe entity', () => {
    expect(validatePokemonCatalog([giratinaOrigin])).toEqual([]);
  });

  it('rejects duplicate canonical keys', () => {
    const duplicate = { ...giratinaOrigin, canonicalName: 'wrong-duplicate' };
    expect(validatePokemonCatalog([giratinaOrigin, duplicate])).toContainEqual(
      expect.stringContaining('duplicate key'),
    );
  });

  it('uses ID and form together to resolve a colliding legacy ID', () => {
    const vivillonGarden: PokemonCatalogEntity = {
      ...giratinaOrigin,
      key: 'pokemon:666:garden',
      speciesId: 666,
      formKey: 'garden',
      canonicalName: 'vivillon-garden',
      displayName: 'Vivillon (Garden Pattern)',
      kind: 'pattern',
      cardPolicy: 'species-card',
      legacy: { pokemonIds: [10007], formNames: ['vivillon-garden'] },
    };

    const result = resolveLegacyPokemonIdentity(
      [giratinaOrigin, vivillonGarden],
      { pokemonId: 10007, formName: 'giratina-origin' },
    );

    expect(result.status).toBe('resolved');
    if (result.status === 'resolved') expect(result.entity.key).toBe('pokemon:487:origin');
  });

  it('refuses to guess when an old ID identifies multiple forms', () => {
    const vivillonGarden: PokemonCatalogEntity = {
      ...giratinaOrigin,
      key: 'pokemon:666:garden',
      speciesId: 666,
      formKey: 'garden',
      canonicalName: 'vivillon-garden',
      displayName: 'Vivillon (Garden Pattern)',
      kind: 'pattern',
      cardPolicy: 'species-card',
      legacy: { pokemonIds: [10007], formNames: ['vivillon-garden'] },
    };

    expect(
      resolveLegacyPokemonIdentity([giratinaOrigin, vivillonGarden], { pokemonId: 10007 }),
    ).toMatchObject({ status: 'ambiguous' });
  });

  it('validates the source-backed seed catalog', () => {
    expect(validatePokemonCatalog(POKEMON_CATALOG_V2_SEED)).toEqual([]);
  });

  it('plans a non-destructive backfill and isolates ambiguous rows', () => {
    const vivillonGarden: PokemonCatalogEntity = {
      ...giratinaOrigin,
      key: 'pokemon:666:garden',
      speciesId: 666,
      formKey: 'garden',
      canonicalName: 'vivillon-garden',
      displayName: 'Vivillon (Garden Pattern)',
      kind: 'pattern',
      cardPolicy: 'species-card',
      legacy: { pokemonIds: [10007], formNames: ['vivillon-garden'] },
    };

    const plan = planLegacyPokemonBackfill([giratinaOrigin, vivillonGarden], [
      { rowId: 'exact', pokemonId: 10007, formName: 'giratina-origin' },
      { rowId: 'ambiguous', pokemonId: 10007 },
      { rowId: 'unknown', pokemonId: 999999 },
      { rowId: 'done', pokemonId: 10007, existingEntityKey: 'pokemon:487:origin' },
    ]);

    expect(plan.updates).toEqual([
      { rowId: 'exact', entityKey: 'pokemon:487:origin', confidence: 'exact' },
    ]);
    expect(plan.ambiguous).toHaveLength(1);
    expect(plan.unresolved).toEqual([{ rowId: 'unknown' }]);
    expect(plan.alreadyMigrated).toEqual([
      { rowId: 'done', entityKey: 'pokemon:487:origin' },
    ]);
  });
});
