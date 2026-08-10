import { Pencil, Trash2, Calendar, ArrowUpCircle, Crosshair, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getGameTheme, GAME_LOGOS, type GameTheme } from '@/lib/game-themes';
import { GIGAMAX_ICON, POKEBALLS, POKEMON_EGG_ICON, findHuntingMethod, getPokemonSpriteFallbackUrl, getPokemonSpriteUrl, handlePokemonSpriteError, isBreedingMethod, supportsGigamaxMark, toLocalPokemonSpriteUrl } from '@/lib/pokemon-data';
import type { Tables } from '@/integrations/supabase/types';
import { useMemo, useCallback, useId } from 'react';
import { cn } from '@/lib/utils';
import type { CardFilterId } from '@/lib/card-effects';
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
  secondaryThemeOverride?: GameTheme;
  applyBlackEffect?: boolean;
  cardFilter?: CardFilterId;
  spriteName?: string;
}

const getEvolvedFromSpriteScale = (name?: string | null) => {
  const normalized = (name || '').toString().trim().toLowerCase();
  if (normalized.includes('buizel')) return 1.22;
  return 1;
};

const getEvolvedFromSpriteSize = (name?: string | null, compact = false) =>
  `${2.58 * getEvolvedFromSpriteScale(name) * (compact ? 0.82 : 1)}rem`;

export function ShinyCard({ entry, onEdit, onDelete, onToggleEvolved, themeOverride, secondaryThemeOverride, applyBlackEffect = false, cardFilter = 'none', spriteName }: ShinyCardProps) {
  const spriteOutlineSeed = useId().replace(/:/g, '');
  const evolvedSpriteOutlineId = `evolved-sprite-outline-${spriteOutlineSeed}`;
  const mainSpriteOutlineId = `main-sprite-outline-${spriteOutlineSeed}`;
  const isFail = entry.is_fail === true;
  const isEvolved = entry.is_evolved === true;
  const isGigamax = entry.is_gigamax === true && supportsGigamaxMark(entry.game);
  const isLegendsArceus = entry.is_legends_arceus === true;
  const isEvent = (entry.method || '').toString().trim().toLowerCase() === 'distribution/event';
  const normalizedMethod = (entry.method || '').toString().trim().toLowerCase();
  const isBreeding = isBreedingMethod(normalizedMethod);
  const showEncountersPreference = (entry as any).show_encounters !== false;
  const evolvedFromId = (entry as any).evolved_from_id as number | null | undefined;
  const evolvedFromName = (entry as any).evolved_from_name as string | null | undefined;

  const theme = useMemo(() => themeOverride || getGameTheme(entry.game), [entry.game, themeOverride]);
  const secondaryTheme = useMemo(() => {
    const g = (entry as any).secondary_game as string | null | undefined;
    return g ? secondaryThemeOverride || getGameTheme(g) : null;
  }, [(entry as any).secondary_game, secondaryThemeOverride]);
  const pokeball = useMemo(() => POKEBALLS.find((b) => b.id === entry.pokeball), [entry.pokeball]);
  const method = useMemo(() => findHuntingMethod(entry.method), [entry.method]);
  const hasBottomMeta = isGigamax || isLegendsArceus || entry.is_fail || entry.is_unobtainable;
  const isGameCorner = normalizedMethod.includes('game corner') || normalizedMethod.includes('game-corner') || method?.name.toLowerCase() === 'game corner';
  const isPokeRadar = normalizedMethod.includes('pokeradar') || normalizedMethod.includes('poke radar') || method?.name.toLowerCase().includes('poke radar');
  const isChainFishing = normalizedMethod.includes('chain fishing') || method?.name.toLowerCase().includes('chain fishing');
  const encountersLabel = isPokeRadar || isChainFishing ? 'Chain' : (isGameCorner ? 'Seen' : (isBreeding ? 'Hatched' : 'Encounters'));
  const showEncounters = useMemo(() => {
    if (entry.attempts === null) return false;
    if (!showEncountersPreference) return false;
    if (isEvent) return false;
    const raw = normalizedMethod;
    const rawGame = (entry.game || '').toString().trim().toLowerCase();
    const formSlug = (entry.form || '').toString().trim().toLowerCase();

    // Allow encounters box for this special form even when saved from Pokédex details (method/game "unknown").
    if (formSlug === 'dudunsparce-three-segment') return true;
    if (formSlug === 'maushold-family-of-three') return true;
    // Keep form-only saves (from Pokédex details) clean: they use method/game "unknown"
    // and should not show the encounters box.
    if (raw === 'unknown' || rawGame === 'unknown') return false;

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
  }, [entry.attempts, entry.method, entry.game, entry.form, isEvent, normalizedMethod, showEncountersPreference]);

  const spriteUrl = useMemo(() => {
    const rawForm = (entry.form || '').toString().trim().toLowerCase();
    const rawName = (entry.pokemon_name || '').toString().trim().toLowerCase();
    const rawSpriteName = (spriteName || '').toString().trim().toLowerCase();
    if (
      rawForm === 'maushold-family-of-four' ||
      rawName === 'maushold-family-of-four' ||
      rawSpriteName === 'maushold-family-of-four'
    ) {
      return 'https://img.pokemondb.net/sprites/home/shiny/maushold-family4.png';
    }
    const spriteSlug = entry.form || spriteName || entry.pokemon_name;
    return getPokemonSpriteUrl(entry.pokemon_id, {
      shiny: true,
      name: spriteSlug,
      female: entry.gender === 'female',
    });
  }, [entry.pokemon_id, entry.pokemon_name, entry.form, entry.gender, spriteName]);

  const displayName = entry.pokemon_name;
  const hasDualGameTheme = Boolean(secondaryTheme);
  const dualThemeRootBackground = hasDualGameTheme
    ? `
      radial-gradient(120% 140% at 14% 18%, color-mix(in srgb, ${theme.accent} 68%, transparent) 0%, transparent 44%),
      radial-gradient(120% 140% at 86% 22%, color-mix(in srgb, ${secondaryTheme!.accent} 68%, transparent) 0%, transparent 46%),
      radial-gradient(150% 120% at 18% 78%, color-mix(in srgb, ${theme.primary} 72%, #111) 0%, transparent 52%),
      radial-gradient(150% 120% at 82% 82%, color-mix(in srgb, ${secondaryTheme!.primary} 72%, #111) 0%, transparent 52%),
      linear-gradient(135deg, color-mix(in srgb, ${theme.secondary} 72%, #090909) 0%, color-mix(in srgb, #111 52%, ${theme.primary}) 38%, color-mix(in srgb, #111 48%, ${secondaryTheme!.primary}) 62%, color-mix(in srgb, ${secondaryTheme!.secondary} 72%, #090909) 100%)
    `
    : null;
  const dualThemeBorderBackground = hasDualGameTheme
    ? `linear-gradient(135deg, ${theme.accent} 0%, color-mix(in srgb, ${theme.primary} 58%, ${secondaryTheme!.accent}) 34%, color-mix(in srgb, ${secondaryTheme!.primary} 58%, ${theme.accent}) 66%, ${secondaryTheme!.accent} 100%)`
    : null;
  const dualThemeHeroBackground = hasDualGameTheme
    ? `
      radial-gradient(95% 90% at 24% 30%, ${theme.secondary} 0%, transparent 60%),
      radial-gradient(95% 90% at 76% 30%, ${secondaryTheme!.secondary} 0%, transparent 60%),
      radial-gradient(80% 90% at 20% 82%, color-mix(in srgb, ${theme.primary} 72%, transparent) 0%, transparent 58%),
      radial-gradient(80% 90% at 80% 82%, color-mix(in srgb, ${secondaryTheme!.primary} 72%, transparent) 0%, transparent 58%),
      linear-gradient(120deg, rgba(8,8,10,0.96) 0%, rgba(16,16,20,0.78) 28%, rgba(24,24,30,0.52) 50%, rgba(16,16,20,0.78) 72%, rgba(8,8,10,0.96) 100%)
    `
    : null;
  const dualThemeContentBackground = hasDualGameTheme
    ? `
      radial-gradient(120% 140% at 12% 0%, color-mix(in srgb, ${theme.primary} 20%, transparent) 0%, transparent 48%),
      radial-gradient(120% 140% at 88% 6%, color-mix(in srgb, ${secondaryTheme!.primary} 20%, transparent) 0%, transparent 48%),
      linear-gradient(155deg, rgba(18,18,20,0.9) 0%, rgba(20,20,24,0.84) 48%, rgba(18,18,20,0.92) 100%)
    `
    : null;
  const spritePanelBackground = hasDualGameTheme
    ? `linear-gradient(135deg, ${theme.secondary} 0%, color-mix(in srgb, ${theme.secondary} 50%, ${secondaryTheme!.secondary}) 50%, ${secondaryTheme!.secondary} 100%)`
    : entry.game === 'violet'
      ? `linear-gradient(135deg, ${theme.secondary} 0%, color-mix(in srgb, ${theme.secondary} 55%, ${theme.primary}) 52%, color-mix(in srgb, ${theme.primary} 86%, #111) 100%)`
      : `linear-gradient(135deg, ${theme.secondary} 0%, color-mix(in srgb, ${theme.secondary} 55%, ${theme.primary}) 52%, ${theme.primary} 100%)`;
  const evolvedFromSpriteUrl = useMemo(() => {
    if (!isEvolved || !evolvedFromId) return '';
    const byName = getPokemonSpriteUrl(evolvedFromId, {
      shiny: true,
      name: evolvedFromName || undefined,
    });
    return byName || getPokemonSpriteUrl(evolvedFromId, { shiny: true });
  }, [isEvolved, evolvedFromId, evolvedFromName]);

  const formatDate = useCallback((dateString: string) => {
    if (!dateString) return '--';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }, []);

  return (
    <div
      className={cn(
        'group relative h-full w-full min-w-0 flex flex-col overflow-hidden rounded-xl border bg-transparent shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1',
        isFail
          ? 'border-red-500/80 shadow-[0_0_20px_rgba(239,68,68,0.25)] ring-1 ring-red-500/50'
          : entry.is_unobtainable
            ? 'border-amber-500/80 shadow-[0_0_20px_rgba(245,158,11,0.25)] ring-1 ring-amber-500/50'
            : isEvent
              ? 'border-fuchsia-400/60 shadow-[0_0_22px_rgba(217,70,239,0.18)] ring-1 ring-fuchsia-400/25'
              : 'border-white/10'
      )}
      style={{
        borderColor: isFail
          ? '#ef4444'
          : entry.is_unobtainable
            ? '#f59e0b'
            : isEvent
              ? 'rgba(217,70,239,0.75)'
              : secondaryTheme
                ? 'transparent'
                : theme.accent,
        boxShadow: isFail
          ? undefined
          : entry.is_unobtainable
            ? undefined
            : applyBlackEffect
              ? `0 16px 36px color-mix(in srgb, #191f3f, ${theme.secondary} 55%), inset 0 1px 0 rgba(255,255,255,0.06)`
              : hasDualGameTheme
                ? `0 14px 30px ${theme.secondary}44, inset -1px 0 0 ${secondaryTheme!.secondary}44`
                : `0 14px 30px ${theme.secondary}44`,
        background: hasDualGameTheme
          ? `${dualThemeRootBackground} padding-box, ${dualThemeBorderBackground} border-box`
          : `linear-gradient(145deg, ${theme.primary} 0%, ${theme.secondary} 38%, #111 100%)`,
        border: hasDualGameTheme
          ? '2px solid transparent'
          : undefined,
      }}
    >
      {isEvent && (
        <div className="pointer-events-none absolute inset-0 z-[1]">
          <div className="absolute -inset-[1px] rounded-xl ring-2 ring-fuchsia-400/25" />
          <div className="absolute left-0 right-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-fuchsia-300/70 to-transparent" />
        </div>
      )}
      {cardFilter === 'holo' && (
        <div className="pointer-events-none absolute inset-0 z-[2] rounded-xl opacity-95 mix-blend-screen">
          <div className="absolute inset-[1px] rounded-xl border border-white/30 bg-[linear-gradient(118deg,rgba(255,255,255,0.24),rgba(134,239,172,0.12)_18%,rgba(125,211,252,0.14)_35%,transparent_52%,rgba(216,180,254,0.16)_70%,rgba(255,255,255,0.18))]" />
          <div className="absolute inset-x-5 top-3 h-px bg-gradient-to-r from-transparent via-white/55 to-transparent" />
          <div className="absolute inset-y-6 right-3 w-px bg-gradient-to-b from-transparent via-cyan-100/40 to-transparent" />
        </div>
      )}
      {cardFilter === 'cosmic' && (
        <div className="pointer-events-none absolute inset-0 z-20 rounded-xl mix-blend-screen">
          <div className="absolute inset-0 opacity-75" style={{ background: 'radial-gradient(circle at 18% 20%, rgba(129,140,248,0.44), transparent 34%), radial-gradient(circle at 82% 16%, rgba(236,72,153,0.30), transparent 32%), radial-gradient(circle at 52% 80%, rgba(56,189,248,0.28), transparent 36%)' }} />
          {[
            ['14%', '18%', 'h-4 w-4 opacity-90'],
            ['34%', '52%', 'h-2.5 w-2.5 opacity-75'],
            ['76%', '30%', 'h-3.5 w-3.5 opacity-85'],
            ['88%', '70%', 'h-2 w-2 opacity-70'],
            ['52%', '74%', 'h-3 w-3 opacity-80'],
          ].map(([left, top, size], index) => (
            <span key={index} className={`absolute ${size} -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[1px] bg-white shadow-[0_0_8px_rgba(255,255,255,0.95),0_0_16px_rgba(125,211,252,0.65)]`} style={{ left, top }} />
          ))}
        </div>
      )}
      {cardFilter === 'pixel' && (
        <div className="pointer-events-none absolute inset-0 z-[2] rounded-xl opacity-55 mix-blend-screen">
          <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.14) 1px, transparent 1px), linear-gradient(0deg, rgba(255,255,255,0.10) 1px, transparent 1px)', backgroundSize: '14px 14px' }} />
          <div className="absolute left-[12%] top-[18%] h-3 w-3 bg-cyan-200 shadow-[0_0_10px_rgba(125,211,252,0.85)]" />
          <div className="absolute right-[18%] top-[34%] h-2 w-2 bg-fuchsia-200 shadow-[0_0_9px_rgba(244,114,182,0.8)]" />
          <div className="absolute bottom-[18%] left-[44%] h-2.5 w-2.5 bg-lime-200 shadow-[0_0_9px_rgba(190,242,100,0.75)]" />
        </div>
      )}
      {cardFilter === 'comic' && (
        <div className="pointer-events-none absolute inset-0 z-[2] rounded-xl opacity-70">
          <div className="absolute inset-[2px] rounded-[0.7rem] border-2 border-white/18 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.25)]" />
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-45 mix-blend-screen" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.32) 0 1px, transparent 1.5px)', backgroundSize: '9px 9px' }} />
          <div className="absolute inset-x-0 bottom-0 h-16 opacity-20" style={{ background: 'repeating-linear-gradient(-18deg, transparent 0 8px, rgba(255,255,255,0.32) 8px 9px, transparent 9px 15px)' }} />
        </div>
      )}
      {cardFilter === 'neon' && (
        <div className="pointer-events-none absolute inset-0 z-[2] rounded-xl opacity-60 mix-blend-screen">
          <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(34,211,238,0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(217,70,239,0.18) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
          <div className="absolute inset-x-4 top-4 h-px bg-gradient-to-r from-transparent via-cyan-200/70 to-transparent shadow-[0_0_12px_rgba(34,211,238,0.8)]" />
          <div className="absolute inset-y-4 left-5 w-px bg-gradient-to-b from-transparent via-fuchsia-200/55 to-transparent shadow-[0_0_12px_rgba(217,70,239,0.7)]" />
        </div>
      )}
      {cardFilter === 'prism' && (
        <div className="pointer-events-none absolute inset-[1px] z-20 rounded-xl opacity-[0.42] mix-blend-screen" style={{ background: 'linear-gradient(130deg, transparent 0 13%, rgba(255,255,255,0.18) 16%, rgba(244,114,182,0.10) 24%, transparent 36%), linear-gradient(42deg, transparent 0 24%, rgba(34,211,238,0.13) 31%, rgba(167,139,250,0.10) 40%, transparent 56%), linear-gradient(158deg, transparent 0 48%, rgba(250,204,21,0.10) 58%, transparent 76%)' }} />
      )}
      {cardFilter === 'ember' && (
        <div className="pointer-events-none absolute inset-0 z-20 rounded-xl opacity-50 mix-blend-screen" style={{ background: 'radial-gradient(circle at 18% 88%, rgba(251,146,60,0.34), transparent 34%), radial-gradient(circle at 82% 22%, rgba(248,113,113,0.20), transparent 30%), linear-gradient(22deg, transparent 18%, rgba(255,237,213,0.10) 44%, transparent 68%)' }} />
      )}
      {cardFilter === 'shadow' && (
        <div className="pointer-events-none absolute inset-0 z-20 rounded-xl bg-[radial-gradient(circle_at_center,transparent_34%,rgba(0,0,0,0.46)_100%)] opacity-70" />
      )}
      <div
        className="flex-1 w-full min-w-0 p-3.5 bg-[#222] relative z-10 border-t border-white/10 flex flex-col"
        style={{
          background: applyBlackEffect
            ? `linear-gradient(180deg, color-mix(in srgb, #0b0b0d 62%, ${theme.secondary}) 0%, color-mix(in srgb, #131831 55%, ${theme.primary}) 100%)`
            : hasDualGameTheme
              ? dualThemeContentBackground!
              : `linear-gradient(180deg, color-mix(in srgb, ${theme.secondary} 34%, #141414) 0%, color-mix(in srgb, ${theme.primary} 28%, #121212) 100%)`,
          borderTopColor: hasDualGameTheme
            ? `color-mix(in srgb, ${theme.accent} 42%, ${secondaryTheme!.accent})`
            : `${theme.accent}66`,
        }}
      >
        <div className="flex flex-1 flex-col gap-3">
          <div
            className="relative min-h-[162px] sm:min-h-[178px] rounded-[1.5rem] border border-white/10 bg-black/40 p-3 shadow-inner overflow-hidden"
            style={{
              background: spritePanelBackground,
              backgroundClip: 'padding-box',
            }}
          >
            <div className="absolute left-2 top-2 z-30 flex gap-1.5">
              <Button
                variant="secondary"
                size="icon"
                onClick={onEdit}
                className="h-7 w-7 rounded-full border border-white/10 bg-black/55 text-white shadow-lg backdrop-blur-md hover:bg-white hover:text-black"
                title="Modifica"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={onToggleEvolved}
                className={cn(
                  "h-7 w-7 rounded-full border text-white shadow-[0_3px_12px_rgba(0,0,0,0.55)] ring-1 ring-black/35 backdrop-blur-md",
                  isEvolved ? "border-white/45 bg-emerald-700 hover:bg-emerald-800" : "border-white/25 bg-black/70 hover:bg-emerald-700"
                )}
                title={isEvolved ? 'Segna come non evoluto' : 'Segna come evoluto'}
              >
                <ArrowUpCircle className="h-3.5 w-3.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-7 w-7 rounded-full border border-white/10 bg-black/55 text-white shadow-lg backdrop-blur-md hover:bg-destructive"
                    title="Elimina"
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
              <div className="absolute right-2 top-2 z-30 flex w-9 flex-col items-center gap-1">
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-white/55 bg-emerald-700 text-white shadow-[0_3px_12px_rgba(0,0,0,0.6),0_0_0_1px_rgba(0,0,0,0.45)] ring-1 ring-emerald-200/45 backdrop-blur-md"
                  title="Pokemon evoluto"
                >
                  <ArrowUpCircle className="h-3.5 w-3.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]" />
                </div>
                {evolvedFromSpriteUrl && (
                  <>
                    <svg className="absolute h-0 w-0" aria-hidden="true" focusable="false">
                      <filter id={evolvedSpriteOutlineId} x="-24%" y="-24%" width="148%" height="148%" colorInterpolationFilters="sRGB">
                        <feMorphology in="SourceAlpha" operator="dilate" radius="0.5" result="outline" />
                        <feFlood floodColor="#050505" result="outlineColor" />
                        <feComposite in="outlineColor" in2="outline" operator="in" result="outlineShape" />
                        <feMerge>
                          <feMergeNode in="outlineShape" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </svg>
                    <span className="inline-flex h-[2.58rem] w-[2.58rem] items-center justify-center">
                      <img
                        src={toLocalPokemonSpriteUrl(evolvedFromSpriteUrl)}
                        alt="Evoluto da"
                        className="max-w-none object-contain"
                        style={{
                          height: getEvolvedFromSpriteSize(evolvedFromName, !showEncounters),
                          width: getEvolvedFromSpriteSize(evolvedFromName, !showEncounters),
                          filter: `url(#${evolvedSpriteOutlineId}) drop-shadow(0 4px 8px rgba(0,0,0,0.85))`,
                        }}
                        title={`Evoluto da ${evolvedFromName || 'pokemon precedente'}`}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          handlePokemonSpriteError(e.currentTarget);
                        }}
                      />
                    </span>
                  </>
                )}
              </div>
            )}
            <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_0%,rgba(255,255,255,0.04)_45%,transparent_70%)]" />
            <div className="relative flex items-center justify-center">
              <div className="relative h-[7.3rem] w-[7.3rem] sm:h-[8.4rem] sm:w-[8.4rem]">
                <svg className="absolute h-0 w-0" aria-hidden="true" focusable="false">
                  <filter id={mainSpriteOutlineId} x="-24%" y="-24%" width="148%" height="148%" colorInterpolationFilters="sRGB">
                    <feMorphology in="SourceAlpha" operator="dilate" radius="0.5" result="outline" />
                    <feFlood floodColor="#050505" result="outlineColor" />
                    <feComposite in="outlineColor" in2="outline" operator="in" result="outlineShape" />
                    <feMerge>
                      <feMergeNode in="outlineShape" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </svg>
                <img
                  key={spriteUrl}
                  src={toLocalPokemonSpriteUrl(spriteUrl)}
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  alt={entry.pokemon_name}
                  className={cn(
                    "relative z-10 h-full w-full object-contain pokemon-sprite transition-all duration-300",
                    entry.is_unobtainable ? "grayscale brightness-105" : ""
                  )}
                  style={{
                    imageRendering: 'auto',
                    filter: `url(#${mainSpriteOutlineId}) ${isFail
                      ? 'drop-shadow(0 0 12px rgba(255,255,255,0.25))'
                      : 'drop-shadow(0 8px 16px rgba(0,0,0,0.75))'}`,
                  }}
                  onError={(e) => {
                    handlePokemonSpriteError(e.currentTarget);
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3">
          <div className="space-y-2">
            <div className="mt-1.5 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 max-w-full items-center gap-2">
                  {pokeball && (
                    <img
                      src={pokeball.sprite}
                      loading="lazy"
                      decoding="async"
                      className="h-[1.6rem] w-[1.6rem] flex-shrink-0 object-contain drop-shadow"
                      alt={pokeball.name}
                      title={pokeball.name}
                    />
                  )}
                  <span className="flex min-w-0 items-center gap-2">
                    <h3 className="min-w-0 truncate pb-0.5 text-[1.18rem] font-black leading-tight text-white sm:text-[1.26rem]">
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
                          className="h-[1.1rem] w-[1.1rem] flex-shrink-0 text-blue-400"
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
                          className="h-[1.1rem] w-[1.1rem] flex-shrink-0 text-pink-400"
                        >
                          <path d="M12 15v7" />
                          <path d="M9 19h6" />
                          <circle cx="12" cy="9" r="6" />
                        </svg>
                      )
                    )}
                  </span>
                  {entry.has_shiny_charm && (
                    <img
                      src="/img/items/shiny-charm.png"
                      loading="lazy"
                      decoding="async"
                      className="ml-auto h-7 w-7 flex-shrink-0 object-contain animate-pulse drop-shadow-[0_0_10px_rgba(234,179,8,0.72)] sm:hidden"
                      alt="Shiny Charm"
                      title="Shiny Charm Active"
                    />
                  )}
                </div>
              </div>

              {(GAME_LOGOS[entry.game] || entry.has_shiny_charm) && (
                <div className="flex w-full shrink-0 items-center justify-center gap-2 sm:w-auto sm:max-w-[220px] sm:justify-end">
                  {GAME_LOGOS[entry.game] && (
                    <>
                      <img
                        src={GAME_LOGOS[entry.game]}
                        loading="lazy"
                        decoding="async"
                        alt={entry.game}
                        className="h-10 w-auto max-w-[82px] object-contain brightness-110 drop-shadow-lg sm:h-11 sm:max-w-[92px]"
                      />
                      {(entry as any).secondary_game && GAME_LOGOS[(entry as any).secondary_game] && (
                        <>
                          <ArrowRight className="h-4 w-4 flex-shrink-0 text-white/60" />
                          <img
                            src={GAME_LOGOS[(entry as any).secondary_game]}
                            loading="lazy"
                            decoding="async"
                            alt={(entry as any).secondary_game}
                            className="h-10 w-auto max-w-[82px] object-contain brightness-110 drop-shadow-lg sm:h-11 sm:max-w-[92px]"
                          />
                        </>
                      )}
                    </>
                  )}
                  {entry.has_shiny_charm && (
                    <img
                      src="/img/items/shiny-charm.png"
                      loading="lazy"
                      decoding="async"
                      className="hidden h-8 w-8 flex-shrink-0 object-contain animate-pulse drop-shadow-[0_0_10px_rgba(234,179,8,0.72)] sm:block"
                      alt="Shiny Charm"
                      title="Shiny Charm Active"
                    />
                  )}
                </div>
              )}
            </div>

            {method && (
              <div className="flex justify-center px-2">
                <div
                  className="inline-flex max-w-full items-center justify-center gap-1.5 truncate rounded-full border px-3.5 py-1.5 text-center text-[10px] font-black uppercase tracking-[0.12em] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                  style={{
                    color: isEvent ? 'rgb(232, 121, 249)' : theme.accent,
                    borderColor: isEvent ? 'rgba(232, 121, 249, 0.45)' : `${theme.accent}66`,
                    background: isEvent ? 'rgba(232, 121, 249, 0.1)' : `${theme.accent}14`,
                  }}
                >
                  {isEvent && <Sparkles className="h-3 w-3 flex-shrink-0" />}
                  <span className="truncate">
                    {isEvent ? 'Distribution / Event' : method.name === 'Random Encounter' && (entry.method || '').toString().trim().toLowerCase().includes('safari')
                      ? 'Random Encounter (Safari Zone)'
                      : method.name}
                  </span>
                </div>
              </div>
            )}

            <div
              className="h-px w-full"
              style={{
                background: hasDualGameTheme
                  ? `linear-gradient(90deg, transparent, color-mix(in srgb, ${theme.accent} 48%, ${secondaryTheme!.accent}), transparent)`
                  : `linear-gradient(90deg, transparent, ${theme.accent}80, transparent)`,
              }}
            />
          </div>

          {isEvent ? null : (
            <div className="flex flex-1 flex-col gap-2.5">
              {showEncounters ? (
                <div
                  className="rounded-2xl px-2.5 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                  style={{
                    background: hasDualGameTheme
                      ? `linear-gradient(145deg, color-mix(in srgb, ${theme.primary} 30%, rgba(14,14,14,0.96)), color-mix(in srgb, ${secondaryTheme!.secondary} 30%, rgba(10,10,10,0.94)))`
                      : `linear-gradient(145deg, color-mix(in srgb, ${theme.primary} 46%, #101010), color-mix(in srgb, ${theme.secondary} 38%, #0f0f0f))`,
                  }}
                >
                  <div className="flex items-center gap-1.5 px-1">
                    <Crosshair className="h-3 w-3 text-white/70" />
                    <span className="truncate text-[8px] font-black uppercase tracking-[0.14em] text-white/[0.65] sm:text-[9px]">
                      {encountersLabel}
                    </span>
                  </div>
                  <div className={cn(
                    "mt-2 grid items-stretch gap-2.5",
                    (entry as any).show_seen ? "grid-cols-[minmax(0,1fr)_72px]" : "grid-cols-1"
                  )}>
                    <div className="relative flex min-h-[72px] min-w-0 items-center justify-center overflow-hidden rounded-xl bg-black/30 px-3.5 py-2.5">
                      {isBreeding && (
                        <img
                          src={POKEMON_EGG_ICON}
                          alt="Pokemon egg"
                          className="pointer-events-none absolute left-1.5 top-1/2 h-[4.25rem] w-[4.25rem] -translate-y-1/2 object-contain opacity-95 drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]"
                          onError={(e) => ((e.currentTarget as HTMLImageElement).src = '/placeholder.svg')}
                        />
                      )}
                      <div className="relative z-10 flex max-w-full items-baseline justify-center text-center">
                        <span
                          className="min-w-0 truncate text-[2rem] font-black leading-none text-white tabular-nums sm:text-[1.86rem]"
                          style={{
                            textShadow: '1px 0 0 #050505, -1px 0 0 #050505, 0 1px 0 #050505, 0 -1px 0 #050505, 0 2px 5px rgba(0,0,0,0.9)',
                          }}
                        >
                          {entry.attempts && entry.attempts > 0 ? entry.attempts.toLocaleString() : '-'}
                        </span>
                      </div>
                    </div>
                    {(entry as any).show_seen && (
                      <div className="flex min-h-[72px] flex-col items-center justify-center rounded-xl bg-black/25 px-2 py-2 text-center">
                        <span className="text-[8px] font-black uppercase tracking-[0.12em] text-white/45">
                          Seen
                        </span>
                        <span
                          className="mt-1 max-w-full truncate text-[1rem] font-black leading-none text-white tabular-nums"
                          style={{
                            textShadow: '1px 0 0 #050505, -1px 0 0 #050505, 0 1px 0 #050505, 0 -1px 0 #050505, 0 2px 4px rgba(0,0,0,0.85)',
                          }}
                        >
                          {(entry as any).seen_count ?? 0}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 grid min-h-[64px] grid-rows-2 overflow-hidden px-1">
                    <div className="grid min-w-0 grid-cols-[64px_minmax(0,1fr)] items-center gap-2">
                      {entry.phase_number ? (
                        <>
                          <span className="text-[10px] font-black uppercase tracking-[0.1em] text-white/55 sm:text-[11px]">Phase</span>
                          <span
                            className="min-w-0 truncate whitespace-nowrap text-[12px] font-black uppercase tracking-[0.08em] sm:text-[13px]"
                            style={{
                              color: hasDualGameTheme ? `color-mix(in srgb, ${theme.accent} 55%, ${secondaryTheme!.accent})` : theme.accent,
                            }}
                          >
                            #{entry.phase_number}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="invisible text-[10px] font-black uppercase tracking-[0.1em] sm:text-[11px]">Phase</span>
                          <span className="invisible text-[12px] font-bold sm:text-[13px]">#</span>
                        </>
                      )}
                    </div>
                    <div className="grid min-w-0 grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-2 border-t border-white/10 pt-1.5">
                      {entry.show_total ? (
                        <>
                          <span className="text-[10px] font-black uppercase tracking-[0.1em] text-white/55 sm:text-[11px]">Total</span>
                          <span className="min-w-0 truncate text-[12px] font-black tabular-nums text-white/95 sm:text-[13px]">
                            {entry.total_value && entry.total_value > 0
                              ? entry.total_value.toLocaleString()
                              : (entry.attempts && entry.attempts > 0 ? entry.attempts.toLocaleString() : '-')}
                          </span>
                          {entry.show_total_seen ? (
                            <span className="inline-flex min-w-[88px] flex-col items-center justify-center rounded-md bg-white/[0.08] px-2.5 py-1.5 text-center ring-1 ring-white/10">
                              <span className="text-[8px] font-black uppercase leading-none tracking-[0.1em] text-white/50 sm:text-[9px]">Total Seen</span>
                              <span className="mt-1 text-[12px] font-black leading-none tabular-nums text-white/95 sm:text-[13px]">
                                {(entry.total_seen_count ?? 0).toLocaleString()}
                              </span>
                            </span>
                          ) : (
                            <span className="invisible inline-flex min-w-[88px] flex-col items-center justify-center rounded-md px-2.5 py-1.5 text-[9px] font-black">
                              Total Seen
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          <span className="invisible text-[10px] font-black uppercase tracking-[0.1em] sm:text-[11px]">Total</span>
                          <span className="invisible text-[12px] font-bold sm:text-[13px]">-</span>
                          <span className="invisible inline-flex min-w-[88px] flex-col items-center justify-center rounded-md px-2.5 py-1.5 text-[9px] font-black">
                            Total Seen
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : (entry as any).show_seen ? (
                <div
                  className="relative flex min-h-[184px] items-center overflow-hidden rounded-xl px-3 py-2.5"
                  style={{
                    background: hasDualGameTheme
                      ? `linear-gradient(145deg, color-mix(in srgb, ${theme.primary} 30%, rgba(14,14,14,0.96)), color-mix(in srgb, ${secondaryTheme!.secondary} 30%, rgba(10,10,10,0.94)))`
                      : `linear-gradient(145deg, color-mix(in srgb, ${theme.primary} 46%, #101010), color-mix(in srgb, ${theme.secondary} 38%, #0f0f0f))`,
                  }}
                >
                  <div className="flex w-full items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5">
                      <Crosshair className="h-3.5 w-3.5 text-white/[0.65]" />
                      <span className="text-[8px] font-black uppercase tracking-[0.16em] text-white/[0.55] sm:text-[9px]">
                        Seen
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[1.6rem] font-black leading-none text-white tabular-nums">
                        {(entry as any).seen_count ?? 0}
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/[0.45]">seen</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="min-h-[184px] shrink-0" aria-hidden="true" />
              )}

              <div
                className="mt-auto rounded-2xl px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                style={{
                  background: hasDualGameTheme
                    ? `linear-gradient(145deg, color-mix(in srgb, ${theme.secondary} 34%, rgba(16,16,16,0.96)), color-mix(in srgb, ${secondaryTheme!.primary} 26%, rgba(12,12,12,0.94)))`
                    : `linear-gradient(145deg, color-mix(in srgb, ${theme.secondary} 48%, #101010), color-mix(in srgb, ${theme.primary} 42%, #0f0f0f))`,
                }}
              >
                <div className="mb-2 flex items-center gap-1.5">
                  <Calendar className="h-3 w-3 text-white/70" />
                  <span className="text-[10px] font-black uppercase tracking-[0.12em] text-white/80">Hunt Dates</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="min-w-0 text-center">
                    <span className="block text-[9px] font-black uppercase tracking-wider text-white/75">Start</span>
                    <span className="block truncate text-center text-[11px] font-black tabular-nums text-white sm:text-xs">
                      {entry.hunt_start_date ? formatDate(entry.hunt_start_date) : '--'}
                    </span>
                  </div>
                  <div className="min-w-0 border-l border-white/10 pl-3 text-center">
                    <span className="block text-[9px] font-black uppercase tracking-wider text-white/75">Caught</span>
                    <span className="block truncate text-center text-[11px] font-black tabular-nums text-white sm:text-xs">
                      {formatDate(entry.caught_date)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {hasBottomMeta && (
            <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
              {(entry.is_fail || entry.is_unobtainable) && (
                <>
                  {entry.is_fail && (
                    <div className="relative overflow-hidden rounded-full border border-red-500/70 bg-red-900/55 px-2.5 py-1 shadow-[0_0_14px_rgba(239,68,68,0.28)] inset-shadow-sm">
                      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_45%,rgba(239,68,68,0.2)_50%,transparent_55%)] bg-[length:200%_200%] animate-[shimmer_3s_infinite]" />
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-red-400 drop-shadow-sm">FAIL</span>
                      </div>
                    </div>
                  )}
                  {entry.is_unobtainable && (
                    <div className="relative overflow-hidden rounded-full border border-amber-500/70 bg-amber-900/55 px-2.5 py-1 shadow-[0_0_14px_rgba(245,158,11,0.28)] inset-shadow-sm">
                      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_45%,rgba(245,158,11,0.2)_50%,transparent_55%)] bg-[length:200%_200%] animate-[shimmer_3s_infinite]" />
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.8)]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-amber-300 drop-shadow-sm">UNCATCHABLE</span>
                      </div>
                    </div>
                  )}
                </>
              )}
              {isGigamax && (
                <div className="inline-flex items-center rounded-full bg-black/20 px-1.5 py-1" title="Gigamax">
                  <img
                    src={GIGAMAX_ICON}
                    loading="lazy"
                    decoding="async"
                    className="h-7 w-7 object-contain drop-shadow-[0_0_8px_rgba(244,114,182,0.5)]"
                    alt="Gigamax"
                  />
                </div>
              )}
              {isLegendsArceus && (
                <div className="inline-flex items-center rounded-full bg-black/20 px-1.5 py-1" title="Alpha Pokemon">
                  <img
                    src="https://archives.bulbagarden.net/media/upload/4/4b/Alpha_icon.png"
                    loading="lazy"
                    decoding="async"
                    className="h-7 w-7 object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.35)]"
                    alt="Alpha Pokemon"
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
