import { useEffect, useMemo, useState } from 'react';
import { Search, Radio, UserRound, Users } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { getPokemonSpriteUrl } from '@/hooks/use-pokemon';
import { SHINY_CHARM_ICON } from '@/lib/pokemon-data';

type ProfileRow = Pick<Tables<'profiles'>, 'user_id' | 'username'>;
type PublicCaughtRow = Pick<
  Tables<'caught_shinies'>,
  'id' | 'pokemon_id' | 'pokemon_name' | 'form' | 'gender' | 'caught_date' | 'sprite_url' | 'game' | 'is_fail' | 'hunt_start_date' | 'method' | 'attempts' | 'has_shiny_charm'
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
    return d.toISOString().slice(0, 10);
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
        .select('id, pokemon_id, pokemon_name, form, gender, caught_date, sprite_url, game, is_fail, hunt_start_date, method, attempts, has_shiny_charm')
        .eq('user_id', profile.user_id)
        .order('caught_date', { ascending: false })
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
        .select('id, user_id, pokemon_id, pokemon_name, form, gender, caught_date, sprite_url, game, is_fail, hunt_start_date, method, attempts, has_shiny_charm')
        .gte('caught_date', cutoff)
        .order('caught_date', { ascending: false })
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
    return entries
      .filter((entry) => {
        const capturedAt = new Date(entry.caught_date).getTime();
        return Number.isFinite(capturedAt) && now - capturedAt <= fourDaysMs;
      })
      .sort((a, b) => new Date(b.caught_date).getTime() - new Date(a.caught_date).getTime());
  }, [entries]);

  const renderGenderIcon = (gender: string | null) => {
    if (gender === 'male') return <span className="text-blue-500">{'\u2642'}</span>;
    if (gender === 'female') return <span className="text-pink-500">{'\u2640'}</span>;
    return null;
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
                      return (
                        <div key={`preview-${entry.id}`} className="rounded-lg border p-3 bg-card">
                          <div className="flex items-center gap-3">
                            <img
                              src={sprite}
                              alt={entry.pokemon_name}
                              className="h-14 w-14 object-contain"
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
                              <p className="text-xs text-muted-foreground">{new Date(entry.caught_date).toLocaleDateString('it-IT')}</p>
                              <p className="text-xs text-muted-foreground truncate">Gioco: {entry.game || '-'}</p>
                              <p className="text-xs text-muted-foreground">Inizio: {entry.hunt_start_date ? new Date(entry.hunt_start_date).toLocaleDateString('it-IT') : '-'}</p>
                              <p className="text-xs text-muted-foreground truncate">Metodo: {entry.method || '-'}</p>
                              <p className="text-xs text-muted-foreground">Encounters: {entry.attempts ?? '-'}</p>
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
                    return (
                      <div key={`global-${entry.id}`} className="rounded-lg border p-3 bg-card">
                        <div className="flex items-center gap-3">
                          <img
                            src={sprite}
                            alt={entry.pokemon_name}
                            className="h-14 w-14 object-contain"
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
                            <p className="text-xs text-muted-foreground">{new Date(entry.caught_date).toLocaleDateString('it-IT')}</p>
                            <p className="text-xs text-muted-foreground truncate">Gioco: {entry.game || '-'}</p>
                            <p className="text-xs text-muted-foreground">Inizio: {entry.hunt_start_date ? new Date(entry.hunt_start_date).toLocaleDateString('it-IT') : '-'}</p>
                            <p className="text-xs text-muted-foreground truncate">Metodo: {entry.method || '-'}</p>
                            <p className="text-xs text-muted-foreground">Encounters: {entry.attempts ?? '-'}</p>
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
                      return (
                        <div key={entry.id} className="rounded-lg border p-3 bg-card">
                          <div className="flex items-center gap-3">
                            <img
                              src={sprite}
                              alt={entry.pokemon_name}
                              className="h-16 w-16 object-contain"
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
                              <p className="text-xs text-muted-foreground">{new Date(entry.caught_date).toLocaleDateString('it-IT')}</p>
                              <p className="text-xs text-muted-foreground truncate">Gioco: {entry.game || '-'}</p>
                              <p className="text-xs text-muted-foreground">Inizio: {entry.hunt_start_date ? new Date(entry.hunt_start_date).toLocaleDateString('it-IT') : '-'}</p>
                              <p className="text-xs text-muted-foreground truncate">Metodo: {entry.method || '-'}</p>
                              <p className="text-xs text-muted-foreground">Encounters: {entry.attempts ?? '-'}</p>
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
