import { Link } from 'react-router-dom';
import { ArrowRight, Trash2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { HUNTING_METHODS } from '@/lib/pokemon-data';
import { calculateShinyStats } from '@/lib/pokemon-data';
import type { Tables } from '@/integrations/supabase/types';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';

type ActiveHuntRow = Tables<'active_hunts'>;

interface HuntCardProps {
    hunt: ActiveHuntRow;
    onDelete: (huntId: string) => void;
}

export function HuntCard({ hunt, onDelete }: HuntCardProps) {
    const method = HUNTING_METHODS.find((m) => m.id === hunt.method);
    const odds = method?.baseOdds || 4096;
    const stats = calculateShinyStats(hunt.counter || 0, odds);

    const getPokemonAnimatedSpriteUrl = (pokemonId: number | null): string | null => {
        if (!pokemonId) return null;
        return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/shiny/${pokemonId}.gif`;
    };

    const timeAgo = hunt.updated_at
        ? formatDistanceToNow(new Date(hunt.updated_at), { addSuffix: true, locale: it })
        : 'mai';

    return (
        <Card className="group hover:border-primary transition-all duration-200 relative overflow-hidden">
            <CardContent className="pt-6">
                {/* Pokemon Sprite */}
                <div className="flex justify-center mb-4">
                    {hunt.pokemon_id ? (
                        <img
                            src={getPokemonAnimatedSpriteUrl(hunt.pokemon_id) || ''}
                            alt={hunt.pokemon_name || 'Pokemon'}
                            className="w-24 h-24 object-contain pokemon-sprite"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${hunt.pokemon_id}.png`;
                            }}
                        />
                    ) : (
                        <div className="w-24 h-24 flex items-center justify-center bg-muted rounded-lg">
                            <span className="text-4xl">?</span>
                        </div>
                    )}
                </div>

                {/* Pokemon Name */}
                <h3 className="text-xl font-bold text-center mb-2">
                    {hunt.pokemon_name || 'Pokemon sconosciuto'}
                </h3>

                {/* Counter */}
                <div className="text-center mb-4">
                    <div className="text-4xl font-bold tabular-nums shiny-text">
                        {(hunt.counter || 0).toLocaleString()}
                    </div>
                    <p className="text-sm text-muted-foreground">incontri</p>
                </div>

                {/* Stats */}
                <div className="space-y-2 mb-4 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Metodo:</span>
                        <span className="font-semibold text-xs">{method?.name || 'Sconosciuto'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Probabilità:</span>
                        <span className="font-semibold">{stats.binomialProbability}%</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">{timeAgo}</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    <Link to={`/counter/${hunt.id}`} className="flex-1">
                        <Button className="w-full" variant="default">
                            <ArrowRight className="mr-2 h-4 w-4" />
                            Continua
                        </Button>
                    </Link>
                    <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => onDelete(hunt.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
