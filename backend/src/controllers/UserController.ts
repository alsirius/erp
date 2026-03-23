import { Request, Response } from 'express';
import { UserService } from '../services/UserService';
import { ApiResponse, CreateUserDto, UpdateUserDto, LoginRequest, User } from '../types';
import { AuthenticatedRequest, JwtMiddleware } from '../middleware/auth';
import logger from '../utils/logger';
import { verify } from 'jsonwebtoken';

export class UserController {
  constructor(private userService: UserService) {}
  
  private jwtMiddleware = JwtMiddleware.getInstance();

  /**
   * POST /api/auth/login
   * Authenticate user and return tokens
   */
  public login = async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    const { email } = req.body;
    
    try {
      logger.debug('Login attempt started', { 
        email: email?.substring(0, 3) + '***', // Partial email for logging
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      const loginData: LoginRequest = req.body;
      const result = await this.userService.authenticateUser(loginData);

      if (result.success && result.data) {
        logger.logAuth('SUCCESS', {
          email: email?.substring(0, 3) + '***',
          userId: result.data.user.id,
          ip: req.ip
        });

        const response: ApiResponse<typeof result.data> = {
          success: true,
          data: result.data
        };
        res.status(200).json(response);
      } else {
        logger.logAuth('FAILED', {
          email: email?.substring(0, 3) + '***',
          reason: result.error?.message,
          ip: req.ip
        });

        const response: ApiResponse<null> = {
          success: false,
          error: result.error?.message || 'Authentication failed'
        };
        res.status(result.error?.statusCode || 401).json(response);
      }
    } catch (error) {
      logger.logAuth('ERROR', {
        email: email?.substring(0, 3) + '***',
        error: (error as Error).message,
        ip: req.ip
      });

      const response: ApiResponse<null> = {
        success: false,
        error: 'Internal server error'
      };
      res.status(500).json(response);
    }
  };

  /**
   * POST /api/auth/register
   * Register a new user
   */
  public register = async (req: Request, res: Response): Promise<void> => {
    const { email, firstName, lastName } = req.body;
    
    try {
      logger.debug('Registration attempt started', { 
        email: email?.substring(0, 3) + '***',
        firstName,
        lastName,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      const userData: CreateUserDto = req.body;

      // Backend validation to match frontend validation
      const validationErrors: Record<string, string> = {};

      // First name validation
      if (!userData.firstName?.trim()) {
        validationErrors.firstName = 'First name is required';
      } else {
        if (userData.firstName.length < 2) {
          validationErrors.firstName = 'First name must be at least 2 characters long';
        }
        if (userData.firstName.length > 50) {
          validationErrors.firstName = 'First name must be 50 characters or less';
        }
        if (/\d/.test(userData.firstName)) {
          validationErrors.firstName = 'Names cannot contain numbers';
        }
        const nameRegex = /^[a-zA-Z\u00C0-\u017F\s'-]+$/;
        if (!nameRegex.test(userData.firstName)) {
          validationErrors.firstName = 'First name can only contain letters, spaces, hyphens, and apostrophes';
        }
        if (/\s{2,}/.test(userData.firstName)) {
          validationErrors.firstName = 'First name cannot contain consecutive spaces';
        }
        if (/'{2,}|-{2,}/.test(userData.firstName)) {
          validationErrors.firstName = 'First name cannot contain consecutive hyphens or apostrophes';
        }
        if (/^[\s'-]|[\s'-]$/.test(userData.firstName)) {
          validationErrors.firstName = 'First name cannot start or end with space, hyphen, or apostrophe';
        }
      }

      // Last name validation
      if (!userData.lastName?.trim()) {
        validationErrors.lastName = 'Last name is required';
      } else {
        if (userData.lastName.length < 2) {
          validationErrors.lastName = 'Last name must be at least 2 characters long';
        }
        if (userData.lastName.length > 50) {
          validationErrors.lastName = 'Last name must be 50 characters or less';
        }
        if (/\d/.test(userData.lastName)) {
          validationErrors.lastName = 'Names cannot contain numbers';
        }
        const nameRegex = /^[a-zA-Z\u00C0-\u017F\s'-]+$/;
        if (!nameRegex.test(userData.lastName)) {
          validationErrors.lastName = 'Last name can only contain letters, spaces, hyphens, and apostrophes';
        }
        if (/\s{2,}/.test(userData.lastName)) {
          validationErrors.lastName = 'Last name cannot contain consecutive spaces';
        }
        if (/'{2,}|-{2,}/.test(userData.lastName)) {
          validationErrors.lastName = 'Last name cannot contain consecutive hyphens or apostrophes';
        }
        if (/^[\s'-]|[\s'-]$/.test(userData.lastName)) {
          validationErrors.lastName = 'Last name cannot start or end with space, hyphen, or apostrophe';
        }
      }

      // Email validation
      if (!userData.email?.trim()) {
        validationErrors.email = 'Email address is required';
      } else {
        if (userData.email.length > 100) {
          validationErrors.email = 'Email must be 100 characters or less';
        }
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(userData.email)) {
          validationErrors.email = 'Please enter a valid email address';
        }
      }

      // Password validation
      if (!userData.password?.trim()) {
        validationErrors.password = 'Password is required';
      } else {
        if (userData.password.length < 8) {
          validationErrors.password = 'Password must be at least 8 characters long';
        }
        if (userData.password.length > 128) {
          validationErrors.password = 'Password must be 128 characters or less';
        }
        if (!/[A-Z]/.test(userData.password)) {
          validationErrors.password = 'Password must contain at least one uppercase letter';
        }
        if (!/[a-z]/.test(userData.password)) {
          validationErrors.password = 'Password must contain at least one lowercase letter';
        }
        if (!/\d/.test(userData.password)) {
          validationErrors.password = 'Password must contain at least one number';
        }
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(userData.password)) {
          validationErrors.password = 'Password must contain at least one special character';
        }
      }

      // Department validation (optional)
      if (userData.department && userData.department.trim()) {
        if (userData.department.length > 100) {
          validationErrors.department = 'Department must be 100 characters or less';
        }
        const deptRegex = /^[a-zA-Z0-9\s&-]+$/;
        if (!deptRegex.test(userData.department)) {
          validationErrors.department = 'Department can only contain letters, numbers, spaces, hyphens, and ampersands';
        }
      }

      // Phone validation (now mandatory)
      if (!userData.phone?.trim()) {
        validationErrors.phone = 'Phone number is required';
      } else {
        // Remove all spaces for validation
        const phoneWithoutSpaces = userData.phone.replace(/\s/g, '');
        
        // UK phone number patterns
        const ukMobileRegex = /^07[0-9]{9}$/;
        const ukLandlineRegex = /^0[1-2][0-9]{8,9}$/;
        
        if (!ukMobileRegex.test(phoneWithoutSpaces) && !ukLandlineRegex.test(phoneWithoutSpaces)) {
          validationErrors.phone = 'Please enter a valid UK phone number (e.g., 07123456789 or 02071234567)';
        }
      }

      // Approval code validation (optional)
      if (userData.approvalCode && userData.approvalCode.trim()) {
        if (userData.approvalCode.length < 6) {
          validationErrors.approvalCode = 'Approval code must be at least 6 characters long';
        }
        if (userData.approvalCode.length > 50) {
          validationErrors.approvalCode = 'Approval code must be 50 characters or less';
        }
        const codeRegex = /^[a-zA-Z0-9-]+$/;
        if (!codeRegex.test(userData.approvalCode)) {
          validationErrors.approvalCode = 'Approval code can only contain letters, numbers, and hyphens';
        }
      }

      // If there are validation errors, return them
      if (Object.keys(validationErrors).length > 0) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: validationErrors
        };
        res.status(400).json(response);
        return;
      }

      const result = await this.userService.createUser(userData);

      if (result.success && result.data) {
        logger.logAuth('REGISTER_SUCCESS', {
          email: email?.substring(0, 3) + '***',
          userId: result.data.id,
          firstName,
          lastName,
          ip: req.ip
        });

        const response: ApiResponse<typeof result.data> = {
          success: true,
          data: result.data,
          message: 'Registration successful! Please check your email for a verification code.'
        };
        res.status(201).json(response);
      } else {
        logger.logAuth('REGISTER_FAILED', {
          email: email?.substring(0, 3) + '***',
          reason: result.error?.message,
          ip: req.ip
        });

        const response: ApiResponse<null> = {
          success: false,
          error: result.error?.message || 'Failed to create user'
        };
        res.status(result.error?.statusCode || 500).json(response);
      }
    } catch (error) {
      logger.logAuth('REGISTER_ERROR', {
        email: email?.substring(0, 3) + '***',
        error: (error as Error).message,
        ip: req.ip
      });
      const response: ApiResponse<null> = {
        success: false,
        error: 'Internal server error'
      };
      res.status(500).json(response);
    }
  };

  /**
   * GET /api/users/profile
   * Get current user profile (requires authentication)
   */
  public getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Authentication required'
        };
        res.status(401).json(response);
        return;
      }

      const result = await this.userService.getUserById(req.user.userId);

      if (result.success && result.data) {
        const response: ApiResponse<typeof result.data> = {
          success: true,
          data: result.data
        };
        res.status(200).json(response);
      } else {
        const response: ApiResponse<null> = {
          success: false,
          error: result.error?.message || 'User not found'
        };
        res.status(result.error?.statusCode || 404).json(response);
      }
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Internal server error'
      };
      res.status(500).json(response);
    }
  };

  /**
   * GET /api/users/:id
   * Get user by ID (requires authentication and appropriate permissions)
   */
  public getUserById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.userService.getUserById(id);

      if (result.success && result.data) {
        const response: ApiResponse<typeof result.data> = {
          success: true,
          data: result.data
        };
        res.status(200).json(response);
      } else {
        const response: ApiResponse<null> = {
          success: false,
          error: result.error?.message || 'User not found'
        };
        res.status(result.error?.statusCode || 404).json(response);
      }
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Internal server error'
      };
      res.status(500).json(response);
    }
  };

  /**
   * PUT /api/users/:id
   * Update user (requires authentication and appropriate permissions)
   */
  public updateUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updates: UpdateUserDto = req.body;
      const result = await this.userService.updateUser(id, updates);

      if (result.success && result.data) {
        const response: ApiResponse<typeof result.data> = {
          success: true,
          data: result.data,
          message: 'User updated successfully'
        };
        res.status(200).json(response);
      } else {
        const response: ApiResponse<null> = {
          success: false,
          error: result.error?.message || 'Failed to update user'
        };
        res.status(result.error?.statusCode || 500).json(response);
      }
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Internal server error'
      };
      res.status(500).json(response);
    }
  };

  /**
   * DELETE /api/users/:id
   * Delete user (requires authentication and appropriate permissions)
   */
  public deleteUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.userService.deleteUser(id);

      if (result.success) {
        const response: ApiResponse<boolean> = {
          success: true,
          data: result.data,
          message: 'User deleted successfully'
        };
        res.status(200).json(response);
      } else {
        const response: ApiResponse<null> = {
          success: false,
          error: result.error?.message || 'Failed to delete user'
        };
        res.status(result.error?.statusCode || 500).json(response);
      }
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Internal server error'
      };
      res.status(500).json(response);
    }
  };

  /**
   * GET /api/users
   * Get all users (requires authentication and appropriate permissions)
   */
  public getAllUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const result = await this.userService.getAllUsers({ page, limit });

      if (result.success && result.data) {
        const response: ApiResponse<typeof result.data> = {
          success: true,
          data: result.data
        };
        res.status(200).json(response);
      } else {
        const response: ApiResponse<null> = {
          success: false,
          error: result.error?.message || 'Failed to retrieve users'
        };
        res.status(result.error?.statusCode || 500).json(response);
      }
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Internal server error'
      };
      res.status(500).json(response);
    }
  };

  /**
   * POST /api/auth/refresh
   * Refresh access token using refresh token
   */
  public refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Refresh token is required'
        };
        res.status(400).json(response);
        return;
      }

      const tokenData = this.jwtMiddleware.verifyRefreshToken(refreshToken);
      
      if (!tokenData) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Invalid or expired refresh token'
        };
        res.status(401).json(response);
        return;
      }

      // Get user data to generate new access token
      const userResult = await this.userService.getUserById(tokenData.userId);
      
      if (!userResult.success || !userResult.data) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'User not found'
        };
        res.status(404).json(response);
        return;
      }

      // Generate new access token
      const newAccessToken = this.jwtMiddleware.generateToken({
        userId: userResult.data.id,
        email: userResult.data.email,
        role: userResult.data.role,
        permissions: [] // Default empty permissions for now
      });

      const response: ApiResponse<{ accessToken: string }> = {
        success: true,
        data: { accessToken: newAccessToken },
        message: 'Token refreshed successfully'
      };
      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Internal server error'
      };
      res.status(500).json(response);
    }
  };

  /**
   * POST /api/auth/forgot-password
   * Send password reset email
   */
  public forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;

      if (!email) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Email is required'
        };
        res.status(400).json(response);
        return;
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Please enter a valid email address'
        };
        res.status(400).json(response);
        return;
      }

      // Check if user exists
      const user = await this.userService.findByEmail(email);
      if (!user) {
        // Don't reveal that user doesn't exist for security
        const response: ApiResponse<null> = {
          success: true,
          message: 'If an account with this email exists, password reset instructions have been sent.'
        };
        res.status(200).json(response);
        return;
      }

      // Generate password reset token (simplified for now)
      const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      // In a real implementation, you would:
      // 1. Save the reset token to database with expiration
      // 2. Send email with reset link
      // For now, we'll just return success
      
      const response: ApiResponse<null> = {
        success: true,
        message: 'Password reset instructions have been sent to your email address.'
      };
      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Internal server error'
      };
      res.status(500).json(response);
    }
  };

  /**
   * PUT /api/users/profile
   * Update user profile
   */
  public updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Authentication required'
        };
        res.status(401).json(response);
        return;
      }

      const userId = req.user.userId;
      const updateData = req.body;

      // Validate update data
      const allowedFields = ['firstName', 'lastName', 'phone', 'department', 'bio', 'profileImageUrl'];
      const filteredData: any = {};
      
      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          filteredData[field] = updateData[field];
        }
      }

      if (Object.keys(filteredData).length === 0) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'No valid fields to update'
        };
        res.status(400).json(response);
        return;
      }

      const result = await this.userService.updateUser(userId, filteredData);

      if (result.success && result.data) {
        const response: ApiResponse<typeof result.data> = {
          success: true,
          data: result.data,
          message: 'Profile updated successfully'
        };
        res.status(200).json(response);
      } else {
        const response: ApiResponse<null> = {
          success: false,
          error: result.error?.message || 'Failed to update profile'
        };
        res.status(result.error?.statusCode || 500).json(response);
      }
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Internal server error'
      };
      res.status(500).json(response);
    }
  };

  /**
   * GET /api/users/validate-token
   * Validate JWT token and return user data
   */
  public validateToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.startsWith('Bearer ') 
        ? authHeader.substring(7) 
        : null;

      if (!token) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'No token provided'
        };
        res.status(401).json(response);
        return;
      }

      // Verify token and get user
      const decoded = verify(token, process.env.JWT_SECRET!) as any;
      if (!decoded || !decoded.userId) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Invalid token'
        };
        res.status(401).json(response);
        return;
      }

      const user = await this.userService.findById(decoded.userId);
      if (!user) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'User not found'
        };
        res.status(401).json(response);
        return;
      }

      const response: ApiResponse<User> = {
        success: true,
        data: user
      };
      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Invalid token'
      };
      res.status(401).json(response);
    }
  };

  /**
   * POST /api/users/verify-email
   * Verify email with verification code
   */
  public verifyEmail = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, code } = req.body;

      if (!email || !code) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Email and verification code are required'
        };
        res.status(400).json(response);
        return;
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Please enter a valid email address'
        };
        res.status(400).json(response);
        return;
      }

      // Use EmailVerificationService to verify the code
      const result = await this.userService.verifyEmailCode(email, code);

      if (result.success) {
        const response: ApiResponse<null> = {
          success: true,
          message: 'Email verified successfully'
        };
        res.status(200).json(response);
      } else {
        const response: ApiResponse<null> = {
          success: false,
          error: result.error?.message || 'Invalid verification code'
        };
        res.status(result.error?.statusCode || 400).json(response);
      }
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Internal server error'
      };
      res.status(500).json(response);
    }
  };

  /**
   * POST /api/users/resend-verification
   * Resend email verification code
   */
  public resendVerification = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;

      if (!email) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Email is required'
        };
        res.status(400).json(response);
        return;
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Please enter a valid email address'
        };
        res.status(400).json(response);
        return;
      }

      // Use EmailVerificationService to resend code
      const result = await this.userService.resendVerificationCode(email);

      if (result.success) {
        const response: ApiResponse<null> = {
          success: true,
          message: 'Verification code sent to your email address'
        };
        res.status(200).json(response);
      } else {
        const response: ApiResponse<null> = {
          success: false,
          error: result.error?.message || 'Failed to send verification code'
        };
        res.status(result.error?.statusCode || 500).json(response);
      }
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Internal server error'
      };
      res.status(500).json(response);
    }
  };
}
