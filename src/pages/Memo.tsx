import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bold,
  Download,
  Eraser,
  Italic,
  List,
  ListChecks,
  ListOrdered,
  Redo2,
  Trash2,
  Underline,
  Undo2,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const MEMO_HTML_KEY = 'memo_richtext_html_v1';
const LEGACY_TEXT_KEY = 'main_memo_text_v1';
const LEGACY_ITEMS_KEY = 'main_memo_items_v2';
const MEMO_CALC_KEY = 'memo_calculator_input_v1';

export default function Memo() {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [html, setHtml] = useState('');
  const [textColor, setTextColor] = useState('#ffffff');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [calcInput, setCalcInput] = useState('0');

  useEffect(() => {
    let initialHtml = '';
    try {
      const savedHtml = localStorage.getItem(MEMO_HTML_KEY);
      if (savedHtml) {
        initialHtml = savedHtml;
      } else {
        const legacyItems = localStorage.getItem(LEGACY_ITEMS_KEY);
        if (legacyItems) {
          const parsed = JSON.parse(legacyItems) as Array<{ text?: string; checked?: boolean }>;
          if (Array.isArray(parsed) && parsed.length) {
            initialHtml = parsed
              .map((item, index) => `${index + 1}. [${item.checked ? 'x' : ' '}] ${item.text || ''}`)
              .join('<br>');
          }
        } else {
          const legacyText = localStorage.getItem(LEGACY_TEXT_KEY);
          if (legacyText) {
            initialHtml = legacyText.replace(/\n/g, '<br>');
          }
        }
      }
    } catch {
      initialHtml = '';
    }

    if (!initialHtml) {
      initialHtml = '<p>Scrivi qui i tuoi appunti...</p>';
    }

    setHtml(initialHtml);
    if (editorRef.current) {
      editorRef.current.innerHTML = initialHtml;
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(MEMO_HTML_KEY, html);
        setLastSavedAt(new Date());
      } catch {
        // Keep editor usable if storage quota is exceeded.
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [html]);

  useEffect(() => {
    try {
      const savedCalc = localStorage.getItem(MEMO_CALC_KEY);
      if (savedCalc) {
        setCalcInput(savedCalc);
      }
    } catch {
      // Ignore read errors.
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(MEMO_CALC_KEY, calcInput);
    } catch {
      // Ignore storage errors.
    }
  }, [calcInput]);

  const syncFromEditor = () => {
    if (!editorRef.current) return;
    setHtml(editorRef.current.innerHTML);
  };

  const runCommand = (command: string, value?: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, value);
    syncFromEditor();
  };

  const insertChecklist = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    const checklistHtml = [
      '<ul>',
      '<li><input type="checkbox" /> Task 1</li>',
      '<li><input type="checkbox" /> Task 2</li>',
      '</ul>',
    ].join('');
    document.execCommand('insertHTML', false, checklistHtml);
    syncFromEditor();
  };

  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT') {
      // Let the browser handle checkbox toggle, then sync the resulting HTML.
      window.setTimeout(() => {
        syncFromEditor();
      }, 0);
    }
  };

  const handleClear = () => {
    const empty = '<p></p>';
    setHtml(empty);
    if (editorRef.current) editorRef.current.innerHTML = empty;
    try {
      localStorage.setItem(MEMO_HTML_KEY, empty);
      setLastSavedAt(new Date());
    } catch {
      // Ignore storage errors.
    }
  };

  const textContent = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  }, [html]);

  const wordCount = useMemo(() => {
    const trimmed = textContent.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  }, [textContent]);

  const charCount = useMemo(() => textContent.length, [textContent]);

  const handleDownloadTxt = () => {
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'memo.txt';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadHtml = () => {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'memo.html';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const evaluateExpression = (raw: string): string => {
    const normalized = raw.replace(/x/g, '*').replace(/\u00f7/g, '/').replace(/\s+/g, '');
    if (!normalized) return '0';
    if (!/^[0-9+\-*/().]+$/.test(normalized)) {
      throw new Error('Invalid expression');
    }
    const result = Function(`"use strict"; return (${normalized});`)() as number;
    if (typeof result !== 'number' || !Number.isFinite(result)) {
      throw new Error('Invalid result');
    }
    return Number.isInteger(result) ? String(result) : String(Number(result.toFixed(10)));
  };

  const handleCalcPress = (value: string) => {
    if (value === 'C') {
      setCalcInput('0');
      return;
    }
    if (value === 'DEL') {
      setCalcInput((prev) => {
        if (prev.length <= 1) return '0';
        return prev.slice(0, -1);
      });
      return;
    }
    if (value === '=') {
      try {
        setCalcInput((prev) => evaluateExpression(prev));
      } catch {
        setCalcInput('Errore');
      }
      return;
    }

    setCalcInput((prev) => {
      if (prev === 'Errore') return value;
      if (prev === '0' && !['+', '-', 'x', '\u00f7', '.', ')'].includes(value)) return value;
      return prev + value;
    });
  };

  const calcButtons = [
    ['C', '(', ')', 'DEL'],
    ['7', '8', '9', '\u00f7'],
    ['4', '5', '6', 'x'],
    ['1', '2', '3', '-'],
    ['0', '.', '=', '+'],
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-6xl mx-auto">
          <CardHeader>
            <CardTitle>Memo</CardTitle>
            <CardDescription>Editor testo stile Word con formattazione e salvataggio automatico locale.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 border rounded-md p-2 bg-card">
              <Button type="button" variant="outline" size="icon" onClick={() => runCommand('undo')} title="Undo">
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button type="button" variant="outline" size="icon" onClick={() => runCommand('redo')} title="Redo">
                <Redo2 className="h-4 w-4" />
              </Button>
              <Button type="button" variant="outline" size="icon" onClick={() => runCommand('bold')} title="Grassetto">
                <Bold className="h-4 w-4" />
              </Button>
              <Button type="button" variant="outline" size="icon" onClick={() => runCommand('italic')} title="Corsivo">
                <Italic className="h-4 w-4" />
              </Button>
              <Button type="button" variant="outline" size="icon" onClick={() => runCommand('underline')} title="Sottolineato">
                <Underline className="h-4 w-4" />
              </Button>
              <Button type="button" variant="outline" size="icon" onClick={() => runCommand('insertOrderedList')} title="Lista numerata">
                <ListOrdered className="h-4 w-4" />
              </Button>
              <Button type="button" variant="outline" size="icon" onClick={() => runCommand('insertUnorderedList')} title="Lista puntata">
                <List className="h-4 w-4" />
              </Button>
              <Button type="button" variant="outline" size="icon" onClick={insertChecklist} title="Checklist">
                <ListChecks className="h-4 w-4" />
              </Button>
              <label className="flex items-center gap-2 px-2">
                <span className="text-sm text-muted-foreground">Colore</span>
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => {
                    const color = e.target.value;
                    setTextColor(color);
                    runCommand('foreColor', color);
                  }}
                  className="h-8 w-10 cursor-pointer rounded border border-input bg-background"
                />
              </label>
              <Button type="button" variant="outline" onClick={() => runCommand('removeFormat')} title="Rimuovi formattazione">
                <Eraser className="h-4 w-4 mr-2" />
                Reset Format
              </Button>
            </div>

            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={syncFromEditor}
              onClick={handleEditorClick}
              className="min-h-[65vh] w-full rounded-md border border-input bg-background px-4 py-3 text-base leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring overflow-auto"
            />

            <Card className="border-input">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Calcolatrice</CardTitle>
                <CardDescription>Operazioni rapide direttamente nella pagina Memo.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-md border border-input bg-background px-3 py-2 text-right text-xl font-mono break-all min-h-12">
                  {calcInput}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {calcButtons.flat().map((button) => (
                    <Button
                      key={button}
                      type="button"
                      variant={button === '=' ? 'default' : 'outline'}
                      onClick={() => handleCalcPress(button)}
                    >
                      {button}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" onClick={handleDownloadTxt}>
                <Download className="h-4 w-4 mr-2" />
                Scarica TXT
              </Button>
              <Button type="button" variant="outline" onClick={handleDownloadHtml}>
                <Download className="h-4 w-4 mr-2" />
                Scarica HTML
              </Button>
              <Button type="button" variant="destructive" onClick={handleClear}>
                <Trash2 className="h-4 w-4 mr-2" />
                Svuota
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">
              {wordCount} parole | {charCount} caratteri
              {lastSavedAt ? ` | salvato alle ${lastSavedAt.toLocaleTimeString('it-IT')}` : ''}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
