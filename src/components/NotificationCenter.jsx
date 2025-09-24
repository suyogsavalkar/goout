"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Calendar,
  UserPlus,
  UserCheck,
  UserX,
  X,
  Trash2
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { useProfile } from '@/hooks/useProfile';
import { formatEventTime } from '@/lib/utils';
import { toast } from 'sonner';

export default function NotificationCenter({ trigger = null }) {
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markAsRead(notificationId);
    } catch (error) {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all notifications as read');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
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

  const NotificationItem = ({ notification }) => {
    const { profile: senderProfile } = useProfile(notification.sender_id);
    const isUnread = !notification.read;

    return (
      <div 
        className={`p-4 border-l-4 transition-colors cursor-pointer hover:bg-gray-50 ${
          isUnread ? 'border-l-blue-500 bg-blue-50' : 'border-l-transparent'
        }`}
        onClick={() => !isUnread && handleMarkAsRead(notification.id)}
      >
        <div className="flex items-start space-x-3">
          {/* Sender Avatar */}
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarImage src={senderProfile?.profile_pic_url} />
            <AvatarFallback>
              {senderProfile?.name ? senderProfile.name.charAt(0).toUpperCase() : 'U'}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            {/* Notification Content */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  {getNotificationIcon(notification.type)}
                  <p className="text-sm font-medium text-gray-900">
                    {senderProfile?.name || 'Someone'}
                  </p>
                  {isUnread && (
                    <Badge variant="secondary" className="text-xs">
                      New
                    </Badge>
                  )}
                </div>
                
                <p className="text-sm text-gray-700 mb-2">
                  {notification.message}
                </p>
                
                <p className="text-xs text-gray-500">
                  {formatEventTime(notification.created_at)}
                </p>
              </div>

              {/* Mark as read button */}
              {isUnread && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMarkAsRead(notification.id);
                  }}
                  className="ml-2"
                >
                  <Check className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const TriggerButton = trigger || (
    <Button variant="ghost" size="sm" className="relative">
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {TriggerButton}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Notifications</span>
              {unreadCount > 0 && (
                <Badge variant="secondary">
                  {unreadCount} unread
                </Badge>
              )}
            </div>
            
            {unreadCount > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleMarkAllAsRead}
              >
                <CheckCheck className="mr-2 h-4 w-4" />
                Mark all read
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="space-y-4 p-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-gray-300 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => (
                <NotificationItem 
                  key={notification.id} 
                  notification={notification} 
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Bell className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No notifications yet
              </h3>
              <p className="text-gray-500">
                You'll see notifications here when people interact with your events.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>
                {notifications.length} total notification{notifications.length !== 1 ? 's' : ''}
              </span>
              <Button variant="ghost" size="sm">
                <Trash2 className="mr-2 h-4 w-4" />
                Clear all
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}