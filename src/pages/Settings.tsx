import { useState, useEffect } from 'react';
import { Palette, Layout, Save, RotateCcw } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import { ColorPicker } from '@/components/settings/ColorPicker';
import { Link } from 'react-router-dom';

export default function Settings() {
    const { user } = useAuth();
    const { toast } = useToast();
    const { preferences, loading, savePreferences } = useUserPreferences();

    const [themeColor, setThemeColor] = useState(preferences.theme_color || '#8b5cf6');
    const [backgroundColor, setBackgroundColor] = useState(preferences.background_color || '#0f172a');
    const [layoutStyle, setLayoutStyle] = useState(preferences.layout_style || 'grid');
    const [saving, setSaving] = useState(false);

    // Update local state when preferences load
    useEffect(() => {
        if (preferences) {
            setThemeColor(preferences.theme_color || '#8b5cf6');
            setBackgroundColor(preferences.background_color || '#0f172a');
            setLayoutStyle(preferences.layout_style || 'grid');
        }
    }, [preferences]);

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
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <main className="container mx-auto py-8 px-4">
                    <Card>
                        <CardContent className="py-12 text-center">
                            <p className="text-muted-foreground mb-4">
                                Accedi per personalizzare l'applicazione
                            </p>
                            <Link to="/auth">
                                <Button>Accedi / Registrati</Button>
                            </Link>
                        </CardContent>
                    </Card>
                </main>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <main className="container mx-auto py-8 px-4">
                    <p className="text-center text-muted-foreground">Caricamento...</p>
                </main>
            </div>
        );
    }

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
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container mx-auto py-8 px-4 max-w-4xl">
                <div className="space-y-6">
                    {/* Header */}
                    <div>
                        <h1 className="text-3xl font-bold shiny-text">Impostazioni</h1>
                        <p className="text-muted-foreground">
                            Personalizza l'aspetto e il layout dell'applicazione
                        </p>
                    </div>

                    {/* Theme Color */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Palette className="h-5 w-5" />
                                Colore Principale
                            </CardTitle>
                            <CardDescription>
                                Scegli il colore principale dell'app (pulsanti, highlights, testo)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ColorPicker
                                label="Colore tema"
                                value={themeColor}
                                onChange={setThemeColor}
                            />
                        </CardContent>
                    </Card>

                    {/* Background Color */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Palette className="h-5 w-5" />
                                Colore Sfondo
                            </CardTitle>
                            <CardDescription>
                                Personalizza il colore di sfondo dell'applicazione
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ColorPicker
                                label="Colore sfondo"
                                value={backgroundColor}
                                onChange={setBackgroundColor}
                                presets={backgroundPresets}
                            />
                        </CardContent>
                    </Card>

                    {/* Layout Style */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Layout className="h-5 w-5" />
                                Stile Layout
                            </CardTitle>
                            <CardDescription>
                                Scegli come visualizzare le liste (cacce, collezione, ecc.)
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Label>Stile layout</Label>
                            <Select value={layoutStyle} onValueChange={setLayoutStyle}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="grid">
                                        <div className="flex items-center gap-2">
                                            <Layout className="h-4 w-4" />
                                            <span>Grid - Griglia standard (predefinito)</span>
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
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-1 shiny-glow"
                        >
                            <Save className="mr-2 h-4 w-4" />
                            {saving ? 'Salvataggio...' : 'Salva Preferenze'}
                        </Button>
                        <Button
                            onClick={handleReset}
                            variant="outline"
                        >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Ripristina
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    );
}
