// // Emergency API Caching System to stop over-fetching
// class ApiCache {
//   private cache = new Map<string, { data: unknown; timestamp: number; expiry: number }>();
//   private pendingRequests = new Map<string, Promise<unknown>>();

//   // Generate cache key from URL and params
//   private getCacheKey(url: string, params?: Record<string, unknown>): string {
//     const paramString = params ? JSON.stringify(params) : '';
//     return `${url}${paramString}`;
//   }

//   // Check if cache entry is valid
//   private isValid(entry: { timestamp: number; expiry: number }): boolean {
//     return Date.now() - entry.timestamp < entry.expiry;
//   }

//   // Get from cache
//   get(url: string, params?: Record<string, unknown>): unknown | null {
//     const key = this.getCacheKey(url, params);
//     const entry = this.cache.get(key);
    
//     if (entry && this.isValid(entry)) {
//       console.log(`📦 Cache HIT: ${key}`);
//       return entry.data;
//     }
    
//     if (entry) {
//       this.cache.delete(key); // Remove expired entry
//     }
    
//     return null;
//   }

//   // Set cache entry
//   set(url: string, data: unknown, params?: Record<string, unknown>, expiry: number = 30000): void { // 30s default
//     const key = this.getCacheKey(url, params);
//     this.cache.set(key, {
//       data,
//       timestamp: Date.now(),
//       expiry
//     });
//     console.log(`📦 Cache SET: ${key} (expires in ${expiry}ms)`);
//   }

//   // Get or create pending request to prevent duplicate API calls
//   getPendingRequest(url: string, params?: Record<string, unknown>): Promise<unknown> | null {
//     const key = this.getCacheKey(url, params);
//     return this.pendingRequests.get(key) || null;
//   }

//   // Set pending request
//   setPendingRequest(url: string, promise: Promise<unknown>, params?: Record<string, unknown>): void {
//     const key = this.getCacheKey(url, params);
//     this.pendingRequests.set(key, promise);
    
//     // Remove from pending when done
//     promise.finally(() => {
//       this.pendingRequests.delete(key);
//     });
//   }

//   // Clear specific cache entries
//   clear(pattern?: string): void {
//     if (pattern) {
//       const keysToDelete = Array.from(this.cache.keys()).filter(key => key.includes(pattern));
//       keysToDelete.forEach(key => {
//         this.cache.delete(key);
//         console.log(`🗑️ Cache CLEAR: ${key}`);
//       });
//     } else {
//       this.cache.clear();
//       this.pendingRequests.clear();
//       console.log('🗑️ Cache CLEAR ALL');
//     }
//   }

//   // Get cache stats
//   getStats() {
//     return {
//       size: this.cache.size,
//       pending: this.pendingRequests.size,
//       entries: Array.from(this.cache.keys())
//     };
//   }

//   // Cached fetch wrapper
//   async cachedFetch<T>(
//     url: string, 
//     fetchFn: () => Promise<T>, 
//     params?: Record<string, unknown>, 
//     expiry: number = 30000
//   ): Promise<T> {
//     // Check cache first
//     const cached = this.get(url, params);
//     if (cached) {
//       return cached;
//     }

//     // Check if same request is pending
//     const pending = this.getPendingRequest(url, params);
//     if (pending) {
//       console.log(`⏳ Request PENDING: ${this.getCacheKey(url, params)}`);
//       return pending;
//     }

//     // Make new request
//     console.log(`🌐 Cache MISS: ${this.getCacheKey(url, params)}`);
//     const promise = fetchFn();
//     this.setPendingRequest(url, promise, params);

//     try {
//       const data = await promise;
//       this.set(url, data, params, expiry);
//       return data;
//     } catch (error) {
//       // Don't cache errors
//       throw error;
//     }
//   }
// }

// export const apiCache = new ApiCache();

// // Cache configurations for different endpoints
// export const CACHE_TIMES = {
//   SKILLS_CATEGORIES: 5 * 60 * 1000,      // 5 minutes - rarely change
//   SKILLS_PROFICIENCY: 5 * 60 * 1000,    // 5 minutes - rarely change  
//   SKILLS_LIST: 30 * 1000,                // 30 seconds - can change
//   USER_SKILLS: 60 * 1000,                // 1 minute - user specific
//   MATCHES: 30 * 1000,                    // 30 seconds - can change quickly
//   APPOINTMENTS: 60 * 1000,               // 1 minute - scheduled data
//   NOTIFICATIONS: 15 * 1000,              // 15 seconds - real-time updates
// } as const;