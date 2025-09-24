"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { profileService, realtimeService } from '@/lib/firestore';

export function useProfile(userId = null) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const targetUserId = userId || user?.uid;

  useEffect(() => {
    if (!targetUserId) {
      setLoading(false);
      return;
    }

    let unsubscribe;

    const setupListener = () => {
      unsubscribe = realtimeService.subscribeToProfile(
        targetUserId,
        (profileData) => {
          setProfile(profileData);
          setLoading(false);
          setError(null);
        }
      );
    };

    // First, try to get the profile data
    console.log('Fetching profile for user:', targetUserId);
    profileService.getById(targetUserId)
      .then((profileData) => {
        console.log('Profile data received:', profileData);
        setProfile(profileData);
        setLoading(false);
        
        // Set up real-time listener
        setupListener();
      })
      .catch((err) => {
        console.error('Error fetching profile:', err);
        setError(err);
        setLoading(false);
      });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [targetUserId]);

  const updateProfile = async (updates) => {
    if (!targetUserId) throw new Error('No user ID available');
    
    try {
      await profileService.update(targetUserId, updates);
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const createProfile = async (profileData) => {
    if (!targetUserId) throw new Error('No user ID available');
    
    try {
      const newProfile = await profileService.create(targetUserId, profileData);
      return newProfile;
    } catch (error) {
      console.error('Error creating profile:', error);
      throw error;
    }
  };

  const checkUsernameAvailability = async (username) => {
    try {
      return await profileService.isUsernameAvailable(username, targetUserId);
    } catch (error) {
      console.error('Error checking username:', error);
      throw error;
    }
  };

  const addConnection = async (metUserId) => {
    if (!targetUserId) throw new Error('No user ID available');
    
    try {
      await profileService.addConnection(targetUserId, metUserId);
      return true;
    } catch (error) {
      console.error('Error adding connection:', error);
      throw error;
    }
  };

  return {
    profile,
    loading,
    error,
    updateProfile,
    createProfile,
    checkUsernameAvailability,
    addConnection,
    hasProfile: !!profile,
    isOwnProfile: targetUserId === user?.uid
  };
}

export function useProfiles() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const profilesData = await profileService.getAll();
        setProfiles(profilesData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching profiles:', err);
        setError(err);
        setLoading(false);
      }
    };

    fetchProfiles();
  }, []);

  const refreshProfiles = async () => {
    setLoading(true);
    try {
      const profilesData = await profileService.getAll();
      setProfiles(profilesData);
      setError(null);
    } catch (err) {
      console.error('Error refreshing profiles:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return {
    profiles,
    loading,
    error,
    refreshProfiles
  };
}