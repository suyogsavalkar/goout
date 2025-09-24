"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

// Hook for managing online/offline state
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        toast.success('Connection restored!', {
          icon: <CheckCircle className="h-4 w-4" />
        });
        setWasOffline(false);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      toast.error('You\'re offline. Some features may not work.', {
        icon: <WifiOff className="h-4 w-4" />,
        duration: Infinity,
        id: 'offline-toast'
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      toast.dismiss('offline-toast');
    };
  }, [wasOffline]);

  return { isOnline, wasOffline };
};

// Offline indicator component
export const OfflineIndicator = () => {
  const { isOnline } = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-500 text-white px-4 py-2 text-sm text-center z-50">
      <div className="flex items-center justify-center space-x-2">
        <WifiOff className="h-4 w-4" />
        <span>You're offline. Some features may not work properly.</span>
      </div>
    </div>
  );
};

// Offline queue manager
class OfflineQueueManager {
  constructor() {
    this.queue = this.loadQueue();
    this.isProcessing = false;
    this.setupEventListeners();
  }

  loadQueue() {
    try {
      if (typeof localStorage === 'undefined') return [];
      const stored = localStorage.getItem('offline-queue');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading offline queue:', error);
      return [];
    }
  }

  saveQueue() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('offline-queue', JSON.stringify(this.queue));
      }
    } catch (error) {
      console.error('Error saving offline queue:', error);
    }
  }

  setupEventListeners() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.processQueue();
      });
    }
  }

  addToQueue(operation) {
    const queueItem = {
      id: Date.now() + Math.random(),
      operation,
      timestamp: Date.now(),
      attempts: 0,
      maxAttempts: 3
    };

    this.queue.push(queueItem);
    this.saveQueue();
    
    return queueItem.id;
  }

  removeFromQueue(id) {
    this.queue = this.queue.filter(item => item.id !== id);
    this.saveQueue();
  }

  async processQueue() {
    if (this.isProcessing || !navigator.onLine || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const processedItems = [];

    for (const item of this.queue) {
      try {
        await this.executeOperation(item.operation);
        processedItems.push(item.id);
        
        toast.success('Synced offline changes', {
          icon: <CheckCircle className="h-4 w-4" />
        });
      } catch (error) {
        item.attempts++;
        
        if (item.attempts >= item.maxAttempts) {
          processedItems.push(item.id);
          
          toast.error('Failed to sync some changes', {
            icon: <AlertCircle className="h-4 w-4" />
          });
        }
        
        console.error('Error processing queue item:', error);
      }
    }

    // Remove processed items
    processedItems.forEach(id => this.removeFromQueue(id));
    
    this.isProcessing = false;
  }

  async executeOperation(operation) {
    const { type, data, method } = operation;
    
    switch (type) {
      case 'firestore':
        return await this.executeFirestoreOperation(method, data);
      case 'api':
        return await this.executeApiOperation(method, data);
      default:
        throw new Error(`Unknown operation type: ${type}`);
    }
  }

  async executeFirestoreOperation(method, data) {
    const { eventService, profileService, notificationService } = await import('../lib/firestore');
    
    switch (method) {
      case 'createEvent':
        return await eventService.create(data.eventData, data.hostId);
      case 'updateProfile':
        return await profileService.update(data.userId, data.updates);
      case 'requestToJoin':
        return await eventService.requestToJoin(data.eventId, data.userId);
      case 'approveRequest':
        return await eventService.approveRequest(data.eventId, data.userId);
      case 'createNotification':
        return await notificationService.create(data);
      default:
        throw new Error(`Unknown Firestore method: ${method}`);
    }
  }

  async executeApiOperation(method, data) {
    const response = await fetch(data.url, {
      method: method,
      headers: data.headers,
      body: data.body
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    return await response.json();
  }

  getQueueStatus() {
    return {
      count: this.queue.length,
      items: this.queue.map(item => ({
        id: item.id,
        type: item.operation.type,
        method: item.operation.method,
        timestamp: item.timestamp,
        attempts: item.attempts
      }))
    };
  }

  clearQueue() {
    this.queue = [];
    this.saveQueue();
  }
}

// Create singleton instance
export const offlineQueue = new OfflineQueueManager();

// Hook for offline operations
export const useOfflineOperations = () => {
  const { isOnline } = useOnlineStatus();
  const [queueStatus, setQueueStatus] = useState(offlineQueue.getQueueStatus());

  useEffect(() => {
    const updateStatus = () => {
      setQueueStatus(offlineQueue.getQueueStatus());
    };

    // Update status periodically
    const interval = setInterval(updateStatus, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const executeOfflineOperation = async (operation) => {
    if (isOnline) {
      // Execute immediately if online
      try {
        return await offlineQueue.executeOperation(operation);
      } catch (error) {
        // If it fails while online, add to queue for retry
        offlineQueue.addToQueue(operation);
        throw error;
      }
    } else {
      // Add to queue if offline
      const queueId = offlineQueue.addToQueue(operation);
      
      toast.info('Action saved. Will sync when online.', {
        icon: <Clock className="h-4 w-4" />
      });
      
      return { queueId, queued: true };
    }
  };

  const processQueue = () => {
    return offlineQueue.processQueue();
  };

  const clearQueue = () => {
    offlineQueue.clearQueue();
    setQueueStatus(offlineQueue.getQueueStatus());
  };

  return {
    isOnline,
    queueStatus,
    executeOfflineOperation,
    processQueue,
    clearQueue
  };
};

// Offline queue status component
export const OfflineQueueStatus = () => {
  const { queueStatus, isOnline, processQueue, clearQueue } = useOfflineOperations();

  if (queueStatus.count === 0) return null;

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-800">
              {queueStatus.count} action{queueStatus.count !== 1 ? 's' : ''} pending sync
            </span>
            <Badge variant="secondary" className="text-xs">
              {isOnline ? 'Online' : 'Offline'}
            </Badge>
          </div>
          
          <div className="flex space-x-2">
            {isOnline && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={processQueue}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync Now
              </Button>
            )}
            
            <Button 
              size="sm" 
              variant="ghost"
              onClick={clearQueue}
            >
              Clear
            </Button>
          </div>
        </div>
        
        {queueStatus.items.length > 0 && (
          <div className="mt-3 space-y-1">
            {queueStatus.items.slice(0, 3).map((item) => (
              <div key={item.id} className="text-xs text-orange-700">
                {item.type}: {item.method} 
                {item.attempts > 0 && ` (${item.attempts} attempts)`}
              </div>
            ))}
            {queueStatus.items.length > 3 && (
              <div className="text-xs text-orange-600">
                +{queueStatus.items.length - 3} more...
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OfflineIndicator;