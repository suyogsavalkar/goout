"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useNotifications } from '@/hooks/useNotifications';
import Sidebar from './Sidebar';
import MobileNavigation from './MobileNavigation';
import EventCreationForm from './EventCreationForm';
import ProfileForm from './ProfileForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function Layout({ children }) {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, hasProfile } = useProfile();
  const { notifications } = useNotifications();
  const [showEventForm, setShowEventForm] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);

  // Show profile completion form only if profile exists but is missing required fields
  useEffect(() => {
    if (user && !profileLoading && profile && !profile.dept) {
      setShowProfileForm(true);
    }
  }, [user, profileLoading, profile?.dept]); // Only depend on the specific field we're checking

  const handleCreateEvent = () => {
    if (!hasProfile) {
      toast.error('Please complete your profile first');
      setShowProfileForm(true);
      return;
    }
    setShowEventForm(true);
  };

  const handleEventCreated = () => {
    setShowEventForm(false);
    toast.success('Event created successfully!');
  };

  const handleProfileCompleted = () => {
    setShowProfileForm(false);
    toast.success('Profile completed successfully!');
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome to GoOut</h1>
          <p className="text-gray-600 mb-6">Please sign in to continue</p>
          {/* AuthButton would be rendered here */}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Layout */}
      <div className="hidden lg:flex h-screen">
        {/* Sidebar */}
        <Sidebar 
          notifications={notifications}
          onCreateEvent={handleCreateEvent}
        />
        
        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {profileLoading ? (
              <div className="space-y-6">
                <Skeleton className="h-8 w-64" />
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-64 w-full" />
                  ))}
                </div>
              </div>
            ) : (
              children
            )}
          </div>
        </main>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden">
        <MobileNavigation 
          notifications={notifications}
          onCreateEvent={handleCreateEvent}
        />
        
        {/* Main Content */}
        <main className="pb-20"> {/* Bottom padding for mobile nav */}
          <div className="p-4">
            {profileLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-6 w-48" />
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-48 w-full" />
                  ))}
                </div>
              </div>
            ) : (
              children
            )}
          </div>
        </main>
      </div>

      {/* Event Creation Modal */}
      <EventCreationForm 
        open={showEventForm}
        onOpenChange={setShowEventForm}
        onSuccess={handleEventCreated}
      />

      {/* Profile Completion Modal */}
      <Dialog open={showProfileForm} onOpenChange={setShowProfileForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Complete Your Profile</DialogTitle>
          </DialogHeader>
          <ProfileForm 
            initialData={profile}
            onSuccess={handleProfileCompleted}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}