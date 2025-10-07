import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:9997';

export interface ContactPayload {
  site: string;
  type: string;
  message: string;
  extras?: Record<string, any>;
}

export interface ContactUsResponse {
  id: string;
  site: string;
  type: string;
  message: string;
  extras?: Record<string, any>;
  created_at: string;
}

export interface GetContactUsParams {
  site?: string;
  type?: string;
  message?: string;
  skip?: number;
  limit?: number;
}

function getAdminKey(): string | null {
  return sessionStorage.getItem('admin_api_key');
}

export async function submitContact(payload: ContactPayload): Promise<string> {
  const { data } = await axios.post<{ id: string }>(`${API_BASE_URL}/contactus`, payload);
  return data.id;
}

// Admin-only: Fetch contact us submissions
export async function getContactUsSubmissions(params?: GetContactUsParams): Promise<{ total: number; data: ContactUsResponse[] }> {
  const adminKey = getAdminKey();
  if (!adminKey) {
    throw new Error('Admin key required to fetch contact submissions');
  }

  const { data } = await axios.get<{ total: number; data: ContactUsResponse[] }>(
    `${API_BASE_URL}/contactus`,
    {
      params: {
        site: params?.site,
        type: params?.type,
        message: params?.message,
        skip: params?.skip || 0,
        limit: params?.limit || 10,
      },
      headers: {
        'X-Admin-API-Key': adminKey,
      },
    }
  );
  return data;
} 