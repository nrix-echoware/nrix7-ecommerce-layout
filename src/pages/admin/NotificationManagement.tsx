import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { sendNotification, getConnectionStats, ConnectionStats } from '../../api/websocketApi';
import { websocketService } from '../../services/websocketService';
import { toast } from 'sonner';
import { Send, Users, Wifi, WifiOff, RefreshCw, Bell, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

interface NotificationManagementProps {
  onAuthError: () => void;
}

export default function NotificationManagement({ onAuthError }: NotificationManagementProps) {
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'success' | 'warning' | 'error',
    target: 'all' as 'all' | 'admin',
  });

  const [connectionStats, setConnectionStats] = useState<ConnectionStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Load connection stats on component mount
  useEffect(() => {
    loadConnectionStats();
    
    // Set up WebSocket connection status monitoring
    const checkConnection = () => {
      setIsConnected(websocketService.isConnected());
    };
    
    checkConnection();
    const interval = setInterval(checkConnection, 1000);
    
    // Listen for connection stats updates
    websocketService.onMessage('connection_stats', (stats: ConnectionStats) => {
      setConnectionStats(stats);
    });

    return () => {
      clearInterval(interval);
      websocketService.offMessage('connection_stats');
    };
  }, []);

  const loadConnectionStats = async () => {
    try {
      const stats = await getConnectionStats();
      setConnectionStats(stats);
    } catch (error: any) {
      console.error('Error loading connection stats:', error);
      if (error?.response?.status === 401 || error?.message?.includes('Admin key required')) {
        toast.error('Admin authentication required. Please enter admin key.');
        onAuthError();
      } else {
        toast.error('Failed to load connection stats: ' + (error?.message || 'Unknown error'));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!notificationForm.title.trim() || !notificationForm.message.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      await sendNotification(notificationForm);
      toast.success('Notification sent successfully!');
      
      // Reset form
      setNotificationForm({
        title: '',
        message: '',
        type: 'info',
        target: 'all',
      });
    } catch (error: any) {
      if (error?.response?.status === 401 || error?.message?.includes('Admin key required')) {
        onAuthError();
      } else {
        toast.error('Failed to send notification');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warning':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'info':
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Notification Management</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Send real-time notifications to users via WebSocket
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className="w-5 h-5 text-green-500" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-500" />
            )}
            <span className="text-sm text-gray-600">
              WebSocket {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadConnectionStats}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Stats
          </Button>
        </div>
      </div>

      {/* Connection Stats */}
      {connectionStats && (
        <Card className="bg-white text-black">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Connection Statistics
            </CardTitle>
            <CardDescription className='text-gray-600'>
              Real-time WebSocket connection information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {connectionStats.total_connections}
                </div>
                <div className="text-sm text-gray-600">Total Connections</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {connectionStats.logged_in_users}
                </div>
                <div className="text-sm text-gray-600">Logged In Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {connectionStats.anonymous_users}
                </div>
                <div className="text-sm text-gray-600">Anonymous Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {connectionStats.admin_users}
                </div>
                <div className="text-sm text-gray-600">Admin Users</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Send Notification Form */}
      <Card className="bg-white text-black">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Send Notification
          </CardTitle>
          <CardDescription className='text-gray-600'>
            Send real-time notifications to connected users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <Input
                  id="title"
                  value={notificationForm.title}
                  onChange={(e) => setNotificationForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter notification title"
                  required
                />
              </div>
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                  Type *
                </label>
                <Select
                  value={notificationForm.type}
                  onValueChange={(value: 'info' | 'success' | 'warning' | 'error') => 
                    setNotificationForm(prev => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select notification type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">
                      <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-blue-500" />
                        Info
                      </div>
                    </SelectItem>
                    <SelectItem value="success">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Success
                      </div>
                    </SelectItem>
                    <SelectItem value="warning">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-gray-500" />
                        Warning
                      </div>
                    </SelectItem>
                    <SelectItem value="error">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        Error
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                Message *
              </label>
              <Textarea
                id="message"
                value={notificationForm.message}
                onChange={(e) => setNotificationForm(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Enter notification message"
                rows={3}
                required
              />
            </div>

            <div>
              <label htmlFor="target" className="block text-sm font-medium text-gray-700 mb-1">
                Target *
              </label>
              <Select
                value={notificationForm.target}
                onValueChange={(value: 'all' | 'admin') => 
                  setNotificationForm(prev => ({ ...prev, target: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select target audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="admin">Admin Users Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {isLoading ? 'Sending...' : 'Send Notification'}
              </Button>
              
              <Badge className={getTypeColor(notificationForm.type)}>
                {getTypeIcon(notificationForm.type)}
                <span className="ml-1 capitalize">{notificationForm.type}</span>
              </Badge>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Active Connections */}
      {connectionStats && connectionStats.connections.length > 0 && (
        <Card className="bg-white text-black">
          <CardHeader>
            <CardTitle>Active Connections</CardTitle>
            <CardDescription className='text-gray-600'>
              Currently connected users and sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {connectionStats.connections.map((connection) => (
                <div key={connection.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">
                        {connection.email || `Session ${connection.session_id?.substring(0, 8)}...`}
                      </div>
                      <div className="text-xs text-gray-500">
                        {connection.is_admin ? 'Admin' : connection.email ? 'Logged In' : 'Anonymous'}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 sm:text-right">
                    {new Date(connection.last_seen).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
