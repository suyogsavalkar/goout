"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Users } from 'lucide-react';
import { formatEventTime } from '@/lib/utils';

export default function ProfileCard({ 
  profile, 
  showActions = false, 
  onConnect = null,
  onViewProfile = null,
  compact = false 
}) {
  if (!profile) return null;

  const handleConnect = () => {
    if (onConnect) {
      onConnect(profile.id);
    }
  };

  const handleViewProfile = () => {
    if (onViewProfile) {
      onViewProfile(profile.id);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
           onClick={handleViewProfile}>
        <Avatar className="h-10 w-10">
          <AvatarImage src={profile.profile_pic_url} />
          <AvatarFallback>
            {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {profile.name}
          </p>
          <p className="text-xs text-gray-500 truncate">
            @{profile.username} • {profile.dept}
          </p>
        </div>
      </div>
    );
  }

  return (
    <Card className="w-full hover:shadow-md transition-shadow">
      {/* Cover Photo */}
      {profile.profile_cover_photo && (
        <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 relative overflow-hidden">
          <img 
            src={profile.profile_cover_photo} 
            alt="Cover" 
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          {/* Profile Picture */}
          <Avatar className="h-16 w-16 border-4 border-white -mt-8 relative z-10">
            <AvatarImage src={profile.profile_pic_url} />
            <AvatarFallback className="text-lg">
              {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            {/* Name and Username */}
            <div className="mb-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {profile.name}
              </h3>
              <p className="text-sm text-gray-500">
                @{profile.username}
              </p>
            </div>
            
            {/* Department */}
            <Badge variant="secondary" className="mb-3">
              {profile.dept}
            </Badge>
            
            {/* Stats */}
            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>{profile.events?.length || 0} events</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span>{profile.you_met?.length || 0} connections</span>
              </div>
            </div>
            
            {/* Photos Preview */}
            {profile.photos && profile.photos.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Recent Photos</p>
                <div className="flex space-x-2 overflow-x-auto">
                  {profile.photos.slice(0, 4).map((photo, index) => (
                    <div key={index} className="flex-shrink-0">
                      <img 
                        src={photo} 
                        alt={`Photo ${index + 1}`}
                        className="h-16 w-16 object-cover rounded-lg"
                      />
                    </div>
                  ))}
                  {profile.photos.length > 4 && (
                    <div className="flex-shrink-0 h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-xs text-gray-500">
                        +{profile.photos.length - 4}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Join Date */}
            {profile.created_at && (
              <p className="text-xs text-gray-400 mb-4">
                Joined {formatEventTime(profile.created_at)}
              </p>
            )}
            
            {/* Actions */}
            {showActions && (
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleViewProfile}
                >
                  View Profile
                </Button>
                <Button 
                  size="sm"
                  onClick={handleConnect}
                >
                  Connect
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}