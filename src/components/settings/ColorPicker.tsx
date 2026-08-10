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
    hideDesktopAdvancedPicker?: boolean;
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

const rgbToHsv = (hex: string) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return { h: 260, s: 76, v: 80 };

    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;

    let h = 0;
    if (d !== 0) {
        if (max === r) h = 60 * (((g - b) / d) % 6);
        if (max === g) h = 60 * ((b - r) / d + 2);
        if (max === b) h = 60 * ((r - g) / d + 4);
    }

    return {
        h: Math.round((h + 360) % 360),
        s: max === 0 ? 0 : Math.round((d / max) * 100),
        v: Math.round(max * 100),
    };
};

const hsvToHex = (h: number, s: number, v: number) => {
    const saturation = clamp(s, 0, 100) / 100;
    const value = clamp(v, 0, 100) / 100;
    const chroma = value * saturation;
    const x = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = value - chroma;
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

export function ColorPicker({ label, value, onChange, presets = DEFAULT_PRESETS, hideDesktopAdvancedPicker = false }: ColorPickerProps) {
    const [customColor, setCustomColor] = useState(value);
    const pickerColor = isHexColor(customColor) ? customColor : value;
    const shadeRef = useRef<HTMLButtonElement | null>(null);
    const hueRef = useRef<HTMLButtonElement | null>(null);
    const hsv = useMemo(() => rgbToHsv(pickerColor), [pickerColor]);

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

    const setColorFromShadePointer = (event: PointerEvent<HTMLButtonElement>) => {
        const rect = shadeRef.current?.getBoundingClientRect();
        if (!rect) return;

        const saturation = clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100);
        const value = clamp(100 - ((event.clientY - rect.top) / rect.height) * 100, 0, 100);
        const nextColor = hsvToHex(hsv.h, saturation, value);

        setCustomColor(nextColor);
        onChange(nextColor);
    };

    const setColorFromHuePointer = (event: PointerEvent<HTMLButtonElement>) => {
        const rect = hueRef.current?.getBoundingClientRect();
        if (!rect) return;

        const hue = Math.round(clamp(((event.clientX - rect.left) / rect.width) * 359, 0, 359));
        const nextColor = hsvToHex(hue, hsv.s || 76, hsv.v || 80);

        setCustomColor(nextColor);
        onChange(nextColor);
    };

    const pickerLayoutClass = hideDesktopAdvancedPicker
        ? 'grid gap-3'
        : 'grid gap-3 sm:grid-cols-[minmax(0,1fr)_8.5rem]';
    const advancedPickerClass = hideDesktopAdvancedPicker ? 'grid gap-2 md:hidden' : 'grid gap-2';
    const inputPanelClass = hideDesktopAdvancedPicker ? 'grid gap-2 md:grid-cols-[minmax(0,1fr)_9rem]' : 'grid gap-2';

    return (
        <div className="space-y-2.5 rounded-lg border border-border/70 bg-background/70 p-3">
            <div className="flex items-center justify-between gap-3">
                <Label>{label}</Label>
                <span className="rounded-full border border-border/70 bg-background px-2.5 py-1 font-mono text-xs uppercase text-muted-foreground">
                    {customColor}
                </span>
            </div>

            {/* Preset Colors */}
            <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8">
                {presets.map((preset, index) => (
                    <button
                        key={`${preset}-${index}`}
                        type="button"
                        onClick={() => handlePresetClick(preset)}
                        className="relative h-8 rounded-full border transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
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
            <div className={pickerLayoutClass}>
                <div className={advancedPickerClass}>
                    <button
                        ref={shadeRef}
                        type="button"
                        className="relative h-40 w-full touch-none overflow-hidden rounded-xl border border-border shadow-inner outline-none ring-offset-background transition focus:ring-2 focus:ring-ring focus:ring-offset-2 sm:h-36"
                        style={{
                            backgroundColor: `hsl(${hsv.h} 100% 50%)`,
                        }}
                        aria-label={`Sfumatura ${label}`}
                        onPointerDown={(event) => {
                            event.preventDefault();
                            event.currentTarget.setPointerCapture(event.pointerId);
                            setColorFromShadePointer(event);
                        }}
                        onPointerMove={(event) => {
                            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                                setColorFromShadePointer(event);
                            }
                        }}
                    >
                        <span className="absolute inset-0 bg-gradient-to-r from-white to-transparent" />
                        <span className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
                        <span
                            className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_1px_5px_rgba(0,0,0,0.85)] ring-1 ring-black/40"
                            style={{
                                left: `${hsv.s}%`,
                                top: `${100 - hsv.v}%`,
                                backgroundColor: pickerColor,
                            }}
                        />
                    </button>
                    <button
                        ref={hueRef}
                        type="button"
                        className="relative h-8 w-full touch-none rounded-full border border-border shadow-inner outline-none ring-offset-background transition focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        style={{
                            background: 'linear-gradient(90deg, #ef4444, #f97316, #facc15, #22c55e, #06b6d4, #3b82f6, #8b5cf6, #ec4899, #ef4444)',
                        }}
                        aria-label={`Tonalita ${label}`}
                        onPointerDown={(event) => {
                            event.preventDefault();
                            event.currentTarget.setPointerCapture(event.pointerId);
                            setColorFromHuePointer(event);
                        }}
                        onPointerMove={(event) => {
                            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                                setColorFromHuePointer(event);
                            }
                        }}
                    >
                        <span
                            className="absolute top-1/2 h-7 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_1px_5px_rgba(0,0,0,0.8)]"
                            style={{
                                left: `${hsv.h / 3.6}%`,
                                backgroundColor: `hsl(${hsv.h} 100% 50%)`,
                            }}
                        />
                    </button>
                </div>
                <div className={inputPanelClass}>
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
