import { cn } from "@/lib/utils";
import { useState, memo } from "react";
import { useRandomColor } from '@/lib/random-color-context';

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
    onClick
}: PokedexCardProps) {
    const { accentColor } = useRandomColor();
    const [imgError, setImgError] = useState(false);
    const [secondaryImgError, setSecondaryImgError] = useState(false);

    // Calculate glow intensity based on caught percentage
    const glowIntensity = caughtPercentage / 100;
    const isPartial = caughtPercentage > 0 && caughtPercentage < 100;
    const isComplete = caughtPercentage >= 100;

    return (
        <button
            onClick={onClick}
            className={cn(
                "relative group flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-500 border-2",
                "backdrop-blur-sm overflow-hidden cursor-pointer w-full min-h-[210px]",
                "hover:scale-105 active:scale-95",
                !hasCaughtAny && "border-white/5 grayscale hover:grayscale-0",
            )}
            style={{
                borderColor: hasCaughtAny ? `color-mix(in srgb, ${accentColor}, transparent ${isComplete ? 0 : 40}%)` : undefined,
                boxShadow: isComplete ? `0 0 25px ${accentColor}60` : undefined,
                backgroundColor: !hasCaughtAny
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

            {/* Sprites container */}
            <div className="relative flex items-center justify-center z-10 h-44 w-full px-2">
                <div className="flex items-center justify-center gap-1 w-full translate-y-2">
                    {/* Primary sprite */}
                    {!imgError ? (
                        <div className={cn(
                            "relative flex items-center justify-center transition-all duration-500",
                            hasMultipleSprites ? "w-[48%]" : "w-full max-w-[180px]"
                        )}>
                            <img
                                src={spriteUrl}
                                alt={`${displayName} shiny`}
                                className={cn(
                                    "h-full w-full pokemon-sprite transition-all duration-500 object-contain max-h-48",
                                    isPrimaryCaught
                                        ? "drop-shadow-[0_0_12px_rgba(255,255,255,0.8)] scale-105 brightness-110"
                                        : "opacity-40 grayscale group-hover:opacity-60"
                                )}
                                style={{ imageRendering: 'auto' }}
                                loading="lazy"
                                onError={() => setImgError(true)}
                            />
                        </div>
                    ) : (
                        <div className="h-20 w-20" />
                    )}

                    {/* Secondary sprite if applicable */}
                    {hasMultipleSprites && secondarySprite && !secondaryImgError && (
                        <div className="relative w-[48%] flex items-center justify-center transition-all duration-500">
                            <img
                                src={secondarySprite}
                                alt={`${displayName} shiny secondary`}
                                className={cn(
                                    "h-full w-full pokemon-sprite transition-all duration-500 object-contain max-h-40",
                                    isSecondaryCaught
                                        ? "drop-shadow-[0_0_12px_rgba(255,255,255,0.8)] scale-105 brightness-110"
                                        : "opacity-40 grayscale group-hover:opacity-60"
                                )}
                                style={{ imageRendering: 'auto' }}
                                loading="lazy"
                                onError={() => setSecondaryImgError(true)}
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
