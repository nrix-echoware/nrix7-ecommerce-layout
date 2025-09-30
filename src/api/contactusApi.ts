import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:9997';

export interface ContactPayload {
  site: string;
  type: string;
  message: string;
  extras?: Record<string, any>;
}

export async function submitContact(payload: ContactPayload): Promise<string> {
  const { data } = await axios.post<{ id: string }>(`${API_BASE_URL}/contactus`, payload);
  return data.id;
} 