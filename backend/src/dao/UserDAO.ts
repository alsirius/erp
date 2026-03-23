import { User, CreateUserDto, UpdateUserDto, UserRole, UserStatus, FindAllOptions } from '../types';
import Database from 'better-sqlite3';

export interface IUserDAO {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByStatus(status: UserStatus): Promise<User[]>;
  create(user: CreateUserDto): Promise<User>;
  findAll(options?: FindAllOptions): Promise<User[]>;
  findByRole(role: UserRole): Promise<User[]>;
  findByEmailVerificationToken(token: string): Promise<User | null>;
  update(id: string, updates: Partial<User>): Promise<User>;
  updateProfile(id: string, profile: Partial<User>): Promise<User>;
  delete(id: string): Promise<boolean>;
  findPendingApproval(): Promise<User[]>;
  getPasswordHash(userId: string): Promise<string | null>;
  setEmailVerified(id: string, verified: boolean): Promise<void>;
  setApprovalStatus(id: string, approved: boolean, approvedBy?: string): Promise<void>;
}

export class UserDAO implements IUserDAO {
  constructor(private db: Database.Database) {}

  async findById(id: string): Promise<User | null> {
    try {
      const stmt = this.db.prepare('SELECT id, email, first_name, last_name, password_hash, role, department, status, deleted, approval_code, phone, bio, email_verified, profile_image_url, requires_approval, approved_by, approved_at, created_at, updated_at FROM users WHERE id = ? AND deleted = 0');
      const row = stmt.get(id) as any;
      return row ? this.mapRowToUser(row) : null;
    } catch (error) {
      throw new Error(`Failed to find user by id: ${error}`);
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const stmt = this.db.prepare('SELECT id, email, first_name, last_name, password_hash, role, department, status, deleted, approval_code, phone, bio, email_verified, profile_image_url, requires_approval, approved_by, approved_at, created_at, updated_at FROM users WHERE email = ? AND deleted = 0');
      const row = stmt.get(email) as any;
      return row ? this.mapRowToUser(row) : null;
    } catch (error) {
      throw new Error(`Failed to find user by email: ${error}`);
    }
  }

  async create(user: CreateUserDto): Promise<User> {
    try {
      const id = this.generateId();
      const now = new Date().toISOString();
      
      const stmt = this.db.prepare(`
        INSERT INTO users (id, email, first_name, last_name, password_hash, role, department, phone, bio, approval_code, created_at, updated_at, deleted, email_verified)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        id,
        user.email,
        user.firstName,
        user.lastName,
        user.password, // Use the hashed password from service layer
        user.role || 'user',
        user.department || null,
        user.phone || null,
        user.bio || null,
        user.approvalCode || null,
        now,
        now,
        0,
        user.approvalCode ? 1 : 0
      );

      const created = await this.findById(id);
      if (!created) {
        throw new Error('Failed to retrieve created user');
      }
      return created;
    } catch (error) {
      throw new Error(`Failed to create user: ${error}`);
    }
  }

  async findByStatus(status: UserStatus): Promise<User[]> {
    try {
      const stmt = this.db.prepare('SELECT id, email, first_name, last_name, password_hash, role, department, status, deleted, approval_code, phone, bio, email_verified, profile_image_url, requires_approval, approved_by, approved_at, created_at, updated_at FROM users WHERE status = ? AND deleted = 0');
      const rows = stmt.all(status) as any[];
      return rows.map(row => this.mapRowToUser(row));
    } catch (error) {
      throw new Error(`Failed to find users by status: ${error}`);
    }
  }

  async update(id: string, updates: Partial<User>): Promise<User> {
    try {
      const fields = [];
      const values = [];
      
      if (updates.firstName !== undefined) {
        fields.push('first_name = ?');
        values.push(updates.firstName);
      }
      
      if (updates.lastName !== undefined) {
        fields.push('last_name = ?');
        values.push(updates.lastName);
      }
      
      if (updates.role !== undefined) {
        fields.push('role = ?');
        values.push(updates.role);
      }
      
      if (updates.status !== undefined) {
        fields.push('status = ?');
        values.push(updates.status);
      }
      
      if (updates.deleted !== undefined) {
        fields.push('deleted = ?');
        values.push(updates.deleted);
      }
      
      if (updates.emailVerified !== undefined) {
        fields.push('email_verified = ?');
        values.push(updates.emailVerified);
      }
      
      if (fields.length === 0) {
        throw new Error('No fields to update');
      }
      
      fields.push('updated_at = ?');
      values.push(new Date().toISOString());
      values.push(id);
      
      const stmt = this.db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`);
      stmt.run(...values);
      
      const updated = await this.findById(id);
      if (!updated) {
        throw new Error('Failed to retrieve updated user');
      }
      return updated;
    } catch (error) {
      throw new Error(`Failed to update user: ${error}`);
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const stmt = this.db.prepare('UPDATE users SET is_active = 0, updated_at = ? WHERE id = ?');
      const result = stmt.run(new Date().toISOString(), id);
      return result.changes > 0;
    } catch (error) {
      throw new Error(`Failed to delete user: ${error}`);
    }
  }

  async findAll(options?: FindAllOptions): Promise<User[]> {
    try {
      let query = 'SELECT * FROM users WHERE is_active = 1';
      const params: any[] = [];
      
      if (options?.filters) {
        const filters = Object.entries(options.filters);
        if (filters.length > 0) {
          query += ' AND ' + filters.map(([key]) => `${key} = ?`).join(' AND ');
          params.push(...filters.map(([, value]) => value));
        }
      }
      
      if (options?.sortBy) {
        query += ` ORDER BY ${options.sortBy} ${options.sortOrder === 'desc' ? 'DESC' : 'ASC'}`;
      }
      
      if (options?.limit) {
        query += ' LIMIT ?';
        params.push(options.limit);
        
        if (options?.page && options.page > 1) {
          const offset = (options.page - 1) * options.limit;
          query += ' OFFSET ?';
          params.push(offset);
        }
      }
      
      const stmt = this.db.prepare(query);
      const rows = stmt.all(...params) as any[];
      return rows.map(row => this.mapRowToUser(row));
    } catch (error) {
      throw new Error(`Failed to find all users: ${error}`);
    }
  }

  async findByRole(role: UserRole): Promise<User[]> {
    try {
      const stmt = this.db.prepare('SELECT * FROM users WHERE role = ? AND is_active = 1');
      const rows = stmt.all(role) as any[];
      return rows.map(row => this.mapRowToUser(row));
    } catch (error) {
      throw new Error(`Failed to find users by role: ${error}`);
    }
  }

  private mapRowToUser(row: any): User {
    return {
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      passwordHash: row.password_hash || '', // Provide default empty string if null
      role: row.role as UserRole,
      department: row.department || undefined,
      status: row.status as UserStatus,
      deleted: row.deleted || 0,
      approvalCode: row.approval_code || undefined,
      phone: row.phone || undefined,
      bio: row.bio || undefined,
      emailVerified: row.email_verified || 0,
      profileImageUrl: row.profile_image_url || undefined,
      requiresApproval: row.requires_approval || 0,
      approvedBy: row.approved_by || undefined,
      approvedAt: row.approved_at ? new Date(row.approved_at) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  async getPasswordHash(userId: string): Promise<string | null> {
    try {
      const stmt = this.db.prepare('SELECT password_hash FROM users WHERE id = ? AND deleted = 0');
      const row = stmt.get(userId) as any;
      return row ? row.password_hash : null;
    } catch (error) {
      throw new Error(`Failed to get password hash: ${error}`);
    }
  }

  async findByEmailVerificationToken(token: string): Promise<User | null> {
    try {
      const stmt = this.db.prepare('SELECT * FROM users WHERE email_verification_token = ? AND is_active = 1');
      const row = stmt.get(token) as any;
      return row ? this.mapRowToUser(row) : null;
    } catch (error) {
      throw new Error(`Failed to find user by email verification token: ${error}`);
    }
  }

  async updateProfile(id: string, profile: Partial<User>): Promise<User> {
    try {
      const fields = [];
      const values = [];
      
      if (profile.firstName !== undefined) {
        fields.push('first_name = ?');
        values.push(profile.firstName);
      }
      if (profile.lastName !== undefined) {
        fields.push('last_name = ?');
        values.push(profile.lastName);
      }
      if (profile.phone !== undefined) {
        fields.push('phone = ?');
        values.push(profile.phone);
      }
      if (profile.department !== undefined) {
        fields.push('department = ?');
        values.push(profile.department);
      }
      if (profile.bio !== undefined) {
        fields.push('bio = ?');
        values.push(profile.bio);
      }
      if (profile.profileImageUrl !== undefined) {
        fields.push('profile_image_url = ?');
        values.push(profile.profileImageUrl);
      }
      
      if (fields.length === 0) {
        throw new Error('No fields to update');
      }
      
      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);
      
      const stmt = this.db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ? AND is_active = 1`);
      stmt.run(...values);
      
      const updated = await this.findById(id);
      if (!updated) {
        throw new Error('Failed to retrieve updated user');
      }
      return updated;
    } catch (error) {
      throw new Error(`Failed to update user profile: ${error}`);
    }
  }

  async findPendingApproval(): Promise<User[]> {
    try {
      const stmt = this.db.prepare('SELECT * FROM users WHERE requires_approval = 1 AND approved_at IS NULL AND is_active = 1');
      const rows = stmt.all() as any[];
      return rows.map(row => this.mapRowToUser(row));
    } catch (error) {
      throw new Error(`Failed to find pending approval users: ${error}`);
    }
  }

  async setEmailVerified(id: string, verified: boolean): Promise<void> {
    try {
      const stmt = this.db.prepare('UPDATE users SET email_verified = ?, email_verification_token = NULL, email_verification_expires_at = NULL WHERE id = ?');
      stmt.run(verified ? 1 : 0, id);
    } catch (error) {
      throw new Error(`Failed to set email verification status: ${error}`);
    }
  }

  async setApprovalStatus(id: string, approved: boolean, approvedBy?: string): Promise<void> {
    try {
      const stmt = this.db.prepare('UPDATE users SET requires_approval = 0, approved_at = ?, approved_by = ? WHERE id = ?');
      stmt.run(approved ? new Date().toISOString() : null, approvedBy || null, id);
    } catch (error) {
      throw new Error(`Failed to set approval status: ${error}`);
    }
  }
}
