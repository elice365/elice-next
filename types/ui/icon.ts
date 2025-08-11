import { Locale } from "@/i18n/route";

export type Theme = "system" | "light" | "dark" | "deepblue";

export type IconProps = {
  name: string;
  size?: number;
  color?: string;
  className?: string;
  fill?: string;
};


// 테마별 아이콘 매핑
export const themeIcon: Record<Theme, string> = {
  system: "Monitor",
  light: "Sun", 
  dark: "Moon",
  deepblue: "Droplet"
} as const;


export const localeIcon: Record<Locale, string> = {
  ko: "kr",
  en: "us", 
  ja: "jp",
  ru: "ru",
} as const;

export const locales: Record<Locale, string> = {
  ko: "한국어",
  en: "English", 
  ja: "日本語",
  ru: "Русский",
} as const;
