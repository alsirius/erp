import { Request, Response } from 'express';
import { ResponseBuilder, HttpStatus, ApiErrorCode } from '../types/api';

export interface HealthCheck {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  database: {
    status: 'connected' | 'disconnected';
    responseTime?: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
}

export class HealthController {
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  public async checkHealth(req: Request, res: Response): Promise<void> {
    try {
      const healthCheck: HealthCheck = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: Date.now() - this.startTime,
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        database: await this.checkDatabase(),
        memory: this.getMemoryUsage(),
      };

      const response = ResponseBuilder.success(healthCheck);
      res.status(HttpStatus.OK).json(response);
    } catch (error) {
      const healthCheck: HealthCheck = {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: Date.now() - this.startTime,
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        database: {
          status: 'disconnected',
        },
        memory: this.getMemoryUsage(),
      };

      const response = ResponseBuilder.error(ApiErrorCode.INTERNAL_ERROR, 'Health check failed');
      res.status(HttpStatus.SERVICE_UNAVAILABLE).json(response);
    }
  }

  public async checkLiveness(req: Request, res: Response): Promise<void> {
    // Simple liveness check - always returns 200 if service is running
    const response = ResponseBuilder.success({
      status: 'alive',
      timestamp: new Date().toISOString(),
    });
    res.status(HttpStatus.OK).json(response);
  }

  public async checkReadiness(req: Request, res: Response): Promise<void> {
    try {
      // Check if database is connected
      const dbStatus = await this.checkDatabase();
      
      if (dbStatus.status === 'disconnected') {
        const response = ResponseBuilder.error(ApiErrorCode.EXTERNAL_SERVICE_ERROR, 'Database not connected');
        res.status(HttpStatus.SERVICE_UNAVAILABLE).json(response);
        return;
      }

      const response = ResponseBuilder.success({
        status: 'ready',
        timestamp: new Date().toISOString(),
        database: dbStatus,
      });
      res.status(HttpStatus.OK).json(response);
    } catch (error) {
      const response = ResponseBuilder.error(ApiErrorCode.EXTERNAL_SERVICE_ERROR, 'Service not ready');
      res.status(HttpStatus.SERVICE_UNAVAILABLE).json(response);
    }
  }

  private async checkDatabase(): Promise<{ status: 'connected' | 'disconnected'; responseTime?: number }> {
    try {
      const startTime = Date.now();
      
      // Simple database connection check
      // This would need to be implemented based on your database manager
      // For now, we'll simulate a check
      await new Promise(resolve => setTimeout(resolve, 10)); // Simulate DB query
      
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'connected',
        responseTime,
      };
    } catch (error) {
      return {
        status: 'disconnected',
      };
    }
  }

  private getMemoryUsage(): { used: number; total: number; percentage: number } {
    const usage = process.memoryUsage();
    const used = usage.heapUsed;
    const total = usage.heapTotal;
    const percentage = Math.round((used / total) * 100);

    return {
      used: Math.round(used / 1024 / 1024), // MB
      total: Math.round(total / 1024 / 1024), // MB
      percentage,
    };
  }

  public getMetrics(req: Request, res: Response): void {
    const metrics = {
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      memory: this.getMemoryUsage(),
      cpu: this.getCPUUsage(),
      requests: this.getRequestMetrics(),
    };

    const response = ResponseBuilder.success(metrics);
    res.status(HttpStatus.OK).json(response);
  }

  private getCPUUsage(): { percentage: number } {
    // Simple CPU usage calculation
    const usage = process.cpuUsage();
    return {
      percentage: Math.round((usage.user + usage.system) / 1000000), // Convert to percentage
    };
  }

  private getRequestMetrics(): { total: number; active: number; averageResponseTime: number } {
    // This would need to be implemented with actual request tracking
    return {
      total: 0,
      active: 0,
      averageResponseTime: 0,
    };
  }
}

export default HealthController;
