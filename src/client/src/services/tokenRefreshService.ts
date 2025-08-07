/**
 * Token Refresh Service
 * Proactively refreshes JWT tokens before they expire
 */

import { getToken, getRefreshToken, getTimeUntilExpiration, isTokenExpired } from '../utils/authHelpers';
import { AUTH_ENDPOINTS } from '../config/endpoints';

class TokenRefreshService {
  private refreshTimer: NodeJS.Timeout | null = null;
  private isRefreshing = false;
  private readonly REFRESH_BUFFER = 2 * 60 * 1000; // Refresh 2 minutes before expiry
  private readonly MIN_REFRESH_INTERVAL = 30 * 1000; // Minimum 30 seconds between refreshes

  /**
   * Starts the token refresh service
   */
  public start(): void {
    console.log('🚀 Starting token refresh service');
    this.scheduleNextRefresh();
    
    // Also check on visibility change (when tab becomes active)
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    
    // Check on focus (when window gets focus)
    window.addEventListener('focus', this.handleWindowFocus);
  }

  /**
   * Stops the token refresh service
   */
  public stop(): void {
    console.log('🛑 Stopping token refresh service');
    
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('focus', this.handleWindowFocus);
    
    this.isRefreshing = false;
  }

  /**
   * Schedules the next token refresh
   */
  private scheduleNextRefresh(silent: boolean = false): void {
    // Clear any existing timer
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    const token = getToken();
    if (!token) {
      console.log('📭 No token found, stopping refresh service');
      return;
    }

    // Check if token is already expired
    if (isTokenExpired(token)) {
      console.log('⏰ Token already expired, refreshing immediately');
      this.refreshToken();
      return;
    }

    // Calculate time until we should refresh
    const timeUntilExpiry = getTimeUntilExpiration(token);
    if (!timeUntilExpiry) {
      console.log('❓ Could not determine token expiration time');
      return;
    }

    // Schedule refresh before token expires
    const refreshIn = Math.max(
      timeUntilExpiry - this.REFRESH_BUFFER,
      this.MIN_REFRESH_INTERVAL
    );

    if (!silent) {
      console.log(`⏱️ Scheduling token refresh in ${Math.round(refreshIn / 1000)} seconds`);
    }

    this.refreshTimer = setTimeout(() => {
      this.refreshToken();
    }, refreshIn);
  }

  /**
   * Refreshes the token
   */
  private async refreshToken(): Promise<void> {
    if (this.isRefreshing) {
      console.log('🔄 Already refreshing token, skipping...');
      return;
    }

    this.isRefreshing = true;

    try {
      console.log('🔄 Proactively refreshing token...');
      
      const currentAccessToken = getToken();
      const refreshTokenValue = getRefreshToken();
      
      if (!refreshTokenValue) {
        throw new Error('No refresh token available');
      }

      // Backend expects BOTH accessToken and refreshToken in body
      const requestBody = {
        accessToken: currentAccessToken || '',
        refreshToken: refreshTokenValue
      };
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      // Add Authorization header if we have a token
      if (currentAccessToken) {
        headers['Authorization'] = `Bearer ${currentAccessToken}`;
      }
      
      // Get base URL from environment or use default
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
      
      // Use direct fetch to avoid httpClient's automatic refresh mechanism
      const response = await fetch(`${baseUrl}${AUTH_ENDPOINTS.REFRESH_TOKEN}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        try {
          const errorData = await response.json();
          const errorMessage = errorData.errors?.[0] || errorData.message || `Token refresh failed with status: ${response.status}`;
          
          // If it's an auth error, clear tokens and redirect to login
          if (response.status === 401 || response.status === 403) {
            const { removeToken } = await import('../utils/authHelpers');
            removeToken();
            window.location.href = '/auth/login';
          }
          
          throw new Error(errorMessage);
        } catch (e) {
          throw new Error(`Token refresh failed with status: ${response.status}`);
        }
      }
      
      const data = await response.json();
      const tokenData = data.data || data;
      
      if (!tokenData.accessToken) {
        throw new Error('Invalid refresh response - no access token');
      }
      
      // Store the new tokens
      const storageType = localStorage.getItem('remember_me') === 'true' ? 'permanent' : 'session';
      
      const { setToken, setRefreshToken } = await import('../utils/authHelpers');
      setToken(tokenData.accessToken, storageType);
      if (tokenData.refreshToken) {
        setRefreshToken(tokenData.refreshToken, storageType);
      }
      
      console.log('✅ Token refreshed proactively');
      
      // Schedule next refresh
      this.scheduleNextRefresh();
    } catch (error: any) {
      console.error('❌ Failed to refresh token proactively:', error);
      
      // Log detailed error information
      if (error?.data) {
        console.error('📋 Server error details:', error.data);
        if (error.data.errors) {
          console.error('🚨 Validation errors:', error.data.errors);
        }
      }
      
      // If refresh failed, try again in 30 seconds
      // (unless the user is logged out)
      const token = getToken();
      if (token) {
        this.refreshTimer = setTimeout(() => {
          this.refreshToken();
        }, 30000);
      }
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Handles visibility change events
   */
  private handleVisibilityChange = (): void => {
    if (!document.hidden) {
      // Silently check and refresh token when tab becomes visible
      this.checkAndRefresh();
    }
  };

  /**
   * Handles window focus events
   */
  private handleWindowFocus = (): void => {
    // Silently check and refresh token when window gains focus
    this.checkAndRefresh();
  };

  /**
   * Checks token status and refreshes if needed
   */
  private checkAndRefresh(): void {
    const token = getToken();
    if (!token) {
      return;
    }

    const timeUntilExpiry = getTimeUntilExpiration(token);
    
    // If token expires in less than 5 minutes, refresh immediately
    if (timeUntilExpiry && timeUntilExpiry < 5 * 60 * 1000) {
      console.log('⚡ Token expiring soon, refreshing immediately');
      this.refreshToken();
    } else {
      // Otherwise just reschedule (silently for window events)
      this.scheduleNextRefresh(true);
    }
  }

  /**
   * Forces an immediate token refresh
   */
  public async forceRefresh(): Promise<void> {
    console.log('💪 Forcing token refresh');
    await this.refreshToken();
  }

  /**
   * Gets the status of the refresh service
   */
  public getStatus(): {
    isRunning: boolean;
    isRefreshing: boolean;
    nextRefreshIn: number | null;
  } {
    const token = getToken();
    const timeUntilExpiry = token ? getTimeUntilExpiration(token) : null;
    
    let nextRefreshIn = null;
    if (timeUntilExpiry) {
      nextRefreshIn = Math.max(
        timeUntilExpiry - this.REFRESH_BUFFER,
        0
      );
    }

    return {
      isRunning: this.refreshTimer !== null,
      isRefreshing: this.isRefreshing,
      nextRefreshIn
    };
  }
}

// Export singleton instance
const tokenRefreshService = new TokenRefreshService();
export default tokenRefreshService;