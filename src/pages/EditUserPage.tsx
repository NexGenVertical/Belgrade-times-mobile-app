import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Edit, Mail, User, Shield, Activity, Key, Save } from 'lucide-react';

const ROLES = ['admin', 'editor', 'author', 'subscriber'];

interface UserProfile {
  id: string;
  user_id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
  created_at: string;
  updated_at: string;
  email?: string;
  status?: 'active' | 'inactive';
}

interface UserFormData {
  fullName: string;
  username: string;
  role: string;
  status: string;
}

interface UserActivity {
  id: string;
  action: string;
  created_at: string;
  metadata?: any;
}

export function EditUserPage() {
  const { id } = useParams<{ id: string }>();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    fullName: '',
    username: '',
    role: 'subscriber',
    status: 'active'
  });
  const [activity, setActivity] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || profile?.role !== 'admin') {
      navigate('/');
      return;
    }

    if (id) {
      fetchUserProfile();
      fetchUserActivity();
    }
  }, [user, profile, navigate, id]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          auth.users!inner (
            email
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      const formattedUser = {
        id: (data as any).id,
        user_id: (data as any).user_id,
        username: (data as any).username,
        full_name: (data as any).full_name,
        avatar_url: (data as any).avatar_url,
        role: (data as any).role,
        created_at: (data as any).created_at,
        updated_at: (data as any).updated_at,
        email: (data as any).auth?.users?.email || '',
        status: 'active' as const // Default status
      } as UserProfile;

      setUserProfile(formattedUser);
      setFormData({
        fullName: formattedUser.full_name || '',
        username: formattedUser.username || '',
        role: formattedUser.role || 'subscriber',
        status: formattedUser.status || 'active'
      });
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
      setError(error.message || 'Failed to fetch user profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserActivity = async () => {
    try {
      setLoadingActivity(true);
      // Fetch recent activities from various tables
      const [articlesData, commentsData] = await Promise.all([
        supabase
          .from('articles')
          .select('id, title, created_at, status')
          .eq('author_id', id)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('comments')
          .select('id, content, created_at')
          .eq('user_id', id)
          .order('created_at', { ascending: false })
          .limit(10)
      ]);

      const activities: UserActivity[] = [];
      
      if (articlesData.data) {
        articlesData.data.forEach(article => {
          activities.push({
            id: `article-${article.id}`,
            action: `Created article: ${article.title}`,
            created_at: article.created_at,
            metadata: { type: 'article', status: article.status }
          });
        });
      }

      if (commentsData.data) {
        commentsData.data.forEach(comment => {
          activities.push({
            id: `comment-${comment.id}`,
            action: `Posted a comment`,
            created_at: comment.created_at,
            metadata: { type: 'comment' }
          });
        });
      }

      // Sort by creation date
      activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setActivity(activities.slice(0, 20)); // Show last 20 activities
    } catch (error: any) {
      console.error('Error fetching user activity:', error);
    } finally {
      setLoadingActivity(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName) {
      setError('Full name is required');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName,
          username: formData.username || null,
          role: formData.role,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      setSuccess('User updated successfully!');
      fetchUserProfile(); // Refresh data
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      console.error('Error updating user:', error);
      setError(error.message || 'Failed to update user');
      setTimeout(() => setError(''), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase.auth.admin.updateUserById(
        userProfile!.user_id,
        { password: newPassword }
      );

      if (error) throw error;

      setSuccess('Password reset successfully!');
      setShowPasswordReset(false);
      setNewPassword('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      console.error('Error resetting password:', error);
      setError(error.message || 'Failed to reset password');
      setTimeout(() => setError(''), 5000);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'editor': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'author': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'subscriber': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading user...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">User not found</p>
          <Link to="/admin/users" className="text-purple-600 hover:text-purple-700 mt-2 inline-block">
            Back to Users
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <Link
          to="/admin/users"
          className="inline-flex items-center gap-2 mb-6 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          style={{ minHeight: '44px' }}
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Users</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Edit Form */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-lg">
                  <Edit className="h-6 w-6 text-purple-600 dark:text-purple-300" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Edit User
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    {userProfile.email}
                  </p>
                </div>
              </div>

              {success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
                  {success}
                </div>
              )}

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Full Name */}
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      style={{ minHeight: '44px' }}
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                {/* Username */}
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      style={{ minHeight: '44px' }}
                      placeholder="johndoe"
                    />
                  </div>
                </div>

                {/* Email (read-only) */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="email"
                      id="email"
                      value={userProfile.email || ''}
                      disabled
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                      style={{ minHeight: '44px' }}
                    />
                  </div>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Email cannot be changed
                  </p>
                </div>

                {/* Role */}
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Role
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <select
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none"
                      style={{ minHeight: '44px' }}
                    >
                      {ROLES.map(role => (
                        <option key={role} value={role}>
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Password Reset */}
                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Password Management
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowPasswordReset(!showPasswordReset)}
                      className="text-purple-600 hover:text-purple-700 font-medium"
                    >
                      Reset Password
                    </button>
                  </div>

                  {showPasswordReset && (
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          New Password
                        </label>
                        <div className="relative">
                          <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                          <input
                            type="password"
                            id="newPassword"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            minLength={6}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            style={{ minHeight: '44px' }}
                            placeholder="New password (min 6 characters)"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handlePasswordReset}
                        disabled={saving}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors flex items-center gap-2"
                        style={{ minHeight: '44px' }}
                      >
                        {saving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Resetting...
                          </>
                        ) : (
                          <>
                            <Key className="h-4 w-4" />
                            Reset Password
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-4 pt-6 border-t">
                  <Link
                    to="/admin/users"
                    className="px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    style={{ minHeight: '44px' }}
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg transition-colors flex items-center gap-2"
                    style={{ minHeight: '44px' }}
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* User Info & Activity */}
          <div className="space-y-6">
            {/* User Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">User Information</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  {userProfile.avatar_url ? (
                    <img
                      src={userProfile.avatar_url}
                      alt={userProfile.full_name || 'User'}
                      className="h-12 w-12 rounded-full"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                      <span className="text-gray-600 dark:text-gray-300 font-medium">
                        {(userProfile.full_name || userProfile.email || '?').charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {userProfile.full_name || 'No name'}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {userProfile.email}
                    </div>
                  </div>
                </div>
                
                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Role:</span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(userProfile.role || 'subscriber')}`}>
                      {userProfile.role ? userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1) : 'No role'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      userProfile.status === 'active' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {userProfile.status || 'active'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Joined:</span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {formatDate(userProfile.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Log */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="h-5 w-5 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Activity Log</h3>
              </div>
              
              {loadingActivity ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto"></div>
                </div>
              ) : activity.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">No recent activity</p>
              ) : (
                <div className="space-y-3">
                  {activity.map((item) => (
                    <div key={item.id} className="flex items-start gap-3">
                      <div className="h-2 w-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 dark:text-white">
                          {item.action}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(item.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}