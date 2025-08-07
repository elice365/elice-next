"use client";
import React, { useState, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { SocialButtons } from "@/components/features/auth/SocialButtons";
import { Field, inputValue } from "@/utils/regex/input";
import { AuthFormProps } from "@/types/auth";
import { useAuthError, useFormErrorDisplay } from "@/hooks/auth";
import { extractErrorMessage } from "@/lib/auth/utils";

export const AuthForm: React.FC<AuthFormProps> = memo(
  ({
    title,
    fields,
    onSubmit,
    successRedirect,
    validate,
    showSocialLogin = true,
  }) => {
    const router = useRouter();
    const messages = useTranslations("messages");
    const titles = useTranslations("titles");
    const buttons = useTranslations("button");
    const texts = useTranslations("text");

    const [formData, setFormData] = useState<Record<string, string>>(
      Object.fromEntries(fields.map((field) => [field.name, ""]))
    );
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);

    // Use optimized auth hooks
    const { setError } = useAuthError();
    const displayError = useFormErrorDisplay();

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Clear errors and success when user starts typing
        if (displayError) setError(null);
        if (success) setSuccess(null);
      },
      [displayError, success, setError]
    );

    const validateForm = useCallback(() => {
      // Check empty fields
      for (const field of fields) {
        if (!formData[field.name]?.trim()) {
          return messages("allFieldsRequired") || "All fields are required.";
        }
      }

      // Custom validation
      const validationError = validate?.(formData);
      if (validationError) return validationError;

      // Field-specific validation
      for (const field of fields) {
        const fieldName = field.name as Field;
        const value = formData[fieldName];
        const compareValue = field.compareValue ? formData[field.compareValue] : undefined;
        const fieldError = inputValue(fieldName, value, messages, compareValue);
        if (fieldError) return fieldError;
      }
      return null;
    }, [formData, fields, validate, messages]);

    // Helper function to extract button content logic
    const getButtonContent = (loading: boolean, success: string | null, buttons: any, title: string) => {
      if (loading) {
        return (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 border border-[var(--border-color)]  rounded-full animate-spin"></div>
            <span>{buttons(title)}...</span>
          </div>
        );
      }
      if (success) {
        return buttons("completed") || "완료";
      }
      return buttons(title);
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setSuccess(null);
      setLoading(true);

      const validationError = validateForm();
      if (validationError) {
        setError(validationError);
        setLoading(false);
        return;
      }

      try {
        await onSubmit(formData);

        // Handle success messages and redirects based on auth type
        const successMessage = messages(`${title}Success`);
        setSuccess(successMessage);

        // Configure redirect delay based on auth type
        let redirectDelay = 0;
        if (title === "register") {
          redirectDelay = 3000;
        } else if (title === "login") {
          redirectDelay = 1000;
        }

        if (successRedirect) {
          setTimeout(() => {
            router.push(successRedirect);
          }, redirectDelay);
        }
      } catch (error: unknown) {
        // Use shared error extraction utility
        const errorMessage = extractErrorMessage(error) || messages("UnknownError") || "Unknown error occurred.";
        setError(errorMessage);

      } finally {
        setLoading(false);
      }
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
          <div className="border border-[var(--border-color)]  p-6 space-y-1 rounded-xl min-h-[540px] flex flex-col gap-2 bg-auth">
            <div className="text-center">
              <h1 className="text-2xl font-bold  bg-clip-text text-title">
                {titles(title)}
              </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-1">
              <AnimatePresence>
                {fields.map((field, index) => (
                  <motion.div
                    key={field.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Input
                      id={field.name}
                      name={field.name as Field}
                      type={field.type}
                      className="w-full px-4 py-3 bg-background border border-[var(--border-color)]  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      value={formData[field.name]}
                      onChange={handleChange}
                      autoComplete={field.autoComplete || "on"}
                      compareValue={
                        field.compareValue ? formData[field.compareValue] : ""
                      }
                      OnChange={field.onChange || false}
                      aria-describedby={displayError ? "form-error" : undefined}
                      required
                    />
                  </motion.div>
                ))}
              </AnimatePresence>

              <AnimatePresence>
                {displayError && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3"
                  >
                    <p
                      id="form-error"
                      role="alert"
                      className="text-sm text-red-600 dark:text-red-400 text-center"
                    >
                      {displayError}
                    </p>
                  </motion.div>
                )}

                {success && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3"
                  >
                    <output
                      id="form-success"
                      className="text-sm text-green-600 dark:text-green-400 text-center whitespace-pre-line"
                    >
                      {success}
                    </output>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                type="submit"
                name={title}
                disabled={loading || !!success}
                className={`bg-button w-full p-3 text-[var(--button-text)] font-medium rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl touch-manipulation`}
              >
                {getButtonContent(loading, success, buttons, title)}
              </Button>
            </form>
            <div className="text-center">
              {showSocialLogin && (
                <div className="my-1">
                  <SocialButtons />
                </div>
              )}
              {title === "login" ? (
                <p className="text-sm text-[var(--text-color)]">
                  {texts("signUp")}{" "}
                  <button
                    type="button"
                    onClick={() => router.push("/register")}
                    className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors"
                  >
                    {buttons("singUp")}
                  </button>
                </p>
              ) : (
                <p className="text-sm text-[var(--text-color)]">
                  {texts("signIn")}{" "}
                  <button
                    type="button"
                    onClick={() => router.push("/login")}
                    className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors"
                  >
                    {buttons("signIn")}
                  </button>
                </p>
              )}
            </div>
          </div>

          <div className="mt-1 text-center space-y-1">
            <p className="text-xs text-slate-500 dark:text-slate-400">{texts("agreement")}{" "}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              <button
                type="button"
                onClick={() => window.open('/terms', '_blank')}
                className="underline hover:text-slate-700 dark:hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Terms of Service
              </button>{" "}
              and{" "}
              <button
                type="button"
                onClick={() => window.open('/privacy', '_blank')}
                className="underline hover:text-slate-700 dark:hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Privacy Policy
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    );
  }
);

AuthForm.displayName = "AuthForm";
