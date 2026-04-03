import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { databaseManager } from './database/DatabaseManager';
import { userRoutes } from './routes/userRoutes';
import adminRoutes from './routes/adminRoutes';
import snowflakeRoutes from './routes/snowflakeRoutes';
import { tokenAuth, adminAuth } from './middleware/auth';
import { loggingMiddleware, errorLoggingMiddleware } from './middleware/logging';
import logger from './utils/logger';

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: __dirname + `/../${envFile}` });

// Log which environment file is loaded
console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`📁 Config file: ${envFile}`);
console.log(`🔑 JWT_SECRET loaded: ${process.env.JWT_SECRET ? '✅' : '❌'}`);

const app = express();
const PORT = process.env.PORT || 3002;

// Initialize database
try {
  const db = databaseManager.initialize(process.env.DB_PATH || './database/siriux.db');
  logger.logSystem('DATABASE_INITIALIZED', { dbPath: process.env.DB_PATH });

  // Log database stats
  const stats = databaseManager.getStats();
  logger.info('Database stats', stats);
} catch (error) {
  logger.logSystem('DATABASE_INITIALIZATION_ERROR', { error: (error as Error).message });
  process.exit(1);
}

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware (must be before routes)
app.use(loggingMiddleware);

// Routes
app.use('/api/auth', userRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/snowflake', snowflakeRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  logger.logSystem('HEALTH_CHECK', {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.json({
    success: true,
    message: 'Siriux Backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    logLevel: logger.getLogLevel()
  });
});

// Error handling middleware (must be after routes)
app.use(errorLoggingMiddleware);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Start server
const server = app.listen(PORT, () => {
  logger.logSystem('SERVER_STARTED', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    logLevel: logger.getLogLevel()
  });

  console.log(`🚀 Siriux Backend server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth/*`);
  console.log(`👥 User endpoints: http://localhost:${PORT}/api/users/*`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🔄 Shutting down gracefully...');
  databaseManager.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🔄 Shutting down gracefully...');
  databaseManager.close();
  process.exit(0);
});
