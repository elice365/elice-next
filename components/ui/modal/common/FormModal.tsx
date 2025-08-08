"use client";

import { useState, useEffect } from "react";

import { BaseModal } from "./BaseModal";
import { FormField } from "../../form/FormField";
import { Icon } from "@/components/ui/Icon";

import { api } from "@/lib/fetch";
import { APIResult } from "@/types/api";
import { logger } from '@/lib/services/logger';
import { BaseModalProps, FormField as FormFieldType, ValidationRules, FormErrors } from "@/types/admin";

interface FormModalProps extends BaseModalProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly icon?: string;
  readonly iconColor?: string;
  readonly endpoint: string;
  readonly method?: 'POST' | 'PATCH';
  readonly fields: FormFieldType[];
  readonly initialData?: Record<string, any>;
  readonly validationRules?: ValidationRules;
  readonly size?: 'sm' | 'md' | 'lg' | 'xl';
  readonly submitLabel?: string;
  readonly onSuccess?: (data: any) => void;
}

export function FormModal({
  isOpen,
  onClose,
  onUpdate,
  title,
  subtitle,
  icon = "Plus",
  iconColor = "text-blue-600",
  endpoint,
  method = 'POST',
  fields,
  initialData = {},
  validationRules = {},
  size = 'md',
  submitLabel,
  onSuccess
}: FormModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // 초기 폼 데이터 생성
  const createInitialFormData = () => {
    const initialFormData: Record<string, any> = {};
    fields.forEach(field => {
      if (field.type === 'role-select' || field.type === 'checkbox') {
        initialFormData[field.name] = initialData[field.name] || [];
      } else {
        initialFormData[field.name] = initialData[field.name] || '';
      }
    });
    return initialFormData;
  };

  // 폼 초기화
  useEffect(() => {
    if (isOpen) {
      setFormData(createInitialFormData());
      setErrors({});
    }
  }, [isOpen, fields, initialData]);

  // 입력 값 변경 처리
  const handleFieldChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // 에러 클리어
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // 단일 필드 유효성 검사
  const validateField = (field: FormFieldType, value: any, rules: any[]) => {
    for (const rule of rules) {
      const error = getValidationError(field, value, rule);
      if (error) return error;
    }
    return null;
  };

  // 개별 유효성 검사 함수들
  const validateRequired = (field: FormFieldType, value: any, rule: any) => {
    const isEmpty = !value || 
      (typeof value === 'string' && !value.trim()) || 
      (Array.isArray(value) && value.length === 0);
    
    return isEmpty ? (rule.message || `${field.label}은(는) 필수입니다.`) : null;
  };

  const validateMinLength = (field: FormFieldType, value: any, rule: any) => {
    if (!value || typeof value !== 'string') return null;
    
    return value.trim().length < rule.value ? 
      (rule.message || `${field.label}은(는) 최소 ${rule.value}자 이상이어야 합니다.`) : null;
  };

  const validateMaxLength = (field: FormFieldType, value: any, rule: any) => {
    if (!value || typeof value !== 'string') return null;
    
    return value.trim().length > rule.value ? 
      (rule.message || `${field.label}은(는) 최대 ${rule.value}자까지 가능합니다.`) : null;
  };

  const validatePattern = (field: FormFieldType, value: any, rule: any) => {
    if (!value || typeof value !== 'string') return null;
    
    return !new RegExp(rule.value).test(value) ? 
      (rule.message || `${field.label} 형식이 올바르지 않습니다.`) : null;
  };

  const validateCustom = (_field: FormFieldType, value: any, rule: any) => {
    return rule.value && typeof rule.value === 'function' ? rule.value(value) : null;
  };

  const getValidationError = (field: FormFieldType, value: any, rule: any) => {
    const validators = {
      required: validateRequired,
      min: validateMinLength,
      max: validateMaxLength,
      pattern: validatePattern,
      custom: validateCustom
    };

    const validator = validators[rule.type as keyof typeof validators];
    return validator ? validator(field, value, rule) : null;
  };

  // 폼 유효성 검사
  const validateForm = () => {
    const newErrors: FormErrors = {};

    fields.forEach(field => {
      const value = formData[field.name];
      const rules = validationRules[field.name] || field.validation;

      if (rules) {
        const error = validateField(field, value, rules);
        if (error) {
          newErrors[field.name] = error;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 제출 데이터 준비
  const prepareSubmitData = () => {
    const submitData: Record<string, any> = {};
    fields.forEach(field => {
      let value = formData[field.name];
      
      // 문자열 필드는 trim 처리
      if (typeof value === 'string') {
        value = value.trim();
        if (value === '') {
          value = field.required ? value : null;
        }
      }
      
      submitData[field.name] = value;
    });
    return submitData;
  };

  // API 에러 처리
  const handleApiError = (data: APIResult) => {
    if (data.message === 'DuplicateField' && data.data?.field) {
      setErrors({ [data.data.field]: data.data.message || '중복된 값입니다.' });
    } else if (data.message === 'InvalidField' && data.data?.field) {
      setErrors({ [data.data.field]: data.data.message || '잘못된 값입니다.' });
    } else {
      setErrors({ general: data.message || '처리 중 오류가 발생했습니다.' });
    }
  };

  // API 호출 처리
  const submitFormData = async (submitData: Record<string, any>) => {
    const apiMethod = (api as any)[method.toLowerCase()];
    const { data } = await apiMethod(endpoint, submitData) as { data: APIResult };
    return data;
  };

  // 성공 처리
  const handleSuccess = (data: any) => {
    onSuccess?.(data.data);
    onUpdate?.();
    onClose();
  };

  // 에러 처리
  const handleError = (error: any) => {
    logger.error('[FormModal] Form submission failed', 'UI', error);
    setErrors({ general: '네트워크 오류가 발생했습니다.' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const submitData = prepareSubmitData();
      const data = await submitFormData(submitData);

      if (data.success) {
        handleSuccess(data);
      } else {
        handleApiError(data);
      }
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        {errors.general && (
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <Icon name="AlertCircle" size={16} />
            <span>{errors.general}</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition-colors disabled:opacity-50"
        >
          취소
        </button>
        <button
          type="submit"
          form="form-modal"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              처리 중...
            </>
          ) : (
            <>
              <Icon name={method === 'POST' ? "Plus" : "Save"} size={16} />
              {submitLabel || (method === 'POST' ? '생성' : '수정')}
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      icon={icon}
      iconColor={iconColor}
      size={size}
      footer={footer}
      loading={loading}
    >
      <form id="form-modal" onSubmit={handleSubmit} className="p-6 space-y-6">
        {fields.map(field => (
          <FormField
            key={field.name}
            field={field}
            value={formData[field.name]}
            onChange={handleFieldChange}
            error={errors[field.name]}
            disabled={loading}
          />
        ))}
      </form>
    </BaseModal>
  );
}