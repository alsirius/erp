import { IGenericDAO } from '../../dao/generic/IGenericDAO';
import { ListResponse, QueryRequest, RequestContext, ApiResponse, ApiErrorCode } from '../../types/api';

// Service Response interface
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: ApiErrorCode;
    message: string;
    statusCode: number;
    details?: any;
  };
}

/**
 * Generic Service Implementation
 * 
 * Provides business logic abstraction layer between controllers and DAOs.
 * Implements common service patterns including validation, business rules,
 * error handling, and transaction management.
 * 
 * @template T - The entity type
 * @template CreateDto - The DTO type for creating entities
 * @template UpdateDto - The DTO type for updating entities
 */
export abstract class GenericService<T, CreateDto, UpdateDto> {
  protected dao: IGenericDAO<T, CreateDto, UpdateDto>;
  protected entityName: string;

  constructor(dao: IGenericDAO<T, CreateDto, UpdateDto>, entityName: string) {
    this.dao = dao;
    this.entityName = entityName;
  }

  // Basic CRUD operations
  async create(data: CreateDto, context?: RequestContext): Promise<ServiceResponse<T>> {
    try {
      // Pre-create validation and business logic
      const validationResult = await this.validateCreateData(data, context);
      if (!validationResult.isValid) {
        return {
          success: false,
          error: {
            code: ApiErrorCode.VALIDATION_FAILED,
            message: 'Validation failed',
            statusCode: 400,
            details: validationResult.errors
          }
        };
      }

      // Pre-create business logic hook
      const businessResult = await this.beforeCreate(data, context);
      if (!businessResult.success) {
        return businessResult;
      }

      // Create the entity
      const entity = await this.dao.create(data);

      // Post-create business logic hook
      await this.afterCreate(entity, context);

      return {
        success: true,
        data: entity
      };
    } catch (error) {
      return this.handleError(error, 'create');
    }
  }

  async findById(id: string, context?: RequestContext): Promise<ServiceResponse<T>> {
    try {
      // Pre-find business logic hook
      await this.beforeFind(id, context);

      const entity = await this.dao.findById(id);
      
      if (!entity) {
        return {
          success: false,
          error: {
            code: ApiErrorCode.NOT_FOUND,
            message: `${this.entityName} with id ${id} not found`,
            statusCode: 404
          }
        };
      }

      // Authorization check
      const authResult = await this.canRead(entity, context);
      if (!authResult.success) {
        return authResult;
      }

      // Post-find business logic hook
      await this.afterFind(entity, context);

      return {
        success: true,
        data: entity
      };
    } catch (error) {
      return this.handleError(error, 'findById');
    }
  }

  async findAll(query: QueryRequest, context?: RequestContext): Promise<ServiceResponse<ListResponse<T>>> {
    try {
      // Pre-findAll business logic hook
      await this.beforeFindAll(query, context);

      // Apply business logic filters
      const enhancedQuery = await this.applyBusinessFilters(query, context);

      // Authorization check for list access
      const authResult = await this.canList(enhancedQuery, context);
      if (!authResult.success) {
        return authResult as ServiceResponse<ListResponse<T>>;
      }

      const result = await this.dao.findAll(enhancedQuery);

      // Filter results based on authorization
      const filteredItems = await this.filterAuthorizedResults(result.items, context);

      // Post-findAll business logic hook
      await this.afterFindAll(filteredItems, context);

      return {
        success: true,
        data: {
          ...result,
          items: filteredItems
        }
      };
    } catch (error) {
      return this.handleError(error, 'findAll');
    }
  }

  async update(id: string, data: UpdateDto, context?: RequestContext): Promise<ServiceResponse<T>> {
    try {
      // Check if entity exists
      const existing = await this.dao.findById(id);
      if (!existing) {
        return {
          success: false,
          error: {
            code: ApiErrorCode.NOT_FOUND,
            message: `${this.entityName} with id ${id} not found`,
            statusCode: 404
          }
        };
      }

      // Authorization check
      const authResult = await this.canUpdate(existing, context);
      if (!authResult.success) {
        return authResult;
      }

      // Pre-update validation and business logic
      const validationResult = await this.validateUpdateData(data, existing, context);
      if (!validationResult.isValid) {
        return {
          success: false,
          error: {
            code: ApiErrorCode.VALIDATION_FAILED,
            message: 'Validation failed',
            statusCode: 400,
            details: validationResult.errors
          }
        };
      }

      // Pre-update business logic hook
      const businessResult = await this.beforeUpdate(existing, data, context);
      if (!businessResult.success) {
        return businessResult;
      }

      // Update the entity
      const updatedEntity = await this.dao.update(id, data);

      // Post-update business logic hook
      await this.afterUpdate(updatedEntity, existing, context);

      return {
        success: true,
        data: updatedEntity
      };
    } catch (error) {
      return this.handleError(error, 'update');
    }
  }

  async delete(id: string, context?: RequestContext): Promise<ServiceResponse<boolean>> {
    try {
      // Check if entity exists
      const existing = await this.dao.findById(id);
      if (!existing) {
        return {
          success: false,
          error: {
            code: ApiErrorCode.NOT_FOUND,
            message: `${this.entityName} with id ${id} not found`,
            statusCode: 404
          }
        };
      }

      // Authorization check
      const authResult = await this.canDelete(existing, context);
      if (!authResult.success) {
        return authResult as ServiceResponse<boolean>;
      }

      // Pre-delete business logic hook
      const businessResult = await this.beforeDelete(existing, context);
      if (!businessResult.success) {
        return businessResult as ServiceResponse<boolean>;
      }

      // Delete the entity
      const deleted = await this.dao.delete(id);

      // Post-delete business logic hook
      await this.afterDelete(existing, context);

      return {
        success: true,
        data: deleted
      };
    } catch (error) {
      return this.handleError(error, 'delete');
    }
  }

  // Bulk operations
  async bulkCreate(items: CreateDto[], context?: RequestContext): Promise<ServiceResponse<T[]>> {
    try {
      // Validate all items first
      for (const item of items) {
        const validationResult = await this.validateCreateData(item, context);
        if (!validationResult.isValid) {
          return {
            success: false,
            error: {
              code: ApiErrorCode.VALIDATION_FAILED,
              message: 'Validation failed for one or more items',
              statusCode: 400,
              details: validationResult.errors
            }
          };
        }
      }

      // Pre-bulk-create business logic hook
      await this.beforeBulkCreate(items, context);

      // Create entities
      const entities = await this.dao.bulkCreate(items);

      // Post-bulk-create business logic hook
      await this.afterBulkCreate(entities, context);

      return {
        success: true,
        data: entities
      };
    } catch (error) {
      return this.handleError(error, 'bulkCreate');
    }
  }

  async bulkUpdate(
    updates: Array<{ id: string; data: UpdateDto }>, 
    context?: RequestContext
  ): Promise<ServiceResponse<T[]>> {
    try {
      // Validate all updates first
      for (const { id, data } of updates) {
        const existing = await this.dao.findById(id);
        if (!existing) {
          return {
            success: false,
            error: {
              code: ApiErrorCode.NOT_FOUND,
              message: `${this.entityName} with id ${id} not found`,
              statusCode: 404
            }
          };
        }

        const validationResult = await this.validateUpdateData(data, existing, context);
        if (!validationResult.isValid) {
          return {
            success: false,
            error: {
              code: ApiErrorCode.VALIDATION_FAILED,
              message: 'Validation failed for one or more updates',
              statusCode: 400,
              details: validationResult.errors
            }
          };
        }
      }

      // Pre-bulk-update business logic hook
      await this.beforeBulkUpdate(updates, context);

      // Update entities
      const entities = await this.dao.bulkUpdate(updates);

      // Post-bulk-update business logic hook
      await this.afterBulkUpdate(entities, context);

      return {
        success: true,
        data: entities
      };
    } catch (error) {
      return this.handleError(error, 'bulkUpdate');
    }
  }

  async bulkDelete(ids: string[], context?: RequestContext): Promise<ServiceResponse<number>> {
    try {
      // Check authorization for all entities
      for (const id of ids) {
        const existing = await this.dao.findById(id);
        if (!existing) {
          return {
            success: false,
            error: {
              code: ApiErrorCode.NOT_FOUND,
              message: `${this.entityName} with id ${id} not found`,
              statusCode: 404
            }
          };
        }

        const authResult = await this.canDelete(existing, context);
        if (!authResult.success) {
          return authResult as ServiceResponse<number>;
        }
      }

      // Pre-bulk-delete business logic hook
      await this.beforeBulkDelete(ids, context);

      // Delete entities
      const deletedCount = await this.dao.bulkDelete(ids);

      // Post-bulk-delete business logic hook
      await this.afterBulkDelete(deletedCount, context);

      return {
        success: true,
        data: deletedCount
      };
    } catch (error) {
      return this.handleError(error, 'bulkDelete');
    }
  }

  // Count operation
  async count(query?: QueryRequest, context?: RequestContext): Promise<ServiceResponse<number>> {
    try {
      // Apply business logic filters
      const enhancedQuery = query ? await this.applyBusinessFilters(query, context) : query;

      // Authorization check
      const authResult = await this.canCount(enhancedQuery, context);
      if (!authResult.success) {
        return authResult as ServiceResponse<number>;
      }

      const count = await this.dao.count(enhancedQuery?.filters);

      return {
        success: true,
        data: count
      };
    } catch (error) {
      return this.handleError(error, 'count');
    }
  }

  // Abstract methods to be implemented by concrete services
  protected abstract validateCreateData(data: CreateDto, context?: RequestContext): Promise<ValidationResult>;
  protected abstract validateUpdateData(data: UpdateDto, existing: T, context?: RequestContext): Promise<ValidationResult>;

  // Business logic hooks (optional overrides)
  protected async beforeCreate(data: CreateDto, context?: RequestContext): Promise<ServiceResponse<any>> {
    return { success: true };
  }

  protected async afterCreate(entity: T, context?: RequestContext): Promise<void> {
    // Override in concrete services
  }

  protected async beforeFind(id: string, context?: RequestContext): Promise<void> {
    // Override in concrete services
  }

  protected async afterFind(entity: T, context?: RequestContext): Promise<void> {
    // Override in concrete services
  }

  protected async beforeFindAll(query: QueryRequest, context?: RequestContext): Promise<void> {
    // Override in concrete services
  }

  protected async afterFindAll(entities: T[], context?: RequestContext): Promise<void> {
    // Override in concrete services
  }

  protected async beforeUpdate(existing: T, data: UpdateDto, context?: RequestContext): Promise<ServiceResponse<any>> {
    return { success: true };
  }

  protected async afterUpdate(updated: T, original: T, context?: RequestContext): Promise<void> {
    // Override in concrete services
  }

  protected async beforeDelete(entity: T, context?: RequestContext): Promise<ServiceResponse<any>> {
    return { success: true };
  }

  protected async afterDelete(entity: T, context?: RequestContext): Promise<void> {
    // Override in concrete services
  }

  protected async beforeBulkCreate(items: CreateDto[], context?: RequestContext): Promise<void> {
    // Override in concrete services
  }

  protected async afterBulkCreate(entities: T[], context?: RequestContext): Promise<void> {
    // Override in concrete services
  }

  protected async beforeBulkUpdate(updates: Array<{ id: string; data: UpdateDto }>, context?: RequestContext): Promise<void> {
    // Override in concrete services
  }

  protected async afterBulkUpdate(entities: T[], context?: RequestContext): Promise<void> {
    // Override in concrete services
  }

  protected async beforeBulkDelete(ids: string[], context?: RequestContext): Promise<void> {
    // Override in concrete services
  }

  protected async afterBulkDelete(deletedCount: number, context?: RequestContext): Promise<void> {
    // Override in concrete services
  }

  // Authorization methods (to be implemented based on business rules)
  protected async canRead(entity: T, context?: RequestContext): Promise<ServiceResponse<any>> {
    return { success: true };
  }

  protected async canList(query: QueryRequest, context?: RequestContext): Promise<ServiceResponse<any>> {
    return { success: true };
  }

  protected async canUpdate(entity: T, context?: RequestContext): Promise<ServiceResponse<any>> {
    return { success: true };
  }

  protected async canDelete(entity: T, context?: RequestContext): Promise<ServiceResponse<any>> {
    return { success: true };
  }

  protected async canCount(query?: QueryRequest, context?: RequestContext): Promise<ServiceResponse<any>> {
    return { success: true };
  }

  // Business logic filters
  protected async applyBusinessFilters(query: QueryRequest, context?: RequestContext): Promise<QueryRequest> {
    // Override in concrete services to apply business-specific filters
    return query;
  }

  // Result filtering based on authorization
  protected async filterAuthorizedResults(entities: T[], context?: RequestContext): Promise<T[]> {
    // Override in concrete services to filter results based on authorization
    return entities;
  }

  // Error handling
  protected handleError(error: any, operation: string): ServiceResponse<any> {
    console.error(`Error in ${this.entityName} service during ${operation}:`, error);

    if (error.code === '23505') { // PostgreSQL unique violation
      return {
        success: false,
        error: {
          code: ApiErrorCode.ALREADY_EXISTS,
          message: `${this.entityName} already exists`,
          statusCode: 409
        }
      };
    }

    if (error.code === '23503') { // PostgreSQL foreign key violation
      return {
        success: false,
        error: {
          code: ApiErrorCode.BUSINESS_RULE_VIOLATION,
          message: 'Referenced entity does not exist',
          statusCode: 400
        }
      };
    }

    return {
      success: false,
      error: {
        code: ApiErrorCode.INTERNAL_ERROR,
        message: 'An unexpected error occurred',
        statusCode: 500,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    };
  }
}

// Validation interface
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}
