import React, { useState, useEffect } from 'react';
import { Upload, X, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface AdvertisementFormData {
  name: string;
  image_url: string;
  link_url: string;
  placement: string;
  is_active: boolean;
  start_date: string;
  end_date: string;
}

interface AdvertisementFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<AdvertisementFormData>;
  onSuccess?: () => void;
  onCancel?: () => void;
  onSubmit?: (data: AdvertisementFormData) => Promise<void>;
}

const PLACEMENT_OPTIONS = [
  { value: 'header_banner', label: 'Header Banner' },
  { value: 'sidebar_rectangle', label: 'Sidebar Rectangle' },
  { value: 'footer_banner', label: 'Footer Banner' },
  { value: 'in_content', label: 'In Content' },
  { value: 'mobile_banner', label: 'Mobile Banner' }
];

export function AdvertisementForm({ mode, initialData, onSuccess, onCancel, onSubmit }: AdvertisementFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  
  const [formData, setFormData] = useState<AdvertisementFormData>({
    name: '',
    image_url: '',
    link_url: '',
    placement: 'sidebar_rectangle',
    is_active: true,
    start_date: '',
    end_date: '',
    ...initialData
  });

  useEffect(() => {
    if (initialData?.image_url) {
      setImagePreview(initialData.image_url);
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
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
            image_url: data.publicUrl
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
      image_url: ''
    }));
  };

  const handlePreview = () => {
    if (!formData.image_url) {
      setError('Please upload an image first');
      return;
    }
    
    const previewWindow = window.open('', '_blank', 'width=800,height=600');
    if (previewWindow) {
      previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Advertisement Preview</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px; 
              background: #f5f5f5;
            }
            .ad-container { 
              max-width: 100%; 
              border: 2px solid #ddd; 
              border-radius: 8px;
              overflow: hidden;
              background: white;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .ad-image { 
              width: 100%; 
              height: auto; 
              display: block;
            }
            .ad-info { 
              padding: 15px; 
              background: #f9f9f9;
            }
            .ad-name { 
              font-size: 18px; 
              font-weight: bold; 
              margin: 0 0 5px 0;
              color: #333;
            }
            .ad-placement { 
              color: #666; 
              margin: 0;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <h1>Advertisement Preview</h1>
          <div class="ad-container">
            <img src="${formData.image_url}" alt="${formData.name}" class="ad-image" />
            <div class="ad-info">
              <h3 class="ad-name">${formData.name || 'Advertisement Name'}</h3>
              <p class="ad-placement">Placement: ${PLACEMENT_OPTIONS.find(p => p.value === formData.placement)?.label || formData.placement}</p>
            </div>
          </div>
          ${formData.link_url ? `<p style="margin-top: 20px; color: #666;">Clicking the image will redirect to: ${formData.link_url}</p>` : ''}
        </body>
        </html>
      `);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Validation
      if (!user) {
        throw new Error(`You must be logged in to ${mode} advertisements`);
      }

      if (!formData.name.trim()) {
        throw new Error('Advertisement name is required');
      }

      if (!formData.image_url.trim()) {
        throw new Error('Advertisement image is required');
      }

      if (formData.start_date && formData.end_date) {
        const startDate = new Date(formData.start_date);
        const endDate = new Date(formData.end_date);
        if (startDate >= endDate) {
          throw new Error('End date must be after start date');
        }
      }

      const advertisementData = {
        name: formData.name.trim(),
        image_url: formData.image_url.trim(),
        link_url: formData.link_url.trim() || null,
        placement: formData.placement,
        is_active: formData.is_active,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null
      };

      // If parent provided an onSubmit handler, use it
      if (onSubmit) {
        await onSubmit(advertisementData);
        return;
      }

      // Otherwise, call success for local handling
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || `Failed to ${mode} advertisement`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 md:p-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
        {mode === 'create' ? 'Create New Advertisement' : 'Edit Advertisement'}
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
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Advertisement Name *
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 dark:bg-gray-700 dark:text-white"
            style={{ minHeight: '44px' }}
            required
            placeholder="Enter advertisement name"
          />
        </div>

        {/* Placement */}
        <div>
          <label htmlFor="placement" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Placement *
          </label>
          <select
            id="placement"
            name="placement"
            value={formData.placement}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 dark:bg-gray-700 dark:text-white"
            style={{ minHeight: '44px' }}
            required
          >
            {PLACEMENT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Choose where this advertisement will be displayed
          </p>
        </div>

        {/* Link URL */}
        <div>
          <label htmlFor="link_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Link URL
          </label>
          <input
            id="link_url"
            name="link_url"
            type="url"
            value={formData.link_url}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 dark:bg-gray-700 dark:text-white"
            style={{ minHeight: '44px' }}
            placeholder="https://example.com"
          />
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Optional: URL to redirect when advertisement is clicked
          </p>
        </div>

        {/* Image Upload */}
        <div className="space-y-4">
          <div className="border-b border-gray-200 dark:border-gray-700 pb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Advertisement Image *
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Upload an image file or provide an external URL
            </p>
          </div>

          {/* Image Preview */}
          {(imagePreview || formData.image_url) && (
            <div className="relative">
              <img
                src={imagePreview || formData.image_url}
                alt="Advertisement Preview"
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
            <label htmlFor="image_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Image URL
            </label>
            <input
              id="image_url"
              name="image_url"
              type="url"
              value={formData.image_url}
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

        {/* Scheduling */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Start Date
            </label>
            <input
              id="start_date"
              name="start_date"
              type="datetime-local"
              value={formData.start_date}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 dark:bg-gray-700 dark:text-white"
              style={{ minHeight: '44px' }}
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Optional: When to start showing this advertisement
            </p>
          </div>

          <div>
            <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              End Date
            </label>
            <input
              id="end_date"
              name="end_date"
              type="datetime-local"
              value={formData.end_date}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 dark:bg-gray-700 dark:text-white"
              style={{ minHeight: '44px' }}
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Optional: When to stop showing this advertisement
            </p>
          </div>
        </div>

        {/* Active Status */}
        <div className="flex items-center">
          <input
            id="is_active"
            name="is_active"
            type="checkbox"
            checked={formData.is_active}
            onChange={handleChange}
            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
          />
          <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            Active (advertisement will be displayed)
          </label>
        </div>

        {/* Preview Button */}
        {formData.image_url && (
          <div>
            <button
              type="button"
              onClick={handlePreview}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              style={{ minHeight: '44px' }}
            >
              <Eye className="h-5 w-5" />
              <span>Preview Advertisement</span>
            </button>
          </div>
        )}

        {/* Submit and Cancel Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            style={{ minHeight: '44px' }}
          >
            {loading 
              ? (mode === 'create' ? 'Creating...' : 'Updating...') 
              : (mode === 'create' ? 'Create Advertisement' : 'Update Advertisement')
            }
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
              style={{ minHeight: '44px' }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}