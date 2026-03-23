// Generic API Types for Flexible Request/Response Handling

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: PaginationInfo;
  metadata?: Record<string, any>;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
  path?: string;
}

export interface ApiRequest {
  method: string;
  path: string;
  headers: Record<string, string>;
  body?: any;
  query?: Record<string, string>;
  params?: Record<string, string>;
  user?: AuthenticatedUser;
  requestId?: string;
  timestamp: string;
}

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
  department?: string;
}

// Generic Request DTOs
export interface CreateRequest<T> {
  data: T;
  metadata?: Record<string, any>;
}

export interface UpdateRequest<T> {
  data: Partial<T>;
  metadata?: Record<string, any>;
}

export interface QueryRequest {
  filters?: Record<string, any>;
  sort?: Record<string, 'asc' | 'desc'>;
  pagination?: {
    page?: number;
    limit?: number;
  };
  search?: {
    query?: string;
    fields?: string[];
  };
}

export interface BulkRequest<T> {
  items: T[];
  options?: {
    validateAll?: boolean;
    stopOnFirstError?: boolean;
  };
}

// Response Wrappers
export interface ListResponse<T> {
  items: T[];
  pagination: PaginationInfo;
  filters?: Record<string, any>;
}

export interface DetailResponse<T> {
  item: T;
  related?: Record<string, any>;
}

export interface ActionResponse {
  success: boolean;
  message?: string;
  affected?: number;
  data?: any;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

export interface ValidationResponse {
  success: boolean;
  errors: ValidationError[];
  data?: any;
}

// HTTP Status Codes
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
}

// API Error Codes
export enum ApiErrorCode {
  // Validation Errors
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Authentication Errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  
  // Authorization Errors
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // Resource Errors
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  
  // Server Errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  
  // Business Logic Errors
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}

// Request Context
export interface RequestContext {
  request: ApiRequest;
  user?: AuthenticatedUser;
  startTime: number;
  requestId: string;
  correlationId?: string;
  ip?: string;
  userAgent?: string;
}

// Response Builder
export class ResponseBuilder {
  static success<T>(data: T, message?: string): ApiResponse<T> {
    return {
      success: true,
      data,
      message,
    };
  }

  static successWithPagination<T>(
    data: T[],
    pagination: PaginationInfo,
    message?: string
  ): ApiResponse<ListResponse<T>> {
    return {
      success: true,
      data: {
        items: data,
        pagination,
      },
      message,
    };
  }

  static error(
    code: ApiErrorCode,
    message: string,
    details?: Record<string, any>
  ): ApiResponse<never> {
    return {
      success: false,
      error: message,
      metadata: {
        code,
        details,
        timestamp: new Date().toISOString(),
      },
    };
  }

  static validationError(errors: ValidationError[]): ApiResponse<never> {
    return {
      success: false,
      error: 'Validation failed',
      metadata: {
        code: ApiErrorCode.VALIDATION_FAILED,
        errors,
        timestamp: new Date().toISOString(),
      },
    };
  }

  static created<T>(data: T, message?: string): ApiResponse<T> {
    return {
      success: true,
      data,
      message: message || 'Resource created successfully',
    };
  }

  static updated<T>(data: T, message?: string): ApiResponse<T> {
    return {
      success: true,
      data,
      message: message || 'Resource updated successfully',
    };
  }

  static deleted(message?: string): ApiResponse<never> {
    return {
      success: true,
      message: message || 'Resource deleted successfully',
    };
  }
}

// Generic Controller Interface
export interface IGenericController<T, CreateDto, UpdateDto> {
  create(req: ApiRequest, res: ApiResponse<CreateRequest<CreateDto>>): Promise<void>;
  getById(req: ApiRequest, res: ApiResponse<DetailResponse<T>>): Promise<void>;
  getAll(req: ApiRequest, res: ApiResponse<ListResponse<T>>): Promise<void>;
  update(req: ApiRequest, res: ApiResponse<UpdateRequest<UpdateDto>>): Promise<void>;
  delete(req: ApiRequest, res: ApiResponse<ActionResponse>): Promise<void>;
  bulkCreate(req: ApiRequest, res: ApiResponse<BulkRequest<CreateDto>>): Promise<void>;
  bulkUpdate(req: ApiRequest, res: ApiResponse<BulkRequest<UpdateDto>>): Promise<void>;
  bulkDelete(req: ApiRequest, res: ApiResponse<ActionResponse>): Promise<void>;
}

// Generic Service Interface
export interface IGenericService<T, CreateDto, UpdateDto> {
  create(data: CreateDto, context?: RequestContext): Promise<T>;
  findById(id: string, context?: RequestContext): Promise<T | null>;
  findAll(query: QueryRequest, context?: RequestContext): Promise<ListResponse<T>>;
  update(id: string, data: UpdateDto, context?: RequestContext): Promise<T>;
  delete(id: string, context?: RequestContext): Promise<boolean>;
  bulkCreate(items: CreateDto[], context?: RequestContext): Promise<T[]>;
  bulkUpdate(updates: Array<{ id: string; data: UpdateDto }>, context?: RequestContext): Promise<T[]>;
  bulkDelete(ids: string[], context?: RequestContext): Promise<number>;
  count(query?: QueryRequest, context?: RequestContext): Promise<number>;
}

// Middleware Types
export interface AuthMiddlewareOptions {
  required?: boolean;
  roles?: string[];
  permissions?: string[];
  skipPaths?: string[];
}

export interface ValidationMiddlewareOptions {
  schema: any; // Joi schema or similar
  source?: 'body' | 'query' | 'params';
  strict?: boolean;
}

export interface RateLimitMiddlewareOptions {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: ApiRequest) => string;
}

// All types are already exported with interface/type declarations
// No additional export statements needed at the bottom
