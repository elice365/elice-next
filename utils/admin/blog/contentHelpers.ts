import { BlogContent, ProductItem, ContentSection } from '@/types/adminBlog';

// Product management helpers
export function addProduct(content: BlogContent): BlogContent {
  return {
    ...content,
    product: [
      ...content.product,
      {
        url: "",
        tag: [],
        title: "",
        description: ""
      }
    ]
  };
}

export function updateProduct(
  content: BlogContent,
  index: number,
  field: keyof ProductItem,
  value: any
): BlogContent {
  return {
    ...content,
    product: content.product.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    )
  };
}

export function removeProduct(content: BlogContent, index: number): BlogContent {
  return {
    ...content,
    product: content.product.filter((_, i) => i !== index)
  };
}

// Content section management helpers
export function addContentSection(content: BlogContent): BlogContent {
  return {
    ...content,
    content: [
      ...content.content,
      {
        title: "",
        context: ""
      }
    ]
  };
}

export function updateContentSection(
  content: BlogContent,
  index: number,
  field: keyof ContentSection,
  value: string
): BlogContent {
  return {
    ...content,
    content: content.content.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    )
  };
}

export function removeContentSection(content: BlogContent, index: number): BlogContent {
  return {
    ...content,
    content: content.content.filter((_, i) => i !== index)
  };
}

// Author management helpers
export function updateAuthor(
  content: BlogContent,
  field: 'name' | 'description' | 'profileImage',
  value: string
): BlogContent {
  return {
    ...content,
    author: {
      ...content.author,
      [field]: value
    }
  };
}

// Validation helpers
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (!validTypes.includes(file.type)) {
    return { valid: false, error: "JPG, PNG, GIF, WebP 형식만 지원합니다." };
  }
  
  if (file.size > 10 * 1024 * 1024) { // 10MB
    return { valid: false, error: "파일 크기는 10MB 이하여야 합니다." };
  }
  
  return { valid: true };
}