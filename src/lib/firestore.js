import { 
  collection, 
  doc, 
  addDoc, 
  setDoc,
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  serverTimestamp,
  Timestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from './firebase';

// Collections
export const COLLECTIONS = {
  PROFILES: 'profiles',
  EVENTS: 'events',
  NOTIFICATIONS: 'notifications'
};

// Helper function to check if Firestore is initialized
const checkDb = () => {
  if (!db) throw new Error('Firestore not initialized');
};

// Profile operations
export const profileService = {
  // Create a new profile
  async create(userId, profileData) {
    checkDb();
    
    try {
      const profileRef = doc(db, COLLECTIONS.PROFILES, userId);
      const profile = {
        ...profileData,
        id: userId,
        you_met: [],
        events: [],
        photos: [],
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      };
      
      await setDoc(profileRef, profile);
      return profile;
    } catch (error) {
      console.error('Error creating profile:', error);
      throw error;
    }
  },

  // Get profile by user ID
  async getById(userId) {
    checkDb();
    
    try {
      const profileRef = doc(db, COLLECTIONS.PROFILES, userId);
      const profileSnap = await getDoc(profileRef);
      
      if (profileSnap.exists()) {
        return { id: profileSnap.id, ...profileSnap.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting profile:', error);
      throw error;
    }
  },

  // Update profile
  async update(userId, updates) {
    checkDb();
    
    const profileRef = doc(db, COLLECTIONS.PROFILES, userId);
    const updateData = {
      ...updates,
      updated_at: serverTimestamp()
    };
    
    await updateDoc(profileRef, updateData);
    return updateData;
  },

  // Check if username is available
  async isUsernameAvailable(username, excludeUserId = null) {
    checkDb();
    
    const q = query(
      collection(db, COLLECTIONS.PROFILES),
      where('username', '==', username)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) return true;
    
    // If excluding a user ID (for updates), check if the username belongs to that user
    if (excludeUserId) {
      const docs = querySnapshot.docs;
      return docs.length === 1 && docs[0].id === excludeUserId;
    }
    
    return false;
  },

  // Get all profiles for people directory
  async getAll(limitCount = 50) {
    checkDb();
    
    const q = query(
      collection(db, COLLECTIONS.PROFILES),
      orderBy('created_at', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  // Add user to you_met array
  async addConnection(userId, metUserId) {
    checkDb();
    
    const profileRef = doc(db, COLLECTIONS.PROFILES, userId);
    await updateDoc(profileRef, {
      you_met: arrayUnion(metUserId),
      updated_at: serverTimestamp()
    });
  },

  // Add event to user's events array
  async addEvent(userId, eventId) {
    checkDb();
    
    const profileRef = doc(db, COLLECTIONS.PROFILES, userId);
    await updateDoc(profileRef, {
      events: arrayUnion(eventId),
      updated_at: serverTimestamp()
    });
  }
};

// Event operations
export const eventService = {
  // Create a new event
  async create(eventData, hostId) {
    checkDb();
    
    const event = {
      ...eventData,
      host: hostId,
      time_created_at: serverTimestamp(),
      time_event_time: Timestamp.fromDate(new Date(eventData.time_event_time)),
      requests: [],
      approved: [],
      poster_url: eventData.poster_url || ''
    };
    
    const docRef = await addDoc(collection(db, COLLECTIONS.EVENTS), event);
    return { id: docRef.id, ...event };
  },

  // Get event by ID
  async getById(eventId) {
    checkDb();
    const eventRef = doc(db, COLLECTIONS.EVENTS, eventId);
    const eventSnap = await getDoc(eventRef);
    
    if (eventSnap.exists()) {
      return { id: eventSnap.id, ...eventSnap.data() };
    }
    return null;
  },

  // Get recent events (last 12 hours)
  async getRecent() {
    checkDb();
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    
    const q = query(
      collection(db, COLLECTIONS.EVENTS),
      where('time_created_at', '>=', Timestamp.fromDate(twelveHoursAgo)),
      orderBy('time_created_at', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  // Get events by host
  async getByHost(hostId) {
    checkDb();
    const q = query(
      collection(db, COLLECTIONS.EVENTS),
      where('host', '==', hostId),
      orderBy('time_created_at', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  // Request to join event
  async requestToJoin(eventId, userId) {
    checkDb();
    const eventRef = doc(db, COLLECTIONS.EVENTS, eventId);
    await updateDoc(eventRef, {
      requests: arrayUnion(userId)
    });
  },

  // Approve request
  async approveRequest(eventId, userId) {
    checkDb();
    const eventRef = doc(db, COLLECTIONS.EVENTS, eventId);
    await updateDoc(eventRef, {
      requests: arrayRemove(userId),
      approved: arrayUnion(userId)
    });
    
    // Add event to user's events array
    await profileService.addEvent(userId, eventId);
  },

  // Deny request
  async denyRequest(eventId, userId) {
    checkDb();
    const eventRef = doc(db, COLLECTIONS.EVENTS, eventId);
    await updateDoc(eventRef, {
      requests: arrayRemove(userId)
    });
  },

  // Update event
  async update(eventId, updates) {
    checkDb();
    const eventRef = doc(db, COLLECTIONS.EVENTS, eventId);
    await updateDoc(eventRef, updates);
  },

  // Delete event
  async delete(eventId) {
    checkDb();
    const eventRef = doc(db, COLLECTIONS.EVENTS, eventId);
    await deleteDoc(eventRef);
  }
};

// Notification operations
export const notificationService = {
  // Create notification
  async create(notificationData) {
    checkDb();
    const notification = {
      ...notificationData,
      read: false,
      created_at: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), notification);
    return { id: docRef.id, ...notification };
  },

  // Get notifications for user
  async getForUser(userId, limitCount = 20) {
    checkDb();
    const q = query(
      collection(db, COLLECTIONS.NOTIFICATIONS),
      where('recipient_id', '==', userId),
      orderBy('created_at', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  // Mark notification as read
  async markAsRead(notificationId) {
    checkDb();
    const notificationRef = doc(db, COLLECTIONS.NOTIFICATIONS, notificationId);
    await updateDoc(notificationRef, {
      read: true
    });
  },

  // Mark all notifications as read for user
  async markAllAsRead(userId) {
    checkDb();
    const q = query(
      collection(db, COLLECTIONS.NOTIFICATIONS),
      where('recipient_id', '==', userId),
      where('read', '==', false)
    );
    
    const querySnapshot = await getDocs(q);
    const batch = [];
    
    querySnapshot.docs.forEach(doc => {
      batch.push(updateDoc(doc.ref, { read: true }));
    });
    
    await Promise.all(batch);
  }
};

// Real-time listeners
export const realtimeService = {
  // Listen to recent events
  subscribeToRecentEvents(callback) {
    if (!db) return () => {}; // Return empty unsubscribe function
    
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    
    const q = query(
      collection(db, COLLECTIONS.EVENTS),
      where('time_created_at', '>=', Timestamp.fromDate(twelveHoursAgo)),
      orderBy('time_created_at', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(events);
    });
  },

  // Listen to user notifications
  subscribeToNotifications(userId, callback) {
    if (!db) return () => {}; // Return empty unsubscribe function
    
    const q = query(
      collection(db, COLLECTIONS.NOTIFICATIONS),
      where('recipient_id', '==', userId),
      where('read', '==', false),
      orderBy('created_at', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(notifications);
    });
  },

  // Listen to specific event
  subscribeToEvent(eventId, callback) {
    if (!db) return () => {}; // Return empty unsubscribe function
    
    const eventRef = doc(db, COLLECTIONS.EVENTS, eventId);
    
    return onSnapshot(eventRef, (snapshot) => {
      if (snapshot.exists()) {
        callback({ id: snapshot.id, ...snapshot.data() });
      } else {
        callback(null);
      }
    });
  },

  // Listen to user profile
  subscribeToProfile(userId, callback) {
    if (!db) return () => {}; // Return empty unsubscribe function
    
    const profileRef = doc(db, COLLECTIONS.PROFILES, userId);
    
    return onSnapshot(profileRef, (snapshot) => {
      if (snapshot.exists()) {
        callback({ id: snapshot.id, ...snapshot.data() });
      } else {
        callback(null);
      }
    });
  }
};