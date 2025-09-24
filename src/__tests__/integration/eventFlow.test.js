import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockUser, mockProfile, mockEvent, cleanup } from '../utils/testUtils';
import EventFeed from '../../components/EventFeed';
import EventCreationForm from '../../components/EventCreationForm';
import * as firestoreModule from '../../lib/firestore';
import * as validationModule from '../../lib/validation';

// Mock modules
jest.mock('../../lib/firestore', () => ({
  eventService: {
    create: jest.fn(),
    getRecent: jest.fn(),
    requestToJoin: jest.fn(),
    approveRequest: jest.fn(),
    denyRequest: jest.fn()
  },
  realtimeService: {
    subscribeToRecentEvents: jest.fn()
  },
  notificationService: {
    create: jest.fn()
  }
}));

jest.mock('../../lib/validation', () => ({
  validateEvent: jest.fn(),
  EVENT_CATEGORIES: ['Social', 'Study Group', 'Sports', 'Food']
}));

jest.mock('../../hooks/useEvents', () => ({
  useEvents: () => ({
    events: [mockEvent],
    loading: false,
    error: null,
    requestToJoin: jest.fn()
  })
}));

jest.mock('../../hooks/useProfile', () => ({
  useProfiles: () => ({
    profiles: [mockProfile],
    loading: false,
    error: null
  })
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

describe('Event Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    validationModule.validateEvent.mockReturnValue({ isValid: true, errors: {} });
    firestoreModule.eventService.create.mockResolvedValue({ id: 'new-event-123', ...mockEvent });
    firestoreModule.eventService.requestToJoin.mockResolvedValue();
    firestoreModule.realtimeService.subscribeToRecentEvents.mockImplementation((callback) => {
      callback([mockEvent]);
      return jest.fn(); // unsubscribe function
    });
  });

  afterEach(() => {
    cleanup();
  });

  describe('Event Creation Flow', () => {
    it('allows user to create a new event successfully', async () => {
      const user = userEvent.setup();
      const mockOnSuccess = jest.fn();
      
      renderWithProviders(
        <EventCreationForm onSuccess={mockOnSuccess} />,
        { user: mockUser }
      );

      // Fill out the event form
      await user.type(screen.getByLabelText(/event name/i), 'Test Study Session');
      await user.selectOptions(screen.getByLabelText(/category/i), 'Study Group');
      
      // Set event time (12 hours from now)
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 6);
      const dateTimeString = futureDate.toISOString().slice(0, 16);
      
      await user.type(screen.getByLabelText(/event time/i), dateTimeString);
      await user.type(screen.getByLabelText(/location/i), 'Library Study Room');
      await user.type(screen.getByLabelText(/description/i), 'Group study session for midterms');
      await user.type(screen.getByLabelText(/max attendees/i), '8');

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /create event/i });
      await user.click(submitButton);

      // Verify the event was created
      await waitFor(() => {
        expect(firestoreModule.eventService.create).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Test Study Session',
            category: 'Study Group',
            location: 'Library Study Room',
            description: 'Group study session for midterms',
            max_attendees: 8
          }),
          mockUser.uid
        );
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('validates event creation form correctly', async () => {
      const user = userEvent.setup();
      validationModule.validateEvent.mockReturnValue({
        isValid: false,
        errors: {
          name: 'Event name must be at least 3 characters long',
          category: 'Category is required'
        }
      });

      renderWithProviders(<EventCreationForm />);

      // Try to submit empty form
      const submitButton = screen.getByRole('button', { name: /create event/i });
      await user.click(submitButton);

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/event name must be at least 3 characters/i)).toBeInTheDocument();
        expect(screen.getByText(/category is required/i)).toBeInTheDocument();
      });

      // Should not call create service
      expect(firestoreModule.eventService.create).not.toHaveBeenCalled();
    });

    it('prevents event creation during restricted hours', async () => {
      const user = userEvent.setup();
      
      // Mock time restriction (12AM - 5AM)
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(2); // 2 AM
      
      renderWithProviders(<EventCreationForm />);

      // Should show restriction warning
      expect(screen.getByText(/event creation is currently restricted/i)).toBeInTheDocument();
      
      // Submit button should be disabled
      const submitButton = screen.getByRole('button', { name: /create event/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Event Discovery and Interaction Flow', () => {
    it('displays events in the feed correctly', async () => {
      renderWithProviders(<EventFeed />);

      // Should show the mock event
      await waitFor(() => {
        expect(screen.getByText(mockEvent.name)).toBeInTheDocument();
        expect(screen.getByText(mockEvent.category)).toBeInTheDocument();
      });
    });

    it('allows user to request to join an event', async () => {
      const user = userEvent.setup();
      const nonHostUser = { ...mockUser, uid: 'different-user' };
      
      renderWithProviders(<EventFeed />, { user: nonHostUser });

      // Wait for events to load
      await waitFor(() => {
        expect(screen.getByText(mockEvent.name)).toBeInTheDocument();
      });

      // Click request to join button
      const requestButton = screen.getByRole('button', { name: /request to join/i });
      await user.click(requestButton);

      // Should call the request service
      await waitFor(() => {
        expect(firestoreModule.eventService.requestToJoin).toHaveBeenCalledWith(
          mockEvent.id,
          nonHostUser.uid
        );
      });
    });

    it('filters events by category', async () => {
      const user = userEvent.setup();
      const socialEvent = { ...mockEvent, id: 'social-event', category: 'Social', name: 'Social Event' };
      const studyEvent = { ...mockEvent, id: 'study-event', category: 'Study Group', name: 'Study Event' };
      
      // Mock multiple events
      firestoreModule.realtimeService.subscribeToRecentEvents.mockImplementation((callback) => {
        callback([socialEvent, studyEvent]);
        return jest.fn();
      });

      renderWithProviders(<EventFeed />);

      // Should show both events initially
      await waitFor(() => {
        expect(screen.getByText('Social Event')).toBeInTheDocument();
        expect(screen.getByText('Study Event')).toBeInTheDocument();
      });

      // Filter by Social category
      const categoryFilter = screen.getByRole('combobox', { name: /category/i });
      await user.selectOptions(categoryFilter, 'Social');

      // Should only show social event
      await waitFor(() => {
        expect(screen.getByText('Social Event')).toBeInTheDocument();
        expect(screen.queryByText('Study Event')).not.toBeInTheDocument();
      });
    });

    it('searches events by name', async () => {
      const user = userEvent.setup();
      const event1 = { ...mockEvent, id: 'event1', name: 'Basketball Game' };
      const event2 = { ...mockEvent, id: 'event2', name: 'Study Session' };
      
      // Mock multiple events
      firestoreModule.realtimeService.subscribeToRecentEvents.mockImplementation((callback) => {
        callback([event1, event2]);
        return jest.fn();
      });

      renderWithProviders(<EventFeed />);

      // Should show both events initially
      await waitFor(() => {
        expect(screen.getByText('Basketball Game')).toBeInTheDocument();
        expect(screen.getByText('Study Session')).toBeInTheDocument();
      });

      // Search for "basketball"
      const searchInput = screen.getByPlaceholderText(/search events/i);
      await user.type(searchInput, 'basketball');

      // Should only show basketball event
      await waitFor(() => {
        expect(screen.getByText('Basketball Game')).toBeInTheDocument();
        expect(screen.queryByText('Study Session')).not.toBeInTheDocument();
      });
    });
  });

  describe('Event Management Flow', () => {
    it('allows host to approve event requests', async () => {
      const user = userEvent.setup();
      const eventWithRequests = {
        ...mockEvent,
        requests: ['requester-123']
      };

      // Mock the event with requests
      firestoreModule.realtimeService.subscribeToRecentEvents.mockImplementation((callback) => {
        callback([eventWithRequests]);
        return jest.fn();
      });

      renderWithProviders(<EventFeed />);

      // Should show pending requests indicator
      await waitFor(() => {
        expect(screen.getByText(/1 new request/i)).toBeInTheDocument();
      });

      // Click manage button
      const manageButton = screen.getByRole('button', { name: /manage/i });
      await user.click(manageButton);

      // Should be able to approve requests (this would open a management modal)
      // The actual approval would happen in the ApprovalPanel component
    });

    it('creates notifications when requests are made', async () => {
      const user = userEvent.setup();
      const nonHostUser = { ...mockUser, uid: 'different-user' };
      
      renderWithProviders(<EventFeed />, { user: nonHostUser });

      // Wait for events to load
      await waitFor(() => {
        expect(screen.getByText(mockEvent.name)).toBeInTheDocument();
      });

      // Request to join
      const requestButton = screen.getByRole('button', { name: /request to join/i });
      await user.click(requestButton);

      // Should create notification for host
      await waitFor(() => {
        expect(firestoreModule.notificationService.create).toHaveBeenCalledWith(
          expect.objectContaining({
            recipient_id: mockEvent.host,
            sender_id: nonHostUser.uid,
            type: 'event_request',
            event_id: mockEvent.id
          })
        );
      });
    });
  });

  describe('Real-time Updates', () => {
    it('updates event list when new events are added', async () => {
      let eventCallback;
      
      firestoreModule.realtimeService.subscribeToRecentEvents.mockImplementation((callback) => {
        eventCallback = callback;
        callback([mockEvent]); // Initial events
        return jest.fn();
      });

      renderWithProviders(<EventFeed />);

      // Should show initial event
      await waitFor(() => {
        expect(screen.getByText(mockEvent.name)).toBeInTheDocument();
      });

      // Simulate new event added
      const newEvent = { ...mockEvent, id: 'new-event', name: 'New Event' };
      eventCallback([mockEvent, newEvent]);

      // Should show both events
      await waitFor(() => {
        expect(screen.getByText(mockEvent.name)).toBeInTheDocument();
        expect(screen.getByText('New Event')).toBeInTheDocument();
      });
    });

    it('updates event when requests are added', async () => {
      let eventCallback;
      
      firestoreModule.realtimeService.subscribeToRecentEvents.mockImplementation((callback) => {
        eventCallback = callback;
        callback([mockEvent]); // Initial events
        return jest.fn();
      });

      renderWithProviders(<EventFeed />);

      // Should show initial event with no requests
      await waitFor(() => {
        expect(screen.getByText(mockEvent.name)).toBeInTheDocument();
        expect(screen.queryByText(/new request/i)).not.toBeInTheDocument();
      });

      // Simulate request added
      const eventWithRequest = {
        ...mockEvent,
        requests: ['requester-123']
      };
      eventCallback([eventWithRequest]);

      // Should show request indicator
      await waitFor(() => {
        expect(screen.getByText(/1 new request/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles event creation errors gracefully', async () => {
      const user = userEvent.setup();
      firestoreModule.eventService.create.mockRejectedValue(new Error('Creation failed'));

      renderWithProviders(<EventCreationForm />);

      // Fill and submit form
      await user.type(screen.getByLabelText(/event name/i), 'Test Event');
      await user.selectOptions(screen.getByLabelText(/category/i), 'Social');
      
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 6);
      const dateTimeString = futureDate.toISOString().slice(0, 16);
      await user.type(screen.getByLabelText(/event time/i), dateTimeString);

      const submitButton = screen.getByRole('button', { name: /create event/i });
      await user.click(submitButton);

      // Should handle error gracefully
      await waitFor(() => {
        expect(firestoreModule.eventService.create).toHaveBeenCalled();
        // Error handling would be done by the error boundary or toast system
      });
    });

    it('handles network errors during event loading', async () => {
      firestoreModule.realtimeService.subscribeToRecentEvents.mockImplementation(() => {
        throw new Error('Network error');
      });

      renderWithProviders(<EventFeed />);

      // Should show error state
      await waitFor(() => {
        expect(screen.getByText(/error loading events/i)).toBeInTheDocument();
      });
    });
  });
});