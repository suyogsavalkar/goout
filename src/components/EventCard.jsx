"use client";

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  MoreHorizontal,
  UserPlus,
  UserCheck,
  Settings
} from 'lucide-react';
import { formatEventTime, getTimeUntilEvent } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

export default function EventCard({ 
  event, 
  hostProfile = null,
  onRequestJoin = null,
  onViewDetails = null,
  onManageEvent = null,
  compact = false 
}) {
  const { user } = useAuth();
  const [requesting, setRequesting] = useState(false);

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

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(event);
    }
  };

  const handleManageEvent = () => {
    if (onManageEvent) {
      onManageEvent(event);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
           onClick={handleViewDetails}>
        {event.poster_url && (
          <img 
            src={event.poster_url} 
            alt={event.name}
            className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {event.name}
          </p>
          <p className="text-xs text-gray-500">
            {event.category} • {getTimeUntilEvent(event.time_event_time)}
          </p>
        </div>
        <Badge variant="secondary" className="text-xs">
          {event.approved?.length || 0} joined
        </Badge>
      </div>
    );
  }

  return (
    <Card className="w-full hover:shadow-md transition-shadow">
      {/* Event Poster */}
      {event.poster_url && (
        <div className="h-48 overflow-hidden rounded-t-lg">
          <img 
            src={event.poster_url} 
            alt={event.name}
            className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
            onClick={handleViewDetails}
          />
        </div>
      )}
      
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 
              className="text-lg font-semibold text-gray-900 truncate cursor-pointer hover:text-blue-600"
              onClick={handleViewDetails}
            >
              {event.name}
            </h3>
            <Badge variant="secondary" className="mt-1">
              {event.category}
            </Badge>
          </div>
          
          {isHost && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleManageEvent}
              className="ml-2"
            >
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Host Info */}
        {hostProfile && (
          <div className="flex items-center space-x-2 mb-4">
            <Avatar className="h-6 w-6">
              <AvatarImage src={hostProfile.profile_pic_url} />
              <AvatarFallback className="text-xs">
                {hostProfile.name ? hostProfile.name.charAt(0).toUpperCase() : 'H'}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-gray-600">
              Hosted by {hostProfile.name}
            </span>
          </div>
        )}

        {/* Event Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>{formatEventTime(event.time_event_time)}</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>{getTimeUntilEvent(event.time_event_time)}</span>
          </div>
          
          {event.location && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
          
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Users className="h-4 w-4" />
            <span>
              {event.approved?.length || 0} joined
              {event.max_attendees && ` / ${event.max_attendees} max`}
            </span>
          </div>
        </div>

        {/* Description */}
        {event.description && (
          <p className="text-sm text-gray-700 mb-4 line-clamp-2">
            {event.description}
          </p>
        )}

        {/* Requests indicator for host */}
        {isHost && event.requests && event.requests.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-center space-x-2 text-blue-800">
              <UserPlus className="h-4 w-4" />
              <span className="text-sm font-medium">
                {event.requests.length} new request{event.requests.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleViewDetails}
          >
            View Details
          </Button>
          
          {canJoin && (
            <Button 
              size="sm"
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
            <Button size="sm" variant="secondary" disabled>
              <Clock className="mr-2 h-4 w-4" />
              Request Pending
            </Button>
          )}
          
          {isApproved && (
            <Button size="sm" variant="secondary" disabled>
              <UserCheck className="mr-2 h-4 w-4" />
              Joined
            </Button>
          )}
          
          {isHost && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleManageEvent}
            >
              <Settings className="mr-2 h-4 w-4" />
              Manage
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}