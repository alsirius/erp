import Database from 'better-sqlite3';
import { BaseDAO } from './BaseDAO';
import { IDatabaseConnection } from './IGenericDAO';

/**
 * SQLite DAO Implementation
 * 
 * Extends BaseDAO to provide SQLite-specific functionality.
 * Uses better-sqlite3 for synchronous operations and better performance.
 * 
 * @template T - The entity type
 * @template CreateDto - The DTO type for creating entities
 * @template UpdateDto - The DTO type for updating entities
 */
export abstract class SQLiteDAO<T, CreateDto, UpdateDto> extends BaseDAO<T, CreateDto, UpdateDto> {
  protected db: Database.Database;
  protected connection: IDatabaseConnection;

  constructor(
    tableName: string,
    databasePath: string,
    validator?: any
  ) {
    super(tableName, validator);
    this.db = new Database(databasePath);
    this.connection = new SQLiteConnection(this.db);
    
    // Enable foreign keys
    this.db.pragma('foreign_keys = ON');
    
    // Set WAL mode for better concurrency
    this.db.pragma('journal_mode = WAL');
  }

  // Connection management
  async connect(): Promise<void> {
    // better-sqlite3 connects synchronously, so this is just a health check
    try {
      this.db.prepare('SELECT 1').get();
      console.log(`Connected to SQLite database for table: ${this.tableName}`);
    } catch (error) {
      console.error('Failed to connect to SQLite:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      this.db.close();
      console.log(`Disconnected from SQLite database for table: ${this.tableName}`);
    } catch (error) {
      console.error('Failed to disconnect from SQLite:', error);
      throw error;
    }
  }

  isConnected(): boolean {
    return this.db.open;
  }

  async healthCheck(): Promise<boolean> {
    try {
      this.db.prepare('SELECT 1').get();
      return true;
    } catch (error) {
      console.error('SQLite health check failed:', error);
      return false;
    }
  }

  // Database operations
  protected async executeQuery<T = any>(sql: string, params?: any[]): Promise<T[]> {
    try {
      const stmt = this.db.prepare(sql);
      const rows = stmt.all(...(params || [])) as T[];
      return rows;
    } catch (error) {
      console.error('SQLite query error:', { sql, params, error });
      throw error;
    }
  }

  protected async executeQueryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
    try {
      const stmt = this.db.prepare(sql);
      const row = stmt.get(...(params || [])) as T;
      return row || null;
    } catch (error) {
      console.error('SQLite query error:', { sql, params, error });
      throw error;
    }
  }

  protected async executeCommand(sql: string, params?: any[]): Promise<{ affectedRows: number; insertId?: string }> {
    try {
      const stmt = this.db.prepare(sql);
      const result = stmt.run(...(params || []));
      return {
        affectedRows: result.changes || 0,
        insertId: result.lastInsertRowid?.toString()
      };
    } catch (error) {
      console.error('SQLite command error:', { sql, params, error });
      throw error;
    }
  }

  // Transaction support
  protected async beginTransaction(): Promise<void> {
    this.db.exec('BEGIN TRANSACTION');
  }

  protected async commit(): Promise<void> {
    this.db.exec('COMMIT');
  }

  protected async rollback(): Promise<void> {
    this.db.exec('ROLLBACK');
  }

  // Table operations
  async createTable(): Promise<void> {
    const createTableSQL = this.getCreateTableSQL();
    this.db.exec(createTableSQL);
    console.log(`Created table: ${this.tableName}`);
  }

  async dropTable(): Promise<void> {
    const sql = `DROP TABLE IF EXISTS ${this.tableName}`;
    this.db.exec(sql);
    console.log(`Dropped table: ${this.tableName}`);
  }

  async tableExists(): Promise<boolean> {
    const sql = `
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name=?
    `;
    const result = await this.executeQueryOne(sql, [this.tableName]);
    return !!result;
  }

  // Abstract method to be implemented by concrete DAOs
  protected abstract getCreateTableSQL(): string;

  // SQLite-specific helper methods
  protected generateId(): string {
    return this.generateUUID();
  }

  protected convertToSQLiteTimestamp(date: Date): string {
    return date.toISOString();
  }

  protected convertFromSQLiteTimestamp(timestamp: string): Date {
    return new Date(timestamp);
  }

  // JSON handling for SQLite (stored as TEXT)
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

  // Array handling for SQLite (stored as JSON)
  protected parseArrayField(field: string): string[] {
    if (!field) return [];
    try {
      return JSON.parse(field);
    } catch {
      return [];
    }
  }

  protected stringifyArrayField(field: string[]): string {
    if (!field || field.length === 0) return '[]';
    return JSON.stringify(field);
  }

  // Full-text search support (using FTS5 if available, otherwise LIKE)
  async search(query: string, fields: string[] = [], options: {
    limit?: number;
    offset?: number;
    useFTS?: boolean;
  } = {}): Promise<T[]> {
    const searchFields = fields.length > 0 ? fields : this.getSearchableFields();
    
    if (searchFields.length === 0) {
      throw new Error('No searchable fields specified');
    }

    // Try to use FTS5 if available and requested
    if (options.useFTS && await this.ftsTableExists()) {
      return this.searchWithFTS(query, searchFields, options);
    }

    // Fallback to LIKE queries
    const searchConditions = searchFields.map(field => `${field} LIKE ?`);
    const searchTerm = `%${query}%`;
    const params = searchFields.map(() => searchTerm);

    let sql = `
      SELECT * FROM ${this.tableName} 
      WHERE deleted = 0 AND (${searchConditions.join(' OR ')})
    `;

    if (options.limit) {
      sql += ` LIMIT ${options.limit}`;
    }

    if (options.offset) {
      sql += ` OFFSET ${options.offset}`;
    }

    const rows = await this.executeQuery(sql, params);
    return rows.map(row => this.mapRowToEntity(row));
  }

  private async ftsTableExists(): Promise<boolean> {
    const ftsTableName = `${this.tableName}_fts`;
    const sql = `
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name=? AND sql LIKE '%FTS5%'
    `;
    const result = await this.executeQueryOne(sql, [ftsTableName]);
    return !!result;
  }

  private async searchWithFTS(query: string, fields: string[], options: any): Promise<T[]> {
    const ftsTableName = `${this.tableName}_fts`;
    
    let sql = `
      SELECT t.* FROM ${this.tableName} t
      JOIN ${ftsTableName} fts ON t.id = fts.id
      WHERE t.deleted = 0 AND ${ftsTableName} MATCH ?
    `;

    const params = [query];

    if (options.limit) {
      sql += ` LIMIT ${options.limit}`;
    }

    if (options.offset) {
      sql += ` OFFSET ${options.offset}`;
    }

    const rows = await this.executeQuery(sql, params);
    return rows.map(row => this.mapRowToEntity(row));
  }

  // Abstract method to get searchable fields (to be implemented by concrete DAOs)
  protected getSearchableFields(): string[] {
    return [];
  }

  // Create FTS5 virtual table for full-text search
  async createFTSTable(fields: string[]): Promise<void> {
    const ftsTableName = `${this.tableName}_fts`;
    const fieldList = fields.join(', ');
    
    const sql = `
      CREATE VIRTUAL TABLE IF NOT EXISTS ${ftsTableName} 
      USING fts5(${fieldList}, content='${this.tableName}')
    `;
    
    this.db.exec(sql);
    
    // Populate the FTS table
    const populateSQL = `
      INSERT INTO ${ftsTableName}(${ftsTableName}) 
      SELECT ${fieldList} FROM ${this.tableName} WHERE deleted = 0
    `;
    
    this.db.exec(populateSQL);
    
    // Create triggers to keep FTS table in sync
    this.createFTSTriggers(ftsTableName, fields);
    
    console.log(`Created FTS5 table: ${ftsTableName}`);
  }

  private createFTSTriggers(ftsTableName: string, fields: string[]): void {
    const fieldList = fields.join(', ');
    const newFields = fields.map(f => `NEW.${f}`).join(', ');
    const oldFields = fields.map(f => `OLD.${f}`).join(', ');

    // Insert trigger
    const insertTrigger = `
      CREATE TRIGGER IF NOT EXISTS ${this.tableName}_ai AFTER INSERT ON ${this.tableName} BEGIN
        INSERT INTO ${ftsTableName}(${fieldList}) VALUES (${newFields});
      END;
    `;

    // Delete trigger
    const deleteTrigger = `
      CREATE TRIGGER IF NOT EXISTS ${this.tableName}_ad AFTER DELETE ON ${this.tableName} BEGIN
        INSERT INTO ${ftsTableName}(${ftsTableName}, ${this.tableName}) VALUES (${oldFields}, 'delete');
      END;
    `;

    // Update trigger
    const updateTrigger = `
      CREATE TRIGGER IF NOT EXISTS ${this.tableName}_au AFTER UPDATE ON ${this.tableName} BEGIN
        INSERT INTO ${ftsTableName}(${ftsTableName}, ${this.tableName}) VALUES (${newFields}, 'delete');
        INSERT INTO ${ftsTableName}(${fieldList}) VALUES (${newFields});
      END;
    `;

    this.db.exec(insertTrigger);
    this.db.exec(deleteTrigger);
    this.db.exec(updateTrigger);
  }

  // Batch operations for better performance
  async bulkInsert(items: Partial<T>[]): Promise<T[]> {
    if (items.length === 0) return [];

    const fields = this.getInsertFields();
    const placeholders = fields.map(() => '?').join(', ');
    const sql = `INSERT INTO ${this.tableName} (${fields.join(', ')}) VALUES (${placeholders})`;

    const transaction = this.db.transaction((items: Partial<T>[]) => {
      const results: T[] = [];
      
      for (const item of items) {
        const values = fields.map(field => 
          (item as any)[field] || 
          (field === 'id' ? this.generateId() : null) ||
          (field === 'created_at' || field === 'updated_at' ? new Date() : null)
        );

        const stmt = this.db.prepare(sql);
        const result = stmt.run(...values);
        
        // Get the inserted record
        const insertedRow = this.db.prepare(`SELECT * FROM ${this.tableName} WHERE id = ?`).get(result.lastInsertRowid);
        results.push(this.mapRowToEntity(insertedRow));
      }
      
      return results;
    });

    return transaction(items);
  }

  // Upsert operation (INSERT OR REPLACE)
  async upsert(data: CreateDto, conflictFields: string[] = ['id']): Promise<T> {
    const fields = this.getInsertFields();
    const row = {
      ...this.mapEntityToRow(data as any),
      updated_at: new Date()
    };

    const values = fields.map(field => row[field]);
    const placeholders = fields.map(() => '?').join(', ');

    const sql = `
      INSERT OR REPLACE INTO ${this.tableName} (${fields.join(', ')}) 
      VALUES (${placeholders})
    `;

    await this.executeCommand(sql, values);
    
    // Get the upserted record (need to query by unique fields)
    const whereConditions = conflictFields.map(field => `${field} = ?`).join(' AND ');
    const whereValues = conflictFields.map(field => (row as any)[field]);
    
    const resultRow = await this.executeQueryOne(
      `SELECT * FROM ${this.tableName} WHERE ${whereConditions}`,
      whereValues
    );
    
    return this.mapRowToEntity(resultRow);
  }

  // JSON query support (using JSON1 extension)
  async findByJSONPath(jsonPath: string, value: any): Promise<T[]> {
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE deleted = 0 AND json_extract(${jsonPath}) = ?
    `;
    const rows = await this.executeQuery(sql, [value]);
    return rows.map(row => this.mapRowToEntity(row));
  }

  // Advanced filtering with JSON operators
  async findByJSONContains(field: string, value: any): Promise<T[]> {
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE deleted = 0 AND json_extract(${field}, '$') LIKE ?
    `;
    const rows = await this.executeQuery(sql, [`%${JSON.stringify(value)}%`]);
    return rows.map(row => this.mapRowToEntity(row));
  }

  // Performance optimization methods
  async createIndex(indexName: string, fields: string[], unique: boolean = false): Promise<void> {
    const uniqueKeyword = unique ? 'UNIQUE' : '';
    const fieldList = fields.join(', ');
    const sql = `CREATE ${uniqueKeyword} INDEX IF NOT EXISTS ${indexName} ON ${this.tableName} (${fieldList})`;
    this.db.exec(sql);
    console.log(`Created index: ${indexName}`);
  }

  async analyzeTable(): Promise<void> {
    this.db.exec(`ANALYZE ${this.tableName}`);
    console.log(`Analyzed table: ${this.tableName}`);
  }

  async vacuum(): Promise<void> {
    this.db.exec('VACUUM');
    console.log('Database vacuum completed');
  }
}

/**
 * SQLite Connection Wrapper
 * Implements IDatabaseConnection interface for SQLite
 */
class SQLiteConnection implements IDatabaseConnection {
  constructor(private db: Database.Database) {}

  async connect(): Promise<void> {
    // Connection is managed by the database instance
  }

  async disconnect(): Promise<void> {
    // Disconnection is managed by the database instance
  }

  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    const stmt = this.db.prepare(sql);
    return stmt.all(...(params || [])) as T[];
  }

  async queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
    const stmt = this.db.prepare(sql);
    const result = stmt.get(...(params || [])) as T;
    return result || null;
  }

  async execute(sql: string, params?: any[]): Promise<{ affectedRows: number; insertId?: string }> {
    const stmt = this.db.prepare(sql);
    const result = stmt.run(...(params || []));
    return {
      affectedRows: result.changes || 0,
      insertId: result.lastInsertRowid?.toString()
    };
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
    return this.db.open;
  }

  async healthCheck(): Promise<boolean> {
    try {
      this.db.prepare('SELECT 1').get();
      return true;
    } catch {
      return false;
    }
  }
}
