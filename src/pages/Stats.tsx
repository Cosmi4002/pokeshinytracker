import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpCircle,
  BarChart3,
  LogIn,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/lib/auth-context';
import { useRandomColor } from '@/lib/random-color-context';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getGameSpecificShinySpriteUrl, isGameSpecificShinySpriteUrl } from '@/lib/game-sprites';
import { usePokemonList } from '@/hooks/use-pokemon';
import { findHuntingMethod, GAMES, getCaughtShinySpriteUrl, getDynamicOdds } from '@/lib/pokemon-data';
import type { Tables } from '@/integrations/supabase/types';
import { resolvePokemonEntity } from '@/lib/pokemon-entity-resolver-v2';
import { cn } from '@/lib/utils';

type CaughtShinyRow = Tables<'caught_shinies'>;

type RankedItem = {
  id: string;
  label: string;
  value: number;
};

const numberFormatter = new Intl.NumberFormat('it-IT');
const dateFormatter = new Intl.DateTimeFormat('it-IT', { month: 'short', year: 'numeric' });

const normalize = (value: string | number | null | undefined) =>
  String(value ?? '')
    .toLowerCase()
    .trim()
    .replace(/[()]/g, '')
    .replace(/\s+/g, '-')
    .replace(/_+/g, '-');

const getGameLabel = (gameId?: string | null) =>
  GAMES.find((game) => game.id === gameId || normalize(game.name) === normalize(gameId))?.name ||
  gameId ||
  'Sconosciuto';

const getMethodLabel = (method?: string | null) =>
  findHuntingMethod(method)?.name || method || 'Unknown method';

const getCaughtDate = (entry: CaughtShinyRow) => {
  const rawDate = entry.caught_date || entry.created_at;
  const date = new Date(rawDate);
  return Number.isNaN(date.getTime()) ? null : date;
};

const addCount = (map: Map<string, RankedItem>, id: string, label: string, amount = 1) => {
  const current = map.get(id);
  map.set(id, { id, label, value: (current?.value || 0) + amount });
};

const mapToRanked = (map: Map<string, RankedItem>, limit?: number) => {
  const ranked = Array.from(map.values()).sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
  return typeof limit === 'number' ? ranked.slice(0, limit) : ranked;
};

const percentage = (value: number, total: number) => (total > 0 ? Math.round((value / total) * 1000) / 10 : 0);

const statsPanelClass = 'border-border/70 bg-card text-card-foreground';
const statsInnerPanelClass = 'border bg-muted/30';

const hasTrackedAttempts = (entry: CaughtShinyRow) => {
  const attempts = Number(entry.attempts || 0);
  if (entry.attempts === null || attempts <= 0) return false;
  if (entry.show_encounters === false) return false;

  const rawMethod = normalize(entry.method);
  const rawGame = normalize(entry.game);
  const rawForm = normalize(entry.form);
  const compactMethod = rawMethod.replace(/[/-]/g, '');

  if (rawMethod === 'distribution/event' || rawMethod === 'event') return false;
  if (rawMethod === 'unknown' || rawGame === 'unknown') {
    return rawForm === 'dudunsparce-three-segment' || rawForm === 'maushold-family-of-three';
  }

  return (
    !(rawMethod === 'gen9-random' && (rawGame === 'scarlet' || rawGame === 'violet')) &&
    rawMethod !== 'gen9-tera-raid' &&
    rawMethod !== 'tera-raid' &&
    rawMethod !== 'gen9-outbreak' &&
    rawMethod !== 'mass-outbreak' &&
    rawMethod !== 'gen9-sandwich-lv3' &&
    rawMethod !== 'sandwich-sparkling-power' &&
    rawMethod !== 'gen9-outbreak-sandwich' &&
    rawMethod !== 'outbreak-sandwich-lv3' &&
    rawMethod !== 'static-overworld-game-gift' &&
    rawMethod !== 'static/overworld/game-gift' &&
    compactMethod !== 'staticoverworldgamegift'
  );
};

const getLuckScore = (entry: CaughtShinyRow) => {
  const attempts = Number(entry.attempts || 0);
  if (!hasTrackedAttempts(entry)) return Number.POSITIVE_INFINITY;
  const odds = getDynamicOdds(entry.method, attempts, entry.has_shiny_charm === true);
  return attempts / Math.max(odds, 1);
};

function StatCard({
  title,
  value,
  note,
  accentColor,
}: {
  title: string;
  value: string;
  note: string;
  accentColor: string;
}) {
  return (
    <Card className={`overflow-hidden border ${statsPanelClass}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tabular-nums" style={{ color: accentColor }}>{value}</div>
        <p className="mt-1 text-xs text-muted-foreground">{note}</p>
      </CardContent>
    </Card>
  );
}

function RecordHunt({
  label,
  entry,
  accentColor,
}: {
  label: string;
  entry: CaughtShinyRow | null;
  accentColor: string;
}) {
  if (!entry) {
    return (
      <div className="rounded-lg border bg-background/60 p-3 shadow-sm">
        <div className="text-xs font-medium uppercase text-muted-foreground">{label}</div>
        <div className="mt-1 font-semibold">-</div>
      </div>
    );
  }

  const attempts = Number(entry.attempts || 0);
  const odds = Math.round(getDynamicOdds(entry.method, attempts, entry.has_shiny_charm === true));
  const spriteGame = entry.secondary_game || entry.game;
  const sprite =
    getGameSpecificShinySpriteUrl(entry.pokemon_id, spriteGame, {
      name: entry.form || entry.pokemon_name,
      form: entry.form,
      gender: entry.gender,
    }) ||
    getCaughtShinySpriteUrl({
      pokemonId: entry.pokemon_id,
      pokemonName: entry.pokemon_name,
      form: entry.form,
      gender: entry.gender,
      game: entry.game,
      secondaryGame: entry.secondary_game,
      spriteUrl: entry.sprite_url,
    });
  const isGameSpecificSprite = isGameSpecificShinySpriteUrl(sprite);
  const isEvolved = entry.is_evolved || entry.evolved_from_id || entry.evolved_from_name;

  return (
    <div className="relative overflow-hidden rounded-lg border bg-background/60 shadow-sm">
      {isEvolved && (
        <div
          className="absolute left-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-white/45 text-white shadow-[0_3px_12px_rgba(0,0,0,0.45)] ring-1 backdrop-blur-md"
          style={{
            background: `linear-gradient(145deg, ${accentColor}, color-mix(in srgb, ${accentColor} 72%, #111))`,
            boxShadow: `0 3px 12px color-mix(in srgb, ${accentColor} 36%, rgba(0,0,0,0.55))`,
          }}
          title="Pokemon evoluto"
        >
          <ArrowUpCircle className="h-3.5 w-3.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]" />
        </div>
      )}
      <div className="grid gap-3 p-3 sm:grid-cols-[86px_minmax(0,1fr)]">
        <div className="flex min-h-[86px] items-center justify-center rounded-md bg-muted/60">
          <img
            src={sprite}
            alt={entry.pokemon_name}
            className={cn(
              "h-20 w-20 object-contain",
              isGameSpecificSprite ? "scale-[0.86]" : "drop-shadow"
            )}
            loading="lazy"
            onError={(event) => {
              event.currentTarget.src = '/placeholder.svg';
            }}
          />
        </div>
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
          </div>
          <div className="mt-1 truncate text-lg font-black leading-tight">{entry.pokemon_name}</div>
          <div className="mt-3 grid gap-x-4 gap-y-2 text-xs sm:grid-cols-2">
            <div className="min-w-0">
              <div className="font-black uppercase tracking-[0.12em] text-muted-foreground">Game</div>
              <div className="mt-0.5 truncate font-semibold">{getGameLabel(entry.game)}</div>
            </div>
            <div className="min-w-0">
              <div className="font-black uppercase tracking-[0.12em] text-muted-foreground">Method</div>
              <div className="mt-0.5 truncate font-semibold">{getMethodLabel(entry.method)}</div>
            </div>
            <div className="min-w-0">
              <div className="font-black uppercase tracking-[0.12em] text-muted-foreground">Encounters</div>
              <div className="mt-0.5 font-semibold tabular-nums">{numberFormatter.format(attempts)}</div>
            </div>
            <div className="min-w-0">
              <div className="font-black uppercase tracking-[0.12em] text-muted-foreground">Odds</div>
              <div className="mt-0.5 font-semibold tabular-nums">1/{numberFormatter.format(odds)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RankedList({
  title,
  items,
  total,
  empty,
  accentColor,
}: {
  title: string;
  items: RankedItem[];
  total: number;
  empty: string;
  accentColor: string;
}) {
  return (
    <Card className={`overflow-hidden border ${statsPanelClass}`}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{empty}</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate font-medium">{item.label}</span>
                <span className="font-mono text-muted-foreground">{numberFormatter.format(item.value)}</span>
              </div>
              <Progress value={percentage(item.value, total)} className="h-2" />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export default function Stats() {
  const { user, loading: authLoading } = useAuth();
  const { pokemon } = usePokemonList();
  const { accentColor } = useRandomColor();
  const { toast } = useToast();
  const [entries, setEntries] = useState<CaughtShinyRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) {
        setEntries([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from('caught_shinies')
        .select('*')
        .eq('user_id', user.id)
        .order('caught_date', { ascending: false });

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message || 'Unable to load statistics',
        });
        setEntries([]);
      } else {
        setEntries((data || []) as CaughtShinyRow[]);
      }

      setLoading(false);
    };

    fetchStats();
  }, [toast, user]);

  const pokemonById = useMemo(() => {
    const map = new Map<number, (typeof pokemon)[number]>();
    pokemon.forEach((item) => {
      const current = map.get(item.id);
      if (!current || item.name === current.name) map.set(item.id, item);
    });
    return map;
  }, [pokemon]);

  const stats = useMemo(() => {
    const obtained = entries.filter((entry) => !entry.is_fail && !entry.is_unobtainable);
    const fail = entries.filter((entry) => entry.is_fail);
    const obtainedSpecies = new Set<number>();
    const obtainedForms = new Set<string>();
    const evolved = new Set<string>();
    const methodCounts = new Map<string, RankedItem>();
    const gameCounts = new Map<string, RankedItem>();
    const generationCounts = new Map<string, RankedItem>();
    const monthlyCounts = new Map<string, RankedItem>();
    let totalAttempts = 0;
    let attemptsRows = 0;
    let shinyCharmCount = 0;
    let longestHunt: CaughtShinyRow | null = null;
    let luckiestHunt: CaughtShinyRow | null = null;

    obtained.forEach((entry) => {
      const entity = resolvePokemonEntity({
        pokemonId: entry.pokemon_id,
        pokemonName: entry.pokemon_name,
        form: entry.form,
        entityKey: entry.entity_key,
      });
      const pokemonInfo = pokemonById.get(entry.pokemon_id);
      const baseId = entity?.speciesId || pokemonInfo?.baseId || entry.pokemon_id;
      const formKey = `${baseId}:${entity?.key || normalize(entry.form || entry.pokemon_name) || 'base'}:${normalize(entry.gender)}`;
      obtainedSpecies.add(baseId);
      obtainedForms.add(formKey);

      if (entry.is_evolved || entry.evolved_from_id || entry.evolved_from_name) {
        evolved.add(entry.id);
      }

      addCount(methodCounts, normalize(entry.method) || 'unknown', getMethodLabel(entry.method));
      addCount(gameCounts, normalize(entry.game) || 'unknown', getGameLabel(entry.game));

      const generation = pokemonInfo?.generation;
      addCount(
        generationCounts,
        generation ? `gen-${generation}` : 'unknown',
        generation ? `Gen ${generation}` : 'Gen sconosciuta',
      );

      const caughtDate = getCaughtDate(entry);
      if (caughtDate) {
        const monthId = `${caughtDate.getFullYear()}-${String(caughtDate.getMonth() + 1).padStart(2, '0')}`;
        addCount(monthlyCounts, monthId, dateFormatter.format(caughtDate));
      }

      const attempts = Number(entry.attempts || 0);
      if (hasTrackedAttempts(entry)) {
        totalAttempts += attempts;
        attemptsRows += 1;
        if (!longestHunt || attempts > Number(longestHunt.attempts || 0)) longestHunt = entry;
        if (!luckiestHunt || getLuckScore(entry) < getLuckScore(luckiestHunt)) luckiestHunt = entry;
      }

      if (entry.has_shiny_charm) shinyCharmCount += 1;
    });

    const monthly = Array.from(monthlyCounts.values())
      .sort((a, b) => a.id.localeCompare(b.id))
      .slice(-8);
    const bestMonth = mapToRanked(monthlyCounts, 1)[0];

    return {
      obtained,
      fail,
      uniqueSpecies: obtainedSpecies.size,
      uniqueForms: obtainedForms.size,
      evolvedCount: evolved.size,
      totalAttempts,
      averageAttempts: attemptsRows > 0 ? Math.round(totalAttempts / attemptsRows) : 0,
      shinyCharmCount,
      methodTop: mapToRanked(methodCounts, 6),
      gameTop: mapToRanked(gameCounts, 6),
      generationTop: mapToRanked(generationCounts),
      monthly,
      bestMonth,
      longestHunt,
      luckiestHunt,
    };
  }, [entries, pokemonById]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <Card key={index} className="h-28 animate-pulse bg-muted/40" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto flex min-h-[70vh] items-center justify-center px-4 py-8">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Sign in to view detailed statistics for your collection.</p>
              <Link to="/auth">
                <Button className="w-full" style={{ backgroundColor: accentColor }}>
                  <LogIn className="mr-2 h-4 w-4" />Sign In</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const obtainedTotal = stats.obtained.length;
  const monthlyMax = Math.max(...stats.monthly.map((item) => item.value), 1);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto space-y-6 px-4 py-6 sm:py-8">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6" style={{ color: accentColor }} />
            <h1 className="text-2xl font-bold sm:text-3xl">Statistics</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Calculated from your saved collection.
          </p>
        </div>

        <Card className="overflow-hidden border-border/70">
          <CardContent className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Collection overview</div>
              <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
                <div className="text-5xl font-black tabular-nums tracking-tight" style={{ color: accentColor }}>
                  {numberFormatter.format(obtainedTotal)}
                </div>
                <div className="pb-1 text-sm text-muted-foreground">
                  main shinies, {numberFormatter.format(stats.uniqueSpecies)} unique species
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm sm:min-w-64">
              <div className={`rounded-md p-3 ${statsInnerPanelClass}`}>
                <div className="font-mono text-lg font-bold">{numberFormatter.format(stats.uniqueForms)}</div>
                <div className="text-xs text-muted-foreground">forms</div>
              </div>
              <div className={`rounded-md p-3 ${statsInnerPanelClass}`}>
                <div className="font-mono text-lg font-bold">{numberFormatter.format(stats.fail.length)}</div>
                <div className="text-xs text-muted-foreground">fail</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard title="Average encounters" value={stats.averageAttempts ? numberFormatter.format(stats.averageAttempts) : '-'} note={`${numberFormatter.format(stats.totalAttempts)} counter encounters`} accentColor={accentColor} />
          <StatCard title="With Shiny Charm" value={`${percentage(stats.shinyCharmCount, obtainedTotal)}%`} note={`${numberFormatter.format(stats.shinyCharmCount)} shiny Pokémon marked with the Charm`} accentColor={accentColor} />
          <StatCard title="Evolved" value={numberFormatter.format(stats.evolvedCount)} note="Pokémon with a recorded evolution" accentColor={accentColor} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <RankedList title="Most-used methods" items={stats.methodTop} total={obtainedTotal} empty="No methods recorded." accentColor={accentColor} />
          <RankedList title="Most-used games" items={stats.gameTop} total={obtainedTotal} empty="No games recorded." accentColor={accentColor} />
          <RankedList title="Distribution by generation" items={stats.generationTop} total={obtainedTotal} empty="No generation data available." accentColor={accentColor} />
          <Card className={`self-start border ${statsPanelClass}`}>
            <CardHeader>
              <CardTitle className="text-base">Record</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <RecordHunt label="Luckiest hunt" entry={stats.luckiestHunt} accentColor={accentColor} />
              <RecordHunt label="Longest hunt" entry={stats.longestHunt} accentColor={accentColor} />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4">
          <Card className={`order-2 border ${statsPanelClass}`}>
            <CardHeader>
              <CardTitle className="text-base">Trend over recent months</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.monthly.length === 0 ? (
                <p className="text-sm text-muted-foreground">No valid dates recorded.</p>
              ) : (
                <div className="flex h-56 items-end gap-2">
                  {stats.monthly.map((item) => (
                    <div key={item.id} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                      <div
                        className="w-full rounded-t-md"
                        style={{
                          height: `${Math.max(8, (item.value / monthlyMax) * 190)}px`,
                          backgroundColor: accentColor,
                        }}
                      />
                      <div className="max-w-full truncate text-[11px] text-muted-foreground">{item.label}</div>
                      <div className="font-mono text-xs">{item.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
}
