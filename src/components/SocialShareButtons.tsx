import React, { useState } from 'react';
import { Facebook, Twitter, Linkedin, Link, Share2, Copy } from 'lucide-react';

interface SocialShareButtonsProps {
  title: string;
  url: string;
  description?: string;
  className?: string;
}

export function SocialShareButtons({ 
  title, 
  url, 
  description = '', 
  className = '' 
}: SocialShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const shareOnFacebook = () => {
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(title)}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const shareOnTwitter = () => {
    const text = `${title} - ${description}`;
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const shareOnLinkedIn = () => {
    const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: description || title,
          url: url
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback to copy to clipboard
      copyToClipboard();
    }
  };

  const shareButtons = [
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'hover:bg-blue-600',
      action: shareOnFacebook,
      ariaLabel: 'Share on Facebook'
    },
    {
      name: 'Twitter',
      icon: Twitter,
      color: 'hover:bg-sky-500',
      action: shareOnTwitter,
      ariaLabel: 'Share on Twitter'
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'hover:bg-blue-700',
      action: shareOnLinkedIn,
      ariaLabel: 'Share on LinkedIn'
    }
  ];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">
        Share:
      </span>
      
      {/* Native Share Button (Mobile) */}
      {navigator.share && (
        <button
          onClick={handleNativeShare}
          className="p-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          aria-label="Share article"
          title="Share article"
        >
          <Share2 className="h-4 w-4" />
        </button>
      )}

      {/* Social Media Share Buttons */}
      {shareButtons.map((button) => {
        const IconComponent = button.icon;
        return (
          <button
            key={button.name}
            onClick={button.action}
            className={`p-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg ${button.color} hover:text-white transition-all duration-200 transform hover:scale-105`}
            aria-label={button.ariaLabel}
            title={button.name}
          >
            <IconComponent className="h-4 w-4" />
          </button>
        );
      })}

      {/* Copy Link Button */}
      <button
        onClick={copyToClipboard}
        className={`p-2 rounded-lg transition-all duration-200 transform hover:scale-105 ${
          copied
            ? 'bg-green-600 text-white'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
        }`}
        aria-label="Copy link"
        title={copied ? 'Copied!' : 'Copy link'}
      >
        {copied ? (
          <div className="h-4 w-4 flex items-center justify-center">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}

// Standalone component for article header
export function ArticleShareHeader({ 
  title, 
  url, 
  description = '' 
}: SocialShareButtonsProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 py-4 border-y border-gray-200 dark:border-gray-700">
      <SocialShareButtons 
        title={title} 
        url={url} 
        description={description}
        className="w-full md:w-auto"
      />
    </div>
  );
}

// Floating share component for mobile
export function FloatingShareButton({ 
  title, 
  url, 
  description = '' 
}: SocialShareButtonsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const shareOnFacebook = () => {
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
    setIsOpen(false);
  };

  const shareOnTwitter = () => {
    const text = `${title} - ${description}`;
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
    setIsOpen(false);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    } catch (err) {
      console.log('Error copying to clipboard:', err);
    }
    setIsOpen(false);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: description || title,
          url: url
        });
        setIsOpen(false);
      } catch (err) {
        console.log('Error sharing:', err);
      }
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Share Options */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 space-y-3 min-w-48">
          <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Share Article</h4>
          
          {navigator.share && (
            <button
              onClick={handleNativeShare}
              className="w-full flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Share2 className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Share...</span>
            </button>
          )}
          
          <button
            onClick={shareOnFacebook}
            className="w-full flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Facebook className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Facebook</span>
          </button>
          
          <button
            onClick={shareOnTwitter}
            className="w-full flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Twitter className="h-4 w-4 text-sky-500" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Twitter</span>
          </button>
          
          <button
            onClick={copyToClipboard}
            className="w-full flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Link className="h-4 w-4 text-gray-600" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Copy Link</span>
          </button>
        </div>
      )}

      {/* Main Share Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
        aria-label="Share article"
      >
        <Share2 className="h-5 w-5" />
      </button>
    </div>
  );
}