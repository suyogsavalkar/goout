"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, Loader2, Check, X } from 'lucide-react';
import { profileService } from '@/lib/firestore';
import { validateProfile, UM_DEPARTMENTS } from '@/lib/validation';
import { uploadProfilePicture, uploadCoverPhoto } from '@/lib/storage';
import { toast } from 'sonner';

export default function ProfileForm({ initialData = null, onSuccess = null }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    dept: '',
    username: '',
    profile_pic_url: '',
    profile_cover_photo: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [coverImage, setCoverImage] = useState(null);

  // Initialize form with existing data
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        dept: initialData.dept || '',
        username: initialData.username || '',
        profile_pic_url: initialData.profile_pic_url || '',
        profile_cover_photo: initialData.profile_cover_photo || ''
      });
    } else if (user && !formData.name) {
      // Auto-generate username from email (part before @) if not already set
      const autoUsername = user.email ? user.email.split('@')[0].toLowerCase() : '';
      setFormData(prev => ({
        ...prev,
        name: user.displayName || '',
        profile_pic_url: user.photoURL || '',
        username: prev.username || autoUsername // Only set if not already set
      }));
    }
  }, [initialData?.id, user?.uid, user?.displayName, user?.photoURL, user?.email]); // Be specific about dependencies

  // Check username availability with debounce
  useEffect(() => {
    if (!formData.username || formData.username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setUsernameChecking(true);
      try {
        const available = await profileService.isUsernameAvailable(
          formData.username,
          initialData?.id
        );
        setUsernameAvailable(available);
      } catch (error) {
        console.error('Error checking username:', error);
        setUsernameAvailable(null);
      } finally {
        setUsernameChecking(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.username, initialData?.id]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleImageUpload = (file, type) => {
    if (!file) return;

    if (type === 'profile') {
      // Clean up previous blob URL
      if (formData.profile_pic_url && formData.profile_pic_url.startsWith('blob:')) {
        URL.revokeObjectURL(formData.profile_pic_url);
      }
      setProfileImage(file);
      // Show preview
      const imageUrl = URL.createObjectURL(file);
      handleInputChange('profile_pic_url', imageUrl);
    } else {
      // Clean up previous blob URL
      if (formData.profile_cover_photo && formData.profile_cover_photo.startsWith('blob:')) {
        URL.revokeObjectURL(formData.profile_cover_photo);
      }
      setCoverImage(file);
      // Show preview
      const imageUrl = URL.createObjectURL(file);
      handleInputChange('profile_cover_photo', imageUrl);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error('You must be logged in to create a profile');
      return;
    }

    // Validate form
    const validation = validateProfile({
      ...formData,
      email: user.email
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    // Check username availability
    if (usernameAvailable === false) {
      setErrors({ username: 'Username is not available' });
      return;
    }

    setLoading(true);

    try {
      let profileData = {
        ...formData,
        email: user.email
      };

      // Upload images if they exist
      if (profileImage) {
        toast.info('Uploading profile picture...');
        const profilePicUrl = await uploadProfilePicture(profileImage, user.uid);
        profileData.profile_pic_url = profilePicUrl;
      }

      if (coverImage) {
        toast.info('Uploading cover photo...');
        const coverPhotoUrl = await uploadCoverPhoto(coverImage, user.uid);
        profileData.profile_cover_photo = coverPhotoUrl;
      }

      if (initialData) {
        await profileService.update(user.uid, profileData);
        toast.success('Profile updated successfully!');
      } else {
        await profileService.create(user.uid, profileData);
        toast.success('Profile created successfully!');
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error(error.message || 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getUsernameStatus = () => {
    if (usernameChecking) {
      return <Loader2 className="h-4 w-4 animate-spin text-gray-500" />;
    }
    if (usernameAvailable === true) {
      return <Check className="h-4 w-4 text-green-500" />;
    }
    if (usernameAvailable === false) {
      return <X className="h-4 w-4 text-red-500" />;
    }
    return null;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {initialData ? 'Edit Profile' : 'Complete Your Profile'}
        </CardTitle>
        <CardDescription>
          {initialData
            ? 'Update your profile information'
            : 'Tell other students about yourself to get started'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Picture */}
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={formData.profile_pic_url} />
              <AvatarFallback>
                {formData.name ? formData.name.charAt(0).toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <Label htmlFor="profile-pic" className="cursor-pointer">
                <div className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800">
                  <Upload className="h-4 w-4" />
                  <span>Upload Profile Picture</span>
                </div>
              </Label>
              <input
                id="profile-pic"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageUpload(e.target.files[0], 'profile')}
              />
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter your full name"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Department */}
          <div className="space-y-2">
            <Label htmlFor="dept">Department/School *</Label>
            <Select
              value={formData.dept}
              onValueChange={(value) => handleInputChange('dept', value)}
            >
              <SelectTrigger className={errors.dept ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select your department" />
              </SelectTrigger>
              <SelectContent>
                {UM_DEPARTMENTS.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.dept && (
              <p className="text-sm text-red-500">{errors.dept}</p>
            )}
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">Username *</Label>
            <div className="relative">
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value.toLowerCase())}
                placeholder="Choose a unique username"
                className={errors.username || usernameAvailable === false ? 'border-red-500 pr-10' : 'pr-10'}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {getUsernameStatus()}
              </div>
            </div>
            {errors.username && (
              <p className="text-sm text-red-500">{errors.username}</p>
            )}
            {usernameAvailable === false && !errors.username && (
              <p className="text-sm text-red-500">Username is not available</p>
            )}
            {usernameAvailable === true && (
              <p className="text-sm text-green-500">Username is available</p>
            )}
            <p className="text-xs text-gray-500">
              3-20 characters, letters, numbers, and underscores only
            </p>
          </div>

          {/* Cover Photo */}
          <div className="space-y-2">
            <Label htmlFor="cover-photo">Cover Photo (Optional)</Label>
            {formData.profile_cover_photo && (
              <div className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={formData.profile_cover_photo}
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div>
              <Label htmlFor="cover-photo-input" className="cursor-pointer">
                <div className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800">
                  <Upload className="h-4 w-4" />
                  <span>Upload Cover Photo</span>
                </div>
              </Label>
              <input
                id="cover-photo-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageUpload(e.target.files[0], 'cover')}
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={loading || usernameChecking || usernameAvailable === false}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {initialData ? 'Updating...' : 'Creating Profile...'}
              </>
            ) : (
              initialData ? 'Update Profile' : 'Create Profile'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}