import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Newspaper, FileText, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase, Category } from '../lib/supabase';

interface CategoryWithCount extends Category {
  article_count: number;
}

export function CategoriesPage() {
  const { t, tInterpolated } = useLanguage();
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      // First, try to get categories from the categories table
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (categoriesError) {
        console.warn('Categories table query failed, falling back to default categories:', categoriesError);
        // Fallback to default categories if categories table doesn't exist or fails
        const defaultCategories: CategoryWithCount[] = [
          { id: '1', name: 'Politics', slug: 'politika', description: null, color: 'bg-blue-600', icon: '🏛️', sort_order: 1, is_active: true, article_count: 0 },
          { id: '2', name: 'Business', slug: 'biznis', description: null, color: 'bg-green-600', icon: '💼', sort_order: 2, is_active: true, article_count: 0 },
          { id: '3', name: 'Sports', slug: 'sport', description: null, color: 'bg-orange-600', icon: '⚽', sort_order: 3, is_active: true, article_count: 0 },
          { id: '4', name: 'Technology', slug: 'tehnologija', description: null, color: 'bg-purple-600', icon: '💻', sort_order: 4, is_active: true, article_count: 0 },
          { id: '5', name: 'Culture', slug: 'kultura', description: null, color: 'bg-pink-600', icon: '🎭', sort_order: 5, is_active: true, article_count: 0 }
        ];

        // Fetch article counts for default categories
        const categoriesWithCounts = await Promise.all(
          defaultCategories.map(async (category) => {
            const dbCategory = category.slug === 'politika' ? 'politics' :
                             category.slug === 'biznis' ? 'business' :
                             category.slug === 'sport' ? 'sports' :
                             category.slug === 'tehnologija' ? 'technology' :
                             category.slug === 'kultura' ? 'culture' : category.slug;

            const { count } = await supabase
              .from('articles')
              .select('*', { count: 'exact', head: true })
              .eq('status', 'published')
              .eq('category', dbCategory);

            return { ...category, article_count: count || 0 };
          })
        );

        setCategories(categoriesWithCounts);
        setLoading(false);
        return;
      }

      // If we have categories from the database, fetch article counts for each
      const categoriesWithCounts = await Promise.all(
        (categoriesData || []).map(async (category) => {
          // Map database category to URL slug if needed
          const urlSlug = category.slug === 'politics' ? 'politika' :
                         category.slug === 'business' ? 'biznis' :
                         category.slug === 'sports' ? 'sport' :
                         category.slug === 'technology' ? 'tehnologija' :
                         category.slug === 'culture' ? 'kultura' : category.slug;

          const { count } = await supabase
            .from('articles')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'published')
            .eq('category', category.slug);

          return { ...category, slug: urlSlug, article_count: count || 0 };
        })
      );

      setCategories(categoriesWithCounts);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const getCategoryTitle = (category: CategoryWithCount) => {
    if (category.name) {
      return category.name;
    }
    return t(`cat.${category.slug}`);
  };

  const getCategoryDescription = (category: CategoryWithCount) => {
    if (category.description) {
      return category.description;
    }
    return tInterpolated(`cat.description.${category.slug}`, { fallback: 'Latest news and updates' });
  };

  const getCategoryColor = (category: CategoryWithCount) => {
    return category.color || 'bg-gray-600';
  };

  const getCategoryIcon = (category: CategoryWithCount) => {
    return category.icon || '📄';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="animate-spin h-8 w-8 text-red-600" />
        <span className="ml-2 text-xl text-gray-600 dark:text-gray-400">{t('common.loading')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Newspaper className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('common.error')}</h3>
          <p className="text-gray-600 dark:text-gray-400">{t('common.errorDesc')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-gray-900 dark:text-white">
          {t('nav.categories')}
        </h1>

        {categories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/category/${category.slug}`}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow group"
              >
                <div className={`${getCategoryColor(category)} h-32 flex items-center justify-center text-6xl relative`}>
                  {getCategoryIcon(category)}
                  {category.article_count > 0 && (
                    <div className="absolute top-2 right-2 bg-white/20 backdrop-blur-sm rounded-full px-2 py-1">
                      <div className="flex items-center gap-1 text-white text-xs font-semibold">
                        <FileText className="h-3 w-3" />
                        <span>{category.article_count}</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-red-600 transition-colors mb-2">
                    {getCategoryTitle(category)}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                    {getCategoryDescription(category)}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <FileText className="h-4 w-4" />
                    <span>
                      {category.article_count === 0 
                        ? t('category.noArticles') 
                        : category.article_count === 1 
                          ? t('common.oneArticle') 
                          : tInterpolated('common.articlesCount', { count: category.article_count })
                      }
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Newspaper className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {t('category.noCategories')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {t('category.noCategoriesDesc')}
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
  );
}
