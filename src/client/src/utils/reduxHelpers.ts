// Redux helper utilities
import { SliceError } from '../store/types';

/**
 * Converts Error objects and other non-serializable errors to serializable format
 * This prevents Redux Toolkit non-serializable value warnings
 */
export const serializeError = (error: any): SliceError => {
  if (!error) return null;
  
  // If it's already a proper serializable object, use it
  if (error && typeof error === 'object' && error.message && !error.stack) {
    return error;
  }
  
  // Convert Error object or other non-serializable to serializable format
  return {
    message: error?.response?.data?.message || error?.response?.data?.detail || error?.message || error?.toString() || 'Unknown error',
    code: error?.response?.status || error?.response?.data?.status || error?.code || 'UNKNOWN',
    details: error?.response?.data || error?.details || null
  };
};

/**
 * Helper to safely extract error message from various error formats
 */
export const getErrorMessage = (error: any): string => {
  if (!error) return 'Unknown error';
  
  // Direct message
  if (typeof error === 'string') return error;
  
  // Error object or API response
  return error?.message || 
         error?.response?.data?.message || 
         error?.data?.message ||
         error?.toString() || 
         'Unknown error';
};

/**
 * Helper to extract error code from various error formats
 */
export const getErrorCode = (error: any): string => {
  if (!error) return 'UNKNOWN';
  
  return error?.code || 
         error?.errorCode ||
         error?.response?.status?.toString() ||
         error?.status?.toString() ||
         'UNKNOWN';
};