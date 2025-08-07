/**
 * Auth form field rendering component
 * Extracted from AuthForm to improve maintainability
 */
import React from 'react';
import { motion } from "framer-motion";
import { Input } from "@/components/ui/Input";
import { AuthFormField } from '@/types/auth';
import { Field } from '@/utils/regex/input';

interface AuthFormFieldsProps {
  fields: AuthFormField[];
  formData: Record<string, string>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

const fieldVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { 
      duration: 0.3, 
      ease: [0.25, 0.46, 0.45, 0.94] as const
    }
  }
};

export const AuthFormFields: React.FC<AuthFormFieldsProps> = ({
  fields,
  formData,
  onChange,
  disabled = false
}) => {
  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <motion.div
          key={field.name}
          variants={fieldVariants}
          className="space-y-1"
        >
          <Input
            id={field.name}
            type={field.type}
            name={field.name as Field}
            className="w-full px-4 py-3 bg-background border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            value={formData[field.name] || ''}
            onChange={onChange}
            disabled={disabled}
            required
            autoComplete={field.autoComplete || getAutoCompleteValue(field.name)}
            compareValue={field.compareValue ? formData[field.compareValue] : ""}
            OnChange={field.onChange || false}
          />
        </motion.div>
      ))}
    </div>
  );
};

/**
 * Maps field names to appropriate autocomplete values
 */
function getAutoCompleteValue(fieldName: string): 'on' | 'off' {
  // For this custom Input component, only 'on' or 'off' are supported
  // Most fields should use 'on' to enable browser autocomplete
  return fieldName === 'confirmPassword' ? 'off' : 'on';
}