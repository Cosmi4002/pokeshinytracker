import { useEffect, useMemo, useState } from 'react';
import { Download, Trash2 } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const MEMO_STORAGE_KEY = 'main_memo_text_v1';

export default function Index() {
  const [memo, setMemo] = useState('');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(MEMO_STORAGE_KEY);
      if (saved) setMemo(saved);
    } catch {
      // Ignore storage errors and keep editor usable.
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(MEMO_STORAGE_KEY, memo);
        setLastSavedAt(new Date());
      } catch {
        // Ignore storage errors and keep editor usable.
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [memo]);

  const charCount = useMemo(() => memo.length, [memo]);
  const wordCount = useMemo(() => {
    const trimmed = memo.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  }, [memo]);

  const handleClear = () => {
    setMemo('');
    try {
      localStorage.removeItem(MEMO_STORAGE_KEY);
      setLastSavedAt(new Date());
    } catch {
      // Ignore storage errors.
    }
  };

  const handleDownload = () => {
    const content = memo || '';
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
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
              Scrivi liberamente. Salvataggio automatico in locale.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="Scrivi qui i tuoi appunti..."
              className="min-h-[65vh] text-base leading-relaxed resize-y"
            />

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                {wordCount} parole | {charCount} caratteri
                {lastSavedAt ? ` | salvato alle ${lastSavedAt.toLocaleTimeString('it-IT')}` : ''}
              </div>

              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={handleDownload}>
                  <Download className="h-4 w-4" />
                  Scarica TXT
                </Button>
                <Button type="button" variant="destructive" onClick={handleClear}>
                  <Trash2 className="h-4 w-4" />
                  Svuota
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
