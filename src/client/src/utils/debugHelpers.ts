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
}