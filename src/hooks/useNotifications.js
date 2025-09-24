"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { notificationService, realtimeService } from '@/lib/firestore';

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    let unsubscribe;

    const setupListener = () => {
      unsubscribe = realtimeService.subscribeToNotifications(
        user.uid,
        (notificationsData) => {
          setNotifications(notificationsData);
          setLoading(false);
          setError(null);
        }
      );
    };

    // First, get initial notifications data
    notificationService.getForUser(user.uid)
      .then((notificationsData) => {
        setNotifications(notificationsData);
        setLoading(false);
        
        // Set up real-time listener
        setupListener();
      })
      .catch((err) => {
        console.error('Error fetching notifications:', err);
        setError(err);
        setLoading(false);
      });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  };

  const markAllAsRead = async () => {
    if (!user) throw new Error('User must be logged in');
    
    try {
      await notificationService.markAllAsRead(user.uid);
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  };

  const createNotification = async (notificationData) => {
    try {
      const newNotification = await notificationService.create(notificationData);
      return newNotification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    loading,
    error,
    unreadCount,
    markAsRead,
    markAllAsRead,
    createNotification
  };
}