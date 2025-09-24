"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, X } from 'lucide-react';
import { formatEventTime } from '@/lib/utils';

export default function ProfileGallery({ profile, events = [] }) {
  const [selectedImage, setSelectedImage] = useState(null);

  if (!profile) return null;

  const attendedEvents = events.filter(event => 
    profile.events?.includes(event.id)
  );

  return (
    <div className="space-y-6">
      {/* Photos Gallery */}
      {profile.photos && profile.photos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>Photos</span>
              <Badge variant="secondary">{profile.photos.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {profile.photos.map((photo, index) => (
                <Dialog key={index}>
                  <DialogTrigger asChild>
                    <div className="aspect-square cursor-pointer group relative overflow-hidden rounded-lg">
                      <img 
                        src={photo} 
                        alt={`Photo ${index + 1}`}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity" />
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <div className="relative">
                      <img 
                        src={photo} 
                        alt={`Photo ${index + 1}`}
                        className="w-full h-auto max-h-[80vh] object-contain"
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Events Attended */}
      {attendedEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Events Attended</span>
              <Badge variant="secondary">{attendedEvents.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {attendedEvents.map((event) => (
                <div key={event.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex space-x-3">
                    {event.poster_url && (
                      <img 
                        src={event.poster_url} 
                        alt={event.name}
                        className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">
                        {event.name}
                      </h4>
                      <p className="text-sm text-gray-500 mb-2">
                        {event.category}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatEventTime(event.time_event_time)}</span>
                        </div>
                        {event.location && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connections */}
      {profile.you_met && profile.you_met.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Connections</span>
              <Badge variant="secondary">{profile.you_met.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Connected with {profile.you_met.length} people</p>
              <p className="text-sm">Connection details coming soon</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty States */}
      {(!profile.photos || profile.photos.length === 0) && 
       attendedEvents.length === 0 && 
       (!profile.you_met || profile.you_met.length === 0) && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Calendar className="h-16 w-16 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No activity yet
              </h3>
              <p className="text-gray-500">
                {profile.name} hasn't attended any events or uploaded photos yet.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}