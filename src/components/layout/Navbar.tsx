import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Calculator, Search, Grid3X3, LogOut, Sparkles, Settings2, FileText, Pencil, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabaseProjectRef } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeCustomizer } from '@/components/layout/ThemeCustomizer';
import { useRandomColor } from '@/lib/random-color-context';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { trainerAvatars } from '@/lib/trainer-avatars';

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { accentColor } = useRandomColor();
  const { toast } = useToast();
  const [profileUsername, setProfileUsername] = useState<string | null>(null);
  const [selectedAvatarId, setSelectedAvatarId] = useState<(typeof trainerAvatars)[number]['id']>('red');

  const navLinks = [
    { to: '/counter', label: 'Counter', icon: Calculator },
    { to: '/pokedex', label: 'Pokedex', icon: Search },
    { to: '/collection', label: 'Collection', icon: Grid3X3 },
    { to: '/memo', label: 'Memo', icon: FileText },
    { to: '/bingo', label: 'Bingo', icon: Sparkles },
    { to: '/users', label: 'Users', icon: Users },
  ];

  const metadataUsername = useMemo(() => {
    const raw = (user?.user_metadata as Record<string, unknown> | undefined)?.username;
    return typeof raw === 'string' && raw.trim() ? raw.trim() : null;
  }, [user?.user_metadata]);

  const displayUsername = profileUsername || metadataUsername;
  const selectedAvatar =
    trainerAvatars.find((avatar) => avatar.id === selectedAvatarId) ?? trainerAvatars[0];

  const handleSetUsername = async () => {
    if (!user) return;
    const current = displayUsername || '';
    const next = window.prompt('Inserisci username (3-24 caratteri):', current);
    if (next === null) return;

    const username = next.trim();
    if (username.length < 3 || username.length > 24) {
      toast({
        variant: 'destructive',
        title: 'Username non valido',
        description: 'Deve avere tra 3 e 24 caratteri.',
      });
      return;
    }

    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(
          {
            user_id: user.id,
            username,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

      if (profileError) throw profileError;

      const { error: metadataError } = await supabase.auth.updateUser({
        data: { username },
      });
      if (metadataError) {
        console.warn('Could not sync username to auth metadata:', metadataError);
      }

      setProfileUsername(username);
      toast({
        title: 'Username aggiornato',
        description: `Nuovo username: @${username}`,
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Errore aggiornamento username',
        description: err?.message || 'Impossibile aggiornare username.',
      });
    }
  };

  useEffect(() => {
    if (!user) {
      setSelectedAvatarId('red');
      return;
    }

    const storageKey = `trainer-avatar-${user.id}`;
    const stored = window.localStorage.getItem(storageKey);
    const exists = trainerAvatars.some((avatar) => avatar.id === stored);
    setSelectedAvatarId(exists ? (stored as (typeof trainerAvatars)[number]['id']) : 'red');
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    window.localStorage.setItem(`trainer-avatar-${user.id}`, selectedAvatarId);
  }, [selectedAvatarId, user?.id]);

  useEffect(() => {
    let active = true;
    if (!user) {
      setProfileUsername(null);
      return;
    }

    const loadProfileUsername = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!active) return;
        if (error) {
          setProfileUsername(null);
          return;
        }
        setProfileUsername(data?.username ?? null);
      } catch {
        if (active) setProfileUsername(null);
      }
    };

    loadProfileUsername();
    return () => {
      active = false;
    };
  }, [user?.id]);

  return (
    <nav className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 gap-2">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <Sparkles className="h-6 w-6" style={{ color: accentColor }} />
          <span
            className="text-lg sm:text-xl font-bold whitespace-nowrap bg-clip-text text-transparent bg-gradient-to-r hidden sm:block"
            style={{
              backgroundImage: `linear-gradient(to right, ${accentColor}, color-mix(in srgb, ${accentColor}, white 30%))`
            }}
          >
            PokeShinyTracker
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;

            return (
              <Link key={link.to} to={link.to}>
                <Button
                  variant={isActive ? 'default' : 'ghost'}
                  size="sm"
                  className={cn(
                    'h-9 px-2 sm:px-3 gap-1.5 sm:gap-2',
                    isActive && 'bg-primary text-primary-foreground shadow-sm'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden md:inline">{link.label}</span>
                </Button>
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <ThemeCustomizer />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-12 w-12">
                  <span
                    className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border-2 bg-gradient-to-br from-white/30 to-white/10 ring-1 ring-white/40"
                    style={{
                      borderColor: accentColor,
                      boxShadow: `0 0 12px ${accentColor}40`,
                    }}
                  >
                    <img
                      src={selectedAvatar.src}
                      alt={selectedAvatar.label}
                      className="h-full w-full origin-top scale-[1.58] object-cover object-[50%_10%] [image-rendering:pixelated]"
                    />
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {user.email === 'chritel04@gmail.com' && (
                  <DropdownMenuItem onClick={() => navigate('/pokedex/manage')}>
                    <Settings2 className="mr-2 h-4 w-4" />
                    Gestione
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleSetUsername}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Imposta username
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <img
                      src={selectedAvatar.src}
                      alt={selectedAvatar.label}
                      className="mr-2 h-4 w-4 rounded-md border border-primary/70 bg-gradient-to-br from-white/30 to-white/10 p-0.5 object-contain"
                      onError={(e) => ((e.currentTarget as HTMLImageElement).src = '/placeholder.svg')}
                    />
                    Avatar
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-[92vw] max-w-sm p-3 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                      {trainerAvatars.map((avatar) => (
                        <DropdownMenuItem
                          key={avatar.id}
                          onClick={() => setSelectedAvatarId(avatar.id)}
                          className="p-0 focus:bg-transparent"
                        >
                          <span
                            className={cn(
                              'flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border-2 bg-gradient-to-br from-white/30 to-white/10 shadow-[0_4px_10px_rgba(0,0,0,0.15)] transition-all',
                              selectedAvatarId === avatar.id
                                ? 'border-primary ring-1 ring-primary/60'
                                : 'border-border hover:border-primary/60'
                            )}
                          >
                            <img
                              src={avatar.src}
                              alt={avatar.label}
                              title={avatar.label}
                              className="h-full w-full origin-top scale-[1.58] object-cover object-[50%_10%] [image-rendering:pixelated]"
                              onError={(e) => ((e.currentTarget as HTMLImageElement).src = '/placeholder.svg')}
                            />
                          </span>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-muted-foreground text-xs flex flex-col items-start gap-1">
                  <span className="font-semibold text-foreground">
                    {displayUsername ? `@${displayUsername}` : 'Username non impostato'}
                  </span>
                  <span className="font-semibold text-foreground">{user.email}</span>
                  <span>ID: {user.id.slice(0, 8)}...</span>
                  <span>Project: {supabaseProjectRef}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/auth">
              <Button
                size="sm"
                className="font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                style={{
                  backgroundColor: accentColor,
                  color: 'white',
                  boxShadow: `0 0 15px ${accentColor}40`
                }}
              >
                Login
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
