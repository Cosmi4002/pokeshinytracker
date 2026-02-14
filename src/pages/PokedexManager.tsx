import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Settings2,
    ShieldCheck,
    AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

export default function PokedexManager() {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const [isEditorEnabled, setIsEditorEnabled] = useState(() => {
        return localStorage.getItem('pokedex-editor-enabled') === 'true';
    });

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
            </main>
        </div>
    );
}

