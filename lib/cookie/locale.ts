'use server'

import { cookies } from 'next/headers';
import { COOKIE, Locale, routing } from '@/i18n/route';

export async function getUserLocale() {
  return (await cookies()).get(COOKIE)?.value || routing.locales[0];
}

export async function setUserLocale(locale: Locale) {
  (await cookies()).set(COOKIE, locale)
}