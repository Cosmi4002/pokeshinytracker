import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  DialogDescription,
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
import { POKEBALLS, GAMES, HUNTING_METHODS, HuntingMethod, SHINY_CHARM_ICON, getPokemonSpriteUrl } from '@/lib/pokemon-data';
import { usePokemonDetails, formatPokemonName } from '@/hooks/use-pokemon';
import { MethodSelector } from '@/components/counter/MethodSelector';

interface FinishHuntDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  huntId: string;
  pokemonId: number;
  pokemonName: string;
  counter: number;
  method: string;
  hasShinyCharm: boolean;
  playlists: { id: string; name: string }[];
  startDate?: string | null;
}

export function FinishHuntDialog({
  open,
  onOpenChange,
  huntId,
  pokemonId,
  pokemonName,
  counter,
  method: initialMethodId,
  hasShinyCharm: initialHasShinyCharm,
  playlists,
  startDate,
}: FinishHuntDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const initialMethod = HUNTING_METHODS.find((m) => m.id === initialMethodId) ?? HUNTING_METHODS[0];

  const [form, setForm] = useState('');
  const [gender, setGender] = useState<string>('');
  const [currentHasShinyCharm, setCurrentHasShinyCharm] = useState(initialHasShinyCharm);
  const [pokeball, setPokeball] = useState('pokeball');
  const [game, setGame] = useState('');
  const [method, setMethod] = useState<HuntingMethod>(initialMethod);
  const [attempts, setAttempts] = useState(counter);
  const [huntStartDate, setHuntStartDate] = useState(startDate ? startDate.split('T')[0] : '');
  const [caughtDate, setCaughtDate] = useState(new Date().toISOString().split('T')[0]);
  const [isFail, setIsFail] = useState(false);
  const [playlistId, setPlaylistId] = useState<string>('');
  const [notes, setNotes] = useState('');

  const { pokemon: pokemonDetails } = usePokemonDetails(pokemonId);
  const formOptions = useMemo(() => pokemonDetails?.forms ?? [], [pokemonDetails]);

  const spriteUrl = useMemo(() => {
    // getPokemonSpriteUrl handles prepending ID, so we just pass the form name
    return getPokemonSpriteUrl(pokemonId, {
      shiny: true,
      female: gender === 'female',
      form: form || undefined,
      name: pokemonName,
    });
  }, [pokemonId, gender, form, pokemonName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!game) {
      toast({
        variant: 'destructive',
        title: 'Gioco richiesto',
        description: 'Seleziona il gioco in cui hai catturato questo shiny',
      });
      return;
    }

    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Devi essere loggato',
      });
      return;
    }

    setLoading(true);

    try {
      // Calculate the final display name (e.g. "Silvally Bug")
      const finalDisplayName = form
        ? formOptions.find(f => f.formName.replace(/^[^-]+-/, '') === form)?.displayName || formatPokemonName(pokemonName, pokemonId)
        : formatPokemonName(pokemonName, pokemonId);

      const { error: insertError } = await supabase.from('caught_shinies').insert({
        user_id: user.id,
        pokemon_id: pokemonId,
        pokemon_name: finalDisplayName,
        sprite_url: spriteUrl,
        form: form || null,
        gender: gender || null,
        has_shiny_charm: currentHasShinyCharm,
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

      if (insertError) throw insertError;

      const { error: deleteError } = await supabase
        .from('active_hunts')
        .delete()
        .eq('id', huntId)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      toast({
        title: '🎉 Caccia completata!',
        description: `${formatPokemonName(pokemonName, pokemonId)} shiny è stato aggiunto alla tua collezione!`,
      });

      onOpenChange(false);
      navigate('/collection');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Errore nel salvare',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Completa la caccia</DialogTitle>
          <DialogDescription>
            Inserisci i dettagli finali per salvare questo shiny nella collezione
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
            <img
              src={spriteUrl}
              alt={pokemonName}
              className="w-20 h-20 pokemon-sprite object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.svg';
              }}
            />
            <div>
              <h3 className="font-bold text-lg">{formatPokemonName(pokemonName, pokemonId)}</h3>
              <p className="text-sm text-muted-foreground">#{pokemonId.toString().padStart(4, '0')}</p>
            </div>
          </div>

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

          <div className="space-y-2">
            <Label>Genere</Label>
            <GenderSelector value={gender} onChange={setGender} />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
            <div className="flex items-center gap-2">
              <img src={SHINY_CHARM_ICON} alt="Shiny Charm" className="h-6 w-6" />
              <Label>Shiny Charm</Label>
            </div>
            <Switch checked={currentHasShinyCharm} onCheckedChange={setCurrentHasShinyCharm} />
          </div>

          <div className="space-y-2">
            <Label>Poké Ball *</Label>
            <Select value={pokeball} onValueChange={setPokeball}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {POKEBALLS.map((ball) => (
                  <SelectItem key={ball.id} value={ball.id}>
                    <div className="flex items-center gap-2">
                      <img src={ball.sprite} alt={ball.name} className="h-5 w-5" />
                      <span>{ball.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Gioco *</Label>
            <Select value={game} onValueChange={setGame}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona il gioco" />
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

          <div className="space-y-2">
            <Label>Metodo *</Label>
            <MethodSelector value={method.id} onChange={setMethod} />
          </div>

          <div className="space-y-2">
            <Label>Numero tentativi</Label>
            <Input
              type="number"
              min={1}
              value={attempts}
              onChange={(e) => setAttempts(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data inizio</Label>
              <Input type="date" value={huntStartDate} onChange={(e) => setHuntStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Data cattura *</Label>
              <Input type="date" value={caughtDate} onChange={(e) => setCaughtDate(e.target.value)} />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-destructive/30 bg-destructive/5">
            <Label>FAIL / phase</Label>
            <Switch checked={isFail} onCheckedChange={setIsFail} />
          </div>

          {playlists.length > 0 && (
            <div className="space-y-2">
              <Label>Playlist</Label>
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

          <div className="space-y-2">
            <Label>Note</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="..."
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annulla
            </Button>
            <Button type="submit" className="flex-1 shiny-glow" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salva
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
