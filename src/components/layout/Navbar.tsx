import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Check, Calculator, Search, Grid3X3, LogOut, Move, Sparkles, Settings2, Pencil, Users, BarChart3 } from 'lucide-react';
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
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ThemeCustomizer } from '@/components/layout/ThemeCustomizer';
import { useRandomColor } from '@/lib/random-color-context';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { trainerAvatars } from '@/lib/trainer-avatars';

type TrainerAvatarId = (typeof trainerAvatars)[number]['id'];

const AVATAR_ORDER_VERSION = 'playable-gen-order-v5';
const DEFAULT_AVATAR_ORDER_IDS = trainerAvatars.map((avatar) => avatar.id) as TrainerAvatarId[];

const getValidAvatarId = (raw: unknown) => (
  typeof raw === 'string' && trainerAvatars.some((avatar) => avatar.id === raw)
    ? (raw as TrainerAvatarId)
    : null
);

const getSafeAvatarOrder = (raw: unknown) => {
  const safeOrder = Array.isArray(raw)
    ? raw.filter((id): id is TrainerAvatarId => (
      typeof id === 'string' && DEFAULT_AVATAR_ORDER_IDS.includes(id as TrainerAvatarId)
    ))
    : [];

  return safeOrder.length > 0
    ? [
      ...safeOrder,
      ...DEFAULT_AVATAR_ORDER_IDS.filter((id) => !safeOrder.includes(id)),
    ]
    : null;
};

const readAvatarPreferencesFromMetadata = (metadata: Record<string, unknown> | null | undefined) => ({
  avatarId: getValidAvatarId(metadata?.trainer_avatar),
  avatarOrderIds: metadata?.trainer_avatar_order_version === AVATAR_ORDER_VERSION
    ? getSafeAvatarOrder(metadata.trainer_avatar_order)
    : null,
});

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { accentColor } = useRandomColor();
  const { toast } = useToast();
  const [profileUsername, setProfileUsername] = useState<string | null>(null);
  const [selectedAvatarId, setSelectedAvatarId] = useState<TrainerAvatarId>('red');
  const [avatarOrderIds, setAvatarOrderIds] = useState<TrainerAvatarId[]>(() => DEFAULT_AVATAR_ORDER_IDS);
  const [draggedAvatarId, setDraggedAvatarId] = useState<TrainerAvatarId | null>(null);
  const [movingAvatarId, setMovingAvatarId] = useState<TrainerAvatarId | null>(null);
  const [avatarPickerMode, setAvatarPickerMode] = useState<'select' | 'move'>('select');
  const [avatarPreferencesLoaded, setAvatarPreferencesLoaded] = useState(false);
  const [avatarPreferencesUserId, setAvatarPreferencesUserId] = useState<string | null>(null);
  const [avatarTouched, setAvatarTouched] = useState(false);
  const [avatarOrderTouched, setAvatarOrderTouched] = useState(false);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);

  const navLinks = [
    { to: '/counter', label: 'Counter', icon: Calculator },
    { to: '/pokedex', label: 'Pokedex', icon: Search },
    { to: '/collection', label: 'Collection', icon: Grid3X3 },
    { to: '/stats', label: 'Stats', icon: BarChart3 },
    { to: '/bingo', label: 'Bingo', icon: Sparkles },
    { to: '/users', label: 'Users', icon: Users },
  ];

  const metadataUsername = useMemo(() => {
    const raw = (user?.user_metadata as Record<string, unknown> | undefined)?.username;
    return typeof raw === 'string' && raw.trim() ? raw.trim() : null;
  }, [user?.user_metadata]);
  const metadataAvatarId = useMemo(() => {
    const raw = (user?.user_metadata as Record<string, unknown> | undefined)?.trainer_avatar;
    return getValidAvatarId(raw);
  }, [user?.user_metadata]);
  const metadataAvatarOrderIds = useMemo(() => {
    const metadata = user?.user_metadata as Record<string, unknown> | undefined;
    if (metadata?.trainer_avatar_order_version !== AVATAR_ORDER_VERSION) return null;

    return getSafeAvatarOrder(metadata.trainer_avatar_order);
  }, [user?.user_metadata]);

  const displayUsername = profileUsername || metadataUsername;
  const orderedTrainerAvatars = useMemo(() => {
    const avatarById = new Map(trainerAvatars.map((avatar) => [avatar.id, avatar]));
    const ordered = avatarOrderIds
      .map((id) => avatarById.get(id))
      .filter((avatar): avatar is (typeof trainerAvatars)[number] => Boolean(avatar));
    const orderedIds = new Set(ordered.map((avatar) => avatar.id));
    return [
      ...ordered,
      ...trainerAvatars.filter((avatar) => !orderedIds.has(avatar.id)),
    ];
  }, [avatarOrderIds]);
  const selectedAvatar =
    trainerAvatars.find((avatar) => avatar.id === selectedAvatarId) ?? trainerAvatars[0];
  const getAvatarImageStyle = (avatar: (typeof trainerAvatars)[number]) => ({
    transform: 'imageTransform' in avatar ? avatar.imageTransform : 'scale(1.72)',
    transformOrigin: 'imageTransformOrigin' in avatar ? avatar.imageTransformOrigin : 'top center',
  });

  const handleAvatarDrop = useCallback((targetAvatarId: TrainerAvatarId) => {
    if (!draggedAvatarId || draggedAvatarId === targetAvatarId) return;

    setAvatarOrderIds((currentOrder) => {
      const currentIds = currentOrder.filter((id) => DEFAULT_AVATAR_ORDER_IDS.includes(id));
      const missingIds = DEFAULT_AVATAR_ORDER_IDS.filter((id) => !currentIds.includes(id));
      const nextOrder = [...currentIds, ...missingIds];
      const fromIndex = nextOrder.indexOf(draggedAvatarId);
      const toIndex = nextOrder.indexOf(targetAvatarId);

      if (fromIndex === -1 || toIndex === -1) return currentOrder;

      const [movedAvatarId] = nextOrder.splice(fromIndex, 1);
      nextOrder.splice(toIndex, 0, movedAvatarId);
      setAvatarOrderTouched(true);
      return nextOrder;
    });
  }, [draggedAvatarId]);

  const moveAvatarToTarget = useCallback((
    avatarId: TrainerAvatarId,
    targetAvatarId: TrainerAvatarId
  ) => {
    if (avatarId === targetAvatarId) return;

    setAvatarOrderIds((currentOrder) => {
      const currentIds = currentOrder.filter((id) => DEFAULT_AVATAR_ORDER_IDS.includes(id));
      const nextOrder = [
        ...currentIds,
        ...DEFAULT_AVATAR_ORDER_IDS.filter((id) => !currentIds.includes(id)),
      ];
      const fromIndex = nextOrder.indexOf(avatarId);
      const toIndex = nextOrder.indexOf(targetAvatarId);

      if (fromIndex === -1 || toIndex === -1) return currentOrder;

      const [movedAvatarId] = nextOrder.splice(fromIndex, 1);
      nextOrder.splice(toIndex, 0, movedAvatarId);
      setAvatarOrderTouched(true);
      return nextOrder;
    });
  }, []);

  const handleAvatarPickerOpenChange = useCallback((open: boolean) => {
    setAvatarPickerOpen(open);
    if (!open) {
      setMovingAvatarId(null);
      setAvatarPickerMode('select');
    }
  }, []);

  const handleAvatarPress = useCallback((avatarId: TrainerAvatarId) => {
    if (avatarPickerMode === 'select') {
      setSelectedAvatarId(avatarId);
      setAvatarTouched(true);
      if (window.innerWidth < 640) setAvatarPickerOpen(false);
      return;
    }

    if (!movingAvatarId) {
      setMovingAvatarId(avatarId);
      return;
    }

    if (movingAvatarId !== avatarId) {
      moveAvatarToTarget(movingAvatarId, avatarId);
    }
    setMovingAvatarId(null);
  }, [avatarPickerMode, moveAvatarToTarget, movingAvatarId]);

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
    let active = true;

    if (!user) {
      setSelectedAvatarId('red');
      setAvatarOrderIds(DEFAULT_AVATAR_ORDER_IDS);
      setAvatarTouched(false);
      setAvatarOrderTouched(false);
      setAvatarPreferencesLoaded(false);
      setAvatarPreferencesUserId(null);
      return () => {
        active = false;
      };
    }

    setAvatarPreferencesLoaded(false);
    setAvatarPreferencesUserId(null);

    const loadAvatarPreferences = async () => {
      const storageKey = `trainer-avatar-${user.id}`;
      const storedAvatarId = getValidAvatarId(window.localStorage.getItem(storageKey));
      const orderStorageKey = `trainer-avatar-order-${user.id}`;
      const orderVersionStorageKey = `trainer-avatar-order-version-${user.id}`;
      const storedOrderVersion = window.localStorage.getItem(orderVersionStorageKey);
      let storedOrderIds: TrainerAvatarId[] | null = null;

      try {
        storedOrderIds = storedOrderVersion === AVATAR_ORDER_VERSION
          ? getSafeAvatarOrder(JSON.parse(window.localStorage.getItem(orderStorageKey) || '[]'))
          : null;
      } catch {
        storedOrderIds = null;
      }

      let remoteAvatarId = metadataAvatarId;
      let remoteAvatarOrderIds = metadataAvatarOrderIds;

      try {
        const { data, error } = await supabase.auth.getUser();
        if (!error && data.user?.id === user.id) {
          const remotePreferences = readAvatarPreferencesFromMetadata(
            data.user.user_metadata as Record<string, unknown> | undefined
          );
          remoteAvatarId = remotePreferences.avatarId;
          remoteAvatarOrderIds = remotePreferences.avatarOrderIds;
        }
      } catch {
        // Fall back to the current session metadata/local cache if the refresh fails.
      }

      if (!active) return;
      setSelectedAvatarId(remoteAvatarId || storedAvatarId || 'red');
      setAvatarOrderIds(remoteAvatarOrderIds || storedOrderIds || DEFAULT_AVATAR_ORDER_IDS);
      setAvatarTouched(false);
      setAvatarOrderTouched(false);
      setAvatarPreferencesLoaded(true);
      setAvatarPreferencesUserId(user.id);
    };

    loadAvatarPreferences();

    return () => {
      active = false;
    };
  }, [metadataAvatarId, metadataAvatarOrderIds, user?.id]);

  useEffect(() => {
    if (!user || !avatarPreferencesLoaded || avatarPreferencesUserId !== user.id || !avatarTouched) return;
    window.localStorage.setItem(`trainer-avatar-${user.id}`, selectedAvatarId);
    void supabase.auth.updateUser({
      data: { trainer_avatar: selectedAvatarId },
    });
  }, [avatarPreferencesLoaded, avatarPreferencesUserId, avatarTouched, selectedAvatarId, user?.id]);

  useEffect(() => {
    if (!user || !avatarPreferencesLoaded || avatarPreferencesUserId !== user.id || !avatarOrderTouched) return;
    window.localStorage.setItem(`trainer-avatar-order-${user.id}`, JSON.stringify(avatarOrderIds));
    window.localStorage.setItem(`trainer-avatar-order-version-${user.id}`, AVATAR_ORDER_VERSION);
    void supabase.auth.updateUser({
      data: {
        trainer_avatar_order: avatarOrderIds,
        trainer_avatar_order_version: AVATAR_ORDER_VERSION,
      },
    });
  }, [avatarOrderIds, avatarOrderTouched, avatarPreferencesLoaded, avatarPreferencesUserId, user?.id]);

  useEffect(() => {
    if (!user || !avatarPreferencesLoaded || avatarPreferencesUserId !== user.id) return;

    let active = true;

    const refreshRemoteAvatarPreferences = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (!active || error || data.user?.id !== user.id) return;

        const remotePreferences = readAvatarPreferencesFromMetadata(
          data.user.user_metadata as Record<string, unknown> | undefined
        );

        if (remotePreferences.avatarId) {
          setSelectedAvatarId(remotePreferences.avatarId);
          window.localStorage.setItem(`trainer-avatar-${user.id}`, remotePreferences.avatarId);
          setAvatarTouched(false);
        }

        if (remotePreferences.avatarOrderIds) {
          setAvatarOrderIds(remotePreferences.avatarOrderIds);
          window.localStorage.setItem(`trainer-avatar-order-${user.id}`, JSON.stringify(remotePreferences.avatarOrderIds));
          window.localStorage.setItem(`trainer-avatar-order-version-${user.id}`, AVATAR_ORDER_VERSION);
          setAvatarOrderTouched(false);
        }
      } catch {
        // Keep the current avatar on transient network failures.
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void refreshRemoteAvatarPreferences();
      }
    };

    window.addEventListener('focus', refreshRemoteAvatarPreferences);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      active = false;
      window.removeEventListener('focus', refreshRemoteAvatarPreferences);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [avatarPreferencesLoaded, avatarPreferencesUserId, user?.id]);

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
    <nav
      className="sticky top-0 z-50 border-b border-border/55 bg-card/78 shadow-[0_16px_42px_rgba(0,0,0,0.16)] outline outline-1 outline-black/10 backdrop-blur-2xl supports-[backdrop-filter]:bg-card/68 dark:border-white/10 dark:outline-white/15 dark:supports-[backdrop-filter]:bg-card/62"
      style={{
        boxShadow: `0 16px 42px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 ${accentColor}30`,
      }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${accentColor}90, transparent)`,
        }}
      />
      <div className="container mx-auto flex h-[4.25rem] items-center justify-between gap-2 px-4">
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
                    'h-9 px-2 sm:px-3 gap-1.5 sm:gap-2 outline outline-1 outline-black/5 dark:outline-white/10',
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
            <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-[3.25rem] w-[3.25rem] rounded-xl border-2 bg-muted p-0 outline outline-1 outline-black/10 transition-all duration-300 hover:bg-muted dark:outline-white/15"
                  style={{
                    borderColor: accentColor,
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.18), 0 0 14px ${accentColor}40`,
                  }}
                >
                  <span
                    className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[0.65rem] bg-muted text-card-foreground shadow-sm"
                    style={{
                      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.2)`,
                    }}
                  >
                    <span
                      className="absolute inset-0 opacity-80"
                      style={{
                        background: `radial-gradient(circle at 50% 15%, ${accentColor}30, transparent 58%)`,
                      }}
                    />
                    <span className="absolute inset-x-1 bottom-1 h-3 rounded-full bg-black/20 blur-sm" />
                    <img
                      src={selectedAvatar.src}
                      alt={selectedAvatar.label}
                      className="relative z-10 h-full w-full object-cover drop-shadow-[0_2px_3px_rgba(0,0,0,0.65)] [image-rendering:pixelated]"
                      style={getAvatarImageStyle(selectedAvatar)}
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
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    setAvatarPickerOpen(true);
                  }}
                >
                  <img
                    src={selectedAvatar.src}
                    alt={selectedAvatar.label}
                    className="mr-2 h-4 w-4 rounded-md border border-primary/70 bg-card p-0.5 object-contain"
                    onError={(e) => ((e.currentTarget as HTMLImageElement).src = '/placeholder.svg')}
                  />
                  Avatar
                </DropdownMenuItem>
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
            <Dialog open={avatarPickerOpen} onOpenChange={handleAvatarPickerOpenChange}>
              <DialogContent className="w-[calc(100vw-1rem)] max-w-2xl max-h-[85dvh] overflow-hidden border-border bg-card p-0 text-card-foreground shadow-2xl">
                <DialogHeader className="border-b border-border bg-card p-4 pr-10 text-left">
                  <DialogTitle>Avatar</DialogTitle>
                  <DialogDescription>
                    Scegli il trainer oppure usa Sposta per riordinare con un tap.
                  </DialogDescription>
                </DialogHeader>
                <div className="border-b border-border bg-card p-3">
                  <div className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-background/60 p-1">
                    <Button
                      type="button"
                      variant={avatarPickerMode === 'select' ? 'default' : 'ghost'}
                      size="sm"
                      className="h-9 justify-center gap-2"
                      onClick={() => {
                        setAvatarPickerMode('select');
                        setMovingAvatarId(null);
                      }}
                    >
                      <Check className="h-4 w-4" />
                      Scegli
                    </Button>
                    <Button
                      type="button"
                      variant={avatarPickerMode === 'move' ? 'default' : 'ghost'}
                      size="sm"
                      className="h-9 justify-center gap-2"
                      onClick={() => {
                        setAvatarPickerMode('move');
                        setMovingAvatarId(null);
                      }}
                    >
                      <Move className="h-4 w-4" />
                      Sposta
                    </Button>
                  </div>
                  {avatarPickerMode === 'move' && (
                    <div className="mt-2 rounded-md border border-primary/25 bg-primary/10 px-3 py-2 text-xs text-muted-foreground">
                      {movingAvatarId
                        ? 'Ora tocca la posizione dove vuoi inserirlo.'
                        : 'Tocca un avatar da spostare.'}
                    </div>
                  )}
                </div>
                <div className="max-h-[58dvh] overflow-y-auto bg-card p-4">
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
                    {orderedTrainerAvatars.map((avatar, index) => (
                      <div
                        key={`${avatar.id}-${index}`}
                        className="group flex min-w-0 flex-col items-center gap-1 rounded-lg border border-border bg-background/60 p-1.5 text-center transition hover:bg-muted"
                      >
                        <button
                          type="button"
                          draggable={avatarPickerMode === 'select'}
                          onClick={() => handleAvatarPress(avatar.id)}
                          onDragStart={(event) => {
                            if (avatarPickerMode !== 'select') return;
                            setDraggedAvatarId(avatar.id);
                            event.dataTransfer.effectAllowed = 'move';
                            event.dataTransfer.setData('text/plain', avatar.id);
                          }}
                          onDragOver={(event) => {
                            event.preventDefault();
                            event.dataTransfer.dropEffect = 'move';
                          }}
                          onDrop={(event) => {
                            event.preventDefault();
                            handleAvatarDrop(avatar.id);
                            setDraggedAvatarId(null);
                          }}
                          onDragEnd={() => setDraggedAvatarId(null)}
                          className="focus:outline-none focus:ring-2 focus:ring-ring rounded-lg"
                          aria-label={avatarPickerMode === 'move' ? `Sposta ${avatar.label}` : `Seleziona ${avatar.label}`}
                        >
                          <span
                            className={cn(
                              'relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg border-2 bg-card shadow-sm ring-1 ring-border/60 transition-all',
                              avatarPickerMode === 'select' ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer',
                              movingAvatarId === avatar.id
                                ? 'border-primary bg-primary/15 ring-2 ring-primary/60 scale-105'
                                : selectedAvatarId === avatar.id
                                ? 'border-primary ring-1 ring-primary/60'
                                : draggedAvatarId === avatar.id
                                  ? 'border-primary/80 opacity-60'
                                  : avatarPickerMode === 'move' && movingAvatarId
                                    ? 'border-primary/40 border-dashed hover:border-primary'
                                  : 'border-border hover:border-primary/60'
                            )}
                            style={{
                              boxShadow: selectedAvatarId === avatar.id
                                ? `inset 0 1px 0 rgba(255,255,255,0.14), 0 0 12px ${accentColor}35`
                                : undefined,
                            }}
                          >
                            <span
                              className="absolute inset-0 opacity-80"
                              style={{
                                background: `radial-gradient(circle at 50% 15%, ${accentColor}24, transparent 58%)`,
                              }}
                            />
                            <span className="absolute inset-x-1 bottom-1 h-3 rounded-full bg-black/20 blur-sm" />
                            <img
                              src={avatar.src}
                              alt={avatar.label}
                              title={avatar.label}
                              className="relative z-10 h-full w-full object-cover drop-shadow-[0_2px_3px_rgba(0,0,0,0.65)] [image-rendering:pixelated]"
                              style={getAvatarImageStyle(avatar)}
                              onError={(e) => ((e.currentTarget as HTMLImageElement).src = '/placeholder.svg')}
                            />
                          </span>
                        </button>
                        <span className="max-w-full truncate text-[10px] font-medium text-muted-foreground">
                          {avatar.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            </>
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
