"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { profileService } from "@/lib/firestore";

const AuthContext = createContext({});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authMessage, setAuthMessage] = useState("");

  useEffect(() => {
    // Debug Firebase initialization
    console.log('Firebase Auth Status:', {
      auth: !!auth,
      googleProvider: !!googleProvider,
      apiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    });
    
    if (!auth) {
      console.warn('Firebase auth not initialized - check environment variables');
      setAuthMessage("Authentication service is not available. Please refresh the page.");
      setLoading(false);
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // TODO: Temporarily disabled umich.edu constraint for testing
        // const isUmichEmail = user.email?.endsWith("@umich.edu");
        // if (isUmichEmail) {
        
        setUser(user);
        setAuthMessage("Welcome! You have access to the app.");
        
        // Check if profile exists, if not create a basic one
        try {
          const existingProfile = await profileService.getById(user.uid);
          if (!existingProfile) {
            // Auto-generate username from email
            let autoUsername = user.email.split('@')[0].toLowerCase();
            
            // Check if username is available, if not add a number
            let isAvailable = await profileService.isUsernameAvailable(autoUsername);
            let counter = 1;
            while (!isAvailable && counter < 100) { // Prevent infinite loop
              autoUsername = `${user.email.split('@')[0].toLowerCase()}${counter}`;
              isAvailable = await profileService.isUsernameAvailable(autoUsername);
              counter++;
            }
            
            // Create basic profile with auto-generated data
            await profileService.create(user.uid, {
              name: user.displayName || '',
              email: user.email,
              username: autoUsername,
              profile_pic_url: user.photoURL || '',
              profile_cover_photo: '',
              dept: '' // User can fill this later
            });
          }
        } catch (error) {
          console.error('Error creating/checking profile:', error);
        }
        
        // } else {
        //   // Sign out non-umich users immediately
        //   signOut(auth);
        //   setUser(null);
        //   setAuthMessage(
        //     "Thanks for your interest! We have added you to the waitlist. Only umich.edu emails can currently access the app."
        //   );
        // }
      } else {
        setUser(null);
        setAuthMessage("");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    if (!auth || !googleProvider) {
      const error = new Error("Firebase not initialized - check environment variables");
      console.error(error);
      setAuthMessage("Authentication service unavailable. Please try again later.");
      throw error;
    }
    
    try {
      setLoading(true);
      setAuthMessage(""); // Clear any previous messages
      const result = await signInWithPopup(auth, googleProvider);
      // The onAuthStateChanged will handle the email validation
      return result.user;
    } catch (error) {
      console.error("Error signing in with Google:", error);
      setLoading(false);
      
      // Handle specific Firebase Auth errors
      let errorMessage = "Sign in failed. Please try again.";
      
      switch (error.code) {
        case 'auth/unauthorized-domain':
          errorMessage = "This domain is not authorized for Google Sign-In. Please contact support.";
          break;
        case 'auth/popup-blocked':
          errorMessage = "Pop-up was blocked. Please allow pop-ups and try again.";
          break;
        case 'auth/popup-closed-by-user':
          errorMessage = "Sign-in was cancelled.";
          break;
        case 'auth/network-request-failed':
          errorMessage = "Network error. Please check your connection and try again.";
          break;
        case 'auth/too-many-requests':
          errorMessage = "Too many failed attempts. Please try again later.";
          break;
        default:
          errorMessage = `Sign in error: ${error.message}`;
      }
      
      setAuthMessage(errorMessage);
      throw error;
    }
  };

  const logout = async () => {
    if (!auth) {
      throw new Error("Firebase not initialized");
    }
    
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signInWithGoogle,
    logout,
    authMessage,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
