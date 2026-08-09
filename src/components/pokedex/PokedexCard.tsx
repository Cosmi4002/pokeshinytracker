import { cn } from "@/lib/utils";
import { memo } from "react";
import { useRandomColor } from '@/lib/random-color-context';
import type { ShinyAvailability } from '@/lib/shiny-availability';
import { Lock, UserX } from "lucide-react";
import { handlePokemonSpriteError, toLocalPokemonSpriteUrl } from "@/lib/pokemon-data";

interface PokedexCardProps {
    pokemonId: number;
    baseId: number;
    displayName: string;
    spriteUrl: string;
    secondarySprite?: string;
    hasMultipleSprites: boolean;
    isPrimaryCaught?: boolean;
    isSecondaryCaught?: boolean;
    caughtPercentage: number; // 0-100
    hasCaughtAny: boolean;
    isEvolutionSourceHighlighted?: boolean;
    shinyAvailability?: ShinyAvailability;
    onClick: () => void;
}

export const PokedexCard = memo(function PokedexCard({
    pokemonId,
    baseId,
    displayName,
    spriteUrl,
    secondarySprite,
    hasMultipleSprites,
    isPrimaryCaught = false,
    isSecondaryCaught = false,
    caughtPercentage,
    hasCaughtAny,
    isEvolutionSourceHighlighted = false,
    shinyAvailability = 'ok',
    onClick
}: PokedexCardProps) {
    const { accentColor } = useRandomColor();

    // Calculate glow intensity based on caught percentage
    const glowIntensity = caughtPercentage / 100;
    const isPartial = caughtPercentage > 0 && caughtPercentage < 100;
    const isComplete = caughtPercentage >= 100;
    const primarySpriteScaleClass = pokemonId === 978 ? "scale-90" : "";

    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "relative group flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-500 border-2",
                "backdrop-blur-sm overflow-hidden cursor-pointer w-full min-h-[210px]",
                "hover:scale-105 active:scale-95",
                !hasCaughtAny && !isEvolutionSourceHighlighted && "border-white/5 grayscale hover:grayscale-0",
            )}
            style={{
                borderColor: isEvolutionSourceHighlighted
                    ? 'rgba(251, 191, 36, 0.9)'
                    : hasCaughtAny
                        ? `color-mix(in srgb, ${accentColor}, transparent ${isComplete ? 0 : 40}%)`
                        : undefined,
                boxShadow: isEvolutionSourceHighlighted
                    ? '0 0 24px rgba(251, 191, 36, 0.45), inset 0 0 12px rgba(251, 191, 36, 0.2)'
                    : isComplete
                        ? `0 0 25px ${accentColor}60`
                        : undefined,
                backgroundColor: isEvolutionSourceHighlighted
                    ? 'rgba(120, 83, 18, 0.35)'
                    : !hasCaughtAny
                    ? 'rgba(0, 0, 0, 0.6)'
                    : `color-mix(in srgb, ${accentColor}, black 85%)`,
                '--glow-opacity': glowIntensity,
            } as React.CSSProperties}
            onMouseEnter={(e) => {
                if (!hasCaughtAny) e.currentTarget.style.borderColor = accentColor;
            }}
            onMouseLeave={(e) => {
                if (!hasCaughtAny) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
            }}
        >
            {/* Background gradient for partial completion */}
            {isPartial && (
                <div
                    className="absolute inset-0 z-0"
                    style={{
                        background: `linear-gradient(to right, ${accentColor}10, transparent)`
                    }}
                />
            )}

            {/* Shiny glow effect */}
            {hasCaughtAny && (
                <div className={cn(
                    "absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent",
                    isComplete ? "opacity-60" : "opacity-30"
                )} />
            )}

            {isEvolutionSourceHighlighted && (
                <div className="absolute top-2 left-2 z-20 rounded-full border border-amber-300/70 bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-100">
                    EVO
                </div>
            )}

            {shinyAvailability !== 'ok' && (
                <div
                    className={cn(
                        "absolute z-20 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold shadow-sm backdrop-blur",
                        isEvolutionSourceHighlighted ? "top-7 left-2" : "top-2 left-2",
                        shinyAvailability === 'unobtainable'
                            ? "border-fuchsia-200/70 bg-fuchsia-500/20 text-fuchsia-50 ring-1 ring-fuchsia-300/30"
                            : "border-amber-200/70 bg-amber-500/20 text-amber-50 ring-1 ring-amber-300/30"
                    )}
                    title={shinyAvailability === 'unobtainable'
                        ? 'Shiny Locked'
                        : 'No Own OT'
                    }
                >
                    {shinyAvailability === 'unobtainable' ? (
                        <>
                            <Lock className="h-3 w-3" />
                            <span>Shiny Locked</span>
                        </>
                    ) : (
                        <>
                            <UserX className="h-3 w-3" />
                            <span>No Own OT</span>
                        </>
                    )}
                </div>
            )}

            {/* Sprites container */}
            <div className="relative flex items-center justify-center z-10 h-44 w-full px-2">
                <div className="flex items-center justify-center gap-1 w-full translate-y-2">
                    {/* Primary sprite */}
                    <div className={cn(
                        "relative flex items-center justify-center transition-all duration-500",
                        hasMultipleSprites ? "w-[48%]" : "w-full max-w-[180px]",
                        primarySpriteScaleClass
                    )}>
                        <img
                            key={spriteUrl}
                            src={toLocalPokemonSpriteUrl(spriteUrl)}
                            alt={`${displayName} shiny`}
                            className={cn(
                                "h-full w-full pokemon-sprite transition-all duration-500 object-contain max-h-48",
                                isPrimaryCaught
                                    ? "drop-shadow-[0_0_12px_rgba(255,255,255,0.8)] scale-105 brightness-110"
                                    : "opacity-40 grayscale group-hover:opacity-60"
                            )}
                            style={{ imageRendering: 'auto' }}
                            loading="lazy"
                            decoding="async"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                                handlePokemonSpriteError(e.currentTarget);
                            }}
                        />
                    </div>

                    {/* Secondary sprite if applicable */}
                    {hasMultipleSprites && secondarySprite && (
                        <div className="relative w-[48%] flex items-center justify-center transition-all duration-500">
                            <img
                                key={secondarySprite}
                                src={toLocalPokemonSpriteUrl(secondarySprite)}
                                alt={`${displayName} shiny secondary`}
                                className={cn(
                                    "h-full w-full pokemon-sprite transition-all duration-500 object-contain max-h-40",
                                    isSecondaryCaught
                                        ? "drop-shadow-[0_0_12px_rgba(255,255,255,0.8)] scale-105 brightness-110"
                                        : "opacity-40 grayscale group-hover:opacity-60"
                                )}
                                style={{ imageRendering: 'auto' }}
                                loading="lazy"
                                decoding="async"
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                    handlePokemonSpriteError(e.currentTarget);
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Pokemon info */}
            <div className="flex flex-col items-center mt-2 z-10">
                <p className="text-xs text-muted-foreground">
                    #{baseId.toString().padStart(4, '0')}
                </p>
                <p className={cn(
                    "text-sm font-medium truncate max-w-full transition-colors",
                    isComplete ? "text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]" : "text-muted-foreground"
                )}>
                    {displayName}
                </p>
            </div>

            {/* Completion indicator */}
            {hasCaughtAny && (
                <div className={cn(
                    "absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm",
                    isComplete
                        ? "bg-primary text-white"
                        : "bg-white/10 text-white/80"
                )}>
                    {isComplete ? "✓" : `${Math.round(caughtPercentage)}%`}
                </div>
            )}

            {/* Premium shine sweep effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
        </button>
    );
});
