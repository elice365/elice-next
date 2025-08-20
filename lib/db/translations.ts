import { prisma } from './prisma';

// ================================
// TypeScript Interfaces
// ================================

export interface TranslationData {
  locale: string;
  title: string;
  description: string;
  content?: string;
  url?: string;
}

export interface LocalizedPost {
  uid: string;
  type: string;
  title: string;
  description: string;
  content?: string;
  url: string;
  images: any;
  status: string;
  publishedAt?: Date | null;
  likeCount: number;
  views?: number;
  createdTime: Date;
  updatedTime: Date;
  category?: any;
  tags?: any[];
  locale: string;
  availableLocales: string[];
}

// ================================
// Translation Helper Functions
// ================================

/**
 * Get a post with translation for a specific locale
 * Falls back to Korean if translation doesn't exist
 */
export const getPostWithTranslation = async (
  postId: string,
  locale: string = 'ko'
): Promise<LocalizedPost | null> => {
  const post = await prisma.post.findUnique({
    where: { uid: postId },
    include: {
      category: true,
      tags: true,
      translations: true,
      _count: {
        select: {
          view: true,
          likes: true
        }
      }
    }
  });

  if (!post) return null;

  // Find translation for requested locale
  let translation = post.translations.find(t => t.locale === locale);
  
  // Fallback to Korean if not found
  if (!translation) {
    translation = post.translations.find(t => t.locale === 'ko');
  }
  
  // If still no translation, use default fields
  const title = translation?.title || post.title;
  const description = translation?.description || post.description;
  const content = translation?.content || undefined;
  const url = translation?.url || post.url;

  return {
    uid: post.uid,
    type: post.type,
    title,
    description,
    content,
    url,
    images: post.images,
    status: post.status,
    publishedAt: post.publishedAt,
    likeCount: post.likeCount,
    views: post._count.view,
    createdTime: post.createdTime,
    updatedTime: post.updatedTime,
    category: post.category,
    tags: post.tags,
    locale,
    availableLocales: post.translations.map(t => t.locale)
  };
};

/**
 * Get all posts with translations for a specific locale
 */
export const getPostsWithTranslations = async (
  locale: string = 'ko',
  options?: {
    page?: number;
    limit?: number;
    category?: string;
    status?: string;
  }
) => {
  const page = options?.page || 1;
  const limit = options?.limit || 10;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (options?.category) where.categoryId = options.category;
  if (options?.status) where.status = options.status;

  const posts = await prisma.post.findMany({
    where,
    skip,
    take: limit,
    orderBy: { createdTime: 'desc' },
    include: {
      category: true,
      tags: true,
      translations: {
        where: { locale }
      },
      _count: {
        select: {
          view: true,
          likes: true
        }
      }
    }
  });

  // Map posts with localized content
  return posts.map(post => {
    const translation = post.translations[0];
    
    return {
      uid: post.uid,
      type: post.type,
      title: translation?.title || post.title,
      description: translation?.description || post.description,
      url: translation?.url || post.url,
      images: post.images,
      status: post.status,
      publishedAt: post.publishedAt,
      likeCount: post.likeCount,
      views: post._count.view,
      createdTime: post.createdTime,
      updatedTime: post.updatedTime,
      category: post.category,
      tags: post.tags
    };
  });
};

/**
 * Create or update translations for a post
 */
export const upsertPostTranslations = async (
  postId: string,
  translations: TranslationData[]
) => {
  const operations = translations.map(translation => 
    prisma.postTranslation.upsert({
      where: {
        postId_locale: {
          postId,
          locale: translation.locale
        }
      },
      update: {
        title: translation.title,
        description: translation.description,
        content: translation.content,
        url: translation.url
      },
      create: {
        postId,
        ...translation
      }
    })
  );

  return await prisma.$transaction(operations);
};

/**
 * Get available locales for a post
 */
export const getPostAvailableLocales = async (postId: string): Promise<string[]> => {
  const translations = await prisma.postTranslation.findMany({
    where: { postId },
    select: { locale: true }
  });

  return translations.map(t => t.locale);
};

/**
 * Delete a translation for a specific locale
 */
export const deletePostTranslation = async (
  postId: string,
  locale: string
) => {
  // Don't allow deleting Korean translation (fallback)
  if (locale === 'ko') {
    throw new Error('Cannot delete Korean translation');
  }

  return await prisma.postTranslation.delete({
    where: {
      postId_locale: {
        postId,
        locale
      }
    }
  });
};

/**
 * Get locale from request headers or cookies
 */
export const getPreferredLocale = (request: Request): string => {
  // Check URL params
  const url = new URL(request.url);
  const urlLocale = url.searchParams.get('locale');
  if (urlLocale && ['ko', 'en', 'ja', 'ru'].includes(urlLocale)) {
    return urlLocale;
  }

  // Check Accept-Language header
  const acceptLanguage = request.headers.get('Accept-Language');
  if (acceptLanguage) {
    const languages = acceptLanguage.split(',').map(lang => {
      const [code] = lang.trim().split('-');
      return code.toLowerCase();
    });

    for (const lang of languages) {
      if (lang === 'ko' || lang === 'kr') return 'ko';
      if (lang === 'en') return 'en';
      if (lang === 'ja' || lang === 'jp') return 'ja';
      if (lang === 'ru') return 'ru';
    }
  }

  // Default to Korean
  return 'ko';
};