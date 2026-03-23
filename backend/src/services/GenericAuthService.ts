import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { ApiResponse, AuthenticatedUser, RequestContext, HttpStatus, ApiErrorCode } from '../types/api';

// Define User interface locally to avoid import issues
interface User {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: string;
  department?: string;
  permissions?: string[];
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
  department?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface AuthResponse {
  user: AuthenticatedUser;
  tokens: AuthTokens;
}

export class GenericAuthService {
  constructor(
    private userDAO: any, // IGenericDAO<User, any, any>,
    private sessionDAO: any, // IGenericDAO<any, any, any>,
    private jwtSecret: string,
    private jwtExpiresIn: string = '15m',
    private refreshExpiresIn: string = '30d'
  ) {}

  async login(credentials: LoginRequest, context?: RequestContext): Promise<ApiResponse<AuthResponse>> {
    try {
      // Find user by email
      const user = await this.userDAO.findById('email', credentials.email, context);
      if (!user) {
        return {
          success: false,
          error: 'Invalid credentials',
          metadata: { code: ApiErrorCode.INVALID_CREDENTIALS },
        };
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);
      if (!isPasswordValid) {
        return {
          success: false,
          error: 'Invalid credentials',
          metadata: { code: ApiErrorCode.INVALID_CREDENTIALS },
        };
      }

      // Generate tokens
      const tokens = this.generateTokens(user);

      // Store refresh token
      await this.storeRefreshToken(user.id, tokens.refreshToken, context);

      // Update last login
      await this.userDAO.update(user.id, { lastLoginAt: new Date() }, context);

      const authenticatedUser = this.mapUserToAuthenticatedUser(user);

      return {
        success: true,
        data: {
          user: authenticatedUser,
          tokens,
        },
        message: 'Login successful',
      };
    } catch (error) {
      return {
        success: false,
        error: 'Login failed',
        metadata: { code: ApiErrorCode.INTERNAL_ERROR, details: { error: (error as Error).message } },
      };
    }
  }

  async register(userData: RegisterRequest, context?: RequestContext): Promise<ApiResponse<AuthResponse>> {
    try {
      // Check if user already exists
      const existingUser = await this.userDAO.findById('email', userData.email, context);
      if (existingUser) {
        return {
          success: false,
          error: 'User already exists',
          metadata: { code: ApiErrorCode.ALREADY_EXISTS },
        };
      }

      // Hash password
      const passwordHash = await bcrypt.hash(userData.password, 12);

      // Create user
      const newUser = await this.userDAO.create({
        ...userData,
        passwordHash,
        emailVerified: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }, context);

      // Generate tokens
      const tokens = this.generateTokens(newUser);

      // Store refresh token
      await this.storeRefreshToken(newUser.id, tokens.refreshToken, context);

      const authenticatedUser = this.mapUserToAuthenticatedUser(newUser);

      return {
        success: true,
        data: {
          user: authenticatedUser,
          tokens,
        },
        message: 'Registration successful',
      };
    } catch (error) {
      return {
        success: false,
        error: 'Registration failed',
        metadata: { code: ApiErrorCode.INTERNAL_ERROR, details: { error: (error as Error).message } },
      };
    }
  }

  async refreshToken(request: RefreshTokenRequest, context?: RequestContext): Promise<ApiResponse<AuthTokens>> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(request.refreshToken, this.jwtSecret) as any;
      
      // Find session
      const session = await this.sessionDAO.findById(decoded.sessionId, context);
      if (!session || !session.isActive) {
        return {
          success: false,
          error: 'Invalid refresh token',
          metadata: { code: ApiErrorCode.INVALID_TOKEN },
        };
      }

      // Find user
      const user = await this.userDAO.findById(decoded.userId, context);
      if (!user || !user.isActive) {
        return {
          success: false,
          error: 'User not found or inactive',
          metadata: { code: ApiErrorCode.UNAUTHORIZED },
        };
      }

      // Generate new tokens
      const tokens = this.generateTokens(user);

      // Store new refresh token and invalidate old one
      await this.sessionDAO.update(decoded.sessionId, { isActive: false }, context);
      await this.storeRefreshToken(user.id, tokens.refreshToken, context);

      return {
        success: true,
        data: tokens,
        message: 'Token refreshed successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: 'Token refresh failed',
        metadata: { code: ApiErrorCode.INVALID_TOKEN, details: { error: (error as Error).message } },
      };
    }
  }

  async logout(refreshToken: string, context?: RequestContext): Promise<ApiResponse<never>> {
    try {
      // Decode token to get session info
      const decoded = jwt.verify(refreshToken, this.jwtSecret) as any;
      
      // Invalidate session
      if (decoded.sessionId) {
        await this.sessionDAO.update(decoded.sessionId, { isActive: false }, context);
      }

      return {
        success: true,
        message: 'Logout successful',
      };
    } catch (error) {
      // Even if token is invalid, logout should succeed
      return {
        success: true,
        message: 'Logout successful',
      };
    }
  }

  async changePassword(
    userId: string,
    request: ChangePasswordRequest,
    context?: RequestContext
  ): Promise<ApiResponse<never>> {
    try {
      // Validate passwords
      if (request.newPassword !== request.confirmPassword) {
        return {
          success: false,
          error: 'Passwords do not match',
          metadata: { code: ApiErrorCode.VALIDATION_FAILED },
        };
      }

      if (request.newPassword.length < 8) {
        return {
          success: false,
          error: 'Password must be at least 8 characters',
          metadata: { code: ApiErrorCode.VALIDATION_FAILED },
        };
      }

      // Get user
      const user = await this.userDAO.findById(userId, context);
      if (!user) {
        return {
          success: false,
          error: 'User not found',
          metadata: { code: ApiErrorCode.NOT_FOUND },
        };
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(request.currentPassword, user.passwordHash);
      if (!isCurrentPasswordValid) {
        return {
          success: false,
          error: 'Current password is incorrect',
          metadata: { code: ApiErrorCode.INVALID_CREDENTIALS },
        };
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(request.newPassword, 12);

      // Update password
      await this.userDAO.update(userId, { 
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
        passwordChangedAt: new Date(),
      }, context);

      // Invalidate all sessions for this user
      await this.invalidateAllUserSessions(userId, context);

      return {
        success: true,
        message: 'Password changed successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: 'Password change failed',
        metadata: { code: ApiErrorCode.INTERNAL_ERROR, details: { error: (error as Error).message } },
      };
    }
  }

  async validateToken(token: string): Promise<ApiResponse<AuthenticatedUser>> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      
      // Check if token is expired
      if (decoded.exp < Date.now() / 1000) {
        return {
          success: false,
          error: 'Token expired',
          metadata: { code: ApiErrorCode.TOKEN_EXPIRED },
        };
      }

      // Get user
      const user = await this.userDAO.findById(decoded.userId);
      if (!user || !user.isActive) {
        return {
          success: false,
          error: 'User not found or inactive',
          metadata: { code: ApiErrorCode.UNAUTHORIZED },
        };
      }

      const authenticatedUser = this.mapUserToAuthenticatedUser(user);

      return {
        success: true,
        data: authenticatedUser,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Invalid token',
        metadata: { code: ApiErrorCode.INVALID_TOKEN, details: { error: (error as Error).message } },
      };
    }
  }

  // Private helper methods
  private generateTokens(user: User): AuthTokens {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions || [],
      department: user.department,
    };

    const accessToken = jwt.sign(payload, this.jwtSecret, { expiresIn: this.jwtExpiresIn } as SignOptions);
    const refreshToken = jwt.sign(
      { userId: user.id, sessionId: this.generateSessionId() },
      this.jwtSecret,
      { expiresIn: this.refreshExpiresIn } as SignOptions
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: this.parseExpirationTime(this.jwtExpiresIn),
      tokenType: 'Bearer',
    };
  }

  private async storeRefreshToken(
    userId: string,
    refreshToken: string,
    context?: RequestContext
  ): Promise<void> {
    const sessionId = this.generateSessionId();
    const expiresAt = new Date(Date.now() + this.parseExpirationTime(this.refreshExpiresIn) * 1000);

    await this.sessionDAO.create({
      id: sessionId,
      userId,
      refreshToken,
      expiresAt,
      isActive: true,
      createdAt: new Date(),
      lastUsedAt: new Date(),
    }, context);
  }

  private async invalidateAllUserSessions(
    userId: string,
    context?: RequestContext
  ): Promise<void> {
    // This would need to be implemented in the session DAO
    // For now, we'll use a generic update approach
    const sessions = await this.sessionDAO.findAll({
      filters: { userId, isActive: true },
    }, context);

    for (const session of sessions.items) {
      await this.sessionDAO.update(session.id, { isActive: false }, context);
    }
  }

  private mapUserToAuthenticatedUser(user: User): AuthenticatedUser {
    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions || [],
      department: user.department,
    };
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private parseExpirationTime(timeString: string): number {
    // Parse time strings like '15m', '30d', '1h' into seconds
    const unit = timeString.slice(-1);
    const value = parseInt(timeString.slice(0, -1));

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      default:
        return value; // Default to seconds
    }
  }
}

export default GenericAuthService;
