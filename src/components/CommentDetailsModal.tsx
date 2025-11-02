import React from 'react';
import { Comment } from '../lib/supabase';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { 
  X, 
  Check, 
  X as RejectIcon, 
  Trash2, 
  Flag,
  ExternalLink,
  User,
  Mail,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface CommentDetailsModalProps {
  comment: Comment | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (commentId: string) => void;
  onReject: (commentId: string) => void;
  onMarkSpam: (commentId: string) => void;
  onDelete: (commentId: string) => void;
}

export function CommentDetailsModal({
  comment,
  isOpen,
  onClose,
  onApprove,
  onReject,
  onMarkSpam,
  onDelete,
}: CommentDetailsModalProps) {
  if (!isOpen || !comment) return null;

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  const getStatusBadge = () => {
    if (comment.is_spam) {
      return <Badge variant="destructive">Spam</Badge>;
    } else if (comment.is_approved) {
      return <Badge variant="default">Approved</Badge>;
    } else {
      return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Comment Details
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Comment Content */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Comment Content</CardTitle>
                {getStatusBadge()}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                  {comment.content}
                </p>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <MessageSquare className="h-4 w-4" />
                <span>
                  Posted {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Author Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Author Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {comment.author_name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Author Name
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {comment.author_email}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Email Address
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {comment.author_ip}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    IP Address
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Article Information */}
          {comment.article && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Article Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white mb-2">
                    {comment.article.title}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => window.open(`/article/${comment.article?.slug}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Article
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            {!comment.is_approved && !comment.is_spam && (
              <Button
                onClick={() => handleAction(() => onApprove(comment.id))}
                className="gap-2"
              >
                <Check className="h-4 w-4" />
                Approve
              </Button>
            )}
            
            {!comment.is_approved && !comment.is_spam && (
              <Button
                variant="outline"
                onClick={() => handleAction(() => onReject(comment.id))}
                className="gap-2"
              >
                <RejectIcon className="h-4 w-4" />
                Reject
              </Button>
            )}

            {!comment.is_spam && (
              <Button
                variant="secondary"
                onClick={() => handleAction(() => onMarkSpam(comment.id))}
                className="gap-2"
              >
                <Flag className="h-4 w-4" />
                Mark as Spam
              </Button>
            )}

            <Button
              variant="destructive"
              onClick={() => handleAction(() => onDelete(comment.id))}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>

            <Button
              variant="ghost"
              onClick={onClose}
              className="ml-auto"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}