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
import { usePokemonDetails, usePokemonList, formatPokemonName } from '@/hooks/use-pokemon';
import { getPokemonSpriteUrl } from '@/lib/pokemon-data';
import { GenderSelector } from '@/components/ui/GenderSelector';
import { Sparkles } from 'lucide-react';
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
  const [phaseNumber, setPhaseNumber] = useState<number | null>(null);
  const [playlistId, setPlaylistId] = useState<string>('');
  const [notes, setNotes] = useState('');

  const { pokemon: pokemonDetails } = usePokemonDetails(pokemonId);
  const { pokemon: pokemonList } = usePokemonList();

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

    // When a form is selected, use the full form name as 'name' to ensure sprite URL generation works correctly
    const spriteName = form ? form : pokemonName;

    return getPokemonSpriteUrl(displayId, {
      shiny: true,
      female: showFemaleSprite,
      form: form || undefined,
      name: spriteName,
    });
  }, [pokemonId, gender, form, pokemonName, formOptions, pokemonDetails]);

  useEffect(() => {
    if (open && entry) {
      const formMatch = entry.form ? pokemonList.find((p) => p.name === entry.form) : undefined;
      const displayNameMatch = pokemonList.find(
        (p) => p.displayName.toLowerCase() === (entry.pokemon_name || '').toLowerCase()
      );
      const idCandidates = pokemonList.filter((p) => p.id === entry.pokemon_id);
      const idMatch =
        idCandidates.length <= 1
          ? idCandidates[0]
          : idCandidates.find(
            (p) =>
              p.displayName.toLowerCase() === (entry.pokemon_name || '').toLowerCase() ||
              p.name.toLowerCase() === (entry.form || '').toLowerCase()
          );
      const resolved = formMatch || displayNameMatch || idMatch;
      const resolvedBaseId = resolved?.baseId ?? entry.pokemon_id;

      setPokemonId(resolvedBaseId);
      setPokemonName(resolved?.name || entry.form || entry.pokemon_name);
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
      setPhaseNumber(entry.phase_number ?? null);
      setPlaylistId(entry.playlist_id ?? '');
      setNotes(entry.notes ?? '');
    }
  }, [open, entry, pokemonList]);

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
      const finalSpriteUrl = spriteUrl;

      // Calculate the final display name (e.g. "Silvally Bug")
      const finalDisplayName = form
        ? formOptions.find(f => f.name === form)?.displayName || formatPokemonName(pokemonName, pokemonId)
        : formatPokemonName(pokemonName, pokemonId);

      const currentVariant = formOptions.find(f => f.name === form);
      const displayId = currentVariant ? currentVariant.id : pokemonId;

      const { error } = await supabase
        .from('caught_shinies')
        .update({
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
          phase_number: phaseNumber,
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
          {/* 1. Sprite & Quick Selectors */}
          {pokemonId && (
            <div className="flex flex-col items-center gap-4 p-4 bg-muted rounded-lg">
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

          {/* 2. Pokémon */}
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

          {/* 9. Counter and Phase Number - Grid Layout */}
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

          {/* 11. FAIL - Separated from Phase */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-destructive/30 bg-destructive/5">
            <Label>FAIL (caccia fallita)</Label>
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
