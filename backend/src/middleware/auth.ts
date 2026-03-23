import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { UserRole } from '../types';
import logger from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

// Simple middleware functions (following ticket-mix pattern)
export const tokenAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = typeof authHeader === 'string' ? authHeader.split(' ')[1] : undefined;
    
    // Log token extraction for debugging
    logger.debug('Token extraction attempt', {
      hasAuthHeader: !!req.headers.authorization,
      authHeaderLength: req.headers.authorization?.length,
      hasCookie: !!req.cookies?.accessToken,
      tokenLength: token?.length,
      tokenPreview: token ? token.substring(0, 20) + '...' : 'null',
      tokenStructure: token ? token.split('.').length : 0,
      fullToken: token || 'null',
      authHeaderValue: req.headers.authorization || 'null'
    });
    
    // Temporary: Log full token details for debugging
    console.log('🔍 TOKEN DEBUG:', {
      authHeader: req.headers.authorization,
      token: token,
      tokenLength: token?.length,
      tokenStructure: token ? token.split('.').length : 'null'
    });
    
    if (!token) {
      logger.logAuth('TOKEN_MISSING', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.path
      });
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    // Validate token format before verification
    if (typeof token !== 'string' || token.split('.').length !== 3) {
      // Log token extraction for debugging
      logger.debug('Token extraction attempt', {
        hasAuthHeader: !!req.headers.authorization,
        authHeaderLength: req.headers.authorization?.length,
        hasCookie: !!req.cookies?.accessToken,
        tokenLength: token?.length,
        tokenPreview: token ? token.substring(0, 20) + '...' : 'null',
        tokenStructure: token ? token.split('.').length : 0,
        fullToken: token ? token : 'null'
      });
      return res.status(401).json({ success: false, error: 'Invalid token format' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    
    logger.logAuth('TOKEN_SUCCESS', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.path,
      userId: decoded.userId
    });

    req.user = decoded;
    next();
  } catch (error) {
    logger.logAuth('TOKEN_VERIFICATION_ERROR', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.path,
      error: (error as Error).message,
      errorName: (error as Error).constructor.name
    });
    
    // Handle specific JWT errors
    if (error instanceof Error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ success: false, error: 'Invalid token specified' });
      } else if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, error: 'Token expired' });
      } else if (error.name === 'NotBeforeError') {
        return res.status(401).json({ success: false, error: 'Token not active' });
      }
    }
    
    return res.status(401).json({ success: false, error: 'Token verification failed' });
  }
};

export const adminAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== UserRole.ADMIN) {
    logger.logAuth('ADMIN_ACCESS_DENIED', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.path,
      userRole: req.user?.role
    });
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }
  next();
};

export class JwtMiddleware {
  private static instance: JwtMiddleware;
  private jwtSecret: string;

  private constructor() {
    this.jwtSecret = process.env.JWT_SECRET!;
    if (!this.jwtSecret) {
      throw new Error('JWT_SECRET environment variable is required');
    }
  }

  public static getInstance(): JwtMiddleware {
    if (!JwtMiddleware.instance) {
      JwtMiddleware.instance = new JwtMiddleware();
    }
    return JwtMiddleware.instance;
  }

  public generateToken(payload: any): string {
    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: '1h',
      issuer: 'siriux',
      audience: 'siriux-users'
    });
  }

  public generateRefreshToken(userId: string): string {
    return jwt.sign(
      { userId, type: 'refresh' },
      this.jwtSecret,
      { expiresIn: '7d' }
    );
  }

  public verifyRefreshToken(token: string): any {
    return jwt.verify(token, this.jwtSecret);
  }
}

// Export singleton instance
export const jwtMiddleware = JwtMiddleware.getInstance();
