import { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Filter, LogIn, List } from 'lucide-react';
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
import { ShinyCard } from '@/components/collection/ShinyCard';
import type { Tables } from '@/integrations/supabase/types';

type CaughtShinyRow = Tables<'caught_shinies'>;
type PlaylistRow = Tables<'shiny_playlists'>;

export default function Collection() {
  const { user, loading: authLoading } = useAuth();
  const { accentColor } = useRandomColor();
  const { pokemon } = usePokemonList();
  const { toast } = useToast();

  const [entries, setEntries] = useState<CaughtShinyRow[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isNewPlaylistDialogOpen, setIsNewPlaylistDialogOpen] = useState(false);
  const [isManagePlaylistsDialogOpen, setIsManagePlaylistsDialogOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<CaughtShinyRow | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Filters
  const [filterGen, setFilterGen] = useState<string>('all');
  const [filterGame, setFilterGame] = useState<string>('all');
  const [filterPlaylist, setFilterPlaylist] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

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

      setEntries(shiniesRes.data || []);
      setPlaylists(playlistsRes.data || []);
    } catch (err: any) {
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

  const playlistMap = useMemo(() => {
    const m: Record<string, string> = {};
    playlists.forEach((p) => (m[p.id] = p.name));
    return m;
  }, [playlists]);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (searchQuery && !entry.pokemon_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterGen !== 'all') {
        const poke = pokemon.find((p) => p.id === entry.pokemon_id);
        if (poke && poke.generation.toString() !== filterGen) return false;
      }
      if (filterGame !== 'all' && entry.game !== filterGame) return false;
      if (filterPlaylist !== 'all') {
        const plName = entry.playlist_id ? playlistMap[entry.playlist_id] : null;
        if (plName !== filterPlaylist) return false;
      }
      return true;
    });
  }, [entries, searchQuery, filterGen, filterGame, filterPlaylist, pokemon, playlistMap]);

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
              <p className="text-muted-foreground mt-1 font-medium">
                {entries.length} shiny Pokémon catturati
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    <SelectContent className="max-h-64">
                      <SelectItem value="all">Tutti</SelectItem>
                      {GAMES.map((game) => (
                        <SelectItem key={game.id} value={game.id}>
                          {game.name}
                        </SelectItem>
                      ))}
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
                  : entries.length === 0
                    ? 'Nessuno shiny ancora! Inizia a cacciare e aggiungi le tue catture.'
                    : 'Nessuno shiny corrisponde ai filtri.'}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredEntries.map((entry) => (
                <ShinyCard
                  key={entry.id}
                  entry={entry}
                  onEdit={() => {
                    setEditEntry(entry);
                    setIsEditDialogOpen(true);
                  }}
                  onDelete={() => handleDelete(entry.id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
