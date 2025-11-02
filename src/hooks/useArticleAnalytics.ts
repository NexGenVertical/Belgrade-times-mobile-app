import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface ArticlePerformance {
  topViewed: Array<{
    id: string;
    title: string;
    views: number;
    viewsToday: number;
    viewsThisWeek: number;
    comments: number;
    publishedAt: string;
    category?: string;
  }>;
  topCommented: Array<{
    id: string;
    title: string;
    comments: number;
    views: number;
    publishedAt: string;
    category?: string;
  }>;
  publicationTrends: Array<{
    label: string;
    value: number;
    date: string;
  }>;
  categoryPerformance: Array<{
    category: string;
    totalViews: number;
    totalArticles: number;
    avgViews: number;
  }>;
}

export function useArticleAnalytics() {
  const [data, setData] = useState<ArticlePerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArticleAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const weekAgoStr = weekAgo.toISOString().split('T')[0];

      // Get articles with their performance data
      const { data: articles, error: articlesError } = await supabase
        .from('articles')
        .select(`
          id,
          title,
          published_at,
          category,
          is_published,
          article_views!inner(id, viewed_at),
          comments(count)
        `)
        .eq('is_published', true)
        .not('published_at', 'is', null)
        .order('published_at', { ascending: false });

      if (articlesError) throw articlesError;

      // Process articles data
      const processedArticles = articles?.map(article => {
        const allViews = article.article_views || [];
        const viewsToday = allViews.filter(v => v.viewed_at.startsWith(todayStr)).length;
        const viewsThisWeek = allViews.filter(v => v.viewed_at >= `${weekAgoStr}T00:00:00.000Z`).length;
        
        return {
          id: article.id,
          title: article.title,
          views: allViews.length,
          viewsToday,
          viewsThisWeek,
          comments: (article as any).comments?.[0]?.count || 0,
          publishedAt: article.published_at,
          category: article.category
        };
      }) || [];

      // Top viewed articles
      const topViewed = processedArticles
        .sort((a, b) => b.views - a.views)
        .slice(0, 10);

      // Top commented articles
      const topCommented = processedArticles
        .filter(a => a.comments > 0)
        .sort((a, b) => b.comments - a.comments)
        .slice(0, 10);

      // Publication trends (last 30 days)
      const publicationTrends = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const publicationsThatDay = processedArticles.filter(a => 
          a.publishedAt.startsWith(dateStr)
        ).length;
        
        publicationTrends.push({
          label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: publicationsThatDay,
          date: dateStr
        });
      }

      // Category performance
      const categoryMap = new Map();
      processedArticles.forEach(article => {
        const category = article.category || 'Uncategorized';
        if (!categoryMap.has(category)) {
          categoryMap.set(category, {
            category,
            totalViews: 0,
            totalArticles: 0,
            avgViews: 0
          });
        }
        
        const cat = categoryMap.get(category);
        cat.totalViews += article.views;
        cat.totalArticles += 1;
      });

      const categoryPerformance = Array.from(categoryMap.values())
        .map(cat => ({
          ...cat,
          avgViews: Math.round(cat.totalViews / cat.totalArticles)
        }))
        .sort((a, b) => b.totalViews - a.totalViews);

      setData({
        topViewed,
        topCommented,
        publicationTrends,
        categoryPerformance
      });

    } catch (err) {
      console.error('Error fetching article analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch article analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticleAnalytics();

    // Set up realtime subscriptions
    const subscriptions = [
      supabase
        .channel('article-analytics-views')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'article_views' },
          () => fetchArticleAnalytics()
        )
        .subscribe(),
      
      supabase
        .channel('article-analytics-articles')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'articles' },
          () => fetchArticleAnalytics()
        )
        .subscribe(),
      
      supabase
        .channel('article-analytics-comments')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'comments' },
          () => fetchArticleAnalytics()
        )
        .subscribe()
    ];

    // Refresh data every 2 minutes
    const interval = setInterval(fetchArticleAnalytics, 2 * 60 * 1000);

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
      clearInterval(interval);
    };
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchArticleAnalytics
  };
}