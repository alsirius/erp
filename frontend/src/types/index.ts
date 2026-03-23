// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// User Types
export interface User {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  permissions: string[];
  phone?: string;
  department?: string;
  profileImageUrl?: string;
  bio?: string;
  emailVerified: boolean;
  isActive: boolean;
  status: string; // Added status field
  requiresApproval: boolean;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: string;
  phone?: string;
  department?: string;
  bio?: string;
  inviteCode?: string;
}

export interface UpdateUserProfileRequest {
  firstName: string;
  lastName: string;
  phone?: string;
  department?: string;
  bio?: string;
  profileImageUrl?: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword?: string;
  role?: string;
  phone?: string;
  department?: string;
  bio?: string;
  approvalCode?: string;
}

// Email Verification Types
export interface EmailVerificationRequest {
  email: string;
}

export interface EmailVerificationResponse {
  success: boolean;
  message: string;
}

// User Invitation Types
export interface UserInvitation {
  id: string;
  email: string;
  invitedBy: string;
  invitedByName: string;
  inviteCode: string;
  role: string;
  department?: string;
  message?: string;
  expiresAt: string;
  acceptedAt?: string;
  createdAt: string;
  isActive: boolean;
}

export interface CreateInvitationRequest {
  email: string;
  firstName: string;
  role: string;
  department?: string;
  message?: string;
  expiresAt?: string;
}

export interface InvitationRegistrationRequest {
  inviteCode: string;
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword?: string;
  phone?: string;
  department?: string;
  bio?: string;
}

// Password Reset Types
export interface PasswordResetRequest {
  email: string;
}

export interface CreatePasswordResetRequest {
  token: string;
  newPassword: string;
  confirmPassword?: string;
}

export interface PasswordResetResponse {
  success: boolean;
  message: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// JWT Token Types
export interface JwtPayload {
  id: number;
  email: string;
  role: string;
  permissions: string[];
  iat: number;
  exp: number;
}

// Auth Context Types
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  clearError: () => void;
}

// API Error Types
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

// Form Validation Types
export interface FormErrors {
  [key: string]: string | undefined;
}

// Dashboard Types
export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  totalRosters: number;
}
