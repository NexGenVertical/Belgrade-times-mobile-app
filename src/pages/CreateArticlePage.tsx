import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft } from 'lucide-react';
import { ArticleForm } from '../components/ArticleForm';

export function CreateArticlePage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  useEffect(() => {
    if (!user || profile?.role !== 'admin') {
      navigate('/');
    }
  }, [user, profile, navigate]);

  if (!user || profile?.role !== 'admin') {
    return null;
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

        <ArticleForm mode="create" />
      </div>
    </div>
  );
}
