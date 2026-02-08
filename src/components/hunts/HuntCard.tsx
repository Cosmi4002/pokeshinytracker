import { Link } from 'react-router-dom';
import { ArrowRight, Trash2, Clock, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { HUNTING_METHODS, getGameSpecificSpriteUrl, getPokemonSpriteUrl } from '@/lib/pokemon-data';
import { calculateShinyStats } from '@/lib/pokemon-data';
import type { Tables } from '@/integrations/supabase/types';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import { useRandomColor } from '@/lib/random-color-context';

type ActiveHuntRow = Tables<'active_hunts'>;

interface HuntCardProps {
    hunt: ActiveHuntRow;
    onDelete: (huntId: string) => void;
    onEdit: (hunt: ActiveHuntRow) => void;
    onContinue?: (huntId: string) => void;
    layoutStyle?: string;
}

export function HuntCard({ hunt, onDelete, onEdit, onContinue, layoutStyle = 'grid' }: HuntCardProps) {
    const { accentColor } = useRandomColor();
    const method = HUNTING_METHODS.find((m) => m.id === hunt.method);
    const stats = calculateShinyStats(hunt.counter || 0, hunt.method || 'gen9-random', hunt.has_shiny_charm || false);


    const timeAgo = hunt.updated_at
        ? formatDistanceToNow(new Date(hunt.updated_at), { addSuffix: true, locale: it })
        : 'mai';

    const handleContinueClick = () => {
        if (onContinue) {
            onContinue(hunt.id);
        }
    };

    // List layout - horizontal card
    if (layoutStyle === 'list') {
        return (
            <Card className="group hover:border-primary transition-all duration-200">
                <CardContent className="py-4">
                    <div className="flex items-center gap-4">
                        {/* Pokemon Sprite */}
                        <div className="flex-shrink-0">
                            {hunt.pokemon_id ? (
                                <img
                                    src={getGameSpecificSpriteUrl(hunt.pokemon_id, hunt.method || 'gen9-random', hunt.pokemon_name || undefined) || ''}
                                    alt={hunt.pokemon_name || 'Pokemon'}
                                    className="w-16 h-16 object-contain pokemon-sprite"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = '/placeholder.svg';
                                    }}
                                />
                            ) : (
                                <div className="w-16 h-16 flex items-center justify-center bg-muted rounded-lg">
                                    <span className="text-2xl">?</span>
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold truncate capitalize">{hunt.pokemon_name || 'Pokemon sconosciuto'}</h3>
                            <div className="text-2xl font-bold tabular-nums shiny-text">
                                {(hunt.counter || 0).toLocaleString()}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{method?.name || 'Sconosciuto'}</p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 flex-shrink-0">
                            {onContinue ? (
                                <Button size="sm" variant="default" onClick={handleContinueClick}>
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            ) : (
                                <Link to={`/counter/${hunt.id}`}>
                                    <Button size="sm" variant="default">
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </Link>
                            )}
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onEdit(hunt)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => onDelete(hunt.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Compact layout - smaller cards
    if (layoutStyle === 'compact') {
        return (
            <Card className="group hover:border-primary transition-all duration-200">
                <CardContent className="pt-4 pb-3 px-3">
                    {/* Pokemon Sprite */}
                    <div className="flex justify-center mb-2">
                        {hunt.pokemon_id ? (
                            <img
                                src={getGameSpecificSpriteUrl(hunt.pokemon_id, hunt.method || 'gen9-random', hunt.pokemon_name || undefined) || ''}
                                alt={hunt.pokemon_name || 'Pokemon'}
                                className="w-16 h-16 object-contain pokemon-sprite"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/placeholder.svg';
                                }}
                            />
                        ) : (
                            <div className="w-16 h-16 flex items-center justify-center bg-muted rounded-lg">
                                <span className="text-2xl">?</span>
                            </div>
                        )}
                    </div>

                    <h3 className="text-sm font-bold text-center mb-1 truncate capitalize">
                        {hunt.pokemon_name || 'Pokemon sconosciuto'}
                    </h3>

                    <div className="text-center mb-2">
                        <div className="text-2xl font-bold tabular-nums shiny-text">
                            {(hunt.counter || 0).toLocaleString()}
                        </div>
                    </div>

                    <div className="flex gap-1">
                        {onContinue ? (
                            <Button className="w-full flex-1" size="sm" variant="default" onClick={handleContinueClick}>
                                <ArrowRight className="h-3 w-3" />
                            </Button>
                        ) : (
                            <Link to={`/counter/${hunt.id}`} className="flex-1">
                                <Button className="w-full" size="sm" variant="default">
                                    <ArrowRight className="h-3 w-3" />
                                </Button>
                            </Link>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(hunt)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => onDelete(hunt.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    </div>
                </CardContent>
            </Card >
        );
    }

    // Default grid layout
    return (
        <Card
            className="group transition-all duration-200 relative overflow-hidden"
            style={{ borderColor: 'transparent' }}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = accentColor;
                // e.currentTarget.style.boxShadow = `0 4px 12px ${accentColor}20`;
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'transparent';
                // e.currentTarget.style.boxShadow = '';
            }}
        >
            <CardContent className="pt-6">
                {/* Pokemon Sprite */}
                <div className="flex justify-center mb-4">
                    {hunt.pokemon_id ? (
                        <img
                            src={getGameSpecificSpriteUrl(hunt.pokemon_id, hunt.method || 'gen9-random', hunt.pokemon_name || undefined) || ''}
                            alt={hunt.pokemon_name || 'Pokemon'}
                            className="w-24 h-24 lg:w-40 lg:h-40 object-contain pokemon-sprite"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder.svg';
                            }}
                        />
                    ) : (
                        <div className="w-24 h-24 lg:w-40 lg:h-40 flex items-center justify-center bg-muted rounded-lg">
                            <span className="text-4xl">?</span>
                        </div>
                    )}
                </div>

                {/* Pokemon Name */}
                <h3 className="text-xl font-bold text-center mb-2 capitalize">
                    {hunt.pokemon_name || 'Pokemon sconosciuto'}
                </h3>

                {/* Counter */}
                <div className="text-center mb-4">
                    <div
                        className="text-4xl font-bold tabular-nums"
                        style={{
                            background: `linear-gradient(90deg, ${accentColor} 0%, color-mix(in srgb, ${accentColor}, white 40%) 50%, ${accentColor} 100%)`,
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            color: 'transparent'
                        }}
                    >
                        {(hunt.counter || 0).toLocaleString()}
                    </div>
                    <p className="text-sm text-muted-foreground">incontri</p>
                </div>

                {/* Stats */}
                <div className="space-y-2 mb-4 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Metodo:</span>
                        <span className="font-semibold text-xs">{method?.name || 'Sconosciuto'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Probabilità:</span>
                        <span className="font-semibold">{stats.binomialProbability}%</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">{timeAgo}</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    {onContinue ? (
                        <Button
                            className="w-full flex-1"
                            onClick={handleContinueClick}
                            style={{ backgroundColor: accentColor }}
                        >
                            <ArrowRight className="mr-2 h-4 w-4" />
                            Continua
                        </Button>
                    ) : (
                        <Link to={`/counter/${hunt.id}`} className="flex-1">
                            <Button
                                className="w-full"
                                style={{ backgroundColor: accentColor }}
                            >
                                <ArrowRight className="mr-2 h-4 w-4" />
                                Continua
                            </Button>
                        </Link>
                    )}
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onEdit(hunt)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => onDelete(hunt.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card >
    );
}
