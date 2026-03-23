import { Pool, PoolClient } from 'pg';
import { BaseDAO } from './BaseDAO';
import { IDatabaseConnection } from './IGenericDAO';

/**
 * PostgreSQL DAO Implementation
 * 
 * Extends BaseDAO to provide PostgreSQL-specific functionality.
 * Uses connection pooling for better performance and supports transactions.
 * 
 * @template T - The entity type
 * @template CreateDto - The DTO type for creating entities
 * @template UpdateDto - The DTO type for updating entities
 */
export abstract class PostgreSQLDAO<T, CreateDto, UpdateDto> extends BaseDAO<T, CreateDto, UpdateDto> {
  protected pool: Pool;
  protected connection: IDatabaseConnection;

  constructor(
    tableName: string,
    connectionString: string,
    validator?: any
  ) {
    super(tableName, validator);
    this.pool = new Pool({
      connectionString,
      max: 20, // Maximum number of connections in the pool
      idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
      connectionTimeoutMillis: 2000, // How long to wait when connecting a new client
    });
    
    this.connection = new PostgreSQLConnection(this.pool);
  }

  // Connection management
  async connect(): Promise<void> {
    try {
      const client = await this.pool.connect();
      client.release();
      console.log(`Connected to PostgreSQL database for table: ${this.tableName}`);
    } catch (error) {
      console.error('Failed to connect to PostgreSQL:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.pool.end();
      console.log(`Disconnected from PostgreSQL database for table: ${this.tableName}`);
    } catch (error) {
      console.error('Failed to disconnect from PostgreSQL:', error);
      throw error;
    }
  }

  isConnected(): boolean {
    return this.pool.totalCount > 0;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.executeQueryOne('SELECT 1 as health_check');
      return !!result;
    } catch (error) {
      console.error('PostgreSQL health check failed:', error);
      return false;
    }
  }

  // Database operations
  protected async executeQuery<T = any>(sql: string, params?: any[]): Promise<T[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(sql, params);
      return result.rows;
    } catch (error) {
      console.error('PostgreSQL query error:', { sql, params, error });
      throw error;
    } finally {
      client.release();
    }
  }

  protected async executeQueryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
    const rows = await this.executeQuery<T>(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }

  protected async executeCommand(sql: string, params?: any[]): Promise<{ affectedRows: number; insertId?: string }> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(sql, params);
      return {
        affectedRows: result.rowCount || 0,
        insertId: result.rows[0]?.id // For INSERT operations with RETURNING id
      };
    } catch (error) {
      console.error('PostgreSQL command error:', { sql, params, error });
      throw error;
    } finally {
      client.release();
    }
  }

  // Transaction support
  protected async beginTransaction(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      // Store the client in a way that can be accessed during transaction
      (this as any).transactionClient = client;
    } catch (error) {
      client.release();
      throw error;
    }
  }

  protected async commit(): Promise<void> {
    const client = (this as any).transactionClient;
    if (client) {
      try {
        await client.query('COMMIT');
      } finally {
        client.release();
        (this as any).transactionClient = null;
      }
    }
  }

  protected async rollback(): Promise<void> {
    const client = (this as any).transactionClient;
    if (client) {
      try {
        await client.query('ROLLBACK');
      } finally {
        client.release();
        (this as any).transactionClient = null;
      }
    }
  }

  // Table operations
  async createTable(): Promise<void> {
    const createTableSQL = this.getCreateTableSQL();
    await this.executeCommand(createTableSQL);
    console.log(`Created table: ${this.tableName}`);
  }

  async dropTable(): Promise<void> {
    const sql = `DROP TABLE IF EXISTS ${this.tableName}`;
    await this.executeCommand(sql);
    console.log(`Dropped table: ${this.tableName}`);
  }

  async tableExists(): Promise<boolean> {
    const sql = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      );
    `;
    const result = await this.executeQueryOne(sql, [this.tableName]);
    return result?.exists || false;
  }

  // Abstract method to be implemented by concrete DAOs
  protected abstract getCreateTableSQL(): string;

  // PostgreSQL-specific helper methods
  protected generateId(): string {
    return this.generateUUID();
  }

  protected convertToPostgresTimestamp(date: Date): string {
    return date.toISOString();
  }

  protected convertFromPostgresTimestamp(timestamp: string): Date {
    return new Date(timestamp);
  }

  // JSON handling for PostgreSQL
  protected parseJSONField(field: any): any {
    if (typeof field === 'string') {
      try {
        return JSON.parse(field);
      } catch {
        return field;
      }
    }
    return field;
  }

  protected stringifyJSONField(field: any): string {
    if (typeof field === 'object') {
      return JSON.stringify(field);
    }
    return String(field);
  }

  // Array handling for PostgreSQL
  protected parseArrayField(field: string): string[] {
    if (!field) return [];
    // Remove curly braces and split by comma
    return field.replace(/[{}]/g, '').split(',').filter(Boolean);
  }

  protected stringifyArrayField(field: string[]): string {
    if (!field || field.length === 0) return '{}';
    return `{${field.join(',')}}`;
  }

  // Full-text search support
  async search(query: string, fields: string[] = [], options: {
    limit?: number;
    offset?: number;
    ranking?: boolean;
  } = {}): Promise<T[]> {
    const searchFields = fields.length > 0 ? fields : this.getSearchableFields();
    
    if (searchFields.length === 0) {
      throw new Error('No searchable fields specified');
    }

    let sql = `
      SELECT *, 
        ts_rank_cd(
          to_tsvector('english', ${searchFields.map(f => `COALESCE(${f}, '')`).join(" || ' ' || ")}),
          plainto_tsquery('english', $1)
        ) as rank
      FROM ${this.tableName} 
      WHERE deleted = 0 
        AND to_tsvector('english', ${searchFields.map(f => `COALESCE(${f}, '')`).join(" || ' ' || ")}) @@ plainto_tsquery('english', $1)
    `;

    const params = [query];

    if (options.ranking) {
      sql += ' ORDER BY rank DESC';
    }

    if (options.limit) {
      sql += ` LIMIT $${params.length + 1}`;
      params.push(String(options.limit));
    }

    if (options.offset) {
      sql += ` OFFSET $${params.length + 1}`;
      params.push(String(options.offset));
    }

    const rows = await this.executeQuery(sql, params);
    return rows.map(row => {
      // Remove rank field from the result
      const { rank, ...entityRow } = row;
      return this.mapRowToEntity(entityRow);
    });
  }

  // Abstract method to get searchable fields (to be implemented by concrete DAOs)
  protected getSearchableFields(): string[] {
    return [];
  }

  // Advanced filtering with JSON operators
  async findByJSONPath(jsonPath: string, value: any): Promise<T[]> {
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE deleted = 0 AND ${jsonPath} = $1
    `;
    const rows = await this.executeQuery(sql, [value]);
    return rows.map(row => this.mapRowToEntity(row));
  }

  // Batch operations for better performance
  async bulkInsert(items: Partial<T>[]): Promise<T[]> {
    if (items.length === 0) return [];

    const fields = this.getInsertFields();
    const values = items.map(item => 
      fields.map(field => 
        (item as any)[field] || 
        (field === 'id' ? this.generateId() : null) ||
        (field === 'created_at' || field === 'updated_at' ? new Date() : null)
      )
    );

    const placeholders = values.map((_, index) => 
      `(${fields.map((_, fieldIndex) => `$${index * fields.length + fieldIndex + 1}`).join(', ')})`
    ).join(', ');

    const sql = `
      INSERT INTO ${this.tableName} (${fields.join(', ')}) 
      VALUES ${placeholders}
      RETURNING *
    `;

    const flatValues = values.flat();
    const rows = await this.executeQuery(sql, flatValues);
    return rows.map(row => this.mapRowToEntity(row));
  }

  // Upsert operation (INSERT ... ON CONFLICT UPDATE)
  async upsert(data: CreateDto, conflictFields: string[] = ['id']): Promise<T> {
    const fields = this.getInsertFields();
    const row = {
      ...this.mapEntityToRow(data as any),
      updated_at: new Date()
    };

    const values = fields.map(field => row[field]);
    const placeholders = fields.map((_, index) => `$${index + 1}`).join(', ');

    const updateFields = fields.filter(f => f !== 'id' && !conflictFields.includes(f));
    const updateClause = updateFields.map((field, index) => 
      `${field} = EXCLUDED.${field}`
    ).join(', ');

    const sql = `
      INSERT INTO ${this.tableName} (${fields.join(', ')}) 
      VALUES (${placeholders})
      ON CONFLICT (${conflictFields.join(', ')}) 
      DO UPDATE SET ${updateClause}, updated_at = EXCLUDED.updated_at
      RETURNING *
    `;

    const resultRow = await this.executeQueryOne(sql, values);
    return this.mapRowToEntity(resultRow);
  }
}

/**
 * PostgreSQL Connection Wrapper
 * Implements IDatabaseConnection interface for PostgreSQL
 */
class PostgreSQLConnection implements IDatabaseConnection {
  constructor(private pool: Pool) {}

  async connect(): Promise<void> {
    // Connection is managed by the pool
  }

  async disconnect(): Promise<void> {
    // Disconnection is managed by the pool
  }

  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(sql, params);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }

  async execute(sql: string, params?: any[]): Promise<{ affectedRows: number; insertId?: string }> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(sql, params);
      return {
        affectedRows: result.rowCount || 0,
        insertId: result.rows[0]?.id
      };
    } finally {
      client.release();
    }
  }

  async beginTransaction(): Promise<void> {
    throw new Error('Transactions should be managed at the DAO level');
  }

  async commit(): Promise<void> {
    throw new Error('Transactions should be managed at the DAO level');
  }

  async rollback(): Promise<void> {
    throw new Error('Transactions should be managed at the DAO level');
  }

  isConnected(): boolean {
    return this.pool.totalCount > 0;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.queryOne('SELECT 1 as health_check');
      return !!result;
    } catch {
      return false;
    }
  }
}
