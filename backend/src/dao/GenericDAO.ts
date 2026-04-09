import { QueryRequest, ListResponse, PaginationInfo, RequestContext } from '../types/api';

export interface IGenericDAO<T, CreateDto, UpdateDto> {
  create(data: CreateDto, context?: RequestContext): Promise<T>;
  findById(id: string, context?: RequestContext): Promise<T | null>;
  findAll(query?: QueryRequest, context?: RequestContext): Promise<ListResponse<T>>;
  update(id: string, data: UpdateDto, context?: RequestContext): Promise<T>;
  delete(id: string, context?: RequestContext): Promise<boolean>;
  count(query?: QueryRequest, context?: RequestContext): Promise<number>;
  bulkCreate(items: CreateDto[], context?: RequestContext): Promise<T[]>;
  bulkUpdate(updates: Array<{ id: string; data: UpdateDto }>, context?: RequestContext): Promise<T[]>;
  bulkDelete(ids: string[], context?: RequestContext): Promise<number>;
}

export abstract class BaseDAO<T, CreateDto, UpdateDto> implements IGenericDAO<T, CreateDto, UpdateDto> {
  protected tableName: string;
  protected idField: string = 'id';

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  // Abstract methods to be implemented by concrete DAOs
  protected mapRowToEntity(row: any): T {
    return row as T;
  }
  protected abstract validateCreateData(data: CreateDto): void;
  protected abstract validateUpdateData(data: UpdateDto): void;
  protected abstract getInsertFields(): string[];
  protected abstract getUpdateFields(): string[];

  // Common CRUD operations
  async create(data: CreateDto, context?: RequestContext): Promise<T> {
    this.validateCreateData(data);
    
    const fields = this.getInsertFields();
    const values = fields.map(field => this.escapeValue(data[field as keyof CreateDto]));
    const placeholders = fields.map(() => '?').join(', ');
    
    const query = `
      INSERT INTO ${this.tableName} (${fields.join(', ')})
      VALUES (${placeholders})
      ${this.getReturningClause()}
    `;
    
    try {
      const result = await this.executeQuery(query, values);
      return this.mapRowToEntity(result.rows[0] as any);
    } catch (error) {
      throw new Error(`Failed to create ${this.tableName}: ${error}`);
    }
  }

  async findById(id: string, context?: RequestContext): Promise<T | null> {
    const query = `SELECT * FROM ${this.tableName} WHERE ${this.idField} = ?`;
    
    try {
      const result = await this.executeQuery(query, [id]);
      return result.rows.length > 0 ? this.mapRowToEntity(result.rows[0]) : null;
    } catch (error) {
      throw new Error(`Failed to find ${this.tableName} by id: ${error}`);
    }
  }

  async findAll(query?: QueryRequest, context?: RequestContext): Promise<ListResponse<T>> {
    let sql = `SELECT * FROM ${this.tableName}`;
    const params: any[] = [];
    let whereClause = '';

    // Build WHERE clause from filters
    if (query?.filters) {
      const filterConditions = this.buildFilterConditions(query.filters, params);
      if (filterConditions.length > 0) {
        whereClause = `WHERE ${filterConditions.join(' AND ')}`;
      }
    }

    sql += ` ${whereClause}`;

    // Add ORDER BY clause
    if (query?.sort) {
      const sortConditions = Object.entries(query.sort)
        .map(([field, direction]) => `${this.formatIdentifier(field)} ${direction.toUpperCase()}`)
        .join(', ');
      sql += ` ORDER BY ${sortConditions}`;
    }

    // Add pagination
    const pagination = this.buildPagination(query?.pagination);
    sql += pagination.clause;
    params.push(...pagination.params);

    try {
      const result = await this.executeQuery(sql, params);
      
      // Get total count for pagination
      const countQuery = `SELECT COUNT(*) as total FROM ${this.tableName} ${whereClause}`;
      const countResult = await this.executeQuery(countQuery, params.slice(0, -pagination.params.length));
      const total = parseInt(countResult.rows[0].total);

      const paginationInfo = this.buildPaginationInfo(query?.pagination, total);

      return {
        items: result.rows.map((row: any) => this.mapRowToEntity(row)),
        pagination: paginationInfo,
      };
    } catch (error) {
      throw new Error(`Failed to find all ${this.tableName}: ${error}`);
    }
  }

  async update(id: string, data: UpdateDto, context?: RequestContext): Promise<T> {
    this.validateUpdateData(data);
    
    const fields = this.getUpdateFields();
    const updateConditions = fields
      .filter(field => data[field as keyof UpdateDto] !== undefined)
      .map(field => `${field} = ?`);
    
    if (updateConditions.length === 0) {
      throw new Error('No valid fields to update');
    }

    const values = fields
      .filter(field => data[field as keyof UpdateDto] !== undefined)
      .map(field => this.escapeValue(data[field as keyof UpdateDto]));
    
    values.push(id);

    const query = `
      UPDATE ${this.tableName}
      SET ${updateConditions.join(', ')}
      WHERE ${this.idField} = ?
      RETURNING *
    `;

    try {
      const result = await this.executeQuery(query, values);
      return this.mapRowToEntity(result.rows[0] as any);
    } catch (error) {
      throw new Error(`Failed to update ${this.tableName}: ${error}`);
    }
  }

  async delete(id: string, context?: RequestContext): Promise<boolean> {
    const query = `DELETE FROM ${this.tableName} WHERE ${this.idField} = ?`;
    
    try {
      const result = await this.executeQuery(query, [id]);
      return result.rowCount > 0;
    } catch (error) {
      throw new Error(`Failed to delete ${this.tableName}: ${error}`);
    }
  }

  async count(query?: QueryRequest, context?: RequestContext): Promise<number> {
    let sql = `SELECT COUNT(*) as total FROM ${this.tableName}`;
    const params: any[] = [];

    if (query?.filters) {
      const filterConditions = this.buildFilterConditions(query.filters, params);
      if (filterConditions.length > 0) {
        sql += ` WHERE ${filterConditions.join(' AND ')}`;
      }
    }

    try {
      const result = await this.executeQuery(sql, params);
      return parseInt(result.rows[0].total);
    } catch (error) {
      throw new Error(`Failed to count ${this.tableName}: ${error}`);
    }
  }

  async bulkCreate(items: CreateDto[], context?: RequestContext): Promise<T[]> {
    if (items.length === 0) {
      return [];
    }

    // Validate all items
    items.forEach(item => this.validateCreateData(item));

    const fields = this.getInsertFields();
    const values: any[] = [];
    const placeholders: string[] = [];

    items.forEach(item => {
      fields.forEach(field => {
        values.push(this.escapeValue(item[field as keyof CreateDto]));
      });
      placeholders.push(`(${fields.map(() => '?').join(', ')})`);
    });

    const query = `
      INSERT INTO ${this.tableName} (${fields.join(', ')})
      VALUES ${placeholders.join(', ')}
      RETURNING *
    `;

    try {
      const result = await this.executeQuery(query, values);
      return result.rows.map((row: any) => this.mapRowToEntity(row));
    } catch (error) {
      throw new Error(`Failed to bulk create ${this.tableName}: ${error}`);
    }
  }

  async bulkUpdate(updates: Array<{ id: string; data: UpdateDto }>, context?: RequestContext): Promise<T[]> {
    if (updates.length === 0) {
      return [];
    }

    const fields = this.getUpdateFields();
    const values: any[] = [];
    const setClauses: string[] = [];

    updates.forEach(update => {
      this.validateUpdateData(update.data);
      
      const updateFields = fields
        .filter(field => update.data[field as keyof UpdateDto] !== undefined)
        .map(field => `${field} = ?`);
      
      if (updateFields.length === 0) {
        return; // Skip this update if no valid fields
      }

      setClauses.push(`WHEN ${this.idField} = ? THEN ${updateFields.join(', ')}`);
      values.push(...updateFields.map(field => this.escapeValue(update.data[field as keyof UpdateDto])));
      values.push(update.id);
    });

    if (setClauses.length === 0) {
      return [];
    }

    const query = `
      UPDATE ${this.tableName}
      SET ${fields.map(field => `${field} = CASE ${setClauses.join(' ')} END`).join(', ')}
      WHERE ${this.idField} IN (${updates.map(() => '?').join(', ')})
      RETURNING *
    `;

    values.push(...updates.map(u => u.id));

    try {
      const result = await this.executeQuery(query, values);
      return result.rows.map((row: any) => this.mapRowToEntity(row));
    } catch (error) {
      throw new Error(`Failed to bulk update ${this.tableName}: ${error}`);
    }
  }

  async bulkDelete(ids: string[], context?: RequestContext): Promise<number> {
    if (ids.length === 0) {
      return 0;
    }

    const placeholders = ids.map(() => '?').join(', ');
    const query = `DELETE FROM ${this.tableName} WHERE ${this.idField} IN (${placeholders})`;

    try {
      const result = await this.executeQuery(query, ids);
      return result.rowCount;
    } catch (error) {
      throw new Error(`Failed to bulk delete ${this.tableName}: ${error}`);
    }
  }

  // Protected helper methods
  protected formatIdentifier(id: string): string {
    return id;
  }

  protected getReturningClause(): string {
    return 'RETURNING *';
  }

  protected abstract executeQuery(query: string, params: any[]): Promise<any>;

  protected buildFilterConditions(filters: Record<string, any>, params: any[]): string[] {
    const conditions: string[] = [];

    Object.entries(filters).forEach(([field, value]) => {
      const formattedField = this.formatIdentifier(field);
      if (value === undefined || value === null) {
        return;
      }

      if (Array.isArray(value)) {
        const placeholders = value.map(() => '?').join(', ');
        conditions.push(`${formattedField} IN (${placeholders})`);
        params.push(...value);
      } else if (typeof value === 'object' && value !== null) {
        // Handle range queries, like operators
        Object.entries(value).forEach(([operator, operatorValue]) => {
          switch (operator) {
            case '$gt':
              conditions.push(`${formattedField} > ?`);
              params.push(operatorValue);
              break;
            case '$gte':
              conditions.push(`${formattedField} >= ?`);
              params.push(operatorValue);
              break;
            case '$lt':
              conditions.push(`${formattedField} < ?`);
              params.push(operatorValue);
              break;
            case '$lte':
              conditions.push(`${formattedField} <= ?`);
              params.push(operatorValue);
              break;
            case '$ne':
              conditions.push(`${formattedField} != ?`);
              params.push(operatorValue);
              break;
            case '$like':
              conditions.push(`${formattedField} LIKE ?`);
              params.push(`%${operatorValue}%`);
              break;
            case '$ilike':
              conditions.push(`${formattedField} ILIKE ?`);
              params.push(`%${operatorValue}%`);
              break;
            default:
              conditions.push(`${formattedField} = ?`);
              params.push(operatorValue);
          }
        });
      } else {
        conditions.push(`${formattedField} = ?`);
        params.push(value);
      }
    });

    return conditions;
  }

  protected buildPagination(pagination?: { page?: number; limit?: number }): { clause: string; params: number[] } {
    if (!pagination) {
      return { clause: '', params: [] };
    }

    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;

    return {
      clause: ` LIMIT ? OFFSET ?`,
      params: [limit, offset],
    };
  }

  protected buildPaginationInfo(pagination?: { page?: number; limit?: number }, total?: number): PaginationInfo {
    if (!pagination || !total) {
      return {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      };
    }

    const { page = 1, limit = 20 } = pagination;
    const totalPages = Math.ceil(total / limit);

    return {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  protected escapeValue(value: any): any {
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }
    return value;
  }
}

// PostgreSQL-specific implementation
export abstract class PostgreSQLDAO<T, CreateDto, UpdateDto> extends BaseDAO<T, CreateDto, UpdateDto> {
  constructor(tableName: string, protected pool: any) {
    super(tableName);
  }

  protected async executeQuery(query: string, params: any[]): Promise<any> {
    const result = await this.pool.query(query, params);
    return {
      rows: result.rows,
      rowCount: result.rowCount || 0,
    };
  }
}

// SQLite-specific implementation (for development)
export abstract class SQLiteDAO<T, CreateDto, UpdateDto> extends BaseDAO<T, CreateDto, UpdateDto> {
  constructor(tableName: string, protected db: any) {
    super(tableName);
  }

  protected async executeQuery(query: string, params: any[]): Promise<any> {
    const stmt = this.db.prepare(query);
    const result = stmt.all(params);
    return {
      rows: result,
      rowCount: result.length,
    };
  }
}

// Snowflake-specific implementation
export abstract class SnowflakeDAO<T, CreateDto, UpdateDto> extends BaseDAO<T, CreateDto, UpdateDto> {
  constructor(tableName: string, protected queryExecutor: (sql: string, binds?: any[]) => Promise<any[]>) {
    super(tableName);
  }

  protected async executeQuery(query: string, params: any[]): Promise<any> {
    // Snowflake uses ? for positional binds (Standard API) or :1, :2
    // We assume the queryExecutor handles binds correctly
    const rows = await this.queryExecutor(query, params);
    return {
      rows: rows,
      rowCount: rows.length,
    };
  }

  // Snowflake doesn't support RETURNING * in the same way
  protected getReturningClause(): string {
    return '';
  }

  // Override create to handle Snowflake's lack of RETURNING
  async create(data: CreateDto, context?: RequestContext): Promise<T> {
    this.validateCreateData(data);
    
    const fields = this.getInsertFields();
    const values = fields.map(field => this.escapeValue(data[field as keyof CreateDto]));
    const placeholders = fields.map(() => '?').join(', ');
    
    const query = `
      INSERT INTO ${this.tableName} (${fields.join(', ')})
      VALUES (${placeholders})
    `;
    
    try {
      await this.executeQuery(query, values);
      // For Snowflake, we might need a separate query to get the created record if it has defaults
      // But for now, we'll return the object as sent (with the ID)
      return { ...data } as unknown as T;
    } catch (error) {
      throw new Error(`Failed to create ${this.tableName} in Snowflake: ${error}`);
    }
  }

  protected formatIdentifier(id: string): string {
    return id.toUpperCase();
  }

  // Override buildFilterConditions for Snowflake (case-insensitive search often uses ILIKE)
  protected buildFilterConditions(filters: Record<string, any>, params: any[]): string[] {
    const conditions = super.buildFilterConditions(filters, params);
    // You could customize Snowflake specific operators here if needed
    return conditions;
  }
}

