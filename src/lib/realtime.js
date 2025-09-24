// Real-time notification service with WebSocket fallback
class RealtimeNotificationService {
  constructor() {
    this.listeners = new Map();
    this.websocket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.isConnected = false;
  }

  // Initialize WebSocket connection
  initWebSocket(userId) {
    if (!userId || this.websocket) return;

    try {
      // In a real implementation, you'd connect to your WebSocket server
      // For now, we'll simulate WebSocket behavior
      this.websocket = {
        readyState: 1, // OPEN
        send: (data) => console.log('WebSocket send:', data),
        close: () => {
          this.isConnected = false;
          this.websocket = null;
        }
      };

      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      console.log('WebSocket connected for user:', userId);
      
      // Simulate connection events
      this.simulateWebSocketEvents();
      
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.scheduleReconnect(userId);
    }
  }

  // Simulate WebSocket events for demo purposes
  simulateWebSocketEvents() {
    // In a real implementation, you'd handle actual WebSocket messages
    setTimeout(() => {
      this.handleWebSocketMessage({
        type: 'notification',
        data: {
          id: 'demo-notification',
          type: 'event_request',
          message: 'Demo notification from WebSocket'
        }
      });
    }, 5000);
  }

  // Handle incoming WebSocket messages
  handleWebSocketMessage(message) {
    try {
      const { type, data } = message;
      
      switch (type) {
        case 'notification':
          this.notifyListeners('notification', data);
          break;
        case 'event_update':
          this.notifyListeners('event_update', data);
          break;
        case 'user_status':
          this.notifyListeners('user_status', data);
          break;
        default:
          console.log('Unknown WebSocket message type:', type);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  // Schedule reconnection attempt
  scheduleReconnect(userId) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    setTimeout(() => {
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      this.initWebSocket(userId);
    }, delay);
  }

  // Add event listener
  addEventListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  // Remove event listener
  removeEventListener(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  // Notify all listeners of an event
  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }

  // Send notification through WebSocket
  sendNotification(notification) {
    if (this.isConnected && this.websocket) {
      try {
        this.websocket.send(JSON.stringify({
          type: 'notification',
          data: notification
        }));
        return true;
      } catch (error) {
        console.error('Failed to send WebSocket notification:', error);
        return false;
      }
    }
    return false;
  }

  // Send event update through WebSocket
  sendEventUpdate(eventData) {
    if (this.isConnected && this.websocket) {
      try {
        this.websocket.send(JSON.stringify({
          type: 'event_update',
          data: eventData
        }));
        return true;
      } catch (error) {
        console.error('Failed to send WebSocket event update:', error);
        return false;
      }
    }
    return false;
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      hasWebSocket: !!this.websocket
    };
  }

  // Disconnect WebSocket
  disconnect() {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    this.isConnected = false;
    this.listeners.clear();
  }

  // Check if browser supports WebSocket
  static isWebSocketSupported() {
    return typeof WebSocket !== 'undefined';
  }
}

// Create singleton instance
const realtimeNotificationService = new RealtimeNotificationService();

// Enhanced notification queue for offline support
class NotificationQueue {
  constructor() {
    this.queue = [];
    this.isOnline = navigator.onLine;
    this.setupOnlineListener();
  }

  setupOnlineListener() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  // Add notification to queue
  enqueue(notification) {
    this.queue.push({
      ...notification,
      timestamp: Date.now(),
      attempts: 0
    });

    if (this.isOnline) {
      this.processQueue();
    }
  }

  // Process queued notifications
  async processQueue() {
    if (!this.isOnline || this.queue.length === 0) return;

    const notification = this.queue.shift();
    
    try {
      // Try WebSocket first
      const webSocketSent = realtimeNotificationService.sendNotification(notification);
      
      if (!webSocketSent) {
        // Fallback to Firestore
        await this.sendViaFirestore(notification);
      }
      
      console.log('Notification sent successfully');
    } catch (error) {
      console.error('Failed to send notification:', error);
      
      // Retry logic
      notification.attempts++;
      if (notification.attempts < 3) {
        this.queue.unshift(notification); // Put back at front
        setTimeout(() => this.processQueue(), 2000 * notification.attempts);
      }
    }
  }

  // Send notification via Firestore as fallback
  async sendViaFirestore(notification) {
    const { notificationService } = await import('./firestore');
    return await notificationService.create(notification);
  }

  // Get queue status
  getStatus() {
    return {
      queueLength: this.queue.length,
      isOnline: this.isOnline
    };
  }
}

// Create notification queue instance
const notificationQueue = new NotificationQueue();

import { useState, useEffect } from 'react';

// Enhanced real-time hooks
export const useRealtimeNotifications = (userId) => {
  const [connectionStatus, setConnectionStatus] = useState({
    isConnected: false,
    reconnectAttempts: 0,
    hasWebSocket: false
  });

  useEffect(() => {
    if (!userId) return;

    // Initialize WebSocket connection
    realtimeNotificationService.initWebSocket(userId);

    // Listen for connection status changes
    const statusInterval = setInterval(() => {
      setConnectionStatus(realtimeNotificationService.getConnectionStatus());
    }, 1000);

    return () => {
      clearInterval(statusInterval);
      realtimeNotificationService.disconnect();
    };
  }, [userId]);

  const sendNotification = (notification) => {
    notificationQueue.enqueue(notification);
  };

  const addEventListener = (event, callback) => {
    realtimeNotificationService.addEventListener(event, callback);
  };

  const removeEventListener = (event, callback) => {
    realtimeNotificationService.removeEventListener(event, callback);
  };

  return {
    connectionStatus,
    sendNotification,
    addEventListener,
    removeEventListener,
    isWebSocketSupported: RealtimeNotificationService.isWebSocketSupported()
  };
};

// Connection status indicator component
export const ConnectionStatus = () => {
  const [status, setStatus] = useState({ isOnline: navigator.onLine });

  useEffect(() => {
    const handleOnline = () => setStatus({ isOnline: true });
    const handleOffline = () => setStatus({ isOnline: false });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (status.isOnline) return null;

  return (
    <div className="bg-red-500 text-white px-4 py-2 text-sm text-center">
      <span>You're offline. Some features may not work properly.</span>
    </div>
  );
};

export { realtimeNotificationService, notificationQueue };