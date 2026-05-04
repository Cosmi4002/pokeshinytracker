import { useState, useEffect, useMemo } from 'react';
import { Plus, Filter, LogIn, List } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GAMES } from '@/lib/pokemon-data';
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
import { useUserPreferences } from '@/hooks/use-user-preferences';
import { cn } from '@/lib/utils';
import type { Tables } from '@/integrations/supabase/types';

type CaughtShinyRow = Tables<'caught_shinies'>;
type PlaylistRow = Tables<'shiny_playlists'>;

type CollectionMode = 'obtained' | 'static' | 'overworld' | 'game_gift' | 'distribution_event';
type CollectionSort = 'date_desc' | 'date_asc' | 'dex_asc' | 'dex_desc';
interface CollectionProps {
  mode?: CollectionMode;
}

export default function Collection({ mode = 'obtained' }: CollectionProps) {
  const { user, loading: authLoading } = useAuth();
  const { accentColor } = useRandomColor();
  const { pokemon } = usePokemonList();
  const { mergedThemes, effects } = useGlobalCollectionThemes();
  const { preferences } = useUserPreferences();
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
  const [filterPlaylist, setFilterPlaylist] = useState<string>('all');
  const [sortBy, setSortBy] = useState<CollectionSort>('date_desc');
  const [searchQuery, setSearchQuery] = useState('');

  const normalize = (value: string | null | undefined) =>
    (value || '')
      .toLowerCase()
      .trim()
      .replace(/[()]/g, '')
      .replace(/\s+/g, '-')
      .replace(/_+/g, '-');

  const collectionLayoutStyle = preferences?.layout_style || 'grid';
  const collectionLayoutClassName = useMemo(() => {
    if (collectionLayoutStyle === 'list') {
      return 'flex flex-col gap-4';
    }
    if (collectionLayoutStyle === 'compact') {
      return 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 xl:grid-cols-7 gap-3';
    }
    return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4';
  }, [collectionLayoutStyle]);

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

  const resolveEntryPokemon = (entry: CaughtShinyRow) => {
    const formSlug = normalize(entry.form);
    if (formSlug) {
      const byForm = pokemonByName.get(formSlug);
      if (byForm) return byForm;
    }

    const nameSlug = normalize(entry.pokemon_name);
    if (nameSlug) {
      const byName = pokemonByName.get(nameSlug);
      if (byName) return byName;
      const byDisplay = pokemonByDisplayName.get(nameSlug);
      if (byDisplay) return byDisplay;
    }

    const candidates = pokemonById.get(entry.pokemon_id) || [];
    if (candidates.length === 0) return undefined;
    if (candidates.length === 1) return candidates[0];

    const byDisplay = candidates.find((p) => normalize(p.displayName) === nameSlug);
    if (byDisplay) return byDisplay;

    return candidates[0];
  };

  const scopedEntries = useMemo(() => {
    const method = (entry: CaughtShinyRow) => (entry.method || '').toString().trim().toLowerCase();

    if (mode === 'obtained') return entries.filter((e) => !e.is_fail && !e.is_unobtainable);
    if (mode === 'static') return entries.filter((e) => method(e) === 'static');
    if (mode === 'overworld') return entries.filter((e) => method(e) === 'overworld');
    if (mode === 'game_gift') return entries.filter((e) => method(e) === 'game gift' || method(e) === 'game-gift' || method(e) === 'gift');
    return entries.filter((e) => method(e) === 'distribution/event' || method(e) === 'event');
  }, [entries, mode]);

  const filteredEntries = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    const toDayValue = (value?: string | null) => {
      if (!value) return Number.NaN;
      // Compare by calendar day (YYYY-MM-DD), ignoring time component.
      const day = value.slice(0, 10);
      const parsed = new Date(`${day}T00:00:00Z`).getTime();
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
          sortBy === 'date_desc' ? bDay - aDay :
          sortBy === 'date_asc' ? aDay - bDay :
          sortBy === 'dex_asc' ? aDex - bDex :
          bDex - aDex;
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
  }, [scopedEntries, searchQuery, filterGen, filterGame, filterPlaylist, playlistMap, pokemonById, pokemonByName, pokemonByDisplayName, sortBy]);

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
      className="min-h-screen bg-background transition-colors duration-1000"
      style={{
        backgroundImage: `radial-gradient(circle at 50% 0%, ${accentColor}15 0%, transparent 70%)`
      }}
    >
      <Navbar />
      <main className="container mx-auto py-8 px-4">
        <div className="space-y-6">
          {/* Login banner */}
          {!user && (
            <Card
              className="border-primary/50 bg-primary/5 transition-all duration-500"
              style={{
                borderColor: accentColor,
                boxShadow: `0 0 20px ${accentColor}20`
              }}
            >
              <CardContent className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <LogIn className="h-10 w-10 text-primary" />
                  <div>
                    <h3 className="font-semibold">Accedi per salvare la tua collezione</h3>
                    <p className="text-sm text-muted-foreground">
                      Registrati o effettua il login per salvare i tuoi shiny nel cloud e averli su tutti i dispositivi.
                    </p>
                  </div>
                </div>
                <Link to="/auth">
                  <Button
                    className="shadow-lg hover:shadow-xl transition-all duration-300"
                    style={{
                      backgroundColor: accentColor,
                      boxShadow: `0 0 15px ${accentColor}60`
                    }}
                  >
                    Accedi / Registrati
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
            <div>
              <h1
                className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r"
                style={{
                  backgroundImage: `linear-gradient(to right, ${accentColor}, color-mix(in srgb, ${accentColor}, white 30%))`
                }}
              >
                La mia collezione Shiny
              </h1>
              <div className="mt-3 flex flex-wrap justify-center md:justify-start gap-2">
                <Button variant={mode === 'obtained' ? 'default' : 'outline'} size="sm" asChild>
                  <Link to="/collection">Ottenuti</Link>
                </Button>
                <Button variant={mode === 'static' ? 'default' : 'outline'} size="sm" asChild>
                  <Link to="/collection/static">Static</Link>
                </Button>
                <Button variant={mode === 'overworld' ? 'default' : 'outline'} size="sm" asChild>
                  <Link to="/collection/overworld">Overworld</Link>
                </Button>
                <Button variant={mode === 'game_gift' ? 'default' : 'outline'} size="sm" asChild>
                  <Link to="/collection/game-gift">Game Gift</Link>
                </Button>
                <Button variant={mode === 'distribution_event' ? 'default' : 'outline'} size="sm" asChild>
                  <Link to="/collection/events">Distribution / Event</Link>
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
                  <Select value={filterGen} onValueChange={setFilterGen}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutte</SelectItem>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((gen) => (
                        <SelectItem key={gen} value={gen.toString()}>
                          Gen {gen}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Gioco</Label>
                  <Select value={filterGame} onValueChange={setFilterGame}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-72 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-muted/20 [&::-webkit-scrollbar-thumb]:bg-primary/40 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-primary/60">
                      <SelectItem value="all">Tutti</SelectItem>
                      {GAMES.map((game) => (
                        <SelectItem key={game.id} value={game.id}>
                          {game.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Ordina</Label>
                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as CollectionSort)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date_desc">Data: recenti -&gt; vecchi</SelectItem>
                      <SelectItem value="date_asc">Data: vecchi -&gt; recenti</SelectItem>
                      <SelectItem value="dex_asc">Pokédex: crescente</SelectItem>
                      <SelectItem value="dex_desc">Pokédex: decrescente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {playlists.length > 0 && (
                  <div>
                    <Label>Playlist</Label>
                    <Select value={filterPlaylist} onValueChange={setFilterPlaylist}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tutte</SelectItem>
                        {playlists.map((pl) => (
                          <SelectItem key={pl.id} value={pl.name}>
                            {pl.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
            <div className={cn(collectionLayoutClassName)}>
              {filteredEntries.map((entry) => {
                const resolved = resolveEntryPokemon(entry);
                return (
                <ShinyCard
                  key={entry.id}
                  entry={entry}
                  themeOverride={mergedThemes[entry.game]}
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
