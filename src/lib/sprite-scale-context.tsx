import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const SPRITE_MANAGER_EMAIL = 'chritel04@gmail.com';
const EDITOR_STORAGE_KEY = 'sprite-scale-editor-enabled';

type SelectedSprite = { url: string; alt: string };

type SpriteScaleContextValue = {
  editorEnabled: boolean;
  setEditorEnabled: (enabled: boolean) => void;
  isManager: boolean;
};

const SpriteScaleContext = createContext<SpriteScaleContextValue | undefined>(undefined);

const getSpriteKey = (url: string) => {
  const parsed = new URL(url, window.location.origin);
  return parsed.origin === window.location.origin
    ? `${parsed.pathname}${parsed.search}`
    : parsed.toString();
};

const applyScalesToDocument = (overrides: Record<string, number>) => {
  document.querySelectorAll<HTMLImageElement>('img.pokemon-sprite').forEach((image) => {
    const scale = overrides[getSpriteKey(image.currentSrc || image.src)] ?? overrides[getSpriteKey(image.getAttribute('src') || image.src)] ?? 1;
    image.style.setProperty('--admin-sprite-scale', String(scale));
  });
};

export function SpriteScaleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const isManager = user?.email?.toLowerCase() === SPRITE_MANAGER_EMAIL;
  const [editorEnabled, setEditorEnabledState] = useState(() => localStorage.getItem(EDITOR_STORAGE_KEY) === 'true');
  const [overrides, setOverrides] = useState<Record<string, number>>({});
  const [selectedSprite, setSelectedSprite] = useState<SelectedSprite | null>(null);
  const [draftScale, setDraftScale] = useState(1);
  const [saving, setSaving] = useState(false);

  const setEditorEnabled = useCallback((enabled: boolean) => {
    if (!isManager) return;
    setEditorEnabledState(enabled);
    localStorage.setItem(EDITOR_STORAGE_KEY, String(enabled));
  }, [isManager]);

  useEffect(() => {
    if (!isManager) {
      setEditorEnabledState(false);
      localStorage.removeItem(EDITOR_STORAGE_KEY);
    }
  }, [isManager]);

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
    applyScalesToDocument(overrides);
    const observer = new MutationObserver(() => applyScalesToDocument(overrides));
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [overrides]);

  useEffect(() => {
    if (!isManager || !editorEnabled) return;
    const selectSprite = (event: MouseEvent) => {
      const image = event.target instanceof HTMLImageElement ? event.target.closest<HTMLImageElement>('img.pokemon-sprite') : null;
      if (!image) return;
      event.preventDefault();
      event.stopPropagation();
      const url = getSpriteKey(image.currentSrc || image.src);
      setSelectedSprite({ url, alt: image.alt || 'Pokémon sprite' });
      setDraftScale(overrides[url] ?? overrides[getSpriteKey(image.getAttribute('src') || image.src)] ?? 1);
    };
    document.addEventListener('click', selectSprite, true);
    return () => document.removeEventListener('click', selectSprite, true);
  }, [editorEnabled, isManager, overrides]);

  const saveScale = async () => {
    if (!selectedSprite) return;
    setSaving(true);
    const { error } = await supabase.from('sprite_scale_overrides').upsert({
      sprite_url: selectedSprite.url,
      scale: Number(draftScale.toFixed(2)),
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Unable to save sprite size', description: error.message });
      return;
    }
    setOverrides((current) => ({ ...current, [selectedSprite.url]: Number(draftScale.toFixed(2)) }));
    toast({ title: 'Sprite size saved globally', description: 'The correction is now visible to every visitor.' });
    setSelectedSprite(null);
  };

  const resetScale = async () => {
    if (!selectedSprite) return;
    setSaving(true);
    const { error } = await supabase.from('sprite_scale_overrides').delete().eq('sprite_url', selectedSprite.url);
    setSaving(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Unable to reset sprite size', description: error.message });
      return;
    }
    setOverrides((current) => {
      const { [selectedSprite.url]: _removed, ...rest } = current;
      return rest;
    });
    setSelectedSprite(null);
  };

  const value = useMemo(() => ({ editorEnabled, setEditorEnabled, isManager }), [editorEnabled, isManager, setEditorEnabled]);

  return (
    <SpriteScaleContext.Provider value={value}>
      {children}
      <Dialog open={Boolean(selectedSprite)} onOpenChange={(open) => !open && setSelectedSprite(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Global sprite size</DialogTitle>
            <DialogDescription>Adjust this exact sprite. The change applies globally on every page.</DialogDescription>
          </DialogHeader>
          {selectedSprite && (
            <div className="space-y-5">
              <div className="flex items-center gap-4 rounded-lg border bg-muted/30 p-3">
                <img src={selectedSprite.url} alt={selectedSprite.alt} className="h-20 w-20 object-contain pokemon-sprite" style={{ '--admin-sprite-scale': draftScale } as React.CSSProperties} />
                <p className="min-w-0 break-all text-xs text-muted-foreground">{selectedSprite.alt}</p>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm font-medium"><span>Scale</span><span>{Math.round(draftScale * 100)}%</span></div>
                <Slider value={[draftScale]} min={0.25} max={2.5} step={0.01} onValueChange={([value]) => setDraftScale(value)} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => void resetScale()} disabled={saving || !selectedSprite || !(selectedSprite.url in overrides)}>Reset automatic</Button>
            <Button type="button" onClick={() => void saveScale()} disabled={saving}>{saving ? 'Saving...' : 'Save globally'}</Button>
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
