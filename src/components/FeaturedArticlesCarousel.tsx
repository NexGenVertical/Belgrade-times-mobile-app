import React, { useState, useEffect } from 'react';
import { ArticleCard } from './ArticleCard';
import { Article } from '../lib/supabase';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';

interface FeaturedArticlesCarouselProps {
  featuredArticles: (Article & { author_name: string })[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

export function FeaturedArticlesCarousel({ 
  featuredArticles, 
  autoPlay = true, 
  autoPlayInterval = 5000 
}: FeaturedArticlesCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying || featuredArticles.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === featuredArticles.length - 1 ? 0 : prevIndex + 1
      );
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [isPlaying, featuredArticles.length, autoPlayInterval]);

  const goToPrevious = () => {
    setCurrentIndex(prevIndex => 
      prevIndex === 0 ? featuredArticles.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex(prevIndex => 
      prevIndex === featuredArticles.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  if (!featuredArticles.length) return null;

  const currentArticle = featuredArticles[currentIndex];

  return (
    <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* Main Carousel Container */}
      <div className="relative h-96 md:h-[500px]">
        {/* Article Display */}
        <div className="absolute inset-0">
          <ArticleCard 
            article={currentArticle} 
            className="h-full"
            featured={true}
          />
        </div>

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

        {/* Navigation Arrows */}
        {featuredArticles.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              aria-label="Previous article"
            >
              <ChevronLeft size={24} />
            </button>
            
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              aria-label="Next article"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}

        {/* Article Info Overlay - Improved Mobile Layout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 text-white">
          <div className="max-w-4xl">
            <h2 className="text-lg md:text-4xl font-bold mb-2 md:mb-3 line-clamp-2">
              {currentArticle.title}
            </h2>
            {currentArticle.excerpt && (
              <p className="text-sm md:text-xl mb-3 md:mb-4 line-clamp-3 text-gray-200">
                {currentArticle.excerpt}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs md:text-sm">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                FEATURED
              </span>
              <span>By {currentArticle.author_name || 'Unknown Author'}</span>
              {currentArticle.published_at && (
                <span>
                  {new Date(currentArticle.published_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Carousel Controls */}
      {featuredArticles.length > 1 && (
        <div className="absolute bottom-4 right-4 flex items-center gap-2">
          {/* Play/Pause Button */}
          <button
            onClick={togglePlayPause}
            className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            aria-label={isPlaying ? 'Pause auto-play' : 'Start auto-play'}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>

          {/* Dots Indicator */}
          <div className="flex gap-2">
            {featuredArticles.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentIndex 
                    ? 'bg-white' 
                    : 'bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Thumbnail Strip */}
      {featuredArticles.length > 1 && (
        <div className="absolute top-4 right-4 flex gap-2">
          {featuredArticles.slice(0, 5).map((article, index) => (
            <button
              key={article.id}
              onClick={() => goToSlide(index)}
              className={`w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                index === currentIndex 
                  ? 'border-white' 
                  : 'border-white/50 hover:border-white/75'
              }`}
            >
              {article.featured_image_url ? (
                <img
                  src={article.featured_image_url}
                  alt={article.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                  <span className="text-xs text-gray-400">No image</span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}