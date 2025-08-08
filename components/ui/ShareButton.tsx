'use client';

import { memo, useCallback } from 'react';
import { Icon } from '@/components/ui/Icon';
import { motion } from 'framer-motion';

interface ShareButtonProps {
  url: string;
  title: string;
  description?: string;
  horizontal?: boolean;
  onClose?: () => void;
  className?: string;
}

export const ShareButton = memo(function ShareButton({
  url,
  title,
  description,
  horizontal = false,
  onClose,
  className = ''
}: ShareButtonProps) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const shareButtons = [
    {
      name: 'Facebook',
      icon: 'Facebook',
      color: 'bg-blue-600 hover:bg-blue-700',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&t=${encodedTitle}`,
    },
    {
      name: 'Twitter',
      icon: 'Twitter',
      color: 'bg-sky-500 hover:bg-sky-600',
      url: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    },
    {
      name: 'LinkedIn',
      icon: 'Linkedin',
      color: 'bg-blue-700 hover:bg-blue-800',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
  ];

  const handleShare = useCallback((shareUrl: string, platform: string) => {
    if (platform === 'KakaoTalk' && window.Kakao) {
      // Use Kakao SDK if available
      window.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: title,
          description: description,
          imageUrl: `${process.env.NEXT_PUBLIC_URLNEXT_PUBLIC_URL}/images/logo.jpg`,
          link: {
            mobileWebUrl: url,
            webUrl: url,
          },
        },
        buttons: [
          {
            title: '웹으로 보기',
            link: {
              mobileWebUrl: url,
              webUrl: url,
            },
          },
        ],
      });
    } else {
      // Open share window
      const width = 600;
      const height = 400;
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;
      
      window.open(
        shareUrl,
        'share',
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
      );
    }
    
    onClose?.();
  }, [url, title, description, onClose]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      // You could add a toast notification here
      alert('링크가 클립보드에 복사되었습니다!');
    } catch (err) {
      console.error('Failed to copy link:', err);
      // Fallback for older browsers that don't support Clipboard API
      try {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        textArea.style.pointerEvents = 'none';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        textArea.setSelectionRange(0, textArea.value.length);
        
        // Use the newer Clipboard API write method as fallback
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(url);
        } else {
          // Last resort: throw error if no clipboard support
          throw new Error('Clipboard API not supported');
        }
        
        document.body.removeChild(textArea);
        alert('링크가 클립보드에 복사되었습니다!');
      } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError);
        alert('클립보드 복사를 지원하지 않는 브라우저입니다. URL을 수동으로 복사해주세요: ' + url);
      }
    }
    onClose?.();
  }, [url, onClose]);

  return (
    <motion.div 
      className={`${
        horizontal 
          ? 'flex items-center justify-center gap-3' 
          : 'flex flex-col space-y-2'
      } ${className}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      {!horizontal && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 min-w-[200px]">
          <div className="space-y-2">
            {shareButtons.map((button) => (
              <button
                key={button.name}
                onClick={() => handleShare(button.url, button.name)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-white font-medium transition-all duration-200 ${button.color}`}
              >
                <Icon name={button.icon as any} size={18} />
                <span>{button.name}</span>
              </button>
            ))}
            
            {/* Copy Link Button */}
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 font-medium transition-all duration-200"
            >
              <Icon name="Copy" size={18} />
              <span>링크 복사</span>
            </button>
          </div>
        </div>
      )}

      {horizontal && (
        <>
          {shareButtons.map((button) => (
            <motion.button
              key={button.name}
              onClick={() => handleShare(button.url, button.name)}
              className={`flex items-center justify-center w-10 h-10 rounded-full text-white transition-all duration-200 ${button.color}`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              title={`${button.name}으로 공유`}
            >
              <Icon name={button.icon as any} size={18} />
            </motion.button>
          ))}
          
          {/* Copy Link Button */}
          <motion.button
            onClick={handleCopyLink}
            className="flex items-center justify-center w-10 h-10 rounded-full text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            title="링크 복사"
          >
            <Icon name="Copy" size={18} />
          </motion.button>
        </>
      )}
    </motion.div>
  );
});

ShareButton.displayName = 'ShareButton';