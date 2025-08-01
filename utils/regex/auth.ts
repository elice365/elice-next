import { getTranslations } from 'next-intl/server';
import { filterField, inputValue, type Field } from './input';

export interface AuthValidationResult {
  isValid: boolean;
  errors: {
    email?: string;
    password?: string;
  };
}


export async function authRegex(
  email: string, 
  password: string
): Promise<AuthValidationResult> {
  const t = await getTranslations("messages");
  
  const filteredEmail = filterField('email', email);
  const filteredPassword = filterField('password', password);
  
  const emailError = inputValue('email', filteredEmail, t);
  const passwordError = inputValue('password', filteredPassword, t);
  
  return {
    isValid: !emailError && !passwordError,
    errors: {
      ...(emailError && { email: emailError }),
      ...(passwordError && { password: passwordError })
    }
  };
}


export async function serverRegex(
  field: Field,
  value: string
): Promise<{ isValid: boolean; error?: string }> {
  const t = await getTranslations("messages");
  const filteredValue = filterField(field, value);
  const error = inputValue(field, filteredValue, t);
  
  return {
    isValid: !error,
    ...(error && { error })
  };
}


export async function serverMutiRegex(
  fields: Record<Field, string>
): Promise<{
  isValid: boolean;
  errors: Partial<Record<Field, string>>;
}> {
  const t = await getTranslations("messages");
  const errors: Partial<Record<Field, string>> = {};
  
  for (const [field, value] of Object.entries(fields) as [Field, string][]) {
    const filteredValue = filterField(field, value);
    const error = inputValue(field, filteredValue, t);
    if (error) {
      errors[field] = error;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}