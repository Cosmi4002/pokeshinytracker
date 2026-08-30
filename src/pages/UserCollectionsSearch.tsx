import { useEffect, useMemo, useState, type ComponentType } from 'react';
import { ArrowRight, ArrowUpCircle, BarChart3, Calendar, Crown, Dice5, Gamepad2, Hash, Radio, Search, Sparkles, Target, TrendingUp, UserRound, Users } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { SHINY_CHARM_ICON, findHuntingMethod, getCaughtShinySpriteUrl, getDynamicOdds, isBreedingMethod, GAMES } from '@/lib/pokemon-data';
import { GAME_LOGOS } from '@/lib/game-themes';
import { useRandomColor } from '@/lib/random-color-context';
import { cn } from '@/lib/utils';
import { resolvePokemonEntity } from '@/lib/pokemon-entity-resolver-v2';
import { getGameSpecificShinySpriteUrl, isGameSpecificShinySpriteUrl } from '@/lib/game-sprites';

type ProfileRow = Pick<Tables<'profiles'>, 'user_id' | 'username'>;
type PublicCaughtRow = Pick<
  Tables<'caught_shinies'>,
  'id' | 'pokemon_id' | 'entity_key' | 'pokemon_name' | 'form' | 'gender' | 'caught_date' | 'created_at' | 'sprite_url' | 'game' | 'secondary_game' | 'is_fail' | 'is_unobtainable' | 'hunt_start_date' | 'method' | 'attempts' | 'has_shiny_charm' | 'is_evolved' | 'show_encounters'
>;
type PublicRecentRow = PublicCaughtRow & { user_id: string; username: string | null };

const numberFormatter = new Intl.NumberFormat('it-IT');

type StatTileProps = {
  label: string;
  value: string;
  note: string;
  icon: ComponentType<{ className?: string }>;
};

function StatTile({ label, value, note, icon: Icon }: StatTileProps) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-border/70 bg-muted/30 p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground">{label}</div>
          <div className="mt-1 truncate text-2xl font-black tabular-nums">{value}</div>
          <div className="mt-1 truncate text-xs text-muted-foreground">{note}</div>
        </div>
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-muted">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}

export default function UserCollectionsSearch() {
  const { accentColor } = useRandomColor();
  const [query, setQuery] = useState('');
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [profilesError, setProfilesError] = useState<string | null>(null);
  const [discoverableProfiles, setDiscoverableProfiles] = useState<ProfileRow[]>([]);
  const [discoverableProfilesLoading, setDiscoverableProfilesLoading] = useState(true);
  const [discoverableProfilesError, setDiscoverableProfilesError] = useState<string | null>(null);

  const [selectedProfile, setSelectedProfile] = useState<ProfileRow | null>(null);
  const [entries, setEntries] = useState<PublicCaughtRow[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [entriesError, setEntriesError] = useState<string | null>(null);
  const [pokemonQuery, setPokemonQuery] = useState('');
  const [gameFilter, setGameFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [collectionSort, setCollectionSort] = useState('newest');
  const [isRealtimeActive, setIsRealtimeActive] = useState(false);
  const [globalRecentEntries, setGlobalRecentEntries] = useState<PublicRecentRow[]>([]);
  const [globalRecentLoading, setGlobalRecentLoading] = useState(true);
  const [globalRecentError, setGlobalRecentError] = useState<string | null>(null);

  const formatDate = (value?: string | null) => {
    if (!value) return '--';
    const day = value.slice(0, 10);
    const parsed = new Date(`${day}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return '--';
    return parsed.toLocaleDateString('it-IT');
  };

  const normalizeMethod = (value?: string | null) => (value || '').toString().trim().toLowerCase();
  const isDistributionEvent = (method?: string | null) => {
    const raw = normalizeMethod(method);
    return raw === 'distribution/event' || raw === 'event';
  };

  const getEncounterLabel = (method?: string | null) => {
    const raw = normalizeMethod(method);
    const huntingMethod = findHuntingMethod(method);
    const methodName = huntingMethod?.name.toLowerCase() || '';
    if (raw.includes('pokeradar') || raw.includes('poke radar') || methodName.includes('poke radar')) return 'Chain';
    if (raw.includes('chain fishing') || methodName.includes('chain fishing')) return 'Chain';
    if (raw.includes('game corner') || raw.includes('game-corner') || methodName === 'game corner') return 'Seen';
    if (isBreedingMethod(raw)) return 'Hatched';
    return 'Encounters';
  };

  const shouldShowEncounters = (method?: string | null, game?: string | null, attempts?: number | null, showEncounters = true) => {
    if (attempts === null) return false;
    if (!showEncounters) return false;
    if (isDistributionEvent(method)) return false;
    const raw = normalizeMethod(method);
    const rawGame = normalizeMethod(game);
    return (
      !(raw === 'gen9-random' && (rawGame === 'scarlet' || rawGame === 'violet')) &&
      raw !== 'gen9-tera-raid' &&
      raw !== 'tera raid' &&
      raw !== 'gen9-outbreak' &&
      raw !== 'mass outbreak' &&
      raw !== 'gen9-sandwich-lv3' &&
      raw !== 'sandwich (sparkling power)' &&
      raw !== 'gen9-outbreak-sandwich' &&
      raw !== 'outbreak + sandwich lv3'
    );
  };

  const formatMethodLabel = (method?: string | null) => {
    if (isDistributionEvent(method)) return 'Distribution / Event';
    const raw = normalizeMethod(method);
    if (
      raw === 'safari zone' ||
      raw === 'random encounters (safari zone)' ||
      raw === 'random encounter (safari zone)'
    ) return 'Random Encounter (Safari Zone)';
    return method || '-';
  };

  const getGameLabel = (game?: string | null) =>
    GAMES.find((g) => g.id === game)?.name || game || 'Sconosciuto';

  const onlyNamedProfiles = (rows: ProfileRow[] | null) =>
    (rows || []).filter((profile) => Boolean(profile.username?.trim()));

  const loadDiscoverableProfiles = async (silent = false) => {
    if (!silent) {
      setDiscoverableProfilesLoading(true);
      setDiscoverableProfilesError(null);
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, username')
        .not('username', 'is', null)
        .order('username', { ascending: true })
        .limit(100);

      if (error) throw error;
      setDiscoverableProfiles(onlyNamedProfiles(data || []));
    } catch (err: any) {
      if (!silent) {
        setDiscoverableProfilesError(err?.message || 'Unable to load users.');
      }
    } finally {
      if (!silent) setDiscoverableProfilesLoading(false);
    }
  };

  useEffect(() => {
    const term = query.trim();
    if (!term) {
      setProfiles([]);
      setProfilesLoading(false);
      setProfilesError(null);
      return;
    }

    let active = true;
    const timer = window.setTimeout(async () => {
      setProfilesLoading(true);
      setProfilesError(null);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('user_id, username')
          .not('username', 'is', null)
          .ilike('username', `%${term}%`)
          .order('username', { ascending: true })
          .limit(30);

        if (!active) return;
        if (error) throw error;
        setProfiles(onlyNamedProfiles(data || []));
      } catch (err: any) {
        if (!active) return;
        setProfilesError(err?.message || 'Error while searching for a username');
      } finally {
        if (active) setProfilesLoading(false);
      }
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [query]);

  const loadCollection = async (profile: ProfileRow, silent = false) => {
    if (!silent) {
      setEntriesLoading(true);
      setEntriesError(null);
    }
    try {
      const { data, error } = await supabase
        .from('caught_shinies')
        .select('id, pokemon_id, entity_key, pokemon_name, form, gender, caught_date, created_at, sprite_url, game, secondary_game, is_fail, is_unobtainable, hunt_start_date, method, attempts, has_shiny_charm, is_evolved, show_encounters')
        .eq('user_id', profile.user_id)
        .order('caught_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      setEntries(data || []);
    } catch (err: any) {
      if (!silent) {
        setEntriesError(err?.message || 'Unable to load the collection.');
      }
    } finally {
      if (!silent) setEntriesLoading(false);
    }
  };

  const loadGlobalRecent = async (silent = false) => {
    if (!silent) {
      setGlobalRecentLoading(true);
      setGlobalRecentError(null);
    }

    try {
      const { data, error } = await supabase
        .from('caught_shinies')
        .select('id, user_id, pokemon_id, entity_key, pokemon_name, form, gender, caught_date, created_at, sprite_url, game, secondary_game, is_fail, is_unobtainable, hunt_start_date, method, attempts, has_shiny_charm, is_evolved, show_encounters')
        .or('is_fail.is.false,is_fail.is.null')
        .or('is_unobtainable.is.false,is_unobtainable.is.null')
        .order('created_at', { ascending: false })
        .order('caught_date', { ascending: false })
        .limit(10);

      if (error) throw error;

      const rows = data || [];
      const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
      let usernameByUserId = new Map<string, string | null>();

      if (userIds.length > 0) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('user_id, username')
          .in('user_id', userIds);
        if (profileError) throw profileError;
        usernameByUserId = new Map((profileData || []).map((p) => [p.user_id, p.username]));
      }

      const enriched: PublicRecentRow[] = rows.map((r) => ({
        ...r,
        username: usernameByUserId.get(r.user_id) ?? null,
      }));
      setGlobalRecentEntries(enriched);
    } catch (err: any) {
      if (!silent) {
        setGlobalRecentError(err?.message || 'Unable to load the user preview.');
      }
    } finally {
      if (!silent) setGlobalRecentLoading(false);
    }
  };

  useEffect(() => {
    void loadDiscoverableProfiles();
    void loadGlobalRecent();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('public-profiles-directory')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
        },
        () => {
          void loadDiscoverableProfiles(true);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!selectedProfile) return;
    setPokemonQuery('');
    setGameFilter('all');
    setMethodFilter('all');
    setStatusFilter('all');
    setCollectionSort('newest');
    void loadCollection(selectedProfile);
  }, [selectedProfile?.user_id]);

  useEffect(() => {
    const channel = supabase
      .channel('public-caught-global-recent')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'caught_shinies',
        },
        () => {
          void loadDiscoverableProfiles(true);
          void loadGlobalRecent(true);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!selectedProfile) {
      setIsRealtimeActive(false);
      return;
    }

    const channel = supabase
      .channel(`public-caught-${selectedProfile.user_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'caught_shinies',
          filter: `user_id=eq.${selectedProfile.user_id}`,
        },
        () => {
          void loadCollection(selectedProfile, true);
        }
      )
      .subscribe((status) => {
        setIsRealtimeActive(status === 'SUBSCRIBED');
      });

    return () => {
      setIsRealtimeActive(false);
      void supabase.removeChannel(channel);
    };
  }, [selectedProfile?.user_id]);

  const userStats = useMemo(() => {
    const obtained = entries.filter((entry) => !entry.is_fail && !entry.is_unobtainable);
    const species = new Set<number>();
    const forms = new Set<string>();
    const gameCounts = new Map<string, number>();
    const methodCounts = new Map<string, number>();
    let trackedAttempts = 0;
    let trackedRows = 0;
    let charmCount = 0;
    let longestHunt: PublicCaughtRow | null = null;
    let luckiestHunt: PublicCaughtRow | null = null;

    obtained.forEach((entry) => {
      const entity = resolvePokemonEntity({
        pokemonId: entry.pokemon_id,
        pokemonName: entry.pokemon_name,
        form: entry.form,
        entityKey: entry.entity_key,
      });
      species.add(entity?.speciesId || entry.pokemon_id);
      forms.add(`${entity?.key || entry.pokemon_id}:${entry.form || 'base'}:${entry.gender || ''}`);
      gameCounts.set(entry.game || 'unknown', (gameCounts.get(entry.game || 'unknown') || 0) + 1);
      methodCounts.set(entry.method || 'unknown', (methodCounts.get(entry.method || 'unknown') || 0) + 1);
      if (entry.has_shiny_charm) charmCount += 1;

      if (
        Number(entry.attempts || 0) > 0 &&
        shouldShowEncounters(entry.method, entry.game, entry.attempts, entry.show_encounters ?? true)
      ) {
        const attempts = Number(entry.attempts || 0);
        trackedAttempts += attempts;
        trackedRows += 1;
        if (!longestHunt || attempts > Number(longestHunt.attempts || 0)) longestHunt = entry;

        const odds = getDynamicOdds(entry.method, attempts, entry.has_shiny_charm === true);
        const luckScore = attempts / Math.max(odds, 1);
        const currentLuckScore = luckiestHunt
          ? Number(luckiestHunt.attempts || 0) / Math.max(getDynamicOdds(luckiestHunt.method, Number(luckiestHunt.attempts || 0), luckiestHunt.has_shiny_charm === true), 1)
          : Number.POSITIVE_INFINITY;
        if (!luckiestHunt || luckScore < currentLuckScore) luckiestHunt = entry;
      }
    });

    const topGame = Array.from(gameCounts.entries()).sort((a, b) => b[1] - a[1])[0];
    const topMethod = Array.from(methodCounts.entries()).sort((a, b) => b[1] - a[1])[0];

    return {
      obtainedCount: obtained.length,
      speciesCount: species.size,
      formsCount: forms.size,
      averageAttempts: trackedRows > 0 ? Math.round(trackedAttempts / trackedRows) : 0,
      trackedRows,
      charmPercent: obtained.length > 0 ? Math.round((charmCount / obtained.length) * 100) : 0,
      failCount: entries.filter((entry) => entry.is_fail).length,
      topGame: topGame ? { label: getGameLabel(topGame[0]), count: topGame[1] } : null,
      topMethod: topMethod ? { label: formatMethodLabel(topMethod[0]), count: topMethod[1] } : null,
      longestHunt,
      luckiestHunt,
    };
  }, [entries]);

  const collectionGameOptions = useMemo(() => {
    const ids = Array.from(new Set(entries.flatMap((entry) => [entry.game, entry.secondary_game]).filter(Boolean) as string[]));
    return ids.sort((a, b) => getGameLabel(a).localeCompare(getGameLabel(b)));
  }, [entries]);

  const collectionMethodOptions = useMemo(() => {
    const methods = Array.from(new Set(entries.map((entry) => entry.method).filter(Boolean) as string[]));
    return methods.sort((a, b) => formatMethodLabel(a).localeCompare(formatMethodLabel(b)));
  }, [entries]);

  const filteredCollectionEntries = useMemo(() => {
    const term = pokemonQuery.trim().toLowerCase();
    const matchesStatus = (entry: PublicCaughtRow) => {
      if (statusFilter === 'obtained') return !entry.is_fail && !entry.is_unobtainable;
      if (statusFilter === 'fail') return entry.is_fail === true;
      if (statusFilter === 'uncatchable') return entry.is_unobtainable === true;
      return true;
    };

    return entries
      .filter((entry) => {
        if (term) {
          const searchable = `${entry.pokemon_name || ''} ${entry.form || ''} ${entry.pokemon_id}`.toLowerCase();
          if (!searchable.includes(term)) return false;
        }
        if (gameFilter !== 'all' && entry.game !== gameFilter && entry.secondary_game !== gameFilter) return false;
        if (methodFilter !== 'all' && entry.method !== methodFilter) return false;
        return matchesStatus(entry);
      })
      .sort((a, b) => {
        if (collectionSort === 'oldest') {
          return (a.caught_date || a.created_at || '').localeCompare(b.caught_date || b.created_at || '');
        }
        if (collectionSort === 'name-asc') return (a.pokemon_name || '').localeCompare(b.pokemon_name || '');
        if (collectionSort === 'name-desc') return (b.pokemon_name || '').localeCompare(a.pokemon_name || '');
        return (b.caught_date || b.created_at || '').localeCompare(a.caught_date || a.created_at || '');
      });
  }, [entries, pokemonQuery, gameFilter, methodFilter, statusFilter, collectionSort]);

  const hasActiveCollectionFilters = Boolean(
    pokemonQuery.trim() || gameFilter !== 'all' || methodFilter !== 'all' || statusFilter !== 'all' || collectionSort !== 'newest'
  );

  const clearCollectionFilters = () => {
    setPokemonQuery('');
    setGameFilter('all');
    setMethodFilter('all');
    setStatusFilter('all');
    setCollectionSort('newest');
  };

  const renderGenderIcon = (gender: string | null) => {
    if (gender === 'male') return <span className="text-blue-500">{'\u2642'}</span>;
    if (gender === 'female') return <span className="text-pink-500">{'\u2640'}</span>;
    return null;
  };

  const renderEvolutionBadge = (isEvolved: boolean | null) => {
    if (!isEvolved) return null;
    return (
      <div
        className="absolute top-2 right-2 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-white/55 text-white shadow-[0_3px_12px_rgba(0,0,0,0.6),0_0_0_1px_rgba(0,0,0,0.45)] ring-1 ring-white/30 backdrop-blur-sm"
        style={{
          background: `linear-gradient(145deg, ${accentColor}, color-mix(in srgb, ${accentColor} 72%, #111))`,
          boxShadow: `0 3px 12px color-mix(in srgb, ${accentColor} 36%, rgba(0,0,0,0.55)), 0 0 0 1px rgba(0,0,0,0.45)`,
        }}
        title="Pokemon evoluto"
      >
        <ArrowUpCircle className="h-3.5 w-3.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]" />
      </div>
    );
  };

  const getSpriteStyle = (isFail: boolean | null, isUnobtainable: boolean | null) => {
    if (isFail) {
      return {
        filter: 'brightness(0) contrast(1.3)',
      } as const;
    }
    if (isUnobtainable) {
      return {
        filter: 'grayscale(1) brightness(1.05) contrast(0.95)',
      } as const;
    }
    return undefined;
  };

  const renderPublicShinyCard = (
    entry: PublicCaughtRow | PublicRecentRow,
    keyPrefix: string,
    options: { showUsername?: boolean; large?: boolean } = {}
  ) => {
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
      spriteUrl: entry.sprite_url,
      });
    const isGameSpecificSprite = isGameSpecificShinySpriteUrl(sprite);
    const isEvent = isDistributionEvent(entry.method);
    const showEntryEncounters = shouldShowEncounters(entry.method, entry.game, entry.attempts, entry.show_encounters ?? true);
    const username = 'username' in entry ? entry.username : null;
    const gameLogo = entry.game ? GAME_LOGOS[entry.game] : null;
    const secondaryGameLogo = entry.secondary_game ? GAME_LOGOS[entry.secondary_game] : null;

    return (
      <div
        key={`${keyPrefix}-${entry.id}`}
        className="group relative overflow-hidden rounded-[1.4rem] border border-border bg-card text-card-foreground shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_42%)] opacity-70" />
        {renderEvolutionBadge(entry.is_evolved)}

        <div className="relative p-3">
          <div className="relative flex min-h-[118px] items-center justify-center overflow-hidden rounded-[1.05rem] border border-border bg-muted/55">
            {!isGameSpecificSprite && <div className="absolute inset-x-6 bottom-4 h-6 rounded-full bg-black/20 blur-xl" />}
            <img
              src={sprite}
              alt={entry.pokemon_name}
              className={cn(
                'relative z-10 object-contain transition-transform duration-300',
                options.large ? 'h-28 w-28' : 'h-24 w-24',
                isGameSpecificSprite ? 'scale-[0.86] group-hover:scale-[0.9]' : 'group-hover:scale-105',
                entry.is_fail && !isGameSpecificSprite && 'drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]'
              )}
              style={isGameSpecificSprite && !entry.is_fail && !entry.is_unobtainable ? undefined : getSpriteStyle(entry.is_fail, entry.is_unobtainable)}
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.svg';
              }}
            />
          </div>

          <div className="mt-3 space-y-2">
            <div className="min-w-0 text-center">
              <div className="flex min-w-0 items-center justify-center gap-1.5">
                <h4 className="min-w-0 truncate text-base font-black leading-tight sm:text-lg">
                  {entry.pokemon_name}
                </h4>
                {renderGenderIcon(entry.gender)}
              </div>
              <div className="mt-1 flex flex-wrap items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                {entry.form && (
                  <span className="max-w-full truncate rounded-full bg-muted px-2 py-0.5">
                    {entry.form}
                  </span>
                )}
                {options.showUsername && (
                  <span className="max-w-full truncate rounded-full bg-muted px-2 py-0.5 normal-case tracking-normal">
                    @{username || 'user'}
                  </span>
                )}
              </div>
            </div>

            <div className="flex min-h-[42px] items-center justify-center">
              {gameLogo || secondaryGameLogo ? (
                <div className="flex min-w-0 items-center justify-center gap-2">
                  {gameLogo && (
                    <img
                      src={gameLogo}
                      alt={entry.game || 'Origin game'}
                      className="h-9 w-auto max-w-[82px] object-contain brightness-110 drop-shadow"
                      loading="lazy"
                    />
                  )}
                  {gameLogo && secondaryGameLogo && (
                    <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  )}
                  {secondaryGameLogo && (
                    <img
                      src={secondaryGameLogo}
                      alt={entry.secondary_game || 'Transfer game'}
                      className="h-9 w-auto max-w-[82px] object-contain brightness-110 drop-shadow"
                      loading="lazy"
                    />
                  )}
                </div>
              ) : (
                <span className="rounded-full border border-border bg-muted px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">
                  {[entry.game, entry.secondary_game].filter(Boolean).join(' → ') || 'Game not specified'}
                </span>
              )}
            </div>

            <div className="flex justify-center">
              <span className="inline-flex max-w-full items-center gap-1.5 truncate rounded-full border border-border bg-muted px-3 py-1 text-center text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">
                {isEvent && <Sparkles className="h-3 w-3 flex-shrink-0 text-fuchsia-400" />}
                <span className="truncate">{formatMethodLabel(entry.method)}</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {entry.is_fail && (
                <span className="rounded-full border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-red-500">
                  Fail
                </span>
              )}
              {entry.is_unobtainable && (
                <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-amber-500">
                  Uncatchable
                </span>
              )}
              {entry.has_shiny_charm && (
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                  <img src={SHINY_CHARM_ICON} alt="Cromamuleto" className="h-4 w-4 object-contain" />
                  Charm
                </span>
              )}
            </div>

            {!isEvent && (
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted/60 p-2">
                <div className="min-w-0 text-center">
                  <div className="flex items-center justify-center gap-1 text-[9px] font-black uppercase tracking-[0.12em] text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    Start
                  </div>
                  <div className="mt-0.5 truncate text-xs font-black tabular-nums">
                    {entry.hunt_start_date ? formatDate(entry.hunt_start_date) : '--'}
                  </div>
                </div>
                <div className="min-w-0 border-l border-border text-center">
                  <div className="text-[9px] font-black uppercase tracking-[0.12em] text-muted-foreground">
                    Caught
                  </div>
                  <div className="mt-0.5 truncate text-xs font-black tabular-nums">
                    {formatDate(entry.caught_date)}
                  </div>
                </div>
              </div>
            )}

            {showEntryEncounters && (
              <div className="flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2">
                <span className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">
                  {getEncounterLabel(entry.method)}
                </span>
                <span className="text-lg font-black tabular-nums">
                  {entry.attempts ? entry.attempts.toLocaleString() : '-'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const searchTerm = query.trim();
  const profileSuggestions = searchTerm ? profiles : discoverableProfiles;
  const profileSuggestionsLoading = searchTerm ? profilesLoading : discoverableProfilesLoading;
  const profileSuggestionsError = searchTerm ? profilesError : discoverableProfilesError;
  const profileSuggestionsTitle = searchTerm ? 'Username results' : 'Available users';

  const renderRecordHuntCard = (label: string, entry: PublicCaughtRow | null) => {
    if (!entry) {
      return (
        <div className="rounded-lg border bg-background/60 p-3 shadow-sm">
          <div className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
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
      spriteUrl: entry.sprite_url,
      });
    const isEvolved = entry.is_evolved === true;

    return (
      <div className="relative overflow-hidden rounded-lg border bg-background/60 shadow-sm">
        {isEvolved && (
          <div
            className="absolute left-2 top-2 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-white/55 bg-emerald-700 text-white shadow-[0_3px_12px_rgba(0,0,0,0.6),0_0_0_1px_rgba(0,0,0,0.45)] ring-1 ring-emerald-200/45 backdrop-blur-sm"
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
              className="h-20 w-20 object-contain drop-shadow"
              loading="lazy"
              onError={(event) => {
                event.currentTarget.src = '/placeholder.svg';
              }}
            />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
            <div className="mt-1 truncate text-lg font-black leading-tight">{entry.pokemon_name}</div>
            <div className="mt-3 grid gap-x-4 gap-y-2 text-xs sm:grid-cols-2">
              <div className="min-w-0">
                <div className="font-black uppercase tracking-[0.12em] text-muted-foreground">Game</div>
                <div className="mt-0.5 truncate font-semibold">{getGameLabel(entry.game)}</div>
              </div>
              <div className="min-w-0">
                <div className="font-black uppercase tracking-[0.12em] text-muted-foreground">Method</div>
                <div className="mt-0.5 truncate font-semibold">{formatMethodLabel(entry.method)}</div>
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
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto py-8 px-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Search Usernames
            </CardTitle>
            <CardDescription>
              Explore public user collections in real time.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter a username..."
                className="pl-10"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold">{profileSuggestionsTitle}</h3>
                {!profileSuggestionsLoading && profileSuggestions.length > 0 && (
                  <span className="text-xs font-semibold text-muted-foreground">
                    {profileSuggestions.length}
                  </span>
                )}
              </div>
              {profileSuggestionsLoading && (
                <p className="text-sm text-muted-foreground">
                  {searchTerm ? 'Searching...' : 'Loading users...'}
                </p>
              )}
              {profileSuggestionsError && <p className="text-sm text-destructive">{profileSuggestionsError}</p>}
              {!profileSuggestionsLoading && !profileSuggestionsError && profileSuggestions.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  {searchTerm ? 'No username found.' : 'No public users available.'}
                </p>
              )}
              {profileSuggestions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {profileSuggestions.map((profile) => (
                    <Button
                      key={profile.user_id}
                      variant={selectedProfile?.user_id === profile.user_id ? 'default' : 'outline'}
                      onClick={() => setSelectedProfile(profile)}
                    >
                      <UserRound className="h-4 w-4 mr-2" />@{profile.username}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {!selectedProfile && (
            <div className="space-y-2 pt-2 border-t">
              <h3 className="font-semibold">Latest 10 Pokémon obtained</h3>
              {globalRecentLoading && <p className="text-sm text-muted-foreground">Loading global preview...</p>}
              {globalRecentError && <p className="text-sm text-destructive">{globalRecentError}</p>}
              {!globalRecentLoading && !globalRecentError && globalRecentEntries.length === 0 && (
                <p className="text-sm text-muted-foreground">No obtained Pokémon have been added yet.</p>
              )}
              {!globalRecentLoading && globalRecentEntries.length > 0 && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {globalRecentEntries.map((entry) => renderPublicShinyCard(entry, 'global', { showUsername: true }))}
                </div>
              )}
            </div>
            )}
          </CardContent>
        </Card>

        {selectedProfile && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                @{selectedProfile.username}'s Collection
                <span className="text-sm font-normal text-muted-foreground">({entries.length} catches)</span>
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Radio className={`h-4 w-4 ${isRealtimeActive ? 'text-green-500' : 'text-muted-foreground'}`} />
                {isRealtimeActive ? 'Real-time updates active' : 'Real-time updates disconnected'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {entriesLoading && <p className="text-sm text-muted-foreground">Loading collection...</p>}
              {entriesError && <p className="text-sm text-destructive">{entriesError}</p>}

              {!entriesLoading && !entriesError && entries.length === 0 && (
                <p className="text-sm text-muted-foreground">No catches found for this username.</p>
              )}

              {!entriesLoading && entries.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold">User statistics</h3>
                  </div>

                  <Card className="overflow-hidden border-border/70">
                    <CardContent className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-muted-foreground">Collection overview</div>
                        <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
                          <div className="text-5xl font-black tabular-nums tracking-tight">
                            {numberFormatter.format(userStats.obtainedCount)}
                          </div>
                          <div className="pb-1 text-sm text-muted-foreground">
                            main shinies, {numberFormatter.format(userStats.speciesCount)} unique species
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm sm:min-w-64">
                        <div className="rounded-md border bg-muted/30 p-3">
                          <div className="font-mono text-lg font-bold">{numberFormatter.format(userStats.formsCount)}</div>
                          <div className="text-xs text-muted-foreground">forms</div>
                        </div>
                        <div className="rounded-md border bg-muted/30 p-3">
                          <div className="font-mono text-lg font-bold">{numberFormatter.format(userStats.failCount)}</div>
                          <div className="text-xs text-muted-foreground">fail</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <StatTile label="Average" value={userStats.averageAttempts ? numberFormatter.format(userStats.averageAttempts) : '-'} note={`${numberFormatter.format(userStats.trackedRows)} with encounters`} icon={TrendingUp} />
                    <StatTile label="Charm" value={`${userStats.charmPercent}%`} note="Catches with the Shiny Charm" icon={Crown} />
                    <StatTile label="Top game" value={userStats.topGame?.label || '-'} note={userStats.topGame ? `${userStats.topGame.count} catches` : 'No data'} icon={Gamepad2} />
                    <StatTile label="Top method" value={userStats.topMethod?.label || '-'} note={userStats.topMethod ? `${userStats.topMethod.count} catches` : 'No data'} icon={Target} />
                  </div>

                  <Card className="border-border/70 bg-muted/30 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-base">Record</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 lg:grid-cols-2">
                      {renderRecordHuntCard('Longest hunt', userStats.longestHunt)}
                      {renderRecordHuntCard('Luckiest hunt', userStats.luckiestHunt)}
                    </CardContent>
                  </Card>
                </div>
              )}

              {!entriesLoading && entries.length > 0 && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold">Collection entries</h3>
                    <span className="text-xs font-semibold text-muted-foreground">
                      {filteredCollectionEntries.length} of {entries.length}
                    </span>
                  </div>

                  <div className="grid gap-3 rounded-lg border border-border/70 bg-muted/20 p-4 sm:grid-cols-2 xl:grid-cols-5">
                    <div className="relative sm:col-span-2 xl:col-span-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={pokemonQuery}
                        onChange={(event) => setPokemonQuery(event.target.value)}
                        placeholder="Search Pokémon or form..."
                        className="pl-10"
                      />
                    </div>

                    <Select value={gameFilter} onValueChange={setGameFilter}>
                      <SelectTrigger><SelectValue placeholder="Game" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All games</SelectItem>
                        {collectionGameOptions.map((game) => (
                          <SelectItem key={game} value={game}>{getGameLabel(game)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={methodFilter} onValueChange={setMethodFilter}>
                      <SelectTrigger><SelectValue placeholder="Method" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All methods</SelectItem>
                        {collectionMethodOptions.map((method) => (
                          <SelectItem key={method} value={method}>{formatMethodLabel(method)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="obtained">Obtained</SelectItem>
                        <SelectItem value="fail">Fail</SelectItem>
                        <SelectItem value="uncatchable">Uncatchable</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={collectionSort} onValueChange={setCollectionSort}>
                      <SelectTrigger><SelectValue placeholder="Sort" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest first</SelectItem>
                        <SelectItem value="oldest">Oldest first</SelectItem>
                        <SelectItem value="name-asc">Name A–Z</SelectItem>
                        <SelectItem value="name-desc">Name Z–A</SelectItem>
                      </SelectContent>
                    </Select>

                    {hasActiveCollectionFilters && (
                      <div className="sm:col-span-2 xl:col-span-5">
                        <Button type="button" variant="ghost" size="sm" onClick={clearCollectionFilters}>
                          Clear filters
                        </Button>
                      </div>
                    )}
                  </div>

                  {filteredCollectionEntries.length === 0 && (
                    <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                      No Pokémon match these filters.
                    </div>
                  )}
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredCollectionEntries.map((entry) => renderPublicShinyCard(entry, 'collection', { large: true }))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
