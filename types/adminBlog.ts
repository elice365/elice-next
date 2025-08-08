export interface ProductItem {
  url: string;
  tag: string[];
  title: string;
  description: string;
}

export interface ContentSection {
  title: string;
  context: string;
}

export interface BlogImage {
  id: string;
  url: string;
  filename: string;
  size: number;
  uploadedAt: string;
}

export interface AuthorInfo {
  name: string;
  description: string;
  profileImage: string;
}

export interface BlogContent {
  product: ProductItem[];
  author: AuthorInfo;
  content: ContentSection[];
}