import React from 'react';

interface ChartData {
  label: string;
  value: number;
  date?: string;
}

interface AnalyticsChartProps {
  title: string;
  data: ChartData[];
  type: 'line' | 'bar' | 'area';
  color?: string;
  loading?: boolean;
}

export function AnalyticsChart({ 
  title, 
  data, 
  type = 'line', 
  color = 'rgb(59, 130, 246)',
  loading = false
}: AnalyticsChartProps) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
        <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
          No data available
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;

  const renderLineChart = () => {
    const points = data.map((item, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = ((maxValue - item.value) / range) * 100;
      return `${x},${y}`;
    }).join(' ');

    const pathD = data.map((item, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = ((maxValue - item.value) / range) * 100;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    return (
      <svg className="w-full h-64" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
            <stop offset="100%" stopColor={color} stopOpacity="0"/>
          </linearGradient>
        </defs>
        
        {/* Area under the line */}
        <path
          d={`${pathD} L 100 100 L 0 100 Z`}
          fill="url(#lineGradient)"
          opacity="0.6"
        />
        
        {/* Line */}
        <path
          d={pathD}
          stroke={color}
          strokeWidth="0.5"
          fill="none"
          className="drop-shadow-sm"
        />
        
        {/* Data points */}
        {data.map((item, index) => {
          const x = (index / (data.length - 1)) * 100;
          const y = ((maxValue - item.value) / range) * 100;
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="1"
              fill={color}
              className="drop-shadow-sm"
            >
              <title>{`${item.label}: ${item.value}`}</title>
            </circle>
          );
        })}
      </svg>
    );
  };

  const renderBarChart = () => {
    const barWidth = 100 / data.length - 2;
    
    return (
      <svg className="w-full h-64" viewBox="0 0 100 100" preserveAspectRatio="none">
        {data.map((item, index) => {
          const x = (index / data.length) * 100 + 1;
          const height = ((item.value - minValue) / range) * 80;
          const y = 20 + (80 - height);
          
          return (
            <g key={index}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={height}
                fill={color}
                rx="0.5"
                opacity="0.8"
                className="hover:opacity-100 transition-opacity"
              >
                <title>{`${item.label}: ${item.value}`}</title>
              </rect>
            </g>
          );
        })}
      </svg>
    );
  };

  const renderAreaChart = () => {
    const points = data.map((item, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = ((maxValue - item.value) / range) * 100;
      return `${x},${y}`;
    }).join(' ');

    const pathD = data.map((item, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = ((maxValue - item.value) / range) * 100;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    return (
      <svg className="w-full h-64" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.6"/>
            <stop offset="100%" stopColor={color} stopOpacity="0.1"/>
          </linearGradient>
        </defs>
        
        {/* Area */}
        <path
          d={`${pathD} L 100 100 L 0 100 Z`}
          fill="url(#areaGradient)"
          stroke="none"
        />
        
        {/* Line on top */}
        <path
          d={pathD}
          stroke={color}
          strokeWidth="0.5"
          fill="none"
          opacity="0.8"
        />
      </svg>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      
      <div className="relative">
        {type === 'line' && renderLineChart()}
        {type === 'bar' && renderBarChart()}
        {type === 'area' && renderAreaChart()}
      </div>
      
      {/* X-axis labels */}
      <div className="flex justify-between mt-2 px-1">
        {data.slice(0, Math.min(6, data.length)).map((item, index) => (
          <span
            key={index}
            className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-16"
          >
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}