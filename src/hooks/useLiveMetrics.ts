import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface LiveMetrics {
  currentVisitors: number;
  todayViews: number;
  todayComments: number;
  activeArticles: number;
}

export function useLiveMetrics() {
  const [metrics, setMetrics] = useState<LiveMetrics>({
    currentVisitors: 0,
    todayViews: 0,
    todayComments: 0,
    activeArticles: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchLiveMetrics = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get today's article views
      const { count: todayViewsCount } = await supabase
        .from('article_views')
        .select('id', { count: 'exact', head: true })
        .gte('viewed_at', `${today}T00:00:00.000Z`)
        .lt('viewed_at', `${today}T23:59:59.999Z`);

      // Get today's comments
      const { count: todayCommentsCount } = await supabase
        .from('comments')
        .select('id', { count: 'exact', head: true })
        .eq('is_approved', true)
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`);

      // Get active articles (published in last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { count: activeArticlesCount } = await supabase
        .from('articles')
        .select('id', { count: 'exact', head: true })
        .eq('is_published', true)
        .gte('published_at', sevenDaysAgo.toISOString());

      // Mock current visitors (in a real app, you'd use WebSocket or Server-Sent Events)
      // For now, we'll simulate based on recent activity
      const { count: recentViews } = await supabase
        .from('article_views')
        .select('id', { count: 'exact', head: true })
        .gte('viewed_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()); // Last 5 minutes

      setMetrics({
        currentVisitors: Math.max(recentViews || 0, Math.floor(Math.random() * 20) + 5), // Simulated
        todayViews: todayViewsCount || 0,
        todayComments: todayCommentsCount || 0,
        activeArticles: activeArticlesCount || 0
      });

    } catch (error) {
      console.error('Error fetching live metrics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveMetrics();

    // Set up realtime subscriptions
    const subscriptions = [
      // Article views for live visitor count
      supabase
        .channel('live-views')
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'article_views' },
          () => {
            // Increment current visitors briefly
            setMetrics(prev => ({
              ...prev,
              currentVisitors: prev.currentVisitors + 1
            }));
            
            // Decrease after 3 minutes
            setTimeout(() => {
              setMetrics(prev => ({
                ...prev,
                currentVisitors: Math.max(prev.currentVisitors - 1, 0)
              }));
            }, 3 * 60 * 1000);
          }
        )
        .subscribe(),
      
      // Comments for live updates
      supabase
        .channel('live-comments')
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'comments' },
          () => fetchLiveMetrics()
        )
        .subscribe(),
      
      // Articles for active articles count
      supabase
        .channel('live-articles')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'articles' },
          () => fetchLiveMetrics()
        )
        .subscribe()
    ];

    // Update metrics every 30 seconds
    const interval = setInterval(fetchLiveMetrics, 30 * 1000);

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
      clearInterval(interval);
    };
  }, [fetchLiveMetrics]);

  return {
    metrics,
    loading,
    refetch: fetchLiveMetrics
  };
}