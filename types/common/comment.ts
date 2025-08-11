// Comment System Type Definitions

export interface Comment {
  id: string;
  author: string;
  avatar?: string;
  content: string;
  createdAt: Date;
  likes: number;
  isLiked?: boolean;
  replies?: Comment[];
  userId?: string;
  postId?: string;
  parentId?: string | null;
  updatedAt?: Date;
  user?: {
    id: string;
    name?: string | null;
    imageUrl?: string | null;
  };
  likeCount?: number;
}

export interface CommentSectionProps {
  postId: string;
  className?: string;
}

export interface CommentItemProps {
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
  onReply?: (commentId: string, content: string) => void;
  onLike?: (commentId: string) => void;
  currentUserId?: string;
}