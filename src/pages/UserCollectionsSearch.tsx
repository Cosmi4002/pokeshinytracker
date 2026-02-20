import { useEffect, useMemo, useState } from 'react';
import { Search, Radio, UserRound, Users } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { getPokemonSpriteUrl } from '@/hooks/use-pokemon';

type ProfileRow = Pick<Tables<'profiles'>, 'user_id' | 'username'>;
type PublicCaughtRow = Pick<
  Tables<'caught_shinies'>,
  'id' | 'pokemon_id' | 'pokemon_name' | 'form' | 'gender' | 'caught_date' | 'sprite_url' | 'game'
>;

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
        .select('id, pokemon_id, pokemon_name, form, gender, caught_date, sprite_url, game')
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

  useEffect(() => {
    if (!selectedProfile) return;
    void loadCollection(selectedProfile);
  }, [selectedProfile?.user_id]);

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
                              <p className="font-medium truncate">{entry.pokemon_name}</p>
                              <p className="text-xs text-muted-foreground truncate">{entry.form || 'Forma base'}</p>
                              <p className="text-xs text-muted-foreground">{new Date(entry.caught_date).toLocaleDateString('it-IT')}</p>
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
