import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  loading?: boolean;
}

export function MetricsCard({ 
  title, 
  value, 
  icon: Icon, 
  iconColor = 'text-blue-600 dark:text-blue-400',
  change,
  changeType = 'neutral',
  loading = false
}: MetricsCardProps) {
  const getChangeColor = () => {
    switch (changeType) {
      case 'positive':
        return 'text-green-600 dark:text-green-400';
      case 'negative':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-all duration-200 hover:shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className={`${iconColor} p-3 rounded-lg bg-opacity-10`}>
          <Icon className="h-6 w-6" />
        </div>
        {change && (
          <span className={`text-sm font-medium ${getChangeColor()}`}>
            {change}
          </span>
        )}
      </div>
      
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
          {title}
        </h3>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {loading ? (
            <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-8 w-20 rounded"></div>
          ) : (
            value.toLocaleString()
          )}
        </div>
      </div>
    </div>
  );
}