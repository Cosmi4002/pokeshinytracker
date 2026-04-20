import { useEffect, useState, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { GenderSelector } from '@/components/ui/GenderSelector';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { POKEBALLS, GAMES, GIGAMAX_ICON, HUNTING_METHODS, HuntingMethod, SHINY_CHARM_ICON, supportsGigamaxMark } from '@/lib/pokemon-data';
import { usePokemonDetails, formatPokemonName } from '@/hooks/use-pokemon';
import { getPokemonSpriteUrl } from '@/lib/pokemon-data';

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
  const [isGigamax, setIsGigamax] = useState(false);
  const [isUnobtainable, setIsUnobtainable] = useState(false);
  const [phaseNumber, setPhaseNumber] = useState<number | null>(null);
  const [showTotal, setShowTotal] = useState(false);
  const [totalValue, setTotalValue] = useState<number | null>(null);
  const [playlistId, setPlaylistId] = useState<string>('');
  const [notes, setNotes] = useState('');

  const { pokemon: pokemonDetails } = usePokemonDetails(pokemonId);
  const canMarkGigamax = supportsGigamaxMark(game);

  useEffect(() => {
    if (!canMarkGigamax) {
      setIsGigamax(false);
    }
  }, [canMarkGigamax]);

  // Build form/variant options exactly like counter/pokedex details (forms + varieties).
  const formOptions = useMemo(() => {
    if (!pokemonDetails) return [];

    const items: { id: number; name: string; displayName: string }[] = [];

    pokemonDetails.forms.forEach((f) => {
      if (f.formName === pokemonDetails.name) return;
      if (items.some((i) => i.name === f.formName)) return;
      items.push({ id: f.id, name: f.formName, displayName: f.displayName });
    });

    pokemonDetails.varieties.forEach((v) => {
      if (v.isDefault) return;
      if (items.some((i) => i.name === v.pokemon.name)) return;
      items.push({
        id: v.pokemon.id,
        name: v.pokemon.name,
        displayName: formatPokemonName(v.pokemon.name, v.pokemon.id, pokemonDetails.baseId),
      });
    });

    return items.sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [pokemonDetails]);

  const spriteUrl = useMemo(() => {
    if (!pokemonId) return '';
    const currentVariant = formOptions.find(f => f.name === form);
    const displayId = currentVariant ? currentVariant.id : pokemonId;

    // Gender Fallback: Only try to load female sprite if the Pokemon actually has gender differences.
    // Otherwise, always use default (male) sprite to avoid 404/white square.
    const showFemaleSprite = gender === 'female' && pokemonDetails?.hasGenderDifference;

    return getPokemonSpriteUrl(displayId, {
      shiny: true,
      female: showFemaleSprite,
      form: form || undefined,
      name: pokemonName,
    });
  }, [pokemonId, gender, form, pokemonName, formOptions, pokemonDetails]);

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
    setIsGigamax(false);
    setIsUnobtainable(false);
    setPhaseNumber(null);
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
      const finalSpriteUrl = spriteUrl;

      // Calculate the final display name (e.g. "Silvally Bug")
      const finalDisplayName = form
        ? formOptions.find(f => f.name === form)?.displayName || formatPokemonName(pokemonName, pokemonId)
        : formatPokemonName(pokemonName, pokemonId);

      const currentVariant = formOptions.find(f => f.name === form);
      const displayId = currentVariant ? currentVariant.id : pokemonId;

      const { error } = await supabase.from('caught_shinies').insert({
        user_id: user.id,
        pokemon_id: displayId,
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
        is_gigamax: isGigamax,
        is_unobtainable: isUnobtainable,
        phase_number: phaseNumber,
        show_total: showTotal,
        total_value: showTotal ? (totalValue ?? attempts) : null,
        playlist_id: playlistId || null,
        notes: notes || null,
      });

      if (error) throw error;

      toast({
        title: 'Shiny aggiunto!',
        description: `${formatPokemonName(pokemonName, pokemonId)} è stato aggiunto alla collezione.`,
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
          {/* 1. Sprite & Quick Selectors */}
          {pokemonId && (
            <div className="flex flex-col items-center gap-4 p-4 bg-muted rounded-lg border border-primary/10 shadow-inner">
              <img
                key={spriteUrl}
                src={spriteUrl}
                alt={pokemonName}
                className="h-28 w-28 pokemon-sprite object-contain drop-shadow-md"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                }}
              />

              <div className="flex items-center gap-2 w-full justify-center">
                {/* Form Selector (Compact) */}
                <Select value={form || 'default'} onValueChange={(v) => setForm(v === 'default' ? '' : v)}>
                  <SelectTrigger className="h-8 w-[200px] rounded-full bg-background/50 backdrop-blur-sm border-primary/20 hover:border-primary/50 transition-colors text-xs">
                    <Sparkles className="mr-2 h-4 w-4 text-amber-400 fill-amber-400/20" />
                    <SelectValue placeholder="Forma base" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Forma base</SelectItem>
                    {formOptions.map((f) => (
                      <SelectItem key={f.id} value={f.name}>
                        {f.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Gender Selector (icons) */}
                <GenderSelector value={gender} onChange={setGender} />
              </div>
            </div>
          )}

          {/* 2. Pokémon Auswahl */}
          <div className="space-y-2">
            <Label>Pokémon *</Label>
            <PokemonSelector
              value={pokemonId}
              valueName={pokemonName}
              onChange={(id, name, baseId) => {
                if (id === null) {
                  setPokemonId(null);
                  setPokemonName('');
                  setForm('');
                  setGender('');
                  return;
                }

                const isFemaleVariant = name.endsWith('-female');
                const isMaleVariant = name.endsWith('-male');
                const resolvedBaseId = baseId ?? id;

                setPokemonId(resolvedBaseId);
                setPokemonName(name);

                if (isFemaleVariant) {
                  setGender('female');
                  setForm('');
                } else if (isMaleVariant) {
                  setGender('');
                  setForm('');
                } else if (resolvedBaseId !== id) {
                  setForm(name);
                  setGender('');
                } else {
                  setForm('');
                  setGender('');
                }
              }}
            />
          </div>

          {/* 3. Shiny Charm */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
            <div className="flex items-center gap-2">
              <img src={SHINY_CHARM_ICON} alt="Shiny Charm" className="h-6 w-6 pokemon-sprite" />
              <Label>Shiny Charm</Label>
            </div>
            <Switch checked={hasShinyCharm} onCheckedChange={setHasShinyCharm} />
          </div>

          {/* 4. Poké Ball */}
          <div className="space-y-2">
            <Label>Poké Ball</Label>
            <Select value={pokeball} onValueChange={setPokeball}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-72 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-muted/20 [&::-webkit-scrollbar-thumb]:bg-primary/40 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-primary/60">
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

          {/* 5. Gioco */}
          <div className="space-y-2">
            <Label>Gioco</Label>
            <Select value={game} onValueChange={setGame}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-72 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-muted/20 [&::-webkit-scrollbar-thumb]:bg-primary/40 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-primary/60">
                {GAMES.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {canMarkGigamax && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <div className="flex items-center gap-2">
                <img src={GIGAMAX_ICON} alt="Gigamax" className="h-6 w-6 object-contain" />
                <Label>Gigamax</Label>
              </div>
              <Switch checked={isGigamax} onCheckedChange={setIsGigamax} />
            </div>
          )}

          {/* 6. Metodo */}
          <div className="space-y-2">
            <Label>Metodo *</Label>
            <MethodSelector value={method.id} onChange={setMethod} />
          </div>

          {/* 7. Counter and Phase Number - Grid Layout */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Numero tentativi (counter)</Label>
              <Input
                type="number"
                min={1}
                value={attempts}
                onChange={(e) => setAttempts(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>
            <div className="space-y-2">
              <Label>Phase Number (opzionale)</Label>
              <Input
                type="number"
                min={1}
                placeholder="Es: 1, 2, 3..."
                value={phaseNumber || ''}
                onChange={(e) => setPhaseNumber(e.target.value ? parseInt(e.target.value) || null : null)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 items-end">
            <div className="flex items-center gap-2 px-1">
              <Checkbox
                id="show-total"
                checked={showTotal}
                onCheckedChange={(v) => {
                  const enabled = v === true;
                  setShowTotal(enabled);
                  if (enabled && totalValue === null) {
                    setTotalValue(attempts);
                  }
                  if (!enabled) {
                    setTotalValue(null);
                  }
                }}
              />
              <Label htmlFor="show-total" className="cursor-pointer select-none">
                Mostra “Total” in collezione
              </Label>
            </div>
            <div className="space-y-2">
              <Label>Total</Label>
              <Input
                type="number"
                min={1}
                disabled={!showTotal}
                value={showTotal ? (totalValue ?? attempts) : ''}
                placeholder="Es: 1234"
                onChange={(e) => setTotalValue(e.target.value ? Math.max(1, parseInt(e.target.value) || 1) : null)}
              />
            </div>
          </div>

          {/* 8. Data inizio e fine */}
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

          {/* 9. FAIL - Separated from Phase */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-destructive/30 bg-destructive/5">
            <Label>FAIL (caccia fallita)</Label>
            <Switch checked={isFail} onCheckedChange={setIsFail} />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-amber-500/30 bg-amber-500/5">
            <Label>UNCATCHABLE</Label>
            <Switch checked={isUnobtainable} onCheckedChange={setIsUnobtainable} />
          </div>

          {/* 10. Playlist */}
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

          {/* 11. Note */}
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
    </Dialog >
  );
}

