import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Comment, CommentStats, Article } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../components/ui/table';
import { CommentDetailsModal } from '../components/CommentDetailsModal';
import { CommentActions } from '../components/CommentActions';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Flag, 
  MessageSquare,
  TrendingUp,
  Clock,
  Users,
  BarChart3,
  RefreshCw,
  Trash2,
  Check,
  X
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/ui/alert-dialog';

export function CommentsManagementPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  // State
  const [comments, setComments] = useState<Comment[]>([]);
  const [filteredComments, setFilteredComments] = useState<Comment[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [stats, setStats] = useState<CommentStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    spam: 0
  });
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [articleFilter, setArticleFilter] = useState<string>('all');

  // Bulk actions
  const [selectedComments, setSelectedComments] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  useEffect(() => {
    if (!user || profile?.role !== 'admin') {
      navigate('/');
      return;
    }

    loadData();
    setupRealtimeSubscription();
  }, [user, profile, navigate]);

  useEffect(() => {
    filterComments();
  }, [comments, searchQuery, statusFilter, articleFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadComments(), loadArticles(), loadStats()]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        article:articles (
          id,
          title,
          slug
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading comments:', error);
      return;
    }

    setComments(data || []);
  };

  const loadArticles = async () => {
    const { data, error } = await supabase
      .from('articles')
      .select('id, title, slug, content, excerpt, featured_image_url, author_id, author_name, status, published_at, created_at, updated_at, tags, reading_time, language, category, meta_title, meta_description, workflow_status, scheduled_publish_date')
      .order('title');

    if (error) {
      console.error('Error loading articles:', error);
      return;
    }

    setArticles(data || []);
  };

  const loadStats = async () => {
    const { data, error } = await supabase
      .from('comments')
      .select('is_approved, is_spam');

    if (error) {
      console.error('Error loading stats:', error);
      return;
    }

    const stats: CommentStats = {
      total: data?.length || 0,
      pending: data?.filter(c => !c.is_approved && !c.is_spam).length || 0,
      approved: data?.filter(c => c.is_approved).length || 0,
      rejected: data?.filter(c => !c.is_approved && !c.is_spam).length || 0,
      spam: data?.filter(c => c.is_spam).length || 0
    };

    setStats(stats);
  };

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel('comments-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'comments'
      }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const filterComments = () => {
    let filtered = [...comments];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(comment =>
        comment.content.toLowerCase().includes(query) ||
        comment.author_name.toLowerCase().includes(query) ||
        comment.author_email.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      switch (statusFilter) {
        case 'pending':
          filtered = filtered.filter(c => !c.is_approved && !c.is_spam);
          break;
        case 'approved':
          filtered = filtered.filter(c => c.is_approved);
          break;
        case 'spam':
          filtered = filtered.filter(c => c.is_spam);
          break;
      }
    }

    // Article filter
    if (articleFilter !== 'all') {
      filtered = filtered.filter(c => c.article_id === articleFilter);
    }

    setFilteredComments(filtered);
  };

  const handleApproveComment = async (commentId: string) => {
    const { error } = await supabase
      .from('comments')
      .update({ 
        is_approved: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId);

    if (error) {
      console.error('Error approving comment:', error);
      return;
    }

    await loadData();
  };

  const handleRejectComment = async (commentId: string) => {
    const { error } = await supabase
      .from('comments')
      .update({ 
        is_approved: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId);

    if (error) {
      console.error('Error rejecting comment:', error);
      return;
    }

    await loadData();
  };

  const handleMarkSpam = async (commentId: string) => {
    const { error } = await supabase
      .from('comments')
      .update({ 
        is_spam: true,
        is_approved: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId);

    if (error) {
      console.error('Error marking comment as spam:', error);
      return;
    }

    await loadData();
  };

  const handleDeleteComment = async (commentId: string) => {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      console.error('Error deleting comment:', error);
      return;
    }

    await loadData();
  };

  const handleBulkApprove = async () => {
    if (selectedComments.size === 0) return;

    setBulkActionLoading(true);
    try {
      const { error } = await supabase
        .from('comments')
        .update({ 
          is_approved: true,
          updated_at: new Date().toISOString()
        })
        .in('id', Array.from(selectedComments));

      if (error) throw error;

      setSelectedComments(new Set());
      await loadData();
    } catch (error) {
      console.error('Error bulk approving comments:', error);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkMarkSpam = async () => {
    if (selectedComments.size === 0) return;

    setBulkActionLoading(true);
    try {
      const { error } = await supabase
        .from('comments')
        .update({ 
          is_spam: true,
          is_approved: false,
          updated_at: new Date().toISOString()
        })
        .in('id', Array.from(selectedComments));

      if (error) throw error;

      setSelectedComments(new Set());
      await loadData();
    } catch (error) {
      console.error('Error bulk marking comments as spam:', error);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedComments.size === 0) return;

    setBulkActionLoading(true);
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .in('id', Array.from(selectedComments));

      if (error) throw error;

      setSelectedComments(new Set());
      await loadData();
    } catch (error) {
      console.error('Error bulk deleting comments:', error);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedComments.size === filteredComments.length) {
      setSelectedComments(new Set());
    } else {
      setSelectedComments(new Set(filteredComments.map(c => c.id)));
    }
  };

  const handleSelectComment = (commentId: string) => {
    const newSelected = new Set(selectedComments);
    if (newSelected.has(commentId)) {
      newSelected.delete(commentId);
    } else {
      newSelected.add(commentId);
    }
    setSelectedComments(newSelected);
  };

  const getStatusBadge = (comment: Comment) => {
    if (comment.is_spam) {
      return <Badge variant="destructive">Spam</Badge>;
    } else if (comment.is_approved) {
      return <Badge variant="default">Approved</Badge>;
    } else {
      return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (!user || profile?.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/admin')}
            className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            style={{ minHeight: '44px' }}
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Admin</span>
          </button>

          <Button
            onClick={refreshData}
            disabled={refreshing}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Page Title */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Comments Management
          </h1>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Comments</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.approved}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Approved</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.rejected}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Rejected</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Flag className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.spam}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Spam</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by author, email, or content..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full lg:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="spam">Spam</SelectItem>
                </SelectContent>
              </Select>

              <Select value={articleFilter} onValueChange={setArticleFilter}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="Filter by article" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Articles</SelectItem>
                  {articles.map((article) => (
                    <SelectItem key={article.id} value={article.id}>
                      {article.title.length > 50 
                        ? `${article.title.substring(0, 50)}...` 
                        : article.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {selectedComments.size > 0 && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedComments.size} comment(s) selected
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={handleBulkApprove}
                    disabled={bulkActionLoading}
                    size="sm"
                    className="gap-2"
                  >
                    <Check className="h-4 w-4" />
                    Approve
                  </Button>
                  
                  <Button
                    onClick={handleBulkMarkSpam}
                    disabled={bulkActionLoading}
                    variant="secondary"
                    size="sm"
                    className="gap-2"
                  >
                    <Flag className="h-4 w-4" />
                    Mark Spam
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Comments</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete {selectedComments.size} comment(s)? 
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleBulkDelete}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Comments Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Comments ({filteredComments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Loading comments...</p>
              </div>
            ) : filteredComments.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No comments found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedComments.size === filteredComments.length && filteredComments.length > 0}
                        onChange={handleSelectAll}
                        className="rounded"
                      />
                    </TableHead>
                    <TableHead>Comment</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Article</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredComments.map((comment) => (
                    <TableRow key={comment.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedComments.has(comment.id)}
                          onChange={() => handleSelectComment(comment.id)}
                          className="rounded"
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {comment.content.length > 100
                              ? `${comment.content.substring(0, 100)}...`
                              : comment.content}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {comment.author_name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {comment.author_email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {comment.article?.title.length > 30
                            ? `${comment.article.title.substring(0, 30)}...`
                            : comment.article?.title || 'Unknown Article'}
                        </p>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(comment)}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </p>
                      </TableCell>
                      <TableCell>
                        <CommentActions
                          commentId={comment.id}
                          isApproved={comment.is_approved}
                          isSpam={comment.is_spam}
                          onApprove={handleApproveComment}
                          onReject={handleRejectComment}
                          onMarkSpam={handleMarkSpam}
                          onDelete={handleDeleteComment}
                          size="sm"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Comment Details Modal */}
        <CommentDetailsModal
          comment={selectedComment}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedComment(null);
          }}
          onApprove={handleApproveComment}
          onReject={handleRejectComment}
          onMarkSpam={handleMarkSpam}
          onDelete={handleDeleteComment}
        />
      </div>
    </div>
  );
}