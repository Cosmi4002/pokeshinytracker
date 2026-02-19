import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { colorToHsl, hslToCss, hslToTriplet } from '@/lib/color-utils';

type RandomColorContextType = {
    accentColor: string;
    isRandom: boolean;
    setManualColor: (color: string) => void;
    resetToRandom: () => void;
};

const RandomColorContext = createContext<RandomColorContextType | undefined>(undefined);

export function RandomColorProvider({ children }: { children: ReactNode }) {
    const [accentColor, setAccentColorState] = useState<string>('hsl(280, 70%, 50%)');
    const [isRandom, setIsRandom] = useState(true);

    const applyAccentHsl = useCallback((h: number, s: number, l: number) => {
        const root = document.documentElement;
        const hsl = { h, s, l };
        const cssColor = hslToCss(hsl);
        const triplet = hslToTriplet(hsl);

        setAccentColorState(cssColor);
        root.style.setProperty('--primary', triplet);
        root.style.setProperty('--ring', triplet);
        root.style.setProperty('--accent', triplet);
        root.style.setProperty('--primary-foreground', '0 0% 100%');
        root.style.setProperty('--accent-foreground', '0 0% 100%');
    }, []);

    const applyRandomHue = useCallback((hue: number) => {
        applyAccentHsl(hue, 70, 50);
    }, [applyAccentHsl]);

    const setManualColor = useCallback((color: string) => {
        const parsed = colorToHsl(color);
        if (!parsed) return;

        localStorage.setItem('manual_theme_color', color);
        setIsRandom(false);
        applyAccentHsl(parsed.h, parsed.s, parsed.l);
    }, [applyAccentHsl]);

    const resetToRandom = useCallback(() => {
        localStorage.removeItem('manual_theme_color');
        setIsRandom(true);
        applyRandomHue(Math.floor(Math.random() * 360));
    }, [applyRandomHue]);

    useEffect(() => {
        const savedColor = localStorage.getItem('manual_theme_color');
        if (savedColor) {
            const parsed = colorToHsl(savedColor);
            if (parsed) {
                setIsRandom(false);
                applyAccentHsl(parsed.h, parsed.s, parsed.l);
                return;
            }
            localStorage.removeItem('manual_theme_color');
        }
        setIsRandom(true);
        applyRandomHue(Math.floor(Math.random() * 360));
    }, [applyAccentHsl, applyRandomHue]);

    return (
        <RandomColorContext.Provider value={{ accentColor, isRandom, setManualColor, resetToRandom }}>
            {children}
        </RandomColorContext.Provider>
    );
}

export function useRandomColor() {
    const context = useContext(RandomColorContext);
    if (context === undefined) {
        throw new Error('useRandomColor must be used within a RandomColorProvider');
    }
    return context;
}
