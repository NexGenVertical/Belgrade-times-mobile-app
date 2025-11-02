import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Clock, User, ArrowLeft, Eye, Share2 } from 'lucide-react';
import { supabase, Article } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { CommentsSection } from '../components/CommentsSection';
import { RelatedArticles } from '../components/RelatedArticles';
import { SocialShareButtons, FloatingShareButton, ArticleShareHeader } from '../components/SocialShareButtons';

export function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article & { author_name: string; view_count?: number } | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewCounted, setViewCounted] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    if (slug) {
      fetchArticle();
    }
  }, [slug]);

  const fetchArticle = async () => {
    try {
      const { data: articleData, error: articleError } = await supabase
        .from('articles')
        .select('*')
        .eq('slug', slug)
        .single();

      if (articleError) throw articleError;

      if (!articleData) {
        setLoading(false);
        return;
      }

      // Get article view count
      const { count } = await supabase
        .from('article_views')
        .select('*', { count: 'exact', head: true })
        .eq('article_id', articleData.id);

      // Set article with author_name and view count
      setArticle({
        ...articleData,
        author_name: articleData.author_name || 'Unknown Author',
        view_count: count || 0
      });

      // Record view if not already counted for this session
      if (!viewCounted) {
        recordArticleView(articleData.id);
        setViewCounted(true);
      }

      // Fetch related articles
      await fetchRelatedArticles(articleData.id, articleData.category, articleData.tags);
    } catch (error) {
      console.error('Error fetching article:', error);
    } finally {
      setLoading(false);
    }
  };

  const recordArticleView = async (articleId: string) => {
    try {
      // Get client IP
      const response = await fetch('https://api.ipify.org?format=json');
      const { ip } = await response.json();

      // Check if view already exists for this IP today
      const today = new Date().toISOString().split('T')[0];
      const { data: existingView } = await supabase
        .from('article_views')
        .select('id')
        .eq('article_id', articleId)
        .eq('ip_address', ip)
        .gte('viewed_at', today)
        .single();

      // Only record if no view exists for today
      if (!existingView) {
        await supabase
          .from('article_views')
          .insert([{ article_id: articleId, ip_address: ip }]);
      }
    } catch (error) {
      console.error('Error recording article view:', error);
    }
  };

  const fetchRelatedArticles = async (articleId: string, category?: string | null, tags?: string[] | null) => {
    try {
      let query = supabase
        .from('articles')
        .select('*')
        .eq('status', 'published')
        .neq('id', articleId)
        .limit(3);

      // Filter by category first
      if (category) {
        query = query.eq('category', category);
      }

      const { data: categoryArticles, error } = await query.order('published_at', { ascending: false });

      if (error) throw error;

      // If we don't have enough articles by category, fetch by tags
      let articlesToAdd = categoryArticles || [];
      
      if (articlesToAdd.length < 3 && tags && tags.length > 0) {
        const tagQuery = supabase
          .from('articles')
          .select('*')
          .eq('status', 'published')
          .neq('id', articleId)
          .not('id', 'in', `(${articlesToAdd.map(a => a.id).join(',')})`)
          .overlaps('tags', tags)
          .limit(3 - articlesToAdd.length);

        const { data: tagArticles } = await tagQuery;
        articlesToAdd = [...articlesToAdd, ...(tagArticles || [])];
      }

      // Fill remaining slots with recent articles
      if (articlesToAdd.length < 3) {
        const remaining = 3 - articlesToAdd.length;
        const recentQuery = supabase
          .from('articles')
          .select('*')
          .eq('status', 'published')
          .neq('id', articleId)
          .not('id', 'in', `(${articlesToAdd.map(a => a.id).join(',')})`)
          .order('published_at', { ascending: false })
          .limit(remaining);

        const { data: recentArticles } = await recentQuery;
        articlesToAdd = [...articlesToAdd, ...(recentArticles || [])];
      }

      setRelatedArticles(articlesToAdd.slice(0, 3));
    } catch (error) {
      console.error('Error fetching related articles:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('sr-RS', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / wordsPerMinute);
    return readingTime;
  };

  const updateMetaTags = () => {
    if (!article) return;

    // Update page title
    document.title = `${article.title} - Belgrade Times`;

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', article.excerpt || article.title);
    }

    // Add Open Graph tags
    updateOrCreateMetaTag('og:title', 'property', article.title);
    updateOrCreateMetaTag('og:description', 'property', article.excerpt || article.title);
    updateOrCreateMetaTag('og:type', 'property', 'article');
    updateOrCreateMetaTag('og:url', 'property', window.location.href);
    if (article.featured_image_url) {
      updateOrCreateMetaTag('og:image', 'property', article.featured_image_url);
    }
    updateOrCreateMetaTag('article:author', 'property', article.author_name || 'Belgrade Times');

    // Add Twitter Card tags
    updateOrCreateMetaTag('twitter:card', 'name', 'summary_large_image');
    updateOrCreateMetaTag('twitter:title', 'name', article.title);
    updateOrCreateMetaTag('twitter:description', 'name', article.excerpt || article.title);
    if (article.featured_image_url) {
      updateOrCreateMetaTag('twitter:image', 'name', article.featured_image_url);
    }
  };

  const updateOrCreateMetaTag = (content: string, attribute: string, value: string) => {
    let tag = document.querySelector(`meta[${attribute}="${content}"]`) as HTMLMetaElement;
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute(attribute, content);
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', value);
  };

  useEffect(() => {
    if (article) {
      updateMetaTags();
    }
  }, [article]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-xl text-gray-600 dark:text-gray-400">Loading article...</div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="text-xl text-gray-600 dark:text-gray-400 mb-4">Article not found</div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const articleUrl = `${window.location.origin}/article/${article.slug}`;
  const readingTime = calculateReadingTime(article.content);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-4 md:py-8">
        {/* Back Button */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 mb-6 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          style={{ minHeight: '44px' }}
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Home</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Article Content */}
          <div className="lg:col-span-2">
            <article className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              {/* Featured Image */}
              {article.featured_image_url && (
                <div className="w-full aspect-video overflow-hidden">
                  <img
                    src={article.featured_image_url}
                    alt={article.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Article Header */}
              <div className="p-6 md:p-10">
                {/* Category Tag */}
                {article.category && (
                  <Link
                    to={`/category/${article.category.toLowerCase()}`}
                    className="inline-block px-3 py-1 bg-red-600 text-white text-sm font-semibold rounded-full mb-4 hover:bg-red-700 transition-colors"
                  >
                    {article.category.charAt(0).toUpperCase() + article.category.slice(1)}
                  </Link>
                )}

                {/* Title */}
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                  {article.title}
                </h1>

                {/* Excerpt */}
                {article.excerpt && (
                  <p className="text-xl text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                    {article.excerpt}
                  </p>
                )}

                {/* Meta Information */}
                <div className="flex flex-wrap items-center gap-4 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400">
                  {article.author_name && (
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      <span className="font-medium">{article.author_name}</span>
                    </div>
                  )}
                  
                  {article.published_at && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      <span>{formatDate(article.published_at)}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    <span className="font-medium">{article.view_count || 0} views</span>
                  </div>

                  <span className="font-medium">{readingTime} min read</span>
                </div>

                {/* Share Header */}
                <ArticleShareHeader
                  title={article.title}
                  url={articleUrl}
                  description={article.excerpt || ''}
                  className="mb-8"
                />

                {/* Article Content */}
                <div className="prose dark:prose-invert max-w-none">
                  <div
                    className="text-lg leading-relaxed text-gray-800 dark:text-gray-200"
                    dangerouslySetInnerHTML={{ __html: article.content }}
                  />
                </div>

                {/* Tags */}
                {article.tags && article.tags.length > 0 && (
                  <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex flex-wrap gap-2">
                      {article.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </article>

            {/* Comments Section */}
            <div className="mt-8">
              <CommentsSection articleId={article.id} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-8">
            {/* Related Articles */}
            <RelatedArticles
              currentArticleId={article.id}
              currentCategory={article.category}
              currentTags={article.tags}
              excludeIds={relatedArticles.map(a => a.id)}
            />

            {/* Advertisement Placeholder */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Advertisement</h3>
              <div className="bg-gray-200 dark:bg-gray-700 aspect-square rounded-lg flex items-center justify-center">
                <span className="text-gray-500 dark:text-gray-400">Ad Space</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Share Button for Mobile */}
      <FloatingShareButton
        title={article.title}
        url={articleUrl}
        description={article.excerpt || ''}
      />
    </div>
  );
}