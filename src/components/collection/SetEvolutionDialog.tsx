import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PokemonSelector } from '@/components/counter/PokemonSelector';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type CaughtShinyRow = Tables<'caught_shinies'>;
const EVOLVED_FROM_LOCAL_KEY = 'collection_evolved_from_v1';

type EvolvedFromLocalMap = Record<string, { id: number; name: string }>;

function readEvolvedFromLocalMap(): EvolvedFromLocalMap {
  try {
    const raw = localStorage.getItem(EVOLVED_FROM_LOCAL_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as EvolvedFromLocalMap;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeEvolvedFromLocalMap(next: EvolvedFromLocalMap) {
  try {
    localStorage.setItem(EVOLVED_FROM_LOCAL_KEY, JSON.stringify(next));
  } catch {
    // ignore storage errors
  }
}

interface SetEvolutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: CaughtShinyRow | null;
  onSuccess: () => void;
}

function isMissingEvolvedFromColumns(error: unknown): boolean {
  const message =
    typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message?: string }).message || '')
      : '';
  return message.includes('evolved_from_') && message.toLowerCase().includes('column');
}

export function SetEvolutionDialog({ open, onOpenChange, entry, onSuccess }: SetEvolutionDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [evolvedFromId, setEvolvedFromId] = useState<number | null>(null);
  const [evolvedFromName, setEvolvedFromName] = useState('');

  useEffect(() => {
    if (!entry || !open) return;
    const existingId = (entry as any).evolved_from_id as number | null | undefined;
    const existingName = (entry as any).evolved_from_name as string | null | undefined;
    if (existingId) {
      setEvolvedFromId(existingId ?? null);
      setEvolvedFromName(existingName ?? '');
      return;
    }

    const local = readEvolvedFromLocalMap()[entry.id];
    setEvolvedFromId(local?.id ?? null);
    setEvolvedFromName(local?.name ?? '');
  }, [entry, open]);

  const handleSave = async () => {
    if (!entry || !user) return;
    if (!evolvedFromId || !evolvedFromName) {
      toast({
        variant: 'destructive',
        title: 'Selezione mancante',
        description: 'Seleziona il Pokémon di origine in "Evoluto da".',
      });
      return;
    }

    setLoading(true);
    try {
      const localMap = readEvolvedFromLocalMap();
      localMap[entry.id] = { id: evolvedFromId, name: evolvedFromName };
      writeEvolvedFromLocalMap(localMap);

      let { error } = await supabase
        .from('caught_shinies')
        .update({
          is_evolved: true,
          evolved_from_id: evolvedFromId,
          evolved_from_name: evolvedFromName,
        } as any)
        .eq('id', entry.id)
        .eq('user_id', user.id);

      if (error && isMissingEvolvedFromColumns(error)) {
        const fallback = await supabase
          .from('caught_shinies')
          .update({ is_evolved: true } as any)
          .eq('id', entry.id)
          .eq('user_id', user.id);
        error = fallback.error;
        if (!error) {
          toast({
            title: 'Salvato in locale',
            description: 'Colonne DB evolved_from_* mancanti: mini-sprite visibile solo su questo browser.',
          });
        }
      }

      if (error) throw error;

      toast({
        title: 'Evoluzione salvata',
        description: `${entry.pokemon_name} evoluto da ${evolvedFromName}.`,
      });
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Errore',
        description: err?.message || 'Impossibile salvare evoluzione.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnset = async () => {
    if (!entry || !user) return;
    setLoading(true);
    try {
      const localMap = readEvolvedFromLocalMap();
      delete localMap[entry.id];
      writeEvolvedFromLocalMap(localMap);

      const { error } = await supabase
        .from('caught_shinies')
        .update({
          is_evolved: false,
          evolved_from_id: null,
          evolved_from_name: null,
        } as any)
        .eq('id', entry.id)
        .eq('user_id', user.id);

      if (error) throw error;
      toast({ title: 'Evoluzione rimossa' });
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Errore',
        description: err?.message || 'Impossibile rimuovere evoluzione.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Imposta evoluzione</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Evoluto da</Label>
            <PokemonSelector
              value={evolvedFromId}
              valueName={evolvedFromName}
              onChange={(id, name) => {
                setEvolvedFromId(id);
                setEvolvedFromName(name);
              }}
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1" disabled={loading}>
              Annulla
            </Button>
            {entry?.is_evolved && (
              <Button variant="secondary" onClick={handleUnset} className="flex-1" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Rimuovi
              </Button>
            )}
            <Button onClick={handleSave} className="flex-1" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salva
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
