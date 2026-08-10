import { useEffect, useMemo, useState } from 'react';
import type { ComponentType } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  CalendarDays,
  Crown,
  Dice5,
  Gamepad2,
  Hash,
  LogIn,
  Medal,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/lib/auth-context';
import { useRandomColor } from '@/lib/random-color-context';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getPokemonSpriteUrl, usePokemonList } from '@/hooks/use-pokemon';
import { findHuntingMethod, GAMES, getDynamicOdds } from '@/lib/pokemon-data';
import type { Tables } from '@/integrations/supabase/types';

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
  findHuntingMethod(method)?.name || method || 'Metodo sconosciuto';

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
  icon: Icon,
  accentColor,
}: {
  title: string;
  value: string;
  note: string;
  icon: ComponentType<{ className?: string }>;
  accentColor: string;
}) {
  return (
    <Card className="group relative overflow-hidden border-border/70 bg-muted/30 shadow-sm transition-shadow hover:shadow-lg">
      <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: accentColor }} />
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-10 blur-2xl transition-opacity group-hover:opacity-20"
        style={{ backgroundColor: accentColor }}
      />
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-md"
          style={{ backgroundColor: `color-mix(in srgb, ${accentColor}, transparent 88%)` }}
        >
          <Icon className="h-4 w-4" style={{ color: accentColor }} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tabular-nums text-foreground">{value}</div>
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
      <div className="rounded-md border bg-muted/20 p-3">
        <div className="text-xs font-medium uppercase text-muted-foreground">{label}</div>
        <div className="mt-1 font-semibold">-</div>
      </div>
    );
  }

  const attempts = Number(entry.attempts || 0);
  const odds = Math.round(getDynamicOdds(entry.method, attempts, entry.has_shiny_charm === true));
  const sprite = entry.sprite_url || getPokemonSpriteUrl(entry.pokemon_id, {
    shiny: true,
    name: entry.form || entry.pokemon_name,
    female: entry.gender === 'female',
  });

  return (
    <div className="overflow-hidden rounded-lg border bg-background/60 shadow-sm">
      <div className="grid gap-3 p-3 sm:grid-cols-[86px_minmax(0,1fr)]">
        <div className="flex min-h-[86px] items-center justify-center rounded-md bg-muted/60">
          <img
            src={sprite}
            alt={entry.pokemon_name}
            className="h-20 w-20 object-contain drop-shadow"
            loading="lazy"
            onError={(event) => {
              event.currentTarget.src = '/placeholder.svg';
            }}
          />
        </div>
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
            {entry.has_shiny_charm && <Sparkles className="h-4 w-4 shrink-0" style={{ color: accentColor }} />}
          </div>
          <div className="mt-1 truncate text-lg font-black leading-tight">{entry.pokemon_name}</div>
          <div className="mt-3 grid gap-x-4 gap-y-2 text-xs sm:grid-cols-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 font-black uppercase tracking-[0.12em] text-muted-foreground">
                <Gamepad2 className="h-3.5 w-3.5" />
                Gioco
              </div>
              <div className="mt-0.5 truncate font-semibold">{getGameLabel(entry.game)}</div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 font-black uppercase tracking-[0.12em] text-muted-foreground">
                <Target className="h-3.5 w-3.5" />
                Metodo
              </div>
              <div className="mt-0.5 truncate font-semibold">{getMethodLabel(entry.method)}</div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 font-black uppercase tracking-[0.12em] text-muted-foreground">
                <Hash className="h-3.5 w-3.5" />
                Encounters
              </div>
              <div className="mt-0.5 font-semibold tabular-nums">{numberFormatter.format(attempts)}</div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 font-black uppercase tracking-[0.12em] text-muted-foreground">
                <Dice5 className="h-3.5 w-3.5" />
                Odds
              </div>
              <div className="mt-0.5 font-semibold tabular-nums">1/{numberFormatter.format(odds)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MonthRecord({ item }: { item?: RankedItem }) {
  return (
    <div className="rounded-lg border bg-background/60 p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">Mese migliore</div>
          <div className="mt-1 text-base font-black">{item?.label || '-'}</div>
        </div>
        <div className="flex items-center gap-2 text-right">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="text-lg font-black tabular-nums">{item ? numberFormatter.format(item.value) : '-'}</div>
            <div className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">shiny</div>
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
    <Card className="overflow-hidden border-border/70">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accentColor }} />
          {title}
        </CardTitle>
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
          title: 'Errore',
          description: error.message || 'Impossibile caricare le statistiche',
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
      const pokemonInfo = pokemonById.get(entry.pokemon_id);
      const baseId = pokemonInfo?.baseId || entry.pokemon_id;
      const formKey = `${baseId}:${normalize(entry.form || entry.pokemon_name) || 'base'}:${normalize(entry.gender)}`;
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
              <CardTitle>Statistiche</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Accedi per vedere le statistiche precise della tua collezione.</p>
              <Link to="/auth">
                <Button className="w-full" style={{ backgroundColor: accentColor }}>
                  <LogIn className="mr-2 h-4 w-4" />
                  Accedi
                </Button>
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
            <h1 className="text-2xl font-bold sm:text-3xl">Statistiche</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Calcolate dalla tua collezione salvata.
          </p>
        </div>

        <Card className="overflow-hidden border-border/70 bg-muted/30 shadow-sm">
          <CardContent className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Panoramica collezione</div>
              <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
                <div className="text-5xl font-black tabular-nums tracking-tight" style={{ color: accentColor }}>
                  {numberFormatter.format(obtainedTotal)}
                </div>
                <div className="pb-1 text-sm text-muted-foreground">
                  shiny principali, {numberFormatter.format(stats.uniqueSpecies)} specie uniche
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm sm:min-w-64">
              <div className="rounded-md border bg-muted/30 p-3">
                <div className="font-mono text-lg font-bold">{numberFormatter.format(stats.uniqueForms)}</div>
                <div className="text-xs text-muted-foreground">forme</div>
              </div>
              <div className="rounded-md border bg-muted/30 p-3">
                <div className="font-mono text-lg font-bold">{numberFormatter.format(stats.fail.length)}</div>
                <div className="text-xs text-muted-foreground">fail</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard title="Media encounters" value={stats.averageAttempts ? numberFormatter.format(stats.averageAttempts) : '-'} note={`${numberFormatter.format(stats.totalAttempts)} encounters con counter`} icon={TrendingUp} accentColor={accentColor} />
          <StatCard title="Con cromamuleto" value={`${percentage(stats.shinyCharmCount, obtainedTotal)}%`} note={`${numberFormatter.format(stats.shinyCharmCount)} shiny segnati con charm`} icon={Crown} accentColor={accentColor} />
          <StatCard title="Evoluti" value={numberFormatter.format(stats.evolvedCount)} note="Pokemon con evoluzione registrata" icon={Medal} accentColor={accentColor} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <RankedList title="Metodi più usati" items={stats.methodTop} total={obtainedTotal} empty="Nessun metodo registrato." accentColor={accentColor} />
          <RankedList title="Giochi più usati" items={stats.gameTop} total={obtainedTotal} empty="Nessun gioco registrato." accentColor={accentColor} />
          <RankedList title="Distribuzione per generazione" items={stats.generationTop} total={obtainedTotal} empty="Nessuna generazione calcolabile." accentColor={accentColor} />
          <Card className="border-border/70 bg-muted/30 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Record</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <MonthRecord item={stats.bestMonth} />
              <RecordHunt label="Caccia più lunga" entry={stats.longestHunt} accentColor={accentColor} />
              <RecordHunt label="Caccia più fortunata" entry={stats.luckiestHunt} accentColor={accentColor} />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4">
          <Card className="order-2 border-border/70 bg-muted/30 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Andamento ultimi mesi</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.monthly.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nessuna data valida registrata.</p>
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
