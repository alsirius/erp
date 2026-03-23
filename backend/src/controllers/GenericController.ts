import { Request, Response } from 'express';
import { ApiResponse, IGenericService, RequestContext, ResponseBuilder, HttpStatus, ApiErrorCode } from '../types/api';

export abstract class GenericController<T, CreateDto, UpdateDto> {
  constructor(
    protected service: IGenericService<T, CreateDto, UpdateDto>,
    protected responseBuilder: ResponseBuilder
  ) {}

  // Generic CRUD operations
  async create(req: Request, res: Response): Promise<void> {
    try {
      const context = this.getRequestContext(req);
      const result = await this.service.create(req.body, context);
      
      const response = ResponseBuilder.created(result);
      res.status(HttpStatus.CREATED).json(response);
    } catch (error) {
      const errorResponse = ResponseBuilder.error(
        ApiErrorCode.INTERNAL_ERROR,
        `Failed to create resource: ${(error as Error).message}`
      );
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse);
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const context = this.getRequestContext(req);
      const result = await this.service.findById(id, context);
      
      if (!result) {
        const errorResponse = ResponseBuilder.error(
        ApiErrorCode.NOT_FOUND,
        'Resource not found'
      );
        res.status(HttpStatus.NOT_FOUND).json(errorResponse);
        return;
      }
      
      const response = ResponseBuilder.success(result);
      res.status(HttpStatus.OK).json(response);
    } catch (error) {
      const errorResponse = ResponseBuilder.error(
        ApiErrorCode.INTERNAL_ERROR,
        `Failed to get resource: ${(error as Error).message}`
      );
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse);
    }
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const query = this.buildQuery(req);
      const context = this.getRequestContext(req);
      const result = await this.service.findAll(query, context);
      
      const response = ResponseBuilder.success(result);
      res.status(HttpStatus.OK).json(response);
    } catch (error) {
      const errorResponse = ResponseBuilder.error(
        ApiErrorCode.INTERNAL_ERROR,
        `Failed to get resources: ${(error as Error).message}`
      );
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse);
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const context = this.getRequestContext(req);
      const result = await this.service.update(id, req.body, context);
      
      const response = ResponseBuilder.updated(result);
      res.status(HttpStatus.OK).json(response);
    } catch (error) {
      const errorResponse = ResponseBuilder.error(
        ApiErrorCode.INTERNAL_ERROR,
        `Failed to update resource: ${(error as Error).message}`
      );
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse);
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const context = this.getRequestContext(req);
      const result = await this.service.delete(id, context);
      
      const response = ResponseBuilder.deleted(
        result ? 'Resource deleted successfully' : 'Resource not found'
      );
      res.status(HttpStatus.OK).json(response);
    } catch (error) {
      const errorResponse = ResponseBuilder.error(
        ApiErrorCode.INTERNAL_ERROR,
        `Failed to delete resource: ${(error as Error).message}`
      );
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse);
    }
  }

  async bulkCreate(req: Request, res: Response): Promise<void> {
    try {
      const { items } = req.body;
      const context = this.getRequestContext(req);
      const result = await this.service.bulkCreate(items, context);
      
      const response = ResponseBuilder.created(result);
      res.status(HttpStatus.CREATED).json(response);
    } catch (error) {
      const errorResponse = ResponseBuilder.error(
        ApiErrorCode.INTERNAL_ERROR,
        `Failed to bulk create resources: ${(error as Error).message}`
      );
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse);
    }
  }

  async bulkUpdate(req: Request, res: Response): Promise<void> {
    try {
      const { updates } = req.body;
      const context = this.getRequestContext(req);
      const result = await this.service.bulkUpdate(updates, context);
      
      const response = ResponseBuilder.updated(result);
      res.status(HttpStatus.OK).json(response);
    } catch (error) {
      const errorResponse = ResponseBuilder.error(
        ApiErrorCode.INTERNAL_ERROR,
        `Failed to bulk update resources: ${(error as Error).message}`
      );
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse);
    }
  }

  async bulkDelete(req: Request, res: Response): Promise<void> {
    try {
      const { ids } = req.body;
      const context = this.getRequestContext(req);
      const result = await this.service.bulkDelete(ids, context);
      
      const response = ResponseBuilder.deleted(
        `${result} resources deleted successfully`
      );
      res.status(HttpStatus.OK).json(response);
    } catch (error) {
      const errorResponse = ResponseBuilder.error(
        ApiErrorCode.INTERNAL_ERROR,
        `Failed to bulk delete resources: ${(error as Error).message}`
      );
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse);
    }
  }

  // Helper methods
  protected getRequestContext(req: Request): RequestContext {
    return {
      request: {
        method: req.method,
        path: req.path,
        headers: req.headers as Record<string, string>,
        body: req.body,
        query: req.query as Record<string, string>,
        params: req.params as Record<string, string>,
        user: (req as any).user,
        timestamp: new Date().toISOString(),
      },
      user: (req as any).user,
      startTime: Date.now(),
      requestId: this.generateRequestId(),
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    };
  }

  protected buildQuery(req: Request): any {
    const { 
      page = '1', 
      limit = '20', 
      sort = '{}',
      filters = '{}',
      search 
    } = req.query as any;

    return {
      pagination: { 
        page: parseInt(page), 
        limit: parseInt(limit) 
      },
      sort: sort ? JSON.parse(sort) : {},
      filters: filters ? JSON.parse(filters) : {},
      ...(search && { 
        search: { 
          query: search.query, 
          fields: search.fields ? search.fields.split(',') : undefined 
        } 
      }),
    };
  }

  protected generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  protected validateCreateData(data: any): string[] {
    const errors: string[] = [];
    
    if (!data) {
      errors.push('Request body is required');
    }
    
    return errors;
  }

  protected validateUpdateData(data: any): string[] {
    const errors: string[] = [];
    
    if (!data) {
      errors.push('Request body is required');
    }
    
    return errors;
  }

  protected validateId(id: string): boolean {
    return Boolean(id && typeof id === 'string' && id.length > 0);
  }
}

export default GenericController;
