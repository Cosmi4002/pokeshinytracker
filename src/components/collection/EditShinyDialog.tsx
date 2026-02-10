import { useState, useMemo, useEffect } from 'react';
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
import { getPokemonSpriteUrl, formatPokemonName } from '@/hooks/use-pokemon';
import { usePokemonDetails } from '@/hooks/use-pokemon';
import type { Tables } from '@/integrations/supabase/types';

type CaughtShinyRow = Tables<'caught_shinies'>;

interface EditShinyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: CaughtShinyRow | null;
  playlists: { id: string; name: string }[];
  onSuccess: () => void;
}

export function EditShinyDialog({ open, onOpenChange, entry, playlists, onSuccess }: EditShinyDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [pokemonId, setPokemonId] = useState<number | null>(null);
  const [pokemonName, setPokemonName] = useState('');
  const [form, setForm] = useState('');
  const [gender, setGender] = useState<string>('');
  const [hasShinyCharm, setHasShinyCharm] = useState(false);
  const [pokeball, setPokeball] = useState('pokeball');
  const [game, setGame] = useState('');
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
    // getPokemonSpriteUrl handles prepending ID
    return getPokemonSpriteUrl(pokemonId, {
      shiny: true,
      female: gender === 'female',
      form: form || undefined,
      name: pokemonName,
    });
  }, [pokemonId, gender, form, pokemonName]);

  useEffect(() => {
    if (open && entry) {
      setPokemonId(entry.pokemon_id);
      setPokemonName(entry.pokemon_name);
      setForm(entry.form ?? '');
      setGender(entry.gender ?? '');
      setHasShinyCharm(entry.has_shiny_charm ?? false);
      setPokeball(entry.pokeball ?? 'pokeball');
      setGame(entry.game);
      const m = HUNTING_METHODS.find((x) => x.id === entry.method) ?? HUNTING_METHODS[0];
      setMethod(m);
      setAttempts(entry.attempts ?? 1);
      setHuntStartDate(entry.hunt_start_date ?? '');
      setCaughtDate(entry.caught_date ?? new Date().toISOString().split('T')[0]);
      setIsFail(entry.is_fail ?? false);
      setPlaylistId(entry.playlist_id ?? '');
      setNotes(entry.notes ?? '');
    }
  }, [open, entry]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entry || !user) return;
    if (!pokemonId || !pokemonName) {
      toast({ variant: 'destructive', title: 'Seleziona un Pokémon' });
      return;
    }
    if (!game) {
      toast({ variant: 'destructive', title: 'Seleziona il gioco' });
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

      // Calculate the final display name (e.g. "Silvally Bug")
      const finalDisplayName = form
        ? formOptions.find(f => f.formName.replace(/^[^-]+-/, '') === form)?.displayName || formatPokemonName(pokemonName, pokemonId)
        : formatPokemonName(pokemonName, pokemonId);

      const { error } = await supabase
        .from('caught_shinies')
        .update({
          pokemon_id: pokemonId,
          pokemon_name: finalDisplayName,
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
        })
        .eq('id', entry.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Modifiche salvate',
        description: `${formatPokemonName(pokemonName, pokemonId)} è stato aggiornato nella collezione.`,
      });
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Errore',
        description: error.message || 'Impossibile salvare le modifiche.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!entry) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifica shiny in collezione</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Sprite */}
          {pokemonId && (
            <div className="flex justify-center p-4 bg-muted rounded-lg">
              <img
                src={spriteUrl}
                alt={pokemonName}
                className="h-24 w-24 pokemon-sprite object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                }}
              />
            </div>
          )}

          {/* 2. Pokémon */}
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

          {/* 3. Forma */}
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
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger>
                <SelectValue placeholder="Opzionale" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">♂ Maschio</SelectItem>
                <SelectItem value="female">♀ Femmina</SelectItem>
                <SelectItem value="genderless">⚪ Senza genere</SelectItem>
              </SelectContent>
            </Select>
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
            <Label>Gioco *</Label>
            <Select value={game} onValueChange={setGame}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona gioco" />
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

          {/* 10. Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data inizio caccia</Label>
              <Input type="date" value={huntStartDate} onChange={(e) => setHuntStartDate(e.target.value)} />
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
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Note..." />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salva modifiche
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
