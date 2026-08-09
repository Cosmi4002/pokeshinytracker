import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';

type Theme = 'default' | 'blue' | 'purple'; // Define your themes here
type ColorScheme = 'light' | 'dark';

const isColorScheme = (value: unknown): value is ColorScheme => value === 'light' || value === 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || 'default';
  });

  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(() => {
    const stored = localStorage.getItem('colorScheme');
    return isColorScheme(stored) ? stored : 'dark'; // Default to dark mode
  });
  const [colorSchemeUserId, setColorSchemeUserId] = useState<string | null>(null);
  const [colorSchemeTouched, setColorSchemeTouched] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    root.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (colorScheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('colorScheme', colorScheme);
  }, [colorScheme]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    let active = true;

    const applyRemoteColorScheme = (raw: unknown, userId: string | null) => {
      if (!active) return;
      if (isColorScheme(raw)) {
        setColorSchemeState(raw);
        setColorSchemeTouched(false);
      }
      setColorSchemeUserId(userId);
    };

    const refreshRemoteColorScheme = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data.user) {
          applyRemoteColorScheme(null, null);
          return;
        }

        applyRemoteColorScheme(
          (data.user.user_metadata as Record<string, unknown> | undefined)?.color_scheme,
          data.user.id
        );
      } catch {
        if (active) setColorSchemeUserId(null);
      }
    };

    supabase.auth.getUser()
      .then(({ data, error }) => {
        if (error || !data.user) {
          applyRemoteColorScheme(null, null);
          return;
        }

        applyRemoteColorScheme(
          (data.user.user_metadata as Record<string, unknown> | undefined)?.color_scheme,
          data.user.id
        );
      })
      .catch(() => {
        if (active) setColorSchemeUserId(null);
      });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      applyRemoteColorScheme(
        (user?.user_metadata as Record<string, unknown> | undefined)?.color_scheme,
        user?.id ?? null
      );
    });

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void refreshRemoteColorScheme();
      }
    };

    window.addEventListener('focus', refreshRemoteColorScheme);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      active = false;
      window.removeEventListener('focus', refreshRemoteColorScheme);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !colorSchemeUserId || !colorSchemeTouched) return;

    void supabase.auth.updateUser({
      data: { color_scheme: colorScheme },
    });
  }, [colorScheme, colorSchemeTouched, colorSchemeUserId]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const setColorScheme = (newColorScheme: ColorScheme) => {
    setColorSchemeState(newColorScheme);
    setColorSchemeTouched(true);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, colorScheme, setColorScheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
