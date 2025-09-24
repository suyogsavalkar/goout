"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  UserCheck, 
  UserX, 
  Users, 
  Clock,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';

export default function ApprovalPanel({ 
  event,
  onApproveRequest,
  onDenyRequest,
  onRemoveAttendee
}) {
  const [processingRequests, setProcessingRequests] = useState(new Set());

  if (!event) return null;

  const handleApproveRequest = async (userId) => {
    if (processingRequests.has(userId)) return;

    setProcessingRequests(prev => new Set(prev).add(userId));
    try {
      await onApproveRequest(event.id, userId);
      toast.success('Request approved!');
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Failed to approve request');
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleDenyRequest = async (userId) => {
    if (processingRequests.has(userId)) return;

    setProcessingRequests(prev => new Set(prev).add(userId));
    try {
      await onDenyRequest(event.id, userId);
      toast.success('Request denied');
    } catch (error) {
      console.error('Error denying request:', error);
      toast.error('Failed to deny request');
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleRemoveAttendee = async (userId) => {
    if (processingRequests.has(userId)) return;

    setProcessingRequests(prev => new Set(prev).add(userId));
    try {
      await onRemoveAttendee(event.id, userId);
      toast.success('Attendee removed');
    } catch (error) {
      console.error('Error removing attendee:', error);
      toast.error('Failed to remove attendee');
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const RequestItem = ({ userId, type = 'request' }) => {
    const { profile, loading } = useProfile(userId);
    const isProcessing = processingRequests.has(userId);

    if (loading) {
      return (
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg animate-pulse">
          <div className="h-10 w-10 bg-gray-300 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-300 rounded w-3/4 mb-1"></div>
            <div className="h-3 bg-gray-300 rounded w-1/2"></div>
          </div>
        </div>
      );
    }

    if (!profile) {
      return (
        <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <span className="text-sm text-red-700">Profile not found</span>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile.profile_pic_url} />
            <AvatarFallback>
              {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-gray-900">{profile.name}</p>
            <p className="text-sm text-gray-500">
              @{profile.username} • {profile.dept}
            </p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          {type === 'request' ? (
            <>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleDenyRequest(userId)}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserX className="h-4 w-4" />
                )}
              </Button>
              <Button 
                size="sm"
                onClick={() => handleApproveRequest(userId)}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserCheck className="h-4 w-4" />
                )}
              </Button>
            </>
          ) : (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleRemoveAttendee(userId)}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserX className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>
    );
  };

  const pendingRequests = event.requests || [];
  const approvedAttendees = event.approved || [];
  const totalAttendees = approvedAttendees.length;
  const maxAttendees = event.max_attendees;
  const isFull = maxAttendees && totalAttendees >= maxAttendees;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{pendingRequests.length}</p>
                <p className="text-sm text-gray-500">Pending</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{totalAttendees}</p>
                <p className="text-sm text-gray-500">Attending</p>
              </div>
              {maxAttendees && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-600">{maxAttendees}</p>
                  <p className="text-sm text-gray-500">Max</p>
                </div>
              )}
            </div>
            
            {isFull && (
              <Badge variant="destructive">
                Event Full
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Pending Requests</span>
              <Badge variant="secondary">{pendingRequests.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingRequests.map((userId) => (
              <RequestItem key={userId} userId={userId} type="request" />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Approved Attendees */}
      {approvedAttendees.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Attending</span>
              <Badge variant="secondary">{approvedAttendees.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {approvedAttendees.map((userId) => (
              <RequestItem key={userId} userId={userId} type="attendee" />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Empty States */}
      {pendingRequests.length === 0 && approvedAttendees.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No requests yet
            </h3>
            <p className="text-gray-500">
              When people request to join your event, they'll appear here for approval.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}