import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { api } from '@/lib/fetch';
import { create } from '@/stores/asyncThunk';
import { APIResult } from '@/types/api';
import { 
  Post, 
  Category, 
  Tag, 
  Notice,
  PostListRequest, 
  PostDetailRequest, 
  NoticeListRequest,
  PostListResponse, 
  PostDetailResponse,
  NoticeListResponse,
  LikeRequest,
  LikeResponse,
  PaginationInfo 
} from '@/types/blog/post';
import type { BlogFilters, BlogSliceState } from '@/types/blog/core';

// Layout types
export type BlogLayout = 'card' | 'list';

// Blog state type definition (alias for consistency)
export interface BlogState extends BlogSliceState {}

// Initial state
const initialState: BlogState = {
  // Post list state
  posts: [],
  categories: [],
  tags: [],
  notices: [],
  
  // Current selections
  currentPost: null,
  selectedCategory: null,
  selectedTag: null,
  
  // Pagination
  currentPage: 1,
  totalPages: 1,
  totalCount: 0,
  hasNextPage: false,
  hasPrevPage: false,
  
  // Filters and search
  filters: {
    sortBy: 'latest'
  },
  
  // Layout and view options
  layout: 'card',
  isViewToggled: false,
  
  // Loading states
  isLoading: false,
  isPostLoading: false,
  isPostsLoading: false,
  isCategoriesLoading: false,
  isTagsLoading: false,
  isNoticesLoading: false,
  isLiking: false,
  
  // Error states
  error: null,
  postError: null,
};

// Async thunks
// Fetch blog posts
export const fetchBlogPosts = create(
  'blog/fetchPosts',
  async (params: Omit<PostListRequest, 'type'>, { rejectWithValue }) => {
    const { data } = await api.post<APIResult<PostListResponse>, PostListRequest>('/api/post', {
      type: 'list',
      ...params,
    });
    
    if (!data?.success || !data.data) {
      return rejectWithValue(data?.message || 'Failed to fetch blog posts');
    }
    
    return data.data;
  }
);

// Fetch single blog post
export const fetchBlogPost = create(
  'blog/fetchPost',
  async (params: Omit<PostDetailRequest, 'type'>, { rejectWithValue }) => {
    const { data } = await api.post<APIResult<PostDetailResponse>, PostDetailRequest>('/api/post', {
      type: 'post',
      ...params,
    });
    
    if (!data?.success || !data.data) {
      return rejectWithValue(data?.message || 'Failed to fetch blog post');
    }
    
    return data.data;
  }
);

// Fetch notices
export const fetchNotices = create(
  'blog/fetchNotices',
  async (params: Omit<NoticeListRequest, 'type'>, { rejectWithValue }) => {
    const { data } = await api.post<APIResult<NoticeListResponse>, NoticeListRequest>('/api/post', {
      type: 'notice',
      ...params,
    });
    
    if (!data?.success || !data.data) {
      return rejectWithValue(data?.message || 'Failed to fetch notices');
    }
    
    return data.data;
  }
);

// Fetch categories
export const fetchCategories = create(
  'blog/fetchCategories',
  async (_, { rejectWithValue }) => {
    const { data } = await api.get<APIResult<{ categories: Category[] }>>('/api/post?type=categories');
    
    if (!data?.success || !data.data) {
      return rejectWithValue(data?.message || 'Failed to fetch categories');
    }
    
    return data.data.categories;
  }
);

// Fetch tags
export const fetchTags = create(
  'blog/fetchTags',
  async (_, { rejectWithValue }) => {
    const { data } = await api.get<APIResult<{ tags: Tag[] }>>('/api/post?type=tags');
    
    if (!data?.success || !data.data) {
      return rejectWithValue(data?.message || 'Failed to fetch tags');
    }
    
    return data.data.tags;
  }
);

// Like/unlike a post
export const togglePostLike = create(
  'blog/toggleLike',
  async (params: LikeRequest, { rejectWithValue }) => {
    const { data } = await api.post<APIResult<LikeResponse>, LikeRequest>('/api/post/like', params);
    
    if (!data?.success || !data.data) {
      return rejectWithValue(data?.message || 'Failed to toggle like');
    }
    
    return {
      postId: params.postId,
      ...data.data
    };
  }
);

// Blog slice
const blogSlice = createSlice({
  name: 'blog',
  initialState,
  reducers: {
    // Layout actions
    setLayout: (state, action: PayloadAction<BlogLayout>) => {
      state.layout = action.payload;
    },
    
    // Filter actions
    setFilters: (state, action: PayloadAction<Partial<BlogFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
      state.currentPage = 1; // Reset to first page when filters change
    },
    
    clearFilters: (state) => {
      state.filters = { sortBy: 'latest' };
      state.currentPage = 1;
    },
    
    // Pagination actions
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
    
    // Error actions
    clearListError: (state) => {
      state.error = null;
    },
    
    clearPostError: (state) => {
      state.postError = null;
    },
    
    clearNoticesError: (state) => {
      state.error = null;
    },
    
    // Clear selected post
    clearSelectedPost: (state) => {
      state.currentPost = null;
      state.postError = null;
    },
    
    // Update post in list (useful for like updates)
    updatePostInList: (state, action: PayloadAction<{ uid: string; updates: Partial<Post> }>) => {
      const { uid, updates } = action.payload;
      const postIndex = state.posts.findIndex(post => post.uid === uid);
      if (postIndex !== -1) {
        state.posts[postIndex] = { ...state.posts[postIndex], ...updates };
      }
      // Also update selected post if it matches
      if (state.currentPost?.uid === uid) {
        state.currentPost = { ...state.currentPost, ...updates };
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch posts
    builder
      .addCase(fetchBlogPosts.pending, (state) => {
        state.isPostsLoading = true;
        state.error = null;
      })
      .addCase(fetchBlogPosts.fulfilled, (state, action) => {
        state.isPostsLoading = false;
        const payload = action.payload;
        if (payload && typeof payload === 'object' && 'posts' in payload && 'pagination' in payload) {
          state.posts = payload.posts as Post[];
          const pagination = payload.pagination as PaginationInfo;
          state.currentPage = pagination.currentPage;
          state.totalPages = pagination.totalPages;
          state.totalCount = pagination.totalCount;
          state.hasNextPage = pagination.hasNext;
          state.hasPrevPage = pagination.hasPrev;
        }
      })
      .addCase(fetchBlogPosts.rejected, (state, action) => {
        state.isPostsLoading = false;
        state.error = action.payload as string || 'Failed to fetch posts';
      });
    
    // Fetch single post
    builder
      .addCase(fetchBlogPost.pending, (state) => {
        state.isPostLoading = true;
        state.postError = null;
      })
      .addCase(fetchBlogPost.fulfilled, (state, action) => {
        state.isPostLoading = false;
        const payload = action.payload;
        if (payload && typeof payload === 'object') {
          if ('post' in payload) {
            state.currentPost = payload.post as Post;
          }
        }
      })
      .addCase(fetchBlogPost.rejected, (state, action) => {
        state.isPostLoading = false;
        state.postError = action.payload as string || 'Failed to fetch post';
      });
    
    // Fetch notices
    builder
      .addCase(fetchNotices.pending, (state) => {
        state.isNoticesLoading = true;
        state.error = null;
      })
      .addCase(fetchNotices.fulfilled, (state, action) => {
        state.isNoticesLoading = false;
        const payload = action.payload;
        if (payload && typeof payload === 'object') {
          if ('notices' in payload) {
            state.notices = payload.notices as Notice[];
          }
        }
      })
      .addCase(fetchNotices.rejected, (state, action) => {
        state.isNoticesLoading = false;
        state.error = action.payload as string || 'Failed to fetch notices';
      });
    
    // Fetch categories
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.isCategoriesLoading = true;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.isCategoriesLoading = false;
        if (Array.isArray(action.payload)) {
          state.categories = action.payload as any; // Transform from Category to BlogCategory
        }
      })
      .addCase(fetchCategories.rejected, (state) => {
        state.isCategoriesLoading = false;
      });
    
    // Fetch tags
    builder
      .addCase(fetchTags.pending, (state) => {
        state.isTagsLoading = true;
      })
      .addCase(fetchTags.fulfilled, (state, action) => {
        state.isTagsLoading = false;
        if (Array.isArray(action.payload)) {
          state.tags = action.payload as any; // Transform from Tag to BlogTag
        }
      })
      .addCase(fetchTags.rejected, (state) => {
        state.isTagsLoading = false;
      });
    
    // Toggle like
    builder
      .addCase(togglePostLike.pending, (state) => {
        state.isLiking = true;
      })
      .addCase(togglePostLike.fulfilled, (state, action) => {
        state.isLiking = false;
        const payload = action.payload;
        
        if (payload && typeof payload === 'object' && 'postId' in payload && 'liked' in payload && 'likeCount' in payload) {
          const { postId, liked, likeCount } = payload as { postId: string; liked: boolean; likeCount: number };
          
          // Update the post in the list
          const postIndex = state.posts.findIndex(p => p.uid === postId);
          if (postIndex !== -1) {
            state.posts[postIndex].isLiked = liked;
            state.posts[postIndex].likeCount = likeCount;
          }
          
          // Update the selected post if it's the same
          if (state.currentPost && state.currentPost.uid === postId) {
            state.currentPost.isLiked = liked;
            state.currentPost.likeCount = likeCount;
          }
        }
      })
      .addCase(togglePostLike.rejected, (state) => {
        state.isLiking = false;
      });
  },
});

// Export actions
export const {
  setLayout,
  setFilters,
  clearFilters,
  setCurrentPage,
  clearListError,
  clearPostError,
  clearNoticesError,
  clearSelectedPost,
  updatePostInList,
} = blogSlice.actions;

// Base selectors
export const selectBlogPosts = (state: { blog: BlogState }) => state.blog.posts;
export const selectCurrentPost = (state: { blog: BlogState }) => state.blog.currentPost;
export const selectNotices = (state: { blog: BlogState }) => state.blog.notices;
export const selectBlogLayout = (state: { blog: BlogState }) => state.blog.layout;
export const selectBlogFilters = (state: { blog: BlogState }) => state.blog.filters;
export const selectCurrentPage = (state: { blog: BlogState }) => state.blog.currentPage;
export const selectTotalPages = (state: { blog: BlogState }) => state.blog.totalPages;
export const selectTotalCount = (state: { blog: BlogState }) => state.blog.totalCount;
export const selectHasNextPage = (state: { blog: BlogState }) => state.blog.hasNextPage;
export const selectHasPrevPage = (state: { blog: BlogState }) => state.blog.hasPrevPage;
export const selectIsLoading = (state: { blog: BlogState }) => state.blog.isLoading;
export const selectIsPostsLoading = (state: { blog: BlogState }) => state.blog.isPostsLoading;
export const selectIsPostLoading = (state: { blog: BlogState }) => state.blog.isPostLoading;
export const selectIsNoticesLoading = (state: { blog: BlogState }) => state.blog.isNoticesLoading;
export const selectIsCategoriesLoading = (state: { blog: BlogState }) => state.blog.isCategoriesLoading;
export const selectIsTagsLoading = (state: { blog: BlogState }) => state.blog.isTagsLoading;
export const selectIsLiking = (state: { blog: BlogState }) => state.blog.isLiking;
export const selectError = (state: { blog: BlogState }) => state.blog.error;
export const selectPostError = (state: { blog: BlogState }) => state.blog.postError;
export const selectCategories = (state: { blog: BlogState }) => state.blog.categories;
export const selectTags = (state: { blog: BlogState }) => state.blog.tags;

// Memoized selectors
export const selectFilteredPosts = createSelector(
  [selectBlogPosts, selectBlogFilters],
  (posts, filters) => {
    let filtered = [...posts];
    
    if (filters.category) {
      filtered = filtered.filter(post => post.category?.slug === filters.category);
    }
    
    if (filters.tag) {
      filtered = filtered.filter(post => 
        post.tags.some(tag => tag.name === filters.tag)
      );
    }
    
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(searchTerm) ||
        post.description.toLowerCase().includes(searchTerm)
      );
    }
    
    return filtered;
  }
);

export const selectPostsByCategory = createSelector(
  [selectBlogPosts, (_: any, categorySlug: string) => categorySlug],
  (posts, categorySlug) => posts.filter(post => post.category?.slug === categorySlug)
);

export const selectPostsByTag = createSelector(
  [selectBlogPosts, (_: any, tagName: string) => tagName],
  (posts, tagName) => posts.filter(post => 
    post.tags.some(tag => tag.name === tagName)
  )
);

export const selectPostById = createSelector(
  [selectBlogPosts, (_: any, uid: string) => uid],
  (posts, uid) => posts.find(post => post.uid === uid)
);

export const selectCategoryBySlug = createSelector(
  [selectCategories, (_: any, slug: string) => slug],
  (categories, slug) => categories.find(category => category.slug === slug)
);

export const selectTagByName = createSelector(
  [selectTags, (_: any, name: string) => name],
  (tags, name) => tags.find(tag => tag.name === name)
);

export const selectHasMorePosts = createSelector(
  [selectHasNextPage],
  (hasNext) => hasNext
);

export const selectHasMoreNotices = createSelector(
  [selectHasNextPage],
  (hasNext) => hasNext
);

export const selectUnreadNoticesCount = createSelector(
  [selectNotices],
  (notices) => notices.filter(notice => !notice.isRead).length
);

export default blogSlice.reducer;