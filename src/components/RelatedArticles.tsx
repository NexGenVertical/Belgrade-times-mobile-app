import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, User } from 'lucide-react';
import { supabase, Article } from '../lib/supabase';

interface RelatedArticlesProps {
  currentArticleId: string;
  currentCategory?: string | null;
  currentTags?: string[] | null;
  excludeIds?: string[];
}

export function RelatedArticles({ 
  currentArticleId, 
  currentCategory, 
  currentTags, 
  excludeIds = [] 
}: RelatedArticlesProps) {
  const [relatedArticles, setRelatedArticles] = useState<(Article & { 
    author_name: string; 
    view_count?: number;
  })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRelatedArticles();
  }, [currentArticleId, currentCategory, currentTags]);

  const fetchRelatedArticles = async () => {
    try {
      let query = supabase
        .from('articles')
        .select(`
          *,
          article_views(count)
        `)
        .eq('status', 'published')
        .neq('id', currentArticleId)
        .not('featured_image_url', 'is', null)
        .limit(6);

      // Filter by category if available
      if (currentCategory) {
        query = query.eq('category', currentCategory);
      }

      // Exclude specific IDs
      if (excludeIds.length > 0) {
        query = query.not('id', 'in', `(${excludeIds.join(',')})`);
      }

      const { data: articles, error } = await query.order('published_at', { ascending: false });

      if (error) throw error;

      // Calculate view counts for each article
      const articlesWithViews = await Promise.all(
        (articles || []).map(async (article) => {
          const { count } = await supabase
            .from('article_views')
            .select('*', { count: 'exact', head: true })
            .eq('article_id', article.id);

          return {
            ...article,
            view_count: count || 0
          };
        })
      );

      setRelatedArticles(articlesWithViews);
    } catch (error) {
      console.error('Error fetching related articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('sr-RS', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / wordsPerMinute);
    return readingTime;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Related Articles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-300 dark:bg-gray-600 h-40 rounded-lg mb-3"></div>
              <div className="bg-gray-300 dark:bg-gray-600 h-4 rounded mb-2"></div>
              <div className="bg-gray-300 dark:bg-gray-600 h-3 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (relatedArticles.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
        {currentCategory ? 'More in ' : 'Recommended Articles'}
        {currentCategory && (
          <span className="text-blue-600 dark:text-blue-400 ml-2">
            {currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1)}
          </span>
        )}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {relatedArticles.map((article) => (
          <Link
            key={article.id}
            to={`/article/${article.slug}`}
            className="group block hover:shadow-lg transition-shadow duration-200"
          >
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden">
              {/* Featured Image */}
              {article.featured_image_url && (
                <div className="aspect-video overflow-hidden">
                  <img
                    src={article.featured_image_url}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                </div>
              )}

              {/* Content */}
              <div className="p-4">
                {/* Category */}
                {article.category && (
                  <span className="inline-block px-2 py-1 bg-red-600 text-white text-xs font-semibold rounded-full mb-2">
                    {article.category.charAt(0).toUpperCase() + article.category.slice(1)}
                  </span>
                )}

                {/* Title */}
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {article.title}
                </h4>

                {/* Excerpt */}
                {article.excerpt && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                    {article.excerpt}
                  </p>
                )}

                {/* Meta Information */}
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-3">
                    {article.author_name && (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{article.author_name}</span>
                      </div>
                    )}
                    {article.published_at && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(article.published_at)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span>{getReadingTime(article.content)} min read</span>
                    {article.view_count !== undefined && article.view_count > 0 && (
                      <span className="text-blue-600 dark:text-blue-400">
                        {article.view_count} views
                      </span>
                    )}
                  </div>
                </div>

                {/* Tags */}
                {article.tags && article.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {article.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400 rounded text-xs"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* View More Link */}
      {currentCategory && (
        <div className="mt-6 text-center">
          <Link
            to={`/category/${currentCategory.toLowerCase()}`}
            className="inline-flex items-center px-4 py-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors"
          >
            View all articles in {currentCategory}
          </Link>
        </div>
      )}
    </div>
  );
}