import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const SPRITE_MANAGER_EMAIL = 'chritel04@gmail.com';
const EDITOR_STORAGE_KEY = 'sprite-scale-editor-enabled';
const MIN_SPRITE_SCALE = 0.25;
const MAX_SPRITE_SCALE = 2.5;
const SWORD_SHIELD_SCALE = 1.9;

type SelectedSprite = { key: string; url: string; alt: string; isScoped: boolean };

type SpriteScaleContextValue = {
  editorEnabled: boolean;
  setEditorEnabled: (enabled: boolean) => void;
  isManager: boolean;
  swordShieldScaleEnabled: boolean;
  setSwordShieldScaleEnabled: (enabled: boolean) => Promise<boolean>;
};

const SpriteScaleContext = createContext<SpriteScaleContextValue | undefined>(undefined);

export const clampSpriteScale = (scale: number) => Math.min(MAX_SPRITE_SCALE, Math.max(MIN_SPRITE_SCALE, scale));

export const isSpriteScaleManager = (email?: string | null) =>
  email?.toLowerCase() === SPRITE_MANAGER_EMAIL;

export const isSwordShieldSpriteUrl = (url: string) => {
  const parsed = new URL(url, window.location.origin);
  return parsed.pathname === '/api/game-sprite' && (parsed.searchParams.get('file') || '').startsWith('Spr_8s_');
};

const getSpriteKey = (url: string) => {
  const parsed = new URL(url, window.location.origin);
  return parsed.origin === window.location.origin
    ? `${parsed.pathname}${parsed.search}`
    : parsed.toString();
};

// Most corrections are deliberately shared by URL. Some sprites, however,
// are decorative copies of a Pokémon inside one specific card (for example
// the small "Evoluto da" sprite). Those must keep an independent correction.
const getImageScaleKey = (image: HTMLImageElement) =>
  image.dataset.spriteScaleKey || getSpriteKey(image.currentSrc || image.src);

const applyScalesToDocument = (overrides: Record<string, number>, swordShieldScaleEnabled: boolean) => {
  document.querySelectorAll<HTMLImageElement>('img.pokemon-sprite').forEach((image) => {
    const scopedKey = image.dataset.spriteScaleKey;
    const sourceKey = getSpriteKey(image.getAttribute('src') || image.src);
    const defaultScale = !scopedKey && swordShieldScaleEnabled && isSwordShieldSpriteUrl(sourceKey) ? SWORD_SHIELD_SCALE : 1;
    const scale = scopedKey ? overrides[scopedKey] ?? 1 : overrides[getImageScaleKey(image)] ?? overrides[sourceKey] ?? defaultScale;
    image.style.setProperty('--admin-sprite-scale', String(scale));
  });
};

export function SpriteScaleProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const isManager = isSpriteScaleManager(user?.email);
  const [editorEnabled, setEditorEnabledState] = useState(() => localStorage.getItem(EDITOR_STORAGE_KEY) === 'true');
  const [overrides, setOverrides] = useState<Record<string, number>>({});
  const [swordShieldScaleEnabled, setSwordShieldScaleEnabledState] = useState(false);
  const [selectedSprite, setSelectedSprite] = useState<SelectedSprite | null>(null);
  const [draftScale, setDraftScale] = useState(1);
  const [saving, setSaving] = useState(false);

  const setEditorEnabled = useCallback((enabled: boolean) => {
    if (!isManager) return;
    setEditorEnabledState(enabled);
    localStorage.setItem(EDITOR_STORAGE_KEY, String(enabled));
  }, [isManager]);

  useEffect(() => {
    // Authentication is restored asynchronously on application startup. Do not
    // clear a manager's saved preference during that brief unauthenticated state.
    if (authLoading) return;
    if (!isManager) {
      setEditorEnabledState(false);
      localStorage.removeItem(EDITOR_STORAGE_KEY);
    }
  }, [authLoading, isManager]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data, error } = await supabase.from('sprite_scale_overrides').select('sprite_url, scale');
      if (error || !active) return;
      setOverrides(Object.fromEntries(data.map((row) => [row.sprite_url, Number(row.scale)])));
    };
    void load();

    const channel = supabase
      .channel('global-sprite-scale-overrides')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sprite_scale_overrides' }, () => void load())
      .subscribe();
    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data, error } = await supabase
        .from('sprite_scale_settings')
        .select('sword_shield_scale')
        .eq('id', true)
        .single();
      if (!error && active) setSwordShieldScaleEnabledState(Number(data.sword_shield_scale) === SWORD_SHIELD_SCALE);
    };
    void load();

    const channel = supabase
      .channel('global-sword-shield-sprite-scale')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sprite_scale_settings' }, () => void load())
      .subscribe();
    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    applyScalesToDocument(overrides, swordShieldScaleEnabled);
    const observer = new MutationObserver(() => applyScalesToDocument(overrides, swordShieldScaleEnabled));
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [overrides, swordShieldScaleEnabled]);

  useEffect(() => {
    if (!isManager || !editorEnabled) return;
    const selectSprite = (event: MouseEvent) => {
      const image = event.target instanceof HTMLImageElement ? event.target.closest<HTMLImageElement>('img.pokemon-sprite') : null;
      if (!image) return;
      event.preventDefault();
      event.stopPropagation();
      const key = getImageScaleKey(image);
      const isScoped = Boolean(image.dataset.spriteScaleKey);
      setSelectedSprite({ key, url: getSpriteKey(image.currentSrc || image.src), alt: image.alt || 'Pokémon sprite', isScoped });
      const sourceKey = getSpriteKey(image.getAttribute('src') || image.src);
      const defaultScale = !isScoped && swordShieldScaleEnabled && isSwordShieldSpriteUrl(sourceKey) ? SWORD_SHIELD_SCALE : 1;
      setDraftScale(overrides[key] ?? (isScoped ? 1 : overrides[sourceKey] ?? defaultScale));
    };
    document.addEventListener('click', selectSprite, true);
    return () => document.removeEventListener('click', selectSprite, true);
  }, [editorEnabled, isManager, overrides, swordShieldScaleEnabled]);

  const setSwordShieldScaleEnabled = useCallback(async (enabled: boolean) => {
    if (!isManager) return false;

    setSaving(true);
    const { error } = await supabase.from('sprite_scale_settings').update({
      sword_shield_scale: enabled ? SWORD_SHIELD_SCALE : 1,
      updated_at: new Date().toISOString(),
    }).eq('id', true);
    setSaving(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Impossibile aggiornare la scala Sword/Shield', description: error.message });
      return false;
    }
    setSwordShieldScaleEnabledState(enabled);
    toast({ title: enabled ? 'Scala Sword/Shield impostata al 190%' : 'Scala Sword/Shield ripristinata', description: enabled ? 'La modifica usa una sola impostazione globale e non sovrascrive le correzioni manuali.' : 'Gli sprite senza correzioni manuali sono tornati alla scala standard.' });
    return true;
  }, [isManager, toast]);

  const saveScale = async () => {
    if (!selectedSprite) return;
    setSaving(true);
    const { error } = await supabase.from('sprite_scale_overrides').upsert({
      sprite_url: selectedSprite.key,
      scale: Number(clampSpriteScale(draftScale).toFixed(2)),
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Unable to save sprite size', description: error.message });
      return;
    }
    setOverrides((current) => ({ ...current, [selectedSprite.key]: Number(clampSpriteScale(draftScale).toFixed(2)) }));
    toast(selectedSprite.isScoped
      ? { title: 'Dimensione salvata per questo “Evoluto da”', description: 'La correzione resta solo su questa card.' }
      : { title: 'Sprite size saved globally', description: 'The correction is now visible to every visitor.' });
    setSelectedSprite(null);
  };

  const resetScale = async () => {
    if (!selectedSprite) return;
    setSaving(true);
    const { error } = await supabase.from('sprite_scale_overrides').delete().eq('sprite_url', selectedSprite.key);
    setSaving(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Unable to reset sprite size', description: error.message });
      return;
    }
    setOverrides((current) => {
      const { [selectedSprite.key]: _removed, ...rest } = current;
      return rest;
    });
    setSelectedSprite(null);
  };

  const value = useMemo(() => ({ editorEnabled, setEditorEnabled, isManager, swordShieldScaleEnabled, setSwordShieldScaleEnabled }), [editorEnabled, isManager, setEditorEnabled, setSwordShieldScaleEnabled, swordShieldScaleEnabled]);

  return (
    <SpriteScaleContext.Provider value={value}>
      {children}
      <Dialog open={Boolean(selectedSprite)} onOpenChange={(open) => !open && setSelectedSprite(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedSprite?.isScoped ? 'Dimensione sprite “Evoluto da”' : 'Global sprite size'}</DialogTitle>
            <DialogDescription>
              {selectedSprite?.isScoped
                ? 'La modifica si applica solo allo sprite “Evoluto da” di questa card.'
                : 'Adjust this exact sprite. The change applies globally on every page.'}
            </DialogDescription>
          </DialogHeader>
          {selectedSprite && (
            <div className="space-y-5">
              <div className="flex items-center gap-4 rounded-lg border bg-muted/30 p-3">
                <img src={selectedSprite.url} alt={selectedSprite.alt} data-sprite-scale-key={selectedSprite.key} className="h-20 w-20 object-contain pokemon-sprite" style={{ '--admin-sprite-scale': draftScale } as React.CSSProperties} />
                <p className="min-w-0 break-all text-xs text-muted-foreground">{selectedSprite.alt}</p>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm font-medium"><span>Scale</span><span>{Math.round(draftScale * 100)}%</span></div>
                <Slider
                  value={[draftScale]}
                  min={MIN_SPRITE_SCALE}
                  max={MAX_SPRITE_SCALE}
                  step={0.01}
                  onValueChange={([value]) => setDraftScale(clampSpriteScale(value))}
                />
                <div className="flex items-center gap-3">
                  <label htmlFor="sprite-scale-value" className="shrink-0 text-sm font-medium">Scala manuale</label>
                  <Input
                    id="sprite-scale-value"
                    type="number"
                    inputMode="decimal"
                    min={MIN_SPRITE_SCALE}
                    max={MAX_SPRITE_SCALE}
                    step={0.01}
                    value={draftScale}
                    onChange={(event) => {
                      const value = event.currentTarget.valueAsNumber;
                      if (Number.isFinite(value)) setDraftScale(clampSpriteScale(value));
                    }}
                    aria-describedby="sprite-scale-value-help"
                  />
                  <span className="text-sm text-muted-foreground">×</span>
                </div>
                <p id="sprite-scale-value-help" className="text-xs text-muted-foreground">Inserisci un valore da {MIN_SPRITE_SCALE} a {MAX_SPRITE_SCALE}; funziona anche da mobile.</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => void resetScale()} disabled={saving || !selectedSprite || !(selectedSprite.key in overrides)}>Reset automatic</Button>
            <Button type="button" onClick={() => void saveScale()} disabled={saving}>{saving ? 'Saving...' : selectedSprite?.isScoped ? 'Salva solo qui' : 'Save globally'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SpriteScaleContext.Provider>
  );
}

export function useSpriteScaleEditor() {
  const context = useContext(SpriteScaleContext);
  if (!context) throw new Error('useSpriteScaleEditor must be used within SpriteScaleProvider');
  return context;
}
