import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearPendingHiddenHunt,
  createOfflineActiveHunt,
  migrateCounterSnapshot,
  OFFLINE_HUNT_PREFIX,
  queueHiddenHunt,
  readCachedActiveHunts,
  readCounterSnapshot,
  readPendingHiddenHunts,
  replaceCachedActiveHunt,
  writeCachedActiveHunts,
  writeCounterSnapshot,
  type OfflineActiveHunt,
  type OfflineCounterSnapshot,
} from './offline-counter-store';

const ownerId = 'user-1';

const makeHunt = (id: string): OfflineActiveHunt => ({
  id,
  user_id: ownerId,
  pokemon_id: 1,
  pokemon_entity_keys: [],
  pokemon_name: 'Bulbasaur',
  method: 'gen9-random',
  counter: 12,
  has_shiny_charm: false,
  increment_amount: 1,
  increment_hotkey: null,
  is_visible_on_counter: true,
  created_at: '2026-08-30T00:00:00.000Z',
  updated_at: '2026-08-30T00:00:00.000Z',
});

const makeSnapshot = (huntId: string): OfflineCounterSnapshot => ({
  version: 1,
  ownerId,
  huntId,
  updatedAt: '2026-08-30T00:00:00.000Z',
  pendingSync: true,
  counter: 42,
  incrementAmount: 1,
  incrementHotkey: 'space',
  pokemonSlots: [
    { id: 1, name: 'Bulbasaur', form: '', gender: '' },
    { id: null, name: '', form: '', gender: '' },
    { id: null, name: '', form: '', gender: '' },
  ],
  methodId: 'gen9-random',
  hasShinyCharm: false,
  customOdds: 4096,
  huntCreatedAt: '2026-08-30T00:00:00.000Z',
});

describe('offline counter storage', () => {
  beforeEach(() => localStorage.clear());

  it('stores and migrates a pending counter snapshot without losing progress', () => {
    const temporaryId = `${OFFLINE_HUNT_PREFIX}temporary`;
    writeCounterSnapshot(makeSnapshot(temporaryId));

    migrateCounterSnapshot(ownerId, temporaryId, 'remote-1');

    expect(readCounterSnapshot(ownerId, temporaryId)).toBeNull();
    expect(readCounterSnapshot(ownerId, 'remote-1')).toMatchObject({
      huntId: 'remote-1',
      counter: 42,
      pendingSync: true,
    });
  });

  it('keeps an offline-created hunt when fresh remote hunts are cached', () => {
    const offlineHunt = createOfflineActiveHunt(ownerId);
    writeCachedActiveHunts(ownerId, [offlineHunt], false);

    writeCachedActiveHunts(ownerId, [makeHunt('remote-1')]);

    expect(readCachedActiveHunts(ownerId).map((hunt) => hunt.id)).toEqual([
      'remote-1',
      offlineHunt.id,
    ]);
  });

  it('replaces a temporary hunt with its synced Supabase record', () => {
    const offlineHunt = createOfflineActiveHunt(ownerId);
    writeCachedActiveHunts(ownerId, [offlineHunt], false);

    replaceCachedActiveHunt(ownerId, offlineHunt.id, makeHunt('remote-1'));

    expect(readCachedActiveHunts(ownerId).map((hunt) => hunt.id)).toEqual(['remote-1']);
  });

  it('queues hidden remote hunts and excludes them from the visible cache', () => {
    queueHiddenHunt(ownerId, 'remote-1');
    writeCachedActiveHunts(ownerId, [makeHunt('remote-1'), makeHunt('remote-2')], false);

    expect(readPendingHiddenHunts(ownerId)).toEqual(['remote-1']);
    expect(readCachedActiveHunts(ownerId).map((hunt) => hunt.id)).toEqual(['remote-2']);

    clearPendingHiddenHunt(ownerId, 'remote-1');
    expect(readPendingHiddenHunts(ownerId)).toEqual([]);
  });
});
