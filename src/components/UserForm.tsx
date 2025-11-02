import React from 'react';
import { Mail, Lock, User, Shield } from 'lucide-react';

interface UserFormProps {
  formData: {
    email: string;
    password: string;
    fullName: string;
    username: string;
    role: string;
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  submitButtonText: string;
  showPassword?: boolean;
  emailRequired?: boolean;
  passwordRequired?: boolean;
}

const ROLES = ['admin', 'editor', 'author', 'subscriber'];

export function UserForm({
  formData,
  handleChange,
  handleSubmit,
  loading,
  submitButtonText,
  showPassword = true,
  emailRequired = true,
  passwordRequired = true
}: UserFormProps) {
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Email Address {emailRequired && '*'}
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required={emailRequired}
            disabled={!emailRequired} // Disable email for edit mode
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:text-gray-500"
            style={{ minHeight: '44px' }}
            placeholder="user@example.com"
          />
        </div>
      </div>

      {/* Password */}
      {showPassword && (
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Password {passwordRequired && '*'}
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required={passwordRequired}
              minLength={6}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              style={{ minHeight: '44px' }}
              placeholder={passwordRequired ? "Enter secure password (min 6 characters)" : "Leave blank to keep current password"}
            />
          </div>
          {passwordRequired && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Password must be at least 6 characters long
            </p>
          )}
        </div>
      )}

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
            placeholder="johndoe (optional)"
          />
        </div>
      </div>

      {/* Role */}
      <div>
        <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Role *
        </label>
        <div className="relative">
          <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
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
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Choose the user's role and permissions level
        </p>
      </div>

      {/* Role Descriptions */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Role Permissions:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div>
            <div className="font-medium text-red-600 dark:text-red-400">Admin</div>
            <div className="text-gray-600 dark:text-gray-400">Full access to all features</div>
          </div>
          <div>
            <div className="font-medium text-blue-600 dark:text-blue-400">Editor</div>
            <div className="text-gray-600 dark:text-gray-400">Manage articles and content</div>
          </div>
          <div>
            <div className="font-medium text-green-600 dark:text-green-400">Author</div>
            <div className="text-gray-600 dark:text-gray-400">Create and edit own articles</div>
          </div>
          <div>
            <div className="font-medium text-gray-600 dark:text-gray-400">Subscriber</div>
            <div className="text-gray-600 dark:text-gray-400">Read-only access</div>
          </div>
        </div>
      </div>
    </form>
  );
}