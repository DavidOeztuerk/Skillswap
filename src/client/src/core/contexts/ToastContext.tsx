import React, { useCallback, useState, useMemo, memo } from 'react';
import { Snackbar, Alert, type AlertColor } from '@mui/material';
import { ToastContext, type ToastMessage, type ToastContextType } from './toastContextValue';

export { ToastContext, type ToastMessage, type ToastContextType } from './toastContextValue';

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = memo(({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message: string, type?: AlertColor, duration = 5000) => {
    const id = `${Date.now()}-${Math.random()}`;
    const newToast: ToastMessage = { id, message, type, duration };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, duration);
    }
  }, []);

  const success = useCallback(
    (message: string, duration?: number) => {
      showToast(message, 'success', duration);
    },
    [showToast]
  );

  const error = useCallback(
    (message: string, duration?: number) => {
      showToast(message, 'error', duration);
    },
    [showToast]
  );

  const warning = useCallback(
    (message: string, duration?: number) => {
      showToast(message, 'warning', duration);
    },
    [showToast]
  );

  const info = useCallback(
    (message: string, duration?: number) => {
      showToast(message, 'info', duration);
    },
    [showToast]
  );

  // CRITICAL: Memoize context value to prevent consumer re-renders
  const value = useMemo<ToastContextType>(
    () => ({ showToast, success, error, warning, info, removeToast }),
    [showToast, success, error, warning, info, removeToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toasts.map((toast) => (
        <Snackbar
          key={toast.id}
          open
          autoHideDuration={toast.duration}
          onClose={() => {
            removeToast(toast.id);
          }}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          sx={{ mb: 2, mr: 2 }}
        >
          <Alert
            onClose={() => {
              removeToast(toast.id);
            }}
            severity={toast.type}
            sx={{ width: '100%' }}
          >
            {toast.message}
          </Alert>
        </Snackbar>
      ))}
    </ToastContext.Provider>
  );
});

ToastProvider.displayName = 'ToastProvider';
