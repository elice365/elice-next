"use client";

import { useLocale } from 'next-intl';
import { useMounted } from '@/hooks/utils';
import { startTransition, useMemo } from 'react';
import { locales, localeIcon } from '@/types/icon';
import { routing, type Locale } from '@/i18n/route';
import { Dropdown } from '@/components/ui/Dropdown';
import { setUserLocale } from '@/lib/cookie/locale';

// Type guard for locale validation
function isValidLocale(locale: string): locale is Locale {
  return routing.locales.includes(locale as Locale);
}

export default function LocaleSwitcher() {
  const locale = useLocale();
  const mounted = useMounted();
  
  const localeList = useMemo<Locale[]>(() => [...routing.locales], []);
  const currentLocale: Locale = isValidLocale(locale) ? locale : routing.defaultLocale;

  const onChange = (value: string) => {
    if (isValidLocale(value)) {
      startTransition(() => {
        setUserLocale(value);
      });
    }
  };

  const options = localeList.map(option => ({
    key: option,
    icon: localeIcon[option],
    label: locales[option],
    isSelected: locale === option
  }));

  if (!mounted) return null;

  return (
    <Dropdown
      currentIcon={localeIcon[currentLocale]}
      options={options}
      direction="right-0"
      onSelect={onChange}
      ariaLabel="locale"
    />
  );
}