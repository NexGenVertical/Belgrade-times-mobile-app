import React from 'react';
import { Globe, Search, Share2, BarChart3, Settings as SettingsIcon } from 'lucide-react';

export interface TabItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

const tabs: TabItem[] = [
  {
    id: 'general',
    label: 'General',
    icon: SettingsIcon,
    description: 'Site basic information and preferences'
  },
  {
    id: 'seo',
    label: 'SEO',
    icon: Search,
    description: 'Search engine optimization settings'
  },
  {
    id: 'social',
    label: 'Social Media',
    icon: Share2,
    description: 'Social media integration and links'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    description: 'Analytics and tracking configuration'
  },
  {
    id: 'system',
    label: 'System',
    icon: Globe,
    description: 'System settings and maintenance'
  }
];

export function TabNavigation({ activeTab, onTabChange, className = '' }: TabNavigationProps) {
  return (
    <div className={`border-b border-gray-200 dark:border-gray-700 ${className}`}>
      <nav className="-mb-px flex space-x-8 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors
                ${isActive
                  ? 'border-red-500 text-red-600 dark:text-red-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }
              `}
            >
              <Icon 
                className={`
                  -ml-0.5 mr-2 h-5 w-5 transition-colors
                  ${isActive 
                    ? 'text-red-500 dark:text-red-400' 
                    : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'
                  }
                `} 
              />
              <span className="font-medium">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export function TabDescription({ tabId }: { tabId: string }) {
  const tab = tabs.find(t => t.id === tabId);
  
  if (!tab) return null;
  
  return (
    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
      {tab.description}
    </p>
  );
}

export default TabNavigation;