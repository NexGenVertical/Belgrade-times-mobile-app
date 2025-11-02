import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Upload, X } from 'lucide-react';

interface ArticleFormData {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author_name: string;
  category: string;
  featured_image_url: string;
  tags: string;
  reading_time: number;
  status: string;
  language: string;
  meta_title: string;
  meta_description: string;
  publish_action: 'draft' | 'publish_now' | 'schedule';
  scheduled_date: string;
}

interface ArticleFormProps {
  mode: 'create' | 'edit';
  articleId?: string;
  initialData?: Partial<ArticleFormData>;
  onSuccess?: () => void;
}

export function ArticleForm({ mode, articleId, initialData, onSuccess }: ArticleFormProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  
  const [formData, setFormData] = useState<ArticleFormData>({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    author_name: 'Admin User',
    category: 'general',
    featured_image_url: '',
    tags: '',
    reading_time: 1,
    status: 'draft',
    language: 'sr',
    meta_title: '',
    meta_description: '',
    publish_action: 'draft',
    scheduled_date: '',
    ...initialData
  });

  useEffect(() => {
    if (initialData?.featured_image_url) {
      setImagePreview(initialData.featured_image_url);
    }
    fetchCategories();
  }, [initialData]);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Auto-generate slug from title (only for create mode or when manually editing)
    if (name === 'title' && mode === 'create') {
      const slug = value
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPEG, PNG, or WebP)');
      return;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('Image size must be less than 5MB');
      return;
    }

    setError('');
    setUploading(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Data = reader.result as string;

          const { data, error: uploadError } = await supabase.functions.invoke('upload-article-image', {
            body: {
              imageData: base64Data,
              fileName: file.name
            }
          });

          if (uploadError) throw uploadError;
          if (data.error) throw new Error(data.error);

          setUploadedImageUrl(data.publicUrl);
          setImagePreview(data.publicUrl);
          setFormData(prev => ({
            ...prev,
            featured_image_url: data.publicUrl
          }));
          setSuccess('Image uploaded successfully');
          setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
          setError(err.message || 'Failed to upload image');
        } finally {
          setUploading(false);
        }
      };
      reader.onerror = () => {
        setError('Failed to read file');
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setUploadedImageUrl('');
    setImagePreview('');
    setFormData(prev => ({
      ...prev,
      featured_image_url: ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!user) {
        throw new Error(`You must be logged in to ${mode} articles`);
      }

      if (!formData.author_name.trim()) {
        throw new Error('Author name is required');
      }

      const tagsArray = formData.tags
        ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        : [];

      let finalStatus = 'draft';
      let publishedAt = null;
      let scheduledPublishDate = null;

      // Determine final status and publication date based on publish_action
      if (formData.publish_action === 'publish_now') {
        finalStatus = 'published';
        publishedAt = new Date().toISOString();
      } else if (formData.publish_action === 'schedule' && formData.scheduled_date) {
        finalStatus = 'scheduled';
        scheduledPublishDate = new Date(formData.scheduled_date).toISOString();
      } else {
        finalStatus = 'draft';
      }

      const articleData = {
        title: formData.title,
        slug: formData.slug,
        content: formData.content,
        excerpt: formData.excerpt || null,
        author_name: formData.author_name,
        category: formData.category,
        featured_image_url: formData.featured_image_url || null,
        tags: tagsArray,
        reading_time: parseInt(formData.reading_time.toString()) || 1,
        status: finalStatus,
        language: formData.language,
        meta_title: formData.meta_title || formData.title,
        meta_description: formData.meta_description || formData.excerpt || null,
        scheduled_publish_date: scheduledPublishDate,
        workflow_status: mode === 'create' ? 'draft' : 'published',
      };

      if (mode === 'create') {
        const { error: insertError } = await supabase
          .from('articles')
          .insert([{
            ...articleData,
            author_id: user.id,
            published_at: publishedAt
          }]);

        if (insertError) throw insertError;
        setSuccess('Article created successfully!');
      } else {
        const { error: updateError } = await supabase
          .from('articles')
          .update({
            ...articleData,
            published_at: publishedAt
          })
          .eq('id', articleId);

        if (updateError) throw updateError;
        setSuccess('Article updated successfully!');
      }

      if (onSuccess) {
        onSuccess();
      } else {
        setTimeout(() => {
          navigate('/admin/articles');
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || `Failed to ${mode} article`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 md:p-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
        {mode === 'create' ? 'Create New Article' : 'Edit Article'}
      </h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded-lg">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Title *
          </label>
          <input
            id="title"
            name="title"
            type="text"
            value={formData.title}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 dark:bg-gray-700 dark:text-white"
            style={{ minHeight: '44px' }}
            required
          />
        </div>

        {/* Slug */}
        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Slug *
          </label>
          <input
            id="slug"
            name="slug"
            type="text"
            value={formData.slug}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 dark:bg-gray-700 dark:text-white"
            style={{ minHeight: '44px' }}
            required
          />
        </div>

        {/* Author Name */}
        <div>
          <label htmlFor="author_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Author Name *
          </label>
          <input
            id="author_name"
            name="author_name"
            type="text"
            value={formData.author_name}
            onChange={handleChange}
            placeholder="Enter the author's name"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 dark:bg-gray-700 dark:text-white"
            style={{ minHeight: '44px' }}
            required
          />
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            This name will be displayed as the article's author. You can enter any name, including guest writers or freelancers.
          </p>
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Category *
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 dark:bg-gray-700 dark:text-white"
            style={{ minHeight: '44px' }}
            required
          >
            <option value="">Select a category</option>
            {categories.map(category => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Excerpt */}
        <div>
          <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Excerpt
          </label>
          <textarea
            id="excerpt"
            name="excerpt"
            value={formData.excerpt}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 dark:bg-gray-700 dark:text-white resize-none"
            placeholder="Brief summary of the article"
          />
        </div>

        {/* Content */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Content *
          </label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            rows={10}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 dark:bg-gray-700 dark:text-white resize-none"
            required
          />
        </div>

        {/* Featured Image - URL or Upload */}
        <div className="space-y-4">
          <div className="border-b border-gray-200 dark:border-gray-700 pb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Featured Image
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Upload an image file or provide an external URL
            </p>
          </div>

          {/* Image Preview */}
          {(imagePreview || formData.featured_image_url) && (
            <div className="relative">
              <img
                src={imagePreview || formData.featured_image_url}
                alt="Preview"
                className="w-full max-w-md h-48 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                aria-label="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* File Upload Option */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Upload Image File
            </label>
            <div className="flex items-center gap-3">
              <label
                htmlFor="image-upload"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ minHeight: '44px' }}
              >
                <Upload className="h-5 w-5" />
                <span>{uploading ? 'Uploading...' : 'Choose File'}</span>
              </label>
              <input
                id="image-upload"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
              {uploadedImageUrl && (
                <span className="text-sm text-green-600 dark:text-green-400">
                  Image uploaded successfully
                </span>
              )}
            </div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Accepted formats: JPEG, PNG, WebP (max 5MB)
            </p>
          </div>

          {/* URL Input Option */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-white dark:bg-gray-800 text-sm text-gray-500 dark:text-gray-400">
                OR
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="featured_image_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Image URL
            </label>
            <input
              id="featured_image_url"
              name="featured_image_url"
              type="url"
              value={formData.featured_image_url}
              onChange={(e) => {
                handleChange(e);
                if (e.target.value) {
                  setImagePreview(e.target.value);
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 dark:bg-gray-700 dark:text-white"
              style={{ minHeight: '44px' }}
              placeholder="https://example.com/image.jpg"
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Enter the URL of an externally hosted image
            </p>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tags
          </label>
          <input
            id="tags"
            name="tags"
            type="text"
            value={formData.tags}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 dark:bg-gray-700 dark:text-white"
            style={{ minHeight: '44px' }}
            placeholder="tag1, tag2, tag3"
          />
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Separate tags with commas
          </p>
        </div>

        {/* SEO Fields */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            SEO Settings
          </h3>
          
          {/* Meta Title */}
          <div className="mb-4">
            <label htmlFor="meta_title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Meta Title
            </label>
            <input
              id="meta_title"
              name="meta_title"
              type="text"
              value={formData.meta_title}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 dark:bg-gray-700 dark:text-white"
              style={{ minHeight: '44px' }}
              placeholder="SEO title (optional, defaults to article title)"
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {formData.meta_title.length}/60 characters (recommended)
            </p>
          </div>

          {/* Meta Description */}
          <div className="mb-4">
            <label htmlFor="meta_description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Meta Description
            </label>
            <textarea
              id="meta_description"
              name="meta_description"
              value={formData.meta_description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 dark:bg-gray-700 dark:text-white resize-none"
              placeholder="SEO description (optional, defaults to excerpt)"
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {formData.meta_description.length}/160 characters (recommended)
            </p>
          </div>
        </div>

        {/* Reading Time */}
        <div>
          <label htmlFor="reading_time" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Reading Time (minutes)
          </label>
          <input
            id="reading_time"
            name="reading_time"
            type="number"
            min="1"
            value={formData.reading_time}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 dark:bg-gray-700 dark:text-white"
            style={{ minHeight: '44px' }}
          />
        </div>

        {/* Publishing Options */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Publishing Options
          </h3>
          
          <div className="space-y-4">
            {/* Publish Action Radio Buttons */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Publication Action
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="publish_action"
                    value="draft"
                    checked={formData.publish_action === 'draft'}
                    onChange={handleChange}
                    className="mr-3"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Save as draft</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="publish_action"
                    value="publish_now"
                    checked={formData.publish_action === 'publish_now'}
                    onChange={handleChange}
                    className="mr-3"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Publish now</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="publish_action"
                    value="schedule"
                    checked={formData.publish_action === 'schedule'}
                    onChange={handleChange}
                    className="mr-3"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Schedule publication</span>
                </label>
              </div>
            </div>

            {/* Schedule Date */}
            {formData.publish_action === 'schedule' && (
              <div>
                <label htmlFor="scheduled_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Scheduled Publication Date & Time
                </label>
                <input
                  id="scheduled_date"
                  name="scheduled_date"
                  type="datetime-local"
                  value={formData.scheduled_date}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 dark:bg-gray-700 dark:text-white"
                  style={{ minHeight: '44px' }}
                  min={new Date().toISOString().slice(0, 16)}
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  The article will be automatically published at the selected time.
                </p>
              </div>
            )}

            {/* Preview Message */}
            <div className="p-3 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded-lg text-sm">
              {formData.publish_action === 'draft' && (
                "The article will be saved as a draft and won't be visible to readers."
              )}
              {formData.publish_action === 'publish_now' && (
                "The article will be immediately visible to all readers on the site."
              )}
              {formData.publish_action === 'schedule' && (
                `The article will be published on ${formData.scheduled_date ? new Date(formData.scheduled_date).toLocaleString() : 'the selected date'}.`
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            style={{ minHeight: '44px' }}
          >
            {loading ? (mode === 'create' ? 'Creating...' : 'Updating...') : (mode === 'create' ? 'Create Article' : 'Update Article')}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/articles')}
            className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
            style={{ minHeight: '44px' }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
