export function setThemeCookie(name: string, value: string, days: number = 400) {
  const maxAge = 3600 * 24 * days;
  document.cookie = `${name}=${value}; max-age=${maxAge}; path=/; SameSite=Lax`;
}