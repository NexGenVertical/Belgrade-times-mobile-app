import React, { useState, useEffect } from 'react';
import { supabase, BreakingNews } from '../lib/supabase';
import { AlertTriangle, X, Clock, ExternalLink } from 'lucide-react';

interface EnhancedBreakingNewsBannerProps {
  maxItems?: number;
  showTicker?: boolean;
  className?: string;
}

export function EnhancedBreakingNewsBanner({ 
  maxItems = 3, 
  showTicker = true,
  className = ""
}: EnhancedBreakingNewsBannerProps) {
  const [breakingNews, setBreakingNews] = useState<BreakingNews[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBreakingNews();
    // Set up realtime subscription for breaking news
    const subscription = supabase
      .channel('breaking-news-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'breaking_news' },
        () => {
          fetchBreakingNews();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (breakingNews.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => 
          prevIndex === breakingNews.length - 1 ? 0 : prevIndex + 1
        );
      }, 4000); // Change every 4 seconds

      return () => clearInterval(interval);
    }
  }, [breakingNews]);

  const fetchBreakingNews = async () => {
    try {
      const { data, error } = await supabase
        .from('breaking_news')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false })
        .limit(maxItems);

      if (error) throw error;

      // Filter out expired news
      const now = new Date();
      const validNews = data?.filter(item => {
        if (item.expires_at && new Date(item.expires_at) < now) return false;
        return true;
      }) || [];

      setBreakingNews(validNews);
    } catch (error) {
      console.error('Error fetching breaking news:', error);
    } finally {
      setLoading(false);
    }
  };

  const dismissItem = (id: string) => {
    setBreakingNews(prev => prev.filter(item => item.id !== id));
    if (currentIndex >= breakingNews.length - 1) {
      setCurrentIndex(0);
    }
  };

  const handleLinkClick = async (news: BreakingNews) => {
    if (news.link_url) {
      // Track click analytics here if needed
      window.open(news.link_url, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading) {
    return (
      <div className={`bg-red-600 text-white py-3 ${className}`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-400 rounded animate-pulse"></div>
            <div className="flex-1">
              <div className="h-4 bg-red-400 rounded animate-pulse w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!breakingNews.length || !isVisible) return null;

  const currentNews = breakingNews[currentIndex];

  return (
    <div className={`bg-gradient-to-r from-red-600 to-red-700 text-white ${className}`}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Breaking News Icon */}
          <div className="flex items-center gap-2">
            <AlertTriangle 
              size={20} 
              className="text-red-200 animate-pulse" 
            />
            <span className="font-bold text-sm tracking-wider whitespace-nowrap">
              BREAKING
            </span>
          </div>

          {/* News Content */}
          <div className="flex-1 min-w-0">
            {showTicker && breakingNews.length > 1 ? (
              <div className="overflow-hidden">
                <div 
                  className="animate-marquee whitespace-nowrap"
                  style={{
                    transform: `translateX(${currentIndex * -100}%)`,
                    transition: 'transform 0.5s ease-in-out'
                  }}
                >
                  {breakingNews.map((news, index) => (
                    <span 
                      key={news.id} 
                      className="inline-block px-4 text-sm font-medium"
                    >
                      {news.title}
                      {news.link_url && (
                        <ExternalLink size={14} className="inline ml-1" />
                      )}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div 
                className="flex items-center gap-2 cursor-pointer hover:bg-red-700 p-1 rounded transition-colors"
                onClick={() => handleLinkClick(currentNews)}
              >
                <span className="text-sm font-medium truncate">
                  {currentNews.title}
                </span>
                {currentNews.link_url && (
                  <ExternalLink size={14} className="text-red-200 flex-shrink-0" />
                )}
              </div>
            )}
          </div>

          {/* Time Indicator */}
          {currentNews.expires_at && (
            <div className="flex items-center gap-1 text-xs text-red-200 whitespace-nowrap">
              <Clock size={12} />
              <span>
                {new Date(currentNews.expires_at) > new Date() 
                  ? `Expires ${new Date(currentNews.expires_at).toLocaleTimeString()}`
                  : 'Expiring soon'
                }
              </span>
            </div>
          )}

          {/* Priority Indicator */}
          {currentNews.priority > 1 && (
            <div className="px-2 py-1 bg-red-500 text-xs font-bold rounded whitespace-nowrap">
              Priority {currentNews.priority}
            </div>
          )}

          {/* Close Button */}
          {breakingNews.length > 1 && (
            <button
              onClick={() => setIsVisible(false)}
              className="text-red-200 hover:text-white transition-colors p-1"
              aria-label="Hide breaking news"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Multiple News Items Indicator */}
        {breakingNews.length > 1 && (
          <div className="flex justify-center gap-2 mt-2">
            {breakingNews.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex 
                    ? 'bg-white' 
                    : 'bg-red-400 hover:bg-red-300'
                }`}
                aria-label={`Show breaking news ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}