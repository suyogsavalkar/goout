"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { eventService, realtimeService, notificationService } from '@/lib/firestore';

export function useEvents() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsubscribe;

    const setupListener = () => {
      unsubscribe = realtimeService.subscribeToRecentEvents((eventsData) => {
        setEvents(eventsData);
        setLoading(false);
        setError(null);
      });
    };

    // First, get initial events data
    eventService.getRecent()
      .then((eventsData) => {
        setEvents(eventsData);
        setLoading(false);
        
        // Set up real-time listener
        setupListener();
      })
      .catch((err) => {
        console.error('Error fetching events:', err);
        setError(err);
        setLoading(false);
      });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const createEvent = async (eventData) => {
    if (!user) throw new Error('User must be logged in');
    
    try {
      const newEvent = await eventService.create(eventData, user.uid);
      return newEvent;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  };

  const requestToJoin = async (eventId) => {
    if (!user) throw new Error('User must be logged in');
    
    try {
      await eventService.requestToJoin(eventId, user.uid);
      
      // Find the event to get host info
      const event = events.find(e => e.id === eventId);
      if (event) {
        // Create notification for host
        await notificationService.create({
          recipient_id: event.host,
          sender_id: user.uid,
          type: 'event_request',
          event_id: eventId,
          message: `${user.displayName || 'Someone'} wants to join your event "${event.name}"`
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error requesting to join event:', error);
      throw error;
    }
  };

  const approveRequest = async (eventId, userId) => {
    if (!user) throw new Error('User must be logged in');
    
    try {
      await eventService.approveRequest(eventId, userId);
      
      // Find the event to get event info
      const event = events.find(e => e.id === eventId);
      if (event) {
        // Create notification for approved user
        await notificationService.create({
          recipient_id: userId,
          sender_id: user.uid,
          type: 'request_approved',
          event_id: eventId,
          message: `Your request to join "${event.name}" has been approved!`
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error approving request:', error);
      throw error;
    }
  };

  const denyRequest = async (eventId, userId) => {
    if (!user) throw new Error('User must be logged in');
    
    try {
      await eventService.denyRequest(eventId, userId);
      
      // Find the event to get event info
      const event = events.find(e => e.id === eventId);
      if (event) {
        // Create notification for denied user
        await notificationService.create({
          recipient_id: userId,
          sender_id: user.uid,
          type: 'request_denied',
          event_id: eventId,
          message: `Your request to join "${event.name}" was not approved.`
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error denying request:', error);
      throw error;
    }
  };

  const updateEvent = async (eventId, updates) => {
    if (!user) throw new Error('User must be logged in');
    
    try {
      await eventService.update(eventId, updates);
      return true;
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  };

  const deleteEvent = async (eventId) => {
    if (!user) throw new Error('User must be logged in');
    
    try {
      await eventService.delete(eventId);
      return true;
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  };

  return {
    events,
    loading,
    error,
    createEvent,
    requestToJoin,
    approveRequest,
    denyRequest,
    updateEvent,
    deleteEvent
  };
}

export function useEvent(eventId) {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      return;
    }

    let unsubscribe;

    const setupListener = () => {
      unsubscribe = realtimeService.subscribeToEvent(eventId, (eventData) => {
        setEvent(eventData);
        setLoading(false);
        setError(null);
      });
    };

    // First, get initial event data
    eventService.getById(eventId)
      .then((eventData) => {
        setEvent(eventData);
        setLoading(false);
        
        // Set up real-time listener
        setupListener();
      })
      .catch((err) => {
        console.error('Error fetching event:', err);
        setError(err);
        setLoading(false);
      });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [eventId]);

  return {
    event,
    loading,
    error
  };
}

export function useUserEvents(userId = null) {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const targetUserId = userId || user?.uid;

  useEffect(() => {
    if (!targetUserId) {
      setLoading(false);
      return;
    }

    const fetchUserEvents = async () => {
      try {
        const userEvents = await eventService.getByHost(targetUserId);
        setEvents(userEvents);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching user events:', err);
        setError(err);
        setLoading(false);
      }
    };

    fetchUserEvents();
  }, [targetUserId]);

  return {
    events,
    loading,
    error
  };
}