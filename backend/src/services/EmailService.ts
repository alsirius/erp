import nodemailer, { Transporter } from 'nodemailer';
import { EmailVerificationService } from './EmailVerificationService';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface EmailResult {
  success: boolean;
  message: string;
  messageId?: string;
}

export class EmailService {
  private static instance: EmailService;
  private primaryTransporter: any;
  private backupTransporter: any;

  private constructor() {
    this.primaryTransporter = this.createTransporter(false);
    this.backupTransporter = this.createTransporter(true);
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  private createTransporter(isBackup: boolean = false): Transporter {
    const config: EmailConfig = {
      host: isBackup 
        ? (process.env.BACKUP_EMAIL_HOST || 'smtp.ionos.co.uk')
        : (process.env.EMAIL_HOST || 'smtp.gmail.com'),
      port: parseInt(
        isBackup 
          ? (process.env.BACKUP_EMAIL_PORT || '587')
          : (process.env.EMAIL_PORT || '465'), 
        10
      ),
      secure: (isBackup 
        ? (process.env.BACKUP_EMAIL_SECURE || 'false')
        : (process.env.EMAIL_SECURE || 'true')
      ) === 'true',
      auth: {
        user: isBackup 
          ? (process.env.BACKUP_EMAIL_USER || '')
          : (process.env.EMAIL_USER || ''),
        pass: isBackup 
          ? (process.env.BACKUP_EMAIL_PASSWORD || '')
          : (process.env.EMAIL_PASSWORD || '')
      },
    };

    console.log(`Creating ${isBackup ? 'backup' : 'primary'} email transporter with:`, {
      host: config.host,
      port: config.port,
      secure: config.secure,
      user: config.auth.user,
      password: config.auth.pass ? '********' : 'NOT SET'
    });

    return nodemailer.createTransport(config);
  }

  /**
   * Send email with fallback to backup service
   */
  private async sendMailWithFallback(mailOptions: any): Promise<EmailResult> {
    try {
      const result = await this.primaryTransporter.sendMail(mailOptions);
      return {
        success: true,
        message: 'Email sent successfully',
        messageId: result.messageId
      };
    } catch (error) {
      console.warn('Primary email service failed, trying backup:', error);
      
      try {
        // Update from address for backup service
        mailOptions.from = `"${process.env.BACKUP_EMAIL_FROM_NAME || 'Siriux'}" <${process.env.BACKUP_EMAIL_USER}>`;
        const result = await this.backupTransporter.sendMail(mailOptions);
        return {
          success: true,
          message: 'Email sent via backup service',
          messageId: result.messageId
        };
      } catch (backupError) {
        console.error('Both email services failed:', backupError);
        return {
          success: false,
          message: 'Failed to send email via both primary and backup services'
        };
      }
    }
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(email: string, code: string): Promise<EmailResult> {
    const isDevelopment = process.env.NODE_ENV !== 'production';

    // Development mode handling
    if (isDevelopment && process.env.ALWAYS_SEND_EMAILS !== 'true') {
      console.log('🔔 DEVELOPMENT MODE: Email Verification');
      console.log('=====================================');
      console.log(`To: ${email}`);
      console.log(`Subject: Email Verification Code`);
      console.log(`Verification Code: ${code}`);
      console.log('=====================================');
      
      return {
        success: true,
        message: 'Email logged in development mode',
        messageId: `dev-${Date.now()}`
      };
    }

    // Production email sending
    try {
      const html = this.generateVerificationEmailTemplate(code);
      
      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'Siriux'}" <${process.env.EMAIL_USER}>`,
        to: email.toLowerCase(),
        subject: 'Verify your Siriux account',
        html
      };

      return await this.sendMailWithFallback(mailOptions);
    } catch (error) {
      console.error('Error sending verification email:', error);
      return {
        success: false,
        message: 'Failed to send verification email'
      };
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, resetCode: string): Promise<EmailResult> {
    const isDevelopment = process.env.NODE_ENV !== 'production';

    // Development mode handling
    if (isDevelopment && process.env.ALWAYS_SEND_EMAILS !== 'true') {
      console.log('🔔 DEVELOPMENT MODE: Password Reset');
      console.log('=====================================');
      console.log(`To: ${email}`);
      console.log(`Subject: Password Reset Code`);
      console.log(`Reset Code: ${resetCode}`);
      console.log('=====================================');
      
      return {
        success: true,
        message: 'Password reset email logged in development mode',
        messageId: `dev-${Date.now()}`
      };
    }

    // Production email sending
    try {
      const html = this.generatePasswordResetEmailTemplate(resetCode);
      
      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'Siriux'}" <${process.env.EMAIL_USER}>`,
        to: email.toLowerCase(),
        subject: 'Reset your Siriux password',
        html
      };

      return await this.sendMailWithFallback(mailOptions);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return {
        success: false,
        message: 'Failed to send password reset email'
      };
    }
  }

  /**
   * Generate verification email HTML template
   */
  private generateVerificationEmailTemplate(code: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verification</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background: #f9fafb; }
        .code { background: #e5e7eb; padding: 15px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 3px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #6b7280; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Verify Your Siriux Account</h1>
        </div>
        <div class="content">
            <p>Thank you for registering with Siriux! Please use the verification code below to complete your registration:</p>
            <div class="code">${code}</div>
            <p>This code will expire in 24 hours. If you didn't request this verification, please ignore this email.</p>
        </div>
        <div class="footer">
            <p>&copy; 2025 Siriux. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `.trim();
  }

  /**
   * Send invitation email with registration code
   */
  async sendInvitationEmail(email: string, firstName: string, invitationCode: string, department?: string, role?: string): Promise<EmailResult> {
    const isDevelopment = process.env.NODE_ENV !== 'production';

    // Development mode handling
    if (isDevelopment && process.env.ALWAYS_SEND_EMAILS !== 'true') {
      console.log('🔔 DEVELOPMENT MODE: Invitation Email');
      console.log('=====================================');
      console.log(`To: ${email}`);
      console.log(`Subject: You're invited to join Siriux!`);
      console.log(`User: ${firstName}`);
      console.log(`Invitation Code: ${invitationCode}`);
      console.log(`Department: ${department || 'Not specified'}`);
      console.log(`Role: ${role || 'user'}`);
      console.log('=====================================');
      
      return {
        success: true,
        message: 'Invitation email logged in development mode',
        messageId: `dev-${Date.now()}`
      };
    }

    // Production email sending
    try {
      const html = this.generateInvitationEmailTemplate(firstName, invitationCode, department, role);
      
      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'Siriux'}" <${process.env.EMAIL_USER}>`,
        to: email.toLowerCase(),
        subject: 'You\'re invited to join Siriux! 🎉',
        html
      };

      return await this.sendMailWithFallback(mailOptions);
    } catch (error) {
      console.error('Error sending invitation email:', error);
      return {
        success: false,
        message: 'Failed to send invitation email'
      };
    }
  }

  /**
   * Generate invitation email HTML template
   */
  private generateInvitationEmailTemplate(firstName: string, invitationCode: string, department?: string, role?: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invitation to Join Siriux</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { padding: 30px; background: #f9fafb; border-radius: 0 0 10px 10px; }
        .code-box { background: #e5e7eb; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 3px; border-radius: 8px; margin: 20px 0; border: 2px dashed #9ca3af; }
        .button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #6b7280; }
        .info-box { background: #f3f4f6; padding: 15px; border-left: 4px solid #667eea; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>You're Invited! 🎉</h1>
            <p>Join the Siriux Platform</p>
        </div>
        <div class="content">
            <p>Hi ${firstName},</p>
            <p>You've been invited to join the Siriux platform! We're excited to have you on board.</p>
            
            <div class="info-box">
                <strong>Your Invitation Details:</strong><br>
                ${department ? `Department: ${department}<br>` : ''}
                ${role ? `Role: ${role}<br>` : ''}
                Invitation Code: <strong>${invitationCode}</strong>
            </div>
            
            <p>To get started, use your invitation code when registering:</p>
            
            <div class="code-box">${invitationCode}</div>
            
            <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/register/invite?code=${invitationCode}" class="button">Register Now</a>
            </div>
            
            <p>This invitation code will expire in 7 days. If you need any assistance, please don't hesitate to contact our support team.</p>
            
            <p>We look forward to welcoming you to Siriux!</p>
        </div>
        <div class="footer">
            <p>&copy; 2025 Siriux. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `.trim();
  }

  /**
   * Send account approval email
   */
  async sendAccountApprovalEmail(email: string, firstName: string): Promise<EmailResult> {
    const isDevelopment = process.env.NODE_ENV !== 'production';

    // Development mode handling
    if (isDevelopment && process.env.ALWAYS_SEND_EMAILS !== 'true') {
      console.log('🔔 DEVELOPMENT MODE: Account Approval');
      console.log('=====================================');
      console.log(`To: ${email}`);
      console.log(`Subject: Your Account Has Been Approved!`);
      console.log(`User: ${firstName}`);
      console.log('=====================================');
      
      return {
        success: true,
        message: 'Account approval email logged in development mode',
        messageId: `dev-${Date.now()}`
      };
    }

    // Production email sending
    try {
      const html = this.generateAccountApprovalEmailTemplate(firstName);
      
      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'Siriux'}" <${process.env.EMAIL_USER}>`,
        to: email.toLowerCase(),
        subject: 'Your Siriux Account Has Been Approved!',
        html
      };

      return await this.sendMailWithFallback(mailOptions);
    } catch (error) {
      console.error('Error sending account approval email:', error);
      return {
        success: false,
        message: 'Failed to send account approval email'
      };
    }
  }

  /**
   * Generate account approval email HTML template
   */
  private generateAccountApprovalEmailTemplate(firstName: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account Approved</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background: #f9fafb; }
        .button { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #6b7280; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Account Approved! 🎉</h1>
        </div>
        <div class="content">
            <p>Hi ${firstName},</p>
            <p>Great news! Your Siriux account has been approved and is now active.</p>
            <p>You can now log in and start using the platform.</p>
            <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="button">Log In Now</a>
            </div>
            <p>If you have any questions, please don't hesitate to contact our support team.</p>
        </div>
        <div class="footer">
            <p>&copy; 2025 Siriux. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `.trim();
  }

  /**
   * Generate password reset email HTML template
   */
  private generatePasswordResetEmailTemplate(resetCode: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ef4444; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background: #f9fafb; }
        .code { background: #e5e7eb; padding: 15px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 3px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #6b7280; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Reset Your Password</h1>
        </div>
        <div class="content">
            <p>We received a request to reset your password for your Siriux account. Use the code below to reset your password:</p>
            <div class="code">${resetCode}</div>
            <p>This code will expire in 24 hours. If you didn't request this password reset, please ignore this email.</p>
        </div>
        <div class="footer">
            <p>&copy; 2025 Siriux. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `.trim();
  }
}
