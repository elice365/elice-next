'use client';

import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { Icon } from '@/components/ui/Icon';
import { useAppSelector } from '@/stores/hook';
import { motion, AnimatePresence } from 'framer-motion';
import { logger } from '@/lib/services/logger';
import { CommentItem } from './CommentItem';

interface CommentSectionProps {
  postId: string;
  className?: string;
}

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

// Helper functions to reduce nesting complexity
function updateRepliesLikes(replies: Comment[] | undefined, commentId: string): Comment[] | undefined {
  if (!replies) return replies;
  return replies.map(reply => {
    if (reply.id === commentId) {
      return {
        ...reply,
        likes: reply.isLiked ? reply.likes - 1 : reply.likes + 1,
        isLiked: !reply.isLiked
      };
    }
    return reply;
  });
}

function addReplyToComment(comments: Comment[], commentId: string, reply: Comment): Comment[] {
  return comments.map(c => {
    if (c.id === commentId) {
      return { ...c, replies: [...(c.replies || []), reply] };
    }
    return c;
  });
}

export const Comment = memo(function Comment({
  postId,
  className = ''
}: CommentSectionProps) {
  const user = useAppSelector((state) => state.auth.user);
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  
  const newCommentRef = useRef<HTMLTextAreaElement>(null);
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);
  
  // 답글 폼이 열릴 때 자동 포커스
  useEffect(() => {
    if (replyingTo && replyTextareaRef.current) {
      const timer = setTimeout(() => {
        replyTextareaRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [replyingTo]);
  
  const handleReplyToggle = useCallback((commentId: string) => {
    if (replyingTo === commentId) {
      setReplyingTo(null);
      setReplyContent('');
    } else {
      setReplyingTo(commentId);
      setReplyContent('');
    }
  }, [replyingTo]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest');

  const handleSubmitComment = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Submit comment to API
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment.trim(),
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit comment');
      }
      
      const comment: Comment = await response.json();
      setComments(prev => [comment, ...prev]);
      setNewComment('');
    } catch (error) {
      logger.error('Failed to submit comment', 'COMMENT', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [newComment, user, isSubmitting]);


  const handleLikeComment = useCallback((commentId: string, isReply: boolean = false, parentId?: string) => {
    if (!user) return;
    
    setComments(prev => {
      const updatedComments = prev.map(comment => {
        if (!isReply && comment.id === commentId) {
          const newLikes = comment.isLiked ? comment.likes - 1 : comment.likes + 1;
          return {
            ...comment,
            likes: newLikes,
            isLiked: !comment.isLiked
          };
        }
        if (isReply && parentId && comment.id === parentId) {
          return {
            ...comment,
            replies: updateRepliesLikes(comment.replies, commentId)
          };
        }
        return comment;
      });
      return updatedComments;
    });
  }, [user]);

  const formatDate = useCallback((date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return '방금 전';
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}일 전`;
    
    return date.toLocaleDateString('ko-KR');
  }, []);

  const handleSubmitReply = useCallback(async (commentId: string, content: string) => {
    if (!user || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const reply: Comment = {
        id: Date.now().toString(),
        author: user.name || user.email,
        content: content,
        createdAt: new Date(),
        likes: 0,
        isLiked: false
      };

      setComments(prev => addReplyToComment(prev, commentId, reply));
      setReplyingTo(null);
    } catch (error) {
      logger.error('Failed to submit reply', 'COMMENT', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [user, isSubmitting, setComments, setReplyingTo]);

  return (
    <div className={`${className}`}>
      {/* Enhanced Header - border 없이 자연스럽게 */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[var(--blog-accent)]/10 border border-[var(--blog-accent)]/20" style={{ borderRadius: 'var(--blog-radius-md)' }}>
              <Icon name="MessageCircle" size={24} className="text-[var(--blog-accent)]" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-[var(--blog-text-primary)]">
                댓글 {comments.length > 0 && `${comments.length}개`}
              </h3>
            </div>
          </div>
          
          {/* Sort Options */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSortBy('latest')}
              className={`px-3 py-2 text-xs sm:text-sm font-medium transition-all duration-300 ${
                sortBy === 'latest' 
                  ? 'bg-gradient-to-r from-[var(--blog-accent)] to-[var(--blog-secondary)] text-white border border-[var(--blog-accent)]' 
                  : 'text-[var(--blog-text-secondary)] border border-[var(--blog-border)] hover:bg-[var(--blog-surface-hover)] hover:border-[var(--blog-accent)]/30'
              }`}
              style={{ borderRadius: 'var(--blog-radius-sm)', boxShadow: sortBy === 'latest' ? 'var(--blog-shadow-sm)' : 'none' }}
            >
              최신순
            </button>
            <button
              onClick={() => setSortBy('popular')}
              className={`px-3 py-2 text-xs sm:text-sm font-medium transition-all duration-300 ${
                sortBy === 'popular' 
                  ? 'bg-gradient-to-r from-[var(--blog-accent)] to-[var(--blog-secondary)] text-white border border-[var(--blog-accent)]' 
                  : 'text-[var(--blog-text-secondary)] border border-[var(--blog-border)] hover:bg-[var(--blog-surface-hover)] hover:border-[var(--blog-accent)]/30'
              }`}
              style={{ borderRadius: 'var(--blog-radius-sm)', boxShadow: sortBy === 'popular' ? 'var(--blog-shadow-sm)' : 'none' }}
            >
              인기순
            </button>
          </div>
        </div>
      </div>

      <div>
        {/* Enhanced Comment Form */}
        {user ? (
          <form onSubmit={handleSubmitComment} className="mb-6">
            <div className="bg-[var(--blog-surface)] border border-[var(--blog-border)] p-4 transition-all duration-200" style={{ borderRadius: 'var(--blog-radius-lg)', boxShadow: 'var(--blog-shadow-md)' }}>
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[var(--blog-accent)] to-[var(--blog-secondary)] flex items-center justify-center" style={{ borderRadius: 'var(--blog-radius-md)', boxShadow: 'var(--blog-shadow-md)' }}>
                    <Icon name="User" size={20} className="text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <textarea
                    ref={newCommentRef}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="댓글을 입력하세요..."
                    className="w-full px-4 py-3 bg-[var(--blog-surface)] border border-[var(--blog-border)] text-[var(--blog-text-primary)] placeholder-[var(--blog-text-secondary)]/60 focus:ring-2 focus:ring-[var(--blog-accent)] focus:border-[var(--blog-accent)] resize-none transition-all duration-200"
                    style={{ borderRadius: 'var(--blog-radius-md)', minHeight: '96px' }}
                    rows={4}
                  />
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm text-[var(--blog-text-secondary)] opacity-80">
                        <Icon name="User" size={14} className="inline mr-1" />
                        {user.name || user.email}
                      </span>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={!newComment.trim() || isSubmitting}
                      className="px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base font-medium bg-gradient-to-r from-[var(--blog-accent)] to-[var(--blog-secondary)] text-white hover:from-[var(--blog-accent-hover)] hover:to-[var(--blog-accent)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                      style={{ borderRadius: 'var(--blog-radius-md)', boxShadow: 'var(--blog-shadow-md)' }}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <Icon name="Loader" size={16} />
                          </motion.div>
                          작성 중...
                        </span>
                      ) : (
                        '댓글 작성'
                      )}
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-6 bg-gradient-to-br from-[var(--blog-surface)]/50 to-[var(--blog-surface)]/20 border border-[var(--blog-border)] text-center"
            style={{ borderRadius: 'var(--blog-radius-lg)', boxShadow: 'var(--blog-shadow-md)' }}
          >
            <Icon name="Lock" size={40} className="text-[var(--blog-text-secondary)] opacity-50 mx-auto mb-3" />
            <p className="text-[var(--blog-text-primary)] mb-4">
              댓글을 작성하려면 로그인이 필요합니다.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
              <motion.a
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                href="/login"
                className="w-full sm:w-auto px-6 py-3 text-sm font-medium bg-[var(--blog-surface)] border border-[var(--blog-border)] text-[var(--blog-text-primary)] hover:bg-[var(--blog-surface-hover)] hover:border-[var(--blog-accent)]/30 transition-all duration-300 text-center"
                style={{ borderRadius: 'var(--blog-radius-md)' }}
              >
                로그인
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                href="/register"
                className="w-full sm:w-auto px-6 py-3 text-sm font-medium bg-gradient-to-r from-[var(--blog-accent)] to-[var(--blog-secondary)] text-white hover:from-[var(--blog-accent-hover)] hover:to-[var(--blog-accent)] transition-all duration-300 text-center"
                style={{ borderRadius: 'var(--blog-radius-md)', boxShadow: 'var(--blog-shadow-md)' }}
              >
                회원가입
              </motion.a>
            </div>
          </motion.div>
        )}

        {/* Comments List */}
        {comments.length > 0 ? (
          <div className="space-y-6">
            {comments.map((comment) => (
              <CommentItem 
                key={comment.id} 
                comment={comment}
                user={user}
                isSubmitting={isSubmitting}
                replyingTo={replyingTo}
                formatDate={formatDate}
                onLikeComment={handleLikeComment}
                onReplyToggle={handleReplyToggle}
                onSubmitReply={handleSubmitReply}
                setIsSubmitting={setIsSubmitting}
                setReplyingTo={setReplyingTo}
              />
            ))}
            
            {/* Load More Button */}
            {comments.length >= 5 && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 text-sm font-medium text-[var(--blog-accent)] bg-[var(--blog-surface)] border border-[var(--blog-border)] hover:bg-[var(--blog-surface-hover)] hover:border-[var(--blog-accent)]/30 transition-all duration-300"
                style={{ borderRadius: 'var(--blog-radius-md)', boxShadow: 'var(--blog-shadow-sm)' }}
              >
                더 많은 댓글 보기
              </motion.button>
            )}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center" style={{ borderRadius: 'var(--blog-radius-lg)' }}>
              <Icon name="MessageCircle" size={40} className="text-[var(--blog-accent)] opacity-40" />
            </div>
            <p className="text-[var(--blog-text-primary)] opacity-70 text-base">
              아직 댓글이 없습니다
            </p>
            <p className="text-[var(--blog-text-secondary)] opacity-60 text-sm mt-1">
              첫 번째 댓글을 작성해보세요!
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
});

Comment.displayName = 'Comment';