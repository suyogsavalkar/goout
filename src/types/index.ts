import { Timestamp } from 'firebase/firestore';

export interface Profile {
  id: string;
  name: string;
  profile_pic_url: string;
  profile_cover_photo: string;
  dept: string;
  username: string;
  email: string;
  you_met: string[];           // Array of user IDs
  events: string[];            // Array of event IDs
  photos: string[];            // Array of photo URLs
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Event {
  id: string;
  name: string;
  poster_url: string;
  time_created_at: Timestamp;
  time_event_time: Timestamp;
  host: string;                // User ID
  category: string;
  requests: string[];          // Array of user IDs
  approved: string[];          // Array of user IDs
  description?: string;
  location?: string;
  max_attendees?: number;
}

export interface Notification {
  id: string;
  recipient_id: string;
  sender_id: string;
  type: 'event_request' | 'request_approved' | 'request_denied';
  event_id: string;
  message: string;
  read: boolean;
  created_at: Timestamp;
}

export interface CreateProfileData {
  name: string;
  dept: string;
  username: string;
  profile_pic_url?: string;
  profile_cover_photo?: string;
}

export interface CreateEventData {
  name: string;
  category: string;
  time_event_time: Date;
  description?: string;
  location?: string;
  poster_url?: string;
  max_attendees?: number;
}