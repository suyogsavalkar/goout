"use client";

import { Suspense } from 'react';
import Layout from '@/components/Layout';
import EventFeed from '@/components/EventFeed';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useAnalytics } from '@/lib/analytics';
import { useEffect } from 'react';

const PlansPageSkeleton = () => (
  <div className="space-y-6">
    <div className="space-y-2">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-96" />
    </div>
    
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-48" />
        </div>
      </CardContent>
    </Card>
    
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <Card key={i}>
          <Skeleton className="h-48 w-full rounded-t-lg" />
          <CardContent className="p-6">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3 mb-4" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

const PlansPageContent = () => {
  const { trackPageView } = useAnalytics();

  useEffect(() => {
    trackPageView('/plans', 'Plans - Event Feed');
  }, [trackPageView]);

  return <EventFeed />;
};

export default function PlansPage() {
  return (
    <Layout>
      <ErrorBoundary>
        <Suspense fallback={<PlansPageSkeleton />}>
          <PlansPageContent />
        </Suspense>
      </ErrorBoundary>
    </Layout>
  );
}