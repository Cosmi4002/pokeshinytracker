import { useEffect, useMemo, useState } from 'react';
import { Search, Radio, UserRound, Users, ArrowUpCircle } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { getPokemonSpriteUrl } from '@/hooks/use-pokemon';
import { SHINY_CHARM_ICON } from '@/lib/pokemon-data';
import { toLocalISODate } from '@/lib/date';

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
    if (raw.includes('game corner')) return 'Seen';
    if (raw.includes('masuda')) return 'Hatched';
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

  const recentEntries = useMemo(() => {
    const now = Date.now();
    const fourDaysMs = 4 * 24 * 60 * 60 * 1000;

    const toDayValue = (value?: string | null) => {
      if (!value) return Number.NaN;
      const day = value.slice(0, 10);
      return new Date(`${day}T00:00:00Z`).getTime();
    };

    return entries
      .filter((entry) => {
        const capturedAt = Number.isFinite(toDayValue(entry.caught_date))
          ? toDayValue(entry.caught_date)
          : toDayValue(entry.created_at);
        return Number.isFinite(capturedAt) && now - capturedAt <= fourDaysMs;
      })
      .sort((a, b) => {
        const aDay = Number.isFinite(toDayValue(a.caught_date)) ? toDayValue(a.caught_date) : toDayValue(a.created_at);
        const bDay = Number.isFinite(toDayValue(b.caught_date)) ? toDayValue(b.caught_date) : toDayValue(b.created_at);
        const byCaughtDate = bDay - aDay;
        if (byCaughtDate !== 0) return byCaughtDate;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
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

            {selectedProfile && (
              <div className="space-y-2 pt-2 border-t">
                <h3 className="font-semibold">
                  Anteprima ultime catture (4 giorni) di @{selectedProfile.username}
                </h3>
                {entriesLoading && <p className="text-sm text-muted-foreground">Caricamento anteprima...</p>}
                {!entriesLoading && recentEntries.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nessuna cattura negli ultimi 4 giorni.</p>
                )}
                {!entriesLoading && recentEntries.length > 0 && (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {recentEntries.map((entry) => {
                      const sprite = entry.sprite_url || getPokemonSpriteUrl(entry.pokemon_id, { shiny: true, name: entry.form || entry.pokemon_name });
                      const isEvent = isDistributionEvent(entry.method);
                      return (
                        <div key={`preview-${entry.id}`} className="relative rounded-lg border p-3 bg-card">
                          {renderEvolutionBadge(entry.is_evolved)}
                          <div className="flex items-center gap-3">
                            <img
                              src={sprite}
                              alt={entry.pokemon_name}
                              className={entry.is_fail ? 'h-14 w-14 object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.25)]' : 'h-14 w-14 object-contain'}
                              style={getSpriteStyle(entry.is_fail, entry.is_unobtainable)}
                              loading="lazy"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder.svg';
                              }}
                            />
                            <div className="min-w-0">
                              <p className="font-medium truncate flex items-center gap-1">
                                <span className="truncate">{entry.pokemon_name}</span>
                                {renderGenderIcon(entry.gender)}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">{entry.form || 'Forma base'}</p>
                              {entry.is_fail && <p className="text-xs font-bold text-red-500">FAIL</p>}
                              {entry.is_unobtainable && <p className="text-xs font-bold text-amber-500">UNCATCHABLE</p>}
                              {!isEvent && <p className="text-xs text-muted-foreground">{formatDate(entry.caught_date)}</p>}
                              <p className="text-xs text-muted-foreground truncate">Gioco: {entry.game || '-'}</p>
                              {!isEvent && (
                                <p className="text-xs text-muted-foreground">Inizio: {entry.hunt_start_date ? formatDate(entry.hunt_start_date) : '--'}</p>
                              )}
                              <p className="text-xs text-muted-foreground truncate">Metodo: {formatMethodLabel(entry.method)}</p>
                              {shouldShowEncounters(entry.method, entry.game, entry.attempts, entry.show_encounters ?? true) ? (
                                <p className="text-xs text-muted-foreground">{getEncounterLabel(entry.method)}: {entry.attempts ?? '-'}</p>
                              ) : null}
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <img src={SHINY_CHARM_ICON} alt="Cromamuleto" className="h-3 w-3 object-contain" />
                                <span>Cromamuleto: {entry.has_shiny_charm ? 'Si' : 'No'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2 pt-2 border-t">
              <h3 className="font-semibold">Anteprima tutti gli utenti (ultimi 4 giorni)</h3>
              {globalRecentLoading && <p className="text-sm text-muted-foreground">Caricamento anteprima globale...</p>}
              {globalRecentError && <p className="text-sm text-destructive">{globalRecentError}</p>}
              {!globalRecentLoading && !globalRecentError && globalRecentEntries.length === 0 && (
                <p className="text-sm text-muted-foreground">Nessuna cattura pubblica negli ultimi 4 giorni.</p>
              )}
              {!globalRecentLoading && globalRecentEntries.length > 0 && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {globalRecentEntries.map((entry) => {
                    const sprite = entry.sprite_url || getPokemonSpriteUrl(entry.pokemon_id, { shiny: true, name: entry.form || entry.pokemon_name });
                    const isEvent = isDistributionEvent(entry.method);
                    return (
                      <div key={`global-${entry.id}`} className="relative rounded-lg border p-3 bg-card">
                        {renderEvolutionBadge(entry.is_evolved)}
                        <div className="flex items-center gap-3">
                          <img
                            src={sprite}
                            alt={entry.pokemon_name}
                            className={entry.is_fail ? 'h-14 w-14 object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.25)]' : 'h-14 w-14 object-contain'}
                            style={getSpriteStyle(entry.is_fail, entry.is_unobtainable)}
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder.svg';
                            }}
                          />
                          <div className="min-w-0">
                            <p className="font-medium truncate flex items-center gap-1">
                              <span className="truncate">{entry.pokemon_name}</span>
                              {renderGenderIcon(entry.gender)}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{entry.form || 'Forma base'}</p>
                            <p className="text-xs text-muted-foreground truncate">@{entry.username || 'utente'}</p>
                            {entry.is_fail && <p className="text-xs font-bold text-red-500">FAIL</p>}
                            {entry.is_unobtainable && <p className="text-xs font-bold text-amber-500">UNCATCHABLE</p>}
                            {!isEvent && <p className="text-xs text-muted-foreground">{formatDate(entry.caught_date)}</p>}
                            <p className="text-xs text-muted-foreground truncate">Gioco: {entry.game || '-'}</p>
                            {!isEvent && (
                              <p className="text-xs text-muted-foreground">Inizio: {entry.hunt_start_date ? formatDate(entry.hunt_start_date) : '--'}</p>
                            )}
                            <p className="text-xs text-muted-foreground truncate">Metodo: {formatMethodLabel(entry.method)}</p>
                            {shouldShowEncounters(entry.method, entry.game, entry.attempts, entry.show_encounters ?? true) ? (
                              <p className="text-xs text-muted-foreground">{getEncounterLabel(entry.method)}: {entry.attempts ?? '-'}</p>
                            ) : null}
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <img src={SHINY_CHARM_ICON} alt="Cromamuleto" className="h-3 w-3 object-contain" />
                              <span>Cromamuleto: {entry.has_shiny_charm ? 'Si' : 'No'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
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
                <div className="space-y-2">
                  <h3 className="font-semibold">Riepilogo collezione</h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {groupedByPokemon.slice(0, 24).map((item, index) => (
                      <div key={`${item.pokemonId}-${item.form}-${index}`} className="rounded-md border p-2 text-sm">
                        {item.name} {item.form ? `(${item.form})` : ''} x{item.count}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!entriesLoading && entries.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Ultime catture</h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {entries.map((entry) => {
                      const sprite = entry.sprite_url || getPokemonSpriteUrl(entry.pokemon_id, { shiny: true, name: entry.form || entry.pokemon_name });
                      const isEvent = isDistributionEvent(entry.method);
                      return (
                        <div key={entry.id} className="relative rounded-lg border p-3 bg-card">
                          {renderEvolutionBadge(entry.is_evolved)}
                          <div className="flex items-center gap-3">
                            <img
                              src={sprite}
                              alt={entry.pokemon_name}
                              className={entry.is_fail ? 'h-16 w-16 object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.25)]' : 'h-16 w-16 object-contain'}
                              style={getSpriteStyle(entry.is_fail, entry.is_unobtainable)}
                              loading="lazy"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder.svg';
                              }}
                            />
                            <div className="min-w-0">
                              <p className="font-medium truncate flex items-center gap-1">
                                <span className="truncate">{entry.pokemon_name}</span>
                                {renderGenderIcon(entry.gender)}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">{entry.form || 'Forma base'}</p>
                              {entry.is_fail && <p className="text-xs font-bold text-red-500">FAIL</p>}
                              {entry.is_unobtainable && <p className="text-xs font-bold text-amber-500">UNCATCHABLE</p>}
                              {!isEvent && <p className="text-xs text-muted-foreground">{formatDate(entry.caught_date)}</p>}
                              <p className="text-xs text-muted-foreground truncate">Gioco: {entry.game || '-'}</p>
                              {!isEvent && (
                                <p className="text-xs text-muted-foreground">Inizio: {entry.hunt_start_date ? formatDate(entry.hunt_start_date) : '--'}</p>
                              )}
                              <p className="text-xs text-muted-foreground truncate">Metodo: {formatMethodLabel(entry.method)}</p>
                              {shouldShowEncounters(entry.method, entry.game, entry.attempts, entry.show_encounters ?? true) ? (
                                <p className="text-xs text-muted-foreground">{getEncounterLabel(entry.method)}: {entry.attempts ?? '-'}</p>
                              ) : null}
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <img src={SHINY_CHARM_ICON} alt="Cromamuleto" className="h-3 w-3 object-contain" />
                                <span>Cromamuleto: {entry.has_shiny_charm ? 'Si' : 'No'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
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

