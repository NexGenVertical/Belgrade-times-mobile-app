import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface SiteSetting {
  id: string;
  setting_key: string;
  setting_value: string | null;
  setting_type: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface SiteSettingsMap {
  [key: string]: string;
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettingsMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .order('setting_key', { ascending: true });

      if (error) throw error;

      // Convert array to key-value map
      const settingsMap: SiteSettingsMap = {};
      data?.forEach((setting: SiteSetting) => {
        settingsMap[setting.setting_key] = setting.setting_value || '';
      });

      setSettings(settingsMap);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching site settings:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getSetting = (key: string, defaultValue?: string): string => {
    return settings[key] || defaultValue || '';
  };

  const setSetting = async (key: string, value: string) => {
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({
          setting_key: key,
          setting_value: value,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'setting_key'
        });

      if (error) throw error;

      // Update local state
      setSettings(prev => ({
        ...prev,
        [key]: value
      }));

      return { success: true };
    } catch (err: any) {
      console.error('Error setting setting:', err);
      return { success: false, error: err.message };
    }
  };

  const setMultipleSettings = async (settingsData: Record<string, string>) => {
    try {
      const settingsToUpsert = Object.entries(settingsData).map(([key, value]) => ({
        setting_key: key,
        setting_value: value,
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('site_settings')
        .upsert(settingsToUpsert, {
          onConflict: 'setting_key'
        });

      if (error) throw error;

      // Update local state
      setSettings(prev => ({
        ...prev,
        ...settingsData
      }));

      return { success: true };
    } catch (err: any) {
      console.error('Error setting multiple settings:', err);
      return { success: false, error: err.message };
    }
  };

  useEffect(() => {
    fetchSettings();

    // Set up realtime subscription for site_settings table
    const subscription = supabase
      .channel('site-settings-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'site_settings' },
        (payload) => {
          console.log('Realtime site_settings change detected:', payload);
          // Refetch settings when any change occurs
          fetchSettings();
        }
      )
      .subscribe((status) => {
        console.log('Site settings realtime subscription status:', status);
      });

    // Cleanup subscription on unmount
    return () => {
      console.log('Unsubscribing from site settings changes');
      subscription.unsubscribe();
    };
  }, []);

  return {
    settings,
    loading,
    error,
    getSetting,
    setSetting,
    setMultipleSettings,
    refetch: fetchSettings
  };
}