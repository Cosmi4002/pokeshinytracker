import { useState, useEffect } from 'react';
import { Moon, Sun, Palette, Layout, Save, RotateCcw } from 'lucide-react';
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

export function ThemeCustomizer() {
  const { setTheme, theme, setColorScheme, colorScheme } = useTheme();
  const { preferences, loading, savePreferences } = useUserPreferences();
  const { toast } = useToast();

  const [themeColor, setThemeColor] = useState(preferences?.theme_color || '#8b5cf6');
  const [backgroundColor, setBackgroundColor] = useState(preferences?.background_color || '#0f172a');
  const [layoutStyle, setLayoutStyle] = useState(preferences?.layout_style || 'grid');
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  // Update local state when preferences load or dialog opens
  useEffect(() => {
    if (preferences && open) {
      setThemeColor(preferences.theme_color || '#8b5cf6');
      setBackgroundColor(preferences.background_color || '#0f172a');
      setLayoutStyle(preferences.layout_style || 'grid');
    }
  }, [preferences, open]);

  const handleSave = async () => {
    setSaving(true);
    const result = await savePreferences({
      theme_color: themeColor,
      background_color: backgroundColor,
      layout_style: layoutStyle,
    });

    setSaving(false);

    if (result?.success) {
      toast({
        title: '✅ Preferenze salvate',
        description: 'Le tue personalizzazioni sono state applicate',
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
    setThemeColor('#8b5cf6');
    setBackgroundColor('#0f172a');
    setLayoutStyle('grid');
    setColorScheme('dark');
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 shiny-glow shiny-border-glow">
          {colorScheme === 'dark' ? <Moon className="h-[1.2rem] w-[1.2rem]" /> : <Sun className="h-[1.2rem] w-[1.2rem]" />}
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
            <ColorPicker
              label="Colore tema"
              value={themeColor}
              onChange={setThemeColor}
            />
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

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={saving || loading}
              className="flex-1 shiny-glow"
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Salvataggio...' : 'Salva'}
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              disabled={loading}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}