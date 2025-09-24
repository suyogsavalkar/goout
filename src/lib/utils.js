import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Time validation utilities
export const isTimeRestricted = () => {
  // Commented out 12AM-5AM restriction as requested
  // const now = new Date();
  // const hour = now.getHours();
  // return hour >= 0 && hour < 5; // 12AM to 5AM
  return false; // Always allow event creation
};

export const getMaxEventTime = () => {
  const now = new Date();
  const maxTime = new Date(now.getTime() + (12 * 60 * 60 * 1000)); // 12 hours from now
  return maxTime;
};

export const isValidEventTime = (eventTime) => {
  const now = new Date();
  const maxTime = getMaxEventTime();
  
  // Handle datetime-local input format (YYYY-MM-DDTHH:MM)
  // This ensures the date is interpreted in the user's local timezone
  let eventDate;
  if (typeof eventTime === 'string' && eventTime.includes('T')) {
    // For datetime-local format, create date directly to preserve local timezone
    eventDate = new Date(eventTime);
  } else {
    eventDate = new Date(eventTime);
  }
  
  // Add a small buffer (1 minute) to account for processing time
  const minTime = new Date(now.getTime() + (1 * 60 * 1000));
  
  // Debug logging
  console.log('Time validation:', {
    eventTime,
    eventDate: eventDate.toLocaleString(),
    now: now.toLocaleString(),
    maxTime: maxTime.toLocaleString(),
    minTime: minTime.toLocaleString(),
    isAfterMin: eventDate >= minTime,
    isBeforeMax: eventDate <= maxTime,
    isValid: eventDate >= minTime && eventDate <= maxTime
  });
  
  return eventDate >= minTime && eventDate <= maxTime;
};

// Username validation
export const isValidUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

// Image validation
export const isValidImageFile = (file) => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  return validTypes.includes(file.type) && file.size <= maxSize;
};

// Format date for display
export const formatEventTime = (timestamp) => {
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

// Calculate time until event
export const getTimeUntilEvent = (timestamp) => {
  const now = new Date();
  const eventTime = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const diff = eventTime.getTime() - now.getTime();
  
  if (diff <= 0) return 'Event has started';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

// Convert datetime-local string to proper Date object in user's timezone
export const parseLocalDateTime = (datetimeLocalString) => {
  if (!datetimeLocalString) return null;
  
  // datetime-local format: YYYY-MM-DDTHH:MM
  // This creates a Date object in the user's local timezone
  return new Date(datetimeLocalString);
};

// Format Date object to datetime-local string
export const formatToLocalDateTime = (date) => {
  if (!date) return '';
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};