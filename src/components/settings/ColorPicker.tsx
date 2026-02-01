import { useState } from 'react';
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
        <div className="space-y-3">
            <Label>{label}</Label>

            {/* Preset Colors */}
            <div className="grid grid-cols-8 gap-2">
                {presets.map((preset) => (
                    <button
                        key={preset}
                        onClick={() => handlePresetClick(preset)}
                        className="relative w-10 h-10 rounded-md border-2 transition-all hover:scale-110"
                        style={{
                            backgroundColor: preset,
                            borderColor: value === preset ? '#fff' : 'transparent',
                        }}
                        title={preset}
                    >
                        {value === preset && (
                            <Check className="absolute inset-0 m-auto h-5 w-5 text-white drop-shadow-lg" />
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
                    className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                    type="text"
                    value={customColor}
                    onChange={handleCustomChange}
                    placeholder="#000000"
                    className="flex-1"
                    maxLength={7}
                />
            </div>
        </div>
    );
}
