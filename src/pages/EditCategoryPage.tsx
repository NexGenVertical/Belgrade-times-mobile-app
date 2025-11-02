import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Category } from '../lib/supabase';
import { CategoryForm } from '../components/CategoryForm';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { ArrowLeft, AlertCircle, FolderOpen } from 'lucide-react';

export function EditCategoryPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || profile?.role !== 'admin') {
      navigate('/');
      return;
    }
    
    if (id) {
      fetchCategory(id);
    }
  }, [user, profile, navigate, id]);

  const fetchCategory = async (categoryId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', categoryId)
        .single();

      if (error) throw error;
      setCategory(data);
    } catch (error: any) {
      setError('Failed to load category: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user || profile?.role !== 'admin') {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600 dark:text-gray-400">Loading category...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <Link
            to="/admin/categories"
            className="inline-flex items-center gap-2 mb-6 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Categories</span>
          </Link>

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>

          <div className="mt-6">
            <Button onClick={() => navigate('/admin/categories')} variant="outline">
              Return to Categories
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <Link
            to="/admin/categories"
            className="inline-flex items-center gap-2 mb-6 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Categories</span>
          </Link>

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Category not found</AlertDescription>
          </Alert>

          <div className="mt-6">
            <Button onClick={() => navigate('/admin/categories')} variant="outline">
              Return to Categories
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <Link
          to="/admin/categories"
          className="inline-flex items-center gap-2 mb-6 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          style={{ minHeight: '44px' }}
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Categories</span>
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Edit Category
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Update the category information
          </p>
        </div>

        <CategoryForm
          mode="edit"
          categoryId={category.id}
          initialData={{
            name: category.name,
            slug: category.slug,
            description: category.description || '',
            color: category.color || '#6b7280',
            icon: category.icon || 'folder-open',
            sort_order: category.sort_order,
            is_active: category.is_active,
          }}
          onSuccess={() => navigate('/admin/categories')}
        />
      </div>
    </div>
  );
}
