import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";


export const COOKIE =  "NEXT_LOCALE"
export type Locale = (typeof routing.locales)[number];
export const routing = defineRouting({
  locales: ["ko", "en", "ja", "ru"], 
  defaultLocale: "ko",
});

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
