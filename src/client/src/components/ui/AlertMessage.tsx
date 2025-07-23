// src/components/ui/AlertMessage.tsx
import React from 'react';
import { Alert, AlertTitle, Snackbar, AlertColor, Box } from '@mui/material';

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
const AlertMessage: React.FC<AlertMessageProps> = ({
  message,
  title,
  severity = 'info',
  onClose,
  open = true,
  isSnackbar = false,
  autoHideDuration = 6000,
  action,
}) => {
  if (!message) return null;

  const alertContent = (
    <Alert
      severity={severity}
      onClose={onClose}
      variant="filled"
      action={action}
    >
      {title && <AlertTitle>{title}</AlertTitle>}
      {message}
    </Alert>
  );

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

  return <Box sx={{ mb: 2 }}>{alertContent}</Box>;
};

export default AlertMessage;
