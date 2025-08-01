"use client";

import { useTheme } from "next-themes";
import { memo, useCallback, useMemo } from "react";
import { setThemeCookie } from "@/utils/cookie/theme";
import { themeIcon , type Theme } from "@/types/icon";
import { Dropdown } from '@/components/ui/Dropdown';
import { useMounted } from "@/hooks/useMount";


export default memo(function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
 const mounted = useMounted();
  const themes = useMemo<Theme[]>(() => ["system", "light", "dark", "deepblue"], []);
  const currentTheme = theme as Theme || "light";
  const handleThemeChange = useCallback((selected: string) => {
    const selectedTheme = selected as Theme;
    setTheme(selectedTheme);
    setThemeCookie("theme", selectedTheme);
  }, [setTheme]);

  const options = themes.map(option => ({
    key: option,
    icon: themeIcon[option],
    label: option,
    isSelected: theme === option
  }));

 if (!mounted) {
   return null;
 } else {
  return (
    <Dropdown
      currentIcon={themeIcon[currentTheme]}
      options={options}
      direction="right-0"
      className="opacity-55"
      onSelect={handleThemeChange}
      ariaLabel="theme"
    />
  );
 }
});