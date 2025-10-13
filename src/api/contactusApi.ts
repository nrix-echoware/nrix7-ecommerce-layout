import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:9997';

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
  status?: string;
  created_at: string;
  updated_at?: string;
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
  console.log('submitContact', payload);
  const { data } = await axios.post<{ id: string }>(`${API_BASE_URL}/contactus`, payload);
  console.log('submitContact response', data);
  return data.id;
}

export interface GetAllContactUsResponse {
  contacts: ContactUsResponse[];
  total: number;
  limit: number;
  offset: number;
}

// Admin-only: Fetch contact us submissions (deprecated - use getAllContactUs)
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

// Admin-only: Get all contact us submissions with pagination
export async function getAllContactUs(
  limit = 50,
  offset = 0
): Promise<GetAllContactUsResponse> {
  const adminKey = getAdminKey();
  if (!adminKey) {
    throw new Error('Admin key required to fetch contact submissions');
  }

  const { data } = await axios.get<GetAllContactUsResponse>(
    `${API_BASE_URL}/contactus`,
    {
      params: { limit, offset },
      headers: {
        'X-Admin-API-Key': adminKey,
      },
    }
  );
  return data;
}

// Admin-only: Update contact us submission status
export async function updateContactUsStatus(
  id: string,
  status: 'pending' | 'in_progress' | 'resolved' | 'closed'
): Promise<{ message: string }> {
  const adminKey = getAdminKey();
  if (!adminKey) {
    throw new Error('Admin key required to update contact submission status');
  }

  const { data } = await axios.patch<{ message: string }>(
    `${API_BASE_URL}/contactus/${id}/status`,
    { status },
    {
      headers: {
        'X-Admin-API-Key': adminKey,
      },
    }
  );
  return data;
} 