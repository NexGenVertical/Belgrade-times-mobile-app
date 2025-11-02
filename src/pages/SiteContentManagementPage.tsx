import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Plus, Edit, Trash2, RefreshCw, Settings } from 'lucide-react';

interface SiteContent {
  id: string;
  key: string;
  value: string;
  description: string | null;
  updated_at: string;
  updated_by: string | null;
}

export function SiteContentManagementPage() {
  const [contents, setContents] = useState<SiteContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingContent, setEditingContent] = useState<SiteContent | null>(null);
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    key: '',
    value: '',
    description: ''
  });

  useEffect(() => {
    if (!user || profile?.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchContents();

    // Set up realtime subscription
    const contentSubscription = supabase
      .channel('site-content-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'site_content' },
        (payload) => {
          console.log('Realtime site_content change detected:', payload);
          fetchContents();
        }
      )
      .subscribe((status) => {
        console.log('Site content realtime subscription status:', status);
      });

    return () => {
      contentSubscription.unsubscribe();
    };
  }, [user, profile, navigate]);

  const fetchContents = async () => {
    try {
      setRefreshing(true);
      const { data, error } = await supabase
        .from('site_content')
        .select('*')
        .order('key', { ascending: true });

      if (error) throw error;
      setContents(data || []);
    } catch (error: any) {
      console.error('Error fetching site content:', error);
      setError(error.message || 'Failed to load site content');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleOpenModal = (content?: SiteContent) => {
    if (content) {
      setEditingContent(content);
      setFormData({
        key: content.key,
        value: content.value,
        description: content.description || ''
      });
    } else {
      setEditingContent(null);
      setFormData({ key: '', value: '', description: '' });
    }
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingContent(null);
    setFormData({ key: '', value: '', description: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (!user) {
        throw new Error('You must be logged in');
      }

      if (editingContent) {
        // Update existing content
        const { error: updateError } = await supabase
          .from('site_content')
          .update({
            value: formData.value,
            description: formData.description || null,
            updated_by: user.id
          })
          .eq('id', editingContent.id);

        if (updateError) throw updateError;
        setSuccess(`Content "${formData.key}" updated successfully`);
      } else {
        // Insert new content
        const { error: insertError } = await supabase
          .from('site_content')
          .insert([{
            key: formData.key,
            value: formData.value,
            description: formData.description || null,
            updated_by: user.id
          }]);

        if (insertError) throw insertError;
        setSuccess(`Content "${formData.key}" created successfully`);
      }

      handleCloseModal();
      fetchContents();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save content');
    }
  };

  const handleDelete = async (content: SiteContent) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${content.key}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setError('');
      const { error: deleteError } = await supabase
        .from('site_content')
        .delete()
        .eq('id', content.id);

      if (deleteError) throw deleteError;

      setSuccess(`Content "${content.key}" deleted successfully`);
      fetchContents();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      console.error('Error deleting content:', error);
      setError(error.message || `Failed to delete content "${content.key}"`);
      setTimeout(() => setError(''), 5000);
    }
  };

  if (!user || profile?.role !== 'admin') {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-xl text-gray-900 dark:text-white">Loading...</div>
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

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Site Content Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage site-wide content, contact info, and policies
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchContents}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
              style={{ minHeight: '44px' }}
              title="Refresh"
            >
              <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              style={{ minHeight: '44px' }}
            >
              <Plus className="h-5 w-5" />
              <span>Add New Content</span>
            </button>
          </div>
        </div>

        {success && (
          <div className="mb-4 p-3 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded-lg">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg">
            {error}
          </div>
        )}

        {contents.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <Settings className="h-16 w-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">No content found</p>
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              style={{ minHeight: '44px' }}
            >
              <Plus className="h-5 w-5" />
              <span>Add First Content Item</span>
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Key
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Last Updated
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                    {contents.map((content) => (
                      <tr key={content.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white font-mono">
                            {content.key}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white max-w-md truncate">
                            {content.value}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                            {content.description || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {new Date(content.updated_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleOpenModal(content)}
                              className="inline-flex items-center justify-center p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded transition-colors"
                              style={{ minWidth: '44px', minHeight: '44px' }}
                              title="Edit"
                            >
                              <Edit className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(content)}
                              className="inline-flex items-center justify-center p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded transition-colors"
                              style={{ minWidth: '44px', minHeight: '44px' }}
                              title="Delete"
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
              {contents.map((content) => (
                <div key={content.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
                  <div className="mb-3">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">
                      Key
                    </h3>
                    <p className="font-mono text-sm font-semibold text-gray-900 dark:text-white break-all">
                      {content.key}
                    </p>
                  </div>
                  <div className="mb-3">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">
                      Value
                    </h3>
                    <p className="text-sm text-gray-900 dark:text-white break-words">
                      {content.value}
                    </p>
                  </div>
                  {content.description && (
                    <div className="mb-3">
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">
                        Description
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {content.description}
                      </p>
                    </div>
                  )}
                  <div className="mb-3">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">
                      Last Updated
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(content.updated_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <button
                      onClick={() => handleOpenModal(content)}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      style={{ minHeight: '48px' }}
                    >
                      <Edit className="h-5 w-5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(content)}
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
      </div>

      {/* Modal for Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {editingContent ? 'Edit Content' : 'Add New Content'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Key {!editingContent && '*'}
                  </label>
                  <input
                    type="text"
                    value={formData.key}
                    onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                    disabled={!!editingContent}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed font-mono"
                    style={{ minHeight: '44px' }}
                    placeholder="e.g., contact_email"
                    required={!editingContent}
                  />
                  {!editingContent && (
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Unique identifier for this content (cannot be changed later)
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Value *
                  </label>
                  <textarea
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 dark:bg-gray-700 dark:text-white resize-none"
                    placeholder="Enter the content value..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 dark:bg-gray-700 dark:text-white"
                    style={{ minHeight: '44px' }}
                    placeholder="Brief description of this content"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                    style={{ minHeight: '44px' }}
                  >
                    {editingContent ? 'Update Content' : 'Create Content'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                    style={{ minHeight: '44px' }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
