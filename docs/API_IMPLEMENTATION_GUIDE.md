# API Implementation Guide - Elice Next

Comprehensive implementation guide with practical examples, error handling patterns, and best practices for using the elice-next API.

## 📋 Table of Contents
- [Getting Started](#getting-started)
- [Authentication Implementation](#authentication-implementation)
- [Client SDK Examples](#client-sdk-examples)
- [Error Handling Patterns](#error-handling-patterns)
- [Pagination Implementation](#pagination-implementation)
- [File Upload Implementation](#file-upload-implementation)
- [Real-time Features](#real-time-features)
- [Testing Examples](#testing-examples)
- [Performance Optimization](#performance-optimization)
- [Security Best Practices](#security-best-practices)

---

## 🚀 Getting Started

### Base Configuration
```typescript
// lib/api/config.ts
export const API_CONFIG = {
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://yourdomain.com/api'
    : 'http://localhost:3000/api',
  timeout: 10000,
  retries: 3
};

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  status?: number;
  pagination?: PaginationInfo;
  meta?: Record<string, any>;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNext: boolean;
  hasPrev: boolean;
  limit: number;
}
```

### HTTP Client Setup
```typescript
// lib/api/client.ts
import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { API_CONFIG } from './config';

class ApiClient {
  private client;
  private accessToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.baseURL,
      timeout: API_CONFIG.timeout,
      withCredentials: true, // Important for refresh token cookies
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - Add auth token
    this.client.interceptors.request.use(
      (config) => {
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - Handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            await this.refreshToken();
            return this.client(originalRequest);
          } catch (refreshError) {
            this.logout();
            throw refreshError;
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  private async refreshToken(): Promise<void> {
    const response = await this.client.post('/auth/refresh');
    this.accessToken = response.data.data.accessToken;
  }

  public setAccessToken(token: string) {
    this.accessToken = token;
  }

  public logout() {
    this.accessToken = null;
    // Redirect to login or dispatch logout action
  }

  // Generic API methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.get(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.post(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.put(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.delete(url, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();
```

---

## 🔐 Authentication Implementation

### Complete Authentication Flow
```typescript
// lib/auth/authService.ts
interface LoginCredentials {
  email: string;
  password: string;
  fingerprint?: string;
}

interface SocialLoginRequest {
  provider: 'kakao' | 'google' | 'naver' | 'apple';
  code: string;
  fingerprint?: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  roles: string[];
  avatar?: string;
  emailVerified: boolean;
}

class AuthService {
  private user: User | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;

  // Device fingerprinting for security
  private generateFingerprint(): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx?.fillText('Fingerprint', 2, 2);
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|');
    
    return btoa(fingerprint).slice(0, 32);
  }

  async login(credentials: LoginCredentials): Promise<User> {
    try {
      const fingerprint = this.generateFingerprint();
      
      const response = await apiClient.post<{ user: User; accessToken: string }>('/auth/login', {
        ...credentials,
        fingerprint
      });

      if (response.success && response.data) {
        this.user = response.data.user;
        apiClient.setAccessToken(response.data.accessToken);
        this.startRefreshTimer();
        
        // Store user data
        localStorage.setItem('user', JSON.stringify(this.user));
        
        return this.user;
      }
      
      throw new Error(response.error || 'Login failed');
    } catch (error) {
      this.handleAuthError(error);
      throw error;
    }
  }

  async socialLogin(socialData: SocialLoginRequest): Promise<User> {
    try {
      const fingerprint = this.generateFingerprint();
      
      const response = await apiClient.post<{ user: User; accessToken: string }>('/auth/social', {
        ...socialData,
        fingerprint
      });

      if (response.success && response.data) {
        this.user = response.data.user;
        apiClient.setAccessToken(response.data.accessToken);
        this.startRefreshTimer();
        
        localStorage.setItem('user', JSON.stringify(this.user));
        
        return this.user;
      }
      
      throw new Error(response.error || 'Social login failed');
    } catch (error) {
      this.handleAuthError(error);
      throw error;
    }
  }

  async register(userData: {
    email: string;
    password: string;
    confirmPassword: string;
    name: string;
  }): Promise<{ success: boolean; message: string }> {
    try {
      const fingerprint = this.generateFingerprint();
      
      const response = await apiClient.post('/auth/register', {
        ...userData,
        fingerprint
      });

      return {
        success: response.success,
        message: response.data?.message || 'Registration successful'
      };
    } catch (error) {
      this.handleAuthError(error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearSession();
    }
  }

  private clearSession(): void {
    this.user = null;
    apiClient.setAccessToken('');
    localStorage.removeItem('user');
    
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  private startRefreshTimer(): void {
    // Refresh token every 14 minutes (token expires in 15 minutes)
    this.refreshTimer = setTimeout(async () => {
      try {
        await apiClient.post('/auth/refresh');
        this.startRefreshTimer(); // Schedule next refresh
      } catch (error) {
        console.error('Token refresh failed:', error);
        this.clearSession();
      }
    }, 14 * 60 * 1000);
  }

  private handleAuthError(error: any): void {
    if (error.response?.status === 401) {
      this.clearSession();
    }
    
    console.error('Auth error:', {
      status: error.response?.status,
      message: error.response?.data?.error || error.message,
      code: error.response?.data?.code
    });
  }

  // Getters
  get currentUser(): User | null {
    return this.user;
  }

  get isAuthenticated(): boolean {
    return this.user !== null;
  }

  get isEmailVerified(): boolean {
    return this.user?.emailVerified || false;
  }

  hasRole(role: string): boolean {
    return this.user?.roles.includes(role) || false;
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.some(role => this.hasRole(role));
  }
}

export const authService = new AuthService();
```

### React Hook Implementation
```typescript
// hooks/useAuth.ts
import { useState, useEffect, useContext, createContext } from 'react';
import { authService } from '@/lib/auth/authService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  socialLogin: (socialData: SocialLoginRequest) => Promise<void>;
  register: (userData: RegisterData) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize auth state from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setLoading(true);
    try {
      const userData = await authService.login(credentials);
      setUser(userData);
    } finally {
      setLoading(false);
    }
  };

  const socialLogin = async (socialData: SocialLoginRequest) => {
    setLoading(true);
    try {
      const userData = await authService.socialLogin(socialData);
      setUser(userData);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    setLoading(true);
    try {
      return await authService.register(userData);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    login,
    socialLogin,
    register,
    logout,
    isAuthenticated: !!user,
    hasRole: (role: string) => user?.roles.includes(role) || false
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

---

## 🔧 Client SDK Examples

### Blog API Service
```typescript
// lib/api/blogService.ts
interface BlogPost {
  uid: string;
  title: string;
  description: string;
  url: string;
  images: string[];
  status: 'draft' | 'published' | 'archived';
  publishedAt: string;
  views: number;
  likeCount: number;
  category: {
    name: string;
    slug: string;
  };
  tags: { name: string }[];
}

interface BlogFilters {
  page?: number;
  limit?: number;
  category?: string;
  tag?: string;
  search?: string;
  sort?: 'latest' | 'popular' | 'trending';
}

class BlogService {
  async getPosts(filters: BlogFilters = {}): Promise<{
    posts: BlogPost[];
    pagination: PaginationInfo;
  }> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get<{
      posts: BlogPost[];
      pagination: PaginationInfo;
    }>(`/post?${params.toString()}`);

    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch posts');
    }

    return response.data!;
  }

  async getPost(id: string): Promise<BlogPost> {
    const response = await apiClient.get<BlogPost>(`/post/${id}`);
    
    if (!response.success) {
      throw new Error(response.error || 'Post not found');
    }

    return response.data!;
  }

  async likePost(postId: string): Promise<{ isLiked: boolean; likeCount: number }> {
    const response = await apiClient.post<{ isLiked: boolean; likeCount: number }>('/post/like', {
      postId
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to like post');
    }

    return response.data!;
  }

  async getCategories(): Promise<Array<{
    uid: string;
    code: string;
    name: string;
    slug: string;
    path: string;
    level: number;
    children: any[];
  }>> {
    const response = await apiClient.get('/post/categories');
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch categories');
    }

    return response.data!;
  }

  // Admin methods
  async createPost(postData: Partial<BlogPost>): Promise<BlogPost> {
    const response = await apiClient.post<BlogPost>('/admin/blog', postData);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to create post');
    }

    return response.data!;
  }

  async updatePost(uid: string, postData: Partial<BlogPost>): Promise<BlogPost> {
    const response = await apiClient.put<BlogPost>(`/admin/blog/${uid}`, postData);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to update post');
    }

    return response.data!;
  }

  async deletePost(uid: string): Promise<void> {
    const response = await apiClient.delete(`/admin/blog/${uid}`);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete post');
    }
  }

  async uploadImage(file: File): Promise<{ imageUrl: string; imageId: string }> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await apiClient.post<{ imageUrl: string; imageId: string }>(
      '/admin/blog/upload-image',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to upload image');
    }

    return response.data!;
  }
}

export const blogService = new BlogService();
```

### React Query Integration
```typescript
// hooks/useBlog.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blogService } from '@/lib/api/blogService';

export const useBlogPosts = (filters: BlogFilters) => {
  return useQuery({
    queryKey: ['posts', filters],
    queryFn: () => blogService.getPosts(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useBlogPost = (id: string) => {
  return useQuery({
    queryKey: ['post', id],
    queryFn: () => blogService.getPost(id),
    enabled: !!id,
  });
};

export const useLikePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: blogService.likePost,
    onSuccess: (data, postId) => {
      // Update post cache
      queryClient.setQueryData(['post', postId], (oldData: BlogPost | undefined) => {
        if (oldData) {
          return {
            ...oldData,
            likeCount: data.likeCount
          };
        }
        return oldData;
      });

      // Update posts list cache
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: blogService.createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};
```

---

## ⚠️ Error Handling Patterns

### Comprehensive Error Handler
```typescript
// lib/api/errorHandler.ts
export enum ApiErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
}

export class ApiError extends Error {
  constructor(
    public message: string,
    public code: ApiErrorCode,
    public status: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static fromResponse(error: any): ApiError {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      return new ApiError(
        data.error || error.message,
        data.code || this.getCodeFromStatus(status),
        status,
        data
      );
    } else if (error.request) {
      // Network error
      return new ApiError(
        'Network error - please check your connection',
        ApiErrorCode.NETWORK_ERROR,
        0
      );
    } else if (error.code === 'ECONNABORTED') {
      // Timeout error
      return new ApiError(
        'Request timeout - please try again',
        ApiErrorCode.TIMEOUT_ERROR,
        408
      );
    } else {
      // Other error
      return new ApiError(
        error.message || 'An unexpected error occurred',
        ApiErrorCode.INTERNAL_ERROR,
        500
      );
    }
  }

  private static getCodeFromStatus(status: number): ApiErrorCode {
    switch (status) {
      case 401:
        return ApiErrorCode.UNAUTHORIZED;
      case 403:
        return ApiErrorCode.FORBIDDEN;
      case 404:
        return ApiErrorCode.NOT_FOUND;
      case 400:
        return ApiErrorCode.VALIDATION_ERROR;
      case 429:
        return ApiErrorCode.RATE_LIMIT;
      default:
        return ApiErrorCode.INTERNAL_ERROR;
    }
  }
}

// Error handler hook
export const useErrorHandler = () => {
  const showToast = useToast();

  return {
    handleError: (error: any) => {
      const apiError = error instanceof ApiError ? error : ApiError.fromResponse(error);
      
      switch (apiError.code) {
        case ApiErrorCode.UNAUTHORIZED:
          showToast({
            title: 'Authentication Required',
            description: 'Please log in to continue',
            status: 'warning'
          });
          // Redirect to login
          break;
          
        case ApiErrorCode.FORBIDDEN:
          showToast({
            title: 'Access Denied',
            description: 'You do not have permission to perform this action',
            status: 'error'
          });
          break;
          
        case ApiErrorCode.NOT_FOUND:
          showToast({
            title: 'Not Found',
            description: 'The requested resource was not found',
            status: 'error'
          });
          break;
          
        case ApiErrorCode.VALIDATION_ERROR:
          showToast({
            title: 'Validation Error',
            description: apiError.message,
            status: 'error'
          });
          break;
          
        case ApiErrorCode.RATE_LIMIT:
          showToast({
            title: 'Rate Limit Exceeded',
            description: 'Too many requests. Please wait and try again.',
            status: 'warning'
          });
          break;
          
        case ApiErrorCode.NETWORK_ERROR:
          showToast({
            title: 'Network Error',
            description: 'Please check your internet connection',
            status: 'error'
          });
          break;
          
        default:
          showToast({
            title: 'Unexpected Error',
            description: 'Something went wrong. Please try again.',
            status: 'error'
          });
          break;
      }
      
      // Log error for monitoring
      console.error('API Error:', {
        code: apiError.code,
        message: apiError.message,
        status: apiError.status,
        details: apiError.details
      });
    }
  };
};
```

---

## 📄 Pagination Implementation

### Advanced Pagination Hook
```typescript
// hooks/usePagination.ts
interface PaginationOptions {
  initialPage?: number;
  initialLimit?: number;
  maxLimit?: number;
}

interface PaginationState {
  page: number;
  limit: number;
  offset: number;
}

interface PaginationActions {
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  resetPagination: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
}

type UsePaginationReturn = [PaginationState, PaginationActions];

export const usePagination = (
  totalCount?: number,
  options: PaginationOptions = {}
): UsePaginationReturn => {
  const {
    initialPage = 1,
    initialLimit = 10,
    maxLimit = 100
  } = options;

  const [page, setPageState] = useState(initialPage);
  const [limit, setLimitState] = useState(initialLimit);

  const offset = (page - 1) * limit;
  const totalPages = totalCount ? Math.ceil(totalCount / limit) : 0;
  const canGoNext = totalCount ? page < totalPages : false;
  const canGoPrev = page > 1;

  const setPage = useCallback((newPage: number) => {
    if (newPage >= 1 && (!totalCount || newPage <= totalPages)) {
      setPageState(newPage);
    }
  }, [totalPages, totalCount]);

  const setLimit = useCallback((newLimit: number) => {
    const clampedLimit = Math.min(Math.max(1, newLimit), maxLimit);
    setLimitState(clampedLimit);
    // Reset to first page when limit changes
    setPageState(1);
  }, [maxLimit]);

  const nextPage = useCallback(() => {
    if (canGoNext) {
      setPageState(prev => prev + 1);
    }
  }, [canGoNext]);

  const prevPage = useCallback(() => {
    if (canGoPrev) {
      setPageState(prev => prev - 1);
    }
  }, [canGoPrev]);

  const resetPagination = useCallback(() => {
    setPageState(initialPage);
    setLimitState(initialLimit);
  }, [initialPage, initialLimit]);

  return [
    { page, limit, offset },
    {
      setPage,
      setLimit,
      nextPage,
      prevPage,
      resetPagination,
      canGoNext,
      canGoPrev
    }
  ];
};

// Pagination component
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  maxVisible?: number;
}

export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
  maxVisible = 5
}: PaginationProps) => {
  const getVisiblePages = () => {
    const half = Math.floor(maxVisible / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const visiblePages = getVisiblePages();

  return (
    <nav className="flex items-center justify-center space-x-1">
      {/* First page */}
      {showFirstLast && currentPage > 1 && (
        <button
          onClick={() => onPageChange(1)}
          className="pagination-btn"
        >
          First
        </button>
      )}
      
      {/* Previous page */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="pagination-btn"
      >
        Previous
      </button>
      
      {/* Page numbers */}
      {visiblePages.map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={cn(
            'pagination-btn',
            page === currentPage && 'pagination-btn-active'
          )}
        >
          {page}
        </button>
      ))}
      
      {/* Next page */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="pagination-btn"
      >
        Next
      </button>
      
      {/* Last page */}
      {showFirstLast && currentPage < totalPages && (
        <button
          onClick={() => onPageChange(totalPages)}
          className="pagination-btn"
        >
          Last
        </button>
      )}
    </nav>
  );
};
```

---

## 📁 File Upload Implementation

### Advanced File Upload Service
```typescript
// lib/api/uploadService.ts
interface UploadOptions {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  onProgress?: (progress: number) => void;
  onComplete?: (result: UploadResult) => void;
  onError?: (error: Error) => void;
}

interface UploadResult {
  imageUrl: string;
  imageId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}

class UploadService {
  private readonly defaultOptions: Required<Omit<UploadOptions, 'onProgress' | 'onComplete' | 'onError'>> = {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  };

  async uploadFile(file: File, options: UploadOptions = {}): Promise<UploadResult> {
    const opts = { ...this.defaultOptions, ...options };

    // Validate file
    this.validateFile(file, opts);

    // Create form data
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await apiClient.post<UploadResult>(
        '/admin/blog/upload-image',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total && options.onProgress) {
              const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              options.onProgress(progress);
            }
          },
        }
      );

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Upload failed');
      }

      const result: UploadResult = {
        ...response.data,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      };

      options.onComplete?.(result);
      return result;

    } catch (error) {
      const uploadError = error instanceof Error ? error : new Error('Upload failed');
      options.onError?.(uploadError);
      throw uploadError;
    }
  }

  async uploadMultiple(files: File[], options: UploadOptions = {}): Promise<UploadResult[]> {
    const uploadPromises = files.map(file => this.uploadFile(file, {
      ...options,
      onProgress: undefined, // Individual progress not supported for multiple uploads
    }));

    return Promise.all(uploadPromises);
  }

  private validateFile(file: File, options: Required<Omit<UploadOptions, 'onProgress' | 'onComplete' | 'onError'>>): void {
    // Check file size
    if (file.size > options.maxSize) {
      throw new Error(`File size exceeds ${this.formatFileSize(options.maxSize)} limit`);
    }

    // Check file type
    if (!options.allowedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} is not allowed`);
    }

    // Check file name
    if (!file.name || file.name.length > 255) {
      throw new Error('Invalid file name');
    }
  }

  private formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  // Generate optimized image URLs
  generateImageUrl(imageUrl: string, options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpg' | 'png';
  } = {}): string {
    const url = new URL(imageUrl);
    
    if (options.width) url.searchParams.set('w', options.width.toString());
    if (options.height) url.searchParams.set('h', options.height.toString());
    if (options.quality) url.searchParams.set('q', options.quality.toString());
    if (options.format) url.searchParams.set('f', options.format);
    
    return url.toString();
  }
}

export const uploadService = new UploadService();

// React hook for file uploads
export const useFileUpload = (options: UploadOptions = {}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (file: File): Promise<UploadResult> => {
    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const result = await uploadService.uploadFile(file, {
        ...options,
        onProgress: (progress) => {
          setProgress(progress);
          options.onProgress?.(progress);
        },
      });

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      throw err;
    } finally {
      setUploading(false);
    }
  }, [options]);

  const uploadMultiple = useCallback(async (files: File[]): Promise<UploadResult[]> => {
    setUploading(true);
    setError(null);

    try {
      const results = await uploadService.uploadMultiple(files, options);
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      throw err;
    } finally {
      setUploading(false);
    }
  }, [options]);

  return {
    upload,
    uploadMultiple,
    uploading,
    progress,
    error,
    resetError: () => setError(null)
  };
};
```

---

## ⚡ Real-time Features

### WebSocket Implementation
```typescript
// lib/websocket/socketService.ts
interface SocketEvent {
  type: string;
  data: any;
  timestamp: number;
}

interface NotificationData {
  id: string;
  title: string;
  content: string;
  category: 'system' | 'user' | 'blog';
  read: boolean;
}

class SocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private eventListeners: Map<string, Set<(data: any) => void>> = new Map();

  connect(token: string): void {
    const wsUrl = process.env.NODE_ENV === 'production'
      ? 'wss://yourdomain.com/ws'
      : 'ws://localhost:3000/ws';

    try {
      this.socket = new WebSocket(`${wsUrl}?token=${token}`);
      
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close(1000, 'User disconnected');
      this.socket = null;
    }
    
    this.clearTimers();
    this.eventListeners.clear();
  }

  private handleOpen(): void {
    console.log('WebSocket connected');
    this.reconnectAttempts = 0;
    this.startPing();
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const socketEvent: SocketEvent = JSON.parse(event.data);
      this.emit(socketEvent.type, socketEvent.data);
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  private handleClose(event: CloseEvent): void {
    console.log('WebSocket disconnected:', event.reason);
    this.clearTimers();
    
    // Attempt to reconnect if not a normal closure
    if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.scheduleReconnect();
    }
  }

  private handleError(error: Event): void {
    console.error('WebSocket error:', error);
  }

  private scheduleReconnect(): void {
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      // Get token from storage or auth service
      const token = localStorage.getItem('accessToken');
      if (token) {
        this.connect(token);
      }
    }, delay);
  }

  private startPing(): void {
    this.pingInterval = setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // Ping every 30 seconds
  }

  private clearTimers(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  // Event system
  on(event: string, callback: (data: any) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  off(event: string, callback: (data: any) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.eventListeners.delete(event);
      }
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  // Send message
  send(type: string, data: any): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type, data, timestamp: Date.now() }));
    } else {
      console.warn('WebSocket is not connected');
    }
  }
}

export const socketService = new SocketService();

// React hook for WebSocket
export const useSocket = () => {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (user) {
      // Get access token and connect
      const token = localStorage.getItem('accessToken');
      if (token) {
        socketService.connect(token);
        
        socketService.on('connect', () => setConnected(true));
        socketService.on('disconnect', () => setConnected(false));
      }
    }

    return () => {
      socketService.disconnect();
      setConnected(false);
    };
  }, [user]);

  return {
    connected,
    on: socketService.on.bind(socketService),
    off: socketService.off.bind(socketService),
    send: socketService.send.bind(socketService)
  };
};

// Real-time notifications hook
export const useRealTimeNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const { connected, on, off } = useSocket();

  useEffect(() => {
    if (connected) {
      const handleNotification = (data: NotificationData) => {
        setNotifications(prev => [data, ...prev]);
        
        // Show browser notification if permission granted
        if (Notification.permission === 'granted') {
          new Notification(data.title, {
            body: data.content,
            icon: '/favicon.ico'
          });
        }
      };

      on('notification', handleNotification);

      return () => {
        off('notification', handleNotification);
      };
    }
  }, [connected, on, off]);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
    
    // Also update on server
    apiClient.post('/notification', { notificationId });
  }, []);

  return {
    notifications,
    unreadCount: notifications.filter(n => !n.read).length,
    markAsRead
  };
};
```

---

## 🧪 Testing Examples

### API Testing with Jest
```typescript
// __tests__/api/blogService.test.ts
import { blogService } from '@/lib/api/blogService';
import { apiClient } from '@/lib/api/client';

// Mock the API client
jest.mock('@/lib/api/client');
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('BlogService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPosts', () => {
    it('should fetch posts successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          posts: [
            {
              uid: '1',
              title: 'Test Post',
              description: 'Test description',
              url: 'test-post',
              images: [],
              status: 'published',
              publishedAt: '2024-01-01T00:00:00Z',
              views: 0,
              likeCount: 0,
              category: { name: 'Tech', slug: 'tech' },
              tags: []
            }
          ],
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalCount: 1,
            hasNext: false,
            hasPrev: false,
            limit: 10
          }
        }
      };

      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await blogService.getPosts({ page: 1, limit: 10 });

      expect(mockApiClient.get).toHaveBeenCalledWith('/post?page=1&limit=10');
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API errors', async () => {
      mockApiClient.get.mockResolvedValueOnce({
        success: false,
        error: 'Failed to fetch posts'
      });

      await expect(blogService.getPosts()).rejects.toThrow('Failed to fetch posts');
    });
  });

  describe('likePost', () => {
    it('should like a post successfully', async () => {
      const mockResponse = {
        success: true,
        data: { isLiked: true, likeCount: 1 }
      };

      mockApiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await blogService.likePost('post-1');

      expect(mockApiClient.post).toHaveBeenCalledWith('/post/like', { postId: 'post-1' });
      expect(result).toEqual(mockResponse.data);
    });
  });
});

// Integration tests with MSW (Mock Service Worker)
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('/api/post', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        data: {
          posts: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalCount: 0,
            hasNext: false,
            hasPrev: false,
            limit: 10
          }
        }
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### React Component Testing
```typescript
// __tests__/components/BlogCard.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BlogCard } from '@/components/features/blog/Card';
import { blogService } from '@/lib/api/blogService';

// Mock the blog service
jest.mock('@/lib/api/blogService');
const mockBlogService = blogService as jest.Mocked<typeof blogService>;

// Test wrapper with providers
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

const mockPost = {
  uid: '1',
  title: 'Test Post',
  description: 'Test description',
  url: 'test-post',
  images: ['test-image.jpg'],
  status: 'published' as const,
  publishedAt: '2024-01-01T00:00:00Z',
  views: 100,
  likeCount: 5,
  category: { name: 'Tech', slug: 'tech' },
  tags: [{ name: 'React' }]
};

describe('BlogCard', () => {
  it('should render post information correctly', () => {
    render(<BlogCard post={mockPost} />, { wrapper: createWrapper() });

    expect(screen.getByText('Test Post')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByText('Tech')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument(); // views
    expect(screen.getByText('5')).toBeInTheDocument(); // likes
  });

  it('should handle like button click', async () => {
    mockBlogService.likePost.mockResolvedValueOnce({
      isLiked: true,
      likeCount: 6
    });

    render(<BlogCard post={mockPost} />, { wrapper: createWrapper() });

    const likeButton = screen.getByRole('button', { name: /like/i });
    fireEvent.click(likeButton);

    await waitFor(() => {
      expect(mockBlogService.likePost).toHaveBeenCalledWith('1');
    });
  });
});
```

---

## 🚀 Performance Optimization

### API Response Caching
```typescript
// lib/api/cache.ts
interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum cache entries
}

class ApiCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private maxSize: number;

  constructor(options: CacheOptions = {}) {
    this.maxSize = options.maxSize || 100;
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Generate cache key from URL and params
  generateKey(url: string, params?: Record<string, any>): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `${url}:${paramString}`;
  }
}

export const apiCache = new ApiCache();

// Enhanced API client with caching
export class CachedApiClient extends ApiClient {
  async get<T>(url: string, config?: AxiosRequestConfig & { cache?: boolean; cacheTtl?: number }): Promise<ApiResponse<T>> {
    const { cache = false, cacheTtl = 5 * 60 * 1000, ...axiosConfig } = config || {};
    
    if (cache) {
      const cacheKey = apiCache.generateKey(url, axiosConfig.params);
      const cachedData = apiCache.get<ApiResponse<T>>(cacheKey);
      
      if (cachedData) {
        return cachedData;
      }

      const response = await super.get<T>(url, axiosConfig);
      apiCache.set(cacheKey, response, cacheTtl);
      return response;
    }

    return super.get<T>(url, axiosConfig);
  }
}
```

### Request Deduplication
```typescript
// lib/api/requestDeduplication.ts
class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<any>>();

  async deduplicate<T>(
    key: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    // If request is already pending, return the existing promise
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!;
    }

    // Create new request
    const requestPromise = requestFn().finally(() => {
      // Clean up after request completes
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, requestPromise);
    return requestPromise;
  }

  cancel(key: string): void {
    this.pendingRequests.delete(key);
  }

  clear(): void {
    this.pendingRequests.clear();
  }
}

export const requestDeduplicator = new RequestDeduplicator();

// Usage in API service
export class OptimizedBlogService extends BlogService {
  async getPosts(filters: BlogFilters = {}): Promise<{
    posts: BlogPost[];
    pagination: PaginationInfo;
  }> {
    const key = `getPosts:${JSON.stringify(filters)}`;
    
    return requestDeduplicator.deduplicate(key, () => {
      return super.getPosts(filters);
    });
  }
}
```

---

## 🔒 Security Best Practices

### Request Validation
```typescript
// lib/security/validation.ts
import { z } from 'zod';

// Input validation schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fingerprint: z.string().optional()
});

export const createPostSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().min(1, 'Description is required').max(500, 'Description too long'),
  url: z.string().regex(/^[a-z0-9-]+$/, 'Invalid URL format'),
  categoryId: z.string().uuid('Invalid category ID'),
  status: z.enum(['draft', 'published', 'archived'])
});

// Security utilities
export const sanitizeHtml = (html: string): string => {
  // Use DOMPurify or similar library
  return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};

export const validateCsrfToken = (token: string): boolean => {
  // Implement CSRF token validation
  const storedToken = sessionStorage.getItem('csrf-token');
  return token === storedToken;
};

// Rate limiting client-side
class RateLimiter {
  private requests = new Map<string, number[]>();

  isAllowed(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Get existing requests for this key
    const requests = this.requests.get(key) || [];
    
    // Filter out old requests
    const recentRequests = requests.filter(time => time > windowStart);
    
    // Check if limit exceeded
    if (recentRequests.length >= maxRequests) {
      return false;
    }
    
    // Add current request
    recentRequests.push(now);
    this.requests.set(key, recentRequests);
    
    return true;
  }
}

export const rateLimiter = new RateLimiter();
```

This comprehensive API implementation guide provides developers with practical examples, error handling patterns, and best practices for working with the elice-next API. The guide emphasizes security, performance, and maintainability while providing real-world code examples that can be directly implemented in projects.

**Key Features Covered:**
- **Complete authentication flow** with JWT and refresh tokens
- **Comprehensive error handling** with custom error classes
- **Advanced pagination** and caching strategies
- **File upload implementation** with progress tracking
- **Real-time WebSocket communication** for notifications
- **Testing examples** with Jest and React Testing Library
- **Performance optimizations** including request deduplication
- **Security best practices** with validation and rate limiting

All examples follow TypeScript best practices and integrate seamlessly with modern React patterns including hooks, Context API, and React Query.