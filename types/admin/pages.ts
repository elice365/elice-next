// Admin Page Type Definitions

import { Post, Category } from '../blog/post';
import { User } from '../common/user';
import { AdminNotificationData as NotificationData } from '../common/notifications';

// Admin Blog Page
export interface BlogData extends Omit<Post, 'images'> {
  author?: {
    uid: string;
    name: string;
    email: string;
  };
  _count?: {
    likes: number;
    views: number;
    comments: number;
  };
  image?: string; // Single image for backward compatibility
  images: string[] | { main: string; additional?: string[] }; // Support multiple image formats
}

// Admin Category Page
export interface CategoryData {
  uid: string;
  code: string;
  name: string;
  slug: string;
  path: string;
  level: number;
  parentId: string | null;
  parent?: CategoryData | null;
  children?: CategoryData[];
  _count?: {
    posts: number;
    children: number;
  };
  image?: string;
  images?: string[];
  sortOrder?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Admin Notification Page
export interface AdminNotificationData extends NotificationData {
  recipients?: number;
  readCount?: number;
}

// Page Props
export interface BlogPageProps {
  readonly params: Promise<{
    readonly uid: string;
  }>;
}

export interface AdminPageSearchParams {
  searchParams?: {
    page?: string;
    limit?: string;
    search?: string;
    category?: string;
    status?: string;
    role?: string;
  };
}