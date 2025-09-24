"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';

export default function DebugInfo() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, error, hasProfile } = useProfile();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">Debug Info</h3>
      <div className="space-y-1">
        <div>Auth Loading: {authLoading ? 'Yes' : 'No'}</div>
        <div>User: {user ? user.email : 'None'}</div>
        <div>Profile Loading: {profileLoading ? 'Yes' : 'No'}</div>
        <div>Has Profile: {hasProfile ? 'Yes' : 'No'}</div>
        <div>Profile Error: {error ? error.message : 'None'}</div>
        <div>Profile Data: {profile ? 'Exists' : 'None'}</div>
      </div>
    </div>
  );
}