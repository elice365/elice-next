export interface TranslationData {
  title: string;
  description: string;
  content?: string;
  url?: string;
}

export interface MultiLangFormData {
  type: 'post' | 'notice';
  categoryId: string;
  tags: string[];
  images: string[];
  status: 'draft' | 'published';
  url?: string;
  publishedAt?: string;
  translations: {
    ko: TranslationData;
    en: TranslationData;
    ja: TranslationData;
    ru: TranslationData;
  };
}

export interface PostTranslation {
  id: string;
  postId: string;
  locale: string;
  title: string;
  description: string;
  content?: string;
  url?: string;
  createdTime: Date;
  updatedTime: Date;
}

export type SupportedLocale = 'ko' | 'en' | 'ja' | 'ru';

export const SUPPORTED_LOCALES: readonly SupportedLocale[] = ['ko', 'en', 'ja', 'ru'] as const;

export const LOCALE_NAMES: Record<SupportedLocale, string> = {
  ko: '한국어',
  en: 'English',
  ja: '日本語',
  ru: 'Русский'
};

export const LOCALE_FLAGS: Record<SupportedLocale, string> = {
  ko: '🇰🇷',
  en: '🇺🇸',
  ja: '🇯🇵',
  ru: '🇷🇺'
};