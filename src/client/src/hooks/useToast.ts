import { useContext } from 'react';
import { ToastContext } from '../contexts/ToastContext';

/**
 * 🔔 useToast Hook - Toast/Snackbar Management
 *
 * Usage:
 * const toast = useToast();
 * toast.success('Match accepted!');
 * toast.error('Failed to accept match');
 */
export const useToast = () => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }

  return context;
};

export default useToast;
