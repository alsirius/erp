import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { tokenAuth, adminAuth } from '../middleware/auth';
import Database from 'better-sqlite3';
import { UserDAO } from '../dao/UserDAO';
import { UserService } from '../services/UserService';
import { EmailVerificationService } from '../services/EmailVerificationService';
import { EmailService } from '../services/EmailService';

const router = Router();

// Initialize dependencies
const db = new Database(process.env.DB_PATH || './database/siriux.db');
const userDAO = new UserDAO(db);
const emailService = EmailService.getInstance();
const emailVerificationService = new EmailVerificationService(db);
const userService = new UserService(userDAO, emailVerificationService);
const userController = new UserController(userService);

// Public routes (no authentication required)
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/forgot-password', userController.forgotPassword);
router.post('/verify-email', userController.verifyEmail);
router.post('/resend-verification', userController.resendVerification);

// Protected routes (authentication required)
router.use(tokenAuth);

// User profile routes
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);

// Admin only routes
router.use(adminAuth);
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

export { router as userRoutes };

// Health check route (public)
router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'User API is healthy',
    timestamp: new Date().toISOString()
  });
});
