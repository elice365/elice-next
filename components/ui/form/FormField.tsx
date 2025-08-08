"use client";

import { Icon } from "@/components/ui/Icon";
import { FormField as FormFieldType } from "@/types/admin";

interface FormFieldProps {
  readonly field: FormFieldType;
  readonly value: any;
  readonly onChange: (name: string, value: any) => void;
  readonly error?: string;
  readonly disabled?: boolean;
}

export function FormField({ field, value, onChange, error, disabled = false }: FormFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    let newValue: string | boolean;
    if ('type' in e.target && e.target.type === 'checkbox') {
      newValue = (e.target as HTMLInputElement).checked;
    } else {
      newValue = e.target.value;
    }
    onChange(field.name, newValue);
  };

  const handleMultiSelectChange = (optionValue: string, checked: boolean) => {
    const currentValues = Array.isArray(value) ? value : [];
    const newValues = checked
      ? [...currentValues, optionValue]
      : currentValues.filter(v => v !== optionValue);
    onChange(field.name, newValues);
  };

  const renderField = () => {
    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            id={field.name}
            name={field.name}
            value={value || ''}
            onChange={handleChange}
            placeholder={field.placeholder}
            disabled={disabled}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${error
              ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
              : 'border-[var(--border-color)] bg-white dark:bg-gray-700'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
        );

      case 'textarea':
        return (
          <textarea
            id={field.name}
            name={field.name}
            value={value || ''}
            onChange={handleChange}
            placeholder={field.placeholder}
            disabled={disabled}
            rows={4}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 resize-none ${error
              ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
              : 'border-[var(--border-color)] bg-white dark:bg-gray-700'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
        );

      case 'select':
        return (
          <select
            id={field.name}
            name={field.name}
            value={value || ''}
            onChange={handleChange}
            disabled={disabled}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${error
              ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
              : 'border-[var(--border-color)] bg-white dark:bg-gray-700'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <option value="">{field.placeholder || `${field.label} 선택`}</option>
            {field.options?.map((option: any) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id={field.name}
              name={field.name}
              checked={value || false}
              onChange={handleChange}
              disabled={disabled}
              className="mt-1 h-4 w-4 rounded border-[var(--border-color)] text-blue-600 focus:ring-blue-500 disabled:opacity-50"
            />
            <label htmlFor={field.name} className="text-sm text-[var(--text-color)]">
              {field.label}
            </label>
          </div>
        );

      case 'role-select':
        return (
          <div className="space-y-3">
            {field.options?.map((option: any) => {
              const isSelected = Array.isArray(value) ? value.includes(option.value) : false;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={isSelected}
                  aria-disabled={disabled}
                  aria-label={`${option.label} ${isSelected ? '선택됨' : '선택되지 않음'}`}
                  className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-left ${isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-[var(--border-color)] hover:border-[var(--border-color)]'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => !disabled && handleMultiSelectChange(option.value, !isSelected)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[var(--text-color)]">
                          {option.label}
                        </span>
                        {isSelected && (
                          <Icon name="Check" size={16} className="text-blue-600" />
                        )}
                      </div>
                      {option.description && (
                        <p className="text-sm text-[var(--text-color)] mt-1">
                          {option.description}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-2">
      {field.type !== 'checkbox' && (
        <label htmlFor={field.name} className="block text-sm font-medium text-[var(--text-color)]">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {renderField()}

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <Icon name="AlertCircle" size={16} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}