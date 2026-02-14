import { cn } from "@/lib/utils";

interface ShinyButtonProps {
    spriteUrl: string;
    label: string;
    isCaught: boolean;
    onClick: () => void;
    onCounterClick?: () => void;
    isLoading?: boolean;
}

export function ShinyButton({
    spriteUrl,
    label,
    isCaught,
    onClick,
    onCounterClick,
    isLoading = false
}: ShinyButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={isLoading}
            className={cn(
                "relative group flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-500 border-2",
                "backdrop-blur-sm overflow-hidden",
                // Base styles
                "hover:scale-105 active:scale-95",
                // Conditional styles based on caught status
                isCaught
                    ? "bg-primary/10 border-primary/50 shadow-[0_0_20px_rgba(var(--primary),0.3)] ring-1 ring-primary/20"
                    : "bg-muted/10 border-white/5 hover:border-primary/40 hover:bg-muted/20 grayscale hover:grayscale-0",
                isLoading && "opacity-50 cursor-not-allowed"
            )}
        >
            {/* Background Glow */}
            {isCaught && (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-50" />
            )}

            <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center z-10">
                <img
                    src={spriteUrl}
                    alt={label}
                    className={cn(
                        "max-w-full max-h-full object-contain transition-all duration-700 pixelated",
                        isCaught
                            ? "drop-shadow-[0_0_12px_rgba(255,255,255,0.8)] scale-110"
                            : "opacity-60 group-hover:opacity-100 group-hover:scale-110"
                    )}
                    loading="lazy"
                />

                {/* Dynamic shine flare */}
                {isCaught && (
                    <div className="absolute -inset-4 bg-white/20 blur-[30px] rounded-full animate-pulse z-0" />
                )}
            </div>

            <div className="flex flex-col items-center mt-2 z-10">
                <span className={cn(
                    "text-[10px] uppercase tracking-wider font-bold mb-0.5 opacity-50",
                    isCaught ? "text-primary" : "text-muted-foreground"
                )}>
                    {isCaught ? 'Caught' : 'Missing'}
                </span>
                <span className={cn(
                    "text-xs font-semibold max-w-[100px] truncate px-1 transition-colors",
                    isCaught ? "text-white drop-shadow-[0_0_5px_rgba(var(--primary),1)]" : "text-muted-foreground/80"
                )}>
                    {label}
                </span>
            </div>

            {/* Counter button */}
            {onCounterClick ? (
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        onCounterClick();
                    }}
                    className="absolute top-0 right-0 w-10 h-10 flex items-start justify-end p-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:text-primary cursor-pointer"
                    title="Vai al Counter"
                >
                    <div className="bg-background/80 backdrop-blur-sm p-1 rounded-full border border-primary/20 hover:border-primary/50 transition-colors">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="12" cy="12" r="10" />
                            <circle cx="12" cy="12" r="3" />
                            <line x1="12" y1="2" x2="12" y2="4" />
                            <line x1="12" y1="20" x2="12" y2="22" />
                            <line x1="2" y1="12" x2="4" y2="12" />
                            <line x1="20" y1="12" x2="22" y2="12" />
                        </svg>
                    </div>
                </div>
            ) : isCaught && (
                <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl from-primary/20 to-transparent flex items-start justify-end p-2 transition-opacity duration-500">
                    <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_currentColor]" />
                </div>
            )}

            {/* Sweep effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
        </button>
    );
}
