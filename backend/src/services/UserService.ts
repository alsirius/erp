import { ApiResponse, ServiceResponse, AppError } from '../types';
import { RequestContext } from '../types/api';
import { User, CreateUserDto, UpdateUserDto, ChangePasswordDto, DisableAccountDto, UserFilters, UserProfileResponse } from '../entities/User';
import { IUserDAO } from '../dao/UserDAO';
import { JwtMiddleware } from '../middleware/auth';
import { EmailVerificationService } from './EmailVerificationService';
import * as bcrypt from 'bcryptjs';

// Define LoginRequest interface
interface LoginRequest {
  email: string;
  password: string;
}

export class UserService {
  constructor(
    private userDAO: IUserDAO, 
    private emailVerificationService: EmailVerificationService
  ) {}
  
  private jwtMiddleware = JwtMiddleware.getInstance();

  // Basic authentication method
  async authenticateUser(loginData: LoginRequest): Promise<ServiceResponse<{user: User; token: string}>> {
    try {
      if (!loginData.email || !loginData.password) {
        return {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Email and password are required',
            statusCode: 400
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

      // Check if user is active
      if (user.status !== 'active') {
        return {
          success: false,
          error: {
            code: 'ACCOUNT_DISABLED',
            message: 'Account is not active',
            statusCode: 403
          }
        };
      }

      // Verify password (using bcrypt comparison)
      const bcrypt = require('bcryptjs');
      const isPasswordValid = await bcrypt.compare(loginData.password, user.passwordHash);
      
      if (!isPasswordValid) {
        return {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
            statusCode: 401
          }
        };
      }

      // Generate JWT token
      const token = this.jwtMiddleware.generateToken({
        userId: user.id,
        email: user.email,
        role: user.role
      });

      return {
        success: true,
        data: {
          user,
          token
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: `Authentication failed: ${(error as Error).message}`,
          statusCode: 500
        }
      };
    }
  }

  // Profile management methods
  async getUserProfile(userId: string, context?: RequestContext): Promise<ServiceResponse<UserProfileResponse>> {
    try {
      if (!userId) {
        return {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'User ID is required',
            statusCode: 400
          }
        };
      }

      const userProfile = await this.userDAO.getUserProfile(userId);
      if (!userProfile) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'User not found',
            statusCode: 404
          }
        };
      }

      return {
        success: true,
        data: userProfile
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: `Failed to get user profile: ${(error as Error).message}`,
          statusCode: 500
        }
      };
    }
  }

  async updateProfile(userId: string, updates: UpdateUserDto, context?: RequestContext): Promise<ServiceResponse<User>> {
    try {
      if (!userId) {
        return {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'User ID is required',
            statusCode: 400
          }
        };
      }

      // Validate updates
      const validationError = this.validateUpdateProfile(updates);
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

      // Check if user exists
      const existingUser = await this.userDAO.findById(userId);
      if (!existingUser) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'User not found',
            statusCode: 404
          }
        };
      }

      // Check if email is being updated and if it's already taken
      if (updates.email && updates.email !== existingUser.email) {
        const emailUser = await this.userDAO.findByEmail(updates.email);
        if (emailUser) {
          return {
            success: false,
            error: {
              code: 'ALREADY_EXISTS',
              message: 'Email is already in use',
              statusCode: 409
            }
          };
        }
      }

      const updatedUser = await this.userDAO.updateProfile(userId, updates);
      
      return {
        success: true,
        data: updatedUser
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: `Failed to update profile: ${(error as Error).message}`,
          statusCode: 500
        }
      };
    }
  }

  async changePassword(userId: string, passwordData: ChangePasswordDto, context?: RequestContext): Promise<ServiceResponse<void>> {
    try {
      if (!userId) {
        return {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'User ID is required',
            statusCode: 400
          }
        };
      }

      // Validate input
      const validationError = this.validateChangePassword(passwordData);
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

      await this.userDAO.updatePassword(userId, passwordData.currentPassword, passwordData.newPassword);
      
      return {
        success: true,
        data: undefined
      };
    } catch (error) {
      const errorMessage = (error as Error).message;
      
      if (errorMessage.includes('User not found')) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'User not found',
            statusCode: 404
          }
        };
      }
      
      if (errorMessage.includes('Current password is incorrect')) {
        return {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Current password is incorrect',
            statusCode: 401
          }
        };
      }

      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: `Failed to change password: ${errorMessage}`,
          statusCode: 500
        }
      };
    }
  }

  async disableAccount(userId: string, disableData: DisableAccountDto, context?: RequestContext): Promise<ServiceResponse<void>> {
    try {
      if (!userId) {
        return {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'User ID is required',
            statusCode: 400
          }
        };
      }

      // Check if user exists
      const existingUser = await this.userDAO.findById(userId);
      if (!existingUser) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'User not found',
            statusCode: 404
          }
        };
      }

      // Prevent admin from disabling their own account
      if (existingUser.role === 'admin' && context?.user?.userId === userId) {
        return {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Admin users cannot disable their own account',
            statusCode: 403
          }
        };
      }

      await this.userDAO.disableAccount(userId, disableData.reason);
      
      return {
        success: true,
        data: undefined
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: `Failed to disable account: ${(error as Error).message}`,
          statusCode: 500
        }
      };
    }
  }

  async findUsersByFilters(filters: UserFilters, context?: RequestContext): Promise<ServiceResponse<User[]>> {
    try {
      const users = await this.userDAO.findByFilters(filters);
      
      return {
        success: true,
        data: users
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: `Failed to find users: ${(error as Error).message}`,
          statusCode: 500
        }
      };
    }
  }

  // Basic CRUD operations
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
            code: 'ALREADY_EXISTS',
            message: 'User with this email already exists',
            statusCode: 409
          }
        };
      }

      const user = await this.userDAO.create(userData);
      
      return {
        success: true,
        data: user
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: `Failed to create user: ${(error as Error).message}`,
          statusCode: 500
        }
      };
    }
  }

  async getUserById(userId: string): Promise<ServiceResponse<User>> {
    try {
      if (!userId) {
        return {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'User ID is required',
            statusCode: 400
          }
        };
      }

      const user = await this.userDAO.findById(userId);
      if (!user) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
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
          code: 'INTERNAL_ERROR',
          message: `Failed to get user: ${(error as Error).message}`,
          statusCode: 500
        }
      };
    }
  }

  // Validation methods
  private validateUpdateProfile(updates: UpdateUserDto): string | null {
    if (!updates || Object.keys(updates).length === 0) {
      return 'At least one field must be provided for update';
    }

    if (updates.firstName && (updates.firstName.length < 2 || updates.firstName.length > 50)) {
      return 'First name must be between 2 and 50 characters';
    }

    if (updates.lastName && (updates.lastName.length < 2 || updates.lastName.length > 50)) {
      return 'Last name must be between 2 and 50 characters';
    }

    if (updates.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.email)) {
      return 'Invalid email format';
    }

    if (updates.bio && updates.bio.length > 500) {
      return 'Bio must be less than 500 characters';
    }

    if (updates.phone && updates.phone.length > 20) {
      return 'Phone number must be less than 20 characters';
    }

    if (updates.profileImageUrl && !this.isValidUrl(updates.profileImageUrl)) {
      return 'Invalid profile image URL';
    }

    return null;
  }

  private validateChangePassword(passwordData: ChangePasswordDto): string | null {
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      return 'Current password and new password are required';
    }

    if (passwordData.newPassword.length < 8) {
      return 'New password must be at least 8 characters long';
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      return 'New password must be different from current password';
    }

    return null;
  }

  private validateCreateUser(userData: CreateUserDto): string | null {
    if (!userData.email || !userData.firstName || !userData.lastName || !userData.password) {
      return 'Email, first name, last name, and password are required';
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
      return 'Invalid email format';
    }

    if (userData.firstName.length < 2 || userData.firstName.length > 50) {
      return 'First name must be between 2 and 50 characters';
    }

    if (userData.lastName.length < 2 || userData.lastName.length > 50) {
      return 'Last name must be between 2 and 50 characters';
    }

    if (userData.password.length < 8) {
      return 'Password must be at least 8 characters long';
    }

    return null;
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}
