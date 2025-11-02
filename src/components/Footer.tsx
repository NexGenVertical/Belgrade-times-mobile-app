import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Facebook, Twitter, Instagram } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSiteContent } from '../hooks/useSiteContent';
import { supabase } from '../lib/supabase';

export function Footer() {
  const { t } = useLanguage();
  const { getContent, loading: contentLoading, content, error } = useSiteContent();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await supabase.from('newsletter_subscriptions').insert([{ email, status: 'active' }]);
      setSubscribed(true);
      setEmail('');
    } catch (error) {
      console.error('Subscription error:', error);
    }
  };

  return (
    <footer className="bg-gray-900 text-white mt-12">
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
          {/* About Section */}
          <div>
            <h3 className="font-bold text-lg mb-4">{t('footer.about')}</h3>
            <div className="space-y-2 text-gray-400 text-sm">
              <p>{getContent('footer_about', t('footer.mission'))}</p>
              <p>{getContent('site_mission', t('footer.mission'))}</p>
              <p>{getContent('site_coverage', t('footer.coverage'))}</p>
            </div>
          </div>

          {/* Contact Section */}
          <div>
            <h3 className="font-bold text-lg mb-4">{t('footer.contact')}</h3>
            {contentLoading && <p className="text-gray-500 text-sm">Loading contact info...</p>}
            {error && <p className="text-red-500 text-sm">Error loading contact info: {error}</p>}
            <div className="space-y-2 text-gray-400 text-sm">
              <p><strong>Address:</strong> {getContent('contact_address', t('footer.address'))}</p>
              <p><strong>Phone:</strong> {getContent('contact_phone', t('footer.phone'))}</p>
              <p><strong>Email:</strong> {getContent('contact_email', t('footer.email'))}</p>
            </div>
            {content['contact_phone'] && (
              <div className="mt-2 text-xs text-gray-600">
                <p>Database synced ✓</p>
              </div>
            )}
          </div>

          {/* Links Section */}
          <div>
            <h3 className="font-bold text-lg mb-4">{t('footer.links')}</h3>
            <div className="space-y-2">
              <Link to="/privacy" className="block text-gray-400 hover:text-white transition-colors text-sm">
                {t('footer.privacy')}
              </Link>
              <Link to="/terms" className="block text-gray-400 hover:text-white transition-colors text-sm">
                {t('footer.terms')}
              </Link>
              <Link to="/cookies" className="block text-gray-400 hover:text-white transition-colors text-sm">
                {t('footer.cookies')}
              </Link>
              <Link to="/sitemap" className="block text-gray-400 hover:text-white transition-colors text-sm">
                {t('footer.sitemap')}
              </Link>
            </div>
          </div>

          {/* Social Media Section */}
          <div>
            <h3 className="font-bold text-lg mb-4">Follow Us</h3>
            <div className="flex gap-3">
              {getContent('social_facebook') && (
                <a
                  href={getContent('social_facebook')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {getContent('social_twitter') && (
                <a
                  href={getContent('social_twitter')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter className="h-5 w-5" />
                </a>
              )}
              {getContent('social_instagram') && (
                <a
                  href={getContent('social_instagram')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              )}
            </div>
            <div className="mt-3 text-gray-400 text-xs">
              {contentLoading ? 'Loading...' : 'Stay connected with us'}
            </div>
          </div>

          {/* Newsletter Section */}
          <div>
            <h3 className="font-bold text-lg mb-4">{t('footer.newsletter')}</h3>
            {subscribed ? (
              <div className="text-green-400 text-sm">
                <p>Thank you for subscribing!</p>
                <p className="text-xs mt-1">You'll receive our latest news updates.</p>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('footer.newsletterPlaceholder')}
                  className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 text-sm"
                  style={{ minHeight: '44px' }}
                  required
                />
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  style={{ minHeight: '44px' }}
                >
                  <Mail className="h-4 w-4" />
                  <span>{t('footer.subscribe')}</span>
                </button>
              </form>
            )}
            {contentLoading && (
              <p className="text-gray-500 text-xs mt-2">Loading site content...</p>
            )}
          </div>
        </div>

        {/* Categories Links - Mobile Friendly */}
        <div className="border-t border-gray-800 pt-6 mb-6">
          <div className="flex flex-wrap gap-3 justify-center md:justify-start">
            {['politika', 'biznis', 'sport', 'tehnologija', 'kultura'].map((cat) => (
              <Link
                key={cat}
                to={`/category/${cat}`}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm"
                style={{ minHeight: '44px' }}
              >
                {t(`cat.${cat}`)}
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
            <p>&copy; 2024 Belgrade Times. {t('footer.allRights')}</p>
            <p className="text-center md:text-right">{t('footer.award')}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
