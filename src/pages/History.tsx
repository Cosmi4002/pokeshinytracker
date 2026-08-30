import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Clock3,
  History as HistoryIcon,
  LogIn,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getPokemonSpriteUrl } from '@/hooks/use-pokemon';
import { supabase } from '@/integrations/supabase/client';
import type { Json, Tables } from '@/integrations/supabase/types';
import { useAuth } from '@/lib/auth-context';
import { useRandomColor } from '@/lib/random-color-context';
import { cn } from '@/lib/utils';

type HistoryRow = Tables<'collection_history'>;
type CaughtShinyRow = Tables<'caught_shinies'>;
type HistoryAction = 'all' | 'insert' | 'update' | 'delete' | 'restore';
type Snapshot = Partial<CaughtShinyRow>;

const actionDetails = {
  insert: { label: 'Added', icon: Plus, className: 'border-emerald-500/35 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300' },
  update: { label: 'Updated', icon: Pencil, className: 'border-sky-500/35 bg-sky-500/10 text-sky-600 dark:text-sky-300' },
  delete: { label: 'Deleted', icon: Trash2, className: 'border-destructive/35 bg-destructive/10 text-destructive' },
  restore: { label: 'Restored', icon: RotateCcw, className: 'border-violet-500/35 bg-violet-500/10 text-violet-600 dark:text-violet-300' },
} as const;

const fieldLabels: Record<string, string> = {
  attempts: 'Encounters',
  caught_date: 'Obtained date',
  evolved_from_name: 'Source Pokémon',
  form: 'Form',
  game: 'Game',
  gender: 'Gender',
  has_shiny_charm: 'Shiny Charm',
  hunt_start_date: 'Hunt start',
  is_evolved: 'Evolution',
  is_fail: 'Fail',
  is_gigamax: 'Gigantamax',
  is_unobtainable: 'Unobtainable',
  method: 'Method',
  notes: 'Notes',
  phase_number: 'Phase',
  playlist_id: 'Playlist',
  pokeball: 'Poké Ball',
  pokemon_name: 'Pokémon',
  secondary_game: 'Second game',
  show_encounters: 'Show encounters',
  show_total: 'Show total',
  show_total_seen: 'Show seen total',
  total_seen_count: 'Seen total',
  total_value: 'Total',
};

const hiddenFields = new Set([
  'created_at',
  'entity_key',
  'evolved_from_entity_key',
  'evolved_from_id',
  'id',
  'pokemon_id',
  'sprite_url',
  'updated_at',
  'user_id',
]);

const dateFormatter = new Intl.DateTimeFormat('en', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const asSnapshot = (value: Json | null): Snapshot | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as unknown as Snapshot;
};

const formatValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return new Intl.DateTimeFormat('en', { day: '2-digit', month: 'short', year: 'numeric' }).format(parsed);
    }
  }
  return String(value).replace(/-/g, ' ');
};

const getRestoreLabel = (action: string) => {
  if (action === 'insert') return 'Undo addition';
  if (action === 'delete') return 'Restore Pokémon';
  return 'Restore previous version';
};

export default function History() {
  const { user, loading: authLoading } = useAuth();
  const { accentColor } = useRandomColor();
  const { toast } = useToast();
  const [events, setEvents] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<HistoryAction>('all');
  const [selectedEvent, setSelectedEvent] = useState<HistoryRow | null>(null);
  const [restoring, setRestoring] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!user) {
      setEvents([]);
      setLoadError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);
    const { data, error } = await supabase
      .from('collection_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(300);

    if (error) {
      setLoadError(error.message);
      setEvents([]);
    } else {
      setEvents(data || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  const filteredEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return events.filter((event) => {
      if (actionFilter !== 'all' && event.action !== actionFilter) return false;
      if (!normalizedQuery) return true;
      const before = asSnapshot(event.before_data);
      const after = asSnapshot(event.after_data);
      return [
        after?.pokemon_name,
        after?.form,
        before?.pokemon_name,
        before?.form,
      ].some((value) => String(value || '').toLowerCase().includes(normalizedQuery));
    });
  }, [actionFilter, events, query]);

  const handleRestore = async () => {
    if (!selectedEvent) return;
    setRestoring(true);
    const { error } = await supabase.rpc('restore_collection_history_event', {
      history_event_id: selectedEvent.id,
    });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Restore failed',
        description: error.message,
      });
    } else {
      toast({
        title: selectedEvent.action === 'insert' ? 'Addition undone' : 'Version restored',
        description: 'Your collection has been updated and the recovery was recorded in History.',
      });
      setSelectedEvent(null);
      await fetchHistory();
    }
    setRestoring(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto space-y-4 px-4 py-8">
          <Skeleton className="h-36 w-full rounded-3xl" />
          <Skeleton className="h-52 w-full rounded-2xl" />
        </main>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-background"
      style={{ backgroundImage: `radial-gradient(circle at 50% 0%, ${accentColor}15 0%, transparent 65%)` }}
    >
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <section className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-6 shadow-2xl sm:p-8">
            <div
              className="pointer-events-none absolute inset-0 opacity-80"
              style={{ background: `radial-gradient(circle at top left, ${accentColor}22, transparent 42%)` }}
            />
            <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <HistoryIcon className="h-4 w-4" /> Collection safety
                </div>
                <h1 className="text-3xl font-bold sm:text-4xl">History</h1>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
                  Review collection changes and recover a Pokémon or a previous version when something was changed by mistake.
                </p>
              </div>
              <Button variant="outline" asChild>
                <Link to="/collection"><ArrowLeft className="h-4 w-4" />Back to Collection</Link>
              </Button>
            </div>
          </section>

          {!user ? (
            <Card className="border-border bg-card shadow-xl">
              <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
                <LogIn className="h-10 w-10 text-muted-foreground" />
                <div>
                  <h2 className="text-xl font-semibold">Sign in to view your history</h2>
                  <p className="mt-1 text-sm text-muted-foreground">History is private and only visible to its owner.</p>
                </div>
                <Button asChild><Link to="/auth">Sign In</Link></Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="border-border bg-card shadow-xl">
                <CardContent className="grid gap-3 p-4 sm:grid-cols-[1fr_auto]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search Pokémon or form..."
                      className="pl-9"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(['all', 'insert', 'update', 'delete', 'restore'] as HistoryAction[]).map((action) => (
                      <Button
                        key={action}
                        type="button"
                        size="sm"
                        variant={actionFilter === action ? 'default' : 'outline'}
                        onClick={() => setActionFilter(action)}
                        className="capitalize"
                      >
                        {action === 'all' ? 'All' : actionDetails[action].label}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {loadError && (
                <Alert variant="destructive">
                  <HistoryIcon className="h-4 w-4" />
                  <AlertTitle>History is not available yet</AlertTitle>
                  <AlertDescription>
                    Apply the latest Supabase migration, then reload this page. Technical detail: {loadError}
                  </AlertDescription>
                </Alert>
              )}

              {loading ? (
                <div className="space-y-3">
                  {[0, 1, 2].map((item) => <Skeleton key={item} className="h-36 w-full rounded-2xl" />)}
                </div>
              ) : filteredEvents.length === 0 && !loadError ? (
                <Card className="border-dashed border-border bg-card/70">
                  <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
                    <Clock3 className="h-10 w-10 text-muted-foreground" />
                    <div>
                      <h2 className="font-semibold">No changes found</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        New collection changes will appear here after History is enabled.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {filteredEvents.map((event) => {
                    const before = asSnapshot(event.before_data);
                    const after = asSnapshot(event.after_data);
                    const snapshot = after || before;
                    const details = actionDetails[event.action as keyof typeof actionDetails] || actionDetails.update;
                    const Icon = details.icon;
                    const visibleFields = event.changed_fields.filter((field) => !hiddenFields.has(field)).slice(0, 5);
                    const sprite = snapshot?.sprite_url || (snapshot?.pokemon_id
                      ? getPokemonSpriteUrl(snapshot.pokemon_id, {
                        shiny: true,
                        name: snapshot.form || snapshot.pokemon_name,
                        female: snapshot.gender === 'female',
                      })
                      : '/placeholder.svg');

                    return (
                      <Card key={event.id} className="overflow-hidden border-border bg-card shadow-lg">
                        <CardContent className="p-0">
                          <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
                            <div className="flex min-w-0 flex-1 items-center gap-4">
                              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted/40 p-2">
                                <img
                                  src={sprite}
                                  alt={snapshot?.pokemon_name || 'Pokémon'}
                                  className="h-full w-full object-contain [image-rendering:pixelated]"
                                  onError={(event) => { event.currentTarget.src = '/placeholder.svg'; }}
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h2 className="truncate text-lg font-bold">{snapshot?.pokemon_name || 'Unknown Pokémon'}</h2>
                                  <Badge variant="outline" className={cn('gap-1', details.className)}>
                                    <Icon className="h-3 w-3" />{details.label}
                                  </Badge>
                                </div>
                                {snapshot?.form && snapshot.form !== snapshot.pokemon_name && (
                                  <p className="truncate text-sm capitalize text-muted-foreground">{formatValue(snapshot.form)}</p>
                                )}
                                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock3 className="h-3 w-3" />{dateFormatter.format(new Date(event.created_at))}
                                </p>
                              </div>
                            </div>

                            {event.action !== 'restore' && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedEvent(event)}
                                className="shrink-0"
                              >
                                <RotateCcw className="h-4 w-4" />{getRestoreLabel(event.action)}
                              </Button>
                            )}
                          </div>

                          {event.action === 'update' && visibleFields.length > 0 && (
                            <div className="border-t border-border bg-muted/25 px-4 py-3 sm:px-5">
                              <div className="grid gap-2 sm:grid-cols-2">
                                {visibleFields.map((field) => (
                                  <div key={field} className="min-w-0 text-xs">
                                    <span className="font-semibold">{fieldLabels[field] || formatValue(field)}: </span>
                                    <span className="text-muted-foreground">
                                      {formatValue(before?.[field as keyof Snapshot])} → {formatValue(after?.[field as keyof Snapshot])}
                                    </span>
                                  </div>
                                ))}
                              </div>
                              {event.changed_fields.filter((field) => !hiddenFields.has(field)).length > visibleFields.length && (
                                <p className="mt-2 text-xs text-muted-foreground">Other fields were updated too.</p>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <AlertDialog open={Boolean(selectedEvent)} onOpenChange={(open) => !open && !restoring && setSelectedEvent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{selectedEvent ? getRestoreLabel(selectedEvent.action) : 'Restore version'}</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedEvent?.action === 'insert'
                ? 'This removes the Pokémon currently connected to this addition. Later edits to the same entry will also be removed.'
                : 'The current collection entry will be replaced with the version saved immediately before this event. This recovery will also be recorded in History.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={restoring}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(event) => { event.preventDefault(); void handleRestore(); }} disabled={restoring}>
              {restoring ? 'Restoring...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
