import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, Article } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Edit, Trash2, ArrowLeft, Search, Filter, CheckSquare, Square } from 'lucide-react';

export function ArticlesManagementPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedArticles, setSelectedArticles] = useState<Set<string>>(new Set());
  const [categories, setCategories] = useState<any[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const articlesPerPage = 10;
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || profile?.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchArticles();
    fetchCategories();

    // Set up realtime subscription for articles table
    const articlesSubscription = supabase
      .channel('articles-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'articles' },
        (payload) => {
          console.log('Realtime articles change detected:', payload);
          // Refetch articles when any change occurs (insert, update, delete)
          fetchArticles();
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    // Cleanup subscription on unmount
    return () => {
      console.log('Unsubscribing from articles changes');
      articlesSubscription.unsubscribe();
    };
  }, [user, profile, navigate]);

  const fetchArticles = async () => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setArticles(data || []);
      setFilteredArticles(data || []);
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    // Use a more prominent confirmation dialog
    const userConfirmed = confirm(`Are you sure you want to delete "${title}"?\n\nThis action cannot be undone.`);
    
    if (!userConfirmed) {
      console.log('Delete operation cancelled by user');
      return;
    }

    console.log(`Attempting to delete article: ${title} (ID: ${id})`);

    try {
      setError('');
      setSuccess('');
      
      const { error: deleteError } = await supabase
        .from('articles')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Supabase delete error:', deleteError);
        throw deleteError;
      }
      
      // Update local state immediately
      setArticles(prevArticles => {
        const updated = prevArticles.filter(a => a.id !== id);
        console.log(`Article removed from local state. Remaining articles: ${updated.length}`);
        return updated;
      });
      
      setSuccess(`Article "${title}" deleted successfully`);
      setTimeout(() => setSuccess(''), 3000);
      
      console.log('Delete operation completed successfully');
    } catch (error: any) {
      console.error('Error deleting article:', error);
      setError(error.message || `Failed to delete article "${title}"`);
      setTimeout(() => setError(''), 5000);
    }
  };

  // Filter articles based on search term, status, and category
  useEffect(() => {
    let filtered = [...articles];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(term) ||
        article.content.toLowerCase().includes(term) ||
        (article.excerpt && article.excerpt.toLowerCase().includes(term))
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(article => article.status === statusFilter);
    }

    // Category filter
    if (categoryFilter) {
      filtered = filtered.filter(article => article.category === categoryFilter);
    }

    setFilteredArticles(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [articles, searchTerm, statusFilter, categoryFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredArticles.length / articlesPerPage);
  const startIndex = (currentPage - 1) * articlesPerPage;
  const endIndex = startIndex + articlesPerPage;
  const paginatedArticles = filteredArticles.slice(startIndex, endIndex);

  // Bulk actions
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedArticles(new Set(paginatedArticles.map(a => a.id)));
      setShowBulkActions(true);
    } else {
      setSelectedArticles(new Set());
      setShowBulkActions(false);
    }
  };

  const handleSelectArticle = (articleId: string) => {
    const newSelected = new Set(selectedArticles);
    if (newSelected.has(articleId)) {
      newSelected.delete(articleId);
    } else {
      newSelected.add(articleId);
    }
    setSelectedArticles(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const handleBulkAction = async (action: string) => {
    if (selectedArticles.size === 0) return;

    const selectedIds = Array.from(selectedArticles);
    try {
      setError('');
      setSuccess('');

      if (action === 'delete') {
        const confirmed = confirm(`Are you sure you want to delete ${selectedArticles.size} article(s)?\n\nThis action cannot be undone.`);
        if (!confirmed) return;

        const { error } = await supabase
          .from('articles')
          .delete()
          .in('id', selectedIds);

        if (error) throw error;
        setSuccess(`${selectedArticles.size} article(s) deleted successfully`);
      } else if (action === 'publish' || action === 'unpublish') {
        const status = action === 'publish' ? 'published' : 'draft';
        const { error } = await supabase
          .from('articles')
          .update({ 
            status,
            published_at: action === 'publish' ? new Date().toISOString() : null
          })
          .in('id', selectedIds);

        if (error) throw error;
        setSuccess(`${selectedArticles.size} article(s) ${action}ed successfully`);
      }

      setSelectedArticles(new Set());
      setShowBulkActions(false);
      await fetchArticles();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      console.error('Bulk action error:', error);
      setError(error.message || `Failed to ${action} articles`);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setCategoryFilter('');
    setCurrentPage(1);
  };

  if (!user || profile?.role !== 'admin') {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/admin')}
          className="inline-flex items-center gap-2 mb-6 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          style={{ minHeight: '44px' }}
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Admin</span>
        </button>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Manage Articles
          </h1>
          <Link
            to="/admin/articles/create"
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            style={{ minHeight: '44px' }}
          >
            <Plus className="h-5 w-5" />
            <span>Create Article</span>
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 dark:bg-gray-700 dark:text-white"
                style={{ minHeight: '44px' }}
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 dark:bg-gray-700 dark:text-white"
                style={{ minHeight: '44px' }}
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="scheduled">Scheduled</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 dark:bg-gray-700 dark:text-white"
                style={{ minHeight: '44px' }}
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
            <div>
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                style={{ minHeight: '44px' }}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredArticles.length} of {articles.length} articles
          {searchTerm && ` (filtered by "${searchTerm}")`}
          {statusFilter && ` (status: ${statusFilter})`}
          {categoryFilter && ` (category: ${categoryFilter})`}
        </div>

        {/* Bulk Actions Bar */}
        {showBulkActions && (
          <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="text-blue-700 dark:text-blue-300 font-medium">
                  {selectedArticles.size} article(s) selected
                </span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleBulkAction('publish')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  style={{ minHeight: '44px' }}
                >
                  Publish
                </button>
                <button
                  onClick={() => handleBulkAction('unpublish')}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium"
                  style={{ minHeight: '44px' }}
                >
                  Unpublish
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  style={{ minHeight: '44px' }}
                >
                  Delete
                </button>
                <button
                  onClick={() => {
                    setSelectedArticles(new Set());
                    setShowBulkActions(false);
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                  style={{ minHeight: '44px' }}
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-3 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded-lg">
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg">
            {error}
          </div>
        )}

        {articles.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">No articles found</p>
            <Link
              to="/admin/articles/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              style={{ minHeight: '44px' }}
            >
              <Plus className="h-5 w-5" />
              <span>Create Your First Article</span>
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedArticles.size === paginatedArticles.length && paginatedArticles.length > 0}
                          onChange={handleSelectAll}
                          className="rounded border-gray-300 text-red-600 focus:ring-red-600"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Author
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Published
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                    {paginatedArticles.map((article) => (
                      <tr key={article.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedArticles.has(article.id)}
                            onChange={() => handleSelectArticle(article.id)}
                            className="rounded border-gray-300 text-red-600 focus:ring-red-600"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {article.title}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {article.slug}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          {article.author_name || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          {article.category || 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            article.status === 'published'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : article.status === 'draft'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {article.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {article.published_at ? new Date(article.published_at).toLocaleDateString() : 'Not published'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Link
                              to={`/admin/articles/edit/${article.id}`}
                              className="inline-flex items-center justify-center p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded transition-colors"
                              style={{ minWidth: '44px', minHeight: '44px' }}
                              title="Edit Article"
                            >
                              <Edit className="h-5 w-5" />
                            </Link>
                            <button
                              onClick={() => handleDelete(article.id, article.title)}
                              className="inline-flex items-center justify-center p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded transition-colors"
                              style={{ minWidth: '44px', minHeight: '44px' }}
                              title="Delete Article"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {paginatedArticles.map((article) => (
                <div key={article.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <input
                      type="checkbox"
                      checked={selectedArticles.has(article.id)}
                      onChange={() => handleSelectArticle(article.id)}
                      className="mt-1 rounded border-gray-300 text-red-600 focus:ring-red-600"
                    />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {article.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        {article.slug}
                      </p>
                      <div className="flex flex-wrap gap-2 text-sm mb-2">
                        <span className="text-gray-600 dark:text-gray-300">
                          <strong>Author:</strong> {article.author_name || 'Unknown'}
                        </span>
                        <span className="text-gray-600 dark:text-gray-300">
                          <strong>Category:</strong> {article.category || 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          article.status === 'published'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : article.status === 'draft'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {article.status}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {article.published_at ? new Date(article.published_at).toLocaleDateString() : 'Not published'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <Link
                      to={`/admin/articles/edit/${article.id}`}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      style={{ minHeight: '48px' }}
                    >
                      <Edit className="h-5 w-5" />
                      <span>Edit Article</span>
                    </Link>
                    <button
                      onClick={() => handleDelete(article.id, article.title)}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                      style={{ minHeight: '48px' }}
                    >
                      <Trash2 className="h-5 w-5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredArticles.length)} of {filteredArticles.length} articles
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        currentPage === pageNum
                          ? 'bg-red-600 text-white'
                          : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
