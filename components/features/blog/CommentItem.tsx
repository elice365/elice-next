'use client';

import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { Icon } from '@/components/ui/Icon';
import { motion, AnimatePresence } from 'framer-motion';
import { logger } from '@/lib/services/logger';

interface Comment {
  id: string;
  author: string;
  avatar?: string;
  content: string;
  createdAt: Date;
  likes: number;
  isLiked?: boolean;
  replies?: Comment[];
}

interface CommentItemProps {
  comment: Comment;
  isReply?: boolean;
  parentId?: string;
  user: any;
  isSubmitting: boolean;
  replyingTo: string | null;
  formatDate: (date: Date) => string;
  onLikeComment: (commentId: string, isReply?: boolean, parentId?: string) => void;
  onReplyToggle: (commentId: string) => void;
  onSubmitReply: (commentId: string, content: string) => Promise<void>;
  setIsSubmitting: (value: boolean) => void;
  setReplyingTo: (value: string | null) => void;
}

export const CommentItem = memo(function CommentItem({
  comment,
  isReply = false,
  parentId,
  user,
  isSubmitting,
  replyingTo,
  formatDate,
  onLikeComment,
  onReplyToggle,
  onSubmitReply,
  setIsSubmitting,
  setReplyingTo
}: CommentItemProps) {
  const itemReplyTextareaRef = useRef<HTMLTextAreaElement>(null);
  
  // 로컬 답글 상태를 각 CommentItem에서 관리
  const [localReplyContent, setLocalReplyContent] = useState('');
  const isReplying = replyingTo === comment.id;
  
  // 답글 폼이 열릴 때 포커스
  useEffect(() => {
    if (isReplying && itemReplyTextareaRef.current) {
      const timer = setTimeout(() => {
        itemReplyTextareaRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isReplying]);
  
  // 답글 제출 시 로컬 상태도 초기화
  const handleLocalSubmitReply = useCallback(async () => {
    if (!localReplyContent.trim() || !user || isSubmitting) return;
    
    try {
      await onSubmitReply(comment.id, localReplyContent.trim());
      setLocalReplyContent('');
    } catch (error) {
      logger.error('Failed to submit reply', 'COMMENT', error);
    }
  }, [localReplyContent, user, isSubmitting, comment.id, onSubmitReply]);
  
  return (
    <div className={`${isReply ? 'ml-12 sm:ml-16' : ''} group`}>
      <div className="flex gap-3 sm:gap-4">
        {/* Enhanced Avatar */}
        <div className="flex-shrink-0">
          <div className={`${isReply ? 'w-8 h-8 sm:w-10 sm:h-10' : 'w-10 h-10 sm:w-12 sm:h-12'} bg-gradient-to-br from-[var(--blog-accent)] to-[var(--blog-secondary)] rounded-full flex items-center justify-center transition-all duration-300`} style={{ boxShadow: 'var(--blog-shadow-md)' }}>
            <Icon name="User" size={isReply ? 16 : 20} className="text-white" />
          </div>
        </div>

        {/* Enhanced Comment Content */}
        <div className="flex-1 min-w-0">
          {/* Author Info Bar */}
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-[var(--blog-text-primary)] text-sm sm:text-base">
              {comment.author}
            </span>
            {!isReply && (
              <span className="px-2 py-0.5 bg-[var(--blog-accent)]/10 text-[var(--blog-accent)] text-xs font-medium" style={{ borderRadius: 'var(--blog-radius-sm)' }}>
                작성자
              </span>
            )}
            <span className="text-xs sm:text-sm text-[var(--blog-text-secondary)] opacity-80 ml-auto">
              {formatDate(comment.createdAt)}
            </span>
          </div>
          
          {/* Comment Text */}
          <div className="p-4 bg-[var(--blog-surface)] border border-[var(--blog-border)] mb-3" style={{ borderRadius: 'var(--blog-radius-md)', boxShadow: 'var(--blog-shadow-sm)' }}>
            <p className="text-[var(--blog-text-primary)] text-sm sm:text-base leading-relaxed">
              {comment.content}
            </p>
          </div>

          {/* Enhanced Action Bar */}
          <div className="flex items-center gap-2 sm:gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onLikeComment(comment.id, isReply, parentId)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium transition-all duration-300 ${
                comment.isLiked 
                  ? 'bg-gradient-to-r from-red-50 to-red-100 text-red-600 border border-red-200 dark:from-red-900/20 dark:to-red-800/20 dark:text-red-400 dark:border-red-700/30' 
                  : 'bg-[var(--blog-surface)] text-[var(--blog-text-primary)] border border-[var(--blog-border)] hover:bg-[var(--blog-surface-hover)] hover:border-[var(--blog-accent)]/30'
              }`}
              style={{ borderRadius: 'var(--blog-radius-sm)', boxShadow: comment.isLiked ? 'none' : 'var(--blog-shadow-sm)' }}
            >
              <Icon 
                name="Heart" 
                size={14} 
                className={comment.isLiked ? 'fill-current' : ''}
              />
              <span>{comment.likes > 0 ? comment.likes : '좋아요'}</span>
            </motion.button>
            
            {!isReply && user && (
              <button
                onClick={() => onReplyToggle(comment.id)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium bg-[var(--blog-surface)] text-[var(--blog-text-primary)] border border-[var(--blog-border)] hover:bg-[var(--blog-surface-hover)] hover:border-[var(--blog-accent)]/30 transition-all duration-200"
                style={{ borderRadius: 'var(--blog-radius-sm)', boxShadow: 'var(--blog-shadow-sm)' }}
              >
                <Icon name="MessageCircle" size={14} />
                <span>답글</span>
              </button>
            )}

            {user && comment.author === (user.name || user.email) && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium bg-[var(--blog-surface)] text-[var(--blog-text-secondary)] border border-[var(--blog-border)] hover:bg-red-50 hover:text-red-500 hover:border-red-300 dark:hover:bg-red-900/20 dark:hover:text-red-400 dark:hover:border-red-700/30 transition-all duration-300 ml-auto"
                style={{ borderRadius: 'var(--blog-radius-sm)', boxShadow: 'var(--blog-shadow-sm)' }}
              >
                <Icon name="Trash2" size={14} />
                <span>삭제</span>
              </motion.button>
            )}
          </div>

          {/* Enhanced Reply Form */}
          <AnimatePresence mode="wait">
            {isReplying && user && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="mt-4 overflow-hidden"
                layout
              >
                <div className="bg-[var(--blog-surface)]/50 border border-[var(--blog-border)] p-4" style={{ borderRadius: 'var(--blog-radius-lg)', boxShadow: 'var(--blog-shadow-md)' }}>
                  <textarea
                    ref={itemReplyTextareaRef}
                    value={localReplyContent}
                    onChange={(e) => setLocalReplyContent(e.target.value)}
                    placeholder="답글을 입력하세요..."
                    className="w-full px-4 py-3 text-sm sm:text-base bg-[var(--blog-surface)] border border-[var(--blog-border)] text-[var(--blog-text-primary)] placeholder-[var(--blog-text-secondary)]/60 focus:ring-2 focus:ring-[var(--blog-accent)] focus:border-[var(--blog-accent)] resize-none transition-all duration-200"
                    style={{ borderRadius: 'var(--blog-radius-md)' }}
                    rows={3}
                  />
                  <div className="flex items-center gap-2 mt-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={handleLocalSubmitReply}
                      disabled={!localReplyContent.trim() || isSubmitting}
                      className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-[var(--blog-accent)] to-[var(--blog-secondary)] text-white hover:from-[var(--blog-accent-hover)] hover:to-[var(--blog-accent)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                      style={{ borderRadius: 'var(--blog-radius-sm)', boxShadow: 'var(--blog-shadow-sm)' }}
                    >
                      {isSubmitting ? '답글 작성 중...' : '답글 작성'}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => {
                        setReplyingTo(null);
                        setLocalReplyContent('');
                      }}
                      className="px-4 py-2 text-sm font-medium border border-[var(--blog-border)] text-[var(--blog-text-secondary)] hover:bg-[var(--blog-surface-hover)] hover:border-[var(--blog-accent)]/30 transition-all duration-300"
                      style={{ borderRadius: 'var(--blog-radius-sm)' }}
                    >
                      취소
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Nested Replies with Enhanced Design */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-4 pl-4 border-l-2 border-[var(--blog-border)] bg-[var(--blog-surface)]/20" style={{ borderRadius: '0 var(--blog-radius-md) var(--blog-radius-md) 0' }}>
              {comment.replies.map((reply) => (
                <CommentItem 
                  key={reply.id} 
                  comment={reply} 
                  isReply 
                  parentId={comment.id}
                  user={user}
                  isSubmitting={isSubmitting}
                  replyingTo={replyingTo}
                  formatDate={formatDate}
                  onLikeComment={onLikeComment}
                  onReplyToggle={onReplyToggle}
                  onSubmitReply={onSubmitReply}
                  setIsSubmitting={setIsSubmitting}
                  setReplyingTo={setReplyingTo}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

CommentItem.displayName = 'CommentItem';