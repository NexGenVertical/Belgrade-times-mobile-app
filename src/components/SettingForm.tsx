import React from 'react';
import { Switch } from './ui/switch';
import { Textarea } from './ui/textarea';

export interface SettingField {
  key: string;
  label: string;
  description?: string;
  type: 'text' | 'email' | 'url' | 'number' | 'boolean' | 'textarea' | 'select';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: {
    pattern?: RegExp;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
  };
  maxLength?: number;
  minLength?: number;
}

interface SettingFormProps {
  fields: SettingField[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onSave?: () => void;
  loading?: boolean;
  className?: string;
}

export function SettingForm({ 
  fields, 
  values, 
  onChange, 
  onSave, 
  loading = false,
  className = '' 
}: SettingFormProps) {
  const handleInputChange = (key: string, value: string) => {
    onChange(key, value);
  };

  const getFieldError = (field: SettingField): string | null => {
    const value = values[field.key] || '';
    
    if (field.required && !value) {
      return `${field.label} is required`;
    }
    
    if (field.validation?.pattern && value) {
      if (!field.validation.pattern.test(value)) {
        return `Invalid ${field.label.toLowerCase()} format`;
      }
    }
    
    const minLength = field.validation?.minLength || field.minLength;
    const maxLength = field.validation?.maxLength || field.maxLength;
    
    if (minLength && value.length < minLength) {
      return `${field.label} must be at least ${minLength} characters`;
    }
    
    if (maxLength && value.length > maxLength) {
      return `${field.label} must be no more than ${maxLength} characters`;
    }
    
    if (field.type === 'number') {
      const numValue = parseFloat(value);
      if (field.validation?.min !== undefined && numValue < field.validation.min) {
        return `${field.label} must be at least ${field.validation.min}`;
      }
      if (field.validation?.max !== undefined && numValue > field.validation.max) {
        return `${field.label} must be no more than ${field.validation.max}`;
      }
    }
    
    return null;
  };

  const renderField = (field: SettingField) => {
    const value = values[field.key] || '';
    const error = getFieldError(field);
    
    switch (field.type) {
      case 'boolean':
        return (
          <div className="flex items-center space-x-3">
            <Switch
              checked={value === 'true'}
              onCheckedChange={(checked) => handleInputChange(field.key, checked ? 'true' : 'false')}
              disabled={loading}
              id={field.key}
            />
            <label htmlFor={field.key} className="text-sm font-medium text-gray-900 dark:text-white">
              {field.description || `Enable ${field.label.toLowerCase()}`}
            </label>
          </div>
        );
      
      case 'textarea':
        return (
          <div>
            <Textarea
              id={field.key}
              value={value}
              onChange={(e) => handleInputChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              disabled={loading}
              rows={4}
              className="resize-none"
              style={{ minHeight: '44px' }}
            />
          </div>
        );
      
      case 'select':
        return (
          <select
            id={field.key}
            value={value}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            disabled={loading}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 dark:bg-gray-700 dark:text-white"
            style={{ minHeight: '44px' }}
          >
            <option value="">Select {field.label.toLowerCase()}</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      
      default:
        return (
          <input
            type={field.type}
            id={field.key}
            value={value}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            disabled={loading}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 dark:bg-gray-700 dark:text-white"
            style={{ minHeight: '44px' }}
            min={field.type === 'number' ? field.validation?.min : undefined}
            max={field.type === 'number' ? field.validation?.max : undefined}
            minLength={field.validation?.minLength || field.minLength}
            maxLength={field.validation?.maxLength || field.maxLength}
          />
        );
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {fields.map((field) => {
        const value = values[field.key] || '';
        const error = getFieldError(field);
        
        if (field.type === 'boolean') {
          return (
            <div key={field.key} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              {renderField(field)}
            </div>
          );
        }
        
        return (
          <div key={field.key} className="space-y-2">
            <label 
              htmlFor={field.key}
              className="block text-sm font-medium text-gray-900 dark:text-white"
            >
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            
            {renderField(field)}
            
            {field.description && !error && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {field.description}
              </p>
            )}
            
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default SettingForm;