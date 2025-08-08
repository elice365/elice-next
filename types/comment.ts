// Comment System Type Definitions

export interface Comment {
  id: string;
  userId: string;
  postId: string;
  parentId: string | null;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
  user: {
    id: string;
    name?: string | null;
    imageUrl?: string | null;
  };
  replies?: Comment[];
  likeCount?: number;
  isLiked?: boolean;
}

export interface CommentSectionProps {
  postId: string;
  className?: string;
}

export interface CommentItemProps {
  comment: Comment;
  onReply?: (commentId: string, content: string) => void;
  onLike?: (commentId: string) => void;
  currentUserId?: string;
}