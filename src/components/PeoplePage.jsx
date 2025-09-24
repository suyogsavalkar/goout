"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import ProfileCard from './ProfileCard';
import { useProfiles } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { profileService } from '@/lib/firestore';
import { UM_DEPARTMENTS } from '@/lib/validation';
import { 
  Users, 
  Search, 
  Filter, 
  RefreshCw,
  UserPlus,
  Grid,
  List
} from 'lucide-react';
import { toast } from 'sonner';

export default function PeoplePage() {
  const { user } = useAuth();
  const { profiles, loading, error, refreshProfiles } = useProfiles();
  const [filteredProfiles, setFilteredProfiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [connectingUsers, setConnectingUsers] = useState(new Set());

  // Filter and sort profiles
  useEffect(() => {
    let filtered = [...profiles];

    // Remove current user from the list
    if (user) {
      filtered = filtered.filter(profile => profile.id !== user.uid);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(profile =>
        profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.dept.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Department filter
    if (selectedDepartment) {
      filtered = filtered.filter(profile => profile.dept === selectedDepartment);
    }

    // Sort profiles
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'username':
          return a.username.localeCompare(b.username);
        case 'dept':
          return a.dept.localeCompare(b.dept);
        case 'events':
          return (b.events?.length || 0) - (a.events?.length || 0);
        case 'connections':
          return (b.you_met?.length || 0) - (a.you_met?.length || 0);
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    setFilteredProfiles(filtered);
  }, [profiles, searchTerm, selectedDepartment, sortBy, user]);

  const handleConnect = async (profileId) => {
    if (!user || connectingUsers.has(profileId)) return;

    setConnectingUsers(prev => new Set(prev).add(profileId));
    
    try {
      await profileService.addConnection(user.uid, profileId);
      // Also add the reverse connection
      await profileService.addConnection(profileId, user.uid);
      
      toast.success('Connection added!');
    } catch (error) {
      console.error('Error connecting with user:', error);
      toast.error('Failed to connect. Please try again.');
    } finally {
      setConnectingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(profileId);
        return newSet;
      });
    }
  };

  const handleViewProfile = (profileId) => {
    // Navigate to profile page
    window.location.href = `/profile/${profileId}`;
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">
          <Users className="h-16 w-16 mx-auto mb-4" />
          <h3 className="text-lg font-medium">Error loading people</h3>
          <p className="text-sm">Please try refreshing the page.</p>
        </div>
        <Button onClick={refreshProfiles}>
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
          <h1 className="text-2xl font-bold text-gray-900">People</h1>
          <p className="text-gray-600">
            Connect with other University of Michigan students
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, username, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Department Filter */}
            <Select value={selectedDepartment || "all"} onValueChange={(value) => setSelectedDepartment(value === "all" ? "" : value)}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {UM_DEPARTMENTS.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
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
                <SelectItem value="name">Name (A-Z)</SelectItem>
                <SelectItem value="username">Username</SelectItem>
                <SelectItem value="dept">Department</SelectItem>
                <SelectItem value="events">Most Events</SelectItem>
                <SelectItem value="connections">Most Connections</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters */}
          {(searchTerm || selectedDepartment) && (
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
              {selectedDepartment && selectedDepartment !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  Dept: {selectedDepartment}
                  <button
                    onClick={() => setSelectedDepartment('')}
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

      {/* People Grid/List */}
      {loading ? (
        <div className={`grid gap-6 ${viewMode === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
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
      ) : filteredProfiles.length > 0 ? (
        <div className={`grid gap-6 ${viewMode === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
          {filteredProfiles.map((profile) => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              showActions={true}
              onConnect={handleConnect}
              onViewProfile={handleViewProfile}
              compact={viewMode === 'list'}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            {profiles.length === 0 ? (
              <div className="text-gray-500">
                <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No people found
                </h3>
                <p className="text-gray-500 mb-6">
                  Be the first to complete your profile and connect with others!
                </p>
              </div>
            ) : (
              <div className="text-gray-500">
                <Search className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No people match your search
                </h3>
                <p className="text-gray-500 mb-4">
                  Try adjusting your search or filters to find people.
                </p>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedDepartment('');
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
      {!loading && profiles.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-center space-x-8 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>{filteredProfiles.length} people shown</span>
              </div>
              <div className="flex items-center space-x-2">
                <UserPlus className="h-4 w-4" />
                <span>{profiles.length} total students</span>
              </div>
              {selectedDepartment && (
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4" />
                  <span>in {selectedDepartment}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}