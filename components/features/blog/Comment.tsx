'use client';

import { memo, useState, useCallback } from 'react';
import { Icon } from '@/components/ui/Icon';
// Note: Using custom buttons since project Button has specific interface
import { useAppSelector } from '@/stores/hook';
import { motion, AnimatePresence } from 'framer-motion';

interface CommentSectionProps {
  postId: string;
  className?: string;
}

interface Comment {
  id: string;
  author: string;
  content: string;
  createdAt: Date;
  likes: number;
  replies?: Comment[];
}

export const Comment = memo(function Comment({
  postId,
  className = ''
}: CommentSectionProps) {
  const { mobile } = useAppSelector((state) => state.device);
  const user = useAppSelector((state) => state.auth.user);
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitComment = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // TODO: Implement actual comment submission API
      const comment: Comment = {
        id: Date.now().toString(),
        author: user.name || user.email,
        content: newComment.trim(),
        createdAt: new Date(),
        likes: 0,
        replies: []
      };

      setComments(prev => [comment, ...prev]);
      setNewComment('');
    } catch (error) {
      // Failed to submit comment
    } finally {
      setIsSubmitting(false);
    }
  }, [newComment, user, isSubmitting]);

  const handleSubmitReply = useCallback(async (commentId: string) => {
    if (!replyContent.trim() || !user || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // TODO: Implement actual reply submission API
      const reply: Comment = {
        id: Date.now().toString(),
        author: user.name || user.email,
        content: replyContent.trim(),
        createdAt: new Date(),
        likes: 0
      };

      setComments(prev => prev.map(comment => 
        comment.id === commentId 
          ? { ...comment, replies: [...(comment.replies || []), reply] }
          : comment
      ));
      
      setReplyContent('');
      setReplyingTo(null);
    } catch (error) {
      // Failed to submit reply
    } finally {
      setIsSubmitting(false);
    }
  }, [replyContent, user, isSubmitting]);

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

  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${isReply ? 'ml-8 pl-4 border-l-2 border-gray-200 dark:border-gray-700' : ''}`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
          <Icon name="User" size={16} className="text-primary" />
        </div>

        {/* Comment Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900 dark:text-white text-sm">
              {comment.author}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatDate(comment.createdAt)}
            </span>
          </div>
          
          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-2">
            {comment.content}
          </p>

          {/* Comment Actions */}
          <div className="flex items-center gap-4 text-xs">
            <button className="flex items-center gap-1 text-gray-500 hover:text-primary transition-colors">
              <Icon name="Heart" size={14} />
              <span>{comment.likes > 0 ? comment.likes : '좋아요'}</span>
            </button>
            
            {!isReply && user && (
              <button
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                className="text-gray-500 hover:text-primary transition-colors"
              >
                답글
              </button>
            )}
          </div>

          {/* Reply Form */}
          <AnimatePresence>
            {replyingTo === comment.id && user && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmitReply(comment.id);
                }}
                className="mt-3 space-y-2"
              >
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="답글을 입력하세요..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  rows={2}
                />
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={!replyContent.trim() || isSubmitting}
                    className="px-3 py-1 text-xs font-medium bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? '답글 작성 중...' : '답글 작성'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyContent('');
                    }}
                    className="px-3 py-1 text-xs font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    취소
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-4">
              {comment.replies.map((reply) => (
                <CommentItem key={reply.id} comment={reply} isReply />
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-${mobile ? '4' : '6'} ${className}`}>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
        댓글 {comments.length > 0 && `(${comments.length})`}
      </h3>

      {/* Comment Form */}
      {user ? (
        <form onSubmit={handleSubmitComment} className="mb-8">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Icon name="User" size={20} className="text-primary" />
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="댓글을 입력하세요..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                rows={3}
              />
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {user.name || user.email}로 댓글 작성
                </span>
                <button
                  type="submit"
                  disabled={!newComment.trim() || isSubmitting}
                  className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? '댓글 작성 중...' : '댓글 작성'}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-3">
            댓글을 작성하려면 로그인이 필요합니다.
          </p>
          <div className="flex items-center justify-center gap-3">
            <a
              href="/login"
              className="px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              로그인
            </a>
            <a
              href="/register"
              className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              회원가입
            </a>
          </div>
        </div>
      )}

      {/* Comments List */}
      {comments.length > 0 ? (
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Icon name="MessageCircle" size={48} className="text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!
          </p>
        </div>
      )}
    </div>
  );
});

Comment.displayName = 'Comment';