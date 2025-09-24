import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileForm from '../../components/ProfileForm';
import { renderWithProviders, mockProfile, mockUser, cleanup } from '../utils/testUtils';
import * as firestoreModule from '../../lib/firestore';

// Mock the firestore module
jest.mock('../../lib/firestore', () => ({
  profileService: {
    isUsernameAvailable: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  }
}));

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

describe('ProfileForm', () => {
  const mockOnSuccess = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Profile Creation', () => {
    it('renders profile creation form correctly', () => {
      renderWithProviders(<ProfileForm onSuccess={mockOnSuccess} />);
      
      expect(screen.getByText('Complete Your Profile')).toBeInTheDocument();
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/department/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create profile/i })).toBeInTheDocument();
    });

    it('validates required fields', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ProfileForm onSuccess={mockOnSuccess} />);
      
      const submitButton = screen.getByRole('button', { name: /create profile/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/name must be at least 2 characters/i)).toBeInTheDocument();
        expect(screen.getByText(/department is required/i)).toBeInTheDocument();
        expect(screen.getByText(/username is required/i)).toBeInTheDocument();
      });
    });

    it('validates username format', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ProfileForm onSuccess={mockOnSuccess} />);
      
      const usernameField = screen.getByLabelText(/username/i);
      await user.type(usernameField, 'ab'); // Too short
      
      const submitButton = screen.getByRole('button', { name: /create profile/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/username must be 3-20 characters/i)).toBeInTheDocument();
      });
    });

    it('checks username availability', async () => {
      const user = userEvent.setup();
      firestoreModule.profileService.isUsernameAvailable.mockResolvedValue(true);
      
      renderWithProviders(<ProfileForm onSuccess={mockOnSuccess} />);
      
      const usernameField = screen.getByLabelText(/username/i);
      await user.type(usernameField, 'testuser');
      
      await waitFor(() => {
        expect(firestoreModule.profileService.isUsernameAvailable).toHaveBeenCalledWith('testuser', undefined);
        expect(screen.getByText(/username is available/i)).toBeInTheDocument();
      });
    });

    it('shows error when username is not available', async () => {
      const user = userEvent.setup();
      firestoreModule.profileService.isUsernameAvailable.mockResolvedValue(false);
      
      renderWithProviders(<ProfileForm onSuccess={mockOnSuccess} />);
      
      const usernameField = screen.getByLabelText(/username/i);
      await user.type(usernameField, 'takenuser');
      
      await waitFor(() => {
        expect(screen.getByText(/username is not available/i)).toBeInTheDocument();
      });
    });

    it('creates profile successfully', async () => {
      const user = userEvent.setup();
      firestoreModule.profileService.isUsernameAvailable.mockResolvedValue(true);
      firestoreModule.profileService.create.mockResolvedValue(mockProfile);
      
      renderWithProviders(<ProfileForm onSuccess={mockOnSuccess} />);
      
      // Fill form
      await user.type(screen.getByLabelText(/full name/i), 'Test User');
      await user.selectOptions(screen.getByLabelText(/department/i), 'Engineering');
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      
      // Wait for username validation
      await waitFor(() => {
        expect(screen.getByText(/username is available/i)).toBeInTheDocument();
      });
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /create profile/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(firestoreModule.profileService.create).toHaveBeenCalledWith(
          mockUser.uid,
          expect.objectContaining({
            name: 'Test User',
            dept: 'Engineering',
            username: 'testuser',
            email: mockUser.email
          })
        );
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });
  });

  describe('Profile Editing', () => {
    it('renders profile editing form with existing data', () => {
      renderWithProviders(
        <ProfileForm 
          initialData={mockProfile} 
          onSuccess={mockOnSuccess} 
        />
      );
      
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockProfile.name)).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockProfile.username)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /update profile/i })).toBeInTheDocument();
    });

    it('updates profile successfully', async () => {
      const user = userEvent.setup();
      firestoreModule.profileService.isUsernameAvailable.mockResolvedValue(true);
      firestoreModule.profileService.update.mockResolvedValue({});
      
      renderWithProviders(
        <ProfileForm 
          initialData={mockProfile} 
          onSuccess={mockOnSuccess} 
        />
      );
      
      // Update name
      const nameField = screen.getByDisplayValue(mockProfile.name);
      await user.clear(nameField);
      await user.type(nameField, 'Updated Name');
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /update profile/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(firestoreModule.profileService.update).toHaveBeenCalledWith(
          mockUser.uid,
          expect.objectContaining({
            name: 'Updated Name'
          })
        );
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });
  });

  describe('Image Upload', () => {
    it('handles profile picture upload', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ProfileForm onSuccess={mockOnSuccess} />);
      
      const file = new File(['test'], 'profile.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText(/upload profile picture/i).closest('input');
      
      await user.upload(fileInput, file);
      
      // Should show preview (mocked URL.createObjectURL)
      expect(fileInput.files[0]).toBe(file);
    });
  });

  describe('Error Handling', () => {
    it('handles profile creation error', async () => {
      const user = userEvent.setup();
      firestoreModule.profileService.isUsernameAvailable.mockResolvedValue(true);
      firestoreModule.profileService.create.mockRejectedValue(new Error('Creation failed'));
      
      renderWithProviders(<ProfileForm onSuccess={mockOnSuccess} />);
      
      // Fill and submit form
      await user.type(screen.getByLabelText(/full name/i), 'Test User');
      await user.selectOptions(screen.getByLabelText(/department/i), 'Engineering');
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      
      await waitFor(() => {
        expect(screen.getByText(/username is available/i)).toBeInTheDocument();
      });
      
      const submitButton = screen.getByRole('button', { name: /create profile/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(firestoreModule.profileService.create).toHaveBeenCalled();
        expect(mockOnSuccess).not.toHaveBeenCalled();
      });
    });

    it('handles username availability check error', async () => {
      const user = userEvent.setup();
      firestoreModule.profileService.isUsernameAvailable.mockRejectedValue(new Error('Network error'));
      
      renderWithProviders(<ProfileForm onSuccess={mockOnSuccess} />);
      
      const usernameField = screen.getByLabelText(/username/i);
      await user.type(usernameField, 'testuser');
      
      // Should handle error gracefully
      await waitFor(() => {
        expect(firestoreModule.profileService.isUsernameAvailable).toHaveBeenCalled();
      });
    });
  });

  describe('Loading States', () => {
    it('shows loading state during form submission', async () => {
      const user = userEvent.setup();
      firestoreModule.profileService.isUsernameAvailable.mockResolvedValue(true);
      firestoreModule.profileService.create.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 1000))
      );
      
      renderWithProviders(<ProfileForm onSuccess={mockOnSuccess} />);
      
      // Fill form
      await user.type(screen.getByLabelText(/full name/i), 'Test User');
      await user.selectOptions(screen.getByLabelText(/department/i), 'Engineering');
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      
      await waitFor(() => {
        expect(screen.getByText(/username is available/i)).toBeInTheDocument();
      });
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /create profile/i });
      await user.click(submitButton);
      
      // Should show loading state
      expect(screen.getByText(/creating profile/i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it('shows loading state during username check', async () => {
      const user = userEvent.setup();
      firestoreModule.profileService.isUsernameAvailable.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(true), 1000))
      );
      
      renderWithProviders(<ProfileForm onSuccess={mockOnSuccess} />);
      
      const usernameField = screen.getByLabelText(/username/i);
      await user.type(usernameField, 'testuser');
      
      // Should show loading spinner
      await waitFor(() => {
        expect(screen.getByTestId('username-loading')).toBeInTheDocument();
      });
    });
  });
});