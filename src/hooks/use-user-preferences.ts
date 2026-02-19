import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { colorToHsl, hslToTriplet } from '@/lib/color-utils';
import { useRandomColor } from '@/lib/random-color-context';

type UserPreferences = Tables<'user_preferences'>;

const DEFAULT_PREFERENCES = {
    theme_color: '#8b5cf6',
    background_color: '#0f172a',
    layout_style: 'grid',
};

export function useUserPreferences() {
    const { user } = useAuth();
    const { setManualColor, resetToRandom } = useRandomColor();
    const [preferences, setPreferences] = useState<UserPreferences | null>(null);
    const [loading, setLoading] = useState(true);

    const applyBackgroundPreference = useCallback((prefs: Partial<UserPreferences> | typeof DEFAULT_PREFERENCES) => {
        if (!prefs.background_color) return;
        const parsed = colorToHsl(prefs.background_color);
        if (!parsed) return;
        document.documentElement.style.setProperty('--background', hslToTriplet(parsed));
    }, []);

    // Load preferences from database
    useEffect(() => {
        if (!user) {
            setPreferences(null);
            resetToRandom();
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
                applyBackgroundPreference(data);
                if (data.theme_color) {
                    setManualColor(data.theme_color);
                } else {
                    resetToRandom();
                }
            } else {
                applyBackgroundPreference(DEFAULT_PREFERENCES);
                resetToRandom();
            }
            setLoading(false);
        };

        loadPreferences();
    }, [user?.id, applyBackgroundPreference, resetToRandom, setManualColor]);

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

            applyBackgroundPreference(newPrefs);
            if (updates.theme_color === null) {
                resetToRandom();
            } else if (updates.theme_color) {
                setManualColor(updates.theme_color);
            }
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
