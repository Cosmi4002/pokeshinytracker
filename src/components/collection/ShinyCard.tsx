import { Pencil, Trash2, Calendar, Hash } from 'lucide-react';
import { useRandomColor } from '@/lib/random-color-context';
import { Button } from '@/components/ui/button';
import { getGameTheme, GAME_ICONS, GAME_COVER_ART, GAME_LOGOS } from '@/lib/game-themes';
import { POKEBALLS, HUNTING_METHODS, getPokemonSpriteUrl } from '@/lib/pokemon-data';
import { formatPokemonName } from '@/hooks/use-pokemon';
import type { Tables } from '@/integrations/supabase/types';
import { useState } from 'react';
import { cn } from '@/lib/utils';

type CaughtShinyRow = Tables<'caught_shinies'>;

interface ShinyCardProps {
    entry: CaughtShinyRow;
    onEdit: () => void;
    onDelete: () => void;
}

export function ShinyCard({ entry, onEdit, onDelete }: ShinyCardProps) {
    const { accentColor } = useRandomColor();
    const theme = getGameTheme(entry.game);
    const pokeball = POKEBALLS.find((b) => b.id === entry.pokeball);
    const method = HUNTING_METHODS.find((m) => m.id === entry.method);
    const [imgError, setImgError] = useState(false);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    return (
        <div
            className="group relative h-full flex flex-col overflow-hidden rounded-2xl border bg-[#0f0f0f] shadow-2xl transition-all duration-500 hover:shadow-[0_0_30px_rgba(0,0,0,0.5)] hover:-translate-y-2 border-white/10"
            style={{
                borderColor: `${theme.primary}50`,
            }}
        >
            {/* TOP AREA: VISUAL (Fixed aspect ratio) */}
            <div className="relative w-full aspect-[16/10] overflow-hidden bg-black/40">
                {/* Game Cover Art Background */}
                {GAME_COVER_ART[entry.game] ? (
                    <div className="absolute inset-0 z-0 overflow-hidden">
                        <img
                            src={GAME_COVER_ART[entry.game]}
                            className="w-full h-full object-cover opacity-30 blur-[2px] scale-110 transition-transform duration-700 group-hover:scale-100 group-hover:blur-0 group-hover:opacity-40"
                            alt="background"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] to-transparent opacity-80" />
                    </div>
                ) : (
                    <div
                        className="absolute inset-0 opacity-20"
                        style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` }}
                    />
                )}

                {/* Pokemon Sprite */}
                <div className="absolute inset-0 flex items-center justify-center z-10 p-4">
                    <img
                        src={getPokemonSpriteUrl(entry.pokemon_id, {
                            shiny: true,
                            name: entry.pokemon_name,
                            form: entry.form,
                            female: entry.gender === 'female'
                        })}
                        alt={entry.pokemon_name}
                        className="w-40 h-40 lg:w-56 lg:h-56 object-contain pokemon-sprite drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] transition-all duration-500 group-hover:scale-110"
                        style={{ imageRendering: 'pixelated' }}
                        onError={() => setImgError(true)}
                    />
                </div>

                {/* Game Icon & Actions */}
                <div className="absolute top-2 left-2 right-2 flex justify-between items-start z-20">
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-2 group-hover:translate-x-0">
                        <Button
                            variant="secondary"
                            size="icon"
                            onClick={onEdit}
                            className="h-8 w-8 rounded-full bg-black/50 hover:bg-white text-white hover:text-black border border-white/10 backdrop-blur-md shadow-lg"
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="secondary"
                            size="icon"
                            onClick={onDelete}
                            className="h-8 w-8 rounded-full bg-black/50 hover:bg-destructive text-white border border-white/10 backdrop-blur-md shadow-lg"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Sparkling overlays */}
                <div className="absolute top-2 right-12 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="animate-ping" style={{ color: theme.accent }}>✨</div>
                </div>
            </div>

            {/* BOTTOM AREA: CONTENT (Clean & High Contrast) */}
            <div className="flex-1 p-4 bg-[#0f0f0f] relative z-10 border-t border-white/10">
                <div className="space-y-4">
                    {/* Header: Name and Indicators */}
                    <div className="flex flex-col gap-2">
                        {/* Top Header Label: Game & Status */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {GAME_LOGOS[entry.game] && (
                                    <img
                                        src={GAME_LOGOS[entry.game]}
                                        alt={entry.game}
                                        className="h-20 lg:h-24 w-auto object-contain"
                                    />
                                )}
                            </div>
                            {entry.is_fail && (
                                <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">
                                    FAIL
                                </span>
                            )}
                        </div>

                        {/* Name and Gender Row */}
                        <div className="flex items-center gap-2 mt-1 min-w-0">
                            <h3 className="text-lg lg:text-xl font-black text-white tracking-tight capitalize leading-none truncate overflow-visible">
                                {formatPokemonName(entry.pokemon_name, entry.pokemon_id)}
                            </h3>
                            {entry.gender && (
                                <span className={cn(
                                    "text-xl font-bold drop-shadow-sm flex-shrink-0 leading-none",
                                    entry.gender === 'male' ? "text-blue-400" : "text-pink-400"
                                )}>
                                    {entry.gender === 'male' ? '♂' : '♀'}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Method Badge */}
                    {method && (
                        <div
                            className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border"
                            style={{
                                backgroundColor: `${theme.primary}10`,
                                borderColor: `${theme.primary}40`,
                                color: theme.primary
                            }}
                        >
                            {method.name}
                        </div>
                    )}

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-3 mt-4">
                        <div className="space-y-1">
                            <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest block">Caught Date</span>
                            <div className="flex items-center gap-2 text-white/90">
                                <Calendar className="w-3 h-3" style={{ color: theme.primary }} />
                                <span className="text-xs font-semibold">{formatDate(entry.caught_date)}</span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest block">Encounter Count</span>
                            <div className="flex items-center gap-2 text-white/90">
                                <Hash className="w-3 h-3" style={{ color: theme.primary }} />
                                <span className="text-xs font-bold tabular-nums">
                                    {entry.attempts && entry.attempts > 0 ? entry.attempts.toLocaleString() : '-'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pokeball Detail */}
                {pokeball && (
                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <img src={pokeball.sprite} className="w-5 h-5 object-contain" alt="pokeball" />
                            <span className="text-[10px] text-white/40 font-semibold uppercase">{pokeball.name}</span>
                        </div>
                        {entry.has_shiny_charm && (
                            <div className="text-[10px] text-yellow-500 font-bold flex items-center gap-1">
                                <span className="animate-pulse">✨</span> CHARM
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Action Edit button on card bottom hover? No, let's keep them on top for now */}
        </div>
    );
}
