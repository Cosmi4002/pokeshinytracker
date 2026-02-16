import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="text-center space-y-4 max-w-2xl">
            <p className="text-2xl">🚨</p>
            <h1 className="text-xl font-bold text-destructive">Errore Applicazione</h1>

            <div className="text-left bg-muted/50 p-4 rounded-lg overflow-auto max-h-[60vh] text-xs font-mono border border-border">
              <p className="font-bold mb-2 text-foreground">{this.state.error?.message || 'Errore sconosciuto'}</p>
              <pre className="opacity-70 whitespace-pre-wrap">{this.state.error?.stack}</pre>
            </div>

            <p className="text-muted-foreground text-sm">
              Prova a ricaricare la pagina. Se l&apos;errore persiste, copia questo messaggio e invialo allo sviluppatore.
            </p>

            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90"
            >
              Ricarica Pagina
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
