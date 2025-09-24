"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, UserPlus, Crown } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';

export default function AttendeeList({ 
  event,
  hostProfile = null,
  onViewProfile = null,
  showHost = true,
  compact = false 
}) {
  const { user } = useAuth();

  if (!event) return null;

  const attendeeIds = event.approved || [];
  const totalAttendees = attendeeIds.length + (showHost ? 1 : 0); // +1 for host
  const maxAttendees = event.max_attendees;

  const AttendeeItem = ({ userId, isHost = false }) => {
    const { profile, loading } = useProfile(userId);

    if (loading) {
      return (
        <div className="flex items-center space-x-3 p-2">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      );
    }

    if (!profile) return null;

    const handleClick = () => {
      if (onViewProfile) {
        onViewProfile(profile);
      }
    };

    if (compact) {
      return (
        <div 
          className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 rounded p-1"
          onClick={handleClick}
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile.profile_pic_url} />
            <AvatarFallback className="text-xs">
              {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {profile.name}
              {isHost && <Crown className="inline h-3 w-3 ml-1 text-yellow-500" />}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div 
        className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
        onClick={handleClick}
      >
        <Avatar className="h-10 w-10">
          <AvatarImage src={profile.profile_pic_url} />
          <AvatarFallback>
            {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <p className="font-medium text-gray-900 truncate">
              {profile.name}
            </p>
            {isHost && (
              <Badge variant="secondary" className="text-xs">
                <Crown className="h-3 w-3 mr-1" />
                Host
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-500 truncate">
            @{profile.username} • {profile.dept}
          </p>
        </div>
        {profile.id === user?.uid && (
          <Badge variant="outline" className="text-xs">
            You
          </Badge>
        )}
      </div>
    );
  };

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700">
            Attendees ({totalAttendees}{maxAttendees ? `/${maxAttendees}` : ''})
          </h4>
        </div>
        <div className="space-y-1">
          {showHost && hostProfile && (
            <AttendeeItem userId={hostProfile.id} isHost={true} />
          )}
          {attendeeIds.map((userId) => (
            <AttendeeItem key={userId} userId={userId} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Attendees</span>
            <Badge variant="secondary">
              {totalAttendees}{maxAttendees ? `/${maxAttendees}` : ''}
            </Badge>
          </div>
          {maxAttendees && totalAttendees >= maxAttendees && (
            <Badge variant="destructive" className="text-xs">
              Full
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {totalAttendees > 0 ? (
          <div className="space-y-2">
            {/* Host */}
            {showHost && hostProfile && (
              <AttendeeItem userId={hostProfile.id} isHost={true} />
            )}
            
            {/* Approved Attendees */}
            {attendeeIds.map((userId) => (
              <AttendeeItem key={userId} userId={userId} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <UserPlus className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h4 className="text-sm font-medium text-gray-900 mb-1">
              No attendees yet
            </h4>
            <p className="text-xs text-gray-500">
              Be the first to join this event!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}