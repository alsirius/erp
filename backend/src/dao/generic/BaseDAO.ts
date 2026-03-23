import { v4 as uuidv4 } from 'uuid';
import { IGenericDAO, IBaseDAO, IEntityValidator, ValidationResult, ValidationError } from './IGenericDAO';
import { ListResponse, QueryRequest, PaginationInfo } from '../../types/api';

/**
 * Abstract Base DAO
 * 
 * Provides common functionality for all DAO implementations.
 * This class implements the generic CRUD operations and provides
 * hooks for database-specific implementations.
 * 
 * @template T - The entity type
 * @template CreateDto - The DTO type for creating entities
 * @template UpdateDto - The DTO type for updating entities
 */
export abstract class BaseDAO<T, CreateDto, UpdateDto> implements IGenericDAO<T, CreateDto, UpdateDto>, IBaseDAO {
  protected tableName: string;
  protected validator?: IEntityValidator<T, CreateDto, UpdateDto>;
  protected connection: any; // Database connection (will be set by concrete implementations)

  constructor(tableName: string, validator?: IEntityValidator<T, CreateDto, UpdateDto>) {
    this.tableName = tableName;
    this.validator = validator;
  }

  // Abstract methods that must be implemented by concrete DAOs
  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract isConnected(): boolean;
  abstract healthCheck(): Promise<boolean>;

  // Abstract database operations
  protected abstract executeQuery<T = any>(sql: string, params?: any[]): Promise<T[]>;
  protected abstract executeQueryOne<T = any>(sql: string, params?: any[]): Promise<T | null>;
  protected abstract executeCommand(sql: string, params?: any[]): Promise<{ affectedRows: number; insertId?: string }>;
  protected abstract beginTransaction(): Promise<void>;
  protected abstract commit(): Promise<void>;
  protected abstract rollback(): Promise<void>;

  // Abstract mapping methods
  protected abstract mapRowToEntity(row: any): T;
  protected abstract mapEntityToRow(entity: T): any;
  protected abstract getInsertFields(): string[];
  protected abstract getUpdateFields(): string[];
  protected abstract generateId(): string;

  // Validation methods
  protected abstract validateCreateData(data: CreateDto): void;
  protected abstract validateUpdateData(data: UpdateDto): void;

  // Table operations
  abstract createTable(): Promise<void>;
  abstract dropTable(): Promise<void>;
  abstract tableExists(): Promise<boolean>;

  // Basic CRUD operations
  async findById(id: string): Promise<T | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE id = ? AND deleted = 0`;
    const row = await this.executeQueryOne(sql, [id]);
    return row ? this.mapRowToEntity(row) : null;
  }

  async create(data: CreateDto): Promise<T> {
    // Validate data if validator is provided
    if (this.validator) {
      const validation = await this.validator.validateCreate(data);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
      }
    }

    // Custom validation
    this.validateCreateData(data);

    const id = this.generateId();
    const now = new Date();
    const row = {
      id,
      created_at: now,
      updated_at: now,
      deleted: 0,
      ...this.mapEntityToRow(data as any)
    };

    const fields = Object.keys(row);
    const placeholders = fields.map(() => '?').join(', ');
    const values = Object.values(row);

    const sql = `INSERT INTO ${this.tableName} (${fields.join(', ')}) VALUES (${placeholders})`;
    
    await this.executeCommand(sql, values);
    return this.findById(id) as Promise<T>;
  }

  async update(id: string, data: UpdateDto): Promise<T> {
    // Validate data if validator is provided
    if (this.validator) {
      const validation = await this.validator.validateUpdate(data);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
      }
    }

    // Custom validation
    this.validateUpdateData(data);

    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Entity with id ${id} not found`);
    }

    const updateData = {
      updated_at: new Date(),
      ...this.mapEntityToRow(data as any)
    };

    const updateFields = this.getUpdateFields().filter(field => 
      updateData.hasOwnProperty(field) && updateData[field] !== undefined
    );

    if (updateFields.length === 0) {
      return existing; // No updates needed
    }

    const setClause = updateFields.map(field => `${field} = ?`).join(', ');
    const values = updateFields.map(field => updateData[field]);
    values.push(id);

    const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE id = ? AND deleted = 0`;
    await this.executeCommand(sql, values);

    return this.findById(id) as Promise<T>;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) {
      return false;
    }

    const sql = `UPDATE ${this.tableName} SET deleted = 1, updated_at = ? WHERE id = ?`;
    await this.executeCommand(sql, [new Date(), id]);
    return true;
  }

  // Query operations
  async findAll(query: QueryRequest = {}): Promise<ListResponse<T>> {
    let sql = `SELECT * FROM ${this.tableName} WHERE deleted = 0`;
    const params: any[] = [];

    // Apply filters
    if (query.filters && Object.keys(query.filters).length > 0) {
      const filterConditions: string[] = [];
      Object.entries(query.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            filterConditions.push(`${key} IN (${value.map(() => '?').join(', ')})`);
            params.push(...value);
          } else {
            filterConditions.push(`${key} = ?`);
            params.push(value);
          }
        }
      });
      if (filterConditions.length > 0) {
        sql += ` AND ${filterConditions.join(' AND ')}`;
      }
    }

    // Apply search
    if (query.search?.query && query.search.fields) {
      const searchConditions = query.search.fields.map(field => `${field} LIKE ?`);
      sql += ` AND (${searchConditions.join(' OR ')})`;
      const searchTerm = `%${query.search.query}%`;
      params.push(...query.search.fields.map(() => searchTerm));
    }

    // Count total records
    const countSql = sql.replace(/SELECT \* FROM/, 'SELECT COUNT(*) as total FROM');
    const countResult = await this.executeQueryOne(countSql, params);
    const total = countResult?.total || 0;

    // Apply sorting
    if (query.sort && Object.keys(query.sort).length > 0) {
      const sortConditions = Object.entries(query.sort).map(([field, direction]) => 
        `${field} ${direction.toUpperCase()}`
      );
      sql += ` ORDER BY ${sortConditions.join(', ')}`;
    } else {
      sql += ' ORDER BY created_at DESC';
    }

    // Apply pagination
    const page = query.pagination?.page || 1;
    const limit = query.pagination?.limit || 10;
    const offset = (page - 1) * limit;

    sql += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const rows = await this.executeQuery(sql, params);
    const items = rows.map(row => this.mapRowToEntity(row));

    const totalPages = Math.ceil(total / limit);
    const pagination: PaginationInfo = {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };

    return {
      items,
      pagination,
      filters: query.filters
    };
  }

  async findOne(filters: Record<string, any>): Promise<T | null> {
    const result = await this.findMany(filters, { limit: 1 });
    return result.length > 0 ? result[0] : null;
  }

  async findMany(
    filters: Record<string, any>, 
    options: {
      limit?: number;
      offset?: number;
      orderBy?: string;
      orderDirection?: 'asc' | 'desc';
    } = {}
  ): Promise<T[]> {
    let sql = `SELECT * FROM ${this.tableName} WHERE deleted = 0`;
    const params: any[] = [];

    // Apply filters
    if (Object.keys(filters).length > 0) {
      const filterConditions: string[] = [];
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            filterConditions.push(`${key} IN (${value.map(() => '?').join(', ')})`);
            params.push(...value);
          } else {
            filterConditions.push(`${key} = ?`);
            params.push(value);
          }
        }
      });
      if (filterConditions.length > 0) {
        sql += ` AND ${filterConditions.join(' AND ')}`;
      }
    }

    // Apply ordering
    const orderBy = options.orderBy || 'created_at';
    const orderDirection = options.orderDirection || 'desc';
    sql += ` ORDER BY ${orderBy} ${orderDirection.toUpperCase()}`;

    // Apply limit and offset
    if (options.limit) {
      sql += ' LIMIT ?';
      params.push(options.limit);
    }
    if (options.offset) {
      sql += ' OFFSET ?';
      params.push(options.offset);
    }

    const rows = await this.executeQuery(sql, params);
    return rows.map(row => this.mapRowToEntity(row));
  }

  // Bulk operations
  async bulkCreate(items: CreateDto[]): Promise<T[]> {
    if (items.length === 0) return [];

    const results: T[] = [];
    
    // Use transaction for bulk operations
    await this.beginTransaction();
    try {
      for (const item of items) {
        const result = await this.create(item);
        results.push(result);
      }
      await this.commit();
    } catch (error) {
      await this.rollback();
      throw error;
    }

    return results;
  }

  async bulkUpdate(updates: Array<{ id: string; data: UpdateDto }>): Promise<T[]> {
    if (updates.length === 0) return [];

    const results: T[] = [];
    
    await this.beginTransaction();
    try {
      for (const { id, data } of updates) {
        const result = await this.update(id, data);
        results.push(result);
      }
      await this.commit();
    } catch (error) {
      await this.rollback();
      throw error;
    }

    return results;
  }

  async bulkDelete(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;

    const placeholders = ids.map(() => '?').join(',');
    const sql = `UPDATE ${this.tableName} SET deleted = 1, updated_at = ? WHERE id IN (${placeholders})`;
    const params = [new Date(), ...ids];

    const result = await this.executeCommand(sql, params);
    return result.affectedRows;
  }

  // Count operations
  async count(filters: Record<string, any> = {}): Promise<number> {
    let sql = `SELECT COUNT(*) as total FROM ${this.tableName} WHERE deleted = 0`;
    const params: any[] = [];

    // Apply filters
    if (Object.keys(filters).length > 0) {
      const filterConditions: string[] = [];
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            filterConditions.push(`${key} IN (${value.map(() => '?').join(', ')})`);
            params.push(...value);
          } else {
            filterConditions.push(`${key} = ?`);
            params.push(value);
          }
        }
      });
      if (filterConditions.length > 0) {
        sql += ` AND ${filterConditions.join(' AND ')}`;
      }
    }

    const result = await this.executeQueryOne(sql, params);
    return result?.total || 0;
  }

  // Existence checks
  async exists(id: string): Promise<boolean> {
    const sql = `SELECT 1 FROM ${this.tableName} WHERE id = ? AND deleted = 0 LIMIT 1`;
    const result = await this.executeQueryOne(sql, [id]);
    return !!result;
  }

  async existsBy(filters: Record<string, any>): Promise<boolean> {
    const entity = await this.findOne(filters);
    return !!entity;
  }

  // Transaction support
  async transaction<R>(operation: () => Promise<R>): Promise<R> {
    await this.beginTransaction();
    try {
      const result = await operation();
      await this.commit();
      return result;
    } catch (error) {
      await this.rollback();
      throw error;
    }
  }

  // Utility methods
  protected generateUUID(): string {
    return uuidv4();
  }

  protected getCurrentTimestamp(): Date {
    return new Date();
  }

  protected validateRequired(data: any, requiredFields: string[]): void {
    const missing = requiredFields.filter(field => !data[field]);
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
  }

  protected validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }
  }

  protected validateLength(value: string, min: number, max: number, fieldName: string): void {
    if (value.length < min || value.length > max) {
      throw new Error(`${fieldName} must be between ${min} and ${max} characters`);
    }
  }
}
