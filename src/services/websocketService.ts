import { toast } from 'sonner';
import { getRealtimeBaseUrl } from '../config/api';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
  from?: string;
  to?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  target: string;
  created_at: string;
  read: boolean;
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

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;
  private isConnecting = false;
  private messageHandlers: Map<string, (data: any) => void> = new Map();

  constructor() {
    this.connect();
  }

  private connect() {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;

    try {
      let wsUrl: string;
      const realtimeBase = getRealtimeBaseUrl();

      if (realtimeBase && realtimeBase.trim()) {
        const socketBase = realtimeBase.replace(/^http/, 'ws');
        wsUrl = `${socketBase}/api/ws`;
      } else if (typeof window !== 'undefined') {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        wsUrl = `${protocol}//${host}/api/ws`;
      } else {
        wsUrl = 'ws://localhost:9998/api/ws';
      }

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.isConnecting = false;
        this.ws = null;
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        console.error('WebSocket URL was:', wsUrl);
        this.isConnecting = false;
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      setTimeout(() => {
        this.connect();
      }, this.reconnectInterval);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  private handleMessage(message: WebSocketMessage) {
    switch (message.type) {
      case 'notification':
        this.handleNotification(message.data);
        break;
      case 'connection_stats':
        this.handleConnectionStats(message.data);
        break;
      default:
        console.log('Unknown message type:', message.type);
    }

    // Call registered handlers
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      handler(message.data);
    }
  }

  private handleNotification(notification: Notification) {
    // Show toast notification based on type
    switch (notification.type) {
      case 'success':
        toast.success(notification.title, {
          description: notification.message,
          duration: 5000,
        });
        break;
      case 'error':
        toast.error(notification.title, {
          description: notification.message,
          duration: 5000,
        });
        break;
      case 'warning':
        toast.warning(notification.title, {
          description: notification.message,
          duration: 5000,
        });
        break;
      case 'info':
      default:
        toast.info(notification.title, {
          description: notification.message,
          duration: 5000,
        });
        break;
    }
  }

  private handleConnectionStats(stats: ConnectionStats) {
    // This will be handled by admin panel components
    console.log('Connection stats updated:', stats);
  }

  // Public methods
  public onMessage(type: string, handler: (data: any) => void) {
    this.messageHandlers.set(type, handler);
  }

  public offMessage(type: string) {
    this.messageHandlers.delete(type);
  }

  public sendMessage(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  public reconnect() {
    this.reconnectAttempts = 0;
    this.connect();
  }
}

// Create singleton instance
export const websocketService = new WebSocketService();

// Export for use in components
export default websocketService;
