"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import EventCard from './EventCard';
import EventCreationForm from './EventCreationForm';
import { useEvents } from '@/hooks/useEvents';
import { useProfiles } from '@/hooks/useProfile';
import { EVENT_CATEGORIES } from '@/lib/validation';
import { 
  Calendar, 
  Search, 
  Filter, 
  RefreshCw, 
  Plus,
  Clock,
  MapPin,
  Users
} from 'lucide-react';
import { toast } from 'sonner';

export default function EventFeed() {
  const { events, loading, error, requestToJoin } = useEvents();
  const { profiles } = useProfiles();
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('time_created_at');
  const [showFilters, setShowFilters] = useState(false);

  // Create a map of user profiles for quick lookup
  const profilesMap = profiles.reduce((acc, profile) => {
    acc[profile.id] = profile;
    return acc;
  }, {});

  // Filter and sort events
  useEffect(() => {
    let filtered = [...events];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(event => event.category === selectedCategory);
    }

    // Sort events
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'time_event_time':
          return new Date(a.time_event_time.toDate()) - new Date(b.time_event_time.toDate());
        case 'popularity':
          return (b.approved?.length || 0) - (a.approved?.length || 0);
        case 'time_created_at':
        default:
          return b.time_created_at.toDate() - a.time_created_at.toDate();
      }
    });

    setFilteredEvents(filtered);
  }, [events, searchTerm, selectedCategory, sortBy]);

  const handleRequestJoin = async (eventId) => {
    try {
      await requestToJoin(eventId);
      toast.success('Request sent! The host will review your request.');
    } catch (error) {
      toast.error('Failed to send request. Please try again.');
    }
  };

  const handleEventCreated = (newEvent) => {
    toast.success('Event created successfully!');
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">
          <Calendar className="h-16 w-16 mx-auto mb-4" />
          <h3 className="text-lg font-medium">Error loading events</h3>
          <p className="text-sm">Please try refreshing the page.</p>
        </div>
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-600">
            Discover and join spontaneous events happening around campus
          </p>
        </div>
        <EventCreationForm 
          onSuccess={handleEventCreated}
          trigger={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Button>
          }
        />
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <Select value={selectedCategory || "all"} onValueChange={(value) => setSelectedCategory(value === "all" ? "" : value)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {EVENT_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="time_created_at">Newest First</SelectItem>
                <SelectItem value="time_event_time">Event Time</SelectItem>
                <SelectItem value="popularity">Most Popular</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters */}
          {(searchTerm || selectedCategory) && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t">
              <span className="text-sm text-gray-500">Active filters:</span>
              {searchTerm && (
                <Badge variant="secondary" className="gap-1">
                  Search: {searchTerm}
                  <button
                    onClick={() => setSearchTerm('')}
                    className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {selectedCategory && selectedCategory !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  Category: {selectedCategory}
                  <button
                    onClick={() => setSelectedCategory('')}
                    className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                  >
                    ×
                  </button>
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Events Grid */}
      {loading ? (
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
      ) : filteredEvents.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              hostProfile={profilesMap[event.host]}
              onRequestJoin={handleRequestJoin}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            {events.length === 0 ? (
              <div className="text-gray-500">
                <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No events yet
                </h3>
                <p className="text-gray-500 mb-6">
                  Be the first to create an event and get people together!
                </p>
                <EventCreationForm 
                  onSuccess={handleEventCreated}
                  trigger={
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create First Event
                    </Button>
                  }
                />
              </div>
            ) : (
              <div className="text-gray-500">
                <Search className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No events found
                </h3>
                <p className="text-gray-500 mb-4">
                  Try adjusting your search or filters to find events.
                </p>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      {!loading && events.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-center space-x-8 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>{events.length} active events</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>
                  {events.reduce((total, event) => total + (event.approved?.length || 0), 0)} total attendees
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Last 12 hours</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}