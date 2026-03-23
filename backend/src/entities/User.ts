// User Entity Types and Interfaces
import { UserRole, UserStatus } from '../types';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
  role: UserRole;
  department?: string;
  status: UserStatus;
  deleted: number; // Changed to number to match types/index.ts
  bio?: string;
  phone?: string;
  emailVerified: number; // Changed to number to match types/index.ts
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  profileImageUrl?: string;
  requiresApproval: number; // Mapped from requires_approval
  approvedBy?: string; // Mapped from approved_by
  approvedAt?: Date; // Mapped from approved_at
}

export interface CreateUserDto {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role?: UserRole;
  department?: string;
  bio?: string;
  phone?: string;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  department?: string;
  bio?: string;
  phone?: string;
  profileImageUrl?: string;
  approvedBy?: string; // Mapped from approved_by
  approvedAt?: Date; // Mapped from approved_at
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface DisableAccountDto {
  reason?: string;
}

export interface UpdateUserStatusDto {
  status: 'active' | 'disabled' | 'pending' | 'reactivation_requested';
  comment?: string;
}

export interface UserProfileResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  department?: string;
  status: string;
  bio?: string;
  phone?: string;
  emailVerified: number; // Changed to number to match User interface
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  profileImageUrl?: string;
}

// Query filters for user operations
export interface UserFilters {
  id?: string;
  email?: string;
  role?: string;
  status?: string;
  department?: string;
  deleted?: boolean;
  emailVerified?: boolean;
}

// Validation schemas
export const userValidationSchemas = {
  create: {
    email: 'required|email',
    firstName: 'required|string|min:2|max:50',
    lastName: 'required|string|min:2|max:50',
    password: 'required|string|min:8',
    role: 'string|in:admin,user,manager',
    department: 'string|max:100',
    bio: 'string|max:500',
    phone: 'string|max:20'
  },
  update: {
    firstName: 'string|min:2|max:50',
    lastName: 'string|min:2|max:50',
    email: 'email',
    department: 'string|max:100',
    bio: 'string|max:500',
    phone: 'string|max:20',
    profileImageUrl: 'url'
  },
  changePassword: {
    currentPassword: 'required|string|min:8',
    newPassword: 'required|string|min:8'
  }
};
