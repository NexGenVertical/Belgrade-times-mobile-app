import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft } from 'lucide-react';
import { ArticleForm } from '../components/ArticleForm';

export function EditArticlePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const [loadingArticle, setLoadingArticle] = useState(true);
  const [error, setError] = useState('');
  const [articleData, setArticleData] = useState<any>(null);

  useEffect(() => {
    if (!user || profile?.role !== 'admin') {
      navigate('/');
      return;
    }
    if (id) {
      fetchArticle();
    }
  }, [user, profile, navigate, id]);

  const fetchArticle = async () => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        setArticleData({
          title: data.title || '',
          slug: data.slug || '',
          content: data.content || '',
          excerpt: data.excerpt || '',
          author_name: data.author_name || 'Admin User',
          category: data.category || '',
          featured_image_url: data.featured_image_url || '',
          tags: Array.isArray(data.tags) ? data.tags.join(', ') : '',
          reading_time: data.reading_time || 1,
          status: data.status || 'draft',
          language: data.language || 'sr',
          meta_title: data.meta_title || '',
          meta_description: data.meta_description || '',
          publish_action: data.status === 'published' ? 'publish_now' : data.status === 'scheduled' ? 'schedule' : 'draft',
          scheduled_date: data.scheduled_publish_date ? new Date(data.scheduled_publish_date).toISOString().slice(0, 16) : ''
        });
      }
    } catch (error: any) {
      console.error('Error fetching article:', error);
      setError('Failed to load article');
    } finally {
      setLoadingArticle(false);
    }
  };

  if (!user || profile?.role !== 'admin') {
    return null;
  }

  if (loadingArticle) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-xl text-gray-900 dark:text-white">Loading article...</div>
      </div>
    );
  }

  if (error || !articleData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <button
            onClick={() => navigate('/admin/articles')}
            className="inline-flex items-center gap-2 mb-6 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            style={{ minHeight: '44px' }}
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Articles</span>
          </button>
          <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 p-4 rounded-lg">
            {error || 'Article not found'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/admin/articles')}
          className="inline-flex items-center gap-2 mb-6 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          style={{ minHeight: '44px' }}
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Articles</span>
        </button>

        <ArticleForm 
          mode="edit" 
          articleId={id}
          initialData={articleData}
        />
      </div>
    </div>
  );
}
