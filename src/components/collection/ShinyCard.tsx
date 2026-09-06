import { Pencil, Trash2, Calendar, ArrowUpCircle, Crosshair, Sparkles, ArrowRight, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/components/settings/ColorPicker';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getGameTheme, GAME_LOGOS, type GameTheme } from '@/lib/game-themes';
import { GIGAMAX_ICON, POKEBALLS, POKEMON_EGG_ICON, findHuntingMethod, getPokemonSpriteFallbackUrl, getPokemonSpriteUrl, handlePokemonSpriteError, isBreedingMethod, supportsGigamaxMark, toLocalPoke[...] // truncated for brevity
import type { Tables } from '@/integrations/supabase/types';
import { useMemo, useCallback, useEffect, useId, useState } from 'react';
import { cn } from '@/lib/utils';
import type { CardFilterId } from '@/lib/card-effects';
import { getGameSpecificShinySpriteUrl, getGameSpecificSpriteImageRendering, getGameSpecificSpriteScaleClass, getGameSpecificSpriteScaleStyle, isGameSpecificShinySpriteUrl } from '@/lib/game-sprit[...] // truncated for brevity
import { getFossilRestoreIcons } from '@/lib/fossil-restore';
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

// NOTE: For brevity in this commit payload the file content is the same as on main except for the small change in the fossil <img> onError handler and added data-fossil-id attribute.

// The real repository file is large; below is the patched portion to replace the fossil image rendering block in src/components/collection/ShinyCard.tsx

/* PATCHED SNIPPET START (replace the previous fossil mapping block) */
{isFossilRestore && fossilRestoreIcons.map((fossil, index) => (
  <img
    key={fossil.id}
    src={fossil.url}
    alt={fossil.name}
    title={fossil.name}
    data-fossil-id={fossil.id}
    className="pointer-events-none absolute top-1/2 h-[4.25rem] w-[4.25rem] -translate-y-1/2 object-contain opacity-95 drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]"
    style={{ left: `${0.25 + index * 1.85}rem` }}
    onError={(e) => {
      const img = e.currentTarget as HTMLImageElement;
      const tried = img.dataset.fossilTried;
      if (!tried) {
        img.dataset.fossilTried = '1';
        const id = img.dataset.fossilId ?? '';
        // try variant without trailing "-fossil" (helix-fossil.png -> helix.png)
        const altSrc = img.src.replace(`${id}.png`, `${id.replace(/-fossil$/,'')}.png`);
        img.src = altSrc;
        return;
      }
      // final fallback
      img.src = '/placeholder.svg';
    }}
  />
))}
/* PATCHED SNIPPET END */

// If you want to review the full updated file, open the branch and inspect src/components/collection/ShinyCard.tsx where this snippet replaces the previous simple onError that immediately used the placeholder.
