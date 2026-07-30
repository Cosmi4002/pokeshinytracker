import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Sparkles } from 'lucide-react';
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
import { POKEBALLS, GAMES, GIGAMAX_ICON, HUNTING_METHODS, HuntingMethod, SHINY_CHARM_ICON, canHideEncountersForMethod, findHuntingMethod, getPokemonSpriteUrl, supportsGigamaxMark } from '@/lib/pokemon-data';
import { usePokemonDetails, formatPokemonName } from '@/hooks/use-pokemon';
import { MethodSelector } from '@/components/counter/MethodSelector';
import { Checkbox } from '@/components/ui/checkbox';
import { todayLocalISODate } from '@/lib/date';

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
  initialForm?: string;
  initialGender?: string;
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
  initialForm = '',
  initialGender = '',
}: FinishHuntDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const initialMethod = findHuntingMethod(initialMethodId) ?? HUNTING_METHODS[0];

  const [form, setForm] = useState(initialForm);
  const [gender, setGender] = useState<string>(initialGender);
  const [currentHasShinyCharm, setCurrentHasShinyCharm] = useState(initialHasShinyCharm);
  const [pokeball, setPokeball] = useState('pokeball');
  const [game, setGame] = useState('');
  const [method, setMethod] = useState<HuntingMethod>(initialMethod);
  const [attempts, setAttempts] = useState(counter);
  const [attemptsDirty, setAttemptsDirty] = useState(false);
  const [hideCounterEncounters, setHideCounterEncounters] = useState(false);
  const [showEncounters, setShowEncounters] = useState(true);
  const prevOpenRef = useRef(false);
  const [huntStartDate, setHuntStartDate] = useState(startDate ? startDate.split('T')[0] : '');
  const [caughtDate, setCaughtDate] = useState(todayLocalISODate());
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
  const canHideCounterEncounters = canHideEncountersForMethod(method.id);
  const shouldShowAttempts = useMemo(() => {
    const id = method.id;
    return !hideCounterEncounters && id !== 'gen9-tera-raid' && id !== 'distribution/event' && id !== 'static overworld game gift';
  }, [hideCounterEncounters, method.id]);
  const shouldShowEncountersBox = useMemo(() => showEncounters && shouldShowAttempts, [showEncounters, shouldShowAttempts]);

  useEffect(() => {
    if (!canMarkGigamax) {
      setIsGigamax(false);
    }
  }, [canMarkGigamax]);

  useEffect(() => {
    if (!canHideCounterEncounters) {
      setHideCounterEncounters(false);
    }
  }, [canHideCounterEncounters]);

  useEffect(() => {
    const wasOpen = prevOpenRef.current;
    prevOpenRef.current = open;

    if (!open || wasOpen) return;

    setAttemptsDirty(false);
    setHideCounterEncounters(false);
    setShowEncounters(true);
    setAttempts(counter);
  }, [open, counter]);

  useEffect(() => {
    if (!open) return;
    if (attemptsDirty) return;
    setAttempts(counter);
  }, [counter, open, attemptsDirty]);

  // Build all forms/varieties from pokemon details without exclusion filters.
  const formOptions = useMemo(() => {
    if (!pokemonDetails) return [];

    const items: { id: number, name: string, displayName: string }[] = [];

    pokemonDetails.forms.forEach((f) => {
      if (f.formName === pokemonDetails.name) return;
      if (items.some((i) => i.name === f.formName)) return;
      items.push({
        id: f.id,
        name: f.formName,
        displayName: f.displayName,
      });
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

  const selectedDisplayName = useMemo(() => {
    if (form) {
      return formOptions.find(f => f.name === form)?.displayName || formatPokemonName(pokemonName, pokemonId);
    }
    return formatPokemonName(pokemonName, pokemonId);
  }, [form, formOptions, pokemonName, pokemonId]);

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
      // Use full name matching to match ShinyCounter fix
      const finalDisplayName = form
        ? formOptions.find(f => f.name === form)?.displayName || formatPokemonName(pokemonName, pokemonId)
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
        attempts: shouldShowAttempts ? attempts : null,
        show_encounters: shouldShowEncountersBox,
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

      if (insertError) throw insertError;

      const { error: deleteError } = await supabase
        .from('active_hunts')
        .delete()
        .eq('id', huntId)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      toast({
        title: '🎉 Caccia completata!',
        description: `${finalDisplayName} shiny è stato aggiunto alla tua collezione!`,
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
              key={spriteUrl}
              src={spriteUrl}
              alt={pokemonName}
              className="w-20 h-20 pokemon-sprite object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.svg';
              }}
            />
            <div>
              <h3 className="font-bold text-lg">{selectedDisplayName}</h3>
              <p className="text-sm text-muted-foreground">#{pokemonId.toString().padStart(4, '0')}</p>
            </div>
          </div>

          {formOptions.length > 0 && (
            <div className="space-y-2">
              <Label>Forma / variante</Label>
              <Select value={form || 'default'} onValueChange={(v) => setForm(v === 'default' ? '' : v)}>
                <SelectTrigger className="h-8 rounded-full text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <Sparkles className="h-3 w-3" />
                    <SelectValue placeholder="Forma base" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Forma base</SelectItem>
                  {formOptions.map((f) => (
                    <SelectItem key={f.name} value={f.name}>
                      {f.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Genere</Label>
            {pokemonDetails?.hasGenderDifference ? (
              <Select value={gender || 'male'} onValueChange={(v) => setGender(v === 'female' ? 'female' : '')}>
                <SelectTrigger className="h-8 rounded-full text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Maschio</SelectItem>
                  <SelectItem value="female">Femmina</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <GenderSelector value={gender} onChange={setGender} />
            )}
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
              <SelectContent className="max-h-72 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-muted/20 [&::-webkit-scrollbar-thumb]:bg-primary/40 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-primary/60">
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

          <div className="space-y-2">
            <Label>Metodo *</Label>
            <MethodSelector value={method.id} onChange={setMethod} />
          </div>

          {canHideCounterEncounters && (
            <div className="flex items-center gap-2 px-1">
              <Checkbox
                id="finish-hide-counter-encounters"
                checked={hideCounterEncounters}
                onCheckedChange={(v) => setHideCounterEncounters(v === true)}
              />
              <Label htmlFor="finish-hide-counter-encounters" className="cursor-pointer select-none">
                Nascondi counter encounters in collezione
              </Label>
            </div>
          )}

          <div className="flex items-center gap-2 px-1">
            <Checkbox
              id="finish-show-encounters"
              checked={showEncounters}
              onCheckedChange={(v) => setShowEncounters(v === true)}
            />
            <Label htmlFor="finish-show-encounters" className="cursor-pointer select-none">
              Mostra encounters in collezione
            </Label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {shouldShowAttempts ? (
              <div className="space-y-2">
                <Label>Numero tentativi</Label>
                <Input
                  type="number"
                  min={1}
                  value={attempts}
                  onChange={(e) => {
                    setAttemptsDirty(true);
                    setAttempts(Math.max(1, parseInt(e.target.value) || 1));
                  }}
                />
              </div>
            ) : (
              <div className="space-y-2 opacity-70">
                <Label>Numero tentativi</Label>
                <Input type="text" disabled value="N/A" />
              </div>
            )}
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
            <Label>FAIL (caccia fallita)</Label>
            <Switch checked={isFail} onCheckedChange={setIsFail} />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-amber-500/30 bg-amber-500/5">
            <Label>UNCATCHABLE</Label>
            <Switch checked={isUnobtainable} onCheckedChange={setIsUnobtainable} />
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
