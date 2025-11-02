import React, { useEffect, useState } from 'react';
import { ArticleCard } from '../components/ArticleCard';
import { CategoryNavigation } from '../components/CategoryNavigation';
import { FeaturedArticlesCarousel } from '../components/FeaturedArticlesCarousel';
import { EnhancedBreakingNewsBanner } from '../components/EnhancedBreakingNewsBanner';
import { AdManager } from '../components/AdManager';
import { supabase, Article } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { Search, Filter, Grid, List, TrendingUp } from 'lucide-react';

type ViewMode = 'grid' | 'list';
type SortOption = 'latest' | 'popular' | 'category';

export function HomePage() {
  const [articles, setArticles] = useState<(Article & { author_name: string })[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<(Article & { author_name: string })[]>([]);
  const [featuredArticles, setFeaturedArticles] = useState<(Article & { author_name: string })[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [searchQuery, setSearchQuery] = useState('');
  const { t, tInterpolated } = useLanguage();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterAndSortArticles();
  }, [articles, activeCategory, sortBy, searchQuery]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch articles with author information
      const { data: articlesData, error: articlesError } = await supabase
        .from('articles')
        .select(`
          *,
          author:profiles!articles_author_id_fkey (
            full_name
          )
        `)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(50); // Fetch more for better filtering

      if (articlesError) throw articlesError;

      if (!articlesData) {
        setArticles([]);
        setLoading(false);
        return;
      }

      // Process articles and extract unique categories
      const processedArticles = articlesData.map(article => ({
        ...article,
        author_name: article.author?.full_name || article.author_name || 'Unknown Author'
      }));

      // Extract unique categories
      const uniqueCategories = [...new Set(
        processedArticles
          .map(article => article.category)
          .filter(category => category && category.trim() !== '')
      )];

      setArticles(processedArticles);
      setCategories(uniqueCategories);
      setFeaturedArticles(processedArticles.slice(0, 5)); // Use top 5 as featured

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortArticles = () => {
    let filtered = [...articles];

    // Apply category filter
    if (activeCategory) {
      filtered = filtered.filter(article => article.category === activeCategory);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(query) ||
        article.excerpt?.toLowerCase().includes(query) ||
        article.content.toLowerCase().includes(query) ||
        article.author_name.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'latest':
        filtered.sort((a, b) => new Date(b.published_at || 0).getTime() - new Date(a.published_at || 0).getTime());
        break;
      case 'popular':
        // You could implement popularity based on views, shares, etc.
        filtered.sort((a, b) => new Date(b.published_at || 0).getTime() - new Date(a.published_at || 0).getTime());
        break;
      case 'category':
        filtered.sort((a, b) => {
          const aHasCategory = a.category ? 1 : 0;
          const bHasCategory = b.category ? 1 : 0;
          if (aHasCategory !== bHasCategory) {
            return bHasCategory - aHasCategory; // Articles with categories first
          }
          return (a.category || '').localeCompare(b.category || '');
        });
        break;
    }

    setFilteredArticles(filtered);
  };

  const handleCategoryChange = (category: string | null) => {
    setActiveCategory(category);
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Breaking News Banner */}
      <EnhancedBreakingNewsBanner />

      {/* Header Banner Advertisements */}
      <AdManager 
        placement="header_banner" 
        className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
        showLabel={true}
      />

      {/* Category Navigation */}
      <CategoryNavigation 
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Controls Bar */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder={t('search.searchArticles')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
              {/* Sort Options */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="latest">{t('search.sortLatest')}</option>
                <option value="popular">{t('search.sortPopular')}</option>
                <option value="category">{t('search.sortCategory')}</option>
              </select>

              {/* View Mode Toggle */}
              <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => handleViewModeChange('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                  aria-label="Grid view"
                >
                  <Grid size={18} />
                </button>
                <button
                  onClick={() => handleViewModeChange('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                  aria-label="List view"
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Active Filters */}
          {(activeCategory || searchQuery) && (
            <div className="flex items-center gap-2 mt-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">Active filters:</span>
              {activeCategory && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-full">
                  Category: {categories.find(c => c === activeCategory) || activeCategory}
                  <button
                    onClick={() => setActiveCategory(null)}
                    className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-1"
                  >
                    ×
                  </button>
                </span>
              )}
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm rounded-full">
                  Search: "{searchQuery}"
                  <button
                    onClick={() => setSearchQuery('')}
                    className="hover:bg-green-200 dark:hover:bg-green-800 rounded-full p-1"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Featured Articles Carousel */}
            {featuredArticles.length > 0 && (
              <section className="mb-12">
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp className="text-red-600" size={24} />
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                    {t('home.featuredStories')}
                  </h2>
                </div>
                <FeaturedArticlesCarousel 
                  featuredArticles={featuredArticles}
                  autoPlay={true}
                  autoPlayInterval={6000}
                />
              </section>
            )}

            {/* In-Content Advertisement */}
            <AdManager 
              placement="in_content"
              className="mb-8 text-center"
              showLabel={false}
            />

            {/* Articles Section */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  {activeCategory 
                    ? `${categories.find(c => c === activeCategory) || activeCategory} Vesti`
                    : searchQuery
                    ? `${t('home.searchResults')} (${filteredArticles.length})`
                    : t('home.latestArticles')
                  }
                </h2>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {tInterpolated('common.articlesCount', { count: filteredArticles.length })}
                </span>
              </div>

              {filteredArticles.length > 0 ? (
                <div className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                    : 'space-y-6'
                }>
                  {filteredArticles.map((article) => (
                    <ArticleCard 
                      key={article.id} 
                      article={article}
                      className={viewMode === 'list' ? 'md:flex md:gap-6' : ''}
                      layout={viewMode === 'list' ? 'horizontal' : 'vertical'}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 dark:text-gray-500 mb-4">
                    {searchQuery || activeCategory ? t('home.noArticlesFound') : t('home.noArticlesFound')}
                  </div>
                  {(searchQuery || activeCategory) && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setActiveCategory(null);
                      }}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {t('home.clearFilters')}
                    </button>
                  )}
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Sidebar Advertisements */}
            <AdManager 
              placement="sidebar_rectangle"
              className="mb-8"
              showLabel={true}
            />

            {/* Categories Widget */}
            {categories.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                  {t('category.categories')}
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setActiveCategory(null)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      !activeCategory
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {t('category.allCategories')}
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setActiveCategory(category)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        activeCategory === category
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Footer Advertisements (also show in sidebar on desktop) */}
            <AdManager 
              placement="footer_banner"
              className="mb-8"
              showLabel={true}
            />

            {/* Mobile Footer Ad */}
            <div className="md:hidden">
              <AdManager 
                placement="mobile_banner"
                className="text-center"
                showLabel={true}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}