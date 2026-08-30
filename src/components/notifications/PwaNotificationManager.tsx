import { useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { usePwaNotifications } from '@/hooks/use-pwa-notifications';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type HuntRoom = Tables<'hunt_rooms'>;
const LAST_REMINDER_PREFIX = 'pokeshiny:last-active-hunt-reminder:v1';

export function PwaNotificationManager() {
  const { user } = useAuth();
  const { preferences, permission, notify } = usePwaNotifications();
  const roomStatusesRef = useRef<Map<string, string>>(new Map());
  const roomsInitializedRef = useRef(false);

  const checkRoomResults = useCallback(async () => {
    if (!user || !preferences.enabled || !preferences.huntRoomResults || permission !== 'granted') return;
    const { data: memberships, error: membershipError } = await supabase
      .from('hunt_room_members')
      .select('room_id')
      .eq('user_id', user.id);
    if (membershipError || !memberships?.length) return;

    const { data, error } = await supabase
      .from('hunt_rooms')
      .select('*')
      .in('id', memberships.map((membership) => membership.room_id));
    if (error || !data) return;

    const previousStatuses = roomStatusesRef.current;
    const nextStatuses = new Map<string, string>();
    for (const room of data as HuntRoom[]) {
      nextStatuses.set(room.id, room.status);
      if (
        roomsInitializedRef.current &&
        previousStatuses.get(room.id) === 'active' &&
        room.status === 'completed' &&
        room.winner_user_id !== user.id
      ) {
        await notify({
          title: 'A shiny was found!',
          body: `${room.name} has been completed by another hunter.`,
          tag: `hunt-room-completed-${room.id}`,
          url: `/rooms/${room.id}`,
          cooldownMs: 24 * 60 * 60 * 1000,
        });
      }
    }
    roomStatusesRef.current = nextStatuses;
    roomsInitializedRef.current = true;
  }, [notify, permission, preferences.enabled, preferences.huntRoomResults, user]);

  const checkActiveHuntReminder = useCallback(async () => {
    if (!user || !preferences.enabled || !preferences.activeHuntReminders || permission !== 'granted') return;
    if (document.visibilityState === 'visible') return;

    const storageKey = `${LAST_REMINDER_PREFIX}:${user.id}`;
    const intervalMs = preferences.reminderIntervalMinutes * 60 * 1000;
    const lastReminder = Number(localStorage.getItem(storageKey) || 0);
    if (Date.now() - lastReminder < intervalMs) return;

    const { count, error } = await supabase
      .from('active_hunts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_visible_on_counter', true);
    if (error || !count) return;

    const shown = await notify({
      title: `${count} active ${count === 1 ? 'hunt' : 'hunts'} waiting`,
      body: 'Continue when you are ready. Your counters are safely saved.',
      tag: 'active-hunt-reminder',
      url: '/counter',
      cooldownMs: intervalMs,
    });
    if (shown) localStorage.setItem(storageKey, String(Date.now()));
  }, [notify, permission, preferences.activeHuntReminders, preferences.enabled, preferences.reminderIntervalMinutes, user]);

  useEffect(() => {
    roomsInitializedRef.current = false;
    roomStatusesRef.current = new Map();
    void checkRoomResults();
  }, [checkRoomResults, user?.id]);

  useEffect(() => {
    if (!user || !preferences.enabled) return;
    const intervalId = window.setInterval(() => {
      void checkRoomResults();
      void checkActiveHuntReminder();
    }, 30_000);
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        void checkRoomResults();
        void checkActiveHuntReminder();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [checkActiveHuntReminder, checkRoomResults, preferences.enabled, user]);

  return null;
}

