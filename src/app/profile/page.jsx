"use client";

import { Suspense } from 'react';
import Layout from '@/components/Layout';
import UserProfileView from '@/components/UserProfileView';
import ProfileForm from '@/components/ProfileForm';
import DebugInfo from '@/components/DebugInfo';
import FirebaseTest from '@/components/FirebaseTest';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useEffect } from 'react';

const ProfilePageSkeleton = () => (
  <div className="space-y-6">
    <Card>
      <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600" />
      <CardContent className="p-6">
        <div className="flex items-start space-x-6">
          <Skeleton className="h-24 w-24 rounded-full -mt-12 border-4 border-white" />
          <div className="flex-1">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-5 w-32 mb-4" />
            <Skeleton className="h-6 w-24 mb-4" />
            <div className="flex space-x-6">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-6 w-24 mb-4" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
);

const ProfilePageContent = () => {
  const { user } = useAuth();
  const { profile, hasProfile, loading } = useProfile();

  if (loading) {
    return <ProfilePageSkeleton />;
  }

  if (!hasProfile) {
    return (
      <div className="max-w-2xl mx-auto">
        <ProfileForm />
      </div>
    );
  }

  return <UserProfileView userId={user?.uid} />;
};

export default function ProfilePage() {
  return (
    <Layout>
      <ErrorBoundary>
        <Suspense fallback={<ProfilePageSkeleton />}>
          <ProfilePageContent />
        </Suspense>
        <DebugInfo />
        <FirebaseTest />
      </ErrorBoundary>
    </Layout>
  );
}