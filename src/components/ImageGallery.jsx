"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Image as ImageIcon, 
  X, 
  Download, 
  Share2, 
  Trash2,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  Grid,
  List,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function ImageGallery({
  images = [],
  title = "Gallery",
  onImageDelete = null,
  onImageAdd = null,
  showAddButton = false,
  showDeleteButton = false,
  columns = 3,
  className = ""
}) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [currentIndex, setCurrentIndex] = useState(0);

  const openLightbox = (image, index) => {
    setSelectedImage(image);
    setCurrentIndex(index);
  };

  const closeLightbox = () => {
    setSelectedImage(null);
    setCurrentIndex(0);
  };

  const navigateImage = (direction) => {
    const newIndex = direction === 'next' 
      ? (currentIndex + 1) % images.length
      : (currentIndex - 1 + images.length) % images.length;
    
    setCurrentIndex(newIndex);
    setSelectedImage(images[newIndex]);
  };

  const handleDownload = async (image) => {
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = image.name || `image-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(url);
      toast.success('Image downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download image');
    }
  };

  const handleShare = async (image) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Shared Image',
          text: 'Check out this image',
          url: image.url
        });
      } catch (error) {
        // User cancelled or error occurred
        handleCopyLink(image);
      }
    } else {
      handleCopyLink(image);
    }
  };

  const handleCopyLink = (image) => {
    navigator.clipboard.writeText(image.url);
    toast.success('Image link copied to clipboard');
  };

  const handleDelete = (image, index) => {
    if (onImageDelete) {
      onImageDelete(image, index);
    }
  };

  const getGridColumns = () => {
    switch (columns) {
      case 2: return 'grid-cols-2';
      case 3: return 'grid-cols-2 md:grid-cols-3';
      case 4: return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
      case 5: return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5';
      default: return 'grid-cols-2 md:grid-cols-3';
    }
  };

  if (images.length === 0 && !showAddButton) {
    return (
      <Card className={className}>
        <CardContent className="text-center py-12">
          <ImageIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No images yet
          </h3>
          <p className="text-gray-500">
            Images will appear here when they're added.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <ImageIcon className="h-5 w-5" />
              <span>{title}</span>
              {images.length > 0 && (
                <Badge variant="secondary">{images.length}</Badge>
              )}
            </CardTitle>
            
            <div className="flex items-center space-x-2">
              {/* View mode toggle */}
              <div className="flex border rounded-lg">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Add button */}
              {showAddButton && onImageAdd && (
                <Button size="sm" onClick={onImageAdd}>
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {images.length === 0 ? (
            <div className="text-center py-8">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 mb-4">No images to display</p>
              {showAddButton && onImageAdd && (
                <Button onClick={onImageAdd}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Images
                </Button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className={cn("grid gap-4", getGridColumns())}>
              {images.map((image, index) => (
                <div key={image.id || index} className="relative group">
                  <div 
                    className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
                    onClick={() => openLightbox(image, index)}
                  >
                    <img
                      src={image.thumbnailUrl || image.url}
                      alt={image.name || `Image ${index + 1}`}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  
                  {/* Overlay actions */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          openLightbox(image, index);
                        }}
                      >
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShare(image);
                        }}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                      
                      {showDeleteButton && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(image, index);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {images.map((image, index) => (
                <div key={image.id || index} className="flex items-center space-x-4 p-3 border rounded-lg hover:bg-gray-50">
                  <img
                    src={image.thumbnailUrl || image.url}
                    alt={image.name || `Image ${index + 1}`}
                    className="w-16 h-16 object-cover rounded cursor-pointer"
                    onClick={() => openLightbox(image, index)}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {image.name || `Image ${index + 1}`}
                    </p>
                    <p className="text-sm text-gray-500">
                      {image.size && `${(image.size / 1024 / 1024).toFixed(2)} MB`}
                      {image.dimensions && ` • ${image.dimensions.width}×${image.dimensions.height}`}
                    </p>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openLightbox(image, index)}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDownload(image)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleShare(image)}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                    
                    {showDeleteButton && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(image, index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lightbox Modal */}
      <Dialog open={!!selectedImage} onOpenChange={closeLightbox}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedImage?.name || `Image ${currentIndex + 1}`}</span>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">
                  {currentIndex + 1} of {images.length}
                </Badge>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="relative">
            {/* Main image */}
            <div className="flex items-center justify-center p-6">
              <img
                src={selectedImage?.url}
                alt={selectedImage?.name || 'Image'}
                className="max-w-full max-h-[60vh] object-contain"
              />
            </div>
            
            {/* Navigation arrows */}
            {images.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute left-4 top-1/2 transform -translate-y-1/2"
                  onClick={() => navigateImage('prev')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2"
                  onClick={() => navigateImage('next')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex items-center justify-between p-6 pt-0 border-t">
            <div className="text-sm text-gray-500">
              {selectedImage?.size && `${(selectedImage.size / 1024 / 1024).toFixed(2)} MB`}
              {selectedImage?.dimensions && ` • ${selectedImage.dimensions.width}×${selectedImage.dimensions.height}`}
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(selectedImage)}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleShare(selectedImage)}
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
              
              {showDeleteButton && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    handleDelete(selectedImage, currentIndex);
                    closeLightbox();
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}