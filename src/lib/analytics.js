// Analytics and monitoring for production

class AnalyticsManager {
  constructor() {
    this.isInitialized = false;
    this.queue = [];
    this.sessionId = this.generateSessionId();
    this.userId = null;
    this.startTime = Date.now();
  }

  // Initialize analytics
  init(config = {}) {
    if (this.isInitialized) return;

    this.config = {
      enableGoogleAnalytics: false,
      enableCustomAnalytics: true,
      enableErrorTracking: true,
      enablePerformanceTracking: true,
      ...config
    };

    // Initialize Google Analytics if enabled
    if (this.config.enableGoogleAnalytics && this.config.gaTrackingId) {
      this.initGoogleAnalytics();
    }

    // Initialize custom analytics
    if (this.config.enableCustomAnalytics) {
      this.initCustomAnalytics();
    }

    // Initialize error tracking
    if (this.config.enableErrorTracking) {
      this.initErrorTracking();
    }

    // Initialize performance tracking
    if (this.config.enablePerformanceTracking) {
      this.initPerformanceTracking();
    }

    this.isInitialized = true;
    this.processQueue();
  }

  // Generate unique session ID
  generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Set user ID for tracking
  setUserId(userId) {
    this.userId = userId;
    this.track('user_identified', { userId });
  }

  // Track events
  track(eventName, properties = {}) {
    const event = {
      name: eventName,
      properties: {
        ...properties,
        sessionId: this.sessionId,
        userId: this.userId,
        timestamp: Date.now(),
        url: typeof window !== 'undefined' ? window.location.href : null,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null
      }
    };

    if (!this.isInitialized) {
      this.queue.push(event);
      return;
    }

    this.sendEvent(event);
  }

  // Track page views
  trackPageView(page, title) {
    this.track('page_view', {
      page,
      title,
      referrer: typeof document !== 'undefined' ? document.referrer : null
    });
  }

  // Track user interactions
  trackClick(element, properties = {}) {
    this.track('click', {
      element: element.tagName,
      text: element.textContent?.slice(0, 100),
      className: element.className,
      id: element.id,
      ...properties
    });
  }

  // Track form submissions
  trackFormSubmit(formName, properties = {}) {
    this.track('form_submit', {
      formName,
      ...properties
    });
  }

  // Track errors
  trackError(error, context = {}) {
    this.track('error', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      context,
      url: typeof window !== 'undefined' ? window.location.href : null
    });
  }

  // Track performance metrics
  trackPerformance(metric, value, context = {}) {
    this.track('performance', {
      metric,
      value,
      context
    });
  }

  // Track user engagement
  trackEngagement() {
    const timeOnPage = Date.now() - this.startTime;
    this.track('engagement', {
      timeOnPage,
      scrollDepth: this.getScrollDepth(),
      clickCount: this.getClickCount()
    });
  }

  // Initialize Google Analytics
  initGoogleAnalytics() {
    if (typeof window === 'undefined') return;

    // Load Google Analytics script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.config.gaTrackingId}`;
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    window.gtag = gtag;

    gtag('js', new Date());
    gtag('config', this.config.gaTrackingId, {
      page_title: document.title,
      page_location: window.location.href
    });
  }

  // Initialize custom analytics
  initCustomAnalytics() {
    // Set up custom event listeners
    if (typeof window !== 'undefined') {
      // Track clicks
      document.addEventListener('click', (e) => {
        this.trackClick(e.target);
      });

      // Track page visibility
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.trackEngagement();
        }
      });

      // Track before unload
      window.addEventListener('beforeunload', () => {
        this.trackEngagement();
      });
    }
  }

  // Initialize error tracking
  initErrorTracking() {
    if (typeof window === 'undefined') return;

    // Global error handler
    window.addEventListener('error', (event) => {
      this.trackError(event.error || new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(new Error(event.reason), {
        type: 'unhandled_promise_rejection'
      });
    });
  }

  // Initialize performance tracking
  initPerformanceTracking() {
    if (typeof window === 'undefined' || !('performance' in window)) return;

    // Track page load performance
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        if (navigation) {
          this.trackPerformance('page_load', navigation.loadEventEnd - navigation.fetchStart);
          this.trackPerformance('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.fetchStart);
          this.trackPerformance('first_byte', navigation.responseStart - navigation.fetchStart);
        }
      }, 0);
    });

    // Track Core Web Vitals
    this.trackWebVitals();
  }

  // Track Core Web Vitals
  trackWebVitals() {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    // Largest Contentful Paint (LCP)
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.trackPerformance('lcp', lastEntry.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      // LCP not supported
    }

    // First Input Delay (FID)
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.trackPerformance('fid', entry.processingStart - entry.startTime);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      // FID not supported
    }

    // Cumulative Layout Shift (CLS)
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        this.trackPerformance('cls', clsValue);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      // CLS not supported
    }
  }

  // Send event to analytics service
  sendEvent(event) {
    // Send to Google Analytics
    if (this.config.enableGoogleAnalytics && typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', event.name, {
        custom_parameter: JSON.stringify(event.properties)
      });
    }

    // Send to custom analytics endpoint
    if (this.config.enableCustomAnalytics && this.config.analyticsEndpoint) {
      this.sendToCustomEndpoint(event);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics Event:', event);
    }
  }

  // Send to custom analytics endpoint
  async sendToCustomEndpoint(event) {
    try {
      await fetch(this.config.analyticsEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });
    } catch (error) {
      console.error('Failed to send analytics event:', error);
    }
  }

  // Process queued events
  processQueue() {
    while (this.queue.length > 0) {
      const event = this.queue.shift();
      this.sendEvent(event);
    }
  }

  // Get scroll depth
  getScrollDepth() {
    if (typeof window === 'undefined') return 0;
    
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
    return documentHeight > 0 ? Math.round((scrollTop / documentHeight) * 100) : 0;
  }

  // Get click count (stored in session)
  getClickCount() {
    if (typeof sessionStorage === 'undefined') return 0;
    
    const count = sessionStorage.getItem('clickCount') || '0';
    return parseInt(count, 10);
  }

  // Increment click count
  incrementClickCount() {
    if (typeof sessionStorage === 'undefined') return;
    
    const count = this.getClickCount() + 1;
    sessionStorage.setItem('clickCount', count.toString());
  }
}

// Create singleton instance
export const analytics = new AnalyticsManager();

// React hooks for analytics
export const useAnalytics = () => {
  const trackEvent = (eventName, properties) => {
    analytics.track(eventName, properties);
  };

  const trackPageView = (page, title) => {
    analytics.trackPageView(page, title);
  };

  const trackError = (error, context) => {
    analytics.trackError(error, context);
  };

  return {
    trackEvent,
    trackPageView,
    trackError
  };
};

// Higher-order component for automatic page tracking
export const withAnalytics = (WrappedComponent) => {
  return function AnalyticsWrapper(props) {
    useEffect(() => {
      analytics.trackPageView(window.location.pathname, document.title);
    }, []);

    return <WrappedComponent {...props} />;
  };
};

// Event tracking utilities
export const trackButtonClick = (buttonName, properties = {}) => {
  analytics.track('button_click', { buttonName, ...properties });
};

export const trackFormSubmission = (formName, success = true, properties = {}) => {
  analytics.track('form_submission', { formName, success, ...properties });
};

export const trackFeatureUsage = (featureName, properties = {}) => {
  analytics.track('feature_usage', { featureName, ...properties });
};

export const trackUserAction = (action, properties = {}) => {
  analytics.track('user_action', { action, ...properties });
};

// Initialize analytics on app start
if (typeof window !== 'undefined') {
  // Initialize with default config
  analytics.init({
    enableCustomAnalytics: true,
    enableErrorTracking: true,
    enablePerformanceTracking: true,
    // Add your analytics endpoint here
    // analyticsEndpoint: 'https://your-analytics-endpoint.com/events'
  });
}