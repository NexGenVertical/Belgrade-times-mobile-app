import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSiteContent } from '../hooks/useSiteContent';

export function AboutPage() {
  const { t } = useLanguage();
  const { getContent } = useSiteContent();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-gray-900 dark:text-white">
          {t('nav.about')}
        </h1>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 md:p-8">
          <div className="prose dark:prose-invert max-w-none">
            <h2 className="text-2xl font-bold mb-4">Belgrade Times</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t('footer.mission')}
            </p>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t('footer.coverage')}
            </p>
            
            <h3 className="text-xl font-bold mb-4 mt-8">Our Mission</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Belgrade Times is committed to delivering accurate, unbiased, and timely news coverage to our readers. 
              We believe in the power of journalism to inform, educate, and empower citizens in their daily lives.
            </p>

            <h3 className="text-xl font-bold mb-4 mt-8">What We Cover</h3>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mb-6 space-y-2">
              <li>Politics - Local and international political developments</li>
              <li>Business - Economic news and market insights</li>
              <li>Sports - Comprehensive sports coverage</li>
              <li>Technology - Latest tech trends and innovations</li>
              <li>Culture - Arts, entertainment, and cultural events</li>
            </ul>

            <h3 className="text-xl font-bold mb-4 mt-8">Contact Us</h3>
            <div className="text-gray-600 dark:text-gray-400 space-y-2">
              <p><strong>Address:</strong> {getContent('contact_address', t('footer.address'))}</p>
              <p><strong>Phone:</strong> {getContent('contact_phone', t('footer.phone'))}</p>
              <p><strong>Email:</strong> {getContent('contact_email', t('footer.email'))}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
