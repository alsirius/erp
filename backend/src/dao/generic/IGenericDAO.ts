import { ListResponse, QueryRequest, RequestContext } from '../../types/api';

/**
 * Generic DAO Interface
 * 
 * This interface defines the standard contract for all Data Access Objects.
 * It provides type-safe CRUD operations and supports complex queries, pagination,
 * and bulk operations.
 * 
 * @template T - The entity type
 * @template CreateDto - The DTO type for creating entities
 * @template UpdateDto - The DTO type for updating entities
 */
export interface IGenericDAO<T, CreateDto, UpdateDto> {
  // Basic CRUD operations
  findById(id: string): Promise<T | null>;
  create(data: CreateDto): Promise<T>;
  update(id: string, data: UpdateDto): Promise<T>;
  delete(id: string): Promise<boolean>;

  // Query operations
  findAll(query?: QueryRequest): Promise<ListResponse<T>>;
  findOne(filters: Record<string, any>): Promise<T | null>;
  findMany(filters: Record<string, any>, options?: {
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
  }): Promise<T[]>;

  // Bulk operations
  bulkCreate(items: CreateDto[]): Promise<T[]>;
  bulkUpdate(updates: Array<{ id: string; data: UpdateDto }>): Promise<T[]>;
  bulkDelete(ids: string[]): Promise<number>;

  // Count operations
  count(filters?: Record<string, any>): Promise<number>;

  // Existence check
  exists(id: string): Promise<boolean>;
  existsBy(filters: Record<string, any>): Promise<boolean>;

  // Transaction support (optional implementation)
  transaction<R>(operation: () => Promise<R>): Promise<R>;
}

/**
 * Base DAO interface with common database operations
 */
export interface IBaseDAO {
  // Database connection management
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;

  // Health check
  healthCheck(): Promise<boolean>;

  // Table operations
  createTable(): Promise<void>;
  dropTable(): Promise<void>;
  tableExists(): Promise<boolean>;
}

/**
 * Query builder interface for complex queries
 */
export interface IQueryBuilder<T> {
  select(fields?: string[]): IQueryBuilder<T>;
  from(table: string): IQueryBuilder<T>;
  where(condition: string, value?: any): IQueryBuilder<T>;
  whereIn(field: string, values: any[]): IQueryBuilder<T>;
  whereNotIn(field: string, values: any[]): IQueryBuilder<T>;
  whereBetween(field: string, min: any, max: any): IQueryBuilder<T>;
  whereLike(field: string, pattern: string): IQueryBuilder<T>;
  orderBy(field: string, direction?: 'asc' | 'desc'): IQueryBuilder<T>;
  groupBy(fields: string[]): IQueryBuilder<T>;
  having(condition: string, value?: any): IQueryBuilder<T>;
  limit(count: number): IQueryBuilder<T>;
  offset(count: number): IQueryBuilder<T>;
  join(table: string, condition: string): IQueryBuilder<T>;
  leftJoin(table: string, condition: string): IQueryBuilder<T>;
  rightJoin(table: string, condition: string): IQueryBuilder<T>;

  // Execute the query
  execute(): Promise<T[]>;
  first(): Promise<T | null>;
  count(): Promise<number>;
  exists(): Promise<boolean>;

  // Get the generated SQL and parameters
  toSql(): { sql: string; params: any[] };
}

/**
 * Database migration interface
 */
export interface IMigration {
  version: string;
  description: string;
  up(): Promise<void>;
  down(): Promise<void>;
}

/**
 * Database connection interface
 */
export interface IDatabaseConnection {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  queryOne<T = any>(sql: string, params?: any[]): Promise<T | null>;
  execute(sql: string, params?: any[]): Promise<{ affectedRows: number; insertId?: string }>;
  beginTransaction(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  isConnected(): boolean;
  healthCheck(): Promise<boolean>;
}

/**
 * Entity validation interface
 */
export interface IEntityValidator<T, CreateDto, UpdateDto> {
  validateCreate(data: CreateDto): Promise<ValidationResult>;
  validateUpdate(data: UpdateDto): Promise<ValidationResult>;
  validateEntity(entity: T): Promise<ValidationResult>;
}

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

/**
 * Repository pattern interface (higher level than DAO)
 */
export interface IRepository<T, CreateDto, UpdateDto> {
  // Entity operations
  findById(id: string, context?: RequestContext): Promise<T | null>;
  create(data: CreateDto, context?: RequestContext): Promise<T>;
  update(id: string, data: UpdateDto, context?: RequestContext): Promise<T>;
  delete(id: string, context?: RequestContext): Promise<boolean>;

  // Query operations
  findAll(query: QueryRequest, context?: RequestContext): Promise<ListResponse<T>>;
  search(term: string, fields?: string[], context?: RequestContext): Promise<T[]>;

  // Business operations
  archive(id: string, context?: RequestContext): Promise<boolean>;
  restore(id: string, context?: RequestContext): Promise<boolean>;
  duplicate(id: string, context?: RequestContext): Promise<T>;

  // Analytics
  getStats(filters?: Record<string, any>, context?: RequestContext): Promise<EntityStats>;
}

export interface EntityStats {
  total: number;
  active: number;
  inactive: number;
  createdThisMonth: number;
  updatedThisMonth: number;
  lastActivity?: Date;
}
