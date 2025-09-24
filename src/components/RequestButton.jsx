"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  UserPlus, 
  UserCheck, 
  Clock, 
  Loader2,
  UserX 
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function RequestButton({ 
  event,
  onRequestJoin,
  onCancelRequest,
  size = "default",
  variant = "default",
  className = ""
}) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  if (!event || !user) return null;

  const isHost = user.uid === event.host;
  const hasRequested = event.requests?.includes(user.uid);
  const isApproved = event.approved?.includes(user.uid);
  const canJoin = !isHost && !hasRequested && !isApproved;
  const isFull = event.max_attendees && (event.approved?.length || 0) >= event.max_attendees;

  const handleClick = async () => {
    if (loading) return;

    setLoading(true);
    try {
      if (hasRequested && onCancelRequest) {
        await onCancelRequest(event.id);
      } else if (canJoin && onRequestJoin) {
        await onRequestJoin(event.id);
      }
    } catch (error) {
      console.error('Error handling request:', error);
    } finally {
      setLoading(false);
    }
  };

  // Host can't join their own event
  if (isHost) {
    return (
      <Button 
        size={size} 
        variant="outline" 
        disabled 
        className={className}
      >
        <UserCheck className="mr-2 h-4 w-4" />
        Host
      </Button>
    );
  }

  // User is already approved
  if (isApproved) {
    return (
      <Button 
        size={size} 
        variant="secondary" 
        disabled 
        className={className}
      >
        <UserCheck className="mr-2 h-4 w-4" />
        Attending
      </Button>
    );
  }

  // User has requested to join
  if (hasRequested) {
    return (
      <Button 
        size={size} 
        variant="outline" 
        onClick={handleClick}
        disabled={loading}
        className={className}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Canceling...
          </>
        ) : (
          <>
            <Clock className="mr-2 h-4 w-4" />
            Pending
          </>
        )}
      </Button>
    );
  }

  // Event is full
  if (isFull) {
    return (
      <Button 
        size={size} 
        variant="outline" 
        disabled 
        className={className}
      >
        <UserX className="mr-2 h-4 w-4" />
        Full
      </Button>
    );
  }

  // User can request to join
  if (canJoin) {
    return (
      <Button 
        size={size} 
        variant={variant}
        onClick={handleClick}
        disabled={loading}
        className={className}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Requesting...
          </>
        ) : (
          <>
            <UserPlus className="mr-2 h-4 w-4" />
            Request to Join
          </>
        )}
      </Button>
    );
  }

  return null;
}