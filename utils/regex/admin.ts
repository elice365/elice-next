import { filterField, inputValue, type Field } from './input';

export interface AdminValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// 역할(Role) 검증
export function validateRole(
  name: string,
  t: any,
  description?: string
): AdminValidationResult {
  const errors: Record<string, string> = {};
  
  // 이름 검증
  const filteredName = filterField('name', name);
  const nameError = inputValue('name', filteredName, t);
  if (nameError) errors.name = nameError;
  
  // 설명 검증 (선택사항)
  if (description) {
    const filteredDescription = filterField('description', description);
    const descError = inputValue('description', filteredDescription, t);
    if (descError) errors.description = descError;
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// 라우터(Router) 검증
export function validateRouter(
  name: string,
  path: string,
  icon: string,
  role: string[],
  t: any
): AdminValidationResult {
  const errors: Record<string, string> = {};
  
  // 이름 검증
  const filteredName = filterField('name', name);
  const nameError = inputValue('name', filteredName, t);
  if (nameError) errors.name = nameError;
  
  // 경로 검증
  const filteredPath = filterField('path', path);
  const pathError = inputValue('path', filteredPath, t);
  if (pathError) errors.path = pathError;
  
  // 아이콘 검증
  const filteredIcon = filterField('icon', icon);
  const iconError = inputValue('icon', filteredIcon, t);
  if (iconError) errors.icon = iconError;
  
  // 역할 검증 (기본적인 배열 검증만 수행, 실제 역할 존재 여부는 서버에서 확인)
  if (!role || !Array.isArray(role) || role.length === 0) {
    errors.role = '최소 하나의 역할을 선택해야 합니다.';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// 단일 admin 필드 서버사이드 검증
export function validateAdminField(
  field: Field,
  value: string,
  t: any,
  options?: {
    required?: boolean;
    arrayValue?: string[];
  }
): { isValid: boolean; error?: string } {
  const { required = false, arrayValue } = options || {};
  
  // 배열 값 처리 (역할 등)
  if (arrayValue) {
    if (required && arrayValue.length === 0) {
      return { isValid: false, error: '최소 하나 이상 선택해야 합니다.' };
    }
    return { isValid: true };
  }
  
  // 빈 값 처리
  if (!value?.trim()) {
    if (required) {
      return { isValid: false, error: `${field}은(는) 필수입니다.` };
    }
    return { isValid: true };
  }
  
  const filteredValue = filterField(field, value);
  const error = inputValue(field, filteredValue, t);
  
  return {
    isValid: !error,
    ...(error && { error })
  };
}

// 다중 admin 필드 서버사이드 검증
export function validateAdminFields(
  fields: Record<string, string | string[]>,
  t: any,
  rules?: Record<string, { required?: boolean }>
): AdminValidationResult {
  const errors: Record<string, string> = {};
  
  for (const [fieldName, value] of Object.entries(fields)) {
    const fieldRules = rules?.[fieldName] || {};
    
    // 배열 값 처리
    if (Array.isArray(value)) {
      if (fieldRules.required && value.length === 0) {
        errors[fieldName] = '최소 하나 이상 선택해야 합니다.';
      }
      continue;
    }
    
    // 문자열 값 처리
    if (fieldRules.required && !value?.trim()) {
      errors[fieldName] = `${fieldName}은(는) 필수입니다.`;
      continue;
    }
    
    if (value?.trim()) {
      const filteredValue = filterField(fieldName as Field, value);
      const error = inputValue(fieldName as Field, filteredValue, t);
      if (error) {
        errors[fieldName] = error;
      }
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// 패스워드 확인 검증 (기존 auth.ts 패턴 활용)
export function validatePasswordConfirm(
  password: string,
  confirmPassword: string,
  t: any
): AdminValidationResult {
  const errors: Record<string, string> = {};
  
  const filteredPassword = filterField('password', password);
  const filteredConfirmPassword = filterField('confirmPassword', confirmPassword);
  
  const passwordError = inputValue('password', filteredPassword, t);
  const confirmError = inputValue('confirmPassword', filteredConfirmPassword, t, filteredPassword);
  
  if (passwordError) errors.password = passwordError;
  if (confirmError) errors.confirmPassword = confirmError;
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// 사용자 생성/수정 검증
export function validateUser(
  name: string,
  email: string,
  t: any,
  password?: string,
  confirmPassword?: string
): AdminValidationResult {
  const errors: Record<string, string> = {};
  
  // 이름 검증
  const filteredName = filterField('name', name);
  const nameError = inputValue('name', filteredName, t);
  if (nameError) errors.name = nameError;
  
  // 이메일 검증
  const filteredEmail = filterField('email', email);
  const emailError = inputValue('email', filteredEmail, t);
  if (emailError) errors.email = emailError;
  
  // 패스워드 검증 (생성 시에만)
  if (password !== undefined) {
    const passwordValidation = validatePasswordConfirm(password, confirmPassword || '', t);
    Object.assign(errors, passwordValidation.errors);
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// Category validation patterns
export const categoryValidation = {
  code: /^[a-zA-Z0-9_]+$/,
  slug: /^[a-z0-9가-힣-]+$/
};

// Category validation function
export function validateCategory(
  code: string,
  name: string,
  slug: string,
  t: any,
  parentId?: string | null
): AdminValidationResult {
  const errors: Record<string, string> = {};
  
  // Code validation
  if (!code?.trim()) {
    errors.code = 'Category code is required';
  } else if (!categoryValidation.code.test(code)) {
    errors.code = 'Category code can only contain letters, numbers, and underscores';
  }
  
  // Name validation
  const filteredName = filterField('name', name);
  const nameError = inputValue('name', filteredName, t);
  if (nameError) errors.name = nameError;
  
  // Slug validation
  if (!slug?.trim()) {
    errors.slug = 'Slug is required';
  } else if (!categoryValidation.slug.test(slug)) {
    errors.slug = 'Slug can only contain lowercase letters, numbers, Korean characters, and hyphens';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
