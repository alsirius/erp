import { Router } from 'express';
import { AdminController } from '../controllers/AdminController';
import Database from 'better-sqlite3';
import { UserDAO } from '../dao/UserDAO';
import { ApprovalService } from '../services/ApprovalService';
import { EmailService } from '../services/EmailService';
import { tokenAuth, adminAuth } from '../middleware/auth';

const router = Router();

// Initialize dependencies
const db = new Database(process.env.DB_PATH || './database/siriux.db');
const userDAO = new UserDAO(db);
const emailService = EmailService.getInstance();
const approvalService = new ApprovalService(db, userDAO, emailService);
const adminController = new AdminController(approvalService, emailService);

/**
 * Apply authentication middleware to all admin routes
 */
router.use(tokenAuth); // Verify JWT token
router.use(adminAuth); // Verify admin role

/**
 * GET /api/admin/users/pending
 * Get all pending users for admin approval
 */
router.get('/users/pending', adminController.getPendingUsers);

/**
 * POST /api/admin/users/approve
 * Approve or reject a user
 * Body: { userId: string, action: 'approve' | 'reject', reason?: string }
 */
router.post('/users/approve', adminController.processUserApproval);

/**
 * GET /api/admin/users
 * Get all users with filtering options
 * Query: { status?: string, role?: string, page?: number, limit?: number }
 */
router.get('/users', adminController.getAllUsers);

/**
 * POST /api/admin/registration-codes
 * Create a new registration/invitation code
 * Body: { code: string, usableBy: string, maxUses?: number, expiresAt?: string }
 */
router.post('/registration-codes', adminController.createRegistrationCode);

/**
 * GET /api/admin/registration-codes
 * Get all registration codes
 */
router.get('/registration-codes', adminController.getRegistrationCodes);

/**
 * DELETE /api/admin/registration-codes/:codeId
 * Delete a registration code
 */
router.delete('/registration-codes/:codeId', adminController.deleteRegistrationCode);

/**
 * POST /api/admin/users/invite
 * Send invitation email with registration code
 * Body: { email: string, firstName: string, department?: string, role?: string }
 */
router.post('/users/invite', adminController.sendInvitation);

export default router;
