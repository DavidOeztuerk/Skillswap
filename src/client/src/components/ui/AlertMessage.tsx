import React, { memo, useMemo } from 'react';
import { Alert, AlertTitle, Snackbar, type AlertColor, Box } from '@mui/material';
import { spacing } from '../../styles/tokens';

interface AlertMessageProps {
  message: string[];
  title?: string;
  severity?: AlertColor;
  onClose?: () => void;
  open?: boolean;
  isSnackbar?: boolean;
  autoHideDuration?: number;
  action?: React.ReactNode;
}

/**
 * Reusable alert component that can be displayed either as an inline Alert or as a Snackbar
 */
const AlertMessage: React.FC<AlertMessageProps> = memo(
  ({
    message,
    title,
    severity = 'info',
    onClose,
    open = true,
    isSnackbar = false,
    autoHideDuration = 6000,
    action,
  }) => {
    const alertContent = useMemo(
      () => (
        <Alert severity={severity} onClose={onClose} variant="filled" action={action}>
          {title && <AlertTitle>{title}</AlertTitle>}
          {message}
        </Alert>
      ),
      [severity, onClose, action, title, message]
    );

    if (message.length === 0) return null;

    if (isSnackbar) {
      return (
        <Snackbar
          open={open}
          autoHideDuration={autoHideDuration}
          onClose={onClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          {alertContent}
        </Snackbar>
      );
    }

    return <Box sx={{ mb: spacing[2] / 8 }}>{alertContent}</Box>;
  }
);

AlertMessage.displayName = 'AlertMessage';

export default AlertMessage;
