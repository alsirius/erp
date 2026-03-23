'use client'

import { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from 'react';
import { authService } from '@/services/authService';
import { AuthContextType, AuthState, LoginRequest, RegisterRequest, User } from '@/types';

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true,
  error: null,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
  const [state, setState] = useState<AuthState>(initialState);

  // Use a ref to track if we're already checking auth to prevent multiple simultaneous checks
  const isCheckingAuth = useRef(false);

  // Memoize the checkAuth function so it doesn't change on re-renders
  const checkAuth = useCallback(async () => {
    // Skip if we're already checking auth
    if (isCheckingAuth.current) {
      console.log('Auth check already in progress, skipping');
      return;
    }

    isCheckingAuth.current = true;
    setState(prev => ({ ...prev, loading: true }));

    try {
      console.log('Checking authentication status...');
      const isValid = await authService.validateAndRefreshToken();
      if (isValid) {
        const userData = authService.getStoredUser();
        console.log('User authenticated:', userData);
        setState({
          user: userData,
          token: authService.getToken(),
          isAuthenticated: true,
          loading: false,
          error: null,
        });
      } else {
        console.log('User not authenticated');
        setState({
          user: null,
          token: null,
          isAuthenticated: false,
          loading: false,
          error: null,
        });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: 'Authentication check failed',
      });
    } finally {
      setState(prev => ({ ...prev, loading: false }));
      isCheckingAuth.current = false;
    }
  }, []); // Empty dependency array means this function's reference is stable

  useEffect(() => {
    // Initial auth check on mount
    checkAuth();

    // Only listen for storage changes (for cross-tab synchronization)
    // This is important for when the user logs in/out in another tab
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'authToken' || e.key === 'user') {
        console.log('Storage change detected for auth data');
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [checkAuth]); // Include checkAuth in dependencies since it's memoized

  const login = async (credentials: LoginRequest): Promise<void> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await authService.login(credentials);
      
      if (response) {
        setState({
          user: response.user,
          token: response.accessToken,
          isAuthenticated: true,
          loading: false,
          error: null,
        });
      } else {
        throw new Error('Login failed');
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Login failed',
      }));
      throw error;
    }
  };

  const register = async (userData: RegisterRequest): Promise<void> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await authService.register(userData);
      
      // Don't auto-login after registration - require email verification
      setState(prev => ({
        ...prev,
        loading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      }));
      throw error;
    }
  };

  const logout = (): void => {
    authService.logout();
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,
    });
  };

  const refreshToken = async (): Promise<void> => {
    try {
      const response = await authService.refreshToken();
      const userData = authService.getStoredUser();
      const token = authService.getToken();
      
      setState(prev => ({
        ...prev,
        user: userData,
        token: token,
        isAuthenticated: true,
      }));
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
    }
  };

  const clearError = (): void => {
    setState(prev => ({ ...prev, error: null }));
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    refreshToken,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Hook to require authentication
export function requireAuth(): AuthContextType {
  const auth = useAuth();
  
  useEffect(() => {
    if (!auth.loading && !auth.isAuthenticated) {
      // Redirect to login page
      window.location.href = '/login';
    }
  }, [auth.loading, auth.isAuthenticated]);

  return auth;
}

// Hook to get current user
export function useCurrentUser(): User | null {
  const { user, isAuthenticated } = useAuth();
  return isAuthenticated ? user : null;
}

// Hook to check if user has specific role
export function useHasRole(role: string): boolean {
  const { user } = useAuth();
  return user?.role === role;
}

// Hook to check if user is admin
export function useIsAdmin(): boolean {
  return useHasRole('admin');
}
