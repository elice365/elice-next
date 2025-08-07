// Blog post related types

export interface PostType {
  uid: string;
  type: string;
  title: string;
  description: string;
  url: string;
  images: string[]; // Changed from any to string[] for array-based image storage
  views: number;
  likeCount: number;
  comments?: number;
  status?: 'draft' | 'published';
  publishedAt?: Date | null;
  createdTime: Date;
  updatedTime: Date;
  category?: Category;
  tags: Tag[];
  isLiked?: boolean;
}

export interface Category {
  uid: string;
  code: string;
  name: string;
  slug: string;
  path: string;
  level: number;
  parentId?: string;
  _count?: {
    posts: number;
  };
}

export interface Tag {
  uid: string;
  name: string;
  _count?: {
    posts: number;
  };
}

export interface PostView {
  id: string;
  postId: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  viewedAt: Date;
}

export interface Notice {
  uid: string;
  title: string;
  content: string;
  link?: string;
  startsTime: Date;
  endsTime?: Date;
  createdTime: Date;
  isRead?: boolean;
}

// Request types
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
  language?: string;
}

export interface NoticeListRequest {
  type: 'notice';
  page?: number;
  limit?: number;
}

export interface LikeRequest {
  postId: string;
  action: 'like' | 'unlike';
}

// Response types
export interface PostListResponse {
  posts: PostType[];
  pagination: PaginationInfo;
}

export interface PostDetailResponse {
  post: PostType;
  content?: {
    language: string;
    data: any;
  };
}

export interface NoticeListResponse {
  notices: Notice[];
  pagination: PaginationInfo;
}

export interface LikeResponse {
  success: boolean;
  liked: boolean;
  likeCount: number;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNext: boolean;
  hasPrev: boolean;
  limit: number;
}

// CDN content types
export interface PostContent {
  language: string;
  data: {
    title?: string;
    content: string;
    metadata?: Record<string, any>;
    sections?: Array<{
      type: string;
      content: string;
      metadata?: Record<string, any>;
    }>;
  };
}