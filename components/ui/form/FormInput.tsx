import { ErrorMessage } from '../ErrorMessage';
import type { FormInputProps } from '@/types/ui/form';


export function FormInput({
  id,
  label,
  name,
  value,
  onChange,
  error,
  required = false,
  type = 'text',
  placeholder,
  disabled = false,
  className = '',
  autoComplete
}: FormInputProps) {
  const inputId = id || `input-${name}`;

  return (
    <div className={`space-y-2 ${className}`}>
      <label 
        htmlFor={inputId} 
        className="block text-sm font-medium text-[var(--text-color)]"
      >
        {label} {required && '*'}
      </label>
      
      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
        className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--input-bg)] text-[var(--text-color)] focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
      />
      
      <ErrorMessage error={error} size="sm" />
    </div>
  );
}

export default FormInput;