import { ApiResponse, ApiError, LoginRequest, LoginResponse, RegisterRequest, User } from '@/types';
import logger from '@/utils/logger';

class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  private getAuthHeaders(): Record<string, string> {
    console.log('🔍 getAuthHeaders called');
    
    if (typeof window === 'undefined') {
      console.log('❌ Window is undefined (SSR)');
      return {};
    }
    
    const rawToken = localStorage.getItem('authToken');
    console.log('🔍 Raw token from localStorage:', rawToken);
    console.log('🔍 Raw token type:', typeof rawToken);
    console.log('🔍 Raw token length:', rawToken?.length);
    
    // Check if token is the string "null"
    if (rawToken === 'null') {
      console.log('❌ Token is literally the string "null"');
      return {};
    }
    
    // Check if token is null
    if (rawToken === null) {
      console.log('❌ Token is actually null');
      return {};
    }
    
    const token = rawToken;
    console.log('✅ Using token:', token);
    console.log('✅ Token length:', token.length);
    
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    console.log('✅ Final headers:', headers);
    
    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const startTime = Date.now();
    const method = options.method || 'GET';
    
    try {
      const url = `${this.baseURL}${endpoint}`;
      const headers = {
        ...this.defaultHeaders,
        ...this.getAuthHeaders(),
        ...options.headers,
      };

      logger.debug(`API Request: ${method} ${endpoint}`, {
        url,
        method,
        headers: this.sanitizeHeaders(headers)
      });

      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();
      const duration = Date.now() - startTime;

      // Log the API request with timing
      logger.logApiRequest(endpoint, method, response.status, duration, {
        url,
        responseSize: JSON.stringify(data).length
      });

      // Handle API responses that don't follow our standard format
      if (!data.hasOwnProperty('success')) {
        // Convert legacy responses to standard format
        return {
          success: response.ok,
          data: response.ok ? data : undefined,
          error: response.ok ? undefined : data.error || 'Request failed',
          message: data.message || (response.ok ? 'Success' : 'Request failed')
        };
      }

      return data as ApiResponse<T>;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.logApiRequest(endpoint, method, 0, duration, {
        error: error instanceof Error ? error.message : 'Network error occurred',
        url: `${this.baseURL}${endpoint}`
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
        message: 'Network error occurred'
      };
    }
  }

  /**
   * Sanitize headers to remove sensitive information for logging
   */
  private sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
    const sanitized = { ...headers };
    
    // Mask authorization header
    if (sanitized.authorization) {
      sanitized.authorization = '[REDACTED]';
    }
    
    return sanitized;
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Create singleton instance
const apiClient = new ApiClient();

// Base API Service
export class BaseApiService {
  protected client = apiClient;

  protected handleError(error: any): never {
    const apiError: ApiError = {
      message: error?.error || 'An unexpected error occurred',
      status: error?.status,
      code: error?.code,
    };
    throw apiError;
  }

  protected validateResponse<T>(response: ApiResponse<T>): T {
    if (!response.success) {
      this.handleError(response);
    }
    return response.data as T;
  }
}

export default apiClient;
