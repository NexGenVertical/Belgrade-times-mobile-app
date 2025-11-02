import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchBar } from '../components/SearchBar';
import { SearchResults } from '../components/SearchResults';
import { supabase, Article } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';

const ITEMS_PER_PAGE = 12;

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useLanguage();
  const [articles, setArticles] = useState<(Article & { author_name?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalResults, setTotalResults] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [sortBy, setSortBy] = useState('published_at');

  const searchTerm = searchParams.get('q') || '';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  // Fetch categories for filter dropdown
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [searchParams, selectedCategory, dateRange, sortBy]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('category')
        .not('category', 'is', null)
        .eq('status', 'published');

      if (error) throw error;

      const uniqueCategories = [...new Set(data.map(item => item.category))].filter(Boolean) as string[];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchArticles = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('articles')
        .select('*', { count: 'exact' })
        .eq('status', 'published');

      // Apply search filter
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%,excerpt.ilike.%${searchTerm}%`);
      }

      // Apply category filter
      if (selectedCategory) {
        query = query.eq('category', selectedCategory);
      }

      // Apply date range filter
      if (dateRange) {
        const now = new Date();
        const daysAgo = parseInt(dateRange);
        const cutoffDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
        query = query.gte('published_at', cutoffDate.toISOString());
      }

      // Apply sorting
      const isDateSort = sortBy.includes('date');
      const ascending = sortBy.includes('asc');
      
      if (sortBy === 'relevance' && searchTerm) {
        // For relevance, we'll order by publication date and let the database handle it
        query = query.order('published_at', { ascending: false });
      } else if (isDateSort) {
        query = query.order('published_at', { ascending });
      } else if (sortBy === 'title') {
        query = query.order('title', { ascending });
      }

      // Apply pagination
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data: articlesData, error, count } = await query;

      if (error) throw error;

      // Enhance articles with author_name
      const articlesWithAuthor = (articlesData || []).map(article => ({
        ...article,
        author_name: article.author_name || 'Unknown Author'
      }));

      setArticles(articlesWithAuthor);
      setTotalResults(count || 0);
    } catch (error) {
      console.error('Error fetching articles:', error);
      setArticles([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalResults / ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', page.toString());
    setSearchParams(newParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFilterChange = (filterType: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    
    if (filterType === 'category') {
      setSelectedCategory(value);
      if (value) {
        newParams.set('category', value);
      } else {
        newParams.delete('category');
      }
    } else if (filterType === 'date') {
      setDateRange(value);
      if (value) {
        newParams.set('date', value);
      } else {
        newParams.delete('date');
      }
    } else if (filterType === 'sort') {
      setSortBy(value);
      newParams.set('sort', value);
    }
    
    newParams.set('page', '1'); // Reset to first page
    setSearchParams(newParams);
  };

  // Category mapping for display
  const categorySlugMap: Record<string, string> = {
    'politics': 'politika',
    'business': 'biznis',
    'sports': 'sport',
    'technology': 'tehnologija',
    'culture': 'kultura',
    'general': 'general'
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Search Header */}
        <div className="max-w-4xl mx-auto mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900 dark:text-white text-center">
            {t('search.title')}
          </h1>
          <SearchBar autoFocus compact />
        </div>

        {/* Filters */}
        {(selectedCategory || dateRange || sortBy !== 'published_at') && (
          <div className="max-w-4xl mx-auto mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
              <div className="flex flex-wrap items-center gap-4">
                {/* Category Filter */}
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('search.category')}
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">{t('search.allCategories')}</option>
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {t(`cat.${categorySlugMap[category.toLowerCase()] || category.toLowerCase()}`)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Range Filter */}
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('search.dateRange')}
                  </label>
                  <select
                    value={dateRange}
                    onChange={(e) => handleFilterChange('date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">{t('search.anyTime')}</option>
                    <option value="7">{t('search.pastWeek')}</option>
                    <option value="30">{t('search.pastMonth')}</option>
                    <option value="90">{t('search.past3Months')}</option>
                    <option value="365">{t('search.pastYear')}</option>
                  </select>
                </div>

                {/* Sort Filter */}
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('search.sortBy')}
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => handleFilterChange('sort', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="published_at-desc">{t('search.newestFirst')}</option>
                    <option value="published_at-asc">{t('search.oldestFirst')}</option>
                    <option value="title">{t('search.titleAZ')}</option>
                    {searchTerm && <option value="relevance">{t('search.relevance')}</option>}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="max-w-4xl mx-auto">
          <SearchResults
            articles={articles}
            loading={loading}
            searchTerm={searchTerm}
            totalResults={totalResults}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
}