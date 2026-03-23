import { IGenericService, ApiResponse, ListResponse, QueryRequest, RequestContext } from '../types/api';
import { IGenericDAO } from '../dao/GenericDAO';

export abstract class GenericService<T, CreateDto, UpdateDto> implements IGenericService<T, CreateDto, UpdateDto> {
  constructor(
    protected dao: IGenericDAO<T, CreateDto, UpdateDto>
  ) {}

  // Basic CRUD operations
  async create(data: CreateDto, context?: RequestContext): Promise<T> {
    try {
      return await this.dao.create(data, context);
    } catch (error) {
      throw new Error(`Failed to create resource: ${(error as Error).message}`);
    }
  }

  async findById(id: string, context?: RequestContext): Promise<T | null> {
    try {
      return await this.dao.findById(id, context);
    } catch (error) {
      throw new Error(`Failed to find resource by id: ${(error as Error).message}`);
    }
  }

  async findAll(query?: QueryRequest, context?: RequestContext): Promise<ListResponse<T>> {
    try {
      return await this.dao.findAll(query, context);
    } catch (error) {
      throw new Error(`Failed to find all resources: ${(error as Error).message}`);
    }
  }

  async update(id: string, data: UpdateDto, context?: RequestContext): Promise<T> {
    try {
      return await this.dao.update(id, data, context);
    } catch (error) {
      throw new Error(`Failed to update resource: ${(error as Error).message}`);
    }
  }

  async delete(id: string, context?: RequestContext): Promise<boolean> {
    try {
      return await this.dao.delete(id, context);
    } catch (error) {
      throw new Error(`Failed to delete resource: ${(error as Error).message}`);
    }
  }

  async count(query?: QueryRequest, context?: RequestContext): Promise<number> {
    try {
      return await this.dao.count(query, context);
    } catch (error) {
      throw new Error(`Failed to count resources: ${(error as Error).message}`);
    }
  }

  // Bulk operations
  async bulkCreate(items: CreateDto[], context?: RequestContext): Promise<T[]> {
    try {
      return await this.dao.bulkCreate(items, context);
    } catch (error) {
      throw new Error(`Failed to bulk create resources: ${(error as Error).message}`);
    }
  }

  async bulkUpdate(updates: Array<{ id: string; data: UpdateDto }>, context?: RequestContext): Promise<T[]> {
    try {
      return await this.dao.bulkUpdate(updates, context);
    } catch (error) {
      throw new Error(`Failed to bulk update resources: ${(error as Error).message}`);
    }
  }

  async bulkDelete(ids: string[], context?: RequestContext): Promise<number> {
    try {
      return await this.dao.bulkDelete(ids, context);
    } catch (error) {
      throw new Error(`Failed to bulk delete resources: ${(error as Error).message}`);
    }
  }

  // Advanced query methods
  async findOne(filters: Record<string, any>, context?: RequestContext): Promise<T | null> {
    try {
      const query: QueryRequest = {
        filters,
        pagination: { limit: 1 }
      };
      const result = await this.dao.findAll(query, context);
      return result.items.length > 0 ? result.items[0] : null;
    } catch (error) {
      throw new Error(`Failed to find one resource: ${(error as Error).message}`);
    }
  }

  async findMany(ids: string[], context?: RequestContext): Promise<T[]> {
    try {
      const results: T[] = [];
      
      for (const id of ids) {
        const item = await this.dao.findById(id, context);
        if (item) {
          results.push(item);
        }
      }
      
      return results;
    } catch (error) {
      throw new Error(`Failed to find many resources: ${(error as Error).message}`);
    }
  }

  async exists(filters: Record<string, any>, context?: RequestContext): Promise<boolean> {
    try {
      const item = await this.findOne(filters, context);
      return item !== null;
    } catch (error) {
      throw new Error(`Failed to check resource existence: ${(error as Error).message}`);
    }
  }

  // Transaction support
  async transaction<R>(operation: () => Promise<R>, context?: RequestContext): Promise<R> {
    try {
      // This would need to be implemented in the specific DAO
      // For now, we'll just execute the operation
      return await operation();
    } catch (error) {
      throw new Error(`Transaction failed: ${(error as Error).message}`);
    }
  }

  // Validation helpers
  protected validateId(id: string): boolean {
    return Boolean(id && typeof id === 'string' && id.trim().length > 0);
  }

  protected validateCreateData(data: CreateDto): string[] {
    const errors: string[] = [];
    
    if (!data) {
      errors.push('Data is required');
    }
    
    return errors;
  }

  protected validateUpdateData(data: UpdateDto): string[] {
    const errors: string[] = [];
    
    if (!data) {
      errors.push('Data is required');
    }
    
    return errors;
  }

  // Business logic helpers (to be overridden by concrete services)
  protected async beforeCreate(data: CreateDto, context?: RequestContext): Promise<void> {
    // Hook for before create operations
  }

  protected async afterCreate(entity: T, data: CreateDto, context?: RequestContext): Promise<void> {
    // Hook for after create operations
  }

  protected async beforeUpdate(id: string, data: UpdateDto, context?: RequestContext): Promise<void> {
    // Hook for before update operations
  }

  protected async afterUpdate(entity: T, data: UpdateDto, context?: RequestContext): Promise<void> {
    // Hook for after update operations
  }

  protected async beforeDelete(id: string, context?: RequestContext): Promise<void> {
    // Hook for before delete operations
  }

  protected async afterDelete(id: string, context?: RequestContext): Promise<void> {
    // Hook for after delete operations
  }

  // Utility methods
  protected generateSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  protected sanitizeSearchTerm(term: string): string {
    return term.trim().toLowerCase();
  }

  protected buildSearchQuery(searchTerm: string, fields?: string[]): Record<string, any> {
    const sanitized = this.sanitizeSearchTerm(searchTerm);
    
    if (!fields || fields.length === 0) {
      return {
        $or: [
          { name: { $ilike: `%${sanitized}%` } },
          { description: { $ilike: `%${sanitized}%` } }
        ]
      };
    }

    const searchConditions = fields.map(field => ({
      [field]: { $ilike: `%${sanitized}%` }
    }));

    return {
      $or: searchConditions
    };
  }
}

export default GenericService;
