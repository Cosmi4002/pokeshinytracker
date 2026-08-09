import { useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
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

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const hexToRgb = (hex: string) => {
    if (!isHexColor(hex)) return null;
    return {
        r: parseInt(hex.slice(1, 3), 16),
        g: parseInt(hex.slice(3, 5), 16),
        b: parseInt(hex.slice(5, 7), 16),
    };
};

const rgbToHex = (r: number, g: number, b: number) => (
    `#${[r, g, b].map((value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, '0')).join('')}`
);

const rgbToHsl = (hex: string) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return { h: 260, s: 70, l: 55 };

    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    const d = max - min;

    if (d === 0) return { h: 0, s: 0, l: Math.round(l * 100) };

    const s = d / (1 - Math.abs(2 * l - 1));
    let h = 0;
    if (max === r) h = 60 * (((g - b) / d) % 6);
    if (max === g) h = 60 * ((b - r) / d + 2);
    if (max === b) h = 60 * ((r - g) / d + 4);

    return {
        h: Math.round((h + 360) % 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100),
    };
};

const hslToHex = (h: number, s: number, l: number) => {
    const saturation = clamp(s, 0, 100) / 100;
    const lightness = clamp(l, 0, 100) / 100;
    const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
    const x = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = lightness - chroma / 2;
    const hue = ((h % 360) + 360) % 360;
    let r = 0;
    let g = 0;
    let b = 0;

    if (hue < 60) [r, g, b] = [chroma, x, 0];
    else if (hue < 120) [r, g, b] = [x, chroma, 0];
    else if (hue < 180) [r, g, b] = [0, chroma, x];
    else if (hue < 240) [r, g, b] = [0, x, chroma];
    else if (hue < 300) [r, g, b] = [x, 0, chroma];
    else [r, g, b] = [chroma, 0, x];

    return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
};

export function ColorPicker({ label, value, onChange, presets = DEFAULT_PRESETS }: ColorPickerProps) {
    const [customColor, setCustomColor] = useState(value);
    const pickerColor = isHexColor(customColor) ? customColor : value;
    const wheelRef = useRef<HTMLButtonElement | null>(null);
    const hsl = useMemo(() => rgbToHsl(pickerColor), [pickerColor]);
    const wheelHandle = {
        x: 50 + Math.cos((hsl.h - 90) * Math.PI / 180) * 39,
        y: 50 + Math.sin((hsl.h - 90) * Math.PI / 180) * 39,
    };

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

    const setColorFromWheelPointer = (event: PointerEvent<HTMLButtonElement>) => {
        const rect = wheelRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;
        const hue = Math.round((Math.atan2(y, x) * 180 / Math.PI + 450) % 360);
        const nextColor = hslToHex(hue, hsl.s || 76, clamp(hsl.l, 28, 72));

        setCustomColor(nextColor);
        onChange(nextColor);
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
            <div className="grid gap-3 sm:grid-cols-[8rem_minmax(0,1fr)]">
                <div className="flex items-center justify-center">
                    <button
                        ref={wheelRef}
                        type="button"
                        className="relative h-28 w-28 touch-none rounded-full border border-border shadow-inner outline-none ring-offset-background transition focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        style={{
                            background: 'conic-gradient(from 0deg, #ef4444, #f97316, #facc15, #22c55e, #06b6d4, #3b82f6, #8b5cf6, #ec4899, #ef4444)',
                        }}
                        aria-label={`Ruota colori ${label}`}
                        onPointerDown={(event) => {
                            event.currentTarget.setPointerCapture(event.pointerId);
                            setColorFromWheelPointer(event);
                        }}
                        onPointerMove={(event) => {
                            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                                setColorFromWheelPointer(event);
                            }
                        }}
                    >
                        <span className="absolute inset-[22%] rounded-full border border-black/20 bg-background shadow-inner" />
                        <span
                            className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_1px_4px_rgba(0,0,0,0.7)]"
                            style={{
                                left: `${wheelHandle.x}%`,
                                top: `${wheelHandle.y}%`,
                                backgroundColor: pickerColor,
                            }}
                        />
                    </button>
                </div>
                <div className="grid gap-2">
                    <label className="relative flex h-12 cursor-pointer items-center gap-3 overflow-hidden rounded-xl border border-border bg-background px-3 shadow-sm transition hover:border-primary/50">
                        <span
                            className="h-8 w-8 shrink-0 rounded-full border border-border shadow-inner"
                            style={{ backgroundColor: pickerColor }}
                        />
                        <span className="min-w-0 flex-1 text-left text-sm font-semibold text-foreground">
                            Picker sistema
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
                        className="h-11 rounded-xl font-mono text-sm uppercase"
                        maxLength={7}
                    />
                </div>
            </div>
        </div>
    );
}
