import { Request, Response } from 'express';
import { querySnowflake } from '../utils/snowflake';
import logger from '../utils/logger';

export class SnowflakeController {
    /**
     * GET /api/snowflake/recent
     * Get recent pending endpoints from Snowflake
     */
    public async getRecentEndpoints(req: Request, res: Response) {
        try {
            const query = `
                SELECT ENDPOINT_ID, NAME, ADDRESS, CREATED_AT, VALIDATION_STATUS
                FROM STAGING.PENDING_ENDPOINTS
                ORDER BY CREATED_AT DESC
                LIMIT 10
            `;

            const results = await querySnowflake(query);
            
            res.json({
                success: true,
                data: results
            });
        } catch (error) {
            logger.error('Snowflake query failed', { error: (error as Error).message });
            res.status(500).json({
                success: false,
                error: 'Failed to fetch from Snowflake',
                message: (error as Error).message
            });
        }
    }

    /**
     * POST /api/snowflake/query
     * Execute a custom Snowflake query (restricted)
     */
    public async executeQuery(req: Request, res: Response) {
        const { sql, binds } = req.body;
        
        if (!sql) {
            return res.status(400).json({
                success: false,
                error: 'SQL query is required'
            });
        }

        try {
            const results = await querySnowflake(sql, binds || []);
            res.json({
                success: true,
                data: results
            });
        } catch (error) {
            logger.error('Snowflake custom query failed', { sql, error: (error as Error).message });
            res.status(500).json({
                success: false,
                error: 'Failed to execute Snowflake query',
                message: (error as Error).message
            });
        }
    }
}
