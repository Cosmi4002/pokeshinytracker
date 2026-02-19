import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Settings2,
    ShieldCheck,
    AlertCircle,
    Palette,
    Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ColorPicker } from "@/components/settings/ColorPicker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useGlobalCollectionThemes } from "@/hooks/use-global-collection-themes";
import { GAMES } from "@/lib/pokemon-data";
import { getGameTheme } from "@/lib/game-themes";
import { cn } from "@/lib/utils";

export default function PokedexManager() {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const { overrides, saveOverrides, loading: themesLoading } = useGlobalCollectionThemes();
    const [isEditorEnabled, setIsEditorEnabled] = useState(() => {
        return localStorage.getItem('pokedex-editor-enabled') === 'true';
    });
    const [selectedGame, setSelectedGame] = useState('black2');
    const [draftOverrides, setDraftOverrides] = useState(overrides);
    const [isSavingThemes, setIsSavingThemes] = useState(false);

    const isAdmin = user?.email === 'chritel04@gmail.com';

    useEffect(() => {
        if (!authLoading && !isAdmin) {
            navigate('/');
        }
    }, [isAdmin, authLoading, navigate]);

    const handleToggleEditor = (checked: boolean) => {
        setIsEditorEnabled(checked);
        localStorage.setItem('pokedex-editor-enabled', checked ? 'true' : 'false');
        // Dispatch custom event to notify other components (like PokemonDetails)
        window.dispatchEvent(new Event('editor-mode-changed'));
    };

    useEffect(() => {
        setDraftOverrides(overrides);
    }, [overrides]);

    const gameBaseTheme = getGameTheme(selectedGame);
    const activeTheme = {
        primary: draftOverrides[selectedGame]?.primary || gameBaseTheme.primary,
        secondary: draftOverrides[selectedGame]?.secondary || gameBaseTheme.secondary,
        accent: draftOverrides[selectedGame]?.accent || gameBaseTheme.accent,
    };

    const updateThemeColor = (key: 'primary' | 'secondary' | 'accent', value: string) => {
        setDraftOverrides((prev) => ({
            ...prev,
            [selectedGame]: {
                ...prev[selectedGame],
                [key]: value,
            },
        }));
    };

    const handleApplyBlack2Preset = () => {
        setDraftOverrides((prev) => ({
            ...prev,
            [selectedGame]: {
                primary: '#0B0B0D',
                secondary: '#191F3F',
                accent: '#5D74C8',
            },
        }));
    };

    const handleResetSelectedGame = () => {
        const { [selectedGame]: _removed, ...rest } = draftOverrides;
        setDraftOverrides(rest);
    };

    const handleSaveGlobalThemes = async () => {
        setIsSavingThemes(true);
        try {
            await saveOverrides(draftOverrides);
            toast({
                title: 'Palette salvata',
                description: 'Le nuove sfumature collection sono ora globali per tutti gli utenti.',
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Errore salvataggio',
                description: error?.message || 'Impossibile salvare la palette globale.',
            });
        } finally {
            setIsSavingThemes(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!isAdmin) return null;

    return (
        <div className="min-h-screen bg-background pb-20">
            <Navbar />

            <main className="container mx-auto py-12 px-4 max-w-2xl">
                <div className="mb-8">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/pokedex')}
                        className="mb-4 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Torna al Pokédex
                    </Button>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Settings2 className="h-6 w-6 text-primary" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">Pannello Gestione</h1>
                    </div>
                    <p className="text-muted-foreground">
                        Configura le opzioni avanzate del tracker.
                    </p>
                </div>

                <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl overflow-hidden">
                    <CardHeader className="border-b border-white/5 bg-white/[0.02]">
                        <div className="flex items-center gap-2 text-primary mb-1">
                            <ShieldCheck className="h-4 w-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">Accesso Riservato</span>
                        </div>
                        <CardTitle>Editor Pokédex</CardTitle>
                        <CardDescription>
                            Abilita o disabilita gli strumenti di modifica direttamente sulle pagine dei Pokémon.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-8">
                        <div className="flex items-center justify-between p-6 rounded-2xl bg-white/[0.03] border border-white/5">
                            <div className="space-y-1">
                                <Label htmlFor="editor-mode" className="text-lg font-bold">Modalità Editor</Label>
                                <p className="text-sm text-muted-foreground">
                                    Mostra i pulsanti per rinominare o nascondere Pokémon e forme.
                                </p>
                            </div>
                            <Switch
                                id="editor-mode"
                                checked={isEditorEnabled}
                                onCheckedChange={handleToggleEditor}
                            />
                        </div>

                        <div className="mt-8 flex gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10 text-primary/80 text-sm">
                            <AlertCircle className="h-5 w-5 shrink-0" />
                            <p>
                                Quando l'editor è attivo, potrai vedere le icone di modifica (matita e occhio) nelle schede Pokémon per apportare modifiche globali.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="mt-6 border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl overflow-hidden">
                    <CardHeader className="border-b border-white/5 bg-white/[0.02]">
                        <div className="flex items-center gap-2 text-primary mb-1">
                            <Palette className="h-4 w-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">Globale Collection</span>
                        </div>
                        <CardTitle>Palette Riquadri Collezione</CardTitle>
                        <CardDescription>
                            Modifica le sfumature dei riquadri per ogni gioco. Il salvataggio è globale e visibile a tutti.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-5">
                        <div className="space-y-2">
                            <Label>Gioco da modificare</Label>
                            <Select value={selectedGame} onValueChange={setSelectedGame}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="max-h-72 overflow-y-auto">
                                    {GAMES.map((game) => (
                                        <SelectItem key={game.id} value={game.id}>
                                            {game.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <ColorPicker
                                label="Primary"
                                value={activeTheme.primary}
                                onChange={(v) => updateThemeColor('primary', v)}
                            />
                            <ColorPicker
                                label="Secondary"
                                value={activeTheme.secondary}
                                onChange={(v) => updateThemeColor('secondary', v)}
                            />
                            <ColorPicker
                                label="Accent"
                                value={activeTheme.accent}
                                onChange={(v) => updateThemeColor('accent', v)}
                            />
                        </div>

                        <div className="rounded-xl border border-white/10 p-4">
                            <p className="text-xs text-muted-foreground mb-3">Anteprima rapida (stile card collection)</p>
                            <div
                                className="h-20 rounded-lg border"
                                style={{
                                    borderColor: `${activeTheme.primary}99`,
                                    background: `linear-gradient(145deg, color-mix(in srgb, ${activeTheme.secondary} 42%, #111), color-mix(in srgb, ${activeTheme.primary} 36%, #111))`,
                                    boxShadow: `0 0 18px ${activeTheme.secondary}55`,
                                }}
                            />
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Button type="button" variant="outline" onClick={handleApplyBlack2Preset}>
                                Preset Black 2
                            </Button>
                            <Button type="button" variant="outline" onClick={handleResetSelectedGame}>
                                Ripristina gioco selezionato
                            </Button>
                            <Button
                                type="button"
                                className="ml-auto"
                                onClick={handleSaveGlobalThemes}
                                disabled={themesLoading || isSavingThemes}
                            >
                                <Save className="mr-2 h-4 w-4" />
                                {isSavingThemes ? 'Salvataggio...' : 'Salva Globale'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}

