import axios, { AxiosInstance, AxiosRequestConfig, Method } from "axios";
import { TokenManager } from "@/lib/services/token/types";

export interface ApiClientConfig extends AxiosRequestConfig {
  tokenManager?: TokenManager;
}

// API 클라이언트를 "제조"하는 팩토리 함수
export const createAPI = (config: ApiClientConfig) => {
  const client: AxiosInstance = axios.create(config);
  const tokenManager = config.tokenManager;
  let refreshTokenPromise: Promise<string | null> | null = null;

  const handleTokenRefresh = (): Promise<string | null> => {
    if (!tokenManager) return Promise.resolve(null);
    if (refreshTokenPromise) return refreshTokenPromise;

    refreshTokenPromise = tokenManager.refreshAccessToken().finally(() => {
      refreshTokenPromise = null;
    });
    return refreshTokenPromise;
  };
  if (tokenManager) {
    client.interceptors.request.use(
      async (reqConfig) => {
        const token = await tokenManager.getAccessToken();
        if (token) {
          reqConfig.headers.Authorization = `Bearer ${token}`;
        }
        
        // Handle FormData by removing Content-Type header to let browser set it automatically
        if (reqConfig.data instanceof FormData) {
          delete reqConfig.headers['Content-Type'];
        }
        
        return reqConfig;
      },
      (error) => Promise.reject(error instanceof Error ? error : new Error(String(error)))
    );

    client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            const newToken = await handleTokenRefresh();
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return client(originalRequest);
            }
            return Promise.reject(error instanceof Error ? error : new Error(String(error)));
          } catch (refreshError) {
            return Promise.reject(refreshError instanceof Error ? refreshError : new Error(String(refreshError)));
          }
        }
        return Promise.reject(error instanceof Error ? error : new Error(String(error)));
      }
    );
  } else {
    // Add request interceptor even without token manager for FormData handling
    client.interceptors.request.use(
      (reqConfig) => {
        // Handle FormData by removing Content-Type header to let browser set it automatically
        if (reqConfig.data instanceof FormData) {
          delete reqConfig.headers['Content-Type'];
        }
        return reqConfig;
      },
      (error) => Promise.reject(error instanceof Error ? error : new Error(String(error)))
    );
  }


  const request = async <T>(
    method: Method,
    url: string,
    data?: unknown,
    reqConfig?: AxiosRequestConfig
  ): Promise<{ message?: string; data: T; headers?: Record<string, string> }> => {
    try {
      // Handle FormData by removing Content-Type header to let browser set it automatically
      const requestConfig = { method, url, data, ...reqConfig };
      if (data instanceof FormData) {
        // Remove Content-Type header for FormData to let axios set it automatically with boundary
        if (requestConfig.headers) {
          delete requestConfig.headers['Content-Type'];
        }
      }
      
      const response = await client.request<T>(requestConfig);
      return {
        data: response.data,
        headers: response.headers as Record<string, string>
      };
    } catch (error: unknown) {
      // Extract and preserve error message
      if (error && typeof error === 'object' && 'response' in error) {
        const response = (error as { response?: { data: any; message: string } }).response;
        
        // Create enhanced error with server message
        if (response?.message) {
          const enhancedError = new Error(response.message);
          (enhancedError as any).originalError = error;
          (enhancedError as any).response = response;
          throw enhancedError;
        }
      }
      
      // Re-throw original error if no message extraction needed
      throw error instanceof Error ? error : new Error(String(error));
    }
  };

  return {
    get: <T>(url: string, config?: AxiosRequestConfig) =>
      request<T>('get', url, undefined, config),
    post: <T, D = unknown>(url: string, data: D, config?: AxiosRequestConfig) =>
      request<T>('post', url, data, config),
    put: <T, D = unknown>(url: string, data: D, config?: AxiosRequestConfig) =>
      request<T>('put', url, data, config),
    patch: <T, D = unknown>(url: string, data: D, config?: AxiosRequestConfig) =>
      request<T>('patch', url, data, config),
    delete: <T>(url: string, config?: AxiosRequestConfig) =>
      request<T>('delete', url, undefined, config),
  };
};
