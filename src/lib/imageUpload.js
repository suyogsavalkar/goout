import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

// Image compression utility
const compressImage = (file, maxWidth = 1200, maxHeight = 1200, quality = 0.8) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(resolve, 'image/jpeg', quality);
    };

    img.src = URL.createObjectURL(file);
  });
};

// Generate thumbnail
const generateThumbnail = (file, size = 150) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = size;
      canvas.height = size;

      // Calculate crop dimensions for square thumbnail
      const { width, height } = img;
      const minDimension = Math.min(width, height);
      const x = (width - minDimension) / 2;
      const y = (height - minDimension) / 2;

      ctx.drawImage(img, x, y, minDimension, minDimension, 0, 0, size, size);
      
      canvas.toBlob(resolve, 'image/jpeg', 0.8);
    };

    img.src = URL.createObjectURL(file);
  });
};

// Validate image file
export const validateImageFile = (file) => {
  const errors = [];
  
  // Check file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    errors.push('Please select a valid image file (JPEG, PNG, or WebP)');
  }
  
  // Check file size (5MB limit)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    errors.push('Image must be smaller than 5MB');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Image upload service
export class ImageUploadService {
  constructor() {
    this.uploadProgress = new Map();
  }

  // Upload image with compression
  async uploadImage(file, path, options = {}) {
    const {
      compress = true,
      generateThumb = false,
      maxWidth = 1200,
      maxHeight = 1200,
      quality = 0.8,
      onProgress = null
    } = options;

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    try {
      let uploadFile = file;
      
      // Compress image if requested
      if (compress) {
        uploadFile = await compressImage(file, maxWidth, maxHeight, quality);
      }

      // Create storage reference
      const imageRef = ref(storage, path);
      
      // Upload with progress tracking
      const uploadTask = uploadBytes(imageRef, uploadFile);
      
      if (onProgress) {
        // Note: uploadBytes doesn't support progress tracking
        // For progress tracking, you'd need to use uploadBytesResumable
        onProgress(100);
      }

      await uploadTask;
      
      // Get download URL
      const downloadURL = await getDownloadURL(imageRef);
      
      let thumbnailURL = null;
      
      // Generate and upload thumbnail if requested
      if (generateThumb) {
        const thumbnail = await generateThumbnail(file);
        const thumbPath = path.replace(/(\.[^.]+)$/, '_thumb$1');
        const thumbRef = ref(storage, thumbPath);
        
        await uploadBytes(thumbRef, thumbnail);
        thumbnailURL = await getDownloadURL(thumbRef);
      }

      return {
        url: downloadURL,
        thumbnailUrl: thumbnailURL,
        path: path,
        size: uploadFile.size,
        type: uploadFile.type
      };
      
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image. Please try again.');
    }
  }

  // Upload profile picture
  async uploadProfilePicture(file, userId) {
    const path = `profiles/${userId}/profile-picture-${Date.now()}.jpg`;
    
    return await this.uploadImage(file, path, {
      compress: true,
      generateThumb: true,
      maxWidth: 400,
      maxHeight: 400,
      quality: 0.9
    });
  }

  // Upload cover photo
  async uploadCoverPhoto(file, userId) {
    const path = `profiles/${userId}/cover-photo-${Date.now()}.jpg`;
    
    return await this.uploadImage(file, path, {
      compress: true,
      maxWidth: 1200,
      maxHeight: 400,
      quality: 0.8
    });
  }

  // Upload event poster
  async uploadEventPoster(file, eventId) {
    const path = `events/${eventId}/poster-${Date.now()}.jpg`;
    
    return await this.uploadImage(file, path, {
      compress: true,
      generateThumb: true,
      maxWidth: 800,
      maxHeight: 600,
      quality: 0.8
    });
  }

  // Upload gallery photo
  async uploadGalleryPhoto(file, userId) {
    const path = `profiles/${userId}/photos/photo-${Date.now()}.jpg`;
    
    return await this.uploadImage(file, path, {
      compress: true,
      generateThumb: true,
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 0.8
    });
  }

  // Delete image
  async deleteImage(path) {
    try {
      const imageRef = ref(storage, path);
      await deleteObject(imageRef);
      
      // Also try to delete thumbnail if it exists
      const thumbPath = path.replace(/(\.[^.]+)$/, '_thumb$1');
      try {
        const thumbRef = ref(storage, thumbPath);
        await deleteObject(thumbRef);
      } catch (error) {
        // Thumbnail might not exist, ignore error
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      throw new Error('Failed to delete image');
    }
  }

  // Get upload progress
  getUploadProgress(uploadId) {
    return this.uploadProgress.get(uploadId) || 0;
  }

  // Batch upload multiple images
  async uploadMultipleImages(files, basePath, options = {}) {
    const results = [];
    const errors = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const path = `${basePath}/image-${i}-${Date.now()}.jpg`;
      
      try {
        const result = await this.uploadImage(file, path, options);
        results.push(result);
      } catch (error) {
        errors.push({ file: file.name, error: error.message });
      }
    }

    return { results, errors };
  }
}

// Create singleton instance
export const imageUploadService = new ImageUploadService();

// Utility functions
export const getImageDimensions = (file) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };
    img.src = URL.createObjectURL(file);
  });
};

export const createImagePreview = (file) => {
  return URL.createObjectURL(file);
};

export const revokeImagePreview = (url) => {
  URL.revokeObjectURL(url);
};

// Image optimization utilities
export const optimizeImageForWeb = async (file, options = {}) => {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.8,
    format = 'jpeg'
  } = options;

  return await compressImage(file, maxWidth, maxHeight, quality);
};

// Convert image to different format
export const convertImageFormat = (file, format = 'jpeg', quality = 0.8) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const mimeType = `image/${format}`;
      canvas.toBlob(resolve, mimeType, quality);
    };

    img.src = URL.createObjectURL(file);
  });
};