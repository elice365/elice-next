// Blog Content Type Definitions
// Types for blog content parsing and structure

export interface ProductItem {
  url: string;
  tag: string[];
  title: string;
  description: string;
}

export interface AuthorInfo {
  name: string;
  description: string;
  profileImage: string;
}

export interface ContentSection {
  title: string;
  context: string;
}

export interface BlogContent {
  product: ProductItem[];
  author: AuthorInfo;
  content: ContentSection[];
}