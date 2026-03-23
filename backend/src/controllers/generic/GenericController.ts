import { Request, Response, NextFunction } from 'express';
import { GenericService, ServiceResponse } from '../../services/generic/GenericService';
import { 
  ApiResponse, 
  ListResponse, 
  QueryRequest, 
  RequestContext, 
  ApiErrorCode, 
  ResponseBuilder,
  CreateRequest,
  UpdateRequest,
  BulkRequest,
  DetailResponse,
  ActionResponse
} from '../../types/api';

/**
 * Generic Controller Implementation
 * 
 * Provides standard REST API endpoints with proper HTTP status codes,
 * request/response handling, validation, and error handling.
 * 
 * @template T - The entity type
 * @template CreateDto - The DTO type for creating entities
 * @template UpdateDto - The DTO type for updating entities
 */
export abstract class GenericController<T, CreateDto, UpdateDto> {
  protected service: GenericService<T, CreateDto, UpdateDto>;
  protected entityName: string;

  constructor(service: GenericService<T, CreateDto, UpdateDto>, entityName: string) {
    this.service = service;
    this.entityName = entityName;
  }

  // Standard REST endpoints
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const context = this.createRequestContext(req);
      const data = req.body as CreateDto;

      const result = await this.service.create(data, context);

      if (result.success && result.data) {
        const response = ResponseBuilder.created(result.data, `${this.entityName} created successfully`);
        res.status(201).json(response);
      } else {
        const response = ResponseBuilder.error(
          result.error?.code || ApiErrorCode.INTERNAL_ERROR,
          result.error?.message || 'Failed to create entity',
          result.error?.details
        );
        res.status(result.error?.statusCode || 500).json(response);
      }
    } catch (error) {
      next(this.handleError(error, 'create'));
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const context = this.createRequestContext(req);
      const { id } = req.params;

      const result = await this.service.findById(id, context);

      if (result.success && result.data) {
        const response = ResponseBuilder.success({
          item: result.data
        } as DetailResponse<T>);
        res.status(200).json(response);
      } else {
        const response = ResponseBuilder.error(
          result.error?.code || ApiErrorCode.NOT_FOUND,
          result.error?.message || 'Entity not found'
        );
        res.status(result.error?.statusCode || 404).json(response);
      }
    } catch (error) {
      next(this.handleError(error, 'getById'));
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const context = this.createRequestContext(req);
      const query = this.buildQueryRequest(req);

      const result = await this.service.findAll(query, context);

      if (result.success && result.data) {
        const response = ResponseBuilder.successWithPagination(
          result.data.items,
          result.data.pagination
        );
        res.status(200).json(response);
      } else {
        const response = ResponseBuilder.error(
          result.error?.code || ApiErrorCode.INTERNAL_ERROR,
          result.error?.message || 'Failed to fetch entities'
        );
        res.status(result.error?.statusCode || 500).json(response);
      }
    } catch (error) {
      next(this.handleError(error, 'getAll'));
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const context = this.createRequestContext(req);
      const { id } = req.params;
      const data = req.body as UpdateDto;

      const result = await this.service.update(id, data, context);

      if (result.success && result.data) {
        const response = ResponseBuilder.updated(result.data, `${this.entityName} updated successfully`);
        res.status(200).json(response);
      } else {
        const response = ResponseBuilder.error(
          result.error?.code || ApiErrorCode.INTERNAL_ERROR,
          result.error?.message || 'Failed to update entity',
          result.error?.details
        );
        res.status(result.error?.statusCode || 500).json(response);
      }
    } catch (error) {
      next(this.handleError(error, 'update'));
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const context = this.createRequestContext(req);
      const { id } = req.params;

      const result = await this.service.delete(id, context);

      if (result.success) {
        const response = ResponseBuilder.deleted(`${this.entityName} deleted successfully`);
        res.status(200).json(response);
      } else {
        const response = ResponseBuilder.error(
          result.error?.code || ApiErrorCode.INTERNAL_ERROR,
          result.error?.message || 'Failed to delete entity'
        );
        res.status(result.error?.statusCode || 500).json(response);
      }
    } catch (error) {
      next(this.handleError(error, 'delete'));
    }
  }

  // Bulk operations
  async bulkCreate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const context = this.createRequestContext(req);
      const { items } = req.body as BulkRequest<CreateDto>;

      if (!Array.isArray(items) || items.length === 0) {
        const response = ResponseBuilder.error(
          ApiErrorCode.INVALID_INPUT,
          'Items array is required and cannot be empty'
        );
        res.status(400).json(response);
        return;
      }

      const result = await this.service.bulkCreate(items, context);

      if (result.success && result.data) {
        const response = ResponseBuilder.created(result.data, `${items.length} ${this.entityName}s created successfully`);
        res.status(201).json(response);
      } else {
        const response = ResponseBuilder.error(
          result.error?.code || ApiErrorCode.INTERNAL_ERROR,
          result.error?.message || 'Failed to create entities',
          result.error?.details
        );
        res.status(result.error?.statusCode || 500).json(response);
      }
    } catch (error) {
      next(this.handleError(error, 'bulkCreate'));
    }
  }

  async bulkUpdate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const context = this.createRequestContext(req);
      const { items } = req.body as BulkRequest<{ id: string; data: UpdateDto }>;

      if (!Array.isArray(items) || items.length === 0) {
        const response = ResponseBuilder.error(
          ApiErrorCode.INVALID_INPUT,
          'Items array is required and cannot be empty'
        );
        res.status(400).json(response);
        return;
      }

      const result = await this.service.bulkUpdate(items, context);

      if (result.success && result.data) {
        const response = ResponseBuilder.updated(result.data, `${items.length} ${this.entityName}s updated successfully`);
        res.status(200).json(response);
      } else {
        const response = ResponseBuilder.error(
          result.error?.code || ApiErrorCode.INTERNAL_ERROR,
          result.error?.message || 'Failed to update entities',
          result.error?.details
        );
        res.status(result.error?.statusCode || 500).json(response);
      }
    } catch (error) {
      next(this.handleError(error, 'bulkUpdate'));
    }
  }

  async bulkDelete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const context = this.createRequestContext(req);
      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        const response = ResponseBuilder.error(
          ApiErrorCode.INVALID_INPUT,
          'IDs array is required and cannot be empty'
        );
        res.status(400).json(response);
        return;
      }

      const result = await this.service.bulkDelete(ids, context);

      if (result.success) {
        const response: ApiResponse<ActionResponse> = {
          success: true,
          data: {
            success: true,
            affected: result.data || 0,
            message: `${result.data || 0} ${this.entityName}s deleted successfully`
          }
        };
        res.status(200).json(response);
      } else {
        const response = ResponseBuilder.error(
          result.error?.code || ApiErrorCode.INTERNAL_ERROR,
          result.error?.message || 'Failed to delete entities'
        );
        res.status(result.error?.statusCode || 500).json(response);
      }
    } catch (error) {
      next(this.handleError(error, 'bulkDelete'));
    }
  }

  // Count endpoint
  async count(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const context = this.createRequestContext(req);
      const query = this.buildQueryRequest(req);

      const result = await this.service.count(query, context);

      if (result.success) {
        const response: ApiResponse<{ count: number }> = {
          success: true,
          data: { count: result.data || 0 }
        };
        res.status(200).json(response);
      } else {
        const response = ResponseBuilder.error(
          result.error?.code || ApiErrorCode.INTERNAL_ERROR,
          result.error?.message || 'Failed to count entities'
        );
        res.status(result.error?.statusCode || 500).json(response);
      }
    } catch (error) {
      next(this.handleError(error, 'count'));
    }
  }

  // Search endpoint (if supported by service)
  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const context = this.createRequestContext(req);
      const query = this.buildQueryRequest(req);

      // Add search term to query
      if (req.query.q && typeof req.query.q === 'string') {
        query.search = {
          query: req.query.q,
          fields: req.query.fields ? (req.query.fields as string).split(',') : undefined
        };
      }

      const result = await this.service.findAll(query, context);

      if (result.success && result.data) {
        const response = ResponseBuilder.successWithPagination(
          result.data.items,
          result.data.pagination,
          `Search results for "${req.query.q}"`
        );
        res.status(200).json(response);
      } else {
        const response = ResponseBuilder.error(
          result.error?.code || ApiErrorCode.INTERNAL_ERROR,
          result.error?.message || 'Failed to search entities'
        );
        res.status(result.error?.statusCode || 500).json(response);
      }
    } catch (error) {
      next(this.handleError(error, 'search'));
    }
  }

  // Utility methods
  protected createRequestContext(req: Request): RequestContext {
    return {
      request: {
        method: req.method,
        path: req.path,
        headers: req.headers as Record<string, string>,
        body: req.body,
        query: req.query as Record<string, string>,
        params: req.params as Record<string, string>,
        user: (req as any).user,
        requestId: (req as any).requestId || this.generateRequestId(),
        timestamp: new Date().toISOString()
      },
      user: (req as any).user,
      startTime: Date.now(),
      requestId: (req as any).requestId || this.generateRequestId(),
      correlationId: req.headers['x-correlation-id'] as string,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    };
  }

  protected buildQueryRequest(req: Request): QueryRequest {
    const query: QueryRequest = {};

    // Parse filters
    if (req.query.filters && typeof req.query.filters === 'string') {
      try {
        query.filters = JSON.parse(req.query.filters);
      } catch {
        // Invalid JSON, ignore filters
      }
    } else if (req.query.filters) {
      query.filters = req.query.filters as Record<string, any>;
    }

    // Parse sort
    if (req.query.sort && typeof req.query.sort === 'string') {
      try {
        query.sort = JSON.parse(req.query.sort);
      } catch {
        // Invalid JSON, ignore sort
      }
    } else if (req.query.sort) {
      query.sort = req.query.sort as Record<string, 'asc' | 'desc'>;
    }

    // Parse pagination
    if (req.query.page || req.query.limit) {
      query.pagination = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10
      };
    }

    // Parse search
    if (req.query.q && typeof req.query.q === 'string') {
      query.search = {
        query: req.query.q,
        fields: req.query.fields ? (req.query.fields as string).split(',') : undefined
      };
    }

    return query;
  }

  protected generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  protected handleError(error: any, operation: string): Error {
    console.error(`Error in ${this.entityName} controller during ${operation}:`, error);
    
    // Create a standardized error
    const appError = new Error(`An error occurred during ${operation}`);
    (appError as any).statusCode = 500;
    (appError as any).code = ApiErrorCode.INTERNAL_ERROR;
    (appError as any).details = process.env.NODE_ENV === 'development' ? error.message : undefined;
    
    return appError;
  }

  // Validation middleware factory
  protected validateCreate(validationSchema: any) {
    return (req: Request, res: Response, next: NextFunction) => {
      const { error } = validationSchema.validate(req.body);
      if (error) {
        const response = ResponseBuilder.validationError(
          error.details.map((detail: any) => ({
            field: detail.path.join('.'),
            message: detail.message,
            code: 'VALIDATION_ERROR',
            value: detail.context?.value
          }))
        );
        return res.status(422).json(response);
      }
      next();
    };
  }

  protected validateUpdate(validationSchema: any) {
    return (req: Request, res: Response, next: NextFunction) => {
      const { error } = validationSchema.validate(req.body);
      if (error) {
        const response = ResponseBuilder.validationError(
          error.details.map((detail: any) => ({
            field: detail.path.join('.'),
            message: detail.message,
            code: 'VALIDATION_ERROR',
            value: detail.context?.value
          }))
        );
        return res.status(422).json(response);
      }
      next();
    };
  }

  // Authorization middleware factory
  protected requirePermission(permission: string) {
    return (req: Request, res: Response, next: NextFunction) => {
      const user = (req as any).user;
      if (!user || (user.permissions && !user.permissions.includes(permission))) {
        const response = ResponseBuilder.error(
          ApiErrorCode.INSUFFICIENT_PERMISSIONS,
          `Permission '${permission}' is required`
        );
        return res.status(403).json(response);
      }
      next();
    };
  }

  protected requireRole(role: string) {
    return (req: Request, res: Response, next: NextFunction) => {
      const user = (req as any).user;
      if (!user || user.role !== role) {
        const response = ResponseBuilder.error(
          ApiErrorCode.INSUFFICIENT_PERMISSIONS,
          `Role '${role}' is required`
        );
        return res.status(403).json(response);
      }
      next();
    };
  }
}
