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

const DEFAULT_THEME_COLOR = '#8b5cf6';
const DEFAULT_BACKGROUND_COLOR = '#0f172a';
const DEFAULT_BG_ACCENT_3 = '#38bdf8';

function getBackgroundPreview(style: BackgroundStyle, backgroundColor: string, themeColor: string, color2: string, color3: string) {
  if (style === 'plain') return 'none';
  if (style === 'diagonal') {
    return `linear-gradient(135deg, ${themeColor}38, transparent 42%), radial-gradient(circle at 80% 20%, ${color2}35, transparent 48%), radial-gradient(circle at 20% 90%, ${color3}28, transparent 48%)`;
  }
  if (style === 'aurora') {
    return `radial-gradient(circle at 12% 24%, ${color2}42, transparent 44%), radial-gradient(circle at 88% 22%, ${color3}36, transparent 48%), radial-gradient(circle at 45% 92%, ${themeColor}34, transparent 52%)`;
  }
  if (style === 'mesh') {
    return `radial-gradient(circle at 20% 30%, ${themeColor}48, transparent 45%), radial-gradient(circle at 82% 28%, ${color2}3d, transparent 47%), radial-gradient(circle at 62% 82%, ${color3}32, transparent 48%)`;
  }
  if (style === 'noise') {
    return `radial-gradient(circle at 20% 25%, rgba(255,255,255,0.10), transparent 52%), repeating-linear-gradient(0deg, rgba(255,255,255,0.12) 0 1px, transparent 1px 5px)`;
  }
  return `radial-gradient(circle at 20% 25%, ${themeColor}35, transparent 46%), radial-gradient(circle at 84% 35%, ${color2}32, transparent 48%), radial-gradient(circle at 16px 16px, rgba(255,255,255,0.20) 2px, transparent 2.5px)`;
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

  const initialAppearanceRef = useRef<{
    uiStyle: UiStyle;
    backgroundStyle: BackgroundStyle;
    backgroundColor2: string;
    backgroundColor3: string;
  } | null>(null);

  const themePresets = useMemo<ThemePreset[]>(() => ([
    { id: 'violet-holo', name: 'Violet Holo', themeColor: '#a855f7', backgroundColor: '#0b1020', uiStyle: 'neon', backgroundStyle: 'mesh', backgroundColor2: '#38bdf8', backgroundColor3: '#f0abfc' },
    { id: 'mint-terminal', name: 'Mint Terminal', themeColor: '#34d399', backgroundColor: '#031713', uiStyle: 'soft', backgroundStyle: 'aurora', backgroundColor2: '#2dd4bf', backgroundColor3: '#bef264' },
    { id: 'sunset-route', name: 'Sunset Route', themeColor: '#fb7185', backgroundColor: '#1b0b10', uiStyle: 'soft', backgroundStyle: 'diagonal', backgroundColor2: '#fbbf24', backgroundColor3: '#f97316' },
    { id: 'glacier-byte', name: 'Glacier Byte', themeColor: '#38bdf8', backgroundColor: '#07111a', uiStyle: 'glass', backgroundStyle: 'aurora', backgroundColor2: '#99f6e4', backgroundColor3: '#818cf8' },
    { id: 'ultra-void', name: 'Ultra Void', themeColor: '#c084fc', backgroundColor: '#05030a', uiStyle: 'neon', backgroundStyle: 'pokemon', backgroundColor2: '#22d3ee', backgroundColor3: '#f472b6' },
    { id: 'gold-arcade', name: 'Gold Arcade', themeColor: '#fbbf24', backgroundColor: '#050505', uiStyle: 'neon', backgroundStyle: 'noise', backgroundColor2: '#f97316', backgroundColor3: '#e879f9' },
    { id: 'berry-pop', name: 'Berry Pop', themeColor: '#f43f5e', backgroundColor: '#160711', uiStyle: 'glass', backgroundStyle: 'mesh', backgroundColor2: '#ec4899', backgroundColor3: '#60a5fa' },
    { id: 'kanto-arcade', name: 'Kanto Arcade', themeColor: '#ef4444', backgroundColor: '#120708', uiStyle: 'neon', backgroundStyle: 'pokemon', backgroundColor2: '#facc15', backgroundColor3: '#38bdf8' },
    { id: 'johto-gold', name: 'Johto Gold', themeColor: '#f59e0b', backgroundColor: '#171008', uiStyle: 'soft', backgroundStyle: 'diagonal', backgroundColor2: '#fde68a', backgroundColor3: '#fb923c' },
    { id: 'hoenn-wave', name: 'Hoenn Wave', themeColor: '#06b6d4', backgroundColor: '#06151f', uiStyle: 'glass', backgroundStyle: 'aurora', backgroundColor2: '#22c55e', backgroundColor3: '#0ea5e9' },
    { id: 'sinnoh-myth', name: 'Sinnoh Myth', themeColor: '#818cf8', backgroundColor: '#090b1d', uiStyle: 'glass', backgroundStyle: 'mesh', backgroundColor2: '#c4b5fd', backgroundColor3: '#f0abfc' },
    { id: 'unova-noir', name: 'Unova Noir', themeColor: '#e5e7eb', backgroundColor: '#050507', uiStyle: 'flat', backgroundStyle: 'noise', backgroundColor2: '#64748b', backgroundColor3: '#f8fafc' },
    { id: 'kalos-prism', name: 'Kalos Prism', themeColor: '#ec4899', backgroundColor: '#120719', uiStyle: 'glass', backgroundStyle: 'aurora', backgroundColor2: '#38bdf8', backgroundColor3: '#a78bfa' },
    { id: 'alola-pop', name: 'Alola Pop', themeColor: '#14b8a6', backgroundColor: '#061414', uiStyle: 'soft', backgroundStyle: 'diagonal', backgroundColor2: '#facc15', backgroundColor3: '#fb7185' },
    { id: 'galar-punk', name: 'Galar Punk', themeColor: '#d946ef', backgroundColor: '#100413', uiStyle: 'neon', backgroundStyle: 'mesh', backgroundColor2: '#22d3ee', backgroundColor3: '#f97316' },
    { id: 'paldea-neon', name: 'Paldea Neon', themeColor: '#7c3aed', backgroundColor: '#09051a', uiStyle: 'neon', backgroundStyle: 'aurora', backgroundColor2: '#f59e0b', backgroundColor3: '#06b6d4' },
    { id: 'rocket-radio', name: 'Rocket Radio', themeColor: '#ef4444', backgroundColor: '#070707', uiStyle: 'neon', backgroundStyle: 'noise', backgroundColor2: '#f9fafb', backgroundColor3: '#71717a' },
    { id: 'master-ball', name: 'Master Ball', themeColor: '#8b5cf6', backgroundColor: '#0b0714', uiStyle: 'glass', backgroundStyle: 'pokemon', backgroundColor2: '#ec4899', backgroundColor3: '#f8fafc' },
  ]), []);

  const backgroundStyleOptions = useMemo<Array<{ id: BackgroundStyle; label: string }>>(() => ([
    { id: 'plain', label: 'Plain' },
    { id: 'mesh', label: 'Mesh' },
    { id: 'aurora', label: 'Aurora' },
    { id: 'diagonal', label: 'Diagonal' },
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

    setSaving(false);

    if (result?.success) {
      setStoredUiStyle(uiStyle);
      setStoredBackgroundStyle(backgroundStyle);
      setStoredBackgroundAccent2(backgroundColor2);
      setStoredBackgroundAccent3(backgroundColor3);
      toast({
        title: 'Preferenze salvate',
        description: 'Colori aggiornati correttamente',
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

  const previewAccent2 = backgroundColor2 || themeColor;
  const previewAccent3 = backgroundColor3 || DEFAULT_BG_ACCENT_3;

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
          <span className="sr-only">Impostazioni colori</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto p-0">
        <DialogHeader className="border-b border-border/70 bg-muted/30 px-5 pb-4 pt-5">
          <DialogTitle className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background">
              <Paintbrush className="h-4 w-4" />
            </span>
            Colori
          </DialogTitle>
          <DialogDescription>Personalizza tema, sfondo e modalita dell'app.</DialogDescription>
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
                onClick={() => setPresetId('custom')}
                className={`flex min-h-16 items-center gap-3 rounded-xl border p-3 text-left transition-all hover:border-primary/60 hover:bg-muted/40 ${
                  presetId === 'custom' ? 'border-primary bg-primary/10 shadow-sm' : 'border-border/80 bg-background/70'
                }`}
              >
                <span className="flex h-10 w-10 shrink-0 rounded-full border border-border p-1">
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
                  className={`flex min-h-16 items-center gap-3 rounded-xl border p-3 text-left transition-all hover:border-primary/60 hover:bg-muted/40 ${
                    presetId === preset.id ? 'border-primary bg-primary/10 shadow-sm' : 'border-border/80 bg-background/70'
                  }`}
                >
                  <span className="flex h-10 w-10 shrink-0 rounded-full border border-border p-1">
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

          <section className="space-y-3 rounded-xl border border-border/70 bg-card/70 p-4 shadow-sm">
            <Label className="flex items-center gap-2 text-sm font-semibold">
              <Sun className="h-4 w-4" />
              Modalita
            </Label>
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
              <Button
                type="button"
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
                type="button"
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
              Palette
            </Label>
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
                  onChange={(color) => {
                    setPresetId('custom');
                    setThemeColor(color);
                  }}
                />
              </div>

              <ColorPicker
                label="Colore sfondo"
                value={backgroundColor}
                onChange={(color) => {
                  setPresetId('custom');
                  setBackgroundColor(color);
                }}
                presets={backgroundPresets}
              />
            </div>
          </section>

          <section className="space-y-3 rounded-xl border border-border/70 bg-card/70 p-4 shadow-sm">
            <Label className="flex items-center gap-2 text-sm font-semibold">
              <Image className="h-4 w-4" />
              Sfondo
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
                  className={`overflow-hidden rounded-xl border text-left transition-all hover:border-primary/60 hover:bg-muted/40 ${
                    backgroundStyle === option.id ? 'border-primary bg-primary/10 shadow-sm' : 'border-border/80 bg-background/70'
                  }`}
                >
                  <span
                    className="block h-14 border-b border-border/70"
                    style={{
                      backgroundColor,
                      backgroundImage: getBackgroundPreview(option.id, backgroundColor, themeColor, previewAccent2, previewAccent3),
                      backgroundSize: option.id === 'pokemon' ? '40px 40px, auto, auto' : 'cover',
                    }}
                  />
                  <span className="flex items-center justify-between gap-2 p-3">
                    <span className="truncate text-sm font-medium">{option.label}</span>
                    {backgroundStyle === option.id && <Check className="h-4 w-4 shrink-0 text-primary" />}
                  </span>
                </button>
              ))}
            </div>

            {backgroundStyle !== 'plain' && (
              <div className="grid gap-3 pt-1 md:grid-cols-2">
                <ColorPicker
                  label="Colore sfondo 2"
                  value={previewAccent2}
                  onChange={(color) => {
                    setPresetId('custom');
                    setBackgroundColor2(color);
                  }}
                />
                <ColorPicker
                  label="Colore sfondo 3"
                  value={previewAccent3}
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
