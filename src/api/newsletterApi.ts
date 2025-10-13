import axios from 'axios';
import { TokenManager } from './authApi';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:9997';

export interface NewsletterResponse {
  message: string;
  success: boolean;
}

export interface NewsletterStatusResponse {
  is_subscribed: boolean;
  email: string;
}

export interface NewsletterSubscription {
  id: string;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GetAllSubscriptionsResponse {
  subscriptions: NewsletterSubscription[];
  total: number;
  limit: number;
  offset: number;
}

// Subscribe to newsletter (uses JWT token for email)
export async function subscribeToNewsletter(): Promise<NewsletterResponse> {
  const token = TokenManager.getAccessToken();
  console.log('Newsletter API - Subscribe - Token available:', !!token);
  
  if (!token) {
    throw new Error('Authentication required. Please sign in first.');
  }

  console.log('Newsletter API - Subscribe - Making request to:', `${API_BASE_URL}/newsletter/subscribe`);
  
  const { data } = await axios.post<NewsletterResponse>(
    `${API_BASE_URL}/newsletter/subscribe`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  
  console.log('Newsletter API - Subscribe - Response:', data);
  return data;
}

// Unsubscribe from newsletter (uses JWT token for email)
export async function unsubscribeFromNewsletter(): Promise<NewsletterResponse> {
  const token = TokenManager.getAccessToken();
  if (!token) {
    throw new Error('Authentication required. Please sign in first.');
  }

  const { data } = await axios.post<NewsletterResponse>(
    `${API_BASE_URL}/newsletter/unsubscribe`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return data;
}

// Get subscription status (uses JWT token for email)
export async function getNewsletterStatus(): Promise<NewsletterStatusResponse> {
  const token = TokenManager.getAccessToken();
  console.log('Newsletter API - Get Status - Token available:', !!token);
  
  if (!token) {
    throw new Error('Authentication required. Please sign in first.');
  }

  console.log('Newsletter API - Get Status - Making request to:', `${API_BASE_URL}/newsletter/status`);
  
  const { data } = await axios.get<NewsletterStatusResponse>(
    `${API_BASE_URL}/newsletter/status`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  
  console.log('Newsletter API - Get Status - Response:', data);
  return data;
}

// Admin-only: Get all newsletter subscriptions
export async function getAllNewsletterSubscriptions(
  limit = 50,
  offset = 0
): Promise<GetAllSubscriptionsResponse> {
  const { data } = await axios.get<GetAllSubscriptionsResponse>(
    `${API_BASE_URL}/newsletter/subscriptions`,
    {
      params: { limit, offset },
    }
  );
  return data;
}
