import { BaseApiService } from './apiClient';
import { LoginRequest, LoginResponse, RegisterRequest, User } from '@/types';
import { jwtDecode } from 'jwt-decode';

interface CoreUserInfo {
  userId: string;
  email: string;
  role: string;
  exp: number;
}

export class AuthService extends BaseApiService {
  private static instance: AuthService;

  private constructor() {
    super();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Get stored token from localStorage
   */
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.log('Token not found in localStorage');
    }
    return token;
  }

  /**
   * Get stored user data from localStorage
   */
  getStoredUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Error parsing user data:', error);
      this.clearAuthData();
      return null;
    }
  }

  /**
   * Set authentication data in localStorage
   */
  setAuthData(token: string, userData: User): void {
    try {
      console.log('🔐 setAuthData called with:', {
        token: token,
        tokenType: typeof token,
        tokenLength: token?.length,
        userData: userData
      });
      
      // Don't store if token is null or undefined
      if (!token || token === 'null' || token === 'undefined') {
        console.error('❌ Invalid token provided to setAuthData:', token);
        throw new Error('Invalid token provided');
      }
      
      // Decode token to verify core data matches
      const decodedToken = jwtDecode<CoreUserInfo>(token);
      console.log('✅ Token decoded successfully:', decodedToken);

      // Store the complete user profile data, including core fields from token
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify({
        ...userData,
        last_updated_at: new Date().toISOString()
      }));

      console.log('✅ Auth data stored in localStorage');
      console.log('🔍 Stored token verification:', localStorage.getItem('authToken'));
    } catch (error) {
      console.error('❌ Error setting auth:', error);
      // Don't call clearAuth here to avoid circular dependencies
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      throw error;
    }
  }

  /**
   * Clear all authentication data
   */
  clearAuthData(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    console.log('Auth data cleared from localStorage');
  }

  /**
   * Validate JWT token against localStorage user data
   */
  validateToken(): boolean {
    const token = this.getToken();
    const user = this.getStoredUser();

    if (!token || !user) return false;

    try {
      // Decode the token
      const decodedToken = jwtDecode<CoreUserInfo>(token);

      // Check if token is expired
      const currentTime = Date.now() / 1000;
      if (decodedToken.exp < currentTime) {
        console.error('Token has expired');
        this.clearAuthData();
        return false;
      }

      // Only validate the core fields that should match between token and user data
      if (decodedToken.userId !== user.id ||
          decodedToken.email !== user.email ||
          decodedToken.role !== user.role) {
        console.error('Core user data mismatch between token and localStorage');
        this.clearAuthData();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating token:', error);
      this.clearAuthData();
      return false;
    }
  }

  /**
   * Validate and refresh token if needed
   */
  async validateAndRefreshToken(): Promise<boolean> {
    const token = this.getToken();
    const user = this.getStoredUser();

    if (!token || !user) {
      return false;
    }

    try {
      const decodedToken = jwtDecode<any>(token);
      const currentTime = Date.now() / 1000;

      // Check if token is expired or will expire in next 5 minutes
      if (decodedToken.exp - currentTime < 300) {
        // Token is expired or about to expire
        const response = await this.client.post<{ token: string }>('/api/users/refresh');
        
        if (response.success && response.data) {
          localStorage.setItem('authToken', response.data.token);
          return true;
        } else {
          this.clearAuthData();
          return false;
        }
      }

      // Validate that token user ID matches localStorage user ID
      if (decodedToken.userId !== user.id) {
        console.error('User ID mismatch between token and localStorage');
        this.clearAuthData();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating and refreshing token:', error);
      this.clearAuthData();
      return false;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.validateToken();
  }

  /**
   * Authenticate user with email and password
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.client.post<LoginResponse>('/api/auth/login', credentials);
    
    console.log('Login response:', response);
    
    if (response.success && response.data) {
      console.log('Login data:', response.data);
      console.log('Access token:', response.data.accessToken);
      console.log('User data:', response.data.user);
      
      // Store auth data using correct token field
      this.setAuthData(response.data.accessToken, response.data.user);
    }
    
    return this.validateResponse(response);
  }

  /**
   * Register a new user
   */
  async register(userData: RegisterRequest): Promise<any> {
    const response = await this.client.post<any>('/api/auth/register', userData);
    return this.validateResponse(response);
  }

  /**
   * Validate current JWT token
   */
  async validateTokenEndpoint(): Promise<User> {
    const token = this.getToken();
    if (!token) {
      throw new Error('No token found');
    }

    const response = await this.client.get<User>('/api/users/validate-token');
    
    const user = this.validateResponse(response);
    
    // Update stored user data with fresh data from server
    if (token && user) {
      this.setAuthData(token, user);
    }
    
    return user;
  }

  /**
   * Logout user
   */
  logout(): void {
    this.clearAuthData();
  }

  /**
   * Refresh JWT token
   */
  async refreshToken(): Promise<{ token: string }> {
    const response = await this.client.post<{ token: string }>('/api/users/refresh');
    const result = this.validateResponse(response);
    
    if (result && result.token) {
      localStorage.setItem('authToken', result.token);
    }
    
    return result;
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();
