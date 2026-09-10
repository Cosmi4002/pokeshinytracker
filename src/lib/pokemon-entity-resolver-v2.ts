import type { PokemonBasic } from '@/hooks/use-pokemon';
import type { PokemonEntityKey } from './pokemon-catalog-v2';
import { POKEMON_CATALOG_V2_BY_KEY } from './pokemon-catalog-v2.registry';
import legacyMap from './pokemon-legacy-map-v2.generated.json';
import { resolveLegacyMapValue, type PokemonLegacyMapV2 } from './pokemon-legacy-migration-v2';

export interface LegacyPokemonEntityInput {
  pokemonId?: number | null;
  pokemonName?: string | null;
  form?: string | null;
  entityKey?: string | null;
}

const normalize = (value?: string | null) =>
  (value || '')
    .toString()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[()]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const isKnownEntityKey = (key?: string | null): key is PokemonEntityKey =>
  Boolean(key && POKEMON_CATALOG_V2_BY_KEY.has(key as PokemonEntityKey));

// Older collection rows can contain localized display labels such as
// "Galarian Rapidash" instead of the canonical `rapidash-galar` slug. Keep
// regional variants distinct from their base species while resolving those
// rows, even when they predate entity_key.
const canonicalizeRegionalFormName = (value?: string | null) => {
  const normalized = normalize(value);
  const match = normalized.match(/^(alolan|galarian|hisuian|paldean)-(.+)$/);
  if (!match) return normalized;

  const region = {
    alolan: 'alola',
    galarian: 'galar',
    hisuian: 'hisui',
    paldean: 'paldea',
  }[match[1]];
  return region ? `${match[2]}-${region}` : normalized;
};

export function resolvePokemonEntityKey(input: LegacyPokemonEntityInput): PokemonEntityKey | null {
  if (isKnownEntityKey(input.entityKey)) return input.entityKey;

  const resolution = resolveLegacyMapValue(legacyMap as unknown as PokemonLegacyMapV2, {
    pokemonId: input.pokemonId,
    pokemonName: canonicalizeRegionalFormName(input.pokemonName),
    form: canonicalizeRegionalFormName(input.form),
  });
  return resolution.status === 'resolved' ? resolution.entityKey : null;
}

export function resolvePokemonEntity(input: LegacyPokemonEntityInput) {
  const key = resolvePokemonEntityKey(input);
  return key ? POKEMON_CATALOG_V2_BY_KEY.get(key) || null : null;
}

/**
 * Returns the canonical identity to use for sprites and UI state. Database
 * rows may use a base National Dex ID for a regional form, so the entity's
 * canonical name is more reliable than the stored display label alone.
 */
export function resolvePokemonSpriteIdentity(input: LegacyPokemonEntityInput) {
  const entity = resolvePokemonEntity(input);
  return {
    pokemonId: entity?.speciesId ?? input.pokemonId ?? 0,
    name: entity?.canonicalName ?? input.form ?? input.pokemonName ?? undefined,
    form: entity?.canonicalName ?? input.form ?? undefined,
  };
}

export function resolvePokemonBasicByEntity(
  pokemon: PokemonBasic[],
  input: LegacyPokemonEntityInput,
): PokemonBasic | null {
  const entity = resolvePokemonEntity(input);
  if (!entity) return null;

  const legacyIds = new Set(entity.legacy.pokemonIds);
  const legacyForms = new Set(entity.legacy.formNames.map(normalize));
  const legacyNames = new Set([
    entity.canonicalName,
    entity.displayName,
    ...(entity.legacy.displayNames || []),
  ].map(normalize));

  return (
    pokemon.find((item) => item.baseId === entity.speciesId && legacyForms.has(normalize(item.name))) ||
    pokemon.find((item) => legacyIds.has(item.id) && legacyForms.has(normalize(item.name))) ||
    pokemon.find((item) => item.baseId === entity.speciesId && legacyNames.has(normalize(item.displayName))) ||
    pokemon.find((item) => item.id === entity.speciesId && entity.formKey === 'base') ||
    pokemon.find((item) => item.baseId === entity.speciesId && item.name === entity.canonicalName) ||
    null
  );
}

export function resolveEntityKeyForSelectedPokemon(input: {
  pokemonId?: number | null;
  pokemonName?: string | null;
  form?: string | null;
}): PokemonEntityKey | null {
  return resolvePokemonEntityKey({
    pokemonId: input.pokemonId,
    pokemonName: input.pokemonName,
    form: input.form || input.pokemonName,
  });
}

export function resolveEntityKeysForCounterSlots(slots: Array<{
  id?: number | null;
  name?: string | null;
  form?: string | null;
}>): PokemonEntityKey[] {
  const filledSlots = slots.filter((slot) => Number.isInteger(slot.id));
  const keys = filledSlots.map((slot) => resolveEntityKeyForSelectedPokemon({
      pokemonId: slot.id,
      pokemonName: slot.name,
      form: slot.form,
    }));
  return keys.every(Boolean) ? keys as PokemonEntityKey[] : [];
}
