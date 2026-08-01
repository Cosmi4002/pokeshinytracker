import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface ColorPickerProps {
    label: string;
    value: string;
    onChange: (color: string) => void;
    presets?: string[];
}

const DEFAULT_PRESETS = [
    '#8b5cf6', // Purple (default)
    '#3b82f6', // Blue
    '#10b981', // Green
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#8b5cf6', // Violet
];

export function ColorPicker({ label, value, onChange, presets = DEFAULT_PRESETS }: ColorPickerProps) {
    const [customColor, setCustomColor] = useState(value);

    useEffect(() => {
        setCustomColor(value);
    }, [value]);

    const handlePresetClick = (color: string) => {
        setCustomColor(color);
        onChange(color);
    };

    const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const color = e.target.value;
        setCustomColor(color);
        onChange(color);
    };

    return (
        <div className="space-y-3 rounded-xl border border-border/70 bg-muted/20 p-3">
            <div className="flex items-center justify-between gap-3">
                <Label>{label}</Label>
                <span className="rounded-full border border-border/70 bg-background px-2.5 py-1 font-mono text-xs uppercase text-muted-foreground">
                    {customColor}
                </span>
            </div>

            {/* Preset Colors */}
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                {presets.map((preset, index) => (
                    <button
                        key={`${preset}-${index}`}
                        type="button"
                        onClick={() => handlePresetClick(preset)}
                        className="relative h-9 rounded-full border transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                        style={{
                            backgroundColor: preset,
                            borderColor: value === preset ? 'hsl(var(--foreground))' : 'hsl(var(--border))',
                            boxShadow: value === preset ? `0 0 0 3px ${preset}33` : undefined,
                        }}
                        title={preset}
                    >
                        {value === preset && (
                            <Check className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow-lg" />
                        )}
                    </button>
                ))}
            </div>

            {/* Custom Color Input */}
            <div className="flex gap-2 items-center">
                <Input
                    type="color"
                    value={customColor}
                    onChange={handleCustomChange}
                    className="h-11 w-14 cursor-pointer rounded-xl p-1"
                />
                <Input
                    type="text"
                    value={customColor}
                    onChange={handleCustomChange}
                    placeholder="#000000"
                    className="h-11 flex-1 rounded-xl font-mono text-sm uppercase"
                    maxLength={7}
                />
            </div>
        </div>
    );
}
