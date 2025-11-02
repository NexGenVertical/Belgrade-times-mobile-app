import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, User } from 'lucide-react';
import { Article } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';

interface ArticleCardProps {
  article: Article & { author_name?: string };
  className?: string;
  layout?: 'vertical' | 'horizontal';
  featured?: boolean;
}

export function ArticleCard({ article, className = '', layout = 'vertical', featured = false }: ArticleCardProps) {
  const { t } = useLanguage();

  // Map English database categories to Serbian URL slugs
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

  const getCategoryColor = (category?: string | null) => {
    if (!category) return 'bg-gray-600';
    
    const colorMap: { [key: string]: string } = {
      'politics': 'bg-red-600',
      'business': 'bg-blue-600',
      'sports': 'bg-green-600',
      'technology': 'bg-purple-600',
      'culture': 'bg-pink-600',
      'general': 'bg-gray-600'
    };
    
    return colorMap[category.toLowerCase()] || 'bg-gray-600';
  };

  const getLayoutClasses = () => {
    if (layout === 'horizontal') {
      return 'md:flex md:gap-6';
    }
    return '';
  };

  const getImageClasses = () => {
    if (layout === 'horizontal') {
      return 'md:w-1/3 md:aspect-square aspect-video w-full overflow-hidden rounded-l-lg';
    }
    return 'aspect-video w-full overflow-hidden';
  };

  return (
    <article className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow ${getLayoutClasses()} ${className}`}>
      {/* Featured Image */}
      {article.featured_image_url && (
        <Link to={`/article/${article.slug}`}>
          <div className={getImageClasses()}>
            <img
              src={article.featured_image_url}
              alt={article.title}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
        </Link>
      )}

      {/* Content */}
      <div className="p-4 md:p-5 flex-1">
        {/* Featured Badge */}
        {featured && (
          <div className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-red-600 to-red-700 text-white text-xs font-bold rounded-full mb-3">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
            FEATURED
          </div>
        )}

        {/* Category and Title Container - Improved Mobile Layout */}
        <div className="mb-4">
          {/* Category Tag */}
          {article.category && (
            <Link
              to={`/category/${getCategorySlug(article.category)}`}
              className={`inline-block px-3 py-1 text-white text-xs font-semibold rounded-full hover:opacity-90 transition-opacity ${getCategoryColor(article.category)}`}
            >
              {t(`cat.${getCategorySlug(article.category)}`)}
            </Link>
          )}

          {/* Title - Better Mobile Spacing */}
          <Link to={`/article/${article.slug}`}>
            <h2 className={`font-bold text-gray-900 dark:text-white hover:text-red-600 dark:hover:text-red-400 transition-colors ${
              layout === 'horizontal' ? 'text-lg md:text-xl' : 'text-lg md:text-2xl'
            }`}>
              {article.title}
            </h2>
          </Link>
        </div>

        {/* Excerpt - Improved Mobile Spacing */}
        {article.excerpt && (
          <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed line-clamp-3">
            {article.excerpt}
          </p>
        )}

        {/* Meta Information - Better Mobile Layout */}
        <div className="flex flex-wrap items-center gap-3 md:gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
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

        {/* Read More Link - Improved Mobile Layout */}
        <Link
          to={`/article/${article.slug}`}
          className="inline-block px-6 py-3 bg-gray-900 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors font-medium"
        >
          {t('article.readMore')}
        </Link>
      </div>
    </article>
  );
}
