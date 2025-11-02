import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, User, Tag, Search } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import type { Article } from '../lib/supabase';

interface SearchResultsProps {
  articles: (Article & { author_name?: string })[];
  loading: boolean;
  searchTerm: string;
  totalResults: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function SearchResults({
  articles,
  loading,
  searchTerm,
  totalResults,
  currentPage,
  totalPages,
  onPageChange
}: SearchResultsProps) {
  const { t, tInterpolated } = useLanguage();

  const categorySlugMap: Record<string, string> = {
    'politics': 'politika',
    'business': 'biznis',
    'sports': 'sport',
    'technology': 'tehnologija',
    'culture': 'kultura',
    'international': 'medunarodni',
    'general': 'general'
  };

  const getCategorySlug = (category: string) => {
    return categorySlugMap[category.toLowerCase()] || category.toLowerCase();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('sr-RS', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">{t('common.loading')}</span>
      </div>
    );
  }

  if (!searchTerm) {
    return (
      <div className="text-center py-12">
        <Search className="mx-auto h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {t('search.title')}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          {t('search.subtitle')}
        </p>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="text-center py-12">
        <Search className="mx-auto h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {t('search.noResults')}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          {tInterpolated('search.noResultsDesc', { query: searchTerm })}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Results Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {tInterpolated('search.resultsFor', { query: searchTerm })}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {tInterpolated('search.foundResults', { count: totalResults })}
        </p>
      </div>

      {/* Articles List */}
      <div className="space-y-6">
        {articles.map((article) => (
          <article key={article.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Featured Image */}
              {article.featured_image_url && (
                <div className="md:w-48 md:flex-shrink-0">
                  <Link to={`/article/${article.slug}`}>
                    <div className="aspect-video w-full md:w-48 overflow-hidden rounded-lg">
                      <img
                        src={article.featured_image_url}
                        alt={article.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  </Link>
                </div>
              )}

              {/* Content */}
              <div className="flex-1">
                {/* Category */}
                {article.category && (
                  <Link
                    to={`/category/${getCategorySlug(article.category)}`}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-red-600 text-white text-xs font-semibold rounded-full mb-3 hover:bg-red-700 transition-colors"
                  >
                    <Tag className="h-3 w-3" />
                    {t(`cat.${getCategorySlug(article.category)}`)}
                  </Link>
                )}

                {/* Title */}
                <Link to={`/article/${article.slug}`}>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-3 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                    {highlightText(article.title, searchTerm)}
                  </h3>
                </Link>

                {/* Excerpt */}
                {article.excerpt && (
                  <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                    {highlightText(article.excerpt, searchTerm)}
                  </p>
                )}

                {/* Meta Information */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  {article.author_name && (
                    <div className="flex items-center gap-1.5">
                      <User className="h-4 w-4" />
                      <span>{article.author_name}</span>
                    </div>
                  )}
                  
                  {article.published_at && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      <span>{formatDate(article.published_at)}</span>
                    </div>
                  )}

                  {article.reading_time && (
                    <span>{article.reading_time} {t('article.readingTime')}</span>
                  )}
                </div>

                {/* Read More Link */}
                <Link
                  to={`/article/${article.slug}`}
                  className="inline-block mt-4 px-6 py-2 bg-gray-900 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors"
                >
                  {t('article.readMore')}
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('common.previous')}
          </button>
          
          <span className="px-4 py-2 text-gray-600 dark:text-gray-400">
            {tInterpolated('search.pageOfTotal', { current: currentPage, total: totalPages })}
          </span>
          
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('common.next')}
          </button>
        </div>
      )}
    </div>
  );
}