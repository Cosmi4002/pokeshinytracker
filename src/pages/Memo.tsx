import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Download, Plus, Trash2 } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

type MemoItem = {
  id: string;
  text: string;
  checked: boolean;
  color: string;
};

const MEMO_ITEMS_KEY = 'main_memo_items_v2';
const LEGACY_MEMO_KEY = 'main_memo_text_v1';

function createItem(text = ''): MemoItem {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    text,
    checked: false,
    color: '#ffffff',
  };
}

export default function Memo() {
  const [items, setItems] = useState<MemoItem[]>([]);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  useEffect(() => {
    try {
      const savedItems = localStorage.getItem(MEMO_ITEMS_KEY);
      if (savedItems) {
        const parsed = JSON.parse(savedItems) as MemoItem[];
        if (Array.isArray(parsed)) {
          setItems(parsed);
          return;
        }
      }

      const legacy = localStorage.getItem(LEGACY_MEMO_KEY);
      if (legacy) {
        const migrated = legacy
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line) => createItem(line));
        setItems(migrated.length ? migrated : [createItem('')]);
        return;
      }

      setItems([createItem('')]);
    } catch {
      setItems([createItem('')]);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(MEMO_ITEMS_KEY, JSON.stringify(items));
        setLastSavedAt(new Date());
      } catch {
        // Keep editor usable even if storage fails.
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [items]);

  const totalChars = useMemo(() => items.reduce((acc, item) => acc + item.text.length, 0), [items]);
  const totalWords = useMemo(() => {
    const joined = items.map((item) => item.text).join(' ').trim();
    if (!joined) return 0;
    return joined.split(/\s+/).length;
  }, [items]);

  const checkedCount = useMemo(() => items.filter((item) => item.checked).length, [items]);

  const updateItem = (id: string, update: Partial<MemoItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...update } : item)));
  };

  const addItem = () => setItems((prev) => [...prev, createItem('')]);

  const removeItem = (id: string) => {
    setItems((prev) => {
      const next = prev.filter((item) => item.id !== id);
      return next.length ? next : [createItem('')];
    });
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    setItems((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(index, 1);
      next.splice(target, 0, moved);
      return next;
    });
  };

  const handleClear = () => {
    const reset = [createItem('')];
    setItems(reset);
    try {
      localStorage.setItem(MEMO_ITEMS_KEY, JSON.stringify(reset));
      localStorage.removeItem(LEGACY_MEMO_KEY);
      setLastSavedAt(new Date());
    } catch {
      // Ignore storage errors.
    }
  };

  const handleDownload = () => {
    const lines = items
      .map((item, index) => `${index + 1}. [${item.checked ? 'x' : ' '}] ${item.text}`)
      .join('\n');
    const blob = new Blob([lines], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'memo.txt';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-5xl mx-auto">
          <CardHeader>
            <CardTitle>Memo</CardTitle>
            <CardDescription>
              Lista numerata, checkbox, colore testo e salvataggio automatico locale.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 max-h-[65vh] overflow-y-auto pr-1">
              {items.map((item, index) => (
                <div key={item.id} className="grid grid-cols-[28px_24px_1fr_56px_72px] gap-2 items-center">
                  <span className="text-sm text-muted-foreground text-right">{index + 1}.</span>

                  <Checkbox
                    checked={item.checked}
                    onCheckedChange={(checked) => updateItem(item.id, { checked: checked === true })}
                  />

                  <Input
                    value={item.text}
                    onChange={(e) => updateItem(item.id, { text: e.target.value })}
                    placeholder="Scrivi una nota..."
                    style={{ color: item.color }}
                    className={item.checked ? 'line-through opacity-70' : ''}
                  />

                  <input
                    type="color"
                    value={item.color}
                    onChange={(e) => updateItem(item.id, { color: e.target.value })}
                    title="Colore testo"
                    className="h-10 w-full cursor-pointer rounded-md border border-input bg-background p-1"
                  />

                  <div className="flex items-center justify-end gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => moveItem(index, -1)}
                      disabled={index === 0}
                      title="Sposta su"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => moveItem(index, 1)}
                      disabled={index === items.length - 1}
                      title="Sposta giu"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.id)}
                      title="Elimina riga"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" onClick={addItem}>
                <Plus className="h-4 w-4" />
                Aggiungi riga
              </Button>
              <Button type="button" variant="outline" onClick={handleDownload}>
                <Download className="h-4 w-4" />
                Scarica TXT
              </Button>
              <Button type="button" variant="destructive" onClick={handleClear}>
                <Trash2 className="h-4 w-4" />
                Svuota
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">
              {checkedCount}/{items.length} completati | {totalWords} parole | {totalChars} caratteri
              {lastSavedAt ? ` | salvato alle ${lastSavedAt.toLocaleTimeString('it-IT')}` : ''}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
