import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArticleCard } from '../components/ArticleCard';
import { supabase, Article, Category } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowLeft, Tag, Clock, FileText } from 'lucide-react';

export function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [articles, setArticles] = useState<(Article & { author_name: string })[]>([]);
  const [categoryInfo, setCategoryInfo] = useState<Category | null>(null);
  const [articleCount, setArticleCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { t, tInterpolated } = useLanguage();

  // Map Serbian slugs to English database categories
  const categoryMap: Record<string, string> = {
    'politika': 'politics',
    'biznis': 'business',
    'sport': 'sports',
    'tehnologija': 'technology',
    'kultura': 'culture'
  };

  useEffect(() => {
    if (slug) {
      fetchCategoryData();
    }
  }, [slug]);

  const fetchCategoryData = async () => {
    try {
      const dbCategory = categoryMap[slug] || slug;
      
      // Fetch category info from categories table
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', dbCategory)
        .eq('is_active', true)
        .single();

      if (categoryError && categoryError.code !== 'PGRST116') {
        console.warn('Category not found in categories table, falling back to default');
      } else {
        setCategoryInfo(categoryData);
      }

      // Fetch articles count
      const { count: totalCount, error: countError } = await supabase
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published')
        .eq('category', dbCategory);

      if (countError) {
        console.error('Error fetching article count:', countError);
      } else {
        setArticleCount(totalCount || 0);
      }

      // Fetch articles
      const { data: articlesData, error: articlesError } = await supabase
        .from('articles')
        .select('*')
        .eq('status', 'published')
        .eq('category', dbCategory)
        .order('published_at', { ascending: false });

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
      console.error('Error fetching category data:', error);
      setArticles([]);
      setCategoryInfo(null);
      setArticleCount(0);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryTitle = () => {
    if (categoryInfo?.name) {
      return categoryInfo.name;
    }
    return t(`cat.${slug}`);
  };

  const getCategoryDescription = () => {
    if (categoryInfo?.description) {
      return categoryInfo.description;
    }
    return tInterpolated(`cat.description.${slug}`, { fallback: 'Articles in this category' });
  };

  const getCategoryColor = () => {
    if (categoryInfo?.color) {
      return categoryInfo.color;
    }
    // Default colors based on category
    const defaultColors: Record<string, string> = {
      'politika': 'bg-blue-600',
      'biznis': 'bg-green-600', 
      'sport': 'bg-orange-600',
      'tehnologija': 'bg-purple-600',
      'kultura': 'bg-pink-600'
    };
    return defaultColors[slug] || 'bg-gray-600';
  };

  const getCategoryIcon = () => {
    if (categoryInfo?.icon) {
      return categoryInfo.icon;
    }
    // Default icons based on category
    const defaultIcons: Record<string, string> = {
      'politika': '🏛️',
      'biznis': '💼',
      'sport': '⚽',
      'tehnologija': '💻',
      'kultura': '🎭'
    };
    return defaultIcons[slug] || '📄';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        <span className="ml-2 text-xl text-gray-600 dark:text-gray-400">{t('common.loading')}</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Back Navigation */}
        <Link 
          to="/categories" 
          className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t('common.backToCategories')}</span>
        </Link>

        {/* Category Header */}
        <div className="mb-8">
          <div className={`${getCategoryColor()} rounded-lg p-6 text-white mb-6`}>
            <div className="flex items-center gap-4 mb-4">
              <div className="text-4xl">{getCategoryIcon()}</div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold">
                  {getCategoryTitle()}
                </h1>
                <div className="flex items-center gap-6 mt-2 text-lg opacity-90">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    <span>{articleCount} {articleCount === 1 ? t('common.article') : t('common.articles')}</span>
                  </div>
                </div>
              </div>
            </div>
            {getCategoryDescription() && (
              <p className="text-lg opacity-90 max-w-3xl">
                {getCategoryDescription()}
              </p>
            )}
          </div>
        </div>

        {/* Articles Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {articleCount > 0 ? tInterpolated('category.articles', { count: articleCount }) : t('category.noArticles')}
            </h2>
          </div>

          {articles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map(article => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">{getCategoryIcon()}</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {t('category.noArticles')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('category.noArticlesDesc')}
              </p>
              <Link 
                to="/" 
                className="inline-block mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                {t('common.backToHome')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
