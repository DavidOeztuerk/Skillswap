// src/utils/debugHelpers.ts
import { getStorageInfo, getToken, getRefreshToken } from './authHelpers';

/**
 * Debug helper to check authentication state
 */
export const debugAuthState = () => {
  const storageInfo = getStorageInfo();
  const token = getToken();
  const refreshToken = getRefreshToken();
  
  console.group('🔐 Authentication Debug Info');
  console.log('Storage Info:', storageInfo);
  console.log('Access Token:', token ? `${token.substring(0, 20)}...` : 'null');
  console.log('Refresh Token:', refreshToken ? `${refreshToken.substring(0, 20)}...` : 'null');
  console.log('Raw localStorage tokens:', {
    accessToken: localStorage.getItem('access_token'),
    refreshToken: localStorage.getItem('refresh_token'),
    rememberMe: localStorage.getItem('remember_me')
  });
  console.log('Raw sessionStorage tokens:', {
    accessToken: sessionStorage.getItem('access_token'),
    refreshToken: sessionStorage.getItem('refresh_token'),
    rememberMe: sessionStorage.getItem('remember_me')
  });
  console.groupEnd();
  
  return storageInfo;
};

/**
 * Debug helper to check HTTP headers
 */
export const debugRequestHeaders = (url: string) => {
  const token = getToken();
  console.group(`🌐 Request Headers Debug for ${url}`);
  console.log('Authorization Header:', token ? `Bearer ${token.substring(0, 20)}...` : 'Missing');
  console.log('Full Token:', token);
  console.groupEnd();
};

// Make available globally for browser console debugging
if (typeof window !== 'undefined') {
  (window as any).debugAuth = debugAuthState;
  (window as any).debugHeaders = debugRequestHeaders;
  
  // Enhanced debug utilities for JWT testing
  (window as any).jwtDebug = {
    // Get current token info
    getTokenInfo: () => {
      const token = getToken();
      if (!token) return 'No token found';
      
      try {
        const parts = token.split('.');
        const payload = JSON.parse(atob(parts[1]));
        const exp = payload.exp ? new Date(payload.exp * 1000) : null;
        const now = new Date();
        
        return {
          payload,
          expiresAt: exp?.toISOString(),
          expiresIn: exp ? Math.round((exp.getTime() - now.getTime()) / 1000) + ' seconds' : 'No expiry',
          isExpired: exp ? exp < now : false
        };
      } catch (e) {
        return 'Invalid token format';
      }
    },
    
    // Force token expiry for testing
    expireToken: () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0IiwiZXhwIjoxNjAwMDAwMDAwfQ.test';
      const storageType = localStorage.getItem('remember_me') === 'true' ? 'localStorage' : 'sessionStorage';
      
      if (storageType === 'localStorage') {
        localStorage.setItem('access_token', expiredToken);
      } else {
        sessionStorage.setItem('access_token', expiredToken);
      }
      
      console.log('✅ Token manually expired for testing');
      console.log('🔄 Trigger a request to test refresh mechanism');
    },
    
    // Force token refresh
    forceRefresh: async () => {
      try {
        const { default: tokenRefreshService } = await import('../services/tokenRefreshService');
        await tokenRefreshService.forceRefresh();
        console.log('✅ Token refresh forced');
      } catch (error) {
        console.error('❌ Force refresh failed:', error);
      }
    },
    
    // Get refresh service status
    getRefreshStatus: async () => {
      try {
        const { default: tokenRefreshService } = await import('../services/tokenRefreshService');
        const status = tokenRefreshService.getStatus();
        console.log('🔄 Refresh Service Status:', status);
        return status;
      } catch (error) {
        console.error('❌ Could not get refresh status:', error);
      }
    },
    
    // Clear all tokens
    clearTokens: () => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('refresh_token');
      console.log('🗑️ All tokens cleared');
    }
  };
}