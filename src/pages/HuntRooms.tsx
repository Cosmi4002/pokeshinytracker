import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  Copy,
  Crown,
  DoorOpen,
  LogIn,
  Minus,
  Plus,
  Radio,
  Share2,
  Sparkles,
  Trophy,
  UserRound,
  Users,
  WifiOff,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { PokemonSelector } from '@/components/counter/PokemonSelector';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { getPokemonSpriteUrl, usePokemonList } from '@/hooks/use-pokemon';
import { useToast } from '@/hooks/use-toast';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { useAuth } from '@/lib/auth-context';
import { useRandomColor } from '@/lib/random-color-context';
import { cn } from '@/lib/utils';
import { getArchiveShinySpriteUrl } from '@/lib/pokemon-data';

type HuntRoom = Tables<'hunt_rooms'>;
type HuntRoomMember = Tables<'hunt_room_members'>;
type ConfirmAction = 'found' | 'close' | 'leave' | null;

const numberFormatter = new Intl.NumberFormat('en-US');

const formatPokemonName = (value: string) => value
  .replace(/-/g, ' ')
  .replace(/\b\w/g, (letter) => letter.toUpperCase());

const statusStyle: Record<string, string> = {
  active: 'border-emerald-500/35 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
  completed: 'border-amber-500/35 bg-amber-500/10 text-amber-600 dark:text-amber-300',
  closed: 'border-border bg-muted text-muted-foreground',
};

const getHuntRoomSpriteUrl = (room: Pick<HuntRoom, 'pokemon_id' | 'pokemon_name' | 'sprite_url'>) =>
  getArchiveShinySpriteUrl(room.pokemon_id, {
    shiny: true,
    name: room.pokemon_name,
    form: room.pokemon_name,
  }) || getPokemonSpriteUrl(room.pokemon_id, {
    shiny: true,
    name: room.pokemon_name,
  }) || room.sprite_url || '/placeholder.svg';

export default function HuntRooms() {
  const { roomId } = useParams<{ roomId?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { accentColor } = useRandomColor();
  const { pokemon } = usePokemonList();
  const { toast } = useToast();
  const isOnline = useOnlineStatus();

  const [rooms, setRooms] = useState<HuntRoom[]>([]);
  const [room, setRoom] = useState<HuntRoom | null>(null);
  const [members, setMembers] = useState<HuntRoomMember[]>([]);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [roomName, setRoomName] = useState('Shiny Hunt');
  const [selectedPokemonId, setSelectedPokemonId] = useState<number | null>(null);
  const [selectedPokemonName, setSelectedPokemonName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const pendingDeltaRef = useRef(0);
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedPokemon = useMemo(() => pokemon.find((entry) => (
    entry.id === selectedPokemonId && entry.name === selectedPokemonName
  )), [pokemon, selectedPokemonId, selectedPokemonName]);

  const currentMember = useMemo(
    () => members.find((member) => member.user_id === user?.id) || null,
    [members, user?.id]
  );
  const winner = useMemo(
    () => members.find((member) => member.user_id === room?.winner_user_id) || null,
    [members, room?.winner_user_id]
  );
  const totalEncounters = useMemo(
    () => members.reduce((total, member) => total + member.counter, 0),
    [members]
  );

  const loadRooms = useCallback(async () => {
    if (!user) {
      setRooms([]);
      return;
    }

    const { data: memberships, error: membershipError } = await supabase
      .from('hunt_room_members')
      .select('room_id')
      .eq('user_id', user.id);

    if (membershipError) throw membershipError;
    const roomIds = (memberships || []).map((membership) => membership.room_id);
    if (roomIds.length === 0) {
      setRooms([]);
      return;
    }

    const { data, error } = await supabase
      .from('hunt_rooms')
      .select('*')
      .in('id', roomIds)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    setRooms(data || []);
  }, [user]);

  const loadCurrentRoom = useCallback(async () => {
    if (!user || !roomId) {
      setRoom(null);
      setMembers([]);
      return;
    }

    const [roomResult, memberResult] = await Promise.all([
      supabase.from('hunt_rooms').select('*').eq('id', roomId).maybeSingle(),
      supabase.from('hunt_room_members').select('*').eq('room_id', roomId).order('counter', { ascending: false }),
    ]);

    if (roomResult.error) throw roomResult.error;
    if (memberResult.error) throw memberResult.error;
    if (!roomResult.data) {
      navigate('/rooms', { replace: true });
      return;
    }

    setRoom(roomResult.data);
    setMembers(memberResult.data || []);
  }, [navigate, roomId, user]);

  const refresh = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      await Promise.all([loadRooms(), loadCurrentRoom()]);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Unable to load Hunt Rooms',
        description: error instanceof Error ? error.message : 'Check that the Hunt Rooms migration is installed.',
      });
    } finally {
      setLoading(false);
    }
  }, [loadCurrentRoom, loadRooms, toast, user]);

  useEffect(() => {
    setLoading(true);
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const invitedCode = new URLSearchParams(location.search).get('code');
    if (!invitedCode || !user || roomId) return;
    setJoinCode(invitedCode.toUpperCase().slice(0, 6));
    setJoinOpen(true);
  }, [location.search, roomId, user]);

  useEffect(() => {
    if (!user || !roomId) {
      setOnlineUserIds(new Set());
      return;
    }

    const channel = supabase.channel(`hunt-room:${roomId}`, {
      config: { presence: { key: user.id } },
    });

    channel
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'hunt_rooms',
        filter: `id=eq.${roomId}`,
      }, () => { void loadCurrentRoom(); void loadRooms(); })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'hunt_room_members',
        filter: `room_id=eq.${roomId}`,
      }, () => { void loadCurrentRoom(); })
      .on('presence', { event: 'sync' }, () => {
        setOnlineUserIds(new Set(Object.keys(channel.presenceState())));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadCurrentRoom, loadRooms, roomId, user]);

  const handleCreate = async () => {
    if (!selectedPokemonId || !selectedPokemonName || !roomName.trim()) return;
    setSubmitting(true);
    const spriteUrl = getArchiveShinySpriteUrl(selectedPokemonId, {
      shiny: true,
      name: selectedPokemonName,
      form: selectedPokemonName,
    }) || getPokemonSpriteUrl(selectedPokemonId, {
      shiny: true,
      name: selectedPokemonName,
    });
    const { data, error } = await supabase.rpc('create_hunt_room', {
      room_name: roomName.trim(),
      target_pokemon_id: selectedPokemonId,
      target_pokemon_name: selectedPokemonName,
      target_pokemon_form: selectedPokemon?.displayName || null,
      target_sprite_url: spriteUrl,
    });

    if (error) {
      toast({ variant: 'destructive', title: 'Room creation failed', description: error.message });
    } else {
      setCreateOpen(false);
      setRoomName('Shiny Hunt');
      setSelectedPokemonId(null);
      setSelectedPokemonName('');
      await loadRooms();
      navigate(`/rooms/${data}`);
    }
    setSubmitting(false);
  };

  const handleJoin = async () => {
    if (joinCode.trim().length !== 6) return;
    setSubmitting(true);
    const { data, error } = await supabase.rpc('join_hunt_room', {
      room_code: joinCode.trim().toUpperCase(),
    });

    if (error) {
      toast({ variant: 'destructive', title: 'Unable to join room', description: error.message });
    } else {
      setJoinOpen(false);
      setJoinCode('');
      await loadRooms();
      navigate(`/rooms/${data}`);
    }
    setSubmitting(false);
  };

  const flushCounterDelta = useCallback(async () => {
    if (!roomId || !user || pendingDeltaRef.current === 0) return;
    const delta = pendingDeltaRef.current;
    pendingDeltaRef.current = 0;
    flushTimerRef.current = null;

    const { data, error } = await supabase.rpc('increment_hunt_room_counter', {
      selected_room_id: roomId,
      counter_delta: delta,
    });

    if (error) {
      toast({ variant: 'destructive', title: 'Counter sync failed', description: error.message });
      void loadCurrentRoom();
      return;
    }

    setMembers((current) => current.map((member) => (
      member.user_id === user.id ? { ...member, counter: data } : member
    )));
  }, [loadCurrentRoom, roomId, toast, user]);

  const changeCounter = (delta: number) => {
    if (!roomId || !user || room?.status !== 'active' || !isOnline) return;
    if (delta < 0 && (currentMember?.counter || 0) <= 0) return;

    pendingDeltaRef.current += delta;
    setMembers((current) => current.map((member) => (
      member.user_id === user.id
        ? { ...member, counter: Math.max(0, member.counter + delta) }
        : member
    )));

    if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
    flushTimerRef.current = setTimeout(() => { void flushCounterDelta(); }, 180);
  };

  useEffect(() => () => {
    if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
    void flushCounterDelta();
  }, [flushCounterDelta]);

  const executeConfirmedAction = async () => {
    if (!roomId || !confirmAction) return;
    setSubmitting(true);
    await flushCounterDelta();

    const result = confirmAction === 'found'
      ? await supabase.rpc('mark_hunt_room_found', { selected_room_id: roomId })
      : confirmAction === 'close'
        ? await supabase.rpc('close_hunt_room', { selected_room_id: roomId })
        : await supabase.rpc('leave_hunt_room', { selected_room_id: roomId });

    if (result.error) {
      toast({ variant: 'destructive', title: 'Action failed', description: result.error.message });
    } else if (confirmAction === 'found' && result.data === false) {
      toast({ title: 'Hunt already completed', description: 'Another hunter reported the shiny first.' });
      await refresh();
    } else if (confirmAction === 'found') {
      toast({ title: 'Shiny found!', description: 'The result has been shared with everyone in the room.' });
      await refresh();
    } else {
      setConfirmAction(null);
      await loadRooms();
      navigate('/rooms');
    }
    setConfirmAction(null);
    setSubmitting(false);
  };

  const copyInviteCode = async () => {
    if (!room) return;
    await navigator.clipboard.writeText(room.invite_code);
    toast({ title: 'Invite code copied', description: room.invite_code });
  };

  const shareRoom = async () => {
    if (!room) return;
    const url = `${window.location.origin}/rooms?code=${room.invite_code}`;
    if (navigator.share) {
      await navigator.share({ title: room.name, text: `Join my shiny hunt. Code: ${room.invite_code}`, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: 'Invite link copied' });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto space-y-4 px-4 py-8">
          <Skeleton className="h-36 rounded-3xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </main>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-background"
      style={{ backgroundImage: `radial-gradient(circle at 50% 0%, ${accentColor}18 0%, transparent 62%)` }}
    >
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <section className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-6 shadow-2xl sm:p-8">
            <div className="pointer-events-none absolute inset-0 opacity-80" style={{ background: `radial-gradient(circle at top left, ${accentColor}25, transparent 42%)` }} />
            <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <Radio className="h-4 w-4" /> Live co-op hunting
                </div>
                <h1 className="text-3xl font-bold sm:text-4xl">Hunt Rooms</h1>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
                  Hunt the same shiny with friends while every personal counter updates live.
                </p>
              </div>
              {user && !roomId && (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setJoinOpen(true)} disabled={!isOnline}>
                    <DoorOpen className="h-4 w-4" />Join
                  </Button>
                  <Button onClick={() => setCreateOpen(true)} disabled={!isOnline}>
                    <Plus className="h-4 w-4" />Create room
                  </Button>
                </div>
              )}
            </div>
          </section>

          {!isOnline && (
            <Card className="border-amber-500/35 bg-amber-500/10">
              <CardContent className="flex items-center gap-3 p-4 text-sm">
                <WifiOff className="h-5 w-5 text-amber-500" />Hunt Rooms require an internet connection for live synchronization.
              </CardContent>
            </Card>
          )}

          {!user ? (
            <Card className="border-border bg-card shadow-xl">
              <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
                <LogIn className="h-10 w-10 text-muted-foreground" />
                <div>
                  <h2 className="text-xl font-semibold">Sign in to hunt with friends</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Rooms and counters are linked securely to your account.</p>
                </div>
                <Button asChild><Link to="/auth">Sign In</Link></Button>
              </CardContent>
            </Card>
          ) : room ? (
            <>
              <Button variant="ghost" onClick={() => navigate('/rooms')}>
                <ArrowLeft className="h-4 w-4" />All rooms
              </Button>

              <Card className="relative overflow-hidden border-border bg-card shadow-2xl">
                <div className="pointer-events-none absolute inset-0 opacity-70" style={{ background: `radial-gradient(circle at 12% 15%, ${accentColor}22, transparent 36%)` }} />
                <CardContent className="relative grid gap-6 p-5 sm:p-7 lg:grid-cols-[220px_1fr]">
                  <div className="flex min-h-52 items-center justify-center rounded-3xl border border-border bg-muted/25 p-4">
                    <img
                      src={getHuntRoomSpriteUrl(room)}
                      alt={room.pokemon_name}
                      className="h-44 w-44 object-contain drop-shadow-[0_8px_12px_rgba(0,0,0,0.45)] [image-rendering:pixelated]"
                      onError={(event) => { event.currentTarget.src = '/placeholder.svg'; }}
                    />
                  </div>
                  <div className="flex min-w-0 flex-col justify-between gap-5">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-2xl font-bold sm:text-3xl">{room.name}</h2>
                        <Badge variant="outline" className={cn('capitalize', statusStyle[room.status])}>{room.status}</Badge>
                      </div>
                      <p className="mt-1 text-lg font-semibold text-muted-foreground">
                        {room.pokemon_form || formatPokemonName(room.pokemon_name)}
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-xl border border-border bg-background/55 p-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Invite code</div>
                        <button type="button" onClick={copyInviteCode} className="mt-1 flex items-center gap-2 text-xl font-black tracking-[0.18em]">
                          {room.invite_code}<Copy className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </div>
                      <div className="rounded-xl border border-border bg-background/55 p-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Team total</div>
                        <div className="mt-1 text-xl font-black tabular-nums">{numberFormatter.format(totalEncounters)}</div>
                      </div>
                      <div className="rounded-xl border border-border bg-background/55 p-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Hunters</div>
                        <div className="mt-1 text-xl font-black">{members.length}/{room.max_members}</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => void shareRoom()}>
                        <Share2 className="h-4 w-4" />Share invite
                      </Button>
                      {room.status === 'active' && (
                        <Button size="sm" onClick={() => setConfirmAction('found')} className="shiny-glow">
                          <Sparkles className="h-4 w-4" />I found it!
                        </Button>
                      )}
                      {room.host_user_id === user.id && room.status === 'active' ? (
                        <Button variant="outline" size="sm" onClick={() => setConfirmAction('close')}>Close room</Button>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => setConfirmAction('leave')}>Leave room</Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {room.status === 'completed' && (
                <Card className="border-amber-500/40 bg-amber-500/10 shadow-xl">
                  <CardContent className="flex flex-col items-center gap-2 py-6 text-center">
                    <Trophy className="h-9 w-9 text-amber-500" />
                    <h2 className="text-xl font-bold">Shiny found by {winner?.display_name || 'a hunter'}!</h2>
                    <p className="text-sm text-muted-foreground">Final team total: {numberFormatter.format(totalEncounters)} encounters.</p>
                  </CardContent>
                </Card>
              )}

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
                <Card className="border-border bg-card shadow-xl">
                  <CardContent className="p-5 sm:p-6">
                    <div className="mb-5 flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold">Your counter</h2>
                        <p className="text-sm text-muted-foreground">Synced live with everyone in this room.</p>
                      </div>
                      {onlineUserIds.has(user.id) && <Badge variant="outline" className="border-emerald-500/35 text-emerald-500">Live</Badge>}
                    </div>
                    <div className="flex items-center justify-center gap-4 rounded-3xl border border-border bg-background/55 p-6">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-14 w-14 rounded-2xl"
                        onClick={() => changeCounter(-1)}
                        disabled={room.status !== 'active' || !isOnline || (currentMember?.counter || 0) <= 0}
                      >
                        <Minus className="h-6 w-6" />
                      </Button>
                      <div className="min-w-32 text-center text-5xl font-black tabular-nums sm:text-6xl" style={{ color: accentColor }}>
                        {numberFormatter.format(currentMember?.counter || 0)}
                      </div>
                      <Button
                        type="button"
                        size="icon"
                        className="h-14 w-14 rounded-2xl"
                        onClick={() => changeCounter(1)}
                        disabled={room.status !== 'active' || !isOnline}
                      >
                        <Plus className="h-6 w-6" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border bg-card shadow-xl">
                  <CardContent className="p-5 sm:p-6">
                    <h2 className="mb-4 flex items-center gap-2 text-xl font-bold"><Users className="h-5 w-5" />Hunters</h2>
                    <div className="space-y-2">
                      {members.map((member, index) => (
                        <div key={member.user_id} className="flex items-center gap-3 rounded-xl border border-border bg-background/55 p-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                            {member.user_id === room.winner_user_id
                              ? <Crown className="h-4 w-4 text-amber-500" />
                              : <UserRound className="h-4 w-4 text-muted-foreground" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="truncate font-semibold">{member.display_name}</span>
                              {member.user_id === room.host_user_id && <span className="text-[10px] font-bold uppercase text-muted-foreground">Host</span>}
                              {onlineUserIds.has(member.user_id) && <span className="h-2 w-2 rounded-full bg-emerald-500" title="Online" />}
                            </div>
                            <span className="text-xs text-muted-foreground">#{index + 1}</span>
                          </div>
                          <div className="font-black tabular-nums">{numberFormatter.format(member.counter)}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <>
              {rooms.length === 0 ? (
                <Card className="border-dashed border-border bg-card/75">
                  <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
                    <Users className="h-11 w-11 text-muted-foreground" />
                    <div>
                      <h2 className="text-xl font-semibold">No Hunt Rooms yet</h2>
                      <p className="mt-1 text-sm text-muted-foreground">Create a room or enter a friend's six-character invite code.</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setJoinOpen(true)}>Join room</Button>
                      <Button onClick={() => setCreateOpen(true)}>Create room</Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {rooms.map((listedRoom) => (
                    <button key={listedRoom.id} type="button" onClick={() => navigate(`/rooms/${listedRoom.id}`)} className="text-left">
                      <Card className="h-full overflow-hidden border-border bg-card shadow-lg transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-xl">
                        <CardContent className="flex h-full items-center gap-4 p-4">
                          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted/30 p-2">
                            <img
                              src={getHuntRoomSpriteUrl(listedRoom)}
                              alt={listedRoom.pokemon_name}
                              className="h-full w-full object-contain [image-rendering:pixelated]"
                            />
                          </div>
                          <div className="min-w-0">
                            <Badge variant="outline" className={cn('mb-2 capitalize', statusStyle[listedRoom.status])}>{listedRoom.status}</Badge>
                            <h2 className="truncate text-lg font-bold">{listedRoom.name}</h2>
                            <p className="truncate text-sm text-muted-foreground">{listedRoom.pokemon_form || formatPokemonName(listedRoom.pokemon_name)}</p>
                            <p className="mt-2 text-xs font-bold tracking-[0.16em] text-muted-foreground">{listedRoom.invite_code}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Hunt Room</DialogTitle>
            <DialogDescription>Choose the shared target. Each hunter will keep an independent live counter.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="hunt-room-name">Room name</Label>
              <Input id="hunt-room-name" maxLength={60} value={roomName} onChange={(event) => setRoomName(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Target Pokémon</Label>
              <PokemonSelector
                value={selectedPokemonId}
                valueName={selectedPokemonName}
                onChange={(pokemonId, pokemonName) => {
                  setSelectedPokemonId(pokemonId);
                  setSelectedPokemonName(pokemonName);
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={() => void handleCreate()} disabled={submitting || !roomName.trim() || !selectedPokemonId}>
              {submitting ? 'Creating...' : 'Create room'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join Hunt Room</DialogTitle>
            <DialogDescription>Enter the six-character code shared by the room host.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-3">
            <Label htmlFor="hunt-room-code">Invite code</Label>
            <Input
              id="hunt-room-code"
              autoComplete="off"
              maxLength={6}
              value={joinCode}
              onChange={(event) => setJoinCode(event.target.value.replace(/[^a-z0-9]/gi, '').toUpperCase())}
              placeholder="A1B2C3"
              className="text-center text-xl font-black uppercase tracking-[0.25em]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setJoinOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={() => void handleJoin()} disabled={submitting || joinCode.length !== 6}>
              {submitting ? 'Joining...' : 'Join room'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(confirmAction)} onOpenChange={(open) => !open && !submitting && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === 'found' ? 'Confirm shiny found?' : confirmAction === 'close' ? 'Close this room?' : 'Leave this room?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === 'found'
                ? 'The room will be completed and you will be shown as the hunter who found the shiny.'
                : confirmAction === 'close'
                  ? 'Counters will stop and participants will see the room as closed.'
                  : 'You will lose access to this room, but the other hunters can continue.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(event) => { event.preventDefault(); void executeConfirmedAction(); }} disabled={submitting}>
              {submitting ? 'Please wait...' : <><Check className="h-4 w-4" />Confirm</>}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
