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
} from '@/types/post';

// Layout types
export type BlogLayout = 'card' | 'list';

// Filter state type
interface BlogFilters {
  category?: string;
  tag?: string;
  search?: string;
  sortBy?: 'latest' | 'popular' | 'views';
}

// Blog state type definition
export interface BlogState {
  // Post list state
  posts: Post[];
  selectedPost: Post | null;
  postContent: PostDetailResponse['content'] | null;
  postsPagination: PaginationInfo | null;
  
  // Notice state
  notices: Notice[];
  noticesPagination: PaginationInfo | null;
  
  // UI state
  layout: BlogLayout;
  
  // Filter state
  filters: BlogFilters;
  
  // Pagination state
  currentPage: number;
  
  // Loading states
  isLoadingList: boolean;
  isLoadingPost: boolean;
  isLoadingNotices: boolean;
  isLoadingMetadata: boolean;
  isLiking: boolean;
  
  // Error states
  listError: string | null;
  postError: string | null;
  noticesError: string | null;
  
  // Categories and tags
  categories: Category[];
  tags: Tag[];
}

// Initial state
const initialState: BlogState = {
  posts: [],
  selectedPost: null,
  postContent: null,
  postsPagination: null,
  notices: [],
  noticesPagination: null,
  layout: 'card',
  filters: {
    sortBy: 'latest'
  },
  currentPage: 1,
  isLoadingList: false,
  isLoadingPost: false,
  isLoadingNotices: false,
  isLoadingMetadata: false,
  isLiking: false,
  listError: null,
  postError: null,
  noticesError: null,
  categories: [],
  tags: [],
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
      state.listError = null;
    },
    
    clearPostError: (state) => {
      state.postError = null;
    },
    
    clearNoticesError: (state) => {
      state.noticesError = null;
    },
    
    // Clear selected post
    clearSelectedPost: (state) => {
      state.selectedPost = null;
      state.postContent = null;
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
      if (state.selectedPost?.uid === uid) {
        state.selectedPost = { ...state.selectedPost, ...updates };
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch posts
    builder
      .addCase(fetchBlogPosts.pending, (state) => {
        state.isLoadingList = true;
        state.listError = null;
      })
      .addCase(fetchBlogPosts.fulfilled, (state, action) => {
        state.isLoadingList = false;
        state.posts = action.payload.posts;
        state.postsPagination = action.payload.pagination;
        state.currentPage = action.payload.pagination.currentPage;
      })
      .addCase(fetchBlogPosts.rejected, (state, action) => {
        state.isLoadingList = false;
        state.listError = action.payload as string || 'Failed to fetch posts';
      });
    
    // Fetch single post
    builder
      .addCase(fetchBlogPost.pending, (state) => {
        state.isLoadingPost = true;
        state.postError = null;
      })
      .addCase(fetchBlogPost.fulfilled, (state, action) => {
        state.isLoadingPost = false;
        state.selectedPost = action.payload.post;
        state.postContent = action.payload.content || null;
      })
      .addCase(fetchBlogPost.rejected, (state, action) => {
        state.isLoadingPost = false;
        state.postError = action.payload as string || 'Failed to fetch post';
      });
    
    // Fetch notices
    builder
      .addCase(fetchNotices.pending, (state) => {
        state.isLoadingNotices = true;
        state.noticesError = null;
      })
      .addCase(fetchNotices.fulfilled, (state, action) => {
        state.isLoadingNotices = false;
        state.notices = action.payload.notices;
        state.noticesPagination = action.payload.pagination;
      })
      .addCase(fetchNotices.rejected, (state, action) => {
        state.isLoadingNotices = false;
        state.noticesError = action.payload as string || 'Failed to fetch notices';
      });
    
    // Fetch categories
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.isLoadingMetadata = true;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.isLoadingMetadata = false;
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state) => {
        state.isLoadingMetadata = false;
      });
    
    // Fetch tags
    builder
      .addCase(fetchTags.pending, (state) => {
        state.isLoadingMetadata = true;
      })
      .addCase(fetchTags.fulfilled, (state, action) => {
        state.isLoadingMetadata = false;
        state.tags = action.payload;
      })
      .addCase(fetchTags.rejected, (state) => {
        state.isLoadingMetadata = false;
      });
    
    // Toggle like
    builder
      .addCase(togglePostLike.pending, (state) => {
        state.isLiking = true;
      })
      .addCase(togglePostLike.fulfilled, (state, action) => {
        state.isLiking = false;
        const { postId, liked, likeCount } = action.payload;
        
        // Update the post in the list
        const postIndex = state.posts.findIndex(p => p.uid === postId);
        if (postIndex !== -1) {
          state.posts[postIndex].isLiked = liked;
          state.posts[postIndex].likeCount = likeCount;
        }
        
        // Update the selected post if it's the same
        if (state.selectedPost && state.selectedPost.uid === postId) {
          state.selectedPost.isLiked = liked;
          state.selectedPost.likeCount = likeCount;
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
export const selectSelectedPost = (state: { blog: BlogState }) => state.blog.selectedPost;
export const selectPostContent = (state: { blog: BlogState }) => state.blog.postContent;
export const selectNotices = (state: { blog: BlogState }) => state.blog.notices;
export const selectBlogLayout = (state: { blog: BlogState }) => state.blog.layout;
export const selectBlogFilters = (state: { blog: BlogState }) => state.blog.filters;
export const selectPostsPagination = (state: { blog: BlogState }) => state.blog.postsPagination;
export const selectNoticesPagination = (state: { blog: BlogState }) => state.blog.noticesPagination;
export const selectCurrentPage = (state: { blog: BlogState }) => state.blog.currentPage;
export const selectIsLoadingList = (state: { blog: BlogState }) => state.blog.isLoadingList;
export const selectIsLoadingPost = (state: { blog: BlogState }) => state.blog.isLoadingPost;
export const selectIsLoadingNotices = (state: { blog: BlogState }) => state.blog.isLoadingNotices;
export const selectIsLoadingMetadata = (state: { blog: BlogState }) => state.blog.isLoadingMetadata;
export const selectIsLiking = (state: { blog: BlogState }) => state.blog.isLiking;
export const selectListError = (state: { blog: BlogState }) => state.blog.listError;
export const selectPostError = (state: { blog: BlogState }) => state.blog.postError;
export const selectNoticesError = (state: { blog: BlogState }) => state.blog.noticesError;
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
  [selectPostsPagination],
  (pagination) => pagination?.hasNext || false
);

export const selectHasMoreNotices = createSelector(
  [selectNoticesPagination],
  (pagination) => pagination?.hasNext || false
);

export const selectUnreadNoticesCount = createSelector(
  [selectNotices],
  (notices) => notices.filter(notice => !notice.isRead).length
);

export default blogSlice.reducer;