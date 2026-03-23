export enum LogLevel {
  DEBUG = 'debug',
  ERRORS = 'errors', 
  BASIC = 'basic'
}

export interface LogContext {
  userId?: string;
  email?: string;
  component?: string;
  action?: string;
  endpoint?: string;
  statusCode?: number;
  duration?: number;
  userAgent?: string;
  [key: string]: any;
}

export interface SanitizedData {
  [key: string]: any;
}

class Logger {
  private logLevel: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    this.logLevel = (process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel) || LogLevel.DEBUG;
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  /**
   * Sanitize data to remove sensitive information like passwords
   */
  private sanitizeData(data: any): SanitizedData {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sensitiveFields = [
      'password',
      'passwordHash',
      'password_hash',
      'token',
      'accessToken',
      'refreshToken',
      'authorization',
      'secret',
      'key',
      'apiKey',
      'api_key'
    ];

    const sanitized: SanitizedData = Array.isArray(data) ? [...data] : { ...data };

    const sanitizeObject = (obj: any): any => {
      if (!obj || typeof obj !== 'object') return obj;

      if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      }

      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();
        
        if (sensitiveFields.some(field => lowerKey.includes(field.toLowerCase()))) {
          // For password fields, store hash if available, otherwise mask
          if (lowerKey.includes('password') && typeof value === 'string') {
            result[key] = value.length === 64 ? `[HASH:${value.substring(0, 8)}...]` : '[REDACTED]';
          } else {
            result[key] = '[REDACTED]';
          }
        } else if (typeof value === 'object' && value !== null) {
          result[key] = sanitizeObject(value);
        } else {
          result[key] = value;
        }
      }
      return result;
    };

    return sanitizeObject(sanitized);
  }

  /**
   * Should log based on current log level
   */
  private shouldLog(level: 'debug' | 'info' | 'warn' | 'error'): boolean {
    switch (this.logLevel) {
      case LogLevel.DEBUG:
        return true; // Log everything in debug mode
      case LogLevel.ERRORS:
        return level === 'error' || level === 'warn'; // Only errors and warnings
      case LogLevel.BASIC:
        return level === 'error'; // Only errors
      default:
        return false;
    }
  }

  /**
   * Format log message with context
   */
  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(this.sanitizeData(context))}` : '';
    return `[${level.toUpperCase()}] ${timestamp} ${message}${contextStr}`;
  }

  /**
   * Debug level logging - detailed information for development
   */
  debug(message: string, context?: LogContext, ...args: any[]) {
    if (!this.shouldLog('debug')) return;
    
    const formattedMessage = this.formatMessage('debug', message, context);
    console.log(formattedMessage, ...args.map(arg => this.sanitizeData(arg)));
  }

  /**
   * Info level logging - general information and usage patterns
   */
  info(message: string, context?: LogContext, ...args: any[]) {
    if (!this.shouldLog('info')) return;
    
    const formattedMessage = this.formatMessage('info', message, context);
    console.log(formattedMessage, ...args.map(arg => this.sanitizeData(arg)));
  }

  /**
   * Warning level logging - important events
   */
  warn(message: string, context?: LogContext, ...args: any[]) {
    if (!this.shouldLog('warn')) return;
    
    const formattedMessage = this.formatMessage('warn', message, context);
    console.warn(formattedMessage, ...args.map(arg => this.sanitizeData(arg)));
  }

  /**
   * Error level logging - errors and critical events
   */
  error(message: string, context?: LogContext, ...args: any[]) {
    if (!this.shouldLog('error')) return;
    
    const formattedMessage = this.formatMessage('error', message, context);
    console.error(formattedMessage, ...args.map(arg => this.sanitizeData(arg)));
  }

  /**
   * API request logging for usage patterns
   */
  logApiRequest(endpoint: string, method: string, statusCode: number, duration: number, context?: LogContext) {
    const apiContext: LogContext = {
      method,
      endpoint,
      statusCode,
      duration,
      userAgent: navigator.userAgent,
      ...context
    };

    // Log based on status code and log level
    if (statusCode >= 400) {
      this.error(`API Request Failed: ${method} ${endpoint}`, apiContext);
    } else if (this.logLevel === LogLevel.DEBUG) {
      this.debug(`API Request: ${method} ${endpoint}`, apiContext);
    } else if (this.logLevel === LogLevel.ERRORS) {
      this.info(`API Request: ${method} ${endpoint}`, apiContext);
    }
  }

  /**
   * Authentication events logging
   */
  logAuth(event: string, context: LogContext) {
    const authContext = {
      ...context,
      event: `AUTH:${event}`
    };

    if (event.includes('FAILED') || event.includes('ERROR')) {
      this.error(`Authentication ${event}`, authContext);
    } else {
      this.info(`Authentication ${event}`, authContext);
    }
  }

  /**
   * User action logging for usage patterns
   */
  logUserAction(action: string, component: string, context?: LogContext) {
    const userContext = {
      ...context,
      component,
      action: `USER_ACTION:${action}`
    };

    if (this.logLevel === LogLevel.DEBUG) {
      this.debug(`User Action: ${action} in ${component}`, userContext);
    } else if (this.logLevel === LogLevel.ERRORS) {
      this.info(`User Action: ${action} in ${component}`, userContext);
    }
  }

  /**
   * Component lifecycle logging
   */
  logComponent(event: string, component: string, context?: LogContext) {
    const componentContext = {
      ...context,
      component,
      event: `COMPONENT:${event}`
    };

    if (this.logLevel === LogLevel.DEBUG) {
      this.debug(`Component ${event}: ${component}`, componentContext);
    }
  }

  /**
   * Form interaction logging
   */
  logForm(action: string, formName: string, context?: LogContext) {
    const formContext = {
      ...context,
      formName,
      action: `FORM:${action}`
    };

    if (this.logLevel === LogLevel.DEBUG) {
      this.debug(`Form ${action}: ${formName}`, formContext);
    } else if (action.includes('ERROR') || action.includes('FAILED')) {
      this.error(`Form ${action}: ${formName}`, formContext);
    }
  }

  /**
   * Performance logging
   */
  logPerformance(operation: string, duration: number, context?: LogContext) {
    const perfContext = {
      ...context,
      operation,
      duration,
      event: `PERFORMANCE:${operation}`
    };

    if (duration > 1000) { // Slow operations
      this.warn(`Slow operation: ${operation} took ${duration}ms`, perfContext);
    } else if (this.logLevel === LogLevel.DEBUG) {
      this.debug(`Performance: ${operation} took ${duration}ms`, perfContext);
    }
  }

  /**
   * Get current log level
   */
  getLogLevel(): LogLevel {
    return this.logLevel;
  }

  /**
   * Set log level (for runtime changes)
   */
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
    this.info(`Log level changed to: ${level}`);
  }
}

export default new Logger();
