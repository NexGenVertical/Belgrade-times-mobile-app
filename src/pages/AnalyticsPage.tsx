import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAnalytics } from '../hooks/useAnalytics';
import { useLiveMetrics } from '../hooks/useLiveMetrics';
import { useArticleAnalytics } from '../hooks/useArticleAnalytics';
import { MetricsCard } from '../components/MetricsCard';
import { AnalyticsChart } from '../components/AnalyticsChart';
import { ActivityFeed } from '../components/ActivityFeed';
import { 
  ArrowLeft, 
  BarChart, 
  TrendingUp, 
  Users, 
  FileText, 
  Eye, 
  MessageSquare, 
  MousePointer,
  Activity,
  RefreshCw,
  Calendar,
  Target
} from 'lucide-react';

export function AnalyticsPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'articles' | 'users' | 'ads'>('overview');

  const { data: analyticsData, loading: analyticsLoading, error: analyticsError, refetch: refetchAnalytics } = useAnalytics();
  const { metrics: liveMetrics, loading: liveLoading, refetch: refetchLive } = useLiveMetrics();
  const { data: articleData, loading: articlesLoading, error: articlesError, refetch: refetchArticles } = useArticleAnalytics();

  useEffect(() => {
    if (!user || profile?.role !== 'admin') {
      navigate('/');
    }
  }, [user, profile, navigate]);

  if (!user || profile?.role !== 'admin') {
    return null;
  }

  const handleRefresh = () => {
    refetchAnalytics();
    refetchLive();
    refetchArticles();
  };

  const isLoading = analyticsLoading || liveLoading || articlesLoading;
  const hasError = analyticsError || articlesError;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin')}
              className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              style={{ minHeight: '44px' }}
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Admin</span>
            </button>
            
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Analytics Dashboard
            </h1>
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Error Alert */}
        {hasError && (
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-6">
            <p className="font-medium">Error loading analytics data:</p>
            <p className="text-sm">{analyticsError || articlesError}</p>
          </div>
        )}

        {/* Live Metrics Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-6">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-gray-600 dark:text-gray-400">Live Visitors:</span>
              <span className="font-bold text-green-600 dark:text-green-400">
                {liveMetrics.currentVisitors}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-500" />
              <span className="text-gray-600 dark:text-gray-400">Today's Views:</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {liveMetrics.todayViews.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-green-500" />
              <span className="text-gray-600 dark:text-gray-400">Today's Comments:</span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                {liveMetrics.todayComments}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart },
            { id: 'articles', label: 'Articles', icon: FileText },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'ads', label: 'Advertisements', icon: Target }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricsCard
                title="Total Articles"
                value={analyticsData?.totalArticles || 0}
                icon={FileText}
                iconColor="text-blue-600 dark:text-blue-400"
                loading={analyticsLoading}
              />
              <MetricsCard
                title="Total Views"
                value={analyticsData?.totalViews || 0}
                icon={Eye}
                iconColor="text-green-600 dark:text-green-400"
                loading={analyticsLoading}
              />
              <MetricsCard
                title="Total Comments"
                value={analyticsData?.totalComments || 0}
                icon={MessageSquare}
                iconColor="text-purple-600 dark:text-purple-400"
                loading={analyticsLoading}
              />
              <MetricsCard
                title="Total Users"
                value={analyticsData?.totalUsers || 0}
                icon={Users}
                iconColor="text-orange-600 dark:text-orange-400"
                loading={analyticsLoading}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Views Chart */}
              <AnalyticsChart
                title="Views Over Time (Last 7 Days)"
                data={analyticsData?.recentViews || []}
                type="area"
                color="rgb(59, 130, 246)"
                loading={analyticsLoading}
              />
              
              {/* Comments Chart */}
              <AnalyticsChart
                title="Comments Over Time (Last 7 Days)"
                data={analyticsData?.recentComments || []}
                type="line"
                color="rgb(16, 185, 129)"
                loading={analyticsLoading}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <ActivityFeed
                activities={analyticsData?.activityFeed || []}
                loading={analyticsLoading}
              />

              {/* Popular Categories */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Popular Categories</h3>
                {analyticsLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="animate-pulse flex items-center justify-between">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                      </div>
                    ))}
                  </div>
                ) : analyticsData?.popularCategories && analyticsData.popularCategories.length > 0 ? (
                  <div className="space-y-3">
                    {analyticsData.popularCategories.map((category, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-gray-900 dark:text-white font-medium">{category.name}</span>
                        <span className="text-gray-600 dark:text-gray-400">{category.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">No category data available</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Articles Tab */}
        {activeTab === 'articles' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Viewed Articles */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Viewed Articles</h3>
                {articlesLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : articleData?.topViewed && articleData.topViewed.length > 0 ? (
                  <div className="space-y-3">
                    {articleData.topViewed.slice(0, 8).map((article, index) => (
                      <div key={article.id} className="border-b border-gray-100 dark:border-gray-700 last:border-b-0 pb-3 last:pb-0">
                        <div className="flex items-start justify-between">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 pr-2">
                            {article.title}
                          </h4>
                          <div className="text-right flex-shrink-0">
                            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                              {article.views}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">views</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>{article.comments} comments</span>
                          {article.viewsToday > 0 && (
                            <span className="text-green-600 dark:text-green-400">+{article.viewsToday} today</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">No article data available</p>
                )}
              </div>

              {/* Top Commented Articles */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Most Commented Articles</h3>
                {articlesLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : articleData?.topCommented && articleData.topCommented.length > 0 ? (
                  <div className="space-y-3">
                    {articleData.topCommented.slice(0, 8).map((article, index) => (
                      <div key={article.id} className="border-b border-gray-100 dark:border-gray-700 last:border-b-0 pb-3 last:pb-0">
                        <div className="flex items-start justify-between">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 pr-2">
                            {article.title}
                          </h4>
                          <div className="text-right flex-shrink-0">
                            <div className="text-lg font-bold text-green-600 dark:text-green-400">
                              {article.comments}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">comments</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>{article.views} views</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">No comment data available</p>
                )}
              </div>
            </div>

            {/* Publication Trends */}
            <AnalyticsChart
              title="Publication Trends (Last 30 Days)"
              data={articleData?.publicationTrends || []}
              type="bar"
              color="rgb(139, 92, 246)"
              loading={articlesLoading}
            />

            {/* Category Performance */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Category Performance</h3>
              {articlesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="animate-pulse bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                      <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-1/2 mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              ) : articleData?.categoryPerformance && articleData.categoryPerformance.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {articleData.categoryPerformance.map((category, index) => (
                    <div key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{category.category}</h4>
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                        {category.totalViews}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {category.totalArticles} articles
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Avg: {category.avgViews} views/article
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">No category performance data available</p>
              )}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">User Registration Trends</h3>
              <AnalyticsChart
                title="New Users (Last 7 Days)"
                data={analyticsData?.recentUsers || []}
                type="line"
                color="rgb(168, 85, 247)"
                loading={analyticsLoading}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">User Statistics</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Total Registered Users</span>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {analyticsData?.totalUsers || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Active Articles</span>
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {liveMetrics.activeArticles}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Engagement Rate</span>
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {analyticsData?.totalViews && analyticsData.totalComments 
                        ? Math.round((analyticsData.totalComments / analyticsData.totalViews) * 100)
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
                <ActivityFeed
                  activities={analyticsData?.activityFeed?.filter(a => a.type === 'user') || []}
                  loading={analyticsLoading}
                  maxItems={5}
                />
              </div>
            </div>
          </div>
        )}

        {/* Advertisements Tab */}
        {activeTab === 'ads' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricsCard
                title="Total Ad Clicks"
                value={analyticsData?.totalAdClicks || 0}
                icon={MousePointer}
                iconColor="text-pink-600 dark:text-pink-400"
                loading={analyticsLoading}
              />
              <MetricsCard
                title="Total Impressions"
                value={analyticsData?.totalAdImpressions || 0}
                icon={Eye}
                iconColor="text-purple-600 dark:text-purple-400"
                loading={analyticsLoading}
              />
              <MetricsCard
                title="Click-Through Rate"
                value={
                  analyticsData?.totalAdImpressions 
                    ? `${((analyticsData.totalAdClicks / analyticsData.totalAdImpressions) * 100).toFixed(2)}%`
                    : '0%'
                }
                icon={TrendingUp}
                iconColor="text-green-600 dark:text-green-400"
                loading={analyticsLoading}
              />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Advertisement Performance</h3>
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Advertisement analytics coming soon</p>
                <p className="text-sm mt-1">Detailed ad performance metrics will be available here</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
