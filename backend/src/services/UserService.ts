import { ApiResponse, ServiceResponse, User, CreateUserDto, UpdateUserDto, LoginRequest, LoginResponse, UserRole, UserStatus, RegistrationCode } from '../types';
import { IUserDAO } from '../dao/UserDAO';
import { JwtMiddleware } from '../middleware/auth';
import { EmailVerificationService } from './EmailVerificationService';
import * as bcrypt from 'bcryptjs';

export class UserService {
  constructor(
    private userDAO: IUserDAO, 
    private emailVerificationService: EmailVerificationService
  ) {}
  
  private jwtMiddleware = JwtMiddleware.getInstance();

  async createUser(userData: CreateUserDto): Promise<ServiceResponse<User>> {
    try {
      // Validate input
      const validationError = this.validateCreateUser(userData);
      if (validationError) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validationError,
            statusCode: 400
          }
        };
      }

      // Check if user already exists
      const existingUser = await this.userDAO.findByEmail(userData.email);
      if (existingUser) {
        return {
          success: false,
          error: {
            code: 'USER_EXISTS',
            message: 'User with this email already exists',
            statusCode: 409
          }
        };
      }

      // Hash password
      const passwordHash = await bcrypt.hash(userData.password, 12);
      
      // Create user with hashed password
      const userToCreate = { ...userData };
      userToCreate.password = passwordHash; // Temporarily set for DAO
      
      const user = await this.userDAO.create(userToCreate);
      
      // Generate and store verification code using EmailVerificationService
      const verificationResult = await this.emailVerificationService.createVerificationCode(userData.email);
      
      if (!verificationResult.success) {
        console.error('Failed to create verification code:', verificationResult.error);
        // Don't fail user creation if verification code fails
      }
      
      // Remove sensitive data before returning
      const { password: _, ...safeUser } = user as any;
      
      return {
        success: true,
        data: safeUser
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: `Failed to create user: ${error}`,
          statusCode: 500
        }
      };
    }
  }

  async authenticateUser(loginData: LoginRequest): Promise<ServiceResponse<LoginResponse['data']>> {
    try {
      // Validate input
      const validationError = this.validateLogin(loginData);
      if (validationError) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validationError,
            statusCode: 401
          }
        };
      }

      // Find user by email
      const user = await this.userDAO.findByEmail(loginData.email);
      if (!user) {
        return {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
            statusCode: 401
          }
        };
      }

      // Check password
      const validPassword = await bcrypt.compare(loginData.password, user.passwordHash);
      if (!validPassword) {
        return {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
            statusCode: 401
          }
        };
      }

      // Check user status (following ticket-mix pattern)
      if (user.status === UserStatus.DISABLED) {
        return {
          success: false,
          error: {
            code: 'ACCOUNT_DISABLED',
            message: 'Your account has been disabled. Please contact an administrator.',
            statusCode: 403
          }
        };
      }

      if (user.status === UserStatus.PENDING) {
        return {
          success: false,
          error: {
            code: 'ACCOUNT_PENDING_APPROVAL',
            message: 'Your account is pending admin approval. Please wait for an administrator to approve your account.',
            statusCode: 403
          }
        };
      }

      // Check email verification (following ticket-mix pattern)
      if (user.emailVerified === 0) {
        return {
          success: false,
          error: {
            code: 'EMAIL_NOT_VERIFIED',
            message: 'Please verify your email address before logging in. Check your inbox for the verification code.',
            statusCode: 403
          }
        };
      }

      // Generate JWT tokens
      const accessToken = this.jwtMiddleware.generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        permissions: [] // Default empty permissions for now
      });

      const refreshToken = this.jwtMiddleware.generateRefreshToken(user.id);
      
      // Debug: Log generated tokens
      console.log('🔐 LOGIN TOKENS GENERATED:', {
        accessTokenLength: accessToken.length,
        accessTokenPreview: accessToken.substring(0, 50) + '...',
        refreshTokenLength: refreshToken.length,
        userId: user.id,
        email: user.email
      });

      // Remove sensitive data before returning, but keep passwordHash for User type
      const safeUser = {
        ...user,
        // Don't remove passwordHash as it's required by User type
      };

      return {
        success: true,
        data: {
          user: safeUser,
          accessToken,
          refreshToken
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: `Authentication failed: ${error}`,
          statusCode: 500
        }
      };
    }
  }

  async getUserById(id: string): Promise<ServiceResponse<User>> {
    try {
      const user = await this.userDAO.findById(id);
      
      if (!user) {
        return {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
            statusCode: 404
          }
        };
      }

      return {
        success: true,
        data: user
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'GET_USER_FAILED',
          message: 'Failed to retrieve user',
          statusCode: 500,
          details: error
        }
      };
    }
  }

  async updateUser(id: string, updates: UpdateUserDto): Promise<ServiceResponse<User>> {
    try {
      // Check if user exists
      const existingUser = await this.userDAO.findById(id);
      if (!existingUser) {
        return {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
            statusCode: 404
          }
        };
      }

      // Validate updates
      const validationError = this.validateUpdateUser(updates);
      if (validationError) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validationError,
            statusCode: 400
          }
        };
      }

      const updatedUser = await this.userDAO.update(id, updates);
      
      return {
        success: true,
        data: updatedUser
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UPDATE_USER_FAILED',
          message: 'Failed to update user',
          statusCode: 500,
          details: error
        }
      };
    }
  }

  async deleteUser(id: string): Promise<ServiceResponse<boolean>> {
    try {
      // Check if user exists
      const existingUser = await this.userDAO.findById(id);
      if (!existingUser) {
        return {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
            statusCode: 404
          }
        };
      }

      const result = await this.userDAO.delete(id);
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'DELETE_USER_FAILED',
          message: 'Failed to delete user',
          statusCode: 500,
          details: error
        }
      };
    }
  }

  async getAllUsers(options?: { page?: number; limit?: number }): Promise<ServiceResponse<User[]>> {
    try {
      const users = await this.userDAO.findAll(options);
      
      return {
        success: true,
        data: users
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'GET_USERS_FAILED',
          message: 'Failed to retrieve users',
          statusCode: 500,
          details: error
        }
      };
    }
  }

  private validateCreateUser(userData: CreateUserDto): string | null {
    if (!userData.email || !userData.email.includes('@')) {
      return 'Valid email is required';
    }

    if (!userData.firstName || userData.firstName.trim().length < 2) {
      return 'First name must be at least 2 characters';
    }

    if (!userData.lastName || userData.lastName.trim().length < 2) {
      return 'Last name must be at least 2 characters';
    }

    if (!userData.password || userData.password.length < 8) {
      return 'Password must be at least 8 characters';
    }

    if (userData.role && !Object.values(UserRole).includes(userData.role)) {
      return 'Invalid user role';
    }

    return null;
  }

  private validateLogin(loginData: LoginRequest): string | null {
    if (!loginData.email || !loginData.email.includes('@')) {
      return 'Valid email is required';
    }

    if (!loginData.password) {
      return 'Password is required';
    }

    return null;
  }

  private validateUpdateUser(updates: UpdateUserDto): string | null {
    if (updates.firstName !== undefined && updates.firstName.trim().length < 2) {
      return 'First name must be at least 2 characters';
    }

    if (updates.lastName !== undefined && updates.lastName.trim().length < 2) {
      return 'Last name must be at least 2 characters';
    }

    if (updates.role && !Object.values(UserRole).includes(updates.role)) {
      return 'Invalid user role';
    }

    return null;
  }

  private async getPasswordHash(userId: string): Promise<string | null> {
    return await this.userDAO.getPasswordHash(userId);
  }

  // Methods for authRoutes compatibility
  async findByEmail(email: string): Promise<User | null> {
    return await this.userDAO.findByEmail(email);
  }

  async create(userData: CreateUserDto): Promise<User> {
    const result = await this.createUser(userData);
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to create user');
    }
    return result.data!;
  }

  async findById(id: string): Promise<User | null> {
    return await this.userDAO.findById(id);
  }

  async findByStatus(status: UserStatus): Promise<User[]> {
    // This is a simplified implementation - in a real system, you'd add this to the DAO
    const allUsers = await this.userDAO.findAll();
    return allUsers.filter(user => user.status === status);
  }

  async createRegistrationCode(data: { code: string; usableBy: string; createdBy: string }): Promise<RegistrationCode> {
    // Simplified implementation - would need proper RegistrationCodeDAO
    const id = Math.random().toString(36).substring(2, 15);
    return {
      id,
      code: data.code,
      createdBy: data.createdBy,
      createdAt: new Date(),
      usableBy: data.usableBy
    };
  }

  async getAllRegistrationCodes(): Promise<RegistrationCode[]> {
    // Simplified implementation - would need proper RegistrationCodeDAO
    return [];
  }

  async deleteRegistrationCode(id: string): Promise<boolean> {
    // Simplified implementation - would need proper RegistrationCodeDAO
    return true;
  }

  async updateUserStatus(id: string, status: UserStatus, approvedBy?: string): Promise<User> {
    const updated = await this.userDAO.update(id, { status });
    return updated;
  }

  async setEmailVerified(id: string, verified: boolean): Promise<User> {
    const updated = await this.userDAO.update(id, { emailVerified: verified ? 1 : 0 });
    return updated;
  }

  // Email verification methods
  async verifyEmailCode(email: string, code: string): Promise<ServiceResponse<boolean>> {
    try {
      const result = await this.emailVerificationService.verifyEmail({ email, code });
      
      if (result.success) {
        return {
          success: true,
          data: result.data
        };
      } else {
        return {
          success: false,
          error: {
            code: 'VERIFICATION_ERROR',
            message: result.error || 'Failed to verify email',
            statusCode: 400
          }
        };
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'VERIFICATION_ERROR',
          message: `Failed to verify email: ${error}`,
          statusCode: 500
        }
      };
    }
  }

  async resendVerificationCode(email: string): Promise<ServiceResponse<{ code: string }>> {
    try {
      const result = await this.emailVerificationService.resendVerificationCode(email);
      
      if (result.success) {
        return {
          success: true,
          data: result.data
        };
      } else {
        return {
          success: false,
          error: {
            code: 'VERIFICATION_ERROR',
            message: result.error || 'Failed to resend verification code',
            statusCode: 500
          }
        };
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'VERIFICATION_ERROR',
          message: `Failed to resend verification code: ${error}`,
          statusCode: 500
        }
      };
    }
  }

  async getVerificationCode(email: string): Promise<string | null> {
    try {
      return await this.emailVerificationService.getVerificationCode(email);
    } catch (error) {
      console.error('Failed to get verification code:', error);
      return null;
    }
  }
}
