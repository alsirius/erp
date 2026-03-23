import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Logging middleware for API requests
 * Automatically logs all API requests with timing and context
 */
export function loggingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  // Store original end function
  const originalEnd = res.end;
  
  // Override end function to log when response finishes
  res.end = function(chunk?: any, encoding?: any, cb?: any): Response {
    // Call original end function
    const result = originalEnd.call(this, chunk, encoding, cb);
    
    // Log the API request
    logger.logApiRequest(req, res, startTime);
    
    return result;
  };

  next();
}

/**
 * Error logging middleware
 * Logs all errors that occur during request processing
 */
export function errorLoggingMiddleware(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  logger.error('Request processing error', {
    error: error.message,
    stack: error.stack,
    method: req.method,
    endpoint: req.path,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.userId || 'anonymous'
  });

  next(error);
}
