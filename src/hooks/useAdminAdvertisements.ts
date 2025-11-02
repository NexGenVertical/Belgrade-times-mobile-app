import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Advertisement {
  id: string;
  name: string;
  image_url: string;
  link_url: string;
  placement: string;
  is_active: boolean;
  impressions: number;
  clicks: number;
  start_date: string | null;
  end_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAdvertisementData {
  name: string;
  image_url: string;
  link_url?: string;
  placement: string;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
}

export function useAdminAdvertisements() {
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAdvertisements = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('advertisements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAdvertisements(data || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching advertisements:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createAdvertisement = async (data: CreateAdvertisementData, userId: string): Promise<Advertisement | null> => {
    try {
      const { data: result, error } = await supabase
        .from('advertisements')
        .insert([{
          ...data,
          created_by: userId,
          impressions: 0,
          clicks: 0
        }])
        .select()
        .single();

      if (error) throw error;

      setAdvertisements(prev => [result, ...prev]);
      return result;
    } catch (err: any) {
      console.error('Error creating advertisement:', err);
      throw err;
    }
  };

  const updateAdvertisement = async (id: string, data: Partial<CreateAdvertisementData>): Promise<Advertisement | null> => {
    try {
      const { data: result, error } = await supabase
        .from('advertisements')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setAdvertisements(prev => prev.map(ad => ad.id === id ? result : ad));
      return result;
    } catch (err: any) {
      console.error('Error updating advertisement:', err);
      throw err;
    }
  };

  const deleteAdvertisement = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('advertisements')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setAdvertisements(prev => prev.filter(ad => ad.id !== id));
    } catch (err: any) {
      console.error('Error deleting advertisement:', err);
      throw err;
    }
  };

  const toggleActiveStatus = async (id: string, isActive: boolean): Promise<void> => {
    try {
      const { data: result, error } = await supabase
        .from('advertisements')
        .update({ is_active: isActive })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setAdvertisements(prev => prev.map(ad => ad.id === id ? result : ad));
    } catch (err: any) {
      console.error('Error toggling advertisement status:', err);
      throw err;
    }
  };

  const incrementClickCount = async (id: string): Promise<void> => {
    try {
      // First get the current click count
      const { data: currentAd, error: fetchError } = await supabase
        .from('advertisements')
        .select('clicks')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const newClickCount = (currentAd.clicks || 0) + 1;

      const { data: result, error } = await supabase
        .from('advertisements')
        .update({ clicks: newClickCount })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setAdvertisements(prev => prev.map(ad => ad.id === id ? result : ad));
    } catch (err: any) {
      console.error('Error incrementing click count:', err);
      throw err;
    }
  };

  const incrementImpressionCount = async (id: string): Promise<void> => {
    try {
      // First get the current impression count
      const { data: currentAd, error: fetchError } = await supabase
        .from('advertisements')
        .select('impressions')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const newImpressionCount = (currentAd.impressions || 0) + 1;

      const { data: result, error } = await supabase
        .from('advertisements')
        .update({ impressions: newImpressionCount })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setAdvertisements(prev => prev.map(ad => ad.id === id ? result : ad));
    } catch (err: any) {
      console.error('Error incrementing impression count:', err);
      throw err;
    }
  };

  const getAdvertisementById = (id: string): Advertisement | undefined => {
    return advertisements.find(ad => ad.id === id);
  };

  const getAdvertisementStats = () => {
    const totalAds = advertisements.length;
    const activeAds = advertisements.filter(ad => ad.is_active).length;
    const totalClicks = advertisements.reduce((sum, ad) => sum + (ad.clicks || 0), 0);
    const totalImpressions = advertisements.reduce((sum, ad) => sum + (ad.impressions || 0), 0);
    
    return {
      totalAds,
      activeAds,
      totalClicks,
      totalImpressions,
      avgClickRate: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
    };
  };

  const getAdsByPlacement = (placement: string): Advertisement[] => {
    return advertisements.filter(ad => ad.placement === placement);
  };

  const getFilteredAdvertisements = (filters: {
    search?: string;
    placement?: string;
    status?: 'active' | 'inactive' | 'scheduled';
  }) => {
    return advertisements.filter(ad => {
      if (filters.search && !ad.name.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      
      if (filters.placement && ad.placement !== filters.placement) {
        return false;
      }
      
      if (filters.status) {
        const now = new Date();
        const startDate = ad.start_date ? new Date(ad.start_date) : null;
        const endDate = ad.end_date ? new Date(ad.end_date) : null;
        
        if (filters.status === 'active') {
          if (!ad.is_active) return false;
          if (startDate && startDate > now) return false;
          if (endDate && endDate < now) return false;
        } else if (filters.status === 'inactive') {
          if (ad.is_active) return false;
        } else if (filters.status === 'scheduled') {
          if (!startDate || startDate <= now) return false;
        }
      }
      
      return true;
    });
  };

  useEffect(() => {
    fetchAdvertisements();

    // Set up realtime subscription for advertisements table
    const subscription = supabase
      .channel('admin-advertisements-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'advertisements' },
        (payload) => {
          console.log('Realtime advertisements change detected:', payload);
          // Always refetch to ensure we have the latest data
          fetchAdvertisements();
        }
      )
      .subscribe((status) => {
        console.log('Admin advertisements realtime subscription status:', status);
      });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    advertisements,
    loading,
    error,
    fetchAdvertisements,
    createAdvertisement,
    updateAdvertisement,
    deleteAdvertisement,
    toggleActiveStatus,
    incrementClickCount,
    incrementImpressionCount,
    getAdvertisementById,
    getAdvertisementStats,
    getAdsByPlacement,
    getFilteredAdvertisements
  };
}