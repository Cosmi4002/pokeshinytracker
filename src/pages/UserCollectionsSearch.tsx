import { useEffect, useMemo, useState } from 'react';
import { Calendar, Radio, Search, Sparkles, UserRound, Users, ArrowUpCircle } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { getPokemonSpriteUrl } from '@/hooks/use-pokemon';
import { SHINY_CHARM_ICON, isBreedingMethod } from '@/lib/pokemon-data';
import { GAME_LOGOS } from '@/lib/game-themes';
import { toLocalISODate } from '@/lib/date';
import { cn } from '@/lib/utils';

type ProfileRow = Pick<Tables<'profiles'>, 'user_id' | 'username'>;
type PublicCaughtRow = Pick<
  Tables<'caught_shinies'>,
  'id' | 'pokemon_id' | 'pokemon_name' | 'form' | 'gender' | 'caught_date' | 'created_at' | 'sprite_url' | 'game' | 'is_fail' | 'is_unobtainable' | 'hunt_start_date' | 'method' | 'attempts' | 'has_shiny_charm' | 'is_evolved' | 'show_encounters'
>;
type PublicRecentRow = PublicCaughtRow & { user_id: string; username: string | null };

export default function UserCollectionsSearch() {
  const [query, setQuery] = useState('');
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [profilesError, setProfilesError] = useState<string | null>(null);

  const [selectedProfile, setSelectedProfile] = useState<ProfileRow | null>(null);
  const [entries, setEntries] = useState<PublicCaughtRow[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [entriesError, setEntriesError] = useState<string | null>(null);
  const [isRealtimeActive, setIsRealtimeActive] = useState(false);
  const [globalRecentEntries, setGlobalRecentEntries] = useState<PublicRecentRow[]>([]);
  const [globalRecentLoading, setGlobalRecentLoading] = useState(true);
  const [globalRecentError, setGlobalRecentError] = useState<string | null>(null);

  const getFourDaysAgoDate = () => {
    const d = new Date();
    d.setDate(d.getDate() - 4);
    return toLocalISODate(d);
  };

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
    if (raw.includes('game corner') || raw.includes('game-corner')) return 'Seen';
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

  useEffect(() => {
    const term = query.trim();
    if (!term) {
      setProfiles([]);
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
        setProfiles((data || []).filter((p) => Boolean(p.username)));
      } catch (err: any) {
        if (!active) return;
        setProfilesError(err?.message || 'Errore durante la ricerca username');
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
        .select('id, pokemon_id, pokemon_name, form, gender, caught_date, created_at, sprite_url, game, is_fail, is_unobtainable, hunt_start_date, method, attempts, has_shiny_charm, is_evolved, show_encounters')
        .eq('user_id', profile.user_id)
        .order('caught_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      setEntries(data || []);
    } catch (err: any) {
      if (!silent) {
        setEntriesError(err?.message || 'Impossibile caricare la collezione.');
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
      const cutoff = getFourDaysAgoDate();
      const { data, error } = await supabase
        .from('caught_shinies')
        .select('id, user_id, pokemon_id, pokemon_name, form, gender, caught_date, created_at, sprite_url, game, is_fail, is_unobtainable, hunt_start_date, method, attempts, has_shiny_charm, is_evolved, show_encounters')
        .gte('caught_date', cutoff)
        .order('caught_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(120);

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
        setGlobalRecentError(err?.message || 'Impossibile caricare anteprima utenti.');
      }
    } finally {
      if (!silent) setGlobalRecentLoading(false);
    }
  };

  useEffect(() => {
    void loadGlobalRecent();
  }, []);

  useEffect(() => {
    if (!selectedProfile) return;
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

  const groupedByPokemon = useMemo(() => {
    const map = new Map<string, { name: string; count: number; pokemonId: number; form: string | null }>();
    entries.forEach((entry) => {
      const key = `${entry.pokemon_id}-${entry.form || ''}`;
      const current = map.get(key);
      if (current) {
        current.count += 1;
      } else {
        map.set(key, {
          name: entry.pokemon_name,
          count: 1,
          pokemonId: entry.pokemon_id,
          form: entry.form,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [entries]);

  const renderGenderIcon = (gender: string | null) => {
    if (gender === 'male') return <span className="text-blue-500">{'\u2642'}</span>;
    if (gender === 'female') return <span className="text-pink-500">{'\u2640'}</span>;
    return null;
  };

  const renderEvolutionBadge = (isEvolved: boolean | null) => {
    if (!isEvolved) return null;
    return (
      <div
        className="absolute top-2 right-2 h-6 w-6 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 flex items-center justify-center backdrop-blur-sm"
        title="Pokemon evoluto"
      >
        <ArrowUpCircle className="h-3.5 w-3.5" />
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
    const sprite = entry.sprite_url || getPokemonSpriteUrl(entry.pokemon_id, { shiny: true, name: entry.form || entry.pokemon_name });
    const isEvent = isDistributionEvent(entry.method);
    const showEntryEncounters = shouldShowEncounters(entry.method, entry.game, entry.attempts, entry.show_encounters ?? true);
    const username = 'username' in entry ? entry.username : null;
    const gameLogo = entry.game ? GAME_LOGOS[entry.game] : null;

    return (
      <div
        key={`${keyPrefix}-${entry.id}`}
        className="group relative overflow-hidden rounded-[1.4rem] border border-border bg-card text-card-foreground shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_42%)] opacity-70" />
        {renderEvolutionBadge(entry.is_evolved)}

        <div className="relative p-3">
          <div className="relative flex min-h-[118px] items-center justify-center overflow-hidden rounded-[1.05rem] border border-border bg-muted/55">
            <div className="absolute inset-x-6 bottom-4 h-6 rounded-full bg-black/20 blur-xl" />
            <img
              src={sprite}
              alt={entry.pokemon_name}
              className={cn(
                'relative z-10 object-contain transition-transform duration-300 group-hover:scale-105',
                options.large ? 'h-28 w-28' : 'h-24 w-24',
                entry.is_fail && 'drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]'
              )}
              style={getSpriteStyle(entry.is_fail, entry.is_unobtainable)}
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
                    @{username || 'utente'}
                  </span>
                )}
              </div>
            </div>

            <div className="flex min-h-[42px] items-center justify-center">
              {gameLogo ? (
                <img
                  src={gameLogo}
                  alt={entry.game || 'Gioco'}
                  className="h-9 w-auto max-w-[96px] object-contain brightness-110 drop-shadow"
                  loading="lazy"
                />
              ) : (
                <span className="rounded-full border border-border bg-muted px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">
                  {entry.game || 'Gioco non indicato'}
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto py-8 px-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Cerca Username
            </CardTitle>
            <CardDescription>
              Cerca un utente e guarda in tempo reale i Pokemon catturati nella sua collezione.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Scrivi username..."
                className="pl-10"
              />
            </div>

            {profilesLoading && <p className="text-sm text-muted-foreground">Ricerca in corso...</p>}
            {profilesError && <p className="text-sm text-destructive">{profilesError}</p>}

            {profiles.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {profiles.map((profile) => (
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

            {!selectedProfile && (
            <div className="space-y-2 pt-2 border-t">
              <h3 className="font-semibold">Anteprima tutti gli utenti (ultimi 4 giorni)</h3>
              {globalRecentLoading && <p className="text-sm text-muted-foreground">Caricamento anteprima globale...</p>}
              {globalRecentError && <p className="text-sm text-destructive">{globalRecentError}</p>}
              {!globalRecentLoading && !globalRecentError && globalRecentEntries.length === 0 && (
                <p className="text-sm text-muted-foreground">Nessuna cattura pubblica negli ultimi 4 giorni.</p>
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
                Collezione di @{selectedProfile.username}
                <span className="text-sm font-normal text-muted-foreground">({entries.length} catture)</span>
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Radio className={`h-4 w-4 ${isRealtimeActive ? 'text-green-500' : 'text-muted-foreground'}`} />
                {isRealtimeActive ? 'Aggiornamento realtime attivo' : 'Realtime non connesso'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {entriesLoading && <p className="text-sm text-muted-foreground">Caricamento collezione...</p>}
              {entriesError && <p className="text-sm text-destructive">{entriesError}</p>}

              {!entriesLoading && !entriesError && entries.length === 0 && (
                <p className="text-sm text-muted-foreground">Nessuna cattura trovata per questo username.</p>
              )}

              {!entriesLoading && groupedByPokemon.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold">Riepilogo collezione</h3>
                    <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-black text-muted-foreground">
                      Top {Math.min(groupedByPokemon.length, 24)}
                    </span>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {groupedByPokemon.slice(0, 24).map((item, index) => (
                      <div
                        key={`${item.pokemonId}-${item.form}-${index}`}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-2 text-sm shadow-sm"
                      >
                        <span className="min-w-0 truncate font-bold">
                          {item.name} {item.form ? `(${item.form})` : ''}
                        </span>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-black tabular-nums text-muted-foreground">
                          x{item.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!entriesLoading && entries.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Ultime catture</h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {entries.map((entry) => renderPublicShinyCard(entry, 'collection', { large: true }))}
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

