import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, User } from 'lucide-react';
import { supabase, Comment } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';

interface CommentsSectionProps {
  articleId: string;
}

interface CommentFormData {
  author_name: string;
  author_email: string;
  content: string;
}

export function CommentsSection({ articleId }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<CommentFormData>({
    author_name: '',
    author_email: '',
    content: ''
  });
  const [errors, setErrors] = useState<Partial<CommentFormData>>({});
  const [showReplyForm, setShowReplyForm] = useState<string | null>(null);
  const [replyFormData, setReplyFormData] = useState<CommentFormData>({
    author_name: '',
    author_email: '',
    content: ''
  });
  const { t } = useLanguage();

  useEffect(() => {
    fetchComments();
  }, [articleId]);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('article_id', articleId)
        .eq('is_approved', true)
        .eq('is_spam', false)
        .is('parent_id', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch replies for each comment
      const commentsWithReplies = await Promise.all(
        data.map(async (comment) => {
          const { data: replies } = await supabase
            .from('comments')
            .select('*')
            .eq('parent_id', comment.id)
            .eq('is_approved', true)
            .eq('is_spam', false)
            .order('created_at', { ascending: true });

          return { ...comment, replies: replies || [] };
        })
      );

      setComments(commentsWithReplies);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (data: CommentFormData): Partial<CommentFormData> => {
    const newErrors: Partial<CommentFormData> = {};

    if (!data.author_name.trim()) {
      newErrors.author_name = 'Name is required';
    }

    if (!data.author_email.trim()) {
      newErrors.author_email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.author_email)) {
      newErrors.author_email = 'Please enter a valid email address';
    }

    if (!data.content.trim()) {
      newErrors.content = 'Comment content is required';
    } else if (data.content.trim().length < 10) {
      newErrors.content = 'Comment must be at least 10 characters long';
    }

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const newErrors = validateForm(formData);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setSubmitting(false);
      return;
    }

    try {
      // Get client IP
      const response = await fetch('https://api.ipify.org?format=json');
      const { ip } = await response.json();

      const { error } = await supabase
        .from('comments')
        .insert([
          {
            ...formData,
            article_id: articleId,
            author_ip: ip,
            is_approved: false, // Require moderation
            is_spam: false
          }
        ]);

      if (error) throw error;

      setFormData({ author_name: '', author_email: '', content: '' });
      setErrors({});
      alert('Comment submitted successfully! It will be visible after moderation.');
    } catch (error) {
      console.error('Error submitting comment:', error);
      alert('Failed to submit comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReplySubmit = async (parentId: string) => {
    const newErrors = validateForm(replyFormData);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const { ip } = await response.json();

      const { error } = await supabase
        .from('comments')
        .insert([
          {
            ...replyFormData,
            article_id: articleId,
            author_ip: ip,
            parent_id: parentId,
            is_approved: false,
            is_spam: false
          }
        ]);

      if (error) throw error;

      setReplyFormData({ author_name: '', author_email: '', content: '' });
      setShowReplyForm(null);
      setErrors({});
      alert('Reply submitted successfully! It will be visible after moderation.');
    } catch (error) {
      console.error('Error submitting reply:', error);
      alert('Failed to submit reply. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('sr-RS', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
    <div className={`${isReply ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''} mb-6`}>
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white">{comment.author_name}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(comment.created_at)}</p>
          </div>
        </div>
        <p className="text-gray-800 dark:text-gray-200 mb-4">{comment.content}</p>
        {!isReply && (
          <button
            onClick={() => setShowReplyForm(showReplyForm === comment.id ? null : comment.id)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Reply
          </button>
        )}
      </div>

      {showReplyForm === comment.id && (
        <div className="mt-4 ml-8">
          <ReplyForm
            onSubmit={() => handleReplySubmit(comment.id)}
            onCancel={() => setShowReplyForm(null)}
            formData={replyFormData}
            setFormData={setReplyFormData}
            errors={errors}
            submitting={submitting}
          />
        </div>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4">
          {comment.replies.map(reply => (
            <CommentItem key={reply.id} comment={reply} isReply={true} />
          ))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-600 dark:text-gray-400">Loading comments...</div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <MessageCircle className="h-6 w-6 text-gray-600 dark:text-gray-400" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          Comments ({comments.reduce((total, comment) => total + 1 + (comment.replies?.length || 0), 0)})
        </h3>
      </div>

      {/* Comment Form */}
      <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Leave a Comment</h4>
        <CommentForm
          onSubmit={handleSubmit}
          formData={formData}
          setFormData={setFormData}
          errors={errors}
          submitting={submitting}
        />
      </div>

      {/* Comments List */}
      <div className="space-y-6">
        {comments.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map(comment => (
            <CommentItem key={comment.id} comment={comment} />
          ))
        )}
      </div>
    </div>
  );
}

function CommentForm({
  onSubmit,
  formData,
  setFormData,
  errors,
  submitting
}: {
  onSubmit: (e: React.FormEvent) => void;
  formData: CommentFormData;
  setFormData: (data: CommentFormData) => void;
  errors: Partial<CommentFormData>;
  submitting: boolean;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Name *
          </label>
          <input
            type="text"
            value={formData.author_name}
            onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white ${
              errors.author_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="Your name"
          />
          {errors.author_name && <p className="text-red-500 text-sm mt-1">{errors.author_name}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email *
          </label>
          <input
            type="email"
            value={formData.author_email}
            onChange={(e) => setFormData({ ...formData, author_email: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white ${
              errors.author_email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="your@email.com"
          />
          {errors.author_email && <p className="text-red-500 text-sm mt-1">{errors.author_email}</p>}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Comment *
        </label>
        <textarea
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          rows={4}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white ${
            errors.content ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
          }`}
          placeholder="Share your thoughts..."
        />
        {errors.content && <p className="text-red-500 text-sm mt-1">{errors.content}</p>}
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Send className="h-4 w-4" />
        {submitting ? 'Submitting...' : 'Submit Comment'}
      </button>
    </form>
  );
}

function ReplyForm({
  onSubmit,
  onCancel,
  formData,
  setFormData,
  errors,
  submitting
}: {
  onSubmit: () => void;
  onCancel: () => void;
  formData: CommentFormData;
  setFormData: (data: CommentFormData) => void;
  errors: Partial<CommentFormData>;
  submitting: boolean;
}) {
  return (
    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
      <h5 className="font-semibold text-gray-900 dark:text-white mb-3">Reply</h5>
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="text"
            value={formData.author_name}
            onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            placeholder="Your name"
          />
          <input
            type="email"
            value={formData.author_email}
            onChange={(e) => setFormData({ ...formData, author_email: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            placeholder="Your email"
          />
        </div>
        <textarea
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          placeholder="Write your reply..."
        />
        <div className="flex gap-2">
          <button
            onClick={onSubmit}
            disabled={submitting}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
          <button
            onClick={onCancel}
            className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}