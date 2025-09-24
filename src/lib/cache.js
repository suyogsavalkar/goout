// Advanced caching system for performance optimization

class CacheManager {
  constructor() {
    this.memoryCache = new Map();
    this.cacheStats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };
    this.maxMemorySize = 50; // Maximum number of items in memory cache
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes default TTL
  }

  // Generate cache key
  generateKey(prefix, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {});
    
    return `${prefix}:${JSON.stringify(sortedParams)}`;
  }

  // Set item in cache
  set(key, value, ttl = this.defaultTTL) {
    // Clean up expired items before adding new one
    this.cleanup();
    
    // If cache is full, remove oldest item
    if (this.memoryCache.size >= this.maxMemorySize) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }

    const cacheItem = {
      value,
      timestamp: Date.now(),
      ttl,
      accessCount: 0,
      lastAccessed: Date.now()
    };

    this.memoryCache.set(key, cacheItem);
    this.cacheStats.sets++;

    // Also store in localStorage for persistence
    try {
      const storageItem = {
        value,
        timestamp: Date.now(),
        ttl
      };
      localStorage.setItem(`cache:${key}`, JSON.stringify(storageItem));
    } catch (error) {
      // localStorage might be full or unavailable
      console.warn('Failed to store in localStorage:', error);
    }
  }

  // Get item from cache
  get(key) {
    // Check memory cache first
    const memoryItem = this.memoryCache.get(key);
    if (memoryItem) {
      // Check if expired
      if (Date.now() - memoryItem.timestamp > memoryItem.ttl) {
        this.memoryCache.delete(key);
        this.cacheStats.misses++;
        return null;
      }

      // Update access statistics
      memoryItem.accessCount++;
      memoryItem.lastAccessed = Date.now();
      this.cacheStats.hits++;
      return memoryItem.value;
    }

    // Check localStorage
    try {
      const storageItem = localStorage.getItem(`cache:${key}`);
      if (storageItem) {
        const parsed = JSON.parse(storageItem);
        
        // Check if expired
        if (Date.now() - parsed.timestamp > parsed.ttl) {
          localStorage.removeItem(`cache:${key}`);
          this.cacheStats.misses++;
          return null;
        }

        // Move to memory cache for faster access
        this.set(key, parsed.value, parsed.ttl - (Date.now() - parsed.timestamp));
        this.cacheStats.hits++;
        return parsed.value;
      }
    } catch (error) {
      console.warn('Failed to read from localStorage:', error);
    }

    this.cacheStats.misses++;
    return null;
  }

  // Delete item from cache
  delete(key) {
    const deleted = this.memoryCache.delete(key);
    
    try {
      localStorage.removeItem(`cache:${key}`);
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
    }

    if (deleted) {
      this.cacheStats.deletes++;
    }
    
    return deleted;
  }

  // Check if item exists in cache
  has(key) {
    return this.get(key) !== null;
  }

  // Clear all cache
  clear() {
    this.memoryCache.clear();
    
    // Clear localStorage cache items
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('cache:')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear localStorage cache:', error);
    }
  }

  // Clean up expired items
  cleanup() {
    const now = Date.now();
    
    // Clean memory cache
    for (const [key, item] of this.memoryCache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.memoryCache.delete(key);
      }
    }

    // Clean localStorage cache
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('cache:')) {
          try {
            const item = JSON.parse(localStorage.getItem(key));
            if (now - item.timestamp > item.ttl) {
              localStorage.removeItem(key);
            }
          } catch (error) {
            // Invalid cache item, remove it
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.warn('Failed to cleanup localStorage cache:', error);
    }
  }

  // Get cache statistics
  getStats() {
    const hitRate = this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) * 100;
    
    return {
      ...this.cacheStats,
      hitRate: isNaN(hitRate) ? 0 : hitRate.toFixed(2),
      memorySize: this.memoryCache.size,
      maxMemorySize: this.maxMemorySize
    };
  }

  // Get cache size info
  getSizeInfo() {
    let localStorageSize = 0;
    
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('cache:')) {
          localStorageSize += localStorage.getItem(key).length;
        }
      });
    } catch (error) {
      console.warn('Failed to calculate localStorage size:', error);
    }

    return {
      memoryItems: this.memoryCache.size,
      localStorageSize: `${(localStorageSize / 1024).toFixed(2)} KB`
    };
  }
}

// Create singleton instance
export const cacheManager = new CacheManager();

// Specialized cache for different data types
export class FirestoreCache extends CacheManager {
  constructor() {
    super();
    this.defaultTTL = 2 * 60 * 1000; // 2 minutes for Firestore data
  }

  // Cache profile data
  cacheProfile(userId, profileData) {
    const key = this.generateKey('profile', { userId });
    this.set(key, profileData);
  }

  // Get cached profile
  getProfile(userId) {
    const key = this.generateKey('profile', { userId });
    return this.get(key);
  }

  // Cache event data
  cacheEvent(eventId, eventData) {
    const key = this.generateKey('event', { eventId });
    this.set(key, eventData);
  }

  // Get cached event
  getEvent(eventId) {
    const key = this.generateKey('event', { eventId });
    return this.get(key);
  }

  // Cache events list
  cacheEventsList(filters, events) {
    const key = this.generateKey('events', filters);
    this.set(key, events, 1 * 60 * 1000); // 1 minute for lists
  }

  // Get cached events list
  getEventsList(filters) {
    const key = this.generateKey('events', filters);
    return this.get(key);
  }

  // Invalidate related caches when data changes
  invalidateProfile(userId) {
    const profileKey = this.generateKey('profile', { userId });
    this.delete(profileKey);
    
    // Also invalidate any events lists that might include this user
    this.invalidatePattern('events:');
  }

  invalidateEvent(eventId) {
    const eventKey = this.generateKey('event', { eventId });
    this.delete(eventKey);
    
    // Invalidate events lists
    this.invalidatePattern('events:');
  }

  // Invalidate all keys matching a pattern
  invalidatePattern(pattern) {
    // Memory cache
    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern)) {
        this.memoryCache.delete(key);
      }
    }

    // localStorage cache
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('cache:') && key.includes(pattern)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to invalidate localStorage pattern:', error);
    }
  }
}

// Create Firestore cache instance
export const firestoreCache = new FirestoreCache();

// Image cache for better performance
export class ImageCache {
  constructor() {
    this.cache = new Map();
    this.maxSize = 100; // Maximum number of cached images
  }

  // Preload and cache image
  async preloadImage(url) {
    if (this.cache.has(url)) {
      return this.cache.get(url);
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        // Clean up if cache is full
        if (this.cache.size >= this.maxSize) {
          const firstKey = this.cache.keys().next().value;
          this.cache.delete(firstKey);
        }
        
        this.cache.set(url, {
          url,
          width: img.naturalWidth,
          height: img.naturalHeight,
          loaded: true,
          timestamp: Date.now()
        });
        
        resolve(img);
      };
      
      img.onerror = () => {
        reject(new Error(`Failed to load image: ${url}`));
      };
      
      img.src = url;
    });
  }

  // Check if image is cached
  isCached(url) {
    return this.cache.has(url);
  }

  // Get cached image info
  getImageInfo(url) {
    return this.cache.get(url);
  }

  // Clear image cache
  clear() {
    this.cache.clear();
  }

  // Get cache size
  getSize() {
    return this.cache.size;
  }
}

// Create image cache instance
export const imageCache = new ImageCache();

// React hooks for caching
export const useCache = (key, fetcher, options = {}) => {
  const { ttl = 5 * 60 * 1000, enabled = true } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled) return;

    const fetchData = async () => {
      // Check cache first
      const cached = cacheManager.get(key);
      if (cached) {
        setData(cached);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await fetcher();
        cacheManager.set(key, result, ttl);
        setData(result);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [key, fetcher, ttl, enabled]);

  const invalidate = () => {
    cacheManager.delete(key);
  };

  const refresh = async () => {
    invalidate();
    setLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      cacheManager.set(key, result, ttl);
      setData(result);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, invalidate, refresh };
};

// Automatic cache cleanup
setInterval(() => {
  cacheManager.cleanup();
  firestoreCache.cleanup();
}, 5 * 60 * 1000); // Clean up every 5 minutes