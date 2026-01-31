import { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Filter } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { HUNTING_METHODS, POKEBALLS, GAMES, SHINY_CHARM_ICON } from '@/lib/pokemon-data';
import { usePokemonList, getPokemonSpriteUrl } from '@/hooks/use-pokemon';
import { useToast } from '@/hooks/use-toast';

interface ShinyEntry {
  id: string;
  pokemonId: number;
  pokemonName: string;
  attempts: number;
  method: string;
  gender: 'male' | 'female' | 'genderless';
  pokeball: string;
  date: string;
  game: string;
  hasShinyCharm: boolean;
  playlist?: string;
}

export default function Collection() {
  const { pokemon } = usePokemonList();
  const { toast } = useToast();
  
  // Load from localStorage
  const [entries, setEntries] = useState<ShinyEntry[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem('shiny-collection');
    return saved ? JSON.parse(saved) : [];
  });

  const [playlists, setPlaylists] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem('shiny-playlists');
    return saved ? JSON.parse(saved) : [];
  });

  // Save to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('shiny-collection', JSON.stringify(entries));
    }
  }, [entries]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('shiny-playlists', JSON.stringify(playlists));
    }
  }, [playlists]);

  // Filters
  const [filterGen, setFilterGen] = useState<string>('all');
  const [filterGame, setFilterGame] = useState<string>('all');
  const [filterPlaylist, setFilterPlaylist] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isNewPlaylistDialogOpen, setIsNewPlaylistDialogOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  // Form state
  const [formData, setFormData] = useState<Partial<ShinyEntry>>({
    attempts: 0,
    method: HUNTING_METHODS[0].id,
    gender: 'genderless',
    pokeball: POKEBALLS[0].id,
    date: new Date().toISOString().split('T')[0],
    game: GAMES[0].id,
    hasShinyCharm: false,
  });

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      // Search filter
      if (searchQuery && !entry.pokemonName.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Generation filter
      if (filterGen !== 'all') {
        const poke = pokemon.find(p => p.id === entry.pokemonId);
        if (poke && poke.generation.toString() !== filterGen) return false;
      }

      // Game filter
      if (filterGame !== 'all' && entry.game !== filterGame) {
        return false;
      }

      // Playlist filter
      if (filterPlaylist !== 'all' && entry.playlist !== filterPlaylist) {
        return false;
      }

      return true;
    });
  }, [entries, searchQuery, filterGen, filterGame, filterPlaylist, pokemon]);

  const handleAddEntry = () => {
    if (!formData.pokemonId || !formData.pokemonName) {
      toast({
        title: "Error",
        description: "Please select a Pokémon",
        variant: "destructive",
      });
      return;
    }

    const newEntry: ShinyEntry = {
      id: Date.now().toString(),
      pokemonId: formData.pokemonId!,
      pokemonName: formData.pokemonName!,
      attempts: formData.attempts || 0,
      method: formData.method || HUNTING_METHODS[0].id,
      gender: formData.gender || 'genderless',
      pokeball: formData.pokeball || POKEBALLS[0].id,
      date: formData.date || new Date().toISOString().split('T')[0],
      game: formData.game || GAMES[0].id,
      hasShinyCharm: formData.hasShinyCharm || false,
      playlist: formData.playlist,
    };

    setEntries([newEntry, ...entries]);
    setFormData({
      attempts: 0,
      method: HUNTING_METHODS[0].id,
      gender: 'genderless',
      pokeball: POKEBALLS[0].id,
      date: new Date().toISOString().split('T')[0],
      game: GAMES[0].id,
      hasShinyCharm: false,
    });
    setIsAddDialogOpen(false);
    
    toast({
      title: "Success!",
      description: `Added ${formData.pokemonName} to your collection!`,
    });
  };

  const handleDeleteEntry = (id: string) => {
    setEntries(entries.filter(e => e.id !== id));
    toast({
      title: "Deleted",
      description: "Entry removed from collection",
    });
  };

  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) return;
    if (playlists.includes(newPlaylistName)) {
      toast({
        title: "Error",
        description: "Playlist already exists",
        variant: "destructive",
      });
      return;
    }
    
    setPlaylists([...playlists, newPlaylistName]);
    setNewPlaylistName('');
    setIsNewPlaylistDialogOpen(false);
    
    toast({
      title: "Success!",
      description: `Created playlist: ${newPlaylistName}`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto py-8 px-4">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold shiny-text">My Shiny Collection</h1>
              <p className="text-muted-foreground">
                {entries.length} shiny Pokémon caught
              </p>
            </div>
            
            <div className="flex gap-2">
              <Dialog open={isNewPlaylistDialogOpen} onOpenChange={setIsNewPlaylistDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    New Playlist
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Playlist</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Playlist Name</Label>
                      <Input
                        value={newPlaylistName}
                        onChange={(e) => setNewPlaylistName(e.target.value)}
                        placeholder="e.g., Legendary Hunts"
                      />
                    </div>
                    <Button onClick={handleCreatePlaylist} className="w-full">
                      Create
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="shiny-glow">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Shiny
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add Shiny to Collection</DialogTitle>
                  </DialogHeader>
                  
                  <div className="grid gap-4 py-4">
                    {/* Pokemon Selector */}
                    <div className="space-y-2">
                      <Label>Pokémon *</Label>
                      <Select
                        value={formData.pokemonId?.toString()}
                        onValueChange={(value) => {
                          const poke = pokemon.find(p => p.id === parseInt(value));
                          setFormData({
                            ...formData,
                            pokemonId: parseInt(value),
                            pokemonName: poke?.displayName || '',
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Pokémon" />
                        </SelectTrigger>
                        <SelectContent className="max-h-64">
                          {pokemon.map((p) => (
                            <SelectItem key={p.id} value={p.id.toString()}>
                              #{p.id.toString().padStart(4, '0')} {p.displayName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Attempts */}
                    <div className="space-y-2">
                      <Label>Number of Attempts</Label>
                      <Input
                        type="number"
                        value={formData.attempts}
                        onChange={(e) => setFormData({ ...formData, attempts: parseInt(e.target.value) || 0 })}
                      />
                    </div>

                    {/* Method */}
                    <div className="space-y-2">
                      <Label>Hunting Method</Label>
                      <Select
                        value={formData.method}
                        onValueChange={(value) => setFormData({ ...formData, method: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-64">
                          {HUNTING_METHODS.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Gender */}
                    <div className="space-y-2">
                      <Label>Gender</Label>
                      <Select
                        value={formData.gender}
                        onValueChange={(value: any) => setFormData({ ...formData, gender: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">♂ Male</SelectItem>
                          <SelectItem value="female">♀ Female</SelectItem>
                          <SelectItem value="genderless">- Genderless</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Pokeball */}
                    <div className="space-y-2">
                      <Label>Pokéball Used</Label>
                      <Select
                        value={formData.pokeball}
                        onValueChange={(value) => setFormData({ ...formData, pokeball: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-64">
                          {POKEBALLS.map((ball) => (
                            <SelectItem key={ball.id} value={ball.id}>
                              <div className="flex items-center gap-2">
                                <img src={ball.sprite} alt={ball.name} className="h-5 w-5" />
                                {ball.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Date */}
                    <div className="space-y-2">
                      <Label>Date Caught</Label>
                      <Input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      />
                    </div>

                    {/* Game */}
                    <div className="space-y-2">
                      <Label>Game</Label>
                      <Select
                        value={formData.game}
                        onValueChange={(value) => setFormData({ ...formData, game: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-64">
                          {GAMES.map((game) => (
                            <SelectItem key={game.id} value={game.id}>
                              {game.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Playlist */}
                    {playlists.length > 0 && (
                      <div className="space-y-2">
                        <Label>Playlist (Optional)</Label>
                        <Select
                          value={formData.playlist}
                          onValueChange={(value) => setFormData({ ...formData, playlist: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="None" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {playlists.map((pl) => (
                              <SelectItem key={pl} value={pl}>
                                {pl}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Shiny Charm */}
                    <div className="flex items-center space-x-2 p-3 rounded-lg bg-muted">
                      <Checkbox
                        id="shiny-charm"
                        checked={formData.hasShinyCharm}
                        onCheckedChange={(checked) => 
                          setFormData({ ...formData, hasShinyCharm: checked as boolean })
                        }
                      />
                      <div className="flex items-center gap-2">
                        <img
                          src={SHINY_CHARM_ICON}
                          alt="Shiny Charm"
                          className="h-6 w-6"
                        />
                        <Label htmlFor="shiny-charm">Had Shiny Charm</Label>
                      </div>
                    </div>
                  </div>

                  <Button onClick={handleAddEntry} className="w-full">
                    Add to Collection
                  </Button>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label>Search</Label>
                  <Input
                    placeholder="Search Pokémon..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label>Generation</Label>
                  <Select value={filterGen} onValueChange={setFilterGen}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Gens</SelectItem>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((gen) => (
                        <SelectItem key={gen} value={gen.toString()}>
                          Gen {gen}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Game</Label>
                  <Select value={filterGame} onValueChange={setFilterGame}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      <SelectItem value="all">All Games</SelectItem>
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
                        <SelectItem value="all">All Playlists</SelectItem>
                        {playlists.map((pl) => (
                          <SelectItem key={pl} value={pl}>
                            {pl}
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
                {entries.length === 0 
                  ? "No shinies yet! Start hunting and add your catches here." 
                  : "No shinies match your filters."}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEntries.map((entry) => {
                const method = HUNTING_METHODS.find(m => m.id === entry.method);
                const pokeball = POKEBALLS.find(b => b.id === entry.pokeball);
                const game = GAMES.find(g => g.id === entry.game);
                
                return (
                  <Card key={entry.id} className="group hover:border-primary transition-colors">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={getPokemonSpriteUrl(entry.pokemonId, { shiny: true })}
                            alt={entry.pokemonName}
                            className="h-16 w-16 pokemon-sprite"
                          />
                          <div>
                            <h3 className="font-semibold text-lg">{entry.pokemonName}</h3>
                            <p className="text-sm text-muted-foreground">
                              #{entry.pokemonId.toString().padStart(4, '0')}
                            </p>
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Attempts:</span>
                          <span className="font-semibold">{entry.attempts.toLocaleString()}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Method:</span>
                          <span className="font-semibold text-xs">{method?.name}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Gender:</span>
                          <span className="font-semibold">
                            {entry.gender === 'male' ? '♂' : entry.gender === 'female' ? '♀' : '-'}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Ball:</span>
                          <div className="flex items-center gap-1">
                            {pokeball && (
                              <img src={pokeball.sprite} alt={pokeball.name} className="h-5 w-5" />
                            )}
                            <span className="font-semibold text-xs">{pokeball?.name}</span>
                          </div>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Date:</span>
                          <span className="font-semibold">
                            {new Date(entry.date).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Game:</span>
                          <span className="font-semibold text-xs">{game?.name}</span>
                        </div>
                        
                        {entry.hasShinyCharm && (
                          <div className="flex items-center justify-center gap-2 pt-2 border-t">
                            <img src={SHINY_CHARM_ICON} alt="Shiny Charm" className="h-5 w-5" />
                            <span className="text-xs font-semibold">Shiny Charm</span>
                          </div>
                        )}
                        
                        {entry.playlist && (
                          <div className="pt-2 border-t">
                            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                              {entry.playlist}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
