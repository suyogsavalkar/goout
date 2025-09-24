"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  UserPlus,
  UserCheck,
  UserX,
  Settings,
  Share2,
  MessageCircle
} from 'lucide-react';
import { formatEventTime, getTimeUntilEvent } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import ProfileCard from './ProfileCard';

export default function EventDetailsModal({ 
  event, 
  open, 
  onOpenChange,
  hostProfile = null,
  onRequestJoin = null,
  onApproveRequest = null,
  onDenyRequest = null,
  onManageEvent = null
}) {
  const { user } = useAuth();
  const [requesting, setRequesting] = useState(false);
  const [processingRequests, setProcessingRequests] = useState(new Set());

  if (!event) return null;

  const isHost = user?.uid === event.host;
  const hasRequested = event.requests?.includes(user?.uid);
  const isApproved = event.approved?.includes(user?.uid);
  const canJoin = !isHost && !hasRequested && !isApproved;

  const handleRequestJoin = async () => {
    if (!onRequestJoin || requesting) return;
    
    setRequesting(true);
    try {
      await onRequestJoin(event.id);
    } catch (error) {
      console.error('Error requesting to join:', error);
    } finally {
      setRequesting(false);
    }
  };

  const handleApproveRequest = async (userId) => {
    if (!onApproveRequest || processingRequests.has(userId)) return;
    
    setProcessingRequests(prev => new Set(prev).add(userId));
    try {
      await onApproveRequest(event.id, userId);
    } catch (error) {
      console.error('Error approving request:', error);
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleDenyRequest = async (userId) => {
    if (!onDenyRequest || processingRequests.has(userId)) return;
    
    setProcessingRequests(prev => new Set(prev).add(userId));
    try {
      await onDenyRequest(event.id, userId);
    } catch (error) {
      console.error('Error denying request:', error);
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const RequestsList = ({ userIds, title, showActions = false }) => {
    if (!userIds || userIds.length === 0) return null;

    return (
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900 flex items-center gap-2">
          {title}
          <Badge variant="secondary">{userIds.length}</Badge>
        </h4>
        <div className="space-y-2">
          {userIds.map((userId) => (
            <RequestItem 
              key={userId} 
              userId={userId} 
              showActions={showActions}
              onApprove={() => handleApproveRequest(userId)}
              onDeny={() => handleDenyRequest(userId)}
              processing={processingRequests.has(userId)}
            />
          ))}
        </div>
      </div>
    );
  };

  const RequestItem = ({ userId, showActions, onApprove, onDeny, processing }) => {
    const { profile } = useProfile(userId);

    if (!profile) return null;

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
            <p className="text-sm text-gray-500">@{profile.username} • {profile.dept}</p>
          </div>
        </div>
        
        {showActions && (
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={onDeny}
              disabled={processing}
            >
              <UserX className="h-4 w-4" />
            </Button>
            <Button 
              size="sm"
              onClick={onApprove}
              disabled={processing}
            >
              <UserCheck className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Event Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Event Header */}
          <div className="space-y-4">
            {/* Event Poster */}
            {event.poster_url && (
              <div className="w-full h-64 overflow-hidden rounded-lg">
                <img 
                  src={event.poster_url} 
                  alt={event.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Title and Category */}
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {event.name}
                </h1>
                <Badge variant="secondary" className="text-sm">
                  {event.category}
                </Badge>
              </div>
              
              {isHost && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onManageEvent && onManageEvent(event)}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Manage
                </Button>
              )}
            </div>

            {/* Host Info */}
            {hostProfile && (
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={hostProfile.profile_pic_url} />
                  <AvatarFallback>
                    {hostProfile.name ? hostProfile.name.charAt(0).toUpperCase() : 'H'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-gray-900">
                    Hosted by {hostProfile.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    @{hostProfile.username} • {hostProfile.dept}
                  </p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Event Details */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Event Details</h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-gray-700">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">{formatEventTime(event.time_event_time)}</p>
                    <p className="text-sm text-gray-500">{getTimeUntilEvent(event.time_event_time)}</p>
                  </div>
                </div>
                
                {event.location && (
                  <div className="flex items-center space-x-3 text-gray-700">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium">{event.location}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center space-x-3 text-gray-700">
                  <Users className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">
                      {event.approved?.length || 0} attending
                      {event.max_attendees && ` / ${event.max_attendees} max`}
                    </p>
                    <p className="text-sm text-gray-500">
                      {event.requests?.length || 0} pending requests
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              {event.description && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {event.description}
                  </p>
                </div>
              )}
            </div>

            {/* Attendees and Requests */}
            <div className="space-y-6">
              {/* Action Button */}
              {canJoin && (
                <Button 
                  className="w-full"
                  onClick={handleRequestJoin}
                  disabled={requesting}
                >
                  {requesting ? (
                    <>
                      <Clock className="mr-2 h-4 w-4 animate-spin" />
                      Requesting...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Request to Join
                    </>
                  )}
                </Button>
              )}
              
              {hasRequested && (
                <Button className="w-full" variant="secondary" disabled>
                  <Clock className="mr-2 h-4 w-4" />
                  Request Pending
                </Button>
              )}
              
              {isApproved && (
                <Button className="w-full" variant="secondary" disabled>
                  <UserCheck className="mr-2 h-4 w-4" />
                  You're Attending
                </Button>
              )}

              {/* Pending Requests (Host Only) */}
              {isHost && event.requests && event.requests.length > 0 && (
                <RequestsList 
                  userIds={event.requests}
                  title="Pending Requests"
                  showActions={true}
                />
              )}

              {/* Approved Attendees */}
              {event.approved && event.approved.length > 0 && (
                <RequestsList 
                  userIds={event.approved}
                  title="Attending"
                  showActions={false}
                />
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <Separator />
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
            
            <p className="text-xs text-gray-500">
              Created {formatEventTime(event.time_created_at)}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}