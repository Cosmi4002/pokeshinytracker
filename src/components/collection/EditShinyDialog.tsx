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
import { POKEBALLS, GAMES, GIGAMAX_ICON, HUNTING_METHODS, HuntingMethod, SHINY_CHARM_ICON, canHideEncountersForMethod, findHuntingMethod, supportsGigamaxMark, getSelectedGameSpriteUrl } from '@/lib/pokemon-data';
import { usePokemonDetails, usePokemonList, formatPokemonName, MANUAL_VARIETIES } from '@/hooks/use-pokemon';
import { GenderSelector } from '@/components/ui/GenderSelector';
import { Sparkles } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';
import { Checkbox } from '@/components/ui/checkbox';
import { todayLocalISODate } from '@/lib/date';
import { resolveEntityKeyForSelectedPokemon } from '@/lib/pokemon-entity-resolver-v2';

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
  const [secondaryGame, setSecondaryGame] = useState<string>('');
  const [method, setMethod] = useState<HuntingMethod>(HUNTING_METHODS[0]);
  const [attempts, setAttempts] = useState(1);
  const [hideCounterEncounters, setHideCounterEncounters] = useState(false);
  const [showEncounters, setShowEncounters] = useState(true);
  const [huntStartDate, setHuntStartDate] = useState('');
  const [caughtDate, setCaughtDate] = useState(todayLocalISODate());
  const [isFail, setIsFail] = useState(false);
  const [isGigamax, setIsGigamax] = useState(false);
  const [isLegendsArceus, setIsLegendsArceus] = useState(false);
  const [isUnobtainable, setIsUnobtainable] = useState(false);
  const [phaseNumber, setPhaseNumber] = useState<number | null>(null);
    const [showTotal, setShowTotal] = useState(false);
  const [totalValue, setTotalValue] = useState<number | null>(null);
  const [showTotalSeen, setShowTotalSeen] = useState(false);
  const [totalSeenCount, setTotalSeenCount] = useState<number | null>(null);
  const [showSeen, setShowSeen] = useState(false);
  const [seenCount, setSeenCount] = useState<number | null>(null);
  const [playlistId, setPlaylistId] = useState<string>('');
  const [notes, setNotes] = useState('');

  const { pokemon: pokemonDetails } = usePokemonDetails(pokemonId);
  const { pokemon: pokemonList } = usePokemonList();
  const canMarkGigamax = supportsGigamaxMark(game);
  const canHideCounterEncounters = canHideEncountersForMethod(method.id);
  const shouldShowAttempts = useMemo(() => {
    const id = method.id;
    return !hideCounterEncounters && id !== 'gen9-tera-raid' && id !== 'distribution/event' && id !== 'static overworld game gift';
  }, [hideCounterEncounters, method.id]);
  const shouldShowEncountersBox = useMemo(() => showEncounters && shouldShowAttempts, [showEncounters, shouldShowAttempts]);

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

    return getSelectedGameSpriteUrl({
      pokemonId: displayId,
      pokemonName,
      form: form || undefined,
      gender,
      game,
      secondaryGame,
    });
  }, [pokemonId, gender, form, pokemonName, formOptions, game, secondaryGame]);

  useEffect(() => {
    if (open && entry) {
      // Resolve by stored `form` first (source of truth), avoiding wrong matches on duplicated numeric IDs.
      const formSlug = entry.form?.toLowerCase() || '';
      const listFormMatch = formSlug ? pokemonList.find((p) => p.name.toLowerCase() === formSlug) : undefined;

      let manualFormMatch: { baseId: number; id: number; name: string } | undefined;
      if (!listFormMatch && formSlug) {
        for (const [baseIdStr, variants] of Object.entries(MANUAL_VARIETIES)) {
          const found = variants.find((v) => v.name.toLowerCase() === formSlug);
          if (found) {
            manualFormMatch = {
              baseId: Number(baseIdStr),
              id: found.id,
              name: found.name,
            };
            break;
          }
        }
      }

      const displayNameMatch = pokemonList.find(
        (p) => p.displayName.toLowerCase() === (entry.pokemon_name || '').toLowerCase()
      );
      const idCandidates = pokemonList.filter((p) => p.id === entry.pokemon_id);
      const idMatch = idCandidates[0];

      const resolvedBaseId =
        listFormMatch?.baseId ??
        manualFormMatch?.baseId ??
        displayNameMatch?.baseId ??
        idMatch?.baseId ??
        entry.pokemon_id;

      const resolvedName =
        listFormMatch?.name ??
        manualFormMatch?.name ??
        displayNameMatch?.name ??
        entry.form ??
        idMatch?.name ??
        entry.pokemon_name;

      setPokemonId(resolvedBaseId);
      setPokemonName(resolvedName);
      setForm(entry.form ?? '');
      setGender(entry.gender ?? '');
      setHasShinyCharm(entry.has_shiny_charm ?? false);
      setPokeball(entry.pokeball ?? 'pokeball');
      setGame(entry.game);
      setSecondaryGame((entry as any).secondary_game ?? '');
      const m = findHuntingMethod(entry.method) ?? HUNTING_METHODS[0];
      setMethod(m);
      setHideCounterEncounters(canHideEncountersForMethod(m.id) && entry.attempts === null);
      setShowEncounters((entry as any).show_encounters ?? true);
      setAttempts(entry.attempts ?? 1);
      setHuntStartDate(entry.hunt_start_date ?? '');
      setCaughtDate(entry.caught_date ?? todayLocalISODate());
      setIsFail(entry.is_fail ?? false);
      setIsGigamax(entry.is_gigamax ?? false);
      setIsLegendsArceus((entry as any).is_legends_arceus ?? false);
      setIsUnobtainable(entry.is_unobtainable ?? false);
            setPhaseNumber(entry.phase_number ?? null);
      setShowTotal(entry.show_total ?? false);
      setTotalValue(entry.total_value ?? null);
      setShowTotalSeen(entry.show_total_seen ?? false);
      setTotalSeenCount(entry.total_seen_count ?? null);
      setShowSeen((entry as any).show_seen ?? false);
      setSeenCount((entry as any).seen_count ?? null);
      setPlaylistId(entry.playlist_id ?? '');
      setNotes(entry.notes ?? '');
    }
  }, [open, entry, pokemonList]);

  useEffect(() => {
    if (!canMarkGigamax) {
      setIsGigamax(false);
    }
  }, [canMarkGigamax]);

  useEffect(() => {
    if (game !== 'pla' && game !== 'za' && isLegendsArceus) {
      setIsLegendsArceus(false);
    }
  }, [game, isLegendsArceus]);

  useEffect(() => {
    if (!canHideCounterEncounters) {
      setHideCounterEncounters(false);
    }
  }, [canHideCounterEncounters]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entry || !user) return;
    if (!pokemonId || !pokemonName) {
      toast({ variant: 'destructive', title: 'Select a Pokémon' });
      return;
    }
    if (!game) {
      toast({ variant: 'destructive', title: 'Select a game' });
      return;
    }

    setLoading(true);
    try {
      const currentVariant = formOptions.find(f => f.name === form);
      const displayId = currentVariant ? currentVariant.id : pokemonId;

      const finalSpriteUrl = getSelectedGameSpriteUrl({
        pokemonId: displayId,
        pokemonName,
        form: form || undefined,
        gender,
        game,
        secondaryGame,
      });

      // Calculate the final display name (e.g. "Silvally Bug")
      const finalDisplayName = form
        ? formOptions.find(f => f.name === form)?.displayName || formatPokemonName(pokemonName, pokemonId)
        : formatPokemonName(pokemonName, pokemonId);

      const entityKey = resolveEntityKeyForSelectedPokemon({
        pokemonId: displayId,
        pokemonName: finalDisplayName,
        form: form || pokemonName,
      });

      const { error } = await supabase
        .from('caught_shinies')
        .update({
          pokemon_id: displayId,
          entity_key: entityKey,
          pokemon_name: finalDisplayName,
          sprite_url: finalSpriteUrl,
          form: form || null,
          gender: gender || null,
          has_shiny_charm: hasShinyCharm,
          pokeball,
          game,
          secondary_game: secondaryGame || null,
          method: method.id,
          attempts: shouldShowAttempts ? attempts : null,
          show_encounters: shouldShowEncountersBox,
          hunt_start_date: huntStartDate || null,
          caught_date: caughtDate,
          is_fail: isFail,
          is_gigamax: isGigamax,
          is_legends_arceus: isLegendsArceus,
          is_unobtainable: isUnobtainable,
          phase_number: phaseNumber,
          show_total: showTotal,
          total_value: showTotal ? (totalValue ?? attempts) : null,
          show_total_seen: showTotalSeen,
          total_seen_count: showTotalSeen ? totalSeenCount : null,
          show_seen: showSeen,
          seen_count: showSeen ? seenCount : null,
          playlist_id: playlistId || null,
          notes: notes || null,
        })
        .eq('id', entry.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Modifiche salvate',
        description: `${formatPokemonName(pokemonName, pokemonId)} was updated in the collection.`,
      });
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Unable to save changes.',
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
          <DialogTitle>Edit shiny Pokémon in collection</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Sprite & Quick Selectors */}
          {pokemonId && (
              <div className="flex flex-col items-center gap-4 p-4 bg-muted rounded-lg border border-border shadow-inner">
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
                    <SelectTrigger className="h-8 w-[200px] rounded-full bg-background border-border hover:border-foreground/30 transition-colors text-xs">
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
            <Label>Game *</Label>
            <Select value={game} onValueChange={setGame}>
              <SelectTrigger>
                <SelectValue placeholder="Select game" />
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

          {/* 7b. Second game (optional) */}
          <div className="space-y-2">
            <Label>Second game (optional)</Label>
            <Select value={secondaryGame || 'none'} onValueChange={(v) => setSecondaryGame(v === 'none' ? '' : v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {GAMES.filter((g) => g.id !== game).map((g) => (
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

          {(game === 'pla' || game === 'za') && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <div className="flex items-center gap-2">
                <img
                  src="https://archives.bulbagarden.net/media/upload/4/4b/Alpha_icon.png"
                  alt="Alpha Pokemon"
                  className="h-5 w-5 object-contain"
                />
                <Label>Alpha Pokemon</Label>
              </div>
              <Switch checked={isLegendsArceus} onCheckedChange={setIsLegendsArceus} />
            </div>
          )}

          {/* 8. Metodo */}
          <div className="space-y-2">
            <Label>Method *</Label>
            <MethodSelector value={method.id} onChange={setMethod} gameId={game} />
          </div>

          {canHideCounterEncounters && (
            <div className="flex items-center gap-2 px-1">
              <Checkbox
                id="edit-hide-counter-encounters"
                checked={hideCounterEncounters}
                onCheckedChange={(v) => setHideCounterEncounters(v === true)}
              />
              <Label htmlFor="edit-hide-counter-encounters" className="cursor-pointer select-none">
                Hide counter encounters in collection
              </Label>
            </div>
          )}

          <div className="flex items-center gap-2 px-1">
            <Checkbox
              id="edit-show-encounters"
              checked={showEncounters}
              onCheckedChange={(v) => setShowEncounters(v === true)}
            />
            <Label htmlFor="edit-show-encounters" className="cursor-pointer select-none">
              Show encounters in collection
            </Label>
          </div>

          {/* 9. Counter and Phase Number - Grid Layout */}
          <div className="grid grid-cols-2 gap-4">
            {shouldShowAttempts ? (
              <div className="space-y-2">
                <Label>Numero tentativi (counter)</Label>
                <Input
                  type="number"
                  min={1}
                  value={attempts}
                  onChange={(e) => setAttempts(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>
            ) : (
              <div className="space-y-2 opacity-70">
                <Label>Numero tentativi (counter)</Label>
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
                Show “Total” in collection
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

          <div className="grid grid-cols-2 gap-4 items-end">
            <div className="flex items-center gap-2 px-1">
              <Checkbox
                id="show-seen"
                checked={showSeen}
                onCheckedChange={(v) => {
                  const enabled = v === true;
                  setShowSeen(enabled);
                  if (enabled && seenCount === null) {
                    setSeenCount(0);
                  }
                  if (!enabled) {
                    setSeenCount(null);
                  }
                }}
              />
              <Label htmlFor="show-seen" className="cursor-pointer select-none">
                Show “Seen” in collection
              </Label>
            </div>
            <div className="space-y-2">
              <Label>Seen Count</Label>
              <Input
                type="number"
                min={0}
                disabled={!showSeen}
                value={showSeen ? (seenCount ?? '') : ''}
                placeholder="Es: 123"
                onChange={(e) => setSeenCount(e.target.value ? Math.max(0, parseInt(e.target.value) || 0) : null)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 items-end">
            <div className="flex items-center gap-2 px-1">
              <Checkbox
                id="edit-show-total-seen"
                checked={showTotalSeen}
                onCheckedChange={(v) => {
                  const enabled = v === true;
                  setShowTotalSeen(enabled);
                  if (enabled) {
                    setShowTotal(true);
                    if (totalValue === null) {
                      setTotalValue(attempts);
                    }
                    if (totalSeenCount === null) {
                      setTotalSeenCount(0);
                    }
                  }
                  if (!enabled) {
                    setTotalSeenCount(null);
                  }
                }}
              />
              <Label htmlFor="edit-show-total-seen" className="cursor-pointer select-none">
                Show "Total Seen"
              </Label>
            </div>
            <div className="space-y-2">
              <Label>Total Seen</Label>
              <Input
                type="number"
                min={0}
                disabled={!showTotalSeen}
                value={showTotalSeen ? (totalSeenCount ?? '') : ''}
                placeholder="Es: 123"
                onChange={(e) => setTotalSeenCount(e.target.value ? Math.max(0, parseInt(e.target.value) || 0) : null)}
              />
            </div>
          </div>

          {/* 10. Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Hunt start date</Label>
              <Input type="date" value={huntStartDate} onChange={(e) => setHuntStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Catch date *</Label>
              <Input type="date" value={caughtDate} onChange={(e) => setCaughtDate(e.target.value)} />
            </div>
          </div>

          {/* 11. FAIL - Separated from Phase */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-destructive/30 bg-destructive/5">
            <Label>FAIL (failed hunt)</Label>
            <Switch checked={isFail} onCheckedChange={setIsFail} />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-amber-500/30 bg-amber-500/5">
            <Label>UNCATCHABLE</Label>
            <Switch checked={isUnobtainable} onCheckedChange={setIsUnobtainable} />
          </div>

          {/* 12. Playlist */}
          {playlists.length > 0 && (
            <div className="space-y-2">
              <Label>Playlist (optional)</Label>
              <Select value={playlistId || 'none'} onValueChange={(val) => setPlaylistId(val === 'none' ? '' : val)}>
                <SelectTrigger>
                  <SelectValue placeholder="No playlist" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No playlist</SelectItem>
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
            Save changes
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
