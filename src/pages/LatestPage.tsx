import React, { useEffect, useState } from 'react';
import { ArticleCard } from '../components/ArticleCard';
import { supabase, Article } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';

export function LatestPage() {
  const [articles, setArticles] = useState<(Article & { author_name: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    fetchLatestArticles();
  }, []);

  const fetchLatestArticles = async () => {
    try {
      const { data: articlesData, error: articlesError } = await supabase
        .from('articles')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(24);

      if (articlesError) throw articlesError;

      if (!articlesData || articlesData.length === 0) {
        setArticles([]);
        setLoading(false);
        return;
      }

      // Use author_name from articles table directly
      const articlesWithAuthor = articlesData.map(article => ({
        ...article,
        author_name: article.author_name || 'Unknown Author'
      }));

      setArticles(articlesWithAuthor);
    } catch (error) {
      console.error('Error fetching latest articles:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-gray-900 dark:text-white">
          {t('nav.latest')}
        </h1>

        {articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map(article => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">No articles found.</p>
        )}
      </div>
    </div>
  );
}
