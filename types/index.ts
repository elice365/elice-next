// Re-export with specific naming to avoid conflicts
export * from './api';
export * from './common';
// UI exports with conflict resolution for BlogCreateModalProps
export type {
  BlogCreateModalProps as UIBlogCreateModalProps
} from './ui/modal';

// Auth exports with conflict resolution
export type {
  AuthType,
  FormType,
  AuthFormField,
  MeJwtPayload,
  AuthFormProps,
  Role as AuthRole,
  UserRole,
  Auth,
  AuthResponse,
  AuthDetails,
  UserCounts,
  UserWithRelations
} from './auth/auth';

export * from './auth/session';
export * from './auth/social';
export type {
  TokenPayload as AuthTokenPayload
} from './auth/token';

// Admin exports with conflict resolution
export type {
  ValidationRule,
  ValidationRules,
  FormField,
  PaginationState,
  BaseModalProps,
  FormErrors,
  ModalStates,
  Role as AdminRole,
  RoleResponse,
  RoleStats,
  WebRouter,
  RouterResponse,
  RouterStats,
  AdminFormConfig,
  BadgeStyles,
  AdminPageConfig
} from './admin/admin';

export type {
  BlogData as AdminBlogData,
  CategoryData,
  AdminNotificationData,
  BlogPageProps
} from './admin/pages';

// Blog exports with conflict resolution - explicit exports to avoid AuthorInfo collision
export type {
  AuthorInfo
} from './blog/content';
export type {
  BlogPost,
  BlogCategory,
  BlogTag,
  BlogPostsResponse,
  BlogPostResponse,
  BlogActionResponse,
  BlogStatsResponse,
  CoreBlogCardProps,
  CoreBlogListProps,
  BlogPostDetailProps,
  BlogFiltersProps,
  BlogHeaderProps,
  BlogContent,
  ProductItem,
  ContentSection,
  BlogImage,
  BlogComment,
  BlogLike,
  BlogView,
  BlogBookmark,
  BlogState,
  BlogFilterState,
  BlogPaginationState,
  BlogLayoutOption,
  BlogSortOption,
  BlogPostStatus,
  BlogSharePlatform,
  BlogShareOptions,
  AdminBlogPost,
  AdminBlogFilters,
  AdminBlogBulkAction,
  BlogPostFormData,
  BlogCommentFormData,
  BlogCategoryFormData,
  UseBlogPostReturn,
  UseBlogListReturn,
  UseBlogFiltersReturn,
  BlogPostWithRelations,
  BlogPostPreview,
  BlogPostCard,
  BlogError,
  BlogErrorCode,
  BlogFilters,
  BlogSliceState
} from './blog/core';
export * from './blog/components';
// Export blog/post types excluding conflicting LikeRequest/LikeResponse
export type {
  Post,
  PostType,
  PostContent,
  PostView,
  Notice,
  Category,
  Tag,
  PostListRequest,
  PostDetailRequest,
  NoticeListRequest,
  PostListResponse,
  PostDetailResponse,
  NoticeListResponse,
  PaginationInfo,
  LikeRequest as BlogLikeRequest,
  LikeResponse as BlogLikeResponse
} from './blog/post';

// Lib exports with conflict resolution
export type {
  TokenPayload as LibTokenPayload,
  TokenError,
  TokenPair,
  ClientTokens,
  TokenManager
} from './lib/services';

export * from './lib/db';
