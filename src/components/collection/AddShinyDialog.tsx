import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { PokemonSelector } from '@/components/counter/PokemonSelector';
import { MethodSelector } from '@/components/counter/MethodSelector';
import { POKEBALLS, GAMES, HUNTING_METHODS, HuntingMethod, SHINY_CHARM_ICON } from '@/lib/pokemon-data';
import { getPokemonSpriteUrl } from '@/hooks/use-pokemon';

interface AddShinyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playlists: { id: string; name: string }[];
  onSuccess: () => void;
}

export function AddShinyDialog({ open, onOpenChange, playlists, onSuccess }: AddShinyDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Form state
  const [pokemonId, setPokemonId] = useState<number | null>(null);
  const [pokemonName, setPokemonName] = useState('');
  const [method, setMethod] = useState<HuntingMethod>(HUNTING_METHODS[0]);
  const [attempts, setAttempts] = useState(1);
  const [gender, setGender] = useState<string>('');
  const [pokeball, setPokeball] = useState('pokeball');
  const [game, setGame] = useState(GAMES[GAMES.length - 1].id);
  const [caughtDate, setCaughtDate] = useState(new Date().toISOString().split('T')[0]);
  const [hasShinyCharm, setHasShinyCharm] = useState(false);
  const [playlistId, setPlaylistId] = useState<string>('');
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setPokemonId(null);
    setPokemonName('');
    setMethod(HUNTING_METHODS[0]);
    setAttempts(1);
    setGender('');
    setPokeball('pokeball');
    setGame(GAMES[GAMES.length - 1].id);
    setCaughtDate(new Date().toISOString().split('T')[0]);
    setHasShinyCharm(false);
    setPlaylistId('');
    setNotes('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pokemonId || !pokemonName) {
      toast({
        variant: 'destructive',
        title: 'Please select a Pokémon',
      });
      return;
    }

    if (!user) {
      toast({
        variant: 'destructive',
        title: 'You must be logged in',
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('caught_shinies').insert({
        user_id: user.id,
        pokemon_id: pokemonId,
        pokemon_name: pokemonName,
        sprite_url: getPokemonSpriteUrl(pokemonId, { shiny: true }),
        attempts,
        method: method.id,
        gender: gender || null,
        pokeball,
        caught_date: caughtDate,
        game,
        has_shiny_charm: hasShinyCharm,
        playlist_id: playlistId || null,
        notes: notes || null,
      });

      if (error) throw error;

      toast({
        title: 'Shiny added!',
        description: `${pokemonName} has been added to your collection.`,
      });

      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error adding shiny',
        description: error.message || 'Unknown error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Shiny to Collection</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Pokemon Selector */}
          <div className="space-y-2">
            <Label>Pokémon *</Label>
            <PokemonSelector
              value={pokemonId}
              onChange={(id, name) => {
                setPokemonId(id);
                setPokemonName(name);
              }}
            />
          </div>

          {/* Method */}
          <div className="space-y-2">
            <Label>Method *</Label>
            <MethodSelector value={method.id} onChange={setMethod} />
          </div>

          {/* Attempts */}
          <div className="space-y-2">
            <Label>Number of Attempts</Label>
            <Input
              type="number"
              min={1}
              value={attempts}
              onChange={(e) => setAttempts(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <Label>Gender</Label>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger>
                <SelectValue placeholder="Select gender (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">♂ Male</SelectItem>
                <SelectItem value="female">♀ Female</SelectItem>
                <SelectItem value="genderless">⚪ Genderless</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Pokeball */}
          <div className="space-y-2">
            <Label>Poké Ball</Label>
            <Select value={pokeball} onValueChange={setPokeball}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {POKEBALLS.map((ball) => (
                  <SelectItem key={ball.id} value={ball.id}>
                    <div className="flex items-center gap-2">
                      <img src={ball.sprite} alt={ball.name} className="h-5 w-5 pokemon-sprite" />
                      <span>{ball.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Game */}
          <div className="space-y-2">
            <Label>Game</Label>
            <Select value={game} onValueChange={setGame}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GAMES.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
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
              value={caughtDate}
              onChange={(e) => setCaughtDate(e.target.value)}
            />
          </div>

          {/* Shiny Charm */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
            <div className="flex items-center gap-2">
              <img
                src={SHINY_CHARM_ICON}
                alt="Shiny Charm"
                className="h-6 w-6 pokemon-sprite"
              />
              <Label>Shiny Charm</Label>
            </div>
            <Switch checked={hasShinyCharm} onCheckedChange={setHasShinyCharm} />
          </div>

          {/* Playlist */}
          {playlists.length > 0 && (
            <div className="space-y-2">
              <Label>Playlist (optional)</Label>
              <Select value={playlistId} onValueChange={setPlaylistId}>
                <SelectTrigger>
                  <SelectValue placeholder="No playlist" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No playlist</SelectItem>
                  {playlists.map((playlist) => (
                    <SelectItem key={playlist.id} value={playlist.id}>
                      {playlist.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Shiny
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
