import { isValidUsername, isTimeRestricted, isValidEventTime } from './utils';

// Profile validation
export const validateProfile = (profileData) => {
  const errors = {};
  
  // Name validation
  if (!profileData.name || profileData.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters long';
  }
  
  // Department validation
  if (!profileData.dept || profileData.dept.trim().length < 2) {
    errors.dept = 'Department is required';
  }
  
  // Username validation
  if (!profileData.username) {
    errors.username = 'Username is required';
  } else if (!isValidUsername(profileData.username)) {
    errors.username = 'Username must be 3-20 characters and contain only letters, numbers, and underscores';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Event validation
export const validateEvent = (eventData) => {
  const errors = {};
  
  // Name validation
  if (!eventData.name || eventData.name.trim().length < 3) {
    errors.name = 'Event name must be at least 3 characters long';
  }
  
  // Category validation
  if (!eventData.category || eventData.category.trim().length < 2) {
    errors.category = 'Category is required';
  }
  
  // Time validation
  if (!eventData.time_event_time) {
    errors.time_event_time = 'Event time is required';
  } else {
    // Commented out 12AM-5AM restriction as requested
    // if (isTimeRestricted()) {
    //   errors.time_event_time = 'Events cannot be created between 12AM and 5AM';
    // }
    
    // Check if event time is within 12 hours
    if (!isValidEventTime(eventData.time_event_time)) {
      const now = new Date();
      const maxTime = new Date(now.getTime() + (12 * 60 * 60 * 1000));
      const maxTimeStr = maxTime.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      errors.time_event_time = `Event must be scheduled between now and ${maxTimeStr} (within 12 hours)`;
    }
  }
  
  // Location validation (optional)
  if (eventData.location && eventData.location.trim().length < 3) {
    errors.location = 'Location must be at least 3 characters long';
  }
  
  // Max attendees validation (optional)
  if (eventData.max_attendees && (eventData.max_attendees < 2 || eventData.max_attendees > 100)) {
    errors.max_attendees = 'Max attendees must be between 2 and 100';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Notification validation
export const validateNotification = (notificationData) => {
  const errors = {};
  
  if (!notificationData.recipient_id) {
    errors.recipient_id = 'Recipient ID is required';
  }
  
  if (!notificationData.sender_id) {
    errors.sender_id = 'Sender ID is required';
  }
  
  if (!notificationData.type || !['event_request', 'request_approved', 'request_denied'].includes(notificationData.type)) {
    errors.type = 'Valid notification type is required';
  }
  
  if (!notificationData.event_id) {
    errors.event_id = 'Event ID is required';
  }
  
  if (!notificationData.message || notificationData.message.trim().length < 1) {
    errors.message = 'Message is required';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Event categories
export const EVENT_CATEGORIES = [
  'Study Group',
  'Social',
  'Sports',
  'Food',
  'Entertainment',
  'Academic',
  'Networking',
  'Outdoor',
  'Gaming',
  'Other'
];

// University of Michigan departments
export const UM_DEPARTMENTS = [
  'LSA - Literature, Science, and the Arts',
  'Engineering',
  'Business (Ross)',
  'Medicine',
  'Law',
  'Education',
  'Public Health',
  'Information (SI)',
  'Music, Theatre & Dance',
  'Art & Design',
  'Architecture & Urban Planning',
  'Social Work',
  'Nursing',
  'Pharmacy',
  'Dentistry',
  'Kinesiology',
  'Environment & Sustainability',
  'Public Policy (Ford)',
  'Graduate School',
  'Other'
];