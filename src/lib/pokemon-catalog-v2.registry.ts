import generatedIdentities from './pokemon-catalog-v2.generated.json';
import { ADDITIONAL_INFORMATIONAL_FORMS } from './pokemon-catalog-v2.additional';
import { GEN5_ADDITIONAL_ENTITIES, GEN5_CATALOG_OVERRIDES } from './pokemon-catalog-v2.gen5';
import { POKEMON_CATALOG_V2_SEED } from './pokemon-catalog-v2.seed';
import { classifyPokemonForm } from './pokemon-form-classification-v2';
import {
  createPokemonEntityKey,
  validatePokemonCatalog,
} from './pokemon-catalog-v2';
import type { PokemonCatalogEntity, PokemonCatalogEntityOverride, VerificationStatus } from './pokemon-catalog-v2';

type GeneratedIdentity = (typeof generatedIdentities)[number];

const identityKey = (speciesId: number, canonicalName: string) => `${speciesId}:${canonicalName}`;

function normalizeVerification(
  verification?: {
    status?: string | VerificationStatus | null;
    sourceUrls?: unknown;
    lastVerifiedAt?: string | null;
    notes?: string | null;
  } | null,
): PokemonCatalogEntity['verification'] {
  const statusValue = verification?.status ?? 'unverified';
  const status: VerificationStatus =
    statusValue === 'verified' || statusValue === 'partial' || statusValue === 'disputed'
      ? statusValue
      : 'unverified';

  const sourceUrls = Array.isArray(verification?.sourceUrls)
    ? verification.sourceUrls.filter((value): value is string => typeof value === 'string')
    : [];

  return {
    status,
    sourceUrls,
    lastVerifiedAt: verification?.lastVerifiedAt ?? undefined,
    notes: verification?.notes ?? undefined,
  };
}

function defaultEntity(identity: GeneratedIdentity): PokemonCatalogEntity {
  const classification = classifyPokemonForm(identity.speciesId, identity.canonicalName, identity.formKey);
  return {
    key: createPokemonEntityKey(identity.speciesId, identity.formKey),
    speciesId: identity.speciesId,
    formKey: identity.formKey,
    canonicalName: identity.canonicalName,
    displayName: identity.canonicalName,
    generationIntroduced: identity.generationIntroduced,
    kind: classification.kind,
    cardPolicy: classification.cardPolicy,
    completionPolicy: classification.completionPolicy,
    assets: {},
    legacy: identity.legacy,
    verification: normalizeVerification(identity.verification),
  };
}

function applyOverride(entity: PokemonCatalogEntity, override: PokemonCatalogEntityOverride): PokemonCatalogEntity {
  const formKey = override.formKey || entity.formKey;
  return {
    ...entity,
    ...override,
    key: createPokemonEntityKey(entity.speciesId, formKey),
    formKey,
    assets: { ...entity.assets, ...override.assets },
    legacy: {
      pokemonIds: override.legacy?.pokemonIds || entity.legacy.pokemonIds,
      formNames: override.legacy?.formNames || entity.legacy.formNames,
      displayNames: override.legacy?.displayNames || entity.legacy.displayNames,
    },
    verification: normalizeVerification(override.verification || entity.verification),
  };
}

const sourceBackedByIdentity = new Map(
  POKEMON_CATALOG_V2_SEED.map((entity) => [identityKey(entity.speciesId, entity.canonicalName), entity]),
);
const sourceBackedByLegacyId = new Map<number, PokemonCatalogEntity | null>();
POKEMON_CATALOG_V2_SEED.forEach((entity) => {
  entity.legacy.pokemonIds.forEach((id) => {
    const existing = sourceBackedByLegacyId.get(id);
    sourceBackedByLegacyId.set(id, existing && existing.key !== entity.key ? null : entity);
  });
});
const overridesByIdentity = new Map(
  GEN5_CATALOG_OVERRIDES.map((override) => [identityKey(override.speciesId, override.canonicalName), override]),
);

const catalog = (generatedIdentities as GeneratedIdentity[]).map((identity) => {
  const key = identityKey(identity.speciesId, identity.canonicalName);
  const legacyIdMatch = identity.legacy.pokemonIds
    .map((id) => sourceBackedByLegacyId.get(id))
    .find((candidate): candidate is PokemonCatalogEntity => Boolean(candidate) && candidate.speciesId === identity.speciesId);
  let entity = sourceBackedByIdentity.get(key) || legacyIdMatch || defaultEntity(identity);
  const override = overridesByIdentity.get(key);
  if (override) entity = applyOverride(entity, override);
  return entity;
});

catalog.push(...GEN5_ADDITIONAL_ENTITIES, ...ADDITIONAL_INFORMATIONAL_FORMS);

export const POKEMON_CATALOG_V2: PokemonCatalogEntity[] = catalog.sort(
  (a, b) => a.speciesId - b.speciesId || a.formKey.localeCompare(b.formKey),
);

export const POKEMON_CATALOG_V2_ERRORS = validatePokemonCatalog(POKEMON_CATALOG_V2);

export const POKEMON_CATALOG_V2_BY_KEY = new Map(
  POKEMON_CATALOG_V2.map((entity) => [entity.key, entity]),
);
