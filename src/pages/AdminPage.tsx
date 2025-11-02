import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, FileText, FolderOpen, Users, MessageSquare, AlertCircle, BarChart, Settings, Megaphone, Search } from 'lucide-react';

export function AdminPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || profile?.role !== 'admin') {
      navigate('/login');
    }
  }, [user, profile, navigate]);

  if (!user || profile?.role !== 'admin') {
    return null;
  }

  const adminCards = [
    {
      title: 'Settings & SEO',
      description: 'Manage site settings, SEO, and social media integration',
      icon: Settings,
      link: '/admin/settings',
      color: 'bg-gray-600'
    },
    {
      title: 'Articles',
      description: 'Create and manage articles with custom author names',
      icon: FileText,
      link: '/admin/articles',
      color: 'bg-blue-600'
    },
    {
      title: 'Advertisements',
      description: 'Manage ads and monitor performance metrics',
      icon: Megaphone,
      link: '/admin/ads',
      color: 'bg-pink-600'
    },
    {
      title: 'Site Content',
      description: 'Manage contact info, social links, and policies',
      icon: Settings,
      link: '/admin/content',
      color: 'bg-teal-600'
    },
    {
      title: 'Categories',
      description: 'Organize categories',
      icon: FolderOpen,
      link: '/admin/categories',
      color: 'bg-green-600'
    },
    {
      title: 'Users',
      description: 'Manage users',
      icon: Users,
      link: '/admin/users',
      color: 'bg-purple-600'
    },
    {
      title: 'Comments',
      description: 'Moderate comments',
      icon: MessageSquare,
      link: '/admin/comments',
      color: 'bg-yellow-600'
    },
    {
      title: 'Breaking News',
      description: 'Manage breaking news',
      icon: AlertCircle,
      link: '/admin/breaking-news',
      color: 'bg-red-600'
    },
    {
      title: 'Analytics',
      description: 'View site statistics',
      icon: BarChart,
      link: '/admin/analytics',
      color: 'bg-indigo-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-red-600 text-white p-3 rounded-lg">
            <Shield className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              Admin Panel
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your Belgrade Times content
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminCards.map((card) => {
            const Icon = card.icon;
            
            return (
              <Link 
                key={card.title} 
                to={card.link}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow h-full"
              >
                <div className={`${card.color} text-white p-3 rounded-lg inline-block mb-4`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                  {card.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {card.description}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
