import { useEffect, useState } from 'react';
import { Check, Palette } from 'lucide-react';
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
    '#14b8a6', // Teal
    '#f97316', // Orange
    '#84cc16', // Lime
    '#6366f1', // Indigo
    '#f43f5e', // Rose
];

const isHexColor = (color: string) => /^#[0-9a-fA-F]{6}$/.test(color);

export function ColorPicker({ label, value, onChange, presets = DEFAULT_PRESETS }: ColorPickerProps) {
    const [customColor, setCustomColor] = useState(value);
    const pickerColor = isHexColor(customColor) ? customColor : value;

    useEffect(() => {
        setCustomColor(value);
    }, [value]);

    const handlePresetClick = (color: string) => {
        setCustomColor(color);
        onChange(color);
    };

    const handleColorInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const color = e.target.value;
        setCustomColor(color);
        onChange(color);
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const color = e.target.value;
        setCustomColor(color);
        if (isHexColor(color)) {
            onChange(color);
        }
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
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_8rem]">
                <label className="relative flex h-12 cursor-pointer items-center gap-3 overflow-hidden rounded-xl border border-border bg-background px-3 shadow-sm transition hover:border-primary/50">
                    <span
                        className="h-8 w-8 shrink-0 rounded-full border border-border shadow-inner"
                        style={{ backgroundColor: pickerColor }}
                    />
                    <span className="min-w-0 flex-1 text-left text-sm font-semibold text-foreground">
                        Ruota colori
                    </span>
                    <Palette className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <Input
                        type="color"
                        value={pickerColor}
                        onChange={handleColorInputChange}
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        aria-label={`Scegli ${label}`}
                    />
                </label>
                <Input
                    type="text"
                    value={customColor}
                    onChange={handleTextChange}
                    placeholder="#000000"
                    className="h-11 flex-1 rounded-xl font-mono text-sm uppercase"
                    maxLength={7}
                />
            </div>
        </div>
    );
}
