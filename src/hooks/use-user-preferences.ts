import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type UserPreferences = Tables<'user_preferences'>;

const DEFAULT_PREFERENCES = {
    theme_color: '#8b5cf6',
    background_color: '#0f172a',
    layout_style: 'grid',
};

export function useUserPreferences() {
    const { user } = useAuth();
    const [preferences, setPreferences] = useState<UserPreferences | null>(null);
    const [loading, setLoading] = useState(true);

    // Load preferences from database
    useEffect(() => {
        if (!user) {
            setPreferences(null);
            setLoading(false);
            return;
        }

        const loadPreferences = async () => {
            const { data, error } = await supabase
                .from('user_preferences')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();

            if (data) {
                setPreferences(data);
                applyPreferences(data);
            } else {
                // Use defaults if no preferences exist yet
                applyPreferences(DEFAULT_PREFERENCES);
            }
            setLoading(false);
        };

        loadPreferences();
    }, [user?.id]);

    // Apply preferences to CSS variables
    const applyPreferences = (prefs: Partial<UserPreferences> | typeof DEFAULT_PREFERENCES) => {
        const root = document.documentElement;

        if (prefs.theme_color) {
            // Set primary color (Hex)
            root.style.setProperty('--primary', prefs.theme_color);
            root.style.setProperty('--shiny', prefs.theme_color);
            root.style.setProperty('--shiny-glow', prefs.theme_color); // Simplified glow for hex support
            root.style.setProperty('--ring', prefs.theme_color);
            // We can't easily generate foreground contrast from hex in pure JS without helper, 
            // but usually white/black text on colored button is handled by --primary-foreground.
            // For now, let's assume a default foreground or keep what is there.
            // Note: If --primary is hex, calculated sub-colors based on HSL vars in CSS won't update automatically.
            // We force main colors for now.
        }

        if (prefs.background_color) {
            root.style.setProperty('--background', prefs.background_color);
            // Should accurate update card/popover too? 
            // Often users want the whole app tinted. 
            // For simpler logic, we just set background. 
            // Advanced: lighten/darken for cards.
        }
    };

    // Save preferences to database
    const savePreferences = async (updates: Partial<Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
        if (!user) return;

        const newPrefs = { ...preferences, ...updates };

        try {
            if (preferences?.id) {
                // Update existing preferences
                const { error } = await supabase
                    .from('user_preferences')
                    .update({
                        ...updates,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('user_id', user.id);

                if (error) throw error;
            } else {
                // Insert new preferences
                const { data, error } = await supabase
                    .from('user_preferences')
                    .insert({
                        user_id: user.id,
                        ...updates,
                    })
                    .select()
                    .single();

                if (error) throw error;
                setPreferences(data);
            }

            applyPreferences(newPrefs);
            setPreferences(prev => ({ ...prev!, ...updates }));

            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    };

    return {
        preferences: preferences || DEFAULT_PREFERENCES,
        loading,
        savePreferences,
    };
}
