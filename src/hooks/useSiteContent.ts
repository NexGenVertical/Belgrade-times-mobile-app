import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface SiteContent {
  id: string;
  key: string;
  value: string;
  description: string | null;
  updated_at: string;
  updated_by: string | null;
}

interface SiteContentMap {
  [key: string]: string;
}

export function useSiteContent() {
  const [content, setContent] = useState<SiteContentMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('site_content')
        .select('*')
        .order('key', { ascending: true });

      if (error) throw error;

      // Convert array to key-value map
      const contentMap: SiteContentMap = {};
      data?.forEach((item: SiteContent) => {
        contentMap[item.key] = item.value;
      });

      setContent(contentMap);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching site content:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getContent = (key: string, defaultValue?: string): string => {
    return content[key] || defaultValue || '';
  };

  useEffect(() => {
    fetchContent();

    // Set up realtime subscription for site_content table
    const subscription = supabase
      .channel('site-content-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'site_content' },
        (payload) => {
          console.log('Realtime site_content change detected:', payload);
          // Refetch content when any change occurs
          fetchContent();
        }
      )
      .subscribe((status) => {
        console.log('Site content realtime subscription status:', status);
      });

    // Cleanup subscription on unmount
    return () => {
      console.log('Unsubscribing from site content changes');
      subscription.unsubscribe();
    };
  }, []);

  return {
    content,
    loading,
    error,
    getContent,
    refetch: fetchContent
  };
}