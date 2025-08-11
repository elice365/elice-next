// API Route Type Definitions

// Common route params for API handlers
export interface RouteParams {
  uid: string;
}

// Next.js App Router API route params (with Promise wrapper)
export interface APIRouteParams {
  params: Promise<{
    uid: string;
  }>;
}

// API route params with image ID
export interface APIImageRouteParams {
  params: Promise<{
    uid: string;
    imageId: string;
  }>;
}

export interface ImageRouteParams extends RouteParams {
  imageId: string;
}

// Blog API types
export interface LikeDetailResponse {
  userId: string;
  userName?: string;
  userEmail?: string;
  userImage?: string;
  likedAt: string;
}

export interface ViewDetailResponse {
  userId: string;
  userName?: string;
  userEmail?: string;
  userImage?: string;
  viewedAt: string;
  ipAddress?: string;
  userAgent?: string;
}

// Post API types
export interface PostListRequest {
  type: 'list';
  page?: number;
  limit?: number;
  category?: string;
  tag?: string;
  search?: string;
  sortBy?: 'latest' | 'popular' | 'views';
}

export interface PostDetailRequest {
  type: 'post';
  uid: string;
  increaseView?: boolean;
  language?: string;
}

export interface NoticeListRequest {
  type: 'notice';
  page?: number;
  limit?: number;
}

export interface PostListResponse {
  posts: Array<{
    uid: string;
    title: string;
    description: string;
    imageUrl?: string;
    status: string;
    viewCount: number;
    likeCount: number;
    commentCount: number;
    isLiked?: boolean;
    category?: {
      uid: string;
      name: string;
      slug: string;
    };
    tags: Array<{
      uid: string;
      name: string;
    }>;
    createdAt: string;
    updatedAt: string;
  }>;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface PostDetailResponse {
  post: {
    uid: string;
    title: string;
    description: string;
    content?: any;
    imageUrl?: string;
    status: string;
    viewCount: number;
    likeCount: number;
    commentCount: number;
    isLiked?: boolean;
    category?: {
      uid: string;
      name: string;
      slug: string;
    };
    tags: Array<{
      uid: string;
      name: string;
    }>;
    author?: {
      uid: string;
      name: string;
      email: string;
      image?: string;
    };
    createdAt: string;
    updatedAt: string;
  };
  content?: any;
  relatedPosts?: Array<any>;
}

export interface NoticeListResponse {
  notices: Array<{
    uid: string;
    title: string;
    content: string;
    isRead: boolean;
    createdAt: string;
  }>;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface LikeRequest {
  postId: string;
  userId?: string;
  action: 'like' | 'unlike';
}

export interface LikeResponse {
  success: boolean;
  liked: boolean;
  likeCount: number;
}