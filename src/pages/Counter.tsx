import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Activity, Download, LayoutGrid, LockKeyhole, Maximize2, Plus, SlidersHorizontal, Sun, Target, UnlockKeyhole, Vibrate, Wifi, WifiOff, X } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { ShinyCounter } from '@/components/counter/ShinyCounter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/lib/auth-context';
import { useRandomColor } from '@/lib/random-color-context';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { useOnlineStatus } from '@/hooks/use-online-status';
import {
  clearPendingHiddenHunt,
  createOfflineActiveHunt,
  OFFLINE_HUNT_PREFIX,
  OFFLINE_HUNT_SYNCED_EVENT,
  queueHiddenHunt,
  readCachedActiveHunts,
  readPendingHiddenHunts,
  removeCachedActiveHunt,
  replaceCachedActiveHunt,
  writeCachedActiveHunts,
  type OfflineActiveHunt,
} from '@/lib/offline-counter-store';

type ActiveHunt = Tables<'active_hunts'>;
const MAX_ACTIVE_COUNTERS = 15;
const COUNTER_PREFERENCES_KEY = 'pokeshiny:counter-preferences:v1';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

type WakeLockSentinelLike = {
  released: boolean;
  release: () => Promise<void>;
  addEventListener: (type: 'release', listener: () => void) => void;
};

type CounterPreferences = {
  vibrationEnabled: boolean;
  keepAwake: boolean;
  huntLock: boolean;
};

const readCounterPreferences = (): CounterPreferences => {
  try {
    const saved = JSON.parse(localStorage.getItem(COUNTER_PREFERENCES_KEY) || '{}') as Partial<CounterPreferences>;
    return {
      vibrationEnabled: saved.vibrationEnabled === true,
      keepAwake: saved.keepAwake === true,
      huntLock: saved.huntLock === true,
    };
  } catch {
    return { vibrationEnabled: false, keepAwake: false, huntLock: false };
  }
};

export default function Counter() {
  const { huntId } = useParams<{ huntId?: string }>();
  const { user } = useAuth();
  const { accentColor } = useRandomColor();
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();
  const [activeHunts, setActiveHunts] = useState<ActiveHunt[]>([]);
  const [loading, setLoading] = useState(true);
  const [huntToHideId, setHuntToHideId] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<CounterPreferences>(readCounterPreferences);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(() => window.matchMedia('(display-mode: standalone)').matches);
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinelLike | null>(null);
  const remainingSlots = Math.max(0, MAX_ACTIVE_COUNTERS - activeHunts.length);
  const wakeLockSupported = typeof navigator !== 'undefined' && 'wakeLock' in navigator;
  const isAbortLikeError = (err: unknown) => {
    if (!err || typeof err !== 'object') return false;
    const maybe = err as { name?: string; message?: string };
    const name = (maybe.name || '').toLowerCase();
    const message = (maybe.message || '').toLowerCase();
    return name.includes('abort') || message.includes('aborted');
  };

  // If huntId is present, we are in "Single Focus Mode"
  const isSingleView = !!huntId;

  useEffect(() => {
    try {
      localStorage.setItem(COUNTER_PREFERENCES_KEY, JSON.stringify(preferences));
    } catch {
      // Preferences remain active for the current session.
    }
  }, [preferences]);

  useEffect(() => {
    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const handleInstalled = () => {
      setInstallPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const requestWakeLock = useCallback(async () => {
    if (!preferences.keepAwake || !wakeLockSupported || document.visibilityState !== 'visible') return;
    try {
      const wakeLock = await (navigator as Navigator & {
        wakeLock: { request: (type: 'screen') => Promise<WakeLockSentinelLike> };
      }).wakeLock.request('screen');
      wakeLockRef.current = wakeLock;
      setWakeLockActive(true);
      wakeLock.addEventListener('release', () => setWakeLockActive(false));
    } catch {
      setWakeLockActive(false);
    }
  }, [preferences.keepAwake, wakeLockSupported]);

  useEffect(() => {
    if (!preferences.keepAwake) {
      void wakeLockRef.current?.release();
      wakeLockRef.current = null;
      setWakeLockActive(false);
      return;
    }

    void requestWakeLock();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') void requestWakeLock();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      void wakeLockRef.current?.release();
      wakeLockRef.current = null;
    };
  }, [preferences.keepAwake, requestWakeLock]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchHunts = async () => {
      const cachedHunts = readCachedActiveHunts(user.id) as ActiveHunt[];
      if (cachedHunts.length > 0) {
        setActiveHunts(cachedHunts);
        setLoading(false);
      } else {
        setLoading(true);
      }

      if (!isOnline) {
        setLoading(false);
        return;
      }

      try {
        const hiddenHuntIds = readPendingHiddenHunts(user.id);
        await Promise.all(hiddenHuntIds.map(async (hiddenHuntId) => {
          const { error } = await supabase
            .from('active_hunts')
            .update({ is_visible_on_counter: false })
            .eq('id', hiddenHuntId)
            .eq('user_id', user.id);
          if (!error) clearPendingHiddenHunt(user.id, hiddenHuntId);
        }));

        const { data, error } = await supabase
          .from('active_hunts')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_visible_on_counter', true) // Solo cacce visibili
          .order('order_index', { ascending: true }) // Ordina per indice
          .order('updated_at', { ascending: false })
          .limit(MAX_ACTIVE_COUNTERS); // Fetch up to 15 most recent hunts

        if (error && !isAbortLikeError(error)) {
          console.error('Error fetching hunts:', error);
        }

        if (data) {
          writeCachedActiveHunts(user.id, data as OfflineActiveHunt[]);
          // Keep temporary hunts mounted so their counters can sync as soon as
          // connectivity returns. The child counter replaces the temporary id
          // with the Supabase id after a successful insert.
          setActiveHunts(readCachedActiveHunts(user.id) as ActiveHunt[]);
        }
      } catch (err) {
        if (!isAbortLikeError(err)) {
          console.error('Unexpected fetch hunts error:', err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchHunts();
  }, [user, huntId, isOnline]); // Reconcile cached counters whenever connectivity returns.

  useEffect(() => {
    if (!user) return;
    const handleOfflineHuntSynced = (event: Event) => {
      const detail = (event as CustomEvent<{ temporaryId: string; remoteHunt: OfflineActiveHunt }>).detail;
      if (!detail?.temporaryId || !detail.remoteHunt) return;
      replaceCachedActiveHunt(user.id, detail.temporaryId, detail.remoteHunt);
      setActiveHunts((current) => current.map((hunt) => hunt.id === detail.temporaryId
        ? detail.remoteHunt as ActiveHunt
        : hunt));
      if (huntId === detail.temporaryId) {
        navigate(`/counter/${detail.remoteHunt.id}`, { replace: true });
      }
    };

    window.addEventListener(OFFLINE_HUNT_SYNCED_EVENT, handleOfflineHuntSynced);
    return () => window.removeEventListener(OFFLINE_HUNT_SYNCED_EVENT, handleOfflineHuntSynced);
  }, [huntId, navigate, user]);

  const handleHideHunt = async (huntId: string) => {
    // Optimistic update
    setActiveHunts(prev => prev.filter(h => h.id !== huntId));
    if (user) removeCachedActiveHunt(user.id, huntId);

    if (!user || huntId.startsWith(OFFLINE_HUNT_PREFIX)) return;
    if (!isOnline) {
      queueHiddenHunt(user.id, huntId);
      return;
    }

    const { error } = await supabase
      .from('active_hunts')
      .update({ is_visible_on_counter: false })
      .eq('id', huntId);

    if (error) {
      console.error("Error hiding hunt:", error);
      queueHiddenHunt(user.id, huntId);
    }
  };

  const handleCreateNew = async () => {
    if (!user) {
      // For guests, we can navigate to a demo counter or prompt login
      navigate('/auth'); // Or some other handling
      return;
    }

    if (!isOnline) {
      const offlineHunt = createOfflineActiveHunt(user.id);
      const nextHunts = [...activeHunts, offlineHunt as ActiveHunt].slice(0, MAX_ACTIVE_COUNTERS);
      setActiveHunts(nextHunts);
      writeCachedActiveHunts(user.id, nextHunts as OfflineActiveHunt[], false);
      return;
    }

    // Create a new active hunt entry in Supabase
    const { data, error } = await supabase.from('active_hunts').insert({
      user_id: user.id,
      pokemon_id: null, // Initial empty state
      pokemon_entity_keys: [],
      pokemon_name: null, // Initial empty state
      method: 'gen9-random', // Default method
      counter: 0,
      has_shiny_charm: false,
      increment_amount: 1,
      increment_hotkey: null,
      is_visible_on_counter: true, // Visibile nel multi-counter
      created_at: new Date().toISOString(), // Auto start date
    }).select('id').single();

    if (error) {
      console.error("Error creating new hunt:", error);
      // Handle error, maybe show a toast
      return;
    }

    // Refresh local state instead of navigating
    if (data?.id) {
      // Refresh list
      const { data: newData } = await supabase
        .from('active_hunts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_visible_on_counter', true)
        .order('order_index', { ascending: true })
        .order('updated_at', { ascending: false })
        .limit(MAX_ACTIVE_COUNTERS);

      if (newData) {
        writeCachedActiveHunts(user.id, newData as OfflineActiveHunt[]);
        setActiveHunts(readCachedActiveHunts(user.id) as ActiveHunt[]);
      }
    }
  };

  const handleInstallApp = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') setInstallPrompt(null);
  };

  return (
    <div
      className="min-h-screen bg-background transition-colors duration-1000"
      style={{
        backgroundImage: `radial-gradient(circle at 50% 0%, ${accentColor}15 0%, transparent 70%)`
      }}
    >
      <Navbar />
      <main className="container mx-auto px-4 py-6 space-y-5">

        {/* View Switcher Header (only if logged in) */}
        {user && !isSingleView && (
          <section className="rounded-lg border border-border/70 bg-card p-4 text-card-foreground shadow-sm dark:border-white/15 dark:bg-[#171717]/92 dark:text-white dark:shadow-[0_16px_38px_rgba(0,0,0,0.35)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="gap-1 border-border/70 bg-background/70 text-foreground dark:border-white/15 dark:bg-white/10 dark:text-white">
                    <Activity className="h-3.5 w-3.5" />
                    {activeHunts.length}/{MAX_ACTIVE_COUNTERS} active
                  </Badge>
                  <Badge variant="secondary" className="gap-1 border border-border/70 bg-muted/70 text-foreground hover:bg-muted/70 dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/10">
                    <Target className="h-3.5 w-3.5" />
                    {remainingSlots} free {remainingSlots === 1 ? 'slot' : 'slots'}
                  </Badge>
                </div>
                <h1
                  className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r"
                  style={{
                    backgroundImage: `linear-gradient(to right, ${accentColor}, color-mix(in srgb, ${accentColor}, white 35%))`
                  }}
                >
                  Counter
                </h1>
                <p className="mt-1 text-sm text-muted-foreground dark:text-white/70">
                  Keep active hunts in view and open focus mode when you need to configure details.
                </p>
              </div>
              <Button
                onClick={handleCreateNew}
                disabled={activeHunts.length >= MAX_ACTIVE_COUNTERS}
                className="w-full md:w-auto"
                style={{ backgroundColor: accentColor }}
              >
                <Plus className="mr-2 h-4 w-4" />
                New hunt
              </Button>
            </div>
          </section>
        )}

        <section className="rounded-lg border border-border/70 bg-card/85 p-3 text-card-foreground shadow-sm dark:border-white/15 dark:bg-[#171717]/92 dark:text-white">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold">
              {isOnline ? <Wifi className="h-4 w-4 text-emerald-500" /> : <WifiOff className="h-4 w-4 text-amber-500" />}
              <span>{isOnline ? 'Online · cloud sync active' : 'Offline · counters saved on this device'}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
              {installPrompt && !isInstalled && (
                <Button type="button" variant="outline" size="sm" onClick={() => void handleInstallApp()}>
                  <Download className="mr-2 h-4 w-4" />
                  Install app
                </Button>
              )}
              <Button
                type="button"
                variant={preferences.vibrationEnabled ? 'default' : 'outline'}
                size="sm"
                aria-pressed={preferences.vibrationEnabled}
                onClick={() => setPreferences((current) => ({ ...current, vibrationEnabled: !current.vibrationEnabled }))}
                style={preferences.vibrationEnabled ? { backgroundColor: accentColor } : undefined}
              >
                <Vibrate className="mr-2 h-4 w-4" />
                Vibration
              </Button>
              <Button
                type="button"
                variant={preferences.keepAwake ? 'default' : 'outline'}
                size="sm"
                disabled={!wakeLockSupported}
                aria-pressed={preferences.keepAwake}
                title={wakeLockSupported ? 'Keep the screen awake while hunting' : 'Screen wake lock is not supported by this browser'}
                onClick={() => setPreferences((current) => ({ ...current, keepAwake: !current.keepAwake }))}
                style={preferences.keepAwake ? { backgroundColor: accentColor } : undefined}
              >
                <Sun className="mr-2 h-4 w-4" />
                {preferences.keepAwake && wakeLockActive ? 'Screen awake' : 'Keep awake'}
              </Button>
              <Button
                type="button"
                variant={preferences.huntLock ? 'default' : 'outline'}
                size="sm"
                aria-pressed={preferences.huntLock}
                onClick={() => setPreferences((current) => ({ ...current, huntLock: !current.huntLock }))}
                style={preferences.huntLock ? { backgroundColor: accentColor } : undefined}
              >
                {preferences.huntLock
                  ? <LockKeyhole className="mr-2 h-4 w-4" />
                  : <UnlockKeyhole className="mr-2 h-4 w-4" />}
                Hunt lock
              </Button>
            </div>
          </div>
          {preferences.huntLock && (
            <p className="mt-2 text-xs text-muted-foreground">
              Hunt Lock is active: incrementing remains available; editing, decrementing, setup, finish, and reset are protected.
            </p>
          )}
        </section>

        {/* CONTENT */}
        {isSingleView ? (
          /* Single Counter View (Focused) */
          <div className="mx-auto max-w-3xl space-y-4">
            <div>
              <Button variant="ghost" onClick={() => navigate('/counter')}>
                <LayoutGrid className="mr-2 h-4 w-4" /> Back to multi view
              </Button>
            </div>
            <ShinyCounter
              huntId={huntId}
              enableKeyboardShortcuts
              vibrationEnabled={preferences.vibrationEnabled}
              huntLock={preferences.huntLock}
            />
          </div>
        ) : !user ? (
          /* Guest View (Single Demo) */
          <ShinyCounter
            enableKeyboardShortcuts
            vibrationEnabled={preferences.vibrationEnabled}
            huntLock={preferences.huntLock}
          />
        ) : (
          /* Multi Counter Grid */
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {loading ? (
              <div className="col-span-full rounded-lg border border-border/70 bg-card/70 py-12 text-center text-sm text-muted-foreground">
                Loading counters...
              </div>
            ) : (
              <>
                {/* Render Active Hunts */}
                {activeHunts.map((hunt) => (
                  <div
                    key={hunt.id}
                    className="group/card relative overflow-hidden rounded-lg border border-border/70 bg-card p-4 text-card-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-white/15 dark:bg-[#171717]/95 dark:text-white dark:shadow-[0_18px_42px_rgba(0,0,0,0.42)] dark:hover:shadow-[0_22px_54px_rgba(0,0,0,0.5)]"
                  >
                    <div
                      className="pointer-events-none absolute inset-x-0 top-0 h-1"
                      style={{ backgroundColor: accentColor }}
                    />
                    <div className="absolute right-2 top-2 z-10 flex gap-1 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover/card:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:bg-muted hover:text-foreground dark:text-white/65 dark:hover:bg-white/10 dark:hover:text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/counter/${hunt.id}`);
                        }}
                        title="Focus mode"
                      >
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:bg-muted hover:text-destructive dark:text-white/65 dark:hover:bg-white/10 dark:hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setHuntToHideId(hunt.id);
                        }}
                        title="Close (Hide)"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-col items-center pt-8">
                      <ShinyCounter
                        huntId={hunt.id}
                        enableKeyboardShortcuts
                        allowGlobalPlusMinusHotkeys={false}
                        compact
                        showSetup={false}
                        vibrationEnabled={preferences.vibrationEnabled}
                        huntLock={preferences.huntLock}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-3 w-full justify-center border-border/70 bg-background/80 text-foreground shadow-sm hover:bg-muted hover:text-foreground dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/15 dark:hover:text-white"
                        onClick={() => navigate(`/counter/${hunt.id}`)}
                      >
                        <SlidersHorizontal className="mr-2 h-4 w-4" />
                        Configure Pokémon and method
                      </Button>
                    </div>
                  </div>
                ))}

                {activeHunts.length === 0 && (
                  <div className="col-span-full rounded-lg border border-dashed border-border bg-muted/20 p-8 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-md border border-border bg-background">
                      <Plus className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h2 className="text-lg font-bold">No active hunts</h2>
                    <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                      Create a counter, then use Configure to choose the Pokémon, method, and details.
                    </p>
                    <Button className="mt-4" onClick={handleCreateNew} style={{ backgroundColor: accentColor }}>
                      <Plus className="mr-2 h-4 w-4" />
                      New hunt
                    </Button>
                  </div>
                )}

                {activeHunts.length > 0 && activeHunts.length < MAX_ACTIVE_COUNTERS && (
                  <button
                    type="button"
                    onClick={handleCreateNew}
                    className="min-h-[220px] rounded-lg border border-dashed border-border bg-muted/20 p-4 text-left transition-colors hover:bg-muted/35 focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-md border border-border bg-background">
                        <Plus className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="font-bold">Add counter</div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          {remainingSlots} free {remainingSlots === 1 ? 'slot' : 'slots'}
                        </div>
                      </div>
                    </div>
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </main>

      <AlertDialog open={!!huntToHideId} onOpenChange={(open) => !open && setHuntToHideId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm counter deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Do you really want to remove this counter from the multi-counter view? You can add it again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setHuntToHideId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (huntToHideId) void handleHideHunt(huntToHideId);
                setHuntToHideId(null);
              }}
            >Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
