import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Search, User, UserPlus, LogOut, Moon, Sun } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useSiteContent } from '../hooks/useSiteContent';
import { supabase } from '../lib/supabase';
import { SearchBar } from './SearchBar';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [breakingNews, setBreakingNews] = useState<string>('');
  const [showBreaking, setShowBreaking] = useState(true);
  const { user, profile, signOut } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const { getContent } = useSiteContent();
  const navigate = useNavigate();

  useEffect(() => {
    fetchBreakingNews();

    // Set up realtime subscription for breaking_news table
    const breakingNewsSubscription = supabase
      .channel('breaking-news-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'breaking_news' },
        (payload) => {
          console.log('Realtime breaking_news change detected:', payload);
          fetchBreakingNews();
        }
      )
      .subscribe((status) => {
        console.log('Breaking news realtime subscription status:', status);
      });

    return () => {
      console.log('Unsubscribing from breaking news changes');
      breakingNewsSubscription.unsubscribe();
    };
  }, []);

  const fetchBreakingNews = async () => {
    try {
      const { data } = await supabase
        .from('breaking_news')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false })
        .limit(1)
        .single();
      
      if (data) {
        setBreakingNews(data.title);
      } else {
        setBreakingNews('');
      }
    } catch (error) {
      console.error('Error fetching breaking news:', error);
      setBreakingNews('');
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Breaking News Banner */}
      {breakingNews && showBreaking && (
        <div className="bg-red-600 text-white py-2 px-4">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="font-bold text-sm whitespace-nowrap">{t('header.breaking')}:</span>
              <span className="text-sm truncate">{breakingNews}</span>
            </div>
            <button
              onClick={() => setShowBreaking(false)}
              className="ml-2 p-1 hover:bg-red-700 rounded"
              aria-label={t('common.close')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Header */}
      <header className="bg-white dark:bg-gray-900 shadow-md sticky top-0 z-40">
        <div className="container mx-auto px-4">
          {/* Top Bar - Desktop Only */}
          <div className="hidden md:flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {new Date().toLocaleDateString(language === 'sr' ? 'sr-RS' : 'en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
            <div className="flex items-center gap-4">
              {/* Language Switcher */}
              <button
                onClick={toggleLanguage}
                className="px-3 py-1 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Toggle language"
              >
                {language.toUpperCase()}
              </button>
              
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Toggle dark mode"
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Main Header Bar */}
          <div className="flex items-center justify-between py-3 md:py-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 -ml-2 md:hidden hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              aria-label={t('common.menu')}
              style={{ minWidth: '44px', minHeight: '44px' }}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2" onClick={closeMobileMenu}>
              <div className="flex items-center">
                <div className="bg-red-600 text-white font-bold text-xl md:text-2xl px-3 py-1 rounded">
                  BT
                </div>
                <div className="ml-2">
                  <div className="font-bold text-lg md:text-xl text-gray-900 dark:text-white">
                    Belgrade Times
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 hidden sm:block">
                    {t('header.tagline')}
                  </div>
                </div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6">
              <Link to="/" className="hover:text-red-600 transition-colors">{t('nav.home')}</Link>
              <Link to="/categories" className="hover:text-red-600 transition-colors">{t('nav.categories')}</Link>
              <Link to="/latest" className="hover:text-red-600 transition-colors">{t('nav.latest')}</Link>
              <Link to="/about" className="hover:text-red-600 transition-colors">{t('nav.about')}</Link>
              <Link to="/contact" className="hover:text-red-600 transition-colors">{t('nav.contact')}</Link>
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2">
              {/* Search Button */}
              <button
                onClick={() => navigate('/search')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                aria-label="Search"
                style={{ minWidth: '44px', minHeight: '44px' }}
              >
                <Search className="h-5 w-5" />
              </button>

              {/* Mobile Language & Dark Mode */}
              <div className="flex md:hidden items-center gap-1">
                <button
                  onClick={toggleLanguage}
                  className="px-2 py-1.5 text-xs font-medium border border-gray-300 dark:border-gray-600 rounded"
                  style={{ minWidth: '44px', minHeight: '44px' }}
                >
                  {language.toUpperCase()}
                </button>
                <button
                  onClick={toggleDarkMode}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                  style={{ minWidth: '44px', minHeight: '44px' }}
                  aria-label="Toggle dark mode"
                >
                  {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>
              </div>

              {/* Desktop Auth Buttons */}
              {user ? (
                <div className="hidden md:flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {t('header.welcome')}, {profile?.full_name || user.email}
                  </span>
                  {profile?.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      {t('nav.admin')}
                    </Link>
                  )}
                  <button
                    onClick={signOut}
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    style={{ minHeight: '44px' }}
                  >
                    <LogOut className="h-4 w-4" />
                    <span>{t('header.logout')}</span>
                  </button>
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Link
                    to="/login"
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    style={{ minHeight: '44px' }}
                  >
                    <User className="h-4 w-4" />
                    <span>{t('header.login')}</span>
                  </Link>
                  <Link
                    to="/register"
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    style={{ minHeight: '44px' }}
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>{t('header.register')}</span>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden md:block py-3 border-t border-gray-200 dark:border-gray-700">
            <SearchBar compact />
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Mobile Menu Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white dark:bg-gray-900 z-40 transform transition-transform duration-300 lg:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="font-bold text-xl">Belgrade Times</div>
            <button
              onClick={closeMobileMenu}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              style={{ minWidth: '44px', minHeight: '44px' }}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <nav className="p-4">
          {/* User Info */}
          {user && (
            <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {t('header.welcome')}, {profile?.full_name || user.email}
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <div className="space-y-2">
            <Link
              to="/"
              className="block px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              onClick={closeMobileMenu}
              style={{ minHeight: '44px' }}
            >
              {t('nav.home')}
            </Link>
            <Link
              to="/search"
              className="block px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              onClick={closeMobileMenu}
              style={{ minHeight: '44px' }}
            >
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                <span>{t('nav.search')}</span>
              </div>
            </Link>
            <Link
              to="/categories"
              className="block px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              onClick={closeMobileMenu}
              style={{ minHeight: '44px' }}
            >
              {t('nav.categories')}
            </Link>
            <Link
              to="/latest"
              className="block px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              onClick={closeMobileMenu}
              style={{ minHeight: '44px' }}
            >
              {t('nav.latest')}
            </Link>
            <Link
              to="/about"
              className="block px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              onClick={closeMobileMenu}
              style={{ minHeight: '44px' }}
            >
              {t('nav.about')}
            </Link>
            <Link
              to="/contact"
              className="block px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              onClick={closeMobileMenu}
              style={{ minHeight: '44px' }}
            >
              {t('nav.contact')}
            </Link>
          </div>

          {/* Categories */}
          <div className="mt-6">
            <div className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400">
              {t('nav.categories')}
            </div>
            <div className="space-y-2">
              {['politika', 'biznis', 'sport', 'tehnologija', 'kultura'].map((cat) => (
                <Link
                  key={cat}
                  to={`/category/${cat}`}
                  className="block px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  onClick={closeMobileMenu}
                  style={{ minHeight: '44px' }}
                >
                  {t(`cat.${cat}`)}
                </Link>
              ))}
            </div>
          </div>

          {/* Auth Links */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
            {user ? (
              <>
                {profile?.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="block px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-center"
                    onClick={closeMobileMenu}
                    style={{ minHeight: '44px' }}
                  >
                    {t('nav.admin')}
                  </Link>
                )}
                <button
                  onClick={() => {
                    signOut();
                    closeMobileMenu();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  style={{ minHeight: '44px' }}
                >
                  <LogOut className="h-4 w-4" />
                  <span>{t('header.logout')}</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="flex items-center justify-center gap-2 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  onClick={closeMobileMenu}
                  style={{ minHeight: '44px' }}
                >
                  <User className="h-4 w-4" />
                  <span>{t('header.login')}</span>
                </Link>
                <Link
                  to="/register"
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  onClick={closeMobileMenu}
                  style={{ minHeight: '44px' }}
                >
                  <UserPlus className="h-4 w-4" />
                  <span>{t('header.register')}</span>
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </>
  );
}
