import { cn } from "@/lib/utils";
import { useState } from "react";

interface PokedexCardProps {
    pokemonId: number;
    displayName: string;
    spriteUrl: string;
    femaleSprite?: string;
    hasGenderDiff: boolean;
    caughtPercentage: number; // 0-100, for partial illumination
    hasCaughtAny: boolean;
    onClick: () => void;
}

export function PokedexCard({
    pokemonId,
    displayName,
    spriteUrl,
    femaleSprite,
    hasGenderDiff,
    caughtPercentage,
    hasCaughtAny,
    onClick
}: PokedexCardProps) {
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
                "backdrop-blur-sm overflow-hidden cursor-pointer w-full",
                "hover:scale-105 active:scale-95",
                // Base state
                !hasCaughtAny && "bg-muted/10 border-white/5 hover:border-primary/40 grayscale hover:grayscale-0",
                // Partial caught
                isPartial && "bg-gradient-to-t from-primary/20 via-transparent to-transparent border-primary/30",
                // Complete caught
                isComplete && "bg-primary/15 border-primary/50 shadow-[0_0_25px_rgba(var(--primary),0.4)] ring-1 ring-primary/30"
            )}
            style={{
                // Dynamic partial glow using CSS variable
                '--glow-opacity': glowIntensity,
            } as React.CSSProperties}
        >
            {/* Background gradient for partial completion */}
            {isPartial && (
                <div
                    className="absolute inset-0 bg-gradient-to-t from-primary/30 to-transparent"
                    style={{ height: `${caughtPercentage}%`, bottom: 0, top: 'auto' }}
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
            <div className="relative flex justify-center gap-1 z-10">
                {/* Default/Male sprite */}
                {!imgError && (
                    <img
                        src={spriteUrl}
                        alt={`${displayName} shiny`}
                        className={cn(
                            "h-16 w-16 pokemon-sprite transition-all duration-500",
                            hasCaughtAny
                                ? "drop-shadow-[0_0_10px_rgba(255,255,255,0.6)] scale-105"
                                : "opacity-60 group-hover:opacity-100 group-hover:scale-110"
                        )}
                        loading="lazy"
                        onError={() => setImgError(true)}
                    />
                )}

                {/* Female sprite */}
                {hasGenderDiff && femaleSprite && !femaleImgError && (
                    <img
                        src={femaleSprite}
                        alt={`${displayName} shiny female`}
                        className={cn(
                            "h-16 w-16 pokemon-sprite transition-all duration-500",
                            hasCaughtAny
                                ? "drop-shadow-[0_0_10px_rgba(255,255,255,0.6)] scale-105"
                                : "opacity-60 group-hover:opacity-100 group-hover:scale-110"
                        )}
                        loading="lazy"
                        onError={() => setFemaleImgError(true)}
                    />
                )}
            </div>

            {/* Pokemon info */}
            <div className="flex flex-col items-center mt-2 z-10">
                <p className="text-xs text-muted-foreground">
                    #{pokemonId.toString().padStart(4, '0')}
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
}
