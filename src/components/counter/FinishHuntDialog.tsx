import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { POKEBALLS, GAMES, SHINY_CHARM_ICON } from '@/lib/pokemon-data';
import { getPokemonSpriteUrl } from '@/hooks/use-pokemon';

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
}

export function FinishHuntDialog({
    open,
    onOpenChange,
    huntId,
    pokemonId,
    pokemonName,
    counter,
    method,
    hasShinyCharm: initialHasShinyCharm,
    playlists,
}: FinishHuntDialogProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Form state - pre-filled from hunt data
    const [attempts, setAttempts] = useState(counter);
    const [gender, setGender] = useState<string>('');
    const [pokeball, setPokeball] = useState('pokeball');
    const [game, setGame] = useState('');
    const [caughtDate, setCaughtDate] = useState(new Date().toISOString().split('T')[0]);
    const [hasShinyCharm, setHasShinyCharm] = useState(initialHasShinyCharm);
    const [playlistId, setPlaylistId] = useState<string>('');
    const [notes, setNotes] = useState('');

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
            // 1. Save to caught_shinies
            const { error: insertError } = await supabase.from('caught_shinies').insert({
                user_id: user.id,
                pokemon_id: pokemonId,
                pokemon_name: pokemonName,
                sprite_url: getPokemonSpriteUrl(pokemonId, { shiny: true }),
                attempts,
                method,
                gender: gender || null,
                pokeball,
                caught_date: caughtDate,
                game,
                has_shiny_charm: hasShinyCharm,
                playlist_id: playlistId || null,
                notes: notes || null,
            });

            if (insertError) throw insertError;

            // 2. Delete from active_hunts
            const { error: deleteError } = await supabase
                .from('active_hunts')
                .delete()
                .eq('id', huntId)
                .eq('user_id', user.id);

            if (deleteError) throw deleteError;

            toast({
                title: '🎉 Caccia completata!',
                description: `${pokemonName} shiny è stato aggiunto alla tua collezione!`,
            });

            onOpenChange(false);

            // Navigate to collection page
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
                    {/* Pokemon Info (read-only display) */}
                    <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                        <img
                            src={getPokemonSpriteUrl(pokemonId, { shiny: true })}
                            alt={pokemonName}
                            className="w-20 h-20 pokemon-sprite"
                        />
                        <div>
                            <h3 className="font-bold text-lg">{pokemonName}</h3>
                            <p className="text-sm text-muted-foreground">#{pokemonId.toString().padStart(4, '0')}</p>
                        </div>
                    </div>

                    {/* Attempts */}
                    <div className="space-y-2">
                        <Label>Numero di tentativi</Label>
                        <Input
                            type="number"
                            min={1}
                            value={attempts}
                            onChange={(e) => setAttempts(Math.max(1, parseInt(e.target.value) || 1))}
                        />
                    </div>

                    {/* Gender */}
                    <div className="space-y-2">
                        <Label>Genere</Label>
                        <Select value={gender} onValueChange={setGender}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleziona genere (opzionale)" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="male">♂ Maschio</SelectItem>
                                <SelectItem value="female">♀ Femmina</SelectItem>
                                <SelectItem value="genderless">⚪ Senza genere</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Pokeball */}
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
                                            <img src={ball.sprite} alt={ball.name} className="h-5 w-5 pokemon-sprite" />
                                            <span>{ball.name}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Game */}
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

                    {/* Date */}
                    <div className="space-y-2">
                        <Label>Data cattura</Label>
                        <Input
                            type="date"
                            value={caughtDate}
                            onChange={(e) => setCaughtDate(e.target.value)}
                        />
                    </div>

                    {/* Shiny Charm */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                        <div className="flex items-center gap-2">
                            <img
                                src={SHINY_CHARM_ICON}
                                alt="Shiny Charm"
                                className="h-6 w-6 pokemon-sprite"
                            />
                            <Label>Shiny Charm</Label>
                        </div>
                        <Switch checked={hasShinyCharm} onCheckedChange={setHasShinyCharm} />
                    </div>

                    {/* Playlist */}
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

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label>Note (opzionale)</Label>
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Aggiungi note su questa caccia..."
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
                            Salva nella collezione
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
