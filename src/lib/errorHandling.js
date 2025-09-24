import { toast } from 'sonner';

// Error types
export const ERROR_TYPES = {
  NETWORK: 'NETWORK_ERROR',
  AUTHENTICATION: 'AUTH_ERROR',
  AUTHORIZATION: 'PERMISSION_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND_ERROR',
  SERVER: 'SERVER_ERROR',
  CLIENT: 'CLIENT_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
};

// Error severity levels
export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Custom error classes
export class AppError extends Error {
  constructor(message, type = ERROR_TYPES.UNKNOWN, severity = ERROR_SEVERITY.MEDIUM, details = {}) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.severity = severity;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

export class NetworkError extends AppError {
  constructor(message, details = {}) {
    super(message, ERROR_TYPES.NETWORK, ERROR_SEVERITY.MEDIUM, details);
    this.name = 'NetworkError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message, details = {}) {
    super(message, ERROR_TYPES.AUTHENTICATION, ERROR_SEVERITY.HIGH, details);
    this.name = 'AuthenticationError';
  }
}

export class ValidationError extends AppError {
  constructor(message, details = {}) {
    super(message, ERROR_TYPES.VALIDATION, ERROR_SEVERITY.LOW, details);
    this.name = 'ValidationError';
  }
}

// Error handler service
class ErrorHandlerService {
  constructor() {
    this.errorQueue = [];
    this.isOnline = navigator.onLine;
    this.setupNetworkListeners();
  }

  setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processErrorQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  // Handle different types of errors
  handleError(error, context = {}) {
    const processedError = this.processError(error, context);
    
    // Log error
    this.logError(processedError);
    
    // Show user notification
    this.showUserNotification(processedError);
    
    // Report to monitoring service
    this.reportError(processedError);
    
    return processedError;
  }

  processError(error, context) {
    let processedError;

    if (error instanceof AppError) {
      processedError = error;
    } else if (error.code) {
      // Firebase/Firestore errors
      processedError = this.processFirebaseError(error);
    } else if (error.response) {
      // HTTP errors
      processedError = this.processHttpError(error);
    } else {
      // Generic JavaScript errors
      processedError = new AppError(
        error.message || 'An unexpected error occurred',
        ERROR_TYPES.UNKNOWN,
        ERROR_SEVERITY.MEDIUM,
        { originalError: error, context }
      );
    }

    // Add context information
    processedError.details = {
      ...processedError.details,
      ...context,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };

    return processedError;
  }

  processFirebaseError(error) {
    const errorMap = {
      'auth/user-not-found': {
        message: 'User account not found',
        type: ERROR_TYPES.AUTHENTICATION,
        severity: ERROR_SEVERITY.MEDIUM
      },
      'auth/wrong-password': {
        message: 'Invalid password',
        type: ERROR_TYPES.AUTHENTICATION,
        severity: ERROR_SEVERITY.MEDIUM
      },
      'auth/email-already-in-use': {
        message: 'Email address is already registered',
        type: ERROR_TYPES.VALIDATION,
        severity: ERROR_SEVERITY.LOW
      },
      'auth/weak-password': {
        message: 'Password is too weak',
        type: ERROR_TYPES.VALIDATION,
        severity: ERROR_SEVERITY.LOW
      },
      'auth/network-request-failed': {
        message: 'Network connection failed',
        type: ERROR_TYPES.NETWORK,
        severity: ERROR_SEVERITY.MEDIUM
      },
      'permission-denied': {
        message: 'You don\'t have permission to perform this action',
        type: ERROR_TYPES.AUTHORIZATION,
        severity: ERROR_SEVERITY.HIGH
      },
      'not-found': {
        message: 'The requested resource was not found',
        type: ERROR_TYPES.NOT_FOUND,
        severity: ERROR_SEVERITY.MEDIUM
      },
      'unavailable': {
        message: 'Service is temporarily unavailable',
        type: ERROR_TYPES.NETWORK,
        severity: ERROR_SEVERITY.HIGH
      }
    };

    const errorInfo = errorMap[error.code] || {
      message: error.message || 'An error occurred',
      type: ERROR_TYPES.SERVER,
      severity: ERROR_SEVERITY.MEDIUM
    };

    return new AppError(
      errorInfo.message,
      errorInfo.type,
      errorInfo.severity,
      { firebaseCode: error.code, originalError: error }
    );
  }

  processHttpError(error) {
    const status = error.response?.status;
    const statusText = error.response?.statusText;

    let type, severity, message;

    if (status >= 400 && status < 500) {
      type = ERROR_TYPES.CLIENT;
      severity = status === 401 ? ERROR_SEVERITY.HIGH : ERROR_SEVERITY.MEDIUM;
      message = status === 401 ? 'Authentication required' :
                status === 403 ? 'Access forbidden' :
                status === 404 ? 'Resource not found' :
                'Client error occurred';
    } else if (status >= 500) {
      type = ERROR_TYPES.SERVER;
      severity = ERROR_SEVERITY.HIGH;
      message = 'Server error occurred';
    } else {
      type = ERROR_TYPES.NETWORK;
      severity = ERROR_SEVERITY.MEDIUM;
      message = 'Network error occurred';
    }

    return new AppError(
      message,
      type,
      severity,
      { 
        status, 
        statusText, 
        response: error.response?.data,
        originalError: error 
      }
    );
  }

  logError(error) {
    const logLevel = this.getLogLevel(error.severity);
    const logMessage = `[${error.type}] ${error.message}`;
    
    console[logLevel](logMessage, {
      error: error,
      details: error.details,
      stack: error.stack
    });
  }

  getLogLevel(severity) {
    switch (severity) {
      case ERROR_SEVERITY.LOW:
        return 'info';
      case ERROR_SEVERITY.MEDIUM:
        return 'warn';
      case ERROR_SEVERITY.HIGH:
      case ERROR_SEVERITY.CRITICAL:
        return 'error';
      default:
        return 'log';
    }
  }

  showUserNotification(error) {
    const shouldShowToUser = this.shouldShowToUser(error);
    
    if (!shouldShowToUser) return;

    const toastType = this.getToastType(error.severity);
    const message = this.getUserFriendlyMessage(error);

    toast[toastType](message, {
      duration: this.getToastDuration(error.severity),
      action: error.type === ERROR_TYPES.NETWORK ? {
        label: 'Retry',
        onClick: () => window.location.reload()
      } : undefined
    });
  }

  shouldShowToUser(error) {
    // Don't show validation errors as toasts (they're shown inline)
    if (error.type === ERROR_TYPES.VALIDATION) return false;
    
    // Don't show low severity errors
    if (error.severity === ERROR_SEVERITY.LOW) return false;
    
    return true;
  }

  getToastType(severity) {
    switch (severity) {
      case ERROR_SEVERITY.LOW:
        return 'info';
      case ERROR_SEVERITY.MEDIUM:
        return 'warning';
      case ERROR_SEVERITY.HIGH:
      case ERROR_SEVERITY.CRITICAL:
        return 'error';
      default:
        return 'info';
    }
  }

  getUserFriendlyMessage(error) {
    // Return user-friendly messages
    const friendlyMessages = {
      [ERROR_TYPES.NETWORK]: 'Connection problem. Please check your internet and try again.',
      [ERROR_TYPES.AUTHENTICATION]: 'Please sign in to continue.',
      [ERROR_TYPES.AUTHORIZATION]: 'You don\'t have permission to do that.',
      [ERROR_TYPES.NOT_FOUND]: 'The item you\'re looking for wasn\'t found.',
      [ERROR_TYPES.SERVER]: 'Server error. Please try again later.',
      [ERROR_TYPES.VALIDATION]: error.message
    };

    return friendlyMessages[error.type] || error.message || 'Something went wrong. Please try again.';
  }

  getToastDuration(severity) {
    switch (severity) {
      case ERROR_SEVERITY.LOW:
        return 3000;
      case ERROR_SEVERITY.MEDIUM:
        return 5000;
      case ERROR_SEVERITY.HIGH:
        return 7000;
      case ERROR_SEVERITY.CRITICAL:
        return 10000;
      default:
        return 5000;
    }
  }

  reportError(error) {
    if (!this.isOnline) {
      this.errorQueue.push(error);
      return;
    }

    // In a real app, send to error reporting service
    this.sendToErrorService(error);
  }

  sendToErrorService(error) {
    // Example: Send to Sentry, LogRocket, etc.
    console.log('Reporting error to monitoring service:', {
      message: error.message,
      type: error.type,
      severity: error.severity,
      details: error.details,
      stack: error.stack
    });

    // Example implementation:
    // Sentry.captureException(error, {
    //   tags: {
    //     type: error.type,
    //     severity: error.severity
    //   },
    //   extra: error.details
    // });
  }

  processErrorQueue() {
    while (this.errorQueue.length > 0) {
      const error = this.errorQueue.shift();
      this.sendToErrorService(error);
    }
  }

  // Retry mechanism for failed operations
  async retryOperation(operation, maxRetries = 3, delay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries) {
          throw this.handleError(error, { 
            operation: operation.name,
            attempts: attempt 
          });
        }
        
        // Exponential backoff
        await new Promise(resolve => 
          setTimeout(resolve, delay * Math.pow(2, attempt - 1))
        );
      }
    }
  }
}

// Create singleton instance
export const errorHandler = new ErrorHandlerService();

// Utility functions
export const handleAsyncError = (error, context = {}) => {
  return errorHandler.handleError(error, context);
};

export const retryOperation = (operation, maxRetries, delay) => {
  return errorHandler.retryOperation(operation, maxRetries, delay);
};

// React hook for error handling
export const useErrorHandler = () => {
  const handleError = (error, context = {}) => {
    return errorHandler.handleError(error, context);
  };

  const retry = (operation, maxRetries, delay) => {
    return errorHandler.retryOperation(operation, maxRetries, delay);
  };

  return { handleError, retry };
};