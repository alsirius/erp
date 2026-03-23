import { Request, Response, NextFunction } from 'express';
import { ApiResponse, ResponseBuilder, ApiErrorCode, HttpStatus, RequestContext } from '../types/api';

export interface ErrorContext {
  requestId: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  timestamp: string;
  path: string;
  method: string;
}

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
  isOperational?: boolean;
  context?: RequestContext;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  
  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  public handleError(error: AppError, req?: Request): ApiResponse<never> {
    const errorContext = this.buildErrorContext(error, req);
    
    // Log the error
    this.logError(error, errorContext);
    
    // Build appropriate response based on error type
    if (error.isOperational) {
      return ResponseBuilder.error(
        (error.code as ApiErrorCode) || ApiErrorCode.INTERNAL_ERROR,
        error.message,
        {
          ...error.details,
          requestId: errorContext.requestId,
          timestamp: errorContext.timestamp,
        }
      );
    } else {
      // Unexpected error - don't leak details
      return ResponseBuilder.error(
        ApiErrorCode.INTERNAL_ERROR,
        'An unexpected error occurred',
        {
          requestId: errorContext.requestId,
          timestamp: errorContext.timestamp,
        }
      );
    }
  }

  public middleware() {
    return (error: AppError, req: Request, res: Response, next: NextFunction) => {
      // Don't send response if headers already sent
      if (res.headersSent) {
        return next(error);
      }

      const errorResponse = this.handleError(error, req);
      
      res.status(error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse);
    };
  }

  public asyncHandler() {
    return (req: Request, res: Response) => {
      const errorResponse = ResponseBuilder.error(
        ApiErrorCode.NOT_FOUND,
        'Route not found',
        {
          requestId: this.generateRequestId(),
          timestamp: new Date().toISOString(),
        }
      );
      
      res.status(HttpStatus.NOT_FOUND).json(errorResponse);
    };
  }

  public validationHandler() {
    return (req: Request, res: Response) => {
      const errorResponse = ResponseBuilder.error(
        ApiErrorCode.VALIDATION_FAILED,
        'Validation failed',
        {
          requestId: this.generateRequestId(),
          timestamp: new Date().toISOString(),
        }
      );
      
      res.status(HttpStatus.UNPROCESSABLE_ENTITY).json(errorResponse);
    };
  }

  private buildErrorContext(error: AppError, req?: Request): ErrorContext {
    return {
      requestId: Array.isArray(req?.headers['x-request-id']) 
        ? req?.headers['x-request-id'][0] || this.generateRequestId()
        : req?.headers['x-request-id'] || this.generateRequestId(),
      userId: (req as any)?.user?.userId,
      ip: req?.ip,
      userAgent: req?.get('User-Agent'),
      timestamp: new Date().toISOString(),
      path: req?.path || '',
      method: req?.method || '',
    };
  }

  private generateRequestId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private logError(error: AppError, context: ErrorContext): void {
    // In production, you might want to log to external service
    if (process.env.NODE_ENV === 'production') {
      // Log to external service like Sentry, LogRocket, etc.
      console.error(JSON.stringify({
        error: {
          message: error.message,
          stack: error.stack,
          code: error.code,
        },
        context,
        timestamp: new Date().toISOString(),
      }));
    } else {
      // Development logging
      console.error('Error:', error.message);
      console.error('Stack:', error.stack);
      console.error('Context:', context);
    }
  }

  // Utility methods for creating specific error types
  public static createValidationError(message: string, field?: string, value?: any): AppError {
    const error = new Error(message) as AppError;
    error.code = ApiErrorCode.VALIDATION_FAILED;
    error.statusCode = HttpStatus.UNPROCESSABLE_ENTITY;
    error.isOperational = true;
    error.details = field ? { field, value } : { value };
    return error;
  }

  public static createNotFoundError(message: string = 'Resource not found'): AppError {
    const error = new Error(message) as AppError;
    error.code = ApiErrorCode.NOT_FOUND;
    error.statusCode = HttpStatus.NOT_FOUND;
    error.isOperational = true;
    return error;
  }

  public static createUnauthorizedError(message: string = 'Unauthorized'): AppError {
    const error = new Error(message) as AppError;
    error.code = ApiErrorCode.UNAUTHORIZED;
    error.statusCode = HttpStatus.UNAUTHORIZED;
    error.isOperational = true;
    return error;
  }

  public static createForbiddenError(message: string = 'Forbidden'): AppError {
    const error = new Error(message) as AppError;
    error.code = ApiErrorCode.FORBIDDEN;
    error.statusCode = HttpStatus.FORBIDDEN;
    error.isOperational = true;
    return error;
  }

  public static createConflictError(message: string = 'Resource conflict'): AppError {
    const error = new Error(message) as AppError;
    error.code = ApiErrorCode.RESOURCE_CONFLICT;
    error.statusCode = HttpStatus.CONFLICT;
    error.isOperational = true;
    return error;
  }

  public static createInternalServerError(message?: string, details?: any): AppError {
    const error = new Error(message || 'Internal server error') as AppError;
    error.code = ApiErrorCode.INTERNAL_ERROR;
    error.statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    error.isOperational = false; // Not operational - unexpected error
    error.details = details;
    return error;
  }
}

export default ErrorHandler;
