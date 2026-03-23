import Database from 'better-sqlite3';
import { ApiResponse } from '../types';
import { EmailService } from './EmailService';

export interface EmailVerificationRequest {
  email: string;
}

export interface VerifyEmailRequest {
  email: string;
  code: string;
}

export interface EmailVerificationData {
  id: string;
  email: string;
  verificationCode: string;
  createdAt: string;
  expiresAt: string;
  verified: boolean;
}

export class EmailVerificationService {
  constructor(private db: Database.Database) {}

  /**
   * Generate a 6-digit verification code
   */
  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Generate unique ID for verification records
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  /**
   * Create and store verification code for email
   */
  async createVerificationCode(email: string): Promise<ApiResponse<{ code: string }>> {
    try {
      const code = this.generateVerificationCode();
      const id = this.generateId();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

      // Delete any existing codes for this email
      const deleteStmt = this.db.prepare('DELETE FROM email_verification WHERE email = ?');
      deleteStmt.run(email);

      // Insert new verification code
      const stmt = this.db.prepare(`
        INSERT INTO email_verification (id, email, verification_code, created_at, expires_at, verified)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      stmt.run(id, email, code, now.toISOString(), expiresAt.toISOString(), 0);

      // Send verification email using EmailService
      const emailService = EmailService.getInstance();
      const emailResult = await emailService.sendVerificationEmail(email, code);

      if (!emailResult.success) {
        console.error('Failed to send verification email:', emailResult.message);
        // Don't fail the verification code creation if email fails
      }

      // Log verification code for development (EmailService already handles this)
      console.log(`🔔 EMAIL VERIFICATION CODE for ${email}: ${code}`);

      return {
        success: true,
        data: { code },
        message: 'Verification code generated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to generate verification code: ${error}`
      };
    }
  }

  /**
   * Verify email with code
   */
  async verifyEmail(request: VerifyEmailRequest): Promise<ApiResponse<boolean>> {
    try {
      const { email, code } = request;

      // Find valid verification code
      const stmt = this.db.prepare(`
        SELECT * FROM email_verification 
        WHERE email = ? AND verification_code = ? AND verified = 0 AND expires_at > datetime('now')
        ORDER BY created_at DESC LIMIT 1
      `);

      const verification = stmt.get(email, code) as EmailVerificationData | undefined;

      if (!verification) {
        return {
          success: false,
          error: 'Invalid or expired verification code'
        };
      }

      // Mark verification as used
      const updateStmt = this.db.prepare(`
        UPDATE email_verification 
        SET verified = 1 
        WHERE id = ?
      `);

      updateStmt.run(verification.id);

      // Update user email verification status
      const updateUserStmt = this.db.prepare(`
        UPDATE users 
        SET email_verified = 1 
        WHERE email = ?
      `);

      updateUserStmt.run(email);

      return {
        success: true,
        data: true,
        message: 'Email verified successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to verify email: ${error}`
      };
    }
  }

  /**
   * Resend verification code
   */
  async resendVerificationCode(email: string): Promise<ApiResponse<{ code: string }>> {
    try {
      // Check if user exists
      const userStmt = this.db.prepare('SELECT id FROM users WHERE email = ? AND deleted = 0');
      const user = userStmt.get(email) as { id: string } | undefined;

      if (!user) {
        // For security, don't reveal if email exists
        return {
          success: true,
          data: { code: '' },
          message: 'If an account with this email exists, a verification code has been sent.'
        };
      }

      return await this.createVerificationCode(email);
    } catch (error) {
      return {
        success: false,
        error: `Failed to resend verification code: ${error}`
      };
    }
  }

  /**
   * Get verification code for testing/development
   */
  async getVerificationCode(email: string): Promise<string | null> {
    try {
      const stmt = this.db.prepare(`
        SELECT verification_code FROM email_verification 
        WHERE email = ? AND verified = 0 AND expires_at > datetime('now')
        ORDER BY created_at DESC LIMIT 1
      `);

      const result = stmt.get(email) as { verification_code: string } | undefined;
      return result ? result.verification_code : null;
    } catch (error) {
      console.error('Failed to get verification code:', error);
      return null;
    }
  }
}
