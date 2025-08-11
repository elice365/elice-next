# State Management Documentation

## Overview

The elice-next application uses Redux Toolkit for global state management, providing a centralized, predictable state container with TypeScript support and optimized performance through Redux Toolkit's built-in features.

## Architecture

### Store Structure

```
stores/
├── index.ts              # Store configuration
└── slice/
    ├── auth.ts          # Authentication state
    ├── blog.ts          # Blog filters and views
    ├── device.ts        # Device and responsive state
    ├── modal.ts         # Modal management
    ├── panel.ts         # UI panel states
    └── search.ts        # Search functionality
```

### Store Configuration (`stores/index.ts`)

```typescript
import { configureStore } from '@reduxjs/toolkit';
import modal from './slice/modal';
import panel from './slice/panel';
import device from './slice/device';
import search from './slice/search';
import auth from './slice/auth';
import blog from './slice/blog';

export const store = configureStore({
  reducer: {
    modal,
    panel,
    device,
    search,
    auth,
    blog
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

## State Slices

### 1. Authentication Slice (`slice/auth.ts`)

**Purpose:** Manages user authentication state, tokens, and user profile data.

```typescript
interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
  sessionExpiry: number | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  accessToken: null,
  refreshToken: null,
  loading: false,
  error: null,
  sessionExpiry: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Synchronous actions
    setCredentials: (state, action) => {
      const { user, accessToken, refreshToken } = action.payload;
      state.isAuthenticated = true;
      state.user = user;
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      state.error = null;
      state.sessionExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes
    },
    
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.sessionExpiry = null;
    },
    
    updateUser: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // Handle async thunks
    builder
      .addCase(loginAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
      })
      .addCase(loginAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Login failed';
      });
  }
});

// Async thunks
export const loginAsync = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    
    if (!response.ok) {
      throw new Error('Login failed');
    }
    
    return response.json();
  }
);

// Selectors
export const selectAuth = (state: RootState) => state.auth;
export const selectUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectAuthLoading = (state: RootState) => state.auth.loading;
```

### 2. Blog Slice (`slice/blog.ts`)

**Purpose:** Manages blog post filters, view modes, and pagination state.

```typescript
interface BlogState {
  filters: {
    category: string | null;
    tags: string[];
    author: string | null;
    dateRange: {
      start: Date | null;
      end: Date | null;
    };
    sortBy: 'date' | 'views' | 'likes';
    sortOrder: 'asc' | 'desc';
  };
  viewMode: 'card' | 'list' | 'grid';
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  selectedPost: string | null;
  loading: boolean;
  error: string | null;
}

const blogSlice = createSlice({
  name: 'blog',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.page = 1; // Reset to first page on filter change
    },
    
    clearFilters: (state) => {
      state.filters = initialState.filters;
      state.pagination.page = 1;
    },
    
    setViewMode: (state, action) => {
      state.viewMode = action.payload;
      // Save preference to localStorage
      localStorage.setItem('blogViewMode', action.payload);
    },
    
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    
    nextPage: (state) => {
      if (state.pagination.hasMore) {
        state.pagination.page += 1;
      }
    },
    
    previousPage: (state) => {
      if (state.pagination.page > 1) {
        state.pagination.page -= 1;
      }
    },
    
    selectPost: (state, action) => {
      state.selectedPost = action.payload;
    },
    
    toggleTag: (state, action) => {
      const tag = action.payload;
      const index = state.filters.tags.indexOf(tag);
      
      if (index === -1) {
        state.filters.tags.push(tag);
      } else {
        state.filters.tags.splice(index, 1);
      }
    }
  }
});

// Selectors with memoization
export const selectFilteredPosts = createSelector(
  [selectAllPosts, selectBlogFilters],
  (posts, filters) => {
    return posts.filter(post => {
      if (filters.category && post.category !== filters.category) return false;
      if (filters.author && post.authorId !== filters.author) return false;
      if (filters.tags.length && !filters.tags.some(tag => post.tags.includes(tag))) return false;
      // Date range filtering...
      return true;
    });
  }
);
```

### 3. Modal Slice (`slice/modal.ts`)

**Purpose:** Centralized modal state management for all application modals.

```typescript
interface ModalState {
  activeModal: string | null;
  modalData: any;
  modalStack: Array<{
    id: string;
    data: any;
  }>;
  isClosing: boolean;
}

const modalSlice = createSlice({
  name: 'modal',
  initialState: {
    activeModal: null,
    modalData: null,
    modalStack: [],
    isClosing: false
  },
  reducers: {
    openModal: (state, action) => {
      const { id, data } = action.payload;
      
      // Push current modal to stack if exists
      if (state.activeModal) {
        state.modalStack.push({
          id: state.activeModal,
          data: state.modalData
        });
      }
      
      state.activeModal = id;
      state.modalData = data;
      state.isClosing = false;
    },
    
    closeModal: (state) => {
      state.isClosing = true;
      
      // Restore previous modal from stack
      setTimeout(() => {
        if (state.modalStack.length > 0) {
          const previous = state.modalStack.pop();
          state.activeModal = previous.id;
          state.modalData = previous.data;
        } else {
          state.activeModal = null;
          state.modalData = null;
        }
        state.isClosing = false;
      }, 300); // Animation duration
    },
    
    closeAllModals: (state) => {
      state.activeModal = null;
      state.modalData = null;
      state.modalStack = [];
      state.isClosing = false;
    },
    
    updateModalData: (state, action) => {
      if (state.modalData) {
        state.modalData = { ...state.modalData, ...action.payload };
      }
    }
  }
});

// Modal type constants
export const MODAL_TYPES = {
  // Auth modals
  LOGIN: 'LOGIN',
  REGISTER: 'REGISTER',
  FORGOT_PASSWORD: 'FORGOT_PASSWORD',
  
  // Blog modals
  BLOG_CREATE: 'BLOG_CREATE',
  BLOG_EDIT: 'BLOG_EDIT',
  BLOG_DELETE: 'BLOG_DELETE',
  BLOG_PREVIEW: 'BLOG_PREVIEW',
  
  // Admin modals
  USER_EDIT: 'USER_EDIT',
  ROLE_MANAGE: 'ROLE_MANAGE',
  
  // Common modals
  CONFIRM: 'CONFIRM',
  ALERT: 'ALERT',
  IMAGE_VIEWER: 'IMAGE_VIEWER'
} as const;

// Helper hooks
export const useModal = (modalId: string) => {
  const dispatch = useDispatch();
  const isOpen = useSelector(state => state.modal.activeModal === modalId);
  const data = useSelector(state => state.modal.modalData);
  
  const open = (modalData?: any) => {
    dispatch(openModal({ id: modalId, data: modalData }));
  };
  
  const close = () => {
    dispatch(closeModal());
  };
  
  return { isOpen, data, open, close };
};
```

### 4. Device Slice (`slice/device.ts`)

**Purpose:** Manages device detection, responsive state, and viewport information.

```typescript
interface DeviceState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
  screenHeight: number;
  orientation: 'portrait' | 'landscape';
  platform: string;
  browser: string;
  touchEnabled: boolean;
  connectionSpeed: 'slow' | 'fast' | 'unknown';
}

const deviceSlice = createSlice({
  name: 'device',
  initialState: {
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    screenWidth: 1920,
    screenHeight: 1080,
    orientation: 'landscape',
    platform: 'unknown',
    browser: 'unknown',
    touchEnabled: false,
    connectionSpeed: 'unknown'
  },
  reducers: {
    updateDevice: (state, action) => {
      const width = action.payload.width;
      
      state.screenWidth = width;
      state.screenHeight = action.payload.height;
      
      // Breakpoint detection
      state.isMobile = width < 768;
      state.isTablet = width >= 768 && width < 1024;
      state.isDesktop = width >= 1024;
      
      // Orientation
      state.orientation = width > action.payload.height ? 'landscape' : 'portrait';
    },
    
    setDeviceInfo: (state, action) => {
      state.platform = action.payload.platform;
      state.browser = action.payload.browser;
      state.touchEnabled = action.payload.touchEnabled;
    },
    
    setConnectionSpeed: (state, action) => {
      state.connectionSpeed = action.payload;
    }
  }
});

// Device detection middleware
export const deviceDetectionMiddleware: Middleware = store => next => action => {
  if (typeof window !== 'undefined') {
    // Listen for resize events
    window.addEventListener('resize', debounce(() => {
      store.dispatch(updateDevice({
        width: window.innerWidth,
        height: window.innerHeight
      }));
    }, 250));
    
    // Detect connection speed
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      const speed = connection.effectiveType === '4g' ? 'fast' : 'slow';
      store.dispatch(setConnectionSpeed(speed));
    }
  }
  
  return next(action);
};
```

### 5. Panel Slice (`slice/panel.ts`)

**Purpose:** Manages UI panel states (sidebars, drawers, collapsible sections).

```typescript
interface PanelState {
  sidebar: {
    isOpen: boolean;
    width: number;
    collapsed: boolean;
  };
  rightPanel: {
    isOpen: boolean;
    content: 'notifications' | 'settings' | 'help' | null;
  };
  bottomSheet: {
    isOpen: boolean;
    height: number;
    content: any;
  };
  navigationDrawer: {
    isOpen: boolean;
  };
}

const panelSlice = createSlice({
  name: 'panel',
  initialState: {
    sidebar: {
      isOpen: true,
      width: 280,
      collapsed: false
    },
    rightPanel: {
      isOpen: false,
      content: null
    },
    bottomSheet: {
      isOpen: false,
      height: 400,
      content: null
    },
    navigationDrawer: {
      isOpen: false
    }
  },
  reducers: {
    toggleSidebar: (state) => {
      state.sidebar.isOpen = !state.sidebar.isOpen;
    },
    
    collapseSidebar: (state, action) => {
      state.sidebar.collapsed = action.payload ?? !state.sidebar.collapsed;
    },
    
    setSidebarWidth: (state, action) => {
      state.sidebar.width = Math.max(200, Math.min(400, action.payload));
    },
    
    openRightPanel: (state, action) => {
      state.rightPanel.isOpen = true;
      state.rightPanel.content = action.payload;
    },
    
    closeRightPanel: (state) => {
      state.rightPanel.isOpen = false;
      state.rightPanel.content = null;
    },
    
    toggleBottomSheet: (state, action) => {
      if (state.bottomSheet.isOpen) {
        state.bottomSheet.isOpen = false;
        state.bottomSheet.content = null;
      } else {
        state.bottomSheet.isOpen = true;
        state.bottomSheet.content = action.payload?.content;
        state.bottomSheet.height = action.payload?.height || 400;
      }
    },
    
    toggleNavigationDrawer: (state) => {
      state.navigationDrawer.isOpen = !state.navigationDrawer.isOpen;
    },
    
    closeAllPanels: (state) => {
      state.sidebar.isOpen = false;
      state.rightPanel.isOpen = false;
      state.bottomSheet.isOpen = false;
      state.navigationDrawer.isOpen = false;
    }
  }
});
```

### 6. Search Slice (`slice/search.ts`)

**Purpose:** Manages search functionality, results, and search history.

```typescript
interface SearchState {
  query: string;
  filters: {
    type: 'all' | 'posts' | 'users' | 'tags';
    dateRange: 'all' | 'day' | 'week' | 'month' | 'year';
    sortBy: 'relevance' | 'date' | 'popularity';
  };
  results: {
    posts: any[];
    users: any[];
    tags: any[];
  };
  suggestions: string[];
  history: string[];
  isSearching: boolean;
  totalResults: number;
  hasMore: boolean;
}

const searchSlice = createSlice({
  name: 'search',
  initialState: {
    query: '',
    filters: {
      type: 'all',
      dateRange: 'all',
      sortBy: 'relevance'
    },
    results: {
      posts: [],
      users: [],
      tags: []
    },
    suggestions: [],
    history: [],
    isSearching: false,
    totalResults: 0,
    hasMore: false
  },
  reducers: {
    setQuery: (state, action) => {
      state.query = action.payload;
      
      // Update suggestions based on query
      if (action.payload.length > 2) {
        state.suggestions = generateSuggestions(action.payload, state.history);
      } else {
        state.suggestions = [];
      }
    },
    
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    
    setResults: (state, action) => {
      state.results = action.payload.results;
      state.totalResults = action.payload.total;
      state.hasMore = action.payload.hasMore;
      state.isSearching = false;
    },
    
    appendResults: (state, action) => {
      const { type, results } = action.payload;
      state.results[type] = [...state.results[type], ...results];
    },
    
    clearResults: (state) => {
      state.results = initialState.results;
      state.totalResults = 0;
      state.hasMore = false;
    },
    
    addToHistory: (state, action) => {
      const query = action.payload;
      
      // Remove if exists and add to beginning
      state.history = [
        query,
        ...state.history.filter(h => h !== query)
      ].slice(0, 10); // Keep last 10
      
      // Save to localStorage
      localStorage.setItem('searchHistory', JSON.stringify(state.history));
    },
    
    clearHistory: (state) => {
      state.history = [];
      localStorage.removeItem('searchHistory');
    },
    
    setSearching: (state, action) => {
      state.isSearching = action.payload;
    }
  }
});

// Search thunk
export const performSearch = createAsyncThunk(
  'search/perform',
  async (params: SearchParams, { dispatch }) => {
    dispatch(setSearching(true));
    
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      
      const data = await response.json();
      
      dispatch(setResults(data));
      dispatch(addToHistory(params.query));
      
      return data;
    } catch (error) {
      dispatch(setSearching(false));
      throw error;
    }
  }
);
```

## Hooks and Utilities

### Type-Safe Hooks

```typescript
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from '@/stores';

// Type-safe dispatch hook
export const useAppDispatch = () => useDispatch<AppDispatch>();

// Type-safe selector hook
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

### Custom Hooks

```typescript
// Authentication hook
export const useAuth = () => {
  const dispatch = useAppDispatch();
  const auth = useAppSelector(selectAuth);
  
  const login = useCallback(async (credentials: LoginCredentials) => {
    const result = await dispatch(loginAsync(credentials));
    return loginAsync.fulfilled.match(result);
  }, [dispatch]);
  
  const logout = useCallback(() => {
    dispatch(authSlice.actions.logout());
    // Clear tokens from storage
    localStorage.removeItem('accessToken');
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  }, [dispatch]);
  
  const refreshToken = useCallback(async () => {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      dispatch(setCredentials(data));
      return true;
    }
    
    return false;
  }, [dispatch]);
  
  return {
    ...auth,
    login,
    logout,
    refreshToken
  };
};

// Search hook
export const useSearch = () => {
  const dispatch = useAppDispatch();
  const search = useAppSelector(state => state.search);
  
  const performSearchDebounced = useMemo(
    () => debounce((query: string) => {
      if (query.trim()) {
        dispatch(performSearch({ query, ...search.filters }));
      }
    }, 300),
    [dispatch, search.filters]
  );
  
  return {
    ...search,
    search: performSearchDebounced,
    setQuery: (query: string) => dispatch(setQuery(query)),
    clearResults: () => dispatch(clearResults())
  };
};
```

## Persistence

### Redux Persist Configuration

```typescript
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'blog', 'device'], // Only persist these slices
  blacklist: ['modal', 'search'], // Don't persist these
  transforms: [
    // Custom transform to encrypt sensitive data
    encryptTransform({
      secretKey: process.env.NEXT_PUBLIC_PERSIST_KEY,
      onError: (error) => {
        console.error('Encryption error:', error);
      }
    })
  ]
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);
```

## Performance Optimization

### Selector Memoization

```typescript
import { createSelector } from '@reduxjs/toolkit';

// Expensive computation memoized
export const selectExpensiveData = createSelector(
  [selectRawData, selectFilters],
  (data, filters) => {
    // Expensive filtering/sorting
    return data
      .filter(item => applyFilters(item, filters))
      .sort((a, b) => compareFn(a, b, filters.sortBy))
      .slice(0, 100);
  }
);

// Multiple input selectors
export const selectDashboardStats = createSelector(
  [selectUsers, selectPosts, selectComments],
  (users, posts, comments) => ({
    totalUsers: users.length,
    activePosts: posts.filter(p => p.isActive).length,
    pendingComments: comments.filter(c => !c.approved).length,
    engagement: calculateEngagement(posts, comments)
  })
);
```

### Normalized State

```typescript
// Normalized state structure
interface NormalizedState {
  entities: {
    posts: Record<string, Post>;
    users: Record<string, User>;
    comments: Record<string, Comment>;
  };
  ids: {
    posts: string[];
    users: string[];
    comments: string[];
  };
}

// Entity adapter for normalization
const postsAdapter = createEntityAdapter<Post>({
  selectId: (post) => post.id,
  sortComparer: (a, b) => b.createdAt.localeCompare(a.createdAt)
});

const postsSlice = createSlice({
  name: 'posts',
  initialState: postsAdapter.getInitialState(),
  reducers: {
    addPost: postsAdapter.addOne,
    updatePost: postsAdapter.updateOne,
    removePost: postsAdapter.removeOne,
    setPosts: postsAdapter.setAll
  }
});

// Generated selectors
export const {
  selectAll: selectAllPosts,
  selectById: selectPostById,
  selectIds: selectPostIds
} = postsAdapter.getSelectors((state: RootState) => state.posts);
```

## Testing

### Store Testing

```typescript
import { configureStore } from '@reduxjs/toolkit';
import { renderHook } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';

describe('Auth Store', () => {
  let store: ReturnType<typeof configureStore>;
  
  beforeEach(() => {
    store = configureStore({
      reducer: { auth: authSlice.reducer }
    });
  });
  
  it('should handle login', () => {
    store.dispatch(setCredentials({
      user: { id: '1', email: 'test@example.com' },
      accessToken: 'token123',
      refreshToken: 'refresh123'
    }));
    
    const state = store.getState();
    expect(state.auth.isAuthenticated).toBe(true);
    expect(state.auth.user?.email).toBe('test@example.com');
  });
  
  it('should handle logout', () => {
    store.dispatch(logout());
    
    const state = store.getState();
    expect(state.auth.isAuthenticated).toBe(false);
    expect(state.auth.user).toBeNull();
  });
});

// Hook testing
describe('useAuth Hook', () => {
  it('should provide auth methods', () => {
    const wrapper = ({ children }) => (
      <Provider store={store}>{children}</Provider>
    );
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.login).toBeInstanceOf(Function);
    expect(result.current.logout).toBeInstanceOf(Function);
  });
});
```

## Best Practices

### State Design
- Keep state normalized and flat
- Avoid deeply nested objects
- Use entity adapters for collections
- Separate UI state from data state

### Performance
- Use createSelector for expensive computations
- Implement proper memoization
- Avoid storing derived state
- Use Redux DevTools for debugging

### Type Safety
- Define all state interfaces
- Use type-safe hooks
- Leverage TypeScript inference
- Document complex state shapes

### Security
- Never store sensitive data in Redux
- Encrypt persisted state if needed
- Clear state on logout
- Validate state shape on rehydration

---

This state management architecture provides a robust, type-safe, and performant foundation for managing application state in the elice-next project.