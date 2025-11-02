import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setShowBanner(false);
  };

  const handleReject = () => {
    localStorage.setItem('cookieConsent', 'rejected');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 md:p-6 shadow-lg z-50">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm md:text-base text-center md:text-left">
            {t('cookie.message')}
          </p>
          <div className="flex gap-3 flex-shrink-0">
            <button
              onClick={handleReject}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
              style={{ minHeight: '44px', minWidth: '80px' }}
            >
              {t('cookie.reject')}
            </button>
            <button
              onClick={handleAccept}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm"
              style={{ minHeight: '44px', minWidth: '80px' }}
            >
              {t('cookie.accept')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
