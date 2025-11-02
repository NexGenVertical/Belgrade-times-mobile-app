import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, X, Filter } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface SearchBarProps {
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
  compact?: boolean;
}

export function SearchBar({ className = '', placeholder, autoFocus = false, compact = false }: SearchBarProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [showFilters, setShowFilters] = useState(false);

  const defaultPlaceholder = placeholder || t('search.placeholder') || 'Search articles...';

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchTerm.trim();
    if (query) {
      const searchQuery = new URLSearchParams();
      searchQuery.set('q', query);
      navigate(`/search?${searchQuery.toString()}`);
    } else {
      navigate('/search');
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSearch} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={defaultPlaceholder}
            className={`
              w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
              focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent 
              dark:bg-gray-800 dark:text-white dark:placeholder-gray-400
              ${compact ? 'py-2 text-sm' : 'py-3'}
            `}
            style={{ minHeight: compact ? '36px' : '44px' }}
            autoFocus={autoFocus}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}