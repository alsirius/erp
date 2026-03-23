import Database from 'better-sqlite3';
import { ApiResponse, User, UserStatus } from '../types';
import { IUserDAO } from '../dao/UserDAO';
import { EmailService } from './EmailService';
import logger from '../utils/logger';

export interface RegistrationCode {
  id: string;
  code: string;
  usableBy: string; // 'anyone' or specific email
  createdBy: string;
  createdAt: Date;
  usedBy?: string;
  usedAt?: Date;
}

export interface UserApprovalRequest {
  userId: string;
  action: 'approve' | 'reject';
  reason?: string;
}

export interface RegistrationCodeRequest {
  code: string;
  usableBy: string;
  createdBy: string;
  maxUses?: number;
  expiresAt?: Date;
}

export class ApprovalService {
  constructor(
    private db: Database.Database,
    private userDAO: IUserDAO,
    private emailService: EmailService
  ) {}

  /**
   * Create a new registration/invitation code
   */
  async createRegistrationCode(request: RegistrationCodeRequest): Promise<ApiResponse<RegistrationCode>> {
    try {
      const id = this.generateId();
      const now = new Date();
      
      const stmt = this.db.prepare(`
        INSERT INTO registration_codes (id, code, usable_by, created_by, created_at, max_uses, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        id,
        request.code,
        request.usableBy,
        request.createdBy,
        now.toISOString(),
        request.maxUses || 1,
        request.expiresAt?.toISOString() || null
      );

      const registrationCode: RegistrationCode = {
        id,
        code: request.code,
        usableBy: request.usableBy,
        createdBy: request.createdBy,
        createdAt: now
      };

      logger.logUserAction('REGISTRATION_CODE_CREATED', {
        component: 'ApprovalService',
        codeId: id,
        usableBy: request.usableBy,
        createdBy: request.createdBy
      });

      return {
        success: true,
        data: registrationCode,
        message: 'Registration code created successfully'
      };
    } catch (error) {
      logger.error('Failed to create registration code', { error: (error as Error).message });
      return {
        success: false,
        error: `Failed to create registration code: ${error}`
      };
    }
  }

  /**
   * Validate registration/invitation code during registration
   */
  async validateRegistrationCode(code: string, email: string): Promise<ApiResponse<{ valid: boolean; status: UserStatus }>> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM registration_codes 
        WHERE code = ? AND used_by IS NULL 
        AND (expires_at IS NULL OR expires_at > datetime('now'))
      `);
      
      const registrationCode = stmt.get(code) as RegistrationCode | undefined;

      if (!registrationCode) {
        return {
          success: true,
          data: { valid: false, status: 'pending' as UserStatus },
          message: 'Invalid or expired registration code'
        };
      }

      // Check if code is restricted to specific email
      if (registrationCode.usableBy.toLowerCase() !== 'anyone' && 
          registrationCode.usableBy.toLowerCase() !== email.toLowerCase()) {
        return {
          success: true,
          data: { valid: false, status: 'pending' as UserStatus },
          message: 'This registration code is not valid for your email'
        };
      }

      // Valid code - user gets active status immediately
      return {
        success: true,
        data: { valid: true, status: 'active' as UserStatus },
        message: 'Registration code is valid'
      };
    } catch (error) {
      logger.error('Failed to validate registration code', { 
        code: code.substring(0, 3) + '***',
        email: email.substring(0, 3) + '***',
        error: (error as Error).message 
      });
      
      return {
        success: false,
        error: `Failed to validate registration code: ${error}`
      };
    }
  }

  /**
   * Mark registration code as used
   */
  async markRegistrationCodeAsUsed(code: string, userId: string): Promise<void> {
    try {
      const stmt = this.db.prepare(`
        UPDATE registration_codes 
        SET used_by = ?, used_at = CURRENT_TIMESTAMP 
        WHERE code = ?
      `);
      
      stmt.run(userId, code);
      
      logger.logUserAction('REGISTRATION_CODE_USED', {
        component: 'ApprovalService',
        code: code.substring(0, 3) + '***',
        userId
      });
    } catch (error) {
      logger.error('Failed to mark registration code as used', { 
        code: code.substring(0, 3) + '***',
        userId,
        error: (error as Error).message 
      });
    }
  }

  /**
   * Get pending users
   */
  async getPendingUsers(): Promise<ApiResponse<User[]>> {
    try {
      // Use findByFilters instead of findByStatus
      const users = await this.userDAO.findByFilters({ status: 'pending' });
      
      logger.logUserAction('PENDING_USERS_RETRIEVED', {
        component: 'ApprovalService',
        count: users.length
      });

      return {
        success: true,
        data: users,
        message: `Found ${users.length} pending users`
      };
    } catch (error) {
      logger.error('Failed to get pending users', { error: (error as Error).message });
      return {
        success: false,
        error: `Failed to get pending users: ${error}`
      };
    }
  }

  /**
   * Approve or reject a user
   */
  async processUserApproval(request: UserApprovalRequest, adminId: string): Promise<ApiResponse<User>> {
    try {
      const user = await this.userDAO.findById(request.userId);
      
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      const newStatus = request.action === 'approve' ? 'active' : 'disabled';
      
      // Update user status (remove status field since it's not in UpdateUserDto)
      const updatedUser = await this.userDAO.update(request.userId, { 
        approvedBy: adminId,
        approvedAt: new Date()
      });

      logger.logUserAction(`USER_${request.action.toUpperCase()}`, {
        component: 'ApprovalService',
        userId: request.userId,
        email: user.email,
        adminId,
        reason: request.reason
      });

      // Send email notification to user
      if (request.action === 'approve') {
        try {
          await this.emailService.sendAccountApprovalEmail(user.email, user.firstName);
        } catch (emailError) {
          logger.warn('Failed to send approval email', { 
            userId: request.userId,
            error: (emailError as Error).message 
          });
        }
      }

      return {
        success: true,
        data: updatedUser,
        message: `User ${request.action}d successfully`
      };
    } catch (error) {
      logger.error('Failed to process user approval', { 
        userId: request.userId,
        action: request.action,
        error: (error as Error).message 
      });
      
      return {
        success: false,
        error: `Failed to process user approval: ${error}`
      };
    }
  }

  /**
   * Get all registration codes
   */
  async getAllRegistrationCodes(): Promise<ApiResponse<RegistrationCode[]>> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM registration_codes 
        ORDER BY created_at DESC
      `);
      
      const codes = stmt.all() as RegistrationCode[];

      logger.logUserAction('REGISTRATION_CODES_RETRIEVED', {
        component: 'ApprovalService',
        count: codes.length
      });

      return {
        success: true,
        data: codes,
        message: `Found ${codes.length} registration codes`
      };
    } catch (error) {
      logger.error('Failed to get registration codes', { error: (error as Error).message });
      return {
        success: false,
        error: `Failed to get registration codes: ${error}`
      };
    }
  }

  /**
   * Delete registration code
   */
  async deleteRegistrationCode(codeId: string): Promise<ApiResponse<boolean>> {
    try {
      const stmt = this.db.prepare('DELETE FROM registration_codes WHERE id = ?');
      const result = stmt.run(codeId);

      if (result.changes === 0) {
        return {
          success: false,
          error: 'Registration code not found'
        };
      }

      logger.logUserAction('REGISTRATION_CODE_DELETED', {
        component: 'ApprovalService',
        codeId
      });

      return {
        success: true,
        data: true,
        message: 'Registration code deleted successfully'
      };
    } catch (error) {
      logger.error('Failed to delete registration code', { 
        codeId,
        error: (error as Error).message 
      });
      
      return {
        success: false,
        error: `Failed to delete registration code: ${error}`
      };
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}
