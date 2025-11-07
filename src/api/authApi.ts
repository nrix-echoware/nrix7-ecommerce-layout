import axios from 'axios';
import { getApiBaseUrl } from '../config/api';

const API_BASE_URL = getApiBaseUrl();

// Types
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  date_of_birth?: string;
  profile_image?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  is_active: boolean;
  is_verified: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface SignUpRequest {
  email: string;
  password: string;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface UpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  phone?: string;
  date_of_birth?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

// Token management
export class TokenManager {
  private static readonly ACCESS_TOKEN_KEY = 'access_token';
  private static readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private static readonly USER_KEY = 'user';

  static setTokens(accessToken: string, refreshToken: string, user: User): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  static getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  static getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static getUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  static clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  static isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }
}

// Create axios instance with interceptors
const authApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
authApi.interceptors.request.use(
  (config) => {
    const token = TokenManager.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Refresh token queue to prevent multiple simultaneous refresh attempts
let refreshPromise: Promise<any> | null = null;

// Response interceptor to handle token refresh
authApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = TokenManager.getRefreshToken();
      if (refreshToken) {
        try {
          // If there's already a refresh in progress, wait for it
          if (refreshPromise) {
            await refreshPromise;
            // Retry original request with new token
            const newAccessToken = TokenManager.getAccessToken();
            if (newAccessToken) {
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
              return authApi(originalRequest);
            }
          }

          // Start new refresh attempt
          refreshPromise = axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });

          const response = await refreshPromise;
          const { access_token, refresh_token, user } = response.data;
          TokenManager.setTokens(access_token, refresh_token, user);

          // Clear the refresh promise
          refreshPromise = null;

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return authApi(originalRequest);
        } catch (refreshError) {
          // Clear the refresh promise on error
          refreshPromise = null;
          
          // Refresh failed, clear tokens and redirect to login
          TokenManager.clearTokens();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token, redirect to login
        TokenManager.clearTokens();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Auth API functions
export const authApiFunctions = {
  // Sign up
  async signUp(data: SignUpRequest): Promise<AuthResponse> {
    const response = await authApi.post('/auth/signup', data);
    const authData = response.data;
    TokenManager.setTokens(authData.access_token, authData.refresh_token, authData.user);
    return authData;
  },

  // Sign in
  async signIn(data: SignInRequest): Promise<AuthResponse> {
    const response = await authApi.post('/auth/signin', data);
    const authData = response.data;
    TokenManager.setTokens(authData.access_token, authData.refresh_token, authData.user);
    return authData;
  },

  // Sign out
  async signOut(): Promise<void> {
    const refreshToken = TokenManager.getRefreshToken();
    if (refreshToken) {
      try {
        await authApi.post('/auth/signout', { refresh_token: refreshToken });
      } catch (error) {
        console.error('Sign out error:', error);
      }
    }
    TokenManager.clearTokens();
  },

  // Sign out from all devices
  async signOutAll(): Promise<void> {
    try {
      await authApi.post('/auth/signout-all');
    } catch (error) {
      console.error('Sign out all error:', error);
    }
    TokenManager.clearTokens();
  },

  // Get current user profile
  async getProfile(): Promise<User> {
    const response = await authApi.get('/auth/profile');
    return response.data;
  },

  // Update profile
  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    const response = await authApi.put('/auth/profile', data);
    const updatedUser = response.data;
    
    // Update stored user data
    const currentUser = TokenManager.getUser();
    if (currentUser) {
      TokenManager.setTokens(
        TokenManager.getAccessToken()!,
        TokenManager.getRefreshToken()!,
        updatedUser
      );
    }
    
    return updatedUser;
  },

  // Change password
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    await authApi.put('/auth/change-password', data);
  },

  // Get current user info (auth me)
  async getMe(): Promise<User> {
    const response = await authApi.get('/auth/me');
    return response.data;
  },

  // Refresh token manually
  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = TokenManager.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await authApi.post('/auth/refresh', {
      refresh_token: refreshToken,
    });
    
    const authData = response.data;
    TokenManager.setTokens(authData.access_token, authData.refresh_token, authData.user);
    return authData;
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = TokenManager.getAccessToken();
    return token !== null && !TokenManager.isTokenExpired(token);
  },

  // Get current user
  getCurrentUser(): User | null {
    return TokenManager.getUser();
  },
};

// Export default
export default authApiFunctions;
