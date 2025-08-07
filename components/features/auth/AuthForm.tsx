"use client";
import React, { memo } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { AuthFormProps } from "@/types/auth";
import { useAuthError, useFormErrorDisplay } from "@/hooks/auth";
import { useAuthFormState } from "@/hooks/auth/useAuthFormState";
import { useAuthFormValidation } from "@/hooks/auth/useAuthFormValidation";
import { useAuthFormSubmission } from "@/hooks/auth/useAuthFormSubmission";
import { AuthFormFields } from "./AuthFormFields";
import { AuthFormActions } from "./AuthFormActions";

export const AuthForm: React.FC<AuthFormProps> = memo(
  ({
    title,
    fields,
    onSubmit,
    successRedirect,
    validate,
    showSocialLogin = true,
  }) => {
    const titles = useTranslations("titles");
    
    // Use extracted custom hooks for state management
    const {
      formData,
      loading,
      success,
      setLoading,
      setSuccess,
      handleChange,
      clearState,
    } = useAuthFormState({ fields });

    const { validateForm } = useAuthFormValidation({ fields, validate });
    
    const { createSubmissionHandler } = useAuthFormSubmission({
      title,
      successRedirect,
      onSuccess: clearState,
    });

    // Use optimized auth hooks
    const { setError } = useAuthError();
    const displayError = useFormErrorDisplay();

    // Create optimized submit handler
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      const validationError = validateForm(formData);
      if (validationError) {
        setError(validationError);
        return;
      }

      const submitHandler = createSubmissionHandler(
        onSubmit,
        formData,
        setLoading,
        setSuccess
      );
      
      await submitHandler();
    };

    const containerVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.6,
          ease: [0.25, 0.46, 0.45, 0.94] as const,
          staggerChildren: 0.1,
        },
      },
    };

    return (
      <div className="flex items-center justify-center max-w-sm p-2 w-full">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full"
        >
          <div className="border border-[var(--border-color)] p-6 space-y-4 rounded-xl min-h-[540px] flex flex-col gap-2 bg-auth">
            {/* Form Header */}
            <div className="text-center">
              <h1 className="text-2xl font-bold bg-clip-text text-title">
                {titles(title)}
              </h1>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="space-y-4 flex-1">
              <AuthFormFields
                fields={fields}
                formData={formData}
                onChange={handleChange}
                disabled={loading || !!success}
              />
              
              <AuthFormActions
                title={title}
                loading={loading}
                success={success}
                error={displayError}
                onSubmit={handleSubmit}
                showSocialLogin={showSocialLogin}
              />
            </form>
          </div>
        </motion.div>
      </div>
    );
  }
);

AuthForm.displayName = "AuthForm";
