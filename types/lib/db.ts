// Database Operation Type Definitions

// Blog DB types
export interface AdminBlogParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface BlogCreateData {
  title: string;
  description: string;
  content?: any;
  imageUrl?: string;
  categoryId?: string;
  tags?: string[];
  status?: 'draft' | 'published';
  authorId: string;
}

export interface BlogUpdateData {
  title?: string;
  description?: string;
  content?: any;
  imageUrl?: string;
  categoryId?: string;
  tags?: string[];
  status?: 'draft' | 'published';
}

// Category DB types
export interface AdminCategoryParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CategoryCreateData {
  name: string;
  slug: string;
  description?: string;
  order?: number;
  isActive?: boolean;
}

export interface CategoryUpdateData {
  name?: string;
  slug?: string;
  description?: string;
  order?: number;
  isActive?: boolean;
}

// Notification DB types
export interface AdminNotificationParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface NotificationCreateData {
  title: string;
  content: string;
  type: 'info' | 'warning' | 'error' | 'success';
  userId?: string;
  targetUrl?: string;
}

export interface BulkNotificationCreateData {
  title: string;
  content: string;
  type: 'info' | 'warning' | 'error' | 'success';
  userIds: string[];
  targetUrl?: string;
}

// Session DB types
export interface AdminSessionParams {
  page?: number;
  limit?: number;
  userId?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// User DB types
export interface AdminUserParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  role?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// View tracking types
export interface ViewTrackingData {
  postId: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
}