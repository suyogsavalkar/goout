"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Upload, Loader2, Calendar, MapPin, Users, Clock, AlertCircle } from 'lucide-react';
import { eventService } from '@/lib/firestore';
import { validateEvent, EVENT_CATEGORIES } from '@/lib/validation';
import { isTimeRestricted, getMaxEventTime, isValidEventTime, formatToLocalDateTime } from '@/lib/utils';
import { uploadEventPoster } from '@/lib/storage';
import { toast } from 'sonner';

export default function EventCreationForm({ onSuccess = null, trigger = null, open: controlledOpen, onOpenChange: controlledOnOpenChange }) {
  const { user } = useAuth();
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Use controlled state if provided, otherwise use internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    time_event_time: '',
    description: '',
    location: '',
    max_attendees: '',
    poster_url: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [posterImage, setPosterImage] = useState(null);

  // Check if event creation is currently restricted
  const isRestricted = isTimeRestricted();
  const maxEventTime = useMemo(() => getMaxEventTime(), [open]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        name: '',
        category: '',
        time_event_time: '',
        description: '',
        location: '',
        max_attendees: '',
        poster_url: ''
      });
      setErrors({});
      setPosterImage(null);
      
      // Debug: Log current timezone info
      console.log('Event form opened - timezone info:', {
        now: new Date().toLocaleString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timezoneOffset: new Date().getTimezoneOffset(),
        maxEventTime: maxEventTime.toLocaleString(),
        minDateTime: formatMinDateTime(),
        maxDateTime: formatMaxDateTime()
      });
    }
  }, [open, maxEventTime]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleImageUpload = (file) => {
    if (!file) return;

    // Store the file for later upload and show preview
    const imageUrl = URL.createObjectURL(file);
    setPosterImage(file);
    handleInputChange('poster_url', imageUrl);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to create an event');
      return;
    }

    // Commented out 12AM-5AM restriction as requested
    // if (isRestricted) {
    //   toast.error('Events cannot be created between 12AM and 5AM');
    //   return;
    // }

    // Validate form
    const validation = validateEvent(formData);

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setLoading(true);
    
    try {
      let eventData = {
        ...formData,
        max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : undefined
      };

      // Create the event first to get an ID
      const newEvent = await eventService.create(eventData, user.uid);
      
      // Upload poster image if provided
      if (posterImage) {
        toast.info('Uploading event poster...');
        try {
          const posterUrl = await uploadEventPoster(posterImage, newEvent.id);
          // Update the event with the poster URL
          await eventService.update(newEvent.id, { poster_url: posterUrl });
          newEvent.poster_url = posterUrl;
        } catch (uploadError) {
          console.error('Error uploading poster:', uploadError);
          toast.warning('Event created but poster upload failed');
        }
      }
      
      // Clean up the blob URL to prevent memory leaks
      if (formData.poster_url && formData.poster_url.startsWith('blob:')) {
        URL.revokeObjectURL(formData.poster_url);
      }
      
      toast.success('Event created successfully!');
      setOpen(false);
      
      if (onSuccess) {
        onSuccess(newEvent);
      }
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Failed to create event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Format datetime-local input max value (in user's local timezone)
  const formatMaxDateTime = () => {
    return formatToLocalDateTime(maxEventTime);
  };

  // Format current time for min value (in user's local timezone)
  const formatMinDateTime = () => {
    const date = new Date();
    date.setMinutes(date.getMinutes() + 15); // Minimum 15 minutes from now
    return formatToLocalDateTime(date);
  };

  const TriggerButton = trigger || (
    <Button>
      <Calendar className="mr-2 h-4 w-4" />
      Create Event
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {TriggerButton}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
          <DialogDescription>
            Create a spontaneous event for other U-M students to join. Events must be within the next 12 hours.
          </DialogDescription>
        </DialogHeader>

        {/* Time Restriction Warning - Commented out as requested */}
        {/* {isRestricted && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Event creation is currently restricted</span>
            </div>
            <p className="text-sm text-red-700 mt-1">
              Events cannot be created between 12:00 AM and 5:00 AM. Please try again later.
            </p>
          </div>
        )} */}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Event Poster */}
          <div className="space-y-2">
            <Label>Event Poster (Optional)</Label>
            {formData.poster_url && (
              <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                <img 
                  src={formData.poster_url} 
                  alt="Event poster" 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div>
              <Label htmlFor="poster-input" className="cursor-pointer">
                <div className="flex items-center justify-center space-x-2 text-sm text-blue-600 hover:text-blue-800 border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-300">
                  <Upload className="h-5 w-5" />
                  <span>Upload Event Poster</span>
                </div>
              </Label>
              <input
                id="poster-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageUpload(e.target.files[0])}
              />
            </div>
          </div>

          {/* Event Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Event Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="What's happening?"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => handleInputChange('category', value)}
            >
              <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select event category" />
              </SelectTrigger>
              <SelectContent>
                {EVENT_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-sm text-red-500">{errors.category}</p>
            )}
          </div>

          {/* Event Time */}
          <div className="space-y-2">
            <Label htmlFor="time_event_time">Event Time *</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="time_event_time"
                type="datetime-local"
                value={formData.time_event_time}
                onChange={(e) => handleInputChange('time_event_time', e.target.value)}
                min={formatMinDateTime()}
                max={formatMaxDateTime()}
                className={`pl-10 ${errors.time_event_time ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.time_event_time && (
              <p className="text-sm text-red-500">{errors.time_event_time}</p>
            )}
            <p className="text-xs text-gray-500">
              Events must be scheduled within the next 12 hours (until {maxEventTime.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })})
            </p>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location (Optional)</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Where is this happening?"
                className={`pl-10 ${errors.location ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.location && (
              <p className="text-sm text-red-500">{errors.location}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Tell people more about your event..."
              rows={3}
            />
          </div>

          {/* Max Attendees */}
          <div className="space-y-2">
            <Label htmlFor="max_attendees">Max Attendees (Optional)</Label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="max_attendees"
                type="number"
                min="2"
                max="100"
                value={formData.max_attendees}
                onChange={(e) => handleInputChange('max_attendees', e.target.value)}
                placeholder="How many people can join?"
                className={`pl-10 ${errors.max_attendees ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.max_attendees && (
              <p className="text-sm text-red-500">{errors.max_attendees}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Event'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
