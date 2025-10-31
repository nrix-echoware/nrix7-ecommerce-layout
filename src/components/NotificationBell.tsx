import { useEffect, useState, useRef } from 'react';
import { Bell } from 'lucide-react';
import { sseService, Notification } from '../services/sseService';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import { ScrollArea } from './ui/scroll-area';

interface NotificationBellProps {
  isAdmin?: boolean;
}

export default function NotificationBell({ isAdmin = false }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setNotifications(sseService.getNotifications());
    
    const unsubscribe = sseService.onNotificationsChange(setNotifications);
    return unsubscribe;
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleNotificationClick = (notification: Notification) => {
    sseService.markAsRead(notification.id);
    
    if (notification.resource_type === 'messages.new' && notification.data.order_id) {
      if (isAdmin) {
        navigate(`/admin/orders/${notification.data.order_id}`);
      } else {
        navigate(`/orders/${notification.data.order_id}`);
      }
    } else if (notification.resource_type === 'orders.updated' && notification.data.order_id) {
      if (isAdmin) {
        navigate(`/admin/orders/${notification.data.order_id}`);
      } else {
        navigate(`/orders/${notification.data.order_id}`);
      }
    }
    
    setIsOpen(false);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getNotificationLabel = (notification: Notification) => {
    switch (notification.resource_type) {
      case 'messages.new':
        return 'New Message';
      case 'orders.created':
        return 'New Order';
      case 'orders.updated':
        return 'Order Updated';
      case 'threads.closed':
        return 'Thread Closed';
      default:
        return notification.resource_type;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
        </div>
        <ScrollArea className="h-96">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              No notifications
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    !notification.is_read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {getNotificationLabel(notification)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {notification.data.order_id && `Order: ${notification.data.order_id.slice(0, 8)}...`}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {formatTime(notification.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

