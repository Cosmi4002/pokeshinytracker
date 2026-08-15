import { useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Check, Image, Moon, Palette, Paintbrush, Pipette, Save, Sparkles, Sun } from 'lucide-react';
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
  type BackgroundStyle,
  type UiStyle,
  applyBackgroundAccentsToRoot,
  applyBackgroundStyleToRoot,
  applyUiStyleToRoot,
  getStoredBackgroundAccent2,
  getStoredBackgroundAccent3,
  getStoredBackgroundStyle,
  getStoredUiStyle,
  setStoredBackgroundAccent2,
  setStoredBackgroundAccent3,
  setStoredBackgroundStyle,
  setStoredUiStyle,
} from '@/lib/appearance';

type ThemePreset = {
  id: string;
  name: string;
  themeColor: string;
  backgroundColor: string;
  uiStyle: UiStyle;
  backgroundStyle: BackgroundStyle;
  backgroundColor2: string;
  backgroundColor3: string;
};

type EyeDropperResult = {
  sRGBHex: string;
};

declare global {
  interface Window {
    EyeDropper?: new () => {
      open: () => Promise<EyeDropperResult>;
    };
  }
}

const DEFAULT_THEME_COLOR = '#8b5cf6';
const DEFAULT_BACKGROUND_COLOR = '#0f172a';
const DEFAULT_BG_ACCENT_3 = '#38bdf8';

function getBackgroundPreview(style: BackgroundStyle, backgroundColor: string, themeColor: string, color2: string, color3: string) {
  if (style === 'plain') return 'none';
  if (style === 'diagonal') {
    return `linear-gradient(135deg, ${themeColor}55, transparent 42%), radial-gradient(circle at 80% 20%, ${color2}50, transparent 48%), radial-gradient(circle at 20% 90%, ${color3}42, transparent 48%)`;
  }
  if (style === 'aurora') {
    return `radial-gradient(circle at 12% 24%, ${color2}68, transparent 44%), radial-gradient(circle at 88% 22%, ${color3}58, transparent 48%), radial-gradient(circle at 45% 92%, ${themeColor}54, transparent 52%)`;
  }
  if (style === 'mesh') {
    return `radial-gradient(circle at 20% 30%, ${themeColor}6a, transparent 45%), radial-gradient(circle at 82% 28%, ${color2}5c, transparent 47%), radial-gradient(circle at 62% 82%, ${color3}52, transparent 48%)`;
  }
  if (style === 'noise') {
    return `radial-gradient(circle at 20% 25%, rgba(255,255,255,0.16), transparent 52%), repeating-linear-gradient(0deg, rgba(255,255,255,0.18) 0 1px, transparent 1px 5px)`;
  }
  if (style === 'diamond') {
    return `radial-gradient(circle at 20% 25%, ${themeColor}54, transparent 46%), linear-gradient(135deg, transparent 0 42%, rgba(255,255,255,0.22) 43%, transparent 46%), linear-gradient(45deg, transparent 0 55%, ${color2}38 57%, transparent 61%)`;
  }
  if (style === 'pixel') {
    return `radial-gradient(circle at 20% 25%, ${themeColor}42, transparent 46%), linear-gradient(90deg, rgba(255,255,255,0.18) 1px, transparent 1px), linear-gradient(0deg, rgba(255,255,255,0.14) 1px, transparent 1px)`;
  }
  if (style === 'neon') {
    return `radial-gradient(circle at 20% 25%, ${color2}56, transparent 46%), radial-gradient(circle at 82% 78%, ${themeColor}48, transparent 48%), linear-gradient(90deg, transparent 0 22%, rgba(125,211,252,0.28) 23%, transparent 25%)`;
  }
  return `radial-gradient(circle at 20% 25%, ${themeColor}52, transparent 46%), radial-gradient(circle at 84% 35%, ${color2}48, transparent 48%), radial-gradient(circle at 16px 16px, rgba(255,255,255,0.28) 2px, transparent 2.5px)`;
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
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const skipNextOpenSyncRef = useRef(false);

  const initialAppearanceRef = useRef<{
    uiStyle: UiStyle;
    backgroundStyle: BackgroundStyle;
    backgroundColor2: string;
    backgroundColor3: string;
  } | null>(null);

  const themePresets = useMemo<ThemePreset[]>(() => ([
    { id: 'tokyo-night', name: 'Tokyo Night', themeColor: '#7aa2f7', backgroundColor: '#101421', uiStyle: 'glass', backgroundStyle: 'aurora', backgroundColor2: '#bb9af7', backgroundColor3: '#2ac3de' },
    { id: 'dracula', name: 'Dracula', themeColor: '#bd93f9', backgroundColor: '#282a36', uiStyle: 'glass', backgroundStyle: 'mesh', backgroundColor2: '#ff79c6', backgroundColor3: '#50fa7b' },
    { id: 'nord-frost', name: 'Nord Frost', themeColor: '#88c0d0', backgroundColor: '#2e3440', uiStyle: 'soft', backgroundStyle: 'aurora', backgroundColor2: '#81a1c1', backgroundColor3: '#a3be8c' },
    { id: 'gruvbox', name: 'Gruvbox', themeColor: '#fabd2f', backgroundColor: '#282828', uiStyle: 'soft', backgroundStyle: 'noise', backgroundColor2: '#b8bb26', backgroundColor3: '#fb4934' },
    { id: 'solarized', name: 'Solarized', themeColor: '#268bd2', backgroundColor: '#002b36', uiStyle: 'flat', backgroundStyle: 'diagonal', backgroundColor2: '#b58900', backgroundColor3: '#2aa198' },
    { id: 'monokai', name: 'Monokai', themeColor: '#a6e22e', backgroundColor: '#272822', uiStyle: 'neon', backgroundStyle: 'pixel', backgroundColor2: '#fd971f', backgroundColor3: '#f92672' },
    { id: 'miami-synth', name: 'Miami Synth', themeColor: '#ff2bd6', backgroundColor: '#090019', uiStyle: 'neon', backgroundStyle: 'neon', backgroundColor2: '#00e5ff', backgroundColor3: '#ffe45e' },
    { id: 'bauhaus', name: 'Bauhaus', themeColor: '#e11d48', backgroundColor: '#f5f1e8', uiStyle: 'flat', backgroundStyle: 'diagonal', backgroundColor2: '#2563eb', backgroundColor3: '#facc15' },
    { id: 'pokeball-classic', name: 'Pokeball Classic', themeColor: '#ef233c', backgroundColor: '#f8fafc', uiStyle: 'flat', backgroundStyle: 'pokemon', backgroundColor2: '#111827', backgroundColor3: '#e5e7eb' },
    { id: 'great-ball', name: 'Great Ball', themeColor: '#2563eb', backgroundColor: '#07111f', uiStyle: 'glass', backgroundStyle: 'diamond', backgroundColor2: '#ef4444', backgroundColor3: '#dbeafe' },
    { id: 'ultra-ball', name: 'Ultra Ball', themeColor: '#facc15', backgroundColor: '#080808', uiStyle: 'neon', backgroundStyle: 'noise', backgroundColor2: '#f97316', backgroundColor3: '#f8fafc' },
    { id: 'luxury-ball', name: 'Luxury Ball', themeColor: '#f5d06f', backgroundColor: '#050505', uiStyle: 'glass', backgroundStyle: 'diamond', backgroundColor2: '#dc2626', backgroundColor3: '#fff7cc' },
    { id: 'dive-ball', name: 'Dive Ball', themeColor: '#22d3ee', backgroundColor: '#031826', uiStyle: 'glass', backgroundStyle: 'aurora', backgroundColor2: '#0ea5e9', backgroundColor3: '#ecfeff' },
    { id: 'safari-ball', name: 'Safari Ball', themeColor: '#84cc16', backgroundColor: '#17210b', uiStyle: 'soft', backgroundStyle: 'mesh', backgroundColor2: '#ca8a04', backgroundColor3: '#65a30d' },
    { id: 'premier-ball', name: 'Premier Ball', themeColor: '#dc2626', backgroundColor: '#f8fafc', uiStyle: 'flat', backgroundStyle: 'plain', backgroundColor2: '#f8fafc', backgroundColor3: '#ef4444' },
    { id: 'moon-ball', name: 'Moon Ball', themeColor: '#f4d35e', backgroundColor: '#111827', uiStyle: 'glass', backgroundStyle: 'diamond', backgroundColor2: '#60a5fa', backgroundColor3: '#d8b4fe' },
    { id: 'dream-ball', name: 'Dream Ball', themeColor: '#f0abfc', backgroundColor: '#21102b', uiStyle: 'glass', backgroundStyle: 'aurora', backgroundColor2: '#fb7185', backgroundColor3: '#93c5fd' },
    { id: 'nes-classic', name: 'NES Classic', themeColor: '#e60012', backgroundColor: '#d9d7cc', uiStyle: 'flat', backgroundStyle: 'pixel', backgroundColor2: '#4b5563', backgroundColor3: '#111827' },
  ]), []);

  const backgroundStyleOptions = useMemo<Array<{ id: BackgroundStyle; label: string }>>(() => ([
    { id: 'plain', label: 'Plain' },
    { id: 'aurora', label: 'Aurora' },
    { id: 'mesh', label: 'Mesh' },
    { id: 'diagonal', label: 'Diagonal' },
    { id: 'diamond', label: 'Diamond' },
    { id: 'pixel', label: 'Pixel' },
    { id: 'neon', label: 'Neon' },
    { id: 'noise', label: 'Noise' },
    { id: 'pokemon', label: 'Pokemon' },
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

  useEffect(() => {
    if (!open) return;
    if (skipNextOpenSyncRef.current) {
      skipNextOpenSyncRef.current = false;
      return;
    }

    if (preferences) {
      setPresetId('custom');
      setThemeColor(isRandom ? accentColor : preferences.theme_color || DEFAULT_THEME_COLOR);
      setBackgroundColor(preferences.background_color || DEFAULT_BACKGROUND_COLOR);
      setLayoutStyle(preferences.layout_style || 'grid');
    }

    const current = {
      uiStyle: getStoredUiStyle(),
      backgroundStyle: getStoredBackgroundStyle(),
      backgroundColor2: getStoredBackgroundAccent2(),
      backgroundColor3: getStoredBackgroundAccent3(),
    };
    initialAppearanceRef.current = current;
    setUiStyle(current.uiStyle);
    setBackgroundStyle(current.backgroundStyle);
    setBackgroundColor2(current.backgroundColor2);
    setBackgroundColor3(current.backgroundColor3);
  }, [preferences, open, isRandom, accentColor]);

  useEffect(() => {
    if (!open) return;
    applyUiStyleToRoot(uiStyle);
  }, [uiStyle, open]);

  useEffect(() => {
    if (!open) return;
    applyBackgroundStyleToRoot(backgroundStyle);
  }, [backgroundStyle, open]);

  useEffect(() => {
    if (!open) return;
    applyBackgroundAccentsToRoot(backgroundColor2, backgroundColor3);
  }, [backgroundColor2, backgroundColor3, open]);

  const handleCloseWithoutSave = () => {
    const original = initialAppearanceRef.current;
    if (!original) return;
    setUiStyle(original.uiStyle);
    setBackgroundStyle(original.backgroundStyle);
    setBackgroundColor2(original.backgroundColor2);
    setBackgroundColor3(original.backgroundColor3);
    applyUiStyleToRoot(original.uiStyle);
    applyBackgroundStyleToRoot(original.backgroundStyle);
    applyBackgroundAccentsToRoot(original.backgroundColor2, original.backgroundColor3);
  };

  const applyPreset = (id: string) => {
    if (id === 'custom') {
      setPresetId('custom');
      return;
    }

    const preset = themePresets.find((p) => p.id === id);
    if (!preset) return;

    setPresetId(id);
    setThemeColor(preset.themeColor);
    setBackgroundColor(preset.backgroundColor);
    setUiStyle(preset.uiStyle);
    setBackgroundStyle(preset.backgroundStyle);
    setBackgroundColor2(preset.backgroundColor2);
    setBackgroundColor3(preset.backgroundColor3);
  };

  const handleSave = async () => {
    setSaving(true);
    setManualColor(themeColor);

    const result = await savePreferences({
      theme_color: themeColor,
      background_color: backgroundColor,
      layout_style: layoutStyle,
    });

    if (result?.success) {
      setStoredUiStyle(uiStyle);
      setStoredBackgroundStyle(backgroundStyle);
      setStoredBackgroundAccent2(backgroundColor2);
      setStoredBackgroundAccent3(backgroundColor3);
      setSaving(false);
      toast({
        title: 'Preferenze salvate',
        description: 'Colori e sfondo aggiornati correttamente',
      });
      setOpen(false);
    } else {
      setSaving(false);
      toast({
        variant: 'destructive',
        title: 'Errore',
        description: result?.error || 'Impossibile salvare le preferenze',
      });
    }
  };

  const previewAccent2 = backgroundColor2 || themeColor;
  const previewAccent3 = backgroundColor3 || DEFAULT_BG_ACCENT_3;

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

  const handlePickColor = async (target: 'button' | 'background') => {
    if (!window.EyeDropper) {
      toast({
        variant: 'destructive',
        title: 'Pipetta non disponibile',
        description: 'Il browser non supporta la selezione colore dallo schermo.',
      });
      return;
    }

    try {
      flushSync(() => setOpen(false));
      const result = await new window.EyeDropper().open();
      setPresetId('custom');

      if (target === 'button') {
        setThemeColor(result.sRGBHex);
        setManualColor(result.sRGBHex);
        skipNextOpenSyncRef.current = true;
        setOpen(true);
        toast({
          title: 'Colore pulsante applicato',
          description: result.sRGBHex,
        });
        return;
      }

      setBackgroundColor(result.sRGBHex);
      skipNextOpenSyncRef.current = true;
      setOpen(true);
      toast({
        title: 'Colore sfondo applicato',
        description: result.sRGBHex,
      });
    } catch (err: any) {
      skipNextOpenSyncRef.current = true;
      setOpen(true);
      if (err?.name === 'AbortError') return;
      toast({
        variant: 'destructive',
        title: 'Errore pipetta',
        description: 'Non sono riuscito a leggere il colore selezionato.',
      });
    }
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
          className="h-[3.25rem] w-[3.25rem] rounded-xl border-2 bg-gradient-to-b from-muted to-background text-card-foreground outline outline-1 outline-black/10 transition-all duration-300 hover:brightness-105 dark:from-muted/80 dark:to-background dark:outline-white/15"
          style={{
            borderColor: accentColor,
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -10px 20px rgba(0,0,0,0.10), 0 0 16px ${accentColor}45`,
          }}
        >
          {colorScheme === 'dark'
            ? <Moon className="h-6 w-6 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.85)]" />
            : <Sun className="h-6 w-6 text-amber-600 drop-shadow-[0_0_6px_rgba(251,191,36,0.75)]" />}
          <span className="sr-only">Impostazioni colori</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto border-border bg-background p-0 text-card-foreground shadow-2xl">
        <DialogHeader className="border-b border-border bg-card px-4 pb-3 pt-4 sm:px-5">
          <DialogTitle className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card">
              <Paintbrush className="h-4 w-4" />
            </span>
            Tema app
          </DialogTitle>
          <DialogDescription>Personalizza tema, sfondo e modalita dell'app.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 bg-muted/25 p-4 sm:p-5">
          <section className="space-y-3 rounded-lg border border-border bg-card p-3 shadow-sm sm:p-4">
            <Label className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4" />
              Temi rapidi
            </Label>
            <div className="grid max-h-56 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
              <button
                type="button"
                onClick={() => setPresetId('custom')}
                className={`flex min-h-14 items-center gap-3 rounded-lg border p-2.5 text-left transition-all hover:border-primary/60 hover:bg-muted/40 ${
                  presetId === 'custom' ? 'border-primary bg-primary/10 shadow-sm' : 'border-border bg-background'
                }`}
              >
                <span className="flex h-9 w-9 shrink-0 rounded-full border border-border p-1">
                  <span className="h-full flex-1 rounded-l-full" style={{ backgroundColor: themeColor }} />
                  <span className="h-full flex-1 rounded-r-full" style={{ backgroundColor }} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">Personalizzato</span>
                  <span className="block truncate text-xs text-muted-foreground">Colori attuali</span>
                </span>
                {presetId === 'custom' && <Check className="h-4 w-4 text-primary" />}
              </button>

              {themePresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset.id)}
                  className={`flex min-h-14 items-center gap-3 rounded-lg border p-2.5 text-left transition-all hover:border-primary/60 hover:bg-muted/40 ${
                    presetId === preset.id ? 'border-primary bg-primary/10 shadow-sm' : 'border-border bg-background'
                  }`}
                >
                  <span className="flex h-9 w-9 shrink-0 rounded-full border border-border p-1">
                    <span className="h-full flex-1 rounded-l-full" style={{ backgroundColor: preset.themeColor }} />
                    <span className="h-full flex-1 rounded-r-full" style={{ backgroundColor: preset.backgroundColor }} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{preset.name}</span>
                    <span className="block truncate text-xs capitalize text-muted-foreground">{preset.backgroundStyle}</span>
                  </span>
                  {presetId === preset.id && <Check className="h-4 w-4 text-primary" />}
                </button>
              ))}
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
            <section className="space-y-3 rounded-lg border border-border bg-card p-3 shadow-sm sm:p-4">
              <Label className="flex items-center gap-2 text-sm font-semibold">
                <Sun className="h-4 w-4" />
                Modalita
              </Label>
              <div className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-background p-1 lg:grid-cols-1">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setColorScheme('light')}
                  className={`h-11 rounded-lg ${
                    colorScheme === 'light' ? 'bg-card text-card-foreground shadow-sm hover:bg-card' : 'text-muted-foreground'
                  }`}
                >
                  <Sun className="mr-2 h-4 w-4" />
                  Light
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setColorScheme('dark')}
                  className={`h-11 rounded-lg ${
                    colorScheme === 'dark' ? 'bg-card text-card-foreground shadow-sm hover:bg-card' : 'text-muted-foreground'
                  }`}
                >
                  <Moon className="mr-2 h-4 w-4" />
                  Dark
                </Button>
              </div>
            </section>

            <section className="space-y-3 rounded-lg border border-border bg-card p-3 shadow-sm sm:p-4">
              <Label className="flex items-center gap-2 text-sm font-semibold">
                <Palette className="h-4 w-4" />
                Palette
              </Label>
              <div className="grid gap-2 rounded-lg border border-border bg-background p-2 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handlePickColor('button')}
                  className="h-10 justify-center gap-2"
                  style={{ borderColor: `${accentColor}80`, color: accentColor }}
                >
                  <Pipette className="h-4 w-4" />
                  Pipetta pulsante
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handlePickColor('background')}
                  className="h-10 justify-center gap-2"
                >
                  <Pipette className="h-4 w-4" />
                  Pipetta sfondo
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-3">
                  <Button
                    type="button"
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
                    hideDesktopAdvancedPicker
                    onChange={(color) => {
                      setPresetId('custom');
                      setThemeColor(color);
                    }}
                  />
                </div>

                <ColorPicker
                  label="Colore sfondo"
                  value={backgroundColor}
                  hideDesktopAdvancedPicker
                  onChange={(color) => {
                    setPresetId('custom');
                    setBackgroundColor(color);
                  }}
                  presets={backgroundPresets}
                />
              </div>
            </section>
          </div>

          <section className="space-y-3 rounded-lg border border-border bg-card p-3 shadow-sm sm:p-4">
            <Label className="flex items-center gap-2 text-sm font-semibold">
              <Image className="h-4 w-4" />
              Sfondo pagina
            </Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {backgroundStyleOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setPresetId('custom');
                    setBackgroundStyle(option.id);
                  }}
                  className={`overflow-hidden rounded-lg border text-left transition-all hover:border-primary/60 hover:bg-muted/40 ${
                    backgroundStyle === option.id ? 'border-primary bg-primary/10 shadow-sm' : 'border-border bg-background'
                  }`}
                >
                  <span
                    className="block h-14 border-b border-border/70"
                    style={{
                      backgroundColor,
                      backgroundImage: getBackgroundPreview(option.id, backgroundColor, themeColor, previewAccent2, previewAccent3),
                      backgroundSize:
                        option.id === 'pokemon'
                          ? '40px 40px, auto, auto'
                          : option.id === 'pixel'
                            ? 'cover, 18px 18px, 18px 18px'
                            : 'cover',
                    }}
                  />
                  <span className="flex items-center justify-between gap-2 p-2.5">
                    <span className="truncate text-sm font-medium">{option.label}</span>
                    {backgroundStyle === option.id && <Check className="h-4 w-4 shrink-0 text-primary" />}
                  </span>
                </button>
              ))}
            </div>

            {backgroundStyle !== 'plain' && (
              <div className="grid gap-3 pt-1 md:grid-cols-2">
                <ColorPicker
                  label="Accento sfondo 2"
                  value={previewAccent2}
                  hideDesktopAdvancedPicker
                  onChange={(color) => {
                    setPresetId('custom');
                    setBackgroundColor2(color);
                  }}
                />
                <ColorPicker
                  label="Accento sfondo 3"
                  value={previewAccent3}
                  hideDesktopAdvancedPicker
                  onChange={(color) => {
                    setPresetId('custom');
                    setBackgroundColor3(color);
                  }}
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
              {saving ? 'Salvataggio...' : 'Salva preferenze'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
