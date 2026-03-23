import { Request } from 'express';

// Core User Types (adapted from Smartify)
export interface User {
  id: string;
  email: string;
  firstName: string; // Mapped from first_name
  lastName: string;  // Mapped from last_name
  passwordHash: string; // Mapped from password_hash
  role: UserRole;
  department?: string;
  status: UserStatus;
  deleted: number;
  approvalCode?: string; // Mapped from approval_code
  phone?: string;
  bio?: string;
  emailVerified: number; // Mapped from email_verified
  profileImageUrl?: string; // Mapped from profile_image_url
  requiresApproval: number; // Mapped from requires_approval
  approvedBy?: string; // Mapped from approved_by
  approvedAt?: Date; // Mapped from approved_at
  createdAt: Date; // Mapped from created_at
  updatedAt: Date; // Mapped from updated_at
}

export interface CreateUserDto {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role?: UserRole;
  phone?: string;
  department?: string;
  bio?: string;
  approvalCode?: string; // From Smartify pattern
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  department?: string;
  bio?: string;
  profileImageUrl?: string;
  role?: UserRole;
  status?: UserStatus;
  deleted?: number;
  emailVerified?: number;
}

export interface UserProfileDto {
  firstName: string;
  lastName: string;
  phone?: string;
  department?: string;
  bio?: string;
  profileImageUrl?: string;
}

// Registration Code Types (from Smartify)
export interface RegistrationCode {
  id: string;
  code: string;
  createdBy: string; // Mapped from created_by
  createdAt: Date; // Mapped from created_at
  usedBy?: string; // Mapped from used_by
  usedAt?: Date; // Mapped from used_at
  usableBy: string; // Mapped from usable_by
}

export interface CreateRegistrationCodeDto {
  usableBy: string;
  sendEmail?: boolean;
}

// Email Verification Types (from Smartify)
export interface EmailVerification {
  id: string;
  email: string;
  verificationCode: string; // Mapped from verification_code
  createdAt: Date; // Mapped from created_at
  expiresAt: Date; // Mapped from expires_at
  verified: boolean;
  registrationData?: string; // Mapped from registration_data
}

export interface EmailVerificationRequest {
  email: string;
}

export interface EmailVerificationResponse {
  success: boolean;
  message: string;
}

// Password Reset Types (adapted from Smartify)
export interface PasswordResetRequest {
  email: string;
}

export interface CreatePasswordResetDto {
  email: string;
  code: string;
  newPassword: string;
}

export interface PasswordResetToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
  isActive: boolean;
}

// Enums (from Smartify)
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager', 
  USER = 'user'
}

export enum UserStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  DISABLED = 'disabled',
  REJECTED = 'rejected',
  REACTIVATION_REQUESTED = 'reactivation_requested',
  SOFT_DELETED = 'soft_deleted'
}

export enum Permission {
  READ_USERS = 'read_users',
  WRITE_USERS = 'write_users',
  DELETE_USERS = 'delete_users',
  READ_ROSTERS = 'read_rosters',
  WRITE_ROSTERS = 'write_rosters',
  DELETE_ROSTERS = 'delete_rosters',
  MANAGE_SYSTEM = 'manage_system'
}

// Authentication Types (adapted from Smartify)
export interface JwtPayload {
  userId: string; // Changed from id to userId for consistency
  email: string;
  role: UserRole;
  permissions?: Permission[];
  iat: number;
  exp: number;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: string;
  phone?: string;
  department?: string;
  verificationCode?: string;
  approvalCode?: string;
}

export interface LoginResponse {
  success: boolean;
  data?: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
  error?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: Record<string, string>; // For validation error details
  pagination?: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationInfo;
}

// Roster Management Types
export interface Roster {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  members: RosterMember[];
}

export interface RosterMember {
  id: string;
  rosterId: string;
  userId: string;
  role: string;
  joinedAt: Date;
  user?: User; // Populated when needed
}

export interface CreateRosterDto {
  name: string;
  description?: string;
}

export interface UpdateRosterDto {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface AddMemberDto {
  userId: string;
  role: string;
}

// Database Types
export interface DatabaseConfig {
  path: string;
  readonly?: boolean;
  verbose?: boolean;
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  statusCode: number;
  details?: any;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// Service Layer Types
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: AppError;
}

// DAO Interface Types
export interface IUserDAO {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(user: CreateUserDto): Promise<User>;
  update(id: string, updates: UpdateUserDto): Promise<User>;
  delete(id: string): Promise<boolean>;
  findAll(options?: FindAllOptions): Promise<User[]>;
  findByRole(role: UserRole): Promise<User[]>;
}

export interface IRosterDAO {
  findById(id: string): Promise<Roster | null>;
  findByUserId(userId: string): Promise<Roster[]>;
  create(roster: CreateRosterDto, createdBy: string): Promise<Roster>;
  update(id: string, updates: UpdateRosterDto): Promise<Roster>;
  delete(id: string): Promise<boolean>;
  findAll(options?: FindAllOptions): Promise<Roster[]>;
}

export interface IRosterMemberDAO {
  findById(id: string): Promise<RosterMember | null>;
  findByRosterId(rosterId: string): Promise<RosterMember[]>;
  findByUserId(userId: string): Promise<RosterMember[]>;
  create(member: AddMemberDto): Promise<RosterMember>;
  update(id: string, updates: Partial<RosterMember>): Promise<RosterMember>;
  delete(id: string): Promise<boolean>;
  removeMember(rosterId: string, userId: string): Promise<boolean>;
}

export interface FindAllOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

export interface ValidationSchema {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'email';
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: any) => boolean | string;
  };
}

// Configuration Types
export interface AppConfig {
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  jwtSecret: string;
  jwtExpiresIn: string;
  refreshTokenExpiresIn: string;
  database: DatabaseConfig;
  cors: {
    origin: string | string[];
    credentials: boolean;
  };
}

// Utility Types
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type Partial<T> = {
  [P in keyof T]?: T[P];
};

// HTTP Status Codes
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  INTERNAL_SERVER_ERROR = 500
}
