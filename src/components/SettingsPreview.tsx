import React from 'react';
import { ExternalLink } from 'lucide-react';

interface SettingsPreviewProps {
  siteName: string;
  siteDescription: string;
  ogImage: string;
  title?: string;
  description?: string;
  url?: string;
  className?: string;
}

export function SettingsPreview({
  siteName,
  siteDescription,
  ogImage,
  title,
  description,
  url = 'https://belgradetimes.rs',
  className = ''
}: SettingsPreviewProps) {
  // Calculate meta title (template or fallback)
  const metaTitle = title || siteName;
  const metaDescription = description || siteDescription;
  const metaUrl = url || 'https://belgradetimes.rs';

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          SEO Preview
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          This is how your site will appear in search results
        </p>
      </div>
      
      <div className="p-6 space-y-4">
        {/* Google Search Result Preview */}
        <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
          <div className="p-4">
            <div className="space-y-2">
              <div className="flex items-center text-sm text-blue-600 dark:text-blue-400">
                <span>{metaUrl}</span>
                <ExternalLink className="h-3 w-3 ml-1" />
              </div>
              
              <h4 className="text-lg text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                {metaTitle}
              </h4>
              
              <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                {metaDescription}
              </p>
            </div>
          </div>
        </div>

        {/* Facebook/LinkedIn Preview */}
        <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
          <div className="flex">
            {ogImage && (
              <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                <img 
                  src={ogImage} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
            )}
            <div className="flex-1 p-4">
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                {metaUrl}
              </div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                {metaTitle}
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                {metaDescription}
              </p>
            </div>
          </div>
        </div>

        {/* Twitter Card Preview */}
        <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
          <div className="flex">
            {ogImage && (
              <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                <img 
                  src={ogImage} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
            )}
            <div className="flex-1 p-4">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                {metaTitle}
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                {metaDescription}
              </p>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {metaUrl}
              </div>
            </div>
          </div>
        </div>

        {/* Meta Information */}
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div><strong>Title:</strong> {metaTitle.length} characters</div>
          <div><strong>Description:</strong> {metaDescription.length} characters</div>
          <div className="flex gap-4 mt-2">
            <span className={`px-2 py-1 rounded text-xs ${metaTitle.length <= 60 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}`}>
              Title: {metaTitle.length <= 60 ? 'Good' : 'Too long'}
            </span>
            <span className={`px-2 py-1 rounded text-xs ${metaDescription.length <= 160 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}`}>
              Description: {metaDescription.length <= 160 ? 'Good' : 'Too long'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPreview;