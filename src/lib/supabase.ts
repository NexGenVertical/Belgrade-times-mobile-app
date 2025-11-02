import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featured_image_url: string | null;
  author_id: string;
  author_name: string | null;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  tags: string[] | null;
  reading_time: number | null;
  language: string | null;
  category: string | null;
  meta_title: string | null;
  meta_description: string | null;
  workflow_status: string | null;
  scheduled_publish_date: string | null;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: string | null;
  avatar_url: string | null;
  bio: string | null;
}

export interface BreakingNews {
  id: string;
  title: string;
  content: string | null;
  link_url: string | null;
  is_active: boolean;
  priority: number;
  expires_at: string | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface Advertisement {
  id: string;
  name: string;
  image_url: string;
  link_url: string;
  placement: string;
  is_active: boolean;
  impressions: number;
  clicks: number;
  start_date: string | null;
  end_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  article_id: string;
  author_name: string;
  author_email: string;
  author_ip: string;
  content: string;
  is_approved: boolean;
  is_spam: boolean;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  article?: Article;
  replies?: Comment[];
}

export interface CommentStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  spam: number;
}

export interface CommentTrend {
  date: string;
  count: number;
}

export interface ArticleView {
  id: string;
  article_id: string;
  ip_address: string;
  viewed_at: string;
}
