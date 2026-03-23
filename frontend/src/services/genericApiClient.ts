import { ApiResponse, PaginationInfo, QueryRequest, ListResponse, DetailResponse, HttpStatus } from '../types/api';

export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
  interceptors?: {
    request?: (config: RequestInit) => RequestInit;
    response?: (response: Response) => Response;
    error?: (error: Error) => Error;
  };
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  query?: Record<string, string>;
  timeout?: number;
  signal?: AbortSignal;
}

export class GenericApiClient {
  private config: ApiClientConfig;
  private defaultHeaders: Record<string, string>;

  constructor(config: ApiClientConfig) {
    this.config = {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
      ...config,
    };
    this.defaultHeaders = this.config.headers || {};
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      query,
      timeout = this.config.timeout,
      signal,
    } = options;

    // Build URL with query parameters
    let url = `${this.config.baseURL}${endpoint}`;
    if (query) {
      const searchParams = new URLSearchParams(query);
      url += `?${searchParams.toString()}`;
    }

    // Prepare request headers
    const requestHeaders = {
      ...this.defaultHeaders,
      ...headers,
    };

    // Add auth token if available
    const token = this.getAuthToken();
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }

    // Prepare request config
    let requestConfig: RequestInit = {
      method,
      headers: requestHeaders,
      signal,
    };

    // Add body for POST/PUT/PATCH requests
    if (body && method !== 'GET' && method !== 'DELETE') {
      requestConfig.body = JSON.stringify(body);
    }

    // Apply request interceptor if configured
    if (this.config.interceptors?.request) {
      requestConfig = this.config.interceptors.request(requestConfig);
    }

    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Merge signals if provided
      if (signal) {
        signal.addEventListener('abort', () => controller.abort());
      }

      const response = await fetch(url, {
        ...requestConfig,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Apply response interceptor if configured
      let processedResponse = response;
      if (this.config.interceptors?.response) {
        processedResponse = this.config.interceptors.response(response);
      }

      // Handle different response statuses
      if (!processedResponse.ok) {
        return this.handleErrorResponse(processedResponse);
      }

      // Parse successful response
      const data = await processedResponse.json();
      return data;
    } catch (error) {
      // Apply error interceptor if configured
      let processedError = error as Error;
      if (this.config.interceptors?.error) {
        processedError = this.config.interceptors.error(processedError);
      }

      return this.handleError(processedError);
    }
  }

  // HTTP Methods
  async get<T = any>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T = any>(endpoint: string, data?: any, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body: data });
  }

  async put<T = any>(endpoint: string, data?: any, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body: data });
  }

  async patch<T = any>(endpoint: string, data?: any, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body: data });
  }

  async delete<T = any>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  // Generic CRUD Operations
  async create<T, CreateDto>(endpoint: string, data: CreateDto): Promise<ApiResponse<T>> {
    return this.post<T>(endpoint, data);
  }

  async getById<T>(endpoint: string, id: string): Promise<ApiResponse<T>> {
    return this.get<T>(`${endpoint}/${id}`);
  }

  async getAll<T>(endpoint: string, query?: QueryRequest): Promise<ApiResponse<ListResponse<T>>> {
    return this.get<ListResponse<T>>(endpoint, { query: query as any });
  }

  async update<T, UpdateDto>(endpoint: string, id: string, data: UpdateDto): Promise<ApiResponse<T>> {
    return this.put<T>(`${endpoint}/${id}`, data);
  }

  async deleteResource(endpoint: string, id: string): Promise<ApiResponse<never>> {
    return this.delete(`${endpoint}/${id}`);
  }

  // Bulk Operations
  async bulkCreate<T, CreateDto>(endpoint: string, items: CreateDto[]): Promise<ApiResponse<T[]>> {
    return this.post<T[]>(`${endpoint}/bulk`, { items });
  }

  async bulkUpdate<T, UpdateDto>(endpoint: string, updates: Array<{ id: string; data: UpdateDto }>): Promise<ApiResponse<T[]>> {
    return this.put<T[]>(`${endpoint}/bulk`, { updates });
  }

  async bulkDelete(endpoint: string, ids: string[]): Promise<ApiResponse<never>> {
    return this.request(`${endpoint}/bulk`, { 
      method: 'DELETE',
      body: { ids } 
    });
  }

  // File Upload
  async uploadFile(endpoint: string, file: File, additionalData?: Record<string, any>): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }

    const token = this.getAuthToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return this.request(endpoint, {
      method: 'POST',
      body: formData,
      headers: {
        ...headers,
        // Don't set Content-Type for FormData (browser sets it with boundary)
      },
    });
  }

  // Pagination Helper
  async getPaginated<T>(
    endpoint: string,
    page: number = 1,
    limit: number = 20,
    filters?: Record<string, any>
  ): Promise<ApiResponse<ListResponse<T>>> {
    const query: QueryRequest = {
      filters,
      pagination: { page, limit },
    };

    return this.getAll<T>(endpoint, query);
  }

  // Search Helper
  async search<T>(
    endpoint: string,
    searchQuery: string,
    searchFields?: string[],
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<ListResponse<T>>> {
    const query: QueryRequest = {
      search: {
        query: searchQuery,
        fields: searchFields,
      },
      pagination: { page, limit },
    };

    return this.getAll<T>(endpoint, query);
  }

  // Private Methods
  private getAuthToken(): string | null {
    // Try localStorage first (for client-side)
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken') || localStorage.getItem('accessToken');
    }

    // Try cookies (for SSR or server-side)
    if (typeof document !== 'undefined') {
      const cookies = document.cookie.split(';');
      const authCookie = cookies.find(cookie => cookie.trim().startsWith('authToken='));
      if (authCookie) {
        return authCookie.split('=')[1];
      }
    }

    return null;
  }

  private setAuthToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', token);
    }
  }

  private removeAuthToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('accessToken');
    }
  }

  private async handleErrorResponse(response: Response): Promise<ApiResponse<never>> {
    let errorData: any;

    try {
      errorData = await response.json();
    } catch {
      errorData = {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    // Handle specific error cases
    if (response.status === HttpStatus.UNAUTHORIZED) {
      this.removeAuthToken();
      // Optionally redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }

    return {
      success: false,
      error: errorData.error || errorData.message || 'Request failed',
      metadata: errorData.metadata || {
        status: response.status,
        statusText: response.statusText,
      },
    };
  }

  private handleError(error: Error): ApiResponse<never> {
    return {
      success: false,
      error: error.message || 'Network error occurred',
      metadata: {
        type: 'network',
        timestamp: new Date().toISOString(),
      },
    };
  }

  // Utility Methods
  setDefaultHeader(key: string, value: string): void {
    this.defaultHeaders[key] = value;
  }

  removeDefaultHeader(key: string): void {
    delete this.defaultHeaders[key];
  }

  setAuthTokenGlobal(token: string): void {
    this.setAuthToken(token);
  }

  clearAuth(): void {
    this.removeAuthToken();
  }

  // Health Check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.get('/health');
      return response.success;
    } catch {
      return false;
    }
  }
}

// Create default instance
export const createApiClient = (config: ApiClientConfig): GenericApiClient => {
  return new GenericApiClient(config);
};

// Singleton pattern for global API client
class ApiClientSingleton {
  private static instance: GenericApiClient | null = null;

  static getInstance(config?: ApiClientConfig): GenericApiClient {
    if (!this.instance && config) {
      this.instance = new GenericApiClient(config);
    }
    if (!this.instance) {
      throw new Error('ApiClient not initialized. Call getInstance with config first.');
    }
    return this.instance;
  }

  static reset(): void {
    this.instance = null;
  }
}

export default ApiClientSingleton;
