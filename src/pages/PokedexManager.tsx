import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Search,
    Settings2,
    Trash2,
    RefreshCw,
    CheckCircle2,
    XCircle,
    Edit3,
    ChevronDown,
    ChevronUp,
    Eye,
    EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePokemonList } from "@/hooks/use-pokemon";
import { usePokedexOverrides } from "@/hooks/use-pokedex-overrides";
import { Navbar } from "@/components/layout/Navbar";
import { getPokemonSpriteUrl } from "@/lib/pokemon-data";
import { useAuth } from "@/lib/auth-context";

export default function PokedexManager() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { pokemon: allPokemon, loading: listLoading } = usePokemonList();
    const { overrides, saveOverride, deleteOverride, loading: overridesLoading } = usePokedexOverrides();
    const [search, setSearch] = useState("");
    const [expandedIds, setExpandedIds] = useState<number[]>([]);

    const filteredPokemon = useMemo(() => {
        if (!allPokemon) return [];
        return allPokemon.filter(p =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.displayName.toLowerCase().includes(search.toLowerCase()) ||
            p.id.toString() === search
        ).slice(0, 100); // Limit to 100 for performance
    }, [allPokemon, search]);

    const toggleExpand = (id: number) => {
        setExpandedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    if (listLoading || overridesLoading) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="flex items-center justify-center h-[calc(100vh-64px)]">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-20">
            <Navbar />

            <main className="container mx-auto py-8 px-4 max-w-4xl">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate('/pokedex')}
                            className="mb-2 -ml-2 text-muted-foreground"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Pokedex
                        </Button>
                        <h1 className="text-3xl font-bold tracking-tight">Gestione Pokedex</h1>
                        <p className="text-muted-foreground mt-1">
                            Personalizza nomi o elimina forme specifiche visivamente.
                        </p>
                    </div>

                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Cerca Pokémon..."
                            className="pl-9 h-11 bg-card border-muted/20"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Main List */}
                <div className="space-y-4">
                    {filteredPokemon.map(p => {
                        const isExpanded = expandedIds.includes(p.id);
                        const override = overrides[`${p.id}-${p.name}`];
                        const isExcluded = override?.is_excluded;

                        return (
                            <Card key={p.id} className={cn(
                                "overflow-hidden transition-all duration-200 border-muted/20",
                                isExcluded ? "opacity-60 bg-muted/5" : "bg-card shadow-lg"
                            )}>
                                <div className="p-4 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="h-16 w-16 bg-muted/20 rounded-xl p-2 flex items-center justify-center relative">
                                            <img
                                                src={getPokemonSpriteUrl(p.id, { shiny: true, name: p.name })}
                                                alt={p.name}
                                                className="h-full w-full object-contain"
                                            />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-mono text-muted-foreground">#{String(p.id).padStart(3, '0')}</span>
                                                <h3 className="font-bold text-lg leading-none">
                                                    {override?.custom_display_name || p.displayName}
                                                </h3>
                                                {override?.custom_display_name && (
                                                    <Badge variant="outline" className="text-[10px] h-4">PERSONALIZZATO</Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-1 capitalize">{p.name}</p>
                                            {user && (
                                                <div className="flex gap-1 ml-auto">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const newName = prompt("Personalizza nome display:", p.displayName);
                                                            if (newName !== null) {
                                                                saveOverride(p.id, p.name, { custom_display_name: newName });
                                                            }
                                                        }}
                                                    >
                                                        <Edit3 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (confirm(`Nascondere definitivamente ${p.displayName}?`)) {
                                                                saveOverride(p.id, p.name, { is_excluded: true });
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {user && (
                                            <Button
                                                variant={isExcluded ? "default" : "secondary"}
                                                size="sm"
                                                onClick={() => saveOverride(p.id, p.name, { is_excluded: !isExcluded })}
                                                className={cn(
                                                    "gap-2",
                                                    isExcluded ? "bg-primary hover:bg-primary/90" : "bg-muted/50 text-muted-foreground"
                                                )}
                                            >
                                                {isExcluded ? (
                                                    <><Eye className="h-4 w-4" /> Ripristina</>
                                                ) : (
                                                    <><EyeOff className="h-4 w-4" /> Elimina</>
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        );
                    })}

                    {filteredPokemon.length === 0 && (
                        <div className="py-20 text-center">
                            <Settings2 className="h-12 w-12 mx-auto text-muted-foreground/20 mb-4" />
                            <p className="text-muted-foreground">Nessun Pokémon trovato con questi criteri.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

// Simple cn utility if not already present or accessible
function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ");
}
