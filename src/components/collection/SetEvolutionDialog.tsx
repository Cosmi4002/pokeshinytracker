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

interface SetEvolutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: CaughtShinyRow | null;
  onSuccess: () => void;
}

export function SetEvolutionDialog({ open, onOpenChange, entry, onSuccess }: SetEvolutionDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [evolvedFromId, setEvolvedFromId] = useState<number | null>(null);
  const [evolvedFromName, setEvolvedFromName] = useState('');

  useEffect(() => {
    if (!entry || !open) return;
    setEvolvedFromId(entry.evolved_from_id ?? null);
    setEvolvedFromName(entry.evolved_from_name ?? '');
  }, [entry, open]);

  const handleSave = async () => {
    if (!entry || !user) return;
    if (!evolvedFromId || !evolvedFromName) {
      toast({
        variant: 'destructive',
        title: 'Selezione mancante',
        description: 'Select the original Pokémon under “Evolved from”.',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('caught_shinies')
        .update({
          is_evolved: true,
          evolved_from_id: evolvedFromId,
          evolved_from_name: evolvedFromName,
        })
        .eq('id', entry.id)
        .eq('user_id', user.id);

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
        title: 'Error',
        description: err?.message || 'Unable to save the evolution.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnset = async () => {
    if (!entry || !user) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('caught_shinies')
        .update({
          is_evolved: false,
          evolved_from_id: null,
          evolved_from_name: null,
        })
        .eq('id', entry.id)
        .eq('user_id', user.id);

      if (error) throw error;
      toast({ title: 'Evoluzione rimossa' });
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err?.message || 'Unable to remove the evolution.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Set Evolution</DialogTitle>
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
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1" disabled={loading}>Cancel</Button>
            {entry?.is_evolved && (
              <Button variant="secondary" onClick={handleUnset} className="flex-1" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Remove
              </Button>
            )}
            <Button onClick={handleSave} className="flex-1" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
