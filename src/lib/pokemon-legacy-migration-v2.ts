import type { PokemonEntityKey } from './pokemon-catalog-v2';

export interface PokemonLegacyMapV2 {
  version: 2;
  catalogSha256: string;
  byExactIdAndForm: Record<string, PokemonEntityKey[]>;
  byForm: Record<string, PokemonEntityKey[]>;
  byName: Record<string, PokemonEntityKey[]>;
  byId: Record<string, PokemonEntityKey[]>;
}

export interface LegacyPokemonValue {
  pokemonId: number | null | undefined;
  form?: string | null;
  pokemonName?: string | null;
}

export type MapResolution =
  | { status: 'resolved'; confidence: 'exact' | 'unique-form' | 'unique-name' | 'unique-id'; entityKey: PokemonEntityKey }
  | { status: 'ambiguous'; candidateKeys: PokemonEntityKey[] }
  | { status: 'unresolved'; candidateKeys: [] };

export interface LegacyCaughtRow extends LegacyPokemonValue {
  id: string;
  entityKey?: string | null;
  evolvedFromId?: number | null;
  evolvedFromName?: string | null;
  evolvedFromEntityKey?: string | null;
}

export interface LegacyActiveHuntRow {
  id: string;
  pokemonId?: number | null;
  pokemonName?: string | null;
  form?: string | null;
  gender?: string | null;
  pokemonEntityKeys?: string[] | null;
}

export interface LegacyBingoRow {
  userId: string;
  gridIds: number[];
  gridEntityKeys?: string[] | null;
  randomPokemonId?: number | null;
  randomPokemonName?: string | null;
  randomEntityKey?: string | null;
}

export interface CaughtBackfillUpdate {
  table: 'caught_shinies';
  id: string;
  entity_key?: PokemonEntityKey;
  evolved_from_entity_key?: PokemonEntityKey | null;
}

export interface ActiveHuntBackfillUpdate {
  table: 'active_hunts';
  id: string;
  pokemon_entity_keys: PokemonEntityKey[];
}

export interface BingoBackfillUpdate {
  table: 'bingo_boards';
  user_id: string;
  grid_entity_keys?: PokemonEntityKey[];
  random_entity_key?: PokemonEntityKey | null;
}

export type BackfillUpdate = CaughtBackfillUpdate | ActiveHuntBackfillUpdate | BingoBackfillUpdate;

export interface PokemonLegacyBackfillPlan {
  updates: BackfillUpdate[];
  review: Array<{ table: string; rowId: string; reason: string; detail?: unknown }>;
  skipped: Array<{ table: string; rowId: string; reason: string }>;
  summary: {
    updates: number;
    review: number;
    skipped: number;
    caughtShinies: number;
    activeHunts: number;
    bingoBoards: number;
  };
}

const COUNTER_SLOTS_PREFIX = '__counter_slots_v1__:';

const normalize = (value?: string | null) => value?.normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '').trim().toLowerCase() || '';

const unique = (values: PokemonEntityKey[]) => [...new Set(values)].sort();

function candidates(map: Record<string, PokemonEntityKey[]>, key: string): PokemonEntityKey[] {
  return key ? unique(map[key] || []) : [];
}

function knownEntityKeys(map: PokemonLegacyMapV2): Set<string> {
  return new Set(Object.values(map.byId).flat());
}

export function resolveLegacyMapValue(map: PokemonLegacyMapV2, value: LegacyPokemonValue): MapResolution {
  const id = Number.isInteger(value.pokemonId) ? String(value.pokemonId) : '';
  const form = normalize(value.form);
  const name = normalize(value.pokemonName);

  if (id && form) {
    const exact = candidates(map.byExactIdAndForm, `${id}\u0000${form}`);
    if (exact.length === 1) return { status: 'resolved', confidence: 'exact', entityKey: exact[0] };
    if (exact.length > 1) return { status: 'ambiguous', candidateKeys: exact };
  }
  if (form) {
    const formMatches = candidates(map.byForm, form);
    if (formMatches.length === 1) return { status: 'resolved', confidence: 'unique-form', entityKey: formMatches[0] };
    if (formMatches.length > 1) return { status: 'ambiguous', candidateKeys: formMatches };
  }
  if (name) {
    const nameMatches = candidates(map.byName, name);
    if (nameMatches.length === 1) return { status: 'resolved', confidence: 'unique-name', entityKey: nameMatches[0] };
    if (nameMatches.length > 1) return { status: 'ambiguous', candidateKeys: nameMatches };
  }
  if (id) {
    const idMatches = candidates(map.byId, id);
    if (idMatches.length === 1) return { status: 'resolved', confidence: 'unique-id', entityKey: idMatches[0] };
    if (idMatches.length > 1) return { status: 'ambiguous', candidateKeys: idMatches };
  }
  return { status: 'unresolved', candidateKeys: [] };
}

export function decodeLegacyCounterSlots(row: LegacyActiveHuntRow): LegacyPokemonValue[] {
  if (row.pokemonName?.startsWith(COUNTER_SLOTS_PREFIX)) {
    try {
      const parsed = JSON.parse(row.pokemonName.slice(COUNTER_SLOTS_PREFIX.length));
      if (Array.isArray(parsed)) {
        return parsed.slice(0, 3).filter((slot) => slot && Number.isInteger(slot.id)).map((slot) => ({
          pokemonId: slot.id,
          pokemonName: typeof slot.name === 'string' ? slot.name : null,
          form: typeof slot.form === 'string' ? slot.form : null,
        }));
      }
    } catch {
      // Invalid encoded payload is returned as unresolved legacy input below.
    }
  }
  return row.pokemonId ? [{ pokemonId: row.pokemonId, pokemonName: row.pokemonName, form: row.form }] : [];
}

export function planCaughtLegacyMapping(map: PokemonLegacyMapV2, rows: LegacyCaughtRow[]) {
  const knownKeys = knownEntityKeys(map);
  return rows.map((row) => ({
    id: row.id,
    currentEntityKey: row.entityKey || null,
    pokemon: row.entityKey
      ? knownKeys.has(row.entityKey)
        ? { status: 'already-mapped' as const, entityKey: row.entityKey }
        : { status: 'needs-review' as const, invalidEntityKey: row.entityKey }
      : resolveLegacyMapValue(map, row),
    evolution: row.evolvedFromEntityKey
      ? knownKeys.has(row.evolvedFromEntityKey)
        ? { status: 'already-mapped' as const, entityKey: row.evolvedFromEntityKey }
        : { status: 'needs-review' as const, invalidEntityKey: row.evolvedFromEntityKey }
      : row.evolvedFromId || row.evolvedFromName
        ? resolveLegacyMapValue(map, { pokemonId: row.evolvedFromId, pokemonName: row.evolvedFromName })
        : { status: 'not-applicable' as const },
  }));
}

export function planActiveHuntLegacyMapping(map: PokemonLegacyMapV2, rows: LegacyActiveHuntRow[]) {
  return rows.map((row) => {
    const slots = decodeLegacyCounterSlots(row);
    const knownKeys = knownEntityKeys(map);
    if (row.pokemonEntityKeys?.length) {
      const aligned = row.pokemonEntityKeys.length === slots.length;
      const valid = row.pokemonEntityKeys.every((key) => knownKeys.has(key));
      return aligned && valid
        ? { id: row.id, status: 'already-mapped' as const, entityKeys: row.pokemonEntityKeys }
        : { id: row.id, status: 'needs-review' as const, entityKeys: [], resolutions: [] };
    }
    const resolutions = slots.map((slot) => resolveLegacyMapValue(map, slot));
    const resolved = resolutions.filter((item): item is Extract<MapResolution, { status: 'resolved' }> => item.status === 'resolved');
    return resolved.length === resolutions.length && resolutions.length > 0
      ? { id: row.id, status: 'resolved' as const, entityKeys: resolved.map((item) => item.entityKey), resolutions }
      : {
          id: row.id,
          status: resolutions.length || row.pokemonName?.startsWith(COUNTER_SLOTS_PREFIX)
            ? 'needs-review' as const
            : 'empty' as const,
          entityKeys: [],
          resolutions,
        };
  });
}

export function planBingoLegacyMapping(map: PokemonLegacyMapV2, rows: LegacyBingoRow[]) {
  return rows.map((row) => {
    const knownKeys = knownEntityKeys(map);
    const gridResolutions = row.gridIds.map((pokemonId) => resolveLegacyMapValue(map, { pokemonId }));
    const resolvedGrid = gridResolutions.filter((item): item is Extract<MapResolution, { status: 'resolved' }> => item.status === 'resolved');
    const randomResolution = row.randomEntityKey
      ? knownKeys.has(row.randomEntityKey)
        ? { status: 'already-mapped' as const, entityKey: row.randomEntityKey }
        : { status: 'needs-review' as const, invalidEntityKey: row.randomEntityKey }
      : row.randomPokemonId
        ? resolveLegacyMapValue(map, { pokemonId: row.randomPokemonId, pokemonName: row.randomPokemonName })
        : { status: 'not-applicable' as const };
    const hasExistingGrid = Array.isArray(row.gridEntityKeys) && row.gridEntityKeys.length > 0;
    const existingGridIsValid = hasExistingGrid
      && row.gridEntityKeys!.length === row.gridIds.length
      && row.gridEntityKeys!.every((key) => knownKeys.has(key));
    return {
      userId: row.userId,
      grid: existingGridIsValid
        ? { status: 'already-mapped' as const, entityKeys: row.gridEntityKeys }
        : hasExistingGrid
          ? { status: 'needs-review' as const, entityKeys: [], resolutions: [] }
        : resolvedGrid.length === gridResolutions.length
          ? { status: 'resolved' as const, entityKeys: resolvedGrid.map((item) => item.entityKey) }
          : { status: 'needs-review' as const, entityKeys: [], resolutions: gridResolutions },
      random: randomResolution,
    };
  });
}

export function buildPokemonLegacyBackfillPlan(
  map: PokemonLegacyMapV2,
  rows: {
    caughtShinies: LegacyCaughtRow[];
    activeHunts: LegacyActiveHuntRow[];
    bingoBoards: LegacyBingoRow[];
  },
): PokemonLegacyBackfillPlan {
  const updates: BackfillUpdate[] = [];
  const review: PokemonLegacyBackfillPlan['review'] = [];
  const skipped: PokemonLegacyBackfillPlan['skipped'] = [];

  for (const plan of planCaughtLegacyMapping(map, rows.caughtShinies)) {
    const update: CaughtBackfillUpdate = { table: 'caught_shinies', id: plan.id };
    if (plan.pokemon.status === 'resolved') update.entity_key = plan.pokemon.entityKey;
    else if (plan.pokemon.status === 'already-mapped') skipped.push({ table: 'caught_shinies', rowId: plan.id, reason: 'pokemon-already-mapped' });
    else review.push({ table: 'caught_shinies', rowId: plan.id, reason: `pokemon-${plan.pokemon.status}`, detail: plan.pokemon });

    if (plan.evolution.status === 'resolved') update.evolved_from_entity_key = plan.evolution.entityKey;
    else if (plan.evolution.status === 'not-applicable') skipped.push({ table: 'caught_shinies', rowId: plan.id, reason: 'evolution-not-applicable' });
    else if (plan.evolution.status === 'already-mapped') skipped.push({ table: 'caught_shinies', rowId: plan.id, reason: 'evolution-already-mapped' });
    else review.push({ table: 'caught_shinies', rowId: plan.id, reason: `evolution-${plan.evolution.status}`, detail: plan.evolution });

    if ('entity_key' in update || 'evolved_from_entity_key' in update) updates.push(update);
  }

  for (const plan of planActiveHuntLegacyMapping(map, rows.activeHunts)) {
    if (plan.status === 'resolved') updates.push({ table: 'active_hunts', id: plan.id, pokemon_entity_keys: plan.entityKeys });
    else if (plan.status === 'already-mapped' || plan.status === 'empty') skipped.push({ table: 'active_hunts', rowId: plan.id, reason: plan.status });
    else review.push({ table: 'active_hunts', rowId: plan.id, reason: plan.status, detail: plan.resolutions });
  }

  for (const plan of planBingoLegacyMapping(map, rows.bingoBoards)) {
    const update: BingoBackfillUpdate = { table: 'bingo_boards', user_id: plan.userId };
    if (plan.grid.status === 'resolved') update.grid_entity_keys = plan.grid.entityKeys;
    else if (plan.grid.status === 'already-mapped') skipped.push({ table: 'bingo_boards', rowId: plan.userId, reason: 'grid-already-mapped' });
    else review.push({ table: 'bingo_boards', rowId: plan.userId, reason: `grid-${plan.grid.status}`, detail: plan.grid });

    if (plan.random.status === 'resolved') update.random_entity_key = plan.random.entityKey;
    else if (plan.random.status === 'not-applicable') skipped.push({ table: 'bingo_boards', rowId: plan.userId, reason: 'random-not-applicable' });
    else if (plan.random.status === 'already-mapped') skipped.push({ table: 'bingo_boards', rowId: plan.userId, reason: 'random-already-mapped' });
    else review.push({ table: 'bingo_boards', rowId: plan.userId, reason: `random-${plan.random.status}`, detail: plan.random });

    if ('grid_entity_keys' in update || 'random_entity_key' in update) updates.push(update);
  }

  return {
    updates,
    review,
    skipped,
    summary: {
      updates: updates.length,
      review: review.length,
      skipped: skipped.length,
      caughtShinies: updates.filter((item) => item.table === 'caught_shinies').length,
      activeHunts: updates.filter((item) => item.table === 'active_hunts').length,
      bingoBoards: updates.filter((item) => item.table === 'bingo_boards').length,
    },
  };
}
