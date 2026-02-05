import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getGameTheme } from '@/lib/game-themes';
import { POKEBALLS, HUNTING_METHODS, getPokemonSpriteUrl } from '@/lib/pokemon-data';
import type { Tables } from '@/integrations/supabase/types';

type CaughtShinyRow = Tables<'caught_shinies'>;

interface ShinyCardProps {
    entry: CaughtShinyRow;
    onEdit: () => void;
    onDelete: () => void;
}

export function ShinyCard({ entry, onEdit, onDelete }: ShinyCardProps) {
    const theme = getGameTheme(entry.game);
    const pokeball = POKEBALLS.find((b) => b.id === entry.pokeball);
    const method = HUNTING_METHODS.find((m) => m.id === entry.method);

    // Format date like "14 Jul 2025"
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const day = date.getDate();
        const month = date.toLocaleDateString('en-US', { month: 'short' });
        const year = date.getFullYear();
        return `${day} ${month} ${year}`;
    };

    return (
        <div
            className="relative overflow-hidden rounded-xl border-2 group transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
            style={{
                background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`,
                borderColor: theme.accent,
            }}
        >
            {/* Pokeball background overlay */}
            {pokeball && (
                <div
                    className="absolute inset-0 opacity-10 bg-no-repeat bg-center"
                    style={{
                        backgroundImage: `url(${pokeball.sprite})`,
                        backgroundSize: '180px 180px',
                        filter: 'brightness(5)',
                    }}
                />
            )}

            {/* Edit/Delete buttons */}
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={onEdit}
                    className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                    title="Modifica"
                >
                    <Pencil className="h-4 w-4" />
                </Button>
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={onDelete}
                    className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                    title="Elimina"
                >
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
            </div>

            {/* Card content */}
            <div className="relative p-5 flex items-start gap-4">
                <div className="flex-shrink-0">
                    <img
                        src={entry.sprite_url || getPokemonSpriteUrl(entry.pokemon_id, { shiny: true })}
                        alt={entry.pokemon_name}
                        className="w-24 h-24 pokemon-sprite drop-shadow-lg"
                        style={{ imageRendering: 'pixelated' }}
                    />
                </div>

                {/* Info section */}
                <div className="flex-1 min-w-0">
                    <h3 className="text-2xl font-bold text-white drop-shadow-md mb-1">
                        {entry.pokemon_name}
                    </h3>
                    <p className="text-white/90 text-sm font-medium mb-2 drop-shadow">
                        {formatDate(entry.caught_date)}
                    </p>
                    {method && (
                        <span className="inline-block px-3 py-1 rounded-full bg-black/30 text-white text-xs font-bold backdrop-blur-sm">
                            {method.name}
                        </span>
                    )}
                </div>
            </div>

            {/* Counter at bottom */}
            <div className="relative px-5 pb-4 pt-2">
                <div className="text-right">
                    <p className="text-4xl font-bold text-white drop-shadow-lg">
                        {(entry.attempts || 1).toLocaleString()}
                    </p>
                </div>
            </div>

            {/* Gender and Fail indicators if needed */}
            {(entry.gender || entry.is_fail) && (
                <div className="relative px-5 pb-3 flex gap-2 justify-end items-center">
                    {entry.gender && (
                        <span className="text-2xl text-white drop-shadow-md">
                            {entry.gender === 'male' ? '♂' : entry.gender === 'female' ? '♀' : ''}
                        </span>
                    )}
                    {entry.is_fail && (
                        <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold">
                            FAIL
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
