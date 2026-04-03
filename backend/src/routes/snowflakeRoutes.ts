import { Router } from 'express';
import { SnowflakeController } from '../controllers/SnowflakeController';
import { tokenAuth } from '../middleware/auth';

const router = Router();
const snowflakeController = new SnowflakeController();

/**
 * Apply authentication middleware to all Snowflake routes
 */
router.use(tokenAuth);

/**
 * GET /api/snowflake/recent
 * Fetch recent endpoints from Snowflake
 */
router.get('/recent', snowflakeController.getRecentEndpoints.bind(snowflakeController));

/**
 * POST /api/snowflake/query
 * Execute a custom query (admin only)
 */
router.post('/query', snowflakeController.executeQuery.bind(snowflakeController));

export default router;
