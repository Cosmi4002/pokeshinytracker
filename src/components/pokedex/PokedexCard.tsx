import { cn } from "@/lib/utils";
import { memo, useId } from "react";
import { useRandomColor } from '@/lib/random-color-context';
import type { ShinyAvailability } from '@/lib/shiny-availability';
import { Lock, UserX } from "lucide-react";
import { handlePokemonSpriteError, toLocalPokemonSpriteUrl } from "@/lib/pokemon-data";
import type { CardFilterId } from "@/lib/card-effects";

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
    cardFilter?: CardFilterId;
    onClick: () => void;
}

const POKEDEX_SPRITE_SCALE_BY_BASE_ID: Record<number, string> = {
    74: "scale-90", // Geodude
    76: "scale-90", // Golem
    81: "scale-90", // Magnemite
    82: "scale-90", // Magneton
    88: "scale-90", // Grimer
    90: "scale-90", // Shellder
    91: "scale-90", // Cloyster
    92: "scale-90", // Gastly
    93: "scale-90", // Haunter
    94: "scale-90", // Gengar
    100: "scale-90", // Voltorb
    101: "scale-90", // Electrode
    109: "scale-90", // Koffing
    110: "scale-90", // Weezing
    120: "scale-90", // Staryu
    121: "scale-90", // Starmie
    128: "scale-90", // Tauros / Paldean Tauros forms
    137: "scale-90", // Porygon
    201: "scale-90", // Unown
    205: "scale-90", // Forretress
    233: "scale-90", // Porygon2
    337: "scale-90", // Lunatone
    338: "scale-90", // Solrock
    343: "scale-90", // Baltoy
    344: "scale-90", // Claydol
    374: "scale-90", // Beldum
    375: "scale-90", // Metang
    376: "scale-90", // Metagross
    436: "scale-90", // Bronzor
    437: "scale-90", // Bronzong
    462: "scale-90", // Magnezone
    474: "scale-90", // Porygon-Z
    524: "scale-90", // Roggenrola
    525: "scale-90", // Boldore
    526: "scale-90", // Gigalith
    562: "scale-90", // Yamask
    563: "scale-90", // Cofagrigus
    597: "scale-90", // Ferroseed
    598: "scale-90", // Ferrothorn
    599: "scale-90", // Klink
    600: "scale-90", // Klang
    601: "scale-90", // Klinklang
    615: "scale-90", // Cryogonal
    618: "scale-90", // Stunfisk
    707: "scale-90", // Klefki
    774: "scale-90", // Minior
    777: "scale-90", // Togedemaru
    781: "scale-90", // Dhelmise
    790: "scale-90", // Cosmoem
    808: "scale-90", // Meltan
    809: "scale-90", // Melmetal
    870: "scale-90", // Falinks
    877: "scale-90", // Morpeko
    881: "scale-90", // Arctozolt
    882: "scale-90", // Dracovish
    883: "scale-90", // Arctovish
    894: "scale-90", // Regieleki
    895: "scale-90", // Regidrago
    989: "scale-90", // Sandy Shocks
    991: "scale-90", // Iron Bundle
    1001: "scale-90", // Wo-Chien
    1002: "scale-90", // Chien-Pao
    1003: "scale-90", // Ting-Lu
    1004: "scale-90", // Chi-Yu
};

const POKEDEX_SPRITE_SCALE_BY_NAME: Array<[string, string]> = [
    ["paldean tauros", "scale-90"],
    ["paldea tauros", "scale-90"],
    ["combat breed", "scale-90"],
    ["blaze breed", "scale-90"],
    ["aqua breed", "scale-90"],
    ["great tusk", "scale-90"],
    ["iron treads", "scale-90"],
    ["orthworm", "scale-90"],
    ["garganacl", "scale-90"],
    ["klawf", "scale-90"],
    ["bombirdier", "scale-90"],
    ["cetoddle", "scale-90"],
    ["cetitan", "scale-90"],
    ["dondozo", "scale-90"],
    ["baxcalibur", "scale-90"],
    ["ting-lu", "scale-90"],
    ["okidogi", "scale-90"],
    ["gouging fire", "scale-90"],
    ["raging bolt", "scale-90"],
    ["iron boulder", "scale-90"],
    ["iron crown", "scale-90"],
];

const POKEDEX_SPRITE_POSITION_BY_BASE_ID: Record<number, string> = {
    75: "scale-[1.38] -translate-y-7 translate-x-1", // Graveler
    89: "scale-[1.24] -translate-y-5", // Muk
    98: "scale-[1.24] -translate-y-4", // Krabby
    99: "scale-[1.2] -translate-y-4", // Kingler
};

const POKEDEX_SPRITE_POSITION_BY_NAME: Array<[string, string]> = [
    ["galarian farfetch", "scale-[1.2] -translate-y-3"],
    ["galar farfetch", "scale-[1.2] -translate-y-3"],
];

const POKEDEX_SPRITE_EDGE_SHADOW = 'drop-shadow(0 1px 0 rgba(0,0,0,0.88)) drop-shadow(1px 0 0 rgba(0,0,0,0.72)) drop-shadow(0 4px 8px rgba(0,0,0,0.85))';

const POKEDEX_SMALL_SPRITE_SCALE_BY_BASE_ID: Record<number, string> = {
    10: "scale-110", // Caterpie
    11: "scale-110", // Metapod
    13: "scale-110", // Weedle
    14: "scale-110", // Kakuna
    16: "scale-110", // Pidgey
    19: "scale-110", // Rattata
    21: "scale-110", // Spearow
    23: "scale-110", // Ekans
    27: "scale-110", // Sandshrew
    41: "scale-110", // Zubat
    46: "scale-110", // Paras
    48: "scale-110", // Venonat
    50: "scale-110", // Diglett
    60: "scale-110", // Poliwag
    63: "scale-110", // Abra
    66: "scale-110", // Machop
    98: "scale-110", // Krabby
    129: "scale-110", // Magikarp
    132: "scale-110", // Ditto
    133: "scale-110", // Eevee
    138: "scale-110", // Omanyte
    140: "scale-110", // Kabuto
    172: "scale-110", // Pichu
    173: "scale-110", // Cleffa
    174: "scale-110", // Igglybuff
    175: "scale-110", // Togepi
    177: "scale-110", // Natu
    183: "scale-110", // Marill
    191: "scale-110", // Sunkern
    194: "scale-110", // Wooper
    204: "scale-110", // Pineco
    206: "scale-110", // Dunsparce
    209: "scale-110", // Snubbull
    220: "scale-110", // Swinub
    228: "scale-110", // Houndour
    231: "scale-110", // Phanpy
    238: "scale-110", // Smoochum
    239: "scale-110", // Elekid
    240: "scale-110", // Magby
    263: "scale-110", // Zigzagoon
    265: "scale-110", // Wurmple
    266: "scale-110", // Silcoon
    268: "scale-110", // Cascoon
    270: "scale-110", // Lotad
    273: "scale-110", // Seedot
    276: "scale-110", // Taillow
    280: "scale-110", // Ralts
    283: "scale-110", // Surskit
    285: "scale-110", // Shroomish
    287: "scale-110", // Slakoth
    290: "scale-110", // Nincada
    293: "scale-110", // Whismur
    298: "scale-110", // Azurill
    300: "scale-110", // Skitty
    316: "scale-110", // Gulpin
    325: "scale-110", // Spoink
    328: "scale-110", // Trapinch
    333: "scale-110", // Swablu
    339: "scale-110", // Barboach
    349: "scale-110", // Feebas
    353: "scale-110", // Shuppet
    355: "scale-110", // Duskull
    361: "scale-110", // Snorunt
    363: "scale-110", // Spheal
    366: "scale-110", // Clamperl
    401: "scale-110", // Kricketot
    403: "scale-110", // Shinx
    406: "scale-110", // Budew
    412: "scale-110", // Burmy
    415: "scale-110", // Combee
    418: "scale-110", // Buizel
    420: "scale-110", // Cherubi
    422: "scale-110", // Shellos
    425: "scale-110", // Drifloon
    427: "scale-110", // Buneary
    431: "scale-110", // Glameow
    433: "scale-110", // Chingling
    438: "scale-110", // Bonsly
    439: "scale-110", // Mime Jr.
    440: "scale-110", // Happiny
    443: "scale-110", // Gible
    446: "scale-110", // Munchlax
    447: "scale-110", // Riolu
    449: "scale-110", // Hippopotas
    451: "scale-110", // Skorupi
    453: "scale-110", // Croagunk
    456: "scale-110", // Finneon
    458: "scale-110", // Mantyke
    459: "scale-110", // Snover
};

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
    cardFilter = 'none',
    onClick
}: PokedexCardProps) {
    const { accentColor } = useRandomColor();
    const outlineSeed = useId().replace(/:/g, '');
    const primaryOutlineId = `pokedex-primary-outline-${outlineSeed}`;
    const secondaryOutlineId = `pokedex-secondary-outline-${outlineSeed}`;

    // Calculate glow intensity based on caught percentage
    const glowIntensity = caughtPercentage / 100;
    const isPartial = caughtPercentage > 0 && caughtPercentage < 100;
    const isComplete = caughtPercentage >= 100;
    const primarySpriteScaleClass = pokemonId === 978 ? "scale-90" : "";
    const normalizedDisplayName = displayName.toLowerCase();
    const spriteBalanceScaleClass =
        POKEDEX_SPRITE_SCALE_BY_NAME.find(([namePart]) => normalizedDisplayName.includes(namePart))?.[1] ||
        POKEDEX_SPRITE_SCALE_BY_BASE_ID[baseId] ||
        "";
    const spritePositionClass =
        POKEDEX_SPRITE_POSITION_BY_NAME.find(([namePart]) => normalizedDisplayName.includes(namePart))?.[1] ||
        POKEDEX_SPRITE_POSITION_BY_BASE_ID[baseId] ||
        "";
    const spriteFrameClass = hasMultipleSprites
        ? "h-[6.25rem] w-[45%] max-w-[6.25rem] sm:h-[6.8rem] sm:w-[6.8rem] sm:max-w-none"
        : "h-[7.5rem] w-[78%] max-w-[7.5rem] sm:h-[8.1rem] sm:w-[8.1rem] sm:max-w-none";

    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "relative group flex min-h-[236px] w-full cursor-pointer flex-col overflow-hidden rounded-xl border-2 p-3",
                "backdrop-blur-sm transition-all duration-300",
                "shadow-[inset_0_1px_0_rgba(255,255,255,0.32),0_14px_28px_rgba(0,0,0,0.24)]",
                "hover:-translate-y-0.5 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.42),0_18px_34px_rgba(0,0,0,0.32)] active:translate-y-0",
                !hasCaughtAny && !isEvolutionSourceHighlighted && "border-white/5",
            )}
            style={{
                borderColor: isEvolutionSourceHighlighted
                    ? 'rgba(251, 191, 36, 0.9)'
                    : hasCaughtAny
                        ? `color-mix(in srgb, ${accentColor}, transparent ${isComplete ? 0 : 40}%)`
                        : undefined,
                boxShadow: isEvolutionSourceHighlighted
                    ? '0 0 24px rgba(251, 191, 36, 0.45), inset 0 1px 0 rgba(255,255,255,0.42)'
                    : isComplete
                        ? `0 0 25px ${accentColor}66, inset 0 1px 0 rgba(255,255,255,0.42)`
                        : undefined,
                backgroundColor: isEvolutionSourceHighlighted
                    ? 'rgba(120, 83, 18, 0.35)'
                    : !hasCaughtAny
                    ? 'color-mix(in srgb, hsl(var(--card)) 84%, hsl(var(--foreground)) 16%)'
                    : `color-mix(in srgb, ${accentColor} 42%, hsl(var(--card)) 58%)`,
                '--glow-opacity': glowIntensity,
            } as React.CSSProperties}
            onMouseEnter={(e) => {
                if (!hasCaughtAny) e.currentTarget.style.borderColor = accentColor;
            }}
            onMouseLeave={(e) => {
                if (!hasCaughtAny) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
            }}
        >
            {hasCaughtAny && (
                <div
                    className="absolute inset-x-0 top-0 z-[1] h-1"
                    style={{ backgroundColor: accentColor }}
                />
            )}

            {cardFilter === 'holo' && (
                <>
                    <div
                        className="pointer-events-none absolute inset-[1px] z-[2] rounded-[0.65rem] border border-white/20 opacity-70 transition-opacity duration-300 group-hover:opacity-95"
                        style={{
                            background: `linear-gradient(118deg, rgba(255,255,255,0.22) 0%, rgba(134,239,172,0.10) 18%, rgba(125,211,252,0.12) 35%, transparent 49%, rgba(216,180,254,0.14) 67%, rgba(255,255,255,0.16) 100%)`,
                            mixBlendMode: 'screen',
                        }}
                    />
                    <div
                        className="pointer-events-none absolute -left-10 top-8 z-[2] h-16 w-[150%] -rotate-12 bg-gradient-to-r from-transparent via-white/16 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-90"
                        aria-hidden="true"
                    />
                </>
            )}
            {cardFilter === 'cosmic' && (
                <>
                    <div className="pointer-events-none absolute inset-0 z-[2] opacity-45 mix-blend-screen" style={{ background: 'radial-gradient(circle at 20% 22%, rgba(129,140,248,0.28), transparent 34%), radial-gradient(circle at 78% 18%, rgba(236,72,153,0.18), transparent 30%), radial-gradient(circle at 50% 78%, rgba(56,189,248,0.18), transparent 36%)' }} />
                    <div className="pointer-events-none absolute inset-0 z-[2] mix-blend-screen" aria-hidden="true">
                        {[
                            ['18%', '22%', 'h-2.5 w-2.5 opacity-60'],
                            ['72%', '28%', 'h-2 w-2 opacity-55'],
                            ['52%', '76%', 'h-2.5 w-2.5 opacity-50'],
                        ].map(([left, top, size], index) => (
                            <span key={index} className={`absolute ${size} -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[1px] bg-white shadow-[0_0_5px_rgba(255,255,255,0.70),0_0_10px_rgba(125,211,252,0.38)]`} style={{ left, top }} />
                        ))}
                    </div>
                </>
            )}
            {cardFilter === 'prism' && (
                <div className="pointer-events-none absolute inset-[1px] z-[2] rounded-[0.65rem] opacity-45 mix-blend-screen" style={{ background: 'linear-gradient(130deg, transparent 0 13%, rgba(255,255,255,0.18) 16%, rgba(244,114,182,0.10) 24%, transparent 36%), linear-gradient(42deg, transparent 0 24%, rgba(34,211,238,0.13) 31%, rgba(167,139,250,0.10) 40%, transparent 56%), linear-gradient(158deg, transparent 0 48%, rgba(250,204,21,0.10) 58%, transparent 76%)' }} />
            )}
            {cardFilter === 'ember' && (
                <div className="pointer-events-none absolute inset-0 z-[2] opacity-52 mix-blend-screen" style={{ background: 'radial-gradient(circle at 18% 88%, rgba(251,146,60,0.34), transparent 34%), radial-gradient(circle at 82% 22%, rgba(248,113,113,0.20), transparent 30%), linear-gradient(22deg, transparent 18%, rgba(255,237,213,0.10) 44%, transparent 68%)' }} />
            )}
            {cardFilter === 'shadow' && (
                <div className="pointer-events-none absolute inset-0 z-[2] rounded-xl bg-[radial-gradient(circle_at_center,transparent_34%,rgba(0,0,0,0.42)_100%)] opacity-70" />
            )}

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

            <div className="relative z-20 flex w-full items-center justify-between gap-2">
                <span className="rounded-md border border-white/10 bg-black/25 px-2 py-1 text-[11px] font-black leading-none text-white/75 tabular-nums backdrop-blur-sm">
                    #{baseId.toString().padStart(4, '0')}
                </span>
                {hasCaughtAny && (
                    <span
                        className={cn(
                            "inline-flex h-6 min-w-6 items-center justify-center rounded-md px-2 text-[10px] font-black leading-none text-white shadow-sm",
                            isComplete ? "bg-primary" : "bg-white/10"
                        )}
                        style={isComplete ? { backgroundColor: accentColor } : undefined}
                    >
                        {isComplete ? "✓" : `${Math.round(caughtPercentage)}%`}
                    </span>
                )}
            </div>

            {isEvolutionSourceHighlighted && (
                <div className="absolute left-2 top-9 z-20 rounded-full border border-amber-300/70 bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-100">
                    EVO
                </div>
            )}

            {shinyAvailability !== 'ok' && (
                <div
                    className={cn(
                        "absolute z-20 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold shadow-sm backdrop-blur",
                        isEvolutionSourceHighlighted ? "top-14 left-2" : "top-9 left-2",
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
            <div className="relative z-10 mt-2 flex h-[164px] w-full items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-black/20 px-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.22),inset_0_-10px_20px_rgba(0,0,0,0.18)] sm:h-[168px] sm:px-3">
                <div
                    className="pointer-events-none absolute inset-0 z-[1] opacity-70"
                    style={{
                        background: `linear-gradient(128deg, rgba(255,255,255,0.20) 0%, rgba(125,211,252,0.10) 22%, transparent 42%, rgba(244,114,182,0.10) 72%, transparent 100%)`,
                        mixBlendMode: 'screen',
                    }}
                    aria-hidden="true"
                />
                <svg className="absolute h-0 w-0" aria-hidden="true" focusable="false">
                    <filter id={primaryOutlineId} x="-32%" y="-32%" width="164%" height="164%" colorInterpolationFilters="sRGB">
                        <feMorphology in="SourceAlpha" operator="dilate" radius="0.5" result="outline" />
                        <feFlood floodColor="#050505" result="outlineColor" />
                        <feComposite in="outlineColor" in2="outline" operator="in" result="outlineShape" />
                        <feMerge>
                            <feMergeNode in="outlineShape" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <filter id={secondaryOutlineId} x="-32%" y="-32%" width="164%" height="164%" colorInterpolationFilters="sRGB">
                        <feMorphology in="SourceAlpha" operator="dilate" radius="0.5" result="outline" />
                        <feFlood floodColor="#050505" result="outlineColor" />
                        <feComposite in="outlineColor" in2="outline" operator="in" result="outlineShape" />
                        <feMerge>
                            <feMergeNode in="outlineShape" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </svg>
                <div className="flex h-full w-full items-center justify-center gap-1">
                    {/* Primary sprite */}
                    <div className={cn(
                        "relative flex shrink-0 items-center justify-center transition-all duration-500",
                        spriteFrameClass,
                        primarySpriteScaleClass
                    )}>
                        <img
                            key={spriteUrl}
                            src={toLocalPokemonSpriteUrl(spriteUrl)}
                            alt={`${displayName} shiny`}
                            className={cn(
                                "pokemon-sprite h-full w-full object-contain transition-all duration-500",
                                isPrimaryCaught
                                    ? "brightness-110"
                                    : "",
                                spriteBalanceScaleClass,
                                spritePositionClass
                            )}
                            style={{
                                imageRendering: 'auto',
                                filter: isPrimaryCaught
                                    ? `url(#${primaryOutlineId}) ${POKEDEX_SPRITE_EDGE_SHADOW}`
                                    : `grayscale(1) brightness(0.78) url(#${primaryOutlineId}) ${POKEDEX_SPRITE_EDGE_SHADOW}`,
                            }}
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
                        <div className={cn(
                            "relative flex shrink-0 items-center justify-center transition-all duration-500",
                            spriteFrameClass
                        )}>
                            <img
                                key={secondarySprite}
                                src={toLocalPokemonSpriteUrl(secondarySprite)}
                                alt={`${displayName} shiny secondary`}
                                className={cn(
                                    "pokemon-sprite h-full w-full object-contain transition-all duration-500",
                                    isSecondaryCaught
                                        ? "brightness-110"
                                        : "",
                                    spriteBalanceScaleClass,
                                    spritePositionClass
                                )}
                                style={{
                                    imageRendering: 'auto',
                                    filter: isSecondaryCaught
                                        ? `url(#${secondaryOutlineId}) ${POKEDEX_SPRITE_EDGE_SHADOW}`
                                        : `grayscale(1) brightness(0.78) url(#${secondaryOutlineId}) ${POKEDEX_SPRITE_EDGE_SHADOW}`,
                                }}
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
            <div className="z-10 mt-2 flex min-h-[40px] w-full flex-col items-center justify-center rounded-lg border border-white/10 bg-black/20 px-2 py-2">
                <p className={cn(
                    "max-w-full truncate text-center text-sm font-medium transition-colors",
                    isComplete ? "text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]" : "text-muted-foreground"
                )}>
                    {displayName}
                </p>
            </div>

            {/* Completion indicator */}
            {false && hasCaughtAny && (
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
            {cardFilter === 'holo' && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
            )}
        </button>
    );
});
