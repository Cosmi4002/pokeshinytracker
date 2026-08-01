import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Image, Moon, Palette, Paintbrush, Save, Sparkles, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/lib/theme-context';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import { ColorPicker } from '@/components/settings/ColorPicker';
import { useToast } from '@/hooks/use-toast';
import { useRandomColor } from '@/lib/random-color-context';
import {
  type AppearanceSettings,
  type BackgroundStyle,
  type UiStyle,
  applyAppearanceToRoot,
  getStoredBackgroundAccent2,
  getStoredBackgroundAccent3,
  getStoredBackgroundStyle,
  getStoredUiStyle,
  setStoredBackgroundAccent2,
  setStoredBackgroundAccent3,
  setStoredBackgroundStyle,
  setStoredUiStyle,
} from '@/lib/appearance';

type ThemeCombo = AppearanceSettings & {
  themeColor: string;
  backgroundColor: string;
};

const CUSTOM_COMBO_KEY = 'theme_custom_combo_v1';
const DEFAULT_THEME_COLOR = '#8b5cf6';
const DEFAULT_BACKGROUND_COLOR = '#0f172a';
const DEFAULT_BG_ACCENT_3 = '#38bdf8';

function toUiStyle(value: unknown): UiStyle {
  if (value === 'dex' || value === 'card' || value === 'holo' || value === 'arena') return value;
  if (value === 'glass') return 'holo';
  if (value === 'neon') return 'arena';
  return 'dex';
}

function toBackgroundStyle(value: unknown): BackgroundStyle {
  if (value === 'calm' || value === 'route' || value === 'prism' || value === 'safari' || value === 'pokeball' || value === 'night') return value;
  if (value === 'mesh') return 'prism';
  if (value === 'aurora') return 'safari';
  if (value === 'diagonal') return 'route';
  if (value === 'noise') return 'night';
  if (value === 'pokemon') return 'pokeball';
  return 'calm';
}

function getStoredCustomCombo(): ThemeCombo | null {
  try {
    const raw = localStorage.getItem(CUSTOM_COMBO_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ThemeCombo>;
    if (
      !parsed.themeColor ||
      !parsed.backgroundColor ||
      !parsed.uiStyle ||
      !parsed.backgroundStyle
    ) {
      return null;
    }

    return {
      themeColor: parsed.themeColor,
      backgroundColor: parsed.backgroundColor,
      uiStyle: toUiStyle(parsed.uiStyle),
      backgroundStyle: toBackgroundStyle(parsed.backgroundStyle),
      backgroundColor2: parsed.backgroundColor2 || parsed.themeColor,
      backgroundColor3: parsed.backgroundColor3 || DEFAULT_BG_ACCENT_3,
    };
  } catch {
    return null;
  }
}

function setStoredCustomCombo(combo: ThemeCombo) {
  localStorage.setItem(CUSTOM_COMBO_KEY, JSON.stringify(combo));
}

function normalizeColor(color: string) {
  return color.trim().toLowerCase();
}

function comboMatchesPreset(combo: ThemeCombo, preset: ThemeCombo) {
  return (
    normalizeColor(combo.themeColor) === normalizeColor(preset.themeColor) &&
    normalizeColor(combo.backgroundColor) === normalizeColor(preset.backgroundColor) &&
    normalizeColor(combo.backgroundColor2) === normalizeColor(preset.backgroundColor2) &&
    normalizeColor(combo.backgroundColor3) === normalizeColor(preset.backgroundColor3) &&
    combo.uiStyle === preset.uiStyle &&
    combo.backgroundStyle === preset.backgroundStyle
  );
}

function getBackgroundPreview(style: BackgroundStyle, themeColor: string, color2: string, color3: string) {
  if (style === 'calm') return 'none';
  if (style === 'route') {
    return `linear-gradient(135deg, ${themeColor}30, transparent 42%), radial-gradient(circle at 80% 20%, ${color2}30, transparent 48%), radial-gradient(circle at 20% 90%, ${color3}24, transparent 48%)`;
  }
  if (style === 'prism') {
    return `conic-gradient(from 210deg at 50% 45%, ${themeColor}26, ${color2}30, ${color3}24, ${themeColor}26), radial-gradient(circle at 50% 30%, rgba(255,255,255,0.12), transparent 55%)`;
  }
  if (style === 'safari') {
    return `radial-gradient(circle at 12% 25%, ${color2}32, transparent 48%), radial-gradient(circle at 88% 18%, ${themeColor}28, transparent 50%), linear-gradient(45deg, transparent 0 47%, rgba(255,255,255,0.12) 47% 53%, transparent 53% 100%)`;
  }
  if (style === 'pokeball') {
    return `radial-gradient(circle at 20px 20px, rgba(255,255,255,0.32) 0 3px, transparent 3.5px), radial-gradient(circle at 20px 20px, transparent 0 11px, rgba(255,255,255,0.16) 11.5px 13px, transparent 13.5px), radial-gradient(circle at 82% 72%, ${color2}28, transparent 48%)`;
  }
  return `radial-gradient(circle at 20% 18%, rgba(255,255,255,0.14), transparent 52%), radial-gradient(circle at 84% 24%, ${color3}24, transparent 54%), repeating-linear-gradient(0deg, rgba(255,255,255,0.08) 0 1px, transparent 1px 5px)`;
}

export function ThemeCustomizer() {
  const { setColorScheme, colorScheme } = useTheme();
  const { accentColor, setManualColor, resetToRandom, isRandom } = useRandomColor();
  const { preferences, loading, savePreferences } = useUserPreferences();
  const { toast } = useToast();

  const [themeColor, setThemeColor] = useState(preferences?.theme_color || DEFAULT_THEME_COLOR);
  const [backgroundColor, setBackgroundColor] = useState(preferences?.background_color || DEFAULT_BACKGROUND_COLOR);
  const [layoutStyle, setLayoutStyle] = useState(preferences?.layout_style || 'grid');
  const [presetId, setPresetId] = useState('custom');
  const [uiStyle, setUiStyle] = useState<UiStyle>(getStoredUiStyle());
  const [backgroundStyle, setBackgroundStyle] = useState<BackgroundStyle>(getStoredBackgroundStyle());
  const [backgroundColor2, setBackgroundColor2] = useState(getStoredBackgroundAccent2());
  const [backgroundColor3, setBackgroundColor3] = useState(getStoredBackgroundAccent3());
  const [customCombo, setCustomCombo] = useState<ThemeCombo>(() => (
    getStoredCustomCombo() || {
      themeColor: DEFAULT_THEME_COLOR,
      backgroundColor: DEFAULT_BACKGROUND_COLOR,
      uiStyle: 'dex',
      backgroundStyle: 'calm',
      backgroundColor2: DEFAULT_THEME_COLOR,
      backgroundColor3: DEFAULT_BG_ACCENT_3,
    }
  ));
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  const initialAppearanceRef = useRef<AppearanceSettings | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const themePresets = useMemo<ThemeCombo[]>(() => ([
    { themeColor: '#a855f7', backgroundColor: '#0b1020', uiStyle: 'dex', backgroundStyle: 'prism', backgroundColor2: '#7dd3fc', backgroundColor3: '#f0abfc' },
    { themeColor: '#10b981', backgroundColor: '#071a12', uiStyle: 'dex', backgroundStyle: 'safari', backgroundColor2: '#34d399', backgroundColor3: '#a3e635' },
    { themeColor: '#fb7185', backgroundColor: '#1b0b10', uiStyle: 'dex', backgroundStyle: 'route', backgroundColor2: '#fbbf24', backgroundColor3: '#fb7185' },
    { themeColor: '#38bdf8', backgroundColor: '#07111a', uiStyle: 'dex', backgroundStyle: 'prism', backgroundColor2: '#99f6e4', backgroundColor3: '#bfdbfe' },
    { themeColor: '#fbbf24', backgroundColor: '#000000', uiStyle: 'dex', backgroundStyle: 'night', backgroundColor2: '#f59e0b', backgroundColor3: '#e879f9' },
    { themeColor: '#8b5cf6', backgroundColor: '#0f172a', uiStyle: 'dex', backgroundStyle: 'calm', backgroundColor2: '#8b5cf6', backgroundColor3: DEFAULT_BG_ACCENT_3 },
  ]), []);

  const themePresetLabels = ['Violet Holo', 'Safari Green', 'Sunset Route', 'Ice Prism', 'AMOLED Arena', 'Classic Dex'];

  const backgroundStyleOptions = useMemo<Array<{ id: BackgroundStyle; label: string; detail: string }>>(() => ([
    { id: 'calm', label: 'Calmo', detail: 'Solido' },
    { id: 'route', label: 'Route', detail: 'Luce' },
    { id: 'prism', label: 'Prisma', detail: 'Holo' },
    { id: 'safari', label: 'Safari', detail: 'Naturale' },
    { id: 'pokeball', label: 'Pokeball', detail: 'Pattern' },
    { id: 'night', label: 'Notte', detail: 'Focus' },
  ]), []);

  const backgroundPresets = [
    '#0f172a',
    '#1e1b4b',
    '#1f2937',
    '#18181b',
    '#0c0a09',
    '#171717',
    '#14532d',
    '#1e3a8a',
  ];

  const currentCombo = (): ThemeCombo => ({
    themeColor,
    backgroundColor,
    uiStyle: 'dex',
    backgroundStyle,
    backgroundColor2: backgroundColor2 || themeColor,
    backgroundColor3: backgroundColor3 || DEFAULT_BG_ACCENT_3,
  });

  const applyCombo = (combo: ThemeCombo, id: string) => {
    setPresetId(id);
    setThemeColor(combo.themeColor);
    setBackgroundColor(combo.backgroundColor);
    setUiStyle('dex');
    setBackgroundStyle(combo.backgroundStyle);
    setBackgroundColor2(combo.backgroundColor2 || combo.themeColor);
    setBackgroundColor3(combo.backgroundColor3 || DEFAULT_BG_ACCENT_3);
  };

  const rememberCustomPatch = (patch: Partial<ThemeCombo>) => {
    const next = { ...currentCombo(), ...patch };
    setPresetId('custom');
    setCustomCombo(next);
  };

  const updateThemeColor = (color: string) => {
    setThemeColor(color);
    rememberCustomPatch({ themeColor: color, backgroundColor2: backgroundColor2 || color });
  };

  const updateBackgroundColor = (color: string) => {
    setBackgroundColor(color);
    rememberCustomPatch({ backgroundColor: color });
  };

  const updateBackgroundStyle = (style: BackgroundStyle) => {
    setBackgroundStyle(style);
    rememberCustomPatch({ backgroundStyle: style });
  };

  const updateBackgroundColor2 = (color: string) => {
    setBackgroundColor2(color);
    rememberCustomPatch({ backgroundColor2: color });
  };

  const updateBackgroundColor3 = (color: string) => {
    setBackgroundColor3(color);
    rememberCustomPatch({ backgroundColor3: color });
  };

  const applyThemePreset = (index: number) => {
    applyCombo(themePresets[index], `preset-${index}`);
  };

  const applyCustomCombo = () => {
    applyCombo(customCombo, 'custom');
  };

  useEffect(() => {
    applyAppearanceToRoot({
      uiStyle: 'dex',
      backgroundStyle: getStoredBackgroundStyle(),
      backgroundColor2: getStoredBackgroundAccent2(),
      backgroundColor3: getStoredBackgroundAccent3(),
    });
  }, []);

  useEffect(() => {
    if (!open) return;

    const currentThemeColor = isRandom ? accentColor : preferences?.theme_color || DEFAULT_THEME_COLOR;
    const currentBackgroundColor = preferences?.background_color || DEFAULT_BACKGROUND_COLOR;
    const currentAppearance = {
      uiStyle: 'dex',
      backgroundStyle: getStoredBackgroundStyle(),
      backgroundColor2: getStoredBackgroundAccent2() || currentThemeColor,
      backgroundColor3: getStoredBackgroundAccent3() || DEFAULT_BG_ACCENT_3,
    };
    const combo = {
      themeColor: currentThemeColor,
      backgroundColor: currentBackgroundColor,
      ...currentAppearance,
    };
    const savedCustomCombo = getStoredCustomCombo() || combo;
    const matchingPresetIndex = themePresets.findIndex((preset) => comboMatchesPreset(combo, preset));

    initialAppearanceRef.current = currentAppearance;
    setCustomCombo(savedCustomCombo);
    setPresetId(matchingPresetIndex >= 0 ? `preset-${matchingPresetIndex}` : 'custom');
    setThemeColor(combo.themeColor);
    setBackgroundColor(combo.backgroundColor);
    setLayoutStyle(preferences?.layout_style || 'grid');
    setUiStyle('dex');
    setBackgroundStyle(combo.backgroundStyle);
    setBackgroundColor2(combo.backgroundColor2);
    setBackgroundColor3(combo.backgroundColor3);
  }, [preferences, open, isRandom, accentColor, themePresets]);

  useEffect(() => {
    if (!open) return undefined;

    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = window.requestAnimationFrame(() => {
      applyAppearanceToRoot({
        uiStyle: 'dex',
        backgroundStyle,
        backgroundColor2,
        backgroundColor3,
      });
      animationFrameRef.current = null;
    });

    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [backgroundStyle, backgroundColor2, backgroundColor3, open]);

  const handleCloseWithoutSave = () => {
    const original = initialAppearanceRef.current;
    if (!original) return;
    setUiStyle(original.uiStyle);
    setBackgroundStyle(original.backgroundStyle);
    setBackgroundColor2(original.backgroundColor2);
    setBackgroundColor3(original.backgroundColor3);
    applyAppearanceToRoot(original);
  };

  const handleSave = async () => {
    setSaving(true);
    setManualColor(themeColor);

    const result = await savePreferences({
      theme_color: themeColor,
      background_color: backgroundColor,
      layout_style: layoutStyle,
    });

    setSaving(false);

    if (result?.success) {
      if (presetId === 'custom') {
        setStoredCustomCombo(currentCombo());
      }
      setStoredUiStyle('dex');
      setStoredBackgroundStyle(backgroundStyle);
      setStoredBackgroundAccent2(backgroundColor2);
      setStoredBackgroundAccent3(backgroundColor3);
      toast({
        title: 'Preferenze salvate',
        description: 'Aspetto aggiornato correttamente',
      });
      setOpen(false);
    } else {
      toast({
        variant: 'destructive',
        title: 'Errore',
        description: result?.error || 'Impossibile salvare le preferenze',
      });
    }
  };

  const handleReset = () => {
    resetToRandom();

    void savePreferences({
      theme_color: null,
      background_color: backgroundColor,
      layout_style: layoutStyle,
    });

    toast({
      title: 'Modalita random attiva',
      description: 'I colori seguiranno il tema della Home',
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => {
      if (!v && open) handleCloseWithoutSave();
      setOpen(v);
    }}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-xl border-2 transition-all duration-300 dark:bg-gray-800 dark:text-gray-100"
          style={{
            borderColor: accentColor,
            boxShadow: `0 0 12px ${accentColor}40`,
          }}
        >
          {colorScheme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          <span className="sr-only">Cambia aspetto</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto p-0">
        <DialogHeader className="border-b border-border/70 bg-muted/30 px-5 pb-4 pt-5">
          <DialogTitle className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background">
              <Paintbrush className="h-4 w-4" />
            </span>
            Aspetto
          </DialogTitle>
          <DialogDescription>
            Personalizza colori, modalita e sfondo dell'applicazione
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 p-5">
          <section className="space-y-3 rounded-xl border border-border/70 bg-card/70 p-4 shadow-sm">
            <Label className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4" />
              Temi rapidi
            </Label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={applyCustomCombo}
                className={`flex min-h-16 items-center gap-3 rounded-xl border p-3 text-left transition-all hover:border-primary/60 hover:bg-muted/40 ${
                  presetId === 'custom' ? 'border-primary bg-primary/10 shadow-sm' : 'border-border/80 bg-background/70'
                }`}
              >
                <span className="flex h-10 w-10 shrink-0 rounded-full border border-border p-1">
                  <span className="h-full flex-1 rounded-l-full" style={{ backgroundColor: customCombo.themeColor }} />
                  <span className="h-full flex-1 rounded-r-full" style={{ backgroundColor: customCombo.backgroundColor }} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">Personalizzato</span>
                  <span className="block truncate text-xs text-muted-foreground">Ultima combo usata</span>
                </span>
                {presetId === 'custom' && <Check className="h-4 w-4 text-primary" />}
              </button>

              {themePresets.map((preset, index) => (
                <button
                  key={themePresetLabels[index]}
                  type="button"
                  onClick={() => applyThemePreset(index)}
                  className={`flex min-h-16 items-center gap-3 rounded-xl border p-3 text-left transition-all hover:border-primary/60 hover:bg-muted/40 ${
                    presetId === `preset-${index}` ? 'border-primary bg-primary/10 shadow-sm' : 'border-border/80 bg-background/70'
                  }`}
                >
                  <span className="flex h-10 w-10 shrink-0 rounded-full border border-border p-1">
                    <span className="h-full flex-1 rounded-l-full" style={{ backgroundColor: preset.themeColor }} />
                    <span className="h-full flex-1 rounded-r-full" style={{ backgroundColor: preset.backgroundColor }} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{themePresetLabels[index]}</span>
                    <span className="block truncate text-xs capitalize text-muted-foreground">{preset.backgroundStyle}</span>
                  </span>
                  {presetId === `preset-${index}` && <Check className="h-4 w-4 text-primary" />}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-3 rounded-xl border border-border/70 bg-card/70 p-4 shadow-sm">
            <Label className="flex items-center gap-2 text-sm font-semibold">
              <Sun className="h-4 w-4" />
              Modalita
            </Label>
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
              <Button
                variant="ghost"
                onClick={() => setColorScheme('light')}
                className={`h-11 rounded-lg ${
                  colorScheme === 'light' ? 'bg-background text-foreground shadow-sm hover:bg-background' : 'text-muted-foreground'
                }`}
              >
                <Sun className="mr-2 h-4 w-4" />
                Light
              </Button>
              <Button
                variant="ghost"
                onClick={() => setColorScheme('dark')}
                className={`h-11 rounded-lg ${
                  colorScheme === 'dark' ? 'bg-background text-foreground shadow-sm hover:bg-background' : 'text-muted-foreground'
                }`}
              >
                <Moon className="mr-2 h-4 w-4" />
                Dark
              </Button>
            </div>
          </section>

          <section className="space-y-3 rounded-xl border border-border/70 bg-card/70 p-4 shadow-sm">
            <Label className="flex items-center gap-2 text-sm font-semibold">
              <Palette className="h-4 w-4" />
              Colori
            </Label>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-3">
                <Button
                  variant={isRandom ? 'default' : 'outline'}
                  onClick={handleReset}
                  className="h-11 w-full justify-start rounded-xl border-dashed"
                  style={isRandom ? { backgroundColor: accentColor } : { borderColor: `${accentColor}80`, color: accentColor }}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Usa colore Home
                </Button>

                <ColorPicker
                  label="Colore principale"
                  value={themeColor}
                  onChange={updateThemeColor}
                />
              </div>

              <ColorPicker
                label="Colore sfondo"
                value={backgroundColor}
                onChange={updateBackgroundColor}
                presets={backgroundPresets}
              />
            </div>
          </section>

          <section className="space-y-4 rounded-xl border border-border/70 bg-card/70 p-4 shadow-sm">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-semibold">
                <Image className="h-3.5 w-3.5" />
                Sfondo
              </Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {backgroundStyleOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => updateBackgroundStyle(option.id)}
                    className={`overflow-hidden rounded-xl border text-left transition-all hover:border-primary/60 hover:bg-muted/40 ${
                      backgroundStyle === option.id ? 'border-primary bg-primary/10 shadow-sm' : 'border-border/80 bg-background/70'
                    }`}
                  >
                    <span
                      className="block h-14 border-b border-border/70"
                      style={{
                        backgroundColor,
                        backgroundImage: getBackgroundPreview(option.id, themeColor, backgroundColor2 || themeColor, backgroundColor3 || DEFAULT_BG_ACCENT_3),
                        backgroundSize: option.id === 'pokeball' ? '32px 32px, 32px 32px, cover' : 'cover',
                      }}
                    />
                    <span className="block p-3">
                      <span className="block text-sm font-medium">{option.label}</span>
                      <span className="block text-xs text-muted-foreground">{option.detail}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {backgroundStyle !== 'calm' && (
              <div className="grid gap-3 md:grid-cols-2">
                <ColorPicker
                  label="Colore sfondo 2"
                  value={backgroundColor2 || themeColor}
                  onChange={updateBackgroundColor2}
                />
                <ColorPicker
                  label="Colore sfondo 3"
                  value={backgroundColor3 || DEFAULT_BG_ACCENT_3}
                  onChange={updateBackgroundColor3}
                />
              </div>
            )}
          </section>

          <div className="flex gap-2 border-t border-border/70 pt-4">
            <Button
              onClick={handleSave}
              disabled={saving || loading}
              className="h-11 flex-1 rounded-xl shiny-glow"
              style={{ backgroundColor: accentColor }}
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Salvataggio...' : 'Salva Preferenze'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
