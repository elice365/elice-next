// Blog System Type Definitions
// Central export point for all blog-related types

// Export post types first (base types)
export * from './post';

// Export core blog types
export * from './core';

// Export content types with specific naming to avoid conflicts
export type {
  ProductItem,
  AuthorInfo as BlogAuthorInfo,
  ContentSection,
  BlogContent as BlogContentStructure
} from './content';

// Export component types with specific naming to avoid conflicts
export type {
  BlogPost as BlogPostProps,
  BlogDisplayProps,
  BlogPostContentProps,
  BlogPostHeaderProps,
  BlogPostActionsProps,
  BlogPostGalleryProps,
  BlogListItemProps,
  BlogListProps as BlogListComponentProps,
  RelatedPostsProps,
  AuthorInfo as AuthorInfoType,
  AuthorInfoCardProps
} from './components';