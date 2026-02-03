import { useState, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { GenderSelector } from '@/components/ui/GenderSelector';
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
import { usePokemonDetails } from '@/hooks/use-pokemon';

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

  const [pokemonId, setPokemonId] = useState<number | null>(null);
  const [pokemonName, setPokemonName] = useState('');
  const [form, setForm] = useState('');
  const [gender, setGender] = useState<string>('');
  const [hasShinyCharm, setHasShinyCharm] = useState(false);
  const [pokeball, setPokeball] = useState('pokeball');
  const [game, setGame] = useState(GAMES[GAMES.length - 1].id);
  const [method, setMethod] = useState<HuntingMethod>(HUNTING_METHODS[0]);
  const [attempts, setAttempts] = useState(1);
  const [huntStartDate, setHuntStartDate] = useState('');
  const [caughtDate, setCaughtDate] = useState(new Date().toISOString().split('T')[0]);
  const [isFail, setIsFail] = useState(false);
  const [playlistId, setPlaylistId] = useState<string>('');
  const [notes, setNotes] = useState('');

  const { pokemon: pokemonDetails } = usePokemonDetails(pokemonId);
  const formOptions = useMemo(() => pokemonDetails?.forms ?? [], [pokemonDetails]);

  const spriteUrl = useMemo(() => {
    if (!pokemonId) return '';
    const formSuffix = form ? `${pokemonId}-${form}` : undefined;
    return getPokemonSpriteUrl(pokemonId, {
      shiny: true,
      female: gender === 'female',
      form: formSuffix,
      name: pokemonName,
    });
  }, [pokemonId, gender, form, pokemonName]);

  const resetFormState = () => {
    setPokemonId(null);
    setPokemonName('');
    setForm('');
    setGender('');
    setHasShinyCharm(false);
    setPokeball('pokeball');
    setGame(GAMES[GAMES.length - 1].id);
    setMethod(HUNTING_METHODS[0]);
    setAttempts(1);
    setHuntStartDate('');
    setCaughtDate(new Date().toISOString().split('T')[0]);
    setIsFail(false);
    setPlaylistId('');
    setNotes('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pokemonId || !pokemonName) {
      toast({ variant: 'destructive', title: 'Seleziona un Pokémon' });
      return;
    }
    if (!user) {
      toast({ variant: 'destructive', title: 'Devi essere loggato' });
      return;
    }

    setLoading(true);
    try {
      const finalSpriteUrl =
        spriteUrl ||
        getPokemonSpriteUrl(pokemonId, {
          shiny: true,
          female: gender === 'female',
          form: form ? `${pokemonId}-${form}` : undefined,
          name: pokemonName,
        });

      const { error } = await supabase.from('caught_shinies').insert({
        user_id: user.id,
        pokemon_id: pokemonId,
        pokemon_name: pokemonName,
        sprite_url: finalSpriteUrl,
        form: form || null,
        gender: gender || null,
        has_shiny_charm: hasShinyCharm,
        pokeball,
        game,
        method: method.id,
        attempts,
        hunt_start_date: huntStartDate || null,
        caught_date: caughtDate,
        is_fail: isFail,
        playlist_id: playlistId || null,
        notes: notes || null,
      });

      if (error) throw error;

      toast({
        title: 'Shiny aggiunto!',
        description: `${pokemonName} è stato aggiunto alla collezione.`,
      });
      resetFormState();
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Errore',
        description: error.message || 'Impossibile aggiungere lo shiny.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Aggiungi Shiny alla collezione</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Sprite preview (cambia con sesso/form) */}
          {pokemonId && (
            <div className="flex justify-center p-4 bg-muted rounded-lg">
              <img
                src={spriteUrl}
                alt={pokemonName}
                className="h-24 w-24 pokemon-sprite object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getPokemonSpriteUrl(pokemonId, { shiny: true });
                }}
              />
            </div>
          )}

          {/* 2. Pokémon con nome */}
          <div className="space-y-2">
            <Label>Pokémon *</Label>
            <PokemonSelector
              value={pokemonId}
              onChange={(id, name) => {
                setPokemonId(id);
                setPokemonName(name);
                setForm('');
              }}
            />
          </div>

          {/* 3. Form (opzionale, per Deerling, Pikachu, ecc.) */}
          {formOptions.length > 0 && (
            <div className="space-y-2">
              <Label>Forma / variante</Label>
              <Select value={form || 'default'} onValueChange={(v) => setForm(v === 'default' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Forma base" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Forma base</SelectItem>
                  {formOptions.map((f) => (
                    <SelectItem key={f.id} value={f.formName.replace(/^[^-]+-/, '')}>
                      {f.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 4. Sesso */}
          <div className="space-y-2">
            <Label>Sesso</Label>
            <GenderSelector value={gender} onChange={setGender} />
          </div>

          {/* 5. Shiny Charm */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
            <div className="flex items-center gap-2">
              <img src={SHINY_CHARM_ICON} alt="Shiny Charm" className="h-6 w-6 pokemon-sprite" />
              <Label>Shiny Charm</Label>
            </div>
            <Switch checked={hasShinyCharm} onCheckedChange={setHasShinyCharm} />
          </div>

          {/* 6. Poké Ball */}
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

          {/* 7. Gioco */}
          <div className="space-y-2">
            <Label>Gioco</Label>
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

          {/* 8. Metodo */}
          <div className="space-y-2">
            <Label>Metodo *</Label>
            <MethodSelector value={method.id} onChange={setMethod} />
          </div>

          {/* 9. Counter */}
          <div className="space-y-2">
            <Label>Numero tentativi (counter)</Label>
            <Input
              type="number"
              min={1}
              value={attempts}
              onChange={(e) => setAttempts(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>

          {/* 10. Data inizio e fine */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data inizio caccia</Label>
              <Input
                type="date"
                value={huntStartDate}
                onChange={(e) => setHuntStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Data cattura *</Label>
              <Input type="date" value={caughtDate} onChange={(e) => setCaughtDate(e.target.value)} />
            </div>
          </div>

          {/* 11. FAIL */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-destructive/30 bg-destructive/5">
            <Label>FAIL (caccia fallita / phase)</Label>
            <Switch checked={isFail} onCheckedChange={setIsFail} />
          </div>

          {/* 12. Playlist */}
          {playlists.length > 0 && (
            <div className="space-y-2">
              <Label>Playlist (opzionale)</Label>
              <Select value={playlistId || 'none'} onValueChange={(val) => setPlaylistId(val === 'none' ? '' : val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Nessuna playlist" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nessuna playlist</SelectItem>
                  {playlists.map((playlist) => (
                    <SelectItem key={playlist.id} value={playlist.id}>
                      {playlist.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 13. Note */}
          <div className="space-y-2">
            <Label>Note (opzionale)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Note aggiuntive..."
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Aggiungi Shiny
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
