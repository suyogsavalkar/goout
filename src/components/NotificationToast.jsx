"use client";

import { useEffect } from 'react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  UserPlus, 
  UserCheck, 
  UserX, 
  Calendar,
  Bell
} from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useNotifications } from '@/hooks/useNotifications';

// Custom toast component for notifications
const NotificationToastContent = ({ notification, onAction }) => {
  const { profile: senderProfile } = useProfile(notification.sender_id);

  const getIcon = () => {
    switch (notification.type) {
      case 'event_request':
        return <UserPlus className="h-4 w-4 text-blue-500" />;
      case 'request_approved':
        return <UserCheck className="h-4 w-4 text-green-500" />;
      case 'request_denied':
        return <UserX className="h-4 w-4 text-red-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActionButton = () => {
    switch (notification.type) {
      case 'event_request':
        return (
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onAction && onAction('view_requests', notification)}
          >
            View Requests
          </Button>
        );
      case 'request_approved':
        return (
          <Button 
            size="sm"
            onClick={() => onAction && onAction('view_event', notification)}
          >
            View Event
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex items-start space-x-3 p-2">
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={senderProfile?.profile_pic_url} />
        <AvatarFallback className="text-xs">
          {senderProfile?.name ? senderProfile.name.charAt(0).toUpperCase() : 'U'}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          {getIcon()}
          <p className="text-sm font-medium text-gray-900 truncate">
            {senderProfile?.name || 'Someone'}
          </p>
        </div>
        
        <p className="text-sm text-gray-700 mb-2">
          {notification.message}
        </p>
        
        {getActionButton()}
      </div>
    </div>
  );
};

// Hook for managing notification toasts
export const useNotificationToasts = () => {
  const { notifications } = useNotifications();

  useEffect(() => {
    // Show toast for new unread notifications
    const unreadNotifications = notifications.filter(n => !n.read);
    
    unreadNotifications.forEach(notification => {
      // Use a simple approach to avoid duplicate toasts
      const toastId = `notification-${notification.id}`;
      const toastType = getToastType(notification.type);
      
      toast[toastType](
        <NotificationToastContent 
          notification={notification}
          onAction={handleNotificationAction}
        />,
        {
          id: toastId,
          duration: 5000,
          position: 'top-right'
        }
      );
    });
  }, [notifications.length]); // Only depend on the length to avoid infinite loops

  const getToastType = (notificationType) => {
    switch (notificationType) {
      case 'request_approved':
        return 'success';
      case 'request_denied':
        return 'error';
      case 'event_request':
      default:
        return 'info';
    }
  };

  const handleNotificationAction = (action, notification) => {
    switch (action) {
      case 'view_requests':
        // Navigate to event management page
        window.location.href = `/events/${notification.event_id}/manage`;
        break;
      case 'view_event':
        // Navigate to event details page
        window.location.href = `/events/${notification.event_id}`;
        break;
      default:
        break;
    }
  };
};

// Real-time notification listener component
export default function NotificationToastProvider({ children }) {
  useNotificationToasts();
  
  return <>{children}</>;
}