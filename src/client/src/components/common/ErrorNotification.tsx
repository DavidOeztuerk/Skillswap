import React from 'react';
import { Snackbar, Alert, AlertTitle, type AlertColor } from '@mui/material';

export interface ErrorNotificationProps {
  open: boolean;
  message: string;
  title?: string;
  severity?: AlertColor;
  autoHideDuration?: number;
  onClose: () => void;
}

/**
 * Wiederverwendbare Error-Notification-Komponente
 * Zeigt detaillierte Fehlermeldungen mit verschiedenen Severity-Levels an
 *
 * @example
 * ```tsx
 * <ErrorNotification
 *   open={!!error}
 *   title="Fehler beim Bestätigen"
 *   message={error?.message}
 *   severity="error"
 *   onClose={clearError}
 * />
 * ```
 */
const ErrorNotification: React.FC<ErrorNotificationProps> = ({
  open,
  message,
  title,
  severity = 'error',
  autoHideDuration = 6000,
  onClose,
}) => (
  <Snackbar
    open={open}
    autoHideDuration={autoHideDuration}
    onClose={onClose}
    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    sx={{ marginTop: '64px' }} // Offset for AppBar
  >
    <Alert
      onClose={onClose}
      severity={severity}
      variant="filled"
      sx={{
        width: '100%',
        minWidth: '300px',
        maxWidth: '500px',
        '& .MuiAlert-message': {
          width: '100%',
        },
      }}
    >
      {title && <AlertTitle>{title}</AlertTitle>}
      {message}
    </Alert>
  </Snackbar>
);

export default ErrorNotification;
