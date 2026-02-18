import { Pencil, Trash2, Calendar, ArrowUpCircle } from 'lucide-react';
import { useRandomColor } from '@/lib/random-color-context';
import { Button } from '@/components/ui/button';
import { getGameTheme, GAME_ICONS, GAME_COVER_ART, GAME_LOGOS } from '@/lib/game-themes';
import { POKEBALLS, HUNTING_METHODS, getPokemonSpriteUrl } from '@/lib/pokemon-data';
import { formatPokemonName } from '@/hooks/use-pokemon';
import type { Tables } from '@/integrations/supabase/types';
import { useMemo, useCallback, useState } from 'react';
import { cn } from '@/lib/utils';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type CaughtShinyRow = Tables<'caught_shinies'>;

interface ShinyCardProps {
    entry: CaughtShinyRow;
    onEdit: () => void;
    onDelete: () => void;
    onEvolve: () => void; // Added evolve handler
}

export function ShinyCard({ entry, onEdit, onDelete, onEvolve }: ShinyCardProps) {
    const { accentColor } = useRandomColor();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleEvolveClick = () => {
        setIsDialogOpen(true);
    };

    const handleDialogClose = () => {
        setIsDialogOpen(false);
    };

    const theme = useMemo(() => getGameTheme(entry.game), [entry.game]);
    const pokeball = useMemo(() => POKEBALLS.find((b) => b.id === entry.pokeball), [entry.pokeball]);
    const method = useMemo(() => HUNTING_METHODS.find((m) => m.id === entry.method), [entry.method]);

    const spriteUrl = useMemo(() => getPokemonSpriteUrl(entry.pokemon_id, {
        shiny: true,
        name: entry.pokemon_name,
        form: entry.form || undefined,
        female: entry.gender === 'female'
    }), [entry.pokemon_id, entry.pokemon_name, entry.form, entry.gender]);

    const displayName = entry.pokemon_name;

    const formatDate = useCallback((dateString: string) => {
        if (!dateString) return 'Unknown';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }, []);

    const evolvedIcon = entry.is_evolved ? (
        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
            Evolved
        </div>
    ) : (
        <div className="absolute top-2 right-2 bg-gray-500 text-white text-xs font-bold px-2 py-1 rounded">
            Base
        </div>
    );

    return (
        <div
            className={cn(
                "group relative h-full flex flex-col overflow-hidden rounded-2xl border bg-[#2d2d2d] shadow-2xl transition-all duration-500 hover:shadow-[0_0_30px_rgba(0,0,0,0.5)] hover:-translate-y-2",
                entry.is_fail ? "border-red-500/80 shadow-[0_0_20px_rgba(239,68,68,0.25)] ring-1 ring-red-500/50" : "border-white/10"
            )}
            style={{
                borderColor: entry.is_fail ? '#ef4444' : `${accentColor}50`,
            }}
        >
            {evolvedIcon}
            {/* TOP AREA: VISUAL (Fixed aspect ratio) */}
            <div className="relative w-full aspect-[16/10] overflow-hidden bg-black/40">
                {/* Game Cover Art Background */}
                {GAME_COVER_ART[entry.game] ? (
                    <div className="absolute inset-0 z-0 overflow-hidden">
                        <img
                            src={GAME_COVER_ART[entry.game]}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-contain opacity-40 transform transition-transform duration-700 group-hover:scale-105"
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
                    {/* Character Platform/Grounding */}
                    <div
                        className="absolute bottom-1/4 w-32 h-8 blur-xl opacity-60 rounded-[100%]"
                        style={{
                            background: `radial-gradient(ellipse at center, ${theme.primary}, transparent 70%)`,
                        }}
                    />
                    <img
                        key={spriteUrl}
                        src={spriteUrl}
                        loading="lazy"
                        decoding="async"
                        alt={entry.pokemon_name}
                        className="w-32 h-32 lg:w-40 lg:h-40 object-contain pokemon-sprite drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] transition-all duration-500 group-hover:scale-110 relative z-10"
                        style={{ imageRendering: 'auto' }}
                        onError={(e) => {
                            e.currentTarget.src = '/fallback-sprite.png';
                        }}
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
                            onClick={onEvolve}
                            className="h-8 w-8 rounded-full bg-black/50 hover:bg-green-500 text-white border border-white/10 backdrop-blur-md shadow-lg"
                        >
                            <ArrowUpCircle className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    className="h-8 w-8 rounded-full bg-black/50 hover:bg-destructive text-white border border-white/10 backdrop-blur-md shadow-lg"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-[#1a1a1a] border-white/10 text-white">
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="text-xl font-bold">Delete {displayName}?</AlertDialogTitle>
                                    <AlertDialogDescription className="text-white/60">
                                        Sei sicuro di voler eliminare questo Pokémon dalla tua collezione? Questa azione non può essere annullata.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel className="bg-white/5 hover:bg-white/10 border-white/10 text-white">
                                        Annulla
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={onDelete}
                                        className="bg-destructive hover:bg-destructive/90 text-white"
                                    >
                                        Elimina
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
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
                                {displayName}
                            </h3>
                            {entry.gender && (entry.gender === 'male' || entry.gender === 'female') && (
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
                                        loading="lazy"
                                        decoding="async"
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

                    {/* Info Grid - Darker boxes and better alignment */}
                    <div className="grid grid-cols-2 gap-3 mt-4">
                        <div
                            className="rounded-xl p-3 border border-white/10 shadow-lg"
                            style={{
                                backgroundColor: `${theme.primary}25`,
                                borderColor: `${theme.primary}40`
                            }}
                        >
                            <div className="flex items-center gap-1.5 mb-2">
                                <Calendar className="w-3.5 h-3.5 text-white/60" />
                                <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">
                                    {entry.is_fail ? 'Duration' : 'Hunt Dates'}
                                </span>
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-white/40 font-bold uppercase w-8">Start</span>
                                    <span className="text-[11px] font-bold text-white/90 tabular-nums">
                                        {entry.hunt_start_date ? formatDate(entry.hunt_start_date) : 'Unknown'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-white/40 font-bold uppercase w-8">End</span>
                                    <span className="text-[11px] font-bold text-white/90 tabular-nums">
                                        {formatDate(entry.caught_date)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div
                            className="rounded-xl p-3 border border-white/10 shadow-lg flex flex-col justify-between"
                            style={{
                                backgroundColor: `${theme.primary}25`,
                                borderColor: `${theme.primary}40`
                            }}
                        >
                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] block mb-1.5">Encounters</span>
                            <div className="flex items-center gap-2 mt-auto">
                                <span className="text-3xl font-black tabular-nums tracking-tighter text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] leading-none">
                                    {entry.attempts && entry.attempts > 0 ? entry.attempts.toLocaleString() : '-'}
                                </span>
                            </div>
                            {entry.phase_number && (
                                <div className="mt-1 pt-1 border-t border-white/10">
                                    <span
                                        className="text-[10px] font-black uppercase tracking-widest bg-white/10 px-1.5 py-0.5 rounded"
                                        style={{ color: theme.primary }}
                                    >
                                        PHASE #{entry.phase_number}
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
                                        <img
                                            src={pokeball.sprite}
                                            loading="lazy"
                                            decoding="async"
                                            className="w-5 h-5 object-contain"
                                            alt="pokeball"
                                        />
                                        <span className="text-[10px] text-white/50 font-semibold uppercase tracking-wide">{pokeball.name}</span>
                                    </>
                                )}
                            </div>
                            {entry.has_shiny_charm && (
                                <div className="flex items-center" title="Shiny Charm Active">
                                    <img
                                        src="/img/items/shiny-charm.png"
                                        loading="lazy"
                                        decoding="async"
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
