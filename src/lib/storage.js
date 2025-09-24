import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';
import { isValidImageFile } from './utils';

// Upload profile picture
export const uploadProfilePicture = async (file, userId) => {
  if (!isValidImageFile(file)) {
    throw new Error('Invalid image file. Please use JPEG, PNG, or WebP format under 5MB.');
  }

  const fileName = `profile-pictures/${userId}/${Date.now()}-${file.name}`;
  const storageRef = ref(storage, fileName);
  
  try {
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    throw new Error('Failed to upload profile picture');
  }
};

// Upload cover photo
export const uploadCoverPhoto = async (file, userId) => {
  if (!isValidImageFile(file)) {
    throw new Error('Invalid image file. Please use JPEG, PNG, or WebP format under 5MB.');
  }

  const fileName = `cover-photos/${userId}/${Date.now()}-${file.name}`;
  const storageRef = ref(storage, fileName);
  
  try {
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading cover photo:', error);
    throw new Error('Failed to upload cover photo');
  }
};

// Upload event poster
export const uploadEventPoster = async (file, eventId) => {
  if (!isValidImageFile(file)) {
    throw new Error('Invalid image file. Please use JPEG, PNG, or WebP format under 5MB.');
  }

  const fileName = `event-posters/${eventId}/${Date.now()}-${file.name}`;
  const storageRef = ref(storage, fileName);
  
  try {
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading event poster:', error);
    throw new Error('Failed to upload event poster');
  }
};

// Upload gallery photo
export const uploadGalleryPhoto = async (file, userId) => {
  if (!isValidImageFile(file)) {
    throw new Error('Invalid image file. Please use JPEG, PNG, or WebP format under 5MB.');
  }

  const fileName = `gallery/${userId}/${Date.now()}-${file.name}`;
  const storageRef = ref(storage, fileName);
  
  try {
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading gallery photo:', error);
    throw new Error('Failed to upload gallery photo');
  }
};

// Delete file from storage
export const deleteFile = async (fileUrl) => {
  try {
    const fileRef = ref(storage, fileUrl);
    await deleteObject(fileRef);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw new Error('Failed to delete file');
  }
};

// Get file reference from URL
export const getFileRefFromUrl = (url) => {
  // Extract the path from Firebase Storage URL
  const baseUrl = `https://firebasestorage.googleapis.com/v0/b/${storage.app.options.storageBucket}/o/`;
  if (url.startsWith(baseUrl)) {
    const encodedPath = url.substring(baseUrl.length).split('?')[0];
    const path = decodeURIComponent(encodedPath);
    return ref(storage, path);
  }
  throw new Error('Invalid Firebase Storage URL');
};