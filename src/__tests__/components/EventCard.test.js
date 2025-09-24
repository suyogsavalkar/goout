import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EventCard from '../../components/EventCard';
import { renderWithProviders, mockEvent, mockProfile, mockUser, cleanup } from '../utils/testUtils';

// Mock utils
jest.mock('../../lib/utils', () => ({
  formatEventTime: jest.fn(() => 'Jan 2, 2024 at 2:00 PM'),
  getTimeUntilEvent: jest.fn(() => '2h 30m'),
  cn: jest.fn((...classes) => classes.filter(Boolean).join(' '))
}));

describe('EventCard', () => {
  const mockOnRequestJoin = jest.fn();
  const mockOnViewDetails = jest.fn();
  const mockOnManageEvent = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Basic Rendering', () => {
    it('renders event information correctly', () => {
      renderWithProviders(
        <EventCard 
          event={mockEvent}
          hostProfile={mockProfile}
          onRequestJoin={mockOnRequestJoin}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getByText(mockEvent.name)).toBeInTheDocument();
      expect(screen.getByText(mockEvent.category)).toBeInTheDocument();
      expect(screen.getByText(`Hosted by ${mockProfile.name}`)).toBeInTheDocument();
      expect(screen.getByText('Jan 2, 2024 at 2:00 PM')).toBeInTheDocument();
      expect(screen.getByText('2h 30m')).toBeInTheDocument();
    });

    it('renders event poster when provided', () => {
      renderWithProviders(
        <EventCard 
          event={mockEvent}
          hostProfile={mockProfile}
        />
      );

      const poster = screen.getByAltText(mockEvent.name);
      expect(poster).toBeInTheDocument();
      expect(poster).toHaveAttribute('src', mockEvent.poster_url);
    });

    it('renders location when provided', () => {
      renderWithProviders(
        <EventCard 
          event={mockEvent}
          hostProfile={mockProfile}
        />
      );

      expect(screen.getByText(mockEvent.location)).toBeInTheDocument();
    });

    it('renders attendee count', () => {
      const eventWithAttendees = {
        ...mockEvent,
        approved: ['user1', 'user2', 'user3']
      };

      renderWithProviders(
        <EventCard 
          event={eventWithAttendees}
          hostProfile={mockProfile}
        />
      );

      expect(screen.getByText('3 joined')).toBeInTheDocument();
    });

    it('renders max attendees when specified', () => {
      renderWithProviders(
        <EventCard 
          event={mockEvent}
          hostProfile={mockProfile}
        />
      );

      expect(screen.getByText(`0 joined / ${mockEvent.max_attendees} max`)).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('calls onViewDetails when view details button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <EventCard 
          event={mockEvent}
          hostProfile={mockProfile}
          onViewDetails={mockOnViewDetails}
        />
      );

      const viewDetailsButton = screen.getByRole('button', { name: /view details/i });
      await user.click(viewDetailsButton);

      expect(mockOnViewDetails).toHaveBeenCalledWith(mockEvent);
    });

    it('calls onViewDetails when event title is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <EventCard 
          event={mockEvent}
          hostProfile={mockProfile}
          onViewDetails={mockOnViewDetails}
        />
      );

      const eventTitle = screen.getByText(mockEvent.name);
      await user.click(eventTitle);

      expect(mockOnViewDetails).toHaveBeenCalledWith(mockEvent);
    });

    it('calls onViewDetails when poster is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <EventCard 
          event={mockEvent}
          hostProfile={mockProfile}
          onViewDetails={mockOnViewDetails}
        />
      );

      const poster = screen.getByAltText(mockEvent.name);
      await user.click(poster);

      expect(mockOnViewDetails).toHaveBeenCalledWith(mockEvent);
    });
  });

  describe('Request to Join Functionality', () => {
    it('shows request to join button for non-host users', () => {
      const nonHostUser = { ...mockUser, uid: 'different-user' };
      
      renderWithProviders(
        <EventCard 
          event={mockEvent}
          hostProfile={mockProfile}
          onRequestJoin={mockOnRequestJoin}
        />,
        { user: nonHostUser }
      );

      expect(screen.getByRole('button', { name: /request to join/i })).toBeInTheDocument();
    });

    it('calls onRequestJoin when request button is clicked', async () => {
      const user = userEvent.setup();
      const nonHostUser = { ...mockUser, uid: 'different-user' };
      
      renderWithProviders(
        <EventCard 
          event={mockEvent}
          hostProfile={mockProfile}
          onRequestJoin={mockOnRequestJoin}
        />,
        { user: nonHostUser }
      );

      const requestButton = screen.getByRole('button', { name: /request to join/i });
      await user.click(requestButton);

      expect(mockOnRequestJoin).toHaveBeenCalledWith(mockEvent.id);
    });

    it('shows loading state during request', async () => {
      const user = userEvent.setup();
      const nonHostUser = { ...mockUser, uid: 'different-user' };
      
      mockOnRequestJoin.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 1000))
      );

      renderWithProviders(
        <EventCard 
          event={mockEvent}
          hostProfile={mockProfile}
          onRequestJoin={mockOnRequestJoin}
        />,
        { user: nonHostUser }
      );

      const requestButton = screen.getByRole('button', { name: /request to join/i });
      await user.click(requestButton);

      expect(screen.getByText(/requesting/i)).toBeInTheDocument();
      expect(requestButton).toBeDisabled();
    });

    it('shows pending state when user has requested', () => {
      const nonHostUser = { ...mockUser, uid: 'different-user' };
      const eventWithRequest = {
        ...mockEvent,
        requests: ['different-user']
      };
      
      renderWithProviders(
        <EventCard 
          event={eventWithRequest}
          hostProfile={mockProfile}
        />,
        { user: nonHostUser }
      );

      expect(screen.getByText(/request pending/i)).toBeInTheDocument();
    });

    it('shows joined state when user is approved', () => {
      const nonHostUser = { ...mockUser, uid: 'different-user' };
      const eventWithApproval = {
        ...mockEvent,
        approved: ['different-user']
      };
      
      renderWithProviders(
        <EventCard 
          event={eventWithApproval}
          hostProfile={mockProfile}
        />,
        { user: nonHostUser }
      );

      expect(screen.getByText(/joined/i)).toBeInTheDocument();
    });
  });

  describe('Host Functionality', () => {
    it('shows manage button for event host', () => {
      renderWithProviders(
        <EventCard 
          event={mockEvent}
          hostProfile={mockProfile}
          onManageEvent={mockOnManageEvent}
        />
      );

      expect(screen.getByRole('button', { name: /manage/i })).toBeInTheDocument();
    });

    it('calls onManageEvent when manage button is clicked', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(
        <EventCard 
          event={mockEvent}
          hostProfile={mockProfile}
          onManageEvent={mockOnManageEvent}
        />
      );

      const manageButton = screen.getByRole('button', { name: /manage/i });
      await user.click(manageButton);

      expect(mockOnManageEvent).toHaveBeenCalledWith(mockEvent);
    });

    it('shows pending requests indicator for host', () => {
      const eventWithRequests = {
        ...mockEvent,
        requests: ['user1', 'user2']
      };

      renderWithProviders(
        <EventCard 
          event={eventWithRequests}
          hostProfile={mockProfile}
        />
      );

      expect(screen.getByText(/2 new requests/i)).toBeInTheDocument();
    });

    it('does not show request to join button for host', () => {
      renderWithProviders(
        <EventCard 
          event={mockEvent}
          hostProfile={mockProfile}
          onRequestJoin={mockOnRequestJoin}
        />
      );

      expect(screen.queryByRole('button', { name: /request to join/i })).not.toBeInTheDocument();
    });
  });

  describe('Compact Mode', () => {
    it('renders in compact mode correctly', () => {
      renderWithProviders(
        <EventCard 
          event={mockEvent}
          hostProfile={mockProfile}
          compact={true}
        />
      );

      expect(screen.getByText(mockEvent.name)).toBeInTheDocument();
      expect(screen.getByText(`${mockEvent.category} • 2h 30m`)).toBeInTheDocument();
      expect(screen.getByText('0 joined')).toBeInTheDocument();
    });

    it('calls onViewDetails when compact card is clicked', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(
        <EventCard 
          event={mockEvent}
          hostProfile={mockProfile}
          onViewDetails={mockOnViewDetails}
          compact={true}
        />
      );

      const compactCard = screen.getByText(mockEvent.name).closest('div');
      await user.click(compactCard);

      expect(mockOnViewDetails).toHaveBeenCalledWith(mockEvent);
    });
  });

  describe('Edge Cases', () => {
    it('handles missing host profile gracefully', () => {
      renderWithProviders(
        <EventCard 
          event={mockEvent}
          hostProfile={null}
        />
      );

      expect(screen.getByText(mockEvent.name)).toBeInTheDocument();
      expect(screen.queryByText(/hosted by/i)).not.toBeInTheDocument();
    });

    it('handles missing event poster gracefully', () => {
      const eventWithoutPoster = {
        ...mockEvent,
        poster_url: ''
      };

      renderWithProviders(
        <EventCard 
          event={eventWithoutPoster}
          hostProfile={mockProfile}
        />
      );

      expect(screen.getByText(mockEvent.name)).toBeInTheDocument();
      expect(screen.queryByAltText(mockEvent.name)).not.toBeInTheDocument();
    });

    it('handles missing location gracefully', () => {
      const eventWithoutLocation = {
        ...mockEvent,
        location: ''
      };

      renderWithProviders(
        <EventCard 
          event={eventWithoutLocation}
          hostProfile={mockProfile}
        />
      );

      expect(screen.getByText(mockEvent.name)).toBeInTheDocument();
      expect(screen.queryByText(mockEvent.location)).not.toBeInTheDocument();
    });

    it('returns null when event is not provided', () => {
      const { container } = renderWithProviders(
        <EventCard 
          event={null}
          hostProfile={mockProfile}
        />
      );

      expect(container.firstChild).toBeNull();
    });
  });
});