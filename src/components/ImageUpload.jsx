"use client";

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  Loader2,
  AlertCircle,
  CheckCircle,
  Camera,
  Trash2
} from 'lucide-react';
import { imageUploadService, validateImageFile, createImagePreview, revokeImagePreview } from '@/lib/imageUpload';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function ImageUpload({
  onUploadComplete,
  onUploadError,
  uploadType = 'general', // 'profile', 'cover', 'event', 'gallery'
  userId = null,
  eventId = null,
  maxFiles = 1,
  accept = 'image/*',
  className = '',
  children = null,
  disabled = false
}) {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = useCallback((selectedFiles) => {
    const fileArray = Array.from(selectedFiles);
    
    // Validate files
    const validFiles = [];
    const errors = [];

    fileArray.forEach((file, index) => {
      const validation = validateImageFile(file);
      if (validation.isValid) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.errors.join(', ')}`);
      }
    });

    // Show validation errors
    if (errors.length > 0) {
      toast.error(`Invalid files: ${errors.join('; ')}`);
    }

    // Limit number of files
    const filesToAdd = validFiles.slice(0, maxFiles - files.length);
    
    if (filesToAdd.length < validFiles.length) {
      toast.warning(`Only ${maxFiles} file(s) allowed. Some files were ignored.`);
    }

    // Create previews
    const newPreviews = filesToAdd.map(file => ({
      file,
      preview: createImagePreview(file),
      id: Math.random().toString(36).substr(2, 9)
    }));

    setFiles(prev => [...prev, ...filesToAdd]);
    setPreviews(prev => [...prev, ...newPreviews]);
  }, [files.length, maxFiles]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);
    
    if (disabled) return;
    
    const droppedFiles = e.dataTransfer.files;
    handleFileSelect(droppedFiles);
  }, [handleFileSelect, disabled]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    if (!disabled) {
      setDragActive(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const handleInputChange = (e) => {
    if (e.target.files) {
      handleFileSelect(e.target.files);
    }
  };

  const removeFile = (index) => {
    const preview = previews[index];
    if (preview) {
      revokeImagePreview(preview.preview);
    }
    
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    previews.forEach(preview => {
      revokeImagePreview(preview.preview);
    });
    
    setFiles([]);
    setPreviews([]);
    setUploadProgress(0);
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;
    
    setUploading(true);
    setUploadProgress(0);

    try {
      const uploadPromises = files.map(async (file, index) => {
        let result;
        
        switch (uploadType) {
          case 'profile':
            result = await imageUploadService.uploadProfilePicture(file, userId);
            break;
          case 'cover':
            result = await imageUploadService.uploadCoverPhoto(file, userId);
            break;
          case 'event':
            result = await imageUploadService.uploadEventPoster(file, eventId);
            break;
          case 'gallery':
            result = await imageUploadService.uploadGalleryPhoto(file, userId);
            break;
          default:
            const path = `uploads/${Date.now()}-${file.name}`;
            result = await imageUploadService.uploadImage(file, path);
        }
        
        // Update progress
        setUploadProgress(((index + 1) / files.length) * 100);
        
        return result;
      });

      const results = await Promise.all(uploadPromises);
      
      // Clean up previews
      clearAll();
      
      // Notify parent component
      if (onUploadComplete) {
        onUploadComplete(maxFiles === 1 ? results[0] : results);
      }
      
      toast.success('Images uploaded successfully!');
      
    } catch (error) {
      console.error('Upload error:', error);
      
      if (onUploadError) {
        onUploadError(error);
      }
      
      toast.error('Failed to upload images. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Custom children (render prop pattern)
  if (children) {
    return (
      <div className={className}>
        {children({
          openFileDialog,
          uploading,
          uploadProgress,
          files,
          previews,
          removeFile,
          clearAll,
          uploadFiles,
          disabled
        })}
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={maxFiles > 1}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop Zone */}
      <Card
        className={cn(
          "border-2 border-dashed transition-colors cursor-pointer",
          dragActive && "border-blue-500 bg-blue-50",
          disabled && "opacity-50 cursor-not-allowed",
          !dragActive && !disabled && "hover:border-gray-400"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFileDialog}
      >
        <CardContent className="p-8 text-center">
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              {uploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-gray-600" />
              ) : (
                <Upload className="h-6 w-6 text-gray-600" />
              )}
            </div>
            
            <div>
              <p className="text-lg font-medium text-gray-900">
                {uploading ? 'Uploading...' : 'Upload Images'}
              </p>
              <p className="text-sm text-gray-500">
                Drag and drop or click to select files
              </p>
              <p className="text-xs text-gray-400 mt-1">
                JPEG, PNG, WebP up to 5MB each
              </p>
            </div>
            
            {uploading && (
              <div className="space-y-2">
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-sm text-gray-600">
                  {Math.round(uploadProgress)}% complete
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* File Previews */}
      {previews.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {previews.map((preview, index) => (
              <div key={preview.id} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={preview.preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Remove button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </button>
                
                {/* File info */}
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {preview.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(preview.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Action buttons */}
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={clearAll}
              disabled={uploading}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear All
            </Button>
            
            <Button
              onClick={uploadFiles}
              disabled={uploading || files.length === 0}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload {files.length} file{files.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={maxFiles > 1}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
}