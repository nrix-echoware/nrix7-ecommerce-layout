import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, authApiFunctions, TokenManager } from '../api/authApi';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signOutAll: () => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = user !== null && authApiFunctions.isAuthenticated();

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = TokenManager.getUser();
        const token = TokenManager.getAccessToken();
        
        if (storedUser && token && !TokenManager.isTokenExpired(token)) {
          setUser(storedUser);
        } else if (token && TokenManager.isTokenExpired(token)) {
          // Try to refresh token
          try {
            const authData = await authApiFunctions.refreshToken();
            setUser(authData.user);
          } catch (error) {
            // Refresh failed, clear tokens
            TokenManager.clearTokens();
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const authData = await authApiFunctions.signIn({ email, password });
      setUser(authData.user);
      toast.success('Signed in successfully!');
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Sign in failed';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const authData = await authApiFunctions.signUp({ email, password });
      setUser(authData.user);
      toast.success('Account created successfully!');
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Sign up failed';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await authApiFunctions.signOut();
      setUser(null);
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
      // Clear local state even if API call fails
      setUser(null);
    }
  };

  const signOutAll = async () => {
    try {
      await authApiFunctions.signOutAll();
      setUser(null);
      toast.success('Signed out from all devices');
    } catch (error) {
      console.error('Sign out all error:', error);
      // Clear local state even if API call fails
      setUser(null);
    }
  };

  const updateProfile = async (data: any) => {
    try {
      setIsLoading(true);
      const updatedUser = await authApiFunctions.updateProfile(data);
      setUser(updatedUser);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Profile update failed';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      setIsLoading(true);
      await authApiFunctions.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      toast.success('Password changed successfully!');
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Password change failed';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await authApiFunctions.getMe();
      setUser(userData);
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      // If refresh fails, user might be logged out
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    signIn,
    signUp,
    signOut,
    signOutAll,
    updateProfile,
    changePassword,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook to get user email for auto-filling forms
export function useUserEmail(): string | null {
  const { user } = useAuth();
  return user?.email || null;
}

// Hook to check if user is authenticated
export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
}
