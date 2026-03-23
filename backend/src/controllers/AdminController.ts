import { Request, Response } from 'express';
import { ApiResponse, UserStatus, UserRole } from '../types';
import { ApprovalService } from '../services/ApprovalService';
import { EmailService } from '../services/EmailService';
import logger from '../utils/logger';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export class AdminController {
  constructor(
    private approvalService: ApprovalService,
    private emailService: EmailService
  ) {}

  /**
   * GET /api/admin/users/pending
   * Get all pending users for admin approval
   */
  public getPendingUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      logger.logUserAction('GET_PENDING_USERS', {
        component: 'AdminController',
        adminId: req.user?.userId,
        adminEmail: req.user?.email
      });

      const result = await this.approvalService.getPendingUsers();

      const response: ApiResponse<typeof result.data> = {
        success: result.success,
        data: result.data,
        message: result.message,
        error: result.error
      };

      res.status(result.success ? 200 : 500).json(response);
    } catch (error) {
      logger.error('Failed to get pending users', { 
        error: (error as Error).message,
        adminId: req.user?.userId 
      });

      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to retrieve pending users'
      };
      res.status(500).json(response);
    }
  };

  /**
   * POST /api/admin/users/approve
   * Approve or reject a user
   */
  public processUserApproval = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { userId, action, reason } = req.body;

      if (!userId || !action || !['approve', 'reject'].includes(action)) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Invalid request: userId and action (approve/reject) are required'
        };
        res.status(400).json(response);
        return;
      }

      logger.logUserAction('USER_APPROVAL_REQUEST', {
        component: 'AdminController',
        adminId: req.user?.userId,
        targetUserId: userId,
        action,
        reason
      });

      const result = await this.approvalService.processUserApproval(
        { userId, action: action as 'approve' | 'reject', reason },
        req.user?.userId || ''
      );

      const response: ApiResponse<typeof result.data> = {
        success: result.success,
        data: result.data,
        message: result.message,
        error: result.error
      };

      res.status(result.success ? 200 : 400).json(response);
    } catch (error) {
      logger.error('Failed to process user approval', { 
        error: (error as Error).message,
        adminId: req.user?.userId 
      });

      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to process user approval'
      };
      res.status(500).json(response);
    }
  };

  /**
   * POST /api/admin/registration-codes
   * Create a new registration/invitation code
   */
  public createRegistrationCode = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { code, usableBy, maxUses, expiresAt } = req.body;

      if (!code || !usableBy) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Invalid request: code and usableBy are required'
        };
        res.status(400).json(response);
        return;
      }

      logger.logUserAction('CREATE_REGISTRATION_CODE', {
        component: 'AdminController',
        adminId: req.user?.userId,
        code: code.substring(0, 3) + '***',
        usableBy
      });

      const result = await this.approvalService.createRegistrationCode({
        code,
        usableBy,
        createdBy: req.user?.userId || '',
        maxUses,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined
      });

      const response: ApiResponse<typeof result.data> = {
        success: result.success,
        data: result.data,
        message: result.message,
        error: result.error
      };

      res.status(result.success ? 201 : 400).json(response);
    } catch (error) {
      logger.error('Failed to create registration code', { 
        error: (error as Error).message,
        adminId: req.user?.userId 
      });

      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to create registration code'
      };
      res.status(500).json(response);
    }
  };

  /**
   * GET /api/admin/registration-codes
   * Get all registration codes
   */
  public getRegistrationCodes = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      logger.logUserAction('GET_REGISTRATION_CODES', {
        component: 'AdminController',
        adminId: req.user?.userId
      });

      const result = await this.approvalService.getAllRegistrationCodes();

      const response: ApiResponse<typeof result.data> = {
        success: result.success,
        data: result.data,
        message: result.message,
        error: result.error
      };

      res.status(result.success ? 200 : 500).json(response);
    } catch (error) {
      logger.error('Failed to get registration codes', { 
        error: (error as Error).message,
        adminId: req.user?.userId 
      });

      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to retrieve registration codes'
      };
      res.status(500).json(response);
    }
  };

  /**
   * DELETE /api/admin/registration-codes/:codeId
   * Delete a registration code
   */
  public deleteRegistrationCode = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { codeId } = req.params;

      if (!codeId) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Code ID is required'
        };
        res.status(400).json(response);
        return;
      }

      logger.logUserAction('DELETE_REGISTRATION_CODE', {
        component: 'AdminController',
        adminId: req.user?.userId,
        codeId
      });

      const result = await this.approvalService.deleteRegistrationCode(codeId);

      const response: ApiResponse<typeof result.data> = {
        success: result.success,
        data: result.data,
        message: result.message,
        error: result.error
      };

      res.status(result.success ? 200 : 404).json(response);
    } catch (error) {
      logger.error('Failed to delete registration code', { 
        error: (error as Error).message,
        adminId: req.user?.userId,
        codeId: req.params.codeId
      });

      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to delete registration code'
      };
      res.status(500).json(response);
    }
  };

  /**
   * POST /api/admin/users/invite
   * Send invitation email with registration code
   */
  public sendInvitation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { email, firstName, department, role = 'user' } = req.body;

      if (!email || !firstName) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Email and firstName are required'
        };
        res.status(400).json(response);
        return;
      }

      // Generate a unique invitation code
      const code = this.generateInvitationCode();

      logger.logUserAction('SEND_INVITATION', {
        component: 'AdminController',
        adminId: req.user?.userId,
        targetEmail: email.substring(0, 3) + '***',
        firstName
      });

      // Create registration code
      const codeResult = await this.approvalService.createRegistrationCode({
        code,
        usableBy: email.toLowerCase(), // Email-specific code
        createdBy: req.user?.userId || '',
        maxUses: 1,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      });

      if (!codeResult.success) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Failed to generate invitation code'
        };
        res.status(500).json(response);
        return;
      }

      // Send invitation email
      try {
        await this.emailService.sendInvitationEmail(email, firstName, code, department, role);
        
        const response: ApiResponse<{ invitationCode: string }> = {
          success: true,
          data: { invitationCode: code },
          message: `Invitation sent successfully to ${email}`
        };
        res.status(200).json(response);
      } catch (emailError) {
        logger.error('Failed to send invitation email', { 
          error: (emailError as Error).message,
          targetEmail: email.substring(0, 3) + '***'
        });

        const response: ApiResponse<null> = {
          success: false,
          error: 'Failed to send invitation email'
        };
        res.status(500).json(response);
      }
    } catch (error) {
      logger.error('Failed to send invitation', { 
        error: (error as Error).message,
        adminId: req.user?.userId 
      });

      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to send invitation'
      };
      res.status(500).json(response);
    }
  };

  /**
   * GET /api/admin/users
   * Get all users with filtering options
   */
  public getAllUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { status, role, page = 1, limit = 20 } = req.query;

      logger.logUserAction('GET_ALL_USERS', {
        component: 'AdminController',
        adminId: req.user?.userId,
        filters: { status, role, page, limit }
      });

      // This would need to be implemented in UserService
      // For now, return a basic response
      const response: ApiResponse<[]> = {
        success: true,
        data: [],
        message: 'User listing endpoint - to be implemented with UserService'
      };
      res.status(200).json(response);
    } catch (error) {
      logger.error('Failed to get all users', { 
        error: (error as Error).message,
        adminId: req.user?.userId 
      });

      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to retrieve users'
      };
      res.status(500).json(response);
    }
  };

  /**
   * Generate a unique invitation code
   */
  private generateInvitationCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
      if (i === 3) code += '-'; // Format: XXXX-XXXX
    }
    return code;
  }
}
