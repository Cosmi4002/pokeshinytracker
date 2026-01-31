import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { getSupabaseConfigErrorMessage, isSupabaseConfigured, supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setSession(null);
      setUser(null);
      setLoading(false);
      return;
    }

    let subscription: { unsubscribe: () => void } | null = null;

    try {
      // Set up auth state listener FIRST
      const { data } = supabase.auth.onAuthStateChange(
        (event, session) => {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      );
      subscription = data.subscription;

      // THEN check for existing session
      supabase.auth.getSession()
        .then(({ data: { session } }) => {
          setSession(session);
          setUser(session?.user ?? null);
        })
        .catch(() => {
          setSession(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } catch {
      setLoading(false);
    }

    return () => subscription?.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { error: new Error(getSupabaseConfigErrorMessage() ?? 'Supabase non configurato') };
    }

    // After email verification, bring the user back to the Auth page
    // (it will auto-redirect to /counter if a session is detected).
    const redirectUrl = `${window.location.origin}/auth`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { error: new Error(getSupabaseConfigErrorMessage() ?? 'Supabase non configurato') };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { error: error as Error | null };
  };

  const signOut = async () => {
    if (!isSupabaseConfigured) return;
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
