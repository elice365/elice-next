/**
 * Auth form action buttons and feedback component
 * Extracted from AuthForm to improve separation of concerns
 */
import React from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { SocialButtons } from "@/components/features/auth/SocialButtons";

interface AuthFormActionsProps {
  title: string;
  loading: boolean;
  success: string | null;
  error: string | null;
  onSubmit: (e: React.FormEvent) => void;
  showSocialLogin?: boolean;
}

export const AuthFormActions: React.FC<AuthFormActionsProps> = ({
  title,
  loading,
  success,
  error,
  onSubmit,
  showSocialLogin = true
}) => {
  const buttons = useTranslations("button");

  const getButtonContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center space-x-2">
          <div className="w-4 h-4 border border-[var(--border-color)] rounded-full animate-spin" />
          <span>{buttons(title)}...</span>
        </div>
      );
    }
    if (success) {
      return buttons("completed") || "완료";
    }
    return buttons(title);
  };

  return (
    <>
      {/* Submit Button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <button
          type="submit"
          className="w-full bg-gradient-to-r bg-button text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading || !!success}
          onClick={onSubmit}
        >
          {getButtonContent()}
        </button>
      </motion.div>

      {/* Feedback Messages */}
      <AnimatePresence mode="wait">
        {(success || error) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            {success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700 text-sm text-center font-medium">
                  {success}
                </p>
              </div>
            )}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm text-center font-medium">
                  {error}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Social Login */}
      {showSocialLogin && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="space-y-4"
        >
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">OR</span>
            </div>
          </div>
          
          <SocialButtons />
        </motion.div>
      )}
    </>
  );
};