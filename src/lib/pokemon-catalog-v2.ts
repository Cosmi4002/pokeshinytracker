/**
 * Canonical Pokemon identity model.
 *
 * This module deliberately does not use PokeAPI/form IDs as primary keys.
 * External and historical numeric IDs are aliases only: several of them are
 * reused by unrelated forms in the legacy flat list.
 */

export type PokemonEntityKey = `pokemon:${number}:${string}`;

export type PokemonFormKind =
  | 'base'
  | 'regional'
  | 'gender'
  | 'persistent'
  | 'pattern'
  | 'size'
  | 'fusion'
  | 'battle-only'
  | 'temporary'
  | 'cosmetic'
  | 'event'
  | 'unknown';

export type PokedexCardPolicy = 'species-card' | 'separate-card' | 'hidden';
export type CompletionPolicy = 'single' | 'per-form' | 'informational';
export type VerificationStatus = 'unverified' | 'partial' | 'verified' | 'disputed';

export interface PokemonSpriteAssets {
  normalStatic?: string;
  shinyStatic?: string;
  normalAnimated?: string;
  shinyAnimated?: string;
  femaleNormal?: string;
  femaleShiny?: string;
}

export interface LegacyPokemonIdentity {
  /** Every old numeric ID known to have represented this entity. */
  pokemonIds: number[];
  /** Exact historical values stored in caught_shinies.form. */
  formNames: string[];
  /** Exact historical values stored in caught_shinies.pokemon_name. */
  displayNames?: string[];
}

export interface PokemonCatalogEntity {
  key: PokemonEntityKey;
  speciesId: number;
  formKey: string;
  canonicalName: string;
  displayName: string;
  generationIntroduced: number;
  kind: PokemonFormKind;
  cardPolicy: PokedexCardPolicy;
  completionPolicy: CompletionPolicy;
  assets: PokemonSpriteAssets;
  legacy: LegacyPokemonIdentity;
  verification: {
    status: VerificationStatus;
    sourceUrls: string[];
    lastVerifiedAt?: string;
    notes?: string;
  };
}

export interface PokemonCatalogEntityOverride {
  speciesId: number;
  canonicalName: string;
  formKey?: string;
  displayName?: string;
  generationIntroduced?: number;
  kind?: PokemonFormKind;
  cardPolicy?: PokedexCardPolicy;
  completionPolicy?: CompletionPolicy;
  assets?: PokemonSpriteAssets;
  legacy?: Partial<LegacyPokemonIdentity>;
  verification?: PokemonCatalogEntity['verification'];
}

export interface LegacyCaughtPokemonIdentity {
  pokemonId: number;
  formName?: string | null;
  pokemonName?: string | null;
}

export type LegacyIdentityResolution =
  | { status: 'resolved'; confidence: 'exact' | 'unique-id' | 'unique-form' | 'unique-name'; entity: PokemonCatalogEntity }
  | { status: 'ambiguous'; candidates: PokemonCatalogEntity[] }
  | { status: 'unresolved'; candidates: [] };

export interface LegacyCaughtPokemonRow extends LegacyCaughtPokemonIdentity {
  rowId: string;
  existingEntityKey?: string | null;
}

export interface LegacyBackfillPlan {
  updates: Array<{ rowId: string; entityKey: PokemonEntityKey; confidence: 'exact' | 'unique-id' | 'unique-form' | 'unique-name' }>;
  alreadyMigrated: Array<{ rowId: string; entityKey: string }>;
  ambiguous: Array<{ rowId: string; candidateKeys: PokemonEntityKey[] }>;
  unresolved: Array<{ rowId: string }>;
}

const SAFE_FORM_KEY = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function normalizeFormKey(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function createPokemonEntityKey(speciesId: number, formKey: string): PokemonEntityKey {
  if (!Number.isInteger(speciesId) || speciesId < 1) {
    throw new Error(`Invalid species ID: ${speciesId}`);
  }

  const normalizedFormKey = normalizeFormKey(formKey);
  if (!normalizedFormKey || !SAFE_FORM_KEY.test(normalizedFormKey)) {
    throw new Error(`Invalid form key: ${formKey}`);
  }

  return `pokemon:${speciesId}:${normalizedFormKey}`;
}

export function validatePokemonCatalog(entities: PokemonCatalogEntity[]): string[] {
  const errors: string[] = [];
  const keys = new Map<PokemonEntityKey, string>();

  entities.forEach((entity, index) => {
    const location = `catalog[${index}] (${entity.canonicalName})`;
    const expectedKey = createPokemonEntityKey(entity.speciesId, entity.formKey);

    if (entity.key !== expectedKey) {
      errors.push(`${location}: key must be ${expectedKey}, received ${entity.key}`);
    }
    if (keys.has(entity.key)) {
      errors.push(`${location}: duplicate key also used by ${keys.get(entity.key)}`);
    } else {
      keys.set(entity.key, location);
    }
    if (!entity.canonicalName.trim()) errors.push(`${location}: canonicalName is required`);
    if (!entity.displayName.trim()) errors.push(`${location}: displayName is required`);
    if (!Number.isInteger(entity.generationIntroduced) || entity.generationIntroduced < 1) {
      errors.push(`${location}: generationIntroduced must be a positive integer`);
    }
    if (!entity.legacy.pokemonIds.length && !entity.legacy.formNames.length) {
      errors.push(`${location}: at least one legacy identity is required during migration`);
    }
    if (entity.verification.status === 'verified' && entity.verification.sourceUrls.length === 0) {
      errors.push(`${location}: verified entities require at least one source`);
    }
  });

  return errors;
}

function normalizedLegacyValue(value?: string | null): string {
  return value?.trim().toLowerCase() || '';
}

function uniqueCandidates(entities: PokemonCatalogEntity[]): PokemonCatalogEntity[] {
  return [...new Map(entities.map((entity) => [entity.key, entity])).values()];
}

/**
 * Resolves an existing caught_shinies row without guessing across collisions.
 * A form/name match is preferred over a numeric ID because legacy form IDs were
 * reused by unrelated species. Ambiguous rows are preserved for manual review.
 */
export function resolveLegacyPokemonIdentity(
  catalog: PokemonCatalogEntity[],
  legacy: LegacyCaughtPokemonIdentity,
): LegacyIdentityResolution {
  const formName = normalizedLegacyValue(legacy.formName);
  const pokemonName = normalizedLegacyValue(legacy.pokemonName);
  const idCandidates = uniqueCandidates(
    catalog.filter((entity) => entity.legacy.pokemonIds.includes(legacy.pokemonId)),
  );

  if (formName) {
    const exact = idCandidates.filter((entity) =>
      entity.legacy.formNames.some((name) => normalizedLegacyValue(name) === formName),
    );
    if (exact.length === 1) return { status: 'resolved', confidence: 'exact', entity: exact[0] };
    if (exact.length > 1) return { status: 'ambiguous', candidates: exact };

    const formCandidates = uniqueCandidates(
      catalog.filter((entity) =>
        entity.legacy.formNames.some((name) => normalizedLegacyValue(name) === formName),
      ),
    );
    if (formCandidates.length === 1) {
      return { status: 'resolved', confidence: 'unique-form', entity: formCandidates[0] };
    }
    if (formCandidates.length > 1) return { status: 'ambiguous', candidates: formCandidates };
  }

  if (idCandidates.length === 1) {
    return { status: 'resolved', confidence: 'unique-id', entity: idCandidates[0] };
  }

  if (pokemonName) {
    const nameCandidates = uniqueCandidates(
      catalog.filter((entity) =>
        entity.legacy.displayNames?.some((name) => normalizedLegacyValue(name) === pokemonName),
      ),
    );
    if (nameCandidates.length === 1) {
      return { status: 'resolved', confidence: 'unique-name', entity: nameCandidates[0] };
    }
    if (nameCandidates.length > 1) return { status: 'ambiguous', candidates: nameCandidates };
  }

  if (idCandidates.length > 1) return { status: 'ambiguous', candidates: idCandidates };
  return { status: 'unresolved', candidates: [] };
}

/** Builds a read-only migration plan. It never mutates rows or the catalogue. */
export function planLegacyPokemonBackfill(
  catalog: PokemonCatalogEntity[],
  rows: LegacyCaughtPokemonRow[],
): LegacyBackfillPlan {
  const plan: LegacyBackfillPlan = {
    updates: [],
    alreadyMigrated: [],
    ambiguous: [],
    unresolved: [],
  };

  rows.forEach((row) => {
    if (row.existingEntityKey) {
      plan.alreadyMigrated.push({ rowId: row.rowId, entityKey: row.existingEntityKey });
      return;
    }

    const resolution = resolveLegacyPokemonIdentity(catalog, row);
    if (resolution.status === 'resolved') {
      plan.updates.push({
        rowId: row.rowId,
        entityKey: resolution.entity.key,
        confidence: resolution.confidence,
      });
    } else if (resolution.status === 'ambiguous') {
      plan.ambiguous.push({
        rowId: row.rowId,
        candidateKeys: resolution.candidates.map((candidate) => candidate.key),
      });
    } else {
      plan.unresolved.push({ rowId: row.rowId });
    }
  });

  return plan;
}
