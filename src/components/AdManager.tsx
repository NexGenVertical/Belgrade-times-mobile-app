import React, { useState, useEffect, useCallback } from 'react';
import { useAdvertisements } from '../hooks/useAdvertisements';
import { ExternalLink, Clock } from 'lucide-react';

interface AdManagerProps {
  placement: string;
  className?: string;
  maxAds?: number;
  showLabel?: boolean;
  lazyLoad?: boolean;
  responsive?: boolean;
}

interface AdMetrics {
  impressions: number;
  clicks: number;
  displayTime: number;
}

export function AdManager({ 
  placement, 
  className = "", 
  maxAds = 3,
  showLabel = true,
  lazyLoad = true,
  responsive = true
}: AdManagerProps) {
  const { getAdsByPlacement, loading } = useAdvertisements();
  const [visibleAds, setVisibleAds] = useState<any[]>([]);
  const [adMetrics, setAdMetrics] = useState<{ [key: string]: AdMetrics }>({});
  const [observedElements, setObservedElements] = useState<{ [key: string]: IntersectionObserver }>({});

  useEffect(() => {
    if (!loading) {
      const ads = getAdsByPlacement(placement).slice(0, maxAds);
      setVisibleAds(ads);
    }
  }, [placement, maxAds, loading, getAdsByPlacement]);

  // Intersection Observer for lazy loading and impression tracking
  useEffect(() => {
    if (!lazyLoad) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const adId = entry.target.getAttribute('data-ad-id');
          if (!adId) return;

          if (entry.isIntersecting) {
            // Track impression
            trackImpression(adId);
            
            // Start timing for view duration
            setAdMetrics(prev => ({
              ...prev,
              [adId]: {
                ...prev[adId],
                displayTime: Date.now()
              }
            }));
          } else {
            // Stop timing and calculate view duration
            if (adMetrics[adId]?.displayTime) {
              const viewDuration = Date.now() - adMetrics[adId].displayTime;
              setAdMetrics(prev => ({
                ...prev,
                [adId]: {
                  ...prev[adId],
                  displayTime: 0,
                  impressions: (prev[adId]?.impressions || 0) + 1
                }
              }));
            }
          }
        });
      },
      {
        threshold: 0.5, // Ad must be 50% visible to count
        rootMargin: '50px'
      }
    );

    setObservedElements({ [placement]: observer });

    return () => {
      observer.disconnect();
    };
  }, [visibleAds, lazyLoad, placement, adMetrics]);

  const trackImpression = useCallback(async (adId: string) => {
    try {
      // Here you would typically send analytics data to your backend
      console.log(`Ad impression tracked: ${adId}`);
      
      // For now, we'll just update local state
      setAdMetrics(prev => ({
        ...prev,
        [adId]: {
          ...prev[adId],
          impressions: (prev[adId]?.impressions || 0) + 1
        }
      }));
    } catch (error) {
      console.error('Error tracking impression:', error);
    }
  }, []);

  const trackClick = useCallback(async (adId: string, linkUrl: string) => {
    try {
      // Track click
      setAdMetrics(prev => ({
        ...prev,
        [adId]: {
          ...prev[adId],
          clicks: (prev[adId]?.clicks || 0) + 1
        }
      }));
      
      // Open link
      window.open(linkUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Error tracking click:', error);
    }
  }, []);

  const getResponsiveAdSize = () => {
    if (!responsive) return '';
    
    const placementSizeMap: { [key: string]: string } = {
      'header_banner': 'max-w-4xl h-20 md:h-24',
      'sidebar_rectangle': 'max-w-sm h-48 md:h-64',
      'footer_banner': 'max-w-4xl h-20 md:h-24',
      'mobile_banner': 'w-full h-16',
      'in_content': 'max-w-md h-32 md:h-40'
    };
    
    return placementSizeMap[placement] || 'max-w-sm h-32';
  };

  if (loading) {
    return (
      <div className={`${className}`}>
        {showLabel && (
          <div className="text-center mb-2">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              Advertisement
            </span>
          </div>
        )}
        <div className={`${getResponsiveAdSize()} bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse mx-auto`}></div>
      </div>
    );
  }

  if (!visibleAds.length) {
    return null;
  }

  return (
    <div className={`${className}`}>
      {showLabel && (
        <div className="text-center mb-2">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
            Advertisement
          </span>
        </div>
      )}
      
      <div className="space-y-4">
        {visibleAds.map((ad) => (
          <div 
            key={ad.id}
            className={`${getResponsiveAdSize()} relative mx-auto group`}
          >
            <div 
              data-ad-id={ad.id}
              className="w-full h-full relative overflow-hidden rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <button
                onClick={() => trackClick(ad.id, ad.link_url)}
                className="w-full h-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label={`View advertisement: ${ad.name}`}
              >
                <img
                  src={ad.image_url}
                  alt={ad.name}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  loading={lazyLoad ? "lazy" : "eager"}
                />
                
                {/* Overlay with ad info on hover */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 transform translate-y-4 group-hover:translate-y-0 transition-transform">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                      <ExternalLink size={16} />
                      <span>Visit Sponsor</span>
                    </div>
                    {adMetrics[ad.id] && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {adMetrics[ad.id].impressions} views • {adMetrics[ad.id].clicks} clicks
                      </div>
                    )}
                  </div>
                </div>
              </button>
            </div>

            {/* Ad expiry indicator */}
            {ad.end_date && (
              <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                <Clock size={12} />
                <span>
                  {new Date(ad.end_date) > new Date() 
                    ? `Ends ${new Date(ad.end_date).toLocaleDateString()}`
                    : 'Expired'
                  }
                </span>
              </div>
            )}

            {/* Ad name for accessibility */}
            <div className="sr-only">
              Advertisement: {ad.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Responsive ad wrapper component
export function ResponsiveAdWrapper({ 
  children, 
  className = "" 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <div className={`${className}`}>
      {children}
    </div>
  );
}