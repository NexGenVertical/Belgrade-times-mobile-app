import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Category } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  ArrowLeft,
  Plus,
  Search,
  Edit,
  Trash2,
  FolderOpen,
  GripVertical,
  ToggleLeft,
  ToggleRight,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

export function CategoriesManagementPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  useEffect(() => {
    if (!user || profile?.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchCategories();
  }, [user, profile, navigate]);

  useEffect(() => {
    // Filter categories based on search term
    if (searchTerm.trim() === '') {
      setFilteredCategories(categories);
    } else {
      const filtered = categories.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredCategories(filtered);
    }
  }, [categories, searchTerm]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      setError('Failed to load categories: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (category: Category) => {
    try {
      const { error } = await supabase
        .from('categories')
        .update({ is_active: !category.is_active })
        .eq('id', category.id);

      if (error) throw error;
      
      setCategories(prev => prev.map(cat =>
        cat.id === category.id ? { ...cat, is_active: !cat.is_active } : cat
      ));
      setSuccess(`Category ${!category.is_active ? 'activated' : 'deactivated'} successfully`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError('Failed to update category status: ' + error.message);
    }
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return;
    }

    try {
      // Check if category is used in any articles
      const { data: articles, error: checkError } = await supabase
        .from('articles')
        .select('id')
        .eq('category', categoryId)
        .limit(1);

      if (checkError) throw checkError;

      if (articles && articles.length > 0) {
        alert('Cannot delete this category because it is still being used by articles. Please reassign those articles first.');
        return;
      }

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;
      
      setCategories(prev => prev.filter(cat => cat.id !== categoryId));
      setSuccess('Category deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError('Failed to delete category: ' + error.message);
    }
  };

  const handleDragStart = (e: React.DragEvent, categoryId: string) => {
    setDraggedItem(categoryId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetCategoryId: string) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem === targetCategoryId) {
      setDraggedItem(null);
      return;
    }

    try {
      const draggedIndex = categories.findIndex(cat => cat.id === draggedItem);
      const targetIndex = categories.findIndex(cat => cat.id === targetCategoryId);

      if (draggedIndex === -1 || targetIndex === -1) {
        setDraggedItem(null);
        return;
      }

      // Create a new array with the reordered items
      const newCategories = [...categories];
      const draggedCategory = newCategories[draggedIndex];
      
      // Remove the dragged item and insert it at the target position
      newCategories.splice(draggedIndex, 1);
      newCategories.splice(targetIndex, 0, draggedCategory);

      // Update sort_order for all affected categories
      const updates = newCategories.map((cat, index) => ({
        id: cat.id,
        sort_order: index
      }));

      // Update the database
      for (const update of updates) {
        await supabase
          .from('categories')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id);
      }

      setCategories(newCategories);
      setSuccess('Categories reordered successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError('Failed to reorder categories: ' + error.message);
    }

    setDraggedItem(null);
  };

  if (!user || profile?.role !== 'admin') {
    return null;
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
            Category Management
          </h1>
          <Button
            onClick={() => navigate('/admin/categories/create')}
            className="inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Category
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-500 bg-green-50 text-green-800 mb-6">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Categories
            </CardTitle>
            <CardDescription>
              Manage your article categories. Drag and drop to reorder.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={fetchCategories}
                disabled={loading}
                className="inline-flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="text-center py-8">
                <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {searchTerm ? 'No categories found' : 'No categories yet'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {searchTerm 
                    ? `No categories match "${searchTerm}"` 
                    : 'Get started by creating your first category'
                  }
                </p>
                {!searchTerm && (
                  <Button
                    onClick={() => navigate('/admin/categories/create')}
                    className="inline-flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Create Category
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">Order</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Color</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sort Order</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCategories.map((category) => (
                      <TableRow
                        key={category.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, category.id)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, category.id)}
                        className={`cursor-move ${draggedItem === category.id ? 'opacity-50' : ''}`}
                      >
                        <TableCell>
                          <GripVertical className="h-4 w-4 text-gray-400" />
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: category.color || '#6b7280' }}
                            />
                            <div>
                              <div className="font-medium">{category.name}</div>
                              {category.icon && (
                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                  <FolderOpen className="h-3 w-3" />
                                  {category.icon}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                          {category.slug}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                          {category.description || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded-full border"
                              style={{ backgroundColor: category.color || '#6b7280' }}
                            />
                            <span className="text-xs text-gray-500">
                              {category.color || '#6b7280'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={category.is_active ? 'default' : 'secondary'}>
                            {category.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                          {category.sort_order}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleActive(category)}
                              className="h-8 w-8 p-0"
                              title={category.is_active ? 'Deactivate' : 'Activate'}
                            >
                              {category.is_active ? (
                                <ToggleRight className="h-4 w-4 text-green-600" />
                              ) : (
                                <ToggleLeft className="h-4 w-4 text-gray-400" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/admin/categories/${category.id}`)}
                              className="h-8 w-8 p-0"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(category.id)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
