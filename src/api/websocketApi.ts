import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:9997';

function getAdminKey(): string | null {
  const key = sessionStorage.getItem('admin_api_key');
  console.log('Retrieved admin key from sessionStorage:', key);
  return key;
}

export interface AdminNotificationRequest {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  target: 'all' | 'admin';
}

export interface AdminNotificationResponse {
  message: string;
  notification: {
    id: string;
    title: string;
    message: string;
    type: string;
    target: string;
    created_at: string;
    read: boolean;
  };
}

export interface ConnectionStats {
  total_connections: number;
  logged_in_users: number;
  anonymous_users: number;
  admin_users: number;
  connections: Array<{
    id: string;
    email?: string;
    session_id?: string;
    is_admin: boolean;
    last_seen: string;
  }>;
}

// Send notification to users
export async function sendNotification(
  notification: AdminNotificationRequest
): Promise<AdminNotificationResponse> {
  const adminKey = getAdminKey();
  if (!adminKey) {
    throw new Error('Admin key required to send notifications');
  }

  const { data } = await axios.post<AdminNotificationResponse>(
    `${API_BASE_URL}/admin/ws/notify`,
    notification,
    {
      headers: {
        'X-Admin-API-Key': adminKey,
      },
    }
  );
  return data;
}

// Get WebSocket connection statistics
export async function getConnectionStats(): Promise<ConnectionStats> {
  const adminKey = getAdminKey();
  console.log('Admin key from storage:', adminKey ? 'Present' : 'Missing');
  
  if (!adminKey) {
    throw new Error('Admin key required to get connection stats');
  }

  console.log('Making request to:', `${API_BASE_URL}/admin/ws/stats`);
  console.log('With headers:', { 'X-Admin-API-Key': adminKey });

  const { data } = await axios.get<ConnectionStats>(
    `${API_BASE_URL}/admin/ws/stats`,
    {
      headers: {
        'X-Admin-API-Key': adminKey,
      },
    }
  );
  return data;
}
