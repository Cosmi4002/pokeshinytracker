import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Filter, LogIn, List } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { findHuntingMethod, GAMES } from '@/lib/pokemon-data';
import { usePokemonList } from '@/hooks/use-pokemon';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { useRandomColor } from '@/lib/random-color-context';
import { AddShinyDialog } from '@/components/collection/AddShinyDialog';
import { CreatePlaylistDialog } from '@/components/collection/CreatePlaylistDialog';
import { ManagePlaylistsDialog } from '@/components/collection/ManagePlaylistsDialog';
import { EditShinyDialog } from '@/components/collection/EditShinyDialog';
import { SetEvolutionDialog } from '@/components/collection/SetEvolutionDialog';
import { ShinyCard } from '@/components/collection/ShinyCard';
import { useGlobalCollectionThemes } from '@/hooks/use-global-collection-themes';
import { isFormEliminated } from '@/lib/form-filters';
import { cn } from '@/lib/utils';
import type { Tables } from '@/integrations/supabase/types';

type CaughtShinyRow = Tables<'caught_shinies'>;
type PlaylistRow = Tables<'shiny_playlists'>;

type CollectionMode = 'obtained' | 'special' | 'distribution_event' | 'fail_uncatchable';
type CollectionSort = 'date_desc' | 'date_asc';
type DexOrder = 'none' | 'dex_asc' | 'dex_desc';
interface CollectionProps {
  mode?: CollectionMode;
}

export default function Collection({ mode = 'obtained' }: CollectionProps) {
  const { user, loading: authLoading } = useAuth();
  const { accentColor } = useRandomColor();
  const { pokemon } = usePokemonList();
  const { mergedThemes, effects } = useGlobalCollectionThemes();
  const { toast } = useToast();

  const [entries, setEntries] = useState<CaughtShinyRow[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isNewPlaylistDialogOpen, setIsNewPlaylistDialogOpen] = useState(false);
  const [isManagePlaylistsDialogOpen, setIsManagePlaylistsDialogOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<CaughtShinyRow | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [evolveEntry, setEvolveEntry] = useState<CaughtShinyRow | null>(null);
  const [isEvolveDialogOpen, setIsEvolveDialogOpen] = useState(false);

  // Filters
  const [filterGen, setFilterGen] = useState<string>('all');
  const [filterGame, setFilterGame] = useState<string>('all');
  const [filterMethod, setFilterMethod] = useState<string>('all');
  const [filterPlaylist, setFilterPlaylist] = useState<string>('all');
  const [sortBy, setSortBy] = useState<CollectionSort>('date_desc');
  const [dexOrder, setDexOrder] = useState<DexOrder>('none');
  const [searchQuery, setSearchQuery] = useState('');

  const normalize = (value: string | null | undefined) =>
    (value || '')
      .toLowerCase()
      .trim()
      .replace(/[()]/g, '')
      .replace(/\s+/g, '-')
      .replace(/_+/g, '-');

  const collectionLayoutClassName = useMemo(() => {
    return 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 xl:gap-5';
  }, []);
  const nativeSelectClassName =
    'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';

  const isAbortLikeError = (err: unknown) => {
    if (!err || typeof err !== 'object') return false;
    const maybe = err as { name?: string; message?: string };
    const name = (maybe.name || '').toLowerCase();
    const message = (maybe.message || '').toLowerCase();
    return name.includes('abort') || message.includes('aborted');
  };

  const fetchData = async () => {
    if (!user) {
      setEntries([]);
      setPlaylists([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [shiniesRes, playlistsRes] = await Promise.all([
        supabase.from('caught_shinies').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('shiny_playlists').select('*').eq('user_id', user.id),
      ]);

      if (shiniesRes.error) throw shiniesRes.error;
      if (playlistsRes.error) throw playlistsRes.error;

      setEntries((shiniesRes.data || []) as CaughtShinyRow[]);
      setPlaylists(playlistsRes.data || []);
    } catch (err: any) {
      if (isAbortLikeError(err)) {
        // Avoid noisy errors and avoid wiping UI for transient aborted requests.
        return;
      }
      toast({
        variant: 'destructive',
        title: 'Errore',
        description: err.message || 'Impossibile caricare i dati',
      });
      setEntries([]);
      setPlaylists([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.id]);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('caught_shinies').delete().eq('id', id).eq('user_id', user!.id);

      if (error) throw error;

      setEntries((prev) => prev.filter((e) => e.id !== id));
      toast({
        title: 'Eliminato',
        description: 'Pokémon rimosso dalla collezione',
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Errore',
        description: err.message || 'Impossibile eliminare',
      });
    }
  };

  const handleOpenEvolveDialog = (entry: CaughtShinyRow) => {
    setEvolveEntry(entry);
    setIsEvolveDialogOpen(true);
  };

  const playlistMap = useMemo(() => {
    const m: Record<string, string> = {};
    playlists.forEach((p) => (m[p.id] = p.name));
    return m;
  }, [playlists]);

  const pokemonByName = useMemo(() => {
    const m = new Map<string, any>();
    pokemon.forEach((p) => m.set(normalize(p.name), p));
    return m;
  }, [pokemon]);

  const pokemonByDisplayName = useMemo(() => {
    const m = new Map<string, any>();
    pokemon.forEach((p) => m.set(normalize(p.displayName), p));
    return m;
  }, [pokemon]);

  const pokemonById = useMemo(() => {
    const m = new Map<number, any[]>();
    pokemon.forEach((p) => {
      if (!m.has(p.id)) m.set(p.id, []);
      m.get(p.id)!.push(p);
    });
    return m;
  }, [pokemon]);

  const pokemonByBaseId = useMemo(() => {
    const m = new Map<number, any[]>();
    pokemon.forEach((p) => {
      const baseId = typeof p.baseId === 'number' ? p.baseId : p.id;
      if (!m.has(baseId)) m.set(baseId, []);
      m.get(baseId)!.push(p);
    });
    return m;
  }, [pokemon]);

  const resolveEntryPokemon = (entry: CaughtShinyRow) => {
    const formAliases: Record<string, string> = {
      // Gen 9 special forms: older saves / localized labels
      'maushold-famiglia-da-tre': 'maushold-family-of-three',
      'maushold-famiglia-da-quattro': 'maushold-family-of-four',
      'maushold-family-of-3': 'maushold-family-of-three',
      'maushold-family-of-4': 'maushold-family-of-four',
      'maushold-family-of-three': 'maushold-family-of-three',
      'maushold-family-of-four': 'maushold-family-of-four',
      'dudunsparce-trisegmento': 'dudunsparce-three-segment',
      'dudunsparce-three-segment': 'dudunsparce-three-segment',
    };

    const preferredBaseForms: Record<number, string> = {
      925: 'maushold-family-of-four',
      982: 'dudunsparce-three-segment',
    };

    const formSlug = normalize(entry.form);
    if (formSlug) {
      const canonical = formAliases[formSlug] || formSlug;
      const byForm = pokemonByName.get(canonical);
      if (byForm) return byForm;
    }

    const nameSlug = normalize(entry.pokemon_name);
    if (nameSlug) {
      // Some entries may have the form embedded in pokemon_name (localized display name).
      const canonicalFromName = formAliases[nameSlug];
      if (canonicalFromName) {
        const byAlias = pokemonByName.get(canonicalFromName);
        if (byAlias) return byAlias;
      }
      const byName = pokemonByName.get(nameSlug);
      if (byName) return byName;
      const byDisplay = pokemonByDisplayName.get(nameSlug);
      if (byDisplay) return byDisplay;
    }

    // Fallback: for some species the saved `pokemon_id` is the base form id (e.g. Maushold/Dudunsparce),
    // but we want to resolve a preferred variant when no explicit form is stored.
    const baseCandidates = pokemonByBaseId.get(entry.pokemon_id) || [];
    if (!formSlug && baseCandidates.length > 0) {
      const preferredName = preferredBaseForms[entry.pokemon_id];
      if (preferredName) {
        const preferred = baseCandidates.find((p) => p.name === preferredName);
        if (preferred) return preferred;
      }
    }

    const candidates = pokemonById.get(entry.pokemon_id) || [];
    if (candidates.length === 0) return baseCandidates[0];
    if (candidates.length === 1) return candidates[0];

    const byDisplay = candidates.find((p) => normalize(p.displayName) === nameSlug);
    if (byDisplay) return byDisplay;

    return candidates[0];
  };

  const scopedEntries = useMemo(() => {
    const method = (entry: CaughtShinyRow) => (entry.method || '').toString().trim().toLowerCase();
    const isDistributionEvent = (entry: CaughtShinyRow) => {
      const m = method(entry);
      return m === 'distribution/event' || m === 'event';
    };
    const isSpecial = (entry: CaughtShinyRow) => {
      const m = method(entry);
      return (
        m === 'static' ||
        m === 'overworld' ||
        m === 'game gift' ||
        m === 'game-gift' ||
        m === 'gift' ||
        m === 'static/overworld/game gift' ||
        m === 'static/overworld/game-gift' ||
        m === 'static overworld game gift'
      );
    };

    const isFailOrUncatchable = (entry: CaughtShinyRow) => !!entry.is_fail || !!entry.is_unobtainable;

    if (mode === 'obtained') {
      return entries.filter((e) => !isFailOrUncatchable(e) && !isSpecial(e) && !isDistributionEvent(e));
    }
    if (mode === 'special') return entries.filter((e) => !isFailOrUncatchable(e) && isSpecial(e));
    if (mode === 'distribution_event') return entries.filter((e) => !isFailOrUncatchable(e) && isDistributionEvent(e));
    return entries.filter((e) => isFailOrUncatchable(e));
  }, [entries, mode]);

  const getMethodFilterLabel = useCallback((rawMethod: string | null | undefined) => {
    const raw = (rawMethod || '').toString().trim();
    if (!raw) return '';

    const key = raw.toLowerCase();
    const method = findHuntingMethod(raw);
    return key === 'distribution/event' || key === 'event'
      ? 'Distribution / Event'
      : method?.name || raw;
  }, []);

  const methodOptions = useMemo(() => {
    const byLabel = new Map<string, string>();

    scopedEntries.forEach((entry) => {
      const label = getMethodFilterLabel(entry.method);
      if (!label) return;

      byLabel.set(normalize(label), label);
    });

    return [...byLabel.entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [getMethodFilterLabel, scopedEntries]);

  useEffect(() => {
    if (filterMethod === 'all') return;
    if (!methodOptions.some((method) => method.value === filterMethod)) {
      setFilterMethod('all');
    }
  }, [filterMethod, methodOptions]);

  const filteredEntries = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

      const toDayValue = (value?: string | null) => {
      if (!value) return Number.NaN;
      // Compare by calendar day (YYYY-MM-DD), ignoring time component.
      const day = value.slice(0, 10);
      // Use local timezone to avoid off-by-one-day when data is saved as date-only (YYYY-MM-DD).
      const parsed = new Date(`${day}T00:00:00`).getTime();
      return parsed;
    };

    return scopedEntries
      .filter((entry) => {
        if (entry.form && isFormEliminated(entry.form)) return false;
        const poke = resolveEntryPokemon(entry);
        if (query) {
          const haystack = [
            entry.pokemon_name,
            entry.form || '',
            poke?.displayName || '',
            poke?.name || '',
            String(entry.pokemon_id),
          ].join(' ').toLowerCase();
          if (!haystack.includes(query)) return false;
        }
        if (filterGen !== 'all') {
          if (!poke || poke.generation.toString() !== filterGen) return false;
        }
        if (filterGame !== 'all' && entry.game !== filterGame) return false;
        if (filterMethod !== 'all' && normalize(getMethodFilterLabel(entry.method)) !== filterMethod) return false;
        if (filterPlaylist !== 'all') {
          const plName = entry.playlist_id ? playlistMap[entry.playlist_id] : null;
          if (plName !== filterPlaylist) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const aPoke = resolveEntryPokemon(a);
        const bPoke = resolveEntryPokemon(b);
        const aDex = (aPoke?.baseId ?? a.pokemon_id) as number;
        const bDex = (bPoke?.baseId ?? b.pokemon_id) as number;

        const aDay = Number.isFinite(toDayValue(a.caught_date))
          ? toDayValue(a.caught_date)
          : toDayValue(a.created_at);
        const bDay = Number.isFinite(toDayValue(b.caught_date))
          ? toDayValue(b.caught_date)
          : toDayValue(b.created_at);

        const primary =
          dexOrder === 'dex_asc' ? aDex - bDex :
          dexOrder === 'dex_desc' ? bDex - aDex :
          sortBy === 'date_asc' ? aDay - bDay :
          bDay - aDay;
        if (primary !== 0) return primary;

        // Tie-break on same capture day:
        // - desc (recent -> old): newer added first
        // - asc  (old -> recent): older added first
        const aCreated = new Date(a.created_at).getTime();
        const bCreated = new Date(b.created_at).getTime();
        if (sortBy === 'date_asc') return aCreated - bCreated;
        if (sortBy === 'date_desc') return bCreated - aCreated;
        return bCreated - aCreated;
      });
  }, [scopedEntries, searchQuery, filterGen, filterGame, filterMethod, filterPlaylist, playlistMap, pokemonById, pokemonByName, pokemonByDisplayName, sortBy, dexOrder, getMethodFilterLabel]);

  if (authLoading || (user && loading)) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto py-8 px-4 flex justify-center items-center">
          <p className="text-muted-foreground">Caricamento...</p>
        </main>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-background transition-colors duration-1000 relative overflow-hidden"
      style={{
        backgroundImage: `radial-gradient(circle at 50% 0%, ${accentColor}15 0%, transparent 70%)`
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background: `
            radial-gradient(circle at 20% 0%, ${accentColor}18 0%, transparent 30%),
            radial-gradient(circle at 80% 10%, rgba(255,255,255,0.08) 0%, transparent 24%),
            radial-gradient(circle at 50% 100%, rgba(0,0,0,0.35) 0%, transparent 36%)
          `,
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(circle_at_center,black,transparent_82%)]" />
      <Navbar />
      <main className="relative z-10 container mx-auto py-8 px-4">
        <div className="space-y-6">
          {/* Login banner */}
          {!user && (
            <Card className="border-border bg-card text-card-foreground shadow-xl transition-all duration-500">
              <CardContent className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <LogIn className="h-10 w-10 text-muted-foreground" />
                  <div>
                    <h3 className="font-semibold">Accedi per salvare la tua collezione</h3>
                    <p className="text-sm text-muted-foreground">
                      Registrati o effettua il login per salvare i tuoi shiny nel cloud e averli su tutti i dispositivi.
                    </p>
                  </div>
                </div>
                <Link to="/auth">
                  <Button className="shadow-lg hover:shadow-xl transition-all duration-300">
                    Accedi / Registrati
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Header */}
          <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-6 text-card-foreground shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--muted)/0.45),transparent_34%),radial-gradient(circle_at_bottom_right,hsl(var(--muted)/0.28),transparent_30%)] pointer-events-none" />
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
                La mia collezione Shiny
              </h1>
              <div className="mt-3 flex flex-wrap justify-center md:justify-start gap-2">
                <Button variant="outline" size="sm" className={cn(mode === 'obtained' && 'bg-muted text-foreground')} asChild>
                  <Link to="/collection">Ottenuti</Link>
                </Button>
                <Button variant="outline" size="sm" className={cn(mode === 'special' && 'bg-muted text-foreground')} asChild>
                  <Link to="/collection/special">Static Overworld / Game Gift</Link>
                </Button>
                <Button variant="outline" size="sm" className={cn(mode === 'distribution_event' && 'bg-muted text-foreground')} asChild>
                  <Link to="/collection/events">Distribution / Event</Link>
                </Button>
                <Button variant="outline" size="sm" className={cn(mode === 'fail_uncatchable' && 'bg-muted text-foreground')} asChild>
                  <Link to="/collection/fail-uncatchable">Uncatchable / Fail</Link>
                </Button>
              </div>
              <p className="text-muted-foreground mt-1 font-medium">
                {filteredEntries.length} mostrati su {scopedEntries.length} shiny Pokemon
              </p>
            </div>

            {user && (
              <div className="flex flex-wrap justify-center gap-2 w-full md:w-auto">
                {playlists.length > 0 && (
                  <Button variant="outline" size="sm" onClick={() => setIsManagePlaylistsDialogOpen(true)} className="flex-1 sm:flex-none">
                    <List className="mr-2 h-4 w-4" />
                    Gestisci Playlist
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => setIsNewPlaylistDialogOpen(true)} className="flex-1 sm:flex-none">
                  <Plus className="mr-2 h-4 w-4" />
                  Nuova Playlist
                </Button>
                <Button className="shiny-glow w-full sm:w-auto" onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Aggiungi Shiny
                </Button>
              </div>
            )}
            {/* Dialoghi sempre montati per evitare problemi di scope con il bundler */}
            <ManagePlaylistsDialog
              open={isManagePlaylistsDialogOpen}
              onOpenChange={setIsManagePlaylistsDialogOpen}
              onSuccess={fetchData}
            />
            <CreatePlaylistDialog
              open={isNewPlaylistDialogOpen}
              onOpenChange={setIsNewPlaylistDialogOpen}
              onSuccess={fetchData}
            />
            <AddShinyDialog
              open={isAddDialogOpen}
              onOpenChange={setIsAddDialogOpen}
              playlists={playlists.map((p) => ({ id: p.id, name: p.name }))}
              onSuccess={fetchData}
            />
            <EditShinyDialog
              open={isEditDialogOpen}
              onOpenChange={(open) => {
                setIsEditDialogOpen(open);
                if (!open) setEditEntry(null);
              }}
              entry={editEntry}
              playlists={playlists.map((p) => ({ id: p.id, name: p.name }))}
              onSuccess={fetchData}
            />
            <SetEvolutionDialog
              open={isEvolveDialogOpen}
              onOpenChange={(open) => {
                setIsEvolveDialogOpen(open);
                if (!open) setEvolveEntry(null);
              }}
              entry={evolveEntry}
              onSuccess={fetchData}
            />
          </div>

          {/* Filters */}
          <Card className="border-border bg-card text-card-foreground shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                <div>
                  <Label>Cerca</Label>
                  <Input
                    placeholder="Cerca Pokémon..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Generazione</Label>
                  <select
                    value={filterGen}
                    onChange={(e) => setFilterGen(e.target.value)}
                    className={nativeSelectClassName}
                  >
                    <option value="all">Tutte</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((gen) => (
                        <option key={gen} value={gen.toString()}>
                          Gen {gen}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <Label>Gioco</Label>
                  <select
                    value={filterGame}
                    onChange={(e) => setFilterGame(e.target.value)}
                    className={nativeSelectClassName}
                  >
                      <option value="all">Tutti</option>
                      {GAMES.map((game) => (
                        <option key={game.id} value={game.id}>
                          {game.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <Label>Metodo</Label>
                  <select
                    value={filterMethod}
                    onChange={(e) => setFilterMethod(e.target.value)}
                    className={nativeSelectClassName}
                  >
                    <option value="all">Tutti</option>
                      {methodOptions.map((method) => (
                        <option key={method.value} value={method.value}>
                          {method.label}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <Label>Ordina</Label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as CollectionSort)}
                    className={nativeSelectClassName}
                  >
                    <option value="date_desc">Data: recenti -&gt; vecchi</option>
                    <option value="date_asc">Data: vecchi -&gt; recenti</option>
                  </select>
                </div>
                <div>
                  <Label>Pokédex</Label>
                  <select
                    value={dexOrder}
                    onChange={(e) => setDexOrder(e.target.value as DexOrder)}
                    className={nativeSelectClassName}
                  >
                    <option value="none">—</option>
                    <option value="dex_asc">Crescente</option>
                    <option value="dex_desc">Decrescente</option>
                  </select>
                </div>
                {playlists.length > 0 && (
                  <div>
                    <Label>Playlist</Label>
                    <select
                      value={filterPlaylist}
                      onChange={(e) => setFilterPlaylist(e.target.value)}
                      className={nativeSelectClassName}
                    >
                        <option value="all">Tutte</option>
                        {playlists.map((pl) => (
                          <option key={pl.id} value={pl.name}>
                            {pl.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Collection Grid */}
          {filteredEntries.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                {!user
                  ? 'Accedi per vedere e salvare la tua collezione.'
                  : scopedEntries.length === 0
                    ? mode === 'distribution_event'
                      ? 'Nessun shiny Distribution / Event ancora! Aggiungi una cattura con metodo “Distribution / Event”.'
                      : 'Nessuno shiny ancora! Inizia a cacciare e aggiungi le tue catture.'
                    : 'Nessuno shiny corrisponde ai filtri.'}
              </CardContent>
            </Card>
          ) : (
            <div className={cn(collectionLayoutClassName, 'items-stretch')}>
              {filteredEntries.map((entry) => {
                const resolved = resolveEntryPokemon(entry);
                return (
                  <ShinyCard
                    key={entry.id}
                    entry={entry}
                    themeOverride={mergedThemes[entry.game]}
                    secondaryThemeOverride={
                      (entry as any).secondary_game
                        ? mergedThemes[(entry as any).secondary_game]
                        : undefined
                    }
                    applyBlackEffect={effects.blackEffectEnabled}
                    spriteName={resolved?.name}
                    onEdit={() => {
                      setEditEntry(entry);
                      setIsEditDialogOpen(true);
                    }}
                    onDelete={() => handleDelete(entry.id)}
                    onToggleEvolved={() => handleOpenEvolveDialog(entry)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
