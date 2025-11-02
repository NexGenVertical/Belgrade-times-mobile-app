import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, Category } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle, Circle, FolderOpen, Palette } from 'lucide-react';

interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
}

interface CategoryFormProps {
  mode: 'create' | 'edit';
  categoryId?: string;
  initialData?: Partial<CategoryFormData>;
  onSuccess?: () => void;
}

const defaultColors = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#6b7280', // gray
];

const defaultIcons = [
  'folder-open',
  'newspaper',
  'briefcase',
  'globe',
  'heart',
  'star',
  'bookmark',
  'tag',
  'calendar',
  'clock',
];

export function CategoryForm({ mode, categoryId, initialData, onSuccess }: CategoryFormProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewData, setPreviewData] = useState<CategoryFormData>({
    name: '',
    slug: '',
    description: '',
    color: '#6b7280',
    icon: 'folder-open',
    sort_order: 0,
    is_active: true,
    ...initialData,
  });

  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    slug: '',
    description: '',
    color: '#6b7280',
    icon: 'folder-open',
    sort_order: 0,
    is_active: true,
    ...initialData,
  });

  // Auto-generate slug from name
  useEffect(() => {
    if (formData.name && mode === 'create') {
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.name, mode]);

  // Update preview when form data changes
  useEffect(() => {
    setPreviewData(formData);
  }, [formData]);

  const handleInputChange = (field: keyof CategoryFormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!user) {
      setError('You must be logged in to perform this action.');
      setLoading(false);
      return;
    }

    try {
      if (mode === 'create') {
        // Check if slug already exists
        const { data: existingCategory } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', formData.slug)
          .single();

        if (existingCategory) {
          throw new Error('A category with this slug already exists.');
        }

        const { data, error } = await supabase
          .from('categories')
          .insert([{
            name: formData.name,
            slug: formData.slug,
            description: formData.description || null,
            color: formData.color,
            icon: formData.icon,
            sort_order: formData.sort_order,
            is_active: formData.is_active,
          }])
          .select()
          .single();

        if (error) throw error;
        setSuccess('Category created successfully!');
      } else {
        // Check if slug already exists for another category
        const { data: existingCategory } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', formData.slug)
          .neq('id', categoryId)
          .single();

        if (existingCategory) {
          throw new Error('A category with this slug already exists.');
        }

        const { data, error } = await supabase
          .from('categories')
          .update({
            name: formData.name,
            slug: formData.slug,
            description: formData.description || null,
            color: formData.color,
            icon: formData.icon,
            sort_order: formData.sort_order,
            is_active: formData.is_active,
          })
          .eq('id', categoryId)
          .select()
          .single();

        if (error) throw error;
        setSuccess('Category updated successfully!');
      }

      // Clear form after successful creation
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          navigate('/admin/categories');
        }
      }, 1500);
    } catch (error: any) {
      setError(error.message || 'An error occurred while saving the category.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-500 bg-green-50 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Fields */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  Category Details
                </CardTitle>
                <CardDescription>
                  {mode === 'create' ? 'Create a new category' : 'Edit category information'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter category name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => handleInputChange('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="category-slug"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    URL-friendly identifier, auto-generated from name
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Brief description of the category"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sort_order">Sort Order</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => handleInputChange('sort_order', parseInt(e.target.value) || 0)}
                    placeholder="0"
                    min="0"
                  />
                  <p className="text-xs text-gray-500">
                    Categories will be displayed in ascending order
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Appearance
                </CardTitle>
                <CardDescription>
                  Customize how the category appears
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex gap-2 flex-wrap">
                    {defaultColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 ${
                          formData.color === color ? 'border-gray-900 dark:border-white' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => handleInputChange('color', color)}
                        aria-label={`Select color ${color}`}
                      />
                    ))}
                  </div>
                  <Input
                    type="color"
                    value={formData.color}
                    onChange={(e) => handleInputChange('color', e.target.value)}
                    className="w-20 h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Icon</Label>
                  <div className="grid grid-cols-5 gap-2">
                    {defaultIcons.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        className={`p-2 rounded border ${
                          formData.icon === icon
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        onClick={() => handleInputChange('icon', icon)}
                      >
                        <Circle className="h-4 w-4" />
                      </button>
                    ))}
                  </div>
                  <Input
                    value={formData.icon}
                    onChange={(e) => handleInputChange('icon', e.target.value)}
                    placeholder="folder-open"
                    className="text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (
                  mode === 'create' ? 'Creating...' : 'Updating...'
                ) : (
                  mode === 'create' ? 'Create Category' : 'Update Category'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/categories')}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>
                  How the category will appear to users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className="p-4 rounded-lg border"
                  style={{ backgroundColor: `${previewData.color}15`, borderColor: previewData.color }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: previewData.color }}
                    >
                      <FolderOpen className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-semibold" style={{ color: previewData.color }}>
                        {previewData.name || 'Category Name'}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {previewData.slug || 'category-slug'}
                      </p>
                    </div>
                    {!previewData.is_active && (
                      <span className="ml-auto text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                        Inactive
                      </span>
                    )}
                  </div>
                  {previewData.description && (
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {previewData.description}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
