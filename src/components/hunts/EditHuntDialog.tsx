import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PokemonSelector } from '@/components/counter/PokemonSelector';
import { MethodSelector } from '@/components/counter/MethodSelector';
import { HUNTING_METHODS, SHINY_CHARM_ICON, HuntingMethod } from '@/lib/pokemon-data';
import type { Tables } from '@/integrations/supabase/types';

type ActiveHuntRow = Tables<'active_hunts'>;

interface EditHuntDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    hunt: ActiveHuntRow | null;
    onSuccess: () => void;
}

export function EditHuntDialog({ open, onOpenChange, hunt, onSuccess }: EditHuntDialogProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [counter, setCounter] = useState(0);
    const [pokemonId, setPokemonId] = useState<number | null>(null);
    const [pokemonName, setPokemonName] = useState('');
    const [methodId, setMethodId] = useState('');
    const [hasShinyCharm, setHasShinyCharm] = useState(false);

    useEffect(() => {
        if (hunt && open) {
            setCounter(hunt.counter || 0);
            setPokemonId(hunt.pokemon_id);
            setPokemonName(hunt.pokemon_name || '');
            setMethodId(hunt.method || 'gen9-random');
            setHasShinyCharm(hunt.has_shiny_charm || false);
        }
    }, [hunt, open]);

    const handleSave = async () => {
        if (!hunt) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('active_hunts')
                .update({
                    counter,
                    pokemon_id: pokemonId,
                    pokemon_name: pokemonName,
                    method: methodId,
                    has_shiny_charm: hasShinyCharm,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', hunt.id);

            if (error) throw error;

            toast({
                title: 'Caccia aggiornata',
                description: 'Le modifiche sono state salvate correttamente.',
            });
            onSuccess();
            onOpenChange(false);
        } catch (err: any) {
            toast({
                variant: 'destructive',
                title: 'Errore',
                description: err.message || 'Impossibile aggiornare la caccia',
            });
        } finally {
            setLoading(false);
        }
    };

    const selectedMethod = HUNTING_METHODS.find((m) => m.id === methodId);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Modifica Caccia</DialogTitle>
                    <DialogDescription>
                        Aggiorna i dettagli della tua caccia attiva
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Pokémon</Label>
                        <PokemonSelector
                            value={pokemonId}
                            onChange={(id, name) => {
                                setPokemonId(id);
                                setPokemonName(name);
                            }}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Metodo</Label>
                        <MethodSelector
                            value={methodId}
                            onChange={(m) => setMethodId(m.id)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Contatore</Label>
                        <Input
                            type="number"
                            min={0}
                            value={counter}
                            onChange={(e) => setCounter(parseInt(e.target.value) || 0)}
                        />
                    </div>

                    {selectedMethod?.supportsShinyCharm && (
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-white/5">
                            <div className="flex items-center gap-2">
                                <img src={SHINY_CHARM_ICON} alt="Shiny Charm" className="h-5 w-5" />
                                <Label>Shiny Charm</Label>
                            </div>
                            <Switch checked={hasShinyCharm} onCheckedChange={setHasShinyCharm} />
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Annulla
                    </Button>
                    <Button onClick={handleSave} disabled={loading} className="shiny-glow">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salva Modifiche
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
