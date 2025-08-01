import { useState, useCallback } from 'react';
import { api } from '@/lib/fetch';
import { 
  PostListRequest, 
  PostDetailRequest, 
  NoticeListRequest,
  PostListResponse,
  PostDetailResponse,
  NoticeListResponse,
  LikeRequest,
  LikeResponse,
  Category,
  Tag
} from '@/types/post';

export const usePost = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch post list
  const fetchPostList = useCallback(async (params: Omit<PostListRequest, 'type'>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post<PostListResponse>('/api/post', {
        type: 'list',
        ...params,
      });
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch posts');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch post detail
  const fetchPostDetail = useCallback(async (params: Omit<PostDetailRequest, 'type'>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post<PostDetailResponse>('/api/post', {
        type: 'post',
        ...params,
      });
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch post detail');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch notice list
  const fetchNoticeList = useCallback(async (params?: Omit<NoticeListRequest, 'type'>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post<NoticeListResponse>('/api/post', {
        type: 'notice',
        ...params,
      });
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch notices');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Like/unlike post
  const toggleLike = useCallback(async (postId: string, action: 'like' | 'unlike') => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post<LikeResponse>('/api/post/like', {
        postId,
        action,
      });
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Failed to update like status');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Check like status
  const checkLikeStatus = useCallback(async (postId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<{ liked: boolean; likeCount: number }>(`/api/post/like?postId=${postId}`);
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Failed to check like status');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<{ categories: Category[] }>('/api/post?type=categories');
      return response.data.categories;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch categories');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch tags
  const fetchTags = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<{ tags: Tag[] }>('/api/post?type=tags');
      return response.data.tags;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch tags');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    fetchPostList,
    fetchPostDetail,
    fetchNoticeList,
    toggleLike,
    checkLikeStatus,
    fetchCategories,
    fetchTags,
  };
};

// Hook for managing post likes with optimistic updates
export const usePostLike = (initialLiked: boolean = false, initialCount: number = 0) => {
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const toggleLike = useCallback(async (postId: string) => {
    // Optimistic update
    const newLiked = !liked;
    const newCount = newLiked ? likeCount + 1 : likeCount - 1;
    
    setLiked(newLiked);
    setLikeCount(Math.max(0, newCount));
    setLoading(true);

    try {
      const response = await api.post<LikeResponse>('/api/post/like', {
        postId,
        action: newLiked ? 'like' : 'unlike',
      });

      // Update with server response
      setLiked(response.data.liked);
      setLikeCount(response.data.likeCount);
    } catch (error) {
      // Revert on error
      setLiked(!newLiked);
      setLikeCount(likeCount);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [liked, likeCount]);

  return {
    liked,
    likeCount,
    loading,
    toggleLike,
  };
};