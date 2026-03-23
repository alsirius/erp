import { User, CreateUserDto, UpdateUserDto, ChangePasswordDto, DisableAccountDto, UserFilters, UserProfileResponse } from '../entities/User';
import { RequestContext, QueryRequest, ListResponse } from '../types/api';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

export interface IUserDAO {
  findById(id: string): Promise<User | null>;
  create(data: CreateUserDto): Promise<User>;
  update(id: string, data: UpdateUserDto): Promise<User>;
  delete(id: string): Promise<boolean>;
  findAll(query?: QueryRequest): Promise<ListResponse<User>>;
  findOne(filters: Record<string, any>): Promise<User | null>;
  findMany(filters: Record<string, any>, options?: {
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
  }): Promise<User[]>;
  findByEmail(email: string): Promise<User | null>;
  updatePassword(id: string, currentPassword: string, newPassword: string): Promise<void>;
  disableAccount(id: string, reason?: string): Promise<void>;
  updateProfile(id: string, updates: UpdateUserDto): Promise<User>;
  getUserProfile(id: string): Promise<UserProfileResponse>;
  findByFilters(filters: UserFilters): Promise<User[]>;
}

export class UserDAO implements IUserDAO {
  constructor(private db: Database.Database) {}

  // Generic DAO methods
  async findById(id: string): Promise<User | null> {
    try {
      const stmt = this.db.prepare(`
        SELECT id, email, first_name, last_name, password_hash, role, department, status, deleted, 
               phone, bio, email_verified, profile_image_url, comment, created_at, updated_at, last_login_at 
        FROM users WHERE id = ? AND deleted = 0
      `);
      const row = stmt.get(id) as any;
      return row ? this.mapRowToUser(row) : null;
    } catch (error) {
      throw new Error(`Failed to find user by id: ${error}`);
    }
  }

  async create(user: CreateUserDto): Promise<User> {
    try {
      const id = this.generateId();
      const now = new Date().toISOString();
      const hashedPassword = await bcrypt.hash(user.password, 10);
      
      const stmt = this.db.prepare(`
        INSERT INTO users (id, email, first_name, last_name, password_hash, role, department, phone, bio, created_at, updated_at, deleted, email_verified, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        id,
        user.email.toLowerCase(),
        user.firstName,
        user.lastName,
        hashedPassword,
        user.role || 'user',
        user.department || null,
        user.phone || null,
        user.bio || null,
        now,
        now,
        0,
        0,
        'active'
      );

      const createdUser = await this.findById(id);
      if (!createdUser) {
        throw new Error('Failed to retrieve created user');
      }
      return createdUser;
    } catch (error) {
      throw new Error(`Failed to create user: ${error}`);
    }
  }

  async update(id: string, data: UpdateUserDto): Promise<User> {
    try {
      const updates: string[] = [];
      const values: any[] = [];
      
      if (data.firstName) {
        updates.push('first_name = ?');
        values.push(data.firstName);
      }
      if (data.lastName) {
        updates.push('last_name = ?');
        values.push(data.lastName);
      }
      if (data.email) {
        updates.push('email = ?');
        values.push(data.email.toLowerCase());
      }
      if (data.department !== undefined) {
        updates.push('department = ?');
        values.push(data.department);
      }
      if (data.bio !== undefined) {
        updates.push('bio = ?');
        values.push(data.bio);
      }
      if (data.phone !== undefined) {
        updates.push('phone = ?');
        values.push(data.phone);
      }
      if (data.profileImageUrl !== undefined) {
        updates.push('profile_image_url = ?');
        values.push(data.profileImageUrl);
      }
      
      updates.push('updated_at = ?');
      values.push(new Date().toISOString());
      values.push(id);

      const stmt = this.db.prepare(`
        UPDATE users SET ${updates.join(', ')} 
        WHERE id = ? AND deleted = 0
      `);
      
      stmt.run(...values);

      const updatedUser = await this.findById(id);
      if (!updatedUser) {
        throw new Error('Failed to retrieve updated user');
      }
      return updatedUser;
    } catch (error) {
      throw new Error(`Failed to update user: ${error}`);
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const stmt = this.db.prepare(`
        UPDATE users SET deleted = 1, updated_at = ? 
        WHERE id = ? AND deleted = 0
      `);
      const result = stmt.run(new Date().toISOString(), id);
      return result.changes > 0;
    } catch (error) {
      throw new Error(`Failed to delete user: ${error}`);
    }
  }

  async findAll(query?: QueryRequest): Promise<ListResponse<User>> {
    try {
      let sql = `
        SELECT id, email, first_name, last_name, password_hash, role, department, status, deleted, 
               phone, bio, email_verified, profile_image_url, comment, created_at, updated_at, last_login_at 
        FROM users WHERE deleted = 0
      `;
      const params: any[] = [];

      if (query?.filters) {
        const conditions: string[] = [];
        Object.entries(query.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            conditions.push(`${key} = ?`);
            params.push(value);
          }
        });
        if (conditions.length > 0) {
          sql += ` AND ${conditions.join(' AND ')}`;
        }
      }

      // Handle sorting
      if (query?.sort) {
        const sortEntries = Object.entries(query.sort);
        if (sortEntries.length > 0) {
          const [field, direction] = sortEntries[0];
          sql += ` ORDER BY ${field} ${direction}`;
        }
      }

      // Handle pagination
      const limit = query?.pagination?.limit || 10;
      const page = query?.pagination?.page || 1;
      const offset = (page - 1) * limit;

      sql += ` LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const stmt = this.db.prepare(sql);
      const rows = stmt.all(...params) as any[];
      
      const users = rows.map(row => this.mapRowToUser(row));

      return {
        items: users,
        pagination: {
          page,
          limit,
          total: users.length,
          totalPages: Math.ceil(users.length / limit),
          hasNext: false,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      throw new Error(`Failed to find users: ${error}`);
    }
  }

  async findOne(filters: Record<string, any>): Promise<User | null> {
    try {
      const conditions: string[] = [];
      const params: any[] = [];
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          conditions.push(`${key} = ?`);
          params.push(value);
        }
      });

      const sql = `
        SELECT id, email, first_name, last_name, password_hash, role, department, status, deleted, 
               phone, bio, email_verified, profile_image_url, comment, created_at, updated_at, last_login_at 
        FROM users WHERE deleted = 0 AND ${conditions.join(' AND ')}
        LIMIT 1
      `;

      const stmt = this.db.prepare(sql);
      const row = stmt.get(...params) as any;
      return row ? this.mapRowToUser(row) : null;
    } catch (error) {
      throw new Error(`Failed to find user: ${error}`);
    }
  }

  async findMany(filters: Record<string, any>, options?: {
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
  }): Promise<User[]> {
    try {
      const conditions: string[] = [];
      const params: any[] = [];
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          conditions.push(`${key} = ?`);
          params.push(value);
        }
      });

      let sql = `
        SELECT id, email, first_name, last_name, password_hash, role, department, status, deleted, 
               phone, bio, email_verified, profile_image_url, comment, created_at, updated_at, last_login_at 
        FROM users WHERE deleted = 0
      `;

      if (conditions.length > 0) {
        sql += ` AND ${conditions.join(' AND ')}`;
      }

      if (options?.orderBy) {
        sql += ` ORDER BY ${options.orderBy} ${options.orderDirection || 'asc'}`;
      }

      if (options?.limit) {
        sql += ` LIMIT ?`;
        params.push(options.limit);
        if (options?.offset) {
          sql += ` OFFSET ?`;
          params.push(options.offset);
        }
      }

      const stmt = this.db.prepare(sql);
      const rows = stmt.all(...params) as any[];
      return rows.map(row => this.mapRowToUser(row));
    } catch (error) {
      throw new Error(`Failed to find users: ${error}`);
    }
  }

  // User-specific methods
  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ email: email.toLowerCase() });
  }

  async updatePassword(id: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      const user = await this.findById(id);
      if (!user) {
        throw new Error('User not found');
      }

      const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValidPassword) {
        throw new Error('Current password is incorrect');
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      
      const stmt = this.db.prepare(`
        UPDATE users SET password_hash = ?, updated_at = ? 
        WHERE id = ? AND deleted = 0
      `);
      
      const result = stmt.run(hashedNewPassword, new Date().toISOString(), id);
      if (result.changes === 0) {
        throw new Error('Failed to update password');
      }
    } catch (error) {
      throw new Error(`Failed to update password: ${error}`);
    }
  }

  async disableAccount(id: string, reason?: string): Promise<void> {
    try {
      const stmt = this.db.prepare(`
        UPDATE users SET status = 'disabled', comment = ?, updated_at = ? 
        WHERE id = ? AND deleted = 0
      `);
      
      const result = stmt.run(reason || null, new Date().toISOString(), id);
      if (result.changes === 0) {
        throw new Error('Failed to disable account');
      }
    } catch (error) {
      throw new Error(`Failed to disable account: ${error}`);
    }
  }

  async updateProfile(id: string, updates: UpdateUserDto): Promise<User> {
    return this.update(id, updates);
  }

  async getUserProfile(id: string): Promise<UserProfileResponse> {
    try {
      const user = await this.findById(id);
      if (!user) {
        throw new Error('User not found');
      }

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        department: user.department,
        status: user.status,
        bio: user.bio,
        phone: user.phone,
        emailVerified: user.emailVerified ? 1 : 0, // Convert boolean to number
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLoginAt: user.lastLoginAt,
        profileImageUrl: user.profileImageUrl
      };
    } catch (error) {
      throw new Error(`Failed to get user profile: ${error}`);
    }
  }

  async findByFilters(filters: UserFilters): Promise<User[]> {
    return this.findMany(filters);
  }

  // Helper methods
  private mapRowToUser(row: any): User {
    return {
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      passwordHash: row.password_hash,
      role: row.role,
      department: row.department,
      status: row.status,
      deleted: row.deleted ? 1 : 0, // Convert boolean to number
      bio: row.bio,
      phone: row.phone,
      emailVerified: row.email_verified ? 1 : 0, // Convert boolean to number
      comment: row.comment,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      lastLoginAt: row.last_login_at ? new Date(row.last_login_at) : undefined,
      profileImageUrl: row.profile_image_url,
      requiresApproval: row.requires_approval || 0,
      approvedBy: row.approved_by,
      approvedAt: row.approved_at ? new Date(row.approved_at) : undefined
    };
  }

  private generateId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
