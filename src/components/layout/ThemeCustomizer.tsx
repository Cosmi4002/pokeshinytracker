import { useMemo, useRef, useState, useEffect } from 'react';
import { Moon, Sun, Palette, Layout, Save, Sparkles } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTheme } from '@/lib/theme-context';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import { ColorPicker } from '@/components/settings/ColorPicker';
import { useToast } from '@/hooks/use-toast';
import { useRandomColor } from '@/lib/random-color-context';
import { Switch } from '@/components/ui/switch';
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

export function ThemeCustomizer() {
  const { setColorScheme, colorScheme } = useTheme();
  const { accentColor, setManualColor, resetToRandom, isRandom } = useRandomColor();
  const { preferences, loading, savePreferences } = useUserPreferences();
  const { toast } = useToast();

  const [themeColor, setThemeColor] = useState(preferences?.theme_color || '#8b5cf6');
  const [backgroundColor, setBackgroundColor] = useState(preferences?.background_color || '#0f172a');
  const [layoutStyle, setLayoutStyle] = useState(preferences?.layout_style || 'grid');
  const [presetId, setPresetId] = useState('custom');
  const [uiStyle, setUiStyle] = useState<UiStyle>(getStoredUiStyle());
  const [backgroundStyle, setBackgroundStyle] = useState<BackgroundStyle>(getStoredBackgroundStyle());
  const [backgroundColor2, setBackgroundColor2] = useState(getStoredBackgroundAccent2());
  const [backgroundColor3, setBackgroundColor3] = useState(getStoredBackgroundAccent3());
  const [advancedBg, setAdvancedBg] = useState(false);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  const initialAppearanceRef = useRef<{
    uiStyle: UiStyle;
    backgroundStyle: BackgroundStyle;
    backgroundColor2: string;
    backgroundColor3: string;
  } | null>(null);

  // Update local state when preferences load or dialog opens
  useEffect(() => {
    if (open) {
      setAdvancedBg(false);
      if (preferences) {
        setPresetId('custom');
        if (isRandom) {
          setThemeColor(accentColor);
        } else {
          setThemeColor(preferences.theme_color || '#8b5cf6');
        }
        setBackgroundColor(preferences.background_color || '#0f172a');
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
    }
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

  const handleSave = async () => {
    setSaving(true);

    // 1. Update Context (Local Immediate Effect)
    setManualColor(themeColor);

    // 2. Persist to Supabase
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
        title: '✅ Preferenze salvate',
        description: 'Colore personalizzato applicato',
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
    // 1. Immediate local reset
    resetToRandom();

    // 2. Persist random mode by clearing fixed theme color
    void savePreferences({
      theme_color: null,
      background_color: backgroundColor,
      layout_style: layoutStyle,
    });

    toast({
      title: '🔄 Modalità Random Attiva',
      description: 'I colori seguiranno il tema della Home',
    });
    setOpen(false);
  };

  const themePresets = useMemo(() => ([
    { id: 'neon-violet', name: 'Neon Violet', themeColor: '#a855f7', backgroundColor: '#0b1020', layoutStyle: 'grid', uiStyle: 'neon' as const, backgroundStyle: 'mesh' as const },
    { id: 'emerald-night', name: 'Emerald Night', themeColor: '#10b981', backgroundColor: '#071a12', layoutStyle: 'grid', uiStyle: 'soft' as const, backgroundStyle: 'aurora' as const },
    { id: 'sunset', name: 'Sunset', themeColor: '#fb7185', backgroundColor: '#1b0b10', layoutStyle: 'grid', uiStyle: 'soft' as const, backgroundStyle: 'diagonal' as const },
    { id: 'ice', name: 'Ice', themeColor: '#38bdf8', backgroundColor: '#07111a', layoutStyle: 'grid', uiStyle: 'glass' as const, backgroundStyle: 'aurora' as const },
    { id: 'amoled', name: 'AMOLED', themeColor: '#fbbf24', backgroundColor: '#000000', layoutStyle: 'compact', uiStyle: 'neon' as const, backgroundStyle: 'noise' as const },
    { id: 'classic', name: 'Classic', themeColor: '#8b5cf6', backgroundColor: '#0f172a', layoutStyle: 'grid', uiStyle: 'flat' as const, backgroundStyle: 'plain' as const },
  ]), []);

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
    setLayoutStyle(preset.layoutStyle);
    setUiStyle(preset.uiStyle);
    setBackgroundStyle(preset.backgroundStyle);
    if (!backgroundColor2) setBackgroundColor2(preset.themeColor);
    if (!backgroundColor3) setBackgroundColor3('#38bdf8');
  };

  const backgroundPresets = [
    '#0f172a', // Slate dark
    '#1e1b4b', // Indigo dark
    '#1f2937', // Gray dark
    '#18181b', // Zinc dark
    '#0c0a09', // Stone dark
    '#171717', // Neutral dark
    '#14532d', // Green dark
    '#1e3a8a', // Blue dark
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => {
      if (!v && open) handleCloseWithoutSave();
      setOpen(v);
    }}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-xl border-2 dark:bg-gray-800 dark:text-gray-100 transition-all duration-300"
          style={{
            borderColor: accentColor,
            boxShadow: `0 0 12px ${accentColor}40`
          }}
        >
          {colorScheme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Impostazioni</DialogTitle>
          <DialogDescription>
            Personalizza l'aspetto e il layout dell'applicazione
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Presets */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Temi Rapidi
            </Label>
            <Select value={presetId} onValueChange={applyPreset}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona un tema" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Personalizzato</SelectItem>
                {themePresets.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Theme Mode */}
          <div className="space-y-2">
            <Label>Modalità</Label>
            <div className="flex gap-2">
              <Button
                variant={colorScheme === 'light' ? 'default' : 'outline'}
                onClick={() => setColorScheme('light')}
                className="flex-1"
              >
                <Sun className="mr-2 h-4 w-4" />
                Light
              </Button>
              <Button
                variant={colorScheme === 'dark' ? 'default' : 'outline'}
                onClick={() => setColorScheme('dark')}
                className="flex-1"
              >
                <Moon className="mr-2 h-4 w-4" />
                Dark
              </Button>
            </div>
          </div>

          {/* Theme Color */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Colore Principale
            </Label>
            <div className="flex flex-col gap-3">
              <Button
                variant={isRandom ? "default" : "outline"}
                onClick={handleReset}
                className="w-full justify-start border-dashed"
                style={isRandom ? { backgroundColor: accentColor } : { borderColor: accentColor, color: accentColor }}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Usa Colore Home (Random)
              </Button>

              <ColorPicker
                label="O scegli un colore fisso"
                value={themeColor}
                onChange={setThemeColor}
              />
            </div>
          </div>

          {/* Background Color */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Colore Sfondo
            </Label>
            <ColorPicker
              label="Colore sfondo"
              value={backgroundColor}
              onChange={setBackgroundColor}
              presets={backgroundPresets}
            />
          </div>

          {/* Layout Style */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Layout className="h-4 w-4" />
              Stile Layout
            </Label>
            <Select value={layoutStyle} onValueChange={setLayoutStyle}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grid">
                  <div className="flex items-center gap-2">
                    <Layout className="h-4 w-4" />
                    <span>Grid - Griglia standard</span>
                  </div>
                </SelectItem>
                <SelectItem value="list">
                  <div className="flex items-center gap-2">
                    <Layout className="h-4 w-4" />
                    <span>List - Lista orizzontale</span>
                  </div>
                </SelectItem>
                <SelectItem value="compact">
                  <div className="flex items-center gap-2">
                    <Layout className="h-4 w-4" />
                    <span>Compact - Griglia compatta</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* UI Style */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Stile UI
            </Label>
            <Select value={uiStyle} onValueChange={(v) => setUiStyle(v as UiStyle)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="flat">Flat</SelectItem>
                <SelectItem value="soft">Soft</SelectItem>
                <SelectItem value="glass">Glass</SelectItem>
                <SelectItem value="neon">Neon</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Background Style */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Sfondo (stile)
            </Label>
            <Select value={backgroundStyle} onValueChange={(v) => setBackgroundStyle(v as BackgroundStyle)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="plain">Plain</SelectItem>
                <SelectItem value="mesh">Mesh</SelectItem>
                <SelectItem value="aurora">Aurora</SelectItem>
                <SelectItem value="diagonal">Diagonal</SelectItem>
                <SelectItem value="noise">Noise</SelectItem>
                <SelectItem value="pokemon">Pokémon</SelectItem>
              </SelectContent>
            </Select>

            {backgroundStyle !== 'plain' && (
              <div className="mt-2 rounded-lg border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Colori sfondo extra</Label>
                  <Switch checked={advancedBg} onCheckedChange={setAdvancedBg} />
                </div>
                {advancedBg && (
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <ColorPicker
                      label="Colore 2"
                      value={backgroundColor2 || themeColor}
                      onChange={setBackgroundColor2}
                    />
                    <ColorPicker
                      label="Colore 3"
                      value={backgroundColor3 || themeColor}
                      onChange={setBackgroundColor3}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={saving || loading}
              className="flex-1 shiny-glow"
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
