// This file is for backward compatibility
// All blog content types have been moved to types/blog/ folder
export type {
  ProductItem,
  ContentSection,
  AuthorInfo,
  BlogContent
} from './blog/content';

// Blog image type specific to admin
export interface BlogImage {
  id: string;
  url: string;
  filename: string;
  size: number;
  uploadedAt: string;
}