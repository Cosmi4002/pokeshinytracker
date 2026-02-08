import { cn } from "@/lib/utils";
import { useState, memo } from "react";
import { useRandomColor } from '@/lib/random-color-context';

interface PokedexCardProps {
    pokemonId: number;
    baseId: number;
    displayName: string;
    spriteUrl: string;
    femaleSprite?: string;
    hasGenderDiff: boolean;
    caughtPercentage: number; // 0-100, for partial illumination
    hasCaughtAny: boolean;
    onClick: () => void;
}

export const PokedexCard = memo(function PokedexCard({
    pokemonId,
    baseId,
    displayName,
    spriteUrl,
    femaleSprite,
    hasGenderDiff,
    caughtPercentage,
    hasCaughtAny,
    onClick
}: PokedexCardProps) {
    const { accentColor } = useRandomColor();
    const [imgError, setImgError] = useState(false);
    const [femaleImgError, setFemaleImgError] = useState(false);

    // Calculate glow intensity based on caught percentage
    const glowIntensity = caughtPercentage / 100;
    const isPartial = caughtPercentage > 0 && caughtPercentage < 100;
    const isComplete = caughtPercentage >= 100;

    return (
        <button
            onClick={onClick}
            className={cn(
                "relative group flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-500 border-2",
                "backdrop-blur-sm overflow-hidden cursor-pointer w-full min-h-[180px]", // Increased for larger sprites
                "hover:scale-105 active:scale-95",
                // Base state
                !hasCaughtAny && "border-white/5 grayscale hover:grayscale-0",
                // Partial caught
                // isPartial && "border-primary",
                // Complete caught
                // isComplete && "border-primary shadow-[0_0_25px_rgba(var(--primary),0.4)] ring-1 ring-primary"
            )}
            style={{
                // Fix for dynamic opacity with hex vars
                borderColor: hasCaughtAny ? accentColor : undefined,
                boxShadow: isComplete ? `0 0 25px ${accentColor}60` : undefined,
                backgroundColor: !hasCaughtAny
                    ? 'rgba(0, 0, 0, 0.6)'
                    : `color-mix(in srgb, ${accentColor}, black 80%)`,
                // Dynamic partial glow using CSS variable
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
                    className="absolute inset-0"
                    style={{
                        height: `${caughtPercentage}%`,
                        bottom: 0,
                        top: 'auto',
                        background: 'linear-gradient(to top, color-mix(in srgb, var(--primary), transparent 70%), transparent)'
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
            <div className="relative flex items-center justify-center z-10 h-32 w-full px-2"> {/* Increased height for better centering */}
                {/* Wrapper for sprites to ensure balanced centering */}
                <div className="flex items-center justify-center gap-1 w-full translate-y-2">
                    {/* Default/Male sprite */}
                    {!imgError ? (
                        <div className={cn(
                            "relative flex items-center justify-center transition-all duration-500",
                            hasGenderDiff ? "w-24" : "w-32"
                        )}>
                            <img
                                src={spriteUrl}
                                alt={`${displayName} shiny`}
                                className={cn(
                                    "h-full w-full pokemon-sprite transition-all duration-500 object-contain",
                                    hasCaughtAny
                                        ? "drop-shadow-[0_0_12px_rgba(255,255,255,0.7)] scale-105"
                                        : "opacity-60 group-hover:opacity-100 group-hover:scale-110"
                                )}
                                style={{ imageRendering: 'auto' }}
                                loading="lazy"
                                onError={() => setImgError(true)}
                            />
                        </div>
                    ) : (
                        <div className="h-20 w-20" />
                    )}

                    {/* Female sprite */}
                    {hasGenderDiff && femaleSprite && !femaleImgError && (
                        <div className="relative w-20 flex items-center justify-center transition-all duration-500 -ml-2">
                            <img
                                src={femaleSprite}
                                alt={`${displayName} shiny female`}
                                className={cn(
                                    "h-full w-full pokemon-sprite transition-all duration-500 object-contain",
                                    hasCaughtAny
                                        ? "drop-shadow-[0_0_12px_rgba(255,255,255,0.7)] scale-105"
                                        : "opacity-60 group-hover:opacity-100 group-hover:scale-110"
                                )}
                                style={{ imageRendering: 'auto' }}
                                loading="lazy"
                                onError={() => setFemaleImgError(true)}
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
                    hasCaughtAny && "text-white drop-shadow-[0_0_5px_rgba(var(--primary),0.8)]"
                )}>
                    {displayName}
                </p>
            </div>

            {/* Completion indicator */}
            {hasCaughtAny && (
                <div className={cn(
                    "absolute top-1 right-1 flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                    isComplete
                        ? "bg-primary/80 text-white"
                        : "bg-primary/40 text-primary-foreground/80"
                )}>
                    {isComplete ? "✓" : `${Math.round(caughtPercentage)}%`}
                </div>
            )}

            {/* Premium shine sweep effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
        </button>
    );
});
