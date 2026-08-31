export const OFFLINE_HUNT_PREFIX = 'offline-';
export const OFFLINE_HUNT_SYNCED_EVENT = 'pokeshiny:offline-hunt-synced';

const COUNTER_KEY_PREFIX = 'pokeshiny:counter:v1';
const ACTIVE_HUNTS_KEY_PREFIX = 'pokeshiny:active-hunts:v1';
const HIDDEN_HUNTS_KEY_PREFIX = 'pokeshiny:hidden-hunts:v1';

export type OfflineCounterPokemonSlot = {
  id: number | null;
  name: string;
  form: string;
  gender: string;
};

export type OfflineCounterSnapshot = {
  version: 1;
  ownerId: string;
  huntId: string;
  updatedAt: string;
  pendingSync: boolean;
  counter: number;
  incrementAmount: number;
  incrementHotkey: string;
  selectedGameId: string | null;
  pokemonSlots: OfflineCounterPokemonSlot[];
  methodId: string;
  hasShinyCharm: boolean;
  customOdds: number;
  huntCreatedAt: string | null;
};

export type OfflineActiveHunt = {
  id: string;
  user_id: string;
  pokemon_id: number | null;
  pokemon_entity_keys: string[];
  pokemon_name: string | null;
  method: string;
  counter: number;
  has_shiny_charm: boolean | null;
  increment_amount: number | null;
  increment_hotkey: string | null;
  is_visible_on_counter: boolean | null;
  created_at: string;
  updated_at: string;
  order_index?: number | null;
  form?: string | null;
  gender?: string | null;
};

const canUseStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
const counterKey = (ownerId: string, huntId: string) => `${COUNTER_KEY_PREFIX}:${ownerId}:${huntId}`;
const activeHuntsKey = (ownerId: string) => `${ACTIVE_HUNTS_KEY_PREFIX}:${ownerId}`;
const hiddenHuntsKey = (ownerId: string) => `${HIDDEN_HUNTS_KEY_PREFIX}:${ownerId}`;

const safeParse = <T>(value: string | null): T | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

export function readCounterSnapshot(ownerId: string, huntId: string): OfflineCounterSnapshot | null {
  if (!canUseStorage()) return null;
  const value = safeParse<OfflineCounterSnapshot>(localStorage.getItem(counterKey(ownerId, huntId)));
  if (!value || value.version !== 1 || value.ownerId !== ownerId || value.huntId !== huntId) return null;
  return value;
}

export function writeCounterSnapshot(snapshot: OfflineCounterSnapshot) {
  if (!canUseStorage()) return;
  try {
    localStorage.setItem(counterKey(snapshot.ownerId, snapshot.huntId), JSON.stringify(snapshot));
  } catch {
    // Counters continue to work even if browser storage is unavailable or full.
  }
}

export function migrateCounterSnapshot(ownerId: string, oldHuntId: string, newHuntId: string) {
  const snapshot = readCounterSnapshot(ownerId, oldHuntId);
  if (!snapshot || !canUseStorage()) return;
  writeCounterSnapshot({ ...snapshot, huntId: newHuntId });
  try {
    localStorage.removeItem(counterKey(ownerId, oldHuntId));
  } catch {
    // The new copy is already safe; leaving the old key is harmless.
  }
}

export function readCachedActiveHunts(ownerId: string): OfflineActiveHunt[] {
  if (!canUseStorage()) return [];
  const value = safeParse<OfflineActiveHunt[]>(localStorage.getItem(activeHuntsKey(ownerId)));
  return Array.isArray(value) ? value.filter((hunt) => hunt?.id && hunt.user_id === ownerId) : [];
}

export function writeCachedActiveHunts(ownerId: string, hunts: OfflineActiveHunt[], preserveOfflineHunts = true) {
  if (!canUseStorage()) return;
  const offlineHunts = preserveOfflineHunts
    ? readCachedActiveHunts(ownerId).filter((hunt) => hunt.id.startsWith(OFFLINE_HUNT_PREFIX))
    : [];
  const hiddenIds = new Set(readPendingHiddenHunts(ownerId));
  const merged = [...hunts, ...offlineHunts.filter((offline) => !hunts.some((hunt) => hunt.id === offline.id))]
    .filter((hunt) => !hiddenIds.has(hunt.id) && hunt.is_visible_on_counter !== false)
    .slice(0, 15);
  try {
    localStorage.setItem(activeHuntsKey(ownerId), JSON.stringify(merged));
  } catch {
    // Non-blocking cache only.
  }
}

export function patchCachedActiveHunt(ownerId: string, huntId: string, patch: Partial<OfflineActiveHunt>) {
  const hunts = readCachedActiveHunts(ownerId);
  const next = hunts.map((hunt) => hunt.id === huntId ? { ...hunt, ...patch } : hunt);
  writeCachedActiveHunts(ownerId, next, false);
}

export function removeCachedActiveHunt(ownerId: string, huntId: string) {
  writeCachedActiveHunts(ownerId, readCachedActiveHunts(ownerId).filter((hunt) => hunt.id !== huntId), false);
}

export function replaceCachedActiveHunt(ownerId: string, temporaryId: string, remoteHunt: OfflineActiveHunt) {
  const next = readCachedActiveHunts(ownerId).filter((hunt) => hunt.id !== temporaryId && hunt.id !== remoteHunt.id);
  writeCachedActiveHunts(ownerId, [remoteHunt, ...next], false);
}

export function createOfflineActiveHunt(ownerId: string): OfflineActiveHunt {
  const now = new Date().toISOString();
  const randomPart = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return {
    id: `${OFFLINE_HUNT_PREFIX}${randomPart}`,
    user_id: ownerId,
    pokemon_id: null,
    pokemon_entity_keys: [],
    pokemon_name: null,
    method: 'gen9-random',
    counter: 0,
    has_shiny_charm: false,
    increment_amount: 1,
    increment_hotkey: null,
    is_visible_on_counter: true,
    created_at: now,
    updated_at: now,
    order_index: 0,
    form: null,
    gender: null,
  };
}

export function readPendingHiddenHunts(ownerId: string): string[] {
  if (!canUseStorage()) return [];
  const value = safeParse<string[]>(localStorage.getItem(hiddenHuntsKey(ownerId)));
  return Array.isArray(value) ? value.filter((id) => typeof id === 'string') : [];
}

export function queueHiddenHunt(ownerId: string, huntId: string) {
  if (!canUseStorage() || huntId.startsWith(OFFLINE_HUNT_PREFIX)) return;
  const ids = new Set(readPendingHiddenHunts(ownerId));
  ids.add(huntId);
  try {
    localStorage.setItem(hiddenHuntsKey(ownerId), JSON.stringify(Array.from(ids)));
  } catch {
    // Non-blocking queue only.
  }
}

export function clearPendingHiddenHunt(ownerId: string, huntId: string) {
  if (!canUseStorage()) return;
  const ids = readPendingHiddenHunts(ownerId).filter((id) => id !== huntId);
  try {
    localStorage.setItem(hiddenHuntsKey(ownerId), JSON.stringify(ids));
  } catch {
    // Non-blocking queue only.
  }
}
