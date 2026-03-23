import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

export class DatabaseManager {
  private static instance: DatabaseManager;
  private db: Database.Database | null = null;

  private constructor() {}

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public initialize(dbPath: string): Database.Database {
    try {
      // Create database directory if it doesn't exist
      const dbDir = path.dirname(dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      // Open database connection
      this.db = new Database(dbPath);
      
      // Enable foreign keys
      this.db.pragma('foreign_keys = ON');
      
      // Set WAL mode for better concurrency
      this.db.pragma('journal_mode = WAL');
      
      // Run schema migration
      this.runMigrations();
      
      console.log(`Database initialized successfully at: ${dbPath}`);
      return this.db;
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw new Error(`Database initialization failed: ${error}`);
    }
  }

  public getDatabase(): Database.Database {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  public close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log('Database connection closed');
    }
  }

  private runMigrations(): void {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      // Execute schema
      this.db.exec(schema);
      
      // Run specific migrations that might fail if columns already exist
      this.runSpecificMigrations();
      
      console.log('Database migrations completed successfully');
    } catch (error) {
      console.error('Failed to run migrations:', error);
      throw new Error(`Migration failed: ${error}`);
    }
  }

  private runSpecificMigrations(): void {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      // Add max_uses column if it doesn't exist
      try {
        this.db.exec('ALTER TABLE registration_codes ADD COLUMN max_uses INTEGER DEFAULT 1');
        console.log('Added max_uses column to registration_codes');
      } catch (error) {
        // Column might already exist, which is fine
        console.log('max_uses column already exists or could not be added');
      }

      // Add expires_at column if it doesn't exist
      try {
        this.db.exec('ALTER TABLE registration_codes ADD COLUMN expires_at DATETIME');
        console.log('Added expires_at column to registration_codes');
      } catch (error) {
        // Column might already exist, which is fine
        console.log('expires_at column already exists or could not be added');
      }
    } catch (error) {
      console.log('Migration warnings (non-critical):', error);
    }
  }

  public backup(backupPath: string): void {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      // Create backup directory if it doesn't exist
      const backupDir = path.dirname(backupPath);
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      // Perform backup
      this.db.backup(backupPath);
      console.log(`Database backup created at: ${backupPath}`);
    } catch (error) {
      console.error('Failed to create backup:', error);
      throw new Error(`Backup failed: ${error}`);
    }
  }

  public getStats(): {
    tables: string[];
    users: number;
    rosters: number;
    rosterMembers: number;
    sessions: number;
  } {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      // Get table names
      const tables = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as any[];
      const tableNames = tables.map(t => t.name);

      // Get counts
      const userCount = this.db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
      const rosterCount = this.db.prepare('SELECT COUNT(*) as count FROM rosters').get() as any;
      const rosterMemberCount = this.db.prepare('SELECT COUNT(*) as count FROM roster_members').get() as any;
      const sessionCount = this.db.prepare('SELECT COUNT(*) as count FROM sessions').get() as any;

      return {
        tables: tableNames,
        users: userCount.count,
        rosters: rosterCount.count,
        rosterMembers: rosterMemberCount.count,
        sessions: sessionCount.count
      };
    } catch (error) {
      console.error('Failed to get database stats:', error);
      throw new Error(`Failed to get stats: ${error}`);
    }
  }

  public vacuum(): void {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      this.db.exec('VACUUM');
      console.log('Database vacuum completed');
    } catch (error) {
      console.error('Failed to vacuum database:', error);
      throw new Error(`Vacuum failed: ${error}`);
    }
  }

  public checkIntegrity(): boolean {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const result = this.db.prepare('PRAGMA integrity_check').get() as any;
      return result.integrity_check === 'ok';
    } catch (error) {
      console.error('Failed to check database integrity:', error);
      return false;
    }
  }
}

// Export singleton instance
export const databaseManager = DatabaseManager.getInstance();
