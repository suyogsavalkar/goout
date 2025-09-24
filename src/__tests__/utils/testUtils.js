import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';

// Mock Firebase
export const mockFirebase = {
  auth: {
    currentUser: null,
    signInWithPopup: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChanged: jest.fn()
  },
  firestore: {
    collection: jest.fn(),
    doc: jest.fn(),
    addDoc: jest.fn(),
    updateDoc: jest.fn(),
    deleteDoc: jest.fn(),
    getDoc: jest.fn(),
    getDocs: jest.fn(),
    onSnapshot: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
    serverTimestamp: jest.fn(() => new Date()),
    Timestamp: {
      fromDate: jest.fn(date => ({ toDate: () => date }))
    }
  },
  storage: {
    ref: jest.fn(),
    uploadBytes: jest.fn(),
    getDownloadURL: jest.fn(),
    deleteObject: jest.fn()
  }
};

// Mock user data
export const mockUser = {
  uid: 'test-user-123',
  email: 'test@umich.edu',
  displayName: 'Test User',
  photoURL: 'https://example.com/photo.jpg'
};

export const mockProfile = {
  id: 'test-user-123',
  name: 'Test User',
  username: 'testuser',
  email: 'test@umich.edu',
  dept: 'Engineering',
  profile_pic_url: 'https://example.com/profile.jpg',
  profile_cover_photo: '',
  you_met: [],
  events: [],
  photos: [],
  created_at: { toDate: () => new Date('2024-01-01') },
  updated_at: { toDate: () => new Date('2024-01-01') }
};

export const mockEvent = {
  id: 'test-event-123',
  name: 'Test Event',
  category: 'Social',
  description: 'A test event',
  location: 'Test Location',
  host: 'test-user-123',
  poster_url: 'https://example.com/poster.jpg',
  time_created_at: { toDate: () => new Date('2024-01-01') },
  time_event_time: { toDate: () => new Date('2024-01-02') },
  requests: [],
  approved: [],
  max_attendees: 10
};

export const mockNotification = {
  id: 'test-notification-123',
  recipient_id: 'test-user-123',
  sender_id: 'test-sender-456',
  type: 'event_request',
  event_id: 'test-event-123',
  message: 'Someone wants to join your event',
  read: false,
  created_at: { toDate: () => new Date('2024-01-01') }
};

// Test wrapper components
export const TestAuthProvider = ({ children, user = mockUser }) => {
  const mockAuthContext = {
    user,
    loading: false,
    login: jest.fn(),
    logout: jest.fn()
  };

  return (
    <div data-testid="auth-provider">
      {children}
    </div>
  );
};

// Custom render function with providers
export const renderWithProviders = (ui, options = {}) => {
  const { user = mockUser, ...renderOptions } = options;

  const Wrapper = ({ children }) => (
    <TestAuthProvider user={user}>
      {children}
    </TestAuthProvider>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Utility functions for testing
export const createMockFile = (name = 'test.jpg', type = 'image/jpeg', size = 1024) => {
  const file = new File(['test content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

export const createMockFileList = (files) => {
  const fileList = {
    length: files.length,
    item: (index) => files[index],
    [Symbol.iterator]: function* () {
      for (let i = 0; i < files.length; i++) {
        yield files[i];
      }
    }
  };
  
  files.forEach((file, index) => {
    fileList[index] = file;
  });
  
  return fileList;
};

export const mockIntersectionObserver = () => {
  global.IntersectionObserver = jest.fn().mockImplementation((callback) => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
    root: null,
    rootMargin: '',
    thresholds: []
  }));
};

export const mockResizeObserver = () => {
  global.ResizeObserver = jest.fn().mockImplementation((callback) => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn()
  }));
};

export const mockMatchMedia = () => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
};

export const mockLocalStorage = () => {
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };
  
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
  });
  
  return localStorageMock;
};

export const mockSessionStorage = () => {
  const sessionStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };
  
  Object.defineProperty(window, 'sessionStorage', {
    value: sessionStorageMock
  });
  
  return sessionStorageMock;
};

// Wait for async operations
export const waitForLoadingToFinish = () => {
  return waitFor(() => {
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });
};

// Form testing utilities
export const fillForm = async (formData) => {
  const user = userEvent.setup();
  
  for (const [fieldName, value] of Object.entries(formData)) {
    const field = screen.getByLabelText(new RegExp(fieldName, 'i'));
    await user.clear(field);
    await user.type(field, value);
  }
};

export const submitForm = async () => {
  const user = userEvent.setup();
  const submitButton = screen.getByRole('button', { name: /submit|create|save/i });
  await user.click(submitButton);
};

// Error testing utilities
export const expectErrorMessage = (message) => {
  expect(screen.getByText(message)).toBeInTheDocument();
};

export const expectSuccessMessage = (message) => {
  expect(screen.getByText(message)).toBeInTheDocument();
};

// Mock timers
export const setupMockTimers = () => {
  jest.useFakeTimers();
  return {
    advanceTimers: (ms) => jest.advanceTimersByTime(ms),
    runAllTimers: () => jest.runAllTimers(),
    cleanup: () => jest.useRealTimers()
  };
};

// Network mocking
export const mockFetch = (responses = {}) => {
  global.fetch = jest.fn().mockImplementation((url) => {
    const response = responses[url] || { ok: true, json: () => Promise.resolve({}) };
    return Promise.resolve(response);
  });
};

// Console mocking
export const mockConsole = () => {
  const originalConsole = { ...console };
  
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
  console.info = jest.fn();
  
  return {
    restore: () => {
      Object.assign(console, originalConsole);
    }
  };
};

// Cleanup utilities
export const cleanup = () => {
  jest.clearAllMocks();
  jest.useRealTimers();
};

export * from '@testing-library/react';
export { userEvent };