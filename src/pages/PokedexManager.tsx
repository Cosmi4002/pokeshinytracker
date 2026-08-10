import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Layers,
    Palette,
    RotateCcw,
    Save,
    Settings2,
    ShieldCheck,
    Sparkles,
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
import { GAMES, getPokemonSpriteUrl } from "@/lib/pokemon-data";
import { getGameTheme, type GameTheme } from "@/lib/game-themes";
import { cn } from "@/lib/utils";
import { CARD_FILTER_OPTIONS, getCardFilterOption, type CardFilterId } from "@/lib/card-effects";

const previewFilterOverlay = (filter: CardFilterId) => {
    if (filter === "holo") {
        return (
            <div className="absolute inset-0 rounded-xl opacity-70 mix-blend-screen">
                <div className="absolute inset-[1px] rounded-xl border border-white/20 bg-[linear-gradient(118deg,rgba(255,255,255,0.22),rgba(134,239,172,0.10)_18%,rgba(125,211,252,0.12)_35%,transparent_49%,rgba(216,180,254,0.14)_67%,rgba(255,255,255,0.16))]" />
            </div>
        );
    }

    if (filter === "cosmic") {
        return (
            <div
                className="absolute inset-0 rounded-xl opacity-80 mix-blend-screen"
                style={{
                    background:
                        "radial-gradient(circle at 18% 20%, rgba(129,140,248,0.44), transparent 34%), radial-gradient(circle at 80% 24%, rgba(236,72,153,0.30), transparent 30%), radial-gradient(circle at 50% 78%, rgba(56,189,248,0.26), transparent 36%), radial-gradient(circle at 16% 22%, white 0 1px, transparent 2px), radial-gradient(circle at 34% 52%, white 0 1px, transparent 2px), radial-gradient(circle at 74% 28%, white 0 1px, transparent 2px), radial-gradient(circle at 86% 72%, rgba(255,255,255,0.8) 0 1px, transparent 2px), radial-gradient(circle at 52% 74%, white 0 1px, transparent 2px)",
                }}
            />
        );
    }

    if (filter === "prism") {
        return (
            <div
                className="absolute inset-0 rounded-xl opacity-75 mix-blend-screen"
                style={{
                    background:
                        "linear-gradient(130deg, transparent 0 10%, rgba(255,255,255,0.28) 12%, rgba(244,114,182,0.22) 20%, transparent 31%), linear-gradient(42deg, transparent 0 18%, rgba(34,211,238,0.24) 24%, rgba(167,139,250,0.20) 34%, transparent 48%), linear-gradient(158deg, transparent 0 44%, rgba(250,204,21,0.20) 52%, rgba(74,222,128,0.18) 62%, transparent 78%)",
                }}
            />
        );
    }

    if (filter === "ember") {
        return (
            <div
                className="absolute inset-0 rounded-xl opacity-85 mix-blend-screen"
                style={{
                    background:
                        "radial-gradient(circle at 20% 82%, rgba(251,146,60,0.62), transparent 38%), radial-gradient(circle at 76% 26%, rgba(248,113,113,0.42), transparent 34%), radial-gradient(circle at 48% 55%, rgba(250,204,21,0.28), transparent 28%), linear-gradient(22deg, transparent 12%, rgba(255,237,213,0.20) 42%, transparent 66%)",
                }}
            />
        );
    }

    if (filter === "shadow") {
        return <div className="absolute inset-0 rounded-xl bg-[radial-gradient(circle_at_center,transparent_34%,rgba(0,0,0,0.56)_100%)]" />;
    }

    return null;
};

export default function PokedexManager() {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const { overrides, effects, saveConfig, loading: themesLoading } = useGlobalCollectionThemes();
    const [isEditorEnabled, setIsEditorEnabled] = useState(() => localStorage.getItem("pokedex-editor-enabled") === "true");
    const [selectedGame, setSelectedGame] = useState("black2");
    const [draftOverrides, setDraftOverrides] = useState(overrides);
    const [pokedexCardFilter, setPokedexCardFilter] = useState<CardFilterId>(effects.pokedexCardFilter);
    const [collectionCardFilter, setCollectionCardFilter] = useState<CardFilterId>(effects.collectionCardFilter);
    const [isSavingThemes, setIsSavingThemes] = useState(false);

    const isAdmin = user?.email === "chritel04@gmail.com";
    const selectedGameData = GAMES.find((game) => game.id === selectedGame) || GAMES[0];
    const gameBaseTheme = getGameTheme(selectedGame);
    const activeTheme: GameTheme = {
        primary: draftOverrides[selectedGame]?.primary || gameBaseTheme.primary,
        secondary: draftOverrides[selectedGame]?.secondary || gameBaseTheme.secondary,
        accent: draftOverrides[selectedGame]?.accent || gameBaseTheme.accent,
    };
    const gamePresets = useMemo(
        () =>
            GAMES.map((game) => {
                const base = getGameTheme(game.id);
                const saved = overrides[game.id];
                return {
                    ...game,
                    colors: {
                        primary: saved?.primary || base.primary,
                        secondary: saved?.secondary || base.secondary,
                        accent: saved?.accent || base.accent,
                    },
                };
            }),
        [overrides]
    );
    const selectedFilter = getCardFilterOption(collectionCardFilter);
    const previewSprite = getPokemonSpriteUrl(373, { shiny: true, name: "salamence" });
    const previewLogo = selectedGameData.logo || `/img/game-logos/${selectedGameData.id}.png`;

    useEffect(() => {
        setDraftOverrides(overrides);
    }, [overrides]);

    useEffect(() => {
        setPokedexCardFilter(effects.pokedexCardFilter);
        setCollectionCardFilter(effects.collectionCardFilter);
    }, [effects.collectionCardFilter, effects.pokedexCardFilter]);

    const handleToggleEditor = (checked: boolean) => {
        setIsEditorEnabled(checked);
        localStorage.setItem("pokedex-editor-enabled", checked ? "true" : "false");
        window.dispatchEvent(new Event("editor-mode-changed"));
    };

    const updateThemeColor = (key: keyof GameTheme, value: string) => {
        setDraftOverrides((prev) => ({
            ...prev,
            [selectedGame]: {
                ...prev[selectedGame],
                [key]: value,
            },
        }));
    };

    const applyPresetToSelectedGame = (colors: GameTheme) => {
        setDraftOverrides((prev) => ({
            ...prev,
            [selectedGame]: colors,
        }));
    };

    const handleResetSelectedGame = () => {
        const { [selectedGame]: _removed, ...rest } = draftOverrides;
        setDraftOverrides(rest);
    };

    const handleDiscardDraft = () => {
        setDraftOverrides(overrides);
        setPokedexCardFilter(effects.pokedexCardFilter);
        setCollectionCardFilter(effects.collectionCardFilter);
    };

    const handleSaveCardSettings = async () => {
        setIsSavingThemes(true);
        try {
            await saveConfig(draftOverrides, {
                blackEffectEnabled: false,
                pokedexCardFilter,
                collectionCardFilter,
            });
            toast({
                title: "Gestione card salvata",
                description: "Le preferenze sono state salvate su questo dispositivo.",
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Errore salvataggio",
                description: error?.message || "Impossibile salvare le preferenze card.",
            });
        } finally {
            setIsSavingThemes(false);
        }
    };

    if (authLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-20">
            <Navbar />

            <main className="container mx-auto max-w-6xl px-4 py-8">
                <div className="mb-6">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate("/pokedex")}
                        className="mb-4 -ml-2 text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Torna al Pokedex
                    </Button>
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-primary/10 p-2">
                            <Settings2 className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Gestione card</h1>
                            <p className="text-sm text-muted-foreground">Colori e filtri delle card, salvati come preferenza personale.</p>
                        </div>
                    </div>
                </div>

                {isAdmin && (
                    <Card className="mb-6 overflow-hidden border-white/10 bg-white/5 shadow-xl backdrop-blur-xl">
                        <CardHeader className="border-b border-white/5 bg-white/[0.02]">
                            <div className="mb-1 flex items-center gap-2 text-primary">
                                <ShieldCheck className="h-4 w-4" />
                                <span className="text-xs font-bold uppercase tracking-widest">Solo admin</span>
                            </div>
                            <CardTitle>Editor Pokedex</CardTitle>
                            <CardDescription>Mostra i pulsanti di modifica nelle pagine dei Pokemon.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-5">
                            <div className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-white/[0.03] p-4">
                                <div>
                                    <Label htmlFor="editor-mode" className="text-base font-bold">
                                        Modalita Editor
                                    </Label>
                                    <p className="text-sm text-muted-foreground">Rinomina o nasconde Pokemon e forme.</p>
                                </div>
                                <Switch id="editor-mode" checked={isEditorEnabled} onCheckedChange={handleToggleEditor} />
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)]">
                    <div className="space-y-6">
                        <Card className="overflow-hidden border-white/10 bg-white/5 shadow-xl backdrop-blur-xl">
                            <CardHeader className="border-b border-white/5 bg-white/[0.02]">
                                <div className="mb-1 flex items-center gap-2 text-primary">
                                    <Layers className="h-4 w-4" />
                                    <span className="text-xs font-bold uppercase tracking-widest">Filtri separati</span>
                                </div>
                                <CardTitle>Filtri card</CardTitle>
                                <CardDescription>Scegli effetti indipendenti per Pokedex e Collezione.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-5">
                                <div className="grid gap-4 md:grid-cols-2">
                                    {([
                                        {
                                            id: "pokedex-card-filter",
                                            label: "Card Pokedex",
                                            value: pokedexCardFilter,
                                            onChange: setPokedexCardFilter,
                                            preview: "Pokedex",
                                        },
                                        {
                                            id: "collection-card-filter",
                                            label: "Card Collezione",
                                            value: collectionCardFilter,
                                            onChange: setCollectionCardFilter,
                                            preview: "Collection",
                                        },
                                    ] as const).map((control) => {
                                        const selected = getCardFilterOption(control.value);
                                        return (
                                            <div key={control.id} className="space-y-3 rounded-lg border border-white/10 bg-background/55 p-4">
                                                <div className="space-y-1">
                                                    <Label htmlFor={control.id} className="text-base font-bold">
                                                        {control.label}
                                                    </Label>
                                                    <p className="min-h-8 text-xs text-muted-foreground">{selected.description}</p>
                                                </div>
                                                <Select value={control.value} onValueChange={(value) => control.onChange(value as CardFilterId)}>
                                                    <SelectTrigger id={control.id}>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {CARD_FILTER_OPTIONS.map((option) => (
                                                            <SelectItem key={option.id} value={option.id}>
                                                                {option.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <div
                                                    className={cn(
                                                        "relative flex h-20 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br from-slate-950 to-slate-800 text-xs font-black uppercase tracking-[0.16em] text-white shadow-inner",
                                                        control.value === "shadow" && "from-slate-950 to-black"
                                                    )}
                                                >
                                                    {previewFilterOverlay(control.value)}
                                                    <span className="relative z-10">{control.preview}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="overflow-hidden border-white/10 bg-white/5 shadow-xl backdrop-blur-xl">
                            <CardHeader className="border-b border-white/5 bg-white/[0.02]">
                                <div className="mb-1 flex items-center gap-2 text-primary">
                                    <Palette className="h-4 w-4" />
                                    <span className="text-xs font-bold uppercase tracking-widest">Colori Collezione</span>
                                </div>
                                <CardTitle>Colori card Collezione</CardTitle>
                                <CardDescription>Modifica i colori del gioco selezionato senza cambiare gli altri giochi.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-5 pt-5">
                                <div className="grid gap-4 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
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
                                    <div className="grid grid-cols-3 gap-2 rounded-lg border border-white/10 bg-background/55 p-3">
                                        {(["primary", "secondary", "accent"] as const).map((key) => (
                                            <div key={key} className="min-w-0">
                                                <span className="block truncate text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                                                    {key}
                                                </span>
                                                <span className="mt-1 block h-8 rounded-md border border-white/10" style={{ backgroundColor: activeTheme[key] }} />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-3">
                                    <ColorPicker label="Primary" value={activeTheme.primary} onChange={(v) => updateThemeColor("primary", v)} hideDesktopAdvancedPicker />
                                    <ColorPicker label="Secondary" value={activeTheme.secondary} onChange={(v) => updateThemeColor("secondary", v)} hideDesktopAdvancedPicker />
                                    <ColorPicker label="Accent" value={activeTheme.accent} onChange={(v) => updateThemeColor("accent", v)} hideDesktopAdvancedPicker />
                                </div>

                                <div className="space-y-3 rounded-lg border border-white/10 bg-background/55 p-4">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="h-4 w-4 text-primary" />
                                        <Label className="text-base font-bold">Preset giochi</Label>
                                    </div>
                                    <div className="grid max-h-60 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                                        {gamePresets.map((game) => (
                                            <button
                                                key={game.id}
                                                type="button"
                                                onClick={() => applyPresetToSelectedGame(game.colors)}
                                                className="flex min-h-14 items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-2.5 text-left transition hover:border-primary/50 hover:bg-primary/5"
                                            >
                                                <span className="flex h-8 w-8 shrink-0 overflow-hidden rounded-full border border-white/10">
                                                    <span className="flex-1" style={{ backgroundColor: game.colors.primary }} />
                                                    <span className="flex-1" style={{ backgroundColor: game.colors.secondary }} />
                                                    <span className="flex-1" style={{ backgroundColor: game.colors.accent }} />
                                                </span>
                                                <span className="min-w-0">
                                                    <span className="block truncate text-sm font-semibold">{game.name}</span>
                                                    <span className="block truncate text-xs text-muted-foreground">Applica al gioco selezionato</span>
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <aside className="space-y-6">
                        <Card className="overflow-hidden border-white/10 bg-white/5 shadow-xl backdrop-blur-xl lg:sticky lg:top-24">
                            <CardHeader className="border-b border-white/5 bg-white/[0.02]">
                                <CardTitle>Anteprima rapida</CardTitle>
                                <CardDescription>Card simulativa con colori e filtro Collezione attuali.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-5">
                                <div
                                    className="relative overflow-hidden rounded-xl border p-3 shadow-xl"
                                    style={{
                                        borderColor: `${activeTheme.accent}aa`,
                                        background: `linear-gradient(145deg, ${activeTheme.primary} 0%, ${activeTheme.secondary} 42%, #111 100%)`,
                                        boxShadow: `0 16px 34px ${activeTheme.secondary}44`,
                                    }}
                                >
                                    {previewFilterOverlay(collectionCardFilter)}
                                    <div className="relative z-10 flex min-h-[9.5rem] flex-col rounded-lg border border-white/10 bg-black/35 p-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">Shiny record</p>
                                                <h3 className="mt-1 text-2xl font-black text-white drop-shadow">Salamence</h3>
                                            </div>
                                            <img
                                                src={previewLogo}
                                                alt={selectedGameData.name}
                                                className="h-9 max-w-20 object-contain drop-shadow-lg"
                                                onError={(event) => {
                                                    event.currentTarget.style.display = "none";
                                                }}
                                            />
                                        </div>
                                        <div className="mt-2 flex flex-1 items-center justify-center">
                                            <img src={previewSprite} alt="Shiny Salamence" className="h-24 w-24 object-contain drop-shadow-[0_8px_18px_rgba(0,0,0,0.75)]" />
                                        </div>
                                        <div className="mt-auto grid grid-cols-3 gap-2 text-center">
                                            <div className="rounded-lg border border-white/10 bg-black/35 px-2 py-2">
                                                <p className="text-[10px] font-bold uppercase text-white/50">Metodo</p>
                                                <p className="truncate text-xs font-black text-white">Random</p>
                                            </div>
                                            <div className="rounded-lg border border-white/10 bg-black/35 px-2 py-2">
                                                <p className="text-[10px] font-bold uppercase text-white/50">Enc.</p>
                                                <p className="text-xs font-black text-white">4096</p>
                                            </div>
                                            <div className="rounded-lg border border-white/10 bg-black/35 px-2 py-2">
                                                <p className="text-[10px] font-bold uppercase text-white/50">Data</p>
                                                <p className="truncate text-xs font-black text-white">10 Ago</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-lg border border-white/10 bg-background/55 p-3">
                                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Filtro Collezione</p>
                                    <p className="mt-1 text-sm font-semibold">{selectedFilter.name}</p>
                                    <p className="mt-1 text-xs text-muted-foreground">{selectedFilter.description}</p>
                                </div>

                                <div className="grid gap-2">
                                    <Button type="button" onClick={handleSaveCardSettings} disabled={themesLoading || isSavingThemes}>
                                        <Save className="mr-2 h-4 w-4" />
                                        {isSavingThemes ? "Salvataggio..." : "Salva gestione card"}
                                    </Button>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button type="button" variant="outline" onClick={handleDiscardDraft}>
                                            <RotateCcw className="mr-2 h-4 w-4" />
                                            Annulla
                                        </Button>
                                        <Button type="button" variant="outline" onClick={handleResetSelectedGame}>
                                            Default gioco
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </aside>
                </div>
            </main>
        </div>
    );
}
