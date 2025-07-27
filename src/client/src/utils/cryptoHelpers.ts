/**
 * Client-side encryption utilities for sensitive data
 * Note: This provides basic obfuscation, not true security against determined attackers
 */

// Constants for future crypto enhancements
// const ENCRYPTION_KEY_SIZE = 32;
// const IV_SIZE = 16;

/**
 * Generates a simple encryption key from user session data
 * This is not cryptographically secure but adds basic protection
 */
function getEncryptionKey(): string {
  // Use a combination of user agent, screen resolution, and timestamp
  const fingerprint = [
    navigator.userAgent,
    screen.width + 'x' + screen.height,
    navigator.language,
    new Date().getTimezoneOffset().toString()
  ].join('|');
  
  // Simple hash function (not cryptographically secure)
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36).padStart(8, '0');
}

/**
 * Simple XOR encryption/decryption
 * @param data - Data to encrypt/decrypt
 * @param key - Encryption key
 * @returns Encrypted/decrypted data
 */
function xorCrypt(data: string, key: string): string {
  let result = '';
  for (let i = 0; i < data.length; i++) {
    result += String.fromCharCode(
      data.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  return result;
}

/**
 * Encrypts sensitive data for storage
 * @param data - Data to encrypt
 * @returns Base64 encoded encrypted data
 */
export function encryptData(data: string): string {
  try {
    if (!data) return '';
    
    const key = getEncryptionKey();
    const encrypted = xorCrypt(data, key);
    
    // Add simple checksum for integrity
    const checksum = encrypted.length.toString(36);
    const withChecksum = checksum + '|' + encrypted;
    
    return btoa(withChecksum);
  } catch (error) {
    console.error('Encryption failed:', error);
    return data; // Fallback to unencrypted
  }
}

/**
 * Decrypts data from storage
 * @param encryptedData - Base64 encoded encrypted data
 * @returns Decrypted data or null if invalid
 */
export function decryptData(encryptedData: string): string | null {
  try {
    if (!encryptedData) return null;
    
    const decoded = atob(encryptedData);
    const parts = decoded.split('|');
    
    if (parts?.length !== 2) {
      // Assume unencrypted data for backward compatibility
      return encryptedData;
    }
    
    const [checksum, encrypted] = parts;
    const expectedChecksum = encrypted.length.toString(36);
    
    // Verify checksum
    if (checksum !== expectedChecksum) {
      console.warn('Data integrity check failed');
      return null;
    }
    
    const key = getEncryptionKey();
    return xorCrypt(encrypted, key);
  } catch (error) {
    console.error('Decryption failed:', error);
    // Try to return as-is for backward compatibility
    return encryptedData;
  }
}

/**
 * Generates a secure random string for CSRF protection
 * @param length - Length of the random string
 * @returns Random string
 */
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  // Use crypto.getRandomValues if available
  if (window.crypto && window.crypto.getRandomValues) {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    
    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length];
    }
  } else {
    // Fallback to Math.random
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  
  return result;
}

/**
 * Hashes sensitive data for comparison (one-way)
 * @param data - Data to hash
 * @returns Hashed data
 */
export function hashData(data: string): string {
  let hash = 0;
  if (data?.length === 0) return hash.toString();
  
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
}

/**
 * Sanitizes data to prevent XSS
 * @param input - User input to sanitize
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validates if a string contains potentially dangerous content
 * @param input - String to validate
 * @returns true if potentially dangerous
 */
export function containsDangerousContent(input: string): boolean {
  if (!input) return false;
  
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /data:.*base64/i,
    /vbscript:/i
  ];
  
  return dangerousPatterns.some(pattern => pattern.test(input));
}