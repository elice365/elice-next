import React, { memo } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { authConfig } from '@/constants/auth/client';
import { Translated } from '@/components/i18n/Translated';
import { useSocialLogin } from '@/hooks/useSocialLogin';

export const SocialButtons: React.FC = memo(() => {
  const { handleSocialLogin, loadingProvider } = useSocialLogin();

  const buttonVariants = {
    hover: {
      scale: 1.05,
      y: -2,
      transition: { type: "spring" as const, stiffness: 400, damping: 10 }
    },
    tap: { scale: 0.95 }
  };

  return (
    <div className="space-y-2">
      {/* 구분선 */}
      <div className="flex items-center mb-3">
        <div className="flex-1 border-t border-[var(--border-color)] "></div>
        <span className="px-4 text-xs font-medium text">
          {Translated("label", "sns")}
        </span>
        <div className="flex-1 border-t border-[var(--border-color)] "></div>
      </div>

      {/* 소셜 로그인 버튼들 */}
      <div className="flex flex-wrap justify-center gap-4">
        {authConfig.socialImages.map((provider) => {
          const providerName = provider.name.toLowerCase();
          const isLoading = loadingProvider === providerName;

          return (
            <motion.button
              key={provider.name}
              variants={buttonVariants}
              whileHover={!isLoading ? "hover" : undefined}
              whileTap={!isLoading ? "tap" : undefined}
              className="w-12 h-12 group relative border border-[var(--border-color)]  rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
              aria-label={`Sign in with ${provider.name}`}
              onClick={() => handleSocialLogin(providerName)}
              disabled={!!loadingProvider}
            >
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-[var(--background)]/80 rounded-xl">
                  <div className="w-4 h-4 border-2 border-[var(--border-color)]  border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}

              <Image
                src={provider.src}
                alt={provider.name}
                width={64}
                height={64}
                className={`object-contain transition-transform duration-200 rounded-xl ${!isLoading ? 'group-hover:scale-110' : ''
                  }`}
              />
            </motion.button>
          );
        })}
      </div>

      <p className="text-xs text-center text-[var(--text-color)] mt-3">
        {Translated("text", "social")}
      </p>
    </div>
  );
});

SocialButtons.displayName = 'SocialButtons';