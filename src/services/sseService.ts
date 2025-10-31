import { TokenManager } from '../api/authApi';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:9997';

export interface SSEMessage {
  resource: string;
  resource_type: string;
  data: {
    order_id?: string;
    thread_id?: string;
    message_id?: string;
    status?: string;
    reason?: string;
    meta?: Record<string, any>;
  };
}

export interface Notification {
  id: string;
  resource: string;
  resource_type: string;
  data: SSEMessage['data'];
  created_at: string;
  is_read: boolean;
}

class SSEService {
  private adminConnection: EventSource | null = null;
  private userConnection: EventSource | null = null;
  private adminListeners: Set<(event: SSEMessage) => void> = new Set();
  private userListeners: Set<(event: SSEMessage) => void> = new Set();
  private notifications: Notification[] = [];
  private notificationListeners: Set<(notifications: Notification[]) => void> = new Set();

  connectAdmin() {
    if (this.adminConnection) return;

    const adminKey = sessionStorage.getItem('admin_api_key');
    if (!adminKey) {
      console.warn('No admin key found for SSE connection');
      return;
    }

    const url = `${API_BASE}/admin/sse?admin_key=${encodeURIComponent(adminKey)}`;
    this.adminConnection = new EventSource(url);

    this.adminConnection.addEventListener('message', (e) => {
      try {
        const data = JSON.parse(e.data) as SSEMessage;
        this.adminListeners.forEach(listener => listener(data));
        
        this.addNotification({
          id: `${Date.now()}-${Math.random()}`,
          resource: data.resource,
          resource_type: data.resource_type,
          data: data.data,
          created_at: new Date().toISOString(),
          is_read: false,
        });
      } catch (err) {
        console.error('Failed to parse SSE message:', err);
      }
    });

    this.adminConnection.addEventListener('error', (err) => {
      console.error('Admin SSE error:', err);
      this.disconnectAdmin();
    });
  }

  connectUser(userId: string) {
    if (this.userConnection) {
      this.disconnectUser();
    }

    const token = TokenManager.getAccessToken();
    if (!token) {
      console.warn('No token found for user SSE connection');
      return;
    }

    // Validate token isn't empty or just whitespace
    if (!token.trim()) {
      console.warn('Token is empty or whitespace');
      return;
    }

    const url = `${API_BASE}/user/sse/notification/${userId}?token=${encodeURIComponent(token)}`;
    console.log('Connecting to user SSE:', {
      userId,
      url: url.replace(/token=[^&]*/, 'token=***'),
      hasToken: !!token,
      tokenLength: token.length
    });
    
    try {
      this.userConnection = new EventSource(url);
    } catch (error) {
      console.error('Failed to create EventSource:', error);
      return;
    }

    this.userConnection.addEventListener('message', (e) => {
      try {
        const data = JSON.parse(e.data) as SSEMessage;
        this.userListeners.forEach(listener => listener(data));
        
        this.addNotification({
          id: `${Date.now()}-${Math.random()}`,
          resource: data.resource,
          resource_type: data.resource_type,
          data: data.data,
          created_at: new Date().toISOString(),
          is_read: false,
        });
      } catch (err) {
        console.error('Failed to parse SSE message:', err);
      }
    });

    this.userConnection.addEventListener('error', (err) => {
      console.error('User SSE error:', err);
      const event = err as Event & { target?: EventSource };
      if (event.target) {
        const es = event.target as EventSource;
        console.error('EventSource readyState:', es.readyState);
        console.error('EventSource URL:', es.url.replace(/token=[^&]*/, 'token=***'));
        if (es.readyState === EventSource.CLOSED) {
          console.warn('SSE connection closed, will attempt to reconnect...');
        }
      }
    });

    this.userConnection.addEventListener('open', () => {
      console.log('User SSE connection opened successfully');
    });
  }

  disconnectAdmin() {
    if (this.adminConnection) {
      this.adminConnection.close();
      this.adminConnection = null;
    }
  }

  disconnectUser() {
    if (this.userConnection) {
      this.userConnection.close();
      this.userConnection = null;
    }
  }

  onAdminEvent(listener: (event: SSEMessage) => void) {
    this.adminListeners.add(listener);
    return () => this.adminListeners.delete(listener);
  }

  onUserEvent(listener: (event: SSEMessage) => void) {
    this.userListeners.add(listener);
    return () => this.userListeners.delete(listener);
  }

  addNotification(notification: Notification) {
    this.notifications.unshift(notification);
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }
    this.notificationListeners.forEach(listener => listener([...this.notifications]));
  }

  getNotifications(): Notification[] {
    return [...this.notifications];
  }

  markAsRead(id: string) {
    const notif = this.notifications.find(n => n.id === id);
    if (notif) {
      notif.is_read = true;
      this.notificationListeners.forEach(listener => listener([...this.notifications]));
    }
  }

  onNotificationsChange(listener: (notifications: Notification[]) => void) {
    this.notificationListeners.add(listener);
    return () => this.notificationListeners.delete(listener);
  }

  clearNotifications() {
    this.notifications = [];
    this.notificationListeners.forEach(listener => listener([]));
  }
}

export const sseService = new SSEService();

