import { Pencil, Trash2, Calendar, ArrowUpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getGameTheme, GAME_LOGOS, type GameTheme } from '@/lib/game-themes';
import { POKEBALLS, HUNTING_METHODS, getPokemonSpriteUrl } from '@/lib/pokemon-data';
import type { Tables } from '@/integrations/supabase/types';
import { useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

type CaughtShinyRow = Tables<'caught_shinies'>;

interface ShinyCardProps {
  entry: CaughtShinyRow;
  onEdit: () => void;
  onDelete: () => void;
  onToggleEvolved: () => void;
  themeOverride?: GameTheme;
  applyBlackEffect?: boolean;
  spriteName?: string;
}

export function ShinyCard({ entry, onEdit, onDelete, onToggleEvolved, themeOverride, applyBlackEffect = false, spriteName }: ShinyCardProps) {
  const isEvolved = entry.is_evolved === true;

  const theme = useMemo(() => themeOverride || getGameTheme(entry.game), [entry.game, themeOverride]);
  const pokeball = useMemo(() => POKEBALLS.find((b) => b.id === entry.pokeball), [entry.pokeball]);
  const method = useMemo(() => HUNTING_METHODS.find((m) => m.id === entry.method), [entry.method]);

  const spriteUrl = useMemo(() => {
    const spriteSlug = entry.form || spriteName || entry.pokemon_name;
    return getPokemonSpriteUrl(entry.pokemon_id, {
      shiny: true,
      name: spriteSlug,
      female: entry.gender === 'female',
    });
  }, [entry.pokemon_id, entry.pokemon_name, entry.form, entry.gender, spriteName]);

  const displayName = entry.pokemon_name;

  const formatDate = useCallback((dateString: string) => {
    if (!dateString) return '--';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }, []);

  return (
    <div
      className={cn(
        'group relative h-full flex flex-col overflow-hidden rounded-xl border bg-[#232323] shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1',
        entry.is_fail ? 'border-red-500/80 shadow-[0_0_20px_rgba(239,68,68,0.25)] ring-1 ring-red-500/50' : 'border-white/10'
      )}
      style={{
        borderColor: entry.is_fail ? '#ef4444' : `${theme.primary}95`,
        boxShadow: entry.is_fail
          ? undefined
          : applyBlackEffect
            ? `0 16px 36px color-mix(in srgb, #191f3f, ${theme.secondary} 55%), inset 0 1px 0 rgba(255,255,255,0.06)`
            : `0 14px 30px ${theme.secondary}44`,
      }}
    >
      <div className="relative w-full h-40 sm:h-44 overflow-hidden bg-black/40">
        <div
          className="absolute inset-0 z-0"
          style={{
            background: `radial-gradient(circle at 50% 30%, ${theme.secondary} 0%, #111 58%, ${theme.primary} 100%)`,
          }}
        />
        <div
          className="absolute inset-0 z-0 opacity-45"
          style={{
            background: `radial-gradient(circle at 22% 18%, ${theme.accent}, transparent 42%), radial-gradient(circle at 78% 78%, ${theme.primary}, transparent 52%)`,
          }}
        />
        {applyBlackEffect && (
          <div
            className="absolute inset-0 z-0 opacity-65"
            style={{
              background:
                'radial-gradient(circle at 50% 25%, rgba(11,11,13,0.78) 0%, rgba(25,31,63,0.48) 45%, rgba(8,10,20,0.86) 100%)',
            }}
          />
        )}

        <div className="absolute inset-0 flex items-center justify-center z-10 p-2">
          <div
            className="absolute bottom-6 w-24 h-6 blur-xl opacity-60 rounded-[100%]"
            style={{ background: `radial-gradient(ellipse at center, ${theme.primary}, transparent 70%)` }}
          />
          <div className="h-28 w-28 sm:h-32 sm:w-32 flex items-center justify-center">
            <img
              key={spriteUrl}
              src={spriteUrl}
              loading="lazy"
              decoding="async"
              alt={entry.pokemon_name}
              className="h-full w-full object-contain pokemon-sprite drop-shadow-[0_8px_16px_rgba(0,0,0,0.75)] transition-all duration-300 group-hover:scale-105 relative z-10"
              style={{ imageRendering: 'auto' }}
              onError={(e) => {
                e.currentTarget.src = '/fallback-sprite.png';
              }}
            />
          </div>
        </div>

        <div className="absolute top-2 left-2 right-2 flex justify-between items-start z-20">
          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-2 group-hover:translate-x-0">
            <Button
              variant="secondary"
              size="icon"
              onClick={onEdit}
              className="h-7 w-7 rounded-full bg-black/55 hover:bg-white text-white hover:text-black border border-white/10 backdrop-blur-md shadow-lg"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={onToggleEvolved}
              className={cn(
                "h-7 w-7 rounded-full text-white border border-white/10 backdrop-blur-md shadow-lg",
                isEvolved ? "bg-emerald-600 hover:bg-emerald-700" : "bg-black/55 hover:bg-emerald-500"
              )}
              title={isEvolved ? 'Segna come non evoluto' : 'Segna come evoluto'}
            >
              <ArrowUpCircle className="h-3.5 w-3.5" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-7 w-7 rounded-full bg-black/55 hover:bg-destructive text-white border border-white/10 backdrop-blur-md shadow-lg"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-[#1a1a1a] border-white/10 text-white">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-xl font-bold">Delete {displayName}?</AlertDialogTitle>
                  <AlertDialogDescription className="text-white/60">
                    Sei sicuro di voler eliminare questo Pokemon dalla tua collezione? Questa azione non puo essere annullata.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-white/5 hover:bg-white/10 border-white/10 text-white">
                    Annulla
                  </AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90 text-white">
                    Elimina
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {isEvolved && (
            <div
              className="h-7 w-7 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 flex items-center justify-center backdrop-blur-md"
              title="Pokemon evoluto"
            >
              <ArrowUpCircle className="h-3.5 w-3.5" />
            </div>
          )}
        </div>
      </div>

      <div
        className="flex-1 p-3 bg-[#222] relative z-10 border-t border-white/10"
        style={{
          background: applyBlackEffect
            ? `linear-gradient(180deg, color-mix(in srgb, #0b0b0d 62%, ${theme.secondary}) 0%, color-mix(in srgb, #131831 55%, ${theme.primary}) 100%)`
            : `linear-gradient(180deg, color-mix(in srgb, ${theme.secondary} 34%, #141414) 0%, color-mix(in srgb, ${theme.primary} 28%, #121212) 100%)`,
          borderTopColor: `${theme.accent}66`,
        }}
      >
        <div className="space-y-2.5">
          <div className="space-y-1.5">
            <div className="w-full flex justify-center">
              <div className="inline-flex items-center justify-center gap-1.5 max-w-full px-1">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight capitalize leading-tight text-center break-words whitespace-normal max-w-full">
                  {displayName}
                </h3>
                {entry.gender && (entry.gender === 'male' || entry.gender === 'female') && (
                  entry.gender === 'male' ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 text-blue-400 flex-shrink-0"
                    >
                      <path d="M16 3h5v5" />
                      <path d="m21 3-6.75 6.75" />
                      <circle cx="10" cy="14" r="6" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 text-pink-400 flex-shrink-0"
                    >
                      <path d="M12 15v7" />
                      <path d="M9 19h6" />
                      <circle cx="12" cy="9" r="6" />
                    </svg>
                  )
                )}
              </div>
            </div>

            <div className="flex items-center justify-center">
              {GAME_LOGOS[entry.game] && (
                <img
                  src={GAME_LOGOS[entry.game]}
                  loading="lazy"
                  decoding="async"
                  alt={entry.game}
                  className="h-10 sm:h-12 w-auto max-w-[92px] object-contain brightness-110 drop-shadow-lg"
                />
              )}
            </div>
          </div>

          {method && (
            <div className="flex justify-center">
              <div
                className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.12em] border shadow-sm"
                style={{
                  backgroundColor: `color-mix(in srgb, ${theme.accent} 20%, #0d0d0d)`,
                  borderColor: `${theme.accent}88`,
                  color: theme.accent,
                }}
              >
                {method.name}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 mt-2">
            <div
              className="rounded-lg p-2 border shadow-lg"
              style={{
                background: `linear-gradient(145deg, color-mix(in srgb, ${theme.secondary} 48%, #101010), color-mix(in srgb, ${theme.primary} 42%, #0f0f0f))`,
                borderColor: `${theme.accent}66`,
              }}
            >
              <div className="flex items-center gap-1 mb-1.5">
                <Calendar className="w-3 h-3 text-white/70" />
                <span className="text-[8px] sm:text-[9px] font-bold text-white/60 uppercase tracking-[0.14em]">Hunt Dates</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-1 rounded-md bg-black/25 px-1.5 py-1">
                  <span className="text-[8px] sm:text-[9px] text-white/55 font-bold uppercase tracking-wider">Start</span>
                  <span className="text-[9px] sm:text-[10px] font-semibold text-white/95 tabular-nums text-right">
                    {entry.hunt_start_date ? formatDate(entry.hunt_start_date) : '--'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-1 rounded-md bg-black/25 px-1.5 py-1">
                  <span className="text-[8px] sm:text-[9px] text-white/55 font-bold uppercase tracking-wider">Caught</span>
                  <span className="text-[9px] sm:text-[10px] font-semibold text-white/95 tabular-nums text-right">
                    {formatDate(entry.caught_date)}
                  </span>
                </div>
              </div>
            </div>

            <div
              className="rounded-lg p-2 border shadow-lg flex flex-col"
              style={{
                background: `linear-gradient(145deg, color-mix(in srgb, ${theme.primary} 46%, #101010), color-mix(in srgb, ${theme.secondary} 38%, #0f0f0f))`,
                borderColor: `${theme.accent}66`,
              }}
            >
              <span className="text-[8px] sm:text-[9px] font-bold text-white/60 uppercase tracking-[0.14em] block mb-1.5">Encounters</span>
              <div className="flex-1 flex items-center justify-center rounded-md bg-black/25 px-1.5 py-2">
                <span className="text-2xl sm:text-[1.75rem] font-black tabular-nums tracking-tight text-white leading-none">
                  {entry.attempts && entry.attempts > 0 ? entry.attempts.toLocaleString() : '-'}
                </span>
              </div>
              {entry.phase_number && (
                <div className="mt-1.5 pt-1.5 border-t border-white/15">
                  <span
                    className="text-[9px] font-black uppercase tracking-[0.12em] px-1.5 py-0.5 rounded border"
                    style={{
                      color: theme.accent,
                      backgroundColor: `color-mix(in srgb, ${theme.accent} 20%, #0d0d0d)`,
                      borderColor: `${theme.accent}88`,
                    }}
                  >
                    PHASE #{entry.phase_number}
                  </span>
                </div>
              )}
            </div>
          </div>

          {(pokeball || entry.has_shiny_charm) && (
            <div className="mt-2 pt-2 border-t flex items-center justify-between" style={{ borderTopColor: `${theme.primary}20` }}>
              <div className="flex items-center gap-2">
                {entry.is_fail ? (
                  <div className="relative overflow-hidden rounded border border-red-500/50 bg-red-950/40 pl-2 pr-3 py-0.5 shadow-[0_0_10px_rgba(239,68,68,0.2)] inset-shadow-sm">
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_45%,rgba(239,68,68,0.2)_50%,transparent_55%)] bg-[length:200%_200%] animate-[shimmer_3s_infinite]" />
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_5px_rgba(239,68,68,0.8)]" />
                      <span className="text-red-400 font-black text-[10px] tracking-[0.15em] uppercase drop-shadow-sm">FAIL</span>
                    </div>
                  </div>
                ) : pokeball ? (
                  <>
                    <img src={pokeball.sprite} loading="lazy" decoding="async" className="w-4 h-4 object-contain" alt="pokeball" />
                    <span className="text-[9px] text-white/50 font-semibold uppercase tracking-wide">{pokeball.name}</span>
                  </>
                ) : (
                  <span className="text-[9px] text-white/40 font-semibold uppercase tracking-wide">No Pokeball</span>
                )}
              </div>

              {entry.has_shiny_charm && (
                <div className="flex items-center" title="Shiny Charm Active">
                  <img
                    src="/img/items/shiny-charm.png"
                    loading="lazy"
                    decoding="async"
                    className="w-7 h-7 object-contain animate-pulse drop-shadow-[0_0_8px_rgba(234,179,8,0.6)]"
                    alt="Shiny Charm"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
