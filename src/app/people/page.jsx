"use client";

import { Suspense } from 'react';
import Layout from '@/components/Layout';
import PeoplePage from '@/components/PeoplePage';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useAnalytics } from '@/lib/analytics';
import { useEffect } from 'react';

const PeoplePageSkeleton = () => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="flex space-x-2">
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-10 w-10" />
      </div>
    </div>
    
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-48" />
        </div>
      </CardContent>
    </Card>
    
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

const PeoplePageContent = () => {
  const { trackPageView } = useAnalytics();

  useEffect(() => {
    trackPageView('/people', 'People - User Directory');
  }, [trackPageView]);

  return <PeoplePage />;
};

export default function PeoplePageRoute() {
  return (
    <Layout>
      <ErrorBoundary>
        <Suspense fallback={<PeoplePageSkeleton />}>
          <PeoplePageContent />
        </Suspense>
      </ErrorBoundary>
    </Layout>
  );
}