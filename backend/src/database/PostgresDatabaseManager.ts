import { Pool, PoolClient, PoolConfig } from 'pg';
import fs from 'fs';
import path from 'path';

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  maxConnections?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

export class PostgresDatabaseManager {
  private static instance: PostgresDatabaseManager;
  private pool: Pool | null = null;
  private config!: DatabaseConfig; // Use definite assignment assertion

  private constructor() {}

  public static getInstance(): PostgresDatabaseManager {
    if (!PostgresDatabaseManager.instance) {
      PostgresDatabaseManager.instance = new PostgresDatabaseManager();
    }
    return PostgresDatabaseManager.instance;
  }

  public initialize(config: DatabaseConfig): Pool {
    try {
      this.config = {
        ...config,
        maxConnections: config.maxConnections || 20,
        idleTimeoutMillis: config.idleTimeoutMillis || 30000,
        connectionTimeoutMillis: config.connectionTimeoutMillis || 2000,
      };

      // Create PostgreSQL connection pool
      this.pool = new Pool({
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
        user: this.config.username,
        password: this.config.password,
        ssl: this.config.ssl || false,
        max: this.config.maxConnections,
        idleTimeoutMillis: this.config.idleTimeoutMillis,
        connectionTimeoutMillis: this.config.connectionTimeoutMillis,
      });

      // Test connection
      this.pool.query('SELECT NOW()')
        .then(() => console.log('PostgreSQL connected successfully'))
        .catch((error: Error) => {
          throw new Error(`PostgreSQL connection failed: ${error.message}`);
        });

      // Run schema migration
      this.runMigrations();

      return this.pool;
    } catch (error: unknown) {
      console.error('Failed to initialize PostgreSQL database:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Database initialization failed: ${errorMessage}`);
    }
  }

  public getPool(): Pool {
    if (!this.pool) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.pool;
  }

  public async getClient(): Promise<PoolClient> {
    if (!this.pool) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.pool.connect();
  }

  public async query(text: string, params?: any[]): Promise<any> {
    if (!this.pool) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      console.log(`Query executed in ${duration}ms: ${text.substring(0, 100)}...`);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      console.error(`Query failed after ${duration}ms: ${text.substring(0, 100)}...`, error);
      throw error;
    }
  }

  public async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  public async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      console.log('PostgreSQL connection pool closed');
    }
  }

  private async runMigrations(): Promise<void> {
    try {
      // Create migrations table if it doesn't exist
      await this.query(`
        CREATE TABLE IF NOT EXISTS migrations (
          id SERIAL PRIMARY KEY,
          filename VARCHAR(255) NOT NULL,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Read and execute migration files
      const migrationsPath = path.join(__dirname, 'migrations');
      if (fs.existsSync(migrationsPath)) {
        const migrationFiles = fs.readdirSync(migrationsPath)
          .filter(file => file.endsWith('.sql'))
          .sort();

        for (const file of migrationFiles) {
          const filePath = path.join(migrationsPath, file);
          const fileContent = fs.readFileSync(filePath, 'utf8');

          // Check if migration already executed
          const existingMigration = await this.query(
            'SELECT id FROM migrations WHERE filename = $1',
            [file]
          );

          if (existingMigration.rows.length === 0) {
            await this.query(fileContent);
            await this.query(
              'INSERT INTO migrations (filename) VALUES ($1)',
              [file]
            );
            console.log(`Migration executed: ${file}`);
          }
        }
      }

      // Run initial schema if no migrations exist
      await this.runInitialSchema();
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  private async runInitialSchema(): Promise<void> {
    try {
      // Check if users table exists
      const result = await this.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'users'
        )
      `);

      if (!result.rows[0].exists) {
        await this.query(`
          CREATE TABLE users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            role VARCHAR(50) NOT NULL DEFAULT 'user',
            department VARCHAR(100),
            status VARCHAR(50) NOT NULL DEFAULT 'active',
            deleted BOOLEAN DEFAULT FALSE,
            approval_code VARCHAR(255),
            phone VARCHAR(20),
            bio TEXT,
            email_verified BOOLEAN DEFAULT FALSE,
            profile_image_url VARCHAR(500),
            requires_approval BOOLEAN DEFAULT FALSE,
            approved_by UUID REFERENCES users(id),
            approved_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login_at TIMESTAMP
          )
        `);

        await this.query(`
          CREATE INDEX idx_users_email ON users(email);
          CREATE INDEX idx_users_role ON users(role);
          CREATE INDEX idx_users_status ON users(status);
          CREATE INDEX idx_users_deleted ON users(deleted);
        `);

        console.log('Users table created successfully');
      }

      // Check if registration_codes table exists
      const codesResult = await this.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'registration_codes'
        )
      `);

      if (!codesResult.rows[0].exists) {
        await this.query(`
          CREATE TABLE registration_codes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            code VARCHAR(255) UNIQUE NOT NULL,
            email VARCHAR(255) NOT NULL,
            max_uses INTEGER DEFAULT 1,
            used_count INTEGER DEFAULT 0,
            expires_at TIMESTAMP,
            created_by UUID REFERENCES users(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_active BOOLEAN DEFAULT TRUE
          )
        `);

        await this.query(`
          CREATE INDEX idx_registration_codes_code ON registration_codes(code);
          CREATE INDEX idx_registration_codes_email ON registration_codes(email);
          CREATE INDEX idx_registration_codes_active ON registration_codes(is_active);
        `);

        console.log('Registration codes table created successfully');
      }

      // Check if user_sessions table exists
      const sessionsResult = await this.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'user_sessions'
        )
      `);

      if (!sessionsResult.rows[0].exists) {
        await this.query(`
          CREATE TABLE user_sessions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            refresh_token VARCHAR(500) NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);

        await this.query(`
          CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
          CREATE INDEX idx_user_sessions_refresh_token ON user_sessions(refresh_token);
          CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
        `);

        console.log('User sessions table created successfully');
      }

    } catch (error) {
      console.error('Initial schema creation failed:', error);
      throw error;
    }
  }
}

// Environment-based configuration
export const getDatabaseConfig = (): DatabaseConfig => {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (databaseUrl) {
    // Parse DATABASE_URL for PostgreSQL
    const url = new URL(databaseUrl);
    return {
      host: url.hostname || 'localhost',
      port: parseInt(url.port) || 5432,
      database: url.pathname.slice(1),
      username: url.username,
      password: url.password,
      ssl: process.env.NODE_ENV === 'production' ? true : false,
    };
  }

  // Individual environment variables
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'siriux_starter',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.NODE_ENV === 'production' ? true : false,
  };
};
