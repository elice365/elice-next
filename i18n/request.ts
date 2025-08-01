import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from '@/i18n/route';
import { headers } from 'next/headers';
import { country } from '@/utils/type/country';
import { getUserLocale } from '@/lib/cookie/locale';
import { logger } from '@/lib/services/logger';

export default getRequestConfig(async ({requestLocale}) => {
  let requested = await requestLocale;
  const countryCode = (await headers()).get('cf-ipcountry');
  const language = countryCode ? country(countryCode) : 'ko';
  if (!requested) {
    requested = await Promise.resolve(language).then(async (lang) => {
      const userLocale = await getUserLocale();
      return userLocale || lang;
    });
  }
 
  const locale = hasLocale(routing.locales, requested)? requested : routing.defaultLocale;
  try {
    return {
      locale,
      messages: (await import(`@/i18n/translations/${locale}.json`)).default
    };
  } catch (error) {
    logger.error(`Failed to load translations for "${locale}"`, 'I18N', error);
    return {
      locale,
      messages: {},
    };
  }
});