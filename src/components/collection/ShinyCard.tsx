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
            className={cn(
                "group relative h-full flex flex-col overflow-hidden rounded-2xl border bg-[#2d2d2d] shadow-2xl transition-all duration-500 hover:shadow-[0_0_30px_rgba(0,0,0,0.5)] hover:-translate-y-2",
                entry.is_fail ? "border-red-500/80 shadow-[0_0_20px_rgba(239,68,68,0.25)] ring-1 ring-red-500/50" : "border-white/10"
            )}
            style={{
                borderColor: entry.is_fail ? '#ef4444' : `${theme.primary}50`,
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

                <div className="absolute inset-0 flex items-center justify-center z-10 p-2 -translate-y-4">
                    <img
                        src={getPokemonSpriteUrl(entry.pokemon_id, {
                            shiny: true,
                            name: entry.pokemon_name,
                            form: entry.form,
                            female: entry.gender === 'female'
                        })}
                        alt={entry.pokemon_name}
                        className="w-32 h-32 lg:w-40 lg:h-40 object-contain pokemon-sprite drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] transition-all duration-500 group-hover:scale-110"
                        style={{ imageRendering: 'auto' }}
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
            <div className="flex-1 p-4 bg-[#242424] relative z-10 border-t border-white/10"
                style={{
                    backgroundColor: `color-mix(in srgb, ${theme.primary} 20%, #1a1a1a)`,
                    borderTopColor: `${theme.primary}30`
                }}>
                <div className="space-y-3">
                    {/* Header Section: Name, Gender, Logo */}
                    <div className="flex flex-col gap-2">
                        {/* Name and Gender Row - Centered */}
                        <div className="flex items-center justify-center gap-2 min-w-0">
                            <h3 className="text-xl lg:text-2xl font-black text-white tracking-tight capitalize leading-none">
                                {formatPokemonName(entry.pokemon_name, entry.pokemon_id)}
                            </h3>
                            {(entry.gender === 'male' || entry.gender === 'female') && (
                                <span className={cn(
                                    "text-xl font-bold drop-shadow-sm flex-shrink-0 leading-none",
                                    entry.gender === 'male' ? "text-blue-400" : "text-pink-400"
                                )}>
                                    {entry.gender === 'male' ? '♂' : '♀'}
                                </span>
                            )}
                        </div>

                        {/* Game Logo & Fail Badge Row */}
                        <div className="flex items-center justify-between w-full">
                            <div className="flex-1" />
                            <div className="flex items-center justify-center flex-1">
                                {GAME_LOGOS[entry.game] && (
                                    <img
                                        src={GAME_LOGOS[entry.game]}
                                        alt={entry.game}
                                        className="h-16 lg:h-20 w-auto max-w-[120px] object-contain brightness-110 drop-shadow-lg"
                                    />
                                )}
                            </div>
                            <div className="flex-1" />
                        </div>
                    </div>

                    {/* Method Badge - Centered */}
                    {method && (
                        <div className="flex justify-center">
                            <div
                                className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border shadow-sm"
                                style={{
                                    backgroundColor: `${theme.primary}15`,
                                    borderColor: `${theme.primary}50`,
                                    color: theme.primary
                                }}
                            >
                                {method.name}
                            </div>
                        </div>
                    )}

                    {/* Info Grid - With subtle boxes */}
                    <div className="grid grid-cols-2 gap-2.5 mt-3">
                        <div
                            className="rounded-lg p-2.5 border border-white/5"
                            style={{
                                backgroundColor: `${theme.primary}08`
                            }}
                        >
                            <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider block mb-1.5">
                                {entry.is_fail ? 'Duration' : 'Hunt Dates'}
                            </span>
                            <div className="flex flex-col gap-0.5 text-white/95">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] text-white/40 font-mono">Start:</span>
                                    <span className="text-xs font-semibold">
                                        {entry.hunt_start_date ? formatDate(entry.hunt_start_date) : 'Unknown'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] text-white/40 font-mono">End:</span>
                                    <span className="text-xs font-semibold">
                                        {formatDate(entry.caught_date)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div
                            className="rounded-lg p-2.5 border border-white/5"
                            style={{
                                backgroundColor: `${theme.primary}08`
                            }}
                        >
                            <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider block mb-1.5">Encounters</span>
                            <div className="flex items-center gap-1.5 text-white/95">
                                <Hash className="w-4 h-4 flex-shrink-0" style={{ color: theme.primary }} />
                                <span className="text-sm font-bold tabular-nums">
                                    {entry.attempts && entry.attempts > 0 ? entry.attempts.toLocaleString() : '-'}
                                </span>
                            </div>
                            {entry.phase_number && (
                                <div className="mt-1.5 pt-1.5 border-t border-white/5">
                                    <span
                                        className="text-[10px] font-bold uppercase tracking-wider"
                                        style={{ color: theme.primary }}
                                    >
                                        Phase #{entry.phase_number}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Pokeball Detail - Enhanced */}
                    {pokeball && (
                        <div
                            className="mt-3 pt-3 border-t flex items-center justify-between"
                            style={{
                                borderTopColor: `${theme.primary}20`
                            }}
                        >
                            <div className="flex items-center gap-2">
                                {entry.is_fail ? (
                                    <div className="relative overflow-hidden rounded border border-red-500/50 bg-red-950/40 pl-2 pr-3 py-0.5 shadow-[0_0_10px_rgba(239,68,68,0.2)] inset-shadow-sm">
                                        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_45%,rgba(239,68,68,0.2)_50%,transparent_55%)] bg-[length:200%_200%] animate-[shimmer_3s_infinite]" />
                                        <div className="flex items-center gap-1.5">
                                            <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_5px_rgba(239,68,68,0.8)]" />
                                            <span className="text-red-400 font-black text-[10px] tracking-[0.15em] uppercase drop-shadow-sm">
                                                FAIL
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <img src={pokeball.sprite} className="w-5 h-5 object-contain" alt="pokeball" />
                                        <span className="text-[10px] text-white/50 font-semibold uppercase tracking-wide">{pokeball.name}</span>
                                    </>
                                )}
                            </div>
                            {entry.has_shiny_charm && (
                                <div className="flex items-center" title="Shiny Charm Active">
                                    <img
                                        src="/img/items/shiny-charm.png"
                                        className="w-6 h-6 object-contain animate-pulse drop-shadow-[0_0_8px_rgba(234,179,8,0.6)]"
                                        alt="Shiny Charm"
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Action Edit button on card bottom hover? No, let's keep them on top for now */}
        </div>
    );
}
