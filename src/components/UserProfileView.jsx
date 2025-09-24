"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ProfileGallery from './ProfileGallery';
import ProfileForm from './ProfileForm';
import { useProfile } from '@/hooks/useProfile';
import { useUserEvents } from '@/hooks/useEvents';
import { useAuth } from '@/contexts/AuthContext';
import { profileService } from '@/lib/firestore';
import { 
  Calendar, 
  Users, 
  UserPlus,
  UserCheck,
  MapPin,
  Mail,
  Clock,
  ArrowLeft,
  Share2,
  MessageCircle,
  Edit
} from 'lucide-react';
import { formatEventTime } from '@/lib/utils';
import { toast } from 'sonner';

export default function UserProfileView({ userId, onBack = null }) {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile(userId);
  const { events: userEvents, loading: eventsLoading } = useUserEvents(userId);
  const [connecting, setConnecting] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

  const isOwnProfile = user?.uid === userId;
  const isConnected = profile?.you_met?.includes(user?.uid);

  const handleConnect = async () => {
    if (!user || connecting) return;

    setConnecting(true);
    
    try {
      await profileService.addConnection(user.uid, userId);
      // Also add the reverse connection
      await profileService.addConnection(userId, user.uid);
      
      toast.success(`Connected with ${profile.name}!`);
    } catch (error) {
      console.error('Error connecting with user:', error);
      toast.error('Failed to connect. Please try again.');
    } finally {
      setConnecting(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${profile.name} - GoOut Profile`,
        text: `Check out ${profile.name}'s profile on GoOut`,
        url: window.location.href
      });
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href);
      toast.success('Profile link copied to clipboard!');
    }
  };

  const handleEditProfile = () => {
    setShowEditProfile(true);
  };

  const handleProfileUpdated = () => {
    setShowEditProfile(false);
    toast.success('Profile updated successfully!');
  };

  if (profileLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start space-x-6">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-5 w-32 mb-4" />
                <Skeleton className="h-6 w-24 mb-4" />
                <div className="flex space-x-4">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Skeleton */}
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Profile not found
          </h3>
          <p className="text-gray-500 mb-6">
            This user profile doesn't exist or has been removed.
          </p>
          {onBack && (
            <Button onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      {onBack && (
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to People
        </Button>
      )}

      {/* Profile Header */}
      <Card>
        {/* Cover Photo */}
        {profile.profile_cover_photo ? (
          <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 relative overflow-hidden">
            <img 
              src={profile.profile_cover_photo} 
              alt="Cover" 
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600" />
        )}
        
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
            <div className="flex items-start space-x-6">
              {/* Profile Picture */}
              <Avatar className="h-24 w-24 border-4 border-white -mt-12 relative z-10">
                <AvatarImage src={profile.profile_pic_url} />
                <AvatarFallback className="text-2xl">
                  {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                {/* Name and Username */}
                <div className="mb-4">
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">
                    {profile.name}
                  </h1>
                  <p className="text-gray-600 mb-2">
                    @{profile.username}
                  </p>
                  <Badge variant="secondary" className="mb-3">
                    {profile.dept}
                  </Badge>
                </div>
                
                {/* Stats */}
                <div className="flex items-center space-x-6 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{profile.events?.length || 0} events</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>{profile.you_met?.length || 0} connections</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>Joined {formatEventTime(profile.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex space-x-2">
              {isOwnProfile ? (
                <>
                  <Button 
                    variant="outline"
                    onClick={handleShare}
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                  <Button 
                    onClick={handleEditProfile}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="outline"
                    onClick={handleShare}
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                  
                  {isConnected ? (
                    <Button variant="secondary" disabled>
                      <UserCheck className="mr-2 h-4 w-4" />
                      Connected
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleConnect}
                      disabled={connecting}
                    >
                      {connecting ? (
                        <>
                          <Clock className="mr-2 h-4 w-4 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Connect
                        </>
                      )}
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <ProfileGallery 
            profile={profile} 
            events={userEvents || []} 
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Contact Info</span>
                {isOwnProfile && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleEditProfile}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-3 text-gray-700">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{profile.email}</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-700">
                <Users className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{profile.dept}</span>
              </div>
            </CardContent>
          </Card>

          {/* Recent Events */}
          {userEvents && userEvents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Recent Events</span>
                  <Badge variant="secondary">{userEvents.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {userEvents.slice(0, 3).map((event) => (
                  <div key={event.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                    {event.poster_url && (
                      <img 
                        src={event.poster_url} 
                        alt={event.name}
                        className="w-10 h-10 object-cover rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {event.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {event.category} • {formatEventTime(event.time_event_time)}
                      </p>
                    </div>
                  </div>
                ))}
                
                {userEvents.length > 3 && (
                  <Button variant="ghost" size="sm" className="w-full">
                    View all {userEvents.length} events
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Mutual Connections */}
          {!isOwnProfile && profile.you_met && profile.you_met.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Connections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm text-gray-500">
                    {profile.you_met.length} connection{profile.you_met.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Dialog open={showEditProfile} onOpenChange={setShowEditProfile}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <ProfileForm 
            initialData={profile}
            onSuccess={handleProfileUpdated}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}