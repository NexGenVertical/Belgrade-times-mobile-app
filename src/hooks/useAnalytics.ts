import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface AnalyticsData {
  totalArticles: number;
  totalViews: number;
  totalComments: number;
  totalUsers: number;
  totalAdClicks: number;
  totalAdImpressions: number;
  recentViews: Array<{
    label: string;
    value: number;
    date: string;
  }>;
  recentComments: Array<{
    label: string;
    value: number;
    date: string;
  }>;
  recentUsers: Array<{
    label: string;
    value: number;
    date: string;
  }>;
  topArticles: Array<{
    id: string;
    title: string;
    views: number;
    comments: number;
  }>;
  popularCategories: Array<{
    name: string;
    count: number;
  }>;
  activityFeed: Array<{
    id: string;
    type: 'article' | 'comment' | 'user' | 'ad' | 'view';
    title: string;
    description?: string;
    timestamp: string;
    user?: string;
  }>;
}

export function useAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [
        articlesResult,
        viewsResult,
        commentsResult,
        usersResult,
        adsResult,
        topArticlesResult,
        activityResult
      ] = await Promise.all([
        // Total articles
        supabase
          .from('articles')
          .select('id', { count: 'exact', head: true }),
        
        // Total views
        supabase
          .from('article_views')
          .select('id', { count: 'exact', head: true }),
        
        // Total comments (only approved)
        supabase
          .from('comments')
          .select('id', { count: 'exact', head: true })
          .eq('is_approved', true),
        
        // Total users
        supabase.auth.admin.listUsers(),
        
        // Advertisement stats
        supabase
          .from('advertisements')
          .select('clicks, impressions'),
        
        // Top articles by views
        supabase
          .from('articles')
          .select(`
            id,
            title,
            article_views(count),
            comments(count)
          `)
          .order('created_at', { ascending: false })
          .limit(10),
        
        // Recent activity
        Promise.all([
          // Recent articles
          supabase
            .from('articles')
            .select('id, title, created_at, author_name')
            .order('created_at', { ascending: false })
            .limit(3),
          
          // Recent comments
          supabase
            .from('comments')
            .select('id, content, created_at, author_name, articles(title)')
            .eq('is_approved', true)
            .order('created_at', { ascending: false })
            .limit(3),
          
          // Recent users (last 24h)
          supabase.auth.admin.listUsers()
        ])
      ]);

      // Calculate totals
      const totalArticles = articlesResult.count || 0;
      const totalViews = viewsResult.count || 0;
      const totalComments = commentsResult.count || 0;
      const totalUsers = usersResult.data.users?.length || 0;
      
      const totalAdClicks = adsResult.data?.reduce((sum, ad) => sum + (ad.clicks || 0), 0) || 0;
      const totalAdImpressions = adsResult.data?.reduce((sum, ad) => sum + (ad.impressions || 0), 0) || 0;

      // Process top articles
      const topArticles = topArticlesResult.data?.map(article => ({
        id: article.id,
        title: article.title,
        views: (article as any).article_views?.[0]?.count || 0,
        comments: (article as any).comments?.[0]?.count || 0
      })) || [];

      // Generate time-series data (last 7 days)
      const now = new Date();
      const recentViews = [];
      const recentComments = [];
      const recentUsers = [];

      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        recentViews.push({
          label: date.toLocaleDateString('en-US', { weekday: 'short' }),
          value: Math.floor(Math.random() * 100) + 20, // Mock data - replace with real queries
          date: dateStr
        });
        
        recentComments.push({
          label: date.toLocaleDateString('en-US', { weekday: 'short' }),
          value: Math.floor(Math.random() * 20) + 5, // Mock data
          date: dateStr
        });
        
        recentUsers.push({
          label: date.toLocaleDateString('en-US', { weekday: 'short' }),
          value: Math.floor(Math.random() * 10) + 2, // Mock data
          date: dateStr
        });
      }

      // Process activity feed
      const [recentArticles, recentCommentsData, recentUsersData] = activityResult;
      const activityFeed: any[] = [];

      // Add recent articles to activity
      recentArticles.data?.forEach(article => {
        activityFeed.push({
          id: `article-${article.id}`,
          type: 'article',
          title: `New article published`,
          description: article.title,
          timestamp: article.created_at,
          user: article.author_name || 'Unknown'
        });
      });

      // Add recent comments to activity
      recentCommentsData.data?.forEach(comment => {
        activityFeed.push({
          id: `comment-${comment.id}`,
          type: 'comment',
          title: `New comment`,
          description: (comment.content as string).substring(0, 100) + '...',
          timestamp: comment.created_at,
          user: comment.author_name
        });
      });

      // Sort activity by timestamp
      activityFeed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Category analysis
      const { data: categoryData } = await supabase
        .from('articles')
        .select('category')
        .eq('is_published', true);

      // Group categories manually
      const categoryMap = new Map();
      categoryData?.forEach(article => {
        const category = article.category || 'Uncategorized';
        categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
      });

      const popularCategories = Array.from(categoryMap.entries()).map(([name, count]) => ({
        name,
        count: count as number
      }));

      setData({
        totalArticles,
        totalViews,
        totalComments,
        totalUsers,
        totalAdClicks,
        totalAdImpressions,
        recentViews,
        recentComments,
        recentUsers,
        topArticles,
        popularCategories,
        activityFeed: activityFeed.slice(0, 10)
      });

    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();

    // Set up realtime subscriptions for live updates
    const subscriptions = [
      // Articles changes
      supabase
        .channel('analytics-articles')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'articles' },
          () => fetchAnalyticsData()
        )
        .subscribe(),
      
      // Comments changes
      supabase
        .channel('analytics-comments')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'comments' },
          () => fetchAnalyticsData()
        )
        .subscribe(),
      
      // Article views changes
      supabase
        .channel('analytics-views')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'article_views' },
          () => fetchAnalyticsData()
        )
        .subscribe()
    ];

    // Refresh data every 5 minutes
    const interval = setInterval(fetchAnalyticsData, 5 * 60 * 1000);

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
      clearInterval(interval);
    };
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchAnalyticsData
  };
}