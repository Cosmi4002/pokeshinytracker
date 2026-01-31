import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="text-center space-y-4 max-w-md">
            <p className="text-2xl">✨</p>
            <h1 className="text-xl font-bold">Qualcosa è andato storto</h1>
            <p className="text-muted-foreground text-sm">
              Controlla che le variabili d&apos;ambiente VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY (o VITE_SUPABASE_ANON_KEY)
              siano configurate in Vercel (Project Settings → Environment Variables).
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90"
            >
              Ricarica
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
