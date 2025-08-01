import validator from 'validator';
export type Field =
  | 'id'
  | 'password'
  | 'confirmPassword'
  | 'email'
  | 'phone'
  | 'search'
  | 'name'
  | 'path'
  | 'icon'
  | 'description';

export type TranslateFn = (key: Field) => string;

// Compiled regex patterns for performance
const REGEX_PATTERNS = {
  password: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()._-])/,
  name: /^[a-zA-Z가-힣\s]+$/,
  search: /^[a-zA-Z0-9가-힣\s._-]*$/,
  path: /^\/[a-zA-Z0-9\-_/]*$/,
  icon: /^[A-Z][a-zA-Z0-9]*$/,
  searchFilter: /[<>"'&;(){}[\]\\]/g,
  searchInvalid: /[^a-zA-Z0-9가-힣\s._-]/g,
  phoneFilter: /[^\d-]/g,
  pathSlashes: /\/+/g,
  whitespace: /\s+/g
} as const;
export const INPUT_FILTER: Record<Field, (v: string) => string> = {
  id: v => v.toLowerCase().trim(),
  password: v => v.trim(),
  confirmPassword: v => v.trim(),
  email: v => v.toLowerCase().trim(),
  phone: v => v.replace(REGEX_PATTERNS.phoneFilter, ''),
  name: v => v.trim(),
  search: v => v.replace(REGEX_PATTERNS.searchFilter, '').replace(REGEX_PATTERNS.searchInvalid, '').replace(REGEX_PATTERNS.whitespace, ' ').slice(0, 50),
  path: v => {
    let path = v.trim();
    if (!path.startsWith('/')) path = '/' + path;
    // 연속된 슬래시는 하나로 줄이되, 중간에 여러 경로가 있을 수 있도록 허용
    return path.replace(REGEX_PATTERNS.pathSlashes, '/').replace(/\/$/, '') || '/';
  },
  icon: v => v.trim(),
  description: v => v.trim().slice(0, 500)
};



const validateField = (field: Field, value: string): boolean => {
  switch (field) {
    case 'id':
      return validator.isLength(value, { min: 6, max: 20 }) && validator.isAlphanumeric(value, 'en-US');
    case 'password':
      return validator.isLength(value, { min: 8, max: 32 }) && REGEX_PATTERNS.password.test(value);
    case 'email':
      return validator.isEmail(value);
    case 'phone':
      return validator.isMobilePhone(value, 'ko-KR');
    case 'name':
      return validator.isLength(value, { min: 2, max: 50 }) && REGEX_PATTERNS.name.test(value);
    case 'search':
      return validator.isLength(value, { min: 2, max: 50 }) && REGEX_PATTERNS.search.test(value);
    case 'path':
      return validator.isLength(value, { min: 1, max: 200 }) && 
             REGEX_PATTERNS.path.test(value) && 
             !value.includes('//') &&
             (value === '/' || !value.endsWith('/'));
    case 'icon':
      return validator.isLength(value, { min: 1, max: 50 }) && 
             REGEX_PATTERNS.icon.test(value);
    case 'description':
      return validator.isLength(value, { min: 0, max: 500 });
    default:
      return true;
  }
};

export const filterField = (field: Field, value: string): string =>
  INPUT_FILTER[field]?.(value) ?? value;

export const inputValue = (
  field: Field,
  value: string,
  t: TranslateFn,
  compareValue?: string,
): string | null => {
  if (!value.trim()) return null;

  if (field === 'confirmPassword') {
    return compareValue !== undefined && value !== compareValue ? t(field) : null;
  }

  const filteredValue = INPUT_FILTER[field](value);
  return validateField(field, filteredValue) ? null : t(field);
};