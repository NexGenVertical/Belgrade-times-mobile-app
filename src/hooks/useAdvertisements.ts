import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Advertisement {
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

export function useAdvertisements(placement?: string) {
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAdvertisements = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('advertisements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      // Filter by placement if specified
      if (placement) {
        query = query.eq('placement', placement);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filter out expired ads
      const now = new Date();
      const validAds = data?.filter(ad => {
        if (ad.start_date && new Date(ad.start_date) > now) return false;
        if (ad.end_date && new Date(ad.end_date) < now) return false;
        return true;
      }) || [];

      setAdvertisements(validAds);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching advertisements:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getAdsByPlacement = (placement: string): Advertisement[] => {
    const now = new Date();
    return advertisements.filter(ad => {
      if (ad.placement !== placement) return false;
      if (ad.start_date && new Date(ad.start_date) > now) return false;
      if (ad.end_date && new Date(ad.end_date) < now) return false;
      return true;
    });
  };

  useEffect(() => {
    fetchAdvertisements();

    // Set up realtime subscription for advertisements table
    const subscription = supabase
      .channel('advertisements-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'advertisements' },
        (payload) => {
          console.log('Realtime advertisements change detected:', payload);
          // Always refetch to ensure we have the latest active ads
          fetchAdvertisements();
        }
      )
      .subscribe((status) => {
        console.log('Advertisements realtime subscription status:', status);
      });

    // Cleanup subscription on unmount
    return () => {
      console.log('Unsubscribing from advertisements changes');
      subscription.unsubscribe();
    };
  }, [placement]);

  return {
    advertisements,
    loading,
    error,
    getAdsByPlacement,
    refetch: fetchAdvertisements
  };
}