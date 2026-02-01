import { cn } from '@/lib/utils';

interface GenderSelectorProps {
    value: string;
    onChange: (gender: string) => void;
    className?: string;
}

const genderOptions = [
    { value: 'male', icon: '♂', label: 'Maschio', color: 'text-blue-500 hover:bg-blue-500/20 border-blue-500/50' },
    { value: 'female', icon: '♀', label: 'Femmina', color: 'text-pink-500 hover:bg-pink-500/20 border-pink-500/50' },
    { value: 'genderless', icon: '⚪', label: 'Senza genere', color: 'text-gray-400 hover:bg-gray-400/20 border-gray-400/50' },
];

export function GenderSelector({ value, onChange, className }: GenderSelectorProps) {
    return (
        <div className={cn("flex gap-2", className)}>
            {genderOptions.map((option) => {
                const isSelected = value === option.value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => onChange(isSelected ? '' : option.value)}
                        title={option.label}
                        className={cn(
                            "w-10 h-10 rounded-lg border-2 transition-all duration-200 flex items-center justify-center text-xl font-bold",
                            option.color,
                            isSelected
                                ? "bg-current/20 border-current ring-2 ring-current/30 scale-110"
                                : "bg-muted/30 border-white/10 opacity-60 hover:opacity-100"
                        )}
                    >
                        <span className={cn(
                            "transition-transform",
                            isSelected && "scale-110"
                        )}>
                            {option.icon}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
